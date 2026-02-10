import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  brightness: number;
  twinkle: number;
  size: number;
}

interface Meteor {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  trail: Array<{x: number, y: number, alpha: number}>;
}

interface Galaxy {
  x: number;
  y: number;
  rotation: number;
  size: number;
  arms: Array<{angle: number, radius: number, stars: number}>;
}

interface Nebula {
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  rotation: number;
}

const MeteorGalaxy3D = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });
  const starsRef = useRef<Star[]>([]);
  const meteorsRef = useRef<Meteor[]>([]);
  const galaxiesRef = useRef<Galaxy[]>([]);
  const nebulaeRef = useRef<Nebula[]>([]);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize stars
    const initialStars: Star[] = [];
    for (let i = 0; i < 800; i++) {
      initialStars.push({
        x: (Math.random() - 0.5) * 3000,
        y: (Math.random() - 0.5) * 3000,
        z: Math.random() * 1500,
        brightness: Math.random(),
        twinkle: Math.random() * Math.PI * 2,
        size: Math.random() * 2 + 0.5
      });
    }

    // Initialize meteors
    const initialMeteors: Meteor[] = [];
    for (let i = 0; i < 6; i++) {
      initialMeteors.push({
        x: Math.random() * canvas.width - 200,
        y: Math.random() * canvas.height - 200,
        z: Math.random() * 400 + 100,
        vx: (Math.random() - 0.5) * 15,
        vy: Math.random() * 12 + 3,
        vz: (Math.random() - 0.5) * 8,
        life: 0,
        maxLife: Math.random() * 80 + 40,
        size: Math.random() * 2.5 + 1.5,
        trail: []
      });
    }

    // Initialize galaxies
    const initialGalaxies: Galaxy[] = [];
    for (let i = 0; i < 2; i++) {
      const arms = [];
      for (let j = 0; j < 3; j++) {
        arms.push({
          angle: (j * Math.PI * 2) / 3,
          radius: Math.random() * 150 + 80,
          stars: Math.floor(Math.random() * 40) + 20
        });
      }
      
      initialGalaxies.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        rotation: 0,
        size: Math.random() * 120 + 80,
        arms
      });
    }

    // Initialize nebulae
    const initialNebulae: Nebula[] = [];
    const nebulaColors = ['#ff0040', '#8000ff', '#0080ff', '#40ff80'];
    for (let i = 0; i < 3; i++) {
      initialNebulae.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 250 + 150,
        color: nebulaColors[Math.floor(Math.random() * nebulaColors.length)],
        opacity: Math.random() * 0.25 + 0.1,
        rotation: Math.random() * Math.PI * 2
      });
    }

    starsRef.current = initialStars;
    meteorsRef.current = initialMeteors;
    galaxiesRef.current = initialGalaxies;
    nebulaeRef.current = initialNebulae;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Create meteor shower at click position
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const speed = Math.random() * 15 + 8;
        meteorsRef.current.push({
          x: mouseX,
          y: mouseY,
          z: Math.random() * 200 + 50,
          vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 6,
          vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 6,
          vz: (Math.random() - 0.5) * 10,
          life: 0,
          maxLife: Math.random() * 60 + 30,
          size: Math.random() * 3 + 2,
          trail: []
        });
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, []);

  const project3D = (x: number, y: number, z: number, canvas: HTMLCanvasElement) => {
    const perspective = 800;
    const scale = perspective / (perspective + z);
    return {
      x: canvas.width / 2 + (x - canvas.width / 2) * scale,
      y: canvas.height / 2 + (y - canvas.height / 2) * scale,
      scale
    };
  };

  const drawGalaxy = (ctx: CanvasRenderingContext2D, galaxy: Galaxy, canvas: HTMLCanvasElement) => {
    ctx.save();
    ctx.translate(galaxy.x, galaxy.y);
    ctx.rotate(galaxy.rotation);

    // Draw galaxy core
    const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, galaxy.size * 0.25);
    coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    coreGradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.4)');
    coreGradient.addColorStop(1, 'rgba(255, 100, 50, 0.1)');
    
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(0, 0, galaxy.size * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Draw spiral arms
    galaxy.arms.forEach((arm) => {
      for (let i = 0; i < arm.stars; i++) {
        const spiralAngle = arm.angle + (i / arm.stars) * Math.PI * 3;
        const radius = (i / arm.stars) * arm.radius;
        const x = Math.cos(spiralAngle) * radius;
        const y = Math.sin(spiralAngle) * radius;
        
        const starBrightness = Math.max(0.1, 1 - (i / arm.stars));
        ctx.fillStyle = `rgba(120, 180, 255, ${starBrightness * 0.6})`;
        ctx.beginPath();
        ctx.arc(x, y, 0.8 + starBrightness * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.restore();
  };

  const drawNebula = (ctx: CanvasRenderingContext2D, nebula: Nebula) => {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.translate(nebula.x, nebula.y);
    ctx.rotate(nebula.rotation);

    // Create nebula gradient
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, nebula.size);
    const hexColor = nebula.color;
    const opacity = Math.max(0.05, Math.min(0.4, nebula.opacity));
    
    gradient.addColorStop(0, `${hexColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(0.6, `${hexColor}${Math.floor(opacity * 0.3 * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, nebula.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    timeRef.current += 0.016;

    // Clear canvas with deep space gradient
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
    );
    gradient.addColorStop(0, 'rgba(8, 8, 25, 1)');
    gradient.addColorStop(0.7, 'rgba(15, 8, 35, 1)');
    gradient.addColorStop(1, 'rgba(5, 5, 15, 1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw nebulae
    nebulaeRef.current.forEach(nebula => {
      nebula.rotation += 0.001;
      nebula.opacity += Math.sin(timeRef.current + nebula.x * 0.01) * 0.0005;
      drawNebula(ctx, nebula);
    });

    // Update and draw galaxies
    galaxiesRef.current.forEach(galaxy => {
      galaxy.rotation += 0.003;
      drawGalaxy(ctx, galaxy, canvas);
    });

    // Update and draw stars
    starsRef.current.forEach(star => {
      star.twinkle += 0.04;
      star.brightness = Math.max(0.1, Math.min(1, star.brightness + Math.sin(star.twinkle) * 0.015));
      
      const projected = project3D(star.x, star.y, star.z, canvas);
      
      if (projected.x >= -10 && projected.x <= canvas.width + 10 && 
          projected.y >= -10 && projected.y <= canvas.height + 10) {
        
        const alpha = star.brightness * projected.scale * 0.8;
        const size = star.size * projected.scale;
        
        if (alpha > 0.1 && size > 0.3) {
          ctx.save();
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = size * 1.5;
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    });

    // Update and draw meteors
    meteorsRef.current = meteorsRef.current.filter(meteor => {
      // Add current position to trail
      meteor.trail.push({
        x: meteor.x,
        y: meteor.y,
        alpha: 1 - (meteor.life / meteor.maxLife)
      });
      
      // Keep trail length manageable
      if (meteor.trail.length > 15) {
        meteor.trail.shift();
      }

      // Update position
      meteor.x += meteor.vx;
      meteor.y += meteor.vy;
      meteor.z += meteor.vz;
      meteor.life++;

      // Gravity effect
      meteor.vy += 0.15;

      // Wrap around screen
      if (meteor.x < -50) meteor.x = canvas.width + 50;
      if (meteor.x > canvas.width + 50) meteor.x = -50;
      if (meteor.y > canvas.height + 50) {
        meteor.y = -50;
        meteor.x = Math.random() * canvas.width;
        meteor.vx = (Math.random() - 0.5) * 8;
        meteor.vy = Math.random() * 4 + 2;
      }

      const projected = project3D(meteor.x, meteor.y, meteor.z, canvas);
      const alpha = Math.max(0, 1 - (meteor.life / meteor.maxLife));
      
      // Draw trail
      if (meteor.trail.length > 1 && alpha > 0.1) {
        ctx.strokeStyle = `rgba(255, 80, 40, ${alpha * 0.6})`;
        ctx.lineWidth = meteor.size * projected.scale * 0.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        
        let started = false;
        meteor.trail.forEach((point) => {
          if (!started) {
            ctx.moveTo(point.x, point.y);
            started = true;
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        
        ctx.stroke();
      }

      // Draw meteor head
      if (alpha > 0.1) {
        ctx.save();
        ctx.shadowColor = '#ff8800';
        ctx.shadowBlur = 12 * projected.scale;
        
        const coreGradient = ctx.createRadialGradient(
          projected.x, projected.y, 0,
          projected.x, projected.y, meteor.size * projected.scale * 2.5
        );
        coreGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        coreGradient.addColorStop(0.3, `rgba(255, 180, 80, ${alpha * 0.8})`);
        coreGradient.addColorStop(0.7, `rgba(255, 80, 40, ${alpha * 0.5})`);
        coreGradient.addColorStop(1, 'rgba(255, 40, 0, 0)');
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(projected.x, projected.y, meteor.size * projected.scale * 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }

      return meteor.life < meteor.maxLife;
    });

    // Spawn new meteors occasionally
    if (Math.random() < 0.015 && meteorsRef.current.length < 15) {
      meteorsRef.current.push({
        x: Math.random() * canvas.width,
        y: -50,
        z: Math.random() * 400 + 50,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 6 + 2,
        vz: (Math.random() - 0.5) * 4,
        life: 0,
        maxLife: Math.random() * 100 + 60,
        size: Math.random() * 2.5 + 1,
        trail: []
      });
    }

    // Draw pulsing cosmic energy around mouse
    const mouseDistance = 80;
    for (let i = 0; i < 6; i++) {
      const angle = (timeRef.current * 1.5 + i * Math.PI / 3) % (Math.PI * 2);
      const radius = mouseDistance + Math.sin(timeRef.current * 2.5 + i) * 15;
      const x = mouseRef.current.x + Math.cos(angle) * radius;
      const y = mouseRef.current.y + Math.sin(angle) * radius;
      
      ctx.save();
      ctx.shadowColor = '#00ccff';
      ctx.shadowBlur = 15;
      ctx.fillStyle = `rgba(0, 200, 255, 0.6)`;
      ctx.globalCompositeOperation = 'screen';
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-auto cursor-crosshair"
      style={{ zIndex: -1 }}
    />
  );
};

export default MeteorGalaxy3D;
