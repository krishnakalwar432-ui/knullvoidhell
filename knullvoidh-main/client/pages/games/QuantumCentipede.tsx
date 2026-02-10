import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Player {
  x: number;
  y: number;
  size: number;
}

interface Bullet {
  x: number;
  y: number;
  speed: number;
  active: boolean;
}

interface CentipedeSegment {
  x: number;
  y: number;
  size: number;
  direction: number;
  speed: number;
  phase: number;
  quantumState: 'solid' | 'phasing' | 'quantum';
}

interface Mushroom {
  x: number;
  y: number;
  size: number;
  health: number;
  maxHealth: number;
  type: 'normal' | 'quantum' | 'poison';
  phaseTimer: number;
}

interface Spider {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  points: number;
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

const QuantumCentipede = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const PLAYER_AREA = 150; // Bottom area where player can move
  const GRID_SIZE = 20;

  const [gameState, setGameState] = useState({
    player: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 50,
      size: 15
    } as Player,
    bullets: [] as Bullet[],
    centipede: [] as CentipedeSegment[],
    mushrooms: [] as Mushroom[],
    spiders: [] as Spider[],
    particles: [] as Particle[],
    score: 0,
    lives: 3,
    level: 1,
    gameOver: false,
    nextCentipedeSpawn: 0,
    lastSpiderSpawn: 0,
    quantumPhase: 0,
    gameStarted: false
  });

  const createParticles = (x: number, y: number, color: string, count: number = 8) => {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = Math.random() * 4 + 2;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30, maxLife: 30, color, size: Math.random() * 3 + 1
      });
    }
    return particles;
  };

  const createCentipede = useCallback((length: number = 12) => {
    const segments: CentipedeSegment[] = [];
    const startX = Math.random() < 0.5 ? 0 : CANVAS_WIDTH;
    const direction = startX === 0 ? 1 : -1;
    
    for (let i = 0; i < length; i++) {
      segments.push({
        x: startX - (i * GRID_SIZE * direction),
        y: GRID_SIZE,
        size: 10,
        direction,
        speed: 1 + gameState.level * 0.2,
        phase: i * 0.5,
        quantumState: Math.random() < 0.3 ? 'quantum' : 'solid'
      });
    }
    
    return segments;
  }, [gameState.level]);

  const generateMushrooms = useCallback(() => {
    const mushrooms: Mushroom[] = [];
    const playFieldHeight = CANVAS_HEIGHT - PLAYER_AREA;
    
    for (let i = 0; i < 30 + gameState.level * 5; i++) {
      const x = Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)) * GRID_SIZE + GRID_SIZE / 2;
      const y = Math.floor(Math.random() * (playFieldHeight / GRID_SIZE)) * GRID_SIZE + GRID_SIZE / 2;
      
      // Don't place mushrooms too close to each other
      const tooClose = mushrooms.some(m => 
        Math.abs(m.x - x) < GRID_SIZE * 2 && Math.abs(m.y - y) < GRID_SIZE * 2
      );
      
      if (!tooClose) {
        const type = Math.random() < 0.1 ? 'quantum' : (Math.random() < 0.05 ? 'poison' : 'normal');
        mushrooms.push({
          x, y, size: 8,
          health: type === 'normal' ? 3 : 2,
          maxHealth: type === 'normal' ? 3 : 2,
          type,
          phaseTimer: Math.random() * 360
        });
      }
    }
    
    return mushrooms;
  }, [gameState.level]);

  const spawnSpider = useCallback(() => {
    const side = Math.random() < 0.5 ? -20 : CANVAS_WIDTH + 20;
    return {
      x: side,
      y: CANVAS_HEIGHT - PLAYER_AREA + Math.random() * (PLAYER_AREA - 40),
      vx: side < 0 ? 2 : -2,
      vy: (Math.random() - 0.5) * 3,
      size: 12,
      points: 300
    };
  }, []);

  const checkCollision = (obj1: any, obj2: any) => {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (obj1.size + obj2.size);
  };

  const update = useCallback(() => {
    if (gameState.gameOver || !gameState.gameStarted) return;

    setGameState(prev => {
      const newState = { ...prev };
      const keys = keysRef.current;
      const currentTime = Date.now();
      
      newState.quantumPhase += 0.02;

      // Player movement
      const playerSpeed = 4;
      if (keys.has('a') || keys.has('ArrowLeft')) {
        newState.player.x = Math.max(newState.player.size, newState.player.x - playerSpeed);
      }
      if (keys.has('d') || keys.has('ArrowRight')) {
        newState.player.x = Math.min(CANVAS_WIDTH - newState.player.size, newState.player.x + playerSpeed);
      }
      if (keys.has('w') || keys.has('ArrowUp')) {
        newState.player.y = Math.max(CANVAS_HEIGHT - PLAYER_AREA, newState.player.y - playerSpeed);
      }
      if (keys.has('s') || keys.has('ArrowDown')) {
        newState.player.y = Math.min(CANVAS_HEIGHT - newState.player.size, newState.player.y + playerSpeed);
      }

      // Player shooting
      if (keys.has(' ') && !newState.bullets.some(b => b.active)) {
        newState.bullets.push({
          x: newState.player.x,
          y: newState.player.y - newState.player.size,
          speed: 8,
          active: true
        });
      }

      // Update bullets
      newState.bullets = newState.bullets.filter(bullet => {
        if (!bullet.active) return false;
        
        bullet.y -= bullet.speed;
        
        if (bullet.y < 0) {
          bullet.active = false;
          return false;
        }
        
        return true;
      });

      // Update centipede
      newState.centipede.forEach((segment, index) => {
        segment.phase += 0.1;
        
        // Quantum state changes
        if (segment.quantumState === 'quantum') {
          if (Math.sin(newState.quantumPhase + segment.phase) > 0.5) {
            segment.quantumState = 'phasing';
          }
        } else if (segment.quantumState === 'phasing') {
          if (Math.sin(newState.quantumPhase + segment.phase) <= 0.5) {
            segment.quantumState = 'solid';
          }
        }
        
        // Movement
        segment.x += segment.direction * segment.speed;
        
        // Check collision with mushrooms for direction change
        let shouldTurnDown = false;
        
        if (segment.x <= 0 || segment.x >= CANVAS_WIDTH) {
          shouldTurnDown = true;
        } else {
          // Check mushroom collisions
          newState.mushrooms.forEach(mushroom => {
            if (Math.abs(segment.x - mushroom.x) < GRID_SIZE && 
                Math.abs(segment.y - mushroom.y) < GRID_SIZE) {
              shouldTurnDown = true;
            }
          });
        }
        
        if (shouldTurnDown) {
          segment.direction *= -1;
          segment.y += GRID_SIZE;
          
          // Ensure segment stays in bounds
          if (segment.x <= 0) segment.x = GRID_SIZE;
          if (segment.x >= CANVAS_WIDTH) segment.x = CANVAS_WIDTH - GRID_SIZE;
        }
      });

      // Update spiders
      newState.spiders.forEach(spider => {
        spider.x += spider.vx;
        spider.y += spider.vy;
        
        // Bounce off edges
        if (spider.y < CANVAS_HEIGHT - PLAYER_AREA || spider.y > CANVAS_HEIGHT - 20) {
          spider.vy *= -1;
        }
      });

      // Remove spiders that are off screen
      newState.spiders = newState.spiders.filter(spider => 
        spider.x > -50 && spider.x < CANVAS_WIDTH + 50
      );

      // Spawn spiders occasionally
      if (currentTime - newState.lastSpiderSpawn > 8000 && newState.spiders.length < 2) {
        newState.spiders.push(spawnSpider());
        newState.lastSpiderSpawn = currentTime;
      }

      // Update mushroom quantum states
      newState.mushrooms.forEach(mushroom => {
        mushroom.phaseTimer += 0.05;
        if (mushroom.type === 'quantum') {
          // Quantum mushrooms phase in and out
        }
      });

      // Bullet collisions
      newState.bullets.forEach(bullet => {
        if (!bullet.active) return;
        
        // Check centipede collisions
        newState.centipede.forEach((segment, segIndex) => {
          if (segment.quantumState === 'phasing') return; // Can't hit phasing segments
          
          if (checkCollision(bullet, segment)) {
            bullet.active = false;
            
            // Add explosion particles
            newState.particles.push(...createParticles(segment.x, segment.y, '#00ffff', 8));
            
            // Score based on segment position
            newState.score += (12 - segIndex) * 10;
            
            // Split centipede
            const newCentipede: CentipedeSegment[] = [];
            
            // Keep segments before hit
            for (let i = 0; i < segIndex; i++) {
              newCentipede.push(newState.centipede[i]);
            }
            
            // Keep segments after hit
            for (let i = segIndex + 1; i < newState.centipede.length; i++) {
              newCentipede.push(newState.centipede[i]);
            }
            
            newState.centipede = newCentipede;
            
            // Create mushroom where segment was destroyed
            newState.mushrooms.push({
              x: Math.floor(segment.x / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2,
              y: Math.floor(segment.y / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2,
              size: 8, health: 3, maxHealth: 3, type: 'normal', phaseTimer: 0
            });
          }
        });
        
        // Check mushroom collisions
        newState.mushrooms.forEach(mushroom => {
          if (mushroom.type === 'quantum' && Math.sin(mushroom.phaseTimer) > 0.5) return;
          
          if (checkCollision(bullet, mushroom)) {
            bullet.active = false;
            mushroom.health--;
            
            if (mushroom.health <= 0) {
              newState.score += 5;
              newState.particles.push(...createParticles(mushroom.x, mushroom.y, '#00ff00', 6));
              newState.mushrooms = newState.mushrooms.filter(m => m !== mushroom);
            }
          }
        });
        
        // Check spider collisions
        newState.spiders.forEach(spider => {
          if (checkCollision(bullet, spider)) {
            bullet.active = false;
            newState.score += spider.points;
            newState.particles.push(...createParticles(spider.x, spider.y, '#ff00ff', 10));
            newState.spiders = newState.spiders.filter(s => s !== spider);
          }
        });
      });

      // Check player collisions
      newState.centipede.forEach(segment => {
        if (segment.quantumState !== 'phasing' && checkCollision(newState.player, segment)) {
          newState.lives--;
          newState.particles.push(...createParticles(newState.player.x, newState.player.y, '#ff0000', 12));
          
          if (newState.lives <= 0) {
            newState.gameOver = true;
          } else {
            // Reset player position
            newState.player.x = CANVAS_WIDTH / 2;
            newState.player.y = CANVAS_HEIGHT - 50;
          }
        }
      });

      newState.spiders.forEach(spider => {
        if (checkCollision(newState.player, spider)) {
          newState.lives--;
          newState.particles.push(...createParticles(newState.player.x, newState.player.y, '#ff0000', 12));
          newState.spiders = newState.spiders.filter(s => s !== spider);
          
          if (newState.lives <= 0) {
            newState.gameOver = true;
          }
        }
      });

      // Check if centipede reached bottom
      const centipedeAtBottom = newState.centipede.some(segment => 
        segment.y >= CANVAS_HEIGHT - PLAYER_AREA
      );
      
      if (centipedeAtBottom) {
        newState.lives--;
        if (newState.lives <= 0) {
          newState.gameOver = true;
        }
        
        // Remove centipede segments at bottom
        newState.centipede = newState.centipede.filter(segment => 
          segment.y < CANVAS_HEIGHT - PLAYER_AREA
        );
      }

      // Spawn new centipede if current one is destroyed
      if (newState.centipede.length === 0 && currentTime > newState.nextCentipedeSpawn) {
        newState.centipede = createCentipede(8 + newState.level * 2);
        newState.level++;
        newState.score += 100 * newState.level;
        newState.nextCentipedeSpawn = currentTime + 3000;
      }

      // Update particles
      newState.particles = newState.particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        return particle.life > 0;
      });

      return newState;
    });
  }, [gameState.gameOver, gameState.gameStarted, createCentipede, spawnSpider]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with quantum field background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000022');
    gradient.addColorStop(0.5, '#001144');
    gradient.addColorStop(1, '#000066');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw quantum grid
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw player area separator
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT - PLAYER_AREA);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - PLAYER_AREA);
    ctx.stroke();

    // Draw mushrooms
    gameState.mushrooms.forEach(mushroom => {
      let alpha = 1;
      let color = '#00ff00';
      
      if (mushroom.type === 'quantum') {
        alpha = Math.sin(mushroom.phaseTimer) > 0.5 ? 0.3 : 1;
        color = '#ff00ff';
      } else if (mushroom.type === 'poison') {
        color = '#ff8000';
      }
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(mushroom.x, mushroom.y, mushroom.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Health indicator
      if (mushroom.health < mushroom.maxHealth) {
        const healthPercent = mushroom.health / mushroom.maxHealth;
        ctx.fillStyle = 'red';
        ctx.fillRect(mushroom.x - 10, mushroom.y - 15, 20, 3);
        ctx.fillStyle = 'green';
        ctx.fillRect(mushroom.x - 10, mushroom.y - 15, 20 * healthPercent, 3);
      }
      
      ctx.restore();
    });

    ctx.shadowBlur = 0;

    // Draw centipede
    gameState.centipede.forEach((segment, index) => {
      let alpha = 1;
      let color = '#ffff00';
      
      if (segment.quantumState === 'quantum') {
        color = '#ff00ff';
      } else if (segment.quantumState === 'phasing') {
        alpha = 0.3;
        color = '#00ffff';
      }
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      
      // Segment body
      ctx.beginPath();
      ctx.arc(segment.x, segment.y, segment.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Segment details
      ctx.fillStyle = 'black';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(segment.x - 3, segment.y - 2, 2, 0, Math.PI * 2);
      ctx.arc(segment.x + 3, segment.y - 2, 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Connection to next segment
      if (index < gameState.centipede.length - 1) {
        const nextSegment = gameState.centipede[index + 1];
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(segment.x, segment.y);
        ctx.lineTo(nextSegment.x, nextSegment.y);
        ctx.stroke();
      }
      
      ctx.restore();
    });

    // Draw spiders
    gameState.spiders.forEach(spider => {
      ctx.fillStyle = '#ff00ff';
      ctx.shadowColor = '#ff00ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(spider.x, spider.y, spider.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Spider legs
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const legLength = spider.size + 5;
        ctx.beginPath();
        ctx.moveTo(spider.x, spider.y);
        ctx.lineTo(
          spider.x + Math.cos(angle) * legLength,
          spider.y + Math.sin(angle) * legLength
        );
        ctx.stroke();
      }
    });

    ctx.shadowBlur = 0;

    // Draw bullets
    ctx.fillStyle = '#ffffff';
    gameState.bullets.forEach(bullet => {
      if (bullet.active) {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw particles
    gameState.particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw player
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(gameState.player.x, gameState.player.y, gameState.player.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Player cannon
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillRect(gameState.player.x - 2, gameState.player.y - gameState.player.size, 4, 10);

    // Draw UI
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, 50);
    
    ctx.fillStyle = '#00ffff';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${gameState.score}`, 20, 25);
    ctx.fillText(`Lives: ${gameState.lives}`, 180, 25);
    ctx.fillText(`Level: ${gameState.level}`, 320, 25);

    if (!gameState.gameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#00ffff';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('QUANTUM CENTIPEDE', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.fillText('Press SPACE to start!', canvas.width / 2, canvas.height / 2 + 20);
      ctx.font = '16px Arial';
      ctx.fillText('WASD: Move | Space: Shoot', canvas.width / 2, canvas.height / 2 + 60);
    }

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#ff0080';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.fillStyle = '#00ffff';
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText(`Level Reached: ${gameState.level}`, canvas.width / 2, canvas.height / 2 + 30);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 70);
    }
  }, [gameState]);

  useEffect(() => {
    setGameState(prev => ({
      ...prev,
      centipede: createCentipede(),
      mushrooms: generateMushrooms()
    }));
  }, [createCentipede, generateMushrooms]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' && gameState.gameOver) {
        setGameState({
          player: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 50, size: 15 },
          bullets: [], centipede: createCentipede(), mushrooms: generateMushrooms(),
          spiders: [], particles: [], score: 0, lives: 3, level: 1,
          gameOver: false, nextCentipedeSpawn: 0, lastSpiderSpawn: 0,
          quantumPhase: 0, gameStarted: false
        });
        return;
      }
      
      if (e.key === ' ' && !gameState.gameStarted) {
        setGameState(prev => ({ ...prev, gameStarted: true }));
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
  }, [gameState.gameOver, gameState.gameStarted, createCentipede, generateMushrooms]);

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
    <GameLayout 
      gameTitle="Quantum Centipede" 
      gameCategory="Quantum arcade shooter"
      showMobileControls={true}
    >
      <div className="flex flex-col items-center gap-4 p-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-cyan-400 bg-black rounded-lg max-w-full h-auto"
          style={{ boxShadow: '0 0 20px #00ffff' }}
        />
        <div className="text-center text-gray-300">
          <p>WASD: Move | Space: Shoot | R: Restart</p>
          <p className="text-sm text-cyan-400">Destroy quantum centipedes and mushrooms! Watch for phasing segments!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default QuantumCentipede;
