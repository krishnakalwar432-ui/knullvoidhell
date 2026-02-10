import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Alien {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  health: number;
  type: 'basic' | 'fast' | 'heavy' | 'boss';
  shootTimer: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fromPlayer: boolean;
  damage: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

const AlienSkyInvasion = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());
  const lastShotRef = useRef(0);

  const [gameState, setGameState] = useState({
    player: { x: 375, y: 550, width: 50, height: 30 } as Player,
    aliens: [] as Alien[],
    bullets: [] as Bullet[],
    particles: [] as Particle[],
    score: 0,
    lives: 3,
    gameOver: false,
    wave: 1,
    waveTimer: 0
  });

  const createParticles = (x: number, y: number, color: string, count: number = 8) => {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * (Math.random() * 3 + 2),
        vy: Math.sin(angle) * (Math.random() * 3 + 2),
        life: 30,
        maxLife: 30,
        color
      });
    }
    return particles;
  };

  const spawnWave = useCallback((wave: number) => {
    const aliens: Alien[] = [];
    const aliensPerRow = Math.min(8, 4 + wave);
    const rows = Math.min(5, 2 + Math.floor(wave / 2));

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < aliensPerRow; col++) {
        const alienType = row === 0 && wave > 3 ? 'heavy' :
                         Math.random() < 0.2 ? 'fast' : 'basic';

        aliens.push({
          x: col * 80 + 100,
          y: row * 60 + 50,
          vx: 1 + wave * 0.2,
          vy: 0,
          width: alienType === 'heavy' ? 50 : 40,
          height: alienType === 'heavy' ? 40 : 30,
          health: alienType === 'heavy' ? 3 : alienType === 'fast' ? 1 : 2,
          type: alienType,
          shootTimer: Math.random() * 60
        });
      }
    }

    // Add boss every 5 waves
    if (wave % 5 === 0) {
      aliens.push({
        x: 300,
        y: 20,
        vx: 0.5,
        vy: 0,
        width: 100,
        height: 80,
        health: 20 + wave * 2,
        type: 'boss',
        shootTimer: 0
      });
    }

    return aliens;
  }, []);

  const initializeGame = useCallback(() => {
    setGameState({
      player: { x: 375, y: 550, width: 50, height: 30 },
      aliens: spawnWave(1),
      bullets: [],
      particles: [],
      score: 0,
      lives: 3,
      gameOver: false,
      wave: 1,
      waveTimer: 0
    });
  }, [spawnWave]);

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
      let aliens = [...newState.aliens];
      let bullets = [...newState.bullets];
      let particles = [...newState.particles];

      // Handle player input
      const speed = 8;
      if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) {
        player.x = Math.max(0, player.x - speed);
      }
      if (keysRef.current.has('d') || keysRef.current.has('arrowright')) {
        player.x = Math.min(750, player.x + speed);
      }
      if (keysRef.current.has('w') || keysRef.current.has('arrowup')) {
        player.y = Math.max(400, player.y - speed);
      }
      if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) {
        player.y = Math.min(570, player.y + speed);
      }

      // Player shooting
      const now = Date.now();
      if ((keysRef.current.has(' ') || keysRef.current.has('space')) && now - lastShotRef.current > 150) {
        bullets.push({
          x: player.x + player.width / 2,
          y: player.y,
          vx: 0,
          vy: -12,
          fromPlayer: true,
          damage: 1
        });
        lastShotRef.current = now;
      }

      // Update bullets
      bullets = bullets.map(bullet => ({
        ...bullet,
        x: bullet.x + bullet.vx,
        y: bullet.y + bullet.vy
      })).filter(bullet => bullet.y > -10 && bullet.y < 610 && bullet.x > -10 && bullet.x < 810);

      // Update aliens
      let changeDirection = false;
      aliens = aliens.map(alien => {
        const newAlien = { ...alien };

        // Move alien
        newAlien.x += newAlien.vx;

        // Check bounds
        if (newAlien.x <= 0 || newAlien.x >= 800 - newAlien.width) {
          changeDirection = true;
        }

        // Alien shooting
        newAlien.shootTimer++;
        const shootChance = newAlien.type === 'boss' ? 0.05 :
                           newAlien.type === 'heavy' ? 0.01 : 0.005;

        if (newAlien.shootTimer > 30 && Math.random() < shootChance) {
          const spread = newAlien.type === 'boss' ? 3 : 1;
          for (let i = 0; i < spread; i++) {
            bullets.push({
              x: newAlien.x + newAlien.width / 2 + (i - 1) * 20,
              y: newAlien.y + newAlien.height,
              vx: (i - 1) * 2,
              vy: 4 + Math.random() * 2,
              fromPlayer: false,
              damage: 1
            });
          }
          newAlien.shootTimer = 0;
        }

        return newAlien;
      });

      // Change direction if needed
      if (changeDirection) {
        aliens = aliens.map(alien => ({
          ...alien,
          vx: -alien.vx,
          y: alien.y + 20
        }));
      }

      // Check bullet collisions
      const newBullets: Bullet[] = [];
      const newAliens: Alien[] = [];

      for (const bullet of bullets) {
        let bulletHit = false;

        if (bullet.fromPlayer) {
          // Player bullet hits alien
          for (const alien of aliens) {
            if (checkCollision(bullet, alien)) {
              alien.health -= bullet.damage;
              bulletHit = true;

              // Create explosion particles
              particles.push(...createParticles(bullet.x, bullet.y, '#ffff00', 6));

              if (alien.health <= 0) {
                // Alien destroyed
                particles.push(...createParticles(alien.x + alien.width/2, alien.y + alien.height/2, '#ff4444', 12));
                const points = alien.type === 'boss' ? 1000 :
                             alien.type === 'heavy' ? 300 :
                             alien.type === 'fast' ? 150 : 200;
                newState.score += points;
              } else {
                newAliens.push(alien);
              }
              break;
            } else {
              newAliens.push(alien);
            }
          }
          aliens = newAliens.length < aliens.length ? newAliens : aliens;
        } else {
          // Alien bullet hits player
          if (checkCollision(bullet, player)) {
            bulletHit = true;
            particles.push(...createParticles(bullet.x, bullet.y, '#0aff9d', 8));
            newState.lives--;

            if (newState.lives <= 0) {
              newState.gameOver = true;
            }
          }
        }

        if (!bulletHit) {
          newBullets.push(bullet);
        }
      }

      bullets = newBullets;

      // Update particles
      particles = particles.map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        vx: particle.vx * 0.98,
        vy: particle.vy * 0.98,
        life: particle.life - 1
      })).filter(particle => particle.life > 0);

      // Check for wave completion
      if (aliens.length === 0) {
        newState.waveTimer++;
        if (newState.waveTimer > 120) {
          newState.wave++;
          aliens = spawnWave(newState.wave);
          newState.waveTimer = 0;
          newState.score += 500; // Wave bonus
        }
      }

      // Check if aliens reached bottom
      if (aliens.some(alien => alien.y + alien.height > 500)) {
        newState.gameOver = true;
      }

      newState.player = player;
      newState.aliens = aliens;
      newState.bullets = bullets;
      newState.particles = particles;
      return newState;
    });
  }, [gameState.gameOver, spawnWave]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with space background
    const gradient = ctx.createRadialGradient(400, 300, 0, 400, 300, 400);
    gradient.addColorStop(0, '#1a1a3e');
    gradient.addColorStop(1, '#0a0a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
      const x = (i * 123 + gameState.wave * 10) % 800;
      const y = (i * 456 + gameState.wave * 5) % 600;
      const size = (i % 3) + 1;
      ctx.fillRect(x, y, size, size);
    }

    // Draw player
    ctx.save();
    ctx.shadowColor = '#0aff9d';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#0aff9d';

    // Player ship
    ctx.beginPath();
    ctx.moveTo(gameState.player.x + gameState.player.width/2, gameState.player.y);
    ctx.lineTo(gameState.player.x, gameState.player.y + gameState.player.height);
    ctx.lineTo(gameState.player.x + gameState.player.width, gameState.player.y + gameState.player.height);
    ctx.closePath();
    ctx.fill();

    // Player details
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(gameState.player.x + 15, gameState.player.y + 20, 5, 8);
    ctx.fillRect(gameState.player.x + 30, gameState.player.y + 20, 5, 8);
    ctx.restore();

    // Draw aliens
    gameState.aliens.forEach(alien => {
      let color = '#ff4444';
      if (alien.type === 'fast') color = '#ffff44';
      if (alien.type === 'heavy') color = '#ff8844';
      if (alien.type === 'boss') color = '#cc00cc';

      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = color;

      if (alien.type === 'boss') {
        // Boss design
        ctx.fillRect(alien.x, alien.y, alien.width, alien.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(alien.x + 20, alien.y + 20, 20, 10);
        ctx.fillRect(alien.x + 50, alien.y + 20, 20, 10);
        ctx.fillRect(alien.x + 35, alien.y + 50, 30, 15);
      } else {
        // Regular alien
        ctx.fillRect(alien.x, alien.y, alien.width, alien.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(alien.x + 8, alien.y + 8, 8, 6);
        ctx.fillRect(alien.x + alien.width - 16, alien.y + 8, 8, 6);
        ctx.fillRect(alien.x + alien.width/2 - 4, alien.y + alien.height - 8, 8, 4);
      }

      // Health bar for damaged enemies
      if (alien.health < (alien.type === 'boss' ? 20 : alien.type === 'heavy' ? 3 : 2)) {
        const maxHealth = alien.type === 'boss' ? 20 + gameState.wave * 2 :
                         alien.type === 'heavy' ? 3 : 2;
        const healthPercent = alien.health / maxHealth;

        ctx.fillStyle = '#333333';
        ctx.fillRect(alien.x, alien.y - 8, alien.width, 4);
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(alien.x, alien.y - 8, alien.width * healthPercent, 4);
      }

      ctx.restore();
    });

    // Draw bullets
    gameState.bullets.forEach(bullet => {
      ctx.save();
      const color = bullet.fromPlayer ? '#ffff00' : '#ff0000';
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = color;
      ctx.fillRect(bullet.x, bullet.y, 4, 8);
      ctx.restore();
    });

    // Draw particles
    gameState.particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, 3, 3);
      ctx.restore();
    });

    // Draw UI
    ctx.fillStyle = '#0aff9d';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 20, 30);
    ctx.fillText(`Wave: ${gameState.wave}`, 20, 60);

    // Lives
    ctx.fillText('Lives:', 650, 30);
    for (let i = 0; i < gameState.lives; i++) {
      ctx.fillStyle = '#0aff9d';
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

      ctx.fillStyle = '#0aff9d';
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
    <GameLayout gameTitle="Alien Sky Invasion" gameCategory="Space Invaders meets chaos">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg shadow-2xl"
        />
        <div className="text-center text-gray-300">
          <p>WASD / Arrow Keys: Move | Space: Shoot | R: Restart</p>
          <p>Defend Earth from the alien invasion! Watch out for bosses every 5 waves!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default AlienSkyInvasion;
