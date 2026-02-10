import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  onGround: boolean;
  phasing: boolean;
  phaseEnergy: number;
  maxPhaseEnergy: number;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'solid' | 'quantum' | 'moving' | 'disappearing';
  solid: boolean;
  originalY?: number;
  direction?: number;
  timer?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

const QuantumLeap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const GRAVITY = 0.8;
  const JUMP_FORCE = -15;
  const MOVE_SPEED = 5;

  const [gameState, setGameState] = useState({
    player: {
      x: 100,
      y: 400,
      vx: 0,
      vy: 0,
      width: 30,
      height: 30,
      onGround: false,
      phasing: false,
      phaseEnergy: 100,
      maxPhaseEnergy: 100
    } as Player,
    platforms: [] as Platform[],
    particles: [] as Particle[],
    cameraX: 0,
    level: 1,
    checkpoints: [{ x: 100, y: 400 }],
    currentCheckpoint: 0,
    gameOver: false,
    victory: false,
    score: 0
  });

  const initializePlatforms = useCallback(() => {
    const platforms: Platform[] = [
      // Starting area
      { x: 50, y: 450, width: 200, height: 20, type: 'solid', solid: true },
      
      // Basic platforms
      { x: 300, y: 400, width: 120, height: 20, type: 'solid', solid: true },
      { x: 500, y: 350, width: 100, height: 20, type: 'quantum', solid: true },
      
      // Moving platforms
      { x: 650, y: 300, width: 80, height: 20, type: 'moving', solid: true, originalY: 300, direction: 1 },
      
      // Quantum platforms (can phase through)
      { x: 800, y: 250, width: 100, height: 20, type: 'quantum', solid: true },
      { x: 950, y: 200, width: 120, height: 20, type: 'quantum', solid: true },
      
      // Disappearing platforms
      { x: 1100, y: 300, width: 80, height: 20, type: 'disappearing', solid: true, timer: 0 },
      { x: 1250, y: 250, width: 80, height: 20, type: 'disappearing', solid: true, timer: 60 },
      
      // More challenging section
      { x: 1400, y: 200, width: 60, height: 20, type: 'quantum', solid: true },
      { x: 1500, y: 150, width: 60, height: 20, type: 'moving', solid: true, originalY: 150, direction: -1 },
      { x: 1650, y: 100, width: 100, height: 20, type: 'solid', solid: true },
      
      // Final area
      { x: 1800, y: 150, width: 200, height: 20, type: 'solid', solid: true },
      
      // Ground platforms
      { x: 0, y: 580, width: 2200, height: 20, type: 'solid', solid: true }
    ];
    return platforms;
  }, []);

  const createParticles = (x: number, y: number, color: string, count: number = 8) => {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = Math.random() * 3 + 2;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30, maxLife: 30, color, size: Math.random() * 3 + 1
      });
    }
    return particles;
  };

  const checkCollision = (rect1: any, rect2: any) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  };

  const update = useCallback(() => {
    if (gameState.gameOver || gameState.victory) return;

    setGameState(prev => {
      const newState = { ...prev };
      const keys = keysRef.current;

      // Handle input
      if (keys.has('a') || keys.has('ArrowLeft')) {
        newState.player.vx = -MOVE_SPEED;
      } else if (keys.has('d') || keys.has('ArrowRight')) {
        newState.player.vx = MOVE_SPEED;
      } else {
        newState.player.vx *= 0.8; // Friction
      }

      if ((keys.has('w') || keys.has(' ') || keys.has('ArrowUp')) && newState.player.onGround) {
        newState.player.vy = JUMP_FORCE;
        newState.player.onGround = false;
      }

      // Phase ability
      if (keys.has('s') || keys.has('ArrowDown')) {
        if (newState.player.phaseEnergy > 0) {
          newState.player.phasing = true;
          newState.player.phaseEnergy -= 2;
          // Add phasing particles
          if (Math.random() < 0.3) {
            newState.particles.push(...createParticles(
              newState.player.x + newState.player.width / 2,
              newState.player.y + newState.player.height / 2,
              '#00ffff', 3
            ));
          }
        }
      } else {
        newState.player.phasing = false;
        if (newState.player.phaseEnergy < newState.player.maxPhaseEnergy) {
          newState.player.phaseEnergy += 1;
        }
      }

      // Apply gravity
      newState.player.vy += GRAVITY;

      // Update player position
      newState.player.x += newState.player.vx;
      newState.player.y += newState.player.vy;

      // Update platforms
      newState.platforms.forEach(platform => {
        if (platform.type === 'moving' && platform.originalY !== undefined) {
          platform.y += platform.direction! * 2;
          if (Math.abs(platform.y - platform.originalY) > 100) {
            platform.direction! *= -1;
          }
        } else if (platform.type === 'disappearing') {
          platform.timer = (platform.timer || 0) + 1;
          if (platform.timer > 120) {
            platform.solid = !platform.solid;
            platform.timer = 0;
          }
        }
      });

      // Collision detection
      newState.player.onGround = false;
      
      newState.platforms.forEach(platform => {
        if (!platform.solid && platform.type !== 'quantum') return;
        if (platform.type === 'quantum' && newState.player.phasing) return;
        
        if (checkCollision(newState.player, platform)) {
          // Landing on top
          if (newState.player.vy > 0 && 
              newState.player.y < platform.y && 
              newState.player.y + newState.player.height > platform.y) {
            newState.player.y = platform.y - newState.player.height;
            newState.player.vy = 0;
            newState.player.onGround = true;
          }
          // Hitting from below
          else if (newState.player.vy < 0 && 
                   newState.player.y > platform.y + platform.height) {
            newState.player.y = platform.y + platform.height;
            newState.player.vy = 0;
          }
          // Side collisions
          else if (newState.player.vx > 0) {
            newState.player.x = platform.x - newState.player.width;
            newState.player.vx = 0;
          } else if (newState.player.vx < 0) {
            newState.player.x = platform.x + platform.width;
            newState.player.vx = 0;
          }
        }
      });

      // Camera follow player
      const targetCameraX = newState.player.x - CANVAS_WIDTH / 2;
      newState.cameraX += (targetCameraX - newState.cameraX) * 0.1;

      // Check if reached end
      if (newState.player.x > 1900) {
        newState.victory = true;
        newState.score += 1000;
      }

      // Check if fell off the world
      if (newState.player.y > CANVAS_HEIGHT + 100) {
        newState.player.x = newState.checkpoints[newState.currentCheckpoint].x;
        newState.player.y = newState.checkpoints[newState.currentCheckpoint].y;
        newState.player.vx = 0;
        newState.player.vy = 0;
        newState.score = Math.max(0, newState.score - 50);
      }

      // Update particles
      newState.particles = newState.particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        return particle.life > 0;
      });

      // Update score based on progress
      const progress = Math.floor(newState.player.x / 100);
      newState.score = Math.max(newState.score, progress * 10);

      return newState;
    });
  }, [gameState.gameOver, gameState.victory]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with quantum space background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(1, '#000033');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save context for camera
    ctx.save();
    ctx.translate(-gameState.cameraX, 0);

    // Draw platforms
    gameState.platforms.forEach(platform => {
      let color = '#666666';
      let alpha = 1;
      
      switch (platform.type) {
        case 'solid':
          color = '#888888';
          break;
        case 'quantum':
          color = '#00ffff';
          alpha = platform.solid ? 0.8 : 0.3;
          break;
        case 'moving':
          color = '#ffaa00';
          break;
        case 'disappearing':
          color = '#ff6600';
          alpha = platform.solid ? 1 : 0.3;
          break;
      }
      
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      
      // Add glow for quantum platforms
      if (platform.type === 'quantum') {
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        ctx.shadowBlur = 0;
      }
    });

    ctx.globalAlpha = 1;

    // Draw particles
    gameState.particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw player
    if (gameState.player.phasing) {
      ctx.globalAlpha = 0.5;
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 15;
    }
    
    ctx.fillStyle = gameState.player.phasing ? '#00ffff' : '#ff6600';
    ctx.fillRect(gameState.player.x, gameState.player.y, gameState.player.width, gameState.player.height);
    
    // Player glow effect
    ctx.shadowColor = gameState.player.phasing ? '#00ffff' : '#ff6600';
    ctx.shadowBlur = gameState.player.phasing ? 20 : 5;
    ctx.fillRect(
      gameState.player.x + 5, 
      gameState.player.y + 5, 
      gameState.player.width - 10, 
      gameState.player.height - 10
    );
    
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Restore context
    ctx.restore();

    // Draw UI
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, 60);
    
    ctx.fillStyle = '#00ffff';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${gameState.score}`, 20, 25);
    ctx.fillText(`Phase Energy: ${Math.floor(gameState.player.phaseEnergy)}%`, 20, 45);
    
    // Phase energy bar
    const energyPercent = gameState.player.phaseEnergy / gameState.player.maxPhaseEnergy;
    ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.fillRect(200, 30, 200, 10);
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(200, 30, 200 * energyPercent, 10);

    ctx.fillText('Progress:', 450, 25);
    const progress = Math.min(100, (gameState.player.x / 1900) * 100);
    ctx.fillText(`${progress.toFixed(0)}%`, 450, 45);

    if (gameState.victory) {
      ctx.fillStyle = 'rgba(0, 100, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#00FF00';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Quantum Mastery!', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.fillStyle = '#00ffff';
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 50);
    }
  }, [gameState]);

  useEffect(() => {
    setGameState(prev => ({ ...prev, platforms: initializePlatforms() }));
  }, [initializePlatforms]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' && gameState.victory) {
        setGameState({
          player: {
            x: 100, y: 400, vx: 0, vy: 0, width: 30, height: 30,
            onGround: false, phasing: false, phaseEnergy: 100, maxPhaseEnergy: 100
          },
          platforms: initializePlatforms(),
          particles: [],
          cameraX: 0, level: 1, checkpoints: [{ x: 100, y: 400 }],
          currentCheckpoint: 0, gameOver: false, victory: false, score: 0
        });
        return;
      }
      
      keysRef.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.victory, initializePlatforms]);

  useEffect(() => {
    gameLoopRef.current = setInterval(() => {
      update();
      render();
    }, 1000 / 60);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [update, render]);

  return (
    <GameLayout 
      gameTitle="Quantum Leap" 
      gameCategory="Quantum platformer"
      showMobileControls={true}
    >
      <div className="flex flex-col items-center gap-4 p-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-cyan-400 bg-black rounded-lg max-w-full h-auto"
          style={{ boxShadow: '0 0 20px #00ffff' }}
        />
        <div className="text-center text-gray-300">
          <p>WASD/Arrows: Move & Jump | Hold S/Down: Phase through quantum platforms | R: Restart</p>
          <p className="text-sm text-cyan-400">Use quantum phasing to pass through blue platforms and reach the end!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default QuantumLeap;
