import React, { useState, useEffect, useRef } from 'react';
import GameLayout from '@/components/GameLayout';

const PaddleWars3D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [ball, setBall] = useState({ x: 400, y: 300, z: 0, vx: 5, vy: 3, vz: 2 });
  const [playerPaddle, setPlayerPaddle] = useState({ y: 250, z: 0 });
  const [aiPaddle, setAiPaddle] = useState({ y: 250, z: 0 });
  const [keys, setKeys] = useState<Set<string>>(new Set());

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const PADDLE_HEIGHT = 100;
  const PADDLE_WIDTH = 20;
  const BALL_SIZE = 15;

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
      // Update player paddle
      setPlayerPaddle(prev => {
        let newY = prev.y;
        let newZ = prev.z;
        if (keys.has('w')) newY = Math.max(50, prev.y - 5);
        if (keys.has('s')) newY = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT - 50, prev.y + 5);
        if (keys.has('a')) newZ = Math.max(-50, prev.z - 3);
        if (keys.has('d')) newZ = Math.min(50, prev.z + 3);
        return { y: newY, z: newZ };
      });

      // AI paddle follows ball
      setAiPaddle(prev => ({
        y: prev.y + (ball.y - prev.y - PADDLE_HEIGHT/2) * 0.1,
        z: prev.z + (ball.z - prev.z) * 0.08
      }));

      // Update ball
      setBall(prev => {
        let newX = prev.x + prev.vx;
        let newY = prev.y + prev.vy;
        let newZ = prev.z + prev.vz;
        let newVx = prev.vx;
        let newVy = prev.vy;
        let newVz = prev.vz;

        // Wall bounces
        if (newY <= 0 || newY >= CANVAS_HEIGHT) newVy = -newVy;
        if (newZ <= -100 || newZ >= 100) newVz = -newVz;

        // Player paddle collision
        if (newX <= 50 && newX > 30 && newY > playerPaddle.y && newY < playerPaddle.y + PADDLE_HEIGHT && Math.abs(newZ - playerPaddle.z) < 30) {
          newVx = Math.abs(newVx);
          newVy += (newY - (playerPaddle.y + PADDLE_HEIGHT/2)) * 0.1;
          newVz += (newZ - playerPaddle.z) * 0.1;
        }

        // AI paddle collision
        if (newX >= CANVAS_WIDTH - 50 && newX < CANVAS_WIDTH - 30 && newY > aiPaddle.y && newY < aiPaddle.y + PADDLE_HEIGHT && Math.abs(newZ - aiPaddle.z) < 30) {
          newVx = -Math.abs(newVx);
          newVy += (newY - (aiPaddle.y + PADDLE_HEIGHT/2)) * 0.1;
          newVz += (newZ - aiPaddle.z) * 0.1;
        }

        // Scoring
        if (newX < 0) {
          setScore(s => ({ ...s, ai: s.ai + 1 }));
          return { x: 400, y: 300, z: 0, vx: 5, vy: (Math.random() - 0.5) * 4, vz: (Math.random() - 0.5) * 4 };
        }
        if (newX > CANVAS_WIDTH) {
          setScore(s => ({ ...s, player: s.player + 1 }));
          return { x: 400, y: 300, z: 0, vx: -5, vy: (Math.random() - 0.5) * 4, vz: (Math.random() - 0.5) * 4 };
        }

        return { x: newX, y: newY, z: newZ, vx: newVx, vy: newVy, vz: newVz };
      });
    }, 16);

    return () => clearInterval(gameLoop);
  }, [gameState, ball, playerPaddle, aiPaddle, keys]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 3D perspective calculation
    const perspective = (z: number) => 1 + z * 0.002;

    // Draw court
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(25, 25, CANVAS_WIDTH - 50, CANVAS_HEIGHT - 50);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH/2, 25);
    ctx.lineTo(CANVAS_WIDTH/2, CANVAS_HEIGHT - 25);
    ctx.stroke();

    // Draw player paddle with 3D effect
    const playerScale = perspective(playerPaddle.z);
    ctx.fillStyle = '#0aff9d';
    ctx.shadowColor = '#0aff9d';
    ctx.shadowBlur = 10;
    ctx.fillRect(25, playerPaddle.y, PADDLE_WIDTH * playerScale, PADDLE_HEIGHT * playerScale);
    ctx.shadowBlur = 0;

    // Draw AI paddle with 3D effect
    const aiScale = perspective(aiPaddle.z);
    ctx.fillStyle = '#ff0099';
    ctx.shadowColor = '#ff0099';
    ctx.shadowBlur = 10;
    ctx.fillRect(CANVAS_WIDTH - 25 - PADDLE_WIDTH * aiScale, aiPaddle.y, PADDLE_WIDTH * aiScale, PADDLE_HEIGHT * aiScale);
    ctx.shadowBlur = 0;

    // Draw ball with 3D effect
    const ballScale = perspective(ball.z);
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_SIZE * ballScale, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw 3D depth lines
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      const y1 = 25 + (i + 2) * (CANVAS_HEIGHT - 50) / 4;
      const y2 = y1;
      ctx.beginPath();
      ctx.moveTo(25, y1);
      ctx.lineTo(CANVAS_WIDTH - 25, y2);
      ctx.stroke();
    }

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${score.player} - ${score.ai}`, CANVAS_WIDTH/2, 50);
    ctx.font = '16px monospace';
    ctx.fillText('3D PADDLE WARS', CANVAS_WIDTH/2, CANVAS_HEIGHT - 20);
    ctx.textAlign = 'left';
  });

  const handlePause = () => setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  const handleReset = () => {
    setScore({ player: 0, ai: 0 });
    setBall({ x: 400, y: 300, z: 0, vx: 5, vy: 3, vz: 2 });
    setPlayerPaddle({ y: 250, z: 0 });
    setAiPaddle({ y: 250, z: 0 });
    setGameState('playing');
  };

  return (
    <GameLayout gameTitle="Paddle Wars 3D" gameCategory="Sports" score={score.player} isPlaying={gameState === 'playing'} onPause={handlePause} onReset={handleReset}>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="relative">
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="border border-neon-green/50 rounded-lg bg-black/20 backdrop-blur-sm shadow-2xl max-w-full h-auto" style={{ touchAction: 'none' }} />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>WASD to move paddle • 3D pong with depth control!</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default PaddleWars3D;
