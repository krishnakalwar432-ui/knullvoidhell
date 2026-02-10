import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Tank {
  x: number;
  y: number;
  angle: number;
  health: number;
  energy: number;
  velocity: { x: number; y: number };
  turretAngle: number;
  lastShot: number;
  type: 'player' | 'heavy' | 'scout' | 'artillery';
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  type: 'shell' | 'plasma' | 'rocket' | 'shockwave';
  isPlayerProjectile: boolean;
  life: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  damage: number;
  life: number;
}

interface Explosion {
  x: number;
  y: number;
  radius: number;
  life: number;
  type: 'normal' | 'plasma' | 'shockwave';
}

const BattleShockwave = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef({ x: 0, y: 0, down: false });
  
  const [gameState, setGameState] = useState({
    playerTank: { 
      x: 400, y: 300, angle: 0, health: 100, energy: 100,
      velocity: { x: 0, y: 0 }, turretAngle: 0, lastShot: 0, type: 'player' as const
    },
    enemyTanks: [] as Tank[],
    projectiles: [] as Projectile[],
    shockwaves: [] as Shockwave[],
    explosions: [] as Explosion[],
    score: 0,
    wave: 1,
    gameOver: false,
    waveComplete: false,
    screenShake: 0,
    powerMode: false
  });

  const createExplosion = (x: number, y: number, type: Explosion['type'] = 'normal') => {
    const radius = type === 'shockwave' ? 80 : type === 'plasma' ? 60 : 40;
    setGameState(prev => ({
      ...prev,
      explosions: [...prev.explosions, { x, y, radius, life: 30, type }],
      screenShake: type === 'shockwave' ? 15 : 8
    }));
  };

  const createShockwave = (x: number, y: number, maxRadius: number = 150, damage: number = 50) => {
    setGameState(prev => ({
      ...prev,
      shockwaves: [...prev.shockwaves, { x, y, radius: 0, maxRadius, damage, life: 60 }]
    }));
  };

  const spawnEnemyTanks = useCallback((wave: number) => {
    const tanks: Tank[] = [];
    const canvas = canvasRef.current;
    if (!canvas) return tanks;

    const baseCount = 2 + wave;
    
    for (let i = 0; i < baseCount; i++) {
      const side = Math.floor(Math.random() * 4);
      let x: number, y: number;
      
      switch (side) {
        case 0: x = Math.random() * canvas.width; y = 50; break;
        case 1: x = canvas.width - 50; y = Math.random() * canvas.height; break;
        case 2: x = Math.random() * canvas.width; y = canvas.height - 50; break;
        default: x = 50; y = Math.random() * canvas.height; break;
      }
      
      let type: Tank['type'] = 'heavy';
      let health = 80;
      
      if (Math.random() < 0.3) {
        type = 'scout';
        health = 50;
      } else if (wave > 3 && Math.random() < 0.2) {
        type = 'artillery';
        health = 120;
      }

      tanks.push({
        x, y,
        angle: Math.random() * Math.PI * 2,
        health,
        energy: 100,
        velocity: { x: 0, y: 0 },
        turretAngle: Math.random() * Math.PI * 2,
        lastShot: 0,
        type
      });
    }

    return tanks;
  }, []);

  const initializeGame = useCallback(() => {
    const enemyTanks = spawnEnemyTanks(gameState.wave);
    setGameState(prev => ({
      ...prev,
      playerTank: { 
        x: 400, y: 300, angle: 0, health: 100, energy: 100,
        velocity: { x: 0, y: 0 }, turretAngle: 0, lastShot: 0, type: 'player'
      },
      enemyTanks,
      projectiles: [],
      shockwaves: [],
      explosions: [],
      gameOver: false,
      waveComplete: false,
      screenShake: 0,
      powerMode: false
    }));
  }, [gameState.wave, spawnEnemyTanks]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.gameOver) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply screen shake
    if (gameState.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * gameState.screenShake;
      const shakeY = (Math.random() - 0.5) * gameState.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // Clear with battlefield background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#2a2a1a');
    gradient.addColorStop(0.5, '#1a1a0a');
    gradient.addColorStop(1, '#0a0a00');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setGameState(prev => {
      const newState = { ...prev };
      const currentTime = Date.now();

      // Update screen shake
      if (newState.screenShake > 0) {
        newState.screenShake = Math.max(0, newState.screenShake - 1);
      }

      // Handle player tank movement
      const acceleration = 0.3;
      const friction = 0.9;
      const maxSpeed = 4;

      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) {
        newState.playerTank.angle -= 0.1;
      }
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) {
        newState.playerTank.angle += 0.1;
      }
      if (keysRef.current.has('ArrowUp') || keysRef.current.has('w')) {
        const thrust = {
          x: Math.cos(newState.playerTank.angle) * acceleration,
          y: Math.sin(newState.playerTank.angle) * acceleration
        };
        newState.playerTank.velocity.x += thrust.x;
        newState.playerTank.velocity.y += thrust.y;
      }
      if (keysRef.current.has('ArrowDown') || keysRef.current.has('s')) {
        const thrust = {
          x: Math.cos(newState.playerTank.angle) * -acceleration,
          y: Math.sin(newState.playerTank.angle) * -acceleration
        };
        newState.playerTank.velocity.x += thrust.x;
        newState.playerTank.velocity.y += thrust.y;
      }

      // Apply friction and speed limit
      newState.playerTank.velocity.x *= friction;
      newState.playerTank.velocity.y *= friction;
      const speed = Math.hypot(newState.playerTank.velocity.x, newState.playerTank.velocity.y);
      if (speed > maxSpeed) {
        newState.playerTank.velocity.x = (newState.playerTank.velocity.x / speed) * maxSpeed;
        newState.playerTank.velocity.y = (newState.playerTank.velocity.y / speed) * maxSpeed;
      }

      // Update player position
      newState.playerTank.x += newState.playerTank.velocity.x;
      newState.playerTank.y += newState.playerTank.velocity.y;

      // Keep player in bounds
      newState.playerTank.x = Math.max(30, Math.min(canvas.width - 30, newState.playerTank.x));
      newState.playerTank.y = Math.max(30, Math.min(canvas.height - 30, newState.playerTank.y));

      // Player turret aiming
      newState.playerTank.turretAngle = Math.atan2(
        mouseRef.current.y - newState.playerTank.y,
        mouseRef.current.x - newState.playerTank.x
      );

      // Player shooting
      if (mouseRef.current.down && currentTime - newState.playerTank.lastShot > 300) {
        const projectileSpeed = 8;
        const vx = Math.cos(newState.playerTank.turretAngle) * projectileSpeed;
        const vy = Math.sin(newState.playerTank.turretAngle) * projectileSpeed;

        newState.projectiles.push({
          x: newState.playerTank.x,
          y: newState.playerTank.y,
          vx, vy,
          damage: newState.powerMode ? 60 : 40,
          type: newState.powerMode ? 'plasma' : 'shell',
          isPlayerProjectile: true,
          life: 120
        });

        newState.playerTank.lastShot = currentTime;
        mouseRef.current.down = false;
      }

      // Shockwave ability
      if (keysRef.current.has(' ') && newState.playerTank.energy >= 50) {
        createShockwave(newState.playerTank.x, newState.playerTank.y, 200, 80);
        newState.playerTank.energy -= 50;
        keysRef.current.delete(' ');
      }

      // Update enemy tanks
      newState.enemyTanks = newState.enemyTanks.map(tank => {
        const updatedTank = { ...tank };
        
        // Simple AI movement towards player
        const dx = newState.playerTank.x - tank.x;
        const dy = newState.playerTank.y - tank.y;
        const distance = Math.hypot(dx, dy);
        const targetAngle = Math.atan2(dy, dx);
        
        // Move towards player but maintain distance based on type
        const desiredDistance = tank.type === 'artillery' ? 200 : tank.type === 'scout' ? 100 : 150;
        
        if (distance > desiredDistance) {
          updatedTank.angle = targetAngle;
          const speed = tank.type === 'scout' ? 2 : 1;
          updatedTank.x += Math.cos(targetAngle) * speed;
          updatedTank.y += Math.sin(targetAngle) * speed;
        } else if (distance < desiredDistance * 0.8) {
          // Move away if too close
          updatedTank.angle = targetAngle + Math.PI;
          const speed = tank.type === 'scout' ? 1.5 : 0.5;
          updatedTank.x += Math.cos(targetAngle + Math.PI) * speed;
          updatedTank.y += Math.sin(targetAngle + Math.PI) * speed;
        }

        // Keep in bounds
        updatedTank.x = Math.max(30, Math.min(canvas.width - 30, updatedTank.x));
        updatedTank.y = Math.max(30, Math.min(canvas.height - 30, updatedTank.y));

        // Turret aiming at player
        updatedTank.turretAngle = targetAngle;

        // Enemy shooting
        const shootDelay = tank.type === 'artillery' ? 2000 : tank.type === 'scout' ? 800 : 1500;
        if (distance < 300 && currentTime - tank.lastShot > shootDelay) {
          let projectileType: Projectile['type'] = 'shell';
          let damage = 30;
          let speed = 6;
          
          if (tank.type === 'artillery') {
            projectileType = 'rocket';
            damage = 50;
            speed = 4;
          } else if (tank.type === 'scout') {
            damage = 20;
            speed = 8;
          }

          newState.projectiles.push({
            x: tank.x,
            y: tank.y,
            vx: Math.cos(targetAngle) * speed,
            vy: Math.sin(targetAngle) * speed,
            damage,
            type: projectileType,
            isPlayerProjectile: false,
            life: 120
          });

          updatedTank.lastShot = currentTime;
        }

        return updatedTank;
      });

      // Update projectiles
      newState.projectiles = newState.projectiles.filter(projectile => {
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;
        projectile.life--;

        // Remove off-screen or expired projectiles
        if (projectile.x < 0 || projectile.x > canvas.width || 
            projectile.y < 0 || projectile.y > canvas.height || projectile.life <= 0) {
          return false;
        }

        // Check collisions
        if (projectile.isPlayerProjectile) {
          // Player projectile hitting enemies
          for (let i = newState.enemyTanks.length - 1; i >= 0; i--) {
            const tank = newState.enemyTanks[i];
            const hit = Math.hypot(projectile.x - tank.x, projectile.y - tank.y) < 25;
            
            if (hit) {
              tank.health -= projectile.damage;
              createExplosion(projectile.x, projectile.y, projectile.type === 'plasma' ? 'plasma' : 'normal');
              
              if (tank.health <= 0) {
                newState.enemyTanks.splice(i, 1);
                newState.score += tank.type === 'artillery' ? 300 : tank.type === 'heavy' ? 200 : 150;
                createExplosion(tank.x, tank.y, 'shockwave');
              }
              
              return false;
            }
          }
        } else {
          // Enemy projectile hitting player
          const playerHit = Math.hypot(
            projectile.x - newState.playerTank.x,
            projectile.y - newState.playerTank.y
          ) < 25;
          
          if (playerHit) {
            newState.playerTank.health -= projectile.damage;
            createExplosion(projectile.x, projectile.y, 'normal');
            
            if (newState.playerTank.health <= 0) {
              newState.gameOver = true;
            }
            
            return false;
          }
        }

        return true;
      });

      // Update shockwaves
      newState.shockwaves = newState.shockwaves.map(shockwave => {
        const updatedShockwave = { ...shockwave };
        updatedShockwave.radius += 5;
        updatedShockwave.life--;
        
        // Damage enemies in shockwave
        if (updatedShockwave.radius < updatedShockwave.maxRadius) {
          newState.enemyTanks.forEach(tank => {
            const distance = Math.hypot(tank.x - shockwave.x, tank.y - shockwave.y);
            if (distance <= updatedShockwave.radius && distance > updatedShockwave.radius - 10) {
              tank.health -= shockwave.damage / 10; // Damage over time
            }
          });
        }
        
        return updatedShockwave;
      }).filter(shockwave => shockwave.life > 0);

      // Update explosions
      newState.explosions = newState.explosions.map(explosion => ({
        ...explosion,
        radius: explosion.radius + 2,
        life: explosion.life - 1
      })).filter(explosion => explosion.life > 0);

      // Check wave completion
      if (newState.enemyTanks.length === 0 && !newState.waveComplete) {
        newState.waveComplete = true;
        newState.powerMode = true; // Reward for completing wave
      }

      // Regenerate energy
      if (newState.playerTank.energy < 100) {
        newState.playerTank.energy = Math.min(100, newState.playerTank.energy + 0.5);
      }

      return newState;
    });

    // Draw battlefield grid
    ctx.strokeStyle = 'rgba(100, 100, 0, 0.2)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw explosions
    gameState.explosions.forEach(explosion => {
      const alpha = explosion.life / 30;
      ctx.globalAlpha = alpha;
      
      let colors = ['#ff6600', '#ff0000'];
      if (explosion.type === 'plasma') colors = ['#7000ff', '#ff0099'];
      if (explosion.type === 'shockwave') colors = ['#ffff00', '#ff6600'];
      
      const gradient = ctx.createRadialGradient(
        explosion.x, explosion.y, 0,
        explosion.x, explosion.y, explosion.radius
      );
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(1, colors[1]);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.globalAlpha = 1;
    });

    // Draw shockwaves
    gameState.shockwaves.forEach(shockwave => {
      const alpha = (shockwave.maxRadius - shockwave.radius) / shockwave.maxRadius;
      ctx.globalAlpha = alpha * 0.6;
      
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 6;
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 20;
      
      ctx.beginPath();
      ctx.arc(shockwave.x, shockwave.y, shockwave.radius, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });

    // Draw projectiles
    gameState.projectiles.forEach(projectile => {
      let color = '#ffff00';
      let size = 4;
      
      switch (projectile.type) {
        case 'plasma': color = '#7000ff'; size = 6; break;
        case 'rocket': color = '#ff0099'; size = 8; break;
        case 'shockwave': color = '#00ffff'; size = 10; break;
      }
      
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw tanks
    const drawTank = (tank: Tank, isPlayer: boolean = false) => {
      ctx.save();
      ctx.translate(tank.x, tank.y);
      
      // Tank body
      ctx.rotate(tank.angle);
      
      let bodyColor = '#666666';
      if (isPlayer) {
        bodyColor = gameState.powerMode ? '#ffff00' : '#0aff9d';
      } else {
        switch (tank.type) {
          case 'heavy': bodyColor = '#8a4a4a'; break;
          case 'scout': bodyColor = '#4a8a4a'; break;
          case 'artillery': bodyColor = '#4a4a8a'; break;
        }
      }
      
      ctx.fillStyle = bodyColor;
      ctx.shadowColor = bodyColor;
      ctx.shadowBlur = 15;
      
      const width = tank.type === 'scout' ? 20 : tank.type === 'artillery' ? 35 : 25;
      const height = tank.type === 'scout' ? 15 : tank.type === 'artillery' ? 25 : 20;
      
      ctx.fillRect(-width/2, -height/2, width, height);
      ctx.shadowBlur = 0;
      
      // Tank treads
      ctx.fillStyle = '#333333';
      ctx.fillRect(-width/2 - 2, -height/2 - 3, width + 4, 4);
      ctx.fillRect(-width/2 - 2, height/2 - 1, width + 4, 4);
      
      ctx.restore();
      
      // Turret
      ctx.save();
      ctx.translate(tank.x, tank.y);
      ctx.rotate(tank.turretAngle);
      
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      
      // Gun barrel
      const barrelLength = tank.type === 'artillery' ? 35 : 25;
      ctx.fillRect(0, -2, barrelLength, 4);
      
      ctx.restore();
      
      // Health bar
      if (!isPlayer || tank.health < 100) {
        ctx.fillStyle = '#333333';
        ctx.fillRect(tank.x - 20, tank.y - 35, 40, 6);
        ctx.fillStyle = isPlayer ? '#00ff00' : '#ff0000';
        const healthPercent = tank.health / (isPlayer ? 100 : (tank.type === 'artillery' ? 120 : tank.type === 'heavy' ? 80 : 50));
        ctx.fillRect(tank.x - 20, tank.y - 35, 40 * healthPercent, 6);
      }
    };

    // Draw enemy tanks
    gameState.enemyTanks.forEach(tank => drawTank(tank, false));

    // Draw player tank
    drawTank(gameState.playerTank, true);

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Health: ${Math.floor(gameState.playerTank.health)}`, 10, 25);
    ctx.fillText(`Energy: ${Math.floor(gameState.playerTank.energy)}`, 10, 45);
    ctx.fillText(`Score: ${gameState.score}`, 10, 65);
    ctx.fillText(`Wave: ${gameState.wave}`, 10, 85);
    ctx.fillText(`Enemies: ${gameState.enemyTanks.length}`, 10, 105);

    if (gameState.powerMode) {
      ctx.fillStyle = '#ffff00';
      ctx.font = '20px monospace';
      ctx.fillText('POWER MODE!', 10, 130);
    }

    // Crosshair
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mouseRef.current.x - 15, mouseRef.current.y);
    ctx.lineTo(mouseRef.current.x + 15, mouseRef.current.y);
    ctx.moveTo(mouseRef.current.x, mouseRef.current.y - 15);
    ctx.lineTo(mouseRef.current.x, mouseRef.current.y + 15);
    ctx.stroke();

    // Instructions
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '12px monospace';
    ctx.fillText('WASD: Move/Turn | Mouse: Aim & Shoot | Space: Shockwave', 10, canvas.height - 20);

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TANK DESTROYED', canvas.width / 2, canvas.height / 2);
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
      ctx.fillText('BATTLEFIELD SECURED', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px monospace';
      ctx.fillText('Press N for next wave', canvas.width / 2, canvas.height / 2 + 40);
    }

    ctx.textAlign = 'left';
    
    // Reset transform after screen shake
    if (gameState.screenShake > 0) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
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
        setGameState(prev => ({ ...prev, wave: prev.wave + 1, waveComplete: false, powerMode: false }));
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
      gameTitle="Battle Shockwave"
      gameCategory="Tank combat with explosive shockwaves"
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
          <p className="text-gray-300">WASD: Move/Turn | Mouse: Aim & Shoot | Space: Shockwave</p>
          <p className="text-gray-400">Dominate the battlefield with devastating shockwaves!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default BattleShockwave;
