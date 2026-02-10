import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

const SynthNinjaReflex = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  
  const [gameState, setGameState] = useState({
    player: { x: 100, y: 300, reflexTime: 0 },
    obstacles: [] as Array<{x: number, y: number}>,
    score: 0,
    level: 1,
    gameOver: false
  });

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Synthwave gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#ff6600');
    gradient.addColorStop(0.5, '#ff0099');
    gradient.addColorStop(1, '#7000ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw synthwave grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Draw ninja
    ctx.fillStyle = '#0aff9d';
    ctx.shadowColor = '#0aff9d';
    ctx.shadowBlur = 15;
    ctx.fillRect(gameState.player.x, gameState.player.y, 20, 20);
    ctx.shadowBlur = 0;

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Reflex Score: ${gameState.score}`, 10, 25);
    ctx.fillText(`Level: ${gameState.level}`, 10, 45);

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff6600';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SYNTH NINJA MASTERY', canvas.width / 2, canvas.height / 2);
    }
  }, [gameState]);

  useEffect(() => {
    gameLoopRef.current = setInterval(gameLoop, 1000 / 60);
    return () => clearInterval(gameLoopRef.current!);
  }, [gameLoop]);

  return (
    <GameLayout gameTitle="Synth Ninja Reflex" gameCategory="Synthwave ninja reflex challenges">
      <div className="flex flex-col items-center gap-4">
        <canvas ref={canvasRef} width={800} height={600} className="border border-gray-600 bg-black rounded-lg" />
        <p className="text-gray-300">WASD: Move | Test your ninja reflexes!</p>
      </div>
    </GameLayout>
  );
};

export default SynthNinjaReflex;
