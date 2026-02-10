import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Laser {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  damage: number;
  duration: number;
  width: number;
}

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  health: number;
  shields: number;
  lastShot: number;
  charging: boolean;
  chargeLevel: number;
}

interface PowerUp {
  x: number;
  y: number;
  type: 'health' | 'shield' | 'rapidfire' | 'megablast';
  rotation: number;
  collected: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

const LaserArenaChaos = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef({ x: 0, y: 0, down: false });
  
  const [gameState, setGameState] = useState({
    player: { 
      x: 400, y: 300, vx: 0, vy: 0, health: 100, shields: 100, 
      lastShot: 0, charging: false, chargeLevel: 0 
    } as Player,
    lasers: [] as Laser[],
    powerUps: [] as PowerUp[],
    particles: [] as Particle[],
    score: 0,
    wave: 1,
    enemiesDestroyed: 0,
    gameOver: false,
    laserCooldown: 0,
    rapidFire: 0,
    megaBlast: 0,
    chaos: 0
  });

  const addParticles = (x: number, y: number, color: string, count: number = 10) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 30 + Math.random() * 20,
        color,
        size: 2 + Math.random() * 4
      });
    }
    setGameState(prev => ({
      ...prev,
      particles: [...prev.particles, ...newParticles]
    }));
  };

  const createLaser = (x1: number, y1: number, x2: number, y2: number, 
                      color: string, damage: number, width: number = 3) => {
    setGameState(prev => ({
      ...prev,
      lasers: [...prev.lasers, { x1, y1, x2, y2, color, damage, duration: 15, width }]
    }));
    addParticles(x2, y2, color, 5);
  };

  const spawnPowerUp = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const types: PowerUp['type'][] = ['health', 'shield', 'rapidfire', 'megablast'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    setGameState(prev => ({
      ...prev,
      powerUps: [...prev.powerUps, {
        x: 100 + Math.random() * (canvas.width - 200),
        y: 100 + Math.random() * (canvas.height - 200),
        type,
        rotation: 0,
        collected: false
      }]
    }));
  };

  const generateRandomLasers = (intensity: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    for (let i = 0; i < intensity; i++) {
      // Random laser origins from arena edges
      const side = Math.floor(Math.random() * 4);
      let x1: number, y1: number, x2: number, y2: number;
      
      switch (side) {
        case 0: // Top
          x1 = Math.random() * canvas.width;
          y1 = 0;
          break;
        case 1: // Right
          x1 = canvas.width;
          y1 = Math.random() * canvas.height;
          break;
        case 2: // Bottom
          x1 = Math.random() * canvas.width;
          y1 = canvas.height;
          break;
        default: // Left
          x1 = 0;
          y1 = Math.random() * canvas.height;
          break;
      }

      // Target random point in arena
      x2 = Math.random() * canvas.width;
      y2 = Math.random() * canvas.height;

      const colors = ['#ff0099', '#0aff9d', '#7000ff', '#ff6600', '#ffff00'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      createLaser(x1, y1, x2, y2, color, 15 + Math.random() * 25, 2 + Math.random() * 4);
    }
  };

  const checkLaserCollision = (px: number, py: number, laser: Laser): boolean => {
    const A = laser.y2 - laser.y1;
    const B = laser.x1 - laser.x2;
    const C = laser.x2 * laser.y1 - laser.x1 * laser.y2;
    
    const distance = Math.abs(A * px + B * py + C) / Math.sqrt(A * A + B * B);
    
    // Check if point is on the line segment
    const dotProduct = (px - laser.x1) * (laser.x2 - laser.x1) + (py - laser.y1) * (laser.y2 - laser.y1);
    const squaredLength = (laser.x2 - laser.x1) ** 2 + (laser.y2 - laser.y1) ** 2;
    const param = dotProduct / squaredLength;
    
    return distance < laser.width + 15 && param >= 0 && param <= 1;
  };

  const initializeGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      player: { 
        x: 400, y: 300, vx: 0, vy: 0, health: 100, shields: 100, 
        lastShot: 0, charging: false, chargeLevel: 0 
      },
      lasers: [],
      powerUps: [],
      particles: [],
      gameOver: false,
      laserCooldown: 0,
      rapidFire: 0,
      megaBlast: 0,
      chaos: 0,
      enemiesDestroyed: 0
    }));
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.gameOver) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with neon arena effect
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setGameState(prev => {
      const newState = { ...prev };
      const currentTime = Date.now();

      // Increase chaos level over time
      newState.chaos = Math.min(100, newState.chaos + 0.1);

      // Handle player movement with momentum
      const acceleration = 0.5;
      const friction = 0.85;
      const maxSpeed = 6;

      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) {
        newState.player.vx = Math.max(-maxSpeed, newState.player.vx - acceleration);
      }
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) {
        newState.player.vx = Math.min(maxSpeed, newState.player.vx + acceleration);
      }
      if (keysRef.current.has('ArrowUp') || keysRef.current.has('w')) {
        newState.player.vy = Math.max(-maxSpeed, newState.player.vy - acceleration);
      }
      if (keysRef.current.has('ArrowDown') || keysRef.current.has('s')) {
        newState.player.vy = Math.min(maxSpeed, newState.player.vy + acceleration);
      }

      // Apply friction
      newState.player.vx *= friction;
      newState.player.vy *= friction;

      // Update position
      newState.player.x += newState.player.vx;
      newState.player.y += newState.player.vy;

      // Keep player in bounds
      newState.player.x = Math.max(15, Math.min(canvas.width - 15, newState.player.x));
      newState.player.y = Math.max(15, Math.min(canvas.height - 15, newState.player.y));

      // Handle charging
      if (mouseRef.current.down) {
        newState.player.charging = true;
        newState.player.chargeLevel = Math.min(100, newState.player.chargeLevel + 3);
      } else if (newState.player.charging) {
        // Release charged shot
        const dx = mouseRef.current.x - newState.player.x;
        const dy = mouseRef.current.y - newState.player.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance > 0) {
          const damage = 20 + (newState.player.chargeLevel / 100) * 60;
          const width = 2 + (newState.player.chargeLevel / 100) * 8;
          const color = newState.player.chargeLevel > 80 ? '#ffff00' : 
                       newState.player.chargeLevel > 50 ? '#ff6600' : '#0aff9d';
          
          createLaser(
            newState.player.x, newState.player.y,
            newState.player.x + (dx / distance) * 600,
            newState.player.y + (dy / distance) * 600,
            color, damage, width
          );
          
          newState.score += Math.floor(newState.player.chargeLevel / 10);
        }
        
        newState.player.charging = false;
        newState.player.chargeLevel = 0;
      }

      // Rapid fire mode
      if (newState.rapidFire > 0) {
        newState.rapidFire--;
        if (currentTime - newState.player.lastShot > 100) {
          const angle = Math.random() * Math.PI * 2;
          const range = 300;
          createLaser(
            newState.player.x, newState.player.y,
            newState.player.x + Math.cos(angle) * range,
            newState.player.y + Math.sin(angle) * range,
            '#ff0099', 25, 3
          );
          newState.player.lastShot = currentTime;
        }
      }

      // Generate random arena lasers based on chaos level
      if (Math.random() < (newState.chaos / 100) * 0.1) {
        generateRandomLasers(1 + Math.floor(newState.chaos / 25));
      }

      // Update lasers
      newState.lasers = newState.lasers.map(laser => ({
        ...laser,
        duration: laser.duration - 1
      })).filter(laser => laser.duration > 0);

      // Check laser collisions with player
      newState.lasers.forEach(laser => {
        if (checkLaserCollision(newState.player.x, newState.player.y, laser)) {
          let damage = laser.damage;
          
          if (newState.player.shields > 0) {
            newState.player.shields = Math.max(0, newState.player.shields - damage);
            damage = Math.max(0, damage - newState.player.shields);
          }
          
          if (damage > 0) {
            newState.player.health -= damage;
            addParticles(newState.player.x, newState.player.y, '#ff0099', 8);
            
            if (newState.player.health <= 0) {
              newState.gameOver = true;
            }
          }
        }
      });

      // Update power-ups
      newState.powerUps = newState.powerUps.map(powerUp => ({
        ...powerUp,
        rotation: powerUp.rotation + 0.1
      }));

      // Check power-up collection
      newState.powerUps.forEach(powerUp => {
        if (!powerUp.collected) {
          const distance = Math.hypot(
            newState.player.x - powerUp.x,
            newState.player.y - powerUp.y
          );
          
          if (distance < 25) {
            powerUp.collected = true;
            addParticles(powerUp.x, powerUp.y, '#0aff9d', 15);
            
            switch (powerUp.type) {
              case 'health':
                newState.player.health = Math.min(100, newState.player.health + 40);
                break;
              case 'shield':
                newState.player.shields = Math.min(100, newState.player.shields + 60);
                break;
              case 'rapidfire':
                newState.rapidFire = 300;
                break;
              case 'megablast':
                // Clear all lasers
                newState.lasers = [];
                newState.score += 500;
                addParticles(newState.player.x, newState.player.y, '#ffff00', 30);
                break;
            }
          }
        }
      });

      newState.powerUps = newState.powerUps.filter(p => !p.collected);

      // Spawn power-ups randomly
      if (Math.random() < 0.003) {
        spawnPowerUp();
      }

      // Update particles
      newState.particles = newState.particles.map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        vx: particle.vx * 0.98,
        vy: particle.vy * 0.98,
        life: particle.life - 1,
        size: particle.size * 0.98
      })).filter(particle => particle.life > 0);

      // Regenerate shields slowly
      if (newState.player.shields < 100) {
        newState.player.shields = Math.min(100, newState.player.shields + 0.2);
      }

      // Update cooldowns
      if (newState.laserCooldown > 0) newState.laserCooldown--;

      return newState;
    });

    // Draw arena grid
    ctx.strokeStyle = 'rgba(112, 0, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw lasers
    gameState.lasers.forEach(laser => {
      const alpha = laser.duration / 15;
      ctx.globalAlpha = alpha;
      
      ctx.strokeStyle = laser.color;
      ctx.lineWidth = laser.width;
      ctx.shadowColor = laser.color;
      ctx.shadowBlur = 15;
      
      ctx.beginPath();
      ctx.moveTo(laser.x1, laser.y1);
      ctx.lineTo(laser.x2, laser.y2);
      ctx.stroke();
      
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });

    // Draw particles
    gameState.particles.forEach(particle => {
      ctx.globalAlpha = particle.life / 50;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Draw power-ups
    gameState.powerUps.forEach(powerUp => {
      if (!powerUp.collected) {
        let color = '#0aff9d';
        let symbol = '♦';
        
        switch (powerUp.type) {
          case 'health':
            color = '#ff0099';
            symbol = '♥';
            break;
          case 'shield':
            color = '#7000ff';
            symbol = '♦';
            break;
          case 'rapidfire':
            color = '#ff6600';
            symbol = '●';
            break;
          case 'megablast':
            color = '#ffff00';
            symbol = '★';
            break;
        }
        
        ctx.save();
        ctx.translate(powerUp.x, powerUp.y);
        ctx.rotate(powerUp.rotation);
        
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.font = '24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(symbol, 0, 8);
        
        ctx.restore();
        ctx.shadowBlur = 0;
      }
    });

    // Draw player
    const playerColor = gameState.player.shields > 0 ? '#7000ff' : 
                       gameState.rapidFire > 0 ? '#ff6600' : '#0aff9d';
    
    ctx.fillStyle = playerColor;
    ctx.shadowColor = playerColor;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(gameState.player.x, gameState.player.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw charging indicator
    if (gameState.player.charging) {
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(gameState.player.x, gameState.player.y, 20 + gameState.player.chargeLevel / 5, 0, 
              (gameState.player.chargeLevel / 100) * Math.PI * 2);
      ctx.stroke();
    }

    // Draw aim line
    if (gameState.player.charging) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(gameState.player.x, gameState.player.y);
      ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Health: ${Math.floor(gameState.player.health)}`, 10, 25);
    ctx.fillText(`Shields: ${Math.floor(gameState.player.shields)}`, 10, 45);
    ctx.fillText(`Score: ${gameState.score}`, 10, 65);
    ctx.fillText(`Chaos: ${Math.floor(gameState.chaos)}%`, 10, 85);
    
    if (gameState.rapidFire > 0) {
      ctx.fillText(`Rapid Fire: ${Math.floor(gameState.rapidFire / 60)}s`, 10, 105);
    }

    // Charge meter
    if (gameState.player.charging) {
      ctx.fillStyle = '#333333';
      ctx.fillRect(canvas.width - 120, 20, 100, 10);
      ctx.fillStyle = gameState.player.chargeLevel > 80 ? '#ffff00' : 
                     gameState.player.chargeLevel > 50 ? '#ff6600' : '#0aff9d';
      ctx.fillRect(canvas.width - 120, 20, gameState.player.chargeLevel, 10);
    }

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LASER OVERLOAD', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px monospace';
      ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 40);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 70);
    }

    ctx.textAlign = 'left';
  }, [gameState]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    if (!gameState.gameOver) {
      gameLoopRef.current = setInterval(gameLoop, 1000 / 60);
    }
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameLoop, gameState.gameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      
      if (e.key.toLowerCase() === 'r' && gameState.gameOver) {
        initializeGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        mouseRef.current.x = e.clientX - rect.left;
        mouseRef.current.y = e.clientY - rect.top;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      mouseRef.current.down = true;
    };

    const handleMouseUp = () => {
      mouseRef.current.down = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    if (canvasRef.current) {
      canvasRef.current.addEventListener('mousemove', handleMouseMove);
      canvasRef.current.addEventListener('mousedown', handleMouseDown);
      canvasRef.current.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('mousemove', handleMouseMove);
        canvasRef.current.removeEventListener('mousedown', handleMouseDown);
        canvasRef.current.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [gameState.gameOver, initializeGame]);

  return (
    <GameLayout
      gameTitle="Laser Arena Chaos"
      gameCategory="Chaotic laser battles in neon arenas"
    >
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg shadow-2xl cursor-none"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        <div className="text-center space-y-2">
          <p className="text-gray-300">WASD: Move | Mouse: Aim | Hold to Charge | Release to Fire</p>
          <p className="text-gray-400">Survive the chaotic laser arena and collect power-ups!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default LaserArenaChaos;
