import { useEffect, useRef, useState, useCallback } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  brightness: number;
  color: string;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}

interface Nebula {
  x: number;
  y: number;
  size: number;
  rotation: number;
  color: string;
  opacity: number;
}

const EnhancedCosmicBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const starsRef = useRef<Star[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const nebulaeRef = useRef<Nebula[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);

  // Performance-optimized star colors
  const starColors = [
    '#ffffff', '#fffbf0', '#fff8e7', '#ffcc6f', '#ffd2a1',
    '#ff7f50', '#87ceeb', '#b0c4de', '#ffa07a', '#98fb98'
  ];

  const nebulaColors = [
    'rgba(138, 43, 226, 0.3)', 'rgba(75, 0, 130, 0.3)', 'rgba(72, 61, 139, 0.3)',
    'rgba(147, 0, 211, 0.3)', 'rgba(128, 0, 128, 0.3)', 'rgba(186, 85, 211, 0.3)'
  ];

  // Initialize cosmic elements
  const initializeStars = useCallback((width: number, height: number) => {
    const stars: Star[] = [];
    for (let i = 0; i < 400; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 1000,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.8 + 0.2,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
    starsRef.current = stars;
  }, []);

  const initializeNebulae = useCallback((width: number, height: number) => {
    const nebulae: Nebula[] = [];
    for (let i = 0; i < 6; i++) {
      nebulae.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 300 + 200,
        rotation: Math.random() * Math.PI * 2,
        color: nebulaColors[Math.floor(Math.random() * nebulaColors.length)],
        opacity: Math.random() * 0.4 + 0.1
      });
    }
    nebulaeRef.current = nebulae;
  }, []);

  const createParticle = useCallback((x: number, y: number) => {
    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 180,
      maxLife: 180,
      size: Math.random() * 3 + 1,
      color: starColors[Math.floor(Math.random() * starColors.length)],
      alpha: 1
    };
  }, []);

  const updateAndRender = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    timeRef.current += 0.016; // ~60fps

    // Clear with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000011');
    gradient.addColorStop(0.3, '#000033');
    gradient.addColorStop(0.6, '#001122');
    gradient.addColorStop(1, '#000000');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw nebulae with rotation
    nebulaeRef.current.forEach(nebula => {
      ctx.save();
      ctx.translate(nebula.x, nebula.y);
      ctx.rotate(nebula.rotation + timeRef.current * 0.001);
      
      const nebulaGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, nebula.size);
      nebulaGradient.addColorStop(0, nebula.color);
      nebulaGradient.addColorStop(0.5, nebula.color.replace('0.3', '0.1'));
      nebulaGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = nebulaGradient;
      ctx.globalAlpha = nebula.opacity * (0.8 + 0.2 * Math.sin(timeRef.current * 0.5));
      ctx.fillRect(-nebula.size, -nebula.size, nebula.size * 2, nebula.size * 2);
      ctx.restore();
    });

    // Draw stars with twinkling and parallax
    ctx.globalAlpha = 1;
    starsRef.current.forEach(star => {
      const parallaxX = star.x + (mouseRef.current.x - canvas.width / 2) * (star.z / 1000) * 0.1;
      const parallaxY = star.y + (mouseRef.current.y - canvas.height / 2) * (star.z / 1000) * 0.1;
      
      // Twinkling effect
      star.twinklePhase += star.twinkleSpeed;
      const twinkle = Math.sin(star.twinklePhase) * 0.3 + 0.7;
      const currentBrightness = star.brightness * twinkle;
      
      // Size based on depth
      const depth = 1 - star.z / 1000;
      const currentSize = star.size * depth * (0.5 + currentBrightness * 0.5);
      
      ctx.fillStyle = star.color;
      ctx.globalAlpha = currentBrightness * depth;
      ctx.beginPath();
      ctx.arc(parallaxX, parallaxY, currentSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Add glow for brighter stars
      if (currentBrightness > 0.8 && currentSize > 1) {
        ctx.shadowColor = star.color;
        ctx.shadowBlur = currentSize * 2;
        ctx.beginPath();
        ctx.arc(parallaxX, parallaxY, currentSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // Update and draw particles
    ctx.globalAlpha = 1;
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      particle.alpha = particle.life / particle.maxLife;
      
      if (particle.life <= 0) return false;
      
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.alpha * 0.6;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      
      return true;
    });

    // Add shooting stars occasionally
    if (Math.random() < 0.002) {
      const shootingStar = {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.5,
        vx: Math.random() * 10 + 5,
        vy: Math.random() * 5 + 2,
        life: 60,
        maxLife: 60,
        size: 2,
        color: '#ffffff',
        alpha: 1
      };
      particlesRef.current.push(shootingStar);
    }

    ctx.globalAlpha = 1;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  }, []);

  const handleClick = useCallback((e: MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Create burst of particles on click
      for (let i = 0; i < 8; i++) {
        particlesRef.current.push(createParticle(x, y));
      }
    }
  }, [createParticle]);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    
    setDimensions({ width: rect.width, height: rect.height });
    initializeStars(rect.width, rect.height);
    initializeNebulae(rect.width, rect.height);
  }, [initializeStars, initializeNebulae]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    const animate = () => {
      updateAndRender();
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [handleResize, handleMouseMove, handleClick, updateAndRender]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10"
      style={{
        background: 'linear-gradient(45deg, #000011 0%, #000033 30%, #001122 60%, #000000 100%)',
      }}
    />
  );
};

export default EnhancedCosmicBackground;
