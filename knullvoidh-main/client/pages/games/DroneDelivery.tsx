import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Drone {
  x: number;
  y: number;
  vx: number;
  vy: number;
  carrying: Package | null;
  fuel: number;
}

interface Package {
  id: number;
  x: number;
  y: number;
  delivered: boolean;
  value: number;
  color: string;
}

interface Building {
  x: number;
  y: number;
  width: number;
  height: number;
  isTarget: boolean;
}

const DroneDelivery: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [drone, setDrone] = useState<Drone>({
    x: 100,
    y: 300,
    vx: 0,
    vy: 0,
    carrying: null,
    fuel: 100
  });
  const [packages, setPackages] = useState<Package[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [wind, setWind] = useState({ x: 0, y: 0 });

  const gameLoopRef = useRef<number>();
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const GRAVITY = 0.1;
  const THRUST = 0.5;

  // Generate level
  const generateLevel = useCallback(() => {
    const newBuildings: Building[] = [];
    const newPackages: Package[] = [];

    // Generate buildings
    for (let i = 0; i < 5 + level; i++) {
      newBuildings.push({
        x: 150 + i * 120,
        y: 400 + Math.random() * 100,
        width: 60 + Math.random() * 40,
        height: 80 + Math.random() * 60,
        isTarget: i % 2 === 1
      });
    }

    // Generate packages
    for (let i = 0; i < 3 + level; i++) {
      newPackages.push({
        id: i,
        x: 200 + i * 150,
        y: 500,
        delivered: false,
        value: 100 + Math.random() * 200,
        color: ['#0aff9d', '#7000ff', '#ff0099'][i % 3]
      });
    }

    setBuildings(newBuildings);
    setPackages(newPackages);
  }, [level]);

  // Handle input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => new Set([...prev, e.key.toLowerCase()]));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(e.key.toLowerCase());
        return newKeys;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      setDrone(prev => {
        let newVx = prev.vx;
        let newVy = prev.vy;
        let newFuel = prev.fuel;

        // Apply controls
        if (keys.has('w') || keys.has('arrowup')) {
          newVy -= THRUST;
          newFuel = Math.max(0, newFuel - 0.5);
        }
        if (keys.has('a') || keys.has('arrowleft')) {
          newVx -= THRUST * 0.5;
          newFuel = Math.max(0, newFuel - 0.2);
        }
        if (keys.has('d') || keys.has('arrowright')) {
          newVx += THRUST * 0.5;
          newFuel = Math.max(0, newFuel - 0.2);
        }

        // Apply physics
        newVy += GRAVITY;
        newVx += wind.x;
        newVy += wind.y;

        // Apply drag
        newVx *= 0.98;
        newVy *= 0.98;

        // Update position
        const newX = Math.max(20, Math.min(CANVAS_WIDTH - 20, prev.x + newVx));
        const newY = Math.max(20, Math.min(CANVAS_HEIGHT - 20, prev.y + newVy));

        // Check package pickup
        let carrying = prev.carrying;
        if (!carrying && (keys.has(' ') || keys.has('e'))) {
          const nearbyPackage = packages.find(pkg => {
            const dx = pkg.x - newX;
            const dy = pkg.y - newY;
            return Math.sqrt(dx * dx + dy * dy) < 30 && !pkg.delivered;
          });
          if (nearbyPackage) {
            carrying = nearbyPackage;
            setPackages(prevPkgs => prevPkgs.map(pkg => 
              pkg.id === nearbyPackage.id ? { ...pkg, delivered: true } : pkg
            ));
          }
        }

        // Check package delivery
        if (carrying && (keys.has(' ') || keys.has('e'))) {
          const targetBuilding = buildings.find(building => {
            return building.isTarget &&
                   newX > building.x && newX < building.x + building.width &&
                   newY > building.y - 20 && newY < building.y + building.height;
          });
          if (targetBuilding) {
            setScore(s => s + carrying.value);
            carrying = null;
          }
        }

        return {
          ...prev,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          carrying,
          fuel: newFuel
        };
      });

      // Update wind
      setWind({
        x: Math.sin(Date.now() * 0.001) * 0.02,
        y: Math.sin(Date.now() * 0.0015) * 0.01
      });

      // Check level completion
      const allDelivered = packages.every(pkg => pkg.delivered);
      if (allDelivered && !drone.carrying) {
        setLevel(prev => prev + 1);
        setScore(prev => prev + 500);
        generateLevel();
        setDrone(prev => ({ ...prev, fuel: 100 }));
      }

      // Check game over
      if (drone.fuel <= 0) {
        setGameState('gameOver');
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, drone, packages, buildings, keys, wind, generateLevel]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Buildings
    buildings.forEach(building => {
      ctx.fillStyle = building.isTarget ? '#ff0099' : '#666';
      ctx.fillRect(building.x, building.y, building.width, building.height);
      
      if (building.isTarget) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TARGET', building.x + building.width/2, building.y - 5);
      }
    });

    // Packages
    packages.forEach(pkg => {
      if (!pkg.delivered) {
        ctx.fillStyle = pkg.color;
        ctx.shadowColor = pkg.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(pkg.x - 10, pkg.y - 10, 20, 20);
        ctx.shadowBlur = 0;
      }
    });

    // Drone
    ctx.fillStyle = '#0aff9d';
    ctx.shadowColor = '#0aff9d';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(drone.x, drone.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Carrying package
    if (drone.carrying) {
      ctx.fillStyle = drone.carrying.color;
      ctx.fillRect(drone.x - 8, drone.y + 20, 16, 16);
    }

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Level: ${level}`, 20, 50);
    ctx.fillText(`Fuel: ${Math.floor(drone.fuel)}%`, 20, 70);
    
    const remaining = packages.filter(p => !p.delivered).length;
    ctx.fillText(`Packages: ${remaining}`, 20, 90);

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ff0000';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('OUT OF FUEL', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  });

  useEffect(() => {
    generateLevel();
  }, [generateLevel]);

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore(0);
    setLevel(1);
    setDrone({
      x: 100,
      y: 300,
      vx: 0,
      vy: 0,
      carrying: null,
      fuel: 100
    });
    generateLevel();
    setGameState('playing');
  };

  return (
    <GameLayout
      gameTitle="Drone Delivery"
      gameCategory="Simulation"
      score={score}
      isPlaying={gameState === 'playing'}
      onPause={handlePause}
      onReset={handleReset}
    >
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border border-neon-blue/50 rounded-lg bg-black/20 backdrop-blur-sm shadow-2xl max-w-full h-auto"
            style={{ touchAction: 'none' }}
          />
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>WASD to fly • Space/E to pickup/drop packages • Deliver to red buildings</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default DroneDelivery;
