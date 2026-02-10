import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Unit {
  x: number;
  y: number;
  type: 'bunny' | 'cat' | 'dog' | 'hamster';
  health: number;
  damage: number;
  range: number;
  cooldown: number;
  lastShot: number;
}

interface Enemy {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  type: 'ant' | 'spider' | 'bee' | 'beetle';
  gridX: number;
  gridY: number;
}

const TinyDefense2 = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const [selectedUnit, setSelectedUnit] = useState<Unit['type']>('bunny');

  const GRID_SIZE = 60;
  const GRID_COLS = 9;
  const GRID_ROWS = 6;

  const unitTypes = {
    bunny: { cost: 50, health: 80, damage: 15, range: 80, cooldown: 1500, emoji: '🐰' },
    cat: { cost: 80, health: 100, damage: 25, range: 100, cooldown: 1200, emoji: '🐱' },
    dog: { cost: 120, health: 150, damage: 35, range: 120, cooldown: 1000, emoji: '🐶' },
    hamster: { cost: 40, health: 60, damage: 10, range: 60, cooldown: 800, emoji: '🐹' }
  };

  const enemyTypes = {
    ant: { health: 30, speed: 1.5, reward: 10, emoji: '🐜' },
    spider: { health: 50, speed: 1.2, reward: 15, emoji: '🕷️' },
    bee: { health: 25, speed: 2.5, reward: 12, emoji: '🐝' },
    beetle: { health: 80, speed: 0.8, reward: 20, emoji: '🪲' }
  };

  const [gameState, setGameState] = useState({
    units: [] as Unit[],
    enemies: [] as Enemy[],
    coins: 200,
    lives: 10,
    wave: 1,
    enemiesSpawned: 0,
    enemiesPerWave: 6,
    score: 0,
    gameOver: false,
    waveActive: false,
    lastSpawn: 0
  });

  const getGridPosition = (x: number, y: number) => {
    const gridX = Math.floor(x / GRID_SIZE);
    const gridY = Math.floor(y / GRID_SIZE);
    return { gridX, gridY, valid: gridX >= 0 && gridX < GRID_COLS && gridY >= 0 && gridY < GRID_ROWS };
  };

  const spawnEnemy = useCallback(() => {
    const types = Object.keys(enemyTypes) as (keyof typeof enemyTypes)[];
    const type = types[Math.floor(Math.random() * types.length)];
    const enemyData = enemyTypes[type];
    
    const gridY = Math.floor(Math.random() * GRID_ROWS);
    
    return {
      x: GRID_COLS * GRID_SIZE,
      y: gridY * GRID_SIZE + GRID_SIZE / 2,
      health: enemyData.health + gameState.wave * 5,
      maxHealth: enemyData.health + gameState.wave * 5,
      speed: enemyData.speed,
      type,
      gridX: GRID_COLS,
      gridY
    };
  }, [gameState.wave]);

  const update = useCallback(() => {
    if (gameState.gameOver) return;

    setGameState(prev => {
      const newState = { ...prev };
      const currentTime = Date.now();

      // Spawn enemies
      if (newState.waveActive && newState.enemiesSpawned < newState.enemiesPerWave) {
        if (currentTime - newState.lastSpawn > 2000) {
          newState.enemies.push(spawnEnemy());
          newState.enemiesSpawned++;
          newState.lastSpawn = currentTime;
        }
      }

      // Check wave completion
      if (newState.enemiesSpawned >= newState.enemiesPerWave && newState.enemies.length === 0) {
        newState.waveActive = false;
        newState.wave++;
        newState.enemiesSpawned = 0;
        newState.enemiesPerWave = Math.min(15, 6 + newState.wave);
        newState.coins += 50;
      }

      // Move enemies
      newState.enemies.forEach(enemy => {
        enemy.x -= enemy.speed;
        enemy.gridX = Math.floor(enemy.x / GRID_SIZE);
        
        if (enemy.x < 0) {
          newState.lives--;
          newState.enemies = newState.enemies.filter(e => e !== enemy);
        }
      });

      if (newState.lives <= 0) {
        newState.gameOver = true;
      }

      // Units attacking
      newState.units.forEach(unit => {
        if (currentTime - unit.lastShot > unit.cooldown) {
          const nearbyEnemies = newState.enemies.filter(enemy => {
            const dx = enemy.x - unit.x;
            const dy = enemy.y - unit.y;
            return Math.sqrt(dx * dx + dy * dy) <= unit.range;
          });

          if (nearbyEnemies.length > 0) {
            const target = nearbyEnemies[0];
            target.health -= unit.damage;
            unit.lastShot = currentTime;

            if (target.health <= 0) {
              const enemyData = enemyTypes[target.type];
              newState.coins += enemyData.reward;
              newState.score += enemyData.reward * 10;
              newState.enemies = newState.enemies.filter(e => e !== target);
            }
          }
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

    // Clear with garden background
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= GRID_COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * GRID_SIZE, 0);
      ctx.lineTo(x * GRID_SIZE, GRID_ROWS * GRID_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= GRID_ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * GRID_SIZE);
      ctx.lineTo(GRID_COLS * GRID_SIZE, y * GRID_SIZE);
      ctx.stroke();
    }

    // Draw units
    gameState.units.forEach(unit => {
      const unitData = unitTypes[unit.type];
      
      // Unit background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(unit.x - 25, unit.y - 25, 50, 50);
      
      // Unit emoji
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(unitData.emoji, unit.x, unit.y + 12);
      
      // Health bar
      const healthPercent = unit.health / unitTypes[unit.type].health;
      ctx.fillStyle = 'red';
      ctx.fillRect(unit.x - 25, unit.y - 35, 50, 6);
      ctx.fillStyle = 'green';
      ctx.fillRect(unit.x - 25, unit.y - 35, 50 * healthPercent, 6);
    });

    // Draw enemies
    gameState.enemies.forEach(enemy => {
      const enemyData = enemyTypes[enemy.type];
      
      // Enemy background
      ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
      ctx.fillRect(enemy.x - 15, enemy.y - 15, 30, 30);
      
      // Enemy emoji
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(enemyData.emoji, enemy.x, enemy.y + 8);
      
      // Health bar
      const healthPercent = enemy.health / enemy.maxHealth;
      ctx.fillStyle = 'red';
      ctx.fillRect(enemy.x - 15, enemy.y - 25, 30, 4);
      ctx.fillStyle = 'green';
      ctx.fillRect(enemy.x - 15, enemy.y - 25, 30 * healthPercent, 4);
    });

    // Draw UI
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(0, GRID_ROWS * GRID_SIZE, canvas.width, 60);
    
    ctx.fillStyle = '#000';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Coins: ${gameState.coins}`, 10, GRID_ROWS * GRID_SIZE + 20);
    ctx.fillText(`Lives: ${gameState.lives}`, 10, GRID_ROWS * GRID_SIZE + 40);
    ctx.fillText(`Wave: ${gameState.wave}`, 150, GRID_ROWS * GRID_SIZE + 20);
    ctx.fillText(`Score: ${gameState.score}`, 150, GRID_ROWS * GRID_SIZE + 40);

    if (!gameState.waveActive && !gameState.gameOver) {
      ctx.fillStyle = '#00AA00';
      ctx.fillText('SPACE: Start wave!', 300, GRID_ROWS * GRID_SIZE + 30);
    }

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#FF0000';
      ctx.font = '36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Garden Overrun!', canvas.width / 2, canvas.height / 2 - 30);
      
      ctx.fillStyle = '#000';
      ctx.font = '20px Arial';
      ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 10);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 40);
    }
  }, [gameState]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (y > GRID_ROWS * GRID_SIZE) return; // UI area

    const gridPos = getGridPosition(x, y);
    if (!gridPos.valid) return;

    const unitData = unitTypes[selectedUnit];
    if (gameState.coins >= unitData.cost) {
      const centerX = gridPos.gridX * GRID_SIZE + GRID_SIZE / 2;
      const centerY = gridPos.gridY * GRID_SIZE + GRID_SIZE / 2;
      
      // Check if position is occupied
      const occupied = gameState.units.some(unit => 
        Math.abs(unit.x - centerX) < 30 && Math.abs(unit.y - centerY) < 30
      );
      
      if (!occupied) {
        const newUnit: Unit = {
          x: centerX,
          y: centerY,
          type: selectedUnit,
          health: unitData.health,
          damage: unitData.damage,
          range: unitData.range,
          cooldown: unitData.cooldown,
          lastShot: 0
        };

        setGameState(prev => ({
          ...prev,
          units: [...prev.units, newUnit],
          coins: prev.coins - unitData.cost
        }));
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' && gameState.gameOver) {
        setGameState({
          units: [],
          enemies: [],
          coins: 200,
          lives: 10,
          wave: 1,
          enemiesSpawned: 0,
          enemiesPerWave: 6,
          score: 0,
          gameOver: false,
          waveActive: false,
          lastSpawn: 0
        });
      }
      
      if (e.key === ' ' && !gameState.waveActive && !gameState.gameOver) {
        setGameState(prev => ({ ...prev, waveActive: true }));
      }
      
      // Unit selection
      if (e.key === '1') setSelectedUnit('bunny');
      if (e.key === '2') setSelectedUnit('cat');
      if (e.key === '3') setSelectedUnit('dog');
      if (e.key === '4') setSelectedUnit('hamster');
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
      gameTitle="Tiny Defense 2" 
      gameCategory="Cartoony defense"
      showMobileControls={true}
    >
      <div className="flex flex-col items-center gap-4 p-4">
        <div className="flex gap-2 mb-2">
          {Object.entries(unitTypes).map(([type, data]) => (
            <button
              key={type}
              onClick={() => setSelectedUnit(type as Unit['type'])}
              className={`px-3 py-1 rounded text-sm ${
                selectedUnit === type 
                  ? 'bg-pink-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              disabled={gameState.coins < data.cost}
            >
              {data.emoji} {type} ({data.cost})
            </button>
          ))}
        </div>
        <canvas
          ref={canvasRef}
          width={GRID_COLS * GRID_SIZE}
          height={GRID_ROWS * GRID_SIZE + 60}
          className="border border-gray-600 bg-green-200 rounded-lg cursor-crosshair max-w-full h-auto"
          onClick={handleCanvasClick}
        />
        <div className="text-center text-gray-300">
          <p>Click to place cute units | 1-4: Select unit | SPACE: Start wave | R: Restart</p>
          <p>Selected: <span className="text-pink-400">{unitTypes[selectedUnit].emoji} {selectedUnit}</span> ({unitTypes[selectedUnit].cost} coins)</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default TinyDefense2;
