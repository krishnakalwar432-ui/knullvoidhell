import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Fighter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  health: number;
  energy: number;
  facing: number;
  isHologram: boolean;
  lastAttack: number;
  stunned: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  type: 'beam' | 'pulse' | 'wave';
  life: number;
}

interface Hologram {
  x: number;
  y: number;
  facing: number;
  life: number;
  alpha: number;
}

const HoloStrikeDuel = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());
  
  const [gameState, setGameState] = useState({
    player: { 
      x: 200, y: 300, vx: 0, vy: 0, health: 100, energy: 100, 
      facing: 1, isHologram: false, lastAttack: 0, stunned: 0 
    } as Fighter,
    enemy: { 
      x: 600, y: 300, vx: 0, vy: 0, health: 100, energy: 100, 
      facing: -1, isHologram: false, lastAttack: 0, stunned: 0 
    } as Fighter,
    projectiles: [] as Projectile[],
    holograms: [] as Hologram[],
    score: 0,
    round: 1,
    gameOver: false,
    roundWon: false
  });

  const createHologram = (fighter: Fighter) => {
    setGameState(prev => ({
      ...prev,
      holograms: [...prev.holograms, {
        x: fighter.x,
        y: fighter.y,
        facing: fighter.facing,
        life: 120,
        alpha: 0.6
      }]
    }));
  };

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.gameOver) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Holographic arena background
    const gradient = ctx.createRadialGradient(400, 300, 0, 400, 300, 400);
    gradient.addColorStop(0, '#002244');
    gradient.addColorStop(0.5, '#001122');
    gradient.addColorStop(1, '#000011');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setGameState(prev => {
      const newState = { ...prev };
      const currentTime = Date.now();

      // Player controls
      const moveSpeed = 4;
      
      if (keysRef.current.has('a') && newState.player.stunned <= 0) {
        newState.player.vx = -moveSpeed;
        newState.player.facing = -1;
      } else if (keysRef.current.has('d') && newState.player.stunned <= 0) {
        newState.player.vx = moveSpeed;
        newState.player.facing = 1;
      } else {
        newState.player.vx *= 0.8;
      }

      if ((keysRef.current.has('w') || keysRef.current.has(' ')) && 
          Math.abs(newState.player.vy) < 1 && newState.player.stunned <= 0) {
        newState.player.vy = -12;
      }

      // Player attacks
      if (keysRef.current.has('x') && 
          currentTime - newState.player.lastAttack > 500 && 
          newState.player.energy >= 20 && 
          newState.player.stunned <= 0) {
        
        newState.projectiles.push({
          x: newState.player.x + newState.player.facing * 30,
          y: newState.player.y,
          vx: newState.player.facing * 8,
          vy: 0,
          damage: 25,
          type: 'beam',
          life: 60
        });
        
        newState.player.energy -= 20;
        newState.player.lastAttack = currentTime;
        keysRef.current.delete('x');
      }

      // Hologram ability
      if (keysRef.current.has('q') && newState.player.energy >= 40) {
        createHologram(newState.player);
        newState.player.isHologram = true;
        newState.player.energy -= 40;
        
        setTimeout(() => {
          setGameState(s => ({ ...s, player: { ...s.player, isHologram: false } }));
        }, 2000);
        
        keysRef.current.delete('q');
      }

      // Apply gravity
      newState.player.vy += 0.6;
      newState.enemy.vy += 0.6;

      // Update positions
      newState.player.x += newState.player.vx;
      newState.player.y += newState.player.vy;
      newState.enemy.x += newState.enemy.vx;
      newState.enemy.y += newState.enemy.vy;

      // Ground collision
      if (newState.player.y >= 450) {
        newState.player.y = 450;
        newState.player.vy = 0;
      }
      if (newState.enemy.y >= 450) {
        newState.enemy.y = 450;
        newState.enemy.vy = 0;
      }

      // Keep in bounds
      newState.player.x = Math.max(50, Math.min(750, newState.player.x));
      newState.enemy.x = Math.max(50, Math.min(750, newState.enemy.x));

      // Update stun
      if (newState.player.stunned > 0) newState.player.stunned--;
      if (newState.enemy.stunned > 0) newState.enemy.stunned--;

      // Enemy AI
      const distance = Math.abs(newState.enemy.x - newState.player.x);
      
      if (newState.enemy.stunned <= 0) {
        if (distance > 200) {
          newState.enemy.vx = newState.player.x > newState.enemy.x ? 2 : -2;
          newState.enemy.facing = newState.player.x > newState.enemy.x ? 1 : -1;
        } else if (distance > 100) {
          newState.enemy.vx = 0;
          
          // Enemy attacks
          if (currentTime - newState.enemy.lastAttack > 1000 && newState.enemy.energy >= 20) {
            newState.projectiles.push({
              x: newState.enemy.x + newState.enemy.facing * 30,
              y: newState.enemy.y,
              vx: newState.enemy.facing * 6,
              vy: 0,
              damage: 20,
              type: 'pulse',
              life: 80
            });
            
            newState.enemy.energy -= 20;
            newState.enemy.lastAttack = currentTime;
          }
        } else {
          // Too close, back away
          newState.enemy.vx = newState.player.x > newState.enemy.x ? -3 : 3;
        }
        
        // Enemy hologram ability
        if (Math.random() < 0.003 && newState.enemy.energy >= 40) {
          createHologram(newState.enemy);
          newState.enemy.isHologram = true;
          newState.enemy.energy -= 40;
          
          setTimeout(() => {
            setGameState(s => ({ ...s, enemy: { ...s.enemy, isHologram: false } }));
          }, 1500);
        }
      } else {
        newState.enemy.vx *= 0.9;
      }

      // Update projectiles
      newState.projectiles = newState.projectiles.filter(projectile => {
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;
        projectile.life--;

        if (projectile.x < 0 || projectile.x > canvas.width || projectile.life <= 0) {
          return false;
        }

        // Player hit by enemy projectile
        if (Math.hypot(projectile.x - newState.player.x, projectile.y - newState.player.y) < 30) {
          if (!newState.player.isHologram) {
            newState.player.health -= projectile.damage;
            newState.player.stunned = 30;
            if (newState.player.health <= 0) {
              newState.gameOver = true;
            }
          }
          return false;
        }

        // Enemy hit by player projectile
        if (Math.hypot(projectile.x - newState.enemy.x, projectile.y - newState.enemy.y) < 30) {
          if (!newState.enemy.isHologram) {
            newState.enemy.health -= projectile.damage;
            newState.enemy.stunned = 20;
            newState.score += 50;
            if (newState.enemy.health <= 0) {
              newState.roundWon = true;
            }
          }
          return false;
        }

        return true;
      });

      // Update holograms
      newState.holograms = newState.holograms.map(hologram => ({
        ...hologram,
        life: hologram.life - 1,
        alpha: (hologram.life / 120) * 0.6
      })).filter(hologram => hologram.life > 0);

      // Regenerate energy
      if (newState.player.energy < 100) {
        newState.player.energy = Math.min(100, newState.player.energy + 0.5);
      }
      if (newState.enemy.energy < 100) {
        newState.enemy.energy = Math.min(100, newState.enemy.energy + 0.3);
      }

      return newState;
    });

    // Draw holographic grid
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
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

    // Draw arena platform
    ctx.fillStyle = '#333366';
    ctx.fillRect(0, 470, canvas.width, 20);
    ctx.strokeStyle = '#6666aa';
    ctx.strokeRect(0, 470, canvas.width, 20);

    // Draw holograms
    gameState.holograms.forEach(hologram => {
      ctx.globalAlpha = hologram.alpha;
      ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 15;
      
      ctx.save();
      ctx.translate(hologram.x, hologram.y);
      ctx.scale(hologram.facing, 1);
      ctx.fillRect(-15, -25, 30, 50);
      ctx.restore();
      
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });

    // Draw projectiles
    gameState.projectiles.forEach(projectile => {
      let color = '#ffff00';
      
      switch (projectile.type) {
        case 'beam': color = '#0aff9d'; break;
        case 'pulse': color = '#ff0099'; break;
        case 'wave': color = '#7000ff'; break;
      }
      
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      
      if (projectile.type === 'beam') {
        ctx.fillRect(projectile.x - 10, projectile.y - 2, 20, 4);
      } else {
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.shadowBlur = 0;
    });

    // Draw fighters
    const drawFighter = (fighter: Fighter, isPlayer = false) => {
      const alpha = fighter.isHologram ? 0.5 : (fighter.stunned > 0 ? 0.7 : 1.0);
      ctx.globalAlpha = alpha;
      
      const color = isPlayer ? '#0aff9d' : '#ff6600';
      ctx.fillStyle = fighter.isHologram ? '#00ffff' : color;
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = fighter.isHologram ? 20 : 10;
      
      ctx.save();
      ctx.translate(fighter.x, fighter.y);
      ctx.scale(fighter.facing, 1);
      
      // Body
      ctx.fillRect(-15, -25, 30, 50);
      
      // Energy indicator
      if (isPlayer) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-20, -35, 40, 4);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(-20, -35, (fighter.energy / 100) * 40, 4);
      }
      
      ctx.restore();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    };

    drawFighter(gameState.player, true);
    drawFighter(gameState.enemy, false);

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText(`P1 Health: ${Math.floor(gameState.player.health)}`, 10, 30);
    ctx.fillText(`P2 Health: ${Math.floor(gameState.enemy.health)}`, 10, 55);
    ctx.fillText(`Score: ${gameState.score}`, 10, 80);
    ctx.fillText(`Round: ${gameState.round}`, 10, 105);

    // Health bars
    const drawHealthBar = (x: number, y: number, health: number, isPlayer = false) => {
      ctx.fillStyle = '#333333';
      ctx.fillRect(x, y, 200, 20);
      ctx.fillStyle = isPlayer ? '#00ff00' : '#ff0000';
      ctx.fillRect(x, y, (health / 100) * 200, 20);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(x, y, 200, 20);
    };

    drawHealthBar(50, 550, gameState.player.health, true);
    drawHealthBar(550, 550, gameState.enemy.health, false);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '12px monospace';
    ctx.fillText('AD: Move | W/Space: Jump | X: Attack | Q: Hologram', 10, canvas.height - 10);

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DEFEATED', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px monospace';
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 50);
    }

    if (gameState.roundWon) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0aff9d';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ROUND WON', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px monospace';
      ctx.fillText('Press N for next round', canvas.width / 2, canvas.height / 2 + 50);
    }

    ctx.textAlign = 'left';
  }, [gameState]);

  useEffect(() => {
    gameLoopRef.current = setInterval(gameLoop, 1000 / 60);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      
      if (e.key.toLowerCase() === 'r' && gameState.gameOver) {
        setGameState(prev => ({
          ...prev,
          player: { 
            x: 200, y: 300, vx: 0, vy: 0, health: 100, energy: 100, 
            facing: 1, isHologram: false, lastAttack: 0, stunned: 0 
          },
          enemy: { 
            x: 600, y: 300, vx: 0, vy: 0, health: 100, energy: 100, 
            facing: -1, isHologram: false, lastAttack: 0, stunned: 0 
          },
          projectiles: [],
          holograms: [],
          gameOver: false,
          round: 1
        }));
      }
      
      if (e.key.toLowerCase() === 'n' && gameState.roundWon) {
        setGameState(prev => ({
          ...prev,
          enemy: { 
            ...prev.enemy, 
            health: 100, 
            energy: 100, 
            x: 600, 
            y: 300, 
            vx: 0, 
            vy: 0 
          },
          player: {
            ...prev.player,
            x: 200,
            y: 300,
            vx: 0,
            vy: 0
          },
          projectiles: [],
          holograms: [],
          roundWon: false,
          round: prev.round + 1
        }));
      }
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
  }, [gameState.gameOver, gameState.roundWon]);

  return (
    <GameLayout gameTitle="HoloStrike Duel" gameCategory="Holographic combat arena fighting">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg shadow-2xl"
        />
        <div className="text-center space-y-2">
          <p className="text-gray-300">AD: Move | W/Space: Jump | X: Attack | Q: Hologram</p>
          <p className="text-gray-400">Master holographic combat techniques!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default HoloStrikeDuel;
