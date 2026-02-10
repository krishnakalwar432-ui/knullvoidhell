import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Enemy {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  health: number;
  maxHealth: number;
  size: number;
  color: string;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  color: string;
  trail: {x: number, y: number}[];
}

interface Player {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  weaponHeat: number;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

export default function TimeWarpShooter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [player, setPlayer] = useState<Player>({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 50,
    health: 100,
    maxHealth: 100,
    weaponHeat: 0
  });
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [timeWarp, setTimeWarp] = useState(1);
  const [timeWarpEnergy, setTimeWarpEnergy] = useState(100);
  const [keys, setKeys] = useState<{[key: string]: boolean}>({});
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const enemyIdRef = useRef(0);
  const bulletIdRef = useRef(0);
  const lastEnemySpawn = useRef(0);

  const spawnEnemy = useCallback(() => {
    const newEnemy: Enemy = {
      id: enemyIdRef.current++,
      x: Math.random() * (GAME_WIDTH - 40),
      y: -30,
      vx: (Math.random() - 0.5) * 2,
      vy: 1 + Math.random() * 2,
      health: 30 + Math.random() * 50,
      maxHealth: 30 + Math.random() * 50,
      size: 15 + Math.random() * 10,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`
    };
    setEnemies(prev => [...prev, newEnemy]);
  }, []);

  const shootBullet = useCallback((targetX: number, targetY: number) => {
    if (player.weaponHeat > 80) return;

    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const speed = 8;

    const bullet: Bullet = {
      id: bulletIdRef.current++,
      x: player.x,
      y: player.y,
      vx: (dx / distance) * speed,
      vy: (dy / distance) * speed,
      damage: 25,
      color: '#00ffff',
      trail: []
    };

    setBullets(prev => [...prev, bullet]);
    setPlayer(prev => ({ ...prev, weaponHeat: prev.weaponHeat + 10 }));
  }, [player]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    setMousePos({
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    });
  }, []);

  const handleMouseClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlaying || isPaused) return;
    shootBullet(mousePos.x, mousePos.y);
  }, [isPlaying, isPaused, shootBullet, mousePos]);

  const gameLoop = useCallback(() => {
    if (!isPlaying || isPaused) return;

    const deltaTime = timeWarp;

    // Player movement
    setPlayer(prev => {
      let newX = prev.x;
      let newY = prev.y;

      if (keys['ArrowLeft'] || keys['a'] || keys['A']) newX -= 5 * deltaTime;
      if (keys['ArrowRight'] || keys['d'] || keys['D']) newX += 5 * deltaTime;
      if (keys['ArrowUp'] || keys['w'] || keys['W']) newY -= 5 * deltaTime;
      if (keys['ArrowDown'] || keys['s'] || keys['S']) newY += 5 * deltaTime;

      newX = Math.max(10, Math.min(GAME_WIDTH - 10, newX));
      newY = Math.max(10, Math.min(GAME_HEIGHT - 10, newY));

      return {
        ...prev,
        x: newX,
        y: newY,
        weaponHeat: Math.max(0, prev.weaponHeat - 1)
      };
    });

    // Time warp management
    if (keys[' '] && timeWarpEnergy > 0) {
      setTimeWarp(0.3);
      setTimeWarpEnergy(prev => Math.max(0, prev - 2));
    } else {
      setTimeWarp(1);
      setTimeWarpEnergy(prev => Math.min(100, prev + 0.5));
    }

    // Spawn enemies
    if (Date.now() - lastEnemySpawn.current > 1000 / timeWarp) {
      spawnEnemy();
      lastEnemySpawn.current = Date.now();
    }

    // Update enemies
    setEnemies(prev => prev.map(enemy => ({
      ...enemy,
      x: enemy.x + enemy.vx * deltaTime,
      y: enemy.y + enemy.vy * deltaTime
    })).filter(enemy => {
      if (enemy.y > GAME_HEIGHT + 50) return false;
      if (enemy.health <= 0) {
        setScore(s => s + 100);
        return false;
      }
      return true;
    }));

    // Update bullets
    setBullets(prev => prev.map(bullet => {
      const newBullet = {
        ...bullet,
        x: bullet.x + bullet.vx * deltaTime,
        y: bullet.y + bullet.vy * deltaTime
      };
      
      // Add trail point
      newBullet.trail.push({ x: bullet.x, y: bullet.y });
      if (newBullet.trail.length > 8) {
        newBullet.trail.shift();
      }
      
      return newBullet;
    }).filter(bullet => 
      bullet.x > -20 && bullet.x < GAME_WIDTH + 20 && 
      bullet.y > -20 && bullet.y < GAME_HEIGHT + 20
    ));

    // Collision detection
    bullets.forEach(bullet => {
      enemies.forEach(enemy => {
        const dx = bullet.x - enemy.x;
        const dy = bullet.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < enemy.size) {
          enemy.health -= bullet.damage;
          bullet.damage = 0; // Mark bullet for removal
        }
      });
    });

    // Remove spent bullets
    setBullets(prev => prev.filter(bullet => bullet.damage > 0));

    // Enemy-player collision
    enemies.forEach(enemy => {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < enemy.size + 10) {
        setPlayer(prev => ({ ...prev, health: prev.health - 1 }));
      }
    });

  }, [isPlaying, isPaused, timeWarp, timeWarpEnergy, keys, player, enemies, bullets, spawnEnemy]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Time warp effect background
    const bgIntensity = 1 - timeWarp;
    const gradient = ctx.createRadialGradient(
      GAME_WIDTH/2, GAME_HEIGHT/2, 0,
      GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH
    );
    gradient.addColorStop(0, `rgba(0,20,40,${0.8 + bgIntensity * 0.2})`);
    gradient.addColorStop(1, `rgba(0,8,20,${0.9 + bgIntensity * 0.1})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Time warp grid effect
    if (timeWarp < 1) {
      ctx.strokeStyle = `rgba(0,255,255,${0.3 * (1 - timeWarp)})`;
      ctx.lineWidth = 1;
      for (let x = 0; x < GAME_WIDTH; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, GAME_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < GAME_HEIGHT; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(GAME_WIDTH, y);
        ctx.stroke();
      }
    }

    // Draw bullet trails
    bullets.forEach(bullet => {
      if (bullet.trail.length > 1) {
        ctx.strokeStyle = bullet.color + '80';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bullet.trail[0].x, bullet.trail[0].y);
        for (let i = 1; i < bullet.trail.length; i++) {
          ctx.lineTo(bullet.trail[i].x, bullet.trail[i].y);
        }
        ctx.stroke();
      }
    });

    // Draw bullets
    bullets.forEach(bullet => {
      ctx.fillStyle = bullet.color;
      ctx.shadowColor = bullet.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw enemies
    enemies.forEach(enemy => {
      // Enemy body
      ctx.fillStyle = enemy.color;
      ctx.shadowColor = enemy.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Health bar
      const barWidth = enemy.size * 2;
      const barHeight = 4;
      const healthPercent = enemy.health / enemy.maxHealth;
      
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.size - 10, barWidth, barHeight);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.size - 10, barWidth * healthPercent, barHeight);
    });

    // Draw player
    ctx.fillStyle = '#0aff9d';
    ctx.shadowColor = '#0aff9d';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Player health bar
    const healthBarWidth = 100;
    const healthPercent = player.health / player.maxHealth;
    ctx.fillStyle = '#330000';
    ctx.fillRect(10, 10, healthBarWidth, 10);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(10, 10, healthBarWidth * healthPercent, 10);

    // Weapon heat indicator
    const heatPercent = player.weaponHeat / 100;
    ctx.fillStyle = '#001133';
    ctx.fillRect(10, 25, healthBarWidth, 8);
    ctx.fillStyle = heatPercent > 0.8 ? '#ff6600' : '#0066ff';
    ctx.fillRect(10, 25, healthBarWidth * heatPercent, 8);

    // Time warp energy
    const energyPercent = timeWarpEnergy / 100;
    ctx.fillStyle = '#001122';
    ctx.fillRect(10, 40, healthBarWidth, 8);
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(10, 40, healthBarWidth * energyPercent, 8);

    // UI text
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText('Health', 120, 19);
    ctx.fillText('Heat', 120, 33);
    ctx.fillText('Time Energy', 120, 47);
    
    if (timeWarp < 1) {
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('TIME WARP ACTIVE', GAME_WIDTH/2, 50);
      ctx.textAlign = 'left';
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
  }, [bullets, enemies, player, timeWarp, timeWarpEnergy, mousePos]);

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
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key]: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (player.health <= 0) {
      setIsPlaying(false);
    }
  }, [player.health]);

  const startGame = () => {
    setScore(0);
    setPlayer({
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 50,
      health: 100,
      maxHealth: 100,
      weaponHeat: 0
    });
    setEnemies([]);
    setBullets([]);
    setTimeWarp(1);
    setTimeWarpEnergy(100);
    enemyIdRef.current = 0;
    bulletIdRef.current = 0;
    lastEnemySpawn.current = 0;
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseGame = () => setIsPaused(!isPaused);
  const resetGame = () => {
    setIsPlaying(false);
    setScore(0);
  };

  return (
    <GameLayout
      gameTitle="Time Warp Shooter"
      gameCategory="Control time and space in this bullet-time shooter!"
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
          onMouseMove={handleMouseMove}
          onClick={handleMouseClick}
          className="border-2 border-neon-green rounded-lg cursor-crosshair max-w-full h-auto"
          style={{ background: 'radial-gradient(circle, #001428, #000814)' }}
        />
        
        <div className="text-center text-sm text-gray-400 max-w-md">
          Use WASD to move, mouse to aim and shoot. Hold SPACE to activate time warp!
          Manage weapon heat and time energy wisely.
        </div>
      </div>
    </GameLayout>
  );
}
