import React, { useState, useRef, useEffect, useCallback } from 'react';
import GameLayout from '../../components/GameLayout';

const CyberJumper: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameOver(false);
    setIsPlaying(true);
    setScore(0);
  }, []);

  const pauseGame = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const resetGame = useCallback(() => {
    setGameStarted(false);
    setGameOver(false);
    setIsPlaying(false);
    setScore(0);
  }, []);

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
      ctx.fillStyle = '#00ffff';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CyberJumper', 400, 250);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.fillText('Cyberpunk platformer adventure', 400, 300);
      ctx.fillText('Press SPACE to start', 400, 350);
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
      // Draw cyberpunk platforms
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(0, 550, 200, 50);
      ctx.fillRect(300, 450, 200, 20);
      ctx.fillRect(600, 350, 200, 20);
      
      // Draw glowing player
      const time = Date.now() * 0.01;
      const glowIntensity = 0.7 + 0.3 * Math.sin(time);
      ctx.fillStyle = `rgba(0, 255, 255, ${glowIntensity})`;
      ctx.fillRect(95, 520, 20, 30);
      
      // Draw neon grid background
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 800; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 600);
        ctx.stroke();
      }
      for (let i = 0; i < 600; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(800, i);
        ctx.stroke();
      }
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${score}`, 20, 30);
    }

    ctx.textAlign = 'left';
  }, [gameStarted, gameOver, score]);

  const gameLoop = useCallback(() => {
    if (!isPlaying || gameOver) return;
    setScore(prev => prev + 1);
    draw();
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, gameOver, draw]);

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

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      gameTitle="CyberJumper"
      gameCategory="Platform"
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
              Difficulty: Medium
            </div>
            <div className="flex justify-center space-x-4 text-sm text-gray-300">
              <span>Space: Start</span>
              <span>P: Pause</span>
              <span>R: Restart</span>
              <span>WASD: Move/Jump</span>
            </div>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default CyberJumper;
