import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Plant {
  x: number;
  y: number;
  type: 'sunflower' | 'peashooter' | 'wallnut' | 'cherryBomb' | 'repeater';
  health: number;
  maxHealth: number;
  cooldown: number;
  lastShot: number;
  cost: number;
}

interface Goblin {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  type: 'basic' | 'warrior' | 'shield' | 'giant';
  row: number;
  stunned: boolean;
  stunnedUntil: number;
}

interface Projectile {
  x: number;
  y: number;
  speed: number;
  damage: number;
  row: number;
}

interface SunPoint {
  x: number;
  y: number;
  value: number;
  life: number;
  collected: boolean;
}

const PlantsVsGoblins = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const [selectedPlantType, setSelectedPlantType] = useState<Plant['type']>('peashooter');

  const plantTypes = {
    sunflower: { cost: 50, health: 100, cooldown: 3000, description: 'Generates sun' },
    peashooter: { cost: 100, health: 100, cooldown: 1500, description: 'Basic shooter' },
    repeater: { cost: 200, health: 100, cooldown: 1500, description: 'Double shot' },
    wallnut: { cost: 50, health: 400, cooldown: 0, description: 'High health wall' },
    cherryBomb: { cost: 150, health: 50, cooldown: 0, description: 'Explodes once' }
  };

  const goblinTypes = {
    basic: { health: 80, speed: 1, color: '#90EE90' },
    warrior: { health: 150, speed: 1.2, color: '#FFB6C1' },
    shield: { health: 200, speed: 0.8, color: '#87CEEB' },
    giant: { health: 400, speed: 0.6, color: '#DDA0DD' }
  };

  const [gameState, setGameState] = useState({
    plants: [] as Plant[],
    goblins: [] as Goblin[],
    projectiles: [] as Projectile[],
    sunPoints: [] as SunPoint[],
    sun: 200,
    wave: 1,
    goblinsSpawned: 0,
    goblinsPerWave: 8,
    score: 0,
    gameOver: false,
    victory: false,
    waveInProgress: false,
    lastSunGeneration: 0
  });

  const GRID_SIZE = 70;
  const ROWS = 5;
  const COLS = 9;
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 400;

  const getGridPosition = (x: number, y: number) => {
    const col = Math.floor((x - 50) / GRID_SIZE);
    const row = Math.floor((y - 50) / GRID_SIZE);
    return { row, col, valid: row >= 0 && row < ROWS && col >= 0 && col < COLS };
  };

  const getPixelPosition = (row: number, col: number) => ({
    x: 50 + col * GRID_SIZE + GRID_SIZE / 2,
    y: 50 + row * GRID_SIZE + GRID_SIZE / 2
  });

  const spawnGoblin = useCallback(() => {
    const types = Object.keys(goblinTypes) as (keyof typeof goblinTypes)[];
    let type: keyof typeof goblinTypes = 'basic';
    
    if (gameState.wave > 5) type = types[Math.floor(Math.random() * types.length)];
    else if (gameState.wave > 3) type = Math.random() < 0.7 ? 'basic' : 'warrior';
    else if (gameState.wave > 1) type = Math.random() < 0.8 ? 'basic' : 'warrior';
    
    const goblinData = goblinTypes[type];
    const row = Math.floor(Math.random() * ROWS);
    
    return {
      x: CANVAS_WIDTH - 20,
      y: 50 + row * GRID_SIZE + GRID_SIZE / 2,
      health: goblinData.health,
      maxHealth: goblinData.health,
      speed: goblinData.speed,
      type,
      row,
      stunned: false,
      stunnedUntil: 0
    };
  }, [gameState.wave]);

  const update = useCallback(() => {
    if (gameState.gameOver || gameState.victory) return;

    setGameState(prev => {
      const newState = { ...prev };
      const currentTime = Date.now();

      // Generate sun from sunflowers
      if (currentTime - newState.lastSunGeneration > 2000) {
        newState.plants.forEach(plant => {
          if (plant.type === 'sunflower') {
            newState.sunPoints.push({
              x: plant.x + (Math.random() - 0.5) * 30,
              y: plant.y + (Math.random() - 0.5) * 30,
              value: 25,
              life: 300,
              collected: false
            });
          }
        });
        newState.lastSunGeneration = currentTime;
      }

      // Update sun points
      newState.sunPoints = newState.sunPoints.filter(sun => {
        sun.life--;
        return sun.life > 0 && !sun.collected;
      });

      // Spawn goblins
      if (newState.waveInProgress && newState.goblinsSpawned < newState.goblinsPerWave) {
        if (Math.random() < 0.02) {
          newState.goblins.push(spawnGoblin());
          newState.goblinsSpawned++;
        }
      }

      // Check wave completion
      if (newState.goblinsSpawned >= newState.goblinsPerWave && newState.goblins.length === 0) {
        newState.waveInProgress = false;
        if (newState.wave >= 10) {
          newState.victory = true;
        } else {
          newState.wave++;
          newState.goblinsSpawned = 0;
          newState.goblinsPerWave = Math.min(20, 8 + newState.wave * 2);
          newState.sun += 100; // Wave bonus
        }
      }

      // Move goblins
      newState.goblins.forEach(goblin => {
        if (currentTime < goblin.stunnedUntil) {
          goblin.stunned = true;
          return;
        } else {
          goblin.stunned = false;
        }

        goblin.x -= goblin.speed;
        
        // Check if goblin reached the house
        if (goblin.x < 0) {
          newState.gameOver = true;
        }
      });

      // Plants shooting
      newState.plants.forEach(plant => {
        if (plant.type === 'peashooter' || plant.type === 'repeater') {
          if (currentTime - plant.lastShot > plant.cooldown) {
            // Find goblin in same row
            const goblinsInRow = newState.goblins.filter(g => 
              Math.abs(g.y - plant.y) < GRID_SIZE / 2 && g.x > plant.x
            );
            
            if (goblinsInRow.length > 0) {
              const shots = plant.type === 'repeater' ? 2 : 1;
              for (let i = 0; i < shots; i++) {
                newState.projectiles.push({
                  x: plant.x + 20,
                  y: plant.y + (i * 5 - 2.5),
                  speed: 4,
                  damage: 20,
                  row: Math.floor((plant.y - 50) / GRID_SIZE)
                });
              }
              plant.lastShot = currentTime;
            }
          }
        } else if (plant.type === 'cherryBomb' && plant.health > 0) {
          // Explode if goblins are nearby
          const nearbyGoblins = newState.goblins.filter(g => 
            Math.abs(g.x - plant.x) < GRID_SIZE * 1.5 && 
            Math.abs(g.y - plant.y) < GRID_SIZE * 1.5
          );
          
          if (nearbyGoblins.length > 0) {
            // Damage nearby goblins
            nearbyGoblins.forEach(goblin => {
              goblin.health -= 200;
            });
            plant.health = 0; // Destroy the cherry bomb
          }
        }
      });

      // Move projectiles and check hits
      newState.projectiles = newState.projectiles.filter(projectile => {
        projectile.x += projectile.speed;
        
        // Check collision with goblins
        for (const goblin of newState.goblins) {
          if (Math.abs(goblin.y - projectile.y) < 15 && 
              Math.abs(goblin.x - projectile.x) < 20 &&
              projectile.x >= goblin.x - 20) {
            goblin.health -= projectile.damage;
            return false; // Remove projectile
          }
        }
        
        return projectile.x < CANVAS_WIDTH; // Keep if still on screen
      });

      // Remove dead goblins
      const deadGoblins = newState.goblins.filter(g => g.health <= 0);
      newState.score += deadGoblins.length * 10;
      newState.goblins = newState.goblins.filter(g => g.health > 0);

      // Remove dead plants
      newState.plants = newState.plants.filter(p => p.health > 0);

      // Goblins eating plants
      newState.goblins.forEach(goblin => {
        if (!goblin.stunned) {
          newState.plants.forEach(plant => {
            if (Math.abs(goblin.x - plant.x) < 25 && 
                Math.abs(goblin.y - plant.y) < 25) {
              plant.health -= 2;
              goblin.stunnedUntil = currentTime + 500; // Stun while eating
            }
          });
        }
      });

      return newState;
    });
  }, [gameState.gameOver, gameState.victory, spawnGoblin]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with garden background
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let row = 0; row <= ROWS; row++) {
      ctx.beginPath();
      ctx.moveTo(50, 50 + row * GRID_SIZE);
      ctx.lineTo(50 + COLS * GRID_SIZE, 50 + row * GRID_SIZE);
      ctx.stroke();
    }
    for (let col = 0; col <= COLS; col++) {
      ctx.beginPath();
      ctx.moveTo(50 + col * GRID_SIZE, 50);
      ctx.lineTo(50 + col * GRID_SIZE, 50 + ROWS * GRID_SIZE);
      ctx.stroke();
    }

    // Draw plants
    gameState.plants.forEach(plant => {
      const colors = {
        sunflower: '#FFD700',
        peashooter: '#32CD32',
        repeater: '#228B22',
        wallnut: '#8B4513',
        cherryBomb: '#FF0000'
      };
      
      ctx.fillStyle = colors[plant.type];
      ctx.fillRect(plant.x - 25, plant.y - 25, 50, 50);
      
      // Plant symbol
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      const symbols = {
        sunflower: '☀',
        peashooter: '○',
        repeater: '○○',
        wallnut: '▊',
        cherryBomb: '💣'
      };
      ctx.fillText(symbols[plant.type], plant.x, plant.y + 4);
      
      // Health bar for damaged plants
      if (plant.health < plant.maxHealth) {
        const healthPercent = plant.health / plant.maxHealth;
        ctx.fillStyle = 'red';
        ctx.fillRect(plant.x - 25, plant.y - 35, 50, 5);
        ctx.fillStyle = 'green';
        ctx.fillRect(plant.x - 25, plant.y - 35, 50 * healthPercent, 5);
      }
    });

    // Draw goblins
    gameState.goblins.forEach(goblin => {
      const goblinData = goblinTypes[goblin.type];
      ctx.fillStyle = goblin.stunned ? '#808080' : goblinData.color;
      ctx.fillRect(goblin.x - 15, goblin.y - 15, 30, 30);
      
      // Goblin symbol
      ctx.fillStyle = 'black';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('👹', goblin.x, goblin.y + 6);
      
      // Health bar
      const healthPercent = goblin.health / goblin.maxHealth;
      ctx.fillStyle = 'red';
      ctx.fillRect(goblin.x - 15, goblin.y - 25, 30, 4);
      ctx.fillStyle = 'green';
      ctx.fillRect(goblin.x - 15, goblin.y - 25, 30 * healthPercent, 4);
    });

    // Draw projectiles
    ctx.fillStyle = '#32CD32';
    gameState.projectiles.forEach(projectile => {
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw sun points
    gameState.sunPoints.forEach(sun => {
      ctx.fillStyle = '#FFD700';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('☀', sun.x, sun.y);
    });

    // Draw UI
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, 40);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Sun: ${gameState.sun}`, 10, 25);
    ctx.fillText(`Wave: ${gameState.wave}`, 120, 25);
    ctx.fillText(`Score: ${gameState.score}`, 220, 25);

    if (!gameState.waveInProgress && !gameState.gameOver && !gameState.victory) {
      ctx.fillStyle = '#00FF00';
      ctx.fillText('Press SPACE to start wave!', 350, 25);
    }

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#FF0000';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('The goblins reached your garden!', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.fillStyle = '#FFD700';
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 50);
    }

    if (gameState.victory) {
      ctx.fillStyle = 'rgba(0, 100, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#00FF00';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Victory!', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.fillStyle = '#FFD700';
      ctx.font = '24px Arial';
      ctx.fillText(`Garden Protected! Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText('Press R to play again', canvas.width / 2, canvas.height / 2 + 50);
    }
  }, [gameState]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.gameOver || gameState.victory) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on sun point
    for (const sun of gameState.sunPoints) {
      if (Math.abs(x - sun.x) < 20 && Math.abs(y - sun.y) < 20) {
        setGameState(prev => ({
          ...prev,
          sun: prev.sun + sun.value,
          sunPoints: prev.sunPoints.map(s => s === sun ? { ...s, collected: true } : s)
        }));
        return;
      }
    }

    const gridPos = getGridPosition(x, y);
    if (!gridPos.valid || y < 50) return;

    const pixelPos = getPixelPosition(gridPos.row, gridPos.col);
    const plantData = plantTypes[selectedPlantType];
    
    // Check if can afford and position is empty
    if (gameState.sun >= plantData.cost) {
      const occupied = gameState.plants.some(p => 
        Math.abs(p.x - pixelPos.x) < 30 && Math.abs(p.y - pixelPos.y) < 30
      );
      
      if (!occupied) {
        const newPlant: Plant = {
          x: pixelPos.x,
          y: pixelPos.y,
          type: selectedPlantType,
          health: plantData.health,
          maxHealth: plantData.health,
          cooldown: plantData.cooldown,
          lastShot: 0,
          cost: plantData.cost
        };

        setGameState(prev => ({
          ...prev,
          plants: [...prev.plants, newPlant],
          sun: prev.sun - plantData.cost
        }));
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' && (gameState.gameOver || gameState.victory)) {
        setGameState({
          plants: [],
          goblins: [],
          projectiles: [],
          sunPoints: [],
          sun: 200,
          wave: 1,
          goblinsSpawned: 0,
          goblinsPerWave: 8,
          score: 0,
          gameOver: false,
          victory: false,
          waveInProgress: false,
          lastSunGeneration: 0
        });
      }
      
      if (e.key === ' ' && !gameState.waveInProgress && !gameState.gameOver && !gameState.victory) {
        setGameState(prev => ({ ...prev, waveInProgress: true }));
      }
      
      // Plant selection
      if (e.key === '1') setSelectedPlantType('sunflower');
      if (e.key === '2') setSelectedPlantType('peashooter');
      if (e.key === '3') setSelectedPlantType('repeater');
      if (e.key === '4') setSelectedPlantType('wallnut');
      if (e.key === '5') setSelectedPlantType('cherryBomb');
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
    <GameLayout gameTitle="Plants vs Goblins" gameCategory="PvZ clone">
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2 mb-2">
          {Object.entries(plantTypes).map(([type, data]) => (
            <button
              key={type}
              onClick={() => setSelectedPlantType(type as Plant['type'])}
              className={`px-3 py-1 rounded text-sm ${
                selectedPlantType === type 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              disabled={gameState.sun < data.cost}
            >
              {type} ({data.cost}☀)
            </button>
          ))}
        </div>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-gray-600 bg-green-800 rounded-lg cursor-crosshair"
          onClick={handleCanvasClick}
        />
        <div className="text-center text-gray-300">
          <p>Click to place plants | 1-5: Select plant | SPACE: Start wave | R: Restart</p>
          <p>Selected: <span className="text-green-400">{selectedPlantType}</span> ({plantTypes[selectedPlantType].cost}☀) - {plantTypes[selectedPlantType].description}</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default PlantsVsGoblins;
