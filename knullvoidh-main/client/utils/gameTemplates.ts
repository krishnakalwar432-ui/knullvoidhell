// This file contains templates for quickly generating game components
// Each template includes basic game mechanics, mobile controls, and the cosmic theme

export const createGameTemplate = (
  gameName: string,
  gameId: string,
  category: string,
  gameLogic: string
) => {
  return `import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

const ${gameName}: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const gameLoopRef = useRef<number>();

  // Game constants
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  ${gameLogic}

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore(0);
    setGameState('playing');
  };

  return (
    <GameLayout
      gameTitle="${gameName.replace(/([A-Z])/g, ' $1').trim()}"
      gameCategory="${category}"
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
            <p>Game controls and instructions here</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default ${gameName};`;
};

// Specific game logic templates
export const gameLogics = {
  clicker: `
  const [clicks, setClicks] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  const handleClick = () => {
    setClicks(prev => prev + multiplier);
    setScore(prev => prev + multiplier);
  };

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw click button
    ctx.fillStyle = '#0aff9d';
    ctx.shadowColor = '#0aff9d';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 100, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw score
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(score.toString(), CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
  });
  `,

  shooter: `
  const [enemies, setEnemies] = useState<Array<{x: number, y: number, id: number}>>([]);
  const [bullets, setBullets] = useState<Array<{x: number, y: number, id: number}>>([]);
  const [player, setPlayer] = useState({x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT - 50});

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const gameLoop = () => {
      // Move bullets
      setBullets(prev => prev
        .map(bullet => ({...bullet, y: bullet.y - 5}))
        .filter(bullet => bullet.y > 0)
      );
      
      // Move enemies
      setEnemies(prev => prev
        .map(enemy => ({...enemy, y: enemy.y + 2}))
        .filter(enemy => enemy.y < CANVAS_HEIGHT)
      );
      
      // Spawn enemies
      if (Math.random() < 0.02) {
        setEnemies(prev => [...prev, {
          x: Math.random() * CANVAS_WIDTH,
          y: 0,
          id: Date.now()
        }]);
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState]);
  `,

  puzzle: `
  const [grid, setGrid] = useState<number[][]>([]);
  const [moves, setMoves] = useState(0);

  // Initialize grid
  useEffect(() => {
    const newGrid = Array(8).fill(null).map(() => Array(8).fill(0));
    // Add puzzle logic here
    setGrid(newGrid);
  }, []);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    const cellSize = 50;
    grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        ctx.fillStyle = cell ? '#0aff9d' : '#333';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize - 2, cellSize - 2);
      });
    });
  });
  `
};
