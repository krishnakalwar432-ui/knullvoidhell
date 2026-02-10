import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Position {
  x: number;
  y: number;
}

interface Player extends Position {
  vx: number;
  vy: number;
  size: number;
  gravityReversed: boolean;
}

interface Obstacle extends Position {
  width: number;
  height: number;
  id: number;
  type: 'barrier' | 'moving' | 'gravity';
  movePattern?: 'vertical' | 'horizontal';
  speed?: number;
}

interface GravityZone extends Position {
  width: number;
  height: number;
  id: number;
  reversed: boolean;
}

const GravityDodge: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [player, setPlayer] = useState<Player>({
    x: 100,
    y: 300,
    vx: 0,
    vy: 0,
    size: 20,
    gravityReversed: false
  });
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [gravityZones, setGravityZones] = useState<GravityZone[]>([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [worldSpeed, setWorldSpeed] = useState(3);

  const gameLoopRef = useRef<number>();
  const obstacleIdRef = useRef(0);
  const gravityZoneIdRef = useRef(0);

  // Game constants
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const GRAVITY = 0.5;
  const PLAYER_SPEED = 5;

  // Handle input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => new Set([...prev, e.key.toLowerCase()]));
      
      if (e.key === ' ') {
        e.preventDefault();
        // Reverse gravity
        setPlayer(prev => ({
          ...prev,
          gravityReversed: !prev.gravityReversed,
          vy: prev.gravityReversed ? -8 : 8
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
  }, []);

  // Touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setPlayer(prev => ({
      ...prev,
      gravityReversed: !prev.gravityReversed,
      vy: prev.gravityReversed ? -8 : 8
    }));
  };

  // Generate obstacles
  const generateObstacle = useCallback(() => {
    const types: ('barrier' | 'moving' | 'gravity')[] = ['barrier', 'barrier', 'moving', 'gravity'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let obstacle: Obstacle;
    const baseY = Math.random() * (CANVAS_HEIGHT - 100) + 50;
    
    switch (type) {
      case 'barrier':
        obstacle = {
          id: obstacleIdRef.current++,
          x: CANVAS_WIDTH,
          y: baseY,
          width: 30,
          height: 100 + Math.random() * 100,
          type: 'barrier'
        };
        break;
      case 'moving':
        obstacle = {
          id: obstacleIdRef.current++,
          x: CANVAS_WIDTH,
          y: baseY,
          width: 25,
          height: 80,
          type: 'moving',
          movePattern: Math.random() > 0.5 ? 'vertical' : 'horizontal',
          speed: 2 + Math.random() * 3
        };
        break;
      case 'gravity':
        obstacle = {
          id: obstacleIdRef.current++,
          x: CANVAS_WIDTH,
          y: 0,
          width: 40,
          height: CANVAS_HEIGHT,
          type: 'gravity'
        };
        break;
    }
    
    setObstacles(prev => [...prev, obstacle]);
  }, []);

  // Generate gravity zones
  const generateGravityZone = useCallback(() => {
    const zone: GravityZone = {
      id: gravityZoneIdRef.current++,
      x: CANVAS_WIDTH,
      y: Math.random() * (CANVAS_HEIGHT - 200) + 100,
      width: 150,
      height: 200,
      reversed: Math.random() > 0.5
    };
    
    setGravityZones(prev => [...prev, zone]);
  }, []);

  // Collision detection
  const checkCollision = useCallback((rect1: { x: number; y: number; width?: number; height?: number; size?: number }, 
                                    rect2: { x: number; y: number; width: number; height: number }) => {
    const r1Width = rect1.width || rect1.size || 0;
    const r1Height = rect1.height || rect1.size || 0;
    
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + r1Width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + r1Height > rect2.y;
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      // Update player physics
      setPlayer(prev => {
        let newVy = prev.vy;
        let newY = prev.y;
        let newVx = prev.vx;
        let newX = prev.x;

        // Apply gravity
        const currentGravity = prev.gravityReversed ? -GRAVITY : GRAVITY;
        newVy += currentGravity;

        // Handle horizontal movement
        if (keys.has('arrowleft') || keys.has('a')) {
          newVx = Math.max(newVx - 0.5, -PLAYER_SPEED);
        } else if (keys.has('arrowright') || keys.has('d')) {
          newVx = Math.min(newVx + 0.5, PLAYER_SPEED);
        } else {
          newVx *= 0.9; // Friction
        }

        newX += newVx;
        newY += newVy;

        // Screen boundaries
        if (newY < 0) {
          newY = 0;
          newVy = 0;
        }
        if (newY > CANVAS_HEIGHT - prev.size) {
          newY = CANVAS_HEIGHT - prev.size;
          newVy = 0;
        }
        if (newX < 0) {
          newX = 0;
          newVx = 0;
        }
        if (newX > CANVAS_WIDTH - prev.size) {
          newX = CANVAS_WIDTH - prev.size;
          newVx = 0;
        }

        return { ...prev, x: newX, y: newY, vx: newVx, vy: newVy };
      });

      // Move obstacles
      setObstacles(prev => prev
        .map(obstacle => {
          let newX = obstacle.x - worldSpeed;
          let newY = obstacle.y;

          if (obstacle.type === 'moving' && obstacle.movePattern && obstacle.speed) {
            if (obstacle.movePattern === 'vertical') {
              newY += Math.sin(Date.now() * 0.01) * obstacle.speed;
            } else {
              newY += Math.cos(Date.now() * 0.01) * obstacle.speed;
            }
          }

          return { ...obstacle, x: newX, y: newY };
        })
        .filter(obstacle => obstacle.x > -obstacle.width)
      );

      // Move gravity zones
      setGravityZones(prev => prev
        .map(zone => ({ ...zone, x: zone.x - worldSpeed }))
        .filter(zone => zone.x > -zone.width)
      );

      // Check gravity zone effects
      gravityZones.forEach(zone => {
        if (checkCollision(player, zone)) {
          setPlayer(prev => ({ ...prev, gravityReversed: zone.reversed }));
        }
      });

      // Check obstacle collisions
      let collision = false;
      obstacles.forEach(obstacle => {
        if (checkCollision(player, obstacle)) {
          if (obstacle.type !== 'gravity') {
            collision = true;
          }
        }
      });

      if (collision) {
        setGameState('gameOver');
      }

      // Generate new obstacles
      if (Math.random() < 0.02) {
        generateObstacle();
      }

      // Generate new gravity zones
      if (Math.random() < 0.005) {
        generateGravityZone();
      }

      // Update score and speed
      setScore(prev => prev + 1);
      setWorldSpeed(prev => Math.min(prev + 0.001, 8));

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, player, obstacles, gravityZones, keys, worldSpeed, checkCollision, generateObstacle, generateGravityZone]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with space background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, player.gravityReversed ? '#2a0a1a' : '#0a0a0f');
    gradient.addColorStop(1, player.gravityReversed ? '#0a0a0f' : '#2a0a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw stars moving with world speed
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = Math.random() * 0.8 + 0.2;
      const x = ((score * worldSpeed * 0.5 + i * 123) % (CANVAS_WIDTH + 50)) - 50;
      const y = (i * 456) % CANVAS_HEIGHT;
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;

    // Draw gravity zones
    gravityZones.forEach(zone => {
      ctx.fillStyle = zone.reversed ? '#7000ff20' : '#0aff9d20';
      ctx.strokeStyle = zone.reversed ? '#7000ff' : '#0aff9d';
      ctx.lineWidth = 2;
      ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
      ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
      
      // Draw gravity arrows
      ctx.fillStyle = zone.reversed ? '#7000ff' : '#0aff9d';
      ctx.font = '20px monospace';
      ctx.textAlign = 'center';
      const arrowY = zone.y + zone.height / 2;
      for (let i = 0; i < 3; i++) {
        const arrowX = zone.x + (i + 1) * (zone.width / 4);
        ctx.fillText(zone.reversed ? '↑' : '↓', arrowX, arrowY);
      }
    });

    // Draw obstacles
    obstacles.forEach(obstacle => {
      let color = '#ff0099';
      
      switch (obstacle.type) {
        case 'barrier':
          color = '#ff0099';
          break;
        case 'moving':
          color = '#ff6600';
          break;
        case 'gravity':
          color = '#9900ff';
          break;
      }
      
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      ctx.shadowBlur = 0;

      if (obstacle.type === 'moving') {
        // Add moving indicator
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('◊', obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2);
      }
    });

    // Draw player
    ctx.fillStyle = player.gravityReversed ? '#7000ff' : '#0aff9d';
    ctx.shadowColor = player.gravityReversed ? '#7000ff' : '#0aff9d';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(player.x + player.size/2, player.y + player.size/2, player.size/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw gravity indicator on player
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      player.gravityReversed ? '↑' : '↓', 
      player.x + player.size/2, 
      player.y + player.size/2 + 5
    );

    // Draw HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 40);
    ctx.fillText(`Speed: ${worldSpeed.toFixed(1)}`, 20, 70);
    
    // Gravity status
    ctx.fillStyle = player.gravityReversed ? '#7000ff' : '#0aff9d';
    ctx.fillText(`Gravity: ${player.gravityReversed ? 'UP' : 'DOWN'}`, 20, 100);

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px monospace';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }

    if (gameState === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ffffff';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  });

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore(0);
    setWorldSpeed(3);
    setPlayer({
      x: 100,
      y: 300,
      vx: 0,
      vy: 0,
      size: 20,
      gravityReversed: false
    });
    setObstacles([]);
    setGravityZones([]);
    setGameState('playing');
  };

  return (
    <GameLayout
      gameTitle="Gravity Dodge"
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
            style={{ touchAction: 'none' }}
          />
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p className="md:hidden">Tap to flip gravity • Use tilt for movement</p>
            <p className="hidden md:block">Spacebar to flip gravity • A/D to move • Avoid obstacles</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default GravityDodge;
