import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

const GalagaSpecialEdition = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());

  const [gameState, setGameState] = useState({
    player: { x: 400, y: 500, health: 100 },
    enemies: [] as Array<{x: number, y: number, health: number}>,
    bullets: [] as Array<{x: number, y: number, vy: number}>,
    score: 0,
    gameOver: false
  });

  const update = useCallback(() => {
    if (gameState.gameOver) return;
    
    setGameState(prev => {
      const newState = { ...prev };
      
      // Player movement
      if (keysRef.current.has('a')) newState.player.x = Math.max(0, newState.player.x - 5);
      if (keysRef.current.has('d')) newState.player.x = Math.min(800, newState.player.x + 5);
      
      // Shooting
      if (keysRef.current.has(' ')) {
        if (newState.bullets.length < 10) {
          newState.bullets.push({ x: newState.player.x, y: newState.player.y - 20, vy: -8 });
        }
      }
      
      // Update bullets
      newState.bullets.forEach(bullet => bullet.y += bullet.vy);
      newState.bullets = newState.bullets.filter(bullet => bullet.y > 0);
      
      // Spawn enemies
      if (Math.random() < 0.02) {
        newState.enemies.push({ x: Math.random() * 800, y: 0, health: 1 });
      }
      
      // Move enemies
      newState.enemies.forEach(enemy => enemy.y += 2);
      newState.enemies = newState.enemies.filter(enemy => enemy.y < 600);
      
      newState.score += 1;
      return newState;
    });
  }, [gameState.gameOver]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, 800, 600);

    // Draw player
    ctx.fillStyle = '#0aff9d';
    ctx.fillRect(gameState.player.x - 15, gameState.player.y - 15, 30, 30);

    // Draw enemies
    ctx.fillStyle = '#ff0099';
    gameState.enemies.forEach(enemy => {
      ctx.fillRect(enemy.x - 10, enemy.y - 10, 20, 20);
    });

    // Draw bullets
    ctx.fillStyle = '#ffff00';
    gameState.bullets.forEach(bullet => {
      ctx.fillRect(bullet.x - 2, bullet.y - 5, 4, 10);
    });

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 20, 40);
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
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
    <GameLayout gameTitle="Galaga Special Edition" gameCategory="Retro alien shooter">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg"
        />
        <p className="text-gray-300">A/D: Move | Space: Shoot</p>
      </div>
    </GameLayout>
  );
};

export default GalagaSpecialEdition;
