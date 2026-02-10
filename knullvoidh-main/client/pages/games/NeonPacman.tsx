import React, { useState, useRef, useEffect, useCallback } from 'react';
import GameLayout from '../../components/GameLayout';

const NeonPacman: React.FC = () => {
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
      ctx.fillStyle = '#ffff00';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('NEON PACMAN', 400, 250);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.fillText('Classic Pacman with neon style', 400, 300);
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
      // Draw neon maze walls
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      
      // Maze outline
      ctx.rect(50, 50, 700, 500);
      
      // Internal walls
      ctx.rect(100, 100, 100, 50);
      ctx.rect(250, 100, 100, 50);
      ctx.rect(450, 100, 100, 50);
      ctx.rect(600, 100, 100, 50);
      
      ctx.stroke();
      
      // Draw neon dots
      ctx.fillStyle = '#ffff00';
      for (let x = 80; x < 720; x += 40) {
        for (let y = 80; y < 520; y += 40) {
          if ((x - 80) % 80 === 0 && (y - 80) % 80 === 0) {
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      
      // Draw glowing Pacman
      const time = Date.now() * 0.01;
      const mouthAngle = Math.sin(time * 4) * 0.5 + 0.5;
      
      ctx.save();
      ctx.translate(400, 300);
      
      // Glow effect
      const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
      glowGradient.addColorStop(0, '#ffff00');
      glowGradient.addColorStop(0.7, 'rgba(255, 255, 0, 0.3)');
      glowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(0, 0, 40, 0, Math.PI * 2);
      ctx.fill();
      
      // Pacman body
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(0, 0, 20, mouthAngle * 0.5, (2 * Math.PI) - mouthAngle * 0.5);
      ctx.lineTo(0, 0);
      ctx.fill();
      
      // Eye
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-5, -8, 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
      
      // Draw neon ghosts
      const ghostColors = ['#ff0000', '#00ff00', '#0000ff', '#ff00ff'];
      ghostColors.forEach((color, i) => {
        const ghostX = 150 + i * 150;
        const ghostY = 200 + Math.sin(time + i) * 10;
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(ghostX, ghostY, 15, Math.PI, 0);
        ctx.lineTo(ghostX + 15, ghostY + 20);
        ctx.lineTo(ghostX + 10, ghostY + 15);
        ctx.lineTo(ghostX + 5, ghostY + 20);
        ctx.lineTo(ghostX, ghostY + 15);
        ctx.lineTo(ghostX - 5, ghostY + 20);
        ctx.lineTo(ghostX - 10, ghostY + 15);
        ctx.lineTo(ghostX - 15, ghostY + 20);
        ctx.closePath();
        ctx.fill();
        
        // Ghost eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ghostX - 5, ghostY - 3, 3, 0, Math.PI * 2);
        ctx.arc(ghostX + 5, ghostY - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(ghostX - 5, ghostY - 3, 1, 0, Math.PI * 2);
        ctx.arc(ghostX + 5, ghostY - 3, 1, 0, Math.PI * 2);
        ctx.fill();
      });
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${score}`, 20, 30);
      ctx.fillText('Lives: ●●●', 20, 55);
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
    if (!isPlaying || gameOver) {
      draw();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    let raf = 0;
    const loop = () => {
      setScore((s) => s + 10);
      draw();
      raf = requestAnimationFrame(loop);
      animationFrameRef.current = raf;
    };
    raf = requestAnimationFrame(loop);
    animationFrameRef.current = raf;

    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isPlaying, gameOver, draw]);

  return (
    <GameLayout
      gameTitle="Neon Pacman"
      gameCategory="Arcade"
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
            className="border-2 border-yellow-400 rounded-lg shadow-2xl bg-slate-800"
            tabIndex={0}
          />
          
          <div className="mt-4 text-center">
            <div className="text-yellow-400 text-lg font-bold mb-2">
              Difficulty: Easy
            </div>
            <div className="flex justify-center space-x-4 text-sm text-gray-300">
              <span>Space: Start</span>
              <span>P: Pause</span>
              <span>R: Restart</span>
              <span>Arrow Keys: Move</span>
            </div>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default NeonPacman;
