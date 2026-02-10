import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Position {
  x: number;
  y: number;
}

interface Player {
  x: number;
  y: number;
  health: number;
  energy: number;
  weapon: string;
  kills: number;
}

interface Enemy {
  x: number;
  y: number;
  health: number;
  type: 'grunt' | 'heavy' | 'sniper' | 'assassin';
  lastShot: number;
  target: Position;
  speed: number;
}

interface Bullet {
  x: number;
  y: number;
  dx: number;
  dy: number;
  damage: number;
  isPlayerBullet: boolean;
  weapon: string;
}

interface Explosion {
  x: number;
  y: number;
  radius: number;
  life: number;
}

const DarkSectorShowdown = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef({ x: 0, y: 0, down: false });
  
  const [gameState, setGameState] = useState({
    player: { x: 400, y: 300, health: 100, energy: 100, weapon: 'plasma', kills: 0 } as Player,
    enemies: [] as Enemy[],
    bullets: [] as Bullet[],
    explosions: [] as Explosion[],
    score: 0,
    wave: 1,
    enemiesLeft: 0,
    gameOver: false,
    waveComplete: false
  });

  const weapons = {
    plasma: { damage: 25, speed: 8, energy: 10, color: '#0aff9d' },
    laser: { damage: 40, speed: 12, energy: 15, color: '#ff0099' },
    rocket: { damage: 80, speed: 6, energy: 25, color: '#ff6600' },
    rail: { damage: 100, speed: 20, energy: 30, color: '#7000ff' }
  };

  const createExplosion = (x: number, y: number, radius: number = 50) => {
    setGameState(prev => ({
      ...prev,
      explosions: [...prev.explosions, { x, y, radius, life: 30 }]
    }));
  };

  const spawnEnemies = useCallback((wave: number) => {
    const enemies: Enemy[] = [];
    const baseCount = 3 + wave * 2;
    
    for (let i = 0; i < baseCount; i++) {
      const angle = (i / baseCount) * Math.PI * 2;
      const distance = 300 + Math.random() * 200;
      const types: Enemy['type'][] = ['grunt', 'heavy', 'sniper', 'assassin'];
      const type = wave < 3 ? 'grunt' : types[Math.floor(Math.random() * Math.min(wave, 4))];
      
      let health = 50;
      let speed = 2;
      
      switch (type) {
        case 'heavy':
          health = 120;
          speed = 1;
          break;
        case 'sniper':
          health = 60;
          speed = 1.5;
          break;
        case 'assassin':
          health = 40;
          speed = 4;
          break;
      }

      enemies.push({
        x: 400 + Math.cos(angle) * distance,
        y: 300 + Math.sin(angle) * distance,
        health,
        type,
        lastShot: 0,
        target: { x: 400, y: 300 },
        speed
      });
    }

    return enemies;
  }, []);

  const initializeGame = useCallback(() => {
    const enemies = spawnEnemies(gameState.wave);
    setGameState(prev => ({
      ...prev,
      player: { x: 400, y: 300, health: 100, energy: 100, weapon: 'plasma', kills: 0 },
      enemies,
      bullets: [],
      explosions: [],
      enemiesLeft: enemies.length,
      gameOver: false,
      waveComplete: false
    }));
  }, [gameState.wave, spawnEnemies]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.gameOver) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with dark space effect
    const gradient = ctx.createRadialGradient(400, 300, 0, 400, 300, 400);
    gradient.addColorStop(0, '#0f0f2f');
    gradient.addColorStop(0.7, '#050515');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setGameState(prev => {
      const newState = { ...prev };
      const currentTime = Date.now();

      // Handle player movement
      const moveSpeed = 4;
      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) {
        newState.player.x = Math.max(20, newState.player.x - moveSpeed);
      }
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) {
        newState.player.x = Math.min(canvas.width - 20, newState.player.x + moveSpeed);
      }
      if (keysRef.current.has('ArrowUp') || keysRef.current.has('w')) {
        newState.player.y = Math.max(20, newState.player.y - moveSpeed);
      }
      if (keysRef.current.has('ArrowDown') || keysRef.current.has('s')) {
        newState.player.y = Math.min(canvas.height - 20, newState.player.y + moveSpeed);
      }

      // Weapon switching
      if (keysRef.current.has('1')) newState.player.weapon = 'plasma';
      if (keysRef.current.has('2')) newState.player.weapon = 'laser';
      if (keysRef.current.has('3')) newState.player.weapon = 'rocket';
      if (keysRef.current.has('4')) newState.player.weapon = 'rail';

      // Player shooting
      if (mouseRef.current.down && newState.player.energy > 0) {
        const weapon = weapons[newState.player.weapon as keyof typeof weapons];
        if (newState.player.energy >= weapon.energy) {
          const dx = mouseRef.current.x - newState.player.x;
          const dy = mouseRef.current.y - newState.player.y;
          const dist = Math.hypot(dx, dy);
          
          newState.bullets.push({
            x: newState.player.x,
            y: newState.player.y,
            dx: (dx / dist) * weapon.speed,
            dy: (dy / dist) * weapon.speed,
            damage: weapon.damage,
            isPlayerBullet: true,
            weapon: newState.player.weapon
          });
          
          newState.player.energy -= weapon.energy;
          mouseRef.current.down = false;
        }
      }

      // Energy regeneration
      newState.player.energy = Math.min(100, newState.player.energy + 1);

      // Update enemies
      newState.enemies = newState.enemies.map(enemy => {
        const updatedEnemy = { ...enemy };
        
        // AI movement
        const dx = newState.player.x - enemy.x;
        const dy = newState.player.y - enemy.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance > 100) {
          updatedEnemy.x += (dx / distance) * enemy.speed;
          updatedEnemy.y += (dy / distance) * enemy.speed;
        }

        // Enemy shooting
        const canShoot = currentTime - enemy.lastShot > (enemy.type === 'sniper' ? 1000 : 2000);
        if (distance < 300 && canShoot) {
          const angle = Math.atan2(dy, dx);
          let bulletSpeed = 4;
          let damage = 15;
          
          switch (enemy.type) {
            case 'heavy':
              bulletSpeed = 3;
              damage = 25;
              break;
            case 'sniper':
              bulletSpeed = 8;
              damage = 40;
              break;
            case 'assassin':
              bulletSpeed = 6;
              damage = 20;
              break;
          }

          newState.bullets.push({
            x: enemy.x,
            y: enemy.y,
            dx: Math.cos(angle) * bulletSpeed,
            dy: Math.sin(angle) * bulletSpeed,
            damage,
            isPlayerBullet: false,
            weapon: 'enemy'
          });
          
          updatedEnemy.lastShot = currentTime;
        }

        return updatedEnemy;
      });

      // Update bullets
      newState.bullets = newState.bullets.filter(bullet => {
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;

        // Remove off-screen bullets
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
          return false;
        }

        // Check collisions
        if (bullet.isPlayerBullet) {
          // Player bullet hitting enemies
          for (let i = newState.enemies.length - 1; i >= 0; i--) {
            const enemy = newState.enemies[i];
            const hit = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y) < 25;
            
            if (hit) {
              enemy.health -= bullet.damage;
              
              if (bullet.weapon === 'rocket') {
                createExplosion(bullet.x, bullet.y, 80);
                // Explosion damage to nearby enemies
                newState.enemies.forEach(nearbyEnemy => {
                  const explosionDist = Math.hypot(bullet.x - nearbyEnemy.x, bullet.y - nearbyEnemy.y);
                  if (explosionDist < 80) {
                    nearbyEnemy.health -= 30;
                  }
                });
              }
              
              if (enemy.health <= 0) {
                newState.enemies.splice(i, 1);
                newState.player.kills++;
                newState.score += enemy.type === 'heavy' ? 200 : enemy.type === 'sniper' ? 150 : 100;
                createExplosion(enemy.x, enemy.y, 40);
              }
              
              return false;
            }
          }
        } else {
          // Enemy bullet hitting player
          const playerHit = Math.hypot(
            bullet.x - newState.player.x,
            bullet.y - newState.player.y
          ) < 20;
          
          if (playerHit) {
            newState.player.health -= bullet.damage;
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
        life: explosion.life - 1,
        radius: explosion.radius + 2
      })).filter(explosion => explosion.life > 0);

      // Check wave completion
      if (newState.enemies.length === 0 && !newState.waveComplete) {
        newState.waveComplete = true;
      }

      return newState;
    });

    // Draw grid pattern
    ctx.strokeStyle = 'rgba(112, 0, 255, 0.2)';
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
      
      const gradient = ctx.createRadialGradient(
        explosion.x, explosion.y, 0,
        explosion.x, explosion.y, explosion.radius
      );
      gradient.addColorStop(0, '#ffff00');
      gradient.addColorStop(0.5, '#ff6600');
      gradient.addColorStop(1, 'rgba(255, 0, 153, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.globalAlpha = 1;
    });

    // Draw enemies
    gameState.enemies.forEach(enemy => {
      let color = '#ff6600';
      let size = 15;
      
      switch (enemy.type) {
        case 'heavy':
          color = '#ff0099';
          size = 20;
          break;
        case 'sniper':
          color = '#7000ff';
          size = 12;
          break;
        case 'assassin':
          color = '#0aff9d';
          size = 10;
          break;
      }
      
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Health bar
      if (enemy.health < (enemy.type === 'heavy' ? 120 : enemy.type === 'sniper' ? 60 : 50)) {
        ctx.fillStyle = '#333333';
        ctx.fillRect(enemy.x - 15, enemy.y - 25, 30, 4);
        ctx.fillStyle = '#00ff00';
        const healthPercent = enemy.health / (enemy.type === 'heavy' ? 120 : enemy.type === 'sniper' ? 60 : 50);
        ctx.fillRect(enemy.x - 15, enemy.y - 25, 30 * healthPercent, 4);
      }
    });

    // Draw bullets
    gameState.bullets.forEach(bullet => {
      if (bullet.isPlayerBullet) {
        const weapon = weapons[bullet.weapon as keyof typeof weapons];
        ctx.fillStyle = weapon.color;
      } else {
        ctx.fillStyle = '#ff0099';
      }
      
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.weapon === 'rocket' ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw player
    ctx.fillStyle = '#0aff9d';
    ctx.shadowColor = '#0aff9d';
    ctx.shadowBlur = 20;
    ctx.fillRect(gameState.player.x - 10, gameState.player.y - 10, 20, 20);
    ctx.shadowBlur = 0;

    // Draw crosshair
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mouseRef.current.x - 10, mouseRef.current.y);
    ctx.lineTo(mouseRef.current.x + 10, mouseRef.current.y);
    ctx.moveTo(mouseRef.current.x, mouseRef.current.y - 10);
    ctx.lineTo(mouseRef.current.x, mouseRef.current.y + 10);
    ctx.stroke();

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Health: ${gameState.player.health}`, 10, 25);
    ctx.fillText(`Energy: ${Math.floor(gameState.player.energy)}`, 10, 45);
    ctx.fillText(`Score: ${gameState.score}`, 10, 65);
    ctx.fillText(`Wave: ${gameState.wave}`, 10, 85);
    ctx.fillText(`Enemies: ${gameState.enemies.length}`, 10, 105);
    ctx.fillText(`Weapon: ${gameState.player.weapon.toUpperCase()}`, 10, 125);

    // Weapon selector
    const weaponKeys = Object.keys(weapons);
    weaponKeys.forEach((weapon, index) => {
      const selected = weapon === gameState.player.weapon;
      ctx.fillStyle = selected ? weapons[weapon as keyof typeof weapons].color : '#666666';
      ctx.fillRect(10 + index * 60, canvas.height - 40, 50, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.fillText(`${index + 1}. ${weapon.toUpperCase()}`, 12 + index * 60, canvas.height - 26);
    });

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SECTOR LOST', canvas.width / 2, canvas.height / 2);
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
      ctx.fillText('SECTOR SECURED', canvas.width / 2, canvas.height / 2);
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
      keysRef.current.add(e.key.toLowerCase());
      
      if (e.key.toLowerCase() === 'r' && gameState.gameOver) {
        setGameState(prev => ({ ...prev, wave: 1 }));
        initializeGame();
      }
      
      if (e.key.toLowerCase() === 'n' && gameState.waveComplete) {
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
  }, [gameState.gameOver, gameState.waveComplete, initializeGame]);

  return (
    <GameLayout 
      gameTitle="Dark Sector Showdown"
      gameCategory="Arena combat in dark space sectors"
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
          <p className="text-gray-300">WASD: Move | Mouse: Aim & Shoot | 1-4: Switch Weapons</p>
          <p className="text-gray-400">Survive waves of enemies in the dark sector</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default DarkSectorShowdown;
