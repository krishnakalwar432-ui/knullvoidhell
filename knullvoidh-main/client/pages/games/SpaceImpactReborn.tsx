import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fromPlayer: boolean;
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  type: 'basic' | 'fast' | 'heavy';
}

const SpaceImpactReborn = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());
  const lastShotRef = useRef(0);

  const [gameState, setGameState] = useState({
    player: { x: 50, y: 250, width: 40, height: 30 } as Player,
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    score: 0,
    gameOver: false,
    wave: 1,
    enemySpawnTimer: 0
  });

  const spawnEnemy = useCallback(() => {
    const types = ['basic', 'fast', 'heavy'] as const;
    const type = types[Math.floor(Math.random() * types.length)];

    const enemy: Enemy = {
      x: 850,
      y: Math.random() * 500 + 50,
      vx: type === 'fast' ? -4 : type === 'heavy' ? -2 : -3,
      vy: (Math.random() - 0.5) * 2,
      width: type === 'heavy' ? 60 : 40,
      height: type === 'heavy' ? 40 : 30,
      hp: type === 'heavy' ? 3 : type === 'fast' ? 1 : 2,
      type
    };

    return enemy;
  }, []);

  const initializeGame = useCallback(() => {
    setGameState({
      player: { x: 50, y: 250, width: 40, height: 30 },
      bullets: [],
      enemies: [],
      score: 0,
      gameOver: false,
      wave: 1,
      enemySpawnTimer: 0
    });
  }, []);

  const checkCollision = (rect1: any, rect2: any) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  };

  const update = useCallback(() => {
    if (gameState.gameOver) return;

    setGameState(prev => {
      const newState = { ...prev };
      const player = { ...newState.player };
      let bullets = [...newState.bullets];
      let enemies = [...newState.enemies];

      // Handle input
      const speed = 5;
      if (keysRef.current.has('w') || keysRef.current.has('arrowup')) {
        player.y = Math.max(0, player.y - speed);
      }
      if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) {
        player.y = Math.min(570, player.y + speed);
      }
      if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) {
        player.x = Math.max(0, player.x - speed);
      }
      if (keysRef.current.has('d') || keysRef.current.has('arrowright')) {
        player.x = Math.min(760, player.x + speed);
      }

      // Shooting
      const now = Date.now();
      if ((keysRef.current.has(' ') || keysRef.current.has('space')) && now - lastShotRef.current > 200) {
        bullets.push({
          x: player.x + player.width,
          y: player.y + player.height / 2,
          vx: 8,
          vy: 0,
          fromPlayer: true
        });
        lastShotRef.current = now;
      }

      // Update bullets
      bullets = bullets.map(bullet => ({
        ...bullet,
        x: bullet.x + bullet.vx,
        y: bullet.y + bullet.vy
      })).filter(bullet => bullet.x > -10 && bullet.x < 810);

      // Spawn enemies
      newState.enemySpawnTimer++;
      const spawnRate = Math.max(30, 120 - newState.wave * 10);
      if (newState.enemySpawnTimer > spawnRate) {
        enemies.push(spawnEnemy());
        newState.enemySpawnTimer = 0;
      }

      // Update enemies
      enemies = enemies.map(enemy => {
        const newEnemy = { ...enemy };
        newEnemy.x += newEnemy.vx;
        newEnemy.y += newEnemy.vy;

        // Bounce off walls
        if (newEnemy.y <= 0 || newEnemy.y >= 570) {
          newEnemy.vy = -newEnemy.vy;
        }

        // Some enemies shoot
        if (Math.random() < 0.005 && newEnemy.type !== 'fast') {
          bullets.push({
            x: newEnemy.x,
            y: newEnemy.y + newEnemy.height / 2,
            vx: -6,
            vy: 0,
            fromPlayer: false
          });
        }

        return newEnemy;
      }).filter(enemy => enemy.x > -100);

      // Check bullet-enemy collisions
      const newBullets: Bullet[] = [];
      const newEnemies: Enemy[] = [];

      for (const bullet of bullets) {
        let bulletHit = false;

        if (bullet.fromPlayer) {
          for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (checkCollision(bullet, enemy)) {
              enemy.hp--;
              bulletHit = true;
              newState.score += 100;

              if (enemy.hp <= 0) {
                newState.score += enemy.type === 'heavy' ? 300 : enemy.type === 'fast' ? 150 : 200;
              } else {
                newEnemies.push(enemy);
              }
            } else {
              newEnemies.push(enemy);
            }
          }
          enemies = newEnemies;
        }

        if (!bulletHit) {
          newBullets.push(bullet);
        }
      }

      bullets = newBullets;

      // Check player-enemy collisions
      for (const enemy of enemies) {
        if (checkCollision(player, enemy)) {
          newState.gameOver = true;
        }
      }

      // Check enemy bullets hitting player
      for (const bullet of bullets) {
        if (!bullet.fromPlayer && checkCollision(bullet, player)) {
          newState.gameOver = true;
        }
      }

      // Wave progression
      if (enemies.length === 0 && newState.enemySpawnTimer > 60) {
        newState.wave++;
      }

      newState.player = player;
      newState.bullets = bullets;
      newState.enemies = enemies;
      return newState;
    });
  }, [gameState.gameOver, spawnEnemy]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with space background
    const gradient = ctx.createLinearGradient(0, 0, 800, 0);
    gradient.addColorStop(0, '#0a0a2e');
    gradient.addColorStop(1, '#1a1a3e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
      const x = (i * 123) % 800;
      const y = (i * 456) % 600;
      ctx.fillRect(x, y, 1, 1);
    }

    // Draw player
    ctx.fillStyle = '#0aff9d';
    ctx.fillRect(gameState.player.x, gameState.player.y, gameState.player.width, gameState.player.height);

    // Player details
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(gameState.player.x + 30, gameState.player.y + 10, 8, 4);
    ctx.fillRect(gameState.player.x + 30, gameState.player.y + 16, 8, 4);

    // Draw enemies
    gameState.enemies.forEach(enemy => {
      let color = '#ff4444';
      if (enemy.type === 'fast') color = '#ffff44';
      if (enemy.type === 'heavy') color = '#ff8844';

      ctx.fillStyle = color;
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

      // Enemy details
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(enemy.x + 5, enemy.y + 10, 6, 3);
      ctx.fillRect(enemy.x + 5, enemy.y + 17, 6, 3);
    });

    // Draw bullets
    gameState.bullets.forEach(bullet => {
      ctx.fillStyle = bullet.fromPlayer ? '#ffff00' : '#ff0000';
      ctx.fillRect(bullet.x, bullet.y, 6, 2);
    });

    // Draw UI
    ctx.fillStyle = '#0aff9d';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 20, 30);
    ctx.fillText(`Wave: ${gameState.wave}`, 20, 60);

    // Draw game over screen
    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ff0099';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 50);

      ctx.fillStyle = '#0aff9d';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 50);
      ctx.textAlign = 'left';
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.add(key);

      if (key === 'r' && gameState.gameOver) {
        initializeGame();
      }

      // Prevent default for game keys
      if (['w', 'a', 's', 'd', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'space'].includes(key)) {
        e.preventDefault();
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
  }, [gameState.gameOver, initializeGame]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

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
    <GameLayout gameTitle="Space Impact Reborn" gameCategory="Side-scrolling space shooter">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg shadow-2xl"
        />
        <div className="text-center text-gray-300">
          <p>WASD / Arrow Keys: Move | Space: Shoot | R: Restart</p>
          <p>Classic Nokia Space Impact recreated!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default SpaceImpactReborn;
