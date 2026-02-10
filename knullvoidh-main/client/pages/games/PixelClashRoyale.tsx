import React, { useState, useEffect, useRef } from 'react';
import GameLayout from '@/components/GameLayout';

const PixelClashRoyale: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [players, setPlayers] = useState<Array<{x: number, y: number, health: number, team: number, weapon: number}>>([]);
  const [bullets, setBullets] = useState<Array<{x: number, y: number, vx: number, vy: number, team: number}>>([]);
  const [powerUps, setPowerUps] = useState<Array<{x: number, y: number, type: string}>>([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [playersLeft, setPlayersLeft] = useState(10);

  useEffect(() => {
    // Initialize players
    const newPlayers = [];
    for (let i = 0; i < 10; i++) {
      newPlayers.push({
        x: 100 + Math.random() * 600,
        y: 100 + Math.random() * 400,
        health: 100,
        team: i === 0 ? 0 : Math.floor(Math.random() * 3) + 1,
        weapon: Math.floor(Math.random() * 3)
      });
    }
    setPlayers(newPlayers);
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
      setPlayers(prev => prev.map((player, index) => {
        if (index === 0) { // Player character
          let newX = player.x;
          let newY = player.y;
          if (keys.has('a')) newX = Math.max(15, player.x - 4);
          if (keys.has('d')) newX = Math.min(785, player.x + 4);
          if (keys.has('w')) newY = Math.max(15, player.y - 4);
          if (keys.has('s')) newY = Math.min(585, player.y + 4);
          return { ...player, x: newX, y: newY };
        } else { // AI players
          const nearestEnemy = prev.find(p => p.team !== player.team && p.health > 0);
          if (nearestEnemy) {
            const dx = nearestEnemy.x - player.x;
            const dy = nearestEnemy.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
              return {
                ...player,
                x: player.x + (dx / dist) * 2,
                y: player.y + (dy / dist) * 2
              };
            }
          }
          return player;
        }
      }));

      // Player shooting
      if (keys.has(' ')) {
        setBullets(prev => [...prev, {
          x: players[0]?.x || 0,
          y: players[0]?.y || 0,
          vx: 0,
          vy: -8,
          team: 0
        }]);
      }

      // AI shooting
      players.forEach((player, index) => {
        if (index > 0 && Math.random() < 0.01) {
          setBullets(prev => [...prev, {
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            team: player.team
          }]);
        }
      });

      setBullets(prev => prev
        .map(bullet => ({ ...bullet, x: bullet.x + bullet.vx, y: bullet.y + bullet.vy }))
        .filter(bullet => bullet.x > 0 && bullet.x < 800 && bullet.y > 0 && bullet.y < 600)
      );

      // Collision detection
      setBullets(prevBullets => {
        let newBullets = [...prevBullets];
        setPlayers(prevPlayers => {
          let newPlayers = [...prevPlayers];
          newBullets = newBullets.filter(bullet => {
            const hitIndex = newPlayers.findIndex(player => {
              const dx = player.x - bullet.x;
              const dy = player.y - bullet.y;
              return Math.sqrt(dx * dx + dy * dy) < 15 && player.team !== bullet.team && player.health > 0;
            });
            if (hitIndex !== -1) {
              newPlayers[hitIndex].health -= 25;
              if (newPlayers[hitIndex].health <= 0) {
                setScore(s => s + 100);
                setPlayersLeft(p => p - 1);
              }
              return false;
            }
            return true;
          });
          return newPlayers;
        });
        return newBullets;
      });

      if (players[0]?.health <= 0) setGameState('gameOver');
      if (playersLeft <= 1) setGameState('gameOver');
    }, 16);

    return () => clearInterval(gameLoop);
  }, [gameState, players, keys, playersLeft]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, 800, 600);

    // Pixel grid
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    for (let x = 0; x < 800; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 600);
      ctx.stroke();
    }
    for (let y = 0; y < 600; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(800, y);
      ctx.stroke();
    }

    // Players
    players.forEach((player, index) => {
      if (player.health > 0) {
        const colors = ['#00ff00', '#ff0000', '#0000ff', '#ffff00'];
        ctx.fillStyle = colors[player.team];
        ctx.shadowColor = colors[player.team];
        ctx.shadowBlur = 10;
        ctx.fillRect(player.x - 8, player.y - 8, 16, 16);
        
        // Health bar
        if (player.health < 100) {
          ctx.fillStyle = '#333';
          ctx.fillRect(player.x - 10, player.y - 20, 20, 4);
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(player.x - 10, player.y - 20, (player.health / 100) * 20, 4);
        }
        ctx.shadowBlur = 0;
      }
    });

    // Bullets
    bullets.forEach(bullet => {
      const colors = ['#00ff00', '#ff0000', '#0000ff', '#ffff00'];
      ctx.fillStyle = colors[bullet.team];
      ctx.fillRect(bullet.x - 2, bullet.y - 2, 4, 4);
    });

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}`, 20, 25);
    ctx.fillText(`Players Left: ${playersLeft}`, 20, 45);
    ctx.fillText(`Health: ${players[0]?.health || 0}`, 20, 65);

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = playersLeft <= 1 ? '#00ff00' : '#ff0000';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(playersLeft <= 1 ? 'VICTORY!' : 'DEFEATED', 400, 300);
    }
  });

  const handlePause = () => setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  const handleReset = () => {
    setScore(0);
    setPlayersLeft(10);
    const newPlayers = [];
    for (let i = 0; i < 10; i++) {
      newPlayers.push({
        x: 100 + Math.random() * 600,
        y: 100 + Math.random() * 400,
        health: 100,
        team: i === 0 ? 0 : Math.floor(Math.random() * 3) + 1,
        weapon: Math.floor(Math.random() * 3)
      });
    }
    setPlayers(newPlayers);
    setBullets([]);
    setGameState('playing');
  };

  return (
    <GameLayout gameTitle="Pixel Clash Royale" gameCategory="Action" score={score} isPlaying={gameState === 'playing'} onPause={handlePause} onReset={handleReset}>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="relative">
          <canvas ref={canvasRef} width={800} height={600} className="border border-neon-purple/50 rounded-lg bg-black/20 backdrop-blur-sm shadow-2xl max-w-full h-auto" style={{ touchAction: 'none' }} />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>WASD to move • Space to shoot • Last player standing wins!</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default PixelClashRoyale;
