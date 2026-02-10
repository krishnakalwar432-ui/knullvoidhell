import React, { useState, useRef, useEffect, useCallback } from 'react';
import GameLayout from '../../components/GameLayout';

const TurboDrift: React.FC = () => {
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

    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, 800, 600);

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 800, 600);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    if (!gameStarted) {
      ctx.fillStyle = '#ff6b35';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Turbo Drift', 400, 250);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.fillText('High-speed drifting with turbo boosts', 400, 300);
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
      // Draw racing track
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.setLineDash([]);
      ctx.strokeRect(100, 100, 600, 400);
      
      // Draw center line
      ctx.setLineDash([20, 10]);
      ctx.beginPath();
      ctx.moveTo(400, 100);
      ctx.lineTo(400, 500);
      ctx.stroke();
      
      // Draw car
      ctx.fillStyle = '#ff6b35';
      ctx.fillRect(380, 300, 40, 20);
      
      // Draw turbo effects
      const time = Date.now() * 0.01;
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = `rgba(255, 107, 53, ${0.8 - i * 0.15})`;
        ctx.fillRect(360 - i * 8, 302 + Math.sin(time + i) * 2, 15, 4);
        ctx.fillRect(360 - i * 8, 314 + Math.sin(time + i) * 2, 15, 4);
      }
      
      // Score display
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${score}`, 20, 30);
      ctx.fillText('Speed: TURBO', 20, 55);
    }

    ctx.textAlign = 'left';
  }, [gameStarted, gameOver, score]);

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
    let frameId: number;

    const animate = () => {
      if (isPlaying && !gameOver) {
        setScore(prev => prev + 1);
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
      gameTitle="Turbo Drift"
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
            className="border-2 border-orange-400 rounded-lg shadow-2xl bg-slate-800"
            tabIndex={0}
          />
          
          <div className="mt-4 text-center">
            <div className="text-orange-400 text-lg font-bold mb-2">
              Difficulty: Medium
            </div>
            <div className="flex justify-center space-x-4 text-sm text-gray-300">
              <span>Space: Start</span>
              <span>P: Pause</span>
              <span>R: Restart</span>
              <span>WASD: Drive</span>
            </div>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default TurboDrift;
