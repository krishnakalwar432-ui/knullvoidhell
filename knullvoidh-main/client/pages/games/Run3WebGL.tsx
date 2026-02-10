import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Player {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  onWall: boolean;
  wallSide: 'floor' | 'left' | 'right' | 'ceiling';
  rotation: number;
}

interface Tunnel {
  segments: TunnelSegment[];
  position: number;
}

interface TunnelSegment {
  holes: boolean[];
  powerups: number[];
  obstacles: number[];
}

const Run3WebGL = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());

  const [gameState, setGameState] = useState({
    player: {
      x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 2,
      onWall: true, wallSide: 'floor' as const, rotation: 0
    } as Player,
    tunnel: {
      segments: [] as TunnelSegment[],
      position: 0
    } as Tunnel,
    camera: { distance: 20, angle: 0 },
    score: 0,
    gameOver: false,
    speed: 2
  });

  const generateTunnel = useCallback(() => {
    const segments: TunnelSegment[] = [];
    for (let i = 0; i < 100; i++) {
      const holes = new Array(16).fill(false);
      // Random holes in tunnel
      const numHoles = Math.random() < 0.3 ? Math.floor(Math.random() * 3) + 1 : 0;
      for (let j = 0; j < numHoles; j++) {
        holes[Math.floor(Math.random() * 16)] = true;
      }
      segments.push({
        holes,
        powerups: [],
        obstacles: []
      });
    }
    return segments;
  }, []);

  const initializeGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      player: {
        x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 2,
        onWall: true, wallSide: 'floor', rotation: 0
      },
      tunnel: {
        segments: generateTunnel(),
        position: 0
      },
      score: 0,
      gameOver: false,
      speed: 2
    }));
  }, [generateTunnel]);

  const update = useCallback(() => {
    if (gameState.gameOver) return;

    setGameState(prev => {
      const newState = { ...prev };
      const player = { ...newState.player };

      // Handle input
      let moveX = 0;
      let jump = false;
      if (keysRef.current.has('a') || keysRef.current.has('ArrowLeft')) moveX = -1;
      if (keysRef.current.has('d') || keysRef.current.has('ArrowRight')) moveX = 1;
      if (keysRef.current.has(' ') || keysRef.current.has('w') || keysRef.current.has('ArrowUp')) jump = true;

      // Apply movement based on current wall
      if (player.onWall) {
        if (player.wallSide === 'floor') {
          player.vx = moveX * 0.3;
          if (jump) {
            player.vy = 0.5;
            player.onWall = false;
          }
        } else if (player.wallSide === 'left') {
          player.vz += moveX * 0.1;
          if (jump) {
            player.vx = 0.5;
            player.onWall = false;
          }
        } else if (player.wallSide === 'right') {
          player.vz += moveX * 0.1;
          if (jump) {
            player.vx = -0.5;
            player.onWall = false;
          }
        } else if (player.wallSide === 'ceiling') {
          player.vx = -moveX * 0.3;
          if (jump) {
            player.vy = -0.5;
            player.onWall = false;
          }
        }
      }

      // Apply physics
      if (!player.onWall) {
        player.vy -= 0.02; // Gravity
      }

      // Update position
      player.x += player.vx;
      player.y += player.vy;
      player.z += player.vz;

      // Keep player moving forward
      player.vz = Math.max(player.vz, newState.speed);

      // Check tunnel collisions and wall walking
      const segmentIndex = Math.floor(player.z / 5);
      if (segmentIndex >= 0 && segmentIndex < newState.tunnel.segments.length) {
        const segment = newState.tunnel.segments[segmentIndex];
        
        // Convert world position to tunnel grid
        const angle = Math.atan2(player.y, player.x);
        const radius = Math.sqrt(player.x * player.x + player.y * player.y);
        
        // Check if player hit a hole
        const gridIndex = Math.floor(((angle + Math.PI) / (2 * Math.PI)) * 16);
        if (segment.holes[Math.max(0, Math.min(15, gridIndex))]) {
          if (radius > 8) {
            newState.gameOver = true;
          }
        } else {
          // Check wall collision and walking
          if (radius >= 8) {
            // Snap to wall
            const wallAngle = (gridIndex / 16) * 2 * Math.PI - Math.PI;
            player.x = Math.cos(wallAngle) * 8;
            player.y = Math.sin(wallAngle) * 8;
            player.onWall = true;
            
            // Determine wall side
            if (Math.abs(player.y + 8) < 2) player.wallSide = 'floor';
            else if (Math.abs(player.y - 8) < 2) player.wallSide = 'ceiling';
            else if (player.x > 0) player.wallSide = 'right';
            else player.wallSide = 'left';
            
            // Stop perpendicular velocity
            if (player.wallSide === 'floor' || player.wallSide === 'ceiling') {
              player.vy = 0;
            } else {
              player.vx = 0;
            }
          }
        }
      }

      // Update score
      newState.score = Math.floor(player.z / 5);

      // Generate more tunnel if needed
      if (player.z > newState.tunnel.segments.length * 3) {
        newState.tunnel.segments.push(...generateTunnel().slice(0, 20));
      }

      newState.player = player;
      return newState;
    });
  }, [gameState.gameOver, generateTunnel]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    // 3D tunnel rendering (simplified 2D projection)
    const centerX = width / 2;
    const centerY = height / 2;

    // Render tunnel segments
    for (let i = 0; i < 20; i++) {
      const segmentZ = gameState.player.z + i * 2;
      const segmentIndex = Math.floor(segmentZ / 5);
      
      if (segmentIndex >= 0 && segmentIndex < gameState.tunnel.segments.length) {
        const segment = gameState.tunnel.segments[segmentIndex];
        const distance = i * 2 + 5;
        const scale = 500 / distance;
        
        // Draw tunnel walls
        for (let j = 0; j < 16; j++) {
          if (!segment.holes[j]) {
            const angle = (j / 16) * 2 * Math.PI;
            const x1 = centerX + Math.cos(angle) * scale * 8;
            const y1 = centerY + Math.sin(angle) * scale * 8;
            const x2 = centerX + Math.cos(angle + Math.PI / 8) * scale * 8;
            const y2 = centerY + Math.sin(angle + Math.PI / 8) * scale * 8;
            
            const brightness = Math.max(0.2, 1 - distance / 50);
            ctx.fillStyle = `rgb(${Math.floor(0 * brightness)}, ${Math.floor(150 * brightness)}, ${Math.floor(255 * brightness)})`;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(centerX, centerY);
            ctx.fill();
          }
        }
      }
    }

    // Render player
    const playerScreenX = centerX + gameState.player.x * 20;
    const playerScreenY = centerY + gameState.player.y * 20;
    
    ctx.fillStyle = '#ff0099';
    ctx.shadowColor = '#ff0099';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(playerScreenX, playerScreenY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw UI
    ctx.fillStyle = '#0aff9d';
    ctx.font = '20px Arial';
    ctx.fillText(`Distance: ${gameState.score}`, 20, 30);
    
    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, width, height);
      
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', centerX, centerY - 50);
      
      ctx.fillStyle = '#0aff9d';
      ctx.font = '24px Arial';
      ctx.fillText(`Final Distance: ${gameState.score}`, centerX, centerY);
      ctx.fillText('Press R to restart', centerX, centerY + 50);
      ctx.textAlign = 'left';
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === 'r' && gameState.gameOver) {
        initializeGame();
      }
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
  }, [gameState.gameOver, initializeGame]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

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
    <GameLayout gameTitle="Run 3 (WebGL)" gameCategory="Space tunnel runner">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg shadow-2xl"
        />
        <div className="text-center text-gray-300">
          <p>WASD / Arrow Keys: Move | Space/W: Jump | R: Restart</p>
          <p>Run through the tunnel, jump over holes, and use wall-walking!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default Run3WebGL;
