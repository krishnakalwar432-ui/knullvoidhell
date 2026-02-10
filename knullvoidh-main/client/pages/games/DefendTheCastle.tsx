import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Defense {
  x: number;
  y: number;
  type: 'archer' | 'catapult' | 'ballista' | 'wall';
  health: number;
  maxHealth: number;
  cooldown: number;
  lastShot: number;
  level: number;
}

interface Enemy {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  type: 'knight' | 'orc' | 'troll' | 'dragon';
  reward: number;
}

interface Projectile {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  damage: number;
  type: 'arrow' | 'boulder' | 'bolt';
}

const DefendTheCastle = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const [selectedDefense, setSelectedDefense] = useState<Defense['type']>('archer');

  const defenseTypes = {
    archer: { cost: 80, health: 100, range: 150, damage: 25, cooldown: 1200, description: 'Fast arrows' },
    catapult: { cost: 200, health: 150, range: 200, damage: 60, cooldown: 3000, description: 'Area damage' },
    ballista: { cost: 150, health: 120, range: 180, damage: 45, cooldown: 2000, description: 'Piercing bolts' },
    wall: { cost: 50, health: 300, range: 0, damage: 0, cooldown: 0, description: 'Blocks enemies' }
  };

  const enemyTypes = {
    knight: { health: 80, speed: 1.5, reward: 15, color: '#C0C0C0' },
    orc: { health: 120, speed: 1.2, reward: 20, color: '#8FBC8F' },
    troll: { health: 250, speed: 0.8, reward: 40, color: '#696969' },
    dragon: { health: 400, speed: 1.0, reward: 100, color: '#8B0000' }
  };

  const [gameState, setGameState] = useState({
    defenses: [] as Defense[],
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    gold: 300,
    castleHealth: 100,
    maxCastleHealth: 100,
    wave: 1,
    enemiesSpawned: 0,
    enemiesPerWave: 8,
    score: 0,
    gameOver: false,
    victory: false,
    waveInProgress: false
  });

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 500;
  const CASTLE_X = 50;
  const SPAWN_X = CANVAS_WIDTH - 50;

  const spawnEnemy = useCallback(() => {
    const types = Object.keys(enemyTypes) as (keyof typeof enemyTypes)[];
    let type: keyof typeof enemyTypes = 'knight';
    
    // Difficulty scaling based on wave
    if (gameState.wave <= 3) {
      type = Math.random() < 0.8 ? 'knight' : 'orc';
    } else if (gameState.wave <= 6) {
      type = ['knight', 'orc'][Math.floor(Math.random() * 2)] as keyof typeof enemyTypes;
    } else if (gameState.wave <= 10) {
      type = ['knight', 'orc', 'troll'][Math.floor(Math.random() * 3)] as keyof typeof enemyTypes;
    } else {
      type = types[Math.floor(Math.random() * types.length)];
    }
    
    const enemyData = enemyTypes[type];
    
    return {
      x: SPAWN_X,
      y: 200 + (Math.random() - 0.5) * 200, // Random Y position
      health: enemyData.health + gameState.wave * 5,
      maxHealth: enemyData.health + gameState.wave * 5,
      speed: enemyData.speed,
      type,
      reward: enemyData.reward
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
        if (Math.random() < 0.025) {
          newState.enemies.push(spawnEnemy());
          newState.enemiesSpawned++;
        }
      }

      // Check wave completion
      if (newState.enemiesSpawned >= newState.enemiesPerWave && newState.enemies.length === 0) {
        newState.waveInProgress = false;
        if (newState.wave >= 15) {
          newState.victory = true;
        } else {
          newState.wave++;
          newState.enemiesSpawned = 0;
          newState.enemiesPerWave = Math.min(30, 8 + newState.wave * 2);
          newState.gold += 100; // Wave bonus
        }
      }

      // Move enemies toward castle
      newState.enemies.forEach(enemy => {
        const dx = CASTLE_X - enemy.x;
        const dy = 250 - enemy.y; // Castle center
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > enemy.speed) {
          enemy.x += (dx / distance) * enemy.speed;
          enemy.y += (dy / distance) * enemy.speed;
        } else {
          // Enemy reached castle
          newState.castleHealth -= 10;
          newState.enemies = newState.enemies.filter(e => e !== enemy);
        }
      });

      // Check castle destruction
      if (newState.castleHealth <= 0) {
        newState.gameOver = true;
      }

      // Defense shooting
      newState.defenses.forEach(defense => {
        if (defense.type !== 'wall' && currentTime - defense.lastShot > defense.cooldown) {
          // Find closest enemy in range
          let closestEnemy = null;
          let closestDistance = Infinity;
          
          newState.enemies.forEach(enemy => {
            const distance = getDistance(defense.x, defense.y, enemy.x, enemy.y);
            const defenseData = defenseTypes[defense.type];
            if (distance <= defenseData.range && distance < closestDistance) {
              closestEnemy = enemy;
              closestDistance = distance;
            }
          });

          if (closestEnemy) {
            const defenseData = defenseTypes[defense.type];
            const projectileType = defense.type === 'archer' ? 'arrow' : 
                                 defense.type === 'catapult' ? 'boulder' : 'bolt';
            
            newState.projectiles.push({
              x: defense.x,
              y: defense.y,
              targetX: closestEnemy.x,
              targetY: closestEnemy.y,
              speed: defense.type === 'catapult' ? 3 : 6,
              damage: defenseData.damage,
              type: projectileType
            });
            defense.lastShot = currentTime;
          }
        }
      });

      // Move projectiles and check hits
      newState.projectiles = newState.projectiles.filter(projectile => {
        const dx = projectile.targetX - projectile.x;
        const dy = projectile.targetY - projectile.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < projectile.speed) {
          // Hit target area
          if (projectile.type === 'boulder') {
            // Area damage for catapult
            newState.enemies.forEach(enemy => {
              const dist = getDistance(projectile.targetX, projectile.targetY, enemy.x, enemy.y);
              if (dist < 50) {
                enemy.health -= projectile.damage;
              }
            });
          } else {
            // Single target damage
            newState.enemies.forEach(enemy => {
              const dist = getDistance(projectile.targetX, projectile.targetY, enemy.x, enemy.y);
              if (dist < 25) {
                enemy.health -= projectile.damage;
              }
            });
          }
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
      });
      newState.enemies = newState.enemies.filter(e => e.health > 0);

      // Enemies attacking defenses (if they're adjacent)
      newState.enemies.forEach(enemy => {
        newState.defenses.forEach(defense => {
          if (getDistance(enemy.x, enemy.y, defense.x, defense.y) < 40) {
            defense.health -= 1;
          }
        });
      });

      // Remove destroyed defenses
      newState.defenses = newState.defenses.filter(d => d.health > 0);

      return newState;
    });
  }, [gameState.gameOver, gameState.victory, spawnEnemy]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with battlefield background
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw ground line
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 400);
    ctx.lineTo(canvas.width, 400);
    ctx.stroke();

    // Draw castle
    ctx.fillStyle = '#696969';
    ctx.fillRect(CASTLE_X - 30, 200, 60, 200);
    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.moveTo(CASTLE_X - 35, 200);
    ctx.lineTo(CASTLE_X, 180);
    ctx.lineTo(CASTLE_X + 35, 200);
    ctx.fill();
    
    // Castle flag
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(CASTLE_X - 2, 180, 4, 20);
    ctx.fillRect(CASTLE_X + 2, 185, 15, 8);

    // Castle health bar
    const castleHealthPercent = gameState.castleHealth / gameState.maxCastleHealth;
    ctx.fillStyle = 'red';
    ctx.fillRect(CASTLE_X - 30, 190, 60, 8);
    ctx.fillStyle = 'green';
    ctx.fillRect(CASTLE_X - 30, 190, 60 * castleHealthPercent, 8);

    // Draw spawn area indicator
    ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
    ctx.fillRect(SPAWN_X - 20, 0, 40, canvas.height);

    // Draw defenses
    gameState.defenses.forEach(defense => {
      const colors = {
        archer: '#8B4513',
        catapult: '#A0522D',
        ballista: '#2F4F4F',
        wall: '#696969'
      };
      
      ctx.fillStyle = colors[defense.type];
      ctx.fillRect(defense.x - 20, defense.y - 20, 40, 40);
      
      // Defense symbols
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      const symbols = {
        archer: '🏹',
        catapult: '🎯',
        ballista: '⚔️',
        wall: '🧱'
      };
      ctx.fillText(symbols[defense.type], defense.x, defense.y + 6);
      
      // Health bar for damaged defenses
      if (defense.health < defense.maxHealth) {
        const healthPercent = defense.health / defense.maxHealth;
        ctx.fillStyle = 'red';
        ctx.fillRect(defense.x - 20, defense.y - 30, 40, 4);
        ctx.fillStyle = 'green';
        ctx.fillRect(defense.x - 20, defense.y - 30, 40 * healthPercent, 4);
      }

      // Range indicator for selected defense type
      if (defense.type === selectedDefense && defense.type !== 'wall') {
        const defenseData = defenseTypes[defense.type];
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(defense.x, defense.y, defenseData.range, 0, Math.PI * 2);
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
      const symbols = {
        knight: '⚔️',
        orc: '👹',
        troll: '🧌',
        dragon: '🐉'
      };
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
      const colors = { arrow: '#8B4513', boulder: '#696969', bolt: '#2F4F4F' };
      ctx.fillStyle = colors[projectile.type];
      if (projectile.type === 'boulder') {
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(projectile.x - 3, projectile.y - 3, 6, 6);
      }
    });

    // Draw UI
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, 50);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Gold: ${gameState.gold}`, 10, 25);
    ctx.fillText(`Castle: ${gameState.castleHealth}/${gameState.maxCastleHealth}`, 120, 25);
    ctx.fillText(`Wave: ${gameState.wave}`, 280, 25);
    ctx.fillText(`Score: ${gameState.score}`, 380, 25);

    if (!gameState.waveInProgress && !gameState.gameOver && !gameState.victory) {
      ctx.fillStyle = '#00FF00';
      ctx.fillText('SPACE: Start wave!', 520, 25);
    }

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#FF0000';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Castle Destroyed!', canvas.width / 2, canvas.height / 2 - 50);
      
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
      ctx.fillText('Castle Defended!', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.fillStyle = '#FFD700';
      ctx.font = '24px Arial';
      ctx.fillText(`Victory! Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText('Press R to defend again', canvas.width / 2, canvas.height / 2 + 50);
    }
  }, [gameState, selectedDefense]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.gameOver || gameState.victory) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (y < 50) return; // UI area

    const defenseData = defenseTypes[selectedDefense];
    if (gameState.gold >= defenseData.cost) {
      // Check if position is valid (not too close to castle or spawn)
      if (x < CASTLE_X + 50 || x > SPAWN_X - 50) return;
      
      // Check if position is not occupied
      const occupied = gameState.defenses.some(d => 
        getDistance(x, y, d.x, d.y) < 45
      );
      
      if (!occupied) {
        const newDefense: Defense = {
          x,
          y,
          type: selectedDefense,
          health: defenseData.health,
          maxHealth: defenseData.health,
          cooldown: defenseData.cooldown,
          lastShot: 0,
          level: 1
        };

        setGameState(prev => ({
          ...prev,
          defenses: [...prev.defenses, newDefense],
          gold: prev.gold - defenseData.cost
        }));
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' && (gameState.gameOver || gameState.victory)) {
        setGameState({
          defenses: [],
          enemies: [],
          projectiles: [],
          gold: 300,
          castleHealth: 100,
          maxCastleHealth: 100,
          wave: 1,
          enemiesSpawned: 0,
          enemiesPerWave: 8,
          score: 0,
          gameOver: false,
          victory: false,
          waveInProgress: false
        });
      }
      
      if (e.key === ' ' && !gameState.waveInProgress && !gameState.gameOver && !gameState.victory) {
        setGameState(prev => ({ ...prev, waveInProgress: true }));
      }
      
      // Defense selection
      if (e.key === '1') setSelectedDefense('archer');
      if (e.key === '2') setSelectedDefense('catapult');
      if (e.key === '3') setSelectedDefense('ballista');
      if (e.key === '4') setSelectedDefense('wall');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.waveInProgress, gameState.gameOver, gameState.victory]);

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
    <GameLayout gameTitle="Defend the Castle" gameCategory="Side-view defense">
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2 mb-2">
          {Object.entries(defenseTypes).map(([type, data]) => (
            <button
              key={type}
              onClick={() => setSelectedDefense(type as Defense['type'])}
              className={`px-3 py-1 rounded text-sm ${
                selectedDefense === type 
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
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-gray-600 bg-yellow-100 rounded-lg cursor-crosshair"
          onClick={handleCanvasClick}
        />
        <div className="text-center text-gray-300">
          <p>Click to place defenses | 1-4: Select defense | SPACE: Start wave | R: Restart</p>
          <p>Selected: <span className="text-yellow-400">{selectedDefense}</span> ({defenseTypes[selectedDefense].cost}g) - {defenseTypes[selectedDefense].description}</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default DefendTheCastle;
