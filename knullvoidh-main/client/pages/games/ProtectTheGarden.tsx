import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Plant {
  x: number;
  y: number;
  type: 'flower' | 'spiker' | 'barrier';
  health: number;
  lastShot: number;
}

interface Bug {
  x: number;
  y: number;
  health: number;
  speed: number;
  type: 'ant' | 'beetle' | 'spider';
  lane: number;
}

interface Seed {
  x: number;
  y: number;
  speed: number;
  lane: number;
}

const ProtectTheGarden = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const [selectedPlant, setSelectedPlant] = useState<Plant['type']>('spiker');

  const plantCosts = {
    flower: 75,    // Generates resources
    spiker: 100,   // Shoots seeds
    barrier: 50    // Blocks bugs
  };

  const bugTypes = {
    ant: { health: 40, speed: 1.5, color: '#8B4513' },
    beetle: { health: 80, speed: 1, color: '#2F4F2F' },
    spider: { health: 60, speed: 2, color: '#800080' }
  };

  const [gameState, setGameState] = useState({
    plants: [] as Plant[],
    bugs: [] as Bug[],
    seeds: [] as Seed[],
    resources: 200,
    wave: 1,
    bugsSpawned: 0,
    bugsPerWave: 6,
    score: 0,
    gameOver: false,
    waveActive: false,
    lastResourceGen: 0
  });

  const LANE_COUNT = 4;
  const LANE_HEIGHT = 80;
  const CANVAS_WIDTH = 700;
  const CANVAS_HEIGHT = 350;

  const getLane = (y: number) => Math.floor((y - 30) / LANE_HEIGHT);
  const getLaneY = (lane: number) => 30 + lane * LANE_HEIGHT + LANE_HEIGHT / 2;

  const spawnBug = useCallback(() => {
    const types = Object.keys(bugTypes) as (keyof typeof bugTypes)[];
    const type = types[Math.floor(Math.random() * types.length)];
    const bugData = bugTypes[type];
    const lane = Math.floor(Math.random() * LANE_COUNT);
    
    return {
      x: CANVAS_WIDTH - 20,
      y: getLaneY(lane),
      health: bugData.health + gameState.wave * 10,
      speed: bugData.speed,
      type,
      lane
    };
  }, [gameState.wave]);

  const update = useCallback(() => {
    if (gameState.gameOver) return;

    setGameState(prev => {
      const newState = { ...prev };
      const currentTime = Date.now();

      // Generate resources from flowers
      if (currentTime - newState.lastResourceGen > 3000) {
        const flowerCount = newState.plants.filter(p => p.type === 'flower').length;
        newState.resources += flowerCount * 25;
        newState.lastResourceGen = currentTime;
      }

      // Spawn bugs
      if (newState.waveActive && newState.bugsSpawned < newState.bugsPerWave) {
        if (Math.random() < 0.03) {
          newState.bugs.push(spawnBug());
          newState.bugsSpawned++;
        }
      }

      // Check wave completion
      if (newState.bugsSpawned >= newState.bugsPerWave && newState.bugs.length === 0) {
        newState.waveActive = false;
        newState.wave++;
        newState.bugsSpawned = 0;
        newState.bugsPerWave = Math.min(25, 6 + newState.wave * 2);
        newState.resources += 50; // Wave bonus
      }

      // Move bugs
      newState.bugs.forEach(bug => {
        bug.x -= bug.speed;
        
        // Check if bug reached garden
        if (bug.x < 50) {
          newState.gameOver = true;
        }
      });

      // Plants shooting
      newState.plants.forEach(plant => {
        if (plant.type === 'spiker' && currentTime - plant.lastShot > 2000) {
          // Find bug in same lane
          const lane = getLane(plant.y - 30);
          const bugsInLane = newState.bugs.filter(b => b.lane === lane && b.x > plant.x);
          
          if (bugsInLane.length > 0) {
            newState.seeds.push({
              x: plant.x + 20,
              y: plant.y,
              speed: 4,
              lane
            });
            plant.lastShot = currentTime;
          }
        }
      });

      // Move seeds and check hits
      newState.seeds = newState.seeds.filter(seed => {
        seed.x += seed.speed;
        
        // Check collision with bugs
        for (let i = newState.bugs.length - 1; i >= 0; i--) {
          const bug = newState.bugs[i];
          if (bug.lane === seed.lane && 
              Math.abs(bug.x - seed.x) < 20 && 
              Math.abs(bug.y - seed.y) < 15) {
            bug.health -= 30;
            if (bug.health <= 0) {
              newState.score += 10;
              newState.bugs.splice(i, 1);
            }
            return false; // Remove seed
          }
        }
        
        return seed.x < CANVAS_WIDTH;
      });

      // Bugs eating plants
      newState.bugs.forEach(bug => {
        newState.plants.forEach(plant => {
          if (Math.abs(bug.x - plant.x) < 25 && Math.abs(bug.y - plant.y) < 25) {
            plant.health -= 1;
          }
        });
      });

      // Remove dead plants
      newState.plants = newState.plants.filter(p => p.health > 0);

      return newState;
    });
  }, [gameState.gameOver, spawnBug]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with garden background
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw lanes
    ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= LANE_COUNT; i++) {
      const y = 30 + i * LANE_HEIGHT;
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(CANVAS_WIDTH - 20, y);
      ctx.stroke();
    }

    // Draw garden fence (left side)
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(45, 25, 10, CANVAS_HEIGHT - 50);

    // Draw plants
    gameState.plants.forEach(plant => {
      const colors = {
        flower: '#FFD700',
        spiker: '#32CD32',
        barrier: '#8B4513'
      };
      
      ctx.fillStyle = colors[plant.type];
      ctx.fillRect(plant.x - 15, plant.y - 15, 30, 30);
      
      // Plant symbols
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      const symbols = { flower: '🌻', spiker: '🌵', barrier: '🛡️' };
      ctx.fillText(symbols[plant.type], plant.x, plant.y + 6);
      
      // Health indicator
      if (plant.health < 100) {
        const healthPercent = plant.health / 100;
        ctx.fillStyle = 'red';
        ctx.fillRect(plant.x - 15, plant.y - 25, 30, 4);
        ctx.fillStyle = 'green';
        ctx.fillRect(plant.x - 15, plant.y - 25, 30 * healthPercent, 4);
      }
    });

    // Draw bugs
    gameState.bugs.forEach(bug => {
      const bugData = bugTypes[bug.type];
      ctx.fillStyle = bugData.color;
      ctx.fillRect(bug.x - 12, bug.y - 12, 24, 24);
      
      // Bug symbols
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      const symbols = { ant: '🐜', beetle: '🐞', spider: '🕷️' };
      ctx.fillText(symbols[bug.type], bug.x, bug.y + 5);
      
      // Health bar
      const healthPercent = bug.health / (bugTypes[bug.type].health + gameState.wave * 10);
      ctx.fillStyle = 'red';
      ctx.fillRect(bug.x - 12, bug.y - 20, 24, 3);
      ctx.fillStyle = 'green';
      ctx.fillRect(bug.x - 12, bug.y - 20, 24 * healthPercent, 3);
    });

    // Draw seeds
    ctx.fillStyle = '#32CD32';
    gameState.seeds.forEach(seed => {
      ctx.beginPath();
      ctx.arc(seed.x, seed.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw UI
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, 25);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Resources: ${gameState.resources}`, 10, 18);
    ctx.fillText(`Wave: ${gameState.wave}`, 150, 18);
    ctx.fillText(`Score: ${gameState.score}`, 250, 18);

    if (!gameState.waveActive && !gameState.gameOver) {
      ctx.fillStyle = '#00FF00';
      ctx.fillText('Press SPACE to start wave!', 380, 18);
    }

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#FF0000';
      ctx.font = '36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Garden Overrun!', canvas.width / 2, canvas.height / 2 - 30);
      
      ctx.fillStyle = '#FFD700';
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

    if (y < 30 || x < 60) return; // UI area or fence area

    const cost = plantCosts[selectedPlant];
    if (gameState.resources >= cost) {
      // Check if position is empty
      const occupied = gameState.plants.some(p => 
        Math.abs(p.x - x) < 30 && Math.abs(p.y - y) < 30
      );
      
      if (!occupied) {
        const newPlant: Plant = {
          x,
          y,
          type: selectedPlant,
          health: 100,
          lastShot: 0
        };

        setGameState(prev => ({
          ...prev,
          plants: [...prev.plants, newPlant],
          resources: prev.resources - cost
        }));
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' && gameState.gameOver) {
        setGameState({
          plants: [],
          bugs: [],
          seeds: [],
          resources: 200,
          wave: 1,
          bugsSpawned: 0,
          bugsPerWave: 6,
          score: 0,
          gameOver: false,
          waveActive: false,
          lastResourceGen: 0
        });
      }
      
      if (e.key === ' ' && !gameState.waveActive && !gameState.gameOver) {
        setGameState(prev => ({ ...prev, waveActive: true }));
      }
      
      // Plant selection
      if (e.key === '1') setSelectedPlant('flower');
      if (e.key === '2') setSelectedPlant('spiker');
      if (e.key === '3') setSelectedPlant('barrier');
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
    <GameLayout gameTitle="Protect the Garden" gameCategory="Garden defense">
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2 mb-2">
          {Object.entries(plantCosts).map(([type, cost]) => (
            <button
              key={type}
              onClick={() => setSelectedPlant(type as Plant['type'])}
              className={`px-3 py-1 rounded text-sm ${
                selectedPlant === type 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              disabled={gameState.resources < cost}
            >
              {type} ({cost})
            </button>
          ))}
        </div>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-gray-600 bg-green-200 rounded-lg cursor-crosshair"
          onClick={handleCanvasClick}
        />
        <div className="text-center text-gray-300">
          <p>Click to place plants | 1-3: Select plant | SPACE: Start wave | R: Restart</p>
          <p>Selected: <span className="text-green-400">{selectedPlant}</span> (Cost: {plantCosts[selectedPlant]})</p>
          <p className="text-sm">🌻 Flower: Generates resources | 🌵 Spiker: Shoots seeds | 🛡️ Barrier: Blocks bugs</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default ProtectTheGarden;
