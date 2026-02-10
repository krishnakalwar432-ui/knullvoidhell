import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'wall' | 'toxic' | 'spike' | 'gas';
}

interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  life: number;
  color: string;
}

interface Powerup {
  x: number;
  y: number;
  type: 'speed' | 'shield' | 'jump' | 'health';
  collected: boolean;
}

const ToxicTunnelRunner = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());
  
  const [gameState, setGameState] = useState({
    player: { 
      x: 100, 
      y: 400, 
      dy: 0, 
      grounded: false, 
      health: 100, 
      shield: 0, 
      speed: 5,
      toxicResistance: 100
    },
    obstacles: [] as Obstacle[],
    particles: [] as Particle[],
    powerups: [] as Powerup[],
    score: 0,
    distance: 0,
    gameOver: false,
    speed: 3,
    tunnelOffset: 0
  });

  const addParticle = (x: number, y: number, color: string, count: number = 5) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x,
        y,
        dx: (Math.random() - 0.5) * 8,
        dy: (Math.random() - 0.5) * 8,
        life: 30 + Math.random() * 30,
        color
      });
    }
    setGameState(prev => ({
      ...prev,
      particles: [...prev.particles, ...newParticles]
    }));
  };

  const generateObstacles = useCallback((startX: number) => {
    const obstacles: Obstacle[] = [];
    const canvas = canvasRef.current;
    if (!canvas) return obstacles;

    for (let x = startX; x < startX + 1600; x += 200 + Math.random() * 300) {
      const obstacleType = Math.random();
      
      if (obstacleType < 0.3) {
        // Wall obstacle
        const height = 100 + Math.random() * 200;
        const isTop = Math.random() < 0.5;
        obstacles.push({
          x,
          y: isTop ? 0 : canvas.height - height,
          width: 40,
          height,
          type: 'wall'
        });
      } else if (obstacleType < 0.5) {
        // Toxic pool
        obstacles.push({
          x,
          y: canvas.height - 40,
          width: 120,
          height: 40,
          type: 'toxic'
        });
      } else if (obstacleType < 0.7) {
        // Spikes
        obstacles.push({
          x,
          y: canvas.height - 30,
          width: 80,
          height: 30,
          type: 'spike'
        });
      } else {
        // Gas cloud
        obstacles.push({
          x,
          y: 200 + Math.random() * 200,
          width: 100,
          height: 80,
          type: 'gas'
        });
      }
    }

    return obstacles;
  }, []);

  const generatePowerups = useCallback((startX: number) => {
    const powerups: Powerup[] = [];
    
    for (let x = startX; x < startX + 1600; x += 400 + Math.random() * 200) {
      if (Math.random() < 0.3) {
        const types: Powerup['type'][] = ['speed', 'shield', 'jump', 'health'];
        powerups.push({
          x,
          y: 300 + Math.random() * 200,
          type: types[Math.floor(Math.random() * types.length)],
          collected: false
        });
      }
    }

    return powerups;
  }, []);

  const initializeGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      player: { 
        x: 100, 
        y: 400, 
        dy: 0, 
        grounded: false, 
        health: 100, 
        shield: 0, 
        speed: 5,
        toxicResistance: 100
      },
      obstacles: generateObstacles(800),
      powerups: generatePowerups(800),
      particles: [],
      score: 0,
      distance: 0,
      gameOver: false,
      speed: 3,
      tunnelOffset: 0
    }));
  }, [generateObstacles, generatePowerups]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.gameOver) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with tunnel effect
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a0f2e');
    gradient.addColorStop(0.5, '#0f051a');
    gradient.addColorStop(1, '#2e1a0f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setGameState(prev => {
      const newState = { ...prev };
      
      // Update tunnel animation
      newState.tunnelOffset += newState.speed;

      // Handle player movement
      if (keysRef.current.has('ArrowUp') || keysRef.current.has(' ') || keysRef.current.has('w')) {
        if (newState.player.grounded) {
          newState.player.dy = -15;
          newState.player.grounded = false;
        }
      }
      if (keysRef.current.has('ArrowDown') || keysRef.current.has('s')) {
        newState.player.dy += 2; // Fast fall
      }

      // Apply gravity and update player position
      newState.player.dy += 0.8;
      newState.player.y += newState.player.dy;

      // Ground collision
      if (newState.player.y >= canvas.height - 50) {
        newState.player.y = canvas.height - 50;
        newState.player.dy = 0;
        newState.player.grounded = true;
      }

      // Ceiling collision
      if (newState.player.y <= 0) {
        newState.player.y = 0;
        newState.player.dy = 0;
      }

      // Update distance and speed
      newState.distance += newState.speed;
      newState.speed = Math.min(8, 3 + newState.distance / 1000);
      newState.score = Math.floor(newState.distance / 10);

      // Move obstacles
      newState.obstacles = newState.obstacles.map(obstacle => ({
        ...obstacle,
        x: obstacle.x - newState.speed
      }));

      // Move powerups
      newState.powerups = newState.powerups.map(powerup => ({
        ...powerup,
        x: powerup.x - newState.speed
      }));

      // Generate new obstacles
      const lastObstacleX = Math.max(...newState.obstacles.map(o => o.x), 0);
      if (lastObstacleX < canvas.width + 800) {
        newState.obstacles.push(...generateObstacles(lastObstacleX + 400));
      }

      // Generate new powerups
      const lastPowerupX = Math.max(...newState.powerups.map(p => p.x), 0);
      if (lastPowerupX < canvas.width + 800) {
        newState.powerups.push(...generatePowerups(lastPowerupX + 400));
      }

      // Remove off-screen obstacles and powerups
      newState.obstacles = newState.obstacles.filter(o => o.x > -200);
      newState.powerups = newState.powerups.filter(p => p.x > -50);

      // Check obstacle collisions
      newState.obstacles.forEach(obstacle => {
        const playerHit = (
          newState.player.x < obstacle.x + obstacle.width &&
          newState.player.x + 40 > obstacle.x &&
          newState.player.y < obstacle.y + obstacle.height &&
          newState.player.y + 40 > obstacle.y
        );

        if (playerHit) {
          let damage = 0;
          switch (obstacle.type) {
            case 'wall':
            case 'spike':
              damage = newState.player.shield > 0 ? 0 : 50;
              break;
            case 'toxic':
              damage = Math.max(0, 20 - newState.player.toxicResistance / 5);
              newState.player.toxicResistance = Math.max(0, newState.player.toxicResistance - 10);
              break;
            case 'gas':
              damage = Math.max(0, 15 - newState.player.toxicResistance / 10);
              newState.player.toxicResistance = Math.max(0, newState.player.toxicResistance - 5);
              break;
          }

          if (damage > 0) {
            if (newState.player.shield > 0) {
              newState.player.shield = Math.max(0, newState.player.shield - damage);
            } else {
              newState.player.health -= damage;
              addParticle(newState.player.x + 20, newState.player.y + 20, '#ff0099', 8);
            }
          }

          if (newState.player.health <= 0) {
            newState.gameOver = true;
          }
        }
      });

      // Check powerup collection
      newState.powerups.forEach(powerup => {
        if (!powerup.collected) {
          const playerHit = Math.hypot(
            (newState.player.x + 20) - (powerup.x + 15),
            (newState.player.y + 20) - (powerup.y + 15)
          ) < 25;

          if (playerHit) {
            powerup.collected = true;
            addParticle(powerup.x + 15, powerup.y + 15, '#0aff9d', 10);
            
            switch (powerup.type) {
              case 'health':
                newState.player.health = Math.min(100, newState.player.health + 30);
                break;
              case 'shield':
                newState.player.shield = Math.min(100, newState.player.shield + 50);
                break;
              case 'speed':
                newState.player.speed = Math.min(8, newState.player.speed + 1);
                break;
              case 'jump':
                newState.player.dy = -20;
                break;
            }
          }
        }
      });

      // Update particles
      newState.particles = newState.particles.map(particle => ({
        ...particle,
        x: particle.x + particle.dx,
        y: particle.y + particle.dy,
        dy: particle.dy + 0.2,
        life: particle.life - 1
      })).filter(particle => particle.life > 0);

      // Regenerate toxic resistance slowly
      newState.player.toxicResistance = Math.min(100, newState.player.toxicResistance + 0.1);

      // Decrease shield over time
      if (newState.player.shield > 0) {
        newState.player.shield = Math.max(0, newState.player.shield - 0.2);
      }

      return newState;
    });

    // Render tunnel walls
    ctx.strokeStyle = '#4a4a8a';
    ctx.lineWidth = 3;
    for (let i = 0; i < canvas.width; i += 50) {
      const offset = (gameState.tunnelOffset + i) % 100;
      ctx.beginPath();
      ctx.moveTo(i - offset, 0);
      ctx.lineTo(i - offset + 20, 0);
      ctx.moveTo(i - offset, canvas.height);
      ctx.lineTo(i - offset + 20, canvas.height);
      ctx.stroke();
    }

    // Draw obstacles
    gameState.obstacles.forEach(obstacle => {
      switch (obstacle.type) {
        case 'wall':
          ctx.fillStyle = '#666666';
          ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
          ctx.strokeStyle = '#999999';
          ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
          break;
        case 'toxic':
          ctx.fillStyle = '#00ff44';
          ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
          ctx.fillStyle = 'rgba(0, 255, 68, 0.3)';
          ctx.fillRect(obstacle.x, obstacle.y - 20, obstacle.width, 20);
          break;
        case 'spike':
          ctx.fillStyle = '#ff6600';
          ctx.beginPath();
          for (let i = 0; i < obstacle.width; i += 20) {
            ctx.moveTo(obstacle.x + i, obstacle.y + obstacle.height);
            ctx.lineTo(obstacle.x + i + 10, obstacle.y);
            ctx.lineTo(obstacle.x + i + 20, obstacle.y + obstacle.height);
          }
          ctx.fill();
          break;
        case 'gas':
          ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
          ctx.beginPath();
          ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, obstacle.width/2, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
    });

    // Draw powerups
    gameState.powerups.forEach(powerup => {
      if (!powerup.collected) {
        let color = '#0aff9d';
        switch (powerup.type) {
          case 'health': color = '#ff0099'; break;
          case 'shield': color = '#7000ff'; break;
          case 'speed': color = '#ff6600'; break;
          case 'jump': color = '#0aff9d'; break;
        }
        
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(powerup.x + 15, powerup.y + 15, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // Draw particles
    gameState.particles.forEach(particle => {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.life / 60;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Draw player
    const playerColor = gameState.player.shield > 0 ? '#7000ff' : 
                       gameState.player.toxicResistance < 30 ? '#ff6600' : '#0aff9d';
    ctx.fillStyle = playerColor;
    ctx.shadowColor = playerColor;
    ctx.shadowBlur = 15;
    ctx.fillRect(gameState.player.x, gameState.player.y, 40, 40);
    ctx.shadowBlur = 0;

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText(`Distance: ${Math.floor(gameState.distance)}m`, 10, 30);
    ctx.fillText(`Health: ${Math.floor(gameState.player.health)}`, 10, 55);
    ctx.fillText(`Shield: ${Math.floor(gameState.player.shield)}`, 10, 80);
    ctx.fillText(`Toxic Resistance: ${Math.floor(gameState.player.toxicResistance)}`, 10, 105);
    ctx.fillText(`Speed: ${gameState.speed.toFixed(1)}`, 10, 130);

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TUNNEL COLLAPSED', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px monospace';
      ctx.fillText(`Distance: ${Math.floor(gameState.distance)}m`, canvas.width / 2, canvas.height / 2 + 40);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 70);
    }

    ctx.textAlign = 'left';
  }, [gameState, generateObstacles, generatePowerups]);

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
      keysRef.current.add(e.key);
      
      if (e.key.toLowerCase() === 'r' && gameState.gameOver) {
        initializeGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.gameOver, initializeGame]);

  return (
    <GameLayout 
      gameTitle="Toxic Tunnel Runner"
      gameCategory="Endless running through toxic tunnels"
    >
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg shadow-2xl"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        <div className="text-center space-y-2">
          <p className="text-gray-300">Up/Space/W: Jump | Down/S: Fast Fall</p>
          <p className="text-gray-400">Avoid obstacles and toxic hazards!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default ToxicTunnelRunner;
