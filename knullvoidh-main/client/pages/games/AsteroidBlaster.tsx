import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Ship {
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
  thrusting: boolean;
  invulnerable: number;
}

interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  points: { x: number; y: number }[];
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
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

const AsteroidBlaster = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const SHIP_SIZE = 10;
  const BULLET_SPEED = 8;
  const THRUST_POWER = 0.3;
  const ROTATION_SPEED = 0.15;
  const FRICTION = 0.99;

  const [gameState, setGameState] = useState({
    ship: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      angle: 0,
      vx: 0,
      vy: 0,
      thrusting: false,
      invulnerable: 0
    } as Ship,
    asteroids: [] as Asteroid[],
    bullets: [] as Bullet[],
    particles: [] as Particle[],
    score: 0,
    lives: 3,
    level: 1,
    gameOver: false,
    levelComplete: false,
    lastShot: 0
  });

  const createAsteroidShape = (size: number) => {
    const points: { x: number; y: number }[] = [];
    const numPoints = 8 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const radius = size * (0.7 + Math.random() * 0.3);
      points.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      });
    }
    
    return points;
  };

  const createAsteroid = useCallback((x: number, y: number, size: number) => {
    const speed = (4 - size) * 0.5 + Math.random() * 2;
    const angle = Math.random() * Math.PI * 2;
    
    return {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      points: createAsteroidShape(size * 15)
    };
  }, []);

  const initializeLevel = useCallback((level: number) => {
    const asteroids: Asteroid[] = [];
    const asteroidCount = 4 + level * 2;
    
    for (let i = 0; i < asteroidCount; i++) {
      let x, y;
      do {
        x = Math.random() * CANVAS_WIDTH;
        y = Math.random() * CANVAS_HEIGHT;
      } while (
        Math.abs(x - CANVAS_WIDTH / 2) < 100 && 
        Math.abs(y - CANVAS_HEIGHT / 2) < 100
      );
      
      asteroids.push(createAsteroid(x, y, 3));
    }
    
    return asteroids;
  }, [createAsteroid]);

  const createParticles = (x: number, y: number, color: string, count: number = 8) => {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = Math.random() * 4 + 2;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30, maxLife: 30, color, size: Math.random() * 3 + 1
      });
    }
    return particles;
  };

  const wrapPosition = (pos: number, max: number) => {
    if (pos < 0) return max;
    if (pos > max) return 0;
    return pos;
  };

  const checkCollision = (x1: number, y1: number, r1: number, x2: number, y2: number, r2: number) => {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < r1 + r2;
  };

  const update = useCallback(() => {
    if (gameState.gameOver) return;

    setGameState(prev => {
      const newState = { ...prev };
      const keys = keysRef.current;
      const currentTime = Date.now();

      // Ship controls
      if (keys.has('a') || keys.has('ArrowLeft')) {
        newState.ship.angle -= ROTATION_SPEED;
      }
      if (keys.has('d') || keys.has('ArrowRight')) {
        newState.ship.angle += ROTATION_SPEED;
      }
      
      newState.ship.thrusting = keys.has('w') || keys.has('ArrowUp');
      if (newState.ship.thrusting) {
        newState.ship.vx += Math.cos(newState.ship.angle) * THRUST_POWER;
        newState.ship.vy += Math.sin(newState.ship.angle) * THRUST_POWER;
        
        // Thrust particles
        if (Math.random() < 0.5) {
          const thrustX = newState.ship.x - Math.cos(newState.ship.angle) * SHIP_SIZE;
          const thrustY = newState.ship.y - Math.sin(newState.ship.angle) * SHIP_SIZE;
          newState.particles.push(...createParticles(thrustX, thrustY, '#ff6600', 3));
        }
      }

      // Ship shooting
      if ((keys.has(' ') || keys.has('s') || keys.has('ArrowDown')) && currentTime - newState.lastShot > 150) {
        newState.bullets.push({
          x: newState.ship.x,
          y: newState.ship.y,
          vx: Math.cos(newState.ship.angle) * BULLET_SPEED + newState.ship.vx,
          vy: Math.sin(newState.ship.angle) * BULLET_SPEED + newState.ship.vy,
          life: 60
        });
        newState.lastShot = currentTime;
      }

      // Apply friction and update ship position
      newState.ship.vx *= FRICTION;
      newState.ship.vy *= FRICTION;
      newState.ship.x += newState.ship.vx;
      newState.ship.y += newState.ship.vy;

      // Wrap ship position
      newState.ship.x = wrapPosition(newState.ship.x, CANVAS_WIDTH);
      newState.ship.y = wrapPosition(newState.ship.y, CANVAS_HEIGHT);

      // Update ship invulnerability
      if (newState.ship.invulnerable > 0) {
        newState.ship.invulnerable--;
      }

      // Update asteroids
      newState.asteroids.forEach(asteroid => {
        asteroid.x += asteroid.vx;
        asteroid.y += asteroid.vy;
        asteroid.rotation += asteroid.rotationSpeed;
        
        asteroid.x = wrapPosition(asteroid.x, CANVAS_WIDTH);
        asteroid.y = wrapPosition(asteroid.y, CANVAS_HEIGHT);
      });

      // Update bullets
      newState.bullets = newState.bullets.filter(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        bullet.life--;
        
        bullet.x = wrapPosition(bullet.x, CANVAS_WIDTH);
        bullet.y = wrapPosition(bullet.y, CANVAS_HEIGHT);
        
        return bullet.life > 0;
      });

      // Bullet-asteroid collisions
      for (let i = newState.bullets.length - 1; i >= 0; i--) {
        const bullet = newState.bullets[i];
        
        for (let j = newState.asteroids.length - 1; j >= 0; j--) {
          const asteroid = newState.asteroids[j];
          
          if (checkCollision(bullet.x, bullet.y, 2, asteroid.x, asteroid.y, asteroid.size * 15)) {
            // Remove bullet
            newState.bullets.splice(i, 1);
            
            // Add explosion particles
            newState.particles.push(...createParticles(asteroid.x, asteroid.y, '#ffff00', 12));
            
            // Score based on asteroid size
            const points = (4 - asteroid.size) * 100;
            newState.score += points;
            
            // Split asteroid if large enough
            if (asteroid.size > 1) {
              const newSize = asteroid.size - 1;
              for (let k = 0; k < 2; k++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 2;
                newState.asteroids.push(createAsteroid(
                  asteroid.x + Math.cos(angle) * 20,
                  asteroid.y + Math.sin(angle) * 20,
                  newSize
                ));
              }
            }
            
            // Remove asteroid
            newState.asteroids.splice(j, 1);
            break;
          }
        }
      }

      // Ship-asteroid collisions
      if (newState.ship.invulnerable === 0) {
        for (const asteroid of newState.asteroids) {
          if (checkCollision(newState.ship.x, newState.ship.y, SHIP_SIZE, asteroid.x, asteroid.y, asteroid.size * 15)) {
            newState.lives--;
            newState.ship.invulnerable = 120; // 2 seconds at 60fps
            
            // Add explosion particles
            newState.particles.push(...createParticles(newState.ship.x, newState.ship.y, '#ff0000', 16));
            
            // Reset ship position and velocity
            newState.ship.x = CANVAS_WIDTH / 2;
            newState.ship.y = CANVAS_HEIGHT / 2;
            newState.ship.vx = 0;
            newState.ship.vy = 0;
            newState.ship.angle = 0;
            
            if (newState.lives <= 0) {
              newState.gameOver = true;
            }
            break;
          }
        }
      }

      // Check level completion
      if (newState.asteroids.length === 0 && !newState.levelComplete) {
        newState.levelComplete = true;
        newState.score += 1000 * newState.level; // Level completion bonus
      }

      // Update particles
      newState.particles = newState.particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        return particle.life > 0;
      });

      return newState;
    });
  }, [gameState.gameOver, createAsteroid]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with space background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    ctx.fillStyle = 'white';
    for (let i = 0; i < 100; i++) {
      const x = (i * 37) % canvas.width;
      const y = (i * 73) % canvas.height;
      const size = Math.sin(i) > 0.8 ? 2 : 1;
      ctx.fillRect(x, y, size, size);
    }

    // Draw ship
    if (gameState.ship.invulnerable === 0 || Math.floor(gameState.ship.invulnerable / 10) % 2 === 0) {
      ctx.save();
      ctx.translate(gameState.ship.x, gameState.ship.y);
      ctx.rotate(gameState.ship.angle);
      
      ctx.strokeStyle = gameState.ship.thrusting ? '#00ffff' : '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(SHIP_SIZE, 0);
      ctx.lineTo(-SHIP_SIZE, -SHIP_SIZE / 2);
      ctx.lineTo(-SHIP_SIZE / 2, 0);
      ctx.lineTo(-SHIP_SIZE, SHIP_SIZE / 2);
      ctx.closePath();
      ctx.stroke();
      
      if (gameState.ship.thrusting) {
        ctx.strokeStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(-SHIP_SIZE, -SHIP_SIZE / 4);
        ctx.lineTo(-SHIP_SIZE * 1.5, 0);
        ctx.lineTo(-SHIP_SIZE, SHIP_SIZE / 4);
        ctx.stroke();
      }
      
      ctx.restore();
    }

    // Draw asteroids
    gameState.asteroids.forEach(asteroid => {
      ctx.save();
      ctx.translate(asteroid.x, asteroid.y);
      ctx.rotate(asteroid.rotation);
      
      ctx.strokeStyle = '#888888';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(asteroid.points[0].x, asteroid.points[0].y);
      for (let i = 1; i < asteroid.points.length; i++) {
        ctx.lineTo(asteroid.points[i].x, asteroid.points[i].y);
      }
      ctx.closePath();
      ctx.stroke();
      
      ctx.restore();
    });

    // Draw bullets
    ctx.fillStyle = '#ffff00';
    gameState.bullets.forEach(bullet => {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw particles
    gameState.particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw UI
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${gameState.score}`, 20, 30);
    ctx.fillText(`Lives: ${gameState.lives}`, 20, 55);
    ctx.fillText(`Level: ${gameState.level}`, 20, 80);

    if (gameState.levelComplete) {
      ctx.fillStyle = 'rgba(0, 100, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#00FF00';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Level Complete!', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.fillStyle = '#ffff00';
      ctx.font = '24px Arial';
      ctx.fillText(`Bonus: ${1000 * gameState.level}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText('Press N for next level', canvas.width / 2, canvas.height / 2 + 50);
    }

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#FF0000';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.fillStyle = '#ffff00';
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 50);
    }

    // Draw instructions
    if (!gameState.gameOver && !gameState.levelComplete) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '14px Arial';
      ctx.textAlign = 'right';
      ctx.fillText('WASD/Arrows: Move & Rotate', canvas.width - 10, canvas.height - 40);
      ctx.fillText('Space/S: Shoot', canvas.width - 10, canvas.height - 20);
    }
  }, [gameState]);

  const nextLevel = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      level: prev.level + 1,
      asteroids: initializeLevel(prev.level + 1),
      levelComplete: false,
      ship: {
        ...prev.ship,
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        vx: 0,
        vy: 0,
        angle: 0,
        invulnerable: 60
      }
    }));
  }, [initializeLevel]);

  useEffect(() => {
    setGameState(prev => ({
      ...prev,
      asteroids: initializeLevel(1)
    }));
  }, [initializeLevel]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' && gameState.gameOver) {
        setGameState({
          ship: {
            x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, angle: 0, vx: 0, vy: 0,
            thrusting: false, invulnerable: 0
          },
          asteroids: initializeLevel(1), bullets: [], particles: [],
          score: 0, lives: 3, level: 1, gameOver: false, levelComplete: false, lastShot: 0
        });
        return;
      }
      
      if (e.key === 'n' && gameState.levelComplete) {
        nextLevel();
        return;
      }
      
      keysRef.current.add(e.key.toLowerCase());
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
  }, [gameState.gameOver, gameState.levelComplete, initializeLevel, nextLevel]);

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
      gameTitle="Asteroid Blaster" 
      gameCategory="Classic space shooter"
      showMobileControls={true}
    >
      <div className="flex flex-col items-center gap-4 p-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-gray-600 bg-black rounded-lg max-w-full h-auto"
        />
        <div className="text-center text-gray-300">
          <p>WASD/Arrows: Rotate & Thrust | Space/S: Shoot | R: Restart | N: Next Level</p>
          <p className="text-sm text-yellow-400">Destroy all asteroids to complete each level!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default AsteroidBlaster;
