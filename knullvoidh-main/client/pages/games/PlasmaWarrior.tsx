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

interface Warrior extends Position {
  vx: number;
  vy: number;
  health: number;
  energy: number;
  facing: number; // angle
  isCharging: boolean;
  chargeLevel: number;
}

interface Enemy extends Position {
  vx: number;
  vy: number;
  health: number;
  type: 'drone' | 'heavy' | 'scout';
  lastShot: number;
  size: number;
  color: string;
}

interface PlasmaBlast extends Position {
  vx: number;
  vy: number;
  power: number;
  isPlayerShot: boolean;
  life: number;
  size: number;
  color: string;
}

interface Particle extends Position {
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

const PlasmaWarrior: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<createSafeAnimationManager | null>(null);
  const keyHandlerRef = useRef<createSafeKeyManager | null>(null);

  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver'>('menu');
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [mousePos, setMousePos] = useState<Position>({ x: 400, y: 300 });
  
  const [warrior, setWarrior] = useState<Warrior>({
    x: 400,
    y: 300,
    vx: 0,
    vy: 0,
    health: 100,
    energy: 100,
    facing: 0,
    isCharging: false,
    chargeLevel: 0
  });

  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [plasmaBlasts, setPlasmaBlasts] = useState<PlasmaBlast[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);

  const gameId = 'plasma-warrior';
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const MOVE_SPEED = 4;
  const PLASMA_SPEED = 8;

  const createParticles = useCallback((x: number, y: number, color: string, count: number = 10) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 1,
        color,
        size: Math.random() * 4 + 2
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const spawnEnemies = useCallback(() => {
    const enemyTypes: Enemy['type'][] = ['drone', 'heavy', 'scout'];
    const newEnemies: Enemy[] = [];
    
    for (let i = 0; i < 2 + wave; i++) {
      const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      const side = Math.random() > 0.5 ? 'left' : 'right';
      
      const enemyData = {
        drone: { health: 30, size: 15, color: '#ff4444' },
        heavy: { health: 80, size: 25, color: '#ff8800' },
        scout: { health: 20, size: 12, color: '#44ff44' }
      };
      
      newEnemies.push({
        x: side === 'left' ? -50 : CANVAS_WIDTH + 50,
        y: Math.random() * (CANVAS_HEIGHT - 100) + 50,
        vx: side === 'left' ? 1 + Math.random() * 2 : -(1 + Math.random() * 2),
        vy: (Math.random() - 0.5) * 2,
        health: enemyData[type].health + wave * 10,
        type,
        lastShot: 0,
        size: enemyData[type].size,
        color: enemyData[type].color
      });
    }
    
    setEnemies(newEnemies);
  }, [wave]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    
    setMousePos({ x, y });
    
    // Update warrior facing
    setWarrior(prev => ({
      ...prev,
      facing: Math.atan2(y - prev.y, x - prev.x)
    }));
  }, []);

  const handleMouseDown = useCallback(() => {
    if (gameState === 'playing') {
      setWarrior(prev => ({ ...prev, isCharging: true }));
    }
  }, [gameState]);

  const handleMouseUp = useCallback(() => {
    if (gameState === 'playing' && warrior.isCharging) {
      // Fire plasma blast
      const power = Math.min(warrior.chargeLevel, 100);
      const speed = PLASMA_SPEED + (power / 100) * 4;
      
      setPlasmaBlasts(prev => [...prev, {
        x: warrior.x + Math.cos(warrior.facing) * 30,
        y: warrior.y + Math.sin(warrior.facing) * 30,
        vx: Math.cos(warrior.facing) * speed,
        vy: Math.sin(warrior.facing) * speed,
        power: 25 + (power / 100) * 25,
        isPlayerShot: true,
        life: 120,
        size: 8 + (power / 100) * 8,
        color: power > 80 ? '#ff0040' : power > 40 ? '#ff4080' : '#ff80c0'
      }]);
      
      createParticles(
        warrior.x + Math.cos(warrior.facing) * 20,
        warrior.y + Math.sin(warrior.facing) * 20,
        '#ff0040',
        Math.floor(power / 10) + 5
      );
      
      setWarrior(prev => ({
        ...prev,
        isCharging: false,
        chargeLevel: 0,
        energy: Math.max(0, prev.energy - (power / 100) * 30)
      }));
    }
  }, [gameState, warrior.isCharging, warrior.chargeLevel, warrior.facing, warrior.x, warrior.y, createParticles]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getSafeCanvas2DContext(canvas);
    if (!ctx) return;

    // Clear with dark space background
    const gradient = ctx.createRadialGradient(
      CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 0,
      CANVAS_WIDTH/2, CANVAS_HEIGHT/2, CANVAS_WIDTH/2
    );
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(0.5, '#000811');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid background
    ctx.strokeStyle = 'rgba(0, 255, 64, 0.1)';
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

      // Update warrior
      setWarrior(prev => {
        const newWarrior = { ...prev };
        
        if (keyHandler) {
          // Movement
          if (keyHandler.isPressed('w') || keyHandler.isPressed('arrowup')) {
            newWarrior.vy = -MOVE_SPEED;
          } else if (keyHandler.isPressed('s') || keyHandler.isPressed('arrowdown')) {
            newWarrior.vy = MOVE_SPEED;
          } else {
            newWarrior.vy *= 0.8;
          }

          if (keyHandler.isPressed('a') || keyHandler.isPressed('arrowleft')) {
            newWarrior.vx = -MOVE_SPEED;
          } else if (keyHandler.isPressed('d') || keyHandler.isPressed('arrowright')) {
            newWarrior.vx = MOVE_SPEED;
          } else {
            newWarrior.vx *= 0.8;
          }
        }

        // Apply movement
        newWarrior.x += newWarrior.vx;
        newWarrior.y += newWarrior.vy;

        // Boundaries
        newWarrior.x = clamp(newWarrior.x, 20, CANVAS_WIDTH - 20);
        newWarrior.y = clamp(newWarrior.y, 20, CANVAS_HEIGHT - 20);

        // Charge weapon
        if (newWarrior.isCharging && newWarrior.energy > 0) {
          newWarrior.chargeLevel = Math.min(100, newWarrior.chargeLevel + 3);
        }

        // Regenerate energy
        newWarrior.energy = Math.min(100, newWarrior.energy + 0.2);

        return newWarrior;
      });

      // Update enemies
      setEnemies(prev => prev.map(enemy => {
        const newEnemy = { ...enemy };
        
        // Movement AI
        const distToPlayer = distance(enemy.x, enemy.y, warrior.x, warrior.y);
        
        if (enemy.type === 'scout') {
          // Fast, erratic movement
          newEnemy.vx += (Math.random() - 0.5) * 0.5;
          newEnemy.vy += (Math.random() - 0.5) * 0.5;
          newEnemy.vx = clamp(newEnemy.vx, -3, 3);
          newEnemy.vy = clamp(newEnemy.vy, -3, 3);
        } else if (enemy.type === 'heavy') {
          // Slow approach
          const angleToPlayer = Math.atan2(warrior.y - enemy.y, warrior.x - enemy.x);
          newEnemy.vx += Math.cos(angleToPlayer) * 0.1;
          newEnemy.vy += Math.sin(angleToPlayer) * 0.1;
          newEnemy.vx = clamp(newEnemy.vx, -1.5, 1.5);
          newEnemy.vy = clamp(newEnemy.vy, -1.5, 1.5);
        } else {
          // Drone - moderate pursuit
          const angleToPlayer = Math.atan2(warrior.y - enemy.y, warrior.x - enemy.x);
          newEnemy.vx += Math.cos(angleToPlayer) * 0.15;
          newEnemy.vy += Math.sin(angleToPlayer) * 0.15;
          newEnemy.vx = clamp(newEnemy.vx, -2, 2);
          newEnemy.vy = clamp(newEnemy.vy, -2, 2);
        }

        newEnemy.x += newEnemy.vx;
        newEnemy.y += newEnemy.vy;

        // Boundary wrap
        if (newEnemy.x < -100) newEnemy.x = CANVAS_WIDTH + 50;
        if (newEnemy.x > CANVAS_WIDTH + 100) newEnemy.x = -50;
        if (newEnemy.y < -50) newEnemy.y = CANVAS_HEIGHT + 50;
        if (newEnemy.y > CANVAS_HEIGHT + 50) newEnemy.y = -50;

        // Enemy shooting
        newEnemy.lastShot++;
        if (newEnemy.lastShot > (enemy.type === 'heavy' ? 120 : 80) && distToPlayer < 200) {
          newEnemy.lastShot = 0;
          
          const angleToPlayer = Math.atan2(warrior.y - enemy.y, warrior.x - enemy.x);
          setPlasmaBlasts(prev => [...prev, {
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angleToPlayer) * 4,
            vy: Math.sin(angleToPlayer) * 4,
            power: enemy.type === 'heavy' ? 35 : 20,
            isPlayerShot: false,
            life: 100,
            size: enemy.type === 'heavy' ? 12 : 8,
            color: enemy.color
          }]);
        }

        return newEnemy;
      }));

      // Update plasma blasts
      setPlasmaBlasts(prev => prev
        .map(blast => ({
          ...blast,
          x: blast.x + blast.vx,
          y: blast.y + blast.vy,
          life: blast.life - 1
        }))
        .filter(blast => 
          blast.life > 0 &&
          blast.x > -50 && blast.x < CANVAS_WIDTH + 50 &&
          blast.y > -50 && blast.y < CANVAS_HEIGHT + 50
        )
      );

      // Update particles
      setParticles(prev => prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vx: particle.vx * 0.98,
          vy: particle.vy * 0.98,
          life: particle.life - 0.03,
          size: particle.size * 0.99
        }))
        .filter(particle => particle.life > 0)
      );

      // Check collisions
      setPlasmaBlasts(prevBlasts => {
        const remainingBlasts: PlasmaBlast[] = [];
        
        prevBlasts.forEach(blast => {
          let hit = false;
          
          if (blast.isPlayerShot) {
            // Check enemy hits
            setEnemies(prevEnemies => prevEnemies.map(enemy => {
              if (!hit && distance(blast.x, blast.y, enemy.x, enemy.y) < blast.size + enemy.size) {
                hit = true;
                const newHealth = enemy.health - blast.power;
                createParticles(enemy.x, enemy.y, enemy.color, 15);
                
                if (newHealth <= 0) {
                  setScore(prev => prev + (enemy.type === 'heavy' ? 200 : enemy.type === 'drone' ? 100 : 50));
                  return { ...enemy, health: 0 }; // Mark for removal
                }
                
                return { ...enemy, health: newHealth };
              }
              return enemy;
            }));
          } else {
            // Check warrior hit
            if (distance(blast.x, blast.y, warrior.x, warrior.y) < blast.size + 20) {
              hit = true;
              setWarrior(prev => ({ ...prev, health: prev.health - blast.power }));
              createParticles(warrior.x, warrior.y, '#ff0040', 12);
            }
          }
          
          if (!hit) {
            remainingBlasts.push(blast);
          }
        });
        
        return remainingBlasts;
      });

      // Remove dead enemies
      setEnemies(prev => prev.filter(enemy => enemy.health > 0));

      // Check win/lose conditions
      if (warrior.health <= 0) {
        setGameState('gameOver');
      } else if (enemies.length === 0) {
        setWave(prev => prev + 1);
        setScore(prev => prev + 300);
        spawnEnemies();
      }
    }

    // Draw particles
    particles.forEach(particle => {
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Draw warrior
    ctx.save();
    ctx.translate(warrior.x, warrior.y);
    ctx.rotate(warrior.facing);
    
    // Warrior body
    ctx.fillStyle = '#ff0040';
    ctx.shadowColor = '#ff0040';
    ctx.shadowBlur = 15;
    ctx.fillRect(-15, -10, 30, 20);
    
    // Weapon barrel
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(15, -3, 20, 6);
    
    // Charge effect
    if (warrior.isCharging && warrior.chargeLevel > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${warrior.chargeLevel / 100})`;
      ctx.shadowBlur = warrior.chargeLevel / 3;
      ctx.beginPath();
      ctx.arc(35, 0, 5 + (warrior.chargeLevel / 100) * 10, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
    ctx.shadowBlur = 0;

    // Draw enemies
    enemies.forEach(enemy => {
      ctx.fillStyle = enemy.color;
      ctx.shadowColor = enemy.color;
      ctx.shadowBlur = 10;
      
      if (enemy.type === 'heavy') {
        ctx.fillRect(enemy.x - enemy.size, enemy.y - enemy.size, enemy.size * 2, enemy.size * 2);
      } else if (enemy.type === 'scout') {
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y - enemy.size);
        ctx.lineTo(enemy.x + enemy.size, enemy.y + enemy.size);
        ctx.lineTo(enemy.x - enemy.size, enemy.y + enemy.size);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Health bar
      if (enemy.health < (enemy.type === 'heavy' ? 80 : enemy.type === 'drone' ? 30 : 20)) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(enemy.x - enemy.size, enemy.y - enemy.size - 10, 
                    (enemy.health / (enemy.type === 'heavy' ? 80 + wave * 10 : 
                     enemy.type === 'drone' ? 30 + wave * 10 : 20 + wave * 10)) * enemy.size * 2, 3);
      }
    });
    ctx.shadowBlur = 0;

    // Draw plasma blasts
    plasmaBlasts.forEach(blast => {
      ctx.fillStyle = blast.color;
      ctx.shadowColor = blast.color;
      ctx.shadowBlur = blast.size;
      ctx.beginPath();
      ctx.arc(blast.x, blast.y, blast.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Blast trail
      ctx.globalAlpha = 0.3;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(
          blast.x - blast.vx * i,
          blast.y - blast.vy * i,
          blast.size * (1 - i * 0.2),
          0, Math.PI * 2
        );
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
    ctx.shadowBlur = 0;

    // Draw UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText(`Health: ${warrior.health}`, 10, 30);
    ctx.fillText(`Energy: ${Math.floor(warrior.energy)}`, 10, 55);
    ctx.fillText(`Score: ${score}`, 10, 80);
    ctx.fillText(`Wave: ${wave}`, 10, 105);

    // Health bar
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(10, 110, 200, 10);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(10, 110, (warrior.health / 100) * 200, 10);

    // Energy bar
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(10, 125, 200, 6);
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(10, 125, (warrior.energy / 100) * 200, 6);

    // Charge indicator
    if (warrior.isCharging) {
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(10, 135, (warrior.chargeLevel / 100) * 200, 4);
    }

    // Crosshair
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mousePos.x - 10, mousePos.y);
    ctx.lineTo(mousePos.x + 10, mousePos.y);
    ctx.moveTo(mousePos.x, mousePos.y - 10);
    ctx.lineTo(mousePos.x, mousePos.y + 10);
    ctx.stroke();

    // Game state overlays
    if (gameState === 'menu') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#ff0040';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PLASMA WARRIOR', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.font = '24px monospace';
      ctx.fillText('Click to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      
      ctx.font = '16px monospace';
      ctx.fillText('WASD: Move | Mouse: Aim & Fire', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    } else if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#ff0000';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('WARRIOR DOWN', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.font = '24px monospace';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.fillText(`Waves Survived: ${wave - 1}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
      ctx.fillText('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
    }

    ctx.textAlign = 'left';
  }, [gameState, warrior, enemies, plasmaBlasts, particles, mousePos, score, wave, createParticles, spawnEnemies]);

  // Initialize game
  useEffect(() => {
    gameManager.registerGame(gameId);
    
    return () => {
      gameManager.unregisterGame(gameId);
      if (gameLoopRef.current) {
        gameLoopRef.current.stop();
      }
      if (keyHandlerRef.current) {
        keyHandlerRef.current.cleanup();
      }
    };
  }, []);

  // Handle special keys
  useEffect(() => {
    const handleSpecialKeys = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      if (key === 'r' && gameState === 'gameOver') {
        setGameState('menu');
        setScore(0);
        setWave(1);
        setWarrior({
          x: 400, y: 300, vx: 0, vy: 0, health: 100, energy: 100,
          facing: 0, isCharging: false, chargeLevel: 0
        });
        setEnemies([]);
        setPlasmaBlasts([]);
        setParticles([]);
      }
    };

    window.addEventListener('keydown', handleSpecialKeys);
    return () => window.removeEventListener('keydown', handleSpecialKeys);
  }, [gameState]);

  // Handle mouse click to start
  useEffect(() => {
    const handleClick = () => {
      if (gameState === 'menu') {
        setGameState('playing');
        spawnEnemies();
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
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
      gameTitle="Plasma Warrior" 
      gameCategory="Intense combat with energy weapons"
      score={gameState === 'playing' ? score : undefined}
    >
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-red-500 bg-black rounded-lg shadow-2xl cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        />
        <div className="text-center space-y-2">
          <p className="text-gray-300">WASD: Move | Mouse: Aim & Fire | Hold to charge plasma shots</p>
          <p className="text-gray-400">Survive waves of enemies with your plasma weapons!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default PlasmaWarrior;
