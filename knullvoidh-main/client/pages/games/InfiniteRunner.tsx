import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Position {
  x: number;
  y: number;
}

interface Obstacle extends Position {
  id: number;
  width: number;
  height: number;
  type: 'spike' | 'block' | 'laser';
}

interface Collectible extends Position {
  id: number;
  type: 'coin' | 'gem' | 'power';
  collected: boolean;
}

interface Particle extends Position {
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const InfiniteRunner: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(5);
  const [player, setPlayer] = useState<Position & { vy: number; onGround: boolean; width: number; height: number }>({
    x: 100,
    y: 400,
    vy: 0,
    onGround: true,
    width: 30,
    height: 40
  });
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());

  const gameLoopRef = useRef<number>();
  const obstacleIdRef = useRef(0);
  const collectibleIdRef = useRef(0);

  // Game constants
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const GROUND_Y = 500;
  const GRAVITY = 0.8;
  const JUMP_FORCE = -15;

  // Handle input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => new Set([...prev, e.key.toLowerCase()]));
      
      if ((e.key === ' ' || e.key === 'ArrowUp') && player.onGround) {
        e.preventDefault();
        setPlayer(prev => ({ ...prev, vy: JUMP_FORCE, onGround: false }));
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
  }, [player.onGround]);

  // Touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (player.onGround) {
      setPlayer(prev => ({ ...prev, vy: JUMP_FORCE, onGround: false }));
    }
  };

  // Create particle effect
  const createParticles = useCallback((x: number, y: number, color: string, count: number = 5) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: Math.random() * -8 - 2,
        life: 1.0,
        color
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Collision detection
  const checkCollision = useCallback((rect1: { x: number; y: number; width: number; height: number }, 
                                    rect2: { x: number; y: number; width: number; height: number }) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }, []);

  // Generate obstacles
  const generateObstacle = useCallback(() => {
    const types: ('spike' | 'block' | 'laser')[] = ['spike', 'block', 'laser'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let obstacle: Obstacle;
    switch (type) {
      case 'spike':
        obstacle = {
          id: obstacleIdRef.current++,
          x: CANVAS_WIDTH,
          y: GROUND_Y - 30,
          width: 20,
          height: 30,
          type: 'spike'
        };
        break;
      case 'block':
        obstacle = {
          id: obstacleIdRef.current++,
          x: CANVAS_WIDTH,
          y: GROUND_Y - 50,
          width: 40,
          height: 50,
          type: 'block'
        };
        break;
      case 'laser':
        obstacle = {
          id: obstacleIdRef.current++,
          x: CANVAS_WIDTH,
          y: 200,
          width: 5,
          height: GROUND_Y - 200,
          type: 'laser'
        };
        break;
    }
    
    setObstacles(prev => [...prev, obstacle]);
  }, []);

  // Generate collectibles
  const generateCollectible = useCallback(() => {
    const types: ('coin' | 'gem' | 'power')[] = ['coin', 'gem', 'power'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const collectible: Collectible = {
      id: collectibleIdRef.current++,
      x: CANVAS_WIDTH,
      y: Math.random() * (GROUND_Y - 100) + 50,
      type,
      collected: false
    };
    
    setCollectibles(prev => [...prev, collectible]);
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      // Update player physics
      setPlayer(prev => {
        let newY = prev.y + prev.vy;
        let newVy = prev.vy + GRAVITY;
        let onGround = false;

        if (newY >= GROUND_Y - prev.height) {
          newY = GROUND_Y - prev.height;
          newVy = 0;
          onGround = true;
        }

        return { ...prev, y: newY, vy: newVy, onGround };
      });

      // Move obstacles
      setObstacles(prev => prev
        .map(obstacle => ({ ...obstacle, x: obstacle.x - speed }))
        .filter(obstacle => obstacle.x > -100)
      );

      // Move collectibles
      setCollectibles(prev => prev
        .map(collectible => ({ ...collectible, x: collectible.x - speed }))
        .filter(collectible => collectible.x > -50 && !collectible.collected)
      );

      // Update particles
      setParticles(prev => prev
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.5,
          life: p.life - 0.02
        }))
        .filter(p => p.life > 0)
      );

      // Generate new obstacles
      if (Math.random() < 0.02) {
        generateObstacle();
      }

      // Generate new collectibles
      if (Math.random() < 0.015) {
        generateCollectible();
      }

      // Check collisions with obstacles
      obstacles.forEach(obstacle => {
        if (checkCollision(player, obstacle)) {
          setGameState('gameOver');
          createParticles(player.x + player.width/2, player.y + player.height/2, '#ff0099', 15);
        }
      });

      // Check collisions with collectibles
      collectibles.forEach(collectible => {
        if (!collectible.collected && checkCollision(player, { ...collectible, width: 20, height: 20 })) {
          setCollectibles(prev => prev.map(c => 
            c.id === collectible.id ? { ...c, collected: true } : c
          ));
          
          let points = 0;
          switch (collectible.type) {
            case 'coin': points = 10; break;
            case 'gem': points = 50; break;
            case 'power': points = 100; break;
          }
          
          setScore(prev => prev + points);
          createParticles(collectible.x, collectible.y, '#0aff9d', 8);
        }
      });

      // Update distance and speed
      setDistance(prev => prev + speed);
      setSpeed(prev => Math.min(prev + 0.001, 12));

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, speed, player, obstacles, collectibles, checkCollision, generateObstacle, generateCollectible, createParticles]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with moving background
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0a0a0f');
    gradient.addColorStop(0.5, '#1a0a2a');
    gradient.addColorStop(1, '#0f0f1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw moving stars
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = Math.random() * 0.5 + 0.3;
      const x = ((distance * 0.1 + i * 123) % (CANVAS_WIDTH + 50)) - 50;
      const y = (i * 456) % CANVAS_HEIGHT;
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;

    // Draw ground
    ctx.fillStyle = '#333';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
    
    // Ground line effect
    ctx.strokeStyle = '#0aff9d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();

    // Draw player
    ctx.fillStyle = '#0aff9d';
    ctx.shadowColor = '#0aff9d';
    ctx.shadowBlur = 15;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.shadowBlur = 0;

    // Draw obstacles
    obstacles.forEach(obstacle => {
      switch (obstacle.type) {
        case 'spike':
          ctx.fillStyle = '#ff0099';
          ctx.shadowColor = '#ff0099';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(obstacle.x + obstacle.width/2, obstacle.y);
          ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
          ctx.lineTo(obstacle.x, obstacle.y + obstacle.height);
          ctx.closePath();
          ctx.fill();
          break;
        case 'block':
          ctx.fillStyle = '#7000ff';
          ctx.shadowColor = '#7000ff';
          ctx.shadowBlur = 10;
          ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
          break;
        case 'laser':
          ctx.fillStyle = '#ff0099';
          ctx.shadowColor = '#ff0099';
          ctx.shadowBlur = 15;
          ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
          break;
      }
      ctx.shadowBlur = 0;
    });

    // Draw collectibles
    collectibles.forEach(collectible => {
      if (!collectible.collected) {
        let color = '#ffffff';
        let symbol = '●';
        
        switch (collectible.type) {
          case 'coin':
            color = '#ffa500';
            symbol = '○';
            break;
          case 'gem':
            color = '#00ffff';
            symbol = '◆';
            break;
          case 'power':
            color = '#0aff9d';
            symbol = '★';
            break;
        }
        
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.font = '20px monospace';
        ctx.fillText(symbol, collectible.x, collectible.y + 20);
        ctx.shadowBlur = 0;
      }
    });

    // Draw particles
    particles.forEach(particle => {
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, 3, 3);
    });
    ctx.globalAlpha = 1;

    // Draw HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px monospace';
    ctx.fillText(`Distance: ${Math.floor(distance/10)}m`, 20, 40);
    ctx.fillText(`Speed: ${speed.toFixed(1)}`, 20, 70);

    if (gameState === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ffffff';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.textAlign = 'left';
    }

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px monospace';
      ctx.fillText(`Final Distance: ${Math.floor(distance/10)}m`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.textAlign = 'left';
    }
  });

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore(0);
    setDistance(0);
    setSpeed(5);
    setPlayer({ x: 100, y: 400, vy: 0, onGround: true, width: 30, height: 40 });
    setObstacles([]);
    setCollectibles([]);
    setParticles([]);
    setGameState('playing');
  };

  return (
    <GameLayout
      gameTitle="Infinite Runner"
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
            <p className="md:hidden">Tap to jump</p>
            <p className="hidden md:block">Spacebar or ↑ to jump • Avoid obstacles • Collect items</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default InfiniteRunner;
