import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Player {
  x: number;
  y: number;
  health: number;
  weapon: 'laser' | 'plasma' | 'pulse';
  ammo: number;
  shield: number;
}

interface Enemy {
  id: string;
  x: number;
  y: number;
  health: number;
  type: 'scout' | 'fighter' | 'boss';
  speed: number;
  color: string;
  size: number;
}

interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  color: string;
  isPlayer: boolean;
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

interface PowerUp {
  x: number;
  y: number;
  type: 'health' | 'ammo' | 'shield' | 'weapon_upgrade';
  collected: boolean;
  color: string;
  pulse: number;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

export default function SynthwaveShooter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [player, setPlayer] = useState<Player>({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 80,
    health: 100,
    weapon: 'laser',
    ammo: 100,
    shield: 0
  });
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [keys, setKeys] = useState<{[key: string]: boolean}>({});
  const [wave, setWave] = useState(1);
  const [waveEnemies, setWaveEnemies] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [synthwave, setSynthwave] = useState({ phase: 0, intensity: 0.5 });
  const enemyIdRef = useRef(0);
  const bulletIdRef = useRef(0);

  const spawnEnemy = useCallback(() => {
    const types = [
      { type: 'scout' as const, health: 30, speed: 2, color: '#ff0099', size: 15 },
      { type: 'fighter' as const, health: 60, speed: 1.5, color: '#7000ff', size: 20 },
      { type: 'boss' as const, health: 150, speed: 1, color: '#ff6600', size: 30 }
    ];
    
    const enemyType = wave > 5 && Math.random() < 0.1 ? types[2] : 
                     wave > 3 && Math.random() < 0.3 ? types[1] : types[0];
    
    const newEnemy: Enemy = {
      id: `enemy-${enemyIdRef.current++}`,
      x: Math.random() * (GAME_WIDTH - enemyType.size),
      y: -enemyType.size,
      health: enemyType.health + wave * 5,
      type: enemyType.type,
      speed: enemyType.speed + wave * 0.1,
      color: enemyType.color,
      size: enemyType.size
    };
    
    setEnemies(prev => [...prev, newEnemy]);
    setWaveEnemies(prev => prev + 1);
  }, [wave]);

  const spawnBullet = useCallback((x: number, y: number, vx: number, vy: number, isPlayer: boolean) => {
    const bulletTypes = {
      laser: { damage: 25, color: '#00ffff', speed: 8 },
      plasma: { damage: 40, color: '#ff0099', speed: 6 },
      pulse: { damage: 60, color: '#ffff00', speed: 10 }
    };
    
    const bulletType = isPlayer ? bulletTypes[player.weapon] : bulletTypes.laser;
    
    const newBullet: Bullet = {
      id: `bullet-${bulletIdRef.current++}`,
      x, y, vx: vx * bulletType.speed, vy: vy * bulletType.speed,
      damage: bulletType.damage,
      color: bulletType.color,
      isPlayer
    };
    
    setBullets(prev => [...prev, newBullet]);
    
    if (isPlayer && player.ammo > 0) {
      setPlayer(prev => ({ ...prev, ammo: prev.ammo - 1 }));
    }
  }, [player.weapon, player.ammo]);

  const createParticles = useCallback((x: number, y: number, color: string, count: number = 8) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 2,
        life: 30 + Math.random() * 30,
        color,
        size: 2 + Math.random() * 4
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const spawnPowerUp = useCallback(() => {
    const types = [
      { type: 'health' as const, color: '#00ff00' },
      { type: 'ammo' as const, color: '#ffff00' },
      { type: 'shield' as const, color: '#0066ff' },
      { type: 'weapon_upgrade' as const, color: '#ff00ff' }
    ];
    
    const powerUpType = types[Math.floor(Math.random() * types.length)];
    
    const newPowerUp: PowerUp = {
      x: Math.random() * (GAME_WIDTH - 30),
      y: Math.random() * (GAME_HEIGHT / 2),
      type: powerUpType.type,
      collected: false,
      color: powerUpType.color,
      pulse: 0
    };
    
    setPowerUps(prev => [...prev, newPowerUp]);
  }, []);

  const gameLoop = useCallback(() => {
    if (!isPlaying || isPaused) return;

    setGameTime(prev => prev + 1);
    setSynthwave(prev => ({ 
      phase: prev.phase + 0.05, 
      intensity: 0.3 + Math.sin(prev.phase) * 0.3 
    }));

    // Player movement
    setPlayer(prev => {
      let newX = prev.x;
      let newY = prev.y;

      if (keys['ArrowLeft'] || keys['a']) newX -= 5;
      if (keys['ArrowRight'] || keys['d']) newX += 5;
      if (keys['ArrowUp'] || keys['w']) newY -= 5;
      if (keys['ArrowDown'] || keys['s']) newY += 5;

      // Boundaries
      newX = Math.max(0, Math.min(GAME_WIDTH - 20, newX));
      newY = Math.max(0, Math.min(GAME_HEIGHT - 20, newY));

      return { ...prev, x: newX, y: newY };
    });

    // Player shooting
    if (keys[' '] && gameTime % 10 === 0 && player.ammo > 0) {
      spawnBullet(player.x + 10, player.y, 0, -1, true);
    }

    // Update enemies
    setEnemies(prev => prev.map(enemy => {
      let newY = enemy.y + enemy.speed;
      
      // Enemy AI shooting
      if (Math.random() < 0.01 && enemy.y > 0) {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        spawnBullet(enemy.x + enemy.size/2, enemy.y + enemy.size, dx/distance * 0.5, dy/distance * 0.5, false);
      }
      
      return { ...enemy, y: newY };
    }).filter(enemy => {
      if (enemy.y > GAME_HEIGHT + 50) {
        setPlayer(prev => ({ ...prev, health: prev.health - 10 }));
        return false;
      }
      return enemy.health > 0;
    }));

    // Update bullets
    setBullets(prev => prev.map(bullet => ({
      ...bullet,
      x: bullet.x + bullet.vx,
      y: bullet.y + bullet.vy
    })).filter(bullet => 
      bullet.x > -10 && bullet.x < GAME_WIDTH + 10 && 
      bullet.y > -10 && bullet.y < GAME_HEIGHT + 10
    ));

    // Collision detection
    bullets.forEach(bullet => {
      if (bullet.isPlayer) {
        // Player bullets vs enemies
        enemies.forEach(enemy => {
          const dx = bullet.x - (enemy.x + enemy.size/2);
          const dy = bullet.y - (enemy.y + enemy.size/2);
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < enemy.size/2 + 5) {
            enemy.health -= bullet.damage;
            bullet.damage = 0; // Mark for removal
            createParticles(enemy.x + enemy.size/2, enemy.y + enemy.size/2, enemy.color);
            
            if (enemy.health <= 0) {
              const points = enemy.type === 'boss' ? 500 : enemy.type === 'fighter' ? 200 : 100;
              setScore(prev => prev + points);
              createParticles(enemy.x + enemy.size/2, enemy.y + enemy.size/2, enemy.color, 15);
              
              // Random power-up drop
              if (Math.random() < 0.3) {
                spawnPowerUp();
              }
            }
          }
        });
      } else {
        // Enemy bullets vs player
        const dx = bullet.x - (player.x + 10);
        const dy = bullet.y - (player.y + 10);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 15) {
          const damage = player.shield > 0 ? 5 : 15;
          if (player.shield > 0) {
            setPlayer(prev => ({ ...prev, shield: Math.max(0, prev.shield - 10) }));
          } else {
            setPlayer(prev => ({ ...prev, health: prev.health - damage }));
          }
          bullet.damage = 0;
          createParticles(player.x + 10, player.y + 10, '#ff0000');
        }
      }
    });

    // Remove spent bullets
    setBullets(prev => prev.filter(bullet => bullet.damage > 0));

    // Update power-ups
    setPowerUps(prev => prev.map(powerUp => {
      powerUp.pulse += 0.1;
      
      // Check collection
      if (!powerUp.collected) {
        const dx = powerUp.x - player.x;
        const dy = powerUp.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 25) {
          powerUp.collected = true;
          
          switch (powerUp.type) {
            case 'health':
              setPlayer(prev => ({ ...prev, health: Math.min(100, prev.health + 30) }));
              break;
            case 'ammo':
              setPlayer(prev => ({ ...prev, ammo: Math.min(999, prev.ammo + 50) }));
              break;
            case 'shield':
              setPlayer(prev => ({ ...prev, shield: Math.min(100, prev.shield + 50) }));
              break;
            case 'weapon_upgrade':
              setPlayer(prev => ({
                ...prev,
                weapon: prev.weapon === 'laser' ? 'plasma' : prev.weapon === 'plasma' ? 'pulse' : 'laser'
              }));
              break;
          }
          
          createParticles(powerUp.x + 15, powerUp.y + 15, powerUp.color);
          setScore(prev => prev + 50);
        }
      }
      
      return powerUp;
    }).filter(powerUp => !powerUp.collected));

    // Update particles
    setParticles(prev => prev.map(particle => ({
      ...particle,
      x: particle.x + particle.vx,
      y: particle.y + particle.vy,
      vx: particle.vx * 0.98,
      vy: particle.vy * 0.98 + 0.1,
      life: particle.life - 1
    })).filter(particle => particle.life > 0));

    // Spawn enemies
    if (gameTime % (Math.max(60 - wave * 5, 20)) === 0 && waveEnemies < wave * 5 + 10) {
      spawnEnemy();
    }

    // Wave progression
    if (enemies.length === 0 && waveEnemies >= wave * 5 + 10) {
      setWave(prev => prev + 1);
      setWaveEnemies(0);
      setScore(prev => prev + wave * 100);
      
      // Restore some ammo and health
      setPlayer(prev => ({
        ...prev,
        health: Math.min(100, prev.health + 20),
        ammo: Math.min(999, prev.ammo + 30)
      }));
    }

    // Game over check
    if (player.health <= 0) {
      setIsPlaying(false);
    }

  }, [isPlaying, isPaused, gameTime, keys, player, enemies, bullets, wave, waveEnemies, spawnBullet, createParticles, spawnEnemy, spawnPowerUp]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    // Synthwave background
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, `rgba(128, 0, 255, ${synthwave.intensity})`);
    gradient.addColorStop(0.5, `rgba(255, 0, 150, ${synthwave.intensity * 0.5})`);
    gradient.addColorStop(1, '#000814');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Synthwave grid
    ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 + synthwave.intensity * 0.3})`;
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x <= GAME_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= GAME_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_WIDTH, y);
      ctx.stroke();
    }

    // Draw particles
    particles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.life / 60;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw power-ups
    powerUps.forEach(powerUp => {
      if (!powerUp.collected) {
        const pulse = Math.sin(powerUp.pulse) * 0.3 + 0.7;
        
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = powerUp.color;
        ctx.shadowColor = powerUp.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(powerUp.x, powerUp.y, 30, 30);
        ctx.restore();
      }
    });

    // Draw bullets
    bullets.forEach(bullet => {
      ctx.fillStyle = bullet.color;
      ctx.shadowColor = bullet.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.isPlayer ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw enemies
    enemies.forEach(enemy => {
      ctx.fillStyle = enemy.color;
      ctx.shadowColor = enemy.color;
      ctx.shadowBlur = 15;
      
      if (enemy.type === 'boss') {
        // Boss design
        ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(enemy.x + 5, enemy.y + 5, enemy.size - 10, enemy.size - 10);
      } else {
        // Regular enemy
        ctx.beginPath();
        ctx.arc(enemy.x + enemy.size/2, enemy.y + enemy.size/2, enemy.size/2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Health bar for bosses
      if (enemy.type === 'boss') {
        const healthPercent = enemy.health / (150 + wave * 5);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(enemy.x, enemy.y - 10, enemy.size, 4);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(enemy.x, enemy.y - 10, enemy.size * healthPercent, 4);
      }
    });

    // Draw player
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;
    
    // Player ship design
    ctx.beginPath();
    ctx.moveTo(player.x + 10, player.y);
    ctx.lineTo(player.x, player.y + 20);
    ctx.lineTo(player.x + 10, player.y + 15);
    ctx.lineTo(player.x + 20, player.y + 20);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Player shield
    if (player.shield > 0) {
      ctx.strokeStyle = '#0066ff';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(player.x + 10, player.y + 10, 25, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // UI
    ctx.fillStyle = 'rgba(0, 20, 40, 0.8)';
    ctx.fillRect(0, 0, GAME_WIDTH, 100);

    ctx.fillStyle = '#00ffff';
    ctx.font = '18px Arial';
    ctx.fillText(`Wave: ${wave}`, 20, 30);
    ctx.fillText(`Health: ${player.health}`, 20, 55);
    ctx.fillText(`Shield: ${player.shield}`, 20, 80);
    
    ctx.fillText(`Ammo: ${player.ammo}`, 200, 30);
    ctx.fillText(`Weapon: ${player.weapon.toUpperCase()}`, 200, 55);
    
    // Score in synthwave style
    ctx.fillStyle = '#ff0099';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff0099';
    ctx.shadowBlur = 10;
    ctx.fillText(`SCORE: ${score}`, GAME_WIDTH/2, 40);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';

  }, [player, enemies, bullets, particles, powerUps, wave, score, synthwave]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(gameLoop, 16);
    return () => clearInterval(interval);
  }, [gameLoop, isPlaying]);

  useEffect(() => {
    const interval = setInterval(draw, 16);
    return () => clearInterval(interval);
  }, [draw]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => setKeys(prev => ({ ...prev, [e.key]: true }));
    const handleKeyUp = (e: KeyboardEvent) => setKeys(prev => ({ ...prev, [e.key]: false }));
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const startGame = () => {
    setScore(0);
    setWave(1);
    setWaveEnemies(0);
    setGameTime(0);
    setPlayer({
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 80,
      health: 100,
      weapon: 'laser',
      ammo: 100,
      shield: 0
    });
    setEnemies([]);
    setBullets([]);
    setParticles([]);
    setPowerUps([]);
    setSynthwave({ phase: 0, intensity: 0.5 });
    enemyIdRef.current = 0;
    bulletIdRef.current = 0;
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseGame = () => setIsPaused(!isPaused);
  const resetGame = () => setIsPlaying(false);

  return (
    <GameLayout
      gameTitle="Synthwave Shooter"
      gameCategory="Retro-futuristic space shooter with synthwave aesthetics!"
      score={score}
      isPlaying={isPlaying}
      onPause={pauseGame}
      onReset={resetGame}
    >
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="border-2 border-neon-green rounded-lg max-w-full h-auto"
        />
        <div className="text-center text-sm text-gray-400 max-w-md">
          WASD to move, SPACE to shoot. Collect power-ups and survive the synthwave assault!
          🎵 Game #50 of 50 - The complete Knullvoid experience! 🎵
        </div>
      </div>
    </GameLayout>
  );
}
