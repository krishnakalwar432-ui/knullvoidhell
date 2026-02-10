import React, { useState, useEffect, useRef } from 'react';
import GameLayout from '@/components/GameLayout';

const NeonSniperCity: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [crosshair, setCrosshair] = useState({ x: 400, y: 300 });
  const [targets, setTargets] = useState<Array<{x: number, y: number, vx: number, vy: number, type: number, health: number}>>([]);
  const [shots, setShots] = useState<Array<{x: number, y: number, hit: boolean, timer: number}>>([]);
  const [ammo, setAmmo] = useState(10);
  const [reloadTimer, setReloadTimer] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      setCrosshair({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleClick = () => {
      if (gameState === 'playing' && ammo > 0 && reloadTimer === 0) {
        setShots(prev => [...prev, { x: crosshair.x, y: crosshair.y, hit: false, timer: 30 }]);
        setAmmo(prev => prev - 1);
        
        setTargets(prev => prev.map(target => {
          const dist = Math.sqrt((target.x - crosshair.x) ** 2 + (target.y - crosshair.y) ** 2);
          if (dist < 30) {
            target.health--;
            setShots(shots => shots.map(shot => 
              shot.x === crosshair.x && shot.y === crosshair.y ? { ...shot, hit: true } : shot
            ));
            if (target.health <= 0) {
              setScore(s => s + (target.type + 1) * 100);
              return null;
            }
          }
          return target;
        }).filter(Boolean));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r' && ammo === 0) {
        setReloadTimer(60);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, crosshair, ammo, reloadTimer]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const gameLoop = setInterval(() => {
      if (Math.random() < 0.02) {
        setTargets(prev => [...prev, {
          x: Math.random() * 700 + 50,
          y: Math.random() * 400 + 100,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          type: Math.floor(Math.random() * 3),
          health: 1 + Math.floor(Math.random() * 2)
        }]);
      }

      setTargets(prev => prev.map(target => ({
        ...target,
        x: Math.max(25, Math.min(775, target.x + target.vx)),
        y: Math.max(25, Math.min(575, target.y + target.vy)),
        vx: target.x <= 25 || target.x >= 775 ? -target.vx : target.vx,
        vy: target.y <= 25 || target.y >= 575 ? -target.vy : target.vy
      })));

      setShots(prev => prev.map(shot => ({ ...shot, timer: shot.timer - 1 })).filter(shot => shot.timer > 0));
      
      if (reloadTimer > 0) {
        setReloadTimer(prev => prev - 1);
        if (reloadTimer === 1) setAmmo(10);
      }
    }, 16);

    return () => clearInterval(gameLoop);
  }, [gameState, reloadTimer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // City background
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#000033');
    gradient.addColorStop(1, '#000066');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    // Buildings
    for (let i = 0; i < 10; i++) {
      const height = 200 + Math.sin(i) * 100;
      ctx.fillStyle = '#001122';
      ctx.fillRect(i * 80, 600 - height, 75, height);
      
      // Windows
      for (let j = 0; j < Math.floor(height / 30); j++) {
        if (Math.random() > 0.7) {
          ctx.fillStyle = '#ffff00';
          ctx.fillRect(i * 80 + 10, 600 - height + j * 30 + 5, 8, 8);
          ctx.fillRect(i * 80 + 25, 600 - height + j * 30 + 5, 8, 8);
        }
      }
    }

    // Targets
    targets.forEach(target => {
      const colors = ['#ff0099', '#ff6600', '#0aff9d'];
      ctx.fillStyle = colors[target.type];
      ctx.shadowColor = colors[target.type];
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(target.x, target.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Health indicator
      if (target.health > 1) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(target.health.toString(), target.x, target.y + 4);
      }
    });

    // Shot effects
    shots.forEach(shot => {
      const alpha = shot.timer / 30;
      ctx.fillStyle = shot.hit ? `rgba(0, 255, 0, ${alpha})` : `rgba(255, 0, 0, ${alpha})`;
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Crosshair
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(crosshair.x - 15, crosshair.y);
    ctx.lineTo(crosshair.x + 15, crosshair.y);
    ctx.moveTo(crosshair.x, crosshair.y - 15);
    ctx.lineTo(crosshair.x, crosshair.y + 15);
    ctx.stroke();

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Ammo: ${ammo}`, 20, 55);
    if (ammo === 0) ctx.fillText('Press R to Reload', 20, 80);

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#ff0000';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('MISSION FAILED', 400, 300);
    }
  });

  const handlePause = () => setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  const handleReset = () => {
    setScore(0);
    setTargets([]);
    setShots([]);
    setAmmo(10);
    setReloadTimer(0);
    setGameState('playing');
  };

  return (
    <GameLayout gameTitle="Neon Sniper City" gameCategory="Action" score={score} isPlaying={gameState === 'playing'} onPause={handlePause} onReset={handleReset}>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="relative">
          <canvas ref={canvasRef} width={800} height={600} className="border border-neon-green/50 rounded-lg bg-black/20 backdrop-blur-sm shadow-2xl max-w-full h-auto" style={{ touchAction: 'none', cursor: 'none' }} />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Mouse to aim • Click to shoot • R to reload • Precision sniping!</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default NeonSniperCity;
