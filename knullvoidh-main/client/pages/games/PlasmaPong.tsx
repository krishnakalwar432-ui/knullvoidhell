import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  score: number;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  trail: { x: number; y: number; life: number }[];
}

interface PowerUp {
  x: number;
  y: number;
  type: 'speed' | 'size' | 'multi' | 'plasma' | 'shield';
  life: number;
  collected: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

const PlasmaPong = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const PADDLE_WIDTH = 15;
  const PADDLE_HEIGHT = 80;
  const BALL_SIZE = 12;
  const PADDLE_SPEED = 6;
  const MAX_BALL_SPEED = 8;

  const [gameState, setGameState] = useState({
    leftPaddle: {
      x: 30,
      y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      speed: PADDLE_SPEED,
      score: 0
    } as Paddle,
    rightPaddle: {
      x: CANVAS_WIDTH - 30 - PADDLE_WIDTH,
      y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      speed: PADDLE_SPEED,
      score: 0
    } as Paddle,
    balls: [{
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      vx: 4,
      vy: 2,
      size: BALL_SIZE,
      trail: []
    }] as Ball[],
    powerUps: [] as PowerUp[],
    particles: [] as Particle[],
    gameOver: false,
    paused: false,
    aiDifficulty: 0.85,
    plasmaMode: false,
    shieldActive: false,
    multiballActive: false,
    lastPowerUpSpawn: 0,
    gameStarted: false
  });

  const createParticles = (x: number, y: number, color: string, count: number = 8) => {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = Math.random() * 4 + 2;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30, maxLife: 30, color, size: Math.random() * 3 + 1
      });
    }
    return particles;
  };

  const spawnPowerUp = useCallback(() => {
    const types: PowerUp['type'][] = ['speed', 'size', 'multi', 'plasma', 'shield'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    return {
      x: CANVAS_WIDTH * 0.3 + Math.random() * CANVAS_WIDTH * 0.4,
      y: 50 + Math.random() * (CANVAS_HEIGHT - 100),
      type,
      life: 300, // 5 seconds at 60fps
      collected: false
    };
  }, []);

  const resetBall = (ball: Ball, toLeft: boolean = false) => {
    ball.x = CANVAS_WIDTH / 2;
    ball.y = CANVAS_HEIGHT / 2;
    ball.vx = toLeft ? -4 : 4;
    ball.vy = (Math.random() - 0.5) * 4;
    ball.size = BALL_SIZE;
    ball.trail = [];
  };

  const checkPaddleBallCollision = (paddle: Paddle, ball: Ball) => {
    return ball.x - ball.size < paddle.x + paddle.width &&
           ball.x + ball.size > paddle.x &&
           ball.y - ball.size < paddle.y + paddle.height &&
           ball.y + ball.size > paddle.y;
  };

  const update = useCallback(() => {
    if (gameState.gameOver || gameState.paused || !gameState.gameStarted) return;

    setGameState(prev => {
      const newState = { ...prev };
      const keys = keysRef.current;
      const currentTime = Date.now();

      // Player controls (left paddle)
      if (keys.has('w') || keys.has('ArrowUp')) {
        newState.leftPaddle.y = Math.max(0, newState.leftPaddle.y - newState.leftPaddle.speed);
      }
      if (keys.has('s') || keys.has('ArrowDown')) {
        newState.leftPaddle.y = Math.min(CANVAS_HEIGHT - newState.leftPaddle.height, 
                                        newState.leftPaddle.y + newState.leftPaddle.speed);
      }

      // AI for right paddle
      const targetBall = newState.balls[0]; // Follow first ball
      if (targetBall) {
        const paddleCenter = newState.rightPaddle.y + newState.rightPaddle.height / 2;
        const targetY = targetBall.y;
        const diff = targetY - paddleCenter;
        
        if (Math.abs(diff) > 10) {
          const aiSpeed = newState.rightPaddle.speed * newState.aiDifficulty;
          if (diff > 0) {
            newState.rightPaddle.y = Math.min(CANVAS_HEIGHT - newState.rightPaddle.height,
                                             newState.rightPaddle.y + aiSpeed);
          } else {
            newState.rightPaddle.y = Math.max(0, newState.rightPaddle.y - aiSpeed);
          }
        }
      }

      // Update balls
      newState.balls.forEach((ball, ballIndex) => {
        // Add to trail
        ball.trail.push({ x: ball.x, y: ball.y, life: 10 });
        ball.trail = ball.trail.filter(point => {
          point.life--;
          return point.life > 0;
        });

        // Move ball
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Ball collision with top/bottom walls
        if (ball.y - ball.size <= 0 || ball.y + ball.size >= CANVAS_HEIGHT) {
          ball.vy = -ball.vy;
          newState.particles.push(...createParticles(ball.x, ball.y, '#00ffff', 6));
        }

        // Ball collision with paddles
        if (checkPaddleBallCollision(newState.leftPaddle, ball)) {
          if (ball.vx < 0) {
            ball.vx = -ball.vx;
            ball.vy += (ball.y - (newState.leftPaddle.y + newState.leftPaddle.height / 2)) * 0.1;
            ball.vx = Math.min(ball.vx * 1.05, MAX_BALL_SPEED); // Slight acceleration
            newState.particles.push(...createParticles(ball.x, ball.y, '#ff00ff', 8));
          }
        }

        if (checkPaddleBallCollision(newState.rightPaddle, ball)) {
          if (ball.vx > 0) {
            ball.vx = -ball.vx;
            ball.vy += (ball.y - (newState.rightPaddle.y + newState.rightPaddle.height / 2)) * 0.1;
            ball.vx = Math.max(ball.vx * 1.05, -MAX_BALL_SPEED); // Slight acceleration
            newState.particles.push(...createParticles(ball.x, ball.y, '#ff00ff', 8));
          }
        }

        // Scoring
        if (ball.x + ball.size < 0) {
          newState.rightPaddle.score++;
          if (newState.balls.length === 1) {
            resetBall(ball, false);
          } else {
            newState.balls.splice(ballIndex, 1);
          }
        } else if (ball.x - ball.size > CANVAS_WIDTH) {
          newState.leftPaddle.score++;
          if (newState.balls.length === 1) {
            resetBall(ball, true);
          } else {
            newState.balls.splice(ballIndex, 1);
          }
        }
      });

      // Spawn power-ups
      if (currentTime - newState.lastPowerUpSpawn > 8000 && newState.powerUps.length < 2) {
        newState.powerUps.push(spawnPowerUp());
        newState.lastPowerUpSpawn = currentTime;
      }

      // Update power-ups
      newState.powerUps = newState.powerUps.filter(powerUp => {
        powerUp.life--;
        
        // Check collision with balls
        newState.balls.forEach(ball => {
          if (!powerUp.collected && 
              Math.abs(ball.x - powerUp.x) < 30 && 
              Math.abs(ball.y - powerUp.y) < 30) {
            powerUp.collected = true;
            
            // Apply power-up effect
            switch (powerUp.type) {
              case 'speed':
                newState.leftPaddle.speed = PADDLE_SPEED * 1.5;
                setTimeout(() => {
                  if (newState.leftPaddle) newState.leftPaddle.speed = PADDLE_SPEED;
                }, 5000);
                break;
              case 'size':
                ball.size = BALL_SIZE * 1.5;
                setTimeout(() => {
                  ball.size = BALL_SIZE;
                }, 5000);
                break;
              case 'multi':
                if (newState.balls.length < 3) {
                  const newBall = {
                    x: ball.x,
                    y: ball.y,
                    vx: -ball.vx + (Math.random() - 0.5) * 2,
                    vy: ball.vy + (Math.random() - 0.5) * 2,
                    size: BALL_SIZE,
                    trail: []
                  };
                  newState.balls.push(newBall);
                }
                break;
              case 'plasma':
                newState.plasmaMode = true;
                setTimeout(() => {
                  newState.plasmaMode = false;
                }, 7000);
                break;
              case 'shield':
                newState.shieldActive = true;
                setTimeout(() => {
                  newState.shieldActive = false;
                }, 6000);
                break;
            }
            
            newState.particles.push(...createParticles(powerUp.x, powerUp.y, '#ffff00', 12));
          }
        });
        
        return powerUp.life > 0 && !powerUp.collected;
      });

      // Update particles
      newState.particles = newState.particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        return particle.life > 0;
      });

      // Check game over
      if (newState.leftPaddle.score >= 5 || newState.rightPaddle.score >= 5) {
        newState.gameOver = true;
      }

      return newState;
    });
  }, [gameState.gameOver, gameState.paused, gameState.gameStarted, spawnPowerUp]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with space background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#000022');
    gradient.addColorStop(1, '#000066');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    const paddleGlow = gameState.plasmaMode ? 20 : 10;
    
    // Left paddle
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = paddleGlow;
    ctx.fillRect(gameState.leftPaddle.x, gameState.leftPaddle.y, 
                 gameState.leftPaddle.width, gameState.leftPaddle.height);
    
    // Right paddle
    ctx.fillStyle = '#ff00ff';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = paddleGlow;
    ctx.fillRect(gameState.rightPaddle.x, gameState.rightPaddle.y, 
                 gameState.rightPaddle.width, gameState.rightPaddle.height);
    
    ctx.shadowBlur = 0;

    // Draw balls with trails
    gameState.balls.forEach(ball => {
      // Draw trail
      ball.trail.forEach((point, index) => {
        const alpha = point.life / 10;
        ctx.save();
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillStyle = gameState.plasmaMode ? '#ffff00' : '#ffffff';
        ctx.beginPath();
        ctx.arc(point.x, point.y, ball.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw ball
      const ballColor = gameState.plasmaMode ? '#ffff00' : '#ffffff';
      ctx.fillStyle = ballColor;
      ctx.shadowColor = ballColor;
      ctx.shadowBlur = gameState.plasmaMode ? 25 : 15;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.shadowBlur = 0;

    // Draw power-ups
    gameState.powerUps.forEach(powerUp => {
      const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
      const colors = {
        speed: '#00ff00',
        size: '#ff8800',
        multi: '#8800ff',
        plasma: '#ffff00',
        shield: '#0088ff'
      };
      
      ctx.fillStyle = colors[powerUp.type];
      ctx.shadowColor = colors[powerUp.type];
      ctx.shadowBlur = 15 * pulse;
      ctx.beginPath();
      ctx.arc(powerUp.x, powerUp.y, 15 * pulse, 0, Math.PI * 2);
      ctx.fill();
      
      // Power-up symbol
      ctx.fillStyle = 'black';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      const symbols = { speed: '⚡', size: '🔸', multi: '✦', plasma: '💥', shield: '🛡' };
      ctx.fillText(symbols[powerUp.type], powerUp.x, powerUp.y + 5);
    });

    ctx.shadowBlur = 0;

    // Draw particles
    gameState.particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw scores
    ctx.fillStyle = '#00ffff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(gameState.leftPaddle.score.toString(), canvas.width / 4, 80);
    
    ctx.fillStyle = '#ff00ff';
    ctx.fillText(gameState.rightPaddle.score.toString(), (canvas.width * 3) / 4, 80);

    // Draw active effects
    if (gameState.plasmaMode || gameState.shieldActive || gameState.multiballActive) {
      ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#ffff00';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      let effectText = '';
      if (gameState.plasmaMode) effectText += 'PLASMA MODE ';
      if (gameState.shieldActive) effectText += 'SHIELD ACTIVE ';
      if (gameState.multiballActive) effectText += 'MULTIBALL ';
      ctx.fillText(effectText, canvas.width / 2, canvas.height - 30);
    }

    if (!gameState.gameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#00ffff';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PLASMA PONG', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.fillText('Press SPACE to start!', canvas.width / 2, canvas.height / 2 + 20);
      ctx.font = '16px Arial';
      ctx.fillText('W/S: Move paddle | First to 5 wins!', canvas.width / 2, canvas.height / 2 + 60);
    }

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const winner = gameState.leftPaddle.score >= 5 ? 'PLAYER' : 'AI';
      const winnerColor = gameState.leftPaddle.score >= 5 ? '#00ffff' : '#ff00ff';
      
      ctx.fillStyle = winnerColor;
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${winner} WINS!`, canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 20);
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' && gameState.gameOver) {
        setGameState({
          leftPaddle: {
            x: 30, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
            width: PADDLE_WIDTH, height: PADDLE_HEIGHT, speed: PADDLE_SPEED, score: 0
          },
          rightPaddle: {
            x: CANVAS_WIDTH - 30 - PADDLE_WIDTH, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
            width: PADDLE_WIDTH, height: PADDLE_HEIGHT, speed: PADDLE_SPEED, score: 0
          },
          balls: [{
            x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, vx: 4, vy: 2, size: BALL_SIZE, trail: []
          }],
          powerUps: [], particles: [], gameOver: false, paused: false,
          aiDifficulty: 0.85, plasmaMode: false, shieldActive: false, multiballActive: false,
          lastPowerUpSpawn: 0, gameStarted: false
        });
        return;
      }
      
      if (e.key === ' ' && !gameState.gameStarted) {
        setGameState(prev => ({ ...prev, gameStarted: true }));
        return;
      }
      
      if (e.key === 'p') {
        setGameState(prev => ({ ...prev, paused: !prev.paused }));
        return;
      }
      
      keysRef.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.gameOver, gameState.gameStarted]);

  useEffect(() => {
    gameLoopRef.current = setInterval(() => {
      update();
      render();
    }, 1000 / 60);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [update, render]);

  return (
    <GameLayout 
      gameTitle="Plasma Pong" 
      gameCategory="Arcade sports"
      showMobileControls={true}
    >
      <div className="flex flex-col items-center gap-4 p-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-cyan-400 bg-black rounded-lg max-w-full h-auto"
          style={{ boxShadow: '0 0 20px #00ffff' }}
        />
        <div className="text-center text-gray-300">
          <p>W/S: Move Paddle | Space: Start | P: Pause | R: Restart</p>
          <p className="text-sm text-cyan-400">Collect power-ups for special effects! First to 5 wins!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default PlasmaPong;
