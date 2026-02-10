import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Tower {
  x: number;
  y: number;
  type: 'archer' | 'barracks' | 'mage' | 'artillery';
  level: number;
  range: number;
  damage: number;
  cooldown: number;
  lastShot: number;
}

interface Enemy {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  type: 'goblin' | 'orc' | 'troll' | 'boss';
  pathIndex: number;
  reward: number;
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

const KingdomRush = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const [selectedTowerType, setSelectedTowerType] = useState<Tower['type']>('archer');

  const path = [
    { x: 0, y: 300 },
    { x: 200, y: 300 },
    { x: 200, y: 200 },
    { x: 400, y: 200 },
    { x: 400, y: 400 },
    { x: 600, y: 400 },
    { x: 600, y: 300 },
    { x: 800, y: 300 }
  ];

  const [gameState, setGameState] = useState({
    towers: [] as Tower[],
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    gold: 200,
    lives: 20,
    wave: 1,
    enemiesSpawned: 0,
    enemiesPerWave: 10,
    score: 0,
    gameOver: false,
    waveInProgress: false
  });

  const towerCosts = {
    archer: 70,
    barracks: 70,
    mage: 100,
    artillery: 120
  };

  const enemyTypes = {
    goblin: { health: 50, speed: 2, reward: 5, color: '#90EE90' },
    orc: { health: 100, speed: 1.5, reward: 8, color: '#8B4513' },
    troll: { health: 200, speed: 1, reward: 15, color: '#696969' },
    boss: { health: 500, speed: 0.8, reward: 50, color: '#8B0000' }
  };

  const spawnEnemy = useCallback(() => {
    const types = Object.keys(enemyTypes) as (keyof typeof enemyTypes)[];
    const type = types[Math.floor(Math.random() * types.length)];
    const enemyData = enemyTypes[type];
    
    return {
      x: path[0].x,
      y: path[0].y,
      health: enemyData.health,
      maxHealth: enemyData.health,
      speed: enemyData.speed,
      type,
      pathIndex: 0,
      reward: enemyData.reward
    };
  }, []);

  const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  };

  const update = useCallback(() => {
    if (gameState.gameOver) return;

    setGameState(prev => {
      const newState = { ...prev };

      // Spawn enemies for current wave
      if (newState.waveInProgress && newState.enemiesSpawned < newState.enemiesPerWave) {
        if (Math.random() < 0.02) {
          newState.enemies.push(spawnEnemy());
          newState.enemiesSpawned++;
        }
      }

      // Check if wave is complete
      if (newState.enemiesSpawned >= newState.enemiesPerWave && newState.enemies.length === 0) {
        newState.waveInProgress = false;
        newState.wave++;
        newState.enemiesSpawned = 0;
        newState.enemiesPerWave += 2;
        newState.gold += 50; // Wave completion bonus
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
            if (enemy.pathIndex < path.length - 1) {
              const nextTarget = path[enemy.pathIndex + 1];
              enemy.x = nextTarget.x;
              enemy.y = nextTarget.y;
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
      const currentTime = Date.now();
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
              speed: 5,
              damage: tower.damage,
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
          // Hit target - damage closest enemy
          let closestEnemy = null;
          let closestDistance = Infinity;
          
          newState.enemies.forEach(enemy => {
            const dist = getDistance(projectile.targetX, projectile.targetY, enemy.x, enemy.y);
            if (dist < closestDistance) {
              closestEnemy = enemy;
              closestDistance = dist;
            }
          });

          if (closestEnemy && closestDistance < 30) {
            closestEnemy.health -= projectile.damage;
            if (closestEnemy.health <= 0) {
              newState.gold += closestEnemy.reward;
              newState.score += closestEnemy.reward * 10;
              newState.enemies = newState.enemies.filter(e => e !== closestEnemy);
            }
          }
          return false; // Remove projectile
        } else {
          projectile.x += (dx / distance) * projectile.speed;
          projectile.y += (dy / distance) * projectile.speed;
          return true; // Keep projectile
        }
      });

      return newState;
    });
  }, [gameState.gameOver, spawnEnemy]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with grass background
    ctx.fillStyle = '#228B22';
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
        barracks: '#A0A0A0',
        mage: '#4169E1',
        artillery: '#DC143C'
      };
      
      ctx.fillStyle = colors[tower.type];
      ctx.fillRect(tower.x - 15, tower.y - 15, 30, 30);
      
      // Draw range circle when tower is selected
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw enemies
    gameState.enemies.forEach(enemy => {
      const enemyData = enemyTypes[enemy.type];
      ctx.fillStyle = enemyData.color;
      ctx.fillRect(enemy.x - 10, enemy.y - 10, 20, 20);
      
      // Health bar
      const healthPercent = enemy.health / enemy.maxHealth;
      ctx.fillStyle = 'red';
      ctx.fillRect(enemy.x - 12, enemy.y - 18, 24, 4);
      ctx.fillStyle = 'green';
      ctx.fillRect(enemy.x - 12, enemy.y - 18, 24 * healthPercent, 4);
    });

    // Draw projectiles
    ctx.fillStyle = '#FFD700';
    gameState.projectiles.forEach(projectile => {
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw UI
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, 80);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = '20px Arial';
    ctx.fillText(`Gold: ${gameState.gold}`, 20, 25);
    ctx.fillText(`Lives: ${gameState.lives}`, 20, 50);
    ctx.fillText(`Wave: ${gameState.wave}`, 150, 25);
    ctx.fillText(`Score: ${gameState.score}`, 150, 50);

    if (!gameState.waveInProgress) {
      ctx.fillStyle = '#00FF00';
      ctx.fillText('Click to start next wave!', 300, 35);
    }

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#FF0000';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.fillStyle = '#FFD700';
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 50);
      ctx.textAlign = 'left';
    }
  }, [gameState]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Start wave if not in progress
    if (!gameState.waveInProgress && y < 80) {
      setGameState(prev => ({ ...prev, waveInProgress: true }));
      return;
    }

    // Place tower if we have enough gold and valid position
    const cost = towerCosts[selectedTowerType];
    if (gameState.gold >= cost && y > 80) {
      // Check if position is valid (not on path)
      let validPosition = true;
      for (const pathPoint of path) {
        if (getDistance(x, y, pathPoint.x, pathPoint.y) < 40) {
          validPosition = false;
          break;
        }
      }

      // Check if position is not occupied by another tower
      for (const tower of gameState.towers) {
        if (getDistance(x, y, tower.x, tower.y) < 40) {
          validPosition = false;
          break;
        }
      }

      if (validPosition) {
        const newTower: Tower = {
          x,
          y,
          type: selectedTowerType,
          level: 1,
          range: selectedTowerType === 'archer' ? 80 : selectedTowerType === 'mage' ? 60 : 100,
          damage: selectedTowerType === 'archer' ? 20 : selectedTowerType === 'mage' ? 30 : 40,
          cooldown: selectedTowerType === 'archer' ? 800 : selectedTowerType === 'mage' ? 1200 : 1500,
          lastShot: 0
        };

        setGameState(prev => ({
          ...prev,
          towers: [...prev.towers, newTower],
          gold: prev.gold - cost
        }));
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' && gameState.gameOver) {
        setGameState({
          towers: [],
          enemies: [],
          projectiles: [],
          gold: 200,
          lives: 20,
          wave: 1,
          enemiesSpawned: 0,
          enemiesPerWave: 10,
          score: 0,
          gameOver: false,
          waveInProgress: false
        });
      }
      
      // Tower selection hotkeys
      if (e.key === '1') setSelectedTowerType('archer');
      if (e.key === '2') setSelectedTowerType('barracks');
      if (e.key === '3') setSelectedTowerType('mage');
      if (e.key === '4') setSelectedTowerType('artillery');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.gameOver]);

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
    <GameLayout gameTitle="Kingdom Rush" gameCategory="Tower defense">
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2 mb-2">
          {Object.entries(towerCosts).map(([type, cost]) => (
            <button
              key={type}
              onClick={() => setSelectedTowerType(type as Tower['type'])}
              className={`px-3 py-1 rounded text-sm ${
                selectedTowerType === type 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {type} (${cost})
            </button>
          ))}
        </div>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-green-800 rounded-lg cursor-crosshair"
          onClick={handleCanvasClick}
        />
        <div className="text-center text-gray-300">
          <p>Click to place towers | 1-4: Select tower type | R: Restart</p>
          <p>Selected: <span className="text-blue-400">{selectedTowerType}</span> (${towerCosts[selectedTowerType]})</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default KingdomRush;
