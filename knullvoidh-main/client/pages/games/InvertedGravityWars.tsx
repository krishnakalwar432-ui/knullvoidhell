import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Ship {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  health: number;
  energy: number;
  type: 'player' | 'enemy' | 'heavy' | 'scout';
  gravityField: number;
  lastShot: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  affectedByGravity: boolean;
  isPlayerProjectile: boolean;
  life: number;
}

interface GravityWell {
  x: number;
  y: number;
  strength: number;
  radius: number;
  inverted: boolean;
  life: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const InvertedGravityWars = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef({ x: 0, y: 0, down: false });
  
  const [gameState, setGameState] = useState({
    playerShip: { 
      x: 100, y: 300, vx: 0, vy: 0, angle: 0, health: 100, energy: 100,
      type: 'player' as const, gravityField: 0, lastShot: 0
    },
    enemyShips: [] as Ship[],
    projectiles: [] as Projectile[],
    gravityWells: [] as GravityWell[],
    particles: [] as Particle[],
    score: 0,
    wave: 1,
    gameOver: false,
    waveComplete: false,
    gravityInverted: false,
    globalGravity: 0.3
  });

  const addParticles = (x: number, y: number, color: string, count: number = 8) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 30 + Math.random() * 30,
        color
      });
    }
    setGameState(prev => ({
      ...prev,
      particles: [...prev.particles, ...newParticles]
    }));
  };

  const createGravityWell = (x: number, y: number, inverted: boolean = false) => {
    setGameState(prev => ({
      ...prev,
      gravityWells: [...prev.gravityWells, {
        x, y,
        strength: inverted ? -800 : 800,
        radius: 100,
        inverted,
        life: 300
      }]
    }));
  };

  const spawnEnemyShips = useCallback((wave: number) => {
    const ships: Ship[] = [];
    const canvas = canvasRef.current;
    if (!canvas) return ships;

    const baseCount = 2 + wave;
    
    for (let i = 0; i < baseCount; i++) {
      const side = Math.floor(Math.random() * 2); // Top or bottom
      let x: number, y: number;
      
      if (side === 0) {
        x = 600 + Math.random() * 150;
        y = 50 + Math.random() * 200;
      } else {
        x = 600 + Math.random() * 150;
        y = 350 + Math.random() * 200;
      }
      
      let type: Ship['type'] = 'enemy';
      let health = 60;
      
      if (wave > 2 && Math.random() < 0.3) {
        type = 'heavy';
        health = 100;
      } else if (wave > 4 && Math.random() < 0.2) {
        type = 'scout';
        health = 40;
      }

      ships.push({
        x, y,
        vx: -1 - Math.random(),
        vy: (Math.random() - 0.5) * 2,
        angle: Math.PI,
        health,
        energy: 100,
        type,
        gravityField: 0,
        lastShot: 0
      });
    }

    return ships;
  }, []);

  const initializeGame = useCallback(() => {
    const enemyShips = spawnEnemyShips(gameState.wave);
    
    // Create some initial gravity wells
    const gravityWells: GravityWell[] = [];
    for (let i = 0; i < 3; i++) {
      gravityWells.push({
        x: 200 + i * 200 + Math.random() * 100,
        y: 150 + Math.random() * 300,
        strength: (Math.random() > 0.5 ? 600 : -600),
        radius: 80 + Math.random() * 40,
        inverted: Math.random() > 0.5,
        life: Infinity // Persistent wells
      });
    }
    
    setGameState(prev => ({
      ...prev,
      playerShip: { 
        x: 100, y: 300, vx: 0, vy: 0, angle: 0, health: 100, energy: 100,
        type: 'player', gravityField: 0, lastShot: 0
      },
      enemyShips,
      projectiles: [],
      gravityWells,
      particles: [],
      gameOver: false,
      waveComplete: false,
      gravityInverted: false
    }));
  }, [gameState.wave, spawnEnemyShips]);

  const applyGravity = (object: { x: number; y: number; vx: number; vy: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Global gravity (inverted if needed)
    const gravity = gameState.gravityInverted ? -gameState.globalGravity : gameState.globalGravity;
    object.vy += gravity;

    // Gravity wells
    gameState.gravityWells.forEach(well => {
      const dx = well.x - object.x;
      const dy = well.y - object.y;
      const distance = Math.hypot(dx, dy);
      
      if (distance < well.radius && distance > 5) {
        const force = well.strength / (distance * distance);
        const forceX = (dx / distance) * force;
        const forceY = (dy / distance) * force;
        
        object.vx += forceX * 0.001;
        object.vy += forceY * 0.001;
      }
    });

    // Boundary wrapping for Y axis
    if (object.y < 0) {
      object.y = canvas.height;
    } else if (object.y > canvas.height) {
      object.y = 0;
    }
  };

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.gameOver) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with space background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#000022');
    gradient.addColorStop(0.5, '#000011');
    gradient.addColorStop(1, '#001122');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setGameState(prev => {
      const newState = { ...prev };
      const currentTime = Date.now();

      // Handle player input
      const thrustPower = 0.4;
      
      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) {
        newState.playerShip.angle -= 0.1;
      }
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) {
        newState.playerShip.angle += 0.1;
      }
      if (keysRef.current.has('ArrowUp') || keysRef.current.has('w')) {
        newState.playerShip.vx += Math.cos(newState.playerShip.angle) * thrustPower;
        newState.playerShip.vy += Math.sin(newState.playerShip.angle) * thrustPower;
        
        // Thrust particles
        addParticles(
          newState.playerShip.x - Math.cos(newState.playerShip.angle) * 20,
          newState.playerShip.y - Math.sin(newState.playerShip.angle) * 20,
          '#ff6600', 3
        );
      }

      // Player shooting
      if ((keysRef.current.has(' ') || mouseRef.current.down) && 
          currentTime - newState.playerShip.lastShot > 200) {
        
        const projectileSpeed = 8;
        const shootAngle = Math.atan2(
          mouseRef.current.y - newState.playerShip.y,
          mouseRef.current.x - newState.playerShip.x
        );
        
        newState.projectiles.push({
          x: newState.playerShip.x,
          y: newState.playerShip.y,
          vx: Math.cos(shootAngle) * projectileSpeed + newState.playerShip.vx * 0.5,
          vy: Math.sin(shootAngle) * projectileSpeed + newState.playerShip.vy * 0.5,
          damage: 25,
          affectedByGravity: true,
          isPlayerProjectile: true,
          life: 180
        });
        
        newState.playerShip.lastShot = currentTime;
        if (mouseRef.current.down) mouseRef.current.down = false;
      }

      // Gravity inversion toggle
      if (keysRef.current.has('g') && newState.playerShip.energy >= 30) {
        newState.gravityInverted = !newState.gravityInverted;
        newState.playerShip.energy -= 30;
        keysRef.current.delete('g');
        addParticles(newState.playerShip.x, newState.playerShip.y, '#ffff00', 15);
      }

      // Create gravity well
      if (keysRef.current.has('q') && newState.playerShip.energy >= 50) {
        createGravityWell(mouseRef.current.x, mouseRef.current.y, false);
        newState.playerShip.energy -= 50;
        keysRef.current.delete('q');
      }

      if (keysRef.current.has('e') && newState.playerShip.energy >= 50) {
        createGravityWell(mouseRef.current.x, mouseRef.current.y, true);
        newState.playerShip.energy -= 50;
        keysRef.current.delete('e');
      }

      // Apply gravity and update player ship
      applyGravity(newState.playerShip);
      newState.playerShip.x += newState.playerShip.vx;
      newState.playerShip.y += newState.playerShip.vy;

      // Apply drag
      newState.playerShip.vx *= 0.99;
      newState.playerShip.vy *= 0.99;

      // Keep player in horizontal bounds
      if (newState.playerShip.x < 0) {
        newState.playerShip.x = 0;
        newState.playerShip.vx = Math.abs(newState.playerShip.vx) * 0.5;
      } else if (newState.playerShip.x > canvas.width) {
        newState.playerShip.x = canvas.width;
        newState.playerShip.vx = -Math.abs(newState.playerShip.vx) * 0.5;
      }

      // Update enemy ships
      newState.enemyShips = newState.enemyShips.map(ship => {
        const updatedShip = { ...ship };
        
        // Simple AI: move towards player but avoid gravity wells
        const dx = newState.playerShip.x - ship.x;
        const dy = newState.playerShip.y - ship.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance > 200) {
          updatedShip.vx += (dx / distance) * 0.1;
          updatedShip.vy += (dy / distance) * 0.1;
        }

        // Apply gravity
        applyGravity(updatedShip);
        updatedShip.x += updatedShip.vx;
        updatedShip.y += updatedShip.vy;
        updatedShip.vx *= 0.98;
        updatedShip.vy *= 0.98;

        // Keep in bounds
        if (updatedShip.x < 0 || updatedShip.x > canvas.width) {
          updatedShip.vx *= -0.5;
          updatedShip.x = Math.max(0, Math.min(canvas.width, updatedShip.x));
        }

        // Enemy shooting
        if (distance < 300 && currentTime - ship.lastShot > 1500) {
          const shootAngle = Math.atan2(dy, dx);
          
          newState.projectiles.push({
            x: ship.x,
            y: ship.y,
            vx: Math.cos(shootAngle) * 5 + ship.vx * 0.3,
            vy: Math.sin(shootAngle) * 5 + ship.vy * 0.3,
            damage: 20,
            affectedByGravity: true,
            isPlayerProjectile: false,
            life: 150
          });
          
          updatedShip.lastShot = currentTime;
        }

        return updatedShip;
      });

      // Update projectiles
      newState.projectiles = newState.projectiles.filter(projectile => {
        if (projectile.affectedByGravity) {
          applyGravity(projectile);
        }
        
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;
        projectile.life--;

        // Remove off-screen or expired projectiles
        if (projectile.x < -50 || projectile.x > canvas.width + 50 || projectile.life <= 0) {
          return false;
        }

        // Check collisions
        if (projectile.isPlayerProjectile) {
          // Player projectile hitting enemies
          for (let i = newState.enemyShips.length - 1; i >= 0; i--) {
            const ship = newState.enemyShips[i];
            const hit = Math.hypot(projectile.x - ship.x, projectile.y - ship.y) < 20;
            
            if (hit) {
              ship.health -= projectile.damage;
              addParticles(projectile.x, projectile.y, '#ff0099', 6);
              
              if (ship.health <= 0) {
                newState.enemyShips.splice(i, 1);
                newState.score += ship.type === 'heavy' ? 200 : ship.type === 'scout' ? 150 : 100;
                addParticles(ship.x, ship.y, '#ffff00', 12);
              }
              
              return false;
            }
          }
        } else {
          // Enemy projectile hitting player
          const playerHit = Math.hypot(
            projectile.x - newState.playerShip.x,
            projectile.y - newState.playerShip.y
          ) < 20;
          
          if (playerHit) {
            newState.playerShip.health -= projectile.damage;
            addParticles(newState.playerShip.x, newState.playerShip.y, '#ff0099', 8);
            
            if (newState.playerShip.health <= 0) {
              newState.gameOver = true;
            }
            
            return false;
          }
        }

        return true;
      });

      // Update gravity wells
      newState.gravityWells = newState.gravityWells.map(well => ({
        ...well,
        life: well.life === Infinity ? Infinity : well.life - 1
      })).filter(well => well.life > 0);

      // Update particles
      newState.particles = newState.particles.map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        vx: particle.vx * 0.98,
        vy: particle.vy * 0.98,
        life: particle.life - 1
      })).filter(particle => particle.life > 0);

      // Check wave completion
      if (newState.enemyShips.length === 0 && !newState.waveComplete) {
        newState.waveComplete = true;
      }

      // Regenerate energy
      if (newState.playerShip.energy < 100) {
        newState.playerShip.energy = Math.min(100, newState.playerShip.energy + 0.3);
      }

      return newState;
    });

    // Draw stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
      const x = (i * 47) % canvas.width;
      const y = (i * 73) % canvas.height;
      ctx.globalAlpha = Math.random() * 0.8;
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw gravity wells
    gameState.gravityWells.forEach(well => {
      const gradient = ctx.createRadialGradient(well.x, well.y, 0, well.x, well.y, well.radius);
      
      if (well.inverted) {
        gradient.addColorStop(0, 'rgba(255, 0, 153, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 0, 153, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(112, 0, 255, 0.6)');
        gradient.addColorStop(1, 'rgba(112, 0, 255, 0)');
      }
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(well.x, well.y, well.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Well boundary
      ctx.strokeStyle = well.inverted ? '#ff0099' : '#7000ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(well.x, well.y, well.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw gravity field lines
    if (gameState.gravityInverted) {
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 10, canvas.height);
        ctx.stroke();
      }
    }

    // Draw particles
    gameState.particles.forEach(particle => {
      ctx.globalAlpha = particle.life / 60;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Draw projectiles
    gameState.projectiles.forEach(projectile => {
      const color = projectile.isPlayerProjectile ? '#0aff9d' : '#ff0099';
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw ships
    const drawShip = (ship: Ship, isPlayer: boolean = false) => {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);
      
      let color = '#666666';
      let size = 15;
      
      if (isPlayer) {
        color = gameState.gravityInverted ? '#ffff00' : '#0aff9d';
        size = 18;
      } else {
        switch (ship.type) {
          case 'heavy': color = '#ff6600'; size = 20; break;
          case 'scout': color = '#ff0099'; size = 12; break;
          default: color = '#7000ff'; break;
        }
      }
      
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      
      // Ship body (triangle)
      ctx.beginPath();
      ctx.moveTo(size, 0);
      ctx.lineTo(-size/2, -size/2);
      ctx.lineTo(-size/2, size/2);
      ctx.closePath();
      ctx.fill();
      
      ctx.shadowBlur = 0;
      ctx.restore();
      
      // Health bar
      if (!isPlayer || ship.health < 100) {
        ctx.fillStyle = '#333333';
        ctx.fillRect(ship.x - 20, ship.y - 30, 40, 4);
        ctx.fillStyle = isPlayer ? '#00ff00' : '#ff0000';
        const healthPercent = ship.health / (isPlayer ? 100 : (ship.type === 'heavy' ? 100 : ship.type === 'scout' ? 40 : 60));
        ctx.fillRect(ship.x - 20, ship.y - 30, 40 * healthPercent, 4);
      }
    };

    // Draw enemy ships
    gameState.enemyShips.forEach(ship => drawShip(ship, false));

    // Draw player ship
    drawShip(gameState.playerShip, true);

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Health: ${Math.floor(gameState.playerShip.health)}`, 10, 25);
    ctx.fillText(`Energy: ${Math.floor(gameState.playerShip.energy)}`, 10, 45);
    ctx.fillText(`Score: ${gameState.score}`, 10, 65);
    ctx.fillText(`Wave: ${gameState.wave}`, 10, 85);
    
    if (gameState.gravityInverted) {
      ctx.fillStyle = '#ffff00';
      ctx.fillText('GRAVITY INVERTED', 10, 105);
    }

    // Crosshair
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mouseRef.current.x - 10, mouseRef.current.y);
    ctx.lineTo(mouseRef.current.x + 10, mouseRef.current.y);
    ctx.moveTo(mouseRef.current.x, mouseRef.current.y - 10);
    ctx.lineTo(mouseRef.current.x, mouseRef.current.y + 10);
    ctx.stroke();

    // Instructions
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '12px monospace';
    ctx.fillText('WASD: Move | Mouse/Space: Shoot | G: Invert Gravity | Q/E: Gravity Wells', 10, canvas.height - 20);

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GRAVITY CRUSHED', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px monospace';
      ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 40);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 70);
    }

    if (gameState.waveComplete) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0aff9d';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GRAVITY MASTERED', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px monospace';
      ctx.fillText('Press N for next wave', canvas.width / 2, canvas.height / 2 + 40);
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
      const key = e.key.toLowerCase();
      keysRef.current.add(key);
      
      if (key === 'r' && gameState.gameOver) {
        setGameState(prev => ({ ...prev, wave: 1 }));
        initializeGame();
      }
      
      if (key === 'n' && gameState.waveComplete) {
        setGameState(prev => ({ ...prev, wave: prev.wave + 1, waveComplete: false }));
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

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    if (canvasRef.current) {
      canvasRef.current.addEventListener('mousemove', handleMouseMove);
      canvasRef.current.addEventListener('mousedown', handleMouseDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('mousemove', handleMouseMove);
        canvasRef.current.removeEventListener('mousedown', handleMouseDown);
      }
    };
  }, [gameState.gameOver, gameState.waveComplete, initializeGame]);

  return (
    <GameLayout
      gameTitle="Inverted Gravity Wars"
      gameCategory="Space combat with manipulatable gravity"
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
          <p className="text-gray-300">WASD: Move | Mouse/Space: Shoot | G: Invert Gravity | Q/E: Gravity Wells</p>
          <p className="text-gray-400">Master gravity to dominate space combat!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default InvertedGravityWars;
