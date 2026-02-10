import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'block' | 'ramp';
}

const Slope = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());

  const [gameState, setGameState] = useState({
    ball: { x: 100, y: 300, vx: 3, vy: 0 } as Ball,
    obstacles: [] as Obstacle[],
    camera: { x: 0 },
    score: 0,
    speed: 3,
    gameOver: false
  });

  const generateObstacles = useCallback((startX: number) => {
    const obstacles: Obstacle[] = [];
    for (let i = 0; i < 20; i++) {
      const x = startX + i * 200 + Math.random() * 100;
      const type = Math.random() < 0.7 ? 'block' : 'ramp';
      obstacles.push({
        x,
        y: 500 - Math.random() * 200,
        width: 40 + Math.random() * 60,
        height: 20 + Math.random() * 80,
        type
      });
    }
    return obstacles;
  }, []);

  const initializeGame = useCallback(() => {
    setGameState({
      ball: { x: 100, y: 300, vx: 3, vy: 0 },
      obstacles: generateObstacles(200),
      camera: { x: 0 },
      score: 0,
      speed: 3,
      gameOver: false
    });
  }, [generateObstacles]);

  const update = useCallback(() => {
    if (gameState.gameOver) return;

    setGameState(prev => {
      const newState = { ...prev };
      const ball = { ...newState.ball };

      // Handle input
      if (keysRef.current.has('a') || keysRef.current.has('ArrowLeft')) {
        ball.vx -= 0.1;
      }
      if (keysRef.current.has('d') || keysRef.current.has('ArrowRight')) {
        ball.vx += 0.1;
      }

      // Increase speed over time
      newState.speed += 0.001;
      ball.vx = Math.max(ball.vx, newState.speed);

      // Apply physics
      ball.vy += 0.5; // Gravity
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Ground collision
      if (ball.y > 580) {
        ball.y = 580;
        ball.vy = 0;
      }

      // Camera follows ball
      newState.camera.x = ball.x - 200;

      // Check obstacle collisions
      for (const obstacle of newState.obstacles) {
        if (ball.x + 10 > obstacle.x && ball.x - 10 < obstacle.x + obstacle.width &&
            ball.y + 10 > obstacle.y && ball.y - 10 < obstacle.y + obstacle.height) {
          newState.gameOver = true;
          break;
        }
      }

      // Generate more obstacles
      if (ball.x > newState.obstacles[newState.obstacles.length - 1].x - 500) {
        newState.obstacles.push(...generateObstacles(newState.obstacles[newState.obstacles.length - 1].x));
      }

      // Update score
      newState.score = Math.floor(ball.x / 10);

      // Remove old obstacles
      newState.obstacles = newState.obstacles.filter(obs => obs.x > newState.camera.x - 200);

      newState.ball = ball;
      return newState;
    });
  }, [gameState.gameOver, generateObstacles]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    
    // Clear with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(1, '#003366');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(-gameState.camera.x, 0);

    // Draw ground
    ctx.fillStyle = '#333';
    ctx.fillRect(gameState.camera.x, 580, width, 20);

    // Draw obstacles
    for (const obstacle of gameState.obstacles) {
      if (obstacle.x > gameState.camera.x - 100 && obstacle.x < gameState.camera.x + width + 100) {
        ctx.fillStyle = obstacle.type === 'ramp' ? '#ff6600' : '#ff0099';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        ctx.shadowBlur = 0;
      }
    }

    // Draw ball
    ctx.fillStyle = '#0aff9d';
    ctx.shadowColor = '#0aff9d';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(gameState.ball.x, gameState.ball.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();

    // Draw UI
    ctx.fillStyle = '#0aff9d';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 20, 40);
    ctx.fillText(`Speed: ${gameState.speed.toFixed(1)}`, 20, 70);

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, width, height);
      
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', width / 2, height / 2 - 50);
      
      ctx.fillStyle = '#0aff9d';
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${gameState.score}`, width / 2, height / 2);
      ctx.fillText('Press R to restart', width / 2, height / 2 + 50);
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
    <GameLayout gameTitle="Slope" gameCategory="Fast reflex downhill runner">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg shadow-2xl"
        />
        <div className="text-center text-gray-300">
          <p>A/D or Arrow Keys: Steer | R: Restart</p>
          <p>Stay on the slope and avoid obstacles as speed increases!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default Slope;
