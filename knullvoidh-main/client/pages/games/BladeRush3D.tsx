import React, { useState, useEffect, useRef } from 'react';
import GameLayout from '@/components/GameLayout';

const BladeRush3D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [player, setPlayer] = useState({ x: 400, y: 300, angle: 0, combo: 0, energy: 100 });
  const [enemies, setEnemies] = useState<Array<{x: number, y: number, angle: number, health: number, type: number}>>([]);
  const [slashes, setSlashes] = useState<Array<{x: number, y: number, angle: number, life: number}>>([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [mousePos, setMousePos] = useState({ x: 400, y: 300 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => setKeys(prev => new Set([...prev, e.key.toLowerCase()]));
    const handleKeyUp = (e: KeyboardEvent) => setKeys(prev => { const newKeys = new Set(prev); newKeys.delete(e.key.toLowerCase()); return newKeys; });
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    const handleClick = () => {
      if (gameState === 'playing' && player.energy > 20) {
        const angle = Math.atan2(mousePos.y - player.y, mousePos.x - player.x);
        setSlashes(prev => [...prev, { x: player.x, y: player.y, angle, life: 20 }]);
        setPlayer(prev => ({ ...prev, energy: prev.energy - 20 }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, [gameState, player.energy, mousePos.x, mousePos.y, player.x, player.y]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const gameLoop = setInterval(() => {
      setPlayer(prev => {
        let newX = prev.x;
        let newY = prev.y;
        if (keys.has('a')) newX = Math.max(30, prev.x - 4);
        if (keys.has('d')) newX = Math.min(770, prev.x + 4);
        if (keys.has('w')) newY = Math.max(30, prev.y - 4);
        if (keys.has('s')) newY = Math.min(570, prev.y + 4);
        
        const angle = Math.atan2(mousePos.y - newY, mousePos.x - newX);
        return { ...prev, x: newX, y: newY, angle, energy: Math.min(100, prev.energy + 0.5) };
      });

      if (Math.random() < 0.02) {
        setEnemies(prev => [...prev, {
          x: Math.random() * 740 + 30,
          y: Math.random() * 540 + 30,
          angle: Math.random() * Math.PI * 2,
          health: 1 + Math.floor(Math.random() * 3),
          type: Math.floor(Math.random() * 3)
        }]);
      }

      setEnemies(prev => prev.map(enemy => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
          enemy.x += (dx / distance) * 1;
          enemy.y += (dy / distance) * 1;
          enemy.angle = Math.atan2(dy, dx);
        }
        return enemy;
      }));

      setSlashes(prev => prev.map(slash => ({ ...slash, life: slash.life - 1 })).filter(slash => slash.life > 0));

      setSlashes(prevSlashes => {
        setEnemies(prevEnemies => {
          let newEnemies = [...prevEnemies];
          prevSlashes.forEach(slash => {
            if (slash.life > 15) {
              const slashEndX = slash.x + Math.cos(slash.angle) * 60;
              const slashEndY = slash.y + Math.sin(slash.angle) * 60;
              
              newEnemies = newEnemies.filter(enemy => {
                const dist = Math.sqrt((enemy.x - slashEndX) ** 2 + (enemy.y - slashEndY) ** 2);
                if (dist < 40) {
                  setScore(s => s + 100);
                  setPlayer(p => ({ ...p, combo: p.combo + 1 }));
                  return false;
                }
                return true;
              });
            }
          });
          return newEnemies;
        });
        return prevSlashes;
      });

      // Enemy collision with player
      enemies.forEach(enemy => {
        if (Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2) < 25) {
          setGameState('gameOver');
        }
      });
    }, 16);

    return () => clearInterval(gameLoop);
  }, [gameState, player, enemies, keys, mousePos]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, 800, 600);

    // 3D floor pattern
    ctx.strokeStyle = '#ff0099';
    ctx.lineWidth = 1;
    const perspective = 0.5;
    for (let i = 0; i < 20; i++) {
      const y = 300 + i * 15;
      const scale = 1 - i * perspective * 0.05;
      ctx.beginPath();
      ctx.moveTo(400 - 300 * scale, y);
      ctx.lineTo(400 + 300 * scale, y);
      ctx.stroke();
    }

    enemies.forEach(enemy => {
      const colors = ['#ff0099', '#7000ff', '#0aff9d'];
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(enemy.angle);
      
      ctx.fillStyle = colors[enemy.type];
      ctx.shadowColor = colors[enemy.type];
      ctx.shadowBlur = 8;
      
      if (enemy.type === 0) {
        ctx.fillRect(-10, -15, 20, 30);
      } else if (enemy.type === 1) {
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(12, 10);
        ctx.lineTo(-12, 10);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    slashes.forEach(slash => {
      const alpha = slash.life / 20;
      const length = 60 * (1 - alpha * 0.5);
      ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(slash.x, slash.y);
      ctx.lineTo(slash.x + Math.cos(slash.angle) * length, slash.y + Math.sin(slash.angle) * length);
      ctx.stroke();
    });

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;
    ctx.fillRect(-12, -8, 24, 16);
    
    // Blade
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(12, -2, 25, 4);
    
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}`, 20, 25);
    ctx.fillText(`Combo: ${player.combo}`, 20, 45);
    
    // Energy bar
    ctx.fillStyle = '#333';
    ctx.fillRect(20, 55, 100, 10);
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(20, 55, player.energy, 10);

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#ff0000';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BLADE BROKEN', 400, 300);
    }
  });

  const handlePause = () => setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  const handleReset = () => {
    setScore(0);
    setPlayer({ x: 400, y: 300, angle: 0, combo: 0, energy: 100 });
    setEnemies([]);
    setSlashes([]);
    setGameState('playing');
  };

  return (
    <GameLayout gameTitle="Blade Rush 3D" gameCategory="Action" score={score} isPlaying={gameState === 'playing'} onPause={handlePause} onReset={handleReset}>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="relative">
          <canvas ref={canvasRef} width={800} height={600} className="border border-neon-pink/50 rounded-lg bg-black/20 backdrop-blur-sm shadow-2xl max-w-full h-auto" style={{ touchAction: 'none' }} />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>WASD to move • Click to slash at cursor • 3D melee combat!</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default BladeRush3D;
