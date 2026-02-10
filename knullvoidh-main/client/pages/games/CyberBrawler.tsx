import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';
import { getSafeCanvasContext, SafeGameLoop, SafeKeyHandler, checkCollision } from '@/utils/gameUtils';

interface Fighter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  health: number;
  energy: number;
  facing: 'left' | 'right';
  isBlocking: boolean;
  isAttacking: boolean;
  attackCooldown: number;
  comboCount: number;
  stunned: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

const CyberBrawler: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<SafeGameLoop | null>(null);
  const keyHandlerRef = useRef<SafeKeyHandler | null>(null);

  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver'>('menu');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  
  const [player, setPlayer] = useState<Fighter>({
    x: 150,
    y: 400,
    vx: 0,
    vy: 0,
    health: 100,
    energy: 100,
    facing: 'right',
    isBlocking: false,
    isAttacking: false,
    attackCooldown: 0,
    comboCount: 0,
    stunned: 0
  });

  const [enemy, setEnemy] = useState<Fighter>({
    x: 650,
    y: 400,
    vx: 0,
    vy: 0,
    health: 100,
    energy: 100,
    facing: 'left',
    isBlocking: false,
    isAttacking: false,
    attackCooldown: 0,
    comboCount: 0,
    stunned: 0
  });

  const [particles, setParticles] = useState<Particle[]>([]);
  const [shake, setShake] = useState(0);

  // Game constants
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const GROUND_Y = 450;
  const FIGHTER_SIZE = 40;
  const MOVE_SPEED = 4;
  const JUMP_FORCE = 15;
  const GRAVITY = 0.8;

  const createParticles = useCallback((x: number, y: number, color: string, count: number = 10) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        color,
        size: Math.random() * 4 + 2
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const checkFighterCollision = useCallback((f1: Fighter, f2: Fighter): boolean => {
    return Math.abs(f1.x - f2.x) < FIGHTER_SIZE && 
           Math.abs(f1.y - f2.y) < FIGHTER_SIZE;
  }, []);

  const performAttack = useCallback((attacker: Fighter, target: Fighter): boolean => {
    if (attacker.attackCooldown > 0) return false;
    
    const distance = Math.abs(attacker.x - target.x);
    if (distance > FIGHTER_SIZE + 20) return false;

    const damage = target.isBlocking ? 5 : (15 + Math.random() * 10);
    const newHealth = Math.max(0, target.health - damage);
    
    // Screen shake on hit
    setShake(8);
    
    // Create hit particles
    createParticles(target.x, target.y - 20, target.isBlocking ? '#ffff00' : '#ff0040', 15);
    
    if (attacker === player) {
      setEnemy(prev => ({ 
        ...prev, 
        health: newHealth,
        stunned: target.isBlocking ? 5 : 15,
        vx: target.isBlocking ? 0 : (attacker.facing === 'right' ? 3 : -3)
      }));
      setPlayer(prev => ({ 
        ...prev, 
        attackCooldown: 20,
        comboCount: prev.comboCount + 1,
        energy: Math.min(100, prev.energy + 10)
      }));
      setScore(prev => prev + (target.isBlocking ? 10 : 50));
    } else {
      setPlayer(prev => ({ 
        ...prev, 
        health: newHealth,
        stunned: target.isBlocking ? 5 : 15,
        vx: target.isBlocking ? 0 : (attacker.facing === 'right' ? 3 : -3)
      }));
      setEnemy(prev => ({ 
        ...prev, 
        attackCooldown: 20,
        comboCount: prev.comboCount + 1,
        energy: Math.min(100, prev.energy + 10)
      }));
    }

    return true;
  }, [createParticles, player]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getSafeCanvasContext(canvas);
    if (!ctx) return;

    // Clear with cyberpunk background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(0.5, '#002244');
    gradient.addColorStop(1, '#000011');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Screen shake effect
    const shakeX = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    const shakeY = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Draw neon grid floor
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    for (let x = 0; x < CANVAS_WIDTH; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    // Draw arena bounds
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 100, CANVAS_WIDTH - 100, GROUND_Y - 100);

    if (gameState === 'playing') {
      const keyHandler = keyHandlerRef.current;

      // Update fighters
      setPlayer(prev => {
        const newPlayer = { ...prev };
        
        // Reduce cooldowns and effects
        newPlayer.attackCooldown = Math.max(0, newPlayer.attackCooldown - 1);
        newPlayer.stunned = Math.max(0, newPlayer.stunned - 1);
        
        if (newPlayer.stunned === 0 && keyHandler) {
          // Movement
          if (keyHandler.isPressed('a') || keyHandler.isPressed('arrowleft')) {
            newPlayer.vx = -MOVE_SPEED;
            newPlayer.facing = 'left';
          } else if (keyHandler.isPressed('d') || keyHandler.isPressed('arrowright')) {
            newPlayer.vx = MOVE_SPEED;
            newPlayer.facing = 'right';
          } else {
            newPlayer.vx *= 0.8;
          }

          // Jump
          if ((keyHandler.isPressed('w') || keyHandler.isPressed('arrowup')) && Math.abs(newPlayer.y - GROUND_Y) < 5) {
            newPlayer.vy = -JUMP_FORCE;
          }

          // Block
          newPlayer.isBlocking = keyHandler.isPressed('s') || keyHandler.isPressed('arrowdown');

          // Attack
          if (keyHandler.isPressed(' ') && !newPlayer.isAttacking && newPlayer.attackCooldown === 0) {
            newPlayer.isAttacking = true;
            performAttack(newPlayer, enemy);
          }
        }

        // Apply physics
        newPlayer.x += newPlayer.vx;
        newPlayer.y += newPlayer.vy;
        newPlayer.vy += GRAVITY;

        // Boundaries
        newPlayer.x = Math.max(70, Math.min(CANVAS_WIDTH - 70, newPlayer.x));
        if (newPlayer.y >= GROUND_Y) {
          newPlayer.y = GROUND_Y;
          newPlayer.vy = 0;
        }

        // Reset attack state
        if (newPlayer.isAttacking && newPlayer.attackCooldown === 19) {
          newPlayer.isAttacking = false;
        }

        return newPlayer;
      });

      // Simple AI for enemy
      setEnemy(prev => {
        const newEnemy = { ...prev };
        
        newEnemy.attackCooldown = Math.max(0, newEnemy.attackCooldown - 1);
        newEnemy.stunned = Math.max(0, newEnemy.stunned - 1);

        if (newEnemy.stunned === 0) {
          const distanceToPlayer = player.x - newEnemy.x;
          
          // Move towards player
          if (Math.abs(distanceToPlayer) > FIGHTER_SIZE + 30) {
            newEnemy.vx = distanceToPlayer > 0 ? MOVE_SPEED * 0.7 : -MOVE_SPEED * 0.7;
            newEnemy.facing = distanceToPlayer > 0 ? 'right' : 'left';
          } else {
            newEnemy.vx *= 0.9;
            
            // Attack if close enough
            if (Math.abs(distanceToPlayer) < FIGHTER_SIZE + 20 && 
                newEnemy.attackCooldown === 0 && 
                Math.random() < 0.05) {
              newEnemy.isAttacking = true;
              performAttack(newEnemy, player);
            }
          }

          // Block occasionally
          newEnemy.isBlocking = Math.random() < 0.02;
        }

        // Apply physics
        newEnemy.x += newEnemy.vx;
        newEnemy.y += newEnemy.vy;
        newEnemy.vy += GRAVITY;

        // Boundaries
        newEnemy.x = Math.max(70, Math.min(CANVAS_WIDTH - 70, newEnemy.x));
        if (newEnemy.y >= GROUND_Y) {
          newEnemy.y = GROUND_Y;
          newEnemy.vy = 0;
        }

        if (newEnemy.isAttacking && newEnemy.attackCooldown === 19) {
          newEnemy.isAttacking = false;
        }

        return newEnemy;
      });

      // Check for round end
      if (player.health <= 0) {
        setGameState('gameOver');
      } else if (enemy.health <= 0) {
        setRound(prev => prev + 1);
        setScore(prev => prev + 1000);
        // Reset enemy with more health
        setEnemy({
          x: 650,
          y: 400,
          vx: 0,
          vy: 0,
          health: 100 + round * 20,
          energy: 100,
          facing: 'left',
          isBlocking: false,
          isAttacking: false,
          attackCooldown: 0,
          comboCount: 0,
          stunned: 0
        });
      }
    }

    // Draw fighters
    const drawFighter = (fighter: Fighter, color: string) => {
      ctx.save();
      
      // Fighter body
      ctx.fillStyle = fighter.isBlocking ? '#ffff00' : 
                     fighter.isAttacking ? '#ff0040' : 
                     fighter.stunned > 0 ? '#ff8000' : color;
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 15;
      
      // Main body
      ctx.fillRect(fighter.x - FIGHTER_SIZE/2, fighter.y - FIGHTER_SIZE, 
                   FIGHTER_SIZE, FIGHTER_SIZE);
      
      // Attack effect
      if (fighter.isAttacking) {
        ctx.fillStyle = 'rgba(255, 0, 64, 0.5)';
        const attackRange = fighter.facing === 'right' ? 
          [fighter.x + FIGHTER_SIZE/2, fighter.y - FIGHTER_SIZE/2, 30, 20] :
          [fighter.x - FIGHTER_SIZE/2 - 30, fighter.y - FIGHTER_SIZE/2, 30, 20];
        ctx.fillRect(...attackRange);
      }
      
      // Block effect
      if (fighter.isBlocking) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(fighter.x - FIGHTER_SIZE/2 - 5, fighter.y - FIGHTER_SIZE - 5, 
                      FIGHTER_SIZE + 10, FIGHTER_SIZE + 10);
      }
      
      ctx.restore();
    };

    drawFighter(player, '#00ffff');
    drawFighter(enemy, '#ff4080');

    // Update and draw particles
    setParticles(prev => prev
      .map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + 0.2,
        life: p.life - 0.02,
        vx: p.vx * 0.98
      }))
      .filter(p => p.life > 0)
    );

    particles.forEach(particle => {
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px monospace';
    
    // Health bars
    const drawHealthBar = (x: number, y: number, health: number, maxHealth: number, color: string) => {
      ctx.fillStyle = '#333333';
      ctx.fillRect(x, y, 200, 20);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, (health / maxHealth) * 200, 20);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(x, y, 200, 20);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px monospace';
      ctx.fillText(`${Math.floor(health)}/${maxHealth}`, x + 5, y + 15);
    };

    drawHealthBar(50, 30, player.health, 100, '#00ffff');
    drawHealthBar(550, 30, enemy.health, 100 + (round - 1) * 20, '#ff4080');

    // Score and round
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText(`Score: ${score}`, 300, 30);
    ctx.fillText(`Round: ${round}`, 350, 50);

    // Reduce shake
    setShake(prev => Math.max(0, prev - 1));

    ctx.restore();

    // Game state overlays
    if (gameState === 'menu') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#00ffff';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CYBER BRAWLER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.font = '24px monospace';
      ctx.fillText('Press SPACE to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      
      ctx.font = '16px monospace';
      ctx.fillText('WASD: Move | S: Block | SPACE: Attack', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    } else if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#ff0040';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.font = '24px monospace';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.fillText(`Rounds Survived: ${round - 1}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
      ctx.fillText('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
    }

    ctx.textAlign = 'left';
  }, [gameState, player, enemy, particles, shake, score, round, performAttack]);

  // Handle special keys
  useEffect(() => {
    const handleSpecialKeys = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      if (key === ' ' && gameState === 'menu') {
        setGameState('playing');
        setPlayer({
          x: 150, y: 400, vx: 0, vy: 0, health: 100, energy: 100,
          facing: 'right', isBlocking: false, isAttacking: false,
          attackCooldown: 0, comboCount: 0, stunned: 0
        });
        setEnemy({
          x: 650, y: 400, vx: 0, vy: 0, health: 100, energy: 100,
          facing: 'left', isBlocking: false, isAttacking: false,
          attackCooldown: 0, comboCount: 0, stunned: 0
        });
        setScore(0);
        setRound(1);
        setParticles([]);
      }
      
      if (key === 'r' && gameState === 'gameOver') {
        setGameState('menu');
      }
    };

    window.addEventListener('keydown', handleSpecialKeys);
    return () => window.removeEventListener('keydown', handleSpecialKeys);
  }, [gameState]);

  // Initialize game loop and input
  useEffect(() => {
    const keyHandler = new SafeKeyHandler();
    keyHandlerRef.current = keyHandler;

    const safeLoop = new SafeGameLoop(gameLoop, { useRequestAnimationFrame: true });
    gameLoopRef.current = safeLoop;
    safeLoop.start();

    return () => {
      if (gameLoopRef.current) {
        gameLoopRef.current.stop();
        gameLoopRef.current = null;
      }
      if (keyHandlerRef.current) {
        keyHandlerRef.current.cleanup();
        keyHandlerRef.current = null;
      }
    };
  }, [gameLoop]);

  return (
    <GameLayout 
      gameTitle="Cyber Brawler" 
      gameCategory="Street fighting in a cyberpunk world"
      score={gameState === 'playing' ? score : undefined}
    >
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-cyan-500 bg-black rounded-lg shadow-2xl"
        />
        <div className="text-center space-y-2">
          <p className="text-gray-300">WASD: Move | S: Block | SPACE: Attack/Start</p>
          <p className="text-gray-400">Cyberpunk street fighting with combo system!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default CyberBrawler;
