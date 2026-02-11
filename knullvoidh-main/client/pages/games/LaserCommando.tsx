import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';
import { 
  getSafeCanvas2DContext, 
  createSafeAnimationManager, 
  createSafeKeyManager,
  checkCollision,
  clamp,
  distance,
  gameManager
} from '@/utils/universalGameFix';

interface Position {
  x: number;
  y: number;
}

interface Commando extends Position {
  health: number;
  energy: number;
  facing: number; // angle in radians
  weaponType: 'laser' | 'plasma' | 'pulse';
  ammo: number;
}

interface Enemy extends Position {
  health: number;
  type: 'soldier' | 'tank' | 'robot';
  facing: number;
  speed: number;
  lastShot: number;
  size: number;
  color: string;
  patrolPath: Position[];
  patrolIndex: number;
}

interface Laser extends Position {
  vx: number;
  vy: number;
  type: 'laser' | 'plasma' | 'pulse' | 'enemy';
  damage: number;
  isPlayerShot: boolean;
  life: number;
  color: string;
}

interface Explosion extends Position {
  size: number;
  life: number;
  maxLife: number;
  color: string;
}

const LaserCommando: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<ReturnType<typeof createSafeAnimationManager> | null>(null);
  const keyHandlerRef = useRef<ReturnType<typeof createSafeKeyManager> | null>(null);

  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver' | 'levelComplete'>('menu');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [mousePos, setMousePos] = useState<Position>({ x: 400, y: 300 });
  const [isMousePressed, setIsMousePressed] = useState(false);
  
  const [commando, setCommando] = useState<Commando>({
    x: 400,
    y: 300,
    health: 100,
    energy: 100,
    facing: 0,
    weaponType: 'laser',
    ammo: 100
  });

  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [lasers, setLasers] = useState<Laser[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [walls, setWalls] = useState<Array<{x: number, y: number, width: number, height: number}>>([]);

  const gameId = 'laser-commando';
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const MOVE_SPEED = 3;
  const LASER_SPEED = 12;

  const createExplosion = useCallback((x: number, y: number, size: number = 30, color: string = '#ff4400') => {
    setExplosions(prev => [...prev, {
      x, y, size, life: 30, maxLife: 30, color
    }]);
  }, []);

  const spawnEnemies = useCallback(() => {
    const newEnemies: Enemy[] = [];
    const enemyCount = 3 + level * 2;
    
    for (let i = 0; i < enemyCount; i++) {
      const type: Enemy['type'] = Math.random() < 0.6 ? 'soldier' : Math.random() < 0.8 ? 'robot' : 'tank';
      const enemyData = {
        soldier: { health: 30, speed: 1.5, size: 15, color: '#00ff00' },
        robot: { health: 50, speed: 1, size: 20, color: '#ffff00' },
        tank: { health: 100, speed: 0.5, size: 30, color: '#ff0000' }
      };
      
      // Create patrol path
      const patrolPath: Position[] = [];
      const startX = 100 + Math.random() * 600;
      const startY = 100 + Math.random() * 400;
      
      for (let j = 0; j < 4; j++) {
        patrolPath.push({
          x: startX + (Math.random() - 0.5) * 200,
          y: startY + (Math.random() - 0.5) * 200
        });
      }
      
      newEnemies.push({
        x: patrolPath[0].x,
        y: patrolPath[0].y,
        health: enemyData[type].health + level * 10,
        type,
        facing: Math.random() * Math.PI * 2,
        speed: enemyData[type].speed,
        lastShot: 0,
        size: enemyData[type].size,
        color: enemyData[type].color,
        patrolPath,
        patrolIndex: 0
      });
    }
    
    setEnemies(newEnemies);
  }, [level]);

  const spawnWalls = useCallback(() => {
    const newWalls = [
      { x: 150, y: 100, width: 20, height: 100 },
      { x: 300, y: 200, width: 100, height: 20 },
      { x: 500, y: 150, width: 20, height: 150 },
      { x: 650, y: 350, width: 80, height: 20 },
      { x: 200, y: 450, width: 150, height: 20 }
    ];
    setWalls(newWalls);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    
    setMousePos({ x, y });
    
    // Update commando facing
    setCommando(prev => ({
      ...prev,
      facing: Math.atan2(y - prev.y, x - prev.x)
    }));
  }, []);

  const handleMouseDown = useCallback(() => {
    setIsMousePressed(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsMousePressed(false);
  }, []);

  const fireLaser = useCallback(() => {
    if (commando.ammo <= 0 || commando.energy < 10) return;
    
    const laserData = {
      laser: { damage: 25, speed: LASER_SPEED, color: '#ff0099', energyCost: 10 },
      plasma: { damage: 40, speed: LASER_SPEED * 0.8, color: '#00ff99', energyCost: 20 },
      pulse: { damage: 15, speed: LASER_SPEED * 1.2, color: '#9900ff', energyCost: 5 }
    };
    
    const weapon = laserData[commando.weaponType];
    
    setLasers(prev => [...prev, {
      x: commando.x + Math.cos(commando.facing) * 25,
      y: commando.y + Math.sin(commando.facing) * 25,
      vx: Math.cos(commando.facing) * weapon.speed,
      vy: Math.sin(commando.facing) * weapon.speed,
      type: commando.weaponType,
      damage: weapon.damage,
      isPlayerShot: true,
      life: 60,
      color: weapon.color
    }]);
    
    setCommando(prev => ({
      ...prev,
      ammo: prev.ammo - 1,
      energy: Math.max(0, prev.energy - weapon.energyCost)
    }));
  }, [commando.ammo, commando.energy, commando.weaponType, commando.facing, commando.x, commando.y]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getSafeCanvas2DContext(canvas);
    if (!ctx) return;

    // Clear with military base background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1a2a1a');
    gradient.addColorStop(0.5, '#2a3a2a');
    gradient.addColorStop(1, '#1a2a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid pattern
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    if (gameState === 'playing') {
      const keyHandler = keyHandlerRef.current;

      // Update commando
      setCommando(prev => {
        const newCommando = { ...prev };
        let dx = 0, dy = 0;
        
        if (keyHandler) {
          // Movement
          if (keyHandler.isPressed('w') || keyHandler.isPressed('arrowup')) dy = -MOVE_SPEED;
          if (keyHandler.isPressed('s') || keyHandler.isPressed('arrowdown')) dy = MOVE_SPEED;
          if (keyHandler.isPressed('a') || keyHandler.isPressed('arrowleft')) dx = -MOVE_SPEED;
          if (keyHandler.isPressed('d') || keyHandler.isPressed('arrowright')) dx = MOVE_SPEED;
          
          // Weapon switching
          if (keyHandler.isPressed('1')) newCommando.weaponType = 'laser';
          if (keyHandler.isPressed('2')) newCommando.weaponType = 'plasma';
          if (keyHandler.isPressed('3')) newCommando.weaponType = 'pulse';
        }

        // Check wall collisions before moving
        const newX = newCommando.x + dx;
        const newY = newCommando.y + dy;
        
        let canMoveX = true, canMoveY = true;
        
        walls.forEach(wall => {
          if (newX > wall.x - 20 && newX < wall.x + wall.width + 20 &&
              newCommando.y > wall.y - 20 && newCommando.y < wall.y + wall.height + 20) {
            canMoveX = false;
          }
          if (newCommando.x > wall.x - 20 && newCommando.x < wall.x + wall.width + 20 &&
              newY > wall.y - 20 && newY < wall.y + wall.height + 20) {
            canMoveY = false;
          }
        });
        
        if (canMoveX) newCommando.x = clamp(newX, 20, CANVAS_WIDTH - 20);
        if (canMoveY) newCommando.y = clamp(newY, 20, CANVAS_HEIGHT - 20);

        // Regenerate energy and ammo
        newCommando.energy = Math.min(100, newCommando.energy + 0.3);
        if (newCommando.ammo < 100 && Math.random() < 0.02) {
          newCommando.ammo = Math.min(100, newCommando.ammo + 5);
        }

        return newCommando;
      });

      // Auto-fire when mouse pressed
      if (isMousePressed && Math.random() < 0.3) {
        fireLaser();
      }

      // Update enemies
      setEnemies(prev => prev.map(enemy => {
        const newEnemy = { ...enemy };
        newEnemy.lastShot++;
        
        // AI movement - patrol or chase
        const distToPlayer = distance(enemy.x, enemy.y, commando.x, commando.y);
        
        if (distToPlayer < 150) {
          // Chase player
          const angleToPlayer = Math.atan2(commando.y - enemy.y, commando.x - enemy.x);
          newEnemy.x += Math.cos(angleToPlayer) * enemy.speed;
          newEnemy.y += Math.sin(angleToPlayer) * enemy.speed;
          newEnemy.facing = angleToPlayer;
          
          // Shoot at player
          if (newEnemy.lastShot > (enemy.type === 'tank' ? 90 : 60)) {
            newEnemy.lastShot = 0;
            
            setLasers(prev => [...prev, {
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(angleToPlayer) * 6,
              vy: Math.sin(angleToPlayer) * 6,
              type: 'enemy',
              damage: enemy.type === 'tank' ? 30 : 20,
              isPlayerShot: false,
              life: 50,
              color: '#ff4400'
            }]);
          }
        } else {
          // Patrol
          const target = enemy.patrolPath[enemy.patrolIndex];
          const distToTarget = distance(enemy.x, enemy.y, target.x, target.y);
          
          if (distToTarget < 20) {
            newEnemy.patrolIndex = (enemy.patrolIndex + 1) % enemy.patrolPath.length;
          } else {
            const angleToTarget = Math.atan2(target.y - enemy.y, target.x - enemy.x);
            newEnemy.x += Math.cos(angleToTarget) * enemy.speed * 0.5;
            newEnemy.y += Math.sin(angleToTarget) * enemy.speed * 0.5;
            newEnemy.facing = angleToTarget;
          }
        }

        // Keep enemies in bounds
        newEnemy.x = clamp(newEnemy.x, 20, CANVAS_WIDTH - 20);
        newEnemy.y = clamp(newEnemy.y, 20, CANVAS_HEIGHT - 20);

        return newEnemy;
      }));

      // Update lasers
      setLasers(prev => prev
        .map(laser => ({
          ...laser,
          x: laser.x + laser.vx,
          y: laser.y + laser.vy,
          life: laser.life - 1
        }))
        .filter(laser => {
          // Check wall collisions
          let hitWall = false;
          walls.forEach(wall => {
            if (laser.x > wall.x && laser.x < wall.x + wall.width &&
                laser.y > wall.y && laser.y < wall.y + wall.height) {
              hitWall = true;
            }
          });
          
          return laser.life > 0 && !hitWall &&
                 laser.x > 0 && laser.x < CANVAS_WIDTH &&
                 laser.y > 0 && laser.y < CANVAS_HEIGHT;
        })
      );

      // Update explosions
      setExplosions(prev => prev
        .map(explosion => ({
          ...explosion,
          life: explosion.life - 1,
          size: explosion.size + 2
        }))
        .filter(explosion => explosion.life > 0)
      );

      // Check laser collisions
      setLasers(prevLasers => {
        const remainingLasers: Laser[] = [];
        
        prevLasers.forEach(laser => {
          let hit = false;
          
          if (laser.isPlayerShot) {
            // Check enemy hits
            setEnemies(prevEnemies => prevEnemies.map(enemy => {
              if (!hit && distance(laser.x, laser.y, enemy.x, enemy.y) < enemy.size) {
                hit = true;
                const newHealth = enemy.health - laser.damage;
                
                if (newHealth <= 0) {
                  setScore(prev => prev + (enemy.type === 'tank' ? 300 : enemy.type === 'robot' ? 200 : 100));
                  createExplosion(enemy.x, enemy.y, enemy.size + 20, enemy.color);
                  return { ...enemy, health: 0 }; // Mark for removal
                }
                
                createExplosion(enemy.x, enemy.y, 20, '#ffaa00');
                return { ...enemy, health: newHealth };
              }
              return enemy;
            }));
          } else {
            // Check commando hit
            if (distance(laser.x, laser.y, commando.x, commando.y) < 20) {
              hit = true;
              setCommando(prev => ({ ...prev, health: prev.health - laser.damage }));
              createExplosion(commando.x, commando.y, 25, '#ff0044');
            }
          }
          
          if (!hit) {
            remainingLasers.push(laser);
          }
        });
        
        return remainingLasers;
      });

      // Remove dead enemies
      setEnemies(prev => prev.filter(enemy => enemy.health > 0));

      // Check win/lose conditions
      if (commando.health <= 0) {
        setGameState('gameOver');
      } else if (enemies.length === 0) {
        setGameState('levelComplete');
        setLevel(prev => prev + 1);
        setScore(prev => prev + 1000);
      }
    }

    // Draw walls
    ctx.fillStyle = '#666666';
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 2;
    walls.forEach(wall => {
      ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
      ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
    });

    // Draw explosions
    explosions.forEach(explosion => {
      const alpha = explosion.life / explosion.maxLife;
      ctx.globalAlpha = alpha;
      
      const gradient = ctx.createRadialGradient(
        explosion.x, explosion.y, 0,
        explosion.x, explosion.y, explosion.size
      );
      gradient.addColorStop(0, explosion.color);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(explosion.x, explosion.y, explosion.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw commando
    ctx.save();
    ctx.translate(commando.x, commando.y);
    ctx.rotate(commando.facing);
    
    ctx.fillStyle = '#ff0099';
    ctx.shadowColor = '#ff0099';
    ctx.shadowBlur = 10;
    ctx.fillRect(-12, -8, 24, 16);
    
    // Weapon
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(12, -2, 15, 4);
    
    ctx.restore();
    ctx.shadowBlur = 0;

    // Draw enemies
    enemies.forEach(enemy => {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(enemy.facing);
      
      ctx.fillStyle = enemy.color;
      ctx.shadowColor = enemy.color;
      ctx.shadowBlur = 8;
      
      if (enemy.type === 'tank') {
        ctx.fillRect(-enemy.size/2, -enemy.size/2, enemy.size, enemy.size);
        // Tank barrel
        ctx.fillStyle = '#444444';
        ctx.fillRect(enemy.size/2, -3, 20, 6);
      } else if (enemy.type === 'robot') {
        ctx.beginPath();
        ctx.arc(0, 0, enemy.size/2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-enemy.size/2, -enemy.size/2, enemy.size, enemy.size);
      }
      
      ctx.restore();
      
      // Health bar for damaged enemies
      const maxHealth = (enemy.type === 'tank' ? 100 : enemy.type === 'robot' ? 50 : 30) + (level - 1) * 10;
      if (enemy.health < maxHealth) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(enemy.x - enemy.size/2, enemy.y - enemy.size/2 - 10, enemy.size, 3);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(enemy.x - enemy.size/2, enemy.y - enemy.size/2 - 10, 
                    (enemy.health / maxHealth) * enemy.size, 3);
      }
    });
    ctx.shadowBlur = 0;

    // Draw lasers
    lasers.forEach(laser => {
      ctx.strokeStyle = laser.color;
      ctx.shadowColor = laser.color;
      ctx.shadowBlur = 15;
      ctx.lineWidth = 3;
      
      ctx.beginPath();
      ctx.moveTo(laser.x - laser.vx * 0.3, laser.y - laser.vy * 0.3);
      ctx.lineTo(laser.x, laser.y);
      ctx.stroke();
      
      // Laser core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(laser.x, laser.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Draw crosshair
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mousePos.x - 15, mousePos.y);
    ctx.lineTo(mousePos.x + 15, mousePos.y);
    ctx.moveTo(mousePos.x, mousePos.y - 15);
    ctx.lineTo(mousePos.x, mousePos.y + 15);
    ctx.stroke();

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Health: ${commando.health}`, 10, 25);
    ctx.fillText(`Energy: ${Math.floor(commando.energy)}`, 10, 45);
    ctx.fillText(`Ammo: ${commando.ammo}`, 10, 65);
    ctx.fillText(`Score: ${score}`, 10, 85);
    ctx.fillText(`Level: ${level}`, 10, 105);
    ctx.fillText(`Weapon: ${commando.weaponType.toUpperCase()}`, 10, 125);

    // Health bar
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(200, 10, 200, 15);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(200, 10, (commando.health / 100) * 200, 15);

    // Energy bar
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(200, 30, 200, 10);
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(200, 30, (commando.energy / 100) * 200, 10);

    // Instructions
    ctx.fillStyle = '#cccccc';
    ctx.font = '12px monospace';
    ctx.fillText('1/2/3: Switch Weapons', CANVAS_WIDTH - 180, 25);

    // Game state overlays
    if (gameState === 'menu') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LASER COMMANDO', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.font = '24px monospace';
      ctx.fillText('Click to start mission', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      
      ctx.font = '16px monospace';
      ctx.fillText('WASD: Move | Mouse: Aim & Fire | 1/2/3: Weapons', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    } else if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#ff0000';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('MISSION FAILED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.font = '24px monospace';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.fillText('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    } else if (gameState === 'levelComplete') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#00ff00';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LEVEL COMPLETE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.font = '24px monospace';
      ctx.fillText('Click for next level', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }

    ctx.textAlign = 'left';
  }, [gameState, commando, enemies, lasers, explosions, walls, mousePos, isMousePressed, score, level, createExplosion, fireLaser]);

  // Initialize game
  useEffect(() => {
    gameManager.registerGame(gameId);
    spawnWalls();
    
    return () => {
      gameManager.unregisterGame(gameId);
      if (gameLoopRef.current) {
        gameLoopRef.current.stop();
      }
      if (keyHandlerRef.current) {
        keyHandlerRef.current.cleanup();
      }
    };
  }, [spawnWalls]);

  // Handle special keys and clicks
  useEffect(() => {
    const handleSpecialKeys = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      if (key === 'r' && gameState === 'gameOver') {
        setGameState('menu');
        setScore(0);
        setLevel(1);
        setCommando({
          x: 400, y: 300, health: 100, energy: 100,
          facing: 0, weaponType: 'laser', ammo: 100
        });
        setEnemies([]);
        setLasers([]);
        setExplosions([]);
      }
    };

    const handleClick = () => {
      if (gameState === 'menu') {
        setGameState('playing');
        spawnEnemies();
      } else if (gameState === 'levelComplete') {
        setGameState('playing');
        spawnEnemies();
      }
    };

    window.addEventListener('keydown', handleSpecialKeys);
    window.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('keydown', handleSpecialKeys);
      window.removeEventListener('click', handleClick);
    };
  }, [gameState, spawnEnemies]);

  // Initialize game loop and input
  useEffect(() => {
    const keyHandler = createSafeKeyManager();
    keyHandlerRef.current = keyHandler;

    const animationManager = createSafeAnimationManager();
    gameLoopRef.current = animationManager;
    animationManager.start(gameLoop);

    return () => {
      animationManager.stop();
      keyHandler.cleanup();
    };
  }, [gameLoop]);

  return (
    <GameLayout 
      gameTitle="Laser Commando" 
      gameCategory="Top-down action shooter with laser weapons"
      score={gameState === 'playing' ? score : undefined}
    >
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-pink-500 bg-black rounded-lg shadow-2xl cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        />
        <div className="text-center space-y-2">
          <p className="text-gray-300">WASD: Move | Mouse: Aim & Fire | 1/2/3: Switch Weapons</p>
          <p className="text-gray-400">Elite commando on a mission to eliminate all hostiles!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default LaserCommando;
