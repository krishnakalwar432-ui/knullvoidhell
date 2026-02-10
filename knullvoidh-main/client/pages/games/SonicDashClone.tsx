import React, { useState, useEffect, useRef } from 'react';
import GameLayout from '@/components/GameLayout';

const SonicDashClone: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [player, setPlayer] = useState({ x: 100, y: 400, vy: 0, onGround: true, lane: 1 });
  const [obstacles, setObstacles] = useState<Array<{x: number, y: number, width: number, height: number, type: string}>>([]);
  const [rings, setRings] = useState<Array<{x: number, y: number, collected: boolean}>>([]);
  const [speed, setSpeed] = useState(8);
  const [keys, setKeys] = useState<Set<string>>(new Set());

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const GROUND_Y = 450;
  const JUMP_FORCE = -15;
  const GRAVITY = 0.8;

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
        let newY = prev.y + prev.vy;
        let newVy = prev.vy + GRAVITY;
        let onGround = prev.onGround;
        let newLane = prev.lane;

        // Jumping
        if ((keys.has(' ') || keys.has('w')) && prev.onGround) {
          newVy = JUMP_FORCE;
          onGround = false;
        }

        // Lane switching
        if ((keys.has('a') || keys.has('arrowleft')) && prev.lane > 0) newLane = prev.lane - 1;
        if ((keys.has('d') || keys.has('arrowright')) && prev.lane < 2) newLane = prev.lane + 1;

        // Ground collision
        if (newY >= GROUND_Y) {
          newY = GROUND_Y;
          newVy = 0;
          onGround = true;
        }

        return { x: 100 + newLane * 200, y: newY, vy: newVy, onGround, lane: newLane };
      });

      // Spawn obstacles and rings
      if (Math.random() < 0.02) {
        setObstacles(prev => [...prev, {
          x: CANVAS_WIDTH + 50,
          y: GROUND_Y - 40,
          width: 40,
          height: 40,
          type: 'spike'
        }]);
      }

      if (Math.random() < 0.05) {
        setRings(prev => [...prev, {
          x: CANVAS_WIDTH + 50,
          y: GROUND_Y - 100 - Math.random() * 100,
          collected: false
        }]);
      }

      // Update obstacles and rings
      setObstacles(prev => prev
        .map(obs => ({ ...obs, x: obs.x - speed }))
        .filter(obs => obs.x > -100)
      );

      setRings(prev => prev
        .map(ring => ({ ...ring, x: ring.x - speed }))
        .filter(ring => ring.x > -50)
      );

      // Collision detection
      obstacles.forEach(obs => {
        if (player.x + 20 > obs.x && player.x - 20 < obs.x + obs.width &&
            player.y + 20 > obs.y && player.y - 20 < obs.y + obs.height) {
          setGameState('gameOver');
        }
      });

      // Ring collection
      setRings(prev => prev.map(ring => {
        if (!ring.collected && 
            Math.abs(ring.x - player.x) < 30 && 
            Math.abs(ring.y - player.y) < 30) {
          setScore(s => s + 100);
          return { ...ring, collected: true };
        }
        return ring;
      }));

      // Update score and speed
      setScore(prev => prev + 1);
      setSpeed(prev => Math.min(prev + 0.001, 12));
    }, 16);
    return () => clearInterval(gameLoop);
  }, [gameState, player, obstacles, rings, speed, keys]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0066ff');
    gradient.addColorStop(1, '#00aaff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Ground
    ctx.fillStyle = '#00aa00';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

    // Speed lines
    for (let i = 0; i < 10; i++) {
      const x = (i * 100 - (Date.now() * speed * 0.1) % 1000) % CANVAS_WIDTH;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x - 50, CANVAS_HEIGHT);
      ctx.stroke();
    }

    // Draw rings
    rings.forEach(ring => {
      if (!ring.collected) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, 15, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, 10, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Draw obstacles
    obstacles.forEach(obs => {
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      
      // Spikes
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      for (let i = 0; i < obs.width; i += 10) {
        ctx.moveTo(obs.x + i, obs.y);
        ctx.lineTo(obs.x + i + 5, obs.y - 10);
        ctx.lineTo(obs.x + i + 10, obs.y);
      }
      ctx.fill();
    });

    // Draw player (Sonic-style)
    ctx.fillStyle = '#0066ff';
    ctx.shadowColor = '#0066ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Sonic's spikes
    ctx.fillStyle = '#004499';
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const x = player.x + Math.cos(angle) * 15;
      const y = player.y + Math.sin(angle) * 15;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.shadowBlur = 0;

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Speed: ${speed.toFixed(1)}`, 20, 55);

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ff0000';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  });

  const handlePause = () => setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  const handleReset = () => {
    setScore(0);
    setPlayer({ x: 100, y: 400, vy: 0, onGround: true, lane: 1 });
    setObstacles([]);
    setRings([]);
    setSpeed(8);
    setGameState('playing');
  };

  return (
    <GameLayout gameTitle="Sonic Dash Clone (HTML5)" gameCategory="Platform" score={score} isPlaying={gameState === 'playing'} onPause={handlePause} onReset={handleReset}>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="relative">
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="border border-neon-blue/50 rounded-lg bg-black/20 backdrop-blur-sm shadow-2xl max-w-full h-auto" style={{ touchAction: 'none' }} />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Space/W to jump • A/D to switch lanes • Collect rings!</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default SonicDashClone;
