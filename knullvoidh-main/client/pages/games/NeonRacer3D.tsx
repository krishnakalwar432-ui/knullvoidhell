import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

const NeonRacer3D = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());

  const [gameState, setGameState] = useState({
    score: 0,
    gameOver: false,
    playing: true
  });

  const initializeGame = useCallback(() => {
    setGameState({
      score: 0,
      gameOver: false,
      playing: true
    });
  }, []);

  const update = useCallback(() => {
    if (gameState.gameOver) return;
    
    setGameState(prev => ({
      ...prev,
      score: prev.score + 1
    }));
  }, [gameState.gameOver]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw game content
    ctx.fillStyle = '#0aff9d';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Neon Racer 3D', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Arial';
    ctx.fillText('Game Coming Soon!', canvas.width / 2, canvas.height / 2);
    
    ctx.fillStyle = '#ff0099';
    ctx.font = '16px Arial';
    ctx.fillText(`Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 50);
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.add(key);
      
      if (key === 'r' && gameState.gameOver) {
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
    <GameLayout gameTitle="Neon Racer 3D" gameCategory="Racing">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg shadow-2xl"
        />
        <div className="text-center text-gray-300">
          <p>WASD: Drive | Space: Boost</p>
          <p>Full game implementation coming soon!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default NeonRacer3D;
