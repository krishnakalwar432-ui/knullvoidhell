import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Player {
  x: number;
  y: number;
  gridX: number;
  gridY: number;
}

interface Wall {
  x: number;
  y: number;
  type: 'solid' | 'quantum' | 'portal' | 'shifting';
  visible: boolean;
  phaseTimer: number;
}

interface Portal {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  active: boolean;
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

const QuantumMaze = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());

  const GRID_SIZE = 25;
  const GRID_WIDTH = 32;
  const GRID_HEIGHT = 24;
  const CANVAS_WIDTH = GRID_WIDTH * GRID_SIZE;
  const CANVAS_HEIGHT = GRID_HEIGHT * GRID_SIZE;

  const [gameState, setGameState] = useState({
    player: {
      x: GRID_SIZE * 1.5,
      y: GRID_SIZE * 1.5,
      gridX: 1,
      gridY: 1
    } as Player,
    walls: [] as Wall[],
    portals: [] as Portal[],
    particles: [] as Particle[],
    maze: [] as number[][],
    level: 1,
    moves: 0,
    gameOver: false,
    victory: false,
    score: 0,
    targetX: GRID_WIDTH - 2,
    targetY: GRID_HEIGHT - 2,
    quantumPhase: 0
  });

  const generateMaze = useCallback((level: number) => {
    const maze: number[][] = [];
    
    // Initialize with walls
    for (let y = 0; y < GRID_HEIGHT; y++) {
      maze[y] = [];
      for (let x = 0; x < GRID_WIDTH; x++) {
        maze[y][x] = 1; // 1 = wall, 0 = empty
      }
    }

    // Recursive backtracking maze generation
    const stack: { x: number; y: number }[] = [];
    const startX = 1;
    const startY = 1;
    
    maze[startY][startX] = 0;
    stack.push({ x: startX, y: startY });

    const directions = [
      { x: 0, y: -2 }, { x: 2, y: 0 }, { x: 0, y: 2 }, { x: -2, y: 0 }
    ];

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = [];

      for (const dir of directions) {
        const nx = current.x + dir.x;
        const ny = current.y + dir.y;
        
        if (nx > 0 && nx < GRID_WIDTH - 1 && ny > 0 && ny < GRID_HEIGHT - 1 && maze[ny][nx] === 1) {
          neighbors.push({ x: nx, y: ny, wallX: current.x + dir.x / 2, wallY: current.y + dir.y / 2 });
        }
      }

      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        maze[next.y][next.x] = 0;
        maze[next.wallY][next.wallX] = 0;
        stack.push({ x: next.x, y: next.y });
      } else {
        stack.pop();
      }
    }

    // Ensure exit is clear
    maze[GRID_HEIGHT - 2][GRID_WIDTH - 2] = 0;

    // Add quantum elements based on level
    const walls: Wall[] = [];
    const portals: Portal[] = [];

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (maze[y][x] === 1) {
          let wallType: Wall['type'] = 'solid';
          
          // Add quantum walls based on level
          if (level > 1 && Math.random() < 0.1) {
            wallType = 'quantum';
          } else if (level > 3 && Math.random() < 0.05) {
            wallType = 'shifting';
          }
          
          walls.push({
            x, y,
            type: wallType,
            visible: true,
            phaseTimer: Math.random() * 360
          });
        }
      }
    }

    // Add portals for higher levels
    if (level > 2) {
      const portalCount = Math.min(3, Math.floor(level / 2));
      for (let i = 0; i < portalCount; i++) {
        let px, py, tx, ty;
        do {
          px = Math.floor(Math.random() * (GRID_WIDTH - 2)) + 1;
          py = Math.floor(Math.random() * (GRID_HEIGHT - 2)) + 1;
          tx = Math.floor(Math.random() * (GRID_WIDTH - 2)) + 1;
          ty = Math.floor(Math.random() * (GRID_HEIGHT - 2)) + 1;
        } while (maze[py][px] !== 0 || maze[ty][tx] !== 0 || (px === 1 && py === 1));
        
        const colors = ['#ff00ff', '#00ffff', '#ffff00'];
        portals.push({
          x: px, y: py, targetX: tx, targetY: ty,
          color: colors[i % colors.length], active: true
        });
      }
    }

    return { maze, walls, portals };
  }, []);

  const createParticles = (x: number, y: number, color: string, count: number = 6) => {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = Math.random() * 3 + 1;
      particles.push({
        x: x * GRID_SIZE + GRID_SIZE / 2,
        y: y * GRID_SIZE + GRID_SIZE / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30, maxLife: 30, color, size: Math.random() * 3 + 1
      });
    }
    return particles;
  };

  const canMove = (gridX: number, gridY: number, time: number) => {
    if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT) return false;
    
    const wall = gameState.walls.find(w => w.x === gridX && w.y === gridY);
    if (!wall) return true;
    
    if (wall.type === 'quantum') {
      // Quantum walls phase in and out
      return Math.sin(time * 0.05 + wall.phaseTimer) > 0;
    } else if (wall.type === 'shifting') {
      // Shifting walls change visibility
      return Math.sin(time * 0.02 + wall.phaseTimer) > 0.5;
    }
    
    return false; // Solid wall
  };

  const update = useCallback(() => {
    if (gameState.gameOver || gameState.victory) return;

    setGameState(prev => {
      const newState = { ...prev };
      const keys = keysRef.current;
      const currentTime = Date.now();
      
      newState.quantumPhase = currentTime * 0.001;

      // Player movement
      let moved = false;
      let newGridX = newState.player.gridX;
      let newGridY = newState.player.gridY;

      if (keys.has('w') || keys.has('ArrowUp')) {
        newGridY--;
        moved = true;
      } else if (keys.has('s') || keys.has('ArrowDown')) {
        newGridY++;
        moved = true;
      } else if (keys.has('a') || keys.has('ArrowLeft')) {
        newGridX--;
        moved = true;
      } else if (keys.has('d') || keys.has('ArrowRight')) {
        newGridX++;
        moved = true;
      }

      if (moved && canMove(newGridX, newGridY, currentTime)) {
        newState.player.gridX = newGridX;
        newState.player.gridY = newGridY;
        newState.player.x = newGridX * GRID_SIZE + GRID_SIZE / 2;
        newState.player.y = newGridY * GRID_SIZE + GRID_SIZE / 2;
        newState.moves++;
        
        // Add movement particles
        newState.particles.push(...createParticles(newGridX, newGridY, '#00ffff', 3));
      }

      // Check portal teleportation
      const portal = newState.portals.find(p => 
        p.x === newState.player.gridX && p.y === newState.player.gridY && p.active
      );
      if (portal) {
        newState.player.gridX = portal.targetX;
        newState.player.gridY = portal.targetY;
        newState.player.x = portal.targetX * GRID_SIZE + GRID_SIZE / 2;
        newState.player.y = portal.targetY * GRID_SIZE + GRID_SIZE / 2;
        
        // Add teleport particles
        newState.particles.push(...createParticles(portal.targetX, portal.targetY, portal.color, 12));
        newState.score += 50;
      }

      // Update wall visibility
      newState.walls.forEach(wall => {
        if (wall.type === 'quantum') {
          wall.visible = Math.sin(currentTime * 0.005 + wall.phaseTimer) > 0;
        } else if (wall.type === 'shifting') {
          wall.visible = Math.sin(currentTime * 0.002 + wall.phaseTimer) > 0.5;
        }
      });

      // Check victory
      if (newState.player.gridX === newState.targetX && newState.player.gridY === newState.targetY) {
        newState.victory = true;
        const moveBonus = Math.max(0, 1000 - newState.moves * 10);
        const levelBonus = newState.level * 500;
        newState.score += moveBonus + levelBonus;
      }

      // Update particles
      newState.particles = newState.particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        particle.vx *= 0.95;
        particle.vy *= 0.95;
        return particle.life > 0;
      });

      return newState;
    });
  }, [gameState.gameOver, gameState.victory]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with quantum space background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#000022');
    gradient.addColorStop(0.5, '#001144');
    gradient.addColorStop(1, '#000066');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= GRID_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * GRID_SIZE, 0);
      ctx.lineTo(x * GRID_SIZE, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= GRID_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * GRID_SIZE);
      ctx.lineTo(canvas.width, y * GRID_SIZE);
      ctx.stroke();
    }

    // Draw walls
    gameState.walls.forEach(wall => {
      if (!wall.visible && wall.type !== 'solid') return;
      
      const x = wall.x * GRID_SIZE;
      const y = wall.y * GRID_SIZE;
      
      let color = '#666666';
      let alpha = 1;
      
      switch (wall.type) {
        case 'solid':
          color = '#888888';
          break;
        case 'quantum':
          color = '#00ffff';
          alpha = wall.visible ? 0.8 : 0.3;
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 10;
          break;
        case 'shifting':
          color = '#ff00ff';
          alpha = wall.visible ? 0.9 : 0.2;
          ctx.shadowColor = '#ff00ff';
          ctx.shadowBlur = 8;
          break;
      }
      
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE - 4);
      
      if (wall.type !== 'solid') {
        ctx.shadowBlur = 0;
      }
    });

    ctx.globalAlpha = 1;

    // Draw portals
    gameState.portals.forEach(portal => {
      if (!portal.active) return;
      
      const x = portal.x * GRID_SIZE + GRID_SIZE / 2;
      const y = portal.y * GRID_SIZE + GRID_SIZE / 2;
      const tx = portal.targetX * GRID_SIZE + GRID_SIZE / 2;
      const ty = portal.targetY * GRID_SIZE + GRID_SIZE / 2;
      
      // Portal entrance
      ctx.fillStyle = portal.color;
      ctx.shadowColor = portal.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(x, y, GRID_SIZE / 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Portal exit
      ctx.beginPath();
      ctx.arc(tx, ty, GRID_SIZE / 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Connection line
      ctx.strokeStyle = portal.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });

    // Draw target
    const targetX = gameState.targetX * GRID_SIZE + GRID_SIZE / 2;
    const targetY = gameState.targetY * GRID_SIZE + GRID_SIZE / 2;
    ctx.fillStyle = '#00ff00';
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(targetX, targetY, GRID_SIZE / 2 - 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw particles
    gameState.particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw player
    const pulse = Math.sin(gameState.quantumPhase * 3) * 0.3 + 0.7;
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 15 * pulse;
    ctx.beginPath();
    ctx.arc(gameState.player.x, gameState.player.y, (GRID_SIZE / 3) * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw UI
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, 50);
    
    ctx.fillStyle = '#00ffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Level: ${gameState.level}`, 10, 20);
    ctx.fillText(`Moves: ${gameState.moves}`, 10, 35);
    ctx.fillText(`Score: ${gameState.score}`, 120, 20);
    
    if (gameState.victory) {
      ctx.fillStyle = 'rgba(0, 100, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#00FF00';
      ctx.font = '36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Quantum Maze Solved!', canvas.width / 2, canvas.height / 2 - 40);
      
      ctx.fillStyle = '#00ffff';
      ctx.font = '20px Arial';
      ctx.fillText(`Moves: ${gameState.moves}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText(`Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 25);
      ctx.fillText('Press N for next level or R to restart', canvas.width / 2, canvas.height / 2 + 60);
    }
  }, [gameState]);

  const nextLevel = useCallback(() => {
    const { maze, walls, portals } = generateMaze(gameState.level + 1);
    setGameState(prev => ({
      ...prev,
      level: prev.level + 1,
      maze,
      walls,
      portals,
      player: {
        x: GRID_SIZE * 1.5,
        y: GRID_SIZE * 1.5,
        gridX: 1,
        gridY: 1
      },
      moves: 0,
      victory: false,
      particles: []
    }));
  }, [generateMaze, gameState.level]);

  useEffect(() => {
    const { maze, walls, portals } = generateMaze(1);
    setGameState(prev => ({ ...prev, maze, walls, portals }));
  }, [generateMaze]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r') {
        const { maze, walls, portals } = generateMaze(gameState.level);
        setGameState(prev => ({
          ...prev,
          maze, walls, portals,
          player: { x: GRID_SIZE * 1.5, y: GRID_SIZE * 1.5, gridX: 1, gridY: 1 },
          moves: 0, victory: false, particles: []
        }));
        return;
      }
      
      if (e.key === 'n' && gameState.victory) {
        nextLevel();
        return;
      }
      
      keysRef.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.victory, gameState.level, generateMaze, nextLevel]);

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
    <GameLayout 
      gameTitle="Quantum Maze" 
      gameCategory="Reality-bending puzzle"
      showMobileControls={true}
    >
      <div className="flex flex-col items-center gap-4 p-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-cyan-400 bg-black rounded-lg max-w-full h-auto"
          style={{ boxShadow: '0 0 20px #00ffff' }}
        />
        <div className="text-center text-gray-300">
          <p>WASD/Arrows: Move | R: Restart level | N: Next level | Navigate to the green target!</p>
          <p className="text-sm text-cyan-400">Blue walls phase in/out • Pink walls shift • Use portals to teleport</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default QuantumMaze;
