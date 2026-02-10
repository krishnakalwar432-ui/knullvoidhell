import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

const BounceClassicHTML5 = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());

  const [gameState, setGameState] = useState({
    ball: { x: 50, y: 300, vx: 3, vy: 0, radius: 15 } as Ball,
    platforms: [] as Platform[],
    score: 0,
    gameOver: false,
    level: 1
  });

  const generateLevel = useCallback((level: number) => {
    const platforms: Platform[] = [];

    // Add floor
    platforms.push({ x: 0, y: 580, width: 800, height: 20, color: '#ff4444' });

    // Add random platforms
    for (let i = 0; i < level + 5; i++) {
      platforms.push({
        x: Math.random() * 600 + 100,
        y: Math.random() * 400 + 100,
        width: Math.random() * 100 + 80,
        height: 20,
        color: '#44ff44'
      });
    }

    // Add walls
    platforms.push({ x: 0, y: 0, width: 20, height: 600, color: '#4444ff' });
    platforms.push({ x: 780, y: 0, width: 20, height: 600, color: '#4444ff' });
    platforms.push({ x: 0, y: 0, width: 800, height: 20, color: '#4444ff' });

    return platforms;
  }, []);

  const initializeGame = useCallback(() => {
    setGameState({
      ball: { x: 50, y: 300, vx: 3, vy: 0, radius: 15 },
      platforms: generateLevel(1),
      score: 0,
      gameOver: false,
      level: 1
    });
  }, [generateLevel]);

  const checkCollision = (ball: Ball, platform: Platform) => {
    return ball.x + ball.radius > platform.x &&
           ball.x - ball.radius < platform.x + platform.width &&
           ball.y + ball.radius > platform.y &&
           ball.y - ball.radius < platform.y + platform.height;
  };

  const update = useCallback(() => {
    if (gameState.gameOver) return;

    setGameState(prev => {
      const newState = { ...prev };
      const ball = { ...newState.ball };

      // Handle input
      if (keysRef.current.has('arrowleft') || keysRef.current.has('a')) {
        ball.vx -= 0.2;
      }
      if (keysRef.current.has('arrowright') || keysRef.current.has('d')) {
        ball.vx += 0.2;
      }
      if (keysRef.current.has('arrowup') || keysRef.current.has('w')) {
        ball.vy -= 0.5;
      }

      // Apply gravity
      ball.vy += 0.3;

      // Apply friction
      ball.vx *= 0.99;

      // Limit velocity
      ball.vx = Math.max(-8, Math.min(8, ball.vx));
      ball.vy = Math.max(-15, Math.min(15, ball.vy));

      // Update position
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Check platform collisions
      for (const platform of newState.platforms) {
        if (checkCollision(ball, platform)) {
          // Simple collision response
          const overlapX = Math.min(
            ball.x + ball.radius - platform.x,
            platform.x + platform.width - (ball.x - ball.radius)
          );
          const overlapY = Math.min(
            ball.y + ball.radius - platform.y,
            platform.y + platform.height - (ball.y - ball.radius)
          );

          if (overlapX < overlapY) {
            // Horizontal collision
            if (ball.x < platform.x + platform.width / 2) {
              ball.x = platform.x - ball.radius;
            } else {
              ball.x = platform.x + platform.width + ball.radius;
            }
            ball.vx = -ball.vx * 0.7;
          } else {
            // Vertical collision
            if (ball.y < platform.y + platform.height / 2) {
              ball.y = platform.y - ball.radius;
              ball.vy = -Math.abs(ball.vy) * 0.8;
            } else {
              ball.y = platform.y + platform.height + ball.radius;
              ball.vy = Math.abs(ball.vy) * 0.8;
            }
          }

          newState.score += 10;
        }
      }

      // Check game over (fall off bottom)
      if (ball.y > 650) {
        newState.gameOver = true;
      }

      // Level progression
      if (newState.score > newState.level * 500) {
        newState.level++;
        newState.platforms = generateLevel(newState.level);
        ball.x = 50;
        ball.y = 300;
        ball.vx = 3 + newState.level;
        ball.vy = 0;
      }

      newState.ball = ball;
      return newState;
    });
  }, [gameState.gameOver, generateLevel]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw platforms
    gameState.platforms.forEach(platform => {
      ctx.fillStyle = platform.color;
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

      // Add gradient effect
      const gradient = ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
      gradient.addColorStop(0, platform.color);
      gradient.addColorStop(1, '#000');
      ctx.fillStyle = gradient;
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });

    // Draw ball
    ctx.save();
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(gameState.ball.x, gameState.ball.y, gameState.ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Add ball highlight
    ctx.fillStyle = '#ff8888';
    ctx.beginPath();
    ctx.arc(gameState.ball.x - 5, gameState.ball.y - 5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw UI
    ctx.fillStyle = '#0aff9d';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 20, 30);
    ctx.fillText(`Level: ${gameState.level}`, 20, 60);

    // Draw game over screen
    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ff0099';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 50);

      ctx.fillStyle = '#0aff9d';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 50);
      ctx.textAlign = 'left';
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.add(key);

      if (key === 'r' && gameState.gameOver) {
        initializeGame();
      }

      // Prevent default arrow key behavior
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
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
    <GameLayout gameTitle="Bounce Classic HTML5" gameCategory="Red ball bounce game">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg shadow-2xl"
        />
        <div className="text-center text-gray-300">
          <p>Arrow Keys / WASD: Control Ball | R: Restart</p>
          <p>Bounce through the level and avoid falling!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default BounceClassicHTML5;
