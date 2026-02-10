import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Position {
  x: number;
  y: number;
}

interface Entity extends Position {
  id: number;
  health: number;
  maxHealth: number;
  speed: number;
}

interface Player extends Entity {
  weapon: string;
  ammo: number;
  maxAmmo: number;
  reloadTime: number;
  reloading: boolean;
}

interface Zombie extends Entity {
  type: 'walker' | 'runner' | 'boss';
  damage: number;
  color: string;
}

interface Bullet extends Position {
  id: number;
  vx: number;
  vy: number;
  damage: number;
}

interface Particle extends Position {
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

const PixelZombies: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [player, setPlayer] = useState<Player>({
    id: 0,
    x: 400,
    y: 300,
    health: 100,
    maxHealth: 100,
    speed: 3,
    weapon: 'pistol',
    ammo: 10,
    maxAmmo: 10,
    reloadTime: 0,
    reloading: false
  });
  const [zombies, setZombies] = useState<Zombie[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });

  const gameLoopRef = useRef<number>();
  const zombieIdRef = useRef(0);
  const bulletIdRef = useRef(0);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  // Create particles
  const createParticles = useCallback((x: number, y: number, color: string, count: number = 8) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color,
        size: Math.random() * 4 + 2
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Spawn zombies
  const spawnZombie = useCallback(() => {
    const types: ('walker' | 'runner' | 'boss')[] = ['walker', 'walker', 'walker', 'runner'];
    if (wave % 5 === 0) types.push('boss');
    
    const type = types[Math.floor(Math.random() * types.length)];
    const edge = Math.floor(Math.random() * 4);
    
    let x, y;
    switch (edge) {
      case 0: x = 0; y = Math.random() * CANVAS_HEIGHT; break;
      case 1: x = CANVAS_WIDTH; y = Math.random() * CANVAS_HEIGHT; break;
      case 2: x = Math.random() * CANVAS_WIDTH; y = 0; break;
      default: x = Math.random() * CANVAS_WIDTH; y = CANVAS_HEIGHT; break;
    }

    const zombie: Zombie = {
      id: zombieIdRef.current++,
      x,
      y,
      health: type === 'boss' ? 50 : type === 'runner' ? 15 : 25,
      maxHealth: type === 'boss' ? 50 : type === 'runner' ? 15 : 25,
      speed: type === 'boss' ? 0.8 : type === 'runner' ? 2.5 : 1.2,
      type,
      damage: type === 'boss' ? 25 : type === 'runner' ? 15 : 10,
      color: type === 'boss' ? '#ff0000' : type === 'runner' ? '#ff6600' : '#00ff00'
    };

    setZombies(prev => [...prev, zombie]);
  }, [wave]);

  // Handle input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => new Set([...prev, e.key.toLowerCase()]));
      
      if (e.key === 'r' || e.key === 'R') {
        // Reload
        if (!player.reloading && player.ammo < player.maxAmmo) {
          setPlayer(prev => ({ ...prev, reloading: true, reloadTime: 60 }));
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(e.key.toLowerCase());
        return newKeys;
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        setMousePos({
          x: ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
          y: ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT
        });
      }
    };

    const handleMouseClick = (e: MouseEvent) => {
      if (gameState !== 'playing' || player.reloading || player.ammo <= 0) return;
      
      // Shoot towards mouse position
      const dx = mousePos.x - player.x;
      const dy = mousePos.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const speed = 8;
      
      setBullets(prev => [...prev, {
        id: bulletIdRef.current++,
        x: player.x,
        y: player.y,
        vx: (dx / distance) * speed,
        vy: (dy / distance) * speed,
        damage: 25
      }]);
      
      setPlayer(prev => ({ ...prev, ammo: prev.ammo - 1 }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleMouseClick);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleMouseClick);
    };
  }, [gameState, player, mousePos]);

  // Touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== 'playing' || player.reloading || player.ammo <= 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = ((touch.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const touchY = ((touch.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    
    // Shoot towards touch position
    const dx = touchX - player.x;
    const dy = touchY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const speed = 8;
    
    setBullets(prev => [...prev, {
      id: bulletIdRef.current++,
      x: player.x,
      y: player.y,
      vx: (dx / distance) * speed,
      vy: (dy / distance) * speed,
      damage: 25
    }]);
    
    setPlayer(prev => ({ ...prev, ammo: prev.ammo - 1 }));
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      // Move player
      setPlayer(prev => {
        let newX = prev.x;
        let newY = prev.y;
        
        if (keys.has('w') || keys.has('arrowup')) newY = Math.max(0, prev.y - prev.speed);
        if (keys.has('s') || keys.has('arrowdown')) newY = Math.min(CANVAS_HEIGHT - 20, prev.y + prev.speed);
        if (keys.has('a') || keys.has('arrowleft')) newX = Math.max(0, prev.x - prev.speed);
        if (keys.has('d') || keys.has('arrowright')) newX = Math.min(CANVAS_WIDTH - 20, prev.x + prev.speed);

        // Handle reloading
        let newReloadTime = prev.reloadTime;
        let reloading = prev.reloading;
        let ammo = prev.ammo;
        
        if (reloading) {
          newReloadTime = Math.max(0, prev.reloadTime - 1);
          if (newReloadTime === 0) {
            reloading = false;
            ammo = prev.maxAmmo;
          }
        }

        return {
          ...prev,
          x: newX,
          y: newY,
          reloadTime: newReloadTime,
          reloading,
          ammo
        };
      });

      // Move bullets
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

      // Move zombies towards player
      setZombies(prev => prev.map(zombie => {
        const dx = player.x - zombie.x;
        const dy = player.y - zombie.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          const moveX = (dx / distance) * zombie.speed;
          const moveY = (dy / distance) * zombie.speed;
          
          return {
            ...zombie,
            x: zombie.x + moveX,
            y: zombie.y + moveY
          };
        }
        return zombie;
      }));

      // Check bullet-zombie collisions
      setBullets(prev => {
        const remainingBullets: Bullet[] = [];
        
        prev.forEach(bullet => {
          let hit = false;
          
          setZombies(zombieList => zombieList.map(zombie => {
            const dx = bullet.x - zombie.x;
            const dy = bullet.y - zombie.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 15 && !hit) {
              hit = true;
              createParticles(zombie.x, zombie.y, zombie.color, 10);
              
              const newHealth = zombie.health - bullet.damage;
              if (newHealth <= 0) {
                setScore(s => s + (zombie.type === 'boss' ? 100 : zombie.type === 'runner' ? 30 : 20));
                return null as any; // Will be filtered out
              }
              
              return { ...zombie, health: newHealth };
            }
            return zombie;
          }).filter(Boolean));
          
          if (!hit) {
            remainingBullets.push(bullet);
          }
        });
        
        return remainingBullets;
      });

      // Remove dead zombies
      setZombies(prev => prev.filter(zombie => zombie.health > 0));

      // Check zombie-player collisions
      zombies.forEach(zombie => {
        const dx = zombie.x - player.x;
        const dy = zombie.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 20) {
          setPlayer(prev => {
            const newHealth = prev.health - zombie.damage;
            if (newHealth <= 0) {
              setGameState('gameOver');
            }
            return { ...prev, health: Math.max(0, newHealth) };
          });
          createParticles(player.x, player.y, '#ff0000', 12);
        }
      });

      // Update particles
      setParticles(prev => prev
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vx: p.vx * 0.98,
          vy: p.vy * 0.98,
          life: p.life - 0.02,
          size: p.size * 0.99
        }))
        .filter(p => p.life > 0)
      );

      // Spawn zombies
      if (Math.random() < 0.02 + wave * 0.005) {
        spawnZombie();
      }

      // Check wave completion
      if (zombies.length === 0 && Math.random() < 0.001) {
        setWave(prev => prev + 1);
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, keys, player, zombies, bullets, spawnZombie, createParticles]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Draw player
    ctx.fillStyle = '#0aff9d';
    ctx.shadowColor = '#0aff9d';
    ctx.shadowBlur = 10;
    ctx.fillRect(player.x - 8, player.y - 8, 16, 16);
    ctx.shadowBlur = 0;

    // Draw health bar above player
    const healthBarWidth = 30;
    const healthPercentage = player.health / player.maxHealth;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(player.x - healthBarWidth/2, player.y - 20, healthBarWidth, 4);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(player.x - healthBarWidth/2, player.y - 20, healthBarWidth * healthPercentage, 4);

    // Draw weapon direction indicator
    const dx = mousePos.x - player.x;
    const dy = mousePos.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 0) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(player.x + (dx / distance) * 20, player.y + (dy / distance) * 20);
      ctx.stroke();
    }

    // Draw zombies
    zombies.forEach(zombie => {
      ctx.fillStyle = zombie.color;
      ctx.shadowColor = zombie.color;
      ctx.shadowBlur = 8;
      
      const size = zombie.type === 'boss' ? 24 : zombie.type === 'runner' ? 12 : 16;
      ctx.fillRect(zombie.x - size/2, zombie.y - size/2, size, size);
      
      // Health bar for damaged zombies
      if (zombie.health < zombie.maxHealth) {
        const healthPercentage = zombie.health / zombie.maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(zombie.x - 15, zombie.y - size/2 - 8, 30, 3);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(zombie.x - 15, zombie.y - size/2 - 8, 30 * healthPercentage, 3);
      }
      
      ctx.shadowBlur = 0;
    });

    // Draw bullets
    bullets.forEach(bullet => {
      ctx.fillStyle = '#ffff00';
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 5;
      ctx.fillRect(bullet.x - 2, bullet.y - 2, 4, 4);
      ctx.shadowBlur = 0;
    });

    // Draw particles
    particles.forEach(particle => {
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    });
    ctx.globalAlpha = 1;

    // Draw UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Wave: ${wave}`, 20, 30);
    ctx.fillText(`Score: ${score}`, 20, 50);
    ctx.fillText(`Health: ${player.health}`, 20, 70);
    ctx.fillText(`Ammo: ${player.ammo}/${player.maxAmmo}`, 20, 90);
    
    if (player.reloading) {
      ctx.fillStyle = '#ff6600';
      ctx.fillText(`Reloading... ${Math.ceil(player.reloadTime / 10)}`, 20, 110);
    } else if (player.ammo === 0) {
      ctx.fillStyle = '#ff0000';
      ctx.fillText('Press R to reload!', 20, 110);
    }

    ctx.fillText(`Zombies: ${zombies.length}`, CANVAS_WIDTH - 150, 30);

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ff0000';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px monospace';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.fillText(`Waves Survived: ${wave}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
      ctx.textAlign = 'left';
    }

    if (gameState === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ffffff';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.textAlign = 'left';
    }
  });

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore(0);
    setWave(1);
    setPlayer({
      id: 0,
      x: 400,
      y: 300,
      health: 100,
      maxHealth: 100,
      speed: 3,
      weapon: 'pistol',
      ammo: 10,
      maxAmmo: 10,
      reloadTime: 0,
      reloading: false
    });
    setZombies([]);
    setBullets([]);
    setParticles([]);
    setGameState('playing');
  };

  return (
    <GameLayout
      gameTitle="Pixel Zombies"
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
            onTouchStart={handleTouchStart}
            style={{ touchAction: 'none' }}
          />
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p className="md:hidden">Touch to shoot • Swipe to move</p>
            <p className="hidden md:block">WASD to move • Mouse to aim/shoot • R to reload</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default PixelZombies;
