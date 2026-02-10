import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Player {
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'square' | 'diamond' | 'triangle' | 'circle';
  size: number;
  health: number;
  points: number;
  color: string;
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
  color: string;
}

const GeometryWarsRetro: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [lives, setLives] = useState(3);
  const [player, setPlayer] = useState<Player>({ x: 400, y: 300, angle: 0, vx: 0, vy: 0 });
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [shootTimer, setShootTimer] = useState(0);

  const gameLoopRef = useRef<number>();
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const FRICTION = 0.95;
  const THRUST = 0.3;

  // Spawn enemies
  const spawnEnemy = useCallback(() => {
    if (enemies.length < 20 && Math.random() < 0.02) {
      const side = Math.floor(Math.random() * 4);
      let x, y;
      
      switch (side) {
        case 0: x = Math.random() * CANVAS_WIDTH; y = -20; break;
        case 1: x = CANVAS_WIDTH + 20; y = Math.random() * CANVAS_HEIGHT; break;
        case 2: x = Math.random() * CANVAS_WIDTH; y = CANVAS_HEIGHT + 20; break;
        default: x = -20; y = Math.random() * CANVAS_HEIGHT; break;
      }
      
      const types = ['square', 'diamond', 'triangle', 'circle'] as const;
      const type = types[Math.floor(Math.random() * types.length)];
      const colors = ['#ff0099', '#0aff9d', '#7000ff', '#ffff00', '#ff6600'];
      
      setEnemies(prev => [...prev, {
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        type,
        size: 15 + Math.random() * 15,
        health: type === 'circle' ? 3 : type === 'square' ? 2 : 1,
        points: type === 'circle' ? 150 : type === 'square' ? 100 : 50,
        color: colors[Math.floor(Math.random() * colors.length)]
      }]);
    }
  }, [enemies.length]);

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

  // Touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    if (x < centerX - 50) setKeys(prev => new Set([...prev, 'a']));
    else if (x > centerX + 50) setKeys(prev => new Set([...prev, 'd']));
    
    if (y < centerY - 50) setKeys(prev => new Set([...prev, 'w']));
    else if (y > centerY + 50) setKeys(prev => new Set([...prev, 's']));
    
    setKeys(prev => new Set([...prev, ' ']));
  };

  const handleTouchEnd = () => {
    setKeys(new Set());
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      // Update player
      setPlayer(prev => {
        let newPlayer = { ...prev };
        
        // Movement
        if (keys.has('w') || keys.has('arrowup')) {
          newPlayer.vy -= THRUST;
        }
        if (keys.has('s') || keys.has('arrowdown')) {
          newPlayer.vy += THRUST;
        }
        if (keys.has('a') || keys.has('arrowleft')) {
          newPlayer.vx -= THRUST;
        }
        if (keys.has('d') || keys.has('arrowright')) {
          newPlayer.vx += THRUST;
        }

        // Apply friction
        newPlayer.vx *= FRICTION;
        newPlayer.vy *= FRICTION;

        // Update position
        newPlayer.x += newPlayer.vx;
        newPlayer.y += newPlayer.vy;

        // Wrap around screen
        if (newPlayer.x < 0) newPlayer.x = CANVAS_WIDTH;
        if (newPlayer.x > CANVAS_WIDTH) newPlayer.x = 0;
        if (newPlayer.y < 0) newPlayer.y = CANVAS_HEIGHT;
        if (newPlayer.y > CANVAS_HEIGHT) newPlayer.y = 0;

        return newPlayer;
      });

      // Player shooting
      setShootTimer(prev => Math.max(0, prev - 1));
      if (keys.has(' ') && shootTimer === 0) {
        setBullets(prev => [...prev, {
          x: player.x,
          y: player.y,
          vx: Math.cos(player.angle) * 8,
          vy: Math.sin(player.angle) * 8,
          life: 100
        }]);
        setShootTimer(5);
      }

      // Update bullets
      setBullets(prev => prev
        .map(bullet => ({
          ...bullet,
          x: bullet.x + bullet.vx,
          y: bullet.y + bullet.vy,
          life: bullet.life - 1
        }))
        .filter(bullet => bullet.life > 0 && 
          bullet.x > -10 && bullet.x < CANVAS_WIDTH + 10 &&
          bullet.y > -10 && bullet.y < CANVAS_HEIGHT + 10)
      );

      // Update enemies
      setEnemies(prev => prev.map(enemy => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Move towards player
        if (distance > 0) {
          enemy.vx += (dx / distance) * 0.1;
          enemy.vy += (dy / distance) * 0.1;
        }
        
        // Limit speed
        const speed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
        if (speed > 2) {
          enemy.vx = (enemy.vx / speed) * 2;
          enemy.vy = (enemy.vy / speed) * 2;
        }
        
        return {
          ...enemy,
          x: enemy.x + enemy.vx,
          y: enemy.y + enemy.vy
        };
      }));

      // Spawn enemies
      spawnEnemy();

      // Collision detection
      setBullets(prevBullets => {
        let newBullets = [...prevBullets];
        
        setEnemies(prevEnemies => {
          let newEnemies = [...prevEnemies];
          
          newBullets = newBullets.filter(bullet => {
            const hitEnemyIndex = newEnemies.findIndex(enemy => {
              const dx = enemy.x - bullet.x;
              const dy = enemy.y - bullet.y;
              return Math.sqrt(dx * dx + dy * dy) < enemy.size;
            });
            
            if (hitEnemyIndex !== -1) {
              const enemy = newEnemies[hitEnemyIndex];
              enemy.health--;
              
              // Create explosion particles
              for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                setParticles(particles => [...particles, {
                  x: enemy.x,
                  y: enemy.y,
                  vx: Math.cos(angle) * 3,
                  vy: Math.sin(angle) * 3,
                  life: 30,
                  color: enemy.color
                }]);
              }
              
              if (enemy.health <= 0) {
                setScore(s => s + enemy.points * multiplier);
                setMultiplier(m => Math.min(m + 0.1, 10));
                newEnemies.splice(hitEnemyIndex, 1);
              }
              
              return false;
            }
            return true;
          });
          
          return newEnemies;
        });
        
        return newBullets;
      });

      // Check player collision with enemies
      const playerHit = enemies.some(enemy => {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        return Math.sqrt(dx * dx + dy * dy) < enemy.size + 15;
      });

      if (playerHit) {
        setLives(prev => prev - 1);
        setMultiplier(1);
        
        // Invincibility period
        setEnemies(prev => prev.filter(enemy => {
          const dx = enemy.x - player.x;
          const dy = enemy.y - player.y;
          return Math.sqrt(dx * dx + dy * dy) > 100;
        }));
      }

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

      // Game over check
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
  }, [gameState, player, enemies, bullets, keys, lives, shootTimer, spawnEnemy, multiplier]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid background
    ctx.strokeStyle = '#111122';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < CANVAS_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Draw particles
    particles.forEach(particle => {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.life / 30;
      ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
    });
    ctx.globalAlpha = 1;

    // Draw enemies
    enemies.forEach(enemy => {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.fillStyle = enemy.color;
      ctx.shadowColor = enemy.color;
      ctx.shadowBlur = 10;
      
      ctx.beginPath();
      if (enemy.type === 'square') {
        ctx.rect(-enemy.size/2, -enemy.size/2, enemy.size, enemy.size);
      } else if (enemy.type === 'diamond') {
        ctx.moveTo(0, -enemy.size/2);
        ctx.lineTo(enemy.size/2, 0);
        ctx.lineTo(0, enemy.size/2);
        ctx.lineTo(-enemy.size/2, 0);
        ctx.closePath();
      } else if (enemy.type === 'triangle') {
        ctx.moveTo(0, -enemy.size/2);
        ctx.lineTo(enemy.size/2, enemy.size/2);
        ctx.lineTo(-enemy.size/2, enemy.size/2);
        ctx.closePath();
      } else {
        ctx.arc(0, 0, enemy.size/2, 0, Math.PI * 2);
      }
      ctx.fill();
      
      ctx.shadowBlur = 0;
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

    // Draw player
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Lives: ${lives}`, 20, 55);
    ctx.fillText(`Multiplier: x${multiplier.toFixed(1)}`, 20, 80);

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

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore(0);
    setMultiplier(1);
    setLives(3);
    setPlayer({ x: 400, y: 300, angle: 0, vx: 0, vy: 0 });
    setEnemies([]);
    setBullets([]);
    setParticles([]);
    setShootTimer(0);
    setGameState('playing');
  };

  return (
    <GameLayout
      gameTitle="Geometry Wars: Retro Evolved"
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
            className="border border-neon-purple/50 rounded-lg bg-black/20 backdrop-blur-sm shadow-2xl max-w-full h-auto"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }}
          />
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p className="md:hidden">Touch to move and shoot</p>
            <p className="hidden md:block">WASD to move • Space to shoot • Survive the geometric chaos!</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default GeometryWarsRetro;
