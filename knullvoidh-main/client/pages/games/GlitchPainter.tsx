import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface Brush {
  size: number;
  color: string;
  effect: 'normal' | 'glow' | 'scatter' | 'pixel' | 'glitch';
}

const GlitchPainter: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused'>('playing');
  const [score, setScore] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brush, setBrush] = useState<Brush>({
    size: 10,
    color: '#0aff9d',
    effect: 'normal'
  });
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  const colors = [
    '#0aff9d', '#7000ff', '#ff0099', '#00ffff', '#ffa500',
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#f39c12', '#e74c3c'
  ];

  const effects = ['normal', 'glow', 'scatter', 'pixel', 'glitch'] as const;

  // Drawing functions
  const drawPixel = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = brush.color;
    ctx.fillRect(Math.floor(x / 4) * 4, Math.floor(y / 4) * 4, 4, 4);
  }, [brush.color]);

  const drawGlitch = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const glitchColors = ['#ff0000', '#00ff00', '#0000ff'];
    glitchColors.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.3;
      const offsetX = (Math.random() - 0.5) * 10;
      const offsetY = (Math.random() - 0.5) * 10;
      ctx.fillRect(x + offsetX - brush.size/2, y + offsetY - brush.size/2, brush.size, brush.size);
    });
    ctx.globalAlpha = 1;
  }, [brush.size]);

  const drawScatter = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = brush.color;
    for (let i = 0; i < 20; i++) {
      const scatterX = x + (Math.random() - 0.5) * brush.size * 2;
      const scatterY = y + (Math.random() - 0.5) * brush.size * 2;
      ctx.fillRect(scatterX, scatterY, 2, 2);
    }
  }, [brush.color, brush.size]);

  const drawGlow = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, brush.size);
    gradient.addColorStop(0, brush.color);
    gradient.addColorStop(0.5, brush.color + '80');
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x - brush.size, y - brush.size, brush.size * 2, brush.size * 2);
  }, [brush.color, brush.size]);

  const drawNormal = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = brush.color;
    ctx.beginPath();
    ctx.arc(x, y, brush.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }, [brush.color, brush.size]);

  const draw = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw line from last position if drawing
    if (lastPos && isDrawing) {
      const dx = x - lastPos.x;
      const dy = y - lastPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.max(distance / 2, 1);

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const interpX = lastPos.x + dx * t;
        const interpY = lastPos.y + dy * t;

        switch (brush.effect) {
          case 'glow':
            drawGlow(ctx, interpX, interpY);
            break;
          case 'scatter':
            drawScatter(ctx, interpX, interpY);
            break;
          case 'pixel':
            drawPixel(ctx, interpX, interpY);
            break;
          case 'glitch':
            drawGlitch(ctx, interpX, interpY);
            break;
          default:
            drawNormal(ctx, interpX, interpY);
        }
      }
    }

    setLastPos({ x, y });
    setScore(prev => prev + 1);
  }, [brush, isDrawing, lastPos, drawGlow, drawScatter, drawPixel, drawGlitch, drawNormal]);

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    
    draw(x, y);
  }, [draw]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    
    draw(x, y);
  }, [isDrawing, draw]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
    setLastPos(null);
  }, []);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((touch.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    
    draw(x, y);
  }, [draw]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((touch.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    
    draw(x, y);
  }, [isDrawing, draw]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(false);
    setLastPos(null);
  }, []);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create digital static clear effect
    const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      if (Math.random() < 0.1) {
        data[i] = 0;     // R
        data[i + 1] = 0; // G
        data[i + 2] = 0; // B
        data[i + 3] = 0; // A
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    setTimeout(() => {
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }, 100);
  }, []);

  // Apply glitch effect to entire canvas
  const applyGlitchEffect = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const data = imageData.data;
    
    // RGB shift effect
    for (let y = 0; y < CANVAS_HEIGHT; y += 10) {
      for (let x = 0; x < CANVAS_WIDTH; x++) {
        const i = (y * CANVAS_WIDTH + x) * 4;
        if (i < data.length - 8) {
          // Shift red channel
          data[i] = data[i + 8] || data[i];
          // Shift blue channel
          data[i + 2] = data[i - 8] || data[i + 2];
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    setScore(prev => prev + 100);
  }, []);

  // Initialize canvas
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, []);

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore(0);
    clearCanvas();
    setGameState('playing');
  };

  return (
    <GameLayout
      gameTitle="Glitch Painter"
      gameCategory="Creative"
      score={score}
      isPlaying={gameState === 'playing'}
      onPause={handlePause}
      onReset={handleReset}
    >
      <div className="min-h-[calc(100vh-64px)] p-4 bg-gradient-to-br from-background/50 to-background">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Canvas */}
          <div className="lg:col-span-3">
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="border border-neon-green/50 rounded-lg bg-black/20 backdrop-blur-sm shadow-2xl max-w-full h-auto cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ touchAction: 'none' }}
              />
            </motion.div>
          </div>

          {/* Tools */}
          <div className="space-y-6">
            
            {/* Brush Settings */}
            <motion.div
              className="bg-card/30 backdrop-blur-sm rounded-xl p-4 border border-border/50"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h3 className="text-lg font-bold text-neon-purple mb-4">Brush Settings</h3>
              
              {/* Brush Size */}
              <div className="mb-4">
                <label className="text-sm text-muted-foreground mb-2 block">
                  Size: {brush.size}px
                </label>
                <Slider
                  value={[brush.size]}
                  onValueChange={([value]) => setBrush(prev => ({ ...prev, size: value }))}
                  min={1}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Effects */}
              <div className="mb-4">
                <label className="text-sm text-muted-foreground mb-2 block">Effect</label>
                <div className="grid grid-cols-2 gap-2">
                  {effects.map(effect => (
                    <Button
                      key={effect}
                      variant={brush.effect === effect ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBrush(prev => ({ ...prev, effect }))}
                      className="text-xs capitalize"
                    >
                      {effect}
                    </Button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Color Palette */}
            <motion.div
              className="bg-card/30 backdrop-blur-sm rounded-xl p-4 border border-border/50"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-lg font-bold text-neon-green mb-4">Colors</h3>
              <div className="grid grid-cols-5 gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      brush.color === color 
                        ? 'border-white scale-110' 
                        : 'border-border/50 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setBrush(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              className="bg-card/30 backdrop-blur-sm rounded-xl p-4 border border-border/50"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-lg font-bold text-neon-pink mb-4">Effects</h3>
              <div className="space-y-2">
                <Button
                  onClick={applyGlitchEffect}
                  className="w-full bg-neon-pink/20 text-neon-pink hover:bg-neon-pink/30"
                  size="sm"
                >
                  Apply Glitch
                </Button>
                <Button
                  onClick={clearCanvas}
                  variant="outline"
                  className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                  size="sm"
                >
                  Clear Canvas
                </Button>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="bg-card/30 backdrop-blur-sm rounded-xl p-4 border border-border/50"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-lg font-bold text-yellow-500 mb-2">Stats</h3>
              <div className="text-sm text-muted-foreground">
                <div>Brush Strokes: {score}</div>
                <div>Effect: {brush.effect}</div>
                <div>Size: {brush.size}px</div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p className="md:hidden">Touch and drag to paint • Use tools panel to customize</p>
          <p className="hidden md:block">Click and drag to paint • Experiment with different effects and colors</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default GlitchPainter;
