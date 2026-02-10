import React, { useState, useRef, useEffect, useCallback } from 'react';
import GameLayout from '../../components/GameLayout';

const NeonClicker: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [clickPower, setClickPower] = useState(1);
  const [autoClickers, setAutoClickers] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const startGame = useCallback(() => {
    setGameStarted(true);
    setIsPlaying(true);
    setScore(0);
    setClickPower(1);
    setAutoClickers(0);
  }, []);

  const pauseGame = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const resetGame = useCallback(() => {
    setGameStarted(false);
    setIsPlaying(false);
    setScore(0);
    setClickPower(1);
    setAutoClickers(0);
  }, []);

  const handleClick = useCallback(() => {
    if (gameStarted && isPlaying) {
      setScore(prev => prev + clickPower);
    }
  }, [gameStarted, isPlaying, clickPower]);

  const buyUpgrade = useCallback((type: string) => {
    if (type === 'power' && score >= 10) {
      setScore(prev => prev - 10);
      setClickPower(prev => prev + 1);
    } else if (type === 'auto' && score >= 50) {
      setScore(prev => prev - 50);
      setAutoClickers(prev => prev + 1);
    }
  }, [score]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, 800, 600);

    const gradient = ctx.createLinearGradient(0, 0, 800, 600);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    if (!gameStarted) {
      ctx.fillStyle = '#99cc00';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Neon Clicker', 400, 250);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.fillText('Click for neon power', 400, 300);
      ctx.fillText('Press SPACE to start', 400, 350);
    } else {
      // Draw main clicking orb
      const time = Date.now() * 0.005;
      const pulseSize = 80 + Math.sin(time) * 20;
      
      // Glow effect
      const glowGradient = ctx.createRadialGradient(400, 300, 0, 400, 300, pulseSize * 2);
      glowGradient.addColorStop(0, '#99cc00');
      glowGradient.addColorStop(0.3, 'rgba(153, 204, 0, 0.8)');
      glowGradient.addColorStop(0.7, 'rgba(153, 204, 0, 0.3)');
      glowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(400, 300, pulseSize * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Main orb
      const orbGradient = ctx.createRadialGradient(380, 280, 0, 400, 300, pulseSize);
      orbGradient.addColorStop(0, '#ccff33');
      orbGradient.addColorStop(0.7, '#99cc00');
      orbGradient.addColorStop(1, '#66aa00');
      ctx.fillStyle = orbGradient;
      ctx.beginPath();
      ctx.arc(400, 300, pulseSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Neon rings
      for (let i = 0; i < 3; i++) {
        const ringRadius = pulseSize + 20 + i * 15;
        const alpha = 0.5 - i * 0.15;
        ctx.strokeStyle = `rgba(153, 204, 0, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(400, 300, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Stats display
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Neon Energy: ${score.toLocaleString()}`, 20, 40);
      ctx.fillText(`Click Power: ${clickPower}`, 20, 70);
      ctx.fillText(`Auto Clickers: ${autoClickers}`, 20, 100);
      
      // Upgrades
      ctx.font = '18px Arial';
      ctx.fillStyle = score >= 10 ? '#00ff00' : '#666666';
      ctx.fillText('Power Upgrade (10 energy) - Press 1', 20, 520);
      
      ctx.fillStyle = score >= 50 ? '#00ff00' : '#666666';
      ctx.fillText('Auto Clicker (50 energy) - Press 2', 20, 550);
      
      // Click instruction
      ctx.fillStyle = '#99cc00';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CLICK THE ORB!', 400, 450);
      
      // Energy particles
      for (let i = 0; i < 20; i++) {
        const angle = (time + i) * 0.5;
        const radius = 150 + Math.sin(time + i * 0.5) * 30;
        const x = 400 + Math.cos(angle) * radius;
        const y = 300 + Math.sin(angle) * radius;
        
        ctx.fillStyle = `rgba(153, 204, 0, ${0.8 * Math.sin(time + i)})`;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.textAlign = 'left';
  }, [gameStarted, score, clickPower, autoClickers]);

  const gameLoop = useCallback(() => {
    if (!isPlaying) return;

    // Auto clicker income
    if (autoClickers > 0) {
      setScore(prev => prev + autoClickers);
    }

    draw();
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, autoClickers, draw]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          if (!gameStarted) {
            startGame();
          }
          break;
        case 'r':
          e.preventDefault();
          resetGame();
          break;
        case 'p':
          e.preventDefault();
          if (gameStarted) {
            pauseGame();
          }
          break;
        case '1':
          e.preventDefault();
          buyUpgrade('power');
          break;
        case '2':
          e.preventDefault();
          buyUpgrade('auto');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, startGame, resetGame, pauseGame, buyUpgrade]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('click', handleClick);
      return () => canvas.removeEventListener('click', handleClick);
    }
  }, [handleClick]);

  useEffect(() => {
    if (isPlaying) {
      gameLoop();
    } else {
      draw();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, gameLoop, draw]);

  return (
    <GameLayout
      gameTitle="Neon Clicker"
      gameCategory="Idle"
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
            className="border-2 border-lime-400 rounded-lg shadow-2xl bg-slate-800 cursor-pointer"
            tabIndex={0}
          />
          
          <div className="mt-4 text-center">
            <div className="text-lime-400 text-lg font-bold mb-2">
              Difficulty: Easy
            </div>
            <div className="flex justify-center space-x-4 text-sm text-gray-300">
              <span>Space: Start</span>
              <span>Click: Gain Energy</span>
              <span>1/2: Upgrades</span>
              <span>P: Pause</span>
            </div>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default NeonClicker;
