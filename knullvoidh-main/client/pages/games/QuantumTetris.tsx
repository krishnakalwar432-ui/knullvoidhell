import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Position {
  x: number;
  y: number;
}

interface Block extends Position {
  color: string;
  quantum: boolean;
  superposition?: boolean;
}

interface Tetromino {
  shape: number[][];
  color: string;
  quantum: boolean;
  position: Position;
  rotation: number;
}

const QuantumTetris: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [grid, setGrid] = useState<(Block | null)[][]>([]);
  const [currentPiece, setCurrentPiece] = useState<Tetromino | null>(null);
  const [nextPiece, setNextPiece] = useState<Tetromino | null>(null);
  const [dropTime, setDropTime] = useState(1000);
  const [lastDrop, setLastDrop] = useState(Date.now());
  const [keys, setKeys] = useState<Set<string>>(new Set());

  const gameLoopRef = useRef<number>();

  // Game constants
  const GRID_WIDTH = 10;
  const GRID_HEIGHT = 20;
  const BLOCK_SIZE = 25;
  const CANVAS_WIDTH = GRID_WIDTH * BLOCK_SIZE + 200; // Extra space for UI
  const CANVAS_HEIGHT = GRID_HEIGHT * BLOCK_SIZE + 100;

  // Tetromino shapes
  const SHAPES = [
    { shape: [[1, 1, 1, 1]], color: '#00ffff', name: 'I' }, // I-piece
    { shape: [[1, 1], [1, 1]], color: '#ffff00', name: 'O' }, // O-piece
    { shape: [[0, 1, 0], [1, 1, 1]], color: '#800080', name: 'T' }, // T-piece
    { shape: [[0, 1, 1], [1, 1, 0]], color: '#00ff00', name: 'S' }, // S-piece
    { shape: [[1, 1, 0], [0, 1, 1]], color: '#ff0000', name: 'Z' }, // Z-piece
    { shape: [[1, 0, 0], [1, 1, 1]], color: '#ffa500', name: 'J' }, // J-piece
    { shape: [[0, 0, 1], [1, 1, 1]], color: '#0000ff', name: 'L' }  // L-piece
  ];

  // Initialize grid
  const initializeGrid = useCallback(() => {
    const newGrid: (Block | null)[][] = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      newGrid[y] = [];
      for (let x = 0; x < GRID_WIDTH; x++) {
        newGrid[y][x] = null;
      }
    }
    setGrid(newGrid);
  }, []);

  // Create new tetromino
  const createTetromino = useCallback((): Tetromino => {
    const shapeData = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const quantum = Math.random() < 0.2; // 20% chance for quantum piece
    
    return {
      shape: shapeData.shape,
      color: quantum ? '#0aff9d' : shapeData.color,
      quantum,
      position: { x: Math.floor(GRID_WIDTH / 2) - 1, y: 0 },
      rotation: 0
    };
  }, []);

  // Rotate tetromino
  const rotateTetromino = useCallback((tetromino: Tetromino): Tetromino => {
    const rotated = tetromino.shape[0].map((_, index) =>
      tetromino.shape.map(row => row[index]).reverse()
    );
    
    return {
      ...tetromino,
      shape: rotated,
      rotation: (tetromino.rotation + 90) % 360
    };
  }, []);

  // Check collision
  const checkCollision = useCallback((tetromino: Tetromino, deltaX = 0, deltaY = 0): boolean => {
    for (let y = 0; y < tetromino.shape.length; y++) {
      for (let x = 0; x < tetromino.shape[y].length; x++) {
        if (tetromino.shape[y][x]) {
          const newX = tetromino.position.x + x + deltaX;
          const newY = tetromino.position.y + y + deltaY;
          
          if (newX < 0 || newX >= GRID_WIDTH || newY >= GRID_HEIGHT) {
            return true;
          }
          
          if (newY >= 0 && grid[newY] && grid[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }, [grid]);

  // Place tetromino on grid
  const placeTetromino = useCallback((tetromino: Tetromino) => {
    const newGrid = [...grid];
    
    for (let y = 0; y < tetromino.shape.length; y++) {
      for (let x = 0; x < tetromino.shape[y].length; x++) {
        if (tetromino.shape[y][x]) {
          const gridY = tetromino.position.y + y;
          const gridX = tetromino.position.x + x;
          
          if (gridY >= 0 && gridY < GRID_HEIGHT && gridX >= 0 && gridX < GRID_WIDTH) {
            newGrid[gridY][gridX] = {
              x: gridX,
              y: gridY,
              color: tetromino.color,
              quantum: tetromino.quantum,
              superposition: tetromino.quantum && Math.random() < 0.3
            };
          }
        }
      }
    }
    
    setGrid(newGrid);
  }, [grid]);

  // Clear completed lines
  const clearLines = useCallback(() => {
    const newGrid = [...grid];
    let linesCleared = 0;
    let quantumBonus = 0;
    
    for (let y = GRID_HEIGHT - 1; y >= 0; y--) {
      if (newGrid[y] && newGrid[y].every(block => block !== null)) {
        // Check for quantum blocks in line
        const quantumBlocks = newGrid[y].filter(block => block?.quantum);
        if (quantumBlocks.length > 0) {
          quantumBonus += quantumBlocks.length * 50;
          
          // Quantum collapse effect - clear random blocks above
          for (let i = 0; i < quantumBlocks.length; i++) {
            const randomY = Math.floor(Math.random() * y);
            const randomX = Math.floor(Math.random() * GRID_WIDTH);
            if (newGrid[randomY][randomX]) {
              newGrid[randomY][randomX] = null;
            }
          }
        }
        
        newGrid.splice(y, 1);
        newGrid.unshift(new Array(GRID_WIDTH).fill(null));
        linesCleared++;
        y++; // Check the same line again
      }
    }
    
    if (linesCleared > 0) {
      setGrid(newGrid);
      setLines(prev => prev + linesCleared);
      setScore(prev => prev + (linesCleared * 100 * level) + quantumBonus);
      setLevel(Math.floor((lines + linesCleared) / 10) + 1);
      setDropTime(Math.max(100, 1000 - (level * 50)));
    }
  }, [grid, level, lines]);

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

  // Handle piece movement
  useEffect(() => {
    if (!currentPiece || gameState !== 'playing') return;

    const moveLeft = keys.has('arrowleft') || keys.has('a');
    const moveRight = keys.has('arrowright') || keys.has('d');
    const moveDown = keys.has('arrowdown') || keys.has('s');
    const rotate = keys.has('arrowup') || keys.has('w') || keys.has(' ');

    if (moveLeft && !checkCollision(currentPiece, -1, 0)) {
      setCurrentPiece(prev => prev ? { ...prev, position: { ...prev.position, x: prev.position.x - 1 } } : null);
    }

    if (moveRight && !checkCollision(currentPiece, 1, 0)) {
      setCurrentPiece(prev => prev ? { ...prev, position: { ...prev.position, x: prev.position.x + 1 } } : null);
    }

    if (moveDown && !checkCollision(currentPiece, 0, 1)) {
      setCurrentPiece(prev => prev ? { ...prev, position: { ...prev.position, y: prev.position.y + 1 } } : null);
      setLastDrop(Date.now());
    }

    if (rotate) {
      const rotated = rotateTetromino(currentPiece);
      if (!checkCollision(rotated)) {
        setCurrentPiece(rotated);
      }
    }
  }, [keys, currentPiece, checkCollision, rotateTetromino]);

  // Touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !currentPiece) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const width = rect.width;
    
    if (x < width / 3) {
      // Left third - move left
      if (!checkCollision(currentPiece, -1, 0)) {
        setCurrentPiece(prev => prev ? { ...prev, position: { ...prev.position, x: prev.position.x - 1 } } : null);
      }
    } else if (x > width * 2 / 3) {
      // Right third - move right
      if (!checkCollision(currentPiece, 1, 0)) {
        setCurrentPiece(prev => prev ? { ...prev, position: { ...prev.position, x: prev.position.x + 1 } } : null);
      }
    } else {
      // Middle - rotate
      const rotated = rotateTetromino(currentPiece);
      if (!checkCollision(rotated)) {
        setCurrentPiece(rotated);
      }
    }
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      const now = Date.now();
      
      if (now - lastDrop > dropTime) {
        if (currentPiece) {
          if (!checkCollision(currentPiece, 0, 1)) {
            setCurrentPiece(prev => prev ? { ...prev, position: { ...prev.position, y: prev.position.y + 1 } } : null);
          } else {
            // Piece landed
            placeTetromino(currentPiece);
            clearLines();
            setCurrentPiece(nextPiece);
            setNextPiece(createTetromino());
            
            // Check game over
            if (nextPiece && checkCollision(nextPiece)) {
              setGameState('gameOver');
            }
          }
        } else {
          setCurrentPiece(createTetromino());
          setNextPiece(createTetromino());
        }
        
        setLastDrop(now);
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, currentPiece, nextPiece, lastDrop, dropTime, checkCollision, placeTetromino, clearLines, createTetromino]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid background
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let x = 0; x <= GRID_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * BLOCK_SIZE, 0);
      ctx.lineTo(x * BLOCK_SIZE, GRID_HEIGHT * BLOCK_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= GRID_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * BLOCK_SIZE);
      ctx.lineTo(GRID_WIDTH * BLOCK_SIZE, y * BLOCK_SIZE);
      ctx.stroke();
    }

    // Draw placed blocks
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const block = grid[y] && grid[y][x];
        if (block) {
          ctx.fillStyle = block.color;
          if (block.quantum) {
            ctx.shadowColor = block.color;
            ctx.shadowBlur = 10;
          }
          ctx.fillRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
          
          if (block.superposition) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
          }
          
          ctx.shadowBlur = 0;
        }
      }
    }

    // Draw current piece
    if (currentPiece) {
      ctx.fillStyle = currentPiece.color;
      if (currentPiece.quantum) {
        ctx.shadowColor = currentPiece.color;
        ctx.shadowBlur = 15;
      }
      
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const blockX = (currentPiece.position.x + x) * BLOCK_SIZE;
            const blockY = (currentPiece.position.y + y) * BLOCK_SIZE;
            ctx.fillRect(blockX + 1, blockY + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
          }
        }
      }
      ctx.shadowBlur = 0;
    }

    // Draw UI
    const uiX = GRID_WIDTH * BLOCK_SIZE + 20;
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}`, uiX, 30);
    ctx.fillText(`Level: ${level}`, uiX, 50);
    ctx.fillText(`Lines: ${lines}`, uiX, 70);

    // Draw next piece
    if (nextPiece) {
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Next:', uiX, 110);
      
      ctx.fillStyle = nextPiece.color;
      if (nextPiece.quantum) {
        ctx.shadowColor = nextPiece.color;
        ctx.shadowBlur = 10;
      }
      
      for (let y = 0; y < nextPiece.shape.length; y++) {
        for (let x = 0; x < nextPiece.shape[y].length; x++) {
          if (nextPiece.shape[y][x]) {
            ctx.fillRect(
              uiX + x * 20, 
              130 + y * 20, 
              18, 18
            );
          }
        }
      }
      ctx.shadowBlur = 0;
    }

    // Draw quantum info
    ctx.fillStyle = '#0aff9d';
    ctx.font = '12px monospace';
    ctx.fillText('Quantum blocks:', uiX, 220);
    ctx.fillText('- Glow effect', uiX, 240);
    ctx.fillText('- Bonus collapse', uiX, 255);

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ff0099';
      ctx.font = '32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px monospace';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.textAlign = 'left';
    }

    if (gameState === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ffffff';
      ctx.font = '32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.textAlign = 'left';
    }
  });

  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore(0);
    setLevel(1);
    setLines(0);
    setDropTime(1000);
    setCurrentPiece(null);
    setNextPiece(null);
    initializeGrid();
    setGameState('playing');
  };

  return (
    <GameLayout
      gameTitle="Quantum Tetris"
      gameCategory="Puzzle"
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
            <p className="md:hidden">Left/Right sides to move • Center to rotate</p>
            <p className="hidden md:block">Arrow keys to move • Up/Space to rotate • Down to drop faster</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default QuantumTetris;
