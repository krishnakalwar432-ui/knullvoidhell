import React, { useRef, useEffect } from 'react';

const NebulaStorm: React.FC<{ performanceMode?: boolean; reducedMotion?: boolean }> = ({ performanceMode, reducedMotion }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const count = performanceMode ? 60 : 150;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      size: Math.random() * 3 + 0.5,
      color: ['#ec4899', '#06b6d4', '#f472b6', '#22d3ee', '#a855f7'][Math.floor(Math.random() * 5)],
      opacity: Math.random() * 0.7 + 0.2,
      pulse: Math.random() * Math.PI * 2,
    }));

    // Electric arcs
    const arcs: { x1: number; y1: number; x2: number; y2: number; life: number; color: string }[] = [];

    let time = 0;

    const draw = () => {
      if (reducedMotion) {
        ctx.fillStyle = '#05000a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity * 0.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        return;
      }

      time += 0.01;
      ctx.fillStyle = 'rgba(5,0,10,0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Nebula clouds
      for (let i = 0; i < 3; i++) {
        const nx = canvas.width * (0.3 + i * 0.2) + Math.sin(time * 0.5 + i) * 50;
        const ny = canvas.height * (0.3 + i * 0.15) + Math.cos(time * 0.3 + i) * 40;
        const grd = ctx.createRadialGradient(nx, ny, 0, nx, ny, 250 + Math.sin(time + i) * 50);
        const colors = i % 2 === 0
          ? ['rgba(236,72,153,0.06)', 'rgba(236,72,153,0.02)', 'rgba(0,0,0,0)']
          : ['rgba(6,182,212,0.06)', 'rgba(6,182,212,0.02)', 'rgba(0,0,0,0)'];
        grd.addColorStop(0, colors[0]);
        grd.addColorStop(0.5, colors[1]);
        grd.addColorStop(1, colors[2]);
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.05;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const glow = 0.5 + Math.sin(p.pulse) * 0.3;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity * glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = p.opacity * glow * 0.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Spawn electric arcs occasionally
      if (Math.random() < 0.02 && arcs.length < 5) {
        const p1 = particles[Math.floor(Math.random() * particles.length)];
        const p2 = particles[Math.floor(Math.random() * particles.length)];
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        if (dist < 200) {
          arcs.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, life: 15, color: Math.random() > 0.5 ? '#22d3ee' : '#f472b6' });
        }
      }

      // Draw arcs
      for (let i = arcs.length - 1; i >= 0; i--) {
        const a = arcs[i];
        a.life--;
        if (a.life <= 0) { arcs.splice(i, 1); continue; }
        ctx.strokeStyle = a.color;
        ctx.globalAlpha = a.life / 15;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x1, a.y1);
        const mid = 3;
        let cx = a.x1, cy = a.y1;
        for (let j = 0; j < mid; j++) {
          const t = (j + 1) / (mid + 1);
          cx = a.x1 + (a.x2 - a.x1) * t + (Math.random() - 0.5) * 30;
          cy = a.y1 + (a.y2 - a.y1) * t + (Math.random() - 0.5) * 30;
          ctx.lineTo(cx, cy);
        }
        ctx.lineTo(a.x2, a.y2);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    if (reducedMotion) { draw(); } else { rafRef.current = requestAnimationFrame(draw); }

    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', resize); };
  }, [performanceMode, reducedMotion]);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full -z-10" />;
};

export default NebulaStorm;
