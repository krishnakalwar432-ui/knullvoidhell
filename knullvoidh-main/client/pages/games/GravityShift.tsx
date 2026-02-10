import React, { useState, useRef, useEffect, useCallback } from 'react';
import GameLayout from '../../components/GameLayout';

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'solid' | 'gravity';
}

interface Level {
  id: number;
  ball: { x: number; y: number };
  goal: { x: number; y: number; width: number; height: number };
  blocks: Block[];
  gravityDirection: 'down' | 'up' | 'left' | 'right';
}

const levels: Level[] = [
  {
    id: 1,
    ball: { x: 50, y: 100 },
    goal: { x: 700, y: 350, width: 50, height: 50 },
    blocks: [
      { x: 0, y: 400, width: 800, height: 50, type: 'solid' },
      { x: 200, y: 300, width: 100, height: 20, type: 'solid' },
      { x: 400, y: 200, width: 100, height: 20, type: 'solid' },
      { x: 600, y: 300, width: 100, height: 20, type: 'solid' }
    ],
    gravityDirection: 'down'
  },
  {
    id: 2,
    ball: { x: 50, y: 200 },
    goal: { x: 700, y: 50, width: 50, height: 50 },
    blocks: [
      { x: 0, y: 0, width: 800, height: 50, type: 'solid' },
      { x: 0, y: 400, width: 800, height: 50, type: 'solid' },
      { x: 200, y: 150, width: 20, height: 200, type: 'solid' },
      { x: 400, y: 250, width: 20, height: 150, type: 'solid' },
      { x: 600, y: 100, width: 20, height: 250, type: 'solid' }
    ],
    gravityDirection: 'up'
  },
  {
    id: 3,
    ball: { x: 400, y: 200 },
    goal: { x: 50, y: 350, width: 50, height: 50 },
    blocks: [
      { x: 0, y: 0, width: 50, height: 450, type: 'solid' },
      { x: 750, y: 0, width: 50, height: 450, type: 'solid' },
      { x: 150, y: 100, width: 500, height: 20, type: 'solid' },
      { x: 300, y: 250, width: 200, height: 20, type: 'solid' },
      { x: 100, y: 350, width: 150, height: 20, type: 'gravity' }
    ],
    gravityDirection: 'left'
  }
];

const GravityShift: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [currentLevel, setCurrentLevel] = useState(0);
  const [ball, setBall] = useState<Ball>({ x: 50, y: 100, vx: 0, vy: 0, radius: 15 });
  const [gravityDirection, setGravityDirection] = useState<'down' | 'up' | 'left' | 'right'>('down');
  const [isWon, setIsWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const keysPressed = useRef<Set<string>>(new Set());

  const level = levels[currentLevel];
  const GRAVITY = 0.5;
  const FRICTION = 0.98;
  const MOVE_SPEED = 8;

  const resetLevel = useCallback(() => {
    setBall({
      x: level.ball.x,
      y: level.ball.y,
      vx: 0,
      vy: 0,
      radius: 15
    });
    setGravityDirection(level.gravityDirection);
    setIsWon(false);
  }, [level.ball.x, level.ball.y, level.gravityDirection]);

  useEffect(() => {
    resetLevel();
  }, [currentLevel]);  // Remove resetLevel dependency

  const checkCollision = useCallback((newX: number, newY: number, blocks: Block[], radius: number) => {
    for (const block of blocks) {
      if (
        newX + radius > block.x &&
        newX - radius < block.x + block.width &&
        newY + radius > block.y &&
        newY - radius < block.y + block.height
      ) {
        return block;
      }
    }
    return null;
  }, []);

  const checkGoal = useCallback((x: number, y: number, radius: number, goal: typeof level.goal) => {
    return (
      x + radius > goal.x &&
      x - radius < goal.x + goal.width &&
      y + radius > goal.y &&
      y - radius < goal.y + goal.height
    );
  }, []);

  const updateBall = useCallback(() => {
    if (!gameStarted || isWon) return;

    setBall(prevBall => {
      let { x, y, vx, vy } = prevBall;

      // Handle keyboard input
      if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('a')) {
        vx -= 0.5;
      }
      if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d')) {
        vx += 0.5;
      }
      if (keysPressed.current.has('ArrowUp') || keysPressed.current.has('w')) {
        vy -= 0.5;
      }
      if (keysPressed.current.has('ArrowDown') || keysPressed.current.has('s')) {
        vy += 0.5;
      }

      // Apply gravity
      switch (gravityDirection) {
        case 'down':
          vy += GRAVITY;
          break;
        case 'up':
          vy -= GRAVITY;
          break;
        case 'left':
          vx -= GRAVITY;
          break;
        case 'right':
          vx += GRAVITY;
          break;
      }

      // Apply friction
      vx *= FRICTION;
      vy *= FRICTION;

      // Limit velocity
      const maxVelocity = 15;
      vx = Math.max(-maxVelocity, Math.min(maxVelocity, vx));
      vy = Math.max(-maxVelocity, Math.min(maxVelocity, vy));

      // Calculate new position
      let newX = x + vx;
      let newY = y + vy;

      // Check collisions with blocks
      const collision = checkCollision(newX, newY, level.blocks, prevBall.radius);
      if (collision) {
        // Simple collision response - bounce back
        if (collision.type === 'gravity') {
          // Gravity blocks change gravity direction
          const centerX = collision.x + collision.width / 2;
          const centerY = collision.y + collision.height / 2;
          if (Math.abs(newX - centerX) > Math.abs(newY - centerY)) {
            setGravityDirection(newX < centerX ? 'left' : 'right');
          } else {
            setGravityDirection(newY < centerY ? 'up' : 'down');
          }
        }

        // Bounce logic
        if (newX + prevBall.radius > collision.x && newX - prevBall.radius < collision.x + collision.width) {
          vy = -vy * 0.6;
          newY = y;
        }
        if (newY + prevBall.radius > collision.y && newY - prevBall.radius < collision.y + collision.height) {
          vx = -vx * 0.6;
          newX = x;
        }
      }

      // Boundary collision
      if (newX - prevBall.radius < 0 || newX + prevBall.radius > 800) {
        vx = -vx * 0.6;
        newX = Math.max(prevBall.radius, Math.min(800 - prevBall.radius, newX));
      }
      if (newY - prevBall.radius < 0 || newY + prevBall.radius > 450) {
        vy = -vy * 0.6;
        newY = Math.max(prevBall.radius, Math.min(450 - prevBall.radius, newY));
      }

      // Check if goal is reached
      if (checkGoal(newX, newY, prevBall.radius, level.goal)) {
        setIsWon(true);
      }

      return { ...prevBall, x: newX, y: newY, vx, vy };
    });
  }, [gameStarted, isWon, gravityDirection, level.blocks, level.goal, checkCollision, checkGoal]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, 800, 450);

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 800, 450);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 450);

    // Draw gravity direction indicator
    ctx.fillStyle = '#00ffff';
    ctx.font = '16px Arial';
    ctx.fillText(`Gravity: ${gravityDirection.toUpperCase()}`, 10, 25);

    // Draw blocks
    level.blocks.forEach(block => {
      if (block.type === 'solid') {
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(block.x, block.y, block.width, block.height);
        ctx.strokeStyle = '#718096';
        ctx.lineWidth = 2;
        ctx.strokeRect(block.x, block.y, block.width, block.height);
      } else if (block.type === 'gravity') {
        // Gravity blocks with special effect
        const time = Date.now() * 0.005;
        const alpha = 0.7 + 0.3 * Math.sin(time);
        ctx.fillStyle = `rgba(255, 0, 255, ${alpha})`;
        ctx.fillRect(block.x, block.y, block.width, block.height);
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 3;
        ctx.strokeRect(block.x, block.y, block.width, block.height);
        
        // Add sparkle effect
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 3; i++) {
          const sparkleX = block.x + (block.width * (0.2 + 0.6 * Math.sin(time + i * 2)));
          const sparkleY = block.y + (block.height * (0.2 + 0.6 * Math.cos(time + i * 2)));
          ctx.beginPath();
          ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    // Draw goal
    const goal = level.goal;
    const goalTime = Date.now() * 0.003;
    const goalAlpha = 0.6 + 0.4 * Math.sin(goalTime);
    ctx.fillStyle = `rgba(0, 255, 0, ${goalAlpha})`;
    ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.strokeRect(goal.x, goal.y, goal.width, goal.height);

    // Draw ball
    const ballTime = Date.now() * 0.01;
    ctx.save();
    ctx.translate(ball.x, ball.y);
    
    // Ball glow effect
    const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, ball.radius * 2);
    glowGradient.addColorStop(0, '#00ffff');
    glowGradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.5)');
    glowGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, ball.radius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Ball main body
    const ballGradient = ctx.createRadialGradient(-5, -5, 0, 0, 0, ball.radius);
    ballGradient.addColorStop(0, '#87ceeb');
    ballGradient.addColorStop(1, '#00ffff');
    ctx.fillStyle = ballGradient;
    ctx.beginPath();
    ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Ball rotation effect
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(Math.cos(ballTime) * 8, Math.sin(ballTime) * 8, 3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // Draw win message
    if (isWon) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, 800, 450);
      
      ctx.fillStyle = '#00ff00';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Level Complete!', 400, 200);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      if (currentLevel < levels.length - 1) {
        ctx.fillText('Press SPACE for next level', 400, 250);
      } else {
        ctx.fillText('All levels complete!', 400, 250);
      }
      ctx.fillText('Press R to restart level', 400, 280);
    }

    // Draw instructions
    if (!gameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 800, 450);
      
      ctx.fillStyle = '#00ffff';
      ctx.font = '36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Gravity Shift', 400, 150);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px Arial';
      ctx.fillText('Use WASD or Arrow Keys to move', 400, 200);
      ctx.fillText('Purple blocks change gravity direction', 400, 230);
      ctx.fillText('Reach the green goal!', 400, 260);
      ctx.fillText('Press SPACE to start', 400, 300);
    }

    ctx.textAlign = 'left';
  }, [ball.x, ball.y, ball.radius, level.blocks, level.goal, gravityDirection, isWon, gameStarted, currentLevel]);

  const gameLoop = useCallback(() => {
    updateBall();
    draw();
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [updateBall, draw]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      if (key === ' ') {
        e.preventDefault();
        if (!gameStarted) {
          setGameStarted(true);
        } else if (isWon && currentLevel < levels.length - 1) {
          setCurrentLevel(prev => prev + 1);
        }
      } else if (key === 'r') {
        e.preventDefault();
        resetLevel();
      } else if (key === 'g') {
        e.preventDefault();
        // Manual gravity toggle for advanced play
        const directions: ('down' | 'up' | 'left' | 'right')[] = ['down', 'up', 'left', 'right'];
        const currentIndex = directions.indexOf(gravityDirection);
        setGravityDirection(directions[(currentIndex + 1) % directions.length]);
      }
      
      keysPressed.current.add(key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, isWon, currentLevel, resetLevel, gravityDirection]);

  useEffect(() => {
    let frameId: number;

    const animate = () => {
      if (gameStarted) {
        updateBall();
      }
      draw();
      frameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [gameStarted]);  // Only depend on gameStarted

  return (
    <GameLayout
      gameTitle="Gravity Shift"
      gameCategory="Puzzle"
    >
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={450}
            className="border-2 border-cyan-400 rounded-lg shadow-2xl bg-slate-800"
            tabIndex={0}
          />
          
          <div className="mt-4 text-center">
            <div className="text-cyan-400 text-lg font-bold mb-2">
              Level {currentLevel + 1} of {levels.length}
            </div>
            <div className="flex justify-center space-x-4 text-sm text-gray-300">
              <span>WASD/Arrows: Move</span>
              <span>G: Change Gravity</span>
              <span>R: Restart</span>
              <span>Space: Start/Next</span>
            </div>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default GravityShift;
