import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Tower {
  x: number;
  y: number;
  type: 'fire' | 'ice' | 'poison';
  level: number;
  range: number;
  damage: number;
  cooldown: number;
  lastShot: number;
  cost: number;
}

interface Enemy {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  type: 'knight' | 'archer' | 'paladin' | 'hero';
  pathIndex: number;
  reward: number;
  effects: Array<{type: string, duration: number}>;
}

interface Projectile {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  damage: number;
  type: string;
  tower: Tower;
}

const CursedTreasure = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const [selectedTowerType, setSelectedTowerType] = useState<Tower['type']>('fire');

  const GRID_SIZE = 40;
  const path = [
    { x: 0, y: 300 }, { x: 200, y: 300 }, { x: 200, y: 200 },
    { x: 400, y: 200 }, { x: 400, y: 400 }, { x: 600, y: 400 },
    { x: 600, y: 300 }, { x: 800, y: 300 }
  ];

  const [gameState, setGameState] = useState({
    towers: [] as Tower[],
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    gems: 3,
    gold: 150,
    score: 0,
    gameOver: false,
    wave: 1,
    enemySpawnTimer: 0,
    waveProgress: 0
  });

  const towerTypes = {
    fire: { cost: 80, damage: 40, range: 80, cooldown: 60, color: '#ff4400' },
    ice: { cost: 100, damage: 25, range: 70, cooldown: 80, color: '#4488ff' },
    poison: { cost: 120, damage: 30, range: 90, cooldown: 70, color: '#44aa44' }
  };

  const enemyTypes = {
    knight: { health: 80, speed: 1.5, reward: 15, color: '#aaaaaa' },
    archer: { health: 60, speed: 2, reward: 20, color: '#884422' },
    paladin: { health: 150, speed: 1, reward: 30, color: '#ffdd00' },
    hero: { health: 300, speed: 0.8, reward: 50, color: '#0066ff' }
  };

  const spawnEnemy = useCallback((type: Enemy['type'] = 'knight') => {
    const enemyData = enemyTypes[type];
    return {
      x: path[0].x,
      y: path[0].y,
      health: enemyData.health + (gameState.wave - 1) * 20,
      maxHealth: enemyData.health + (gameState.wave - 1) * 20,
      speed: enemyData.speed,
      type,
      pathIndex: 0,
      reward: enemyData.reward,
      effects: []
    };
  }, [gameState.wave]);

  const initializeGame = useCallback(() => {
    setGameState({
      towers: [],
      enemies: [],
      projectiles: [],
      gems: 3,
      gold: 150,
      score: 0,
      gameOver: false,
      wave: 1,
      enemySpawnTimer: 0,
      waveProgress: 0
    });
  }, []);

  const getGridPosition = (x: number, y: number) => {
    return {
      x: Math.floor(x / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2,
      y: Math.floor(y / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2
    };
  };

  const canPlaceTower = (x: number, y: number) => {
    // Check if position is on path
    for (let i = 0; i < path.length - 1; i++) {
      const dist = Math.abs(x - path[i].x) + Math.abs(y - path[i].y);
      if (dist < 60) return false;
    }
    
    // Check if tower already exists
    return !gameState.towers.some(tower => 
      Math.abs(tower.x - x) < GRID_SIZE && Math.abs(tower.y - y) < GRID_SIZE
    );
  };

  const placeTower = (x: number, y: number) => {
    const gridPos = getGridPosition(x, y);
    if (!canPlaceTower(gridPos.x, gridPos.y)) return;
    
    const towerData = towerTypes[selectedTowerType];
    if (gameState.gold < towerData.cost) return;

    const newTower: Tower = {
      x: gridPos.x,
      y: gridPos.y,
      type: selectedTowerType,
      level: 1,
      range: towerData.range,
      damage: towerData.damage,
      cooldown: towerData.cooldown,
      lastShot: 0,
      cost: towerData.cost
    };

    setGameState(prev => ({
      ...prev,
      towers: [...prev.towers, newTower],
      gold: prev.gold - towerData.cost
    }));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    placeTower(mouseX, mouseY);
  };

  const update = useCallback(() => {
    if (gameState.gameOver) return;

    setGameState(prev => {
      const newState = { ...prev };
      let towers = [...newState.towers];
      let enemies = [...newState.enemies];
      let projectiles = [...newState.projectiles];

      // Spawn enemies
      newState.enemySpawnTimer++;
      const spawnRate = Math.max(80, 150 - newState.wave * 5);
      
      if (newState.enemySpawnTimer > spawnRate) {
        const enemyTypes = ['knight', 'archer', 'paladin', 'hero'] as const;
        const weights = [0.5, 0.3, 0.15, 0.05];
        const rand = Math.random();
        let cumulative = 0;
        let selectedType: 'knight' | 'archer' | 'paladin' | 'hero' = 'knight';

        for (let i = 0; i < weights.length; i++) {
          cumulative += weights[i];
          if (rand < cumulative) {
            selectedType = enemyTypes[i] as 'knight' | 'archer' | 'paladin' | 'hero';
            break;
          }
        }
        
        enemies.push(spawnEnemy(selectedType));
        newState.enemySpawnTimer = 0;
        newState.waveProgress++;
      }

      // Update enemies
      enemies = enemies.map(enemy => {
        const newEnemy = { ...enemy };
        
        // Update effects
        newEnemy.effects = newEnemy.effects.map(effect => ({
          ...effect,
          duration: effect.duration - 1
        })).filter(effect => effect.duration > 0);
        
        // Apply effect modifications
        let speedMultiplier = 1;
        if (newEnemy.effects.some(e => e.type === 'ice')) speedMultiplier *= 0.5;
        if (newEnemy.effects.some(e => e.type === 'poison')) {
          newEnemy.health -= 2;
        }
        
        // Move along path
        if (newEnemy.pathIndex < path.length - 1) {
          const currentPoint = path[newEnemy.pathIndex];
          const nextPoint = path[newEnemy.pathIndex + 1];
          
          const dx = nextPoint.x - currentPoint.x;
          const dy = nextPoint.y - currentPoint.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          const moveDistance = newEnemy.speed * speedMultiplier;
          newEnemy.x += (dx / distance) * moveDistance;
          newEnemy.y += (dy / distance) * moveDistance;
          
          // Check if reached next waypoint
          if (Math.abs(newEnemy.x - nextPoint.x) < 5 && Math.abs(newEnemy.y - nextPoint.y) < 5) {
            newEnemy.pathIndex++;
            newEnemy.x = nextPoint.x;
            newEnemy.y = nextPoint.y;
          }
        }
        
        return newEnemy;
      }).filter(enemy => enemy.health > 0);

      // Remove enemies that reached the end
      const survivingEnemies = enemies.filter(enemy => enemy.pathIndex < path.length - 1);
      const escapedEnemies = enemies.length - survivingEnemies.length;
      
      if (escapedEnemies > 0) {
        newState.gems -= escapedEnemies;
        if (newState.gems <= 0) {
          newState.gameOver = true;
        }
      }
      enemies = survivingEnemies;

      // Tower shooting
      towers = towers.map(tower => {
        const newTower = { ...tower };
        newTower.lastShot++;
        
        if (newTower.lastShot >= newTower.cooldown) {
          // Find enemy in range
          const targetEnemy = enemies.find(enemy => {
            const dx = enemy.x - newTower.x;
            const dy = enemy.y - newTower.y;
            return Math.sqrt(dx * dx + dy * dy) <= newTower.range;
          });
          
          if (targetEnemy) {
            projectiles.push({
              x: newTower.x,
              y: newTower.y,
              targetX: targetEnemy.x,
              targetY: targetEnemy.y,
              speed: 8,
              damage: newTower.damage,
              type: newTower.type,
              tower: newTower
            });
            newTower.lastShot = 0;
          }
        }
        
        return newTower;
      });

      // Update projectiles
      projectiles = projectiles.map(projectile => {
        const dx = projectile.targetX - projectile.x;
        const dy = projectile.targetY - projectile.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < projectile.speed) {
          // Hit target
          const hitEnemy = enemies.find(enemy => 
            Math.abs(enemy.x - projectile.targetX) < 20 && 
            Math.abs(enemy.y - projectile.targetY) < 20
          );
          
          if (hitEnemy) {
            hitEnemy.health -= projectile.damage;
            
            // Apply effects
            if (projectile.type === 'ice') {
              hitEnemy.effects.push({ type: 'ice', duration: 120 });
            } else if (projectile.type === 'poison') {
              hitEnemy.effects.push({ type: 'poison', duration: 180 });
            }
            
            if (hitEnemy.health <= 0) {
              newState.gold += hitEnemy.reward;
              newState.score += hitEnemy.reward * 10;
            }
          }
          
          return null;
        }
        
        return {
          ...projectile,
          x: projectile.x + (dx / distance) * projectile.speed,
          y: projectile.y + (dy / distance) * projectile.speed
        };
      }).filter(p => p !== null) as Projectile[];

      // Wave progression
      if (enemies.length === 0 && newState.waveProgress > 8 + newState.wave * 2) {
        newState.wave++;
        newState.waveProgress = 0;
        newState.gold += 50; // Wave bonus
        newState.score += 200;
      }

      newState.towers = towers;
      newState.enemies = enemies;
      newState.projectiles = projectiles;
      return newState;
    });
  }, [gameState.gameOver, spawnEnemy]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with dark fantasy background
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#2c1810');
    gradient.addColorStop(1, '#1a0f08');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw path
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();

    // Draw path borders
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 44;
    ctx.stroke();
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 40;
    ctx.stroke();

    // Draw grid for tower placement
    ctx.strokeStyle = 'rgba(100, 50, 0, 0.3)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw towers
    gameState.towers.forEach(tower => {
      const towerData = towerTypes[tower.type];
      
      // Tower base
      ctx.fillStyle = '#444444';
      ctx.fillRect(tower.x - 15, tower.y - 15, 30, 30);
      
      // Tower color
      ctx.fillStyle = towerData.color;
      ctx.fillRect(tower.x - 12, tower.y - 12, 24, 24);
      
      // Tower symbol
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      const symbol = tower.type === 'fire' ? '🔥' : tower.type === 'ice' ? '❄️' : '☠️';
      ctx.fillText(symbol, tower.x, tower.y + 5);
      
      // Range indicator when selected
      if (selectedTowerType === tower.type) {
        ctx.strokeStyle = towerData.color + '40';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Draw enemies
    gameState.enemies.forEach(enemy => {
      const enemyData = enemyTypes[enemy.type];
      
      // Enemy body
      ctx.fillStyle = enemyData.color;
      ctx.fillRect(enemy.x - 10, enemy.y - 10, 20, 20);
      
      // Enemy details
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(enemy.x - 6, enemy.y - 6, 4, 4);
      ctx.fillRect(enemy.x + 2, enemy.y - 6, 4, 4);
      ctx.fillRect(enemy.x - 3, enemy.y + 2, 6, 3);
      
      // Health bar
      if (enemy.health < enemy.maxHealth) {
        const healthPercent = enemy.health / enemy.maxHealth;
        ctx.fillStyle = '#660000';
        ctx.fillRect(enemy.x - 12, enemy.y - 18, 24, 4);
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(enemy.x - 12, enemy.y - 18, 24 * healthPercent, 4);
      }
      
      // Effect indicators
      enemy.effects.forEach((effect, index) => {
        const color = effect.type === 'ice' ? '#4488ff' : '#44aa44';
        ctx.fillStyle = color;
        ctx.fillRect(enemy.x - 8 + index * 4, enemy.y + 12, 3, 3);
      });
    });

    // Draw projectiles
    gameState.projectiles.forEach(projectile => {
      const color = towerTypes[projectile.type as keyof typeof towerTypes].color;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw UI
    ctx.fillStyle = '#ffdd00';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Gems: ${gameState.gems}`, 20, 30);
    ctx.fillText(`Gold: ${gameState.gold}`, 20, 60);
    ctx.fillText(`Score: ${gameState.score}`, 20, 90);
    ctx.fillText(`Wave: ${gameState.wave}`, 20, 120);

    // Tower selection UI
    const towerNames = ['Fire', 'Ice', 'Poison'];
    const towerCosts = [80, 100, 120];
    
    towerNames.forEach((name, index) => {
      const type = ['fire', 'ice', 'poison'][index] as Tower['type'];
      const x = 600 + index * 65;
      const y = 20;
      
      ctx.fillStyle = selectedTowerType === type ? '#ffff00' : 
                     gameState.gold >= towerCosts[index] ? towerTypes[type].color : '#660000';
      ctx.fillRect(x, y, 60, 60);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(name, x + 30, y + 25);
      ctx.fillText(`${towerCosts[index]}g`, x + 30, y + 45);
      
      // Tower icon
      const symbol = type === 'fire' ? '🔥' : type === 'ice' ? '❄️' : '☠️';
      ctx.font = '20px Arial';
      ctx.fillText(symbol, x + 30, y + 40);
    });

    // Draw game over screen
    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#ff0000';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Your treasure was stolen!', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.fillStyle = '#ffdd00';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText(`Wave Reached: ${gameState.wave}`, canvas.width / 2, canvas.height / 2 + 30);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 70);
      ctx.textAlign = 'left';
    }
  }, [gameState, selectedTowerType]);

  const handleTowerSelection = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Check tower selection UI
    if (mouseY >= 20 && mouseY <= 80) {
      const towerIndex = Math.floor((mouseX - 600) / 65);
      const types: Tower['type'][] = ['fire', 'ice', 'poison'];
      
      if (towerIndex >= 0 && towerIndex < types.length) {
        setSelectedTowerType(types[towerIndex]);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r' && gameState.gameOver) {
        initializeGame();
      }
      
      const keyToTower: {[key: string]: Tower['type']} = {
        '1': 'fire',
        '2': 'ice',
        '3': 'poison'
      };
      
      if (keyToTower[e.key]) {
        setSelectedTowerType(keyToTower[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.gameOver, initializeGame]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

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
    <GameLayout gameTitle="Cursed Treasure" gameCategory="Dark fantasy tower defense">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg shadow-2xl cursor-pointer"
          onClick={(e) => { handleCanvasClick(e); handleTowerSelection(e); }}
        />
        <div className="text-center text-gray-300">
          <p>Click to place towers | 1-3: Select tower type | R: Restart</p>
          <p>Defend your cursed gems from heroic invaders!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default CursedTreasure;
