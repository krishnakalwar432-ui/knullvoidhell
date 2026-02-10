import React, { useState, useRef, useEffect, useCallback } from 'react';
import GameLayout from '../../components/GameLayout';

interface Bike {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  onGround: boolean;
  fuel: number;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'ramp' | 'barrier' | 'pit';
}

const CyberMotocross: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bike, setBike] = useState<Bike>({
    x: 100,
    y: 400,
    vx: 0,
    vy: 0,
    angle: 0,
    onGround: true,
    fuel: 100
  });
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [cameraX, setCameraX] = useState(0);
  
  const keysPressed = useRef<Set<string>>(new Set());

  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameOver(false);
    setIsPlaying(true);
    setScore(0);
    setBike({
      x: 100,
      y: 400,
      vx: 0,
      vy: 0,
      angle: 0,
      onGround: true,
      fuel: 100
    });
    setCameraX(0);
    
    // Generate obstacles
    const newObstacles: Obstacle[] = [];
    for (let i = 0; i < 20; i++) {
      const x = 300 + i * 200;
      const type = ['ramp', 'barrier', 'pit'][Math.floor(Math.random() * 3)] as 'ramp' | 'barrier' | 'pit';
      
      if (type === 'ramp') {
        newObstacles.push({ x, y: 450, width: 80, height: 50, type });
      } else if (type === 'barrier') {
        newObstacles.push({ x, y: 400, width: 20, height: 100, type });
      } else {
        newObstacles.push({ x, y: 500, width: 100, height: 50, type });
      }
    }
    setObstacles(newObstacles);
  }, []);

  const pauseGame = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const resetGame = useCallback(() => {
    setGameStarted(false);
    setGameOver(false);
    setIsPlaying(false);
    setScore(0);
    setBike({
      x: 100,
      y: 400,
      vx: 0,
      vy: 0,
      angle: 0,
      onGround: true,
      fuel: 100
    });
    setObstacles([]);
    setCameraX(0);
  }, []);

  const updateBike = useCallback(() => {
    if (!isPlaying || gameOver) return;

    setBike(prevBike => {
      let newBike = { ...prevBike };
      
      // Handle input
      if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d')) {
        if (newBike.onGround && newBike.fuel > 0) {
          newBike.vx = Math.min(newBike.vx + 0.8, 12);
          newBike.fuel = Math.max(0, newBike.fuel - 0.1);
        }
      }
      if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('a')) {
        if (newBike.onGround) {
          newBike.vx = Math.max(newBike.vx - 0.5, -8);
        }
      }
      if (keysPressed.current.has('ArrowUp') || keysPressed.current.has('w')) {
        if (newBike.onGround && newBike.fuel > 0) {
          newBike.vy = -15;
          newBike.onGround = false;
          newBike.fuel = Math.max(0, newBike.fuel - 2);
        }
      }

      // Physics
      if (!newBike.onGround) {
        newBike.vy += 0.6; // gravity
      }
      
      newBike.x += newBike.vx;
      newBike.y += newBike.vy;
      
      // Ground collision
      if (newBike.y >= 450) {
        newBike.y = 450;
        newBike.vy = 0;
        newBike.onGround = true;
        newBike.angle = 0;
      }
      
      // Friction
      if (newBike.onGround) {
        newBike.vx *= 0.95;
      }
      
      // Bike rotation in air
      if (!newBike.onGround) {
        if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('a')) {
          newBike.angle -= 0.1;
        }
        if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d')) {
          newBike.angle += 0.1;
        }
      }

      return newBike;
    });
  }, [isPlaying, gameOver]);

  const checkCollisions = useCallback(() => {
    obstacles.forEach(obstacle => {
      const dx = bike.x - obstacle.x;
      const dy = bike.y - obstacle.y;
      
      if (bike.x + 20 > obstacle.x && 
          bike.x - 20 < obstacle.x + obstacle.width &&
          bike.y + 10 > obstacle.y && 
          bike.y - 10 < obstacle.y + obstacle.height) {
        
        if (obstacle.type === 'ramp') {
          setBike(prev => ({ ...prev, vy: -8, onGround: false }));
          setScore(prev => prev + 50);
        } else if (obstacle.type === 'barrier') {
          if (Math.abs(bike.vx) > 5) {
            setGameOver(true);
          } else {
            setBike(prev => ({ ...prev, vx: -prev.vx * 0.5 }));
          }
        } else if (obstacle.type === 'pit') {
          setGameOver(true);
        }
      }
    });
  }, [bike.x, bike.y, bike.vx, obstacles]);

  const updateCamera = useCallback(() => {
    setCameraX(bike.x - 200);
  }, [bike.x]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, 800, 600);

    // Cyber grid background
    ctx.save();
    ctx.translate(-cameraX, 0);
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#001a2e');
    gradient.addColorStop(0.5, '#003366');
    gradient.addColorStop(1, '#0066cc');
    ctx.fillStyle = gradient;
    ctx.fillRect(cameraX, 0, 800, 600);

    // Cyber grid
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let x = Math.floor(cameraX / 50) * 50; x < cameraX + 800; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 600);
      ctx.stroke();
    }
    for (let y = 0; y < 600; y += 50) {
      ctx.beginPath();
      ctx.moveTo(cameraX, y);
      ctx.lineTo(cameraX + 800, y);
      ctx.stroke();
    }

    if (!gameStarted) {
      ctx.restore();
      ctx.fillStyle = '#00d4ff';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Cyber Motocross', 400, 250);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.fillText('Futuristic motocross racing', 400, 300);
      ctx.fillText('Arrow Keys: Control bike', 400, 340);
      ctx.fillText('Press SPACE to start', 400, 380);
    } else if (gameOver) {
      ctx.restore();
      ctx.fillStyle = '#ff0000';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Crashed!', 400, 250);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${score}`, 400, 300);
      ctx.fillText('Press R to restart', 400, 350);
    } else {
      // Draw ground
      ctx.fillStyle = '#333333';
      ctx.fillRect(cameraX, 500, 800, 100);
      
      // Neon ground line
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cameraX, 500);
      ctx.lineTo(cameraX + 800, 500);
      ctx.stroke();

      // Draw obstacles
      obstacles.forEach(obstacle => {
        if (obstacle.x + obstacle.width < cameraX - 100 || obstacle.x > cameraX + 900) return;
        
        if (obstacle.type === 'ramp') {
          ctx.fillStyle = '#00ffff';
          ctx.beginPath();
          ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
          ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
          ctx.lineTo(obstacle.x + obstacle.width, obstacle.y);
          ctx.closePath();
          ctx.fill();
        } else if (obstacle.type === 'barrier') {
          ctx.fillStyle = '#ff0066';
          ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
          
          // Danger stripes
          ctx.fillStyle = '#ffff00';
          for (let i = 0; i < obstacle.height; i += 10) {
            ctx.fillRect(obstacle.x, obstacle.y + i, obstacle.width, 5);
          }
        } else if (obstacle.type === 'pit') {
          ctx.fillStyle = '#000000';
          ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
          
          // Danger glow
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 2;
          ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
      });

      // Draw cyber bike
      ctx.save();
      ctx.translate(bike.x, bike.y);
      ctx.rotate(bike.angle);
      
      // Bike glow
      const time = Date.now() * 0.01;
      const glowIntensity = 0.7 + 0.3 * Math.sin(time);
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 15 * glowIntensity;
      
      // Bike body
      ctx.fillStyle = '#00d4ff';
      ctx.fillRect(-20, -5, 40, 10);
      
      // Wheels
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-15, 8, 8, 0, Math.PI * 2);
      ctx.arc(15, 8, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Rider
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(-5, -15, 10, 10);
      
      ctx.shadowBlur = 0;
      ctx.restore();
      
      ctx.restore();
      
      // UI
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${score}`, 20, 30);
      ctx.fillText(`Speed: ${Math.abs(bike.vx).toFixed(1)}`, 20, 55);
      
      // Fuel bar
      ctx.fillStyle = '#333333';
      ctx.fillRect(20, 70, 150, 20);
      ctx.fillStyle = bike.fuel > 30 ? '#00ff00' : '#ff0000';
      ctx.fillRect(20, 70, bike.fuel * 1.5, 20);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 70, 150, 20);
      ctx.fillText('Fuel', 20, 110);
    }

    ctx.textAlign = 'left';
  }, [gameStarted, gameOver, score, bike, obstacles, cameraX]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key);
      
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
      keysPressed.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, gameOver, startGame, resetGame, pauseGame]);

  useEffect(() => {
    let frameId: number;

    const animate = () => {
      if (isPlaying && !gameOver) {
        updateBike();
        checkCollisions();
        updateCamera();
        setScore(prev => prev + Math.floor(bike.vx));
      }
      draw();

      if (isPlaying && !gameOver) {
        frameId = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [isPlaying, gameOver]);

  return (
    <GameLayout
      gameTitle="Cyber Motocross"
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
            className="border-2 border-cyan-400 rounded-lg shadow-2xl bg-slate-800"
            tabIndex={0}
          />
          
          <div className="mt-4 text-center">
            <div className="text-cyan-400 text-lg font-bold mb-2">
              Difficulty: Hard
            </div>
            <div className="flex justify-center space-x-4 text-sm text-gray-300">
              <span>Space: Start</span>
              <span>Arrows: Control</span>
              <span>Up: Jump</span>
              <span>P: Pause</span>
            </div>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default CyberMotocross;
