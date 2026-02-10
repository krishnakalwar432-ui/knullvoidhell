import React, { useState, useEffect, useRef } from 'react';
import GameLayout from '@/components/GameLayout';

const GravitronVortex: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [player, setPlayer] = useState({ x: 400, y: 300, vx: 0, vy: 0 });
  const [vortexes, setVortexes] = useState<Array<{x: number, y: number, strength: number, rotation: number}>>([]);
  const [targets, setTargets] = useState<Array<{x: number, y: number, collected: boolean}>>([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    setVortexes([
      { x: 200, y: 150, strength: 100, rotation: 0 },
      { x: 600, y: 150, strength: -80, rotation: 0 },
      { x: 400, y: 450, strength: 120, rotation: 0 }
    ]);
    setTargets([
      { x: 100, y: 100, collected: false },
      { x: 700, y: 100, collected: false },
      { x: 100, y: 500, collected: false },
      { x: 700, y: 500, collected: false },
      { x: 400, y: 50, collected: false }
    ]);
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
      setPlayer(prev => {
        let newVx = prev.vx;
        let newVy = prev.vy;
        
        // Player controls
        if (keys.has('a')) newVx -= 0.3;
        if (keys.has('d')) newVx += 0.3;
        if (keys.has('w')) newVy -= 0.3;
        if (keys.has('s')) newVy += 0.3;
        
        // Gravity effects from vortexes
        vortexes.forEach(vortex => {
          const dx = vortex.x - prev.x;
          const dy = vortex.y - prev.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > 0 && distance < 200) {
            const force = (vortex.strength / (distance * distance)) * 0.001;
            newVx += dx * force;
            newVy += dy * force;
          }
        });
        
        // Apply friction
        newVx *= 0.98;
        newVy *= 0.98;
        
        // Update position
        let newX = Math.max(15, Math.min(785, prev.x + newVx));
        let newY = Math.max(15, Math.min(585, prev.y + newVy));
        
        return { x: newX, y: newY, vx: newVx, vy: newVy };
      });

      // Update vortex rotation
      setVortexes(prev => prev.map(vortex => ({
        ...vortex,
        rotation: vortex.rotation + 0.1
      })));

      // Collect targets
      setTargets(prev => prev.map(target => {
        if (!target.collected && Math.sqrt((target.x - player.x) ** 2 + (target.y - player.y) ** 2) < 25) {
          setScore(s => s + 200);
          return { ...target, collected: true };
        }
        return target;
      }));

      // Check win condition
      if (targets.every(t => t.collected)) {
        setScore(s => s + 1000);
        setGameState('gameOver');
      }
    }, 16);

    return () => clearInterval(gameLoop);
  }, [gameState, player, vortexes, targets, keys]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000020';
    ctx.fillRect(0, 0, 800, 600);

    // Draw vortexes
    vortexes.forEach(vortex => {
      ctx.save();
      ctx.translate(vortex.x, vortex.y);
      ctx.rotate(vortex.rotation);
      
      // Vortex field
      const radius = Math.abs(vortex.strength) * 1.5;
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      gradient.addColorStop(0, vortex.strength > 0 ? '#7000ff88' : '#ff009988');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Vortex spiral
      ctx.strokeStyle = vortex.strength > 0 ? '#7000ff' : '#ff0099';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const r = 10 + i * 5;
        ctx.arc(0, 0, r, angle, angle + Math.PI / 4);
      }
      ctx.stroke();
      
      ctx.restore();
    });

    // Draw targets
    targets.forEach(target => {
      if (!target.collected) {
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(target.x, target.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // Draw player
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Velocity indicator
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + player.vx * 10, player.y + player.vy * 10);
    ctx.stroke();

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Targets: ${targets.filter(t => !t.collected).length}`, 20, 55);

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#00ff00';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('VORTEX MASTERED!', 400, 300);
    }
  });

  const handlePause = () => setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  const handleReset = () => {
    setScore(0);
    setPlayer({ x: 400, y: 300, vx: 0, vy: 0 });
    setTargets(targets.map(t => ({ ...t, collected: false })));
    setGameState('playing');
  };

  return (
    <GameLayout gameTitle="Gravitron Vortex" gameCategory="Puzzle" score={score} isPlaying={gameState === 'playing'} onPause={handlePause} onReset={handleReset}>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="relative">
          <canvas ref={canvasRef} width={800} height={600} className="border border-neon-purple/50 rounded-lg bg-black/20 backdrop-blur-sm shadow-2xl max-w-full h-auto" style={{ touchAction: 'none' }} />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>WASD to thrust • Navigate gravitational vortexes • Collect all targets!</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default GravitronVortex;
