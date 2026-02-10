import React, { useState, useRef, useEffect, useCallback } from 'react';
import GameLayout from '../../components/GameLayout';

interface Kart {
  x: number;
  y: number;
  angle: number;
  speed: number;
  vx: number;
  vy: number;
}

interface QuantumPortal {
  x: number;
  y: number;
  radius: number;
  color: string;
  rotation: number;
  active: boolean;
}

const QuantumKart: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [kart, setKart] = useState<Kart>({
    x: 100,
    y: 300,
    angle: 0,
    speed: 0,
    vx: 0,
    vy: 0
  });
  const [portals, setPortals] = useState<QuantumPortal[]>([]);
  
  const keysPressed = useRef<Set<string>>(new Set());

  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameOver(false);
    setIsPlaying(true);
    setScore(0);
    setKart({
      x: 100,
      y: 300,
      angle: 0,
      speed: 0,
      vx: 0,
      vy: 0
    });
    
    // Initialize quantum portals
    const newPortals: QuantumPortal[] = [];
    for (let i = 0; i < 5; i++) {
      newPortals.push({
        x: 200 + i * 120,
        y: 150 + Math.sin(i) * 100,
        radius: 30,
        color: ['#ff00ff', '#00ffff', '#ffff00', '#ff0000', '#00ff00'][i],
        rotation: 0,
        active: true
      });
    }
    setPortals(newPortals);
  }, []);

  const pauseGame = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const resetGame = useCallback(() => {
    setGameStarted(false);
    setGameOver(false);
    setIsPlaying(false);
    setScore(0);
    setKart({
      x: 100,
      y: 300,
      angle: 0,
      speed: 0,
      vx: 0,
      vy: 0
    });
    setPortals([]);
  }, []);

  const updateKart = useCallback(() => {
    if (!isPlaying || gameOver) return;

    setKart(prevKart => {
      let newKart = { ...prevKart };
      
      // Handle input
      if (keysPressed.current.has('ArrowUp') || keysPressed.current.has('w')) {
        newKart.speed = Math.min(newKart.speed + 0.5, 8);
      }
      if (keysPressed.current.has('ArrowDown') || keysPressed.current.has('s')) {
        newKart.speed = Math.max(newKart.speed - 0.3, -4);
      }
      if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('a')) {
        newKart.angle -= 0.1 * (newKart.speed / 8);
      }
      if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d')) {
        newKart.angle += 0.1 * (newKart.speed / 8);
      }

      // Apply physics
      newKart.vx = Math.cos(newKart.angle) * newKart.speed;
      newKart.vy = Math.sin(newKart.angle) * newKart.speed;
      
      newKart.x += newKart.vx;
      newKart.y += newKart.vy;
      
      // Apply friction
      newKart.speed *= 0.95;

      // Boundary wrapping with quantum effect
      if (newKart.x < 0) newKart.x = 800;
      if (newKart.x > 800) newKart.x = 0;
      if (newKart.y < 0) newKart.y = 600;
      if (newKart.y > 600) newKart.y = 0;

      return newKart;
    });
  }, [isPlaying, gameOver]);

  const updatePortals = useCallback(() => {
    setPortals(prev => prev.map(portal => ({
      ...portal,
      rotation: portal.rotation + 0.05
    })));
  }, []);

  const checkPortalCollisions = useCallback(() => {
    setPortals(prev => {
      return prev.map(portal => {
        const dx = kart.x - portal.x;
        const dy = kart.y - portal.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < portal.radius && portal.active) {
          // Quantum teleport effect
          setKart(prevKart => ({
            ...prevKart,
            x: Math.random() * 700 + 50,
            y: Math.random() * 500 + 50
          }));
          
          setScore(prevScore => prevScore + 100);
          return { ...portal, active: false };
        }
        return portal;
      });
    });
  }, [kart.x, kart.y]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, 800, 600);

    // Quantum background grid
    ctx.strokeStyle = 'rgba(138, 43, 226, 0.3)';
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

    if (!gameStarted) {
      ctx.fillStyle = '#7c3aed';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Quantum Kart', 400, 250);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.fillText('Quantum-powered kart racing', 400, 300);
      ctx.fillText('Drive through portals to teleport!', 400, 330);
      ctx.fillText('Press SPACE to start', 400, 380);
    } else if (gameOver) {
      ctx.fillStyle = '#ff0000';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', 400, 250);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${score}`, 400, 300);
      ctx.fillText('Press R to restart', 400, 350);
    } else {
      // Draw quantum portals
      portals.forEach(portal => {
        if (!portal.active) return;
        
        ctx.save();
        ctx.translate(portal.x, portal.y);
        ctx.rotate(portal.rotation);
        
        // Portal outer ring
        const portalGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, portal.radius);
        portalGradient.addColorStop(0, 'transparent');
        portalGradient.addColorStop(0.7, portal.color + '80');
        portalGradient.addColorStop(1, portal.color);
        
        ctx.fillStyle = portalGradient;
        ctx.beginPath();
        ctx.arc(0, 0, portal.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Portal center
        ctx.fillStyle = portal.color;
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Quantum particles
        for (let i = 0; i < 8; i++) {
          const angle = (portal.rotation * 2) + (i * Math.PI / 4);
          const radius = 15 + Math.sin(portal.rotation * 3 + i) * 5;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          ctx.fillStyle = portal.color;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      });

      // Draw quantum kart
      ctx.save();
      ctx.translate(kart.x, kart.y);
      ctx.rotate(kart.angle);
      
      // Kart body
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(-15, -8, 30, 16);
      
      // Quantum glow effect
      const time = Date.now() * 0.01;
      const glowIntensity = 0.7 + 0.3 * Math.sin(time);
      ctx.shadowColor = '#7c3aed';
      ctx.shadowBlur = 20 * glowIntensity;
      ctx.fillRect(-15, -8, 30, 16);
      ctx.shadowBlur = 0;
      
      // Kart details
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-12, -6, 24, 12);
      ctx.fillStyle = '#000000';
      ctx.fillRect(-10, -4, 8, 8);
      ctx.fillRect(2, -4, 8, 8);
      
      // Speed trail
      if (Math.abs(kart.speed) > 2) {
        ctx.strokeStyle = `rgba(124, 58, 237, ${Math.abs(kart.speed) / 8})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.lineTo(-30 - kart.speed * 2, 0);
        ctx.stroke();
      }
      
      ctx.restore();
      
      // UI
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${score}`, 20, 30);
      ctx.fillText(`Speed: ${Math.abs(kart.speed).toFixed(1)}`, 20, 55);
      ctx.fillText(`Portals: ${portals.filter(p => p.active).length}`, 20, 80);
    }

    ctx.textAlign = 'left';
  }, [gameStarted, gameOver, score, kart, portals]);

  const gameLoop = useCallback(() => {
    if (!isPlaying || gameOver) return;

    updateKart();
    updatePortals();
    checkPortalCollisions();
    
    // Check if all portals collected
    if (portals.every(p => !p.active)) {
      setScore(prev => prev + 500);
      // Respawn portals
      setPortals(prev => prev.map(portal => ({ ...portal, active: true })));
    }

    draw();
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, gameOver, updateKart, updatePortals, checkPortalCollisions, portals, draw]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
      
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          if (!gameStarted) {
            startGame();
          }
          break;
        case 'r':
          e.preventDefault();
          if (gameOver) {
            resetGame();
          }
          break;
        case 'p':
          e.preventDefault();
          if (gameStarted && !gameOver) {
            pauseGame();
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, gameOver, startGame, resetGame, pauseGame]);

  useEffect(() => {
    if (isPlaying && !gameOver) {
      gameLoop();
    } else {
      draw();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, gameOver, gameLoop, draw]);

  return (
    <GameLayout
      gameTitle="Quantum Kart"
      gameCategory="Racing"
      score={score}
      isPlaying={isPlaying}
      onPause={pauseGame}
      onReset={resetGame}
    >
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="border-2 border-purple-400 rounded-lg shadow-2xl bg-slate-800"
            tabIndex={0}
          />
          
          <div className="mt-4 text-center">
            <div className="text-purple-400 text-lg font-bold mb-2">
              Difficulty: Medium
            </div>
            <div className="flex justify-center space-x-4 text-sm text-gray-300">
              <span>Space: Start</span>
              <span>WASD/Arrows: Drive</span>
              <span>P: Pause</span>
              <span>R: Restart</span>
            </div>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default QuantumKart;
