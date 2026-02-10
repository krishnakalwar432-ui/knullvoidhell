import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Enemy {
  x: number;
  y: number;
  health: number;
  type: 'drone' | 'heavy' | 'ninja' | 'boss';
  speed: number;
  attackCooldown: number;
  direction: number;
}

interface Slash {
  x: number;
  y: number;
  angle: number;
  length: number;
  damage: number;
  life: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface ComboMove {
  name: string;
  keys: string[];
  damage: number;
  range: number;
  color: string;
}

const WiredBladeSpeedKill = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());
  const keySequence = useRef<string[]>([]);
  
  const [gameState, setGameState] = useState({
    player: { x: 400, y: 300, health: 100, energy: 100, combo: 0, speed: 6 },
    enemies: [] as Enemy[],
    slashes: [] as Slash[],
    particles: [] as Particle[],
    score: 0,
    wave: 1,
    gameOver: false,
    waveComplete: false,
    speedMode: false,
    wireFrame: false,
    killStreak: 0
  });

  const comboMoves: ComboMove[] = [
    { name: 'Quick Slash', keys: ['x'], damage: 30, range: 80, color: '#0aff9d' },
    { name: 'Power Strike', keys: ['z', 'x'], damage: 60, range: 100, color: '#ff0099' },
    { name: 'Spin Attack', keys: ['a', 's', 'd'], damage: 45, range: 120, color: '#7000ff' },
    { name: 'Lightning Dash', keys: ['w', 'w', 'x'], damage: 80, range: 150, color: '#ffff00' },
    { name: 'Void Cutter', keys: ['s', 'x', 'z'], damage: 100, range: 200, color: '#ff6600' }
  ];

  const addParticles = (x: number, y: number, color: string, count: number = 8) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 20 + Math.random() * 20,
        color
      });
    }
    setGameState(prev => ({
      ...prev,
      particles: [...prev.particles, ...newParticles]
    }));
  };

  const createSlash = (x: number, y: number, angle: number, move: ComboMove) => {
    setGameState(prev => ({
      ...prev,
      slashes: [...prev.slashes, {
        x, y, angle, 
        length: move.range,
        damage: move.damage,
        life: 10,
        color: move.color
      }]
    }));
  };

  const checkComboInput = useCallback(() => {
    const sequence = keySequence.current.slice(-4); // Check last 4 keys
    
    for (const move of comboMoves) {
      if (sequence.length >= move.keys.length) {
        const recentKeys = sequence.slice(-move.keys.length);
        if (JSON.stringify(recentKeys) === JSON.stringify(move.keys)) {
          return move;
        }
      }
    }
    return null;
  }, []);

  const spawnEnemies = useCallback((wave: number) => {
    const enemies: Enemy[] = [];
    const canvas = canvasRef.current;
    if (!canvas) return enemies;

    const baseCount = 4 + wave * 2;
    
    for (let i = 0; i < baseCount; i++) {
      const angle = (i / baseCount) * Math.PI * 2;
      const distance = 250 + Math.random() * 200;
      
      let type: Enemy['type'] = 'drone';
      let health = 40;
      let speed = 1.5;
      
      if (wave > 2 && Math.random() < 0.3) {
        type = 'heavy';
        health = 80;
        speed = 1;
      }
      if (wave > 4 && Math.random() < 0.2) {
        type = 'ninja';
        health = 50;
        speed = 3;
      }
      if (wave > 6 && Math.random() < 0.1) {
        type = 'boss';
        health = 150;
        speed = 0.8;
      }

      enemies.push({
        x: 400 + Math.cos(angle) * distance,
        y: 300 + Math.sin(angle) * distance,
        health,
        type,
        speed,
        attackCooldown: 0,
        direction: angle
      });
    }

    return enemies;
  }, []);

  const initializeGame = useCallback(() => {
    const enemies = spawnEnemies(gameState.wave);
    setGameState(prev => ({
      ...prev,
      player: { x: 400, y: 300, health: 100, energy: 100, combo: 0, speed: 6 },
      enemies,
      slashes: [],
      particles: [],
      gameOver: false,
      waveComplete: false,
      killStreak: 0
    }));
  }, [gameState.wave, spawnEnemies]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.gameOver) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with cyberpunk effect
    if (gameState.wireFrame) {
      ctx.fillStyle = '#000011';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#1a0033');
      gradient.addColorStop(0.5, '#0a001a');
      gradient.addColorStop(1, '#330011');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    setGameState(prev => {
      const newState = { ...prev };

      // Handle player movement
      const speed = newState.speedMode ? newState.player.speed * 1.5 : newState.player.speed;
      
      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) {
        newState.player.x = Math.max(20, newState.player.x - speed);
      }
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) {
        newState.player.x = Math.min(canvas.width - 20, newState.player.x + speed);
      }
      if (keysRef.current.has('ArrowUp') || keysRef.current.has('w')) {
        newState.player.y = Math.max(20, newState.player.y - speed);
      }
      if (keysRef.current.has('ArrowDown') || keysRef.current.has('s')) {
        newState.player.y = Math.min(canvas.height - 20, newState.player.y + speed);
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
        }

        // Enemy attacks
        if (updatedEnemy.attackCooldown > 0) {
          updatedEnemy.attackCooldown--;
        }

        if (distance < 50 && updatedEnemy.attackCooldown === 0) {
          newState.player.health -= enemy.type === 'boss' ? 25 : enemy.type === 'heavy' ? 20 : 15;
          updatedEnemy.attackCooldown = enemy.type === 'ninja' ? 30 : 60;
          addParticles(newState.player.x, newState.player.y, '#ff0099', 6);
          
          if (newState.player.health <= 0) {
            newState.gameOver = true;
          }
        }

        return updatedEnemy;
      });

      // Update slashes
      newState.slashes = newState.slashes.map(slash => ({
        ...slash,
        life: slash.life - 1,
        length: slash.length + 5
      })).filter(slash => slash.life > 0);

      // Check slash-enemy collisions
      newState.slashes.forEach(slash => {
        newState.enemies = newState.enemies.filter(enemy => {
          const dx = enemy.x - slash.x;
          const dy = enemy.y - slash.y;
          const distance = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);
          const angleDiff = Math.abs(angle - slash.angle);
          
          if (distance < slash.length && angleDiff < 0.5) {
            enemy.health -= slash.damage;
            addParticles(enemy.x, enemy.y, slash.color, 10);
            
            if (enemy.health <= 0) {
              newState.score += enemy.type === 'boss' ? 500 : enemy.type === 'heavy' ? 200 : 100;
              newState.player.combo++;
              newState.killStreak++;
              addParticles(enemy.x, enemy.y, '#ffff00', 15);
              
              // Combo bonus
              if (newState.player.combo > 3) {
                newState.score += newState.player.combo * 50;
                newState.speedMode = true;
                setTimeout(() => {
                  setGameState(s => ({ ...s, speedMode: false }));
                }, 2000);
              }
              
              return false;
            }
          }
          return true;
        });
      });

      // Update particles
      newState.particles = newState.particles.map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        vx: particle.vx * 0.95,
        vy: particle.vy * 0.95,
        life: particle.life - 1
      })).filter(particle => particle.life > 0);

      // Check wave completion
      if (newState.enemies.length === 0 && !newState.waveComplete) {
        newState.waveComplete = true;
        newState.player.energy = 100; // Restore energy
      }

      // Regenerate energy
      if (newState.player.energy < 100) {
        newState.player.energy = Math.min(100, newState.player.energy + 0.5);
      }

      // Reset combo if no kills for a while
      if (newState.killStreak === 0) {
        newState.player.combo = Math.max(0, newState.player.combo - 0.02);
      }

      return newState;
    });

    // Draw wireframe grid if active
    if (gameState.wireFrame) {
      ctx.strokeStyle = 'rgba(0, 255, 153, 0.3)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    // Draw particles
    gameState.particles.forEach(particle => {
      ctx.globalAlpha = particle.life / 40;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Draw slashes
    gameState.slashes.forEach(slash => {
      const alpha = slash.life / 10;
      ctx.globalAlpha = alpha;
      
      ctx.strokeStyle = slash.color;
      ctx.lineWidth = 4;
      ctx.shadowColor = slash.color;
      ctx.shadowBlur = 20;
      
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
      let color = '#ff6600';
      let size = 12;
      
      switch (enemy.type) {
        case 'heavy':
          color = '#ff0099';
          size = 18;
          break;
        case 'ninja':
          color = '#7000ff';
          size = 10;
          break;
        case 'boss':
          color = '#ffff00';
          size = 25;
          break;
      }
      
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      
      if (gameState.wireFrame) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(enemy.x - size/2, enemy.y - size/2, size, size);
      } else {
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.shadowBlur = 0;
      
      // Health bar for bosses
      if (enemy.type === 'boss') {
        ctx.fillStyle = '#333333';
        ctx.fillRect(enemy.x - 25, enemy.y - 35, 50, 6);
        ctx.fillStyle = '#00ff00';
        const healthPercent = enemy.health / 150;
        ctx.fillRect(enemy.x - 25, enemy.y - 35, 50 * healthPercent, 6);
      }
    });

    // Draw player
    const playerColor = gameState.speedMode ? '#ffff00' : 
                       gameState.player.combo > 5 ? '#ff0099' : '#0aff9d';
    
    ctx.fillStyle = playerColor;
    ctx.shadowColor = playerColor;
    ctx.shadowBlur = gameState.speedMode ? 30 : 20;
    
    if (gameState.wireFrame) {
      ctx.strokeStyle = playerColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(gameState.player.x - 10, gameState.player.y - 10, 20, 20);
    } else {
      ctx.fillRect(gameState.player.x - 10, gameState.player.y - 10, 20, 20);
    }
    
    ctx.shadowBlur = 0;

    // Draw combo trail
    if (gameState.player.combo > 2) {
      ctx.strokeStyle = playerColor;
      ctx.lineWidth = gameState.player.combo;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(gameState.player.x, gameState.player.y, 30 + gameState.player.combo * 2, 0, Math.PI * 2);
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
    ctx.fillText(`Streak: ${gameState.killStreak}`, 10, 125);

    if (gameState.speedMode) {
      ctx.fillStyle = '#ffff00';
      ctx.font = '20px monospace';
      ctx.fillText('SPEED MODE!', 10, 150);
    }

    // Combo moves display
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '12px monospace';
    ctx.fillText('Combos:', canvas.width - 200, 25);
    comboMoves.forEach((move, index) => {
      ctx.fillStyle = move.color;
      ctx.fillText(`${move.keys.join('')}: ${move.name}`, canvas.width - 200, 45 + index * 20);
    });

    // Key sequence display
    if (keySequence.current.length > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px monospace';
      ctx.fillText(`Keys: ${keySequence.current.slice(-6).join('')}`, canvas.width - 200, 180);
    }

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BLADE BROKEN', canvas.width / 2, canvas.height / 2);
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
      ctx.fillText('SPEED KILL COMPLETE', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px monospace';
      ctx.fillText('Press N for next wave', canvas.width / 2, canvas.height / 2 + 40);
    }

    ctx.textAlign = 'left';
  }, [gameState, checkComboInput]);

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
      
      // Track key sequence for combos
      if (['w', 'a', 's', 'd', 'x', 'z'].includes(key)) {
        keySequence.current.push(key);
        if (keySequence.current.length > 10) {
          keySequence.current = keySequence.current.slice(-10);
        }
        
        // Check for combo
        const combo = checkComboInput();
        if (combo && gameState.player.energy >= combo.damage / 2) {
          setGameState(prev => ({
            ...prev,
            player: {
              ...prev.player,
              energy: prev.player.energy - combo.damage / 2
            }
          }));
          
          // Create slash in direction of nearest enemy
          const canvas = canvasRef.current;
          if (canvas) {
            let angle = 0;
            let minDistance = Infinity;
            
            gameState.enemies.forEach(enemy => {
              const distance = Math.hypot(
                enemy.x - gameState.player.x,
                enemy.y - gameState.player.y
              );
              if (distance < minDistance) {
                minDistance = distance;
                angle = Math.atan2(
                  enemy.y - gameState.player.y,
                  enemy.x - gameState.player.x
                );
              }
            });
            
            createSlash(gameState.player.x, gameState.player.y, angle, combo);
            addParticles(gameState.player.x, gameState.player.y, combo.color, 12);
          }
        }
      }
      
      if (key === 'r' && gameState.gameOver) {
        setGameState(prev => ({ ...prev, wave: 1 }));
        initializeGame();
      }
      
      if (key === 'n' && gameState.waveComplete) {
        setGameState(prev => ({ ...prev, wave: prev.wave + 1, waveComplete: false }));
        initializeGame();
      }
      
      if (key === 'f') {
        setGameState(prev => ({ ...prev, wireFrame: !prev.wireFrame }));
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
  }, [gameState.gameOver, gameState.waveComplete, gameState.player.energy, 
      gameState.enemies, gameState.player.x, gameState.player.y, 
      initializeGame, checkComboInput]);

  return (
    <GameLayout
      gameTitle="Wired Blade: Speed Kill"
      gameCategory="Ultra-fast cyberpunk sword combat"
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
          <p className="text-gray-300">WASD: Move | X/Z: Attack | Combos: Chain keys for special moves</p>
          <p className="text-gray-400">F: Toggle wireframe | Master combo moves for maximum speed!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default WiredBladeSpeedKill;
