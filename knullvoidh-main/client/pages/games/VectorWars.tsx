import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Ship {
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
  thrust: boolean;
  size: number;
}

interface Enemy {
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
  type: 'interceptor' | 'fighter' | 'bomber';
  health: number;
  shootTimer: number;
  aiTimer: number;
  size: number;
  points: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  friendly: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

const VectorWars: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [ship, setShip] = useState<Ship>({
    x: 400,
    y: 300,
    angle: 0,
    vx: 0,
    vy: 0,
    thrust: false,
    size: 15
  });
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [invulnerable, setInvulnerable] = useState(0);

  const gameLoopRef = useRef<number>();
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const FRICTION = 0.98;
  const THRUST = 0.3;

  // Spawn enemies
  const spawnEnemies = useCallback(() => {
    if (enemies.length < 5 + level && Math.random() < 0.01) {
      const types = ['interceptor', 'fighter', 'bomber'] as const;
      const type = types[Math.floor(Math.random() * types.length)];
      
      const configs = {
        interceptor: { health: 1, size: 12, points: 100 },
        fighter: { health: 2, size: 16, points: 200 },
        bomber: { health: 4, size: 24, points: 400 }
      };

      const angle = Math.random() * Math.PI * 2;
      const distance = CANVAS_WIDTH;
      
      setEnemies(prev => [...prev, {
        x: CANVAS_WIDTH / 2 + Math.cos(angle) * distance,
        y: CANVAS_HEIGHT / 2 + Math.sin(angle) * distance,
        angle: angle + Math.PI,
        vx: 0,
        vy: 0,
        type,
        health: configs[type].health,
        shootTimer: 0,
        aiTimer: 0,
        size: configs[type].size,
        points: configs[type].points
      }]);
    }
  }, [enemies.length, level]);

  // Create explosion particles
  const createExplosion = useCallback((x: number, y: number, count: number = 12) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 60,
        maxLife: 60
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Handle input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => new Set([...prev, e.key.toLowerCase()]));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(e.key.toLowerCase());
        return newKeys;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      // Update ship
      setShip(prev => {
        let newShip = { ...prev };
        
        // Rotation
        if (keys.has('a') || keys.has('arrowleft')) {
          newShip.angle -= 0.1;
        }
        if (keys.has('d') || keys.has('arrowright')) {
          newShip.angle += 0.1;
        }
        
        // Thrust
        newShip.thrust = keys.has('w') || keys.has('arrowup');
        if (newShip.thrust) {
          newShip.vx += Math.cos(newShip.angle) * THRUST;
          newShip.vy += Math.sin(newShip.angle) * THRUST;
        }
        
        // Apply friction
        newShip.vx *= FRICTION;
        newShip.vy *= FRICTION;
        
        // Update position
        newShip.x += newShip.vx;
        newShip.y += newShip.vy;
        
        // Wrap around screen
        if (newShip.x < 0) newShip.x = CANVAS_WIDTH;
        if (newShip.x > CANVAS_WIDTH) newShip.x = 0;
        if (newShip.y < 0) newShip.y = CANVAS_HEIGHT;
        if (newShip.y > CANVAS_HEIGHT) newShip.y = 0;
        
        return newShip;
      });

      // Shooting
      if (keys.has(' ')) {
        setBullets(prev => {
          const playerBullets = prev.filter(b => b.friendly);
          if (playerBullets.length < 4) {
            return [...prev, {
              x: ship.x + Math.cos(ship.angle) * ship.size,
              y: ship.y + Math.sin(ship.angle) * ship.size,
              vx: Math.cos(ship.angle) * 8 + ship.vx,
              vy: Math.sin(ship.angle) * 8 + ship.vy,
              life: 120,
              friendly: true
            }];
          }
          return prev;
        });
      }

      // Update enemies
      setEnemies(prev => prev.map(enemy => {
        let newEnemy = { ...enemy };
        
        // AI behavior
        newEnemy.aiTimer++;
        if (newEnemy.aiTimer > 30) {
          const dx = ship.x - enemy.x;
          const dy = ship.y - enemy.y;
          const targetAngle = Math.atan2(dy, dx);
          
          // Turn towards player
          let angleDiff = targetAngle - enemy.angle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          
          if (Math.abs(angleDiff) > 0.1) {
            newEnemy.angle += Math.sign(angleDiff) * 0.05;
          }
          
          // Move forward
          if (enemy.type === 'interceptor') {
            newEnemy.vx += Math.cos(enemy.angle) * 0.2;
            newEnemy.vy += Math.sin(enemy.angle) * 0.2;
          } else if (enemy.type === 'fighter') {
            newEnemy.vx += Math.cos(enemy.angle) * 0.15;
            newEnemy.vy += Math.sin(enemy.angle) * 0.15;
          } else {
            newEnemy.vx += Math.cos(enemy.angle) * 0.1;
            newEnemy.vy += Math.sin(enemy.angle) * 0.1;
          }
          
          newEnemy.aiTimer = 0;
        }
        
        // Apply friction
        newEnemy.vx *= 0.99;
        newEnemy.vy *= 0.99;
        
        // Update position
        newEnemy.x += newEnemy.vx;
        newEnemy.y += newEnemy.vy;
        
        // Wrap around screen
        if (newEnemy.x < -50) newEnemy.x = CANVAS_WIDTH + 50;
        if (newEnemy.x > CANVAS_WIDTH + 50) newEnemy.x = -50;
        if (newEnemy.y < -50) newEnemy.y = CANVAS_HEIGHT + 50;
        if (newEnemy.y > CANVAS_HEIGHT + 50) newEnemy.y = -50;
        
        // Enemy shooting
        newEnemy.shootTimer--;
        if (newEnemy.shootTimer <= 0) {
          const distance = Math.sqrt((ship.x - enemy.x) ** 2 + (ship.y - enemy.y) ** 2);
          if (distance < 200 && Math.random() < 0.02) {
            setBullets(bullets => [...bullets, {
              x: enemy.x + Math.cos(enemy.angle) * enemy.size,
              y: enemy.y + Math.sin(enemy.angle) * enemy.size,
              vx: Math.cos(enemy.angle) * 5,
              vy: Math.sin(enemy.angle) * 5,
              life: 100,
              friendly: false
            }]);
            newEnemy.shootTimer = enemy.type === 'interceptor' ? 60 : enemy.type === 'fighter' ? 40 : 80;
          }
        }
        
        return newEnemy;
      }));

      // Update bullets
      setBullets(prev => prev
        .map(bullet => ({
          ...bullet,
          x: bullet.x + bullet.vx,
          y: bullet.y + bullet.vy,
          life: bullet.life - 1
        }))
        .filter(bullet => bullet.life > 0)
        .map(bullet => ({
          ...bullet,
          x: bullet.x < 0 ? CANVAS_WIDTH : bullet.x > CANVAS_WIDTH ? 0 : bullet.x,
          y: bullet.y < 0 ? CANVAS_HEIGHT : bullet.y > CANVAS_HEIGHT ? 0 : bullet.y
        }))
      );

      // Update particles
      setParticles(prev => prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          life: particle.life - 1,
          vx: particle.vx * 0.98,
          vy: particle.vy * 0.98
        }))
        .filter(particle => particle.life > 0)
      );

      // Spawn enemies
      spawnEnemies();

      // Collision detection
      setBullets(prevBullets => {
        let newBullets = [...prevBullets];
        
        setEnemies(prevEnemies => {
          let newEnemies = [...prevEnemies];
          
          newBullets = newBullets.filter(bullet => {
            if (bullet.friendly) {
              const hitIndex = newEnemies.findIndex(enemy => {
                const dx = enemy.x - bullet.x;
                const dy = enemy.y - bullet.y;
                return Math.sqrt(dx * dx + dy * dy) < enemy.size;
              });
              
              if (hitIndex !== -1) {
                const enemy = newEnemies[hitIndex];
                enemy.health--;
                
                if (enemy.health <= 0) {
                  setScore(s => s + enemy.points);
                  createExplosion(enemy.x, enemy.y, 8);
                  newEnemies.splice(hitIndex, 1);
                } else {
                  createExplosion(bullet.x, bullet.y, 4);
                }
                
                return false;
              }
            } else {
              // Enemy bullet hit player
              if (invulnerable === 0) {
                const dx = ship.x - bullet.x;
                const dy = ship.y - bullet.y;
                if (Math.sqrt(dx * dx + dy * dy) < ship.size) {
                  setLives(prev => prev - 1);
                  setInvulnerable(120);
                  createExplosion(ship.x, ship.y, 12);
                  return false;
                }
              }
            }
            return true;
          });
          
          return newEnemies;
        });
        
        return newBullets;
      });

      // Enemy-ship collision
      setInvulnerable(prev => Math.max(0, prev - 1));
      if (invulnerable === 0) {
        const collision = enemies.some(enemy => {
          const dx = enemy.x - ship.x;
          const dy = enemy.y - ship.y;
          return Math.sqrt(dx * dx + dy * dy) < (enemy.size + ship.size);
        });
        
        if (collision) {
          setLives(prev => prev - 1);
          setInvulnerable(120);
          createExplosion(ship.x, ship.y, 12);
        }
      }

      // Game over
      if (lives <= 0) {
        setGameState('gameOver');
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, ship, enemies, bullets, keys, lives, invulnerable, spawnEnemies, createExplosion]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with space background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid background
    ctx.strokeStyle = '#002200';
    ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = 0; x <= CANVAS_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Draw particles
    particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.strokeStyle = `rgba(0, 255, 157, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(particle.x, particle.y);
      ctx.lineTo(particle.x - particle.vx * 2, particle.y - particle.vy * 2);
      ctx.stroke();
    });

    // Draw enemies
    enemies.forEach(enemy => {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(enemy.angle);
      
      ctx.strokeStyle = enemy.type === 'interceptor' ? '#ff0099' : 
                        enemy.type === 'fighter' ? '#7000ff' : '#ff6600';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      if (enemy.type === 'interceptor') {
        ctx.moveTo(enemy.size, 0);
        ctx.lineTo(-enemy.size/2, -enemy.size/2);
        ctx.lineTo(-enemy.size/3, 0);
        ctx.lineTo(-enemy.size/2, enemy.size/2);
        ctx.closePath();
      } else if (enemy.type === 'fighter') {
        ctx.moveTo(enemy.size, 0);
        ctx.lineTo(-enemy.size/2, -enemy.size/3);
        ctx.lineTo(-enemy.size/4, 0);
        ctx.lineTo(-enemy.size/2, enemy.size/3);
        ctx.closePath();
      } else {
        ctx.rect(-enemy.size/2, -enemy.size/2, enemy.size, enemy.size);
      }
      ctx.stroke();
      
      ctx.restore();
    });

    // Draw bullets
    bullets.forEach(bullet => {
      ctx.strokeStyle = bullet.friendly ? '#00ffff' : '#ff4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bullet.x, bullet.y);
      ctx.lineTo(bullet.x - bullet.vx, bullet.y - bullet.vy);
      ctx.stroke();
    });

    // Draw ship
    if (invulnerable === 0 || Math.floor(Date.now() / 100) % 2) {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);
      
      ctx.strokeStyle = '#0aff9d';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.moveTo(ship.size, 0);
      ctx.lineTo(-ship.size/2, -ship.size/2);
      ctx.lineTo(-ship.size/3, 0);
      ctx.lineTo(-ship.size/2, ship.size/2);
      ctx.closePath();
      ctx.stroke();
      
      // Thrust effect
      if (ship.thrust) {
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-ship.size/3, -3);
        ctx.lineTo(-ship.size - 5, 0);
        ctx.lineTo(-ship.size/3, 3);
        ctx.stroke();
      }
      
      ctx.restore();
    }

    // UI
    ctx.fillStyle = '#00ff00';
    ctx.font = '18px monospace';
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Lives: ${lives}`, 20, 55);
    ctx.fillText(`Level: ${level}`, 20, 80);

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3;
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.strokeText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.textAlign = 'left';
    }
  });

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setShip({
      x: 400,
      y: 300,
      angle: 0,
      vx: 0,
      vy: 0,
      thrust: false,
      size: 15
    });
    setEnemies([]);
    setBullets([]);
    setParticles([]);
    setInvulnerable(0);
    setGameState('playing');
  };

  return (
    <GameLayout
      gameTitle="Vector Wars"
      gameCategory="Action"
      score={score}
      isPlaying={gameState === 'playing'}
      onPause={handlePause}
      onReset={handleReset}
    >
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border border-neon-green/50 rounded-lg bg-black/20 backdrop-blur-sm shadow-2xl max-w-full h-auto"
            style={{ touchAction: 'none' }}
          />
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>A/D to turn • W to thrust • Space to shoot • Classic vector combat!</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default VectorWars;
