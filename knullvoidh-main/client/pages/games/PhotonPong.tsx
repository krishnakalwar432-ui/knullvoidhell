import React, { useState, useEffect, useRef } from 'react';
import GameLayout from '@/components/GameLayout';

const PhotonPong: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused'>('playing');
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [ball, setBall] = useState({ x: 400, y: 300, vx: 5, vy: 3, trail: [] as Array<{x: number, y: number}> });
  const [playerPaddle, setPlayerPaddle] = useState({ y: 250 });
  const [aiPaddle, setAiPaddle] = useState({ y: 250 });
  const [keys, setKeys] = useState<Set<string>>(new Set());

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => setKeys(prev => new Set([...prev, e.key.toLowerCase()]));
    const handleKeyUp = (e: KeyboardEvent) => setKeys(prev => { const newKeys = new Set(prev); newKeys.delete(e.key.toLowerCase()); return newKeys; });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const gameLoop = setInterval(() => {
      setPlayerPaddle(prev => {
        let newY = prev.y;
        if (keys.has('w') || keys.has('arrowup')) newY = Math.max(50, prev.y - 6);
        if (keys.has('s') || keys.has('arrowdown')) newY = Math.min(CANVAS_HEIGHT - 150, prev.y + 6);
        return { y: newY };
      });

      setAiPaddle(prev => ({ y: prev.y + (ball.y - prev.y - 50) * 0.08 }));

      setBall(prev => {
        let newX = prev.x + prev.vx;
        let newY = prev.y + prev.vy;
        let newVx = prev.vx;
        let newVy = prev.vy;
        let newTrail = [...prev.trail, { x: prev.x, y: prev.y }].slice(-20);

        if (newY <= 0 || newY >= CANVAS_HEIGHT) newVy = -newVy;

        // Player paddle
        if (newX <= 30 && newY > playerPaddle.y && newY < playerPaddle.y + 100) {
          newVx = Math.abs(newVx) * 1.05;
          newVy += (newY - (playerPaddle.y + 50)) * 0.1;
        }

        // AI paddle
        if (newX >= CANVAS_WIDTH - 30 && newY > aiPaddle.y && newY < aiPaddle.y + 100) {
          newVx = -Math.abs(newVx) * 1.05;
          newVy += (newY - (aiPaddle.y + 50)) * 0.1;
        }

        if (newX < 0) { setScore(s => ({ ...s, ai: s.ai + 1 })); return { x: 400, y: 300, vx: 5, vy: 3, trail: [] }; }
        if (newX > CANVAS_WIDTH) { setScore(s => ({ ...s, player: s.player + 1 })); return { x: 400, y: 300, vx: -5, vy: 3, trail: [] }; }

        return { x: newX, y: newY, vx: newVx, vy: newVy, trail: newTrail };
      });
    }, 16);
    return () => clearInterval(gameLoop);
  }, [gameState, ball, playerPaddle, keys]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw photon trail
    ball.trail.forEach((point, i) => {
      const alpha = i / ball.trail.length;
      ctx.fillStyle = `rgba(255, 255, 0, ${alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3 * alpha, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw paddles
    ctx.fillStyle = '#0aff9d';
    ctx.shadowColor = '#0aff9d';
    ctx.shadowBlur = 10;
    ctx.fillRect(10, playerPaddle.y, 20, 100);
    ctx.fillStyle = '#ff0099';
    ctx.shadowColor = '#ff0099';
    ctx.fillRect(CANVAS_WIDTH - 30, aiPaddle.y, 20, 100);

    // Draw photon ball
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Center line
    ctx.strokeStyle = '#333333';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH/2, 0);
    ctx.lineTo(CANVAS_WIDTH/2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ffffff';
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${score.player} - ${score.ai}`, CANVAS_WIDTH/2, 40);
  });

  const handlePause = () => setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  const handleReset = () => {
    setScore({ player: 0, ai: 0 });
    setBall({ x: 400, y: 300, vx: 5, vy: 3, trail: [] });
    setGameState('playing');
  };

  return (
    <GameLayout gameTitle="Photon Pong" gameCategory="Sports" score={score.player} isPlaying={gameState === 'playing'} onPause={handlePause} onReset={handleReset}>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="relative">
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="border border-neon-yellow/50 rounded-lg bg-black/20 backdrop-blur-sm shadow-2xl max-w-full h-auto" style={{ touchAction: 'none' }} />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>W/S or Arrow keys to move • Pong with photon physics!</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default PhotonPong;
