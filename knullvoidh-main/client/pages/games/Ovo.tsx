import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  onWall: boolean;
  wallSide: 'left' | 'right' | null;
  canDoubleJump: boolean;
  canWallJump: boolean;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'solid' | 'spike' | 'bounce';
}

const Ovo = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());

  const [gameState, setGameState] = useState({
    player: {
      x: 100, y: 500, vx: 0, vy: 0, onGround: false, onWall: false,
      wallSide: null, canDoubleJump: false, canWallJump: false
    } as Player,
    platforms: [
      // Starting platform
      { x: 50, y: 550, width: 150, height: 50, type: 'solid' },
      // Level platforms
      { x: 250, y: 450, width: 100, height: 20, type: 'solid' },
      { x: 400, y: 350, width: 80, height: 20, type: 'solid' },
      { x: 200, y: 300, width: 120, height: 20, type: 'solid' },
      { x: 500, y: 250, width: 100, height: 20, type: 'solid' },
      // Spikes
      { x: 300, y: 520, width: 80, height: 20, type: 'spike' },
      { x: 450, y: 420, width: 60, height: 20, type: 'spike' },
      // Bounce pad
      { x: 650, y: 200, width: 60, height: 20, type: 'bounce' },
      // Final platform
      { x: 700, y: 100, width: 100, height: 20, type: 'solid' }
    ] as Platform[],
    checkpoints: [{ x: 100, y: 500 }, { x: 275, y: 400 }, { x: 725, y: 50 }],
    currentCheckpoint: 0,
    level: 1,
    deaths: 0,
    gameOver: false,
    gameWon: false
  });

  const GRAVITY = 0.5;
  const JUMP_FORCE = 12;
  const WALL_JUMP_FORCE = 10;
  const MOVE_SPEED = 5;

  const update = useCallback(() => {
    if (gameState.gameOver || gameState.gameWon) return;

    setGameState(prev => {
      const newState = { ...prev };
      const player = { ...newState.player };

      // Handle input
      let moveX = 0;
      if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) moveX = -1;
      if (keysRef.current.has('d') || keysRef.current.has('arrowright')) moveX = 1;
      
      const jump = keysRef.current.has(' ') || keysRef.current.has('w') || keysRef.current.has('arrowup');

      // Ground movement
      if (player.onGround) {
        player.vx = moveX * MOVE_SPEED;
        player.canDoubleJump = true;
        player.canWallJump = true;
      } else {
        // Air movement (reduced control)
        player.vx += moveX * 0.8;
        player.vx = Math.max(-MOVE_SPEED, Math.min(MOVE_SPEED, player.vx));
      }

      // Jumping
      if (jump) {
        if (player.onGround) {
          player.vy = -JUMP_FORCE;
          player.onGround = false;
        } else if (player.onWall && player.canWallJump) {
          // Wall jump
          player.vy = -WALL_JUMP_FORCE;
          player.vx = player.wallSide === 'left' ? MOVE_SPEED : -MOVE_SPEED;
          player.onWall = false;
          player.wallSide = null;
          player.canWallJump = false;
        } else if (player.canDoubleJump) {
          player.vy = -JUMP_FORCE * 0.8;
          player.canDoubleJump = false;
        }
      }

      // Apply gravity
      if (!player.onWall || player.vy < 0) {
        player.vy += GRAVITY;
      } else if (player.onWall) {
        // Wall sliding
        player.vy = Math.min(2, player.vy + 0.1);
      }

      // Update position
      player.x += player.vx;
      player.y += player.vy;

      // Reset collision flags
      player.onGround = false;
      player.onWall = false;
      player.wallSide = null;

      // Platform collisions
      for (const platform of newState.platforms) {
        const playerLeft = player.x - 10;
        const playerRight = player.x + 10;
        const playerTop = player.y - 10;
        const playerBottom = player.y + 10;

        const platLeft = platform.x;
        const platRight = platform.x + platform.width;
        const platTop = platform.y;
        const platBottom = platform.y + platform.height;

        if (playerRight > platLeft && playerLeft < platRight &&
            playerBottom > platTop && playerTop < platBottom) {
          
          if (platform.type === 'spike') {
            // Death - respawn at checkpoint
            const checkpoint = newState.checkpoints[newState.currentCheckpoint];
            player.x = checkpoint.x;
            player.y = checkpoint.y;
            player.vx = 0;
            player.vy = 0;
            newState.deaths++;
            continue;
          }

          if (platform.type === 'bounce') {
            player.vy = -JUMP_FORCE * 1.5;
            continue;
          }

          // Determine collision side
          const overlapLeft = playerRight - platLeft;
          const overlapRight = platRight - playerLeft;
          const overlapTop = playerBottom - platTop;
          const overlapBottom = platBottom - playerTop;

          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

          if (minOverlap === overlapTop && player.vy > 0) {
            // Landing on top
            player.y = platTop - 10;
            player.vy = 0;
            player.onGround = true;
          } else if (minOverlap === overlapBottom && player.vy < 0) {
            // Hitting from below
            player.y = platBottom + 10;
            player.vy = 0;
          } else if (minOverlap === overlapLeft && player.vx > 0) {
            // Hitting left wall
            player.x = platLeft - 10;
            player.vx = 0;
            if (!player.onGround) {
              player.onWall = true;
              player.wallSide = 'left';
              player.canWallJump = true;
            }
          } else if (minOverlap === overlapRight && player.vx < 0) {
            // Hitting right wall
            player.x = platRight + 10;
            player.vx = 0;
            if (!player.onGround) {
              player.onWall = true;
              player.wallSide = 'right';
              player.canWallJump = true;
            }
          }
        }
      }

      // Check checkpoint
      const nextCheckpoint = newState.checkpoints[newState.currentCheckpoint + 1];
      if (nextCheckpoint && 
          Math.abs(player.x - nextCheckpoint.x) < 30 && 
          Math.abs(player.y - nextCheckpoint.y) < 30) {
        newState.currentCheckpoint++;
      }

      // Win condition
      if (newState.currentCheckpoint >= newState.checkpoints.length - 1 &&
          Math.abs(player.x - newState.checkpoints[newState.checkpoints.length - 1].x) < 30) {
        newState.gameWon = true;
      }

      // Death condition (fall off map)
      if (player.y > 650) {
        const checkpoint = newState.checkpoints[newState.currentCheckpoint];
        player.x = checkpoint.x;
        player.y = checkpoint.y;
        player.vx = 0;
        player.vy = 0;
        newState.deaths++;
      }

      newState.player = player;
      return newState;
    });
  }, [gameState.gameOver, gameState.gameWon]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(1, '#003366');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw platforms
    gameState.platforms.forEach(platform => {
      if (platform.type === 'spike') {
        ctx.fillStyle = '#ff0099';
      } else if (platform.type === 'bounce') {
        ctx.fillStyle = '#00ff00';
      } else {
        ctx.fillStyle = '#7000ff';
      }
      
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 5;
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      ctx.shadowBlur = 0;
    });

    // Draw checkpoints
    gameState.checkpoints.forEach((checkpoint, index) => {
      ctx.fillStyle = index <= gameState.currentCheckpoint ? '#00ff00' : '#ffff00';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(checkpoint.x, checkpoint.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw player
    ctx.fillStyle = '#0aff9d';
    ctx.shadowColor = '#0aff9d';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(gameState.player.x, gameState.player.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Player state indicators
    if (gameState.player.onWall) {
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(gameState.player.x, gameState.player.y, 15, 0, Math.PI * 2);
      ctx.stroke();
    }

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText(`Deaths: ${gameState.deaths}`, 20, 30);
    ctx.fillText(`Checkpoint: ${gameState.currentCheckpoint + 1}/${gameState.checkpoints.length}`, 20, 55);

    if (gameState.gameWon) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#00ff00';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Level Complete!', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.fillText(`Deaths: ${gameState.deaths}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 50);
      ctx.textAlign = 'left';
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === 'r') {
        setGameState(prev => ({
          ...prev,
          player: { x: 100, y: 500, vx: 0, vy: 0, onGround: false, onWall: false, wallSide: null, canDoubleJump: false, canWallJump: false },
          currentCheckpoint: 0,
          deaths: 0,
          gameWon: false
        }));
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
  }, []);

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
    <GameLayout gameTitle="OvO" gameCategory="Precision platformer with parkour">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg shadow-2xl"
        />
        <div className="text-center text-gray-300">
          <p>WASD/Arrow Keys: Move | Space/W: Jump | R: Restart</p>
          <p>Wall jump and double jump to reach checkpoints!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default Ovo;
