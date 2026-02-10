import React, { useState, useEffect, useRef } from 'react';
import GameLayout from '@/components/GameLayout';
import { 
  getSafeCanvas2DContext, 
  createSafeAnimationManager, 
  createSafeKeyManager,
  checkCollision,
  clamp,
  gameManager
} from '@/utils/universalGameFix';

const VectorRush: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(5);
  const [player, setPlayer] = useState({ x: 400, y: 500, lane: 1 });
  const [obstacles, setObstacles] = useState<Array<{x: number, y: number, lane: number, type: number}>>([]);
  
  const keyManagerRef = useRef(createSafeKeyManager());
  const animationManagerRef = useRef(createSafeAnimationManager());
  const gameId = 'vector-rush';

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const LANES = 3;
  const LANE_WIDTH = CANVAS_WIDTH / LANES;

  // Initialize game
  useEffect(() => {
    gameManager.registerGame(gameId);
    
    return () => {
      gameManager.unregisterGame(gameId);
      keyManagerRef.current.cleanup();
      animationManagerRef.current.stop();
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const gameLoop = () => {
      try {
        const keyManager = keyManagerRef.current;
        
        // Update player lane
        setPlayer(prev => {
          let newLane = prev.lane;
          if ((keyManager.isPressed('a') || keyManager.isPressed('arrowleft')) && prev.lane > 0) {
            newLane = prev.lane - 1;
          }
          if ((keyManager.isPressed('d') || keyManager.isPressed('arrowright')) && prev.lane < LANES - 1) {
            newLane = prev.lane + 1;
          }
          return { ...prev, lane: newLane, x: newLane * LANE_WIDTH + LANE_WIDTH / 2 };
        });

        // Spawn obstacles
        if (Math.random() < 0.03) {
          setObstacles(prev => [...prev, {
            x: Math.floor(Math.random() * LANES) * LANE_WIDTH + LANE_WIDTH / 2,
            y: -50,
            lane: Math.floor(Math.random() * LANES),
            type: Math.floor(Math.random() * 3)
          }]);
        }

        // Update obstacles
        setObstacles(prev => prev
          .map(obs => ({ ...obs, y: obs.y + speed }))
          .filter(obs => obs.y < CANVAS_HEIGHT + 50)
        );

        // Collision detection
        setObstacles(prevObstacles => {
          const collision = prevObstacles.some(obs => 
            obs.lane === player.lane && obs.y > 450 && obs.y < 550
          );
          
          if (collision) {
            setGameState('gameOver');
          }
          
          return prevObstacles;
        });

        // Update score and speed
        setScore(prev => prev + Math.floor(speed));
        setSpeed(prev => clamp(prev + 0.001, 1, 15));
        
      } catch (error) {
        console.error('VectorRush game loop error:', error);
        setGameState('gameOver');
      }
    };
    
    animationManagerRef.current.start(gameLoop);
    
    return () => {
      animationManagerRef.current.stop();
    };
  }, [gameState, player.lane, speed]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = getSafeCanvas2DContext(canvas);
    if (!ctx) return;

    try {
      // Clear with dark background
      ctx.fillStyle = '#000011';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw vector grid background
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 1;
      for (let i = 0; i <= LANES; i++) {
        ctx.beginPath();
        ctx.moveTo(i * LANE_WIDTH, 0);
        ctx.lineTo(i * LANE_WIDTH, CANVAS_HEIGHT);
        ctx.stroke();
      }

      // Draw speed lines
      for (let i = 0; i < 20; i++) {
        const y = (i * 40 - (Date.now() * speed * 0.1) % 800) % CANVAS_HEIGHT;
        ctx.strokeStyle = `rgba(0, 255, 0, 0.3)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      // Draw obstacles
      obstacles.forEach(obs => {
        const colors = ['#ff0099', '#7000ff', '#ff6600'];
        ctx.strokeStyle = colors[obs.type] || '#ff0099';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        if (obs.type === 0) {
          ctx.rect(obs.x - 20, obs.y - 20, 40, 40);
        } else if (obs.type === 1) {
          ctx.moveTo(obs.x, obs.y - 25);
          ctx.lineTo(obs.x + 20, obs.y + 15);
          ctx.lineTo(obs.x - 20, obs.y + 15);
          ctx.closePath();
        } else {
          ctx.arc(obs.x, obs.y, 20, 0, Math.PI * 2);
        }
        ctx.stroke();
      });

      // Draw player
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(player.x, player.y - 20);
      ctx.lineTo(player.x - 15, player.y + 10);
      ctx.lineTo(player.x, player.y + 5);
      ctx.lineTo(player.x + 15, player.y + 10);
      ctx.closePath();
      ctx.stroke();

      // UI
      ctx.fillStyle = '#00ff00';
      ctx.font = '18px monospace';
      ctx.fillText(`Score: ${score}`, 20, 30);
      ctx.fillText(`Speed: ${speed.toFixed(1)}`, 20, 55);

      if (gameState === 'gameOver') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.font = '48px monospace';
        ctx.textAlign = 'center';
        ctx.strokeText('CRASH!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.textAlign = 'left';
      }
    } catch (error) {
      console.error('VectorRush render error:', error);
    }
  }, [gameState, score, speed, player, obstacles]);

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };
  
  const handleReset = () => {
    setScore(0);
    setSpeed(5);
    setPlayer({ x: 400, y: 500, lane: 1 });
    setObstacles([]);
    setGameState('playing');
  };

  return (
    <GameLayout 
      gameTitle="Vector Rush" 
      gameCategory="Racing" 
      score={score} 
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
            className="border border-green-500/50 rounded-lg bg-black/20 backdrop-blur-sm shadow-2xl max-w-full h-auto" 
            style={{ touchAction: 'none' }} 
          />
          <div className="mt-4 text-center text-sm text-gray-400">
            <p>A/D or Arrow keys to change lanes • High-speed vector racing!</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default VectorRush;
