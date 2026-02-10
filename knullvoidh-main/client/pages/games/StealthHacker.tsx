import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Position {
  x: number;
  y: number;
}

interface Player extends Position {
  angle: number;
  visible: boolean;
  hacking: boolean;
}

interface Guard extends Position {
  angle: number;
  alertLevel: number;
  patrolPath: Position[];
  currentTarget: number;
  detectionRange: number;
  viewAngle: number;
}

interface Terminal extends Position {
  id: number;
  hacked: boolean;
  hackProgress: number;
  required: boolean;
}

interface Camera extends Position {
  id: number;
  angle: number;
  disabled: boolean;
  detectionRange: number;
}

const StealthHacker: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'caught' | 'complete'>('playing');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [detectionLevel, setDetectionLevel] = useState(0);
  const [player, setPlayer] = useState<Player>({
    x: 50,
    y: 50,
    angle: 0,
    visible: false,
    hacking: false
  });
  const [guards, setGuards] = useState<Guard[]>([]);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());

  const gameLoopRef = useRef<number>();
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const MOVE_SPEED = 2;

  // Initialize level
  const initializeLevel = useCallback(() => {
    // Generate guards
    const newGuards: Guard[] = [];
    for (let i = 0; i < level + 1; i++) {
      const guard: Guard = {
        x: 200 + i * 200,
        y: 200 + i * 100,
        angle: 0,
        alertLevel: 0,
        patrolPath: [
          { x: 200 + i * 200, y: 200 + i * 100 },
          { x: 300 + i * 200, y: 200 + i * 100 },
          { x: 300 + i * 200, y: 300 + i * 100 },
          { x: 200 + i * 200, y: 300 + i * 100 }
        ],
        currentTarget: 0,
        detectionRange: 80,
        viewAngle: Math.PI / 3
      };
      newGuards.push(guard);
    }

    // Generate terminals
    const newTerminals: Terminal[] = [];
    for (let i = 0; i < 3 + level; i++) {
      newTerminals.push({
        id: i,
        x: 100 + (i % 3) * 300,
        y: 400 + Math.floor(i / 3) * 150,
        hacked: false,
        hackProgress: 0,
        required: i < 2 + level
      });
    }

    // Generate cameras
    const newCameras: Camera[] = [];
    for (let i = 0; i < level; i++) {
      newCameras.push({
        id: i,
        x: 400 + i * 200,
        y: 100 + i * 150,
        angle: 0,
        disabled: false,
        detectionRange: 120
      });
    }

    setGuards(newGuards);
    setTerminals(newTerminals);
    setCameras(newCameras);
  }, [level]);

  // Check if player is in line of sight
  const isInLineOfSight = useCallback((observer: Position, target: Position, angle: number, viewAngle: number, range: number): boolean => {
    const dx = target.x - observer.x;
    const dy = target.y - observer.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > range) return false;
    
    const targetAngle = Math.atan2(dy, dx);
    const angleDiff = Math.abs(targetAngle - angle);
    
    return angleDiff < viewAngle / 2 || angleDiff > Math.PI * 2 - viewAngle / 2;
  }, []);

  // Handle input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => new Set([...prev, e.key.toLowerCase()]));
      
      if (e.key === ' ' || e.key === 'e') {
        // Start hacking nearest terminal
        const nearestTerminal = terminals.find(terminal => {
          const dx = terminal.x - player.x;
          const dy = terminal.y - player.y;
          return Math.sqrt(dx * dx + dy * dy) < 30 && !terminal.hacked;
        });
        
        if (nearestTerminal) {
          setPlayer(prev => ({ ...prev, hacking: true }));
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(e.key.toLowerCase());
        return newKeys;
      });
      
      if (e.key === ' ' || e.key === 'e') {
        setPlayer(prev => ({ ...prev, hacking: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [player, terminals]);

  // Touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((touch.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;

    // Move towards touch point or hack if near terminal
    const dx = x - player.x;
    const dy = y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 50) {
      // Check for nearby terminal
      const nearestTerminal = terminals.find(terminal => {
        const tdx = terminal.x - player.x;
        const tdy = terminal.y - player.y;
        return Math.sqrt(tdx * tdx + tdy * tdy) < 30 && !terminal.hacked;
      });
      
      if (nearestTerminal) {
        setPlayer(prev => ({ ...prev, hacking: true }));
      }
    }
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      // Move player
      setPlayer(prev => {
        let newX = prev.x;
        let newY = prev.y;
        let moving = false;

        if (keys.has('w') || keys.has('arrowup')) {
          newY = Math.max(20, prev.y - MOVE_SPEED);
          moving = true;
        }
        if (keys.has('s') || keys.has('arrowdown')) {
          newY = Math.min(CANVAS_HEIGHT - 20, prev.y + MOVE_SPEED);
          moving = true;
        }
        if (keys.has('a') || keys.has('arrowleft')) {
          newX = Math.max(20, prev.x - MOVE_SPEED);
          moving = true;
        }
        if (keys.has('d') || keys.has('arrowright')) {
          newX = Math.min(CANVAS_WIDTH - 20, prev.x + MOVE_SPEED);
          moving = true;
        }

        // Update angle based on movement
        if (moving) {
          const dx = newX - prev.x;
          const dy = newY - prev.y;
          const angle = Math.atan2(dy, dx);
          return { ...prev, x: newX, y: newY, angle };
        }

        return { ...prev, x: newX, y: newY };
      });

      // Move guards on patrol
      setGuards(prev => prev.map(guard => {
        const target = guard.patrolPath[guard.currentTarget];
        const dx = target.x - guard.x;
        const dy = target.y - guard.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 10) {
          return {
            ...guard,
            currentTarget: (guard.currentTarget + 1) % guard.patrolPath.length
          };
        }

        const moveX = (dx / distance) * 1;
        const moveY = (dy / distance) * 1;
        const angle = Math.atan2(dy, dx);

        return {
          ...guard,
          x: guard.x + moveX,
          y: guard.y + moveY,
          angle
        };
      }));

      // Rotate cameras
      setCameras(prev => prev.map(camera => ({
        ...camera,
        angle: camera.angle + 0.02
      })));

      // Check detection
      let detected = false;
      
      // Guard detection
      guards.forEach(guard => {
        if (isInLineOfSight(guard, player, guard.angle, guard.viewAngle, guard.detectionRange)) {
          detected = true;
        }
      });

      // Camera detection
      cameras.forEach(camera => {
        if (!camera.disabled && isInLineOfSight(camera, player, camera.angle, Math.PI / 4, camera.detectionRange)) {
          detected = true;
        }
      });

      if (detected) {
        setDetectionLevel(prev => Math.min(100, prev + 2));
      } else {
        setDetectionLevel(prev => Math.max(0, prev - 1));
      }

      // Check if caught
      if (detectionLevel >= 100) {
        setGameState('caught');
      }

      // Handle hacking
      if (player.hacking) {
        setTerminals(prev => prev.map(terminal => {
          const dx = terminal.x - player.x;
          const dy = terminal.y - player.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 30 && !terminal.hacked) {
            const newProgress = terminal.hackProgress + 2;
            if (newProgress >= 100) {
              setScore(s => s + (terminal.required ? 200 : 100));
              return { ...terminal, hacked: true, hackProgress: 100 };
            }
            return { ...terminal, hackProgress: newProgress };
          }
          return terminal;
        }));
      }

      // Check win condition
      const requiredTerminals = terminals.filter(t => t.required);
      const hackedRequired = requiredTerminals.filter(t => t.hacked);
      
      if (hackedRequired.length === requiredTerminals.length && requiredTerminals.length > 0) {
        setLevel(prev => prev + 1);
        setScore(prev => prev + 500);
        setDetectionLevel(0);
        setGameState('complete');
        
        setTimeout(() => {
          initializeLevel();
          setGameState('playing');
        }, 2000);
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, keys, player, guards, cameras, terminals, detectionLevel, isInLineOfSight, initializeLevel]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid floor
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Draw terminals
    terminals.forEach(terminal => {
      ctx.fillStyle = terminal.hacked ? '#0aff9d' : terminal.required ? '#ff0099' : '#7000ff';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.fillRect(terminal.x - 15, terminal.y - 15, 30, 30);
      
      // Hack progress
      if (terminal.hackProgress > 0 && !terminal.hacked) {
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(terminal.x - 15, terminal.y - 20, (terminal.hackProgress / 100) * 30, 3);
      }
      
      ctx.shadowBlur = 0;
    });

    // Draw guards with vision cones
    guards.forEach(guard => {
      // Vision cone
      ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.moveTo(guard.x, guard.y);
      ctx.arc(guard.x, guard.y, guard.detectionRange, 
              guard.angle - guard.viewAngle/2, 
              guard.angle + guard.viewAngle/2);
      ctx.closePath();
      ctx.fill();
      
      // Guard
      ctx.fillStyle = '#ff0000';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Direction indicator
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(guard.x, guard.y);
      ctx.lineTo(guard.x + Math.cos(guard.angle) * 15, guard.y + Math.sin(guard.angle) * 15);
      ctx.stroke();
    });

    // Draw cameras with vision cones
    cameras.forEach(camera => {
      if (!camera.disabled) {
        // Vision cone
        ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
        ctx.beginPath();
        ctx.moveTo(camera.x, camera.y);
        ctx.arc(camera.x, camera.y, camera.detectionRange, 
                camera.angle - Math.PI/8, 
                camera.angle + Math.PI/8);
        ctx.closePath();
        ctx.fill();
      }
      
      // Camera
      ctx.fillStyle = camera.disabled ? '#666' : '#ffff00';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.fillRect(camera.x - 8, camera.y - 8, 16, 16);
      ctx.shadowBlur = 0;
    });

    // Draw player
    ctx.fillStyle = detectionLevel > 50 ? '#ff6600' : '#0aff9d';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = player.hacking ? 15 : 10;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw detection meter
    const meterWidth = 200;
    const meterHeight = 20;
    const meterX = CANVAS_WIDTH - meterWidth - 20;
    const meterY = 20;
    
    ctx.fillStyle = '#333';
    ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
    
    const detectionColor = detectionLevel > 70 ? '#ff0000' : detectionLevel > 40 ? '#ffaa00' : '#00ff00';
    ctx.fillStyle = detectionColor;
    ctx.fillRect(meterX, meterY, (detectionLevel / 100) * meterWidth, meterHeight);
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DETECTION', meterX + meterWidth/2, meterY - 5);

    // Draw UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Level: ${level}`, 20, 30);
    ctx.fillText(`Score: ${score}`, 20, 50);
    
    const requiredHacked = terminals.filter(t => t.required && t.hacked).length;
    const requiredTotal = terminals.filter(t => t.required).length;
    ctx.fillText(`Targets: ${requiredHacked}/${requiredTotal}`, 20, 70);

    if (player.hacking) {
      ctx.fillStyle = '#0aff9d';
      ctx.fillText('HACKING...', 20, CANVAS_HEIGHT - 20);
    }

    if (gameState === 'caught') {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ffffff';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CAUGHT!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.font = '24px monospace';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.textAlign = 'left';
    }

    if (gameState === 'complete') {
      ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ffffff';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('INFILTRATION COMPLETE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.font = '24px monospace';
      ctx.fillText(`Level ${level} Complete!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
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
    initializeLevel();
  }, [initializeLevel]);

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore(0);
    setLevel(1);
    setDetectionLevel(0);
    setPlayer({
      x: 50,
      y: 50,
      angle: 0,
      visible: false,
      hacking: false
    });
    initializeLevel();
    setGameState('playing');
  };

  return (
    <GameLayout
      gameTitle="Stealth Hacker"
      gameCategory="Stealth"
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
            style={{ touchAction: 'none' }}
          />
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p className="md:hidden">Touch to move • Touch near terminals to hack</p>
            <p className="hidden md:block">WASD to move • Space/E to hack terminals • Avoid detection</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default StealthHacker;
