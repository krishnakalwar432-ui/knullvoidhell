import React, { useEffect, useRef } from 'react';

type Theme = 'blue' | 'purple' | 'pink' | 'orange' | string;

interface LightningCanvasProps {
  targetId?: string; // id of element to listen clicks on (defaults to 'mainCanvas')
  theme?: Theme;
  className?: string;
}

class ThunderEffect {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  bolts: any[] = [];
  rafId: number | null = null;
  clickHandler: ((e: MouseEvent) => void) | null = null;
  targetElem: HTMLElement | Document | null = null;
  theme: Theme;

  constructor(canvas: HTMLCanvasElement, theme: Theme = 'blue') {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context not available');
    this.ctx = ctx;
    this.theme = theme;
    this.animate = this.animate.bind(this);
    this.resizeCanvas();
    this.animate();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  setupClickListener(target: HTMLElement | Document | null) {
    this.targetElem = target || document;
    this.clickHandler = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Create bolts striking from all four directions toward the click
      this.createLightning(x, y, { directions: ['top', 'bottom', 'left', 'right'] });
      this.screenFlash();
    };

    this.targetElem.addEventListener('click', this.clickHandler as EventListener);
  }

  resizeCanvas() {
    const parent = this.canvas.parentElement;
    if (parent) {
      const rect = parent.getBoundingClientRect();
      this.canvas.width = Math.max(1, Math.round(rect.width));
      this.canvas.height = Math.max(1, Math.round(rect.height));
    }
  }

  createLightning(
    x: number,
    y: number,
    opts: { directions?: ('top' | 'bottom' | 'left' | 'right')[] } = { directions: ['bottom'] }
  ) {
    const dirs = opts.directions && opts.directions.length ? opts.directions : ['bottom'];

    dirs.forEach((dir) => {
      // determine start point on canvas edge for each direction
      let sx = x;
      let sy = y;

      if (dir === 'top') { sx = x + (Math.random() - 0.5) * 80; sy = 0; }
      if (dir === 'bottom') { sx = x + (Math.random() - 0.5) * 80; sy = this.canvas.height; }
      if (dir === 'left') { sx = 0; sy = y + (Math.random() - 0.5) * 80; }
      if (dir === 'right') { sx = this.canvas.width; sy = y + (Math.random() - 0.5) * 80; }

      const segments = this.generateLightningPathFromTo(sx, sy, x, y);

      const bolt = {
        x: sx,
        y: sy,
        segments,
        opacity: 1,
        lifetime: 0,
        maxLifetime: 18 + Math.floor(Math.random() * 10),
        thickness: Math.random() * 2 + 1.5,
        color: this.getColor(),
        branches: [] as any[],
      };

      for (let i = 0; i < 1 + Math.floor(Math.random() * 3); i++) {
        bolt.branches.push(this.generateBranch(bolt.segments));
      }

      this.bolts.push(bolt);
    });
  }

  // Generate path from arbitrary start to end with jitter
  generateLightningPathFromTo(startX: number, startY: number, endX: number, endY: number) {
    const segments: { x: number; y: number }[] = [];
    const dx = endX - startX;
    const dy = endY - startY;
    const dist = Math.hypot(dx, dy) || 1;
    const steps = Math.min(24, Math.max(6, Math.floor(dist / 20)));
    let x = startX;
    let y = startY;

    for (let i = 0; i < steps; i++) {
      const t = (i + 1) / steps;
      // progress toward end with easing
      const nx = startX + dx * t + (Math.random() - 0.5) * 30 * (1 - t);
      const ny = startY + dy * t + (Math.random() - 0.5) * 30 * (1 - t);
      x = Math.max(0, Math.min(this.canvas.width, nx));
      y = Math.max(0, Math.min(this.canvas.height, ny));
      segments.push({ x, y });
    }
    segments.push({ x: endX, y: endY });
    return segments;
  }

  getColor() {
    switch (this.theme) {
      case 'purple':
        return 'rgba(138,92,246,1)';
      case 'pink':
        return 'rgba(236,72,153,1)';
      case 'orange':
        return 'rgba(251,146,60,1)';
      default:
        return 'rgba(135,206,250,1)';
    }
  }

  generateLightningPath(startX: number, startY: number) {
    const segments: { x: number; y: number }[] = [];
    let x = startX;
    let y = startY;
    const targetY = this.canvas.height;
    const steps = 12 + Math.floor(Math.random() * 8);
    for (let i = 0; i < steps; i++) {
      segments.push({ x, y });
      x += (Math.random() - 0.5) * 40;
      y += (targetY - startY) / steps;
      x = Math.max(0, Math.min(this.canvas.width, x));
    }
    segments.push({ x, y: targetY });
    return segments;
  }

  generateBranch(mainSegments: { x: number; y: number }[]) {
    const startIndex = Math.floor(Math.random() * (mainSegments.length / 2));
    const start = mainSegments[startIndex] || mainSegments[0];
    const branch = [{ x: start.x, y: start.y }];
    let x = start.x;
    let y = start.y;
    const branchLength = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < branchLength; i++) {
      x += (Math.random() - 0.5) * 40;
      y += 20 + Math.random() * 30;
      branch.push({ x, y });
    }
    return branch;
  }

  drawLightning(bolt: any) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = bolt.opacity;
    ctx.strokeStyle = bolt.color;
    ctx.lineWidth = bolt.thickness;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 16;
    ctx.shadowColor = '#88CCFF';

    ctx.beginPath();
    bolt.segments.forEach((segment: any, i: number) => {
      if (i === 0) ctx.moveTo(segment.x, segment.y);
      else ctx.lineTo(segment.x, segment.y);
    });
    ctx.stroke();

    bolt.branches.forEach((branch: any) => {
      ctx.beginPath();
      ctx.lineWidth = bolt.thickness * 0.6;
      branch.forEach((segment: any, i: number) => {
        if (i === 0) ctx.moveTo(segment.x, segment.y);
        else ctx.lineTo(segment.x, segment.y);
      });
      ctx.stroke();
    });

    ctx.restore();
  }

  screenFlash() {
    // quick subtle flash on the canvas
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.bolts = this.bolts.filter((bolt) => {
      bolt.lifetime++;
      bolt.opacity = Math.max(0, 1 - bolt.lifetime / bolt.maxLifetime);
      this.drawLightning(bolt);
      return bolt.lifetime < bolt.maxLifetime;
    });
    this.rafId = requestAnimationFrame(this.animate);
  }

  cleanup() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.clickHandler && this.targetElem) {
      this.targetElem.removeEventListener('click', this.clickHandler as EventListener);
    }
    this.bolts = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

export const LightningCanvas: React.FC<LightningCanvasProps> = ({
  targetId = 'mainCanvas',
  theme = 'blue',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const thunderRef = useRef<ThunderEffect | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    thunderRef.current = new ThunderEffect(canvas, theme);

    const target = document.getElementById(targetId) || document;
    thunderRef.current.setupClickListener(target as HTMLElement | Document);

    return () => {
      thunderRef.current?.cleanup();
      thunderRef.current = null;
    };
  }, [targetId, theme]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 999,
      }}
    />
  );
};

export default LightningCanvas;
