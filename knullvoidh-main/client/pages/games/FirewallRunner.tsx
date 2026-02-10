import React, { useEffect, useRef, useState } from 'react';
import GameLayout from '@/components/GameLayout';
import { SafeKeyHandler, getSafeCanvasContext, SafeGameLoop } from '@/utils/gameUtils';

interface Ob { x:number; y:number; lane:number }

const FirewallRunner: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const keysRef = useRef<SafeKeyHandler>();
  const loopRef = useRef<SafeGameLoop>();

  useEffect(() => {
    const canvas = canvasRef.current; const ctx = getSafeCanvasContext(canvas);
    if (!canvas || !ctx) return; const W=600,H=500; canvas.width=W; canvas.height=H;

    const lanesX = [W*0.25, W*0.5, W*0.75];
    let lane = 1; let y = H - 90; let speed = 5; let frame = 0;
    const obs: Ob[] = [];

    keysRef.current = new SafeKeyHandler(); const keys = keysRef.current;

    const loop = () => {
      frame++;
      if (keys.isPressed('arrowleft') || keys.isPressed('a')) lane = Math.max(0, lane-1);
      if (keys.isPressed('arrowright') || keys.isPressed('d')) lane = Math.min(2, lane+1);

      if (frame % 40 === 0) {
        obs.push({ lane: Math.floor(Math.random()*3), x: 0, y: -40 });
      }

      for (let i = obs.length-1; i>=0; i--) {
        const o = obs[i]; o.y += speed;
        if (o.y > H+40) obs.splice(i,1);
        // collision
        if (o.lane === lane && Math.abs(o.y - y) < 36) { setIsPlaying(false); loopRef.current?.stop(); }
      }

      if (frame % 5 === 0) setScore(s => s + 1);

      // draw
      ctx.clearRect(0,0,W,H); ctx.fillStyle = '#06121a'; ctx.fillRect(0,0,W,H);
      // grid
      for (let i=0;i<15;i++) {
        ctx.strokeStyle = 'rgba(0,255,127,0.15)'; ctx.beginPath();
        ctx.moveTo(0, i*40 + (frame%40)); ctx.lineTo(W, i*40 + (frame%40)); ctx.stroke();
      }
      // lanes
      lanesX.forEach(x => { ctx.strokeStyle='rgba(0,255,200,0.2)'; ctx.setLineDash([10,16]); ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); });
      ctx.setLineDash([]);
      // player packet
      ctx.fillStyle = '#00ff7f'; ctx.shadowColor = '#00ff7f'; ctx.shadowBlur = 16;
      ctx.fillRect(lanesX[lane]-18, y-18, 36, 36); ctx.shadowBlur = 0;
      // obstacles firewalls
      obs.forEach(o => { ctx.fillStyle = '#ff0066'; ctx.shadowColor='#ff0066'; ctx.shadowBlur=14; ctx.fillRect(lanesX[o.lane]-22, o.y-12, 44, 24); ctx.shadowBlur=0; });
    };

    loopRef.current = new SafeGameLoop(loop);
    loopRef.current.start();
    return () => { loopRef.current?.stop(); keysRef.current?.cleanup(); };
  }, []);

  return (
    <GameLayout gameTitle="Firewall Runner: Code Escape" gameCategory="Runner" score={score} isPlaying={isPlaying} onReset={() => window.location.reload()}>
      <div className="w-full flex justify-center p-4">
        <canvas ref={canvasRef} className="max-w-full border border-emerald-400/30 rounded-lg bg-black" />
      </div>
    </GameLayout>
  );
};

export default FirewallRunner;
