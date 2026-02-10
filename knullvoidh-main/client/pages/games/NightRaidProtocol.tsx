import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Position {
  x: number;
  y: number;
}

interface Enemy {
  x: number;
  y: number;
  health: number;
  lastShot: number;
  type: 'guard' | 'sniper' | 'patrol';
  angle: number;
  alertLevel: number;
  patrolPath?: Position[];
  currentTarget?: number;
}

interface Bullet {
  x: number;
  y: number;
  dx: number;
  dy: number;
  isPlayerBullet: boolean;
}

interface Building {
  x: number;
  y: number;
  width: number;
  height: number;
}

const NightRaidProtocol = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());
  
  const [gameState, setGameState] = useState({
    player: { x: 50, y: 300, health: 100, stealth: 100 },
    enemies: [] as Enemy[],
    bullets: [] as Bullet[],
    buildings: [] as Building[],
    score: 0,
    wave: 1,
    gameOver: false,
    missionComplete: false,
    alertLevel: 0
  });

  const initializeGame = useCallback(() => {
    const buildings: Building[] = [];
    for (let i = 0; i < 6; i++) {
      buildings.push({
        x: 150 + i * 120,
        y: 200 + Math.random() * 200,
        width: 80,
        height: 60 + Math.random() * 80
      });
    }

    const enemies: Enemy[] = [];
    for (let i = 0; i < 5 + gameState.wave; i++) {
      const type = ['guard', 'sniper', 'patrol'][Math.floor(Math.random() * 3)] as Enemy['type'];
      const building = buildings[Math.floor(Math.random() * buildings.length)];
      
      let patrolPath;
      if (type === 'patrol') {
        patrolPath = [
          { x: building.x, y: building.y },
          { x: building.x + building.width, y: building.y },
          { x: building.x + building.width, y: building.y + building.height },
          { x: building.x, y: building.y + building.height }
        ];
      }

      enemies.push({
        x: building.x + Math.random() * building.width,
        y: building.y + Math.random() * building.height,
        health: type === 'sniper' ? 150 : 100,
        lastShot: 0,
        type,
        angle: 0,
        alertLevel: 0,
        patrolPath,
        currentTarget: 0
      });
    }

    setGameState(prev => ({
      ...prev,
      enemies,
      buildings,
      bullets: [],
      gameOver: false,
      missionComplete: false,
      player: { x: 50, y: 300, health: 100, stealth: 100 }
    }));
  }, [gameState.wave]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.gameOver || gameState.missionComplete) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with night effect
    ctx.fillStyle = 'rgba(5, 5, 20, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setGameState(prev => {
      const newState = { ...prev };
      const currentTime = Date.now();

      // Handle player movement
      const moveSpeed = 3;
      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) {
        newState.player.x = Math.max(0, newState.player.x - moveSpeed);
      }
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) {
        newState.player.x = Math.min(canvas.width - 20, newState.player.x + moveSpeed);
      }
      if (keysRef.current.has('ArrowUp') || keysRef.current.has('w')) {
        newState.player.y = Math.max(0, newState.player.y - moveSpeed);
      }
      if (keysRef.current.has('ArrowDown') || keysRef.current.has('s')) {
        newState.player.y = Math.min(canvas.height - 20, newState.player.y + moveSpeed);
      }

      // Player shooting
      if (keysRef.current.has(' ')) {
        newState.bullets.push({
          x: newState.player.x + 10,
          y: newState.player.y + 10,
          dx: 8,
          dy: 0,
          isPlayerBullet: true
        });
        keysRef.current.delete(' ');
      }

      // Update enemies
      newState.enemies = newState.enemies.map(enemy => {
        const updatedEnemy = { ...enemy };
        const playerDistance = Math.hypot(
          newState.player.x - enemy.x,
          newState.player.y - enemy.y
        );

        // Stealth detection
        if (playerDistance < 100 && newState.player.stealth > 50) {
          updatedEnemy.alertLevel = Math.min(100, updatedEnemy.alertLevel + 2);
          newState.alertLevel = Math.max(newState.alertLevel, updatedEnemy.alertLevel);
        }

        // Enemy movement patterns
        if (enemy.type === 'patrol' && enemy.patrolPath) {
          const target = enemy.patrolPath[enemy.currentTarget || 0];
          const dx = target.x - enemy.x;
          const dy = target.y - enemy.y;
          const distance = Math.hypot(dx, dy);
          
          if (distance < 10) {
            updatedEnemy.currentTarget = ((enemy.currentTarget || 0) + 1) % enemy.patrolPath.length;
          } else {
            updatedEnemy.x += (dx / distance) * 1.5;
            updatedEnemy.y += (dy / distance) * 1.5;
          }
        }

        // Enemy shooting
        if (playerDistance < 200 && currentTime - enemy.lastShot > 2000) {
          const angle = Math.atan2(newState.player.y - enemy.y, newState.player.x - enemy.x);
          newState.bullets.push({
            x: enemy.x,
            y: enemy.y,
            dx: Math.cos(angle) * 4,
            dy: Math.sin(angle) * 4,
            isPlayerBullet: false
          });
          updatedEnemy.lastShot = currentTime;
        }

        return updatedEnemy;
      });

      // Update bullets
      newState.bullets = newState.bullets.filter(bullet => {
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;

        // Remove off-screen bullets
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
          return false;
        }

        // Check collisions
        if (bullet.isPlayerBullet) {
          newState.enemies = newState.enemies.filter(enemy => {
            const hit = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y) < 25;
            if (hit) {
              newState.score += enemy.type === 'sniper' ? 200 : 100;
              // Particle effect would go here
              return false;
            }
            return true;
          });
        } else {
          // Enemy bullet hitting player
          const playerHit = Math.hypot(
            bullet.x - (newState.player.x + 10),
            bullet.y - (newState.player.y + 10)
          ) < 20;
          
          if (playerHit) {
            newState.player.health -= 25;
            if (newState.player.health <= 0) {
              newState.gameOver = true;
            }
            return false;
          }
        }

        return true;
      });

      // Check mission completion
      if (newState.enemies.length === 0) {
        newState.missionComplete = true;
      }

      // Update stealth
      if (newState.alertLevel > 0) {
        newState.player.stealth = Math.max(0, newState.player.stealth - 1);
        newState.alertLevel = Math.max(0, newState.alertLevel - 0.5);
      } else {
        newState.player.stealth = Math.min(100, newState.player.stealth + 0.5);
      }

      return newState;
    });

    // Render game
    // Draw buildings
    ctx.fillStyle = '#2a2a4a';
    gameState.buildings.forEach(building => {
      ctx.fillRect(building.x, building.y, building.width, building.height);
      ctx.strokeStyle = '#4a4a8a';
      ctx.strokeRect(building.x, building.y, building.width, building.height);
    });

    // Draw player
    ctx.fillStyle = gameState.player.stealth > 50 ? '#0aff9d' : '#ff6600';
    ctx.fillRect(gameState.player.x, gameState.player.y, 20, 20);
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.fillRect(gameState.player.x, gameState.player.y, 20, 20);
    ctx.shadowBlur = 0;

    // Draw enemies
    gameState.enemies.forEach(enemy => {
      ctx.fillStyle = enemy.alertLevel > 50 ? '#ff0099' : '#ff6600';
      ctx.fillRect(enemy.x - 8, enemy.y - 8, 16, 16);
      
      // Alert indicator
      if (enemy.alertLevel > 0) {
        ctx.fillStyle = `rgba(255, 0, 153, ${enemy.alertLevel / 100})`;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y - 20, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw bullets
    gameState.bullets.forEach(bullet => {
      ctx.fillStyle = bullet.isPlayerBullet ? '#0aff9d' : '#ff0099';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 5;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Health: ${gameState.player.health}`, 10, 30);
    ctx.fillText(`Stealth: ${Math.floor(gameState.player.stealth)}`, 10, 50);
    ctx.fillText(`Score: ${gameState.score}`, 10, 70);
    ctx.fillText(`Wave: ${gameState.wave}`, 10, 90);
    ctx.fillText(`Alert: ${Math.floor(gameState.alertLevel)}`, 10, 110);

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('MISSION FAILED', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px monospace';
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 50);
    }

    if (gameState.missionComplete) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0aff9d';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('MISSION COMPLETE', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px monospace';
      ctx.fillText('Press N for next wave', canvas.width / 2, canvas.height / 2 + 50);
    }

    ctx.textAlign = 'left';
  }, [gameState]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    if (!gameState.gameOver && !gameState.missionComplete) {
      gameLoopRef.current = setInterval(gameLoop, 1000 / 60);
    }
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameLoop, gameState.gameOver, gameState.missionComplete]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      
      if (e.key.toLowerCase() === 'r' && gameState.gameOver) {
        setGameState(prev => ({ ...prev, wave: 1 }));
        initializeGame();
      }
      
      if (e.key.toLowerCase() === 'n' && gameState.missionComplete) {
        setGameState(prev => ({ ...prev, wave: prev.wave + 1 }));
        initializeGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.gameOver, gameState.missionComplete, initializeGame]);

  return (
    <GameLayout
      gameTitle="Night Raid Protocol"
      gameCategory="Nighttime tactical combat operations"
    >
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg shadow-2xl"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        <div className="text-center space-y-2">
          <p className="text-gray-300">WASD/Arrows: Move | Space: Shoot | Stay hidden!</p>
          <p className="text-gray-400">Eliminate all enemies while maintaining stealth</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default NightRaidProtocol;
