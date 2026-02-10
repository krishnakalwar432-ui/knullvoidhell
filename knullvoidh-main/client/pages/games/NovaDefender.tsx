import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

const NovaDefender = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());

  const [gameState, setGameState] = useState({
    player: { x: 400, y: 300, health: 100 },
    score: 0,
    gameOver: false
  });

  const update = useCallback(() => {
    if (gameState.gameOver) return;
    setGameState(prev => ({ ...prev, score: prev.score + 1 }));
  }, [gameState.gameOver]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#001122';
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = '#0aff9d';
    ctx.fillRect(gameState.player.x - 10, gameState.player.y - 10, 20, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 20, 40);
  }, [gameState]);

  useEffect(() => {
    gameLoopRef.current = setInterval(() => { update(); render(); }, 1000 / 60);
    return () => { if (gameLoopRef.current) clearInterval(gameLoopRef.current); };
  }, [update, render]);

  return (
    <GameLayout gameTitle="Nova Defender" gameCategory="Defense shooter">
      <div className="flex flex-col items-center gap-4">
        <canvas ref={canvasRef} width={800} height={600} className="border border-gray-600 bg-black rounded-lg" />
        <p className="text-gray-300">WASD: Move</p>
      </div>
    </GameLayout>
  );
};

export default NovaDefender;
