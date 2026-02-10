import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  brightness: number;
  size: number;
  color: string;
  twinkle: number;
}

interface GalaxyArm {
  stars: Star[];
  angle: number;
  radius: number;
  armIndex: number;
}

interface Planet {
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  orbitRadius: number;
  orbitSpeed: number;
  orbitAngle: number;
}

interface Nebula {
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  opacity: number;
  rotation: number;
  type: 'circular' | 'spiral' | 'cloud';
}

const MilkyWayGalaxy3D = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });
  const galaxyArmsRef = useRef<GalaxyArm[]>([]);
  const coreStarsRef = useRef<Star[]>([]);
  const planetsRef = useRef<Planet[]>([]);
  const nebulaeRef = useRef<Nebula[]>([]);
  const timeRef = useRef(0);
  const galaxyRotationRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize Milky Way galaxy structure
    const initializeGalaxy = () => {
      const arms: GalaxyArm[] = [];
      const numArms = 4;
      const starsPerArm = 800;
      
      // Create spiral arms
      for (let armIndex = 0; armIndex < numArms; armIndex++) {
        const armStars: Star[] = [];
        const baseAngle = (armIndex * Math.PI * 2) / numArms;
        
        for (let i = 0; i < starsPerArm; i++) {
          const progress = i / starsPerArm;
          const spiralTightness = 2.5;
          const angle = baseAngle + progress * Math.PI * spiralTightness;
          const radius = 50 + progress * 400 + (Math.random() - 0.5) * 80;
          
          const x = Math.cos(angle) * radius;
          const y = (Math.random() - 0.5) * 40 * (1 - progress * 0.7); // Flatter toward edges
          const z = Math.sin(angle) * radius;
          
          const distanceFromCenter = Math.sqrt(x*x + y*y + z*z);
          const starBrightness = Math.max(0.1, 1 - (distanceFromCenter / 500));
          
          const starColors = ['#ffffff', '#ffffcc', '#ffccaa', '#aaccff', '#ccaaff'];
          const colorIndex = Math.floor(Math.random() * starColors.length);
          
          armStars.push({
            x: x + canvas.width / 2,
            y: y + canvas.height / 2,
            z: z + 200,
            brightness: starBrightness * (0.3 + Math.random() * 0.7),
            size: Math.random() * 2 + 0.5,
            color: starColors[colorIndex],
            twinkle: Math.random() * Math.PI * 2
          });
        }
        
        arms.push({
          stars: armStars,
          angle: baseAngle,
          radius: 400,
          armIndex
        });
      }
      
      // Create galactic core (bright center)
      const coreStars: Star[] = [];
      for (let i = 0; i < 300; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 60;
        const height = (Math.random() - 0.5) * 20;
        
        coreStars.push({
          x: Math.cos(angle) * radius + canvas.width / 2,
          y: height + canvas.height / 2,
          z: Math.sin(angle) * radius + 200,
          brightness: 0.8 + Math.random() * 0.2,
          size: Math.random() * 3 + 1,
          color: '#ffffaa',
          twinkle: Math.random() * Math.PI * 2
        });
      }
      
      // Create planets
      const planets: Planet[] = [];
      for (let i = 0; i < 12; i++) {
        const orbitRadius = 100 + Math.random() * 200;
        const planetColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#6c5ce7'];
        
        planets.push({
          x: canvas.width / 2,
          y: canvas.height / 2,
          z: 200,
          size: Math.random() * 8 + 3,
          color: planetColors[Math.floor(Math.random() * planetColors.length)],
          orbitRadius,
          orbitSpeed: 0.001 + Math.random() * 0.003,
          orbitAngle: Math.random() * Math.PI * 2
        });
      }
      
      // Create nebulae
      const nebulae: Nebula[] = [];
      const nebulaColors = ['#ff6b9d', '#4ecdc4', '#45b7d1', '#6c5ce7', '#a55eea', '#26de81'];
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 150 + Math.random() * 250;
        
        nebulae.push({
          x: Math.cos(angle) * radius + canvas.width / 2,
          y: (Math.random() - 0.5) * 100 + canvas.height / 2,
          z: Math.sin(angle) * radius + 200,
          size: 80 + Math.random() * 120,
          color: nebulaColors[Math.floor(Math.random() * nebulaColors.length)],
          opacity: 0.15 + Math.random() * 0.2,
          rotation: Math.random() * Math.PI * 2,
          type: ['circular', 'spiral', 'cloud'][Math.floor(Math.random() * 3)] as any
        });
      }
      
      galaxyArmsRef.current = arms;
      coreStarsRef.current = coreStars;
      planetsRef.current = planets;
      nebulaeRef.current = nebulae;
    };

    initializeGalaxy();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const handleClick = (e: MouseEvent) => {
      // Create supernova explosion effect
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Add burst of new stars at click position
      for (let i = 0; i < 50; i++) {
        const angle = (Math.PI * 2 * i) / 50;
        const speed = Math.random() * 8 + 5;
        const newStar: Star = {
          x: mouseX + Math.cos(angle) * speed * 5,
          y: mouseY + Math.sin(angle) * speed * 5,
          z: 150 + Math.random() * 100,
          brightness: 1,
          size: Math.random() * 4 + 2,
          color: '#ffffff',
          twinkle: Math.random() * Math.PI * 2
        };
        
        coreStarsRef.current.push(newStar);
      }
      
      // Remove excess stars to prevent memory issues
      if (coreStarsRef.current.length > 500) {
        coreStarsRef.current = coreStarsRef.current.slice(-400);
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
      x: x * scale + (canvas.width / 2) * (1 - scale),
      y: y * scale + (canvas.height / 2) * (1 - scale),
      scale: Math.max(0.1, scale)
    };
  };

  const rotatePoint = (x: number, y: number, z: number, centerX: number, centerY: number, centerZ: number, rotation: number) => {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    
    const dx = x - centerX;
    const dz = z - centerZ;
    
    return {
      x: centerX + dx * cos - dz * sin,
      y: y,
      z: centerZ + dx * sin + dz * cos
    };
  };

  const drawNebula = (ctx: CanvasRenderingContext2D, nebula: Nebula, canvas: HTMLCanvasElement) => {
    const rotated = rotatePoint(nebula.x, nebula.y, nebula.z, canvas.width / 2, canvas.height / 2, 200, galaxyRotationRef.current);
    const projected = project3D(rotated.x, rotated.y, rotated.z, canvas);
    
    if (projected.scale < 0.1) return;
    
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.translate(projected.x, projected.y);
    ctx.rotate(nebula.rotation);
    ctx.globalAlpha = nebula.opacity * projected.scale;
    
    const size = nebula.size * projected.scale;
    
    if (nebula.type === 'spiral') {
      // Spiral nebula
      for (let i = 0; i < 3; i++) {
        const spiral = ctx.createRadialGradient(0, 0, 0, 0, 0, size * (1 + i * 0.3));
        spiral.addColorStop(0, nebula.color + '80');
        spiral.addColorStop(0.5, nebula.color + '40');
        spiral.addColorStop(1, 'transparent');
        
        ctx.fillStyle = spiral;
        ctx.fillRect(-size, -size, size * 2, size * 2);
      }
    } else if (nebula.type === 'cloud') {
      // Cloud nebula with multiple overlapping circles
      for (let i = 0; i < 5; i++) {
        const offsetX = (Math.random() - 0.5) * size * 0.5;
        const offsetY = (Math.random() - 0.5) * size * 0.5;
        const cloudSize = size * (0.6 + Math.random() * 0.4);
        
        const gradient = ctx.createRadialGradient(offsetX, offsetY, 0, offsetX, offsetY, cloudSize);
        gradient.addColorStop(0, nebula.color + '60');
        gradient.addColorStop(0.7, nebula.color + '20');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(offsetX, offsetY, cloudSize, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Circular nebula
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
      gradient.addColorStop(0, nebula.color + '60');
      gradient.addColorStop(0.4, nebula.color + '30');
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  };

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    timeRef.current += 0.016;
    galaxyRotationRef.current += 0.002; // Slow galaxy rotation

    // Clear canvas with deep space background
    const bgGradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
    );
    bgGradient.addColorStop(0, '#0a0a2e');
    bgGradient.addColorStop(0.5, '#1a1a3e');
    bgGradient.addColorStop(1, '#000010');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw distant stars (background)
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 200; i++) {
      const x = (i * 123 + timeRef.current * 10) % canvas.width;
      const y = (i * 456 + timeRef.current * 5) % canvas.height;
      const brightness = Math.sin(timeRef.current * 2 + i) * 0.3 + 0.7;
      ctx.globalAlpha = brightness * 0.6;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;

    // Draw nebulae
    nebulaeRef.current.forEach(nebula => {
      nebula.rotation += 0.001;
      nebula.opacity += Math.sin(timeRef.current + nebula.x * 0.01) * 0.001;
      drawNebula(ctx, nebula, canvas);
    });

    // Draw galaxy arms
    galaxyArmsRef.current.forEach(arm => {
      arm.stars.forEach(star => {
        star.twinkle += 0.03;
        star.brightness = Math.max(0.1, Math.min(1, star.brightness + Math.sin(star.twinkle) * 0.02));
        
        const rotated = rotatePoint(star.x, star.y, star.z, canvas.width / 2, canvas.height / 2, 200, galaxyRotationRef.current);
        const projected = project3D(rotated.x, rotated.y, rotated.z, canvas);
        
        if (projected.scale > 0.1 && projected.x >= -10 && projected.x <= canvas.width + 10 && 
            projected.y >= -10 && projected.y <= canvas.height + 10) {
          
          const alpha = star.brightness * projected.scale;
          const size = star.size * projected.scale;
          
          if (alpha > 0.1 && size > 0.3) {
            ctx.save();
            ctx.shadowColor = star.color;
            ctx.shadowBlur = size * 2;
            ctx.fillStyle = star.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      });
    });

    // Draw galactic core
    coreStarsRef.current.forEach((star, index) => {
      star.twinkle += 0.05;
      star.brightness = Math.max(0.3, Math.min(1, star.brightness + Math.sin(star.twinkle) * 0.03));
      
      const rotated = rotatePoint(star.x, star.y, star.z, canvas.width / 2, canvas.height / 2, 200, galaxyRotationRef.current);
      const projected = project3D(rotated.x, rotated.y, rotated.z, canvas);
      
      if (projected.scale > 0.1) {
        const alpha = star.brightness * projected.scale;
        const size = star.size * projected.scale;
        
        ctx.save();
        ctx.shadowColor = star.color;
        ctx.shadowBlur = size * 3;
        ctx.fillStyle = star.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      
      // Fade out explosion stars
      if (index >= 300) {
        star.brightness *= 0.995;
        if (star.brightness < 0.1) {
          coreStarsRef.current.splice(index, 1);
        }
      }
    });

    // Draw planets
    planetsRef.current.forEach(planet => {
      planet.orbitAngle += planet.orbitSpeed;
      
      const orbitX = Math.cos(planet.orbitAngle) * planet.orbitRadius;
      const orbitZ = Math.sin(planet.orbitAngle) * planet.orbitRadius;
      
      const rotated = rotatePoint(
        planet.x + orbitX, 
        planet.y + Math.sin(planet.orbitAngle * 2) * 10, 
        planet.z + orbitZ, 
        canvas.width / 2, 
        canvas.height / 2, 
        200, 
        galaxyRotationRef.current
      );
      const projected = project3D(rotated.x, rotated.y, rotated.z, canvas);
      
      if (projected.scale > 0.1) {
        const size = planet.size * projected.scale;
        
        ctx.save();
        ctx.shadowColor = planet.color;
        ctx.shadowBlur = size * 2;
        ctx.fillStyle = planet.color;
        ctx.globalAlpha = 0.8 * projected.scale;
        ctx.beginPath();
        ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Planet highlight
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.3 * projected.scale;
        ctx.beginPath();
        ctx.arc(projected.x - size * 0.3, projected.y - size * 0.3, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    // Draw gravitational lensing effect around mouse
    const mouseDistance = 120;
    for (let i = 0; i < 12; i++) {
      const angle = (timeRef.current + i * Math.PI / 6) % (Math.PI * 2);
      const radius = mouseDistance + Math.sin(timeRef.current * 2 + i) * 20;
      const x = mouseRef.current.x + Math.cos(angle) * radius;
      const y = mouseRef.current.y + Math.sin(angle) * radius;
      
      ctx.save();
      ctx.shadowColor = '#4ecdc4';
      ctx.shadowBlur = 25;
      ctx.fillStyle = 'rgba(78, 205, 196, 0.6)';
      ctx.globalCompositeOperation = 'screen';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw galactic center black hole effect
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    for (let i = 0; i < 8; i++) {
      const angle = timeRef.current * 3 + i * Math.PI / 4;
      const radius = 30 + Math.sin(timeRef.current * 4 + i) * 10;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      ctx.save();
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 20;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.globalCompositeOperation = 'screen';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
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

export default MilkyWayGalaxy3D;
