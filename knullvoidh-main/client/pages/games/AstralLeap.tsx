import React, { useEffect, useRef, useState } from 'react';
import GameLayout from '@/components/GameLayout';
import { SafeKeyHandler, getSafeCanvasContext, SafeGameLoop } from '@/utils/gameUtils';

interface Planet { x:number; y:number; r:number }

const AstralLeap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shards, setShards] = useState(0);
  const keysRef = useRef<SafeKeyHandler>();
  const loopRef = useRef<SafeGameLoop>();

  useEffect(() => {
    const canvas = canvasRef.current; const ctx = getSafeCanvasContext(canvas);
    if (!canvas || !ctx) return; const W=800,H=500; canvas.width=W; canvas.height=H;

    const planets: Planet[] = [
      { x: 160, y: 260, r: 44 },
      { x: 360, y: 140, r: 36 },
      { x: 560, y: 300, r: 52 },
      { x: 720, y: 120, r: 28 }
    ];

    const shardsPos = [
      { x: 200, y: 180, c: false },
      { x: 430, y: 230, c: false },
      { x: 620, y: 180, c: false }
    ];

    const player = { x: planets[0].x + planets[0].r + 10, y: planets[0].y, vx: 0, vy: -1.5 };
    keysRef.current = new SafeKeyHandler(); const keys = keysRef.current;

    const loop = () => {
      // gravity from nearest planet
      let nearest = planets[0]; let minD = Infinity;
      for (const p of planets) {
        const d = Math.hypot(player.x - p.x, player.y - p.y) - p.r;
        if (d < minD) { minD = d; nearest = p; }
      }
      const dx = nearest.x - player.x; const dy = nearest.y - player.y;
      const dist = Math.hypot(dx, dy) || 1; const g = 400 / (dist*dist);
      player.vx += (dx / dist) * g; player.vy += (dy / dist) * g;

      // jump impulse
      if (keys.isPressed('space')) {
        const ux = -(dx / dist), uy = -(dy / dist);
        player.vx += ux * 0.6; player.vy += uy * 0.6;
      }

      // update
      player.x += player.vx; player.y += player.vy;

      // collect shards
      shardsPos.forEach(s => {
        if (!s.c && Math.hypot(player.x - s.x, player.y - s.y) < 12) { s.c = true; setShards(v => v + 1); }
      });

      // draw
      ctx.clearRect(0,0,W,H); ctx.fillStyle = '#050b12'; ctx.fillRect(0,0,W,H);
      // planets
      planets.forEach(p => {
        const grd = ctx.createRadialGradient(p.x-10, p.y-10, p.r*0.3, p.x, p.y, p.r);
        grd.addColorStop(0, '#80eaff'); grd.addColorStop(1, '#004466');
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fillStyle = grd; ctx.fill();
      });
      // shards
      shardsPos.forEach(s => {
        if (s.c) return; ctx.beginPath(); ctx.arc(s.x, s.y, 6, 0, Math.PI*2);
        ctx.fillStyle = '#9be7ff'; ctx.shadowColor = '#9be7ff'; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
      });
      // player
      ctx.beginPath(); ctx.arc(player.x, player.y, 6, 0, Math.PI*2);
      ctx.fillStyle = '#00ffd0'; ctx.shadowColor = '#00ffd0'; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0;
    };

    loopRef.current = new SafeGameLoop(loop);
    loopRef.current.start();
    return () => { loopRef.current?.stop(); keysRef.current?.cleanup(); };
  }, []);

  return (
    <GameLayout gameTitle="Astral Leap" gameCategory="Platform" score={shards}>
      <div className="w-full flex justify-center p-4">
        <canvas ref={canvasRef} className="max-w-full border border-cyan-400/30 rounded-lg bg-black" />
      </div>
      <div className="text-center text-cyan-300">Press SPACE to impulse jump between planets.</div>
    </GameLayout>
  );
};

export default AstralLeap;
