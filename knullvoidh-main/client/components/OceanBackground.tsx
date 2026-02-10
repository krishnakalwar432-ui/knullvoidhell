import React, { useEffect, useRef } from 'react';

interface OceanBackgroundProps {
  className?: string;
  intensity?: 'light' | 'medium' | 'strong';
  theme?: 'ocean' | 'forest' | 'river' | 'coral';
}

const OceanBackground: React.FC<OceanBackgroundProps> = ({ 
  className = '', 
  intensity = 'medium',
  theme = 'ocean'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Theme colors
    const themes = {
      ocean: {
        gradient: ['#001122', '#002244', '#003366', '#004488'],
        accent: 'rgba(0, 150, 255, 0.3)',
        bubble: 'rgba(100, 200, 255, 0.6)',
        fish: 'rgba(255, 150, 50, 0.8)'
      },
      forest: {
        gradient: ['#0a1a0a', '#1a3a1a', '#2a5a2a', '#3a7a3a'],
        accent: 'rgba(50, 255, 50, 0.3)',
        bubble: 'rgba(150, 255, 150, 0.6)',
        fish: 'rgba(255, 255, 100, 0.8)'
      },
      river: {
        gradient: ['#001a1a', '#003333', '#004d4d', '#006666'],
        accent: 'rgba(0, 200, 200, 0.3)',
        bubble: 'rgba(100, 255, 255, 0.6)',
        fish: 'rgba(255, 100, 150, 0.8)'
      },
      coral: {
        gradient: ['#2a1a0a', '#4a3a2a', '#6a5a4a', '#8a7a6a'],
        accent: 'rgba(255, 100, 150, 0.3)',
        bubble: 'rgba(255, 200, 100, 0.6)',
        fish: 'rgba(100, 255, 200, 0.8)'
      }
    };

    const currentTheme = themes[theme];
    
    // Water particles
    interface WaterParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      type: 'bubble' | 'plant' | 'fish';
    }

    const particles: WaterParticle[] = [];
    const maxParticles = intensity === 'light' ? 15 : intensity === 'medium' ? 30 : 50;

    // Initialize particles
    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 8 + 2,
        opacity: Math.random() * 0.6 + 0.2,
        type: Math.random() < 0.6 ? 'bubble' : Math.random() < 0.8 ? 'plant' : 'fish'
      });
    }

    let time = 0;

    const animate = () => {
      time += 0.01;
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      currentTheme.gradient.forEach((color, index) => {
        gradient.addColorStop(index / (currentTheme.gradient.length - 1), color);
      });
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw water waves
      ctx.strokeStyle = currentTheme.accent;
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.globalAlpha = 0.1 + i * 0.05;
        for (let x = 0; x <= canvas.width; x += 10) {
          const y = Math.sin((x + time * 50 + i * 100) * 0.01) * 20 + 
                   Math.sin((x + time * 30 + i * 50) * 0.02) * 10 + 
                   canvas.height * (0.2 + i * 0.15);
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Update and draw particles
      particles.forEach(particle => {
        // Update position with wave motion
        particle.x += particle.vx + Math.sin(time + particle.y * 0.01) * 0.2;
        particle.y += particle.vy + Math.cos(time + particle.x * 0.01) * 0.1;

        // Wrap around screen
        if (particle.x > canvas.width + 20) particle.x = -20;
        if (particle.x < -20) particle.x = canvas.width + 20;
        if (particle.y > canvas.height + 20) particle.y = -20;
        if (particle.y < -20) particle.y = canvas.height + 20;

        // Draw particle based on type
        ctx.globalAlpha = particle.opacity;
        
        if (particle.type === 'bubble') {
          ctx.fillStyle = currentTheme.bubble;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          
          // Add shine effect
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.beginPath();
          ctx.arc(particle.x - particle.size * 0.3, particle.y - particle.size * 0.3, particle.size * 0.3, 0, Math.PI * 2);
          ctx.fill();
        } else if (particle.type === 'plant') {
          ctx.strokeStyle = 'rgba(50, 150, 50, 0.6)';
          ctx.lineWidth = particle.size * 0.2;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          const swayX = Math.sin(time + particle.y * 0.05) * particle.size;
          ctx.quadraticCurveTo(
            particle.x + swayX * 0.5, 
            particle.y - particle.size, 
            particle.x + swayX, 
            particle.y - particle.size * 2
          );
          ctx.stroke();
        } else if (particle.type === 'fish') {
          ctx.fillStyle = currentTheme.fish;
          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.rotate(particle.vx > 0 ? 0 : Math.PI);
          
          // Fish body
          ctx.beginPath();
          ctx.ellipse(0, 0, particle.size, particle.size * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Fish tail
          ctx.beginPath();
          ctx.moveTo(-particle.size, 0);
          ctx.lineTo(-particle.size * 1.5, -particle.size * 0.5);
          ctx.lineTo(-particle.size * 1.5, particle.size * 0.5);
          ctx.closePath();
          ctx.fill();
          
          ctx.restore();
        }
      });

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateSize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [intensity, theme]);

  return (
    <canvas 
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: -1 }}
    />
  );
};

export default OceanBackground;
