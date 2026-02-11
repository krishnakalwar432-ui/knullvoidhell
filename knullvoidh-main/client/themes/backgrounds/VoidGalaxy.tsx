import React, { useRef, useEffect } from 'react';

const VoidGalaxy: React.FC<{ performanceMode?: boolean; reducedMotion?: boolean }> = ({ performanceMode, reducedMotion }) => {
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

    const starCount = performanceMode ? 60 : 180;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.3,
      speed: Math.random() * 0.3 + 0.05,
      angle: Math.random() * Math.PI * 2,
      dist: Math.random() * Math.max(canvas.width, canvas.height) * 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      color: ['#a855f7', '#7c3aed', '#c084fc', '#581c87', '#e9d5ff'][Math.floor(Math.random() * 5)],
    }));

    const debris = Array.from({ length: performanceMode ? 8 : 25 }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist: Math.random() * 300 + 100,
      speed: (Math.random() - 0.5) * 0.002,
      size: Math.random() * 4 + 2,
      opacity: Math.random() * 0.4 + 0.1,
    }));

    let time = 0;
    const cx = () => canvas.width / 2;
    const cy = () => canvas.height / 2;

    const draw = () => {
      if (reducedMotion) {
        ctx.fillStyle = '#050008';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Static stars
        stars.forEach(s => {
          ctx.fillStyle = s.color;
          ctx.globalAlpha = s.opacity * 0.5;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        return;
      }

      time += 0.005;
      ctx.fillStyle = 'rgba(5,0,8,0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Spiral galaxy core glow
      const grd = ctx.createRadialGradient(cx(), cy(), 0, cx(), cy(), 300);
      grd.addColorStop(0, 'rgba(168,85,247,0.08)');
      grd.addColorStop(0.4, 'rgba(124,58,237,0.04)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars orbiting in spiral
      stars.forEach(s => {
        s.angle += s.speed * 0.01;
        const spiralFactor = s.dist + Math.sin(s.angle * 3 + time) * 30;
        const px = cx() + Math.cos(s.angle + time * 0.1) * spiralFactor;
        const py = cy() + Math.sin(s.angle + time * 0.1) * spiralFactor * 0.6;

        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.opacity * (0.5 + Math.sin(time * 2 + s.angle) * 0.3);
        ctx.beginPath();
        ctx.arc(px, py, s.size, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        ctx.globalAlpha = s.opacity * 0.15;
        ctx.beginPath();
        ctx.arc(px, py, s.size * 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Floating debris
      debris.forEach(d => {
        d.angle += d.speed;
        const dx = cx() + Math.cos(d.angle + time * 0.3) * d.dist;
        const dy = cy() + Math.sin(d.angle + time * 0.3) * d.dist * 0.5;
        ctx.fillStyle = '#7c3aed';
        ctx.globalAlpha = d.opacity * (0.5 + Math.sin(time + d.angle) * 0.3);
        ctx.fillRect(dx - d.size / 2, dy - d.size / 2, d.size, d.size);
      });

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    if (reducedMotion) {
      draw();
    } else {
      rafRef.current = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [performanceMode, reducedMotion]);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full -z-10" />;
};

export default VoidGalaxy;
