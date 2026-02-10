import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  onGround: boolean;
  color: string;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'normal' | 'deadly';
}

const GSwitch3 = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());

  const [gameState, setGameState] = useState({
    player: {
      x: 100, y: 300, vx: 4, vy: 0, gravity: 1,
      onGround: false, color: '#0aff9d'
    } as Player,
    platforms: [] as Platform[],
    camera: { x: 0 },
    score: 0,
    speed: 4,
    gameOver: false
  });

  const generatePlatforms = useCallback((startX: number) => {
    const platforms: Platform[] = [];
    for (let i = 0; i < 30; i++) {
      const x = startX + i * 150 + Math.random() * 100;
      platforms.push({
        x,
        y: 200 + Math.random() * 200,
        width: 100 + Math.random() * 100,
        height: 20,
        type: Math.random() < 0.1 ? 'deadly' : 'normal'
      });
      
      // Add ceiling platforms
      if (Math.random() < 0.4) {
        platforms.push({
          x: x + 50,
          y: 100 + Math.random() * 100,
          width: 80 + Math.random() * 80,
          height: 20,
          type: Math.random() < 0.1 ? 'deadly' : 'normal'
        });
      }
    }
    return platforms;
  }, []);

  const initializeGame = useCallback(() => {
    setGameState({
      player: {
        x: 100, y: 300, vx: 4, vy: 0, gravity: 1,
        onGround: false, color: '#0aff9d'
      },
      platforms: generatePlatforms(200),
      camera: { x: 0 },
      score: 0,
      speed: 4,
      gameOver: false
    });
  }, [generatePlatforms]);

  const update = useCallback(() => {
    if (gameState.gameOver) return;

    setGameState(prev => {
      const newState = { ...prev };
      const player = { ...newState.player };

      // Gravity flip control
      if (keysRef.current.has(' ') || keysRef.current.has('arrowup')) {
        player.gravity *= -1;
        player.vy = 0; // Reset vertical velocity on flip
      }

      // Apply physics
      player.vy += player.gravity * 0.4;
      player.x += player.vx;
      player.y += player.vy;

      // Speed increase over time
      newState.speed += 0.001;
      player.vx = Math.max(player.vx, newState.speed);

      // Camera follows player
      newState.camera.x = player.x - 200;

      // Platform collisions
      player.onGround = false;
      for (const platform of newState.platforms) {
        if (player.x + 10 > platform.x && player.x - 10 < platform.x + platform.width) {
          // Top collision (player falling down)
          if (player.gravity > 0 && player.vy > 0 && 
              player.y + 10 > platform.y && player.y - 10 < platform.y) {
            player.y = platform.y - 10;
            player.vy = 0;
            player.onGround = true;
            
            if (platform.type === 'deadly') {
              newState.gameOver = true;
            }
          }
          // Bottom collision (player falling up)
          else if (player.gravity < 0 && player.vy < 0 && 
                   player.y - 10 < platform.y + platform.height && player.y + 10 > platform.y + platform.height) {
            player.y = platform.y + platform.height + 10;
            player.vy = 0;
            player.onGround = true;
            
            if (platform.type === 'deadly') {
              newState.gameOver = true;
            }
          }
        }
      }

      // Death conditions
      if (player.y > 600 || player.y < 0) {
        newState.gameOver = true;
      }

      // Generate more platforms
      if (player.x > newState.platforms[newState.platforms.length - 1].x - 500) {
        newState.platforms.push(...generatePlatforms(newState.platforms[newState.platforms.length - 1].x));
      }

      // Update score
      newState.score = Math.floor(player.x / 10);

      // Remove old platforms
      newState.platforms = newState.platforms.filter(p => p.x > newState.camera.x - 200);

      newState.player = player;
      return newState;
    });
  }, [gameState.gameOver, generatePlatforms]);

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

    // Draw platforms
    for (const platform of gameState.platforms) {
      if (platform.x > gameState.camera.x - 100 && platform.x < gameState.camera.x + width + 100) {
        ctx.fillStyle = platform.type === 'deadly' ? '#ff0099' : '#7000ff';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        ctx.shadowBlur = 0;
      }
    }

    // Draw player
    ctx.fillStyle = gameState.player.color;
    ctx.shadowColor = gameState.player.color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(gameState.player.x, gameState.player.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw gravity indicator
    ctx.fillStyle = gameState.player.gravity > 0 ? '#ffff00' : '#ff6600';
    const arrowY = gameState.player.y + (gameState.player.gravity > 0 ? 20 : -20);
    ctx.beginPath();
    ctx.moveTo(gameState.player.x, arrowY);
    ctx.lineTo(gameState.player.x - 5, arrowY + (gameState.player.gravity > 0 ? -8 : 8));
    ctx.lineTo(gameState.player.x + 5, arrowY + (gameState.player.gravity > 0 ? -8 : 8));
    ctx.fill();

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
    <GameLayout gameTitle="G-Switch 3" gameCategory="Gravity-flip running game">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg shadow-2xl"
        />
        <div className="text-center text-gray-300">
          <p>Space/Up Arrow: Flip Gravity | R: Restart</p>
          <p>Avoid red platforms and survive the gravity-flipping challenge!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default GSwitch3;
