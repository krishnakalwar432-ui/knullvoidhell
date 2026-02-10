import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Player {
  x: number;
  y: number;
  health: number;
  energy: number;
  weaponLevel: number;
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'void' | 'plasma' | 'quantum';
  health: number;
  size: number;
  shootTimer: number;
  points: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  friendly: boolean;
  type: 'void' | 'plasma' | 'laser';
}

const VoidBlasterX: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [player, setPlayer] = useState<Player>({ x: 400, y: 500, health: 100, energy: 100, weaponLevel: 1 });
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [shootTimer, setShootTimer] = useState(0);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  const spawnEnemies = useCallback(() => {
    if (enemies.length < 8 + wave && Math.random() < 0.02) {
      const types = ['void', 'plasma', 'quantum'] as const;
      const type = types[Math.floor(Math.random() * types.length)];
      const configs = {
        void: { health: 1, size: 20, points: 100 },
        plasma: { health: 2, size: 25, points: 200 },
        quantum: { health: 3, size: 30, points: 300 }
      };

      setEnemies(prev => [...prev, {
        x: Math.random() * CANVAS_WIDTH,
        y: -50,
        vx: (Math.random() - 0.5) * 2,
        vy: 1 + Math.random() * 2,
        type,
        health: configs[type].health,
        size: configs[type].size,
        shootTimer: 0,
        points: configs[type].points
      }]);
    }
  }, [enemies.length, wave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => setKeys(prev => new Set([...prev, e.key.toLowerCase()]));
    const handleKeyUp = (e: KeyboardEvent) => setKeys(prev => { const newKeys = new Set(prev); newKeys.delete(e.key.toLowerCase()); return newKeys; });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const gameLoop = setInterval(() => {
      // Update player
      setPlayer(prev => {
        let newX = prev.x;
        let newY = prev.y;
        if (keys.has('a') || keys.has('arrowleft')) newX = Math.max(25, prev.x - 6);
        if (keys.has('d') || keys.has('arrowright')) newX = Math.min(CANVAS_WIDTH - 25, prev.x + 6);
        if (keys.has('w') || keys.has('arrowup')) newY = Math.max(25, prev.y - 6);
        if (keys.has('s') || keys.has('arrowdown')) newY = Math.min(CANVAS_HEIGHT - 25, prev.y + 6);
        
        return { ...prev, x: newX, y: newY, energy: Math.min(100, prev.energy + 0.2) };
      });

      // Player shooting
      setShootTimer(prev => Math.max(0, prev - 1));
      if (keys.has(' ') && shootTimer === 0) {
        setBullets(prev => {
          const newBullets = [{
            x: player.x,
            y: player.y - 25,
            vx: 0,
            vy: -12,
            damage: player.weaponLevel,
            friendly: true,
            type: 'void' as const
          }];
          
          if (player.weaponLevel >= 2) {
            newBullets.push(
              { x: player.x - 15, y: player.y - 20, vx: -2, vy: -10, damage: player.weaponLevel, friendly: true, type: 'void' as const },
              { x: player.x + 15, y: player.y - 20, vx: 2, vy: -10, damage: player.weaponLevel, friendly: true, type: 'void' as const }
            );
          }
          
          return [...prev, ...newBullets];
        });
        setShootTimer(8);
      }

      // Update bullets
      setBullets(prev => prev
        .map(bullet => ({ ...bullet, x: bullet.x + bullet.vx, y: bullet.y + bullet.vy }))
        .filter(bullet => bullet.y > -50 && bullet.y < CANVAS_HEIGHT + 50)
      );

      // Update enemies
      setEnemies(prev => prev.map(enemy => {
        let newEnemy = { ...enemy };
        newEnemy.x += enemy.vx;
        newEnemy.y += enemy.vy;
        
        newEnemy.shootTimer--;
        if (newEnemy.shootTimer <= 0 && Math.random() < 0.01) {
          setBullets(bullets => [...bullets, {
            x: newEnemy.x,
            y: newEnemy.y + 20,
            vx: 0,
            vy: 4,
            damage: 10,
            friendly: false,
            type: enemy.type === 'quantum' ? 'plasma' : enemy.type
          }]);
          newEnemy.shootTimer = 60;
        }
        
        return newEnemy;
      }).filter(enemy => enemy.y < CANVAS_HEIGHT + 100));

      // Spawn enemies
      spawnEnemies();

      // Collision detection
      setBullets(prevBullets => {
        let newBullets = [...prevBullets];
        setEnemies(prevEnemies => {
          let newEnemies = [...prevEnemies];
          
          newBullets = newBullets.filter(bullet => {
            if (bullet.friendly) {
              const hitIndex = newEnemies.findIndex(enemy => {
                const dx = enemy.x - bullet.x;
                const dy = enemy.y - bullet.y;
                return Math.sqrt(dx * dx + dy * dy) < enemy.size;
              });
              
              if (hitIndex !== -1) {
                const enemy = newEnemies[hitIndex];
                enemy.health -= bullet.damage;
                
                if (enemy.health <= 0) {
                  setScore(s => s + enemy.points);
                  if (Math.random() < 0.1) {
                    setPlayer(p => ({ ...p, weaponLevel: Math.min(3, p.weaponLevel + 1) }));
                  }
                  newEnemies.splice(hitIndex, 1);
                }
                return false;
              }
            } else {
              const dx = player.x - bullet.x;
              const dy = player.y - bullet.y;
              if (Math.sqrt(dx * dx + dy * dy) < 25) {
                setPlayer(p => ({ ...p, health: Math.max(0, p.health - bullet.damage) }));
                return false;
              }
            }
            return true;
          });
          
          return newEnemies;
        });
        return newBullets;
      });

      // Check game over
      if (player.health <= 0) setGameState('gameOver');

      // Wave progression
      if (enemies.length === 0 && bullets.filter(b => !b.friendly).length === 0) {
        setWave(prev => prev + 1);
        setScore(prev => prev + wave * 500);
      }
    }, 16);

    return () => clearInterval(gameLoop);
  }, [gameState, player, enemies, bullets, keys, shootTimer, wave, spawnEnemies]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Space background
    ctx.fillStyle = '#000006';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Void particles
    for (let i = 0; i < 50; i++) {
      const x = (i * 67 + Date.now() * 0.1) % CANVAS_WIDTH;
      const y = (i * 43 + Date.now() * 0.05) % CANVAS_HEIGHT;
      const alpha = Math.sin(Date.now() * 0.001 + i) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(255, 0, 153, ${alpha * 0.3})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Draw enemies
    enemies.forEach(enemy => {
      const colors = { void: '#ff0099', plasma: '#7000ff', quantum: '#0aff9d' };
      ctx.fillStyle = colors[enemy.type];
      ctx.shadowColor = colors[enemy.type];
      ctx.shadowBlur = 15;
      
      if (enemy.type === 'void') {
        ctx.fillRect(enemy.x - enemy.size/2, enemy.y - enemy.size/2, enemy.size, enemy.size);
      } else if (enemy.type === 'plasma') {
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size/2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const x = enemy.x + Math.cos(angle) * enemy.size/2;
          const y = enemy.y + Math.sin(angle) * enemy.size/2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    });

    // Draw bullets
    bullets.forEach(bullet => {
      const colors = { void: '#ff0099', plasma: '#7000ff', laser: '#0aff9d' };
      ctx.fillStyle = bullet.friendly ? colors[bullet.type] : '#ff4444';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.fillRect(bullet.x - 3, bullet.y - 8, 6, 16);
      ctx.shadowBlur = 0;
    });

    // Draw player
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - 20);
    ctx.lineTo(player.x - 15, player.y + 15);
    ctx.lineTo(player.x, player.y + 10);
    ctx.lineTo(player.x + 15, player.y + 15);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Wave: ${wave}`, 20, 55);
    ctx.fillText(`Weapon: ${player.weaponLevel}`, 20, 80);

    // Health bar
    ctx.fillStyle = '#333';
    ctx.fillRect(20, 90, 200, 10);
    ctx.fillStyle = player.health > 30 ? '#00ff00' : '#ff0000';
    ctx.fillRect(20, 90, (player.health / 100) * 200, 10);

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('VOID CONSUMED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  });

  const handlePause = () => setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  const handleReset = () => {
    setScore(0);
    setWave(1);
    setPlayer({ x: 400, y: 500, health: 100, energy: 100, weaponLevel: 1 });
    setEnemies([]);
    setBullets([]);
    setShootTimer(0);
    setGameState('playing');
  };

  return (
    <GameLayout gameTitle="Void Blaster X" gameCategory="Action" score={score} isPlaying={gameState === 'playing'} onPause={handlePause} onReset={handleReset}>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="relative">
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="border border-neon-pink/50 rounded-lg bg-black/20 backdrop-blur-sm shadow-2xl max-w-full h-auto" style={{ touchAction: 'none' }} />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>WASD to move • Space to shoot • Destroy void enemies!</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default VoidBlasterX;
