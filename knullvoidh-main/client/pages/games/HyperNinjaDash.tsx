import React, { useState, useEffect, useRef } from 'react';
import GameLayout from '@/components/GameLayout';

const HyperNinjaDash: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [player, setPlayer] = useState({ x: 100, y: 400, vx: 0, vy: 0, onGround: false, dashCooldown: 0 });
  const [platforms, setPlatforms] = useState<Array<{x: number, y: number, width: number}>>([]);
  const [enemies, setEnemies] = useState<Array<{x: number, y: number, vx: number, active: boolean}>>([]);
  const [shurikens, setShurikens] = useState<Array<{x: number, y: number, vx: number, vy: number}>>([]);
  const [scrollX, setScrollX] = useState(0);
  const [keys, setKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Generate platforms
    const newPlatforms = [{ x: 0, y: 450, width: 200 }];
    for (let i = 1; i < 20; i++) {
      newPlatforms.push({
        x: i * 150 + Math.random() * 100,
        y: 300 + Math.random() * 200,
        width: 80 + Math.random() * 60
      });
    }
    setPlatforms(newPlatforms);

    // Generate enemies
    const newEnemies = [];
    for (let i = 0; i < 15; i++) {
      newEnemies.push({
        x: 300 + i * 200 + Math.random() * 100,
        y: 350,
        vx: (Math.random() - 0.5) * 2,
        active: true
      });
    }
    setEnemies(newEnemies);
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
        let newVy = prev.vy + 0.5; // gravity
        let newX = prev.x;
        let newY = prev.y;
        let onGround = false;
        let dashCooldown = Math.max(0, prev.dashCooldown - 1);

        // Movement
        if (keys.has('a')) newVx = Math.max(newVx - 0.5, -8);
        if (keys.has('d')) newVx = Math.min(newVx + 0.5, 8);
        if (keys.has(' ') && prev.onGround) newVy = -12; // jump
        if (keys.has('shift') && dashCooldown === 0) {
          newVx = keys.has('a') ? -15 : keys.has('d') ? 15 : newVx;
          dashCooldown = 60;
        }

        newVx *= 0.85; // friction
        newX += newVx;
        newY += newVy;

        // Platform collision
        platforms.forEach(platform => {
          if (newX + 15 > platform.x && newX - 15 < platform.x + platform.width) {
            if (newY + 15 > platform.y && prev.y + 15 <= platform.y && newVy > 0) {
              newY = platform.y - 15;
              newVy = 0;
              onGround = true;
            }
          }
        });

        if (newY > 600) setGameState('gameOver');

        return { x: newX, y: newY, vx: newVx, vy: newVy, onGround, dashCooldown };
      });

      // Camera follow
      setScrollX(player.x - 200);

      // Shooting
      if (keys.has('x')) {
        setShurikens(prev => {
          if (prev.length < 5) {
            return [...prev, { x: player.x, y: player.y, vx: 10, vy: 0 }];
          }
          return prev;
        });
      }

      // Update shurikens
      setShurikens(prev => prev
        .map(shuriken => ({ ...shuriken, x: shuriken.x + shuriken.vx, y: shuriken.y + shuriken.vy }))
        .filter(shuriken => shuriken.x < scrollX + 900)
      );

      // Update enemies
      setEnemies(prev => prev.map(enemy => ({
        ...enemy,
        x: enemy.x + enemy.vx,
        vx: enemy.x < 0 || enemy.x > 3000 ? -enemy.vx : enemy.vx
      })));

      // Collision with enemies
      setShurikens(prevShurikens => {
        let newShurikens = [...prevShurikens];
        setEnemies(prevEnemies => {
          let newEnemies = [...prevEnemies];
          newShurikens = newShurikens.filter(shuriken => {
            const hitIndex = newEnemies.findIndex(enemy => 
              enemy.active && Math.abs(enemy.x - shuriken.x) < 20 && Math.abs(enemy.y - shuriken.y) < 20
            );
            if (hitIndex !== -1) {
              setScore(s => s + 100);
              newEnemies[hitIndex].active = false;
              return false;
            }
            return true;
          });
          return newEnemies;
        });
        return newShurikens;
      });

      // Player-enemy collision
      enemies.forEach(enemy => {
        if (enemy.active && Math.abs(enemy.x - player.x) < 25 && Math.abs(enemy.y - player.y) < 25) {
          setGameState('gameOver');
        }
      });

      setScore(prev => prev + 1);
    }, 16);

    return () => clearInterval(gameLoop);
  }, [gameState, player, platforms, enemies, keys]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(1, '#003344');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    ctx.save();
    ctx.translate(-scrollX, 0);

    // Platforms
    platforms.forEach(platform => {
      ctx.fillStyle = '#666666';
      ctx.fillRect(platform.x, platform.y, platform.width, 20);
      ctx.strokeStyle = '#888888';
      ctx.strokeRect(platform.x, platform.y, platform.width, 20);
    });

    // Enemies
    enemies.forEach(enemy => {
      if (enemy.active) {
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10;
        ctx.fillRect(enemy.x - 10, enemy.y - 10, 20, 20);
        ctx.shadowBlur = 0;
      }
    });

    // Shurikens
    shurikens.forEach(shuriken => {
      ctx.fillStyle = '#ffff00';
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 5;
      ctx.save();
      ctx.translate(shuriken.x, shuriken.y);
      ctx.rotate(Date.now() * 0.01);
      ctx.fillRect(-5, -1, 10, 2);
      ctx.fillRect(-1, -5, 2, 10);
      ctx.restore();
      ctx.shadowBlur = 0;
    });

    // Player
    ctx.fillStyle = player.dashCooldown > 50 ? '#ffffff' : '#00ff00';
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 15;
    ctx.fillRect(player.x - 15, player.y - 15, 30, 30);
    ctx.shadowBlur = 0;

    ctx.restore();

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}`, 20, 25);
    ctx.fillText(`Dash: ${player.dashCooldown > 0 ? 'Cooling' : 'Ready'}`, 20, 45);

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#ff0000';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NINJA FALLEN', 400, 300);
    }
  });

  const handlePause = () => setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  const handleReset = () => {
    setScore(0);
    setPlayer({ x: 100, y: 400, vx: 0, vy: 0, onGround: false, dashCooldown: 0 });
    setEnemies(enemies.map(e => ({ ...e, active: true })));
    setShurikens([]);
    setScrollX(0);
    setGameState('playing');
  };

  return (
    <GameLayout gameTitle="Hyper Ninja Dash" gameCategory="Platform" score={score} isPlaying={gameState === 'playing'} onPause={handlePause} onReset={handleReset}>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="relative">
          <canvas ref={canvasRef} width={800} height={600} className="border border-neon-orange/50 rounded-lg bg-black/20 backdrop-blur-sm shadow-2xl max-w-full h-auto" style={{ touchAction: 'none' }} />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>A/D to move • Space to jump • Shift to dash • X to throw shurikens!</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default HyperNinjaDash;
