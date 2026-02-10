import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Car {
  x: number;
  y: number;
  angle: number;
  speed: number;
  maxSpeed: number;
  acceleration: number;
  friction: number;
  turnSpeed: number;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'car' | 'barrier';
}

const CarRacing2DRetro = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());

  const [gameState, setGameState] = useState({
    player: {
      x: 400,
      y: 500,
      angle: 0,
      speed: 0,
      maxSpeed: 8,
      acceleration: 0.3,
      friction: 0.85,
      turnSpeed: 0.08
    } as Car,
    obstacles: [] as Obstacle[],
    roadOffset: 0,
    score: 0,
    gameOver: false,
    lapTime: 0,
    bestLap: 0
  });

  const generateObstacles = useCallback(() => {
    const obstacles: Obstacle[] = [];

    // Generate random traffic
    for (let i = 0; i < 10; i++) {
      obstacles.push({
        x: Math.random() * 600 + 100,
        y: Math.random() * 2000 + 100,
        width: 40,
        height: 80,
        type: 'car'
      });
    }

    // Generate barriers
    for (let i = 0; i < 20; i++) {
      const side = Math.random() < 0.5 ? 'left' : 'right';
      obstacles.push({
        x: side === 'left' ? 50 : 750,
        y: Math.random() * 2000,
        width: 50,
        height: 30,
        type: 'barrier'
      });
    }

    return obstacles;
  }, []);

  const initializeGame = useCallback(() => {
    setGameState({
      player: {
        x: 400,
        y: 500,
        angle: 0,
        speed: 0,
        maxSpeed: 8,
        acceleration: 0.3,
        friction: 0.85,
        turnSpeed: 0.08
      },
      obstacles: generateObstacles(),
      roadOffset: 0,
      score: 0,
      gameOver: false,
      lapTime: 0,
      bestLap: 0
    });
  }, [generateObstacles]);

  const checkCollision = (rect1: any, rect2: any) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + 40 > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + 80 > rect2.y;
  };

  const update = useCallback(() => {
    if (gameState.gameOver) return;

    setGameState(prev => {
      const newState = { ...prev };
      const player = { ...newState.player };

      // Handle input
      let turning = 0;
      if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) {
        turning = -1;
      }
      if (keysRef.current.has('d') || keysRef.current.has('arrowright')) {
        turning = 1;
      }

      let accelerating = 0;
      if (keysRef.current.has('w') || keysRef.current.has('arrowup')) {
        accelerating = 1;
      }
      if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) {
        accelerating = -0.5;
      }

      // Update car physics
      if (accelerating !== 0) {
        player.speed += accelerating * player.acceleration;
        player.speed = Math.max(-player.maxSpeed / 2, Math.min(player.maxSpeed, player.speed));
      } else {
        player.speed *= player.friction;
      }

      // Turn only when moving
      if (Math.abs(player.speed) > 0.1 && turning !== 0) {
        player.angle += turning * player.turnSpeed * Math.abs(player.speed) / player.maxSpeed;
      }

      // Update position
      player.x += Math.sin(player.angle) * player.speed;
      player.y -= Math.cos(player.angle) * player.speed;

      // Keep player on track
      if (player.x < 80) {
        player.x = 80;
        player.speed *= 0.5;
      }
      if (player.x > 720) {
        player.x = 720;
        player.speed *= 0.5;
      }

      // Update road offset for scrolling effect
      newState.roadOffset += player.speed;

      // Move obstacles relative to player
      newState.obstacles = newState.obstacles.map(obstacle => ({
        ...obstacle,
        y: obstacle.y - player.speed
      }));

      // Add new obstacles as needed
      if (newState.obstacles.filter(o => o.y > -100).length < 15) {
        const newObstacles = generateObstacles().map(obs => ({
          ...obs,
          y: obs.y + 1000
        }));
        newState.obstacles.push(...newObstacles);
      }

      // Remove far obstacles
      newState.obstacles = newState.obstacles.filter(obstacle => obstacle.y > -200 && obstacle.y < 800);

      // Check collisions
      for (const obstacle of newState.obstacles) {
        if (checkCollision(player, obstacle)) {
          if (obstacle.type === 'car') {
            newState.score = Math.max(0, newState.score - 50);
            player.speed *= 0.3;
          } else {
            newState.gameOver = true;
          }
        }
      }

      // Update score based on distance
      if (player.speed > 0) {
        newState.score += Math.floor(player.speed);
      }

      // Update lap time
      newState.lapTime += 1/60;

      // Check for lap completion (simplified)
      if (newState.roadOffset > 5000) {
        if (newState.bestLap === 0 || newState.lapTime < newState.bestLap) {
          newState.bestLap = newState.lapTime;
        }
        newState.roadOffset = 0;
        newState.lapTime = 0;
        newState.score += 1000;
      }

      newState.player = player;
      return newState;
    });
  }, [gameState.gameOver, generateObstacles]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with road
    ctx.fillStyle = '#2d4a2d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw track
    ctx.fillStyle = '#555555';
    ctx.fillRect(80, 0, 640, canvas.height);

    // Draw road lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 20]);
    ctx.lineDashOffset = gameState.roadOffset % 40;

    ctx.beginPath();
    ctx.moveTo(400, 0);
    ctx.lineTo(400, canvas.height);
    ctx.stroke();

    ctx.setLineDash([]);

    // Draw track borders
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(80, 0);
    ctx.lineTo(80, canvas.height);
    ctx.moveTo(720, 0);
    ctx.lineTo(720, canvas.height);
    ctx.stroke();

    // Draw obstacles
    gameState.obstacles.forEach(obstacle => {
      if (obstacle.y > -100 && obstacle.y < 700) {
        if (obstacle.type === 'car') {
          // Draw car
          ctx.fillStyle = '#ff4444';
          ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

          // Car details
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(obstacle.x + 5, obstacle.y + 10, 10, 15);
          ctx.fillRect(obstacle.x + 25, obstacle.y + 10, 10, 15);
          ctx.fillRect(obstacle.x + 5, obstacle.y + 55, 10, 15);
          ctx.fillRect(obstacle.x + 25, obstacle.y + 55, 10, 15);
        } else {
          // Draw barrier
          ctx.fillStyle = '#888888';
          ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 2;
          ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
      }
    });

    // Draw player car
    ctx.save();
    ctx.translate(gameState.player.x + 20, gameState.player.y + 40);
    ctx.rotate(gameState.player.angle);

    // Car body
    ctx.fillStyle = '#0099ff';
    ctx.fillRect(-20, -40, 40, 80);

    // Car details
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-15, -30, 8, 12);
    ctx.fillRect(7, -30, 8, 12);
    ctx.fillRect(-15, 18, 8, 12);
    ctx.fillRect(7, 18, 8, 12);

    // Front of car
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(-10, -40, 20, 5);

    ctx.restore();

    // Draw UI
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 20, 30);
    ctx.fillText(`Speed: ${Math.floor(gameState.player.speed * 10)}`, 20, 60);
    ctx.fillText(`Lap Time: ${gameState.lapTime.toFixed(1)}s`, 20, 90);

    if (gameState.bestLap > 0) {
      ctx.fillText(`Best Lap: ${gameState.bestLap.toFixed(1)}s`, 20, 120);
    }

    // Draw speedometer
    const speedPercent = Math.abs(gameState.player.speed) / gameState.player.maxSpeed;
    ctx.fillStyle = '#333333';
    ctx.fillRect(650, 20, 120, 20);
    ctx.fillStyle = speedPercent > 0.8 ? '#ff4444' : speedPercent > 0.5 ? '#ffff44' : '#44ff44';
    ctx.fillRect(652, 22, (120 - 4) * speedPercent, 16);

    // Draw game over screen
    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ff0099';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Crashed!', canvas.width / 2, canvas.height / 2 - 50);

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

      // Prevent default for game keys
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
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
    <GameLayout gameTitle="Car Racing 2D Retro" gameCategory="Top-down racing">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg shadow-2xl"
        />
        <div className="text-center text-gray-300">
          <p>WASD / Arrow Keys: Drive | R: Restart</p>
          <p>Avoid traffic and barriers, complete laps for bonus points!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default CarRacing2DRetro;
