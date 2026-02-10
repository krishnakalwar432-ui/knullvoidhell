import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Position {
  x: number;
  y: number;
}

interface SnakeSegment extends Position {
  id: number;
}

interface Food extends Position {
  id: number;
  type: 'normal' | 'power' | 'speed' | 'slow';
  value: number;
  color: string;
}

interface Particle extends Position {
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

const PlasmaSnake: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [snake, setSnake] = useState<SnakeSegment[]>([]);
  const [direction, setDirection] = useState<Position>({ x: 1, y: 0 });
  const [nextDirection, setNextDirection] = useState<Position>({ x: 1, y: 0 });
  const [food, setFood] = useState<Food[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [speed, setSpeed] = useState(150);
  const [powerMode, setPowerMode] = useState(0);
  const [keys, setKeys] = useState<Set<string>>(new Set());

  const gameLoopRef = useRef<number>();
  const lastMoveRef = useRef(Date.now());
  const segmentIdRef = useRef(0);
  const foodIdRef = useRef(0);
  const initializedRef = useRef(false);

  // Game constants
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const GRID_SIZE = 20;
  const GRID_WIDTH = CANVAS_WIDTH / GRID_SIZE;
  const GRID_HEIGHT = CANVAS_HEIGHT / GRID_SIZE;

  // Initialize snake
  const initializeSnake = useCallback(() => {
    const initialSnake: SnakeSegment[] = [];
    for (let i = 0; i < 3; i++) {
      initialSnake.push({
        id: segmentIdRef.current++,
        x: 5 - i,
        y: 5
      });
    }
    setSnake(initialSnake);
  }, []);

  // Create particles
  const createParticles = useCallback((x: number, y: number, color: string, count: number = 8) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x: x * GRID_SIZE + GRID_SIZE / 2,
        y: y * GRID_SIZE + GRID_SIZE / 2,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color,
        size: Math.random() * 4 + 2
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Generate food
  const generateFood = useCallback(() => {
    const types: Food['type'][] = ['normal', 'normal', 'normal', 'power', 'speed', 'slow'];
    const type = types[Math.floor(Math.random() * types.length)];

    let color = '#0aff9d';
    let value = 10;

    switch (type) {
      case 'normal':
        color = '#0aff9d';
        value = 10;
        break;
      case 'power':
        color = '#ff0099';
        value = 50;
        break;
      case 'speed':
        color = '#00ffff';
        value = 20;
        break;
      case 'slow':
        color = '#ffa500';
        value = 15;
        break;
    }

    // Simple random position (collision check will happen in game loop)
    const x = Math.floor(Math.random() * GRID_WIDTH);
    const y = Math.floor(Math.random() * GRID_HEIGHT);

    const newFood: Food = {
      id: foodIdRef.current++,
      x,
      y,
      type,
      value,
      color
    };

    setFood(prev => [...prev, newFood]);
  }, []);

  // Handle input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => new Set([...prev, e.key.toLowerCase()]));
      
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          if (direction.y === 0) setNextDirection({ x: 0, y: -1 });
          break;
        case 'arrowdown':
        case 's':
          if (direction.y === 0) setNextDirection({ x: 0, y: 1 });
          break;
        case 'arrowleft':
        case 'a':
          if (direction.x === 0) setNextDirection({ x: -1, y: 0 });
          break;
        case 'arrowright':
        case 'd':
          if (direction.x === 0) setNextDirection({ x: 1, y: 0 });
          break;
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
  }, [direction]);

  // Touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal movement
      if (deltaX > 0 && direction.x === 0) {
        setNextDirection({ x: 1, y: 0 });
      } else if (deltaX < 0 && direction.x === 0) {
        setNextDirection({ x: -1, y: 0 });
      }
    } else {
      // Vertical movement
      if (deltaY > 0 && direction.y === 0) {
        setNextDirection({ x: 0, y: 1 });
      } else if (deltaY < 0 && direction.y === 0) {
        setNextDirection({ x: 0, y: -1 });
      }
    }
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      const now = Date.now();
      
      if (now - lastMoveRef.current > speed) {
        // Update direction
        setDirection(nextDirection);
        
        // Move snake
        setSnake(prev => {
          const newSnake = [...prev];
          const head = newSnake[0];
          const newHead: SnakeSegment = {
            id: segmentIdRef.current++,
            x: head.x + nextDirection.x,
            y: head.y + nextDirection.y
          };

          // Check wall collision
          if (newHead.x < 0 || newHead.x >= GRID_WIDTH || 
              newHead.y < 0 || newHead.y >= GRID_HEIGHT) {
            setGameState('gameOver');
            return prev;
          }

          // Check self collision
          if (powerMode === 0 && newSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
            setGameState('gameOver');
            return prev;
          }

          newSnake.unshift(newHead);

          // Check food collision
          const eatenFood = food.find(f => f.x === newHead.x && f.y === newHead.y);
          if (eatenFood) {
            setScore(prev => prev + eatenFood.value);
            createParticles(eatenFood.x, eatenFood.y, eatenFood.color, 12);

            setFood(prev => prev.filter(f => f.id !== eatenFood.id));
            
            // Apply food effects
            switch (eatenFood.type) {
              case 'power':
                setPowerMode(100); // 100 frames of power mode
                break;
              case 'speed':
                setSpeed(prev => Math.max(prev - 20, 50));
                break;
              case 'slow':
                setSpeed(prev => Math.min(prev + 30, 300));
                break;
            }
          } else {
            newSnake.pop(); // Remove tail if no food eaten
          }

          return newSnake;
        });

        lastMoveRef.current = now;
      }

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

      // Update power mode
      if (powerMode > 0) {
        setPowerMode(prev => prev - 1);
      }

      // Generate food
      if (food.length < 3 && Math.random() < 0.02) {
        generateFood();
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, nextDirection, snake, food, speed, powerMode, createParticles, generateFood]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with plasma background
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0a0a0f');
    gradient.addColorStop(0.5, powerMode > 0 ? '#2a0a2a' : '#1a0a2a');
    gradient.addColorStop(1, '#0f0f1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    ctx.strokeStyle = powerMode > 0 ? '#ff009950' : '#33333350';
    ctx.lineWidth = 1;
    for (let x = 0; x <= GRID_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * GRID_SIZE, 0);
      ctx.lineTo(x * GRID_SIZE, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= GRID_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * GRID_SIZE);
      ctx.lineTo(CANVAS_WIDTH, y * GRID_SIZE);
      ctx.stroke();
    }

    // Draw food
    food.forEach(item => {
      ctx.fillStyle = item.color;
      ctx.shadowColor = item.color;
      ctx.shadowBlur = 15;
      
      const x = item.x * GRID_SIZE + GRID_SIZE / 2;
      const y = item.y * GRID_SIZE + GRID_SIZE / 2;
      
      if (item.type === 'normal') {
        ctx.beginPath();
        ctx.arc(x, y, GRID_SIZE / 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Special food - draw with pulsing effect
        const pulseSize = (GRID_SIZE / 3) + Math.sin(Date.now() * 0.01) * 3;
        ctx.beginPath();
        ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw symbol
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 0;
        let symbol = '';
        switch (item.type) {
          case 'power': symbol = '⚡'; break;
          case 'speed': symbol = '⚡'; break;
          case 'slow': symbol = '🐌'; break;
        }
        ctx.fillText(symbol, x, y + 4);
      }
      ctx.shadowBlur = 0;
    });

    // Draw snake
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      ctx.fillStyle = powerMode > 0 ? '#ff0099' : (isHead ? '#0aff9d' : '#7000ff');
      ctx.shadowColor = powerMode > 0 ? '#ff0099' : (isHead ? '#0aff9d' : '#7000ff');
      ctx.shadowBlur = powerMode > 0 ? 20 : 10;
      
      const x = segment.x * GRID_SIZE + 2;
      const y = segment.y * GRID_SIZE + 2;
      const size = GRID_SIZE - 4;
      
      ctx.fillRect(x, y, size, size);
      
      if (isHead) {
        // Draw eyes
        ctx.fillStyle = '#000000';
        ctx.shadowBlur = 0;
        ctx.fillRect(x + 4, y + 4, 3, 3);
        ctx.fillRect(x + size - 7, y + 4, 3, 3);
      }
    });
    ctx.shadowBlur = 0;

    // Draw particles
    particles.forEach(particle => {
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1;

    // Draw HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px monospace';
    ctx.fillText(`Score: ${score}`, 20, 40);
    ctx.fillText(`Length: ${snake.length}`, 20, 70);
    
    if (powerMode > 0) {
      ctx.fillStyle = '#ff0099';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(`POWER MODE: ${Math.ceil(powerMode / 10)}`, 20, 100);
    }

    if (gameState === 'gameOver') {
      // Update high score
      if (score > highScore) {
        setHighScore(score);
      }
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px monospace';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.fillText(`High Score: ${Math.max(score, highScore)}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
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
    if (!initializedRef.current) {
      initializeSnake();
      generateFood();
      initializedRef.current = true;
    }
  }, []);

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore(0);
    setSpeed(150);
    setPowerMode(0);
    setDirection({ x: 1, y: 0 });
    setNextDirection({ x: 1, y: 0 });
    setFood([]);
    setParticles([]);
    segmentIdRef.current = 0;
    foodIdRef.current = 0;
    initializedRef.current = false;
    initializeSnake();
    generateFood();
    setGameState('playing');
  };

  return (
    <GameLayout
      gameTitle="Plasma Snake"
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
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p className="md:hidden">Tap screen edges to change direction</p>
            <p className="hidden md:block">Arrow keys or WASD to move • Collect glowing food</p>
            <p className="text-xs">⚡ Power/Speed boost • 🐌 Slow down • Red = Power mode</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default PlasmaSnake;
