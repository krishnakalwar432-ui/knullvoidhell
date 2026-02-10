import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Player {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  level: number;
  experience: number;
  experienceToNext: number;
  credits: number;
  weapon: string;
  armor: string;
}

interface Enemy {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  type: 'drone' | 'cyborg' | 'hacker' | 'mech';
  damage: number;
  reward: number;
  lastAttack: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  fromPlayer: boolean;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Item {
  x: number;
  y: number;
  type: 'health' | 'energy' | 'credits' | 'upgrade';
  value: number;
  collected: boolean;
}

const CyberQuest = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  const enemyTypes = {
    drone: { health: 30, damage: 8, reward: 15, speed: 2, color: '#ff4444' },
    cyborg: { health: 60, damage: 12, reward: 25, speed: 1.5, color: '#44ff44' },
    hacker: { health: 40, damage: 15, reward: 30, speed: 1.8, color: '#4444ff' },
    mech: { health: 120, damage: 20, reward: 50, speed: 1, color: '#ffff44' }
  };

  const [gameState, setGameState] = useState({
    player: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      health: 100,
      maxHealth: 100,
      energy: 100,
      maxEnergy: 100,
      level: 1,
      experience: 0,
      experienceToNext: 100,
      credits: 50,
      weapon: 'Pulse Rifle',
      armor: 'Light Vest'
    } as Player,
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    particles: [] as Particle[],
    items: [] as Item[],
    score: 0,
    wave: 1,
    enemiesKilled: 0,
    gameOver: false,
    paused: false,
    lastShot: 0,
    lastEnemySpawn: 0,
    showStats: false
  });

  const spawnEnemy = useCallback(() => {
    const types = Object.keys(enemyTypes) as (keyof typeof enemyTypes)[];
    const type = types[Math.floor(Math.random() * types.length)];
    const enemyData = enemyTypes[type];
    
    // Spawn at edge of screen
    const side = Math.floor(Math.random() * 4);
    let x, y;
    switch (side) {
      case 0: x = Math.random() * CANVAS_WIDTH; y = 0; break; // Top
      case 1: x = CANVAS_WIDTH; y = Math.random() * CANVAS_HEIGHT; break; // Right
      case 2: x = Math.random() * CANVAS_WIDTH; y = CANVAS_HEIGHT; break; // Bottom
      default: x = 0; y = Math.random() * CANVAS_HEIGHT; break; // Left
    }
    
    return {
      x, y,
      health: enemyData.health + gameState.wave * 5,
      maxHealth: enemyData.health + gameState.wave * 5,
      type,
      damage: enemyData.damage,
      reward: enemyData.reward,
      lastAttack: 0
    };
  }, [gameState.wave]);

  const createParticles = (x: number, y: number, color: string, count: number = 8) => {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = Math.random() * 5 + 2;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30, maxLife: 30, color, size: Math.random() * 3 + 1
      });
    }
    return particles;
  };

  const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  };

  const update = useCallback(() => {
    if (gameState.gameOver || gameState.paused) return;

    setGameState(prev => {
      const newState = { ...prev };
      const currentTime = Date.now();
      const keys = keysRef.current;

      // Player movement
      const speed = 3;
      if (keys.has('a') || keys.has('ArrowLeft')) {
        newState.player.x = Math.max(20, newState.player.x - speed);
      }
      if (keys.has('d') || keys.has('ArrowRight')) {
        newState.player.x = Math.min(CANVAS_WIDTH - 20, newState.player.x + speed);
      }
      if (keys.has('w') || keys.has('ArrowUp')) {
        newState.player.y = Math.max(20, newState.player.y - speed);
      }
      if (keys.has('s') || keys.has('ArrowDown')) {
        newState.player.y = Math.min(CANVAS_HEIGHT - 20, newState.player.y + speed);
      }

      // Player shooting
      if (keys.has(' ') && currentTime - newState.lastShot > 200 && newState.player.energy > 5) {
        // Find closest enemy to shoot at
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        newState.enemies.forEach(enemy => {
          const distance = getDistance(newState.player.x, newState.player.y, enemy.x, enemy.y);
          if (distance < closestDistance) {
            closestEnemy = enemy;
            closestDistance = distance;
          }
        });

        if (closestEnemy && closestDistance < 300) {
          const dx = closestEnemy.x - newState.player.x;
          const dy = closestEnemy.y - newState.player.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          
          newState.projectiles.push({
            x: newState.player.x,
            y: newState.player.y,
            vx: (dx / length) * 8,
            vy: (dy / length) * 8,
            damage: 25 + newState.player.level * 5,
            fromPlayer: true,
            color: '#00ffff'
          });
          
          newState.player.energy -= 5;
          newState.lastShot = currentTime;
        }
      }

      // Regenerate energy
      if (newState.player.energy < newState.player.maxEnergy) {
        newState.player.energy = Math.min(newState.player.maxEnergy, newState.player.energy + 0.5);
      }

      // Spawn enemies
      if (currentTime - newState.lastEnemySpawn > 3000 - newState.wave * 100) {
        newState.enemies.push(spawnEnemy());
        newState.lastEnemySpawn = currentTime;
      }

      // Move enemies toward player
      newState.enemies.forEach(enemy => {
        const dx = newState.player.x - enemy.x;
        const dy = newState.player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const enemyData = enemyTypes[enemy.type];
        
        if (distance > 30) {
          enemy.x += (dx / distance) * enemyData.speed;
          enemy.y += (dy / distance) * enemyData.speed;
        }
        
        // Enemy attack
        if (distance < 50 && currentTime - enemy.lastAttack > 1500) {
          newState.player.health -= enemy.damage;
          enemy.lastAttack = currentTime;
          
          // Create damage particles
          newState.particles.push(...createParticles(newState.player.x, newState.player.y, '#ff0000', 5));
        }
      });

      // Move projectiles
      newState.projectiles = newState.projectiles.filter(projectile => {
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;
        
        // Check bounds
        if (projectile.x < 0 || projectile.x > CANVAS_WIDTH || 
            projectile.y < 0 || projectile.y > CANVAS_HEIGHT) {
          return false;
        }
        
        if (projectile.fromPlayer) {
          // Check enemy hits
          for (let i = newState.enemies.length - 1; i >= 0; i--) {
            const enemy = newState.enemies[i];
            if (getDistance(projectile.x, projectile.y, enemy.x, enemy.y) < 20) {
              enemy.health -= projectile.damage;
              
              if (enemy.health <= 0) {
                // Enemy killed
                newState.score += enemy.reward;
                newState.player.experience += enemy.reward;
                newState.player.credits += Math.floor(enemy.reward / 2);
                newState.enemiesKilled++;
                
                // Drop items sometimes
                if (Math.random() < 0.3) {
                  const itemTypes = ['health', 'energy', 'credits'] as const;
                  const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
                  newState.items.push({
                    x: enemy.x,
                    y: enemy.y,
                    type: itemType,
                    value: itemType === 'credits' ? 20 : 25,
                    collected: false
                  });
                }
                
                // Create explosion particles
                newState.particles.push(...createParticles(enemy.x, enemy.y, enemyTypes[enemy.type].color, 12));
                
                newState.enemies.splice(i, 1);
              }
              
              return false; // Remove projectile
            }
          }
        }
        
        return true;
      });

      // Level up check
      if (newState.player.experience >= newState.player.experienceToNext) {
        newState.player.level++;
        newState.player.experience = 0;
        newState.player.experienceToNext = newState.player.level * 100;
        newState.player.maxHealth += 20;
        newState.player.health = newState.player.maxHealth;
        newState.player.maxEnergy += 10;
        newState.player.energy = newState.player.maxEnergy;
        
        // Level up particles
        newState.particles.push(...createParticles(newState.player.x, newState.player.y, '#ffff00', 15));
      }

      // Wave progression
      if (newState.enemiesKilled >= newState.wave * 10) {
        newState.wave++;
        newState.enemiesKilled = 0;
        newState.player.credits += 100; // Wave bonus
      }

      // Item collection
      newState.items.forEach(item => {
        if (!item.collected && getDistance(newState.player.x, newState.player.y, item.x, item.y) < 25) {
          item.collected = true;
          
          switch (item.type) {
            case 'health':
              newState.player.health = Math.min(newState.player.maxHealth, newState.player.health + item.value);
              break;
            case 'energy':
              newState.player.energy = Math.min(newState.player.maxEnergy, newState.player.energy + item.value);
              break;
            case 'credits':
              newState.player.credits += item.value;
              break;
          }
        }
      });

      newState.items = newState.items.filter(item => !item.collected);

      // Update particles
      newState.particles = newState.particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        return particle.life > 0;
      });

      // Check game over
      if (newState.player.health <= 0) {
        newState.gameOver = true;
      }

      return newState;
    });
  }, [gameState.gameOver, gameState.paused, spawnEnemy]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with cyberpunk background
    ctx.fillStyle = '#001122';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid effect
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Draw items
    gameState.items.forEach(item => {
      const colors = { health: '#ff0000', energy: '#0000ff', credits: '#ffff00', upgrade: '#ff00ff' };
      ctx.fillStyle = colors[item.type];
      ctx.shadowColor = colors[item.type];
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw enemies
    gameState.enemies.forEach(enemy => {
      const enemyData = enemyTypes[enemy.type];
      ctx.fillStyle = enemyData.color;
      ctx.shadowColor = enemyData.color;
      ctx.shadowBlur = 15;
      ctx.fillRect(enemy.x - 15, enemy.y - 15, 30, 30);
      
      // Enemy symbol
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      const symbols = { drone: '🚁', cyborg: '🤖', hacker: '💻', mech: '🦾' };
      ctx.fillText(symbols[enemy.type], enemy.x, enemy.y + 6);
      
      // Health bar
      const healthPercent = enemy.health / enemy.maxHealth;
      ctx.fillStyle = 'red';
      ctx.fillRect(enemy.x - 15, enemy.y - 25, 30, 4);
      ctx.fillStyle = 'green';
      ctx.fillRect(enemy.x - 15, enemy.y - 25, 30 * healthPercent, 4);
      
      ctx.shadowBlur = 0;
    });

    // Draw projectiles
    gameState.projectiles.forEach(projectile => {
      ctx.fillStyle = projectile.color;
      ctx.shadowColor = projectile.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw particles
    gameState.particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw player
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    ctx.fillRect(gameState.player.x - 12, gameState.player.y - 12, 24, 24);
    
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🚀', gameState.player.x, gameState.player.y + 6);
    ctx.shadowBlur = 0;

    // Draw UI
    const uiHeight = 120;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, uiHeight);
    
    // Health bar
    ctx.fillStyle = 'red';
    ctx.fillRect(20, 20, 200, 15);
    ctx.fillStyle = 'green';
    ctx.fillRect(20, 20, 200 * (gameState.player.health / gameState.player.maxHealth), 15);
    ctx.fillStyle = '#00ffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Health: ${Math.floor(gameState.player.health)}/${gameState.player.maxHealth}`, 25, 32);
    
    // Energy bar
    ctx.fillStyle = 'darkblue';
    ctx.fillRect(20, 45, 200, 15);
    ctx.fillStyle = 'blue';
    ctx.fillRect(20, 45, 200 * (gameState.player.energy / gameState.player.maxEnergy), 15);
    ctx.fillText(`Energy: ${Math.floor(gameState.player.energy)}/${gameState.player.maxEnergy}`, 25, 57);
    
    // Experience bar
    ctx.fillStyle = 'gray';
    ctx.fillRect(20, 70, 200, 10);
    ctx.fillStyle = 'yellow';
    ctx.fillRect(20, 70, 200 * (gameState.player.experience / gameState.player.experienceToNext), 10);
    ctx.fillText(`Level ${gameState.player.level} - XP: ${gameState.player.experience}/${gameState.player.experienceToNext}`, 25, 95);
    
    // Stats
    ctx.fillText(`Score: ${gameState.score}`, 250, 32);
    ctx.fillText(`Credits: ${gameState.player.credits}`, 250, 50);
    ctx.fillText(`Wave: ${gameState.wave}`, 250, 68);
    ctx.fillText(`Enemies: ${gameState.enemies.length}`, 250, 86);
    
    // Controls
    ctx.font = '12px Arial';
    ctx.fillText('WASD/Arrows: Move | Space: Shoot | Tab: Stats | P: Pause', 400, 32);
    
    if (gameState.showStats) {
      // Equipment panel
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(400, 50, 350, 200);
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(400, 50, 350, 200);
      
      ctx.fillStyle = '#00ffff';
      ctx.font = '16px Arial';
      ctx.fillText('EQUIPMENT & STATS', 420, 75);
      ctx.font = '14px Arial';
      ctx.fillText(`Weapon: ${gameState.player.weapon}`, 420, 100);
      ctx.fillText(`Armor: ${gameState.player.armor}`, 420, 120);
      ctx.fillText(`Damage: ${25 + gameState.player.level * 5}`, 420, 140);
      ctx.fillText(`Defense: ${gameState.player.level * 2}`, 420, 160);
      ctx.fillText(`Speed: Enhanced`, 420, 180);
      ctx.fillText(`Special: Auto-Target`, 420, 200);
      ctx.fillText('Press Tab to close', 420, 230);
    }

    if (gameState.paused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#00ffff';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px Arial';
      ctx.fillText('Press P to resume', canvas.width / 2, canvas.height / 2 + 50);
    }

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#ff0080';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SYSTEM FAILURE', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.fillStyle = '#00ffff';
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText(`Level Reached: ${gameState.player.level}`, canvas.width / 2, canvas.height / 2 + 30);
      ctx.fillText('Press R to reboot', canvas.width / 2, canvas.height / 2 + 70);
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' && gameState.gameOver) {
        setGameState({
          player: {
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT / 2,
            health: 100,
            maxHealth: 100,
            energy: 100,
            maxEnergy: 100,
            level: 1,
            experience: 0,
            experienceToNext: 100,
            credits: 50,
            weapon: 'Pulse Rifle',
            armor: 'Light Vest'
          },
          enemies: [],
          projectiles: [],
          particles: [],
          items: [],
          score: 0,
          wave: 1,
          enemiesKilled: 0,
          gameOver: false,
          paused: false,
          lastShot: 0,
          lastEnemySpawn: 0,
          showStats: false
        });
        return;
      }
      
      if (e.key === 'p') {
        setGameState(prev => ({ ...prev, paused: !prev.paused }));
        return;
      }
      
      if (e.key === 'Tab') {
        e.preventDefault();
        setGameState(prev => ({ ...prev, showStats: !prev.showStats }));
        return;
      }
      
      keysRef.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
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
    <GameLayout gameTitle="Cyber Quest" gameCategory="Cyberpunk RPG adventure">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-cyan-400 bg-black rounded-lg"
          style={{ boxShadow: '0 0 30px #00ffff' }}
        />
        <div className="text-center text-gray-300">
          <p>WASD/Arrows: Move | Space: Auto-Fire | Tab: Stats | P: Pause | R: Restart</p>
          <p className="text-sm text-cyan-400">Survive waves of cyber enemies • Collect items • Level up your character</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default CyberQuest;
