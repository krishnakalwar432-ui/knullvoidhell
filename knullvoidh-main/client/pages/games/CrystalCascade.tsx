import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';
import { 
  getSafeCanvas2DContext, 
  createSafeAnimationManager, 
  createSafeKeyManager,
  checkCollision,
  clamp,
  distance,
  gameManager
} from '@/utils/universalGameFix';

interface Position {
  x: number;
  y: number;
}

interface Crystal {
  type: number; // 0-6 for different crystal types
  x: number;
  y: number;
  targetY: number;
  falling: boolean;
  matched: boolean;
  sparkle: number;
  color: string;
}

interface Particle extends Position {
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface Match {
  crystals: Array<{row: number, col: number}>;
  type: number;
  score: number;
}

const CrystalCascade: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<ReturnType<typeof createSafeAnimationManager> | null>(null);
  const keyHandlerRef = useRef<ReturnType<typeof createSafeKeyManager> | null>(null);

  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver'>('menu');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [moves, setMoves] = useState(30);
  const [target, setTarget] = useState(1000);
  const [mousePos, setMousePos] = useState<Position>({ x: 400, y: 300 });
  const [selectedCrystal, setSelectedCrystal] = useState<{row: number, col: number} | null>(null);
  
  const [grid, setGrid] = useState<Crystal[][]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [combo, setCombo] = useState(0);

  const gameId = 'crystal-cascade';
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const GRID_SIZE = 8;
  const CRYSTAL_SIZE = 60;
  const GRID_OFFSET_X = (CANVAS_WIDTH - GRID_SIZE * CRYSTAL_SIZE) / 2;
  const GRID_OFFSET_Y = 50;

  const CRYSTAL_COLORS = [
    '#ff0099', // Pink
    '#00ff99', // Green
    '#9900ff', // Purple
    '#ff9900', // Orange
    '#0099ff', // Blue
    '#ffff00', // Yellow
    '#ff0000'  // Red
  ];

  const createParticles = useCallback((x: number, y: number, color: string, count: number = 15) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 3,
        life: 1,
        color,
        size: Math.random() * 4 + 2
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const createNewCrystal = useCallback((row: number, col: number): Crystal => ({
    type: Math.floor(Math.random() * 7),
    x: col * CRYSTAL_SIZE + GRID_OFFSET_X,
    y: row * CRYSTAL_SIZE + GRID_OFFSET_Y,
    targetY: row * CRYSTAL_SIZE + GRID_OFFSET_Y,
    falling: false,
    matched: false,
    sparkle: Math.random(),
    color: CRYSTAL_COLORS[Math.floor(Math.random() * 7)]
  }), []);

  const initializeGrid = useCallback(() => {
    const newGrid: Crystal[][] = [];
    
    for (let row = 0; row < GRID_SIZE; row++) {
      newGrid[row] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        let crystal;
        let attempts = 0;
        
        // Avoid creating initial matches
        do {
          crystal = createNewCrystal(row, col);
          attempts++;
        } while (attempts < 10 && (
          (col >= 2 && 
           newGrid[row][col-1]?.type === crystal.type && 
           newGrid[row][col-2]?.type === crystal.type) ||
          (row >= 2 && 
           newGrid[row-1]?.[col]?.type === crystal.type && 
           newGrid[row-2]?.[col]?.type === crystal.type)
        ));
        
        newGrid[row][col] = crystal;
      }
    }
    
    setGrid(newGrid);
  }, [createNewCrystal]);

  const findMatches = useCallback((): Match[] => {
    const matches: Match[] = [];
    const visited = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
    
    // Check horizontal matches
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE - 2; col++) {
        if (grid[row] && grid[row][col] && !grid[row][col].matched) {
          const type = grid[row][col].type;
          const matchCrystals: Array<{row: number, col: number}> = [];
          
          let checkCol = col;
          while (checkCol < GRID_SIZE && 
                 grid[row][checkCol] && 
                 grid[row][checkCol].type === type && 
                 !grid[row][checkCol].matched) {
            matchCrystals.push({row, col: checkCol});
            checkCol++;
          }
          
          if (matchCrystals.length >= 3) {
            matches.push({
              crystals: matchCrystals,
              type,
              score: matchCrystals.length * 100
            });
          }
        }
      }
    }
    
    // Check vertical matches
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row < GRID_SIZE - 2; row++) {
        if (grid[row] && grid[row][col] && !grid[row][col].matched) {
          const type = grid[row][col].type;
          const matchCrystals: Array<{row: number, col: number}> = [];
          
          let checkRow = row;
          while (checkRow < GRID_SIZE && 
                 grid[checkRow] && 
                 grid[checkRow][col] && 
                 grid[checkRow][col].type === type && 
                 !grid[checkRow][col].matched) {
            matchCrystals.push({row: checkRow, col});
            checkRow++;
          }
          
          if (matchCrystals.length >= 3) {
            // Check if this match overlaps with existing horizontal matches
            const isNewMatch = !matches.some(match => 
              match.crystals.some(crystal => 
                matchCrystals.some(newCrystal => 
                  crystal.row === newCrystal.row && crystal.col === newCrystal.col
                )
              )
            );
            
            if (isNewMatch) {
              matches.push({
                crystals: matchCrystals,
                type,
                score: matchCrystals.length * 100
              });
            }
          }
        }
      }
    }
    
    return matches;
  }, [grid]);

  const processMatches = useCallback((matches: Match[]) => {
    if (matches.length === 0) return;
    
    setIsAnimating(true);
    
    // Mark crystals as matched and create particles
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      let totalScore = 0;
      
      matches.forEach(match => {
        match.crystals.forEach(({row, col}) => {
          if (newGrid[row] && newGrid[row][col]) {
            newGrid[row][col].matched = true;
            createParticles(
              newGrid[row][col].x + CRYSTAL_SIZE/2,
              newGrid[row][col].y + CRYSTAL_SIZE/2,
              newGrid[row][col].color,
              10
            );
          }
        });
        totalScore += match.score * (combo + 1);
      });
      
      setScore(prev => prev + totalScore);
      setCombo(prev => prev + 1);
      
      return newGrid;
    });
    
    // Remove matched crystals and apply gravity after a delay
    setTimeout(() => {
      applyGravity();
    }, 300);
  }, [combo, createParticles]);

  const applyGravity = useCallback(() => {
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      
      // Remove matched crystals
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (newGrid[row][col]?.matched) {
            newGrid[row][col] = null as any;
          }
        }
      }
      
      // Apply gravity
      for (let col = 0; col < GRID_SIZE; col++) {
        const column = [];
        
        // Collect non-null crystals
        for (let row = GRID_SIZE - 1; row >= 0; row--) {
          if (newGrid[row][col]) {
            column.push(newGrid[row][col]);
          }
        }
        
        // Clear column
        for (let row = 0; row < GRID_SIZE; row++) {
          newGrid[row][col] = null as any;
        }
        
        // Place crystals at bottom
        for (let i = 0; i < column.length; i++) {
          const row = GRID_SIZE - 1 - i;
          newGrid[row][col] = {
            ...column[i],
            targetY: row * CRYSTAL_SIZE + GRID_OFFSET_Y,
            falling: true
          };
        }
        
        // Fill empty spaces with new crystals
        for (let row = 0; row < GRID_SIZE - column.length; row++) {
          newGrid[row][col] = {
            ...createNewCrystal(row, col),
            y: -CRYSTAL_SIZE * (GRID_SIZE - column.length - row),
            falling: true
          };
        }
      }
      
      return newGrid;
    });
    
    setTimeout(() => {
      setIsAnimating(false);
      
      // Check for new matches after gravity
      setTimeout(() => {
        const newMatches = findMatches();
        if (newMatches.length > 0) {
          processMatches(newMatches);
        } else {
          setCombo(0);
        }
      }, 100);
    }, 500);
  }, [createNewCrystal, findMatches, processMatches]);

  const swapCrystals = useCallback((row1: number, col1: number, row2: number, col2: number) => {
    if (isAnimating) return;
    
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      
      // Swap crystals
      const temp = newGrid[row1][col1];
      newGrid[row1][col1] = newGrid[row2][col2];
      newGrid[row2][col2] = temp;
      
      // Update positions
      if (newGrid[row1][col1]) {
        newGrid[row1][col1].x = col1 * CRYSTAL_SIZE + GRID_OFFSET_X;
        newGrid[row1][col1].y = row1 * CRYSTAL_SIZE + GRID_OFFSET_Y;
        newGrid[row1][col1].targetY = row1 * CRYSTAL_SIZE + GRID_OFFSET_Y;
      }
      if (newGrid[row2][col2]) {
        newGrid[row2][col2].x = col2 * CRYSTAL_SIZE + GRID_OFFSET_X;
        newGrid[row2][col2].y = row2 * CRYSTAL_SIZE + GRID_OFFSET_Y;
        newGrid[row2][col2].targetY = row2 * CRYSTAL_SIZE + GRID_OFFSET_Y;
      }
      
      return newGrid;
    });
    
    // Check for matches after swap
    setTimeout(() => {
      const matches = findMatches();
      if (matches.length > 0) {
        processMatches(matches);
        setMoves(prev => prev - 1);
      } else {
        // Swap back if no matches
        setTimeout(() => {
          swapCrystals(row2, col2, row1, col1);
        }, 200);
      }
    }, 100);
  }, [isAnimating, findMatches, processMatches]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    
    setMousePos({ x, y });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing' || isAnimating) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    
    // Check if clicking on grid
    const col = Math.floor((x - GRID_OFFSET_X) / CRYSTAL_SIZE);
    const row = Math.floor((y - GRID_OFFSET_Y) / CRYSTAL_SIZE);
    
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE && grid[row] && grid[row][col]) {
      if (selectedCrystal) {
        const {row: selRow, col: selCol} = selectedCrystal;
        
        // Check if adjacent
        const isAdjacent = 
          (Math.abs(row - selRow) === 1 && col === selCol) ||
          (Math.abs(col - selCol) === 1 && row === selRow);
        
        if (isAdjacent && !(row === selRow && col === selCol)) {
          swapCrystals(selRow, selCol, row, col);
          setSelectedCrystal(null);
        } else {
          setSelectedCrystal({row, col});
        }
      } else {
        setSelectedCrystal({row, col});
      }
    } else {
      setSelectedCrystal(null);
    }
  }, [gameState, isAnimating, grid, selectedCrystal, swapCrystals]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getSafeCanvas2DContext(canvas);
    if (!ctx) return;

    // Clear with magical background
    const gradient = ctx.createRadialGradient(
      CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 0,
      CANVAS_WIDTH/2, CANVAS_HEIGHT/2, CANVAS_WIDTH/2
    );
    gradient.addColorStop(0, '#2a1a4a');
    gradient.addColorStop(0.5, '#1a0a3a');
    gradient.addColorStop(1, '#0a0a2a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw sparkly background
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.sin(Date.now() * 0.001 + i) * 0.1})`;
      const x = (i * 123.456) % CANVAS_WIDTH;
      const y = (i * 789.123) % CANVAS_HEIGHT;
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    if (gameState === 'playing') {
      // Update falling crystals
      setGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        let allSettled = true;
        
        for (let row = 0; row < GRID_SIZE; row++) {
          for (let col = 0; col < GRID_SIZE; col++) {
            if (newGrid[row][col]?.falling) {
              const crystal = newGrid[row][col];
              if (crystal.y < crystal.targetY) {
                crystal.y += 8;
                allSettled = false;
                if (crystal.y >= crystal.targetY) {
                  crystal.y = crystal.targetY;
                  crystal.falling = false;
                }
              }
            }
          }
        }
        
        return newGrid;
      });

      // Update crystal sparkles
      setGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        for (let row = 0; row < GRID_SIZE; row++) {
          for (let col = 0; col < GRID_SIZE; col++) {
            if (newGrid[row][col]) {
              newGrid[row][col].sparkle += 0.05;
            }
          }
        }
        return newGrid;
      });

      // Update particles
      setParticles(prev => prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vx: particle.vx * 0.98,
          vy: particle.vy * 0.98 + 0.2,
          life: particle.life - 0.02,
          size: particle.size * 0.99
        }))
        .filter(particle => particle.life > 0)
      );

      // Check game over conditions
      if (moves <= 0 && score < target) {
        setGameState('gameOver');
      } else if (score >= target) {
        setLevel(prev => prev + 1);
        setTarget(prev => prev + 500 * level);
        setMoves(30);
        initializeGrid();
      }
    }

    // Draw grid background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let row = 0; row <= GRID_SIZE; row++) {
      ctx.beginPath();
      ctx.moveTo(GRID_OFFSET_X, GRID_OFFSET_Y + row * CRYSTAL_SIZE);
      ctx.lineTo(GRID_OFFSET_X + GRID_SIZE * CRYSTAL_SIZE, GRID_OFFSET_Y + row * CRYSTAL_SIZE);
      ctx.stroke();
    }
    for (let col = 0; col <= GRID_SIZE; col++) {
      ctx.beginPath();
      ctx.moveTo(GRID_OFFSET_X + col * CRYSTAL_SIZE, GRID_OFFSET_Y);
      ctx.lineTo(GRID_OFFSET_X + col * CRYSTAL_SIZE, GRID_OFFSET_Y + GRID_SIZE * CRYSTAL_SIZE);
      ctx.stroke();
    }

    // Draw crystals
    grid.forEach((row, rowIndex) => {
      row.forEach((crystal, colIndex) => {
        if (crystal && !crystal.matched) {
          // Crystal shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.beginPath();
          ctx.arc(crystal.x + CRYSTAL_SIZE/2 + 3, crystal.y + CRYSTAL_SIZE/2 + 3, CRYSTAL_SIZE/2 - 5, 0, Math.PI * 2);
          ctx.fill();
          
          // Crystal body
          ctx.fillStyle = crystal.color;
          ctx.shadowColor = crystal.color;
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(crystal.x + CRYSTAL_SIZE/2, crystal.y + CRYSTAL_SIZE/2, CRYSTAL_SIZE/2 - 5, 0, Math.PI * 2);
          ctx.fill();
          
          // Crystal facets
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(crystal.x + CRYSTAL_SIZE/2 - 8, crystal.y + CRYSTAL_SIZE/2 - 8, CRYSTAL_SIZE/4, 0, Math.PI * 2);
          ctx.fill();
          
          // Sparkle effect
          const sparkleIntensity = Math.sin(crystal.sparkle) * 0.5 + 0.5;
          ctx.fillStyle = `rgba(255, 255, 255, ${sparkleIntensity * 0.8})`;
          ctx.beginPath();
          ctx.arc(crystal.x + CRYSTAL_SIZE/2 + 5, crystal.y + CRYSTAL_SIZE/2 - 5, 3, 0, Math.PI * 2);
          ctx.fill();
          
          // Selection indicator
          if (selectedCrystal && selectedCrystal.row === rowIndex && selectedCrystal.col === colIndex) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(crystal.x + CRYSTAL_SIZE/2, crystal.y + CRYSTAL_SIZE/2, CRYSTAL_SIZE/2, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      });
    });
    ctx.shadowBlur = 0;

    // Draw particles
    particles.forEach(particle => {
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px monospace';
    ctx.fillText(`Score: ${score}`, 20, 35);
    ctx.fillText(`Target: ${target}`, 20, 65);
    ctx.fillText(`Moves: ${moves}`, 20, 95);
    ctx.fillText(`Level: ${level}`, 20, 125);
    
    if (combo > 0) {
      ctx.fillStyle = '#ffff00';
      ctx.font = '24px monospace';
      ctx.fillText(`Combo x${combo + 1}`, 20, 155);
    }

    // Progress bar
    const progress = Math.min(score / target, 1);
    ctx.fillStyle = '#333333';
    ctx.fillRect(CANVAS_WIDTH - 220, 20, 200, 20);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(CANVAS_WIDTH - 220, 20, 200 * progress, 20);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(CANVAS_WIDTH - 220, 20, 200, 20);

    // Instructions
    ctx.fillStyle = '#cccccc';
    ctx.font = '14px monospace';
    ctx.fillText('Click crystals to select, then click adjacent to swap', 20, CANVAS_HEIGHT - 40);
    ctx.fillText('Match 3 or more crystals of the same color', 20, CANVAS_HEIGHT - 20);

    // Game state overlays
    if (gameState === 'menu') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#ff00ff';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CRYSTAL CASCADE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.font = '24px monospace';
      ctx.fillText('Click to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      
      ctx.font = '16px monospace';
      ctx.fillText('Match 3+ crystals to score points', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    } else if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#ff0000';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.font = '24px monospace';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.fillText(`Level Reached: ${level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
      ctx.fillText('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
    }

    ctx.textAlign = 'left';
  }, [gameState, grid, particles, selectedCrystal, score, target, moves, level, combo, initializeGrid]);

  // Initialize game
  useEffect(() => {
    gameManager.registerGame(gameId);
    
    return () => {
      gameManager.unregisterGame(gameId);
      if (gameLoopRef.current) {
        gameLoopRef.current.stop();
      }
      if (keyHandlerRef.current) {
        keyHandlerRef.current.cleanup();
      }
    };
  }, []);

  // Handle special keys and clicks
  useEffect(() => {
    const handleSpecialKeys = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      if (key === 'r' && gameState === 'gameOver') {
        setGameState('menu');
        setScore(0);
        setLevel(1);
        setMoves(30);
        setTarget(1000);
        setSelectedCrystal(null);
        setCombo(0);
        setParticles([]);
        setIsAnimating(false);
      }
    };

    const handleClick = () => {
      if (gameState === 'menu') {
        setGameState('playing');
        initializeGrid();
      }
    };

    window.addEventListener('keydown', handleSpecialKeys);
    window.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('keydown', handleSpecialKeys);
      window.removeEventListener('click', handleClick);
    };
  }, [gameState, initializeGrid]);

  // Initialize game loop and input
  useEffect(() => {
    const keyHandler = createSafeKeyManager();
    keyHandlerRef.current = keyHandler;

    const animationManager = createSafeAnimationManager();
    gameLoopRef.current = animationManager;
    animationManager.start(gameLoop);

    return () => {
      animationManager.stop();
      keyHandler.cleanup();
    };
  }, [gameLoop]);

  return (
    <GameLayout 
      gameTitle="Crystal Cascade" 
      gameCategory="Match-3 puzzle with crystalline gems"
      score={gameState === 'playing' ? score : undefined}
    >
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-purple-500 bg-black rounded-lg shadow-2xl cursor-pointer"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
        />
        <div className="text-center space-y-2">
          <p className="text-gray-300">Click crystals to select • Match 3+ of the same color</p>
          <p className="text-gray-400">Reach the target score to advance to the next level!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default CrystalCascade;
