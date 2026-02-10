import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';
import { getSafeCanvasContext, SafeGameLoop, SafeKeyHandler } from '@/utils/gameUtils';

interface Position {
  x: number;
  y: number;
}

interface Invader extends Position {
  id: number;
  alive: boolean;
}

interface Bullet extends Position {
  id: number;
  velocity: number;
}

const SpaceInvaders: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [player, setPlayer] = useState<Position>({ x: 375, y: 550 });
  const [invaders, setInvaders] = useState<Invader[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [invaderBullets, setInvaderBullets] = useState<Bullet[]>([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  
  const gameLoopRef = useRef<SafeGameLoop | null>(null);
  const keyHandlerRef = useRef<SafeKeyHandler | null>(null);
  const bulletIdRef = useRef(0);
  const invaderIdRef = useRef(0);

  // Game constants
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const PLAYER_SPEED = 5;
  const BULLET_SPEED = 7;
  const INVADER_SPEED = 1;

  // Initialize invaders
  const initializeInvaders = useCallback(() => {
    const newInvaders: Invader[] = [];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 10; col++) {
        newInvaders.push({
          id: invaderIdRef.current++,
          x: 100 + col * 60,
          y: 50 + row * 50,
          alive: true
        });
      }
    }
    setInvaders(newInvaders);
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => new Set([...prev, e.key.toLowerCase()]));
      
      if (e.key === ' ') {
        e.preventDefault();
        // Shoot bullet
        setBullets(prev => [...prev, {
          id: bulletIdRef.current++,
          x: player.x + 15,
          y: player.y,
          velocity: -BULLET_SPEED
        }]);
      }
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
  }, [player.x, player.y]);

  // Touch controls for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Move player towards touch point
    setPlayer(prev => ({
      ...prev,
      x: Math.max(0, Math.min(CANVAS_WIDTH - 30, x - 15))
    }));

    // Shoot bullet
    setBullets(prev => [...prev, {
      id: bulletIdRef.current++,
      x: player.x + 15,
      y: player.y,
      velocity: -BULLET_SPEED
    }]);
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      // Move player
      setPlayer(prev => {
        let newX = prev.x;
        if (keys.has('arrowleft') || keys.has('a')) {
          newX = Math.max(0, prev.x - PLAYER_SPEED);
        }
        if (keys.has('arrowright') || keys.has('d')) {
          newX = Math.min(CANVAS_WIDTH - 30, prev.x + PLAYER_SPEED);
        }
        return { ...prev, x: newX };
      });

      // Move bullets
      setBullets(prev => prev
        .map(bullet => ({ ...bullet, y: bullet.y + bullet.velocity }))
        .filter(bullet => bullet.y > -10 && bullet.y < CANVAS_HEIGHT + 10)
      );

      // Move invader bullets
      setInvaderBullets(prev => prev
        .map(bullet => ({ ...bullet, y: bullet.y + bullet.velocity }))
        .filter(bullet => bullet.y > -10 && bullet.y < CANVAS_HEIGHT + 10)
      );

      // Move invaders
      setInvaders(prev => prev.map(invader => ({
        ...invader,
        x: invader.x + INVADER_SPEED * Math.sin(Date.now() * 0.001) * 0.5,
        y: invader.y + 0.1
      })));

      // Random invader shooting
      if (Math.random() < 0.02) {
        setInvaders(prev => {
          const aliveInvaders = prev.filter(inv => inv.alive);
          if (aliveInvaders.length > 0) {
            const shooter = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
            setInvaderBullets(bullets => [...bullets, {
              id: bulletIdRef.current++,
              x: shooter.x + 15,
              y: shooter.y + 30,
              velocity: BULLET_SPEED * 0.5
            }]);
          }
          return prev;
        });
      }

      // Collision detection
      setBullets(prev => {
        const remainingBullets: Bullet[] = [];
        const bulletsToRemove = new Set<number>();

        prev.forEach(bullet => {
          let hit = false;
          setInvaders(invaders => invaders.map(invader => {
            if (invader.alive && 
                bullet.x > invader.x && bullet.x < invader.x + 30 &&
                bullet.y > invader.y && bullet.y < invader.y + 30) {
              hit = true;
              bulletsToRemove.add(bullet.id);
              setScore(s => s + 100);
              return { ...invader, alive: false };
            }
            return invader;
          }));
          
          if (!hit) {
            remainingBullets.push(bullet);
          }
        });

        return remainingBullets;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, keys]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = getSafeCanvasContext(canvas);
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = 'rgba(10, 10, 15, 0.9)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw stars background
    for (let i = 0; i < 100; i++) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = Math.random() * 0.5 + 0.2;
      const x = (Date.now() * 0.01 + i * 123) % CANVAS_WIDTH;
      const y = (Date.now() * 0.02 + i * 456) % CANVAS_HEIGHT;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;

    // Draw player
    ctx.fillStyle = '#0aff9d';
    ctx.shadowColor = '#0aff9d';
    ctx.shadowBlur = 10;
    ctx.fillRect(player.x, player.y, 30, 20);
    ctx.shadowBlur = 0;

    // Draw invaders
    invaders.forEach(invader => {
      if (invader.alive) {
        ctx.fillStyle = '#7000ff';
        ctx.shadowColor = '#7000ff';
        ctx.shadowBlur = 8;
        ctx.fillRect(invader.x, invader.y, 30, 30);
        ctx.shadowBlur = 0;
      }
    });

    // Draw bullets
    bullets.forEach(bullet => {
      ctx.fillStyle = '#0aff9d';
      ctx.shadowColor = '#0aff9d';
      ctx.shadowBlur = 5;
      ctx.fillRect(bullet.x, bullet.y, 3, 10);
      ctx.shadowBlur = 0;
    });

    // Draw invader bullets
    invaderBullets.forEach(bullet => {
      ctx.fillStyle = '#ff0099';
      ctx.shadowColor = '#ff0099';
      ctx.shadowBlur = 5;
      ctx.fillRect(bullet.x, bullet.y, 3, 10);
      ctx.shadowBlur = 0;
    });

    // Draw HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Level: ${level}`, 20, 30);
    ctx.fillText(`Score: ${score}`, 20, 50);
    
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

  useEffect(() => {
    initializeInvaders();
  }, [initializeInvaders]);

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore(0);
    setLevel(1);
    setPlayer({ x: 375, y: 550 });
    setBullets([]);
    setInvaderBullets([]);
    initializeInvaders();
    setGameState('playing');
  };

  return (
    <GameLayout
      gameTitle="Space Invaders Extreme"
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
            onTouchStart={handleTouchStart}
            style={{ touchAction: 'none' }}
          />
          
          {/* Mobile instructions */}
          <div className="mt-4 text-center text-sm text-muted-foreground md:hidden">
            <p>Tap to move and shoot</p>
          </div>
          
          {/* Desktop instructions */}
          <div className="mt-4 text-center text-sm text-muted-foreground hidden md:block">
            <p>Use A/D or Arrow keys to move • Spacebar to shoot</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default SpaceInvaders;
