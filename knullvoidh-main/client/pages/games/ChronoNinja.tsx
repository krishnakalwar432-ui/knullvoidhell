import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  health: number;
  energy: number;
  facing: number;
  isInvisible: boolean;
  timeRewindCharges: number;
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  health: number;
  type: 'guard' | 'samurai' | 'archer' | 'demon';
  lastAttack: number;
  alertLevel: number;
  facing: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  type: 'shuriken' | 'arrow' | 'energy';
  isPlayerProjectile: boolean;
  life: number;
}

interface TimeGhost {
  x: number;
  y: number;
  life: number;
  alpha: number;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ChronoNinja = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef({ x: 0, y: 0, down: false });
  
  const [gameState, setGameState] = useState({
    player: { 
      x: 100, y: 400, vx: 0, vy: 0, health: 100, energy: 100,
      facing: 1, isInvisible: false, timeRewindCharges: 3
    } as Player,
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    timeGhosts: [] as TimeGhost[],
    platforms: [] as Platform[],
    playerHistory: [] as Array<{x: number, y: number, time: number}>,
    score: 0,
    wave: 1,
    gameOver: false,
    waveComplete: false,
    timeSlowed: false,
    timeSlowDuration: 0,
    shadowClones: [] as Array<{x: number, y: number, life: number}>
  });

  const createTimeGhost = (x: number, y: number) => {
    setGameState(prev => ({
      ...prev,
      timeGhosts: [...prev.timeGhosts, { x, y, life: 60, alpha: 0.8 }]
    }));
  };

  const activateTimeRewind = () => {
    setGameState(prev => {
      if (prev.player.timeRewindCharges <= 0) return prev;
      
      // Find position from 3 seconds ago
      const rewindTime = Date.now() - 3000;
      const rewindPosition = prev.playerHistory.find(pos => pos.time >= rewindTime);
      
      if (rewindPosition) {
        createTimeGhost(prev.player.x, prev.player.y);
        
        return {
          ...prev,
          player: {
            ...prev.player,
            x: rewindPosition.x,
            y: rewindPosition.y,
            timeRewindCharges: prev.player.timeRewindCharges - 1,
            health: Math.min(100, prev.player.health + 30) // Heal on rewind
          }
        };
      }
      
      return prev;
    });
  };

  const activateTimeSlowdown = () => {
    setGameState(prev => {
      if (prev.player.energy < 50) return prev;
      
      return {
        ...prev,
        timeSlowed: true,
        timeSlowDuration: 300, // 5 seconds at 60fps
        player: {
          ...prev.player,
          energy: prev.player.energy - 50
        }
      };
    });
  };

  const createShadowClone = () => {
    setGameState(prev => {
      if (prev.player.energy < 40) return prev;
      
      return {
        ...prev,
        shadowClones: [...prev.shadowClones, {
          x: prev.player.x,
          y: prev.player.y,
          life: 180 // 3 seconds
        }],
        player: {
          ...prev.player,
          energy: prev.player.energy - 40
        }
      };
    });
  };

  const spawnEnemies = useCallback((wave: number) => {
    const enemies: Enemy[] = [];
    const canvas = canvasRef.current;
    if (!canvas) return enemies;

    const baseCount = 3 + wave;
    
    for (let i = 0; i < baseCount; i++) {
      let x: number, y: number;
      let type: Enemy['type'] = 'guard';
      let health = 60;
      
      // Spawn on platforms or ground
      if (Math.random() < 0.7) {
        x = 500 + Math.random() * 250;
        y = canvas.height - 50;
      } else {
        x = 400 + Math.random() * 350;
        y = 300 - Math.random() * 100;
      }
      
      const rand = Math.random();
      if (rand < 0.3 && wave > 2) {
        type = 'samurai';
        health = 100;
      } else if (rand < 0.6 && wave > 3) {
        type = 'archer';
        health = 80;
      } else if (rand < 0.8 && wave > 5) {
        type = 'demon';
        health = 150;
      }

      enemies.push({
        x, y,
        vx: 0,
        vy: 0,
        health,
        type,
        lastAttack: 0,
        alertLevel: 0,
        facing: -1
      });
    }

    return enemies;
  }, []);

  const createPlatforms = useCallback(() => {
    const platforms: Platform[] = [];
    
    // Ground
    platforms.push({ x: 0, y: 550, width: 800, height: 50 });
    
    // Floating platforms
    platforms.push({ x: 200, y: 450, width: 120, height: 20 });
    platforms.push({ x: 400, y: 350, width: 100, height: 20 });
    platforms.push({ x: 600, y: 250, width: 150, height: 20 });
    platforms.push({ x: 100, y: 300, width: 80, height: 20 });
    
    return platforms;
  }, []);

  const initializeGame = useCallback(() => {
    const enemies = spawnEnemies(gameState.wave);
    const platforms = createPlatforms();
    
    setGameState(prev => ({
      ...prev,
      player: { 
        x: 100, y: 400, vx: 0, vy: 0, health: 100, energy: 100,
        facing: 1, isInvisible: false, timeRewindCharges: 3
      },
      enemies,
      projectiles: [],
      timeGhosts: [],
      platforms,
      playerHistory: [],
      gameOver: false,
      waveComplete: false,
      timeSlowed: false,
      timeSlowDuration: 0,
      shadowClones: []
    }));
  }, [gameState.wave, spawnEnemies, createPlatforms]);

  const checkPlatformCollision = (x: number, y: number, width: number, height: number) => {
    for (const platform of gameState.platforms) {
      if (x < platform.x + platform.width &&
          x + width > platform.x &&
          y < platform.y + platform.height &&
          y + height > platform.y) {
        return platform;
      }
    }
    return null;
  };

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.gameOver) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with night scene
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a0a2a');
    gradient.addColorStop(0.3, '#1a1a3a');
    gradient.addColorStop(0.7, '#2a2a4a');
    gradient.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setGameState(prev => {
      const newState = { ...prev };
      const currentTime = Date.now();
      const timeScale = newState.timeSlowed ? 0.3 : 1.0;

      // Update time slow duration
      if (newState.timeSlowDuration > 0) {
        newState.timeSlowDuration--;
        if (newState.timeSlowDuration === 0) {
          newState.timeSlowed = false;
        }
      }

      // Handle player input
      const moveSpeed = 5;
      const jumpPower = 12;
      
      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) {
        newState.player.vx = -moveSpeed;
        newState.player.facing = -1;
      } else if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) {
        newState.player.vx = moveSpeed;
        newState.player.facing = 1;
      } else {
        newState.player.vx *= 0.8; // Friction
      }
      
      // Jumping
      if ((keysRef.current.has('ArrowUp') || keysRef.current.has('w')) && Math.abs(newState.player.vy) < 1) {
        const platform = checkPlatformCollision(
          newState.player.x - 10, newState.player.y + 20,
          20, 5
        );
        if (platform) {
          newState.player.vy = -jumpPower;
        }
      }

      // Special abilities
      if (keysRef.current.has('q')) {
        activateTimeRewind();
        keysRef.current.delete('q');
      }
      
      if (keysRef.current.has('e')) {
        activateTimeSlowdown();
        keysRef.current.delete('e');
      }
      
      if (keysRef.current.has('r')) {
        createShadowClone();
        keysRef.current.delete('r');
      }

      // Invisibility toggle
      if (keysRef.current.has('f') && newState.player.energy >= 30) {
        newState.player.isInvisible = !newState.player.isInvisible;
        if (newState.player.isInvisible) {
          newState.player.energy -= 30;
        }
        keysRef.current.delete('f');
      }

      // Player shooting
      if ((keysRef.current.has(' ') || mouseRef.current.down) && newState.player.energy >= 10) {
        const angle = Math.atan2(
          mouseRef.current.y - newState.player.y,
          mouseRef.current.x - newState.player.x
        );
        
        newState.projectiles.push({
          x: newState.player.x,
          y: newState.player.y,
          vx: Math.cos(angle) * 12,
          vy: Math.sin(angle) * 12,
          damage: 35,
          type: 'shuriken',
          isPlayerProjectile: true,
          life: 100
        });
        
        newState.player.energy -= 10;
        if (mouseRef.current.down) mouseRef.current.down = false;
      }

      // Apply gravity
      newState.player.vy += 0.8;

      // Update player position
      newState.player.x += newState.player.vx;
      newState.player.y += newState.player.vy;

      // Platform collision
      const playerPlatform = checkPlatformCollision(
        newState.player.x - 10, newState.player.y,
        20, 20
      );
      
      if (playerPlatform && newState.player.vy > 0) {
        newState.player.y = playerPlatform.y - 20;
        newState.player.vy = 0;
      }

      // Keep player in bounds
      newState.player.x = Math.max(10, Math.min(canvas.width - 10, newState.player.x));
      if (newState.player.y > canvas.height) {
        newState.player.health -= 50;
        newState.player.y = 100;
        newState.player.vy = 0;
      }

      // Record player history for time rewind
      newState.playerHistory.push({
        x: newState.player.x,
        y: newState.player.y,
        time: currentTime
      });
      
      // Keep only last 5 seconds of history
      newState.playerHistory = newState.playerHistory.filter(
        pos => currentTime - pos.time < 5000
      );

      // Update enemies (affected by time slow)
      newState.enemies = newState.enemies.map(enemy => {
        const updatedEnemy = { ...enemy };
        
        // AI behavior
        const playerDistance = Math.hypot(
          newState.player.x - enemy.x,
          newState.player.y - enemy.y
        );
        
        // Detection (harder to detect when invisible)
        const detectionRange = newState.player.isInvisible ? 50 : 150;
        
        if (playerDistance < detectionRange) {
          updatedEnemy.alertLevel = Math.min(100, updatedEnemy.alertLevel + 2);
        } else {
          updatedEnemy.alertLevel = Math.max(0, updatedEnemy.alertLevel - 1);
        }

        // Movement (slowed by time effect)
        const moveSpeed = (enemy.type === 'samurai' ? 2 : 1.5) * timeScale;
        
        if (updatedEnemy.alertLevel > 30) {
          const dx = newState.player.x - enemy.x;
          if (Math.abs(dx) > 30) {
            updatedEnemy.vx = Math.sign(dx) * moveSpeed;
            updatedEnemy.facing = Math.sign(dx);
          } else {
            updatedEnemy.vx = 0;
          }
        } else {
          // Patrol behavior
          updatedEnemy.vx = updatedEnemy.facing * 0.5 * timeScale;
          
          // Turn around at edges or randomly
          if (enemy.x < 50 || enemy.x > canvas.width - 50 || Math.random() < 0.01) {
            updatedEnemy.facing *= -1;
          }
        }

        // Apply gravity to enemies
        updatedEnemy.vy += 0.8;
        
        // Update position
        updatedEnemy.x += updatedEnemy.vx;
        updatedEnemy.y += updatedEnemy.vy;

        // Enemy platform collision
        const enemyPlatform = checkPlatformCollision(
          enemy.x - 10, enemy.y,
          20, 20
        );
        
        if (enemyPlatform && updatedEnemy.vy > 0) {
          updatedEnemy.y = enemyPlatform.y - 20;
          updatedEnemy.vy = 0;
        }

        // Enemy attacks (slowed by time effect)
        const attackCooldown = (enemy.type === 'archer' ? 2000 : 1500) / timeScale;
        
        if (playerDistance < 100 && currentTime - enemy.lastAttack > attackCooldown) {
          const angle = Math.atan2(
            newState.player.y - enemy.y,
            newState.player.x - enemy.x
          );
          
          let projectileSpeed = 6;
          let damage = 25;
          let projectileType: Projectile['type'] = 'energy';
          
          if (enemy.type === 'archer') {
            projectileType = 'arrow';
            projectileSpeed = 8;
            damage = 30;
          } else if (enemy.type === 'samurai') {
            damage = 40;
            projectileSpeed = 4;
          } else if (enemy.type === 'demon') {
            damage = 50;
            projectileSpeed = 7;
          }
          
          newState.projectiles.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angle) * projectileSpeed * timeScale,
            vy: Math.sin(angle) * projectileSpeed * timeScale,
            damage,
            type: projectileType,
            isPlayerProjectile: false,
            life: 120
          });
          
          updatedEnemy.lastAttack = currentTime;
        }

        return updatedEnemy;
      });

      // Update projectiles
      newState.projectiles = newState.projectiles.filter(projectile => {
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;
        projectile.life--;

        // Remove off-screen or expired projectiles
        if (projectile.x < -50 || projectile.x > canvas.width + 50 || 
            projectile.y < -50 || projectile.y > canvas.height + 50 || 
            projectile.life <= 0) {
          return false;
        }

        // Check collisions
        if (projectile.isPlayerProjectile) {
          // Player projectile hitting enemies
          for (let i = newState.enemies.length - 1; i >= 0; i--) {
            const enemy = newState.enemies[i];
            const hit = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y) < 20;
            
            if (hit) {
              enemy.health -= projectile.damage;
              createTimeGhost(projectile.x, projectile.y);
              
              if (enemy.health <= 0) {
                newState.enemies.splice(i, 1);
                newState.score += enemy.type === 'demon' ? 400 :
                                 enemy.type === 'samurai' ? 300 :
                                 enemy.type === 'archer' ? 250 : 200;
                createTimeGhost(enemy.x, enemy.y);
              }
              
              return false;
            }
          }
        } else {
          // Enemy projectile hitting player (miss if invisible and lucky)
          if (newState.player.isInvisible && Math.random() < 0.7) {
            return true; // Projectile passes through
          }
          
          const playerHit = Math.hypot(
            projectile.x - newState.player.x,
            projectile.y - newState.player.y
          ) < 18;
          
          if (playerHit) {
            newState.player.health -= projectile.damage;
            createTimeGhost(projectile.x, projectile.y);
            
            if (newState.player.health <= 0) {
              newState.gameOver = true;
            }
            
            return false;
          }
        }

        return true;
      });

      // Update time ghosts
      newState.timeGhosts = newState.timeGhosts.map(ghost => ({
        ...ghost,
        life: ghost.life - 1,
        alpha: (ghost.life / 60) * 0.8
      })).filter(ghost => ghost.life > 0);

      // Update shadow clones
      newState.shadowClones = newState.shadowClones.map(clone => ({
        ...clone,
        life: clone.life - 1
      })).filter(clone => clone.life > 0);

      // Check wave completion
      if (newState.enemies.length === 0 && !newState.waveComplete) {
        newState.waveComplete = true;
        newState.player.timeRewindCharges = Math.min(3, newState.player.timeRewindCharges + 1);
      }

      // Regenerate energy slowly
      if (newState.player.energy < 100) {
        newState.player.energy = Math.min(100, newState.player.energy + 0.3);
      }

      // Drain invisibility energy
      if (newState.player.isInvisible) {
        newState.player.energy -= 0.5;
        if (newState.player.energy <= 0) {
          newState.player.isInvisible = false;
        }
      }

      return newState;
    });

    // Draw moon and stars
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(700, 100, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Stars
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % canvas.width;
      const y = (i * 73) % (canvas.height / 2);
      ctx.globalAlpha = Math.random() * 0.8;
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw platforms
    gameState.platforms.forEach(platform => {
      ctx.fillStyle = '#4a4a6a';
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      ctx.strokeStyle = '#6a6a8a';
      ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    });

    // Draw time ghosts
    gameState.timeGhosts.forEach(ghost => {
      ctx.globalAlpha = ghost.alpha;
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(ghost.x, ghost.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Draw shadow clones
    gameState.shadowClones.forEach(clone => {
      const alpha = clone.life / 180;
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle = '#4a4a8a';
      ctx.fillRect(clone.x - 8, clone.y - 16, 16, 32);
      ctx.globalAlpha = 1;
    });

    // Draw projectiles
    gameState.projectiles.forEach(projectile => {
      let color = '#ffff00';
      
      switch (projectile.type) {
        case 'shuriken': color = '#0aff9d'; break;
        case 'arrow': color = '#8b4513'; break;
        case 'energy': color = '#ff0099'; break;
      }
      
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      
      if (projectile.type === 'arrow') {
        // Draw arrow
        const angle = Math.atan2(projectile.vy, projectile.vx);
        ctx.save();
        ctx.translate(projectile.x, projectile.y);
        ctx.rotate(angle);
        ctx.fillRect(-8, -2, 16, 4);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.shadowBlur = 0;
    });

    // Draw enemies
    gameState.enemies.forEach(enemy => {
      let color = '#ff6600';
      let size = 15;
      
      switch (enemy.type) {
        case 'samurai': color = '#ff0099'; size = 18; break;
        case 'archer': color = '#8b4513'; size = 14; break;
        case 'demon': color = '#7000ff'; size = 22; break;
      }
      
      // Alert glow
      if (enemy.alertLevel > 50) {
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = enemy.alertLevel / 5;
      }
      
      ctx.fillStyle = color;
      ctx.fillRect(enemy.x - size/2, enemy.y - size, size, size * 2);
      
      // Facing direction indicator
      ctx.fillStyle = '#ffffff';
      const eyeX = enemy.x + (enemy.facing * size / 4);
      ctx.beginPath();
      ctx.arc(eyeX, enemy.y - size/2, 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
      
      // Health bar for stronger enemies
      if (enemy.type !== 'guard') {
        const maxHealth = enemy.type === 'demon' ? 150 : enemy.type === 'samurai' ? 100 : 80;
        ctx.fillStyle = '#333333';
        ctx.fillRect(enemy.x - 15, enemy.y - 25, 30, 4);
        ctx.fillStyle = '#ff0000';
        const healthPercent = enemy.health / maxHealth;
        ctx.fillRect(enemy.x - 15, enemy.y - 25, 30 * healthPercent, 4);
      }
    });

    // Draw player
    const playerAlpha = gameState.player.isInvisible ? 0.3 : 1.0;
    ctx.globalAlpha = playerAlpha;
    
    const playerColor = gameState.player.isInvisible ? '#00ffff' : 
                       gameState.timeSlowed ? '#ffff00' : '#0aff9d';
    
    ctx.fillStyle = playerColor;
    ctx.shadowColor = playerColor;
    ctx.shadowBlur = 15;
    
    // Ninja body
    ctx.fillRect(gameState.player.x - 8, gameState.player.y - 16, 16, 32);
    
    // Eyes
    ctx.fillStyle = '#ffffff';
    const eyeX = gameState.player.x + (gameState.player.facing * 3);
    ctx.beginPath();
    ctx.arc(eyeX, gameState.player.y - 8, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Time slow effect
    if (gameState.timeSlowed) {
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(gameState.player.x, gameState.player.y, 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Health: ${Math.floor(gameState.player.health)}`, 10, 25);
    ctx.fillText(`Energy: ${Math.floor(gameState.player.energy)}`, 10, 45);
    ctx.fillText(`Score: ${gameState.score}`, 10, 65);
    ctx.fillText(`Wave: ${gameState.wave}`, 10, 85);
    ctx.fillText(`Time Charges: ${gameState.player.timeRewindCharges}`, 10, 105);

    // Ability indicators
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '12px monospace';
    ctx.fillText('Q: Time Rewind | E: Slow Time | R: Shadow Clone | F: Invisibility', 10, canvas.height - 20);

    // Status effects
    if (gameState.player.isInvisible) {
      ctx.fillStyle = '#00ffff';
      ctx.fillText('INVISIBLE', canvas.width - 100, 30);
    }
    
    if (gameState.timeSlowed) {
      ctx.fillStyle = '#ffff00';
      ctx.fillText('TIME SLOWED', canvas.width - 120, 50);
    }

    // Crosshair
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mouseRef.current.x - 8, mouseRef.current.y);
    ctx.lineTo(mouseRef.current.x + 8, mouseRef.current.y);
    ctx.moveTo(mouseRef.current.x, mouseRef.current.y - 8);
    ctx.lineTo(mouseRef.current.x, mouseRef.current.y + 8);
    ctx.stroke();

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NINJA DEFEATED', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px monospace';
      ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 40);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 70);
    }

    if (gameState.waveComplete) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0aff9d';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SHADOWS VANQUISHED', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px monospace';
      ctx.fillText('Press N for next wave', canvas.width / 2, canvas.height / 2 + 40);
    }

    ctx.textAlign = 'left';
  }, [gameState, checkPlatformCollision]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    if (!gameState.gameOver) {
      gameLoopRef.current = setInterval(gameLoop, 1000 / 60);
    }
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameLoop, gameState.gameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.add(key);
      
      if (key === 'r' && gameState.gameOver) {
        setGameState(prev => ({ ...prev, wave: 1 }));
        initializeGame();
      }
      
      if (key === 'n' && gameState.waveComplete) {
        setGameState(prev => ({ ...prev, wave: prev.wave + 1, waveComplete: false }));
        initializeGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        mouseRef.current.x = e.clientX - rect.left;
        mouseRef.current.y = e.clientY - rect.top;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      mouseRef.current.down = true;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    if (canvasRef.current) {
      canvasRef.current.addEventListener('mousemove', handleMouseMove);
      canvasRef.current.addEventListener('mousedown', handleMouseDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('mousemove', handleMouseMove);
        canvasRef.current.removeEventListener('mousedown', handleMouseDown);
      }
    };
  }, [gameState.gameOver, gameState.waveComplete, initializeGame]);

  return (
    <GameLayout 
      gameTitle="Chrono Ninja"
      gameCategory="Time-bending ninja stealth combat"
    >
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg shadow-2xl cursor-none"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        <div className="text-center space-y-2">
          <p className="text-gray-300">WASD: Move | Mouse/Space: Shuriken | Q: Time Rewind | E: Slow Time</p>
          <p className="text-gray-400">R: Shadow Clone | F: Invisibility | Master time to defeat your enemies!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default ChronoNinja;
