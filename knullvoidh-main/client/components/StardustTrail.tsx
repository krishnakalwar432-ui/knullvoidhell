import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/themes/ThemeProvider';

interface StardustTrailProps {
  targetId?: string;
  maxParticles?: number;
  enabled?: boolean;
  className?: string;
}

type Theme = 'void' | 'nebula' | 'solar' | 'frost' | 'cosmic' | string;

class StardustEffect {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  particles: any[] = [];
  maxParticles: number;
  rafId: number | null = null;
  theme: Theme;
  lastMouseX: number = 0;
  lastMouseY: number = 0;
  mouseMoveHandler: ((e: MouseEvent) => void) | null = null;

  constructor(canvas: HTMLCanvasElement, theme: Theme = 'void', maxParticles: number = 50) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context not available');
    this.ctx = ctx;
    this.theme = theme;
    this.maxParticles = maxParticles;
    this.resizeCanvas();
    this.setupMouseTracking();
    this.animate = this.animate.bind(this);
    this.animate();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const parent = this.canvas.parentElement;
    if (parent) {
      const rect = parent.getBoundingClientRect();
      this.canvas.width = Math.max(1, Math.round(rect.width));
      this.canvas.height = Math.max(1, Math.round(rect.height));
    }
  }

  setupMouseTracking() {
    this.mouseMoveHandler = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      this.lastMouseX = e.clientX - rect.left;
      this.lastMouseY = e.clientY - rect.top;
      this.addParticle(this.lastMouseX, this.lastMouseY);
    };
    document.addEventListener('mousemove', this.mouseMoveHandler);
  }

  getThemeColor(theme: Theme): string {
    const colors: Record<string, string> = {
      void: 'rgba(139, 92, 246, 0.8)',      // Purple
      nebula: 'rgba(236, 72, 153, 0.8)',    // Pink
      solar: 'rgba(251, 146, 60, 0.8)',     // Orange
      frost: 'rgba(6, 182, 212, 0.8)',      // Cyan
      cosmic: 'rgba(251, 191, 36, 0.8)',    // Amber
    };
    return colors[theme] || 'rgba(135, 206, 250, 0.8)';
  }

  addParticle(x: number, y: number) {
    if (this.particles.length >= this.maxParticles) {
      this.particles.shift();
    }

    this.particles.push({
      x,
      y,
      size: Math.random() * 2.5 + 0.5,
      life: 1,
      velocityX: (Math.random() - 0.5) * 1.5,
      velocityY: (Math.random() - 0.5) * 1.5,
      color: this.getThemeColor(this.theme),
      glow: Math.random() * 8 + 4,
    });
  }

  drawParticles() {
    this.particles.forEach((p, index) => {
      this.ctx.save();
      this.ctx.globalAlpha = p.life * 0.8;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowBlur = p.glow * p.life;
      this.ctx.shadowColor = p.color;

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();

      // Update particle
      p.x += p.velocityX;
      p.y += p.velocityY;
      p.life -= 0.015;
      p.size *= 0.98;
      p.velocityY += 0.05; // Subtle gravity

      if (p.life <= 0) {
        this.particles.splice(index, 1);
      }
    });
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawParticles();
    this.rafId = requestAnimationFrame(this.animate);
  }

  setTheme(newTheme: Theme) {
    this.theme = newTheme;
  }

  cleanup() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.mouseMoveHandler) {
      document.removeEventListener('mousemove', this.mouseMoveHandler);
    }
    this.particles = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

export const StardustTrail: React.FC<StardustTrailProps> = ({
  targetId = 'main',
  maxParticles = 50,
  enabled = true,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const effectRef = useRef<StardustEffect | null>(null);
  const { themeName } = useTheme();

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    effectRef.current = new StardustEffect(
      canvas,
      (themeName as Theme) || 'void',
      maxParticles
    );

    return () => {
      effectRef.current?.cleanup();
      effectRef.current = null;
    };
  }, [enabled, maxParticles, themeName]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
};

export default StardustTrail;
