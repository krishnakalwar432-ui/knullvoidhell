import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Building {
  id: string;
  type: 'habitat' | 'power' | 'factory' | 'mining' | 'research' | 'defense';
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
  health: number;
  maxHealth: number;
  production: number;
  color: string;
}

interface Resource {
  energy: number;
  minerals: number;
  population: number;
  research: number;
}

interface BuildingType {
  type: string;
  cost: Partial<Resource>;
  production: Partial<Resource>;
  size: { width: number; height: number };
  color: string;
  description: string;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const GRID_SIZE = 20;

const buildingTypes: BuildingType[] = [
  {
    type: 'habitat',
    cost: { energy: 20, minerals: 30 },
    production: { population: 5 },
    size: { width: 40, height: 40 },
    color: '#0aff9d',
    description: 'Houses colonists'
  },
  {
    type: 'power',
    cost: { minerals: 50 },
    production: { energy: 10 },
    size: { width: 30, height: 30 },
    color: '#ffff00',
    description: 'Generates energy'
  },
  {
    type: 'mining',
    cost: { energy: 30, population: 2 },
    production: { minerals: 8 },
    size: { width: 50, height: 30 },
    color: '#ff6600',
    description: 'Extracts minerals'
  },
  {
    type: 'factory',
    cost: { energy: 40, minerals: 60, population: 3 },
    production: { minerals: 15 },
    size: { width: 60, height: 40 },
    color: '#ff0099',
    description: 'Advanced production'
  },
  {
    type: 'research',
    cost: { energy: 35, minerals: 40, population: 4 },
    production: { research: 5 },
    size: { width: 45, height: 35 },
    color: '#7000ff',
    description: 'Advances technology'
  },
  {
    type: 'defense',
    cost: { energy: 60, minerals: 80, population: 2 },
    production: {},
    size: { width: 35, height: 35 },
    color: '#ff0000',
    description: 'Protects colony'
  }
];

export default function SpaceColonyBuilder() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [resources, setResources] = useState<Resource>({
    energy: 100,
    minerals: 100,
    population: 10,
    research: 0
  });
  const [selectedBuildingType, setSelectedBuildingType] = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [gameTime, setGameTime] = useState(0);
  const [alerts, setAlerts] = useState<string[]>([]);
  const buildingIdRef = useRef(0);

  const canAfford = useCallback((cost: Partial<Resource>) => {
    return Object.entries(cost).every(([resource, amount]) => 
      resources[resource as keyof Resource] >= amount!
    );
  }, [resources]);

  const spendResources = useCallback((cost: Partial<Resource>) => {
    setResources(prev => {
      const newResources = { ...prev };
      Object.entries(cost).forEach(([resource, amount]) => {
        newResources[resource as keyof Resource] -= amount!;
      });
      return newResources;
    });
  }, []);

  const canPlaceBuilding = useCallback((x: number, y: number, width: number, height: number) => {
    // Check boundaries
    if (x < 0 || y < 0 || x + width > GAME_WIDTH || y + height > GAME_HEIGHT) {
      return false;
    }

    // Check collision with existing buildings
    return !buildings.some(building => 
      x < building.x + building.width &&
      x + width > building.x &&
      y < building.y + building.height &&
      y + height > building.y
    );
  }, [buildings]);

  const placeBulidingAttempt = useCallback((x: number, y: number, type: string) => {
    const buildingType = buildingTypes.find(bt => bt.type === type);
    if (!buildingType) return false;

    const gridX = Math.floor(x / GRID_SIZE) * GRID_SIZE;
    const gridY = Math.floor(y / GRID_SIZE) * GRID_SIZE;

    if (!canAfford(buildingType.cost)) {
      setAlerts(prev => [...prev, 'Insufficient resources!']);
      return false;
    }

    if (!canPlaceBuilding(gridX, gridY, buildingType.size.width, buildingType.size.height)) {
      setAlerts(prev => [...prev, 'Cannot place building here!']);
      return false;
    }

    const newBuilding: Building = {
      id: `building-${buildingIdRef.current++}`,
      type: type as any,
      x: gridX,
      y: gridY,
      width: buildingType.size.width,
      height: buildingType.size.height,
      level: 1,
      health: 100,
      maxHealth: 100,
      production: 1,
      color: buildingType.color
    };

    setBuildings(prev => [...prev, newBuilding]);
    spendResources(buildingType.cost);
    setScore(prev => prev + 50);
    return true;
  }, [canAfford, canPlaceBuilding, spendResources]);

  const upgradeBuilding = useCallback((building: Building) => {
    const upgradeCost = {
      energy: 20 * building.level,
      minerals: 30 * building.level
    };

    if (canAfford(upgradeCost)) {
      setBuildings(prev => prev.map(b => 
        b.id === building.id 
          ? { ...b, level: b.level + 1, production: b.production * 1.5 }
          : b
      ));
      spendResources(upgradeCost);
      setScore(prev => prev + building.level * 25);
    } else {
      setAlerts(prev => [...prev, 'Cannot afford upgrade!']);
    }
  }, [canAfford, spendResources]);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlaying || isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Check if clicking on existing building
    const clickedBuilding = buildings.find(building =>
      x >= building.x && x <= building.x + building.width &&
      y >= building.y && y <= building.y + building.height
    );

    if (clickedBuilding) {
      setSelectedBuilding(clickedBuilding);
      setSelectedBuildingType(null);
    } else if (selectedBuildingType) {
      if (placeBulidingAttempt(x, y, selectedBuildingType)) {
        setSelectedBuildingType(null);
      }
    } else {
      setSelectedBuilding(null);
    }
  }, [isPlaying, isPaused, buildings, selectedBuildingType, placeBulidingAttempt]);

  const gameLoop = useCallback(() => {
    if (!isPlaying || isPaused) return;

    setGameTime(prev => prev + 1);

    // Resource production every 60 frames (1 second)
    if (gameTime % 60 === 0) {
      setResources(prev => {
        const newResources = { ...prev };
        
        buildings.forEach(building => {
          const buildingType = buildingTypes.find(bt => bt.type === building.type);
          if (buildingType) {
            Object.entries(buildingType.production).forEach(([resource, amount]) => {
              const production = amount! * building.production;
              newResources[resource as keyof Resource] += production;
            });
          }
        });

        // Population consumption
        newResources.energy -= Math.floor(newResources.population * 0.5);
        newResources.energy = Math.max(0, newResources.energy);

        return newResources;
      });
    }

    // Clear old alerts
    if (gameTime % 180 === 0) { // Every 3 seconds
      setAlerts([]);
    }

    // Random events
    if (gameTime % 300 === 0 && Math.random() < 0.3) { // Every 5 seconds, 30% chance
      const events = [
        'Asteroid storm damages buildings!',
        'New colonists arrive!',
        'Rich mineral vein discovered!',
        'Solar flare disrupts energy production!'
      ];
      
      const event = events[Math.floor(Math.random() * events.length)];
      setAlerts(prev => [...prev, event]);

      if (event.includes('storm')) {
        setBuildings(prev => prev.map(building => ({
          ...building,
          health: Math.max(10, building.health - 20)
        })));
      } else if (event.includes('colonists')) {
        setResources(prev => ({ ...prev, population: prev.population + 5 }));
      } else if (event.includes('mineral')) {
        setResources(prev => ({ ...prev, minerals: prev.minerals + 50 }));
      } else if (event.includes('solar')) {
        setResources(prev => ({ ...prev, energy: Math.max(0, prev.energy - 30) }));
      }
    }

  }, [isPlaying, isPaused, gameTime, buildings]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Space background
    const gradient = ctx.createRadialGradient(
      GAME_WIDTH/2, GAME_HEIGHT/2, 0,
      GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH
    );
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(1, '#000508');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
      const x = (i * 7) % GAME_WIDTH;
      const y = (i * 13) % GAME_HEIGHT;
      const size = Math.sin(gameTime * 0.01 + i) * 0.5 + 1;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Grid
    ctx.strokeStyle = '#001a33';
    ctx.lineWidth = 1;
    for (let x = 0; x <= GAME_WIDTH; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= GAME_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_WIDTH, y);
      ctx.stroke();
    }

    // Buildings
    buildings.forEach(building => {
      // Building body
      const healthPercent = building.health / building.maxHealth;
      const alpha = 0.7 + healthPercent * 0.3;
      
      ctx.fillStyle = building.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.strokeStyle = selectedBuilding?.id === building.id ? '#ffffff' : building.color;
      ctx.lineWidth = selectedBuilding?.id === building.id ? 3 : 1;
      
      ctx.fillRect(building.x, building.y, building.width, building.height);
      ctx.strokeRect(building.x, building.y, building.width, building.height);

      // Building level indicator
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        building.level.toString(),
        building.x + building.width/2,
        building.y + building.height/2 + 4
      );

      // Health bar
      if (building.health < building.maxHealth) {
        const barWidth = building.width - 4;
        const barHeight = 4;
        
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(building.x + 2, building.y - 8, barWidth, barHeight);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(building.x + 2, building.y - 8, barWidth * healthPercent, barHeight);
      }

      // Production indicator
      const buildingType = buildingTypes.find(bt => bt.type === building.type);
      if (buildingType && Object.keys(buildingType.production).length > 0) {
        const pulse = Math.sin(gameTime * 0.1) * 0.3 + 0.7;
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.strokeStyle = building.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
          building.x + building.width/2,
          building.y + building.height/2,
          Math.max(building.width, building.height)/2 + 5,
          0, Math.PI * 2
        );
        ctx.stroke();
        ctx.restore();
      }
    });

    // Placement preview
    if (selectedBuildingType) {
      const buildingType = buildingTypes.find(bt => bt.type === selectedBuildingType);
      if (buildingType) {
        ctx.fillStyle = buildingType.color + '40';
        ctx.strokeStyle = buildingType.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.fillRect(0, 0, buildingType.size.width, buildingType.size.height);
        ctx.strokeRect(0, 0, buildingType.size.width, buildingType.size.height);
        ctx.setLineDash([]);
      }
    }

    // UI
    const uiHeight = 120;
    ctx.fillStyle = 'rgba(0, 20, 40, 0.9)';
    ctx.fillRect(0, 0, GAME_WIDTH, uiHeight);

    // Resources
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    const resourcesText = [
      `Energy: ${resources.energy}`,
      `Minerals: ${resources.minerals}`,
      `Population: ${resources.population}`,
      `Research: ${resources.research}`
    ];
    
    resourcesText.forEach((text, i) => {
      ctx.fillText(text, 10, 25 + i * 20);
    });

    // Selected building info
    if (selectedBuilding) {
      ctx.fillStyle = '#0aff9d';
      ctx.font = '14px Arial';
      ctx.fillText(`Selected: ${selectedBuilding.type.toUpperCase()}`, 200, 25);
      ctx.fillText(`Level: ${selectedBuilding.level}`, 200, 45);
      ctx.fillText(`Health: ${selectedBuilding.health}/${selectedBuilding.maxHealth}`, 200, 65);
    }

    // Alerts
    alerts.forEach((alert, i) => {
      ctx.fillStyle = '#ff6600';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(alert, GAME_WIDTH/2, GAME_HEIGHT - 40 + i * 20);
    });

    ctx.textAlign = 'left';
  }, [buildings, selectedBuilding, selectedBuildingType, resources, alerts, gameTime]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(gameLoop, 16);
    return () => clearInterval(interval);
  }, [gameLoop, isPlaying]);

  useEffect(() => {
    const interval = setInterval(draw, 16);
    return () => clearInterval(interval);
  }, [draw]);

  const startGame = () => {
    setScore(0);
    setGameTime(0);
    setBuildings([]);
    setResources({ energy: 100, minerals: 100, population: 10, research: 0 });
    setSelectedBuilding(null);
    setSelectedBuildingType(null);
    setAlerts([]);
    buildingIdRef.current = 0;
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseGame = () => setIsPaused(!isPaused);
  const resetGame = () => {
    setIsPlaying(false);
    setScore(0);
  };

  return (
    <GameLayout
      gameTitle="Space Colony Builder"
      gameCategory="Build and manage your space colony!"
      score={score}
      isPlaying={isPlaying}
      onPause={pauseGame}
      onReset={resetGame}
    >
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          onClick={handleCanvasClick}
          className="border-2 border-neon-green rounded-lg cursor-pointer max-w-full h-auto"
          style={{ background: 'radial-gradient(circle, #001122, #000508)' }}
        />
        
        {isPlaying && (
          <div className="flex flex-col gap-4 w-full max-w-4xl">
            {/* Building Selection */}
            <div className="flex gap-2 flex-wrap justify-center">
              {buildingTypes.map(buildingType => (
                <button
                  key={buildingType.type}
                  onClick={() => setSelectedBuildingType(
                    selectedBuildingType === buildingType.type ? null : buildingType.type
                  )}
                  disabled={!canAfford(buildingType.cost)}
                  className={`px-3 py-2 rounded border-2 transition-all text-sm ${
                    selectedBuildingType === buildingType.type
                      ? 'border-neon-green bg-neon-green/20'
                      : canAfford(buildingType.cost)
                        ? 'border-gray-600 hover:border-neon-green/50'
                        : 'border-red-500/50 opacity-50 cursor-not-allowed'
                  }`}
                  style={{ 
                    borderColor: canAfford(buildingType.cost) ? buildingType.color : '#ff0000',
                    color: buildingType.color
                  }}
                >
                  <div className="font-bold">{buildingType.type.toUpperCase()}</div>
                  <div className="text-xs">
                    {Object.entries(buildingType.cost).map(([resource, cost]) => 
                      `${resource}: ${cost}`
                    ).join(', ')}
                  </div>
                </button>
              ))}
            </div>

            {/* Building Actions */}
            {selectedBuilding && (
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => upgradeBuilding(selectedBuilding)}
                  className="px-4 py-2 rounded border-2 border-blue-500 text-blue-500 hover:bg-blue-500/20"
                >
                  Upgrade (Energy: {20 * selectedBuilding.level}, Minerals: {30 * selectedBuilding.level})
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className="text-center text-sm text-gray-400 max-w-md">
          Click buildings to select, click ground to place. Manage resources and expand your colony!
          Buildings produce resources automatically.
        </div>
      </div>
    </GameLayout>
  );
}
