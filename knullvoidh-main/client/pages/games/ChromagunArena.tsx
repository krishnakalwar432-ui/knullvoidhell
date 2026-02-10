import React, { useState, useEffect, useRef } from 'react';
import GameLayout from '@/components/GameLayout';

const ChromagunArena: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [player, setPlayer] = useState({ x: 400, y: 300, color: '#ff0099', ammo: 100 });
  const [enemies, setEnemies] = useState<Array<{x: number, y: number, vx: number, vy: number, color: string, size: number}>>([]);
  const [bullets, setBullets] = useState<Array<{x: number, y: number, vx: number, vy: number, color: string}>>([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const colors = ['#ff0099', '#7000ff', '#0aff9d', '#ffff00', '#ff6600'];

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
      setPlayer(prev => {
        let newX = prev.x;
        let newY = prev.y;
        if (keys.has('a')) newX = Math.max(25, prev.x - 5);
        if (keys.has('d')) newX = Math.min(775, prev.x + 5);
        if (keys.has('w')) newY = Math.max(25, prev.y - 5);
        if (keys.has('s')) newY = Math.min(575, prev.y + 5);
        
        let newColor = prev.color;
        if (keys.has('1')) newColor = colors[0];
        if (keys.has('2')) newColor = colors[1];
        if (keys.has('3')) newColor = colors[2];
        if (keys.has('4')) newColor = colors[3];
        if (keys.has('5')) newColor = colors[4];
        
        return { ...prev, x: newX, y: newY, color: newColor, ammo: Math.min(100, prev.ammo + 0.1) };
      });

      if (keys.has(' ') && player.ammo > 10) {
        setBullets(prev => [...prev, { x: player.x, y: player.y, vx: (Math.random() - 0.5) * 2, vy: -8, color: player.color }]);
        setPlayer(prev => ({ ...prev, ammo: prev.ammo - 10 }));
      }

      if (Math.random() < 0.02) {
        setEnemies(prev => [...prev, {
          x: Math.random() * 750 + 25,
          y: -25,
          vx: (Math.random() - 0.5) * 2,
          vy: 1 + Math.random() * 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 15 + Math.random() * 15
        }]);
      }

      setBullets(prev => prev.map(b => ({ ...b, x: b.x + b.vx, y: b.y + b.vy })).filter(b => b.y > 0));
      setEnemies(prev => prev.map(e => ({ ...e, x: e.x + e.vx, y: e.y + e.vy })).filter(e => e.y < 625));

      setBullets(prevBullets => {
        let newBullets = [...prevBullets];
        setEnemies(prevEnemies => {
          let newEnemies = [...prevEnemies];
          newBullets = newBullets.filter(bullet => {
            const hitIndex = newEnemies.findIndex(enemy => {
              const dx = enemy.x - bullet.x;
              const dy = enemy.y - bullet.y;
              return Math.sqrt(dx * dx + dy * dy) < enemy.size && enemy.color === bullet.color;
            });
            if (hitIndex !== -1) {
              setScore(s => s + 100);
              newEnemies.splice(hitIndex, 1);
              return false;
            }
            return true;
          });
          return newEnemies;
        });
        return newBullets;
      });

      enemies.forEach(enemy => {
        if (Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2) < 25) {
          setGameState('gameOver');
        }
      });
    }, 16);

    return () => clearInterval(gameLoop);
  }, [gameState, player, enemies, keys, colors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, 800, 600);

    // Grid pattern
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let x = 0; x < 800; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 600);
      ctx.stroke();
    }
    for (let y = 0; y < 600; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(800, y);
      ctx.stroke();
    }

    enemies.forEach(enemy => {
      ctx.fillStyle = enemy.color;
      ctx.shadowColor = enemy.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    bullets.forEach(bullet => {
      ctx.fillStyle = bullet.color;
      ctx.shadowColor = bullet.color;
      ctx.shadowBlur = 5;
      ctx.fillRect(bullet.x - 3, bullet.y - 6, 6, 12);
      ctx.shadowBlur = 0;
    });

    ctx.fillStyle = player.color;
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 15;
    ctx.fillRect(player.x - 15, player.y - 15, 30, 30);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}`, 20, 25);
    ctx.fillText(`Ammo: ${Math.floor(player.ammo)}`, 20, 45);
    ctx.fillText('1-5: Change Color', 20, 75);

    // Color indicator
    colors.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(700 + i * 15, 20, 12, 12);
      if (color === player.color) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(700 + i * 15, 20, 12, 12);
      }
    });

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#ff0000';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('COLOR CLASH!', 400, 300);
    }
  });

  const handlePause = () => setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  const handleReset = () => {
    setScore(0);
    setPlayer({ x: 400, y: 300, color: '#ff0099', ammo: 100 });
    setEnemies([]);
    setBullets([]);
    setGameState('playing');
  };

  return (
    <GameLayout gameTitle="Chromagun Arena" gameCategory="Action" score={score} isPlaying={gameState === 'playing'} onPause={handlePause} onReset={handleReset}>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="relative">
          <canvas ref={canvasRef} width={800} height={600} className="border border-neon-purple/50 rounded-lg bg-black/20 backdrop-blur-sm shadow-2xl max-w-full h-auto" style={{ touchAction: 'none' }} />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>WASD to move • 1-5 to change color • Space to shoot • Match colors!</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default ChromagunArena;
