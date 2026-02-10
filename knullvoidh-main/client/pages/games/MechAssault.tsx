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

interface Mech extends Position {
  health: number;
  armor: number;
  facing: number;
  weaponType: 'cannon' | 'missiles' | 'laser';
  ammo: { cannon: number; missiles: number; laser: number };
  heat: number;
  speed: number;
  size: number;
}

interface EnemyMech extends Position {
  health: number;
  armor: number;
  facing: number;
  type: 'light' | 'medium' | 'heavy';
  weaponType: 'cannon' | 'missiles' | 'laser';
  lastShot: number;
  ai: 'aggressive' | 'defensive' | 'patrol';
  targetX: number;
  targetY: number;
  size: number;
  color: string;
}

interface Projectile extends Position {
  vx: number;
  vy: number;
  type: 'cannon' | 'missile' | 'laser';
  damage: number;
  isPlayerProjectile: boolean;
  life: number;
  size: number;
  rotation?: number;
}

interface Building extends Position {
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  type: 'skyscraper' | 'factory' | 'house';
  destroyed: boolean;
}

interface Explosion extends Position {
  size: number;
  life: number;
  maxLife: number;
  type: 'small' | 'medium' | 'large';
}

const MechAssault: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<createSafeAnimationManager | null>(null);
  const keyHandlerRef = useRef<createSafeKeyManager | null>(null);

  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver' | 'missionComplete'>('menu');
  const [score, setScore] = useState(0);
  const [mission, setMission] = useState(1);
  const [mousePos, setMousePos] = useState<Position>({ x: 400, y: 300 });
  
  const [playerMech, setPlayerMech] = useState<Mech>({
    x: 100,
    y: 300,
    health: 100,
    armor: 100,
    facing: 0,
    weaponType: 'cannon',
    ammo: { cannon: 50, missiles: 20, laser: 100 },
    heat: 0,
    speed: 2,
    size: 40
  });

  const [enemyMechs, setEnemyMechs] = useState<EnemyMech[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);

  const gameId = 'mech-assault';
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  const createExplosion = useCallback((x: number, y: number, type: Explosion['type'] = 'medium') => {
    const explosionData = {
      small: { size: 20, life: 20 },
      medium: { size: 40, life: 30 },
      large: { size: 80, life: 40 }
    };
    
    setExplosions(prev => [...prev, {
      x, y,
      size: explosionData[type].size,
      life: explosionData[type].life,
      maxLife: explosionData[type].life,
      type
    }]);
  }, []);

  const spawnBuildings = useCallback(() => {
    const newBuildings: Building[] = [];
    
    // Create city layout
    for (let i = 0; i < 15; i++) {
      const type: Building['type'] = Math.random() < 0.4 ? 'skyscraper' : Math.random() < 0.7 ? 'factory' : 'house';
      const buildingData = {
        skyscraper: { width: 40, height: 120, health: 200 },
        factory: { width: 80, height: 60, health: 150 },
        house: { width: 30, height: 40, health: 80 }
      };
      
      newBuildings.push({
        x: 200 + (i % 5) * 120 + Math.random() * 40,
        y: 100 + Math.floor(i / 5) * 150 + Math.random() * 50,
        width: buildingData[type].width,
        height: buildingData[type].height,
        health: buildingData[type].health,
        maxHealth: buildingData[type].health,
        type,
        destroyed: false
      });
    }
    
    setBuildings(newBuildings);
  }, []);

  const spawnEnemyMechs = useCallback(() => {
    const newEnemyMechs: EnemyMech[] = [];
    const enemyCount = 2 + mission;
    
    for (let i = 0; i < enemyCount; i++) {
      const type: EnemyMech['type'] = Math.random() < 0.3 ? 'light' : Math.random() < 0.7 ? 'medium' : 'heavy';
      const mechData = {
        light: { health: 60, size: 30, speed: 3, color: '#00ff00' },
        medium: { health: 100, size: 35, speed: 2, color: '#ffff00' },
        heavy: { health: 150, size: 45, speed: 1, color: '#ff0000' }
      };
      
      const aiTypes: EnemyMech['ai'][] = ['aggressive', 'defensive', 'patrol'];
      const weaponTypes: EnemyMech['weaponType'][] = ['cannon', 'missiles', 'laser'];
      
      newEnemyMechs.push({
        x: 500 + Math.random() * 250,
        y: 100 + Math.random() * 400,
        health: mechData[type].health + mission * 20,
        armor: 50 + mission * 10,
        facing: Math.random() * Math.PI * 2,
        type,
        weaponType: weaponTypes[Math.floor(Math.random() * weaponTypes.length)],
        lastShot: 0,
        ai: aiTypes[Math.floor(Math.random() * aiTypes.length)],
        targetX: 0,
        targetY: 0,
        size: mechData[type].size,
        color: mechData[type].color
      });
    }
    
    setEnemyMechs(newEnemyMechs);
  }, [mission]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    
    setMousePos({ x, y });
    
    // Update mech facing
    setPlayerMech(prev => ({
      ...prev,
      facing: Math.atan2(y - prev.y, x - prev.x)
    }));
  }, []);

  const fireWeapon = useCallback(() => {
    if (playerMech.heat > 80) return; // Overheated
    
    const weaponData = {
      cannon: { damage: 40, speed: 8, ammoUse: 1, heatGen: 15, size: 8 },
      missiles: { damage: 60, speed: 6, ammoUse: 1, heatGen: 25, size: 12 },
      laser: { damage: 25, speed: 12, ammoUse: 5, heatGen: 10, size: 4 }
    };
    
    const weapon = weaponData[playerMech.weaponType];
    
    if (playerMech.ammo[playerMech.weaponType] >= weapon.ammoUse) {
      setProjectiles(prev => [...prev, {
        x: playerMech.x + Math.cos(playerMech.facing) * 50,
        y: playerMech.y + Math.sin(playerMech.facing) * 50,
        vx: Math.cos(playerMech.facing) * weapon.speed,
        vy: Math.sin(playerMech.facing) * weapon.speed,
        type: playerMech.weaponType,
        damage: weapon.damage,
        isPlayerProjectile: true,
        life: 100,
        size: weapon.size,
        rotation: playerMech.weaponType === 'missile' ? 0 : undefined
      }]);
      
      setPlayerMech(prev => ({
        ...prev,
        ammo: {
          ...prev.ammo,
          [prev.weaponType]: prev.ammo[prev.weaponType] - weapon.ammoUse
        },
        heat: Math.min(100, prev.heat + weapon.heatGen)
      }));
      
      createExplosion(
        playerMech.x + Math.cos(playerMech.facing) * 35,
        playerMech.y + Math.sin(playerMech.facing) * 35,
        'small'
      );
    }
  }, [playerMech, createExplosion]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getSafeCanvas2DContext(canvas);
    if (!ctx) return;

    // Clear with destroyed city background
    ctx.fillStyle = '#1a1a0f';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw smoke/haze effect
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `rgba(60, 60, 30, ${0.1 + Math.sin(Date.now() * 0.001 + i) * 0.05})`;
      ctx.fillRect(i * 40, 0, 40, CANVAS_HEIGHT);
    }

    if (gameState === 'playing') {
      const keyHandler = keyHandlerRef.current;

      // Update player mech
      setPlayerMech(prev => {
        const newMech = { ...prev };
        let dx = 0, dy = 0;
        
        if (keyHandler) {
          // Movement
          if (keyHandler.isPressed('w') || keyHandler.isPressed('arrowup')) {
            dy = -newMech.speed;
          }
          if (keyHandler.isPressed('s') || keyHandler.isPressed('arrowdown')) {
            dy = newMech.speed;
          }
          if (keyHandler.isPressed('a') || keyHandler.isPressed('arrowleft')) {
            dx = -newMech.speed;
          }
          if (keyHandler.isPressed('d') || keyHandler.isPressed('arrowright')) {
            dx = newMech.speed;
          }
          
          // Weapon switching
          if (keyHandler.isPressed('1')) newMech.weaponType = 'cannon';
          if (keyHandler.isPressed('2')) newMech.weaponType = 'missiles';
          if (keyHandler.isPressed('3')) newMech.weaponType = 'laser';
          
          // Firing
          if (keyHandler.isPressed(' ')) {
            fireWeapon();
          }
        }

        // Apply movement with building collision
        const newX = newMech.x + dx;
        const newY = newMech.y + dy;
        
        let canMove = true;
        buildings.forEach(building => {
          if (!building.destroyed &&
              newX > building.x - newMech.size/2 && newX < building.x + building.width + newMech.size/2 &&
              newY > building.y - newMech.size/2 && newY < building.y + building.height + newMech.size/2) {
            canMove = false;
          }
        });
        
        if (canMove) {
          newMech.x = clamp(newX, newMech.size/2, CANVAS_WIDTH - newMech.size/2);
          newMech.y = clamp(newY, newMech.size/2, CANVAS_HEIGHT - newMech.size/2);
        }

        // Cool down heat
        newMech.heat = Math.max(0, newMech.heat - 0.5);

        return newMech;
      });

      // Update enemy mechs
      setEnemyMechs(prev => prev.map(enemy => {
        const newEnemy = { ...enemy };
        newEnemy.lastShot++;
        
        const distToPlayer = distance(enemy.x, enemy.y, playerMech.x, playerMech.y);
        
        // AI behavior
        if (enemy.ai === 'aggressive') {
          // Move towards player
          const angleToPlayer = Math.atan2(playerMech.y - enemy.y, playerMech.x - enemy.x);
          newEnemy.facing = angleToPlayer;
          
          if (distToPlayer > 150) {
            newEnemy.x += Math.cos(angleToPlayer) * (enemy.type === 'heavy' ? 0.8 : enemy.type === 'medium' ? 1.2 : 1.8);
            newEnemy.y += Math.sin(angleToPlayer) * (enemy.type === 'heavy' ? 0.8 : enemy.type === 'medium' ? 1.2 : 1.8);
          }
        } else if (enemy.ai === 'defensive') {
          // Stay at distance and circle
          if (distToPlayer < 200) {
            const angleAway = Math.atan2(enemy.y - playerMech.y, enemy.x - playerMech.x);
            newEnemy.x += Math.cos(angleAway) * 1;
            newEnemy.y += Math.sin(angleAway) * 1;
          }
          
          // Circle around player
          const circleAngle = Math.atan2(playerMech.y - enemy.y, playerMech.x - enemy.x) + Math.PI / 2;
          newEnemy.x += Math.cos(circleAngle) * 0.5;
          newEnemy.y += Math.sin(circleAngle) * 0.5;
          newEnemy.facing = Math.atan2(playerMech.y - enemy.y, playerMech.x - enemy.x);
        }
        
        // Keep in bounds
        newEnemy.x = clamp(newEnemy.x, enemy.size/2, CANVAS_WIDTH - enemy.size/2);
        newEnemy.y = clamp(newEnemy.y, enemy.size/2, CANVAS_HEIGHT - enemy.size/2);
        
        // Enemy shooting
        if (distToPlayer < 300 && newEnemy.lastShot > (enemy.type === 'heavy' ? 120 : 80)) {
          newEnemy.lastShot = 0;
          
          const shotSpeed = enemy.weaponType === 'laser' ? 10 : enemy.weaponType === 'missiles' ? 5 : 7;
          const damage = enemy.weaponType === 'missiles' ? 50 : enemy.weaponType === 'cannon' ? 35 : 20;
          
          setProjectiles(prev => [...prev, {
            x: enemy.x + Math.cos(enemy.facing) * 30,
            y: enemy.y + Math.sin(enemy.facing) * 30,
            vx: Math.cos(enemy.facing) * shotSpeed,
            vy: Math.sin(enemy.facing) * shotSpeed,
            type: enemy.weaponType,
            damage,
            isPlayerProjectile: false,
            life: 80,
            size: enemy.weaponType === 'missiles' ? 10 : 6
          }]);
        }

        return newEnemy;
      }));

      // Update projectiles
      setProjectiles(prev => prev
        .map(projectile => ({
          ...projectile,
          x: projectile.x + projectile.vx,
          y: projectile.y + projectile.vy,
          life: projectile.life - 1,
          rotation: projectile.rotation !== undefined ? projectile.rotation + 0.2 : undefined
        }))
        .filter(projectile => {
          // Check building collisions
          let hitBuilding = false;
          buildings.forEach(building => {
            if (!building.destroyed &&
                projectile.x > building.x && projectile.x < building.x + building.width &&
                projectile.y > building.y && projectile.y < building.y + building.height) {
              hitBuilding = true;
              
              // Damage building
              setBuildings(prev => prev.map(b => {
                if (b === building) {
                  const newHealth = b.health - projectile.damage;
                  if (newHealth <= 0) {
                    createExplosion(b.x + b.width/2, b.y + b.height/2, 'large');
                    return { ...b, health: 0, destroyed: true };
                  }
                  return { ...b, health: newHealth };
                }
                return b;
              }));
            }
          });
          
          return projectile.life > 0 && !hitBuilding &&
                 projectile.x > 0 && projectile.x < CANVAS_WIDTH &&
                 projectile.y > 0 && projectile.y < CANVAS_HEIGHT;
        })
      );

      // Update explosions
      setExplosions(prev => prev
        .map(explosion => ({
          ...explosion,
          life: explosion.life - 1,
          size: explosion.size + (explosion.type === 'large' ? 3 : explosion.type === 'medium' ? 2 : 1)
        }))
        .filter(explosion => explosion.life > 0)
      );

      // Check projectile collisions
      setProjectiles(prevProjectiles => {
        const remainingProjectiles: Projectile[] = [];
        
        prevProjectiles.forEach(projectile => {
          let hit = false;
          
          if (projectile.isPlayerProjectile) {
            // Check enemy hits
            setEnemyMechs(prevEnemies => prevEnemies.map(enemy => {
              if (!hit && distance(projectile.x, projectile.y, enemy.x, enemy.y) < enemy.size) {
                hit = true;
                const newHealth = enemy.health - projectile.damage;
                
                if (newHealth <= 0) {
                  setScore(prev => prev + (enemy.type === 'heavy' ? 500 : enemy.type === 'medium' ? 300 : 200));
                  createExplosion(enemy.x, enemy.y, 'large');
                  return { ...enemy, health: 0 }; // Mark for removal
                }
                
                createExplosion(enemy.x, enemy.y, 'medium');
                return { ...enemy, health: newHealth };
              }
              return enemy;
            }));
          } else {
            // Check player hit
            if (distance(projectile.x, projectile.y, playerMech.x, playerMech.y) < playerMech.size) {
              hit = true;
              setPlayerMech(prev => ({ 
                ...prev, 
                health: prev.health - Math.max(1, projectile.damage - prev.armor / 5)
              }));
              createExplosion(playerMech.x, playerMech.y, 'medium');
            }
          }
          
          if (!hit) {
            remainingProjectiles.push(projectile);
          }
        });
        
        return remainingProjectiles;
      });

      // Remove destroyed enemies
      setEnemyMechs(prev => prev.filter(enemy => enemy.health > 0));

      // Check win/lose conditions
      if (playerMech.health <= 0) {
        setGameState('gameOver');
      } else if (enemyMechs.length === 0) {
        setGameState('missionComplete');
        setMission(prev => prev + 1);
        setScore(prev => prev + 2000);
      }
    }

    // Draw buildings
    buildings.forEach(building => {
      if (building.destroyed) {
        // Draw rubble
        ctx.fillStyle = '#444444';
        ctx.fillRect(building.x, building.y + building.height * 0.8, building.width, building.height * 0.2);
      } else {
        // Draw intact building
        ctx.fillStyle = building.type === 'skyscraper' ? '#666666' : 
                        building.type === 'factory' ? '#555555' : '#777777';
        ctx.fillRect(building.x, building.y, building.width, building.height);
        
        // Building windows/details
        ctx.fillStyle = '#ffff88';
        if (building.type === 'skyscraper') {
          for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 8; j++) {
              if (Math.random() > 0.3) {
                ctx.fillRect(building.x + 5 + i * 8, building.y + 10 + j * 12, 4, 6);
              }
            }
          }
        }
        
        // Damage indicator
        if (building.health < building.maxHealth) {
          const damageRatio = 1 - (building.health / building.maxHealth);
          ctx.fillStyle = `rgba(255, 0, 0, ${damageRatio * 0.5})`;
          ctx.fillRect(building.x, building.y, building.width, building.height);
        }
      }
    });

    // Draw explosions
    explosions.forEach(explosion => {
      const alpha = explosion.life / explosion.maxLife;
      ctx.globalAlpha = alpha;
      
      const gradient = ctx.createRadialGradient(
        explosion.x, explosion.y, 0,
        explosion.x, explosion.y, explosion.size
      );
      gradient.addColorStop(0, '#ffff00');
      gradient.addColorStop(0.3, '#ff8800');
      gradient.addColorStop(0.6, '#ff4400');
      gradient.addColorStop(1, '#880000');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(explosion.x, explosion.y, explosion.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw player mech
    ctx.save();
    ctx.translate(playerMech.x, playerMech.y);
    ctx.rotate(playerMech.facing);
    
    // Mech body
    ctx.fillStyle = '#ff8000';
    ctx.shadowColor = '#ff8000';
    ctx.shadowBlur = 15;
    ctx.fillRect(-playerMech.size/2, -playerMech.size/2, playerMech.size, playerMech.size);
    
    // Weapon
    ctx.fillStyle = '#cccccc';
    const weaponLength = playerMech.weaponType === 'cannon' ? 35 : 
                        playerMech.weaponType === 'missiles' ? 25 : 30;
    ctx.fillRect(playerMech.size/2, -3, weaponLength, 6);
    
    // Heat indicator
    if (playerMech.heat > 50) {
      ctx.fillStyle = `rgba(255, 0, 0, ${(playerMech.heat - 50) / 50})`;
      ctx.fillRect(-playerMech.size/2, -playerMech.size/2, playerMech.size, playerMech.size);
    }
    
    ctx.restore();
    ctx.shadowBlur = 0;

    // Draw enemy mechs
    enemyMechs.forEach(enemy => {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(enemy.facing);
      
      ctx.fillStyle = enemy.color;
      ctx.shadowColor = enemy.color;
      ctx.shadowBlur = 10;
      
      if (enemy.type === 'heavy') {
        ctx.fillRect(-enemy.size/2, -enemy.size/2, enemy.size, enemy.size);
        // Heavy weapon
        ctx.fillStyle = '#666666';
        ctx.fillRect(enemy.size/2, -5, 40, 10);
      } else if (enemy.type === 'light') {
        // Light mech - triangular
        ctx.beginPath();
        ctx.moveTo(enemy.size/2, 0);
        ctx.lineTo(-enemy.size/2, -enemy.size/2);
        ctx.lineTo(-enemy.size/2, enemy.size/2);
        ctx.closePath();
        ctx.fill();
      } else {
        // Medium mech - circular
        ctx.beginPath();
        ctx.arc(0, 0, enemy.size/2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
      
      // Health bar
      if (enemy.health < (enemy.type === 'heavy' ? 150 : enemy.type === 'medium' ? 100 : 60) + (mission - 1) * 20) {
        const maxHealth = (enemy.type === 'heavy' ? 150 : enemy.type === 'medium' ? 100 : 60) + (mission - 1) * 20;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(enemy.x - enemy.size/2, enemy.y - enemy.size/2 - 15, enemy.size, 4);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(enemy.x - enemy.size/2, enemy.y - enemy.size/2 - 15, 
                    (enemy.health / maxHealth) * enemy.size, 4);
      }
    });
    ctx.shadowBlur = 0;

    // Draw projectiles
    projectiles.forEach(projectile => {
      ctx.save();
      ctx.translate(projectile.x, projectile.y);
      if (projectile.rotation !== undefined) {
        ctx.rotate(projectile.rotation);
      }
      
      if (projectile.type === 'laser') {
        ctx.strokeStyle = projectile.isPlayerProjectile ? '#ff0099' : '#ff4400';
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(10, 0);
        ctx.stroke();
      } else if (projectile.type === 'missile') {
        ctx.fillStyle = projectile.isPlayerProjectile ? '#ffff00' : '#ff8800';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;
        ctx.fillRect(-projectile.size/2, -3, projectile.size, 6);
        
        // Missile trail
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(-projectile.size, -2, projectile.size/2, 4);
      } else {
        // Cannon
        ctx.fillStyle = projectile.isPlayerProjectile ? '#ffffff' : '#ffaa00';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(0, 0, projectile.size/2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    });
    ctx.shadowBlur = 0;

    // Draw crosshair
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mousePos.x - 20, mousePos.y);
    ctx.lineTo(mousePos.x + 20, mousePos.y);
    ctx.moveTo(mousePos.x, mousePos.y - 20);
    ctx.lineTo(mousePos.x, mousePos.y + 20);
    ctx.stroke();

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Health: ${playerMech.health}`, 10, 25);
    ctx.fillText(`Armor: ${playerMech.armor}`, 10, 45);
    ctx.fillText(`Score: ${score}`, 10, 65);
    ctx.fillText(`Mission: ${mission}`, 10, 85);
    ctx.fillText(`Weapon: ${playerMech.weaponType.toUpperCase()}`, 10, 105);
    ctx.fillText(`Heat: ${Math.floor(playerMech.heat)}%`, 10, 125);

    // Ammo display
    ctx.fillText(`Cannon: ${playerMech.ammo.cannon}`, 200, 25);
    ctx.fillText(`Missiles: ${playerMech.ammo.missiles}`, 200, 45);
    ctx.fillText(`Laser: ${playerMech.ammo.laser}`, 200, 65);

    // Health bar
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(400, 10, 200, 15);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(400, 10, (playerMech.health / 100) * 200, 15);

    // Heat bar
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(400, 30, 200, 8);
    ctx.fillStyle = playerMech.heat > 80 ? '#ff0000' : '#ffff00';
    ctx.fillRect(400, 30, (playerMech.heat / 100) * 200, 8);

    // Instructions
    ctx.fillStyle = '#cccccc';
    ctx.font = '12px monospace';
    ctx.fillText('1/2/3: Switch Weapons | SPACE: Fire', CANVAS_WIDTH - 250, 25);

    // Game state overlays
    if (gameState === 'menu') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#ff8000';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('MECH ASSAULT', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.font = '24px monospace';
      ctx.fillText('Click to deploy', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      
      ctx.font = '16px monospace';
      ctx.fillText('WASD: Move | Mouse: Aim | SPACE: Fire', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    } else if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#ff0000';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('MECH DESTROYED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.font = '24px monospace';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.fillText('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    } else if (gameState === 'missionComplete') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#00ff00';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('MISSION COMPLETE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.font = '24px monospace';
      ctx.fillText('Click for next mission', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }

    ctx.textAlign = 'left';
  }, [gameState, playerMech, enemyMechs, projectiles, buildings, explosions, mousePos, score, mission, createExplosion, fireWeapon]);

  // Initialize game
  useEffect(() => {
    gameManager.registerGame(gameId);
    spawnBuildings();
    
    return () => {
      gameManager.unregisterGame(gameId);
      if (gameLoopRef.current) {
        gameLoopRef.current.stop();
      }
      if (keyHandlerRef.current) {
        keyHandlerRef.current.cleanup();
      }
    };
  }, [spawnBuildings]);

  // Handle special keys and clicks
  useEffect(() => {
    const handleSpecialKeys = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      if (key === 'r' && gameState === 'gameOver') {
        setGameState('menu');
        setScore(0);
        setMission(1);
        setPlayerMech({
          x: 100, y: 300, health: 100, armor: 100, facing: 0,
          weaponType: 'cannon', ammo: { cannon: 50, missiles: 20, laser: 100 },
          heat: 0, speed: 2, size: 40
        });
        setEnemyMechs([]);
        setProjectiles([]);
        setExplosions([]);
        spawnBuildings();
      }
    };

    const handleClick = () => {
      if (gameState === 'menu') {
        setGameState('playing');
        spawnEnemyMechs();
      } else if (gameState === 'missionComplete') {
        setGameState('playing');
        spawnEnemyMechs();
        spawnBuildings();
      }
    };

    window.addEventListener('keydown', handleSpecialKeys);
    window.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('keydown', handleSpecialKeys);
      window.removeEventListener('click', handleClick);
    };
  }, [gameState, spawnEnemyMechs, spawnBuildings]);

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
      gameTitle="Mech Assault" 
      gameCategory="Giant robot battles in destructible cities"
      score={gameState === 'playing' ? score : undefined}
    >
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-orange-500 bg-black rounded-lg shadow-2xl cursor-crosshair"
          onMouseMove={handleMouseMove}
        />
        <div className="text-center space-y-2">
          <p className="text-gray-300">WASD: Move | Mouse: Aim | SPACE: Fire | 1/2/3: Switch Weapons</p>
          <p className="text-gray-400">Pilot your giant mech and destroy enemy forces in the city!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default MechAssault;
