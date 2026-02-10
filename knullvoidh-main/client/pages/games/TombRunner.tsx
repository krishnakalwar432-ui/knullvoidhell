import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

const TombRunner = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());

  const [gameState, setGameState] = useState({
    player: { x: 100, y: 400, vy: 0, jumping: false },
    obstacles: [] as Array<{x: number, y: number, width: number, height: number}>,
    coins: [] as Array<{x: number, y: number, collected: boolean}>,
    camera: { x: 0 },
    score: 0,
    speed: 6,
    gameOver: false
  });

  const GROUND_Y = 500;
  const JUMP_FORCE = 15;
  const GRAVITY = 0.8;

  const update = useCallback(() => {
    if (gameState.gameOver) return;
    
    setGameState(prev => {
      const newState = { ...prev };
      const player = { ...newState.player };

      // Jump control
      if ((keysRef.current.has(' ') || keysRef.current.has('w')) && !player.jumping) {
        if (player.y >= GROUND_Y - 10) {
          player.vy = -JUMP_FORCE;
          player.jumping = true;
        }
      }

      // Apply physics
      player.vy += GRAVITY;
      player.y += player.vy;

      // Ground collision
      if (player.y >= GROUND_Y) {
        player.y = GROUND_Y;
        player.vy = 0;
        player.jumping = false;
      }

      // Move camera
      newState.camera.x += newState.speed;
      newState.speed += 0.002; // Gradual speed increase

      // Spawn obstacles
      if (Math.random() < 0.01) {
        newState.obstacles.push({
          x: newState.camera.x + 1000,
          y: GROUND_Y - 50,
          width: 30,
          height: 50
        });
      }

      // Spawn coins
      if (Math.random() < 0.02) {
        newState.coins.push({
          x: newState.camera.x + 1000,
          y: GROUND_Y - 100 - Math.random() * 100,
          collected: false
        });
      }

      // Check collisions
      const playerLeft = player.x - 15;
      const playerRight = player.x + 15;
      const playerTop = player.y - 15;
      const playerBottom = player.y + 15;

      // Obstacle collisions
      for (const obstacle of newState.obstacles) {
        if (playerRight > obstacle.x && playerLeft < obstacle.x + obstacle.width &&
            playerBottom > obstacle.y && playerTop < obstacle.y + obstacle.height) {
          newState.gameOver = true;
          break;
        }
      }

      // Coin collection
      for (const coin of newState.coins) {
        if (!coin.collected &&
            Math.abs(player.x - coin.x) < 25 && Math.abs(player.y - coin.y) < 25) {
          coin.collected = true;
          newState.score += 10;
        }
      }

      // Remove old obstacles and coins
      newState.obstacles = newState.obstacles.filter(obs => obs.x > newState.camera.x - 200);
      newState.coins = newState.coins.filter(coin => coin.x > newState.camera.x - 200);

      // Update score by distance
      newState.score += 1;

      newState.player = player;
      return newState;
    });
  }, [gameState.gameOver]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with temple background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#8B4513');
    gradient.addColorStop(1, '#654321');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-gameState.camera.x + 100, 0);

    // Draw ground
    ctx.fillStyle = '#D2691E';
    ctx.fillRect(gameState.camera.x - 200, GROUND_Y, canvas.width + 400, 100);

    // Draw obstacles
    ctx.fillStyle = '#8B0000';
    gameState.obstacles.forEach(obstacle => {
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });

    // Draw coins
    ctx.fillStyle = '#FFD700';
    gameState.coins.forEach(coin => {
      if (!coin.collected) {
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, 12, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw player
    ctx.fillStyle = '#0aff9d';
    ctx.shadowColor = '#0aff9d';
    ctx.shadowBlur = 10;
    ctx.fillRect(gameState.player.x - 15, gameState.player.y - 15, 30, 30);
    ctx.shadowBlur = 0;

    ctx.restore();

    // Draw UI
    ctx.fillStyle = '#FFD700';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 20, 40);
    ctx.fillText(`Speed: ${gameState.speed.toFixed(1)}`, 20, 70);

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 50);
      ctx.fillStyle = '#FFD700';
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 50);
      ctx.textAlign = 'left';
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key === 'r' && gameState.gameOver) {
        setGameState({
          player: { x: 100, y: 400, vy: 0, jumping: false },
          obstacles: [],
          coins: [],
          camera: { x: 0 },
          score: 0,
          speed: 6,
          gameOver: false
        });
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
  }, [gameState.gameOver]);

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
    <GameLayout gameTitle="Tomb Runner" gameCategory="Temple Run style infinite runner">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg shadow-2xl"
        />
        <div className="text-center text-gray-300">
          <p>Space/W: Jump | R: Restart</p>
          <p>Collect coins and avoid obstacles in this endless temple run!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default TombRunner;
