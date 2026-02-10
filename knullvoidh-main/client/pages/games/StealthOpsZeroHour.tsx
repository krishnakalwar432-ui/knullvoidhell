import React, { useState, useEffect, useRef } from 'react';
import GameLayout from '@/components/GameLayout';

const StealthOpsZeroHour: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [player, setPlayer] = useState({ x: 50, y: 550, stealth: 100, detected: false });
  const [guards, setGuards] = useState<Array<{x: number, y: number, angle: number, alertLevel: number}>>([]);
  const [objectives, setObjectives] = useState<Array<{x: number, y: number, completed: boolean}>>([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    setGuards([
      { x: 200, y: 300, angle: 0, alertLevel: 0 },
      { x: 400, y: 150, angle: Math.PI, alertLevel: 0 },
      { x: 600, y: 400, angle: Math.PI/2, alertLevel: 0 }
    ]);
    setObjectives([
      { x: 150, y: 100, completed: false },
      { x: 650, y: 150, completed: false },
      { x: 750, y: 500, completed: false }
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
      const speed = keys.has('shift') ? 1 : 3; // Slower when sneaking
      setPlayer(prev => {
        let newX = prev.x;
        let newY = prev.y;
        let stealthDrain = keys.has('shift') ? 0.1 : 0.5;
        
        if (keys.has('a')) newX = Math.max(25, prev.x - speed);
        if (keys.has('d')) newX = Math.min(775, prev.x + speed);
        if (keys.has('w')) newY = Math.max(25, prev.y - speed);
        if (keys.has('s')) newY = Math.min(575, prev.y + speed);
        
        return { ...prev, x: newX, y: newY, stealth: Math.max(0, prev.stealth - stealthDrain) };
      });

      // Guard AI and detection
      setGuards(prev => prev.map(guard => {
        const dx = player.x - guard.x;
        const dy = player.y - guard.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const detectionRange = keys.has('shift') ? 80 : 120;
        
        if (distance < detectionRange) {
          guard.alertLevel = Math.min(100, guard.alertLevel + 2);
          if (guard.alertLevel > 50) {
            setPlayer(p => ({ ...p, detected: true }));
          }
        } else {
          guard.alertLevel = Math.max(0, guard.alertLevel - 1);
        }
        
        // Guard movement
        guard.angle += (Math.random() - 0.5) * 0.1;
        return guard;
      }));

      // Objective collection
      setObjectives(prev => prev.map(obj => {
        if (!obj.completed && Math.sqrt((obj.x - player.x) ** 2 + (obj.y - player.y) ** 2) < 30) {
          setScore(s => s + 500);
          return { ...obj, completed: true };
        }
        return obj;
      }));

      if (player.detected || player.stealth <= 0) setGameState('gameOver');
      if (objectives.every(obj => obj.completed)) {
        setScore(s => s + 2000);
        setGameState('gameOver');
      }
    }, 16);

    return () => clearInterval(gameLoop);
  }, [gameState, player, guards, objectives, keys]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#001122';
    ctx.fillRect(0, 0, 800, 600);

    // Guards and vision cones
    guards.forEach(guard => {
      // Vision cone
      ctx.fillStyle = `rgba(255, 0, 0, ${guard.alertLevel * 0.003})`;
      ctx.beginPath();
      ctx.moveTo(guard.x, guard.y);
      ctx.arc(guard.x, guard.y, 100, guard.angle - 0.5, guard.angle + 0.5);
      ctx.closePath();
      ctx.fill();
      
      // Guard
      ctx.fillStyle = guard.alertLevel > 50 ? '#ff0000' : '#ff6600';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.fillRect(guard.x - 8, guard.y - 8, 16, 16);
      ctx.shadowBlur = 0;
    });

    // Objectives
    objectives.forEach(obj => {
      if (!obj.completed) {
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 8;
        ctx.fillRect(obj.x - 10, obj.y - 10, 20, 20);
        ctx.shadowBlur = 0;
      }
    });

    // Player
    ctx.fillStyle = keys.has('shift') ? '#00aa00' : '#00ff00';
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = player.detected ? 20 : 10;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}`, 20, 25);
    ctx.fillText(`Stealth: ${Math.floor(player.stealth)}`, 20, 45);
    ctx.fillText(`Objectives: ${objectives.filter(o => !o.completed).length}`, 20, 65);
    if (keys.has('shift')) ctx.fillText('SNEAKING', 20, 85);

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 800, 600);
      const success = objectives.every(obj => obj.completed);
      ctx.fillStyle = success ? '#00ff00' : '#ff0000';
      ctx.font = '36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(success ? 'MISSION SUCCESS' : 'MISSION FAILED', 400, 300);
    }
  });

  const handlePause = () => setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  const handleReset = () => {
    setScore(0);
    setPlayer({ x: 50, y: 550, stealth: 100, detected: false });
    setObjectives(objectives.map(o => ({ ...o, completed: false })));
    setGuards(guards.map(g => ({ ...g, alertLevel: 0 })));
    setGameState('playing');
  };

  return (
    <GameLayout gameTitle="Stealth Ops: Zero Hour" gameCategory="Stealth" score={score} isPlaying={gameState === 'playing'} onPause={handlePause} onReset={handleReset}>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="relative">
          <canvas ref={canvasRef} width={800} height={600} className="border border-neon-pink/50 rounded-lg bg-black/20 backdrop-blur-sm shadow-2xl max-w-full h-auto" style={{ touchAction: 'none' }} />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>WASD to move • Hold Shift to sneak • Avoid guards • Collect objectives!</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default StealthOpsZeroHour;
