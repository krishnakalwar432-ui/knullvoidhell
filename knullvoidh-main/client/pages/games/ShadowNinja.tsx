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

interface Ninja extends Position {
  vx: number;
  vy: number;
  health: number;
  stealth: number;
  isInvisible: boolean;
  facing: 'left' | 'right';
  isAttacking: boolean;
  attackCooldown: number;
  onGround: boolean;
}

interface Enemy extends Position {
  type: 'guard' | 'samurai' | 'archer';
  health: number;
  facing: 'left' | 'right';
  alertLevel: number;
  patrolDirection: number;
  attackCooldown: number;
  detectionRadius: number;
}

interface Shuriken extends Position {
  vx: number;
  vy: number;
  rotation: number;
  isPlayerProjectile: boolean;
}

interface SmokeParticle extends Position {
  vx: number;
  vy: number;
  life: number;
  size: number;
  opacity: number;
}

const ShadowNinja: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<createSafeAnimationManager | null>(null);
  const keyHandlerRef = useRef<createSafeKeyManager | null>(null);

  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver' | 'levelComplete'>('menu');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  
  const [ninja, setNinja] = useState<Ninja>({
    x: 100,
    y: 450,
    vx: 0,
    vy: 0,
    health: 100,
    stealth: 100,
    isInvisible: false,
    facing: 'right',
    isAttacking: false,
    attackCooldown: 0,
    onGround: true
  });

  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [shurikens, setShurikens] = useState<Shuriken[]>([]);
  const [smokeParticles, setSmokeParticles] = useState<SmokeParticle[]>([]);
  const [platforms, setPlatforms] = useState<Array<{x: number, y: number, width: number, height: number}>>([]);

  const gameId = 'shadow-ninja';
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const GROUND_Y = 500;
  const GRAVITY = 0.6;
  const JUMP_FORCE = 12;
  const MOVE_SPEED = 5;

  const createSmokeEffect = useCallback((x: number, y: number, count: number = 15) => {
    const newParticles: SmokeParticle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 2,
        life: 1,
        size: Math.random() * 8 + 4,
        opacity: 0.8
      });
    }
    setSmokeParticles(prev => [...prev, ...newParticles]);
  }, []);

  const spawnEnemies = useCallback(() => {
    const enemyTypes: Enemy['type'][] = ['guard', 'samurai', 'archer'];
    const newEnemies: Enemy[] = [];
    
    for (let i = 0; i < 3 + level; i++) {
      newEnemies.push({
        x: 200 + i * 150 + Math.random() * 100,
        y: GROUND_Y - 40,
        type: enemyTypes[Math.floor(Math.random() * enemyTypes.length)],
        health: 50 + level * 10,
        facing: Math.random() > 0.5 ? 'left' : 'right',
        alertLevel: 0,
        patrolDirection: Math.random() > 0.5 ? 1 : -1,
        attackCooldown: 0,
        detectionRadius: 80 + level * 10
      });
    }
    
    setEnemies(newEnemies);
  }, [level]);

  const spawnPlatforms = useCallback(() => {
    const newPlatforms = [
      { x: 200, y: 400, width: 100, height: 20 },
      { x: 400, y: 350, width: 120, height: 20 },
      { x: 600, y: 300, width: 100, height: 20 },
      { x: 350, y: 200, width: 150, height: 20 }
    ];
    setPlatforms(newPlatforms);
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getSafeCanvas2DContext(canvas);
    if (!ctx) return;

    // Clear with night background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#000011');
    gradient.addColorStop(0.5, '#001122');
    gradient.addColorStop(1, '#000033');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw stars
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      const x = (i * 123.456) % CANVAS_WIDTH;
      const y = (i * 789.123) % (CANVAS_HEIGHT * 0.6);
      ctx.fillRect(x, y, 1, 1);
    }

    if (gameState === 'playing') {
      const keyHandler = keyHandlerRef.current;

      // Update ninja
      setNinja(prev => {
        const newNinja = { ...prev };
        
        // Reduce cooldowns
        newNinja.attackCooldown = Math.max(0, newNinja.attackCooldown - 1);
        
        if (keyHandler) {
          // Movement
          if (keyHandler.isPressed('a') || keyHandler.isPressed('arrowleft')) {
            newNinja.vx = -MOVE_SPEED;
            newNinja.facing = 'left';
          } else if (keyHandler.isPressed('d') || keyHandler.isPressed('arrowright')) {
            newNinja.vx = MOVE_SPEED;
            newNinja.facing = 'right';
          } else {
            newNinja.vx *= 0.8;
          }

          // Jump
          if ((keyHandler.isPressed('w') || keyHandler.isPressed('arrowup')) && newNinja.onGround) {
            newNinja.vy = -JUMP_FORCE;
            newNinja.onGround = false;
          }

          // Stealth mode
          if (keyHandler.isPressed('s') || keyHandler.isPressed('arrowdown')) {
            newNinja.isInvisible = true;
            newNinja.stealth = Math.max(0, newNinja.stealth - 2);
          } else {
            newNinja.isInvisible = false;
            newNinja.stealth = Math.min(100, newNinja.stealth + 0.5);
          }

          // Attack
          if (keyHandler.isPressed(' ') && newNinja.attackCooldown === 0) {
            newNinja.isAttacking = true;
            newNinja.attackCooldown = 30;
            
            // Throw shuriken
            setShurikens(prev => [...prev, {
              x: newNinja.x + (newNinja.facing === 'right' ? 30 : -30),
              y: newNinja.y - 10,
              vx: newNinja.facing === 'right' ? 8 : -8,
              vy: -2,
              rotation: 0,
              isPlayerProjectile: true
            }]);
            
            createSmokeEffect(newNinja.x, newNinja.y - 20, 8);
          }
        }

        // Apply physics
        newNinja.x += newNinja.vx;
        newNinja.y += newNinja.vy;
        newNinja.vy += GRAVITY;

        // Ground collision
        if (newNinja.y >= GROUND_Y - 40) {
          newNinja.y = GROUND_Y - 40;
          newNinja.vy = 0;
          newNinja.onGround = true;
        }

        // Platform collision
        platforms.forEach(platform => {
          if (newNinja.x > platform.x - 20 && newNinja.x < platform.x + platform.width + 20 &&
              newNinja.y > platform.y - 50 && newNinja.y < platform.y + 10 && newNinja.vy > 0) {
            newNinja.y = platform.y - 40;
            newNinja.vy = 0;
            newNinja.onGround = true;
          }
        });

        // Boundaries
        newNinja.x = clamp(newNinja.x, 20, CANVAS_WIDTH - 20);

        // Reset attack animation
        if (newNinja.attackCooldown === 15) {
          newNinja.isAttacking = false;
        }

        return newNinja;
      });

      // Update enemies
      setEnemies(prev => prev.map(enemy => {
        const newEnemy = { ...enemy };
        newEnemy.attackCooldown = Math.max(0, newEnemy.attackCooldown - 1);

        // Check ninja detection
        const distToNinja = distance(enemy.x, enemy.y, ninja.x, ninja.y);
        if (distToNinja < enemy.detectionRadius && !ninja.isInvisible) {
          newEnemy.alertLevel = Math.min(100, newEnemy.alertLevel + 2);
          newEnemy.facing = ninja.x > enemy.x ? 'right' : 'left';
          
          // Attack if close
          if (distToNinja < 60 && newEnemy.attackCooldown === 0) {
            newEnemy.attackCooldown = 60;
            
            if (enemy.type === 'archer') {
              // Shoot arrow
              setShurikens(prev => [...prev, {
                x: enemy.x,
                y: enemy.y - 10,
                vx: newEnemy.facing === 'right' ? 6 : -6,
                vy: -1,
                rotation: 0,
                isPlayerProjectile: false
              }]);
            }
          }
        } else {
          newEnemy.alertLevel = Math.max(0, newEnemy.alertLevel - 1);
        }

        // Patrol movement
        if (newEnemy.alertLevel < 50) {
          newEnemy.x += newEnemy.patrolDirection * 1;
          if (newEnemy.x < 50 || newEnemy.x > CANVAS_WIDTH - 50) {
            newEnemy.patrolDirection *= -1;
            newEnemy.facing = newEnemy.patrolDirection > 0 ? 'right' : 'left';
          }
        }

        return newEnemy;
      }));

      // Update shurikens
      setShurikens(prev => prev
        .map(shuriken => ({
          ...shuriken,
          x: shuriken.x + shuriken.vx,
          y: shuriken.y + shuriken.vy,
          vy: shuriken.vy + 0.2,
          rotation: shuriken.rotation + 0.3
        }))
        .filter(shuriken => 
          shuriken.x > -50 && shuriken.x < CANVAS_WIDTH + 50 &&
          shuriken.y > -50 && shuriken.y < CANVAS_HEIGHT + 50
        )
      );

      // Update smoke particles
      setSmokeParticles(prev => prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          life: particle.life - 0.02,
          opacity: particle.opacity * 0.98,
          size: particle.size * 1.01
        }))
        .filter(particle => particle.life > 0)
      );

      // Check shuriken collisions
      setShurikens(prevShurikens => {
        const remainingShurikens: Shuriken[] = [];
        
        prevShurikens.forEach(shuriken => {
          let hit = false;
          
          if (shuriken.isPlayerProjectile) {
            // Check enemy hits
            setEnemies(prevEnemies => prevEnemies.map(enemy => {
              if (!hit && distance(shuriken.x, shuriken.y, enemy.x, enemy.y) < 30) {
                hit = true;
                setScore(prev => prev + 100);
                createSmokeEffect(enemy.x, enemy.y, 12);
                return { ...enemy, health: enemy.health - 25 };
              }
              return enemy;
            }));
          } else {
            // Check ninja hit
            if (distance(shuriken.x, shuriken.y, ninja.x, ninja.y) < 25) {
              hit = true;
              setNinja(prev => ({ ...prev, health: prev.health - 20 }));
              createSmokeEffect(ninja.x, ninja.y, 10);
            }
          }
          
          if (!hit) {
            remainingShurikens.push(shuriken);
          }
        });
        
        return remainingShurikens;
      });

      // Remove dead enemies
      setEnemies(prev => prev.filter(enemy => enemy.health > 0));

      // Check win/lose conditions
      if (ninja.health <= 0) {
        setGameState('gameOver');
      } else if (enemies.length === 0) {
        setGameState('levelComplete');
        setLevel(prev => prev + 1);
        setScore(prev => prev + 500);
      }
    }

    // Draw platforms
    ctx.fillStyle = '#333333';
    platforms.forEach(platform => {
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      
      // Platform glow
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 2;
      ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    });

    // Draw smoke particles
    smokeParticles.forEach(particle => {
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = '#444444';
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw ninja
    if (!ninja.isInvisible || Math.floor(Date.now() / 100) % 2) {
      ctx.fillStyle = ninja.isInvisible ? 'rgba(64, 0, 255, 0.5)' : '#4000ff';
      ctx.shadowColor = '#4000ff';
      ctx.shadowBlur = ninja.isInvisible ? 20 : 10;
      
      // Ninja body
      ctx.fillRect(ninja.x - 15, ninja.y - 30, 30, 30);
      
      // Attack effect
      if (ninja.isAttacking) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const attackX = ninja.facing === 'right' ? ninja.x + 20 : ninja.x - 35;
        ctx.fillRect(attackX, ninja.y - 25, 15, 20);
      }
      
      ctx.shadowBlur = 0;
    }

    // Draw enemies
    enemies.forEach(enemy => {
      const enemyColors = {
        guard: '#ff4444',
        samurai: '#ff8800',
        archer: '#88ff44'
      };
      
      ctx.fillStyle = enemyColors[enemy.type];
      if (enemy.alertLevel > 50) {
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 15;
      }
      
      ctx.fillRect(enemy.x - 15, enemy.y - 30, 30, 30);
      
      // Alert indicator
      if (enemy.alertLevel > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${enemy.alertLevel / 100})`;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y - 40, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.shadowBlur = 0;
    });

    // Draw shurikens
    shurikens.forEach(shuriken => {
      ctx.save();
      ctx.translate(shuriken.x, shuriken.y);
      ctx.rotate(shuriken.rotation);
      
      ctx.fillStyle = shuriken.isPlayerProjectile ? '#ffffff' : '#ff0000';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      
      // Draw star shape
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const radius = i % 2 === 0 ? 8 : 4;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
      ctx.shadowBlur = 0;
    });

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText(`Health: ${ninja.health}`, 10, 30);
    ctx.fillText(`Stealth: ${Math.floor(ninja.stealth)}`, 10, 55);
    ctx.fillText(`Score: ${score}`, 10, 80);
    ctx.fillText(`Level: ${level}`, 10, 105);

    // Game state overlays
    if (gameState === 'menu') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#4000ff';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SHADOW NINJA', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.font = '24px monospace';
      ctx.fillText('Press SPACE to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      
      ctx.font = '16px monospace';
      ctx.fillText('WASD: Move | S: Stealth | SPACE: Attack', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
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
      ctx.fillText('Press SPACE for next level', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }

    ctx.textAlign = 'left';
  }, [gameState, ninja, enemies, shurikens, smokeParticles, platforms, score, level, createSmokeEffect]);

  // Initialize game
  useEffect(() => {
    gameManager.registerGame(gameId);
    spawnPlatforms();
    
    return () => {
      gameManager.unregisterGame(gameId);
      if (gameLoopRef.current) {
        gameLoopRef.current.stop();
      }
      if (keyHandlerRef.current) {
        keyHandlerRef.current.cleanup();
      }
    };
  }, [spawnPlatforms]);

  // Handle special keys
  useEffect(() => {
    const handleSpecialKeys = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      if (key === ' ' && gameState === 'menu') {
        setGameState('playing');
        spawnEnemies();
        setNinja({
          x: 100, y: 450, vx: 0, vy: 0, health: 100, stealth: 100,
          isInvisible: false, facing: 'right', isAttacking: false,
          attackCooldown: 0, onGround: true
        });
        setScore(0);
        setLevel(1);
      }
      
      if (key === ' ' && gameState === 'levelComplete') {
        setGameState('playing');
        spawnEnemies();
      }
      
      if (key === 'r' && gameState === 'gameOver') {
        setGameState('menu');
      }
    };

    window.addEventListener('keydown', handleSpecialKeys);
    return () => window.removeEventListener('keydown', handleSpecialKeys);
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
      gameTitle="Shadow Ninja" 
      gameCategory="Stealth-based action with ninja abilities"
      score={gameState === 'playing' ? score : undefined}
    >
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-purple-500 bg-black rounded-lg shadow-2xl"
        />
        <div className="text-center space-y-2">
          <p className="text-gray-300">WASD: Move | S: Stealth | SPACE: Attack/Start</p>
          <p className="text-gray-400">Use stealth and ninja skills to eliminate enemies!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default ShadowNinja;
