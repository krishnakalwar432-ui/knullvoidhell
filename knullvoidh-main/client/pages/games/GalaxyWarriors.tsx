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
  damage: number;
  color: string;
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  type: 'basic' | 'fast' | 'heavy' | 'boss';
  shootTimer: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

const GalaxyWarriors = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());
  const lastShotRef = useRef(0);

  const [gameState, setGameState] = useState({
    player: { x: 375, y: 550, width: 50, height: 30 } as Player,
    enemies: [] as Enemy[],
    bullets: [] as Bullet[],
    particles: [] as Particle[],
    score: 0,
    lives: 3,
    gameOver: false,
    wave: 1,
    enemySpawnTimer: 0,
    powerLevel: 1
  });

  const createParticles = (x: number, y: number, color: string, count: number = 8) => {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = Math.random() * 5 + 2;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        maxLife: 30,
        color,
        size: Math.random() * 3 + 1
      });
    }
    return particles;
  };

  const spawnEnemy = useCallback(() => {
    const types: ('basic' | 'fast' | 'heavy' | 'boss')[] = ['basic', 'fast', 'heavy'];
    let type = types[Math.floor(Math.random() * types.length)];

    // Boss every 10 waves
    if (gameState.wave % 10 === 0 && Math.random() < 0.3) {
      type = 'boss';
    }
    
    const enemyData = {
      basic: { width: 40, height: 30, health: 50, speed: 2, color: '#ff4444' },
      fast: { width: 30, height: 25, health: 30, speed: 4, color: '#ffff44' },
      heavy: { width: 60, height: 45, health: 150, speed: 1, color: '#ff8844' },
      boss: { width: 100, height: 80, health: 500, speed: 0.5, color: '#cc00cc' }
    }[type];
    
    return {
      x: Math.random() * (800 - enemyData.width),
      y: -enemyData.height,
      vx: (Math.random() - 0.5) * 2,
      vy: enemyData.speed,
      width: enemyData.width,
      height: enemyData.height,
      health: enemyData.health + gameState.wave * 10,
      maxHealth: enemyData.health + gameState.wave * 10,
      type,
      shootTimer: Math.random() * 60,
      color: enemyData.color
    };
  }, [gameState.wave]);

  const initializeGame = useCallback(() => {
    setGameState({
      player: { x: 375, y: 550, width: 50, height: 30 },
      enemies: [],
      bullets: [],
      particles: [],
      score: 0,
      lives: 3,
      gameOver: false,
      wave: 1,
      enemySpawnTimer: 0,
      powerLevel: 1
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
      let enemies = [...newState.enemies];
      let bullets = [...newState.bullets];
      let particles = [...newState.particles];

      // Handle player input
      const speed = 7;
      if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) {
        player.x = Math.max(0, player.x - speed);
      }
      if (keysRef.current.has('d') || keysRef.current.has('arrowright')) {
        player.x = Math.min(750, player.x + speed);
      }
      if (keysRef.current.has('w') || keysRef.current.has('arrowup')) {
        player.y = Math.max(0, player.y - speed);
      }
      if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) {
        player.y = Math.min(570, player.y + speed);
      }

      // Player shooting - bullet hell style
      const now = Date.now();
      if ((keysRef.current.has(' ') || keysRef.current.has('space')) && now - lastShotRef.current > 100) {
        const shotPattern = newState.powerLevel;
        
        for (let i = 0; i < shotPattern; i++) {
          const spreadAngle = (i - (shotPattern - 1) / 2) * 0.3;
          bullets.push({
            x: player.x + player.width / 2,
            y: player.y,
            vx: Math.sin(spreadAngle) * 15,
            vy: -15 + Math.abs(Math.cos(spreadAngle)) * 3,
            fromPlayer: true,
            damage: 25,
            color: '#00ffff'
          });
        }
        lastShotRef.current = now;
      }

      // Update bullets
      bullets = bullets.map(bullet => ({
        ...bullet,
        x: bullet.x + bullet.vx,
        y: bullet.y + bullet.vy
      })).filter(bullet => bullet.y > -10 && bullet.y < 610 && bullet.x > -10 && bullet.x < 810);

      // Spawn enemies
      newState.enemySpawnTimer++;
      const spawnRate = Math.max(20, 80 - newState.wave * 3);
      
      if (newState.enemySpawnTimer > spawnRate) {
        enemies.push(spawnEnemy());
        newState.enemySpawnTimer = 0;
      }

      // Update enemies
      enemies = enemies.map(enemy => {
        const newEnemy = { ...enemy };
        
        // Enemy movement
        newEnemy.x += newEnemy.vx;
        newEnemy.y += newEnemy.vy;
        
        // Bounce off walls
        if (newEnemy.x <= 0 || newEnemy.x >= 800 - newEnemy.width) {
          newEnemy.vx = -newEnemy.vx;
        }
        
        // Enemy shooting patterns
        newEnemy.shootTimer++;
        
        if (newEnemy.type === 'boss' && newEnemy.shootTimer > 20) {
          // Boss shoots in multiple directions
          for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            bullets.push({
              x: newEnemy.x + newEnemy.width / 2,
              y: newEnemy.y + newEnemy.height,
              vx: Math.cos(angle) * 3,
              vy: Math.sin(angle) * 3 + 2,
              fromPlayer: false,
              damage: 1,
              color: '#ff00ff'
            });
          }
          newEnemy.shootTimer = 0;
        } else if (newEnemy.type === 'heavy' && newEnemy.shootTimer > 40) {
          // Heavy shoots spread shot
          for (let i = -1; i <= 1; i++) {
            bullets.push({
              x: newEnemy.x + newEnemy.width / 2,
              y: newEnemy.y + newEnemy.height,
              vx: i * 2,
              vy: 5,
              fromPlayer: false,
              damage: 1,
              color: '#ff8800'
            });
          }
          newEnemy.shootTimer = 0;
        } else if ((newEnemy.type === 'basic' || newEnemy.type === 'fast') && newEnemy.shootTimer > 60) {
          // Basic enemies shoot toward player
          const dx = player.x - newEnemy.x;
          const dy = player.y - newEnemy.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          bullets.push({
            x: newEnemy.x + newEnemy.width / 2,
            y: newEnemy.y + newEnemy.height,
            vx: (dx / distance) * 4,
            vy: (dy / distance) * 4,
            fromPlayer: false,
            damage: 1,
            color: '#ff4444'
          });
          newEnemy.shootTimer = 0;
        }
        
        return newEnemy;
      }).filter(enemy => enemy.y < 650);

      // Check bullet collisions
      for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        let bulletHit = false;
        
        if (bullet.fromPlayer) {
          // Player bullet hits enemy
          for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (checkCollision(bullet, enemy)) {
              enemy.health -= bullet.damage;
              bulletHit = true;
              
              particles.push(...createParticles(bullet.x, bullet.y, '#ffff00', 5));
              
              if (enemy.health <= 0) {
                particles.push(...createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.color, 15));
                const points = enemy.type === 'boss' ? 1000 : 
                             enemy.type === 'heavy' ? 300 : 
                             enemy.type === 'fast' ? 150 : 100;
                newState.score += points;
                
                // Power up every 1000 points
                if (newState.score > 0 && newState.score % 1000 === 0) {
                  newState.powerLevel = Math.min(5, newState.powerLevel + 1);
                }
                
                enemies.splice(j, 1);
              }
              break;
            }
          }
        } else {
          // Enemy bullet hits player
          if (checkCollision(bullet, player)) {
            bulletHit = true;
            particles.push(...createParticles(bullet.x, bullet.y, '#ff0000', 8));
            newState.lives--;
            
            if (newState.lives <= 0) {
              newState.gameOver = true;
            }
          }
        }
        
        if (bulletHit) {
          bullets.splice(i, 1);
        }
      }

      // Check enemy-player collisions
      for (const enemy of enemies) {
        if (checkCollision(enemy, player)) {
          particles.push(...createParticles(player.x + player.width/2, player.y + player.height/2, '#ff0000', 12));
          newState.lives--;
          
          if (newState.lives <= 0) {
            newState.gameOver = true;
          }
          break;
        }
      }

      // Update particles
      particles = particles.map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        vx: particle.vx * 0.98,
        vy: particle.vy * 0.98,
        life: particle.life - 1
      })).filter(particle => particle.life > 0);

      // Wave progression
      if (enemies.length === 0 && newState.enemySpawnTimer > 60) {
        newState.wave++;
        newState.score += 500; // Wave bonus
      }

      newState.player = player;
      newState.enemies = enemies;
      newState.bullets = bullets;
      newState.particles = particles;
      return newState;
    });
  }, [gameState.gameOver, spawnEnemy]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with space background
    const gradient = ctx.createRadialGradient(400, 300, 0, 400, 300, 500);
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(0.5, '#002244');
    gradient.addColorStop(1, '#000011');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
      const x = (i * 123 + gameState.wave * 5) % 800;
      const y = (i * 456 + gameState.wave * 3) % 600;
      const brightness = Math.sin(Date.now() * 0.003 + i) * 0.3 + 0.7;
      ctx.globalAlpha = brightness;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;

    // Draw player
    ctx.save();
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#00ffff';
    
    // Player ship design
    ctx.beginPath();
    ctx.moveTo(gameState.player.x + gameState.player.width/2, gameState.player.y);
    ctx.lineTo(gameState.player.x, gameState.player.y + gameState.player.height);
    ctx.lineTo(gameState.player.x + gameState.player.width, gameState.player.y + gameState.player.height);
    ctx.closePath();
    ctx.fill();
    
    // Player ship details
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(gameState.player.x + 15, gameState.player.y + 20, 8, 8);
    ctx.fillRect(gameState.player.x + 27, gameState.player.y + 20, 8, 8);
    ctx.restore();

    // Draw enemies
    gameState.enemies.forEach(enemy => {
      ctx.save();
      ctx.shadowColor = enemy.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = enemy.color;
      
      if (enemy.type === 'boss') {
        // Boss design
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(enemy.x + 30, enemy.y + 20, 15, 15);
        ctx.fillRect(enemy.x + 55, enemy.y + 20, 15, 15);
        ctx.fillRect(enemy.x + 40, enemy.y + 50, 20, 20);
      } else {
        // Regular enemy
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(enemy.x + 8, enemy.y + 8, 6, 4);
        ctx.fillRect(enemy.x + enemy.width - 14, enemy.y + 8, 6, 4);
      }
      
      // Health bar
      if (enemy.health < enemy.maxHealth) {
        const healthPercent = enemy.health / enemy.maxHealth;
        ctx.fillStyle = '#333333';
        ctx.fillRect(enemy.x, enemy.y - 8, enemy.width, 4);
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(enemy.x, enemy.y - 8, enemy.width * healthPercent, 4);
      }
      
      ctx.restore();
    });

    // Draw bullets
    gameState.bullets.forEach(bullet => {
      ctx.save();
      ctx.shadowColor = bullet.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = bullet.color;
      
      if (bullet.fromPlayer) {
        ctx.fillRect(bullet.x - 2, bullet.y - 4, 4, 8);
      } else {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // Draw particles
    gameState.particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
      ctx.restore();
    });

    // Draw UI
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 20, 30);
    ctx.fillText(`Wave: ${gameState.wave}`, 20, 60);
    ctx.fillText(`Power: ${gameState.powerLevel}`, 20, 90);
    
    // Lives
    ctx.fillText('Lives:', 650, 30);
    for (let i = 0; i < gameState.lives; i++) {
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.moveTo(720 + i * 25 + 10, 10);
      ctx.lineTo(720 + i * 25, 25);
      ctx.lineTo(720 + i * 25 + 20, 25);
      ctx.closePath();
      ctx.fill();
    }

    // Draw game over screen
    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#ff0099';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText(`Wave Reached: ${gameState.wave}`, canvas.width / 2, canvas.height / 2 + 30);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 70);
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
    <GameLayout gameTitle="Galaxy Warriors" gameCategory="Bullet-hell shooter">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg shadow-2xl"
        />
        <div className="text-center text-gray-300">
          <p>WASD / Arrow Keys: Move | Space: Shoot | R: Restart</p>
          <p>Bullet-hell space combat! Power up by scoring points!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default GalaxyWarriors;
