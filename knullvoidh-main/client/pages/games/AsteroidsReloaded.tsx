import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Ship {
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
  thrust: boolean;
}

interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: 'large' | 'medium' | 'small';
  rotation: number;
  rotationSpeed: number;
  points: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface PowerUp {
  x: number;
  y: number;
  type: 'rapid' | 'shield' | 'triple';
  timer: number;
}

const AsteroidsReloaded: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [ship, setShip] = useState<Ship>({ x: 400, y: 300, angle: 0, vx: 0, vy: 0, thrust: false });
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [invulnerable, setInvulnerable] = useState(0);
  const [shipPower, setShipPower] = useState({ rapid: false, shield: false, triple: false });

  const gameLoopRef = useRef<number>();
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const FRICTION = 0.99;
  const THRUST = 0.2;
  const TURN_SPEED = 0.1;

  // Generate asteroids for level
  const spawnAsteroids = useCallback(() => {
    const newAsteroids: Asteroid[] = [];
    const count = 4 + level;
    
    for (let i = 0; i < count; i++) {
      let x, y;
      do {
        x = Math.random() * CANVAS_WIDTH;
        y = Math.random() * CANVAS_HEIGHT;
      } while (Math.sqrt((x - ship.x) ** 2 + (y - ship.y) ** 2) < 100);
      
      newAsteroids.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: 'large',
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        points: 20
      });
    }
    
    setAsteroids(newAsteroids);
  }, [level, ship.x, ship.y]);

  // Break asteroid into smaller pieces
  const breakAsteroid = useCallback((asteroid: Asteroid): Asteroid[] => {
    if (asteroid.size === 'small') return [];
    
    const newSize = asteroid.size === 'large' ? 'medium' : 'small';
    const pieces: Asteroid[] = [];
    
    for (let i = 0; i < 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      pieces.push({
        x: asteroid.x + Math.cos(angle) * 20,
        y: asteroid.y + Math.sin(angle) * 20,
        vx: asteroid.vx + Math.cos(angle) * 2,
        vy: asteroid.vy + Math.sin(angle) * 2,
        size: newSize,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        points: newSize === 'medium' ? 50 : 100
      });
    }
    
    return pieces;
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
          newShip.angle -= TURN_SPEED;
        }
        if (keys.has('d') || keys.has('arrowright')) {
          newShip.angle += TURN_SPEED;
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
          if (prev.filter(b => b.life > 95).length < (shipPower.rapid ? 8 : 4)) {
            const newBullets = [{
              x: ship.x + Math.cos(ship.angle) * 20,
              y: ship.y + Math.sin(ship.angle) * 20,
              vx: Math.cos(ship.angle) * 8 + ship.vx,
              vy: Math.sin(ship.angle) * 8 + ship.vy,
              life: 100
            }];
            
            if (shipPower.triple) {
              newBullets.push({
                x: ship.x + Math.cos(ship.angle - 0.3) * 20,
                y: ship.y + Math.sin(ship.angle - 0.3) * 20,
                vx: Math.cos(ship.angle - 0.3) * 8 + ship.vx,
                vy: Math.sin(ship.angle - 0.3) * 8 + ship.vy,
                life: 100
              });
              newBullets.push({
                x: ship.x + Math.cos(ship.angle + 0.3) * 20,
                y: ship.y + Math.sin(ship.angle + 0.3) * 20,
                vx: Math.cos(ship.angle + 0.3) * 8 + ship.vx,
                vy: Math.sin(ship.angle + 0.3) * 8 + ship.vy,
                life: 100
              });
            }
            
            return [...prev, ...newBullets];
          }
          return prev;
        });
      }

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

      // Update asteroids
      setAsteroids(prev => prev.map(asteroid => ({
        ...asteroid,
        x: (asteroid.x + asteroid.vx + CANVAS_WIDTH) % CANVAS_WIDTH,
        y: (asteroid.y + asteroid.vy + CANVAS_HEIGHT) % CANVAS_HEIGHT,
        rotation: asteroid.rotation + asteroid.rotationSpeed
      })));

      // Collision detection
      setBullets(prevBullets => {
        let newBullets = [...prevBullets];
        
        setAsteroids(prevAsteroids => {
          let newAsteroids = [...prevAsteroids];
          
          newBullets = newBullets.filter(bullet => {
            const hitIndex = newAsteroids.findIndex(asteroid => {
              const dx = asteroid.x - bullet.x;
              const dy = asteroid.y - bullet.y;
              const size = asteroid.size === 'large' ? 40 : asteroid.size === 'medium' ? 25 : 15;
              return Math.sqrt(dx * dx + dy * dy) < size;
            });
            
            if (hitIndex !== -1) {
              const hitAsteroid = newAsteroids[hitIndex];
              setScore(s => s + hitAsteroid.points);
              
              // Break asteroid
              const pieces = breakAsteroid(hitAsteroid);
              newAsteroids.splice(hitIndex, 1, ...pieces);
              
              // Power-up chance
              if (Math.random() < 0.1) {
                setPowerUps(powers => [...powers, {
                  x: hitAsteroid.x,
                  y: hitAsteroid.y,
                  type: ['rapid', 'shield', 'triple'][Math.floor(Math.random() * 3)] as 'rapid' | 'shield' | 'triple',
                  timer: 600
                }]);
              }
              
              return false;
            }
            return true;
          });
          
          return newAsteroids;
        });
        
        return newBullets;
      });

      // Check ship-asteroid collision
      setInvulnerable(prev => Math.max(0, prev - 1));
      if (invulnerable === 0 && !shipPower.shield) {
        const collision = asteroids.some(asteroid => {
          const dx = asteroid.x - ship.x;
          const dy = asteroid.y - ship.y;
          const size = asteroid.size === 'large' ? 40 : asteroid.size === 'medium' ? 25 : 15;
          return Math.sqrt(dx * dx + dy * dy) < size + 10;
        });
        
        if (collision) {
          setLives(prev => prev - 1);
          setInvulnerable(120);
          setShipPower({ rapid: false, shield: false, triple: false });
        }
      }

      // Update power-ups
      setPowerUps(prev => prev.map(power => ({ ...power, timer: power.timer - 1 })).filter(power => power.timer > 0));

      // Check level completion
      if (asteroids.length === 0) {
        setLevel(prev => prev + 1);
        setScore(prev => prev + 1000);
        spawnAsteroids();
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
  }, [gameState, ship, asteroids, bullets, keys, lives, invulnerable, shipPower, spawnAsteroids, breakAsteroid]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Space background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Stars
    for (let i = 0; i < 200; i++) {
      const x = (i * 37) % CANVAS_WIDTH;
      const y = (i * 73) % CANVAS_HEIGHT;
      const brightness = Math.sin(Date.now() * 0.001 + i) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.3})`;
      ctx.fillRect(x, y, 1, 1);
    }

    // Draw asteroids
    asteroids.forEach(asteroid => {
      ctx.save();
      ctx.translate(asteroid.x, asteroid.y);
      ctx.rotate(asteroid.rotation);
      
      const size = asteroid.size === 'large' ? 40 : asteroid.size === 'medium' ? 25 : 15;
      const sides = 8;
      
      ctx.strokeStyle = '#888888';
      ctx.fillStyle = '#444444';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2;
        const radius = size + Math.sin(i + asteroid.rotation * 2) * 5;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      ctx.restore();
    });

    // Draw bullets
    bullets.forEach(bullet => {
      ctx.fillStyle = '#ffff00';
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 5;
      ctx.fillRect(bullet.x - 2, bullet.y - 2, 4, 4);
      ctx.shadowBlur = 0;
    });

    // Draw power-ups
    powerUps.forEach(power => {
      const colors = { rapid: '#ff0000', shield: '#00ff00', triple: '#0000ff' };
      ctx.fillStyle = colors[power.type];
      ctx.shadowColor = colors[power.type];
      ctx.shadowBlur = 10;
      ctx.fillRect(power.x - 8, power.y - 8, 16, 16);
      ctx.shadowBlur = 0;
    });

    // Draw ship
    if (invulnerable === 0 || Math.floor(Date.now() / 100) % 2) {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);
      
      ctx.strokeStyle = shipPower.shield ? '#00ff00' : '#00ffff';
      ctx.fillStyle = shipPower.shield ? '#004400' : '#004444';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(-10, -8);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-10, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Thrust effect
      if (ship.thrust) {
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.moveTo(-10, -4);
        ctx.lineTo(-20, 0);
        ctx.lineTo(-10, 4);
        ctx.closePath();
        ctx.fill();
      }
      
      ctx.restore();
    }

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Lives: ${lives}`, 20, 55);
    ctx.fillText(`Level: ${level}`, 20, 80);

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ff0000';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.textAlign = 'left';
    }
  });

  useEffect(() => {
    spawnAsteroids();
  }, [spawnAsteroids]);

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setShip({ x: 400, y: 300, angle: 0, vx: 0, vy: 0, thrust: false });
    setAsteroids([]);
    setBullets([]);
    setPowerUps([]);
    setInvulnerable(0);
    setShipPower({ rapid: false, shield: false, triple: false });
    spawnAsteroids();
    setGameState('playing');
  };

  return (
    <GameLayout
      gameTitle="Asteroids Reloaded"
      gameCategory="Arcade"
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
            <p>A/D to turn • W to thrust • Space to shoot • Destroy all asteroids!</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default AsteroidsReloaded;
