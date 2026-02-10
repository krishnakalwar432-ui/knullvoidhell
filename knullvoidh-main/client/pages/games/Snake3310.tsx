import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface SnakeSegment {
  x: number;
  y: number;
}

interface Food {
  x: number;
  y: number;
}

const Snake3310 = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());

  const GRID_SIZE = 20;
  const GRID_WIDTH = 30;
  const GRID_HEIGHT = 25;

  const [gameState, setGameState] = useState({
    snake: [{ x: 10, y: 10 }] as SnakeSegment[],
    food: { x: 15, y: 15 } as Food,
    direction: { x: 1, y: 0 },
    score: 0,
    gameOver: false,
    speed: 150
  });

  const generateFood = useCallback((snake: SnakeSegment[]) => {
    let newFood: Food;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_WIDTH),
        y: Math.floor(Math.random() * GRID_HEIGHT)
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  const initializeGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }];
    setGameState({
      snake: initialSnake,
      food: generateFood(initialSnake),
      direction: { x: 1, y: 0 },
      score: 0,
      gameOver: false,
      speed: 150
    });
  }, [generateFood]);

  const update = useCallback(() => {
    if (gameState.gameOver) return;

    setGameState(prev => {
      const newState = { ...prev };
      const snake = [...newState.snake];
      const head = { ...snake[0] };

      // Update direction based on input
      if (keysRef.current.has('arrowup') && newState.direction.y === 0) {
        newState.direction = { x: 0, y: -1 };
      } else if (keysRef.current.has('arrowdown') && newState.direction.y === 0) {
        newState.direction = { x: 0, y: 1 };
      } else if (keysRef.current.has('arrowleft') && newState.direction.x === 0) {
        newState.direction = { x: -1, y: 0 };
      } else if (keysRef.current.has('arrowright') && newState.direction.x === 0) {
        newState.direction = { x: 1, y: 0 };
      }

      // Move head
      head.x += newState.direction.x;
      head.y += newState.direction.y;

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_WIDTH || head.y < 0 || head.y >= GRID_HEIGHT) {
        newState.gameOver = true;
        return newState;
      }

      // Check self collision
      if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        newState.gameOver = true;
        return newState;
      }

      snake.unshift(head);

      // Check food collision
      if (head.x === newState.food.x && head.y === newState.food.y) {
        newState.score += 10;
        newState.food = generateFood(snake);
        // Increase speed slightly
        newState.speed = Math.max(80, newState.speed - 2);
      } else {
        snake.pop();
      }

      newState.snake = snake;
      return newState;
    });
  }, [gameState.gameOver, generateFood]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with Nokia green background
    ctx.fillStyle = '#9BBC0F';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#8BAC0F';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_WIDTH; i++) {
      ctx.beginPath();
      ctx.moveTo(i * GRID_SIZE, 0);
      ctx.lineTo(i * GRID_SIZE, GRID_HEIGHT * GRID_SIZE);
      ctx.stroke();
    }
    for (let i = 0; i <= GRID_HEIGHT; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * GRID_SIZE);
      ctx.lineTo(GRID_WIDTH * GRID_SIZE, i * GRID_SIZE);
      ctx.stroke();
    }

    // Draw snake
    ctx.fillStyle = '#306230';
    gameState.snake.forEach((segment, index) => {
      ctx.fillRect(
        segment.x * GRID_SIZE + 1,
        segment.y * GRID_SIZE + 1,
        GRID_SIZE - 2,
        GRID_SIZE - 2
      );
      
      // Draw head differently
      if (index === 0) {
        ctx.fillStyle = '#0F380F';
        ctx.fillRect(
          segment.x * GRID_SIZE + 4,
          segment.y * GRID_SIZE + 4,
          GRID_SIZE - 8,
          GRID_SIZE - 8
        );
        ctx.fillStyle = '#306230';
      }
    });

    // Draw food
    ctx.fillStyle = '#0F380F';
    ctx.fillRect(
      gameState.food.x * GRID_SIZE + 2,
      gameState.food.y * GRID_SIZE + 2,
      GRID_SIZE - 4,
      GRID_SIZE - 4
    );

    // Draw score
    ctx.fillStyle = '#0F380F';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`Score: ${gameState.score}`, 10, 530);
    ctx.fillText(`Length: ${gameState.snake.length}`, 200, 530);

    // Draw game over screen
    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(15, 56, 15, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#9BBC0F';
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);
      
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 40);
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
    gameLoopRef.current = setInterval(update, gameState.speed);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [update, gameState.speed]);

  useEffect(() => {
    const renderLoop = () => {
      render();
      requestAnimationFrame(renderLoop);
    };
    renderLoop();
  }, [render]);

  return (
    <GameLayout gameTitle="Snake 3310" gameCategory="Nokia Snake clone">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={600}
          height={550}
          className="border-2 border-gray-600 rounded-lg"
          style={{ backgroundColor: '#9BBC0F' }}
        />
        <div className="text-center text-gray-300">
          <p>Arrow Keys: Control Snake | R: Restart</p>
          <p>Classic Nokia 3310 Snake experience!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default Snake3310;
