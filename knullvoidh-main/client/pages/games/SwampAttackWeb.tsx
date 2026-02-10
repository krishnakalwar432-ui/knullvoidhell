import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Weapon {
  x: number;
  y: number;
  type: 'shotgun' | 'rifle' | 'launcher';
  health: number;
  cooldown: number;
  lastShot: number;
  range: number;
}

interface Enemy {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  type: 'gator' | 'snake' | 'boar' | 'giant';
  reward: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  type: string;
}

const SwampAttackWeb = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon['type']>('shotgun');

  const weaponTypes = {
    shotgun: { cost: 100, health: 100, range: 120, damage: 30, cooldown: 1000 },
    rifle: { cost: 150, health: 80, range: 200, damage: 45, cooldown: 800 },
    launcher: { cost: 250, health: 120, range: 150, damage: 80, cooldown: 2000 }
  };

  const enemyTypes = {
    gator: { health: 80, speed: 1.2, reward: 20, color: '#228B22' },
    snake: { health: 40, speed: 2.5, reward: 15, color: '#8B4513' },
    boar: { health: 120, speed: 1.8, reward: 25, color: '#696969' },
    giant: { health: 300, speed: 0.8, reward: 60, color: '#8B0000' }
  };

  const [gameState, setGameState] = useState({
    weapons: [] as Weapon[],
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    money: 300,
    shackHealth: 100,
    maxShackHealth: 100,
    wave: 1,
    enemiesSpawned: 0,
    enemiesPerWave: 8,
    score: 0,
    gameOver: false,
    waveActive: false,
    lastEnemySpawn: 0
  });

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 500;
  const SHACK_X = 50;

  const spawnEnemy = useCallback(() => {
    const types = Object.keys(enemyTypes) as (keyof typeof enemyTypes)[];
    let type: keyof typeof enemyTypes = 'gator';
    
    if (gameState.wave <= 3) {
      type = Math.random() < 0.7 ? 'gator' : 'snake';
    } else if (gameState.wave <= 6) {
      type = ['gator', 'snake', 'boar'][Math.floor(Math.random() * 3)] as keyof typeof enemyTypes;
    } else {
      type = types[Math.floor(Math.random() * types.length)];
    }
    
    const enemyData = enemyTypes[type];
    
    return {
      x: CANVAS_WIDTH - 20,
      y: 200 + (Math.random() - 0.5) * 200,
      health: enemyData.health + gameState.wave * 10,
      maxHealth: enemyData.health + gameState.wave * 10,
      speed: enemyData.speed,
      type,
      reward: enemyData.reward
    };
  }, [gameState.wave]);

  const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  };

  const update = useCallback(() => {
    if (gameState.gameOver) return;

    setGameState(prev => {
      const newState = { ...prev };
      const currentTime = Date.now();

      // Spawn enemies
      if (newState.waveActive && newState.enemiesSpawned < newState.enemiesPerWave) {
        if (currentTime - newState.lastEnemySpawn > 2000) {
          newState.enemies.push(spawnEnemy());
          newState.enemiesSpawned++;
          newState.lastEnemySpawn = currentTime;
        }
      }

      // Check wave completion
      if (newState.enemiesSpawned >= newState.enemiesPerWave && newState.enemies.length === 0) {
        newState.waveActive = false;
        newState.wave++;
        newState.enemiesSpawned = 0;
        newState.enemiesPerWave = Math.min(20, 8 + newState.wave * 2);
        newState.money += 150; // Wave bonus
      }

      // Move enemies toward shack
      newState.enemies.forEach(enemy => {
        enemy.x -= enemy.speed;
        
        // Check if enemy reached shack
        if (enemy.x < SHACK_X + 40) {
          newState.shackHealth -= 15;
          newState.enemies = newState.enemies.filter(e => e !== enemy);
        }
      });

      // Check game over
      if (newState.shackHealth <= 0) {
        newState.gameOver = true;
      }

      // Weapons shooting
      newState.weapons.forEach(weapon => {
        if (currentTime - weapon.lastShot > weapon.cooldown) {
          // Find closest enemy in range
          let closestEnemy = null;
          let closestDistance = Infinity;
          
          newState.enemies.forEach(enemy => {
            const distance = getDistance(weapon.x, weapon.y, enemy.x, enemy.y);
            if (distance <= weapon.range && distance < closestDistance) {
              closestEnemy = enemy;
              closestDistance = distance;
            }
          });

          if (closestEnemy) {
            const weaponData = weaponTypes[weapon.type];
            const dx = closestEnemy.x - weapon.x;
            const dy = closestEnemy.y - weapon.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (weapon.type === 'shotgun') {
              // Shotgun fires multiple pellets
              for (let i = 0; i < 5; i++) {
                const spread = (Math.random() - 0.5) * 0.3;
                newState.projectiles.push({
                  x: weapon.x,
                  y: weapon.y,
                  vx: (dx / length + spread) * 6,
                  vy: (dy / length + spread) * 6,
                  damage: weaponData.damage / 5,
                  type: 'pellet'
                });
              }
            } else {
              newState.projectiles.push({
                x: weapon.x,
                y: weapon.y,
                vx: (dx / length) * 8,
                vy: (dy / length) * 8,
                damage: weaponData.damage,
                type: weapon.type === 'launcher' ? 'rocket' : 'bullet'
              });
            }
            
            weapon.lastShot = currentTime;
          }
        }
      });

      // Move projectiles and check hits
      newState.projectiles = newState.projectiles.filter(projectile => {
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;
        
        // Check bounds
        if (projectile.x < 0 || projectile.x > CANVAS_WIDTH || 
            projectile.y < 0 || projectile.y > CANVAS_HEIGHT) {
          return false;
        }
        
        // Check enemy hits
        for (let i = newState.enemies.length - 1; i >= 0; i--) {
          const enemy = newState.enemies[i];
          if (getDistance(projectile.x, projectile.y, enemy.x, enemy.y) < 20) {
            enemy.health -= projectile.damage;
            
            if (enemy.health <= 0) {
              newState.money += enemy.reward;
              newState.score += enemy.reward * 10;
              newState.enemies.splice(i, 1);
            }
            
            return false; // Remove projectile
          }
        }
        
        return true;
      });

      return newState;
    });
  }, [gameState.gameOver, spawnEnemy]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with swamp background
    ctx.fillStyle = '#2F4F2F';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw water
    ctx.fillStyle = '#008080';
    ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);

    // Draw shack
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(SHACK_X - 20, 200, 60, 80);
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.moveTo(SHACK_X - 25, 200);
    ctx.lineTo(SHACK_X + 10, 180);
    ctx.lineTo(SHACK_X + 45, 200);
    ctx.fill();

    // Shack health bar
    const healthPercent = gameState.shackHealth / gameState.maxShackHealth;
    ctx.fillStyle = 'red';
    ctx.fillRect(SHACK_X - 20, 190, 60, 8);
    ctx.fillStyle = 'green';
    ctx.fillRect(SHACK_X - 20, 190, 60 * healthPercent, 8);

    // Draw weapons
    gameState.weapons.forEach(weapon => {
      const colors = { shotgun: '#696969', rifle: '#8B4513', launcher: '#2F4F2F' };
      ctx.fillStyle = colors[weapon.type];
      ctx.fillRect(weapon.x - 15, weapon.y - 15, 30, 30);
      
      // Weapon symbols
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      const symbols = { shotgun: '🔫', rifle: '🎯', launcher: '💥' };
      ctx.fillText(symbols[weapon.type], weapon.x, weapon.y + 5);
      
      // Range indicator
      if (weapon.type === selectedWeapon) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(weapon.x, weapon.y, weapon.range, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Draw enemies
    gameState.enemies.forEach(enemy => {
      const enemyData = enemyTypes[enemy.type];
      ctx.fillStyle = enemyData.color;
      ctx.fillRect(enemy.x - 15, enemy.y - 15, 30, 30);
      
      // Enemy symbols
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      const symbols = { gator: '🐊', snake: '🐍', boar: '🐗', giant: '👹' };
      ctx.fillText(symbols[enemy.type], enemy.x, enemy.y + 6);
      
      // Health bar
      const healthPercent = enemy.health / enemy.maxHealth;
      ctx.fillStyle = 'red';
      ctx.fillRect(enemy.x - 15, enemy.y - 25, 30, 4);
      ctx.fillStyle = 'green';
      ctx.fillRect(enemy.x - 15, enemy.y - 25, 30 * healthPercent, 4);
    });

    // Draw projectiles
    gameState.projectiles.forEach(projectile => {
      const colors = { pellet: '#FFD700', bullet: '#FFA500', rocket: '#FF0000' };
      ctx.fillStyle = colors[projectile.type] || '#FFD700';
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.type === 'rocket' ? 5 : 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw UI
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, 50);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Money: $${gameState.money}`, 10, 25);
    ctx.fillText(`Shack: ${gameState.shackHealth}/${gameState.maxShackHealth}`, 150, 25);
    ctx.fillText(`Wave: ${gameState.wave}`, 320, 25);
    ctx.fillText(`Score: ${gameState.score}`, 420, 25);

    if (!gameState.waveActive && !gameState.gameOver) {
      ctx.fillStyle = '#00FF00';
      ctx.fillText('SPACE: Start wave!', 550, 25);
    }

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#FF0000';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Shack Destroyed!', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.fillStyle = '#FFD700';
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText('Press R to rebuild', canvas.width / 2, canvas.height / 2 + 50);
    }
  }, [gameState, selectedWeapon]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (y < 50) return; // UI area

    const weaponData = weaponTypes[selectedWeapon];
    if (gameState.money >= weaponData.cost) {
      // Check if position is valid
      if (x < SHACK_X + 60 && y > 150 && y < 300) {
        const occupied = gameState.weapons.some(w => 
          getDistance(x, y, w.x, w.y) < 40
        );
        
        if (!occupied) {
          const newWeapon: Weapon = {
            x, y,
            type: selectedWeapon,
            health: weaponData.health,
            cooldown: weaponData.cooldown,
            lastShot: 0,
            range: weaponData.range
          };

          setGameState(prev => ({
            ...prev,
            weapons: [...prev.weapons, newWeapon],
            money: prev.money - weaponData.cost
          }));
        }
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' && gameState.gameOver) {
        setGameState({
          weapons: [],
          enemies: [],
          projectiles: [],
          money: 300,
          shackHealth: 100,
          maxShackHealth: 100,
          wave: 1,
          enemiesSpawned: 0,
          enemiesPerWave: 8,
          score: 0,
          gameOver: false,
          waveActive: false,
          lastEnemySpawn: 0
        });
      }
      
      if (e.key === ' ' && !gameState.waveActive && !gameState.gameOver) {
        setGameState(prev => ({ ...prev, waveActive: true }));
      }
      
      // Weapon selection
      if (e.key === '1') setSelectedWeapon('shotgun');
      if (e.key === '2') setSelectedWeapon('rifle');
      if (e.key === '3') setSelectedWeapon('launcher');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.waveActive, gameState.gameOver]);

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
      gameTitle="Swamp Attack Web" 
      gameCategory="Swamp defense"
      showMobileControls={true}
    >
      <div className="flex flex-col items-center gap-4 p-4">
        <div className="flex gap-2 mb-2">
          {Object.entries(weaponTypes).map(([type, data]) => (
            <button
              key={type}
              onClick={() => setSelectedWeapon(type as Weapon['type'])}
              className={`px-3 py-1 rounded text-sm ${
                selectedWeapon === type 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              disabled={gameState.money < data.cost}
            >
              {type} (${data.cost})
            </button>
          ))}
        </div>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-gray-600 bg-green-900 rounded-lg cursor-crosshair max-w-full h-auto"
          onClick={handleCanvasClick}
        />
        <div className="text-center text-gray-300">
          <p>Click to place weapons | 1-3: Select weapon | SPACE: Start wave | R: Restart</p>
          <p>Selected: <span className="text-green-400">{selectedWeapon}</span> (${weaponTypes[selectedWeapon].cost})</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default SwampAttackWeb;
