import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Tower {
  x: number;
  y: number;
  type: 'dart' | 'tack' | 'ice' | 'bomb';
  level: number;
  range: number;
  damage: number;
  cooldown: number;
  lastShot: number;
  cost: number;
}

interface Bloon {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  type: 'red' | 'blue' | 'green' | 'yellow' | 'pink' | 'black' | 'moab';
  pathIndex: number;
  reward: number;
  color: string;
}

const BloonsTD5 = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const [selectedTowerType, setSelectedTowerType] = useState<Tower['type']>('dart');

  const path = [
    { x: 0, y: 300 },
    { x: 150, y: 300 },
    { x: 150, y: 150 },
    { x: 350, y: 150 },
    { x: 350, y: 450 },
    { x: 550, y: 450 },
    { x: 550, y: 200 },
    { x: 750, y: 200 },
    { x: 800, y: 200 }
  ];

  const bloonTypes = {
    red: { health: 1, speed: 1, reward: 1, color: '#ff0000' },
    blue: { health: 2, speed: 1.4, reward: 2, color: '#0066ff' },
    green: { health: 3, speed: 1.8, reward: 3, color: '#00aa00' },
    yellow: { health: 4, speed: 3.2, reward: 4, color: '#ffff00' },
    pink: { health: 5, speed: 3.5, reward: 5, color: '#ff69b4' },
    black: { health: 11, speed: 1.8, reward: 11, color: '#000000' },
    moab: { health: 200, speed: 1, reward: 100, color: '#8B4513' }
  };

  const towerTypes = {
    dart: { range: 120, damage: 1, cooldown: 1000, cost: 170 },
    tack: { range: 80, damage: 1, cooldown: 800, cost: 280 },
    ice: { range: 100, damage: 0, cooldown: 2500, cost: 425 },
    bomb: { range: 150, damage: 40, cooldown: 2000, cost: 525 }
  };

  const [gameState, setGameState] = useState({
    towers: [] as Tower[],
    bloons: [] as Bloon[],
    money: 650,
    lives: 100,
    wave: 1,
    bloonsSpawned: 0,
    bloonsPerWave: 20,
    score: 0,
    gameOver: false,
    waveInProgress: false
  });

  const spawnBloon = useCallback(() => {
    const wave = gameState.wave;
    let type: keyof typeof bloonTypes;
    
    if (wave <= 10) type = 'red';
    else if (wave <= 20) type = Math.random() < 0.7 ? 'red' : 'blue';
    else if (wave <= 30) type = ['red', 'blue', 'green'][Math.floor(Math.random() * 3)] as keyof typeof bloonTypes;
    else if (wave <= 40) type = ['blue', 'green', 'yellow'][Math.floor(Math.random() * 3)] as keyof typeof bloonTypes;
    else if (wave <= 50) type = ['green', 'yellow', 'pink'][Math.floor(Math.random() * 3)] as keyof typeof bloonTypes;
    else if (wave <= 60) type = ['yellow', 'pink', 'black'][Math.floor(Math.random() * 3)] as keyof typeof bloonTypes;
    else type = Math.random() < 0.9 ? 'black' : 'moab';
    
    const bloonData = bloonTypes[type];
    
    return {
      x: path[0].x,
      y: path[0].y,
      health: bloonData.health,
      maxHealth: bloonData.health,
      speed: bloonData.speed,
      type,
      pathIndex: 0,
      reward: bloonData.reward,
      color: bloonData.color
    };
  }, [gameState.wave]);

  const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  };

  const update = useCallback(() => {
    if (gameState.gameOver) return;

    setGameState(prev => {
      const newState = { ...prev };

      // Spawn bloons
      if (newState.waveInProgress && newState.bloonsSpawned < newState.bloonsPerWave) {
        if (Math.random() < 0.05) {
          newState.bloons.push(spawnBloon());
          newState.bloonsSpawned++;
        }
      }

      // Check wave completion
      if (newState.bloonsSpawned >= newState.bloonsPerWave && newState.bloons.length === 0) {
        newState.waveInProgress = false;
        newState.wave++;
        newState.bloonsSpawned = 0;
        newState.bloonsPerWave = Math.min(100, 20 + newState.wave * 2);
        newState.money += 100 + newState.wave * 20; // Wave completion bonus
      }

      // Move bloons
      newState.bloons.forEach(bloon => {
        if (bloon.pathIndex < path.length - 1) {
          const target = path[bloon.pathIndex + 1];
          const dx = target.x - bloon.x;
          const dy = target.y - bloon.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < bloon.speed) {
            bloon.pathIndex++;
            if (bloon.pathIndex < path.length - 1) {
              bloon.x = path[bloon.pathIndex].x;
              bloon.y = path[bloon.pathIndex].y;
            }
          } else {
            bloon.x += (dx / distance) * bloon.speed;
            bloon.y += (dy / distance) * bloon.speed;
          }
        }
      });

      // Remove bloons that reached the end
      const bloonsAtEnd = newState.bloons.filter(bloon => bloon.pathIndex >= path.length - 1);
      newState.lives -= bloonsAtEnd.length;
      newState.bloons = newState.bloons.filter(bloon => bloon.pathIndex < path.length - 1);

      if (newState.lives <= 0) {
        newState.gameOver = true;
      }

      // Tower shooting
      const currentTime = Date.now();
      newState.towers.forEach(tower => {
        if (currentTime - tower.lastShot > tower.cooldown) {
          let closestBloon = null;
          let closestDistance = Infinity;
          
          newState.bloons.forEach(bloon => {
            const distance = getDistance(tower.x, tower.y, bloon.x, bloon.y);
            if (distance <= tower.range && distance < closestDistance) {
              closestBloon = bloon;
              closestDistance = distance;
            }
          });

          if (closestBloon) {
            if (tower.type === 'ice') {
              // Ice tower slows bloons
              newState.bloons.forEach(bloon => {
                const distance = getDistance(tower.x, tower.y, bloon.x, bloon.y);
                if (distance <= tower.range + 30) {
                  bloon.speed = Math.max(0.3, bloon.speed * 0.5);
                }
              });
            } else {
              // Damage bloon
              closestBloon.health -= tower.damage;
              if (closestBloon.health <= 0) {
                newState.money += closestBloon.reward;
                newState.score += closestBloon.reward * 10;
                newState.bloons = newState.bloons.filter(b => b !== closestBloon);
              }
            }
            tower.lastShot = currentTime;
          }
        }
      });

      // Reset bloon speeds (ice effect wears off)
      newState.bloons.forEach(bloon => {
        const originalSpeed = bloonTypes[bloon.type].speed;
        if (bloon.speed < originalSpeed) {
          bloon.speed = Math.min(originalSpeed, bloon.speed + 0.1);
        }
      });

      return newState;
    });
  }, [gameState.gameOver, spawnBloon]);

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
    ctx.lineWidth = 40;
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
        dart: '#8B4513',
        tack: '#FFD700',
        ice: '#87CEEB',
        bomb: '#FF4500'
      };
      
      ctx.fillStyle = colors[tower.type];
      ctx.fillRect(tower.x - 20, tower.y - 20, 40, 40);
      
      // Range circle
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
      ctx.stroke();
      
      // Tower symbol
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(tower.type[0].toUpperCase(), tower.x, tower.y + 4);
    });

    // Draw bloons
    gameState.bloons.forEach(bloon => {
      ctx.fillStyle = bloon.color;
      ctx.beginPath();
      ctx.arc(bloon.x, bloon.y, bloon.type === 'moab' ? 25 : 12, 0, Math.PI * 2);
      ctx.fill();
      
      // Health indicator for stronger bloons
      if (bloon.maxHealth > 1) {
        const healthPercent = bloon.health / bloon.maxHealth;
        ctx.fillStyle = 'red';
        ctx.fillRect(bloon.x - 15, bloon.y - 20, 30, 4);
        ctx.fillStyle = 'green';
        ctx.fillRect(bloon.x - 15, bloon.y - 20, 30 * healthPercent, 4);
      }
    });

    // Draw UI
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, 80);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Money: $${gameState.money}`, 20, 25);
    ctx.fillText(`Lives: ${gameState.lives}`, 20, 50);
    ctx.fillText(`Wave: ${gameState.wave}`, 180, 25);
    ctx.fillText(`Score: ${gameState.score}`, 180, 50);

    if (!gameState.waveInProgress) {
      ctx.fillStyle = '#00FF00';
      ctx.fillText('Click to start next wave!', 350, 35);
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

    // Start wave
    if (!gameState.waveInProgress && y < 80) {
      setGameState(prev => ({ ...prev, waveInProgress: true }));
      return;
    }

    // Place tower
    const towerData = towerTypes[selectedTowerType];
    if (gameState.money >= towerData.cost && y > 80) {
      // Check valid position
      let validPosition = true;
      
      // Not on path
      for (const pathPoint of path) {
        if (getDistance(x, y, pathPoint.x, pathPoint.y) < 50) {
          validPosition = false;
          break;
        }
      }

      // Not on existing tower
      for (const tower of gameState.towers) {
        if (getDistance(x, y, tower.x, tower.y) < 50) {
          validPosition = false;
          break;
        }
      }

      if (validPosition) {
        const newTower: Tower = {
          x, y,
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
          money: prev.money - towerData.cost
        }));
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' && gameState.gameOver) {
        setGameState({
          towers: [],
          bloons: [],
          money: 650,
          lives: 100,
          wave: 1,
          bloonsSpawned: 0,
          bloonsPerWave: 20,
          score: 0,
          gameOver: false,
          waveInProgress: false
        });
      }
      
      // Tower selection
      if (e.key === '1') setSelectedTowerType('dart');
      if (e.key === '2') setSelectedTowerType('tack');
      if (e.key === '3') setSelectedTowerType('ice');
      if (e.key === '4') setSelectedTowerType('bomb');
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
    <GameLayout gameTitle="Bloons Tower Defense 5" gameCategory="Pop waves of enemies with monkey towers">
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2 mb-2">
          {Object.entries(towerTypes).map(([type, data]) => (
            <button
              key={type}
              onClick={() => setSelectedTowerType(type as Tower['type'])}
              className={`px-3 py-1 rounded text-sm ${
                selectedTowerType === type 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {type} (${data.cost})
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
          <p>Selected: <span className="text-blue-400">{selectedTowerType}</span> (${towerTypes[selectedTowerType].cost})</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default BloonsTD5;
