import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Player {
  x: number;
  y: number;
  angle: number;
  health: number;
  maxHealth: number;
  weapon: string;
  ammo: number;
  maxAmmo: number;
  kills: number;
}

interface Bot {
  x: number;
  y: number;
  angle: number;
  health: number;
  maxHealth: number;
  speed: number;
  lastShot: number;
  targetX: number;
  targetY: number;
  difficulty: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  fromPlayer: boolean;
  range: number;
  traveled: number;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'wall' | 'crate' | 'barrel';
}

const MiniRoyale2 = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef({ x: 0, y: 0, pressed: false });

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  const [gameState, setGameState] = useState({
    player: {
      x: 100,
      y: 100,
      angle: 0,
      health: 100,
      maxHealth: 100,
      weapon: 'rifle',
      ammo: 30,
      maxAmmo: 30,
      kills: 0
    } as Player,
    bots: [] as Bot[],
    bullets: [] as Bullet[],
    obstacles: [] as Obstacle[],
    gameOver: false,
    score: 0,
    timeLeft: 300, // 5 minutes
    lastBotSpawn: 0,
    gameStarted: false
  });

  // Initialize obstacles
  const initializeObstacles = useCallback(() => {
    const obstacles: Obstacle[] = [
      // Walls around the map
      { x: 0, y: 0, width: CANVAS_WIDTH, height: 20, type: 'wall' },
      { x: 0, y: CANVAS_HEIGHT - 20, width: CANVAS_WIDTH, height: 20, type: 'wall' },
      { x: 0, y: 0, width: 20, height: CANVAS_HEIGHT, type: 'wall' },
      { x: CANVAS_WIDTH - 20, y: 0, width: 20, height: CANVAS_HEIGHT, type: 'wall' },
      
      // Interior obstacles
      { x: 200, y: 150, width: 60, height: 60, type: 'crate' },
      { x: 500, y: 200, width: 80, height: 40, type: 'crate' },
      { x: 300, y: 400, width: 50, height: 50, type: 'barrel' },
      { x: 600, y: 100, width: 40, height: 80, type: 'crate' },
      { x: 150, y: 450, width: 70, height: 30, type: 'crate' },
      { x: 450, y: 50, width: 60, height: 60, type: 'barrel' }
    ];
    return obstacles;
  }, []);

  const spawnBot = useCallback(() => {
    let x, y;
    let attempts = 0;
    
    do {
      x = Math.random() * (CANVAS_WIDTH - 100) + 50;
      y = Math.random() * (CANVAS_HEIGHT - 100) + 50;
      attempts++;
    } while (attempts < 20 && (
      Math.abs(x - gameState.player.x) < 100 || 
      Math.abs(y - gameState.player.y) < 100 ||
      gameState.obstacles.some(obs => 
        x > obs.x && x < obs.x + obs.width && 
        y > obs.y && y < obs.y + obs.height
      )
    ));

    return {
      x, y,
      angle: Math.random() * Math.PI * 2,
      health: 80,
      maxHealth: 80,
      speed: 1 + Math.random() * 0.5,
      lastShot: 0,
      targetX: x,
      targetY: y,
      difficulty: Math.random() * 0.5 + 0.3
    };
  }, [gameState.player.x, gameState.player.y, gameState.obstacles]);

  const checkCollision = (x: number, y: number, width: number = 20, height: number = 20) => {
    return gameState.obstacles.some(obs => 
      x < obs.x + obs.width &&
      x + width > obs.x &&
      y < obs.y + obs.height &&
      y + height > obs.y
    );
  };

  const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  };

  const update = useCallback(() => {
    if (gameState.gameOver || !gameState.gameStarted) return;

    setGameState(prev => {
      const newState = { ...prev };
      const currentTime = Date.now();
      const keys = keysRef.current;

      // Update timer
      newState.timeLeft -= 1/60;
      if (newState.timeLeft <= 0) {
        newState.gameOver = true;
      }

      // Player movement
      const speed = 3;
      let newX = newState.player.x;
      let newY = newState.player.y;

      if (keys.has('w') || keys.has('ArrowUp')) newY -= speed;
      if (keys.has('s') || keys.has('ArrowDown')) newY += speed;
      if (keys.has('a') || keys.has('ArrowLeft')) newX -= speed;
      if (keys.has('d') || keys.has('ArrowRight')) newX += speed;

      // Check collision before moving
      if (!checkCollision(newX, newState.player.y)) {
        newState.player.x = Math.max(25, Math.min(CANVAS_WIDTH - 25, newX));
      }
      if (!checkCollision(newState.player.x, newY)) {
        newState.player.y = Math.max(25, Math.min(CANVAS_HEIGHT - 25, newY));
      }

      // Player aiming
      const dx = mouseRef.current.x - newState.player.x;
      const dy = mouseRef.current.y - newState.player.y;
      newState.player.angle = Math.atan2(dy, dx);

      // Player shooting
      if (mouseRef.current.pressed && newState.player.ammo > 0) {
        const bulletSpeed = 8;
        newState.bullets.push({
          x: newState.player.x,
          y: newState.player.y,
          vx: Math.cos(newState.player.angle) * bulletSpeed,
          vy: Math.sin(newState.player.angle) * bulletSpeed,
          damage: 25,
          fromPlayer: true,
          range: 400,
          traveled: 0
        });
        newState.player.ammo--;
        mouseRef.current.pressed = false; // Single shot
      }

      // Reload
      if (keys.has('r') && newState.player.ammo < newState.player.maxAmmo) {
        newState.player.ammo = newState.player.maxAmmo;
      }

      // Spawn bots
      if (currentTime - newState.lastBotSpawn > 8000 && newState.bots.length < 6) {
        newState.bots.push(spawnBot());
        newState.lastBotSpawn = currentTime;
      }

      // Bot AI
      newState.bots.forEach(bot => {
        const playerDist = getDistance(bot.x, bot.y, newState.player.x, newState.player.y);
        
        if (playerDist < 200) {
          // Chase player
          const dx = newState.player.x - bot.x;
          const dy = newState.player.y - bot.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          
          const moveX = bot.x + (dx / length) * bot.speed;
          const moveY = bot.y + (dy / length) * bot.speed;
          
          if (!checkCollision(moveX, bot.y)) bot.x = moveX;
          if (!checkCollision(bot.x, moveY)) bot.y = moveY;
          
          bot.angle = Math.atan2(dy, dx);
          
          // Bot shooting
          if (currentTime - bot.lastShot > 2000 && playerDist < 150) {
            const bulletSpeed = 6;
            const accuracy = bot.difficulty;
            const spread = (1 - accuracy) * 0.5;
            const angle = bot.angle + (Math.random() - 0.5) * spread;
            
            newState.bullets.push({
              x: bot.x,
              y: bot.y,
              vx: Math.cos(angle) * bulletSpeed,
              vy: Math.sin(angle) * bulletSpeed,
              damage: 20,
              fromPlayer: false,
              range: 300,
              traveled: 0
            });
            bot.lastShot = currentTime;
          }
        } else {
          // Wander around
          if (Math.random() < 0.02) {
            bot.targetX = Math.random() * CANVAS_WIDTH;
            bot.targetY = Math.random() * CANVAS_HEIGHT;
          }
          
          const dx = bot.targetX - bot.x;
          const dy = bot.targetY - bot.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist > 5) {
            const moveX = bot.x + (dx / dist) * bot.speed * 0.5;
            const moveY = bot.y + (dy / dist) * bot.speed * 0.5;
            
            if (!checkCollision(moveX, bot.y)) bot.x = moveX;
            if (!checkCollision(bot.x, moveY)) bot.y = moveY;
          }
        }
      });

      // Update bullets
      newState.bullets = newState.bullets.filter(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        bullet.traveled += Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
        
        // Check bounds and range
        if (bullet.x < 0 || bullet.x > CANVAS_WIDTH || 
            bullet.y < 0 || bullet.y > CANVAS_HEIGHT ||
            bullet.traveled > bullet.range) {
          return false;
        }
        
        // Check collision with obstacles
        if (checkCollision(bullet.x, bullet.y, 2, 2)) {
          return false;
        }
        
        if (bullet.fromPlayer) {
          // Check bot hits
          for (let i = newState.bots.length - 1; i >= 0; i--) {
            const bot = newState.bots[i];
            if (getDistance(bullet.x, bullet.y, bot.x, bot.y) < 15) {
              bot.health -= bullet.damage;
              if (bot.health <= 0) {
                newState.bots.splice(i, 1);
                newState.player.kills++;
                newState.score += 100;
              }
              return false; // Remove bullet
            }
          }
        } else {
          // Check player hit
          if (getDistance(bullet.x, bullet.y, newState.player.x, newState.player.y) < 15) {
            newState.player.health -= bullet.damage;
            if (newState.player.health <= 0) {
              newState.gameOver = true;
            }
            return false; // Remove bullet
          }
        }
        
        return true;
      });

      return newState;
    });
  }, [gameState.gameOver, gameState.gameStarted, spawnBot, checkCollision]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with battlefield background
    ctx.fillStyle = '#556B2F';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw obstacles
    gameState.obstacles.forEach(obstacle => {
      const colors = { wall: '#8B4513', crate: '#CD853F', barrel: '#A0522D' };
      ctx.fillStyle = colors[obstacle.type];
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      
      // Add some detail
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 2;
      ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });

    // Draw bots
    gameState.bots.forEach(bot => {
      ctx.fillStyle = '#FF4500';
      ctx.beginPath();
      ctx.arc(bot.x, bot.y, 12, 0, Math.PI * 2);
      ctx.fill();
      
      // Bot weapon direction
      ctx.strokeStyle = '#8B0000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bot.x, bot.y);
      ctx.lineTo(bot.x + Math.cos(bot.angle) * 20, bot.y + Math.sin(bot.angle) * 20);
      ctx.stroke();
      
      // Health bar
      const healthPercent = bot.health / bot.maxHealth;
      ctx.fillStyle = 'red';
      ctx.fillRect(bot.x - 15, bot.y - 20, 30, 4);
      ctx.fillStyle = 'green';
      ctx.fillRect(bot.x - 15, bot.y - 20, 30 * healthPercent, 4);
    });

    // Draw player
    ctx.fillStyle = '#00CED1';
    ctx.beginPath();
    ctx.arc(gameState.player.x, gameState.player.y, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Player weapon direction
    ctx.strokeStyle = '#008B8B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(gameState.player.x, gameState.player.y);
    ctx.lineTo(
      gameState.player.x + Math.cos(gameState.player.angle) * 20,
      gameState.player.y + Math.sin(gameState.player.angle) * 20
    );
    ctx.stroke();

    // Draw bullets
    gameState.bullets.forEach(bullet => {
      ctx.fillStyle = bullet.fromPlayer ? '#FFD700' : '#FF0000';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw UI
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, 80);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Health: ${gameState.player.health}/${gameState.player.maxHealth}`, 10, 25);
    ctx.fillText(`Ammo: ${gameState.player.ammo}/${gameState.player.maxAmmo}`, 10, 45);
    ctx.fillText(`Kills: ${gameState.player.kills}`, 200, 25);
    ctx.fillText(`Score: ${gameState.score}`, 200, 45);
    ctx.fillText(`Time: ${Math.ceil(gameState.timeLeft)}s`, 350, 25);
    ctx.fillText(`Enemies: ${gameState.bots.length}`, 350, 45);

    if (!gameState.gameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#00CED1';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('MINI ROYALE 2', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.fillStyle = '#FFD700';
      ctx.font = '24px Arial';
      ctx.fillText('Press SPACE to start battle!', canvas.width / 2, canvas.height / 2 + 20);
      ctx.font = '16px Arial';
      ctx.fillText('WASD: Move | Mouse: Aim & Shoot | R: Reload', canvas.width / 2, canvas.height / 2 + 60);
    }

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = gameState.player.health > 0 ? '#00FF00' : '#FF0000';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(gameState.player.health > 0 ? 'VICTORY!' : 'ELIMINATED!', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.fillStyle = '#FFD700';
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText(`Kills: ${gameState.player.kills}`, canvas.width / 2, canvas.height / 2 + 30);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 70);
    }
  }, [gameState]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
  }, []);

  const handleMouseDown = useCallback(() => {
    mouseRef.current.pressed = true;
  }, []);

  useEffect(() => {
    setGameState(prev => ({ ...prev, obstacles: initializeObstacles() }));
  }, [initializeObstacles]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' && gameState.gameOver) {
        setGameState({
          player: {
            x: 100, y: 100, angle: 0, health: 100, maxHealth: 100,
            weapon: 'rifle', ammo: 30, maxAmmo: 30, kills: 0
          },
          bots: [], bullets: [], obstacles: initializeObstacles(),
          gameOver: false, score: 0, timeLeft: 300, lastBotSpawn: 0, gameStarted: false
        });
        return;
      }
      
      if (e.key === ' ' && !gameState.gameStarted) {
        setGameState(prev => ({ ...prev, gameStarted: true }));
        return;
      }
      
      keysRef.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [gameState.gameOver, gameState.gameStarted, initializeObstacles, handleMouseMove, handleMouseDown]);

  useEffect(() => {
    gameLoopRef.current = setInterval(() => {
      update();
      render();
    }, 1000 / 60);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [update, render]);

  return (
    <GameLayout 
      gameTitle="Mini Royale 2" 
      gameCategory="Battle Royale FPS"
      showMobileControls={true}
    >
      <div className="flex flex-col items-center gap-4 p-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-gray-600 bg-green-800 rounded-lg cursor-crosshair max-w-full h-auto"
        />
        <div className="text-center text-gray-300">
          <p>WASD: Move | Mouse: Aim & Shoot | R: Reload | SPACE: Start | R: Restart</p>
          <p className="text-sm text-cyan-400">Survive 5 minutes against AI enemies to win!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default MiniRoyale2;
