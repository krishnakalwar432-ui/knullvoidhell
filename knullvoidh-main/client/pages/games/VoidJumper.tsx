import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  onGround: boolean;
  doubleJump: boolean;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'solid' | 'moving' | 'vanishing';
  color: string;
  moveSpeed?: number;
  moveRange?: number;
  baseX?: number;
}

const VoidJumper: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [player, setPlayer] = useState<Player>({
    x: 100,
    y: 400,
    vx: 0,
    vy: 0,
    width: 20,
    height: 30,
    onGround: false,
    doubleJump: false
  });
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [camera, setCamera] = useState({ x: 0, y: 0 });

  const gameLoopRef = useRef<number>();
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const GRAVITY = 0.8;
  const JUMP_FORCE = -15;
  const MOVE_SPEED = 5;

  // Generate platforms
  const generatePlatforms = useCallback(() => {
    const newPlatforms: Platform[] = [
      // Starting platform
      { x: 0, y: 450, width: 200, height: 20, type: 'solid', color: '#0aff9d' },
    ];

    // Generate level platforms
    for (let i = 1; i < 20; i++) {
      const x = i * 150 + Math.random() * 100;
      const y = 500 - Math.random() * 300 - i * 10;
      const type = Math.random() < 0.7 ? 'solid' : Math.random() < 0.8 ? 'moving' : 'vanishing';
      
      const platform: Platform = {
        x,
        y,
        width: 80 + Math.random() * 40,
        height: 15,
        type,
        color: type === 'moving' ? '#7000ff' : type === 'vanishing' ? '#ff0099' : '#0aff9d'
      };

      if (type === 'moving') {
        platform.moveSpeed = 1 + Math.random() * 2;
        platform.moveRange = 100 + Math.random() * 100;
        platform.baseX = x;
      }

      newPlatforms.push(platform);
    }

    setPlatforms(newPlatforms);
  }, []);

  // Check collision
  const checkCollision = useCallback((rect1: any, rect2: any) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }, []);

  // Handle input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => new Set([...prev, e.key.toLowerCase()]));
      
      if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') && (player.onGround || player.doubleJump)) {
        setPlayer(prev => ({
          ...prev,
          vy: JUMP_FORCE,
          onGround: false,
          doubleJump: prev.onGround ? true : false
        }));
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
  }, [player.onGround, player.doubleJump]);

  // Touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    
    if (x < rect.width / 2) {
      // Left side - move left
      setKeys(prev => new Set([...prev, 'a']));
    } else {
      // Right side - jump or move right
      if (player.onGround || player.doubleJump) {
        setPlayer(prev => ({
          ...prev,
          vy: JUMP_FORCE,
          onGround: false,
          doubleJump: prev.onGround ? true : false
        }));
      }
    }
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      // Update player movement
      setPlayer(prev => {
        let newVx = prev.vx;
        let newVy = prev.vy + GRAVITY;
        let newX = prev.x;
        let newY = prev.y;
        let onGround = false;

        // Horizontal movement
        if (keys.has('arrowleft') || keys.has('a')) {
          newVx = -MOVE_SPEED;
        } else if (keys.has('arrowright') || keys.has('d')) {
          newVx = MOVE_SPEED;
        } else {
          newVx *= 0.8; // Friction
        }

        newX += newVx;
        newY += newVy;

        // Platform collisions
        platforms.forEach(platform => {
          const futurePlayer = { x: newX, y: newY, width: prev.width, height: prev.height };
          
          if (checkCollision(futurePlayer, platform)) {
            // Landing on top
            if (prev.vy > 0 && prev.y + prev.height <= platform.y + 5) {
              newY = platform.y - prev.height;
              newVy = 0;
              onGround = true;
            }
            // Hitting from below
            else if (prev.vy < 0 && prev.y >= platform.y + platform.height - 5) {
              newY = platform.y + platform.height;
              newVy = 0;
            }
            // Side collisions
            else {
              if (prev.x + prev.width <= platform.x + 5) {
                newX = platform.x - prev.width;
              } else if (prev.x >= platform.x + platform.width - 5) {
                newX = platform.x + platform.width;
              }
              newVx = 0;
            }
          }
        });

        // Reset double jump when on ground
        const doubleJump = onGround ? true : prev.doubleJump;

        // Death check
        if (newY > CANVAS_HEIGHT + 100) {
          setGameState('gameOver');
        }

        // Update score based on height
        const heightScore = Math.max(0, Math.floor((500 - newY) / 10));
        setScore(heightScore);

        return {
          ...prev,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          onGround,
          doubleJump
        };
      });

      // Update moving platforms
      setPlatforms(prev => prev.map(platform => {
        if (platform.type === 'moving' && platform.moveSpeed && platform.moveRange && platform.baseX !== undefined) {
          const time = Date.now() * 0.001;
          const newX = platform.baseX + Math.sin(time * platform.moveSpeed) * platform.moveRange;
          return { ...platform, x: newX };
        }
        return platform;
      }));

      // Update camera to follow player
      setCamera(prev => ({
        x: Math.max(0, player.x - CANVAS_WIDTH / 2),
        y: Math.max(0, player.y - CANVAS_HEIGHT / 2)
      }));

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, keys, player, platforms, checkCollision]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with void background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#000511');
    gradient.addColorStop(1, '#1a0033');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
      const x = (i * 123 - camera.x * 0.1) % (CANVAS_WIDTH + 50);
      const y = (i * 456 - camera.y * 0.1) % (CANVAS_HEIGHT + 50);
      ctx.globalAlpha = Math.random() * 0.8 + 0.2;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;

    // Draw platforms
    platforms.forEach(platform => {
      const screenX = platform.x - camera.x;
      const screenY = platform.y - camera.y;
      
      if (screenX > -platform.width && screenX < CANVAS_WIDTH + platform.width) {
        ctx.fillStyle = platform.color;
        ctx.shadowColor = platform.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(screenX, screenY, platform.width, platform.height);
        ctx.shadowBlur = 0;

        // Platform type indicators
        if (platform.type === 'moving') {
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('◊', screenX + platform.width/2, screenY - 5);
        } else if (platform.type === 'vanishing') {
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('!', screenX + platform.width/2, screenY - 5);
        }
      }
    });

    // Draw player
    const playerScreenX = player.x - camera.x;
    const playerScreenY = player.y - camera.y;
    
    ctx.fillStyle = player.onGround ? '#0aff9d' : player.doubleJump ? '#7000ff' : '#ff0099';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 15;
    ctx.fillRect(playerScreenX, playerScreenY, player.width, player.height);
    ctx.shadowBlur = 0;

    // Draw UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Height: ${score}m`, 20, 30);
    ctx.fillText(`Level: ${level}`, 20, 55);
    
    // Jump indicator
    if (player.doubleJump && !player.onGround) {
      ctx.fillStyle = '#ffff00';
      ctx.fillText('Double Jump Available!', 20, 80);
    }

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('FELL INTO VOID', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px monospace';
      ctx.fillText(`Max Height: ${score}m`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
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

  useEffect(() => {
    generatePlatforms();
  }, [generatePlatforms]);

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore(0);
    setLevel(1);
    setPlayer({
      x: 100,
      y: 400,
      vx: 0,
      vy: 0,
      width: 20,
      height: 30,
      onGround: false,
      doubleJump: false
    });
    setCamera({ x: 0, y: 0 });
    generatePlatforms();
    setGameState('playing');
  };

  return (
    <GameLayout
      gameTitle="Void Jumper"
      gameCategory="Platform"
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
            style={{ touchAction: 'none' }}
          />
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p className="md:hidden">Touch left to move left, right to jump/move right</p>
            <p className="hidden md:block">A/D to move • Space/W to jump • Double jump available!</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default VoidJumper;
