import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';
import {
  getSafeCanvas2DContext,
  createSafeAnimationManager,
  createSafeEventManager,
  checkCollision,
  clamp,
  distance,
  gameManager
} from '@/utils/universalGameFix';

interface Position {
  x: number;
  y: number;
}

interface Arrow extends Position {
  id: number;
  vx: number;
  vy: number;
  angle: number;
}

interface Target extends Position {
  id: number;
  radius: number;
  value: number;
  hit: boolean;
  color: string;
  moving: boolean;
  moveSpeed?: number;
  movePattern?: 'circle' | 'linear';
}

interface Particle extends Position {
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

const AstroArcher: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [arrows, setArrows] = useState(10);
  const [level, setLevel] = useState(1);
  const [arrowsInFlight, setArrowsInFlight] = useState<Arrow[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [aimAngle, setAimAngle] = useState(0);
  const [aimPower, setAimPower] = useState(0);
  const [charging, setCharging] = useState(false);
  const [mousePos, setMousePos] = useState<Position>({ x: 400, y: 300 });

  const animationManagerRef = useRef(createSafeAnimationManager());
  const eventManagerRef = useRef(createSafeEventManager());
  const arrowIdRef = useRef(0);
  const targetIdRef = useRef(0);
  const chargeStartTime = useRef(0);
  const gameId = 'astro-archer';

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const ARCHER_POS = { x: 100, y: 500 };
  const GRAVITY = 0.3;
  const MAX_POWER = 20;

  // Create particles
  const createParticles = useCallback((x: number, y: number, color: string, count: number = 8) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15 - 5,
        life: 1.0,
        color,
        size: Math.random() * 4 + 2
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Generate targets
  const generateTargets = useCallback(() => {
    const newTargets: Target[] = [];
    const targetCount = 3 + level;
    
    for (let i = 0; i < targetCount; i++) {
      const moving = Math.random() < 0.4;
      const x = 300 + Math.random() * 400;
      const y = 100 + Math.random() * 300;
      
      newTargets.push({
        id: targetIdRef.current++,
        x,
        y,
        radius: 20 + Math.random() * 20,
        value: Math.floor(50 + Math.random() * 100),
        hit: false,
        color: ['#0aff9d', '#7000ff', '#ff0099', '#00ffff'][Math.floor(Math.random() * 4)],
        moving,
        moveSpeed: moving ? 1 + Math.random() * 2 : 0,
        movePattern: Math.random() > 0.5 ? 'circle' : 'linear'
      });
    }
    
    setTargets(newTargets);
  }, [level]);

  // Initialize game
  useEffect(() => {
    gameManager.registerGame(gameId);

    return () => {
      gameManager.unregisterGame(gameId);
      animationManagerRef.current.stop();
      eventManagerRef.current.cleanup();
    };
  }, []);

  // Handle mouse movement for aiming
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
        const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
        setMousePos({ x, y });
        
        const dx = x - ARCHER_POS.x;
        const dy = y - ARCHER_POS.y;
        setAimAngle(Math.atan2(dy, dx));
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (gameState === 'playing' && arrows > 0) {
        setCharging(true);
        chargeStartTime.current = Date.now();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (charging && arrows > 0) {
        shootArrow();
        setCharging(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [gameState, arrows, charging]);

  // Touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState === 'playing' && arrows > 0) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = ((touch.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
        const y = ((touch.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
        
        const dx = x - ARCHER_POS.x;
        const dy = y - ARCHER_POS.y;
        setAimAngle(Math.atan2(dy, dx));
        
        setCharging(true);
        chargeStartTime.current = Date.now();
      }
    }
  };

  const handleTouchEnd = () => {
    if (charging && arrows > 0) {
      shootArrow();
      setCharging(false);
    }
  };

  // Shoot arrow
  const shootArrow = useCallback(() => {
    const power = Math.min(aimPower, MAX_POWER);
    const arrow: Arrow = {
      id: arrowIdRef.current++,
      x: ARCHER_POS.x,
      y: ARCHER_POS.y,
      vx: Math.cos(aimAngle) * power,
      vy: Math.sin(aimAngle) * power,
      angle: aimAngle
    };
    
    setArrowsInFlight(prev => [...prev, arrow]);
    setArrows(prev => prev - 1);
    createParticles(ARCHER_POS.x, ARCHER_POS.y, '#ffff00', 5);
  }, [aimAngle, aimPower, createParticles]);

  // Update charge power safely
  useEffect(() => {
    if (charging) {
      const animationManager = createSafeAnimationManager();
      const updatePower = () => {
        const elapsed = Date.now() - chargeStartTime.current;
        setAimPower(clamp((elapsed / 100) * 2, 0, MAX_POWER));
      };
      animationManager.start(updatePower);

      return () => animationManager.stop();
    } else {
      setAimPower(0);
    }
  }, [charging]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      // Update arrows
      setArrowsInFlight(prev => prev
        .map(arrow => ({
          ...arrow,
          x: arrow.x + arrow.vx,
          y: arrow.y + arrow.vy,
          vy: arrow.vy + GRAVITY,
          angle: Math.atan2(arrow.vy, arrow.vx)
        }))
        .filter(arrow => 
          arrow.x < CANVAS_WIDTH + 50 && 
          arrow.y < CANVAS_HEIGHT + 50 && 
          arrow.x > -50
        )
      );

      // Update moving targets
      setTargets(prev => prev.map(target => {
        if (!target.moving || target.hit) return target;
        
        const time = Date.now() * 0.001;
        let newX = target.x;
        let newY = target.y;
        
        if (target.movePattern === 'circle') {
          newX = target.x + Math.cos(time * target.moveSpeed!) * 50;
          newY = target.y + Math.sin(time * target.moveSpeed!) * 30;
        } else {
          newX = target.x + Math.sin(time * target.moveSpeed!) * 100;
        }
        
        return { ...target, x: newX, y: newY };
      }));

      // Check arrow-target collisions
      setArrowsInFlight(prevArrows => {
        const remainingArrows: Arrow[] = [];
        
        prevArrows.forEach(arrow => {
          let hit = false;
          
          setTargets(prevTargets => prevTargets.map(target => {
            if (target.hit) return target;
            
            const dx = arrow.x - target.x;
            const dy = arrow.y - target.y;
            const collisionDistance = distance(arrow.x, arrow.y, target.x, target.y);
            
            if (collisionDistance < target.radius) {
              hit = true;
              setScore(s => s + target.value);
              createParticles(target.x, target.y, target.color, 12);
              return { ...target, hit: true };
            }
            
            return target;
          }));
          
          if (!hit) {
            remainingArrows.push(arrow);
          }
        });
        
        return remainingArrows;
      });

      // Update particles
      setParticles(prev => prev
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.2,
          vx: p.vx * 0.98,
          life: p.life - 0.02,
          size: p.size * 0.99
        }))
        .filter(p => p.life > 0)
      );

      // Check level completion
      const allTargetsHit = targets.length > 0 && targets.every(target => target.hit);
      if (allTargetsHit) {
        setLevel(prev => prev + 1);
        setArrows(prev => prev + 5);
        generateTargets();
      }

      // Check game over
      if (arrows === 0 && arrowsInFlight.length === 0 && !allTargetsHit) {
        setGameState('gameOver');
      }

    };

    animationManagerRef.current.start(gameLoop);

    return () => {
      animationManagerRef.current.stop();
    };
  }, [gameState, targets, arrows, arrowsInFlight, generateTargets, createParticles]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = getSafeCanvas2DContext(canvas);
    if (!ctx) return;

    // Clear canvas with space background
    const gradient = ctx.createRadialGradient(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 0, CANVAS_WIDTH/2, CANVAS_HEIGHT/2, CANVAS_WIDTH);
    gradient.addColorStop(0, '#1a0a2a');
    gradient.addColorStop(1, '#0a0a0f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw stars
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = Math.random() * 0.8 + 0.2;
      const x = (i * 123) % CANVAS_WIDTH;
      const y = (i * 456) % CANVAS_HEIGHT;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;

    // Draw archer
    ctx.fillStyle = '#0aff9d';
    ctx.shadowColor = '#0aff9d';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(ARCHER_POS.x, ARCHER_POS.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw aim line
    if (gameState === 'playing') {
      ctx.strokeStyle = charging ? '#ff0099' : '#ffffff';
      ctx.lineWidth = charging ? 3 : 1;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(ARCHER_POS.x, ARCHER_POS.y);
      const aimLength = 50 + (charging ? aimPower * 3 : 0);
      ctx.lineTo(
        ARCHER_POS.x + Math.cos(aimAngle) * aimLength,
        ARCHER_POS.y + Math.sin(aimAngle) * aimLength
      );
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Draw targets
    targets.forEach(target => {
      if (target.hit) return;
      
      ctx.fillStyle = target.color;
      ctx.shadowColor = target.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Target rings
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.radius * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.radius * 0.4, 0, Math.PI * 2);
      ctx.stroke();
      
      // Value text
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(target.value.toString(), target.x, target.y + 4);
    });

    // Draw arrows
    arrowsInFlight.forEach(arrow => {
      ctx.save();
      ctx.translate(arrow.x, arrow.y);
      ctx.rotate(arrow.angle);
      
      ctx.fillStyle = '#ffff00';
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 8;
      ctx.fillRect(-10, -1, 20, 2);
      ctx.fillRect(8, -3, 4, 6); // Arrow head
      
      ctx.restore();
      ctx.shadowBlur = 0;
    });

    // Draw particles
    particles.forEach(particle => {
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw power meter
    if (charging) {
      const meterWidth = 200;
      const meterHeight = 20;
      const meterX = CANVAS_WIDTH / 2 - meterWidth / 2;
      const meterY = 50;
      
      ctx.fillStyle = '#333';
      ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
      
      const powerPercent = aimPower / MAX_POWER;
      ctx.fillStyle = powerPercent > 0.8 ? '#ff0000' : powerPercent > 0.5 ? '#ffaa00' : '#00ff00';
      ctx.fillRect(meterX, meterY, meterWidth * powerPercent, meterHeight);
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
    }

    // Draw UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Level: ${level}`, 20, 55);
    ctx.fillText(`Arrows: ${arrows}`, 20, 80);
    
    const targetsLeft = targets.filter(t => !t.hit).length;
    ctx.fillText(`Targets: ${targetsLeft}`, 20, 105);

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px monospace';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.fillText(`Level Reached: ${level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
      ctx.textAlign = 'left';
    }

    if (gameState === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ffffff';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.textAlign = 'left';
    }
  });

  useEffect(() => {
    generateTargets();
  }, [generateTargets]);

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore(0);
    setArrows(10);
    setLevel(1);
    setArrowsInFlight([]);
    setParticles([]);
    setCharging(false);
    setAimPower(0);
    generateTargets();
    setGameState('playing');
  };

  return (
    <GameLayout
      gameTitle="Astro Archer"
      gameCategory="Action"
      score={score}
      isPlaying={gameState === 'playing'}
      onPause={handlePause}
      onReset={handleReset}
    >
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border border-neon-green/50 rounded-lg bg-black/20 backdrop-blur-sm shadow-2xl max-w-full h-auto"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }}
          />
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p className="md:hidden">Touch and hold to charge, release to shoot</p>
            <p className="hidden md:block">Aim with mouse • Hold and release to shoot • Hit all targets</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default AstroArcher;
