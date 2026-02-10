import React, { useEffect, useRef, useState } from 'react';
import GameLayout from '@/components/GameLayout';
import { SafeKeyHandler, getSafeCanvasContext, SafeGameLoop } from '@/utils/gameUtils';

type Cone = { x: number; y: number; angle: number; fov: number; range: number };

const ShadowBotProtocol: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<'playing' | 'caught' | 'escaped'>('playing');
  const [score, setScore] = useState(0);
  const keysRef = useRef<SafeKeyHandler>();
  const loopRef = useRef<SafeGameLoop>();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = getSafeCanvasContext(canvas);
    if (!canvas || !ctx) return;
    const W = 800, H = 500; canvas.width = W; canvas.height = H;

    const bot = { x: 80, y: H - 80, vx: 0, vy: 0, speed: 3, r: 10 };
    const goal = { x: W - 80, y: 80, r: 14 };
    const cones: Cone[] = [
      { x: 200, y: 220, angle: 0.3, fov: 0.8, range: 160 },
      { x: 420, y: 120, angle: 1.7, fov: 0.9, range: 200 },
      { x: 600, y: 320, angle: -1.0, fov: 0.7, range: 170 }
    ];

    keysRef.current = new SafeKeyHandler();
    const keys = keysRef.current;

    const seeBot = (c: Cone) => {
      const dx = bot.x - c.x; const dy = bot.y - c.y;
      const dist2 = dx*dx + dy*dy;
      if (dist2 > c.range * c.range) return false;
      const angle = Math.atan2(dy, dx);
      const delta = Math.atan2(Math.sin(angle - c.angle), Math.cos(angle - c.angle));
      return Math.abs(delta) < c.fov;
    };

    const loop = () => {
      if (status !== 'playing') return;
      // patrol
      cones[0].angle += 0.01; cones[1].angle -= 0.008; cones[2].angle += 0.006;

      // input
      let ax = 0, ay = 0;
      if (keys.isPressed('arrowleft') || keys.isPressed('a')) ax -= 1;
      if (keys.isPressed('arrowright') || keys.isPressed('d')) ax += 1;
      if (keys.isPressed('arrowup') || keys.isPressed('w')) ay -= 1;
      if (keys.isPressed('arrowdown') || keys.isPressed('s')) ay += 1;
      const len = Math.hypot(ax, ay) || 1;
      bot.vx = (ax/len) * bot.speed;
      bot.vy = (ay/len) * bot.speed;
      bot.x = Math.max(20, Math.min(W-20, bot.x + bot.vx));
      bot.y = Math.max(20, Math.min(H-20, bot.y + bot.vy));

      // detection
      if (cones.some(seeBot)) {
        setStatus('caught');
        loopRef.current?.stop();
      }

      // goal
      if (Math.hypot(bot.x - goal.x, bot.y - goal.y) < bot.r + goal.r) {
        setStatus('escaped');
        setScore(s => s + 1000);
        loopRef.current?.stop();
      }

      // draw
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle = '#05070d'; ctx.fillRect(0,0,W,H);

      // shadows and cones
      cones.forEach(c => {
        const grd = ctx.createRadialGradient(c.x, c.y, 8, c.x, c.y, c.range);
        grd.addColorStop(0, 'rgba(0,255,200,0.25)');
        grd.addColorStop(1, 'rgba(0,255,200,0)');
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.angle);
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.arc(0,0,c.range,-c.fov, c.fov);
        ctx.closePath();
        ctx.fillStyle = grd;
        ctx.fill();
        ctx.restore();
      });

      // goal
      ctx.beginPath();
      ctx.arc(goal.x, goal.y, goal.r, 0, Math.PI*2);
      ctx.fillStyle = '#7c3aed';
      ctx.shadowColor = '#7c3aed';
      ctx.shadowBlur = 18; ctx.fill(); ctx.shadowBlur = 0;

      // bot
      ctx.beginPath();
      ctx.arc(bot.x, bot.y, bot.r, 0, Math.PI*2);
      ctx.fillStyle = '#e6fff9'; ctx.fill();
    };

    loopRef.current = new SafeGameLoop(loop);
    loopRef.current.start();

    return () => { loopRef.current?.stop(); keysRef.current?.cleanup(); };
  }, [status]);

  return (
    <GameLayout gameTitle="Shadow Bot Protocol" gameCategory="Puzzle" score={score} isPlaying={status==='playing'} onReset={() => window.location.reload()}>
      <div className="w-full flex justify-center p-4">
        <canvas ref={canvasRef} className="max-w-full border border-purple-400/30 rounded-lg bg-black" />
      </div>
      {status !== 'playing' && (
        <div className="text-center text-white py-4">
          {status === 'caught' ? 'Detected by security. Press Reset to try again.' : 'Extraction complete!'}
        </div>
      )}
    </GameLayout>
  );
};

export default ShadowBotProtocol;
