import React, { useRef, useEffect } from 'react';

const CosmicMidnight: React.FC<{ performanceMode?: boolean; reducedMotion?: boolean }> = ({ performanceMode, reducedMotion }) => {
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

    const starCount = performanceMode ? 80 : 200;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.03 + 0.01,
      color: Math.random() > 0.3 ? '#fbbf24' : '#14b8a6',
      opacity: Math.random() * 0.7 + 0.3,
    }));

    // Constellation connections
    const constellations: { from: number; to: number }[] = [];
    if (!performanceMode) {
      for (let i = 0; i < Math.min(starCount, 40); i++) {
        for (let j = i + 1; j < Math.min(starCount, 40); j++) {
          const dist = Math.hypot(stars[i].x - stars[j].x, stars[i].y - stars[j].y);
          if (dist < 120 && constellations.length < 50) {
            constellations.push({ from: i, to: j });
          }
        }
      }
    }

    // Shooting stars
    const shootingStars: { x: number; y: number; vx: number; vy: number; life: number; trail: { x: number; y: number }[] }[] = [];

    let time = 0;

    const draw = () => {
      if (reducedMotion) {
        ctx.fillStyle = '#020a08';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
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

      time += 0.008;
      ctx.fillStyle = 'rgba(2,10,8,0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ambient teal glow
      const grd = ctx.createRadialGradient(canvas.width * 0.3, canvas.height * 0.4, 0, canvas.width * 0.3, canvas.height * 0.4, 400);
      grd.addColorStop(0, 'rgba(20,184,166,0.04)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const grd2 = ctx.createRadialGradient(canvas.width * 0.7, canvas.height * 0.6, 0, canvas.width * 0.7, canvas.height * 0.6, 350);
      grd2.addColorStop(0, 'rgba(251,191,36,0.03)');
      grd2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Constellation lines
      constellations.forEach(c => {
        const s1 = stars[c.from];
        const s2 = stars[c.to];
        ctx.strokeStyle = '#fbbf24';
        ctx.globalAlpha = 0.06 + Math.sin(time + c.from) * 0.03;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(s1.x, s1.y);
        ctx.lineTo(s2.x, s2.y);
        ctx.stroke();
      });

      // Stars with twinkle
      stars.forEach(s => {
        s.twinkle += s.twinkleSpeed;
        const brightness = 0.4 + Math.sin(s.twinkle) * 0.4;

        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.opacity * brightness;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();

        // Star glow
        if (s.size > 1.5) {
          ctx.globalAlpha = s.opacity * brightness * 0.15;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Shooting stars
      if (Math.random() < 0.005 && shootingStars.length < 3) {
        shootingStars.push({
          x: Math.random() * canvas.width,
          y: 0,
          vx: (Math.random() - 0.3) * 8,
          vy: Math.random() * 5 + 3,
          life: 60,
          trail: [],
        });
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.trail.push({ x: ss.x, y: ss.y });
        if (ss.trail.length > 15) ss.trail.shift();
        ss.x += ss.vx;
        ss.y += ss.vy;
        ss.life--;

        if (ss.life <= 0) { shootingStars.splice(i, 1); continue; }

        // Draw trail
        for (let t = 0; t < ss.trail.length; t++) {
          const alpha = (t / ss.trail.length) * (ss.life / 60);
          ctx.fillStyle = '#fde68a';
          ctx.globalAlpha = alpha * 0.6;
          ctx.beginPath();
          ctx.arc(ss.trail[t].x, ss.trail[t].y, 1.5 * (t / ss.trail.length), 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#fde68a';
        ctx.globalAlpha = ss.life / 60;
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    if (reducedMotion) { draw(); } else { rafRef.current = requestAnimationFrame(draw); }
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', resize); };
  }, [performanceMode, reducedMotion]);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full -z-10" />;
};

export default CosmicMidnight;
