import React, { useState, useEffect, useRef } from 'react';
import GameLayout from '@/components/GameLayout';

const DxBall3Web: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [ball, setBall] = useState({ x: 400, y: 400, vx: 4, vy: -4 });
  const [paddle, setPaddle] = useState({ x: 350, width: 100 });
  const [bricks, setBricks] = useState<Array<{x: number, y: number, width: number, height: number, hits: number, color: string}>>([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  useEffect(() => {
    const newBricks = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 10; col++) {
        const colors = ['#ff0099', '#7000ff', '#0aff9d', '#ffff00', '#ff6600'];
        newBricks.push({
          x: col * 80,
          y: row * 30 + 50,
          width: 75,
          height: 25,
          hits: Math.floor(row / 2) + 1,
          color: colors[Math.floor(row / 2)]
        });
      }
    }
    setBricks(newBricks);
  }, []);

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
      // Update paddle
      setPaddle(prev => {
        let newX = prev.x;
        if (keys.has('a') || keys.has('arrowleft')) newX = Math.max(0, prev.x - 8);
        if (keys.has('d') || keys.has('arrowright')) newX = Math.min(CANVAS_WIDTH - prev.width, prev.x + 8);
        return { ...prev, x: newX };
      });

      // Update ball
      setBall(prev => {
        let newX = prev.x + prev.vx;
        let newY = prev.y + prev.vy;
        let newVx = prev.vx;
        let newVy = prev.vy;

        // Wall collisions
        if (newX <= 10 || newX >= CANVAS_WIDTH - 10) newVx = -newVx;
        if (newY <= 10) newVy = -newVy;
        if (newY >= CANVAS_HEIGHT) setGameState('gameOver');

        // Paddle collision
        if (newY >= 550 && newY <= 570 && newX >= paddle.x && newX <= paddle.x + paddle.width) {
          newVy = -Math.abs(newVy);
          newVx += (newX - (paddle.x + paddle.width/2)) * 0.1;
        }

        // Brick collisions
        setBricks(prevBricks => {
          let newBricks = [...prevBricks];
          for (let i = newBricks.length - 1; i >= 0; i--) {
            const brick = newBricks[i];
            if (newX >= brick.x && newX <= brick.x + brick.width && newY >= brick.y && newY <= brick.y + brick.height) {
              brick.hits--;
              if (brick.hits <= 0) {
                setScore(s => s + 100);
                newBricks.splice(i, 1);
              } else {
                setScore(s => s + 50);
              }
              newVy = -newVy;
              break;
            }
          }
          return newBricks;
        });

        return { x: newX, y: newY, vx: newVx, vy: newVy };
      });
    }, 16);
    return () => clearInterval(gameLoop);
  }, [gameState, paddle, keys]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw bricks
    bricks.forEach(brick => {
      ctx.fillStyle = brick.color;
      ctx.shadowColor = brick.color;
      ctx.shadowBlur = 5;
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
      
      if (brick.hits > 1) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(brick.hits.toString(), brick.x + brick.width/2, brick.y + brick.height/2 + 4);
      }
      ctx.shadowBlur = 0;
    });

    // Draw paddle
    ctx.fillStyle = '#0aff9d';
    ctx.shadowColor = '#0aff9d';
    ctx.shadowBlur = 10;
    ctx.fillRect(paddle.x, 560, paddle.width, 20);
    ctx.shadowBlur = 0;

    // Draw ball
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Bricks: ${bricks.length}`, 20, 55);

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ff0000';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  });

  const handlePause = () => setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  const handleReset = () => {
    setScore(0);
    setBall({ x: 400, y: 400, vx: 4, vy: -4 });
    setPaddle({ x: 350, width: 100 });
    const newBricks = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 10; col++) {
        const colors = ['#ff0099', '#7000ff', '#0aff9d', '#ffff00', '#ff6600'];
        newBricks.push({
          x: col * 80, y: row * 30 + 50, width: 75, height: 25,
          hits: Math.floor(row / 2) + 1, color: colors[Math.floor(row / 2)]
        });
      }
    }
    setBricks(newBricks);
    setGameState('playing');
  };

  return (
    <GameLayout gameTitle="DX-Ball 3 (Web Version)" gameCategory="Arcade" score={score} isPlaying={gameState === 'playing'} onPause={handlePause} onReset={handleReset}>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="relative">
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="border border-neon-blue/50 rounded-lg bg-black/20 backdrop-blur-sm shadow-2xl max-w-full h-auto" style={{ touchAction: 'none' }} />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>A/D or Arrow keys to move paddle • Break all the bricks!</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default DxBall3Web;
