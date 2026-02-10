import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface LightBeam {
  x: number;
  y: number;
  direction: number; // angle in radians
  active: boolean;
  color: string;
}

interface Mirror {
  x: number;
  y: number;
  angle: number;
  id: string;
}

interface Target {
  x: number;
  y: number;
  hit: boolean;
  color: string;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

export default function LightSpeedPuzzle() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [lightBeam, setLightBeam] = useState<LightBeam>({ x: 50, y: 300, direction: 0, active: true, color: '#00ffff' });
  const [mirrors, setMirrors] = useState<Mirror[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [level, setLevel] = useState(1);
  const [selectedMirror, setSelectedMirror] = useState<string | null>(null);

  const generateLevel = useCallback((levelNum: number) => {
    const newMirrors: Mirror[] = [
      { x: 200, y: 200, angle: 45, id: 'mirror-1' },
      { x: 400, y: 300, angle: -45, id: 'mirror-2' },
      { x: 600, y: 150, angle: 90, id: 'mirror-3' }
    ];

    const newTargets: Target[] = [
      { x: 700, y: 100, hit: false, color: '#ff0099' },
      { x: 650, y: 500, hit: false, color: '#ffff00' }
    ];

    if (levelNum > 1) {
      newMirrors.push({ x: 300, y: 450, angle: 30, id: 'mirror-4' });
      newTargets.push({ x: 100, y: 100, hit: false, color: '#0aff9d' });
    }

    setMirrors(newMirrors);
    setTargets(newTargets);
  }, []);

  const calculateLightPath = useCallback(() => {
    let currentX = lightBeam.x;
    let currentY = lightBeam.y;
    let currentDirection = lightBeam.direction;
    const path: {x1: number, y1: number, x2: number, y2: number}[] = [];
    const maxBounces = 10;
    let bounces = 0;

    while (bounces < maxBounces) {
      let nextX = currentX + Math.cos(currentDirection) * 1000;
      let nextY = currentY + Math.sin(currentDirection) * 1000;
      let hitMirror: Mirror | null = null;
      let minDistance = Infinity;

      // Check mirror intersections
      mirrors.forEach(mirror => {
        const mirrorCos = Math.cos(mirror.angle * Math.PI / 180);
        const mirrorSin = Math.sin(mirror.angle * Math.PI / 180);
        
        // Simple line intersection with mirror line
        const mirrorX1 = mirror.x - 30 * mirrorCos;
        const mirrorY1 = mirror.y - 30 * mirrorSin;
        const mirrorX2 = mirror.x + 30 * mirrorCos;
        const mirrorY2 = mirror.y + 30 * mirrorSin;

        const denom = (currentX - nextX) * (mirrorY1 - mirrorY2) - (currentY - nextY) * (mirrorX1 - mirrorX2);
        if (Math.abs(denom) > 0.01) {
          const t = ((currentX - mirrorX1) * (mirrorY1 - mirrorY2) - (currentY - mirrorY1) * (mirrorX1 - mirrorX2)) / denom;
          const u = -((currentX - nextX) * (currentY - mirrorY1) - (currentY - nextY) * (currentX - mirrorX1)) / denom;
          
          if (t > 0 && t < 1 && u >= 0 && u <= 1) {
            const intersectX = currentX + t * (nextX - currentX);
            const intersectY = currentY + t * (nextY - currentY);
            const distance = Math.sqrt((intersectX - currentX) ** 2 + (intersectY - currentY) ** 2);
            
            if (distance < minDistance) {
              minDistance = distance;
              nextX = intersectX;
              nextY = intersectY;
              hitMirror = mirror;
            }
          }
        }
      });

      // Check boundary intersections
      if (nextX < 0 || nextX > GAME_WIDTH || nextY < 0 || nextY > GAME_HEIGHT) {
        if (nextX < 0) nextX = 0;
        if (nextX > GAME_WIDTH) nextX = GAME_WIDTH;
        if (nextY < 0) nextY = 0;
        if (nextY > GAME_HEIGHT) nextY = GAME_HEIGHT;
        
        path.push({ x1: currentX, y1: currentY, x2: nextX, y2: nextY });
        break;
      }

      path.push({ x1: currentX, y1: currentY, x2: nextX, y2: nextY });

      if (hitMirror) {
        // Calculate reflection
        const mirrorAngle = hitMirror.angle * Math.PI / 180;
        const normalAngle = mirrorAngle + Math.PI / 2;
        const incidentAngle = currentDirection - normalAngle;
        currentDirection = normalAngle - incidentAngle;
        
        currentX = nextX;
        currentY = nextY;
        bounces++;
      } else {
        break;
      }
    }

    return path;
  }, [lightBeam, mirrors]);

  const checkTargetHits = useCallback((path: {x1: number, y1: number, x2: number, y2: number}[]) => {
    targets.forEach(target => {
      target.hit = false;
      
      path.forEach(segment => {
        const distance = Math.sqrt((target.x - segment.x2) ** 2 + (target.y - segment.y2) ** 2);
        if (distance < 25) {
          target.hit = true;
        }
      });
    });

    // Check if all targets hit
    if (targets.every(t => t.hit)) {
      setScore(prev => prev + level * 100);
      setLevel(prev => prev + 1);
      generateLevel(level + 1);
    }
  }, [targets, level, generateLevel]);

  const rotateMirror = useCallback((mirrorId: string, delta: number) => {
    setMirrors(prev => prev.map(mirror => 
      mirror.id === mirrorId 
        ? { ...mirror, angle: mirror.angle + delta }
        : mirror
    ));
  }, []);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlaying || isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Check mirror selection
    const clickedMirror = mirrors.find(mirror => {
      const distance = Math.sqrt((mirror.x - x) ** 2 + (mirror.y - y) ** 2);
      return distance < 40;
    });

    if (clickedMirror) {
      setSelectedMirror(selectedMirror === clickedMirror.id ? null : clickedMirror.id);
    } else {
      setSelectedMirror(null);
    }
  }, [isPlaying, isPaused, mirrors, selectedMirror]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    // Dark space background
    ctx.fillStyle = '#000814';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Grid
    ctx.strokeStyle = '#001a33';
    ctx.lineWidth = 1;
    for (let x = 0; x < GAME_WIDTH; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < GAME_HEIGHT; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_WIDTH, y);
      ctx.stroke();
    }

    // Light source
    ctx.fillStyle = lightBeam.color;
    ctx.shadowColor = lightBeam.color;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(lightBeam.x, lightBeam.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Mirrors
    mirrors.forEach(mirror => {
      const cos = Math.cos(mirror.angle * Math.PI / 180);
      const sin = Math.sin(mirror.angle * Math.PI / 180);
      
      ctx.strokeStyle = selectedMirror === mirror.id ? '#ffff00' : '#ffffff';
      ctx.lineWidth = selectedMirror === mirror.id ? 4 : 3;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 8;
      
      ctx.beginPath();
      ctx.moveTo(mirror.x - 30 * cos, mirror.y - 30 * sin);
      ctx.lineTo(mirror.x + 30 * cos, mirror.y + 30 * sin);
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Targets
    targets.forEach(target => {
      ctx.fillStyle = target.hit ? target.color : target.color + '50';
      ctx.strokeStyle = target.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = target.color;
      ctx.shadowBlur = target.hit ? 15 : 5;
      
      ctx.beginPath();
      ctx.arc(target.x, target.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Light beam path
    const lightPath = calculateLightPath();
    ctx.strokeStyle = lightBeam.color;
    ctx.lineWidth = 3;
    ctx.shadowColor = lightBeam.color;
    ctx.shadowBlur = 10;
    
    lightPath.forEach(segment => {
      ctx.beginPath();
      ctx.moveTo(segment.x1, segment.y1);
      ctx.lineTo(segment.x2, segment.y2);
      ctx.stroke();
    });
    ctx.shadowBlur = 0;

    // Check targets
    checkTargetHits(lightPath);

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Arial';
    ctx.fillText(`Level: ${level}`, 10, 30);
    ctx.fillText(`Score: ${score}`, 10, 55);
    
    if (selectedMirror) {
      ctx.fillText('Use Q/E to rotate mirror', 10, GAME_HEIGHT - 20);
    } else {
      ctx.fillText('Click mirrors to select them', 10, GAME_HEIGHT - 20);
    }

  }, [lightBeam, mirrors, targets, selectedMirror, level, score, calculateLightPath, checkTargetHits]);

  useEffect(() => {
    const interval = setInterval(draw, 16);
    return () => clearInterval(interval);
  }, [draw]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedMirror) return;
      
      if (e.key === 'q' || e.key === 'Q') {
        rotateMirror(selectedMirror, -5);
      } else if (e.key === 'e' || e.key === 'E') {
        rotateMirror(selectedMirror, 5);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMirror, rotateMirror]);

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setSelectedMirror(null);
    setLightBeam({ x: 50, y: 300, direction: 0, active: true, color: '#00ffff' });
    generateLevel(1);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseGame = () => setIsPaused(!isPaused);
  const resetGame = () => setIsPlaying(false);

  return (
    <GameLayout
      gameTitle="Light Speed Puzzle"
      gameCategory="Use mirrors to redirect light beams to targets!"
      score={score}
      isPlaying={isPlaying}
      onPause={pauseGame}
      onReset={resetGame}
    >
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          onClick={handleCanvasClick}
          className="border-2 border-neon-green rounded-lg cursor-pointer max-w-full h-auto"
        />
        <div className="text-center text-sm text-gray-400 max-w-md">
          Click mirrors to select, use Q/E to rotate. Direct light to hit all targets!
        </div>
      </div>
    </GameLayout>
  );
}
