import React, { useState, useEffect, useRef } from 'react';
import GameLayout from '@/components/GameLayout';

const Jumpgrid: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [player, setPlayer] = useState({ x: 4, y: 4, targetX: 4, targetY: 4, moving: false });
  const [grid, setGrid] = useState<Array<Array<number>>>([]);
  const [beat, setBeat] = useState(0);
  const [keys, setKeys] = useState<Set<string>>(new Set());

  const GRID_SIZE = 8;
  const CELL_SIZE = 60;

  useEffect(() => {
    const newGrid = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
    // Generate random pattern
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (Math.random() < 0.3 && !(i === 4 && j === 4)) {
          newGrid[i][j] = Math.floor(Math.random() * 3) + 1;
        }
      }
    }
    setGrid(newGrid);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => setKeys(prev => new Set([...prev, e.key.toLowerCase()]));
    const handleKeyUp = (e: KeyboardEvent) => setKeys(prev => { const newKeys = new Set(prev); newKeys.delete(e.key.toLowerCase()); return newKeys; });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const gameLoop = setInterval(() => {
      setBeat(prev => (prev + 1) % 60);
      
      if (!player.moving && beat % 15 === 0) {
        let newX = player.x;
        let newY = player.y;
        
        if (keys.has('w') || keys.has('arrowup')) newY = Math.max(0, player.y - 1);
        if (keys.has('s') || keys.has('arrowdown')) newY = Math.min(GRID_SIZE - 1, player.y + 1);
        if (keys.has('a') || keys.has('arrowleft')) newX = Math.max(0, player.x - 1);
        if (keys.has('d') || keys.has('arrowright')) newX = Math.min(GRID_SIZE - 1, player.x + 1);
        
        if (newX !== player.x || newY !== player.y) {
          setPlayer(prev => ({ ...prev, targetX: newX, targetY: newY, moving: true }));
          
          if (grid[newY][newX] > 0) {
            setScore(s => s + grid[newY][newX] * 100);
            setGrid(prev => {
              const newGrid = [...prev];
              newGrid[newY][newX] = 0;
              return newGrid;
            });
          }
        }
      }
      
      if (player.moving) {
        setPlayer(prev => {
          const moveSpeed = 0.2;
          let newX = prev.x;
          let newY = prev.y;
          
          if (Math.abs(prev.targetX - prev.x) > 0.1) {
            newX += (prev.targetX - prev.x) * moveSpeed;
          } else {
            newX = prev.targetX;
          }
          
          if (Math.abs(prev.targetY - prev.y) > 0.1) {
            newY += (prev.targetY - prev.y) * moveSpeed;
          } else {
            newY = prev.targetY;
          }
          
          const moving = newX !== prev.targetX || newY !== prev.targetY;
          return { ...prev, x: newX, y: newY, moving };
        });
      }
    }, 16);
    return () => clearInterval(gameLoop);
  }, [gameState, player, grid, beat, keys]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, 800, 600);

    const offsetX = (800 - GRID_SIZE * CELL_SIZE) / 2;
    const offsetY = (600 - GRID_SIZE * CELL_SIZE) / 2;

    // Draw grid
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const x = offsetX + j * CELL_SIZE;
        const y = offsetY + i * CELL_SIZE;
        
        // Beat pulse
        const pulse = Math.sin(beat * 0.2) * 0.1 + 0.9;
        
        if (grid[i][j] > 0) {
          const colors = ['', '#ff0099', '#7000ff', '#0aff9d'];
          ctx.fillStyle = colors[grid[i][j]];
          ctx.shadowColor = colors[grid[i][j]];
          ctx.shadowBlur = 15 * pulse;
          ctx.fillRect(x + 5, y + 5, CELL_SIZE - 10, CELL_SIZE - 10);
          ctx.shadowBlur = 0;
        }
        
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }

    // Draw player
    const playerScreenX = offsetX + player.x * CELL_SIZE + CELL_SIZE / 2;
    const playerScreenY = offsetY + player.y * CELL_SIZE + CELL_SIZE / 2;
    
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(playerScreenX, playerScreenY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Beat indicator
    const beatSize = (Math.sin(beat * 0.3) * 0.5 + 0.5) * 20 + 10;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(50, 50, beatSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText(`Score: ${score}`, 20, 30);
  });

  const handlePause = () => setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  const handleReset = () => {
    setScore(0);
    setPlayer({ x: 4, y: 4, targetX: 4, targetY: 4, moving: false });
    setBeat(0);
    const newGrid = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (Math.random() < 0.3 && !(i === 4 && j === 4)) {
          newGrid[i][j] = Math.floor(Math.random() * 3) + 1;
        }
      }
    }
    setGrid(newGrid);
    setGameState('playing');
  };

  return (
    <GameLayout gameTitle="Jumpgrid" gameCategory="Music" score={score} isPlaying={gameState === 'playing'} onPause={handlePause} onReset={handleReset}>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="relative">
          <canvas ref={canvasRef} width={800} height={600} className="border border-neon-yellow/50 rounded-lg bg-black/20 backdrop-blur-sm shadow-2xl max-w-full h-auto" style={{ touchAction: 'none' }} />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>WASD or Arrow keys to jump • Move to the beat on musical grids!</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default Jumpgrid;
