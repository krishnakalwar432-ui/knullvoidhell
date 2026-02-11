import React, { useRef, useEffect } from 'react';

const SolarFlare: React.FC<{ performanceMode?: boolean; reducedMotion?: boolean }> = ({ performanceMode, reducedMotion }) => {
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

    const emberCount = performanceMode ? 40 : 120;
    const embers = Array.from({ length: emberCount }, () => ({
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -(Math.random() * 1.5 + 0.5),
      size: Math.random() * 3 + 1,
      color: ['#f97316', '#ef4444', '#fbbf24', '#dc2626', '#fde68a'][Math.floor(Math.random() * 5)],
      opacity: Math.random() * 0.8 + 0.2,
      life: Math.random() * 200 + 100,
    }));

    let time = 0;

    const draw = () => {
      if (reducedMotion) {
        ctx.fillStyle = '#0a0200';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const grd = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.8, 0, canvas.width * 0.5, canvas.height * 0.8, canvas.height * 0.6);
        grd.addColorStop(0, 'rgba(249,115,22,0.12)');
        grd.addColorStop(0.5, 'rgba(239,68,68,0.05)');
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
      }

      time += 0.008;
      ctx.fillStyle = 'rgba(10,2,0,0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Solar corona at bottom
      const sunX = canvas.width * 0.5;
      const sunY = canvas.height * 1.1;
      const sunR = canvas.height * 0.5;
      const pulse = 1 + Math.sin(time * 2) * 0.05;

      const corona = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * pulse);
      corona.addColorStop(0, 'rgba(251,191,36,0.1)');
      corona.addColorStop(0.3, 'rgba(249,115,22,0.06)');
      corona.addColorStop(0.6, 'rgba(239,68,68,0.03)');
      corona.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = corona;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Solar flare rays
      ctx.save();
      ctx.translate(sunX, sunY);
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + time * 0.2;
        const len = 200 + Math.sin(time * 3 + i * 2) * 80;
        const grd = ctx.createLinearGradient(0, 0, Math.cos(angle) * len, Math.sin(angle) * len);
        grd.addColorStop(0, 'rgba(249,115,22,0.08)');
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.strokeStyle = grd;
        ctx.lineWidth = 3 + Math.sin(time * 2 + i) * 2;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
        ctx.stroke();
      }
      ctx.restore();

      // Embers rising
      embers.forEach(e => {
        e.x += e.vx + Math.sin(time * 2 + e.y * 0.01) * 0.3;
        e.y += e.vy;
        e.life--;

        if (e.life <= 0 || e.y < -10) {
          e.x = Math.random() * canvas.width;
          e.y = canvas.height + Math.random() * 50;
          e.life = Math.random() * 200 + 100;
          e.opacity = Math.random() * 0.8 + 0.2;
        }

        const fade = Math.min(1, e.life / 50);
        ctx.fillStyle = e.color;
        ctx.globalAlpha = e.opacity * fade;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = e.opacity * fade * 0.25;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size * 3, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    if (reducedMotion) { draw(); } else { rafRef.current = requestAnimationFrame(draw); }
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', resize); };
  }, [performanceMode, reducedMotion]);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full -z-10" />;
};

export default SolarFlare;
