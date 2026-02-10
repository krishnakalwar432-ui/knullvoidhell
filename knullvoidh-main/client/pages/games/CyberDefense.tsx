import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Enemy {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  pathIndex: number;
  color: string;
}

interface Tower {
  id: number;
  x: number;
  y: number;
  range: number;
  damage: number;
  fireRate: number;
  lastFire: number;
  color: string;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  damage: number;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

const path = [
  { x: 0, y: 300 },
  { x: 200, y: 300 },
  { x: 200, y: 150 },
  { x: 400, y: 150 },
  { x: 400, y: 450 },
  { x: 600, y: 450 },
  { x: 600, y: 300 },
  { x: 800, y: 300 }
];

export default function CyberDefense() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [health, setHealth] = useState(100);
  const [credits, setCredits] = useState(500);
  const [wave, setWave] = useState(1);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [selectedTower, setSelectedTower] = useState<string | null>(null);
  const enemyIdRef = useRef(0);
  const towerIdRef = useRef(0);
  const projectileIdRef = useRef(0);
  const waveTimerRef = useRef(0);

  const towerTypes = {
    basic: { cost: 100, damage: 25, range: 80, fireRate: 1000, color: '#0aff9d' },
    laser: { cost: 200, damage: 40, range: 100, fireRate: 800, color: '#ff0099' },
    plasma: { cost: 300, damage: 60, range: 120, fireRate: 600, color: '#7000ff' }
  };

  const spawnEnemy = useCallback(() => {
    const newEnemy: Enemy = {
      id: enemyIdRef.current++,
      x: path[0].x,
      y: path[0].y,
      health: 50 + wave * 10,
      maxHealth: 50 + wave * 10,
      speed: 1 + wave * 0.1,
      pathIndex: 0,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    };
    setEnemies(prev => [...prev, newEnemy]);
  }, [wave]);

  const placeTower = useCallback((x: number, y: number, type: keyof typeof towerTypes) => {
    const towerType = towerTypes[type];
    if (credits >= towerType.cost) {
      const newTower: Tower = {
        id: towerIdRef.current++,
        x,
        y,
        range: towerType.range,
        damage: towerType.damage,
        fireRate: towerType.fireRate,
        lastFire: 0,
        color: towerType.color
      };
      setTowers(prev => [...prev, newTower]);
      setCredits(prev => prev - towerType.cost);
    }
  }, [credits]);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlaying || isPaused) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    
    if (selectedTower && credits >= towerTypes[selectedTower as keyof typeof towerTypes].cost) {
      placeTower(x, y, selectedTower as keyof typeof towerTypes);
    }
  }, [isPlaying, isPaused, selectedTower, placeTower, credits]);

  const gameLoop = useCallback(() => {
    if (!isPlaying || isPaused) return;

    const currentTime = Date.now();

    // Spawn enemies
    waveTimerRef.current += 16;
    if (waveTimerRef.current > 2000 - wave * 50) {
      spawnEnemy();
      waveTimerRef.current = 0;
    }

    // Update enemies
    setEnemies(prev => prev.map(enemy => {
      if (enemy.pathIndex < path.length - 1) {
        const target = path[enemy.pathIndex + 1];
        const dx = target.x - enemy.x;
        const dy = target.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 5) {
          return { ...enemy, pathIndex: enemy.pathIndex + 1 };
        } else {
          return {
            ...enemy,
            x: enemy.x + (dx / distance) * enemy.speed,
            y: enemy.y + (dy / distance) * enemy.speed
          };
        }
      }
      return enemy;
    }).filter(enemy => {
      if (enemy.pathIndex >= path.length - 1 && enemy.x >= GAME_WIDTH) {
        setHealth(prev => Math.max(0, prev - 10));
        return false;
      }
      return enemy.health > 0;
    }));

    // Tower targeting and shooting
    setProjectiles(prev => {
      let newProjectiles = [...prev];
      
      towers.forEach(tower => {
        if (currentTime - tower.lastFire > tower.fireRate) {
          const target = enemies.find(enemy => {
            const dx = enemy.x - tower.x;
            const dy = enemy.y - tower.y;
            return Math.sqrt(dx * dx + dy * dy) <= tower.range;
          });
          
          if (target) {
            const projectile: Projectile = {
              id: projectileIdRef.current++,
              x: tower.x,
              y: tower.y,
              targetX: target.x,
              targetY: target.y,
              speed: 5,
              damage: tower.damage
            };
            newProjectiles.push(projectile);
            tower.lastFire = currentTime;
          }
        }
      });
      
      return newProjectiles;
    });

    // Update projectiles
    setProjectiles(prev => prev.map(projectile => {
      const dx = projectile.targetX - projectile.x;
      const dy = projectile.targetY - projectile.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < projectile.speed) {
        // Hit target
        setEnemies(prevEnemies => prevEnemies.map(enemy => {
          const hitDistance = Math.sqrt(
            (enemy.x - projectile.targetX) ** 2 + 
            (enemy.y - projectile.targetY) ** 2
          );
          if (hitDistance < 20) {
            const newHealth = enemy.health - projectile.damage;
            if (newHealth <= 0) {
              setScore(prevScore => prevScore + 10);
              setCredits(prevCredits => prevCredits + 25);
            }
            return { ...enemy, health: newHealth };
          }
          return enemy;
        }));
        return null;
      }
      
      return {
        ...projectile,
        x: projectile.x + (dx / distance) * projectile.speed,
        y: projectile.y + (dy / distance) * projectile.speed
      };
    }).filter(Boolean) as Projectile[]);

    // Check wave completion
    if (enemies.length === 0 && waveTimerRef.current > 3000) {
      setWave(prev => prev + 1);
      setCredits(prev => prev + 100);
    }
  }, [isPlaying, isPaused, enemies, towers, wave, spawnEnemy]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Clear canvas
    ctx.fillStyle = '#000814';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw path
    ctx.strokeStyle = '#001d3d';
    ctx.lineWidth = 30;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();

    // Draw towers
    towers.forEach(tower => {
      // Tower range
      if (selectedTower) {
        ctx.strokeStyle = tower.color + '30';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Tower body
      ctx.fillStyle = tower.color;
      ctx.shadowColor = tower.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw enemies
    enemies.forEach(enemy => {
      // Enemy body
      ctx.fillStyle = enemy.color;
      ctx.shadowColor = enemy.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Health bar
      const barWidth = 20;
      const barHeight = 4;
      const healthPercent = enemy.health / enemy.maxHealth;
      
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(enemy.x - barWidth/2, enemy.y - 20, barWidth, barHeight);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(enemy.x - barWidth/2, enemy.y - 20, barWidth * healthPercent, barHeight);
    });

    // Draw projectiles
    projectiles.forEach(projectile => {
      ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw UI
    ctx.fillStyle = '#0aff9d';
    ctx.font = '16px Arial';
    ctx.fillText(`Health: ${health}`, 10, 30);
    ctx.fillText(`Credits: ${credits}`, 10, 50);
    ctx.fillText(`Wave: ${wave}`, 10, 70);
    
    if (selectedTower) {
      ctx.fillText(`Selected: ${selectedTower}`, 10, 90);
    }
  }, [towers, enemies, projectiles, health, credits, wave, selectedTower]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(gameLoop, 16);
    return () => clearInterval(interval);
  }, [gameLoop, isPlaying]);

  useEffect(() => {
    const interval = setInterval(draw, 16);
    return () => clearInterval(interval);
  }, [draw]);

  useEffect(() => {
    if (health <= 0) {
      setIsPlaying(false);
    }
  }, [health]);

  const startGame = () => {
    setScore(0);
    setHealth(100);
    setCredits(500);
    setWave(1);
    setEnemies([]);
    setTowers([]);
    setProjectiles([]);
    setIsPlaying(true);
    setIsPaused(false);
    enemyIdRef.current = 0;
    towerIdRef.current = 0;
    projectileIdRef.current = 0;
    waveTimerRef.current = 0;
  };

  const pauseGame = () => setIsPaused(!isPaused);
  const resetGame = () => {
    setIsPlaying(false);
    setScore(0);
    setHealth(100);
    setCredits(500);
    setWave(1);
    setEnemies([]);
    setTowers([]);
    setProjectiles([]);
  };

  return (
    <GameLayout
      gameTitle="Cyber Defense"
      gameCategory="Defend your base with cyber towers!"
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
          className="border-2 border-neon-green rounded-lg cursor-crosshair max-w-full h-auto"
          style={{ background: 'radial-gradient(circle, #001d3d, #000814)' }}
        />
        
        {isPlaying && (
          <div className="flex gap-2 flex-wrap justify-center">
            {Object.entries(towerTypes).map(([type, config]) => (
              <button
                key={type}
                onClick={() => setSelectedTower(selectedTower === type ? null : type)}
                disabled={credits < config.cost}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedTower === type 
                    ? 'border-neon-green bg-neon-green/20' 
                    : 'border-gray-600 hover:border-neon-green/50'
                } ${credits < config.cost ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ borderColor: config.color }}
              >
                <div className="text-sm font-bold" style={{ color: config.color }}>
                  {type.toUpperCase()}
                </div>
                <div className="text-xs text-gray-400">
                  ${config.cost} | DMG: {config.damage}
                </div>
              </button>
            ))}
          </div>
        )}
        
        <div className="text-center text-sm text-gray-400 max-w-md">
          Click to place towers along the path to defend against waves of cyber threats. 
          Earn credits by destroying enemies to buy more powerful towers.
        </div>
      </div>
    </GameLayout>
  );
}
