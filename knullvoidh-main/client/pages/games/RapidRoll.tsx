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
  hasGap: boolean;
  gapStart?: number;
  gapWidth?: number;
}

const RapidRoll = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());

  const [gameState, setGameState] = useState({
    ball: { x: 400, y: 100, vx: 0, vy: 0, radius: 12 } as Ball,
    platforms: [] as Platform[],
    cameraY: 0,
    score: 0,
    gameOver: false,
    fallSpeed: 2
  });

  const generatePlatforms = useCallback(() => {
    const platforms: Platform[] = [];

    for (let i = 0; i < 200; i++) {
      const y = i * 80;
      const hasGap = Math.random() < 0.7; // 70% chance of gap

      if (hasGap) {
        const gapWidth = Math.random() * 150 + 100;
        const gapStart = Math.random() * (750 - gapWidth) + 25;

        platforms.push({
          x: 0,
          y,
          width: 800,
          height: 20,
          hasGap: true,
          gapStart,
          gapWidth
        });
      } else {
        platforms.push({
          x: 0,
          y,
          width: 800,
          height: 20,
          hasGap: false
        });
      }
    }

    return platforms;
  }, []);

  const initializeGame = useCallback(() => {
    setGameState({
      ball: { x: 400, y: 100, vx: 0, vy: 0, radius: 12 },
      platforms: generatePlatforms(),
      cameraY: 0,
      score: 0,
      gameOver: false,
      fallSpeed: 2
    });
  }, [generatePlatforms]);

  const checkCollision = (ball: Ball, platform: Platform) => {
    if (!platform.hasGap) {
      // Full platform
      return ball.x + ball.radius > platform.x &&
             ball.x - ball.radius < platform.x + platform.width &&
             ball.y + ball.radius > platform.y &&
             ball.y - ball.radius < platform.y + platform.height;
    } else {
      // Platform with gap
      const leftSide = ball.x + ball.radius > platform.x &&
                      ball.x - ball.radius < platform.gapStart! &&
                      ball.y + ball.radius > platform.y &&
                      ball.y - ball.radius < platform.y + platform.height;

      const rightSide = ball.x + ball.radius > platform.gapStart! + platform.gapWidth! &&
                       ball.x - ball.radius < platform.x + platform.width &&
                       ball.y + ball.radius > platform.y &&
                       ball.y - ball.radius < platform.y + platform.height;

      return leftSide || rightSide;
    }
  };

  const update = useCallback(() => {
    if (gameState.gameOver) return;

    setGameState(prev => {
      const newState = { ...prev };
      const ball = { ...newState.ball };

      // Handle input
      const speed = 6;
      if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) {
        ball.vx = -speed;
      } else if (keysRef.current.has('d') || keysRef.current.has('arrowright')) {
        ball.vx = speed;
      } else {
        ball.vx *= 0.9; // Friction
      }

      // Gravity and falling
      ball.vy += 0.5;

      // Natural downward movement
      ball.y += newState.fallSpeed;

      // Update position
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Keep ball in bounds horizontally
      if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.vx = 0;
      }
      if (ball.x + ball.radius > 800) {
        ball.x = 800 - ball.radius;
        ball.vx = 0;
      }

      // Check platform collisions
      let onPlatform = false;
      for (const platform of newState.platforms) {
        if (checkCollision(ball, platform)) {
          // Land on top of platform
          if (ball.vy > 0 && ball.y < platform.y + platform.height / 2) {
            ball.y = platform.y - ball.radius;
            ball.vy = 0;
            onPlatform = true;
          }
        }
      }

      // Update camera to follow ball
      newState.cameraY = ball.y - 300;

      // Update score based on distance fallen
      newState.score = Math.max(newState.score, Math.floor(ball.y / 10));

      // Increase fall speed over time
      newState.fallSpeed = Math.min(8, 2 + newState.score / 500);

      // Check game over (if ball goes too far up from camera or falls too far)
      if (ball.y > newState.cameraY + 700) {
        newState.gameOver = true;
      }

      newState.ball = ball;
      return newState;
    });
  }, [gameState.gameOver]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#4682B4');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save context for camera transform
    ctx.save();
    ctx.translate(0, -gameState.cameraY);

    // Draw platforms
    gameState.platforms.forEach(platform => {
      if (platform.y > gameState.cameraY - 50 && platform.y < gameState.cameraY + 650) {
        if (!platform.hasGap) {
          // Full platform
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

          // Add border
          ctx.strokeStyle = '#654321';
          ctx.lineWidth = 2;
          ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        } else {
          // Platform with gap
          // Left side
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(platform.x, platform.y, platform.gapStart!, platform.height);
          ctx.strokeStyle = '#654321';
          ctx.lineWidth = 2;
          ctx.strokeRect(platform.x, platform.y, platform.gapStart!, platform.height);

          // Right side
          const rightStart = platform.gapStart! + platform.gapWidth!;
          const rightWidth = platform.width - rightStart;
          ctx.fillRect(rightStart, platform.y, rightWidth, platform.height);
          ctx.strokeRect(rightStart, platform.y, rightWidth, platform.height);
        }
      }
    });

    // Draw ball
    ctx.save();
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(gameState.ball.x, gameState.ball.y, gameState.ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Ball highlight
    ctx.fillStyle = '#ff8888';
    ctx.beginPath();
    ctx.arc(gameState.ball.x - 4, gameState.ball.y - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Restore context
    ctx.restore();

    // Draw UI (not affected by camera)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 20, 30);
    ctx.fillText(`Speed: ${gameState.fallSpeed.toFixed(1)}`, 20, 60);

    // Draw game over screen
    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ff0099';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 50);

      ctx.fillStyle = '#ffffff';
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
      if (['a', 'd', 'arrowleft', 'arrowright'].includes(key)) {
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
    <GameLayout gameTitle="Rapid Roll" gameCategory="Falling-ball survival">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg shadow-2xl"
        />
        <div className="text-center text-gray-300">
          <p>A/D or Arrow Keys: Move Ball | R: Restart</p>
          <p>Fall through the gaps and avoid hitting platforms!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default RapidRoll;
