import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Enemy {
  x: number;
  y: number;
  health: number;
  type: 'ninja' | 'samurai' | 'ronin' | 'master';
  speed: number;
  attackCooldown: number;
  direction: number;
}

interface SlashEffect {
  x: number;
  y: number;
  angle: number;
  length: number;
  width: number;
  life: number;
  color: string;
}

interface CherryBlossom {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  size: number;
}

const TurboKatana = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef({ x: 0, y: 0, down: false });
  
  const [gameState, setGameState] = useState({
    player: { x: 400, y: 300, health: 100, energy: 100, combo: 0, facing: 0 },
    enemies: [] as Enemy[],
    slashEffects: [] as SlashEffect[],
    cherryBlossoms: [] as CherryBlossom[],
    score: 0,
    wave: 1,
    gameOver: false,
    waveComplete: false,
    turboMode: false,
    slashSpeed: 1,
    lastSlash: 0
  });

  const createSlash = (x: number, y: number, angle: number, length: number, color: string) => {
    setGameState(prev => ({
      ...prev,
      slashEffects: [...prev.slashEffects, {
        x, y, angle, length, width: 4, life: 20, color
      }]
    }));
  };

  const addCherryBlossoms = (x: number, y: number, count: number = 5) => {
    const blossoms: CherryBlossom[] = [];
    for (let i = 0; i < count; i++) {
      blossoms.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        rotation: Math.random() * Math.PI * 2,
        size: 3 + Math.random() * 4
      });
    }
    setGameState(prev => ({
      ...prev,
      cherryBlossoms: [...prev.cherryBlossoms, ...blossoms]
    }));
  };

  const spawnEnemies = useCallback((wave: number) => {
    const enemies: Enemy[] = [];
    const canvas = canvasRef.current;
    if (!canvas) return enemies;

    const baseCount = 3 + wave * 2;
    
    for (let i = 0; i < baseCount; i++) {
      const side = Math.floor(Math.random() * 4);
      let x: number, y: number;
      
      switch (side) {
        case 0: x = Math.random() * canvas.width; y = -50; break;
        case 1: x = canvas.width + 50; y = Math.random() * canvas.height; break;
        case 2: x = Math.random() * canvas.width; y = canvas.height + 50; break;
        default: x = -50; y = Math.random() * canvas.height; break;
      }
      
      let type: Enemy['type'] = 'ninja';
      let health = 50;
      let speed = 2;
      
      if (wave > 2 && Math.random() < 0.3) {
        type = 'samurai';
        health = 80;
        speed = 1.5;
      }
      if (wave > 4 && Math.random() < 0.2) {
        type = 'ronin';
        health = 100;
        speed = 2.5;
      }
      if (wave > 6 && Math.random() < 0.1) {
        type = 'master';
        health = 150;
        speed = 1.2;
      }

      enemies.push({
        x, y, health, type, speed,
        attackCooldown: 0,
        direction: Math.atan2(300 - y, 400 - x)
      });
    }

    return enemies;
  }, []);

  const initializeGame = useCallback(() => {
    const enemies = spawnEnemies(gameState.wave);
    setGameState(prev => ({
      ...prev,
      player: { x: 400, y: 300, health: 100, energy: 100, combo: 0, facing: 0 },
      enemies,
      slashEffects: [],
      cherryBlossoms: [],
      gameOver: false,
      waveComplete: false,
      turboMode: false,
      slashSpeed: 1,
      lastSlash: 0
    }));
  }, [gameState.wave, spawnEnemies]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.gameOver) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with Japanese garden background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#2a1810');
    gradient.addColorStop(0.5, '#1a1010');
    gradient.addColorStop(1, '#0a0505');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setGameState(prev => {
      const newState = { ...prev };
      const currentTime = Date.now();

      // Handle player movement
      const speed = newState.turboMode ? 8 : 5;
      
      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) {
        newState.player.x = Math.max(20, newState.player.x - speed);
        newState.player.facing = Math.PI;
      }
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) {
        newState.player.x = Math.min(canvas.width - 20, newState.player.x + speed);
        newState.player.facing = 0;
      }
      if (keysRef.current.has('ArrowUp') || keysRef.current.has('w')) {
        newState.player.y = Math.max(20, newState.player.y - speed);
        newState.player.facing = -Math.PI / 2;
      }
      if (keysRef.current.has('ArrowDown') || keysRef.current.has('s')) {
        newState.player.y = Math.min(canvas.height - 20, newState.player.y + speed);
        newState.player.facing = Math.PI / 2;
      }

      // Mouse katana slash
      if (mouseRef.current.down && currentTime - newState.lastSlash > (200 / newState.slashSpeed)) {
        const angle = Math.atan2(
          mouseRef.current.y - newState.player.y,
          mouseRef.current.x - newState.player.x
        );
        
        const slashLength = 80;
        const color = newState.turboMode ? '#ffff00' : 
                     newState.player.combo > 5 ? '#ff0099' : '#ff6600';
        
        createSlash(newState.player.x, newState.player.y, angle, slashLength, color);
        
        // Check for enemy hits in slash range
        let hitCount = 0;
        newState.enemies = newState.enemies.filter(enemy => {
          const dx = enemy.x - newState.player.x;
          const dy = enemy.y - newState.player.y;
          const distance = Math.hypot(dx, dy);
          const enemyAngle = Math.atan2(dy, dx);
          const angleDiff = Math.abs(enemyAngle - angle);
          
          if (distance < slashLength && angleDiff < 0.8) {
            const damage = newState.turboMode ? 60 : 40;
            enemy.health -= damage;
            hitCount++;
            
            if (enemy.health <= 0) {
              newState.score += enemy.type === 'master' ? 500 : 
                               enemy.type === 'ronin' ? 300 :
                               enemy.type === 'samurai' ? 200 : 100;
              newState.player.combo++;
              addCherryBlossoms(enemy.x, enemy.y, 8);
              return false;
            } else {
              addCherryBlossoms(enemy.x, enemy.y, 3);
            }
          }
          return true;
        });
        
        if (hitCount > 0) {
          newState.player.energy = Math.min(100, newState.player.energy + hitCount * 5);
        }
        
        // Combo system
        if (newState.player.combo > 10 && !newState.turboMode) {
          newState.turboMode = true;
          newState.slashSpeed = 3;
          setTimeout(() => {
            setGameState(s => ({ ...s, turboMode: false, slashSpeed: 1 }));
          }, 5000);
        }
        
        newState.lastSlash = currentTime;
        mouseRef.current.down = false;
      }

      // Update enemies
      newState.enemies = newState.enemies.map(enemy => {
        const updatedEnemy = { ...enemy };
        
        // Move towards player
        const dx = newState.player.x - enemy.x;
        const dy = newState.player.y - enemy.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance > 0) {
          updatedEnemy.x += (dx / distance) * enemy.speed;
          updatedEnemy.y += (dy / distance) * enemy.speed;
          updatedEnemy.direction = Math.atan2(dy, dx);
        }

        // Enemy attacks
        if (updatedEnemy.attackCooldown > 0) {
          updatedEnemy.attackCooldown--;
        }

        if (distance < 50 && updatedEnemy.attackCooldown === 0) {
          const damage = enemy.type === 'master' ? 30 : enemy.type === 'ronin' ? 25 : 20;
          newState.player.health -= damage;
          updatedEnemy.attackCooldown = enemy.type === 'ninja' ? 40 : 60;
          
          // Create enemy slash effect
          createSlash(enemy.x, enemy.y, updatedEnemy.direction, 60, '#ff0099');
          
          if (newState.player.health <= 0) {
            newState.gameOver = true;
          }
          
          // Reset combo on hit
          newState.player.combo = Math.max(0, newState.player.combo - 2);
        }

        return updatedEnemy;
      });

      // Update slash effects
      newState.slashEffects = newState.slashEffects.map(slash => ({
        ...slash,
        life: slash.life - 1,
        width: slash.width + 0.5,
        length: slash.length + 2
      })).filter(slash => slash.life > 0);

      // Update cherry blossoms
      newState.cherryBlossoms = newState.cherryBlossoms.map(blossom => ({
        ...blossom,
        x: blossom.x + blossom.vx,
        y: blossom.y + blossom.vy,
        vx: blossom.vx * 0.98,
        vy: blossom.vy * 0.98 + 0.1, // gravity
        rotation: blossom.rotation + 0.1,
        size: blossom.size * 0.995
      })).filter(blossom => blossom.y < canvas.height + 50 && blossom.size > 1);

      // Spawn ambient cherry blossoms
      if (Math.random() < 0.05) {
        newState.cherryBlossoms.push({
          x: Math.random() * canvas.width,
          y: -10,
          vx: (Math.random() - 0.5) * 2,
          vy: 1 + Math.random() * 2,
          rotation: Math.random() * Math.PI * 2,
          size: 2 + Math.random() * 3
        });
      }

      // Check wave completion
      if (newState.enemies.length === 0 && !newState.waveComplete) {
        newState.waveComplete = true;
      }

      // Regenerate energy slowly
      if (newState.player.energy < 100) {
        newState.player.energy = Math.min(100, newState.player.energy + 0.2);
      }

      // Combo decay
      if (newState.player.combo > 0) {
        newState.player.combo = Math.max(0, newState.player.combo - 0.01);
      }

      return newState;
    });

    // Draw bamboo background
    ctx.strokeStyle = 'rgba(0, 100, 0, 0.3)';
    ctx.lineWidth = 8;
    for (let i = 0; i < 5; i++) {
      const x = (i + 1) * (canvas.width / 6);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Draw cherry blossoms
    gameState.cherryBlossoms.forEach(blossom => {
      ctx.save();
      ctx.translate(blossom.x, blossom.y);
      ctx.rotate(blossom.rotation);
      
      ctx.fillStyle = '#ffb3d9';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const x = Math.cos(angle) * blossom.size;
        const y = Math.sin(angle) * blossom.size;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    });

    // Draw slash effects
    gameState.slashEffects.forEach(slash => {
      const alpha = slash.life / 20;
      ctx.globalAlpha = alpha;
      
      ctx.strokeStyle = slash.color;
      ctx.lineWidth = slash.width;
      ctx.shadowColor = slash.color;
      ctx.shadowBlur = 15;
      
      ctx.beginPath();
      ctx.moveTo(slash.x, slash.y);
      ctx.lineTo(
        slash.x + Math.cos(slash.angle) * slash.length,
        slash.y + Math.sin(slash.angle) * slash.length
      );
      ctx.stroke();
      
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });

    // Draw enemies
    gameState.enemies.forEach(enemy => {
      let color = '#666666';
      let size = 12;
      
      switch (enemy.type) {
        case 'ninja':
          color = '#4a4a8a';
          size = 10;
          break;
        case 'samurai':
          color = '#8a4a4a';
          size = 15;
          break;
        case 'ronin':
          color = '#4a8a4a';
          size = 13;
          break;
        case 'master':
          color = '#8a8a4a';
          size = 18;
          break;
      }
      
      // Enemy body
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(enemy.direction);
      
      // Draw enemy as a simple katana-wielding figure
      ctx.fillRect(-size/2, -size/3, size, size*2/3);
      
      // Katana
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(size/2, 0);
      ctx.lineTo(size * 1.5, 0);
      ctx.stroke();
      
      ctx.restore();
      ctx.shadowBlur = 0;
      
      // Health bar for stronger enemies
      if (enemy.type !== 'ninja') {
        const maxHealth = enemy.type === 'master' ? 150 : 
                         enemy.type === 'ronin' ? 100 : 80;
        ctx.fillStyle = '#333333';
        ctx.fillRect(enemy.x - 15, enemy.y - 25, 30, 4);
        ctx.fillStyle = '#ff0000';
        const healthPercent = enemy.health / maxHealth;
        ctx.fillRect(enemy.x - 15, enemy.y - 25, 30 * healthPercent, 4);
      }
    });

    // Draw player
    const playerColor = gameState.turboMode ? '#ffff00' : 
                       gameState.player.combo > 5 ? '#ff0099' : '#ff6600';
    
    ctx.fillStyle = playerColor;
    ctx.shadowColor = playerColor;
    ctx.shadowBlur = gameState.turboMode ? 25 : 15;
    
    ctx.save();
    ctx.translate(gameState.player.x, gameState.player.y);
    ctx.rotate(gameState.player.facing);
    
    // Player body
    ctx.fillRect(-10, -8, 20, 16);
    
    // Katana
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(25, 0);
    ctx.stroke();
    
    ctx.restore();
    ctx.shadowBlur = 0;

    // Combo aura
    if (gameState.player.combo > 3) {
      ctx.strokeStyle = playerColor;
      ctx.lineWidth = gameState.player.combo / 2;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(gameState.player.x, gameState.player.y, 30 + gameState.player.combo, 0, Math.PI * 2);
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
    ctx.fillText(`Combo: ${Math.floor(gameState.player.combo)}x`, 10, 105);

    if (gameState.turboMode) {
      ctx.fillStyle = '#ffff00';
      ctx.font = '20px monospace';
      ctx.fillText('TURBO KATANA MODE!', 10, 130);
    }

    // Japanese-style UI elements
    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth = 2;
    ctx.strokeRect(5, 5, 200, 140);

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('名誉の死', canvas.width / 2, canvas.height / 2 - 20); // Honorable Death
      ctx.font = '24px monospace';
      ctx.fillText('HONORABLE DEATH', canvas.width / 2, canvas.height / 2 + 10);
      ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 40);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 70);
    }

    if (gameState.waveComplete) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff6600';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('勝利', canvas.width / 2, canvas.height / 2 - 20); // Victory
      ctx.font = '24px monospace';
      ctx.fillText('VICTORY', canvas.width / 2, canvas.height / 2 + 10);
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
      gameTitle="Turbo Katana"
      gameCategory="High-speed katana slashing action"
    >
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg shadow-2xl"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        <div className="text-center space-y-2">
          <p className="text-gray-300">WASD: Move | Mouse: Aim & Slash</p>
          <p className="text-gray-400">Build combos for Turbo Mode! Honor the way of the sword!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default TurboKatana;
