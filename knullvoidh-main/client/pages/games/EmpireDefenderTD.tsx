import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Tower {
  x: number;
  y: number;
  type: 'archer' | 'cannon' | 'magic' | 'ballista';
  level: number;
  range: number;
  damage: number;
  cooldown: number;
  lastShot: number;
  killCount: number;
}

interface Enemy {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  type: 'soldier' | 'cavalry' | 'siege' | 'commander';
  pathIndex: number;
  reward: number;
  armor: number;
}

interface Projectile {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  damage: number;
  type: string;
}

const EmpireDefenderTD = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const [selectedTower, setSelectedTower] = useState<Tower['type']>('archer');

  const path = [
    { x: 0, y: 200 },
    { x: 150, y: 200 },
    { x: 150, y: 100 },
    { x: 350, y: 100 },
    { x: 350, y: 300 },
    { x: 550, y: 300 },
    { x: 550, y: 150 },
    { x: 750, y: 150 },
    { x: 800, y: 150 }
  ];

  const towerTypes = {
    archer: { cost: 100, range: 100, damage: 25, cooldown: 1200, upgradeCost: 75 },
    cannon: { cost: 200, range: 120, damage: 60, cooldown: 2000, upgradeCost: 150 },
    magic: { cost: 150, range: 90, damage: 40, cooldown: 1500, upgradeCost: 100 },
    ballista: { cost: 250, range: 150, damage: 80, cooldown: 2500, upgradeCost: 200 }
  };

  const enemyTypes = {
    soldier: { health: 100, speed: 1.5, reward: 15, armor: 0, color: '#8B4513' },
    cavalry: { health: 80, speed: 2.5, reward: 20, armor: 10, color: '#DAA520' },
    siege: { health: 250, speed: 0.8, reward: 40, armor: 20, color: '#2F4F4F' },
    commander: { health: 400, speed: 1.2, reward: 100, armor: 30, color: '#8B0000' }
  };

  const [gameState, setGameState] = useState({
    towers: [] as Tower[],
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    gold: 500,
    lives: 20,
    wave: 1,
    enemiesSpawned: 0,
    enemiesPerWave: 12,
    score: 0,
    gameOver: false,
    victory: false,
    waveInProgress: false,
    selectedTowerForUpgrade: null as Tower | null
  });

  const spawnEnemy = useCallback(() => {
    const types = Object.keys(enemyTypes) as (keyof typeof enemyTypes)[];
    let type: keyof typeof enemyTypes = 'soldier';
    
    // Progressive difficulty
    if (gameState.wave <= 5) {
      type = Math.random() < 0.8 ? 'soldier' : 'cavalry';
    } else if (gameState.wave <= 10) {
      const random = Math.random();
      if (random < 0.5) type = 'soldier';
      else if (random < 0.8) type = 'cavalry';
      else type = 'siege';
    } else {
      type = types[Math.floor(Math.random() * types.length)];
    }
    
    const enemyData = enemyTypes[type];
    
    return {
      x: path[0].x,
      y: path[0].y,
      health: enemyData.health + gameState.wave * 15,
      maxHealth: enemyData.health + gameState.wave * 15,
      speed: enemyData.speed,
      type,
      pathIndex: 0,
      reward: enemyData.reward,
      armor: enemyData.armor + Math.floor(gameState.wave / 3)
    };
  }, [gameState.wave]);

  const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  };

  const update = useCallback(() => {
    if (gameState.gameOver || gameState.victory) return;

    setGameState(prev => {
      const newState = { ...prev };
      const currentTime = Date.now();

      // Spawn enemies
      if (newState.waveInProgress && newState.enemiesSpawned < newState.enemiesPerWave) {
        if (Math.random() < 0.03) {
          newState.enemies.push(spawnEnemy());
          newState.enemiesSpawned++;
        }
      }

      // Check wave completion
      if (newState.enemiesSpawned >= newState.enemiesPerWave && newState.enemies.length === 0) {
        newState.waveInProgress = false;
        if (newState.wave >= 20) {
          newState.victory = true;
        } else {
          newState.wave++;
          newState.enemiesSpawned = 0;
          newState.enemiesPerWave = Math.min(30, 12 + newState.wave * 2);
          newState.gold += 200; // Wave bonus
        }
      }

      // Move enemies along path
      newState.enemies.forEach(enemy => {
        if (enemy.pathIndex < path.length - 1) {
          const target = path[enemy.pathIndex + 1];
          const dx = target.x - enemy.x;
          const dy = target.y - enemy.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < enemy.speed) {
            enemy.pathIndex++;
            if (enemy.pathIndex < path.length) {
              enemy.x = path[enemy.pathIndex].x;
              enemy.y = path[enemy.pathIndex].y;
            }
          } else {
            enemy.x += (dx / distance) * enemy.speed;
            enemy.y += (dy / distance) * enemy.speed;
          }
        }
      });

      // Remove enemies that reached the end
      const enemiesAtEnd = newState.enemies.filter(enemy => enemy.pathIndex >= path.length - 1);
      newState.lives -= enemiesAtEnd.length;
      newState.enemies = newState.enemies.filter(enemy => enemy.pathIndex < path.length - 1);

      if (newState.lives <= 0) {
        newState.gameOver = true;
      }

      // Tower shooting
      newState.towers.forEach(tower => {
        if (currentTime - tower.lastShot > tower.cooldown) {
          // Find closest enemy in range
          let closestEnemy = null;
          let closestDistance = Infinity;
          
          newState.enemies.forEach(enemy => {
            const distance = getDistance(tower.x, tower.y, enemy.x, enemy.y);
            if (distance <= tower.range && distance < closestDistance) {
              closestEnemy = enemy;
              closestDistance = distance;
            }
          });

          if (closestEnemy) {
            newState.projectiles.push({
              x: tower.x,
              y: tower.y,
              targetX: closestEnemy.x,
              targetY: closestEnemy.y,
              speed: tower.type === 'cannon' ? 4 : 6,
              damage: tower.damage + (tower.level - 1) * 15,
              type: tower.type
            });
            tower.lastShot = currentTime;
          }
        }
      });

      // Move projectiles and check hits
      newState.projectiles = newState.projectiles.filter(projectile => {
        const dx = projectile.targetX - projectile.x;
        const dy = projectile.targetY - projectile.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < projectile.speed) {
          // Hit area damage for certain tower types
          const damageRadius = projectile.type === 'cannon' ? 40 : 20;
          
          newState.enemies.forEach(enemy => {
            const dist = getDistance(projectile.targetX, projectile.targetY, enemy.x, enemy.y);
            if (dist < damageRadius) {
              const actualDamage = Math.max(1, projectile.damage - enemy.armor);
              enemy.health -= actualDamage;
            }
          });
          
          return false; // Remove projectile
        } else {
          projectile.x += (dx / distance) * projectile.speed;
          projectile.y += (dy / distance) * projectile.speed;
          return true; // Keep projectile
        }
      });

      // Remove dead enemies and award gold
      const deadEnemies = newState.enemies.filter(e => e.health <= 0);
      deadEnemies.forEach(enemy => {
        newState.gold += enemy.reward;
        newState.score += enemy.reward * 10;
        
        // Award kill to nearest tower
        let nearestTower = null;
        let nearestDistance = Infinity;
        newState.towers.forEach(tower => {
          const dist = getDistance(tower.x, tower.y, enemy.x, enemy.y);
          if (dist < nearestDistance && dist <= tower.range) {
            nearestTower = tower;
            nearestDistance = dist;
          }
        });
        if (nearestTower) {
          nearestTower.killCount++;
        }
      });
      newState.enemies = newState.enemies.filter(e => e.health > 0);

      return newState;
    });
  }, [gameState.gameOver, gameState.victory, spawnEnemy]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with battlefield background
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw path
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 30;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();

    // Draw towers
    gameState.towers.forEach(tower => {
      const colors = {
        archer: '#8B4513',
        cannon: '#2F4F2F',
        magic: '#4B0082',
        ballista: '#B8860B'
      };
      
      ctx.fillStyle = colors[tower.type];
      ctx.fillRect(tower.x - 20, tower.y - 20, 40, 40);
      
      // Tower level indicator
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(tower.level.toString(), tower.x, tower.y - 25);
      
      // Tower symbols
      const symbols = { archer: '🏹', cannon: '💣', magic: '🔮', ballista: '⚔️' };
      ctx.font = '16px Arial';
      ctx.fillText(symbols[tower.type], tower.x, tower.y + 6);
      
      // Range circle for selected tower
      if (tower === gameState.selectedTowerForUpgrade) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Draw enemies
    gameState.enemies.forEach(enemy => {
      const enemyData = enemyTypes[enemy.type];
      ctx.fillStyle = enemyData.color;
      const size = enemy.type === 'siege' ? 35 : 25;
      ctx.fillRect(enemy.x - size/2, enemy.y - size/2, size, size);
      
      // Enemy symbols
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      const symbols = { soldier: '⚔️', cavalry: '🐎', siege: '🏰', commander: '👑' };
      ctx.fillText(symbols[enemy.type], enemy.x, enemy.y + 5);
      
      // Health bar
      const healthPercent = enemy.health / enemy.maxHealth;
      ctx.fillStyle = 'red';
      ctx.fillRect(enemy.x - 15, enemy.y - 20, 30, 4);
      ctx.fillStyle = 'green';
      ctx.fillRect(enemy.x - 15, enemy.y - 20, 30 * healthPercent, 4);
    });

    // Draw projectiles
    gameState.projectiles.forEach(projectile => {
      const colors = { archer: '#8B4513', cannon: '#FF4500', magic: '#9370DB', ballista: '#FFD700' };
      ctx.fillStyle = colors[projectile.type] || '#FFD700';
      const size = projectile.type === 'cannon' ? 6 : 4;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw UI
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, 80);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Gold: ${gameState.gold}`, 20, 25);
    ctx.fillText(`Lives: ${gameState.lives}`, 20, 50);
    ctx.fillText(`Wave: ${gameState.wave}`, 150, 25);
    ctx.fillText(`Score: ${gameState.score}`, 150, 50);

    if (!gameState.waveInProgress && !gameState.gameOver && !gameState.victory) {
      ctx.fillStyle = '#00FF00';
      ctx.fillText('SPACE: Start next wave!', 300, 35);
    }

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#FF0000';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Empire Fallen!', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.fillStyle = '#FFD700';
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText('Press R to rebuild', canvas.width / 2, canvas.height / 2 + 50);
    }

    if (gameState.victory) {
      ctx.fillStyle = 'rgba(0, 100, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#00FF00';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Empire Defended!', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.fillStyle = '#FFD700';
      ctx.font = '24px Arial';
      ctx.fillText(`Victory! Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText('Press R to play again', canvas.width / 2, canvas.height / 2 + 50);
    }
  }, [gameState]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.gameOver || gameState.victory) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (y < 80) return; // UI area

    // Check if clicking on existing tower for upgrade
    const clickedTower = gameState.towers.find(tower => 
      getDistance(x, y, tower.x, tower.y) < 25
    );

    if (clickedTower) {
      setGameState(prev => ({
        ...prev,
        selectedTowerForUpgrade: clickedTower === prev.selectedTowerForUpgrade ? null : clickedTower
      }));
      return;
    }

    // Place new tower
    const towerData = towerTypes[selectedTower];
    if (gameState.gold >= towerData.cost) {
      // Check if position is valid (not on path)
      let validPosition = true;
      for (const pathPoint of path) {
        if (getDistance(x, y, pathPoint.x, pathPoint.y) < 40) {
          validPosition = false;
          break;
        }
      }

      // Check if position is not occupied
      for (const tower of gameState.towers) {
        if (getDistance(x, y, tower.x, tower.y) < 45) {
          validPosition = false;
          break;
        }
      }

      if (validPosition) {
        const newTower: Tower = {
          x, y,
          type: selectedTower,
          level: 1,
          range: towerData.range,
          damage: towerData.damage,
          cooldown: towerData.cooldown,
          lastShot: 0,
          killCount: 0
        };

        setGameState(prev => ({
          ...prev,
          towers: [...prev.towers, newTower],
          gold: prev.gold - towerData.cost,
          selectedTowerForUpgrade: null
        }));
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' && (gameState.gameOver || gameState.victory)) {
        setGameState({
          towers: [],
          enemies: [],
          projectiles: [],
          gold: 500,
          lives: 20,
          wave: 1,
          enemiesSpawned: 0,
          enemiesPerWave: 12,
          score: 0,
          gameOver: false,
          victory: false,
          waveInProgress: false,
          selectedTowerForUpgrade: null
        });
      }
      
      if (e.key === ' ' && !gameState.waveInProgress && !gameState.gameOver && !gameState.victory) {
        setGameState(prev => ({ ...prev, waveInProgress: true }));
      }
      
      // Tower selection
      if (e.key === '1') setSelectedTower('archer');
      if (e.key === '2') setSelectedTower('cannon');
      if (e.key === '3') setSelectedTower('magic');
      if (e.key === '4') setSelectedTower('ballista');

      // Upgrade selected tower
      if (e.key === 'u' && gameState.selectedTowerForUpgrade) {
        const tower = gameState.selectedTowerForUpgrade;
        const towerData = towerTypes[tower.type];
        const upgradeCost = towerData.upgradeCost * tower.level;
        
        if (gameState.gold >= upgradeCost && tower.level < 5) {
          setGameState(prev => ({
            ...prev,
            gold: prev.gold - upgradeCost,
            towers: prev.towers.map(t => t === tower ? {
              ...t,
              level: t.level + 1,
              damage: t.damage + 15,
              range: t.range + 10
            } : t)
          }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.waveInProgress, gameState.gameOver, gameState.victory, gameState.selectedTowerForUpgrade]);

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
      gameTitle="Empire Defender TD" 
      gameCategory="Classic tower defense"
      showMobileControls={true}
    >
      <div className="flex flex-col items-center gap-4 p-4">
        <div className="flex gap-2 mb-2">
          {Object.entries(towerTypes).map(([type, data]) => (
            <button
              key={type}
              onClick={() => setSelectedTower(type as Tower['type'])}
              className={`px-3 py-1 rounded text-sm ${
                selectedTower === type 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              disabled={gameState.gold < data.cost}
            >
              {type} ({data.cost}g)
            </button>
          ))}
        </div>
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="border border-gray-600 bg-green-200 rounded-lg cursor-crosshair max-w-full h-auto"
          onClick={handleCanvasClick}
        />
        <div className="text-center text-gray-300">
          <p>Click to place towers | 1-4: Select tower | SPACE: Start wave | U: Upgrade | R: Restart</p>
          <p>Selected: <span className="text-yellow-400">{selectedTower}</span> ({towerTypes[selectedTower].cost}g)</p>
          {gameState.selectedTowerForUpgrade && (
            <p className="text-cyan-400">
              Selected tower: Level {gameState.selectedTowerForUpgrade.level} | 
              Upgrade cost: {towerTypes[gameState.selectedTowerForUpgrade.type].upgradeCost * gameState.selectedTowerForUpgrade.level}g
            </p>
          )}
        </div>
      </div>
    </GameLayout>
  );
};

export default EmpireDefenderTD;
