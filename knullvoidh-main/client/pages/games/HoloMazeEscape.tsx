import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';
import { 
  getSafeCanvas2DContext, 
  createSafeAnimationManager, 
  createSafeKeyManager,
  clamp,
  gameManager
} from '@/utils/universalGameFix';

interface Position {
  x: number;
  y: number;
}

const HoloMazeEscape: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'won' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [player, setPlayer] = useState<Position>({ x: 1, y: 1 });
  const [maze, setMaze] = useState<number[][]>([]);
  const [exit, setExit] = useState<Position>({ x: 18, y: 18 });
  const [timeLeft, setTimeLeft] = useState(60);

  const keyManagerRef = useRef(createSafeKeyManager());
  const animationManagerRef = useRef(createSafeAnimationManager());
  const gameId = 'holo-maze-escape';

  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 600;
  const MAZE_SIZE = 20;
  const CELL_SIZE = CANVAS_WIDTH / MAZE_SIZE;

  // Generate maze using simple algorithm
  const generateMaze = useCallback(() => {
    const newMaze: number[][] = Array(MAZE_SIZE).fill(0).map(() => Array(MAZE_SIZE).fill(1));
    
    // Simple maze generation - create paths
    for (let y = 1; y < MAZE_SIZE - 1; y += 2) {
      for (let x = 1; x < MAZE_SIZE - 1; x += 2) {
        newMaze[y][x] = 0; // Create open space
        
        // Random path direction
        if (Math.random() > 0.5 && x + 2 < MAZE_SIZE - 1) {
          newMaze[y][x + 1] = 0;
        }
        if (Math.random() > 0.5 && y + 2 < MAZE_SIZE - 1) {
          newMaze[y + 1][x] = 0;
        }
      }
    }
    
    // Ensure start and exit are open
    newMaze[1][1] = 0;
    newMaze[MAZE_SIZE - 2][MAZE_SIZE - 2] = 0;
    
    setMaze(newMaze);
    setPlayer({ x: 1, y: 1 });
    setExit({ x: MAZE_SIZE - 2, y: MAZE_SIZE - 2 });
  }, []);

  // Initialize game
  useEffect(() => {
    gameManager.registerGame(gameId);
    generateMaze();
    
    return () => {
      gameManager.unregisterGame(gameId);
      keyManagerRef.current.cleanup();
      animationManagerRef.current.stop();
    };
  }, [generateMaze]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      try {
        const keyManager = keyManagerRef.current;
        
        // Move player
        setPlayer(prev => {
          let newX = prev.x;
          let newY = prev.y;

          if (keyManager.isPressed('w') || keyManager.isPressed('arrowup')) {
            newY = Math.max(0, prev.y - 1);
          }
          if (keyManager.isPressed('s') || keyManager.isPressed('arrowdown')) {
            newY = Math.min(MAZE_SIZE - 1, prev.y + 1);
          }
          if (keyManager.isPressed('a') || keyManager.isPressed('arrowleft')) {
            newX = Math.max(0, prev.x - 1);
          }
          if (keyManager.isPressed('d') || keyManager.isPressed('arrowright')) {
            newX = Math.min(MAZE_SIZE - 1, prev.x + 1);
          }

          // Check wall collision
          if (maze[newY] && maze[newY][newX] === 1) {
            return prev;
          }

          return { x: newX, y: newY };
        });

        // Update timer
        setTimeLeft(prev => {
          const newTime = prev - 0.016; // ~60fps
          if (newTime <= 0) {
            setGameState('gameOver');
            return 0;
          }
          return newTime;
        });

        // Check win condition
        if (player.x === exit.x && player.y === exit.y) {
          setScore(prev => prev + Math.floor(timeLeft * 10) + level * 100);
          setLevel(prev => prev + 1);
          setTimeLeft(60 + level * 5); // More time for harder levels
          generateMaze();
        }
        
      } catch (error) {
        console.error('HoloMazeEscape game loop error:', error);
        setGameState('gameOver');
      }
    };
    
    animationManagerRef.current.start(gameLoop);
    
    return () => {
      animationManagerRef.current.stop();
    };
  }, [gameState, player, maze, exit, timeLeft, level, generateMaze]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = getSafeCanvas2DContext(canvas);
    if (!ctx) return;

    try {
      // Clear with holographic background
      const gradient = ctx.createRadialGradient(
        CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 0,
        CANVAS_WIDTH/2, CANVAS_HEIGHT/2, CANVAS_WIDTH/2
      );
      gradient.addColorStop(0, '#001122');
      gradient.addColorStop(1, '#000011');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw maze
      maze.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell === 1) {
            // Wall
            ctx.fillStyle = '#00ffaa';
            ctx.shadowColor = '#00ffaa';
            ctx.shadowBlur = 10;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            ctx.shadowBlur = 0;
          }
        });
      });

      // Draw exit
      ctx.fillStyle = '#ff0099';
      ctx.shadowColor = '#ff0099';
      ctx.shadowBlur = 15;
      ctx.fillRect(exit.x * CELL_SIZE + 2, exit.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      ctx.shadowBlur = 0;

      // Draw player
      ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(
        player.x * CELL_SIZE + CELL_SIZE/2,
        player.y * CELL_SIZE + CELL_SIZE/2,
        CELL_SIZE/3,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;

      // UI
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px monospace';
      ctx.fillText(`Level: ${level}`, 10, 25);
      ctx.fillText(`Score: ${score}`, 10, 45);
      ctx.fillText(`Time: ${Math.ceil(timeLeft)}s`, 10, 65);

      // Game state overlays
      if (gameState === 'gameOver') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        ctx.fillStyle = '#ff0040';
        ctx.font = '48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TIME UP!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        
        ctx.font = '24px monospace';
        ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
        ctx.fillText('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
        ctx.textAlign = 'left';
      } else if (gameState === 'paused') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        ctx.fillStyle = '#00ffff';
        ctx.font = '36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.textAlign = 'left';
      }
      
    } catch (error) {
      console.error('HoloMazeEscape render error:', error);
    }
  }, [gameState, player, maze, exit, score, level, timeLeft]);

  // Handle special keys
  useEffect(() => {
    const handleSpecialKeys = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      if (key === 'r' && gameState === 'gameOver') {
        setScore(0);
        setLevel(1);
        setTimeLeft(60);
        setGameState('playing');
        generateMaze();
      }
      
      if (key === 'p' || key === ' ') {
        setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
      }
    };

    window.addEventListener('keydown', handleSpecialKeys);
    return () => window.removeEventListener('keydown', handleSpecialKeys);
  }, [gameState, generateMaze]);

  return (
    <GameLayout 
      gameTitle="Holo Maze Escape" 
      gameCategory="Puzzle maze with holographic effects"
      score={gameState === 'playing' ? score : undefined}
      isPlaying={gameState === 'playing'}
    >
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-cyan-500 bg-black rounded-lg shadow-2xl"
        />
        <div className="text-center space-y-2">
          <p className="text-gray-300">WASD: Move | P: Pause | R: Restart</p>
          <p className="text-gray-400">Navigate the holographic maze before time runs out!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default HoloMazeEscape;
