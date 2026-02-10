import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';
import { getSafeCanvasContext, SafeGameLoop } from '@/utils/gameUtils';

const NeuroStrikeCombat = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<SafeGameLoop | null>(null);
  
  const [gameState, setGameState] = useState({
    player: { x: 400, y: 300, health: 100, neuralLink: 100 },
    enemies: [] as Array<{x: number, y: number, health: number}>,
    score: 0,
    combatLevel: 1,
    gameOver: false
  });

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getSafeCanvasContext(canvas);
    if (!ctx) return;

    // Neural interface background
    ctx.fillStyle = '#000022';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Neural network lines
    ctx.strokeStyle = 'rgba(0, 255, 153, 0.3)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, 0);
      ctx.lineTo(Math.random() * canvas.width, canvas.height);
      ctx.stroke();
    }

    // Draw player with neural interface
    ctx.fillStyle = '#0aff9d';
    ctx.shadowColor = '#0aff9d';
    ctx.shadowBlur = 20;
    ctx.fillRect(gameState.player.x - 10, gameState.player.y - 10, 20, 20);
    
    // Neural connection effects
    ctx.strokeStyle = '#0aff9d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(gameState.player.x, gameState.player.y, 30, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.shadowBlur = 0;

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Health: ${gameState.player.health}`, 10, 25);
    ctx.fillText(`Neural Link: ${gameState.player.neuralLink}`, 10, 45);
    ctx.fillText(`Score: ${gameState.score}`, 10, 65);
    ctx.fillText(`Combat Level: ${gameState.combatLevel}`, 10, 85);

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0aff9d';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NEURAL MASTERY', canvas.width / 2, canvas.height / 2);
    }
  }, [gameState]);

  useEffect(() => {
    const safeLoop = new SafeGameLoop(gameLoop, { useRequestAnimationFrame: true });
    gameLoopRef.current = safeLoop;
    safeLoop.start();

    return () => {
      if (gameLoopRef.current) {
        gameLoopRef.current.stop();
        gameLoopRef.current = null;
      }
    };
  }, [gameLoop]);

  return (
    <GameLayout gameTitle="NeuroStrike Combat" gameCategory="Neural interface combat system">
      <div className="flex flex-col items-center gap-4">
        <canvas ref={canvasRef} width={800} height={600} className="border border-gray-600 bg-black rounded-lg" />
        <p className="text-gray-300">WASD: Move | Space: Neural Strike</p>
      </div>
    </GameLayout>
  );
};

export default NeuroStrikeCombat;
