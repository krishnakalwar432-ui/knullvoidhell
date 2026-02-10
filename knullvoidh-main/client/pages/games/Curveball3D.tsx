import React, { useState, useEffect, useRef } from 'react';
import GameLayout from '@/components/GameLayout';

const Curveball3D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused'>('playing');
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [ball, setBall] = useState({ x: 400, y: 300, z: 0, vx: 4, vy: 2, vz: 1, curve: 0 });
  const [playerPaddle, setPlayerPaddle] = useState({ x: 350, y: 550 });
  const [aiPaddle, setAiPaddle] = useState({ x: 350, y: 50 });
  const [mousePos, setMousePos] = useState({ x: 400, y: 300 });

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const gameLoop = setInterval(() => {
      setPlayerPaddle({ x: mousePos.x - 50, y: 550 });
      setAiPaddle(prev => ({ x: prev.x + (ball.x - prev.x - 50) * 0.1, y: 50 }));

      setBall(prev => {
        let newX = prev.x + prev.vx + Math.sin(prev.curve) * 2;
        let newY = prev.y + prev.vy;
        let newZ = prev.z + prev.vz;
        let newVx = prev.vx;
        let newVy = prev.vy;
        let newVz = prev.vz;
        let newCurve = prev.curve + 0.1;

        if (newX <= 0 || newX >= CANVAS_WIDTH) newVx = -newVx;
        if (newZ <= -50 || newZ >= 50) newVz = -newVz;

        // Player paddle collision
        if (newY >= 530 && newY <= 550 && newX >= playerPaddle.x && newX <= playerPaddle.x + 100) {
          newVy = -Math.abs(newVy);
          newCurve = (newX - playerPaddle.x - 50) * 0.05;
        }

        // AI paddle collision
        if (newY <= 70 && newY >= 50 && newX >= aiPaddle.x && newX <= aiPaddle.x + 100) {
          newVy = Math.abs(newVy);
          newCurve = (newX - aiPaddle.x - 50) * 0.02;
        }

        if (newY < 0) { setScore(s => ({ ...s, player: s.player + 1 })); return { x: 400, y: 300, z: 0, vx: 4, vy: 2, vz: 1, curve: 0 }; }
        if (newY > CANVAS_HEIGHT) { setScore(s => ({ ...s, ai: s.ai + 1 })); return { x: 400, y: 300, z: 0, vx: -4, vy: -2, vz: 1, curve: 0 }; }

        return { x: newX, y: newY, z: newZ, vx: newVx, vy: newVy, vz: newVz, curve: newCurve };
      });
    }, 16);
    return () => clearInterval(gameLoop);
  }, [gameState, ball, playerPaddle, aiPaddle, mousePos]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const scale = 1 + ball.z * 0.01;
    
    // Draw paddles
    ctx.fillStyle = '#0aff9d';
    ctx.shadowColor = '#0aff9d';
    ctx.shadowBlur = 10;
    ctx.fillRect(playerPaddle.x, playerPaddle.y, 100, 20);
    ctx.fillStyle = '#ff0099';
    ctx.shadowColor = '#ff0099';
    ctx.shadowBlur = 10;
    ctx.fillRect(aiPaddle.x, aiPaddle.y, 100, 20);

    // Draw ball with curve trail
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const trailX = ball.x - ball.vx * i - Math.sin(ball.curve - i * 0.1) * 2 * i;
      const trailY = ball.y - ball.vy * i;
      if (i === 0) ctx.moveTo(trailX, trailY);
      else ctx.lineTo(trailX, trailY);
    }
    ctx.stroke();

    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 10 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${score.player} - ${score.ai}`, CANVAS_WIDTH/2, 40);
  });

  const handlePause = () => setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  const handleReset = () => {
    setScore({ player: 0, ai: 0 });
    setBall({ x: 400, y: 300, z: 0, vx: 4, vy: 2, vz: 1, curve: 0 });
    setGameState('playing');
  };

  return (
    <GameLayout gameTitle="Curveball 3D" gameCategory="Sports" score={score.player} isPlaying={gameState === 'playing'} onPause={handlePause} onReset={handleReset}>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="relative">
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="border border-neon-pink/50 rounded-lg bg-black/20 backdrop-blur-sm shadow-2xl max-w-full h-auto" style={{ touchAction: 'none' }} />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Move mouse to control paddle • Ball curves based on hit position!</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default Curveball3D;
