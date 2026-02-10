import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Pixel {
  x: number;
  y: number;
  color: string;
}

interface AnimationFrame {
  id: number;
  pixels: Pixel[];
  name: string;
}

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;
const GRID_SIZE = 20;
const GRID_WIDTH = CANVAS_WIDTH / GRID_SIZE;
const GRID_HEIGHT = CANVAS_HEIGHT / GRID_SIZE;

const defaultColors = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080',
  '#ffc0cb', '#a52a2a', '#808080', '#0aff9d', '#7000ff', '#ff0099'
];

export default function PixelArtCreator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(1);
  const [tool, setTool] = useState<'brush' | 'eraser' | 'fill' | 'eyedropper'>('brush');
  const [isDrawing, setIsDrawing] = useState(false);
  const [animationFrames, setAnimationFrames] = useState<AnimationFrame[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const frameIdRef = useRef(0);

  const getPixelAtPosition = useCallback((x: number, y: number) => {
    const gridX = Math.floor(x / GRID_SIZE);
    const gridY = Math.floor(y / GRID_SIZE);
    return pixels.find(pixel => pixel.x === gridX && pixel.y === gridY);
  }, [pixels]);

  const setPixelAtPosition = useCallback((x: number, y: number, color: string) => {
    const gridX = Math.floor(x / GRID_SIZE);
    const gridY = Math.floor(y / GRID_SIZE);
    
    if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT) return;

    setPixels(prev => {
      const filtered = prev.filter(pixel => !(pixel.x === gridX && pixel.y === gridY));
      if (color && color !== 'transparent') {
        return [...filtered, { x: gridX, y: gridY, color }];
      }
      return filtered;
    });
    
    setScore(prev => prev + 1);
  }, []);

  const floodFill = useCallback((startX: number, startY: number, newColor: string) => {
    const gridX = Math.floor(startX / GRID_SIZE);
    const gridY = Math.floor(startY / GRID_SIZE);
    
    const targetPixel = pixels.find(p => p.x === gridX && p.y === gridY);
    const targetColor = targetPixel?.color || 'transparent';
    
    if (targetColor === newColor) return;

    const visited = new Set<string>();
    const stack = [{ x: gridX, y: gridY }];
    const newPixels: Pixel[] = [];

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const key = `${x},${y}`;
      
      if (visited.has(key) || x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) continue;
      
      const currentPixel = pixels.find(p => p.x === x && p.y === y);
      const currentColor = currentPixel?.color || 'transparent';
      
      if (currentColor !== targetColor) continue;
      
      visited.add(key);
      
      if (newColor !== 'transparent') {
        newPixels.push({ x, y, color: newColor });
      }
      
      stack.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 });
    }

    setPixels(prev => {
      const filtered = prev.filter(pixel => 
        !visited.has(`${pixel.x},${pixel.y}`)
      );
      return [...filtered, ...newPixels];
    });
  }, [pixels]);

  const drawBrush = useCallback((x: number, y: number) => {
    const gridX = Math.floor(x / GRID_SIZE);
    const gridY = Math.floor(y / GRID_SIZE);
    
    for (let dx = -(brushSize - 1); dx < brushSize; dx++) {
      for (let dy = -(brushSize - 1); dy < brushSize; dy++) {
        const targetX = (gridX + dx) * GRID_SIZE + GRID_SIZE / 2;
        const targetY = (gridY + dy) * GRID_SIZE + GRID_SIZE / 2;
        
        if (tool === 'brush') {
          setPixelAtPosition(targetX, targetY, selectedColor);
        } else if (tool === 'eraser') {
          setPixelAtPosition(targetX, targetY, 'transparent');
        }
      }
    }
  }, [brushSize, tool, selectedColor, setPixelAtPosition]);

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlaying || isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    setIsDrawing(true);

    switch (tool) {
      case 'brush':
      case 'eraser':
        drawBrush(x, y);
        break;
      case 'fill':
        floodFill(x, y, selectedColor);
        break;
      case 'eyedropper':
        const pixel = getPixelAtPosition(x, y);
        if (pixel) {
          setSelectedColor(pixel.color);
          setTool('brush');
        }
        break;
    }
  }, [isPlaying, isPaused, tool, drawBrush, floodFill, selectedColor, getPixelAtPosition]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isPlaying || isPaused) return;
    if (tool !== 'brush' && tool !== 'eraser') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    drawBrush(x, y);
  }, [isDrawing, isPlaying, isPaused, tool, drawBrush]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const saveFrame = useCallback(() => {
    const newFrame: AnimationFrame = {
      id: frameIdRef.current++,
      pixels: [...pixels],
      name: `Frame ${animationFrames.length + 1}`
    };
    setAnimationFrames(prev => [...prev, newFrame]);
  }, [pixels, animationFrames.length]);

  const loadFrame = useCallback((frameIndex: number) => {
    if (frameIndex >= 0 && frameIndex < animationFrames.length) {
      setPixels(animationFrames[frameIndex].pixels);
      setCurrentFrame(frameIndex);
    }
  }, [animationFrames]);

  const clearCanvas = useCallback(() => {
    setPixels([]);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Clear canvas
    ctx.fillStyle = '#001122';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }
    }

    // Draw pixels
    const currentPixels = isAnimating && animationFrames.length > 0 
      ? animationFrames[currentFrame]?.pixels || []
      : pixels;

    currentPixels.forEach(pixel => {
      ctx.fillStyle = pixel.color;
      ctx.fillRect(
        pixel.x * GRID_SIZE + 1,
        pixel.y * GRID_SIZE + 1,
        GRID_SIZE - 2,
        GRID_SIZE - 2
      );
    });

    // Draw frame info for animation
    if (isAnimating && animationFrames.length > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.fillText(`Frame: ${currentFrame + 1}/${animationFrames.length}`, 10, 25);
    }
  }, [pixels, showGrid, isAnimating, animationFrames, currentFrame]);

  // Animation loop
  useEffect(() => {
    if (isAnimating && animationFrames.length > 0) {
      const interval = setInterval(() => {
        setCurrentFrame(prev => (prev + 1) % animationFrames.length);
      }, 500); // 2 FPS animation
      return () => clearInterval(interval);
    }
  }, [isAnimating, animationFrames.length]);

  useEffect(() => {
    const interval = setInterval(draw, 16);
    return () => clearInterval(interval);
  }, [draw]);

  const startGame = () => {
    setScore(0);
    setPixels([]);
    setAnimationFrames([]);
    setCurrentFrame(0);
    setIsAnimating(false);
    frameIdRef.current = 0;
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseGame = () => setIsPaused(!isPaused);
  const resetGame = () => {
    setIsPlaying(false);
    setScore(0);
    setPixels([]);
    setAnimationFrames([]);
  };

  return (
    <GameLayout
      gameTitle="Pixel Art Creator"
      gameCategory="Create amazing pixel art and animations!"
      score={score}
      isPlaying={isPlaying}
      onPause={pauseGame}
      onReset={resetGame}
    >
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="border-2 border-neon-green rounded-lg cursor-crosshair max-w-full h-auto"
          style={{ background: '#001122' }}
        />
        
        {isPlaying && (
          <div className="flex flex-col gap-4 w-full max-w-4xl">
            {/* Tools */}
            <div className="flex gap-2 justify-center flex-wrap">
              {['brush', 'eraser', 'fill', 'eyedropper'].map(toolName => (
                <button
                  key={toolName}
                  onClick={() => setTool(toolName as any)}
                  className={`px-3 py-2 rounded border-2 transition-all ${
                    tool === toolName 
                      ? 'border-neon-green bg-neon-green/20' 
                      : 'border-gray-600 hover:border-neon-green/50'
                  }`}
                >
                  {toolName.charAt(0).toUpperCase() + toolName.slice(1)}
                </button>
              ))}
            </div>

            {/* Color Palette */}
            <div className="flex gap-1 justify-center flex-wrap">
              {defaultColors.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded border-2 transition-all ${
                    selectedColor === color ? 'border-white' : 'border-gray-600'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-8 h-8 rounded border-2 border-gray-600"
              />
            </div>

            {/* Controls */}
            <div className="flex gap-2 justify-center flex-wrap items-center">
              <label className="text-sm text-gray-400">
                Brush Size:
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="ml-2"
                />
                {brushSize}
              </label>
              
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`px-3 py-1 rounded border ${
                  showGrid ? 'border-neon-green text-neon-green' : 'border-gray-600'
                }`}
              >
                Grid
              </button>
              
              <button
                onClick={clearCanvas}
                className="px-3 py-1 rounded border border-red-500 text-red-500 hover:bg-red-500/20"
              >
                Clear
              </button>
            </div>

            {/* Animation Controls */}
            <div className="flex gap-2 justify-center flex-wrap items-center">
              <button
                onClick={saveFrame}
                className="px-3 py-1 rounded border border-blue-500 text-blue-500 hover:bg-blue-500/20"
              >
                Save Frame
              </button>
              
              <button
                onClick={() => setIsAnimating(!isAnimating)}
                disabled={animationFrames.length === 0}
                className={`px-3 py-1 rounded border transition-all ${
                  animationFrames.length === 0 
                    ? 'border-gray-600 text-gray-600' 
                    : isAnimating 
                      ? 'border-red-500 text-red-500' 
                      : 'border-green-500 text-green-500'
                }`}
              >
                {isAnimating ? 'Stop' : 'Play'} Animation
              </button>
              
              <span className="text-sm text-gray-400">
                Frames: {animationFrames.length}
              </span>
            </div>

            {/* Frame List */}
            {animationFrames.length > 0 && (
              <div className="flex gap-1 justify-center flex-wrap">
                {animationFrames.map((frame, index) => (
                  <button
                    key={frame.id}
                    onClick={() => loadFrame(index)}
                    className={`px-2 py-1 text-xs rounded border transition-all ${
                      currentFrame === index && isAnimating
                        ? 'border-neon-green bg-neon-green/20'
                        : 'border-gray-600 hover:border-neon-green/50'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="text-center text-sm text-gray-400 max-w-md">
          Click and drag to draw. Use tools to create pixel art and save frames for animation!
          Score increases with every pixel painted.
        </div>
      </div>
    </GameLayout>
  );
}
