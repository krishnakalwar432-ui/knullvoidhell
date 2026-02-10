import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  shield: number;
  maxShield: number;
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'fighter' | 'bomber' | 'cruiser' | 'boss';
  health: number;
  maxHealth: number;
  size: number;
  shootTimer: number;
  points: number;
  color: string;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  friendly: boolean;
  type: 'laser' | 'plasma' | 'missile';
}

interface PowerUp {
  x: number;
  y: number;
  type: 'shield' | 'weapon' | 'speed' | 'health';
  timer: number;
}

interface Star {
  x: number;
  y: number;
  speed: number;
  brightness: number;
}

const SuperStarShooter: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [player, setPlayer] = useState<Player>({
    x: 400,
    y: 500,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    shield: 100,
    maxShield: 100
  });
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [stars, setStars] = useState<Star[]>([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [weaponLevel, setWeaponLevel] = useState(1);
  const [shootTimer, setShootTimer] = useState(0);

  const gameLoopRef = useRef<number>();
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  // Initialize stars
  useEffect(() => {
    const newStars: Star[] = [];
    for (let i = 0; i < 100; i++) {
      newStars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        speed: 1 + Math.random() * 3,
        brightness: Math.random()
      });
    }
    setStars(newStars);
  }, []);

  // Spawn enemies
  const spawnEnemies = useCallback(() => {
    if (enemies.length < 8 + level * 2 && Math.random() < 0.02) {
      const types = ['fighter', 'bomber', 'cruiser', 'boss'] as const;
      const type = level > 5 && Math.random() < 0.1 ? 'boss' : 
                   level > 3 && Math.random() < 0.2 ? 'cruiser' :
                   Math.random() < 0.3 ? 'bomber' : 'fighter';
      
      const configs = {
        fighter: { health: 2, size: 20, points: 100, color: '#ff6600' },
        bomber: { health: 4, size: 30, points: 200, color: '#ff0099' },
        cruiser: { health: 8, size: 40, points: 500, color: '#7000ff' },
        boss: { health: 20, size: 60, points: 1000, color: '#ff0000' }
      };

      setEnemies(prev => [...prev, {
        x: Math.random() * (CANVAS_WIDTH - 100) + 50,
        y: -50,
        vx: (Math.random() - 0.5) * 2,
        vy: 1 + Math.random() * 2,
        type,
        health: configs[type].health,
        maxHealth: configs[type].health,
        size: configs[type].size,
        shootTimer: 0,
        points: configs[type].points,
        color: configs[type].color
      }]);
    }
  }, [enemies.length, level]);

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
      // Update stars
      setStars(prev => prev.map(star => ({
        ...star,
        x: star.y > CANVAS_HEIGHT ? Math.random() * CANVAS_WIDTH : star.x,
        y: star.y > CANVAS_HEIGHT ? -5 : star.y + star.speed
      })));

      // Update player
      setPlayer(prev => {
        let newPlayer = { ...prev };
        
        // Movement
        if (keys.has('a') || keys.has('arrowleft')) {
          newPlayer.vx = Math.max(newPlayer.vx - 0.5, -8);
        }
        if (keys.has('d') || keys.has('arrowright')) {
          newPlayer.vx = Math.min(newPlayer.vx + 0.5, 8);
        }
        if (keys.has('w') || keys.has('arrowup')) {
          newPlayer.vy = Math.max(newPlayer.vy - 0.5, -8);
        }
        if (keys.has('s') || keys.has('arrowdown')) {
          newPlayer.vy = Math.min(newPlayer.vy + 0.5, 8);
        }

        // Apply friction
        if (!keys.has('a') && !keys.has('arrowleft') && !keys.has('d') && !keys.has('arrowright')) {
          newPlayer.vx *= 0.9;
        }
        if (!keys.has('w') && !keys.has('arrowup') && !keys.has('s') && !keys.has('arrowdown')) {
          newPlayer.vy *= 0.9;
        }

        // Update position
        newPlayer.x = Math.max(25, Math.min(CANVAS_WIDTH - 25, newPlayer.x + newPlayer.vx));
        newPlayer.y = Math.max(25, Math.min(CANVAS_HEIGHT - 25, newPlayer.y + newPlayer.vy));

        // Shield regeneration
        newPlayer.shield = Math.min(newPlayer.maxShield, newPlayer.shield + 0.1);

        return newPlayer;
      });

      // Player shooting
      setShootTimer(prev => Math.max(0, prev - 1));
      if (keys.has(' ') && shootTimer === 0) {
        setBullets(prev => {
          const newBullets = [{
            x: player.x,
            y: player.y - 20,
            vx: 0,
            vy: -10,
            damage: weaponLevel,
            friendly: true,
            type: 'laser' as const
          }];

          if (weaponLevel >= 2) {
            newBullets.push({
              x: player.x - 15,
              y: player.y - 15,
              vx: -2,
              vy: -10,
              damage: weaponLevel,
              friendly: true,
              type: 'laser' as const
            });
            newBullets.push({
              x: player.x + 15,
              y: player.y - 15,
              vx: 2,
              vy: -10,
              damage: weaponLevel,
              friendly: true,
              type: 'laser' as const
            });
          }

          if (weaponLevel >= 3) {
            newBullets.push({
              x: player.x,
              y: player.y - 25,
              vx: 0,
              vy: -12,
              damage: weaponLevel * 2,
              friendly: true,
              type: 'laser' as const
            });
          }

          return [...prev, ...newBullets];
        });
        setShootTimer(weaponLevel >= 2 ? 5 : 10);
      }

      // Update bullets
      setBullets(prev => prev
        .map(bullet => ({
          ...bullet,
          x: bullet.x + bullet.vx,
          y: bullet.y + bullet.vy
        }))
        .filter(bullet => 
          bullet.x > -10 && bullet.x < CANVAS_WIDTH + 10 &&
          bullet.y > -10 && bullet.y < CANVAS_HEIGHT + 10
        )
      );

      // Update enemies
      setEnemies(prev => prev.map(enemy => {
        let newEnemy = { ...enemy };
        
        // Movement patterns
        if (enemy.type === 'fighter') {
          newEnemy.x += enemy.vx;
          newEnemy.y += enemy.vy;
        } else if (enemy.type === 'bomber') {
          newEnemy.y += enemy.vy;
          newEnemy.x += Math.sin(enemy.y * 0.01) * 2;
        } else if (enemy.type === 'cruiser') {
          newEnemy.y += enemy.vy * 0.5;
          newEnemy.x += Math.cos(enemy.y * 0.008) * 3;
        } else if (enemy.type === 'boss') {
          newEnemy.y += enemy.vy * 0.3;
          newEnemy.x += Math.sin(Date.now() * 0.002) * 4;
        }

        // Enemy shooting
        newEnemy.shootTimer--;
        if (newEnemy.shootTimer <= 0) {
          const shootChance = enemy.type === 'boss' ? 0.05 : enemy.type === 'cruiser' ? 0.03 : 0.01;
          if (Math.random() < shootChance) {
            setBullets(bullets => [...bullets, {
              x: newEnemy.x,
              y: newEnemy.y + enemy.size / 2,
              vx: 0,
              vy: 4,
              damage: enemy.type === 'boss' ? 30 : enemy.type === 'cruiser' ? 20 : 10,
              friendly: false,
              type: 'plasma' as const
            }]);
            newEnemy.shootTimer = enemy.type === 'boss' ? 30 : enemy.type === 'cruiser' ? 60 : 120;
          }
        }

        return newEnemy;
      }).filter(enemy => enemy.y < CANVAS_HEIGHT + 100));

      // Spawn enemies
      spawnEnemies();

      // Collision detection
      setBullets(prevBullets => {
        let newBullets = [...prevBullets];
        
        // Bullet-enemy collisions
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
                enemy.health -= bullet.damage;
                
                if (enemy.health <= 0) {
                  setScore(s => s + enemy.points);
                  
                  // Drop power-ups
                  if (Math.random() < 0.15) {
                    setPowerUps(powers => [...powers, {
                      x: enemy.x,
                      y: enemy.y,
                      type: ['shield', 'weapon', 'speed', 'health'][Math.floor(Math.random() * 4)] as any,
                      timer: 300
                    }]);
                  }
                  
                  newEnemies.splice(hitIndex, 1);
                }
                
                return false;
              }
            } else {
              // Enemy bullet hit player
              const dx = player.x - bullet.x;
              const dy = player.y - bullet.y;
              if (Math.sqrt(dx * dx + dy * dy) < 25) {
                setPlayer(p => ({ ...p, shield: Math.max(0, p.shield - bullet.damage) }));
                return false;
              }
            }
            return true;
          });
          
          return newEnemies;
        });
        
        return newBullets;
      });

      // Update power-ups
      setPowerUps(prev => prev
        .map(power => ({ ...power, timer: power.timer - 1 }))
        .filter(power => power.timer > 0)
      );

      // Power-up collection
      powerUps.forEach(power => {
        const dx = player.x - power.x;
        const dy = player.y - power.y;
        if (Math.sqrt(dx * dx + dy * dy) < 30) {
          if (power.type === 'weapon') {
            setWeaponLevel(prev => Math.min(3, prev + 1));
          } else if (power.type === 'shield') {
            setPlayer(p => ({ ...p, shield: p.maxShield, maxShield: p.maxShield + 20 }));
          } else if (power.type === 'health') {
            setPlayer(p => ({ ...p, shield: Math.min(p.maxShield, p.shield + 50) }));
          }
          
          setPowerUps(prev => prev.filter(p => p !== power));
        }
      });

      // Game over check
      if (player.shield <= 0) {
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
  }, [gameState, player, enemies, bullets, powerUps, keys, weaponLevel, shootTimer, spawnEnemies]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Space background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw stars
    stars.forEach(star => {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
      ctx.fillRect(star.x, star.y, 2, 2);
    });

    // Draw enemies
    enemies.forEach(enemy => {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      
      ctx.fillStyle = enemy.color;
      ctx.shadowColor = enemy.color;
      ctx.shadowBlur = 10;
      
      if (enemy.type === 'boss') {
        ctx.fillRect(-enemy.size/2, -enemy.size/2, enemy.size, enemy.size);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-enemy.size/4, -enemy.size/4, enemy.size/2, enemy.size/2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, enemy.size/2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Health bar
      if (enemy.health < enemy.maxHealth) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-enemy.size/2, -enemy.size/2 - 10, enemy.size, 4);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(-enemy.size/2, -enemy.size/2 - 10, (enemy.health / enemy.maxHealth) * enemy.size, 4);
      }
      
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    // Draw bullets
    bullets.forEach(bullet => {
      ctx.fillStyle = bullet.friendly ? '#00ffff' : '#ff4444';
      ctx.shadowColor = bullet.friendly ? '#00ffff' : '#ff4444';
      ctx.shadowBlur = 5;
      
      if (bullet.type === 'plasma') {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(bullet.x - 2, bullet.y - 8, 4, 16);
      }
      
      ctx.shadowBlur = 0;
    });

    // Draw power-ups
    powerUps.forEach(power => {
      const colors = { shield: '#00ff00', weapon: '#ff8800', speed: '#0088ff', health: '#ff0088' };
      ctx.fillStyle = colors[power.type];
      ctx.shadowColor = colors[power.type];
      ctx.shadowBlur = 8;
      ctx.fillRect(power.x - 8, power.y - 8, 16, 16);
      ctx.shadowBlur = 0;
    });

    // Draw player
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    
    ctx.fillStyle = '#0aff9d';
    ctx.shadowColor = '#0aff9d';
    ctx.shadowBlur = 15;
    
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-15, -12);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-15, 12);
    ctx.closePath();
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.restore();

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Level: ${level}`, 20, 55);
    ctx.fillText(`Weapon: ${weaponLevel}`, 20, 80);

    // Shield bar
    ctx.fillStyle = '#333333';
    ctx.fillRect(20, 90, 200, 20);
    ctx.fillStyle = player.shield > 30 ? '#00ff00' : '#ff0000';
    ctx.fillRect(20, 90, (player.shield / player.maxShield) * 200, 20);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(20, 90, 200, 20);

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
    setLevel(1);
    setPlayer({
      x: 400,
      y: 500,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      shield: 100,
      maxShield: 100
    });
    setEnemies([]);
    setBullets([]);
    setPowerUps([]);
    setWeaponLevel(1);
    setShootTimer(0);
    setGameState('playing');
  };

  return (
    <GameLayout
      gameTitle="Super Star Shooter"
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
            <p>WASD to move • Space to shoot • Collect power-ups!</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default SuperStarShooter;
