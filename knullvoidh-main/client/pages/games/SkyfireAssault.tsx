import React, { useState, useEffect, useRef } from 'react';
import GameLayout from '@/components/GameLayout';

interface Aircraft {
  x: number;
  y: number;
  vx: number;
  vy: number;
  health: number;
  type: 'player' | 'fighter' | 'bomber';
  angle: number;
}

interface Missile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  friendly: boolean;
  trail: Array<{x: number, y: number}>;
}

const SkyfireAssault: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [player, setPlayer] = useState<Aircraft>({ x: 400, y: 500, vx: 0, vy: 0, health: 100, type: 'player', angle: 0 });
  const [enemies, setEnemies] = useState<Aircraft[]>([]);
  const [missiles, setMissiles] = useState<Missile[]>([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [clouds, setClouds] = useState<Array<{x: number, y: number, size: number}>>([]);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  // Initialize clouds
  useEffect(() => {
    const newClouds = [];
    for (let i = 0; i < 20; i++) {
      newClouds.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: 30 + Math.random() * 40
      });
    }
    setClouds(newClouds);
  }, []);

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
        let newVx = prev.vx;
        let newVy = prev.vy;
        let newAngle = prev.angle;

        if (keys.has('a') || keys.has('arrowleft')) { newVx -= 0.3; newAngle = -0.2; }
        if (keys.has('d') || keys.has('arrowright')) { newVx += 0.3; newAngle = 0.2; }
        if (keys.has('w') || keys.has('arrowup')) newVy -= 0.3;
        if (keys.has('s') || keys.has('arrowdown')) newVy += 0.3;

        newVx *= 0.95;
        newVy *= 0.95;
        if (!keys.has('a') && !keys.has('d') && !keys.has('arrowleft') && !keys.has('arrowright')) newAngle *= 0.9;

        const newX = Math.max(30, Math.min(CANVAS_WIDTH - 30, prev.x + newVx));
        const newY = Math.max(30, Math.min(CANVAS_HEIGHT - 30, prev.y + newVy));

        return { ...prev, x: newX, y: newY, vx: newVx, vy: newVy, angle: newAngle };
      });

      // Player shooting
      if (keys.has(' ')) {
        setMissiles(prev => {
          const playerMissiles = prev.filter(m => m.friendly);
          if (playerMissiles.length < 3) {
            return [...prev, {
              x: player.x,
              y: player.y - 25,
              vx: 0,
              vy: -8,
              friendly: true,
              trail: []
            }];
          }
          return prev;
        });
      }

      // Spawn enemies
      if (enemies.length < 5 && Math.random() < 0.01) {
        setEnemies(prev => [...prev, {
          x: Math.random() * CANVAS_WIDTH,
          y: -50,
          vx: (Math.random() - 0.5) * 2,
          vy: 1 + Math.random(),
          health: Math.random() > 0.7 ? 3 : 1,
          type: Math.random() > 0.7 ? 'bomber' : 'fighter',
          angle: 0
        }]);
      }

      // Update enemies
      setEnemies(prev => prev.map(enemy => ({
        ...enemy,
        x: enemy.x + enemy.vx,
        y: enemy.y + enemy.vy,
        angle: Math.sin(Date.now() * 0.001) * 0.1
      })).filter(enemy => enemy.y < CANVAS_HEIGHT + 100));

      // Enemy shooting
      enemies.forEach(enemy => {
        if (Math.random() < 0.005) {
          setMissiles(prev => [...prev, {
            x: enemy.x,
            y: enemy.y + 20,
            vx: 0,
            vy: 3,
            friendly: false,
            trail: []
          }]);
        }
      });

      // Update missiles
      setMissiles(prev => prev
        .map(missile => ({
          ...missile,
          x: missile.x + missile.vx,
          y: missile.y + missile.vy,
          trail: [...missile.trail, { x: missile.x, y: missile.y }].slice(-8)
        }))
        .filter(missile => missile.y > -50 && missile.y < CANVAS_HEIGHT + 50)
      );

      // Update clouds
      setClouds(prev => prev.map(cloud => ({
        ...cloud,
        y: (cloud.y + 1) % (CANVAS_HEIGHT + cloud.size)
      })));

      // Collision detection
      setMissiles(prevMissiles => {
        let newMissiles = [...prevMissiles];
        setEnemies(prevEnemies => {
          let newEnemies = [...prevEnemies];
          
          newMissiles = newMissiles.filter(missile => {
            if (missile.friendly) {
              const hitIndex = newEnemies.findIndex(enemy => {
                const dx = enemy.x - missile.x;
                const dy = enemy.y - missile.y;
                return Math.sqrt(dx * dx + dy * dy) < 25;
              });
              
              if (hitIndex !== -1) {
                const enemy = newEnemies[hitIndex];
                enemy.health--;
                if (enemy.health <= 0) {
                  setScore(s => s + (enemy.type === 'bomber' ? 200 : 100));
                  newEnemies.splice(hitIndex, 1);
                }
                return false;
              }
            } else {
              const dx = player.x - missile.x;
              const dy = player.y - missile.y;
              if (Math.sqrt(dx * dx + dy * dy) < 25) {
                setPlayer(p => ({ ...p, health: Math.max(0, p.health - 20) }));
                return false;
              }
            }
            return true;
          });
          
          return newEnemies;
        });
        return newMissiles;
      });

      if (player.health <= 0) setGameState('gameOver');
    }, 16);

    return () => clearInterval(gameLoop);
  }, [gameState, player, enemies, keys]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#4682B4');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw clouds
    clouds.forEach(cloud => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw missiles with trails
    missiles.forEach(missile => {
      // Trail
      missile.trail.forEach((point, i) => {
        const alpha = i / missile.trail.length;
        ctx.fillStyle = missile.friendly ? `rgba(255, 165, 0, ${alpha})` : `rgba(255, 0, 0, ${alpha})`;
        ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
      });
      
      // Missile
      ctx.fillStyle = missile.friendly ? '#ff6600' : '#ff0000';
      ctx.shadowColor = missile.friendly ? '#ff6600' : '#ff0000';
      ctx.shadowBlur = 10;
      ctx.fillRect(missile.x - 3, missile.y - 8, 6, 16);
      ctx.shadowBlur = 0;
    });

    // Draw enemies
    enemies.forEach(enemy => {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(enemy.angle);
      
      ctx.fillStyle = enemy.type === 'bomber' ? '#8B0000' : '#FF4500';
      ctx.shadowColor = enemy.type === 'bomber' ? '#8B0000' : '#FF4500';
      ctx.shadowBlur = 15;
      
      if (enemy.type === 'bomber') {
        ctx.fillRect(-25, -15, 50, 30);
        ctx.fillRect(-30, -5, 60, 10);
      } else {
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-15, -12);
        ctx.lineTo(-10, 0);
        ctx.lineTo(-15, 12);
        ctx.closePath();
        ctx.fill();
      }
      
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    // Draw player
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    
    ctx.fillStyle = '#0066ff';
    ctx.shadowColor = '#0066ff';
    ctx.shadowBlur = 20;
    
    ctx.beginPath();
    ctx.moveTo(25, 0);
    ctx.lineTo(-15, -15);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-15, 15);
    ctx.closePath();
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.restore();

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText(`Score: ${score}`, 20, 30);
    
    // Health bar
    ctx.fillStyle = '#333';
    ctx.fillRect(20, 40, 150, 15);
    ctx.fillStyle = player.health > 30 ? '#00ff00' : '#ff0000';
    ctx.fillRect(20, 40, (player.health / 100) * 150, 15);

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ff0000';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SHOT DOWN', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  });

  const handlePause = () => setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  const handleReset = () => {
    setScore(0);
    setPlayer({ x: 400, y: 500, vx: 0, vy: 0, health: 100, type: 'player', angle: 0 });
    setEnemies([]);
    setMissiles([]);
    setGameState('playing');
  };

  return (
    <GameLayout gameTitle="Skyfire Assault" gameCategory="Action" score={score} isPlaying={gameState === 'playing'} onPause={handlePause} onReset={handleReset}>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="relative">
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="border border-neon-orange/50 rounded-lg bg-black/20 backdrop-blur-sm shadow-2xl max-w-full h-auto" style={{ touchAction: 'none' }} />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>WASD to fly • Space to shoot missiles • Aerial combat!</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default SkyfireAssault;
