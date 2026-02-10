import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Plant {
  x: number;
  y: number;
  type: 'shooter' | 'blocker' | 'bomb' | 'ice';
  health: number;
  maxHealth: number;
  cooldown: number;
  lastShot: number;
  cost: number;
}

interface Zombie {
  x: number;
  y: number;
  lane: number;
  health: number;
  maxHealth: number;
  speed: number;
  type: 'basic' | 'fast' | 'heavy' | 'boss';
  reward: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  type: 'bullet' | 'ice' | 'bomb';
}

const ZombieDefenseHTML5 = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const [selectedPlantType, setSelectedPlantType] = useState<Plant['type']>('shooter');
  const [hoveredCell, setHoveredCell] = useState<{x: number, y: number} | null>(null);

  const GRID_SIZE = 80;
  const GRID_COLS = 9;
  const GRID_ROWS = 5;

  const [gameState, setGameState] = useState({
    plants: [] as Plant[],
    zombies: [] as Zombie[],
    projectiles: [] as Projectile[],
    money: 200,
    score: 0,
    gameOver: false,
    wave: 1,
    zombieSpawnTimer: 0,
    waveProgress: 0
  });

  const plantTypes = {
    shooter: { cost: 100, health: 100, cooldown: 60, damage: 25 },
    blocker: { cost: 50, health: 300, cooldown: 0, damage: 0 },
    bomb: { cost: 150, health: 100, cooldown: 180, damage: 100 },
    ice: { cost: 175, health: 100, cooldown: 90, damage: 15 }
  };

  const zombieTypes = {
    basic: { health: 100, speed: 0.5, reward: 25 },
    fast: { health: 60, speed: 1, reward: 30 },
    heavy: { health: 200, speed: 0.3, reward: 50 },
    boss: { health: 500, speed: 0.2, reward: 100 }
  };

  const spawnZombie = useCallback((lane: number, type: Zombie['type'] = 'basic', wave: number = 1) => {
    const zombieData = zombieTypes[type];
    return {
      x: 800,
      y: lane * GRID_SIZE + 120 + GRID_SIZE / 2 - 15,
      lane,
      health: zombieData.health + (wave - 1) * 20,
      maxHealth: zombieData.health + (wave - 1) * 20,
      speed: zombieData.speed,
      type,
      reward: zombieData.reward
    };
  }, []);

  const initializeGame = useCallback(() => {
    setGameState({
      plants: [],
      zombies: [],
      projectiles: [],
      money: 200,
      score: 0,
      gameOver: false,
      wave: 1,
      zombieSpawnTimer: 0,
      waveProgress: 0
    });
  }, []);

  const getGridPosition = (mouseX: number, mouseY: number) => {
    const x = Math.floor((mouseX - 80) / GRID_SIZE);
    const y = Math.floor((mouseY - 120) / GRID_SIZE);
    return { x, y };
  };

  const canPlacePlant = (x: number, y: number) => {
    if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) return false;
    return !gameState.plants.some(plant => 
      Math.floor((plant.x - 80) / GRID_SIZE) === x && 
      Math.floor((plant.y - 120) / GRID_SIZE) === y
    );
  };

  const placePlant = (x: number, y: number) => {
    if (!canPlacePlant(x, y)) return;
    
    const plantData = plantTypes[selectedPlantType];
    if (gameState.money < plantData.cost) return;

    const newPlant: Plant = {
      x: x * GRID_SIZE + 80 + GRID_SIZE / 2 - 20,
      y: y * GRID_SIZE + 120 + GRID_SIZE / 2 - 20,
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
      money: prev.money - plantData.cost
    }));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Check plant selection UI first
    if (mouseY >= 20 && mouseY <= 80) {
      const plantIndex = Math.floor((mouseX - 500) / 70);
      const types: Plant['type'][] = ['shooter', 'blocker', 'bomb', 'ice'];
      
      if (plantIndex >= 0 && plantIndex < types.length) {
        setSelectedPlantType(types[plantIndex]);
        return;
      }
    }
    
    const { x, y } = getGridPosition(mouseX, mouseY);
    placePlant(x, y);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const { x, y } = getGridPosition(mouseX, mouseY);
    setHoveredCell({ x, y });
  };

  const update = useCallback(() => {
    if (gameState.gameOver) return;

    setGameState(prev => {
      const newState = { ...prev };
      let plants = [...newState.plants];
      let zombies = [...newState.zombies];
      let projectiles = [...newState.projectiles];

      // Spawn zombies
      newState.zombieSpawnTimer++;
      const spawnRate = Math.max(60, 180 - newState.wave * 10);
      
      if (newState.zombieSpawnTimer > spawnRate) {
        const lane = Math.floor(Math.random() * GRID_ROWS);
        let zombieType: Zombie['type'] = 'basic';
        
        const rand = Math.random();
        if (newState.wave > 2 && rand < 0.1) zombieType = 'boss';
        else if (newState.wave > 1 && rand < 0.3) zombieType = 'heavy';
        else if (rand < 0.4) zombieType = 'fast';
        
        zombies.push(spawnZombie(lane, zombieType, newState.wave));
        newState.zombieSpawnTimer = 0;
        newState.waveProgress++;
      }

      // Update zombies
      zombies = zombies.map(zombie => ({
        ...zombie,
        x: zombie.x - zombie.speed
      }));

      // Plant shooting
      plants = plants.map(plant => {
        if (plant.type === 'shooter' || plant.type === 'ice') {
          plant.lastShot++;
          
          if (plant.lastShot >= plant.cooldown) {
            // Find zombie in same lane
            const targetZombie = zombies.find(zombie => 
              Math.abs(zombie.y - (plant.y + 20)) < 40 && 
              zombie.x > plant.x
            );
            
            if (targetZombie) {
              const plantData = plantTypes[plant.type];
              projectiles.push({
                x: plant.x + 40,
                y: plant.y + 20,
                vx: 8,
                vy: 0,
                damage: plantData.damage,
                type: plant.type === 'ice' ? 'ice' : 'bullet'
              });
              plant.lastShot = 0;
            }
          }
        } else if (plant.type === 'bomb') {
          plant.lastShot++;
          
          if (plant.lastShot >= plant.cooldown) {
            // Check for nearby zombies
            const nearbyZombies = zombies.filter(zombie => 
              Math.abs(zombie.x - plant.x) < 100 && 
              Math.abs(zombie.y - plant.y) < 100
            );
            
            if (nearbyZombies.length > 0) {
              // Explode
              projectiles.push({
                x: plant.x + 20,
                y: plant.y + 20,
                vx: 0,
                vy: 0,
                damage: 100,
                type: 'bomb'
              });
              plant.health = 0; // Plant destroys itself
              plant.lastShot = 0;
            }
          }
        }
        
        return plant;
      });

      // Update projectiles
      projectiles = projectiles.map(projectile => ({
        ...projectile,
        x: projectile.x + projectile.vx,
        y: projectile.y + projectile.vy
      })).filter(projectile => projectile.x < 850);

      // Check projectile-zombie collisions
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        let projectileHit = false;

        for (let j = zombies.length - 1; j >= 0; j--) {
          const zombie = zombies[j];
          const distance = Math.sqrt(
            Math.pow(projectile.x - (zombie.x + 15), 2) +
            Math.pow(projectile.y - (zombie.y + 15), 2)
          );

          if (distance < (projectile.type === 'bomb' ? 80 : 30)) {
            zombie.health -= projectile.damage;
            projectileHit = true;

            if (projectile.type === 'ice') {
              zombie.speed = Math.max(0.1, zombie.speed * 0.5); // Slow effect
            }

            if (zombie.health <= 0) {
              newState.money += zombie.reward;
              newState.score += zombie.reward * 10;
              zombies.splice(j, 1); // Remove dead zombie
            }

            if (projectile.type !== 'bomb') break;
          }
        }

        if (projectileHit || projectile.type === 'bomb') {
          projectiles.splice(i, 1); // Remove hit projectile
        }
      }

      // Check zombie-plant collisions
      for (const zombie of zombies) {
        const hitPlant = plants.find(plant => 
          Math.abs(zombie.x - plant.x) < 35 && 
          Math.abs(zombie.y - plant.y) < 35
        );
        
        if (hitPlant) {
          hitPlant.health -= 1;
          zombie.speed = 0; // Stop to attack
        } else {
          // Restore normal speed if not attacking
          const zombieData = zombieTypes[zombie.type];
          zombie.speed = Math.min(zombie.speed + 0.02, zombieData.speed);
        }
      }

      // Remove dead plants
      plants = plants.filter(plant => plant.health > 0);

      // Check if zombies reached the house
      if (zombies.some(zombie => zombie.x < 50)) {
        newState.gameOver = true;
      }

      // Wave progression
      if (zombies.length === 0 && newState.waveProgress > 10 + newState.wave * 3) {
        newState.wave++;
        newState.waveProgress = 0;
        newState.money += 100; // Wave bonus
        newState.score += 1000;
      }

      newState.plants = plants;
      newState.zombies = zombies;
      newState.projectiles = projectiles;
      return newState;
    });
  }, [gameState.gameOver, spawnZombie]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#228B22');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#90EE90';
    ctx.lineWidth = 2;
    
    for (let x = 0; x <= GRID_COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(80 + x * GRID_SIZE, 120);
      ctx.lineTo(80 + x * GRID_SIZE, 120 + GRID_ROWS * GRID_SIZE);
      ctx.stroke();
    }
    
    for (let y = 0; y <= GRID_ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(80, 120 + y * GRID_SIZE);
      ctx.lineTo(80 + GRID_COLS * GRID_SIZE, 120 + y * GRID_SIZE);
      ctx.stroke();
    }

    // Draw hovered cell
    if (hoveredCell && canPlacePlant(hoveredCell.x, hoveredCell.y)) {
      const plantData = plantTypes[selectedPlantType];
      const canAfford = gameState.money >= plantData.cost;
      
      ctx.fillStyle = canAfford ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
      ctx.fillRect(
        80 + hoveredCell.x * GRID_SIZE,
        120 + hoveredCell.y * GRID_SIZE,
        GRID_SIZE,
        GRID_SIZE
      );
    }

    // Draw house
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(10, 120, 60, GRID_ROWS * GRID_SIZE);
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(10, 100, 60, 20);
    
    ctx.fillStyle = '#654321';
    ctx.fillRect(30, 200, 20, 40);

    // Draw plants
    gameState.plants.forEach(plant => {
      let color = '#00AA00';
      if (plant.type === 'blocker') color = '#8B4513';
      else if (plant.type === 'bomb') color = '#FF4500';
      else if (plant.type === 'ice') color = '#00FFFF';
      
      ctx.fillStyle = color;
      ctx.fillRect(plant.x, plant.y, 40, 40);
      
      // Plant details
      if (plant.type === 'shooter') {
        ctx.fillStyle = '#006600';
        ctx.fillRect(plant.x + 30, plant.y + 15, 15, 10);
      } else if (plant.type === 'blocker') {
        ctx.fillStyle = '#654321';
        ctx.fillRect(plant.x + 15, plant.y + 10, 10, 20);
      } else if (plant.type === 'bomb') {
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(plant.x + 20, plant.y + 20, 8, 0, Math.PI * 2);
        ctx.fill();
      } else if (plant.type === 'ice') {
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 3; i++) {
          ctx.fillRect(plant.x + 10 + i * 8, plant.y + 10 + i * 2, 6, 6);
        }
      }
      
      // Health bar
      if (plant.health < plant.maxHealth) {
        const healthPercent = plant.health / plant.maxHealth;
        ctx.fillStyle = '#333333';
        ctx.fillRect(plant.x, plant.y - 8, 40, 4);
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(plant.x, plant.y - 8, 40 * healthPercent, 4);
      }
    });

    // Draw zombies
    gameState.zombies.forEach(zombie => {
      let color = '#90EE90';
      if (zombie.type === 'fast') color = '#FFFF00';
      else if (zombie.type === 'heavy') color = '#A0522D';
      else if (zombie.type === 'boss') color = '#8B0000';
      
      ctx.fillStyle = color;
      ctx.fillRect(zombie.x, zombie.y, 30, 30);
      
      // Zombie features
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(zombie.x + 8, zombie.y + 8, 4, 4);
      ctx.fillRect(zombie.x + 18, zombie.y + 8, 4, 4);
      ctx.fillRect(zombie.x + 10, zombie.y + 18, 10, 4);
      
      // Health bar
      if (zombie.health < zombie.maxHealth) {
        const healthPercent = zombie.health / zombie.maxHealth;
        ctx.fillStyle = '#333333';
        ctx.fillRect(zombie.x, zombie.y - 8, 30, 4);
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(zombie.x, zombie.y - 8, 30 * healthPercent, 4);
      }
    });

    // Draw projectiles
    gameState.projectiles.forEach(projectile => {
      if (projectile.type === 'bomb') {
        // Draw explosion
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 60, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 40, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = projectile.type === 'ice' ? '#00FFFF' : '#FFFF00';
        ctx.fillRect(projectile.x, projectile.y, 8, 4);
      }
    });

    // Draw UI
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`Money: $${gameState.money}`, 20, 30);
    ctx.fillText(`Score: ${gameState.score}`, 20, 60);
    ctx.fillText(`Wave: ${gameState.wave}`, 20, 90);

    // Plant selection UI
    const plantNames = ['Shooter', 'Blocker', 'Bomb', 'Ice'];
    const plantCosts = [100, 50, 150, 175];
    
    plantNames.forEach((name, index) => {
      const type = ['shooter', 'blocker', 'bomb', 'ice'][index] as Plant['type'];
      const x = 500 + index * 70;
      const y = 20;
      
      ctx.fillStyle = selectedPlantType === type ? '#FFFF00' : 
                     gameState.money >= plantCosts[index] ? '#00FF00' : '#FF0000';
      ctx.fillRect(x, y, 60, 60);
      
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(name, x + 30, y + 25);
      ctx.fillText(`$${plantCosts[index]}`, x + 30, y + 45);
      ctx.textAlign = 'left';
    });

    // Draw game over screen
    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#ff0099';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('The zombies got through!', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText(`Wave Reached: ${gameState.wave}`, canvas.width / 2, canvas.height / 2 + 30);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 70);
      ctx.textAlign = 'left';
    }
  }, [gameState, selectedPlantType, hoveredCell]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r' && gameState.gameOver) {
        initializeGame();
      }
      
      // Plant selection hotkeys
      const keyToPlant: {[key: string]: Plant['type']} = {
        '1': 'shooter',
        '2': 'blocker', 
        '3': 'bomb',
        '4': 'ice'
      };
      
      if (keyToPlant[e.key]) {
        setSelectedPlantType(keyToPlant[e.key]);
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
    <GameLayout gameTitle="Zombie Defense HTML5" gameCategory="PvZ-style defense">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg shadow-2xl cursor-pointer"
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
        />
        <div className="text-center text-gray-300">
          <p>Click grid to place plants | 1-4: Select plant type | R: Restart</p>
          <p>Defend your house from zombie invasion! Plants vs Zombies style!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default ZombieDefenseHTML5;
