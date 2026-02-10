import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';
import { getSafeCanvasContext, SafeGameLoop, SafeKeyHandler } from '@/utils/gameUtils';

interface Vehicle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  health: number;
  boost: number;
  weapons: string[];
  currentWeapon: number;
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  health: number;
  type: 'bike' | 'car' | 'truck' | 'boss';
  lastShot: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  type: 'bullet' | 'missile' | 'plasma';
  isPlayerProjectile: boolean;
  life: number;
}

const AfterburnReloaded = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<SafeGameLoop | null>(null);
  const keyHandlerRef = useRef<SafeKeyHandler | null>(null);
  
  const [gameState, setGameState] = useState({
    player: { 
      x: 100, y: 300, vx: 0, vy: 0, angle: 0, health: 100, boost: 100,
      weapons: ['bullets', 'missiles', 'plasma'], currentWeapon: 0
    } as Vehicle,
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    score: 0,
    wave: 1,
    gameOver: false,
    waveComplete: false,
    roadOffset: 0,
    speed: 5
  });

  const spawnEnemies = useCallback((wave: number) => {
    const enemies: Enemy[] = [];
    for (let i = 0; i < 3 + wave; i++) {
      enemies.push({
        x: 800 + i * 100,
        y: 200 + Math.random() * 200,
        vx: -3 - Math.random() * 2,
        vy: (Math.random() - 0.5) * 2,
        angle: Math.PI,
        health: 60 + wave * 20,
        type: ['bike', 'car', 'truck'][Math.floor(Math.random() * 3)] as Enemy['type'],
        lastShot: 0
      });
    }
    return enemies;
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.gameOver) return;

    const ctx = getSafeCanvasContext(canvas);
    if (!ctx) return;

    // Road background
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Road markings
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 3;
    for (let x = gameState.roadOffset; x < canvas.width + 50; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, canvas.height / 2);
      ctx.lineTo(x + 40, canvas.height / 2);
      ctx.stroke();
    }

    setGameState(prev => {
      const newState = { ...prev };
      
      // Update road animation
      newState.roadOffset -= newState.speed;
      if (newState.roadOffset < -100) newState.roadOffset = 0;

      // Player controls
      const acceleration = 0.5;
      const maxSpeed = 8;
      const keyHandler = keyHandlerRef.current;

      if (keyHandler && (keyHandler.isPressed('w') || keyHandler.isPressed('arrowup'))) {
        newState.player.vx = Math.min(maxSpeed, newState.player.vx + acceleration);
      }
      if (keyHandler && (keyHandler.isPressed('s') || keyHandler.isPressed('arrowdown'))) {
        newState.player.vx = Math.max(-maxSpeed/2, newState.player.vx - acceleration);
      }
      if (keyHandler && (keyHandler.isPressed('a') || keyHandler.isPressed('arrowleft'))) {
        newState.player.vy = Math.max(-4, newState.player.vy - 0.3);
      }
      if (keyHandler && (keyHandler.isPressed('d') || keyHandler.isPressed('arrowright'))) {
        newState.player.vy = Math.min(4, newState.player.vy + 0.3);
      }

      // Boost
      if (keyHandler && keyHandler.isPressed(' ') && newState.player.boost > 0) {
        newState.player.vx += 2;
        newState.player.boost -= 2;
      }

      // Apply friction
      newState.player.vx *= 0.95;
      newState.player.vy *= 0.9;
      
      // Update position
      newState.player.x += newState.player.vx;
      newState.player.y += newState.player.vy;
      
      // Keep in bounds
      newState.player.x = Math.max(20, Math.min(canvas.width - 20, newState.player.x));
      newState.player.y = Math.max(20, Math.min(canvas.height - 20, newState.player.y));

      // Shooting
      if (keyHandler && keyHandler.isPressed('x')) {
        newState.projectiles.push({
          x: newState.player.x + 30,
          y: newState.player.y,
          vx: 10,
          vy: 0,
          damage: 25,
          type: 'bullet',
          isPlayerProjectile: true,
          life: 60
        });
        // Note: We don't need to manually delete the key as SafeKeyHandler manages this
      }

      // Update enemies
      newState.enemies = newState.enemies.map(enemy => {
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        
        // Simple AI
        const playerDistance = Math.hypot(newState.player.x - enemy.x, newState.player.y - enemy.y);
        if (playerDistance < 200 && Date.now() - enemy.lastShot > 1500) {
          newState.projectiles.push({
            x: enemy.x,
            y: enemy.y,
            vx: -6,
            vy: (newState.player.y - enemy.y) * 0.01,
            damage: 20,
            type: 'bullet',
            isPlayerProjectile: false,
            life: 60
          });
          enemy.lastShot = Date.now();
        }
        
        return enemy;
      }).filter(enemy => enemy.x > -100);

      // Update projectiles
      newState.projectiles = newState.projectiles.filter(projectile => {
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;
        projectile.life--;

        if (projectile.x < 0 || projectile.x > canvas.width || projectile.life <= 0) {
          return false;
        }

        // Collision detection
        if (projectile.isPlayerProjectile) {
          for (let i = newState.enemies.length - 1; i >= 0; i--) {
            const enemy = newState.enemies[i];
            if (Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y) < 30) {
              enemy.health -= projectile.damage;
              if (enemy.health <= 0) {
                newState.enemies.splice(i, 1);
                newState.score += 100;
              }
              return false;
            }
          }
        } else {
          if (Math.hypot(projectile.x - newState.player.x, projectile.y - newState.player.y) < 25) {
            newState.player.health -= projectile.damage;
            if (newState.player.health <= 0) {
              newState.gameOver = true;
            }
            return false;
          }
        }

        return true;
      });

      // Wave completion
      if (newState.enemies.length === 0 && !newState.waveComplete) {
        newState.waveComplete = true;
      }

      // Regenerate boost
      if (newState.player.boost < 100) {
        newState.player.boost = Math.min(100, newState.player.boost + 0.3);
      }

      return newState;
    });

    // Draw vehicles
    const drawVehicle = (vehicle: Vehicle | Enemy, isPlayer = false) => {
      ctx.save();
      ctx.translate(vehicle.x, vehicle.y);
      ctx.rotate(vehicle.angle);
      
      ctx.fillStyle = isPlayer ? '#0aff9d' : '#ff6600';
      ctx.fillRect(-20, -10, 40, 20);
      
      ctx.restore();
    };

    gameState.enemies.forEach(enemy => drawVehicle(enemy));
    drawVehicle(gameState.player, true);

    // Draw projectiles
    gameState.projectiles.forEach(projectile => {
      ctx.fillStyle = projectile.isPlayerProjectile ? '#ffff00' : '#ff0099';
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Health: ${Math.floor(gameState.player.health)}`, 10, 25);
    ctx.fillText(`Boost: ${Math.floor(gameState.player.boost)}`, 10, 45);
    ctx.fillText(`Score: ${gameState.score}`, 10, 65);
    ctx.fillText(`Wave: ${gameState.wave}`, 10, 85);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '12px monospace';
    ctx.fillText('WASD: Move | Space: Boost | X: Shoot', 10, canvas.height - 20);

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CRASHED', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px monospace';
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 50);
    }

    if (gameState.waveComplete) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0aff9d';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ROAD CLEARED', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px monospace';
      ctx.fillText('Press N for next wave', canvas.width / 2, canvas.height / 2 + 50);
    }

    ctx.textAlign = 'left';
  }, [gameState, spawnEnemies]);

  useEffect(() => {
    setGameState(prev => ({ ...prev, enemies: spawnEnemies(prev.wave) }));
  }, [spawnEnemies]);

  useEffect(() => {
    const safeLoop = new SafeGameLoop(gameLoop, { useRequestAnimationFrame: true });
    gameLoopRef.current = safeLoop;
    safeLoop.start();

    return () => {
      if (gameLoopRef.current) {
        gameLoopRef.current.stop();
        gameLoopRef.current = null;
      }
    };
  }, [gameLoop]);

  useEffect(() => {
    const keyHandler = new SafeKeyHandler();
    keyHandlerRef.current = keyHandler;

    const handleSpecialKeys = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key === 'r' && gameState.gameOver) {
        setGameState(prev => ({ ...prev, wave: 1, gameOver: false }));
      }

      if (key === 'n' && gameState.waveComplete) {
        setGameState(prev => ({
          ...prev,
          wave: prev.wave + 1,
          waveComplete: false,
          enemies: spawnEnemies(prev.wave + 1)
        }));
      }
    };

    window.addEventListener('keydown', handleSpecialKeys);

    return () => {
      window.removeEventListener('keydown', handleSpecialKeys);
      if (keyHandlerRef.current) {
        keyHandlerRef.current.cleanup();
        keyHandlerRef.current = null;
      }
    };
  }, [gameState.gameOver, gameState.waveComplete, spawnEnemies]);

  return (
    <GameLayout gameTitle="Afterburn Reloaded" gameCategory="High-octane road combat racing">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg shadow-2xl"
        />
        <div className="text-center space-y-2">
          <p className="text-gray-300">WASD: Move | Space: Boost | X: Shoot</p>
          <p className="text-gray-400">High-speed vehicular combat on the highway!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default AfterburnReloaded;
