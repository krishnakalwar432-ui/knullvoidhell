import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Position {
  x: number;
  y: number;
}

interface Ball extends Position {
  vx: number;
  vy: number;
  size: number;
}

interface Paddle extends Position {
  width: number;
  height: number;
}

const NeonPong: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [ball, setBall] = useState<Ball>({ x: 400, y: 300, vx: 5, vy: 3, size: 12 });
  const [playerPaddle, setPlayerPaddle] = useState<Paddle>({ x: 50, y: 250, width: 20, height: 100 });
  const [aiPaddle, setAiPaddle] = useState<Paddle>({ x: 730, y: 250, width: 20, height: 100 });
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [particles, setParticles] = useState<Array<{x: number, y: number, vx: number, vy: number, life: number}>>([]);

  const gameLoopRef = useRef<number>();
  const mouseY = useRef(300);

  // Game constants
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const PADDLE_SPEED = 6;
  const AI_SPEED = 4;

  // Handle input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => new Set([...prev, e.key.toLowerCase()]));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(e.key.toLowerCase());
        return newKeys;
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        mouseY.current = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Touch controls
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        mouseY.current = ((touch.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
      }
    }
  };

  // Ball collision with paddles
  const checkPaddleCollision = useCallback((ball: Ball, paddle: Paddle): boolean => {
    return ball.x - ball.size < paddle.x + paddle.width &&
           ball.x + ball.size > paddle.x &&
           ball.y - ball.size < paddle.y + paddle.height &&
           ball.y + ball.size > paddle.y;
  }, []);

  // Create particle effect
  const createParticles = useCallback((x: number, y: number, color: string) => {
    const newParticles = [];
    for (let i = 0; i < 10; i++) {
      newParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      // Move player paddle
      setPlayerPaddle(prev => {
        let newY = prev.y;
        
        // Keyboard controls
        if (keys.has('arrowup') || keys.has('w')) {
          newY = Math.max(0, prev.y - PADDLE_SPEED);
        }
        if (keys.has('arrowdown') || keys.has('s')) {
          newY = Math.min(CANVAS_HEIGHT - prev.height, prev.y + PADDLE_SPEED);
        }
        
        // Mouse/touch controls
        const targetY = mouseY.current - prev.height / 2;
        newY = Math.max(0, Math.min(CANVAS_HEIGHT - prev.height, targetY));
        
        return { ...prev, y: newY };
      });

      // Move AI paddle (follow ball with some delay)
      setAiPaddle(prev => {
        const targetY = ball.y - prev.height / 2;
        const diff = targetY - prev.y;
        let newY = prev.y;
        
        if (Math.abs(diff) > AI_SPEED) {
          newY = prev.y + (diff > 0 ? AI_SPEED : -AI_SPEED);
        } else {
          newY = targetY;
        }
        
        return { ...prev, y: Math.max(0, Math.min(CANVAS_HEIGHT - prev.height, newY)) };
      });

      // Move ball
      setBall(prev => {
        let newBall = {
          ...prev,
          x: prev.x + prev.vx,
          y: prev.y + prev.vy
        };

        // Collision with top/bottom walls
        if (newBall.y <= newBall.size || newBall.y >= CANVAS_HEIGHT - newBall.size) {
          newBall.vy = -newBall.vy;
          createParticles(newBall.x, newBall.y, '#00ffff');
        }

        // Collision with player paddle
        if (checkPaddleCollision(newBall, playerPaddle)) {
          newBall.vx = Math.abs(newBall.vx);
          const hitPos = (newBall.y - (playerPaddle.y + playerPaddle.height / 2)) / (playerPaddle.height / 2);
          newBall.vy = hitPos * 5;
          createParticles(newBall.x, newBall.y, '#0aff9d');
        }

        // Collision with AI paddle
        if (checkPaddleCollision(newBall, aiPaddle)) {
          newBall.vx = -Math.abs(newBall.vx);
          const hitPos = (newBall.y - (aiPaddle.y + aiPaddle.height / 2)) / (aiPaddle.height / 2);
          newBall.vy = hitPos * 5;
          createParticles(newBall.x, newBall.y, '#7000ff');
        }

        // Ball goes off left side (AI scores)
        if (newBall.x <= 0) {
          setScore(s => ({ ...s, ai: s.ai + 1 }));
          newBall = { x: 400, y: 300, vx: 5, vy: 3, size: 12 };
        }

        // Ball goes off right side (Player scores)
        if (newBall.x >= CANVAS_WIDTH) {
          setScore(s => ({ ...s, player: s.player + 1 }));
          newBall = { x: 400, y: 300, vx: -5, vy: 3, size: 12 };
        }

        return newBall;
      });

      // Update particles
      setParticles(prev => prev
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - 0.02
        }))
        .filter(p => p.life > 0)
      );

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, keys, ball, playerPaddle, aiPaddle, checkPaddleCollision, createParticles]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0a0a0f');
    gradient.addColorStop(0.5, '#1a0a2a');
    gradient.addColorStop(1, '#0f0f1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw center line
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.3;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Draw player paddle
    ctx.fillStyle = '#0aff9d';
    ctx.shadowColor = '#0aff9d';
    ctx.shadowBlur = 15;
    ctx.fillRect(playerPaddle.x, playerPaddle.y, playerPaddle.width, playerPaddle.height);

    // Draw AI paddle
    ctx.fillStyle = '#7000ff';
    ctx.shadowColor = '#7000ff';
    ctx.shadowBlur = 15;
    ctx.fillRect(aiPaddle.x, aiPaddle.y, aiPaddle.width, aiPaddle.height);

    // Draw ball
    ctx.fillStyle = '#ff0099';
    ctx.shadowColor = '#ff0099';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
    ctx.fill();

    // Draw ball trail
    ctx.globalAlpha = 0.3;
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(ball.x - ball.vx * i, ball.y - ball.vy * i, ball.size * (1 - i * 0.1), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw particles
    particles.forEach(particle => {
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw scores
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(score.player.toString(), CANVAS_WIDTH / 4, 80);
    ctx.fillText(score.ai.toString(), (CANVAS_WIDTH * 3) / 4, 80);

    ctx.shadowBlur = 0;

    if (gameState === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ffffff';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  });

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore({ player: 0, ai: 0 });
    setBall({ x: 400, y: 300, vx: 5, vy: 3, size: 12 });
    setPlayerPaddle({ x: 50, y: 250, width: 20, height: 100 });
    setAiPaddle({ x: 730, y: 250, width: 20, height: 100 });
    setParticles([]);
    setGameState('playing');
  };

  return (
    <GameLayout
      gameTitle="Neon Pong 3D"
      gameCategory="Sports"
      score={score.player}
      isPlaying={gameState === 'playing'}
      onPause={handlePause}
      onReset={handleReset}
    >
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border border-neon-purple/50 rounded-lg bg-black/20 backdrop-blur-sm shadow-2xl max-w-full h-auto"
            onTouchMove={handleTouchMove}
            style={{ touchAction: 'none' }}
          />
          
          {/* Instructions */}
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p className="md:hidden">Touch and drag to move paddle</p>
            <p className="hidden md:block">Move mouse or use W/S keys to control paddle</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default NeonPong;
