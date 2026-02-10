import { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'particle' | 'wave' | 'energy' | 'portal';
}

interface FloatingGeometry {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  vx: number;
  vy: number;
  vz: number;
  type: 'cube' | 'pyramid' | 'sphere' | 'diamond';
  color: string;
  scale: number;
}

const Interactive3DBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [geometries, setGeometries] = useState<FloatingGeometry[]>([]);
  const timeRef = useRef(0);

  const colors = ['#ff0099', '#7000ff', '#0aff9d', '#00ffff', '#ff6600', '#ffff00'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize particles
    const initialParticles: Particle[] = [];
    for (let i = 0; i < 150; i++) {
      initialParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 1000,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        vz: (Math.random() - 0.5) * 3,
        life: Math.random() * 1000,
        maxLife: 1000,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 3 + 1,
        type: Math.random() < 0.8 ? 'particle' : 
              Math.random() < 0.6 ? 'wave' : 
              Math.random() < 0.8 ? 'energy' : 'portal'
      });
    }

    // Initialize floating geometries
    const initialGeometries: FloatingGeometry[] = [];
    for (let i = 0; i < 12; i++) {
      initialGeometries.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 500 + 100,
        rx: Math.random() * Math.PI * 2,
        ry: Math.random() * Math.PI * 2,
        rz: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1,
        vz: (Math.random() - 0.5) * 2,
        type: ['cube', 'pyramid', 'sphere', 'diamond'][Math.floor(Math.random() * 4)] as any,
        color: colors[Math.floor(Math.random() * colors.length)],
        scale: Math.random() * 40 + 20
      });
    }

    setParticles(initialParticles);
    setGeometries(initialGeometries);

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

      // Create explosion effect at click position
      const newParticles: Particle[] = [];
      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        const speed = Math.random() * 10 + 5;
        newParticles.push({
          x: mouseX,
          y: mouseY,
          z: Math.random() * 200 + 100,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          vz: (Math.random() - 0.5) * 10,
          life: 0,
          maxLife: 100,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 4 + 2,
          type: 'energy'
        });
      }

      setParticles(prev => [...prev, ...newParticles]);
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

  const drawGeometry = (ctx: CanvasRenderingContext2D, geometry: FloatingGeometry, canvas: HTMLCanvasElement) => {
    const projected = project3D(geometry.x, geometry.y, geometry.z, canvas);
    const size = geometry.scale * projected.scale;

    ctx.save();
    ctx.translate(projected.x, projected.y);
    ctx.globalAlpha = Math.max(0.1, projected.scale);

    // Add glow effect
    ctx.shadowColor = geometry.color;
    ctx.shadowBlur = 20 * projected.scale;

    switch (geometry.type) {
      case 'cube':
        ctx.strokeStyle = geometry.color;
        ctx.lineWidth = 2 * projected.scale;
        ctx.strokeRect(-size/2, -size/2, size, size);
        
        // 3D effect
        ctx.beginPath();
        ctx.moveTo(-size/2, -size/2);
        ctx.lineTo(-size/2 + size*0.3, -size/2 - size*0.3);
        ctx.lineTo(size/2 + size*0.3, -size/2 - size*0.3);
        ctx.lineTo(size/2, -size/2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(size/2, -size/2);
        ctx.lineTo(size/2 + size*0.3, -size/2 - size*0.3);
        ctx.lineTo(size/2 + size*0.3, size/2 - size*0.3);
        ctx.lineTo(size/2, size/2);
        ctx.stroke();
        break;

      case 'pyramid':
        ctx.strokeStyle = geometry.color;
        ctx.lineWidth = 2 * projected.scale;
        ctx.beginPath();
        ctx.moveTo(0, -size/2);
        ctx.lineTo(-size/2, size/2);
        ctx.lineTo(size/2, size/2);
        ctx.closePath();
        ctx.stroke();
        
        // 3D lines
        ctx.beginPath();
        ctx.moveTo(0, -size/2);
        ctx.lineTo(size*0.3, -size*0.3);
        ctx.moveTo(-size/2, size/2);
        ctx.lineTo(-size*0.2, size*0.8);
        ctx.moveTo(size/2, size/2);
        ctx.lineTo(size*0.8, size*0.8);
        ctx.stroke();
        break;

      case 'sphere':
        ctx.strokeStyle = geometry.color;
        ctx.lineWidth = 2 * projected.scale;
        ctx.beginPath();
        ctx.arc(0, 0, size/2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner circles for 3D effect
        ctx.beginPath();
        ctx.arc(0, 0, size/3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, 0, size/2, size/4, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 'diamond':
        ctx.strokeStyle = geometry.color;
        ctx.lineWidth = 2 * projected.scale;
        ctx.beginPath();
        ctx.moveTo(0, -size/2);
        ctx.lineTo(size/2, 0);
        ctx.lineTo(0, size/2);
        ctx.lineTo(-size/2, 0);
        ctx.closePath();
        ctx.stroke();
        
        // Inner diamond
        ctx.beginPath();
        ctx.moveTo(0, -size/3);
        ctx.lineTo(size/3, 0);
        ctx.lineTo(0, size/3);
        ctx.lineTo(-size/3, 0);
        ctx.closePath();
        ctx.stroke();
        break;
    }

    ctx.restore();
  };

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    timeRef.current += 0.016;

    // Clear canvas with cosmic gradient
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
    );
    gradient.addColorStop(0, 'rgba(10, 10, 40, 0.95)');
    gradient.addColorStop(0.5, 'rgba(20, 10, 60, 0.9)');
    gradient.addColorStop(1, 'rgba(0, 0, 20, 0.95)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw constellation lines
    ctx.strokeStyle = 'rgba(112, 0, 255, 0.3)';
    ctx.lineWidth = 1;
    particles.forEach((p1, i) => {
      particles.slice(i + 1, i + 4).forEach(p2 => {
        const distance = Math.sqrt(
          Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
        );
        if (distance < 150) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });
    });

    // Update and draw particles
    setParticles(prev => {
      const updated = prev.map(particle => {
        const newParticle = { ...particle };
        
        // Mouse attraction
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 200) {
          const force = (200 - distance) / 200 * 0.5;
          newParticle.vx += (dx / distance) * force;
          newParticle.vy += (dy / distance) * force;
        }

        // Update position
        newParticle.x += newParticle.vx;
        newParticle.y += newParticle.vy;
        newParticle.z += newParticle.vz;
        newParticle.life++;

        // Wrap around screen
        if (newParticle.x < 0) newParticle.x = canvas.width;
        if (newParticle.x > canvas.width) newParticle.x = 0;
        if (newParticle.y < 0) newParticle.y = canvas.height;
        if (newParticle.y > canvas.height) newParticle.y = 0;
        if (newParticle.z < 0) newParticle.z = 1000;
        if (newParticle.z > 1000) newParticle.z = 0;

        // Fade particles
        newParticle.vx *= 0.99;
        newParticle.vy *= 0.99;

        return newParticle;
      }).filter(p => p.life < p.maxLife);

      // Draw particles
      updated.forEach(particle => {
        const alpha = 1 - (particle.life / particle.maxLife);
        const projected = project3D(particle.x, particle.y, particle.z, canvas);
        
        ctx.save();
        ctx.globalAlpha = alpha * projected.scale;

        if (particle.type === 'wave') {
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(projected.x, projected.y, particle.size * 3 * projected.scale, 0, Math.PI * 2);
          ctx.stroke();
        } else if (particle.type === 'energy') {
          ctx.shadowColor = particle.color;
          ctx.shadowBlur = 15;
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(projected.x, projected.y, particle.size * projected.scale, 0, Math.PI * 2);
          ctx.fill();
        } else if (particle.type === 'portal') {
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = 3;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(projected.x, projected.y, (particle.size + i * 2) * projected.scale, 0, Math.PI * 2);
            ctx.stroke();
          }
        } else {
          ctx.shadowColor = particle.color;
          ctx.shadowBlur = 10;
          ctx.fillStyle = particle.color;
          ctx.fillRect(
            projected.x - particle.size * projected.scale / 2,
            projected.y - particle.size * projected.scale / 2,
            particle.size * projected.scale,
            particle.size * projected.scale
          );
        }

        ctx.restore();
      });

      return updated;
    });

    // Update and draw floating geometries
    setGeometries(prev => {
      const updated = prev.map(geometry => {
        const newGeometry = { ...geometry };
        
        newGeometry.x += newGeometry.vx;
        newGeometry.y += newGeometry.vy;
        newGeometry.z += newGeometry.vz;
        
        newGeometry.rx += 0.01;
        newGeometry.ry += 0.015;
        newGeometry.rz += 0.008;

        // Wrap around
        if (newGeometry.x < -100) newGeometry.x = canvas.width + 100;
        if (newGeometry.x > canvas.width + 100) newGeometry.x = -100;
        if (newGeometry.y < -100) newGeometry.y = canvas.height + 100;
        if (newGeometry.y > canvas.height + 100) newGeometry.y = -100;
        if (newGeometry.z < -200) newGeometry.z = 700;
        if (newGeometry.z > 700) newGeometry.z = -200;

        return newGeometry;
      });

      // Draw geometries
      updated.forEach(geometry => {
        drawGeometry(ctx, geometry, canvas);
      });

      return updated;
    });

    // Draw central energy vortex
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    for (let i = 0; i < 8; i++) {
      const angle = (timeRef.current * 2 + i * Math.PI / 4) % (Math.PI * 2);
      const radius = 100 + Math.sin(timeRef.current * 3 + i) * 30;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      ctx.shadowColor = colors[i % colors.length];
      ctx.shadowBlur = 20;
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();

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

export default Interactive3DBackground;
