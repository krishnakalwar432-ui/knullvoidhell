import React, { useRef, useEffect } from 'react';

const QuantumFrost: React.FC<{ performanceMode?: boolean; reducedMotion?: boolean }> = ({ performanceMode, reducedMotion }) => {
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

    const count = performanceMode ? 50 : 130;
    // Crystals / geometric shards
    const crystals = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 4 + 1,
      angle: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.01,
      drift: { x: (Math.random() - 0.5) * 0.3, y: (Math.random() - 0.5) * 0.3 },
      opacity: Math.random() * 0.6 + 0.2,
      color: ['#38bdf8', '#818cf8', '#7dd3fc', '#e0f2fe', '#a5b4fc'][Math.floor(Math.random() * 5)],
      sides: Math.floor(Math.random() * 3) + 4, // 4-6 sided
    }));

    // Geometric grid lines
    const gridLines: { x: number; y: number; len: number; angle: number; opacity: number }[] = [];
    if (!performanceMode) {
      for (let i = 0; i < 15; i++) {
        gridLines.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          len: Math.random() * 200 + 50,
          angle: (Math.floor(Math.random() * 6) / 6) * Math.PI,
          opacity: Math.random() * 0.15 + 0.02,
        });
      }
    }

    let time = 0;

    const drawPolygon = (cx: number, cy: number, r: number, sides: number, angle: number) => {
      ctx.beginPath();
      for (let i = 0; i <= sides; i++) {
        const a = (i / sides) * Math.PI * 2 + angle;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    const draw = () => {
      if (reducedMotion) {
        ctx.fillStyle = '#000510';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        crystals.forEach(c => {
          ctx.fillStyle = c.color;
          ctx.globalAlpha = c.opacity * 0.3;
          drawPolygon(c.x, c.y, c.size, c.sides, c.angle);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        return;
      }

      time += 0.005;
      ctx.fillStyle = 'rgba(0,5,16,0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle radial ice glow
      const grd = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.height * 0.6);
      grd.addColorStop(0, 'rgba(56,189,248,0.04)');
      grd.addColorStop(0.5, 'rgba(129,140,248,0.02)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Geometric grid
      gridLines.forEach(l => {
        ctx.strokeStyle = '#38bdf8';
        ctx.globalAlpha = l.opacity * (0.5 + Math.sin(time + l.x * 0.01) * 0.3);
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(l.x, l.y);
        ctx.lineTo(l.x + Math.cos(l.angle) * l.len, l.y + Math.sin(l.angle) * l.len);
        ctx.stroke();
      });

      // Crystals
      crystals.forEach(c => {
        c.x += c.drift.x;
        c.y += c.drift.y;
        c.angle += c.rotSpeed;

        if (c.x < -20) c.x = canvas.width + 20;
        if (c.x > canvas.width + 20) c.x = -20;
        if (c.y < -20) c.y = canvas.height + 20;
        if (c.y > canvas.height + 20) c.y = -20;

        const flicker = 0.6 + Math.sin(time * 3 + c.angle * 10) * 0.3;

        // Crystal body
        ctx.fillStyle = c.color;
        ctx.globalAlpha = c.opacity * flicker * 0.4;
        drawPolygon(c.x, c.y, c.size, c.sides, c.angle);
        ctx.fill();

        // Crystal outline glow
        ctx.strokeStyle = c.color;
        ctx.globalAlpha = c.opacity * flicker * 0.6;
        ctx.lineWidth = 0.5;
        drawPolygon(c.x, c.y, c.size * 1.5, c.sides, c.angle);
        ctx.stroke();

        // Light refraction dot
        ctx.fillStyle = '#e0f2fe';
        ctx.globalAlpha = c.opacity * flicker * 0.8;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size * 0.3, 0, Math.PI * 2);
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

export default QuantumFrost;
