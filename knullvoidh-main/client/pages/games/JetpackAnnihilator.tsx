import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fuel: number;
  health: number;
  weapons: string[];
  currentWeapon: number;
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  health: number;
  type: 'drone' | 'turret' | 'missile' | 'bomber';
  lastShot: number;
  targetLock: boolean;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  type: 'bullet' | 'rocket' | 'laser' | 'plasma';
  isPlayerProjectile: boolean;
  homing: boolean;
  life: number;
}

interface Explosion {
  x: number;
  y: number;
  radius: number;
  life: number;
  type: 'normal' | 'plasma' | 'fuel';
}

interface FuelTank {
  x: number;
  y: number;
  amount: number;
  collected: boolean;
}

const JetpackAnnihilator = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef({ x: 0, y: 0, down: false });
  
  const [gameState, setGameState] = useState({
    player: { 
      x: 100, y: 300, vx: 0, vy: 0, fuel: 100, health: 100,
      weapons: ['bullets', 'rockets', 'laser', 'plasma'], currentWeapon: 0
    } as Player,
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    explosions: [] as Explosion[],
    fuelTanks: [] as FuelTank[],
    score: 0,
    wave: 1,
    gameOver: false,
    waveComplete: false,
    altitude: 0,
    turbulence: 0
  });

  const weapons = {
    bullets: { damage: 20, speed: 10, fuel: 2, color: '#ffff00' },
    rockets: { damage: 60, speed: 6, fuel: 8, color: '#ff0099' },
    laser: { damage: 40, speed: 15, fuel: 5, color: '#0aff9d' },
    plasma: { damage: 80, speed: 8, fuel: 12, color: '#7000ff' }
  };

  const createExplosion = (x: number, y: number, type: Explosion['type'] = 'normal') => {
    setGameState(prev => ({
      ...prev,
      explosions: [...prev.explosions, {
        x, y,
        radius: type === 'fuel' ? 30 : type === 'plasma' ? 50 : 40,
        life: type === 'plasma' ? 40 : 30,
        type
      }]
    }));
  };

  const spawnEnemies = useCallback((wave: number) => {
    const enemies: Enemy[] = [];
    const canvas = canvasRef.current;
    if (!canvas) return enemies;

    const baseCount = 3 + wave * 2;
    
    for (let i = 0; i < baseCount; i++) {
      let x: number, y: number;
      let type: Enemy['type'] = 'drone';
      let health = 40;
      let vx = -2;
      let vy = 0;
      
      // Spawn from right side at various heights
      x = canvas.width + 50;
      y = 50 + Math.random() * (canvas.height - 100);
      
      const rand = Math.random();
      if (rand < 0.3) {
        type = 'turret';
        health = 60;
        vx = -1;
        vy = (Math.random() - 0.5) * 2;
      } else if (rand < 0.6 && wave > 2) {
        type = 'missile';
        health = 30;
        vx = -3;
        vy = 0;
      } else if (rand < 0.8 && wave > 4) {
        type = 'bomber';
        health = 80;
        vx = -1.5;
        vy = Math.sin(i) * 2;
      }

      enemies.push({
        x, y, vx, vy, health, type,
        lastShot: 0,
        targetLock: false
      });
    }

    return enemies;
  }, []);

  const spawnFuelTanks = useCallback(() => {
    const tanks: FuelTank[] = [];
    const canvas = canvasRef.current;
    if (!canvas) return tanks;

    for (let i = 0; i < 3; i++) {
      tanks.push({
        x: 200 + i * 250 + Math.random() * 100,
        y: 100 + Math.random() * (canvas.height - 200),
        amount: 30 + Math.random() * 20,
        collected: false
      });
    }

    return tanks;
  }, []);

  const initializeGame = useCallback(() => {
    const enemies = spawnEnemies(gameState.wave);
    const fuelTanks = spawnFuelTanks();
    
    setGameState(prev => ({
      ...prev,
      player: { 
        x: 100, y: 300, vx: 0, vy: 0, fuel: 100, health: 100,
        weapons: ['bullets', 'rockets', 'laser', 'plasma'], currentWeapon: 0
      },
      enemies,
      projectiles: [],
      explosions: [],
      fuelTanks,
      gameOver: false,
      waveComplete: false,
      altitude: 0,
      turbulence: Math.random() * 2 - 1
    }));
  }, [gameState.wave, spawnEnemies, spawnFuelTanks]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.gameOver) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(0.3, '#002244');
    gradient.addColorStop(0.7, '#003366');
    gradient.addColorStop(1, '#004488');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setGameState(prev => {
      const newState = { ...prev };
      const currentTime = Date.now();

      // Update turbulence
      newState.turbulence += (Math.random() - 0.5) * 0.1;
      newState.turbulence *= 0.98;

      // Handle player input
      const jetpackThrust = 0.6;
      const gravity = 0.4;
      
      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) {
        newState.player.vx = Math.max(-6, newState.player.vx - 0.3);
      }
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) {
        newState.player.vx = Math.min(6, newState.player.vx + 0.3);
      }
      
      // Jetpack thrust
      if ((keysRef.current.has('ArrowUp') || keysRef.current.has('w')) && newState.player.fuel > 0) {
        newState.player.vy -= jetpackThrust;
        newState.player.fuel = Math.max(0, newState.player.fuel - 1);
        
        // Jetpack flame particles
        if (Math.random() < 0.7) {
          createExplosion(
            newState.player.x - 5 + Math.random() * 10,
            newState.player.y + 15,
            'fuel'
          );
        }
      }

      // Weapon switching
      if (keysRef.current.has('1')) newState.player.currentWeapon = 0;
      if (keysRef.current.has('2')) newState.player.currentWeapon = 1;
      if (keysRef.current.has('3')) newState.player.currentWeapon = 2;
      if (keysRef.current.has('4')) newState.player.currentWeapon = 3;

      // Player shooting
      if ((keysRef.current.has(' ') || mouseRef.current.down) && newState.player.fuel > 0) {
        const weapon = newState.player.weapons[newState.player.currentWeapon];
        const weaponData = weapons[weapon as keyof typeof weapons];
        
        if (newState.player.fuel >= weaponData.fuel) {
          const angle = Math.atan2(
            mouseRef.current.y - newState.player.y,
            mouseRef.current.x - newState.player.x
          );
          
          newState.projectiles.push({
            x: newState.player.x,
            y: newState.player.y,
            vx: Math.cos(angle) * weaponData.speed,
            vy: Math.sin(angle) * weaponData.speed,
            damage: weaponData.damage,
            type: weapon as Projectile['type'],
            isPlayerProjectile: true,
            homing: weapon === 'rockets',
            life: 120
          });
          
          newState.player.fuel -= weaponData.fuel;
          if (mouseRef.current.down) mouseRef.current.down = false;
        }
      }

      // Apply gravity and turbulence
      newState.player.vy += gravity + newState.turbulence * 0.1;
      
      // Air resistance
      newState.player.vx *= 0.98;
      newState.player.vy *= 0.99;

      // Update player position
      newState.player.x += newState.player.vx;
      newState.player.y += newState.player.vy;

      // Update altitude
      newState.altitude = Math.max(0, canvas.height - newState.player.y);

      // Keep player in bounds
      newState.player.x = Math.max(20, Math.min(canvas.width - 20, newState.player.x));
      if (newState.player.y <= 0) {
        newState.player.y = 0;
        newState.player.vy = Math.max(0, newState.player.vy);
      }
      if (newState.player.y >= canvas.height - 20) {
        newState.player.y = canvas.height - 20;
        newState.player.vy = Math.min(0, newState.player.vy);
        newState.player.health -= 2; // Ground damage
      }

      // Update enemies
      newState.enemies = newState.enemies.map(enemy => {
        const updatedEnemy = { ...enemy };
        
        // Move enemies
        updatedEnemy.x += enemy.vx;
        updatedEnemy.y += enemy.vy;
        
        // Enemy AI behaviors
        const playerDistance = Math.hypot(
          newState.player.x - enemy.x,
          newState.player.y - enemy.y
        );
        
        if (enemy.type === 'missile' && playerDistance < 200) {
          // Homing behavior
          const angle = Math.atan2(
            newState.player.y - enemy.y,
            newState.player.x - enemy.x
          );
          updatedEnemy.vx += Math.cos(angle) * 0.2;
          updatedEnemy.vy += Math.sin(angle) * 0.2;
        }
        
        if (enemy.type === 'bomber') {
          updatedEnemy.vy = Math.sin(currentTime * 0.003 + enemy.x * 0.01) * 2;
        }

        // Enemy shooting
        const canShoot = playerDistance < 300 && currentTime - enemy.lastShot > 1500;
        if (canShoot) {
          const angle = Math.atan2(
            newState.player.y - enemy.y,
            newState.player.x - enemy.x
          );
          
          let projectileCount = 1;
          let damage = 25;
          
          if (enemy.type === 'turret') {
            projectileCount = 3;
            damage = 20;
          } else if (enemy.type === 'bomber') {
            projectileCount = 2;
            damage = 30;
          }
          
          for (let i = 0; i < projectileCount; i++) {
            const spreadAngle = angle + (i - projectileCount / 2) * 0.3;
            
            newState.projectiles.push({
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(spreadAngle) * 5,
              vy: Math.sin(spreadAngle) * 5,
              damage,
              type: 'bullet',
              isPlayerProjectile: false,
              homing: false,
              life: 100
            });
          }
          
          updatedEnemy.lastShot = currentTime;
        }

        return updatedEnemy;
      }).filter(enemy => enemy.x > -100); // Remove off-screen enemies

      // Update projectiles
      newState.projectiles = newState.projectiles.filter(projectile => {
        // Homing behavior for rockets
        if (projectile.homing && projectile.isPlayerProjectile) {
          let closestEnemy = null;
          let closestDistance = Infinity;
          
          newState.enemies.forEach(enemy => {
            const distance = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
            if (distance < closestDistance && distance < 150) {
              closestDistance = distance;
              closestEnemy = enemy;
            }
          });
          
          if (closestEnemy) {
            const angle = Math.atan2(
              closestEnemy.y - projectile.y,
              closestEnemy.x - projectile.x
            );
            projectile.vx += Math.cos(angle) * 0.3;
            projectile.vy += Math.sin(angle) * 0.3;
          }
        }
        
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;
        projectile.life--;

        // Remove off-screen or expired projectiles
        if (projectile.x < -50 || projectile.x > canvas.width + 50 || 
            projectile.y < -50 || projectile.y > canvas.height + 50 || 
            projectile.life <= 0) {
          return false;
        }

        // Check collisions
        if (projectile.isPlayerProjectile) {
          // Player projectile hitting enemies
          for (let i = newState.enemies.length - 1; i >= 0; i--) {
            const enemy = newState.enemies[i];
            const hit = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y) < 25;
            
            if (hit) {
              enemy.health -= projectile.damage;
              createExplosion(projectile.x, projectile.y, projectile.type === 'plasma' ? 'plasma' : 'normal');
              
              if (enemy.health <= 0) {
                newState.enemies.splice(i, 1);
                newState.score += enemy.type === 'bomber' ? 300 : 
                                 enemy.type === 'turret' ? 200 :
                                 enemy.type === 'missile' ? 250 : 150;
                createExplosion(enemy.x, enemy.y, 'normal');
              }
              
              return false;
            }
          }
        } else {
          // Enemy projectile hitting player
          const playerHit = Math.hypot(
            projectile.x - newState.player.x,
            projectile.y - newState.player.y
          ) < 20;
          
          if (playerHit) {
            newState.player.health -= projectile.damage;
            createExplosion(projectile.x, projectile.y, 'normal');
            
            if (newState.player.health <= 0) {
              newState.gameOver = true;
            }
            
            return false;
          }
        }

        return true;
      });

      // Update explosions
      newState.explosions = newState.explosions.map(explosion => ({
        ...explosion,
        radius: explosion.radius + (explosion.type === 'fuel' ? 1 : 2),
        life: explosion.life - 1
      })).filter(explosion => explosion.life > 0);

      // Check fuel tank collection
      newState.fuelTanks.forEach(tank => {
        if (!tank.collected) {
          const distance = Math.hypot(
            newState.player.x - tank.x,
            newState.player.y - tank.y
          );
          
          if (distance < 30) {
            tank.collected = true;
            newState.player.fuel = Math.min(100, newState.player.fuel + tank.amount);
            newState.score += 100;
            createExplosion(tank.x, tank.y, 'fuel');
          }
        }
      });

      // Spawn new enemies periodically
      if (Math.random() < 0.01 * gameState.wave) {
        const newEnemies = spawnEnemies(1);
        newState.enemies.push(...newEnemies);
      }

      // Check wave completion
      if (newState.enemies.length === 0 && !newState.waveComplete) {
        newState.waveComplete = true;
      }

      // Fuel regeneration (slow)
      if (newState.player.fuel < 100) {
        newState.player.fuel = Math.min(100, newState.player.fuel + 0.1);
      }

      return newState;
    });

    // Draw clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 5; i++) {
      const x = (gameState.player.x * 0.1 + i * 200) % (canvas.width + 100);
      const y = 100 + Math.sin(i * 2) * 50;
      ctx.beginPath();
      ctx.arc(x, y, 30 + i * 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw explosions
    gameState.explosions.forEach(explosion => {
      const alpha = explosion.life / 30;
      ctx.globalAlpha = alpha;
      
      let colors = ['#ff6600', '#ffff00'];
      if (explosion.type === 'plasma') colors = ['#7000ff', '#ff0099'];
      if (explosion.type === 'fuel') colors = ['#ff6600', '#ffffff'];
      
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

    // Draw fuel tanks
    gameState.fuelTanks.forEach(tank => {
      if (!tank.collected) {
        ctx.fillStyle = '#00ff00';
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.roundRect(tank.x - 10, tank.y - 15, 20, 30, 5);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Fuel indicator
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`+${Math.floor(tank.amount)}`, tank.x, tank.y - 20);
      }
    });

    // Draw projectiles
    gameState.projectiles.forEach(projectile => {
      const weaponData = weapons[projectile.type as keyof typeof weapons];
      const color = weaponData?.color || '#ffff00';
      
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      
      const size = projectile.type === 'rocket' ? 6 : 4;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
      
      // Trail for rockets
      if (projectile.type === 'rocket') {
        ctx.strokeStyle = 'rgba(255, 100, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(projectile.x, projectile.y);
        ctx.lineTo(
          projectile.x - projectile.vx * 3,
          projectile.y - projectile.vy * 3
        );
        ctx.stroke();
      }
    });

    // Draw enemies
    gameState.enemies.forEach(enemy => {
      let color = '#ff6600';
      let size = 15;
      
      switch (enemy.type) {
        case 'turret': color = '#ff0099'; size = 18; break;
        case 'missile': color = '#ffff00'; size = 12; break;
        case 'bomber': color = '#7000ff'; size = 22; break;
      }
      
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      
      if (enemy.type === 'bomber') {
        // Draw bomber as rectangle
        ctx.fillRect(enemy.x - size/2, enemy.y - size/3, size, size*2/3);
      } else {
        // Draw other enemies as circles
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.shadowBlur = 0;
      
      // Health bar
      if (enemy.health < (enemy.type === 'bomber' ? 80 : enemy.type === 'turret' ? 60 : 40)) {
        ctx.fillStyle = '#333333';
        ctx.fillRect(enemy.x - 15, enemy.y - 25, 30, 4);
        ctx.fillStyle = '#ff0000';
        const maxHealth = enemy.type === 'bomber' ? 80 : enemy.type === 'turret' ? 60 : 40;
        const healthPercent = enemy.health / maxHealth;
        ctx.fillRect(enemy.x - 15, enemy.y - 25, 30 * healthPercent, 4);
      }
    });

    // Draw player
    const playerColor = gameState.player.fuel > 20 ? '#0aff9d' : '#ff6600';
    
    ctx.fillStyle = playerColor;
    ctx.shadowColor = playerColor;
    ctx.shadowBlur = 20;
    
    // Player body
    ctx.fillRect(gameState.player.x - 8, gameState.player.y - 12, 16, 24);
    
    // Jetpack
    ctx.fillStyle = '#666666';
    ctx.fillRect(gameState.player.x - 10, gameState.player.y - 8, 4, 16);
    ctx.fillRect(gameState.player.x + 6, gameState.player.y - 8, 4, 16);
    
    ctx.shadowBlur = 0;

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Health: ${Math.floor(gameState.player.health)}`, 10, 25);
    ctx.fillText(`Fuel: ${Math.floor(gameState.player.fuel)}`, 10, 45);
    ctx.fillText(`Score: ${gameState.score}`, 10, 65);
    ctx.fillText(`Wave: ${gameState.wave}`, 10, 85);
    ctx.fillText(`Altitude: ${Math.floor(gameState.altitude)}m`, 10, 105);

    // Weapon display
    const currentWeapon = gameState.player.weapons[gameState.player.currentWeapon];
    ctx.fillText(`Weapon: ${currentWeapon.toUpperCase()}`, 10, 125);

    // Weapon selector
    gameState.player.weapons.forEach((weapon, index) => {
      const selected = index === gameState.player.currentWeapon;
      const weaponData = weapons[weapon as keyof typeof weapons];
      
      ctx.fillStyle = selected ? weaponData.color : '#666666';
      ctx.fillRect(10 + index * 60, canvas.height - 40, 50, 20);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.fillText(`${index + 1}. ${weapon.toUpperCase()}`, 12 + index * 60, canvas.height - 27);
    });

    // Fuel warning
    if (gameState.player.fuel < 20) {
      ctx.fillStyle = '#ff0099';
      ctx.font = '20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LOW FUEL!', canvas.width / 2, 50);
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

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('JETPACK FAILED', canvas.width / 2, canvas.height / 2);
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
      ctx.fillText('SKIES CLEARED', canvas.width / 2, canvas.height / 2);
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
      gameTitle="Jetpack Annihilator"
      gameCategory="High-altitude combat with jetpack warfare"
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
          <p className="text-gray-300">WASD: Move | W: Jetpack | Mouse/Space: Shoot | 1-4: Switch Weapons</p>
          <p className="text-gray-400">Manage fuel wisely and dominate the skies!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default JetpackAnnihilator;
