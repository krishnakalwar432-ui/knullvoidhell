import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Player {
  x: number;
  y: number;
  health: number;
  quantumCharge: number;
  phaseShift: number;
  velocity: { x: number; y: number };
}

interface Enemy {
  x: number;
  y: number;
  health: number;
  type: 'quantum' | 'phase' | 'temporal' | 'boss';
  lastShot: number;
  pattern: string;
  charge: number;
}

interface Bullet {
  x: number;
  y: number;
  dx: number;
  dy: number;
  damage: number;
  type: 'normal' | 'quantum' | 'phase' | 'temporal';
  isPlayerBullet: boolean;
  life: number;
}

interface QuantumEffect {
  x: number;
  y: number;
  radius: number;
  type: 'teleport' | 'phase' | 'time' | 'entangle';
  life: number;
  color: string;
}

const QuantumGunfight = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef({ x: 0, y: 0, down: false });
  
  const [gameState, setGameState] = useState({
    player: { 
      x: 400, y: 300, health: 100, quantumCharge: 100, phaseShift: 0,
      velocity: { x: 0, y: 0 }
    } as Player,
    enemies: [] as Enemy[],
    bullets: [] as Bullet[],
    quantumEffects: [] as QuantumEffect[],
    score: 0,
    wave: 1,
    gameOver: false,
    waveComplete: false,
    timeDistortion: 0,
    quantumEntanglement: false,
    phasedOut: false
  });

  const createQuantumEffect = (x: number, y: number, type: QuantumEffect['type']) => {
    const colors = {
      teleport: '#7000ff',
      phase: '#0aff9d',
      time: '#ffff00',
      entangle: '#ff0099'
    };
    
    setGameState(prev => ({
      ...prev,
      quantumEffects: [...prev.quantumEffects, {
        x, y, radius: 0, type, life: 60, color: colors[type]
      }]
    }));
  };

  const quantumTeleport = (targetX: number, targetY: number) => {
    setGameState(prev => {
      if (prev.player.quantumCharge >= 30) {
        createQuantumEffect(prev.player.x, prev.player.y, 'teleport');
        createQuantumEffect(targetX, targetY, 'teleport');
        
        return {
          ...prev,
          player: {
            ...prev.player,
            x: targetX,
            y: targetY,
            quantumCharge: prev.player.quantumCharge - 30
          }
        };
      }
      return prev;
    });
  };

  const phaseShift = () => {
    setGameState(prev => {
      if (prev.player.quantumCharge >= 40) {
        createQuantumEffect(prev.player.x, prev.player.y, 'phase');
        
        return {
          ...prev,
          player: {
            ...prev.player,
            phaseShift: 180, // 3 seconds at 60fps
            quantumCharge: prev.player.quantumCharge - 40
          },
          phasedOut: true
        };
      }
      return prev;
    });
  };

  const timeDistort = () => {
    setGameState(prev => {
      if (prev.player.quantumCharge >= 50) {
        createQuantumEffect(prev.player.x, prev.player.y, 'time');
        
        return {
          ...prev,
          timeDistortion: 300, // 5 seconds
          player: {
            ...prev.player,
            quantumCharge: prev.player.quantumCharge - 50
          }
        };
      }
      return prev;
    });
  };

  const spawnEnemies = useCallback((wave: number) => {
    const enemies: Enemy[] = [];
    const canvas = canvasRef.current;
    if (!canvas) return enemies;

    const baseCount = 2 + wave;
    
    for (let i = 0; i < baseCount; i++) {
      const side = Math.floor(Math.random() * 4);
      let x: number, y: number;
      
      switch (side) {
        case 0: x = Math.random() * canvas.width; y = 0; break;
        case 1: x = canvas.width; y = Math.random() * canvas.height; break;
        case 2: x = Math.random() * canvas.width; y = canvas.height; break;
        default: x = 0; y = Math.random() * canvas.height; break;
      }
      
      let type: Enemy['type'] = 'quantum';
      let health = 60;
      
      if (wave > 2 && Math.random() < 0.3) {
        type = 'phase';
        health = 80;
      }
      if (wave > 4 && Math.random() < 0.2) {
        type = 'temporal';
        health = 100;
      }
      if (wave > 6 && Math.random() < 0.1) {
        type = 'boss';
        health = 200;
      }

      enemies.push({
        x, y, health, type,
        lastShot: 0,
        pattern: Math.random() < 0.5 ? 'circle' : 'zigzag',
        charge: 0
      });
    }

    return enemies;
  }, []);

  const initializeGame = useCallback(() => {
    const enemies = spawnEnemies(gameState.wave);
    setGameState(prev => ({
      ...prev,
      player: { 
        x: 400, y: 300, health: 100, quantumCharge: 100, phaseShift: 0,
        velocity: { x: 0, y: 0 }
      },
      enemies,
      bullets: [],
      quantumEffects: [],
      gameOver: false,
      waveComplete: false,
      timeDistortion: 0,
      quantumEntanglement: false,
      phasedOut: false
    }));
  }, [gameState.wave, spawnEnemies]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.gameOver) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with quantum field effect
    const gradient = ctx.createRadialGradient(400, 300, 0, 400, 300, 400);
    gradient.addColorStop(0, '#000033');
    gradient.addColorStop(0.5, '#001122');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setGameState(prev => {
      const newState = { ...prev };
      const currentTime = Date.now();
      const timeScale = newState.timeDistortion > 0 ? 0.3 : 1.0;

      // Handle player movement with quantum momentum
      const acceleration = 0.4;
      const friction = 0.88;
      const maxSpeed = 5;

      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) {
        newState.player.velocity.x = Math.max(-maxSpeed, newState.player.velocity.x - acceleration);
      }
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) {
        newState.player.velocity.x = Math.min(maxSpeed, newState.player.velocity.x + acceleration);
      }
      if (keysRef.current.has('ArrowUp') || keysRef.current.has('w')) {
        newState.player.velocity.y = Math.max(-maxSpeed, newState.player.velocity.y - acceleration);
      }
      if (keysRef.current.has('ArrowDown') || keysRef.current.has('s')) {
        newState.player.velocity.y = Math.min(maxSpeed, newState.player.velocity.y + acceleration);
      }

      // Apply friction and update position
      newState.player.velocity.x *= friction;
      newState.player.velocity.y *= friction;
      newState.player.x += newState.player.velocity.x;
      newState.player.y += newState.player.velocity.y;

      // Keep player in bounds
      newState.player.x = Math.max(20, Math.min(canvas.width - 20, newState.player.x));
      newState.player.y = Math.max(20, Math.min(canvas.height - 20, newState.player.y));

      // Player shooting
      if (mouseRef.current.down) {
        const dx = mouseRef.current.x - newState.player.x;
        const dy = mouseRef.current.y - newState.player.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist > 0) {
          newState.bullets.push({
            x: newState.player.x,
            y: newState.player.y,
            dx: (dx / dist) * 8,
            dy: (dy / dist) * 8,
            damage: 25,
            type: 'quantum',
            isPlayerBullet: true,
            life: 100
          });
        }
        mouseRef.current.down = false;
      }

      // Update phase shift
      if (newState.player.phaseShift > 0) {
        newState.player.phaseShift--;
        if (newState.player.phaseShift === 0) {
          newState.phasedOut = false;
        }
      }

      // Update time distortion
      if (newState.timeDistortion > 0) {
        newState.timeDistortion--;
      }

      // Update enemies with quantum behaviors
      newState.enemies = newState.enemies.map(enemy => {
        const updatedEnemy = { ...enemy };
        
        // Movement patterns affected by time distortion
        const moveSpeed = (enemy.type === 'temporal' ? 2 : 1.5) * timeScale;
        
        if (enemy.pattern === 'circle') {
          updatedEnemy.charge += 0.05 * timeScale;
          const radius = 100;
          updatedEnemy.x = 400 + Math.cos(updatedEnemy.charge) * radius;
          updatedEnemy.y = 300 + Math.sin(updatedEnemy.charge) * radius;
        } else {
          // Move towards player
          const dx = newState.player.x - enemy.x;
          const dy = newState.player.y - enemy.y;
          const distance = Math.hypot(dx, dy);
          
          if (distance > 0) {
            updatedEnemy.x += (dx / distance) * moveSpeed;
            updatedEnemy.y += (dy / distance) * moveSpeed;
          }
        }

        // Enemy shooting patterns
        const shootDelay = enemy.type === 'boss' ? 1000 : 2000;
        if (currentTime - enemy.lastShot > shootDelay * timeScale) {
          const playerDist = Math.hypot(
            newState.player.x - enemy.x,
            newState.player.y - enemy.y
          );
          
          if (playerDist < 300) {
            let bulletType: Bullet['type'] = 'normal';
            let bulletCount = 1;
            
            switch (enemy.type) {
              case 'quantum':
                bulletType = 'quantum';
                break;
              case 'phase':
                bulletType = 'phase';
                bulletCount = 3;
                break;
              case 'temporal':
                bulletType = 'temporal';
                break;
              case 'boss':
                bulletType = 'quantum';
                bulletCount = 5;
                break;
            }
            
            for (let i = 0; i < bulletCount; i++) {
              const angle = Math.atan2(
                newState.player.y - enemy.y,
                newState.player.x - enemy.x
              ) + (i - bulletCount / 2) * 0.3;
              
              newState.bullets.push({
                x: enemy.x,
                y: enemy.y,
                dx: Math.cos(angle) * 4,
                dy: Math.sin(angle) * 4,
                damage: enemy.type === 'boss' ? 30 : 20,
                type: bulletType,
                isPlayerBullet: false,
                life: 100
              });
            }
            
            updatedEnemy.lastShot = currentTime;
          }
        }

        return updatedEnemy;
      });

      // Update bullets
      newState.bullets = newState.bullets.filter(bullet => {
        bullet.x += bullet.dx * timeScale;
        bullet.y += bullet.dy * timeScale;
        bullet.life--;

        // Remove bullets that are off-screen or expired
        if (bullet.x < 0 || bullet.x > canvas.width || 
            bullet.y < 0 || bullet.y > canvas.height || bullet.life <= 0) {
          return false;
        }

        // Check collisions
        if (bullet.isPlayerBullet) {
          // Player bullet hitting enemies
          for (let i = newState.enemies.length - 1; i >= 0; i--) {
            const enemy = newState.enemies[i];
            const hit = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y) < 25;
            
            if (hit) {
              enemy.health -= bullet.damage;
              createQuantumEffect(bullet.x, bullet.y, 'entangle');
              
              if (enemy.health <= 0) {
                newState.enemies.splice(i, 1);
                newState.score += enemy.type === 'boss' ? 500 : enemy.type === 'temporal' ? 200 : 100;
                createQuantumEffect(enemy.x, enemy.y, 'teleport');
              }
              
              return false;
            }
          }
        } else {
          // Enemy bullet hitting player (only if not phased out)
          if (!newState.phasedOut) {
            const playerHit = Math.hypot(
              bullet.x - newState.player.x,
              bullet.y - newState.player.y
            ) < 20;
            
            if (playerHit) {
              newState.player.health -= bullet.damage;
              createQuantumEffect(newState.player.x, newState.player.y, 'phase');
              
              if (newState.player.health <= 0) {
                newState.gameOver = true;
              }
              
              return false;
            }
          }
        }

        return true;
      });

      // Update quantum effects
      newState.quantumEffects = newState.quantumEffects.map(effect => ({
        ...effect,
        radius: effect.radius + 3,
        life: effect.life - 1
      })).filter(effect => effect.life > 0);

      // Regenerate quantum charge
      if (newState.player.quantumCharge < 100) {
        newState.player.quantumCharge = Math.min(100, newState.player.quantumCharge + 0.3);
      }

      // Check wave completion
      if (newState.enemies.length === 0 && !newState.waveComplete) {
        newState.waveComplete = true;
      }

      return newState;
    });

    // Draw quantum field grid
    ctx.strokeStyle = 'rgba(112, 0, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw quantum effects
    gameState.quantumEffects.forEach(effect => {
      const alpha = effect.life / 60;
      ctx.globalAlpha = alpha;
      
      const gradient = ctx.createRadialGradient(
        effect.x, effect.y, 0,
        effect.x, effect.y, effect.radius
      );
      gradient.addColorStop(0, effect.color);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.globalAlpha = 1;
    });

    // Draw bullets
    gameState.bullets.forEach(bullet => {
      let color = '#0aff9d';
      
      switch (bullet.type) {
        case 'quantum': color = '#7000ff'; break;
        case 'phase': color = '#0aff9d'; break;
        case 'temporal': color = '#ffff00'; break;
      }
      
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.isPlayerBullet ? 4 : 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw enemies
    gameState.enemies.forEach(enemy => {
      let color = '#ff6600';
      let size = 15;
      
      switch (enemy.type) {
        case 'quantum': color = '#7000ff'; break;
        case 'phase': color = '#0aff9d'; size = 12; break;
        case 'temporal': color = '#ffff00'; size = 18; break;
        case 'boss': color = '#ff0099'; size = 25; break;
      }
      
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Quantum field visualization
      if (enemy.type === 'quantum' || enemy.type === 'boss') {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, size + 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      
      // Health bar for bosses
      if (enemy.type === 'boss') {
        ctx.fillStyle = '#333333';
        ctx.fillRect(enemy.x - 30, enemy.y - 35, 60, 6);
        ctx.fillStyle = '#00ff00';
        const healthPercent = enemy.health / 200;
        ctx.fillRect(enemy.x - 30, enemy.y - 35, 60 * healthPercent, 6);
      }
    });

    // Draw player
    const playerAlpha = gameState.phasedOut ? 0.3 : 1.0;
    ctx.globalAlpha = playerAlpha;
    
    const playerColor = gameState.phasedOut ? '#0aff9d' : 
                       gameState.timeDistortion > 0 ? '#ffff00' : '#7000ff';
    
    ctx.fillStyle = playerColor;
    ctx.shadowColor = playerColor;
    ctx.shadowBlur = 25;
    ctx.fillRect(gameState.player.x - 10, gameState.player.y - 10, 20, 20);
    ctx.shadowBlur = 0;
    
    ctx.globalAlpha = 1;

    // Draw crosshair
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mouseRef.current.x - 15, mouseRef.current.y);
    ctx.lineTo(mouseRef.current.x + 15, mouseRef.current.y);
    ctx.moveTo(mouseRef.current.x, mouseRef.current.y - 15);
    ctx.lineTo(mouseRef.current.x, mouseRef.current.y + 15);
    ctx.stroke();

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Health: ${gameState.player.health}`, 10, 25);
    ctx.fillText(`Quantum: ${Math.floor(gameState.player.quantumCharge)}`, 10, 45);
    ctx.fillText(`Score: ${gameState.score}`, 10, 65);
    ctx.fillText(`Wave: ${gameState.wave}`, 10, 85);
    
    if (gameState.timeDistortion > 0) {
      ctx.fillStyle = '#ffff00';
      ctx.fillText(`Time Distortion: ${Math.floor(gameState.timeDistortion / 60)}s`, 10, 105);
    }
    
    if (gameState.phasedOut) {
      ctx.fillStyle = '#0aff9d';
      ctx.fillText(`Phased Out: ${Math.floor(gameState.player.phaseShift / 60)}s`, 10, 125);
    }

    // Quantum abilities
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '12px monospace';
    ctx.fillText('Q: Teleport (30) | E: Phase (40) | R: Time Distort (50)', 10, canvas.height - 20);

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('QUANTUM COLLAPSE', canvas.width / 2, canvas.height / 2);
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
      ctx.fillText('QUANTUM STABILIZED', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px monospace';
      ctx.fillText('Press N for next wave', canvas.width / 2, canvas.height / 2 + 40);
    }

    ctx.textAlign = 'left';
  }, [gameState]);

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
      
      if (key === 'q') {
        quantumTeleport(mouseRef.current.x, mouseRef.current.y);
      }
      
      if (key === 'e') {
        phaseShift();
      }
      
      if (key === 'r' && !gameState.gameOver) {
        timeDistort();
      }
      
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
      gameTitle="Quantum Gunfight"
      gameCategory="Gunfights with quantum mechanics"
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
          <p className="text-gray-300">WASD: Move | Mouse: Aim & Shoot | Q: Teleport | E: Phase | R: Time Distort</p>
          <p className="text-gray-400">Use quantum abilities to survive the gunfight!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default QuantumGunfight;
