import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Position {
  x: number;
  y: number;
}

interface CyberObject extends Position {
  id: number;
  type: 'data' | 'virus' | 'bomb';
  vx: number;
  vy: number;
  size: number;
  sliced: boolean;
  color: string;
  rotation: number;
  rotationSpeed: number;
}

interface SlashEffect {
  id: number;
  points: Position[];
  life: number;
}

interface Particle extends Position {
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

const CyberSlash: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [objects, setObjects] = useState<CyberObject[]>([]);
  const [slashEffects, setSlashEffects] = useState<SlashEffect[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isSlashing, setIsSlashing] = useState(false);
  const [slashPath, setSlashPath] = useState<Position[]>([]);

  const gameLoopRef = useRef<number>();
  const objectIdRef = useRef(0);
  const slashIdRef = useRef(0);
  const comboTimeoutRef = useRef<NodeJS.Timeout>();

  // Game constants
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const GRAVITY = 0.5;

  // Create particles
  const createParticles = useCallback((x: number, y: number, color: string, count: number = 10) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15 - 5,
        life: 1.0,
        color,
        size: Math.random() * 5 + 2
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Spawn cyber objects
  const spawnObject = useCallback(() => {
    const types: ('data' | 'virus' | 'bomb')[] = ['data', 'data', 'data', 'virus', 'bomb'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let color = '#0aff9d';
    let size = 40;
    
    switch (type) {
      case 'data':
        color = '#0aff9d';
        size = 35 + Math.random() * 15;
        break;
      case 'virus':
        color = '#ff0099';
        size = 30 + Math.random() * 10;
        break;
      case 'bomb':
        color = '#ff4444';
        size = 45;
        break;
    }

    const x = Math.random() * (CANVAS_WIDTH - 100) + 50;
    const vx = (Math.random() - 0.5) * 8;
    const vy = -(Math.random() * 8 + 10);

    setObjects(prev => [...prev, {
      id: objectIdRef.current++,
      x,
      y: CANVAS_HEIGHT + size,
      type,
      vx,
      vy,
      size,
      sliced: false,
      color,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 10
    }]);
  }, []);

  // Handle pointer events
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsSlashing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    
    setSlashPath([{ x, y }]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isSlashing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    
    setSlashPath(prev => {
      const newPath = [...prev, { x, y }];
      return newPath.slice(-20); // Keep only last 20 points
    });

    // Check for object collisions along slash path
    if (slashPath.length > 0) {
      const lastPoint = slashPath[slashPath.length - 1];
      const dx = x - lastPoint.x;
      const dy = y - lastPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 10) { // Only check if moved significantly
        objects.forEach(obj => {
          if (!obj.sliced) {
            const objDx = obj.x - x;
            const objDy = obj.y - y;
            const objDistance = Math.sqrt(objDx * objDx + objDy * objDy);
            
            if (objDistance < obj.size / 2) {
              setObjects(prev => prev.map(o => 
                o.id === obj.id ? { ...o, sliced: true } : o
              ));

              if (obj.type === 'data') {
                setScore(prev => prev + (10 * (combo + 1)));
                setCombo(prev => prev + 1);
                createParticles(obj.x, obj.y, obj.color, 15);
                
                // Reset combo timeout
                if (comboTimeoutRef.current) {
                  clearTimeout(comboTimeoutRef.current);
                }
                comboTimeoutRef.current = setTimeout(() => {
                  setCombo(0);
                }, 1000);
              } else if (obj.type === 'virus') {
                setScore(prev => prev + (20 * (combo + 1)));
                setCombo(prev => prev + 1);
                createParticles(obj.x, obj.y, obj.color, 20);
              } else if (obj.type === 'bomb') {
                setLives(prev => prev - 1);
                setCombo(0);
                createParticles(obj.x, obj.y, '#ff4444', 25);
                
                // Screen shake effect
                if (canvas) {
                  canvas.style.transform = 'translate(5px, 5px)';
                  setTimeout(() => {
                    canvas.style.transform = 'translate(-5px, -5px)';
                    setTimeout(() => {
                      canvas.style.transform = 'translate(0px, 0px)';
                    }, 50);
                  }, 50);
                }
              }

              // Add slash effect
              setSlashEffects(prev => [...prev, {
                id: slashIdRef.current++,
                points: [...slashPath],
                life: 1.0
              }]);
            }
          }
        });
      }
    }
  };

  const handlePointerUp = () => {
    setIsSlashing(false);
    setSlashPath([]);
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      // Move objects
      setObjects(prev => prev
        .map(obj => ({
          ...obj,
          x: obj.x + obj.vx,
          y: obj.y + obj.vy,
          vy: obj.vy + GRAVITY,
          rotation: obj.rotation + obj.rotationSpeed
        }))
        .filter(obj => {
          // Remove objects that fell off screen
          if (obj.y > CANVAS_HEIGHT + obj.size && !obj.sliced && obj.type === 'data') {
            setLives(prev => prev - 1);
            return false;
          }
          return obj.y < CANVAS_HEIGHT + obj.size + 100;
        })
      );

      // Update particles
      setParticles(prev => prev
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.3,
          life: p.life - 0.02,
          size: p.size * 0.98
        }))
        .filter(p => p.life > 0)
      );

      // Update slash effects
      setSlashEffects(prev => prev
        .map(effect => ({ ...effect, life: effect.life - 0.05 }))
        .filter(effect => effect.life > 0)
      );

      // Spawn new objects
      if (Math.random() < 0.03) {
        spawnObject();
      }

      // Check game over
      if (lives <= 0) {
        setGameState('gameOver');
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, objects, lives, spawnObject, createParticles, slashPath, combo]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with cyber background
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0a0a0f');
    gradient.addColorStop(0.5, '#1a0a2a');
    gradient.addColorStop(1, '#0f0f1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid pattern
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < CANVAS_WIDTH; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i < CANVAS_HEIGHT; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_WIDTH, i);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Draw objects
    objects.forEach(obj => {
      if (!obj.sliced) {
        ctx.save();
        ctx.translate(obj.x, obj.y);
        ctx.rotate(obj.rotation * Math.PI / 180);
        
        ctx.fillStyle = obj.color;
        ctx.shadowColor = obj.color;
        ctx.shadowBlur = 15;
        
        if (obj.type === 'data') {
          // Draw hexagon
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = Math.cos(angle) * obj.size / 2;
            const y = Math.sin(angle) * obj.size / 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
        } else if (obj.type === 'virus') {
          // Draw spiky circle
          ctx.beginPath();
          for (let i = 0; i < 16; i++) {
            const angle = (i * Math.PI) / 8;
            const radius = i % 2 === 0 ? obj.size / 2 : obj.size / 3;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
        } else if (obj.type === 'bomb') {
          // Draw warning symbol
          ctx.fillRect(-obj.size/2, -obj.size/2, obj.size, obj.size);
          ctx.fillStyle = '#000';
          ctx.font = `${obj.size/2}px monospace`;
          ctx.textAlign = 'center';
          ctx.fillText('!', 0, obj.size/6);
        }
        
        ctx.restore();
        ctx.shadowBlur = 0;
      }
    });

    // Draw particles
    particles.forEach(particle => {
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1;

    // Draw slash effects
    slashEffects.forEach(effect => {
      if (effect.points.length > 1) {
        ctx.globalAlpha = effect.life;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.moveTo(effect.points[0].x, effect.points[0].y);
        effect.points.forEach(point => {
          ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    });
    ctx.globalAlpha = 1;

    // Draw current slash
    if (isSlashing && slashPath.length > 1) {
      ctx.strokeStyle = '#0aff9d';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#0aff9d';
      ctx.shadowBlur = 8;
      
      ctx.beginPath();
      ctx.moveTo(slashPath[0].x, slashPath[0].y);
      slashPath.forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px monospace';
    ctx.fillText(`Score: ${score}`, 20, 40);
    
    // Draw lives
    for (let i = 0; i < lives; i++) {
      ctx.fillStyle = '#ff0099';
      ctx.fillRect(20 + i * 30, 60, 20, 20);
    }
    
    // Draw combo
    if (combo > 1) {
      ctx.fillStyle = '#0aff9d';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`COMBO x${combo}`, CANVAS_WIDTH / 2, 50);
      ctx.textAlign = 'left';
    }

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

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore(0);
    setLives(3);
    setCombo(0);
    setObjects([]);
    setSlashEffects([]);
    setParticles([]);
    setIsSlashing(false);
    setSlashPath([]);
    setGameState('playing');
    
    if (comboTimeoutRef.current) {
      clearTimeout(comboTimeoutRef.current);
    }
  };

  return (
    <GameLayout
      gameTitle="Cyber Slash"
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
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{ touchAction: 'none' }}
          />
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Slash through data blocks and viruses • Avoid bombs</p>
            <p>Build combos for higher scores</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default CyberSlash;
