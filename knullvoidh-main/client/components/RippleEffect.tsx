import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/themes/ThemeProvider';

interface RippleEffectProps {
  targetId?: string;
  enabled?: boolean;
  className?: string;
}

type Theme = 'void' | 'nebula' | 'solar' | 'frost' | 'cosmic' | string;

class RippleCanvas {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  ripples: any[] = [];
  rafId: number | null = null;
  clickHandler: ((e: MouseEvent) => void) | null = null;
  theme: Theme;

  constructor(canvas: HTMLCanvasElement, theme: Theme = 'void') {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context not available');
    this.ctx = ctx;
    this.theme = theme;
    this.resizeCanvas();
    this.setupClickListener();
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

  setupClickListener() {
    this.clickHandler = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.createRipple(x, y);
    };
    document.addEventListener('click', this.clickHandler);
  }

  getThemeColor(): string {
    const colors: Record<string, string> = {
      void: 'rgba(139, 92, 246, 0.6)',
      nebula: 'rgba(236, 72, 153, 0.6)',
      solar: 'rgba(251, 146, 60, 0.6)',
      frost: 'rgba(6, 182, 212, 0.6)',
      cosmic: 'rgba(251, 191, 36, 0.6)',
    };
    return colors[this.theme] || 'rgba(135, 206, 250, 0.6)';
  }

  createRipple(x: number, y: number) {
    this.ripples.push({
      x,
      y,
      radius: 0,
      maxRadius: 250,
      speed: 4,
      opacity: 1,
      lineWidth: 2.5,
      color: this.getThemeColor(),
    });
  }

  drawRipples() {
    this.ripples.forEach((ripple, index) => {
      this.ctx.save();
      this.ctx.strokeStyle = ripple.color;
      this.ctx.globalAlpha = ripple.opacity;
      this.ctx.lineWidth = ripple.lineWidth;
      this.ctx.shadowBlur = 12;
      this.ctx.shadowColor = ripple.color;

      this.ctx.beginPath();
      this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.restore();

      // Update
      ripple.radius += ripple.speed;
      ripple.opacity -= 0.008;
      ripple.lineWidth *= 0.98;

      if (ripple.opacity <= 0 || ripple.radius > ripple.maxRadius) {
        this.ripples.splice(index, 1);
      }
    });
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawRipples();
    this.rafId = requestAnimationFrame(this.animate);
  }

  setTheme(newTheme: Theme) {
    this.theme = newTheme;
  }

  cleanup() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler);
    }
    this.ripples = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

export const RippleEffect: React.FC<RippleEffectProps> = ({
  targetId = 'main',
  enabled = true,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const effectRef = useRef<RippleCanvas | null>(null);
  const { themeName } = useTheme();

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    effectRef.current = new RippleCanvas(canvas, (themeName as Theme) || 'void');

    return () => {
      effectRef.current?.cleanup();
      effectRef.current = null;
    };
  }, [enabled, themeName]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 2,
      }}
    />
  );
};

export default RippleEffect;
