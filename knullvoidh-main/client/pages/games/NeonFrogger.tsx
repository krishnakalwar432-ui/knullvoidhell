import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Player {
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  moving: boolean;
  targetX: number;
  targetY: number;
}

interface Vehicle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  lane: number;
  type: 'car' | 'truck' | 'bike' | 'hovercar';
  color: string;
}

interface Log {
  x: number;
  y: number;
  width: number;
  speed: number;
  lane: number;
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

const NeonFrogger = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const GRID_SIZE = 40;
  const GRID_WIDTH = 20;
  const GRID_HEIGHT = 15;

  const [gameState, setGameState] = useState({
    player: {
      x: GRID_SIZE * 9.5,
      y: GRID_SIZE * 14.5,
      gridX: 9,
      gridY: 14,
      moving: false,
      targetX: GRID_SIZE * 9.5,
      targetY: GRID_SIZE * 14.5
    } as Player,
    vehicles: [] as Vehicle[],
    logs: [] as Log[],
    particles: [] as Particle[],
    score: 0,
    lives: 3,
    level: 1,
    gameOver: false,
    onLog: false,
    logSpeed: 0,
    bestY: 14,
    timeBonus: 300,
    lastVehicleSpawn: 0,
    gameStarted: false
  });

  const vehicleTypes = {
    car: { width: 60, height: 30, speed: 2, color: '#ff0080' },
    truck: { width: 80, height: 35, speed: 1.5, color: '#00ff80' },
    bike: { width: 40, height: 25, speed: 3, color: '#ffff00' },
    hovercar: { width: 70, height: 32, speed: 2.5, color: '#00ffff' }
  };

  const createParticles = (x: number, y: number, color: string, count: number = 8) => {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = Math.random() * 4 + 2;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30, maxLife: 30, color, size: Math.random() * 3 + 1
      });
    }
    return particles;
  };

  const spawnVehicle = useCallback((lane: number) => {
    const types = Object.keys(vehicleTypes) as (keyof typeof vehicleTypes)[];
    const type = types[Math.floor(Math.random() * types.length)];
    const vehicleData = vehicleTypes[type];
    
    const direction = lane % 2 === 0 ? 1 : -1; // Alternate directions
    const startX = direction === 1 ? -vehicleData.width : CANVAS_WIDTH + vehicleData.width;
    
    return {
      x: startX,
      y: GRID_SIZE * lane + GRID_SIZE / 2,
      width: vehicleData.width,
      height: vehicleData.height,
      speed: vehicleData.speed * direction * (1 + gameState.level * 0.2),
      lane,
      type,
      color: vehicleData.color
    };
  }, [gameState.level]);

  const spawnLog = useCallback((lane: number) => {
    const width = 80 + Math.random() * 80;
    const direction = lane % 2 === 0 ? 1 : -1;
    const startX = direction === 1 ? -width : CANVAS_WIDTH + width;
    
    return {
      x: startX,
      y: GRID_SIZE * lane + GRID_SIZE / 2,
      width,
      speed: (1 + Math.random()) * direction,
      lane
    };
  }, []);

  const checkCollision = (rect1: any, rect2: any) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + GRID_SIZE > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + GRID_SIZE > rect2.y;
  };

  const movePlayer = (dx: number, dy: number) => {
    if (gameState.player.moving) return;
    
    const newGridX = Math.max(0, Math.min(GRID_WIDTH - 1, gameState.player.gridX + dx));
    const newGridY = Math.max(0, Math.min(GRID_HEIGHT - 1, gameState.player.gridY + dy));
    
    if (newGridX !== gameState.player.gridX || newGridY !== gameState.player.gridY) {
      setGameState(prev => ({
        ...prev,
        player: {
          ...prev.player,
          gridX: newGridX,
          gridY: newGridY,
          targetX: newGridX * GRID_SIZE + GRID_SIZE / 2,
          targetY: newGridY * GRID_SIZE + GRID_SIZE / 2,
          moving: true
        },
        bestY: Math.min(prev.bestY, newGridY),
        score: prev.score + (newGridY < prev.bestY ? 10 : 0)
      }));
    }
  };

  const resetPlayer = () => {
    setGameState(prev => ({
      ...prev,
      player: {
        x: GRID_SIZE * 9.5,
        y: GRID_SIZE * 14.5,
        gridX: 9,
        gridY: 14,
        moving: false,
        targetX: GRID_SIZE * 9.5,
        targetY: GRID_SIZE * 14.5
      },
      lives: prev.lives - 1,
      particles: [...prev.particles, ...createParticles(prev.player.x, prev.player.y, '#ff0000', 12)]
    }));
  };

  const initializeLevel = useCallback(() => {
    const vehicles: Vehicle[] = [];
    const logs: Log[] = [];
    
    // Create initial vehicles for road lanes (2-6, 8-12)
    const roadLanes = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12];
    roadLanes.forEach(lane => {
      for (let i = 0; i < 2; i++) {
        const vehicle = spawnVehicle(lane);
        vehicle.x = (i * 200) + (lane % 2 === 0 ? 0 : 400);
        vehicles.push(vehicle);
      }
    });
    
    // Create initial logs for water lanes (1)
    const waterLanes = [1];
    waterLanes.forEach(lane => {
      for (let i = 0; i < 3; i++) {
        const log = spawnLog(lane);
        log.x = i * 150;
        logs.push(log);
      }
    });
    
    return { vehicles, logs };
  }, [spawnVehicle, spawnLog]);

  const update = useCallback(() => {
    if (gameState.gameOver || !gameState.gameStarted) return;

    setGameState(prev => {
      const newState = { ...prev };
      const keys = keysRef.current;
      const currentTime = Date.now();

      // Handle input
      if (!newState.player.moving) {
        if (keys.has('w') || keys.has('ArrowUp')) {
          movePlayer(0, -1);
        } else if (keys.has('s') || keys.has('ArrowDown')) {
          movePlayer(0, 1);
        } else if (keys.has('a') || keys.has('ArrowLeft')) {
          movePlayer(-1, 0);
        } else if (keys.has('d') || keys.has('ArrowRight')) {
          movePlayer(1, 0);
        }
      }

      // Update player movement animation
      if (newState.player.moving) {
        const dx = newState.player.targetX - newState.player.x;
        const dy = newState.player.targetY - newState.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 2) {
          newState.player.x = newState.player.targetX;
          newState.player.y = newState.player.targetY;
          newState.player.moving = false;
        } else {
          const speed = 8;
          newState.player.x += (dx / distance) * speed;
          newState.player.y += (dy / distance) * speed;
        }
      }

      // Update vehicles
      newState.vehicles.forEach(vehicle => {
        vehicle.x += vehicle.speed;
        
        // Remove vehicles that are off screen
        if (vehicle.speed > 0 && vehicle.x > CANVAS_WIDTH + vehicle.width) {
          vehicle.x = -vehicle.width;
        } else if (vehicle.speed < 0 && vehicle.x < -vehicle.width) {
          vehicle.x = CANVAS_WIDTH + vehicle.width;
        }
      });

      // Spawn new vehicles occasionally
      if (currentTime - newState.lastVehicleSpawn > 3000) {
        const roadLanes = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12];
        const randomLane = roadLanes[Math.floor(Math.random() * roadLanes.length)];
        newState.vehicles.push(spawnVehicle(randomLane));
        newState.lastVehicleSpawn = currentTime;
      }

      // Update logs
      newState.logs.forEach(log => {
        log.x += log.speed;
        
        // Wrap logs around screen
        if (log.speed > 0 && log.x > CANVAS_WIDTH + log.width) {
          log.x = -log.width;
        } else if (log.speed < 0 && log.x < -log.width) {
          log.x = CANVAS_WIDTH + log.width;
        }
      });

      // Check if player is on a log
      newState.onLog = false;
      newState.logSpeed = 0;
      
      if (newState.player.gridY === 1) { // Water lane
        newState.logs.forEach(log => {
          if (newState.player.x > log.x && 
              newState.player.x < log.x + log.width &&
              Math.abs(newState.player.y - log.y) < GRID_SIZE / 2) {
            newState.onLog = true;
            newState.logSpeed = log.speed;
          }
        });
        
        // If not on log in water, player drowns
        if (!newState.onLog) {
          resetPlayer();
          return newState;
        } else {
          // Move player with the log
          newState.player.x += newState.logSpeed;
          newState.player.targetX += newState.logSpeed;
          
          // Check if player fell off the screen
          if (newState.player.x < 0 || newState.player.x > CANVAS_WIDTH) {
            resetPlayer();
            return newState;
          }
        }
      }

      // Check vehicle collisions
      newState.vehicles.forEach(vehicle => {
        if (checkCollision(newState.player, vehicle)) {
          resetPlayer();
          return;
        }
      });

      // Check win condition
      if (newState.player.gridY === 0) {
        newState.score += 100 + newState.timeBonus;
        newState.level++;
        
        // Reset for next level
        const { vehicles, logs } = initializeLevel();
        newState.vehicles = vehicles;
        newState.logs = logs;
        newState.player = {
          x: GRID_SIZE * 9.5,
          y: GRID_SIZE * 14.5,
          gridX: 9,
          gridY: 14,
          moving: false,
          targetX: GRID_SIZE * 9.5,
          targetY: GRID_SIZE * 14.5
        };
        newState.bestY = 14;
        newState.timeBonus = 300;
        
        // Add celebration particles
        newState.particles.push(...createParticles(CANVAS_WIDTH / 2, 50, '#ffff00', 20));
      }

      // Update time bonus
      if (newState.timeBonus > 0) {
        newState.timeBonus--;
      }

      // Check game over
      if (newState.lives <= 0) {
        newState.gameOver = true;
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

      return newState;
    });
  }, [gameState.gameOver, gameState.gameStarted, initializeLevel, spawnVehicle]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with digital background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(0.5, '#002244');
    gradient.addColorStop(1, '#000066');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= GRID_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * GRID_SIZE, 0);
      ctx.lineTo(x * GRID_SIZE, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= GRID_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * GRID_SIZE);
      ctx.lineTo(canvas.width, y * GRID_SIZE);
      ctx.stroke();
    }

    // Draw lanes
    // Safe zones
    ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, GRID_SIZE); // Goal
    ctx.fillRect(0, GRID_SIZE * 7, canvas.width, GRID_SIZE); // Middle safe zone
    ctx.fillRect(0, GRID_SIZE * 13, canvas.width, GRID_SIZE * 2); // Start zone

    // Water
    ctx.fillStyle = 'rgba(0, 100, 255, 0.3)';
    ctx.fillRect(0, GRID_SIZE, canvas.width, GRID_SIZE);

    // Roads
    ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
    for (let i = 2; i <= 6; i++) {
      ctx.fillRect(0, GRID_SIZE * i, canvas.width, GRID_SIZE);
    }
    for (let i = 8; i <= 12; i++) {
      ctx.fillRect(0, GRID_SIZE * i, canvas.width, GRID_SIZE);
    }

    // Draw logs
    gameState.logs.forEach(log => {
      ctx.fillStyle = '#8B4513';
      ctx.shadowColor = '#654321';
      ctx.shadowBlur = 5;
      ctx.fillRect(log.x, log.y - 15, log.width, 30);
      
      // Log details
      ctx.fillStyle = '#654321';
      ctx.fillRect(log.x + 10, log.y - 10, log.width - 20, 20);
      ctx.shadowBlur = 0;
    });

    // Draw vehicles
    gameState.vehicles.forEach(vehicle => {
      ctx.fillStyle = vehicle.color;
      ctx.shadowColor = vehicle.color;
      ctx.shadowBlur = 10;
      ctx.fillRect(vehicle.x, vehicle.y - vehicle.height / 2, vehicle.width, vehicle.height);
      
      // Vehicle glow effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(vehicle.x + 5, vehicle.y - vehicle.height / 2 + 5, vehicle.width - 10, vehicle.height - 10);
      
      ctx.shadowBlur = 0;
    });

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
    const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
    ctx.fillStyle = gameState.onLog ? '#00ff00' : '#ffff00';
    ctx.shadowColor = gameState.onLog ? '#00ff00' : '#ffff00';
    ctx.shadowBlur = 15 * pulse;
    ctx.beginPath();
    ctx.arc(gameState.player.x, gameState.player.y, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Player eyes
    ctx.fillStyle = 'black';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(gameState.player.x - 5, gameState.player.y - 3, 2, 0, Math.PI * 2);
    ctx.arc(gameState.player.x + 5, gameState.player.y - 3, 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw UI
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, 60);
    
    ctx.fillStyle = '#00ffff';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${gameState.score}`, 20, 25);
    ctx.fillText(`Lives: ${gameState.lives}`, 20, 45);
    ctx.fillText(`Level: ${gameState.level}`, 150, 25);
    ctx.fillText(`Time Bonus: ${gameState.timeBonus}`, 150, 45);

    if (!gameState.gameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#00ffff';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('NEON FROGGER', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.fillText('Press SPACE to start!', canvas.width / 2, canvas.height / 2 + 20);
      ctx.font = '16px Arial';
      ctx.fillText('WASD: Move | Cross to the top!', canvas.width / 2, canvas.height / 2 + 60);
    }

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#ff0080';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.fillStyle = '#00ffff';
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText(`Level Reached: ${gameState.level}`, canvas.width / 2, canvas.height / 2 + 30);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 70);
    }
  }, [gameState]);

  useEffect(() => {
    const { vehicles, logs } = initializeLevel();
    setGameState(prev => ({ ...prev, vehicles, logs }));
  }, [initializeLevel]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' && gameState.gameOver) {
        const { vehicles, logs } = initializeLevel();
        setGameState({
          player: {
            x: GRID_SIZE * 9.5, y: GRID_SIZE * 14.5, gridX: 9, gridY: 14,
            moving: false, targetX: GRID_SIZE * 9.5, targetY: GRID_SIZE * 14.5
          },
          vehicles, logs, particles: [], score: 0, lives: 3, level: 1,
          gameOver: false, onLog: false, logSpeed: 0, bestY: 14, timeBonus: 300,
          lastVehicleSpawn: 0, gameStarted: false
        });
        return;
      }
      
      if (e.key === ' ' && !gameState.gameStarted) {
        setGameState(prev => ({ ...prev, gameStarted: true }));
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
  }, [gameState.gameOver, gameState.gameStarted, initializeLevel]);

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
      gameTitle="Neon Frogger" 
      gameCategory="Digital highway crossing"
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
          <p>WASD/Arrows: Move | Space: Start | R: Restart</p>
          <p className="text-sm text-cyan-400">Cross digital highways and data streams to reach the top!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default NeonFrogger;
