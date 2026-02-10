import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Block {
  x: number;
  y: number;
  color: string;
  glow: string;
}

interface Piece {
  blocks: Block[];
  centerX: number;
  centerY: number;
  type: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

const NeonBlocks = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();

  const GRID_WIDTH = 10;
  const GRID_HEIGHT = 20;
  const BLOCK_SIZE = 25;
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 550;

  const neonColors = [
    { fill: '#ff0080', glow: '#ff66b3' }, // Hot pink
    { fill: '#00ff80', glow: '#66ffb3' }, // Neon green
    { fill: '#8000ff', glow: '#b366ff' }, // Purple
    { fill: '#ff8000', glow: '#ffb366' }, // Orange
    { fill: '#0080ff', glow: '#66b3ff' }, // Blue
    { fill: '#ffff00', glow: '#ffff66' }, // Yellow
    { fill: '#ff0040', glow: '#ff6680' }  // Red
  ];

  const tetrominoes = [
    { // I-piece
      type: 'I',
      blocks: [
        { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }
      ]
    },
    { // O-piece
      type: 'O',
      blocks: [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }
      ]
    },
    { // T-piece
      type: 'T',
      blocks: [
        { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }
      ]
    },
    { // S-piece
      type: 'S',
      blocks: [
        { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }
      ]
    },
    { // Z-piece
      type: 'Z',
      blocks: [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }
      ]
    },
    { // J-piece
      type: 'J',
      blocks: [
        { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }
      ]
    },
    { // L-piece
      type: 'L',
      blocks: [
        { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }
      ]
    }
  ];

  const [gameState, setGameState] = useState({
    grid: [] as (Block | null)[][],
    currentPiece: null as Piece | null,
    nextPiece: null as Piece | null,
    score: 0,
    level: 1,
    lines: 0,
    gameOver: false,
    paused: false,
    dropTime: 1000,
    lastDrop: 0,
    particles: [] as Particle[]
  });

  const initializeGrid = () => {
    const newGrid: (Block | null)[][] = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      newGrid[y] = [];
      for (let x = 0; x < GRID_WIDTH; x++) {
        newGrid[y][x] = null;
      }
    }
    return newGrid;
  };

  const createPiece = (type?: string) => {
    const pieceType = type ? tetrominoes.find(t => t.type === type) || tetrominoes[0] : tetrominoes[Math.floor(Math.random() * tetrominoes.length)];
    const color = neonColors[Math.floor(Math.random() * neonColors.length)];

    const blocks = pieceType.blocks.map(block => ({
      x: block.x,
      y: block.y,
      color: color.fill,
      glow: color.glow
    }));

    return {
      blocks,
      centerX: 4,
      centerY: 0,
      type: pieceType.type
    };
  };

  const rotatePiece = (piece: Piece): Piece => {
    if (piece.type === 'O') return piece; // O-piece doesn't rotate
    
    const rotatedBlocks = piece.blocks.map(block => {
      const relativeX = block.x - 1;
      const relativeY = block.y - 1;
      return {
        ...block,
        x: -relativeY + 1,
        y: relativeX + 1
      };
    });

    return {
      ...piece,
      blocks: rotatedBlocks
    };
  };

  const isValidPosition = (piece: Piece, grid: (Block | null)[][], offsetX = 0, offsetY = 0) => {
    for (const block of piece.blocks) {
      const newX = piece.centerX + block.x + offsetX;
      const newY = piece.centerY + block.y + offsetY;
      
      if (newX < 0 || newX >= GRID_WIDTH || newY >= GRID_HEIGHT) {
        return false;
      }
      
      if (newY >= 0 && grid[newY][newX] !== null) {
        return false;
      }
    }
    return true;
  };

  const placePiece = (piece: Piece, grid: (Block | null)[][]) => {
    const newGrid = grid.map(row => [...row]);
    
    for (const block of piece.blocks) {
      const x = piece.centerX + block.x;
      const y = piece.centerY + block.y;
      
      if (y >= 0) {
        newGrid[y][x] = {
          x: x * BLOCK_SIZE + 200,
          y: y * BLOCK_SIZE + 50,
          color: block.color,
          glow: block.glow
        };
      }
    }
    
    return newGrid;
  };

  const clearLines = (grid: (Block | null)[][]) => {
    const newGrid = [...grid];
    const clearedLines: number[] = [];
    
    for (let y = GRID_HEIGHT - 1; y >= 0; y--) {
      if (newGrid[y].every(block => block !== null)) {
        clearedLines.push(y);
        newGrid.splice(y, 1);
        newGrid.unshift(new Array(GRID_WIDTH).fill(null));
      }
    }
    
    return { newGrid, clearedLines };
  };

  const createClearParticles = (clearedLines: number[]) => {
    const particles: Particle[] = [];
    
    clearedLines.forEach(lineY => {
      for (let x = 0; x < GRID_WIDTH; x++) {
        for (let i = 0; i < 3; i++) {
          particles.push({
            x: 200 + x * BLOCK_SIZE + BLOCK_SIZE / 2,
            y: 50 + lineY * BLOCK_SIZE + BLOCK_SIZE / 2,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 60,
            maxLife: 60,
            color: neonColors[Math.floor(Math.random() * neonColors.length)].fill,
            size: Math.random() * 4 + 2
          });
        }
      }
    });
    
    return particles;
  };

  const update = useCallback(() => {
    if (gameState.gameOver || gameState.paused) return;

    setGameState(prev => {
      const newState = { ...prev };
      const currentTime = Date.now();

      // Initialize game if needed
      if (newState.grid.length === 0) {
        newState.grid = initializeGrid();
        newState.currentPiece = createPiece();
        newState.nextPiece = createPiece();
      }

      // Auto drop
      if (currentTime - newState.lastDrop > newState.dropTime && newState.currentPiece) {
        if (isValidPosition(newState.currentPiece, newState.grid, 0, 1)) {
          newState.currentPiece.centerY += 1;
        } else {
          // Place piece and get new one
          newState.grid = placePiece(newState.currentPiece, newState.grid);
          
          // Clear lines
          const { newGrid, clearedLines } = clearLines(newState.grid);
          newState.grid = newGrid;
          
          if (clearedLines.length > 0) {
            const lineScore = [0, 100, 300, 500, 800];
            newState.score += lineScore[clearedLines.length] * newState.level;
            newState.lines += clearedLines.length;
            newState.level = Math.floor(newState.lines / 10) + 1;
            newState.dropTime = Math.max(100, 1000 - (newState.level - 1) * 50);
            
            // Add particles for cleared lines
            newState.particles.push(...createClearParticles(clearedLines));
          }
          
          // Get new piece
          newState.currentPiece = newState.nextPiece;
          newState.nextPiece = createPiece();
          
          // Check game over
          if (!isValidPosition(newState.currentPiece, newState.grid)) {
            newState.gameOver = true;
          }
        }
        newState.lastDrop = currentTime;
      }

      // Update particles
      newState.particles = newState.particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        return particle.life > 0;
      });

      return newState;
    });
  }, [gameState.gameOver, gameState.paused]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with dark background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid background
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= GRID_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(200 + x * BLOCK_SIZE, 50);
      ctx.lineTo(200 + x * BLOCK_SIZE, 50 + GRID_HEIGHT * BLOCK_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= GRID_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(200, 50 + y * BLOCK_SIZE);
      ctx.lineTo(200 + GRID_WIDTH * BLOCK_SIZE, 50 + y * BLOCK_SIZE);
      ctx.stroke();
    }

    // Draw placed blocks
    gameState.grid.forEach((row, y) => {
      row.forEach((block, x) => {
        if (block) {
          const blockX = 200 + x * BLOCK_SIZE;
          const blockY = 50 + y * BLOCK_SIZE;
          
          // Glow effect
          ctx.shadowColor = block.glow;
          ctx.shadowBlur = 15;
          ctx.fillStyle = block.color;
          ctx.fillRect(blockX + 2, blockY + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
          
          // Inner glow
          ctx.shadowBlur = 8;
          ctx.fillStyle = 'white';
          ctx.fillRect(blockX + 6, blockY + 6, BLOCK_SIZE - 12, BLOCK_SIZE - 12);
          
          ctx.shadowBlur = 0;
        }
      });
    });

    // Draw current piece
    if (gameState.currentPiece) {
      gameState.currentPiece.blocks.forEach(block => {
        const blockX = 200 + (gameState.currentPiece!.centerX + block.x) * BLOCK_SIZE;
        const blockY = 50 + (gameState.currentPiece!.centerY + block.y) * BLOCK_SIZE;
        
        if (blockY >= 50) {
          ctx.shadowColor = block.glow;
          ctx.shadowBlur = 15;
          ctx.fillStyle = block.color;
          ctx.fillRect(blockX + 2, blockY + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
          
          ctx.shadowBlur = 8;
          ctx.fillStyle = 'white';
          ctx.fillRect(blockX + 6, blockY + 6, BLOCK_SIZE - 12, BLOCK_SIZE - 12);
          
          ctx.shadowBlur = 0;
        }
      });
    }

    // Draw particles
    gameState.particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw next piece preview
    ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.fillRect(450, 80, 120, 100);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(450, 80, 120, 100);
    
    ctx.fillStyle = '#00ffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('NEXT', 510, 70);

    if (gameState.nextPiece) {
      gameState.nextPiece.blocks.forEach(block => {
        const blockX = 470 + block.x * 20;
        const blockY = 100 + block.y * 20;
        
        ctx.shadowColor = block.glow;
        ctx.shadowBlur = 10;
        ctx.fillStyle = block.color;
        ctx.fillRect(blockX, blockY, 18, 18);
        ctx.shadowBlur = 0;
      });
    }

    // Draw UI
    ctx.fillStyle = '#00ffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${gameState.score}`, 20, 100);
    ctx.fillText(`Level: ${gameState.level}`, 20, 130);
    ctx.fillText(`Lines: ${gameState.lines}`, 20, 160);

    ctx.font = '16px Arial';
    ctx.fillText('Controls:', 20, 220);
    ctx.fillText('← → : Move', 20, 240);
    ctx.fillText('↓ : Soft drop', 20, 260);
    ctx.fillText('↑ : Rotate', 20, 280);
    ctx.fillText('Space: Hard drop', 20, 300);
    ctx.fillText('P: Pause', 20, 320);

    if (gameState.paused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#00ffff';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px Arial';
      ctx.fillText('Press P to resume', canvas.width / 2, canvas.height / 2 + 50);
    }

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#ff0080';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.fillStyle = '#00ffff';
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 50);
    }
  }, [gameState]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState.gameOver) {
      if (e.key === 'r') {
        setGameState({
          grid: [],
          currentPiece: null,
          nextPiece: null,
          score: 0,
          level: 1,
          lines: 0,
          gameOver: false,
          paused: false,
          dropTime: 1000,
          lastDrop: 0,
          particles: []
        });
      }
      return;
    }

    if (e.key === 'p') {
      setGameState(prev => ({ ...prev, paused: !prev.paused }));
      return;
    }

    if (gameState.paused || !gameState.currentPiece) return;

    const piece = gameState.currentPiece;

    if (e.key === 'ArrowLeft' && isValidPosition(piece, gameState.grid, -1, 0)) {
      setGameState(prev => ({
        ...prev,
        currentPiece: { ...prev.currentPiece!, centerX: prev.currentPiece!.centerX - 1 }
      }));
    } else if (e.key === 'ArrowRight' && isValidPosition(piece, gameState.grid, 1, 0)) {
      setGameState(prev => ({
        ...prev,
        currentPiece: { ...prev.currentPiece!, centerX: prev.currentPiece!.centerX + 1 }
      }));
    } else if (e.key === 'ArrowDown' && isValidPosition(piece, gameState.grid, 0, 1)) {
      setGameState(prev => ({
        ...prev,
        currentPiece: { ...prev.currentPiece!, centerY: prev.currentPiece!.centerY + 1 },
        score: prev.score + 1
      }));
    } else if (e.key === 'ArrowUp') {
      const rotatedPiece = rotatePiece(piece);
      if (isValidPosition(rotatedPiece, gameState.grid)) {
        setGameState(prev => ({ ...prev, currentPiece: rotatedPiece }));
      }
    } else if (e.key === ' ') {
      // Hard drop
      let dropDistance = 0;
      while (isValidPosition(piece, gameState.grid, 0, dropDistance + 1)) {
        dropDistance++;
      }
      setGameState(prev => ({
        ...prev,
        currentPiece: { ...prev.currentPiece!, centerY: prev.currentPiece!.centerY + dropDistance },
        score: prev.score + dropDistance * 2,
        lastDrop: 0 // Force immediate placement
      }));
    }
  }, [gameState]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    gameLoopRef.current = setInterval(() => {
      update();
      render();
    }, 1000 / 60);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [update, render]);

  return (
    <GameLayout gameTitle="Neon Blocks" gameCategory="Glowing tetris-style puzzle">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-cyan-400 bg-black rounded-lg"
          style={{ boxShadow: '0 0 20px #00ffff' }}
        />
        <div className="text-center text-gray-300">
          <p>Arrow Keys: Move/Rotate | Space: Hard Drop | P: Pause | R: Restart</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default NeonBlocks;
