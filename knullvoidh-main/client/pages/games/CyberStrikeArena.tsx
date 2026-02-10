import React, { useEffect, useRef, useState } from 'react';
import GameLayout from '@/components/GameLayout';
import { SafeKeyHandler, getSafeCanvasContext, SafeGameLoop } from '@/utils/gameUtils';

interface Enemy { x:number; y:number; r:number; vx:number; vy:number; hp:number }
interface Bullet { x:number; y:number; vx:number; vy:number }

const CyberStrikeArena: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const loopRef = useRef<SafeGameLoop>();
  const keysRef = useRef<SafeKeyHandler>();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = getSafeCanvasContext(canvas);
    if (!canvas || !ctx) return;
    const W = 800, H = 500; canvas.width = W; canvas.height = H;

    const player = { x: W/2, y: H/2, r: 12, speed: 3 };
    const enemies: Enemy[] = [];
    const bullets: Bullet[] = [];
    let frame = 0;

    keysRef.current = new SafeKeyHandler();
    const keys = keysRef.current;

    const spawnEnemy = () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 320;
      const x = player.x + Math.cos(angle) * dist;
      const y = player.y + Math.sin(angle) * dist;
      const vx = (player.x - x) * 0.005;
      const vy = (player.y - y) * 0.005;
      enemies.push({ x, y, r: 12, vx, vy, hp: 3 });
    };

    const shoot = () => {
      const dirX = (mouse.x - player.x);
      const dirY = (mouse.y - player.y);
      const len = Math.hypot(dirX, dirY) || 1;
      bullets.push({ x: player.x, y: player.y, vx: (dirX/len)*8, vy: (dirY/len)*8 });
    };

    const mouse = { x: W/2, y: H/2 };
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    const loop = () => {
      frame++;
      if (frame % 90 === 0 && enemies.length < 15) spawnEnemy();

      // controls
      let ax=0, ay=0;
      if (keys.isPressed('w')) ay -= 1;
      if (keys.isPressed('s')) ay += 1;
      if (keys.isPressed('a')) ax -= 1;
      if (keys.isPressed('d')) ax += 1;
      const len = Math.hypot(ax, ay) || 1;
      player.x = Math.max(20, Math.min(W-20, player.x + (ax/len) * player.speed));
      player.y = Math.max(20, Math.min(H-20, player.y + (ay/len) * player.speed));

      if (frame % 12 === 0) shoot(); // auto-fire

      // update bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i]; b.x += b.vx; b.y += b.vy;
        if (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) bullets.splice(i, 1);
      }

      // update enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.x += e.vx; e.y += e.vy;
        // track player
        e.vx += (player.x - e.x) * 0.0006;
        e.vy += (player.y - e.y) * 0.0006;

        // collision with player
        if (Math.hypot(e.x - player.x, e.y - player.y) < e.r + player.r) {
          setIsPlaying(false);
          loopRef.current?.stop();
        }
      }

      // bullet hits
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        for (let j = bullets.length - 1; j >= 0; j--) {
          const b = bullets[j];
          if (Math.hypot(e.x - b.x, e.y - b.y) < e.r + 3) {
            bullets.splice(j, 1);
            e.hp -= 1;
            if (e.hp <= 0) { enemies.splice(i, 1); setScore(s => s + 50); }
            break;
          }
        }
      }

      // draw
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle = '#070b12'; ctx.fillRect(0,0,W,H);

      // player
      ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI*2);
      ctx.fillStyle = '#00ffea'; ctx.shadowColor = '#00ffea'; ctx.shadowBlur = 15; ctx.fill(); ctx.shadowBlur = 0;

      // enemies
      enemies.forEach(e => {
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI*2);
        ctx.fillStyle = '#ff0088'; ctx.shadowColor = '#ff0088'; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
      });

      // bullets
      ctx.fillStyle = '#a3f7ff';
      bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI*2); ctx.fill(); });
    };

    loopRef.current = new SafeGameLoop(loop);
    loopRef.current.start();

    return () => { loopRef.current?.stop(); keysRef.current?.cleanup(); };
  }, []);

  return (
    <GameLayout gameTitle="Cyber Strike Arena" gameCategory="Shooter" score={score} isPlaying={isPlaying} onReset={() => window.location.reload()}>
      <div className="w-full flex justify-center p-4">
        <canvas ref={canvasRef} className="max-w-full border border-pink-400/30 rounded-lg bg-black" />
      </div>
    </GameLayout>
  );
};

export default CyberStrikeArena;
