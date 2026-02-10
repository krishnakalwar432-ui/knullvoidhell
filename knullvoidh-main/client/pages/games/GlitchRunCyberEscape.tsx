import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  health: number;
  glitchEnergy: number;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'wall' | 'laser' | 'pit' | 'glitch';
  active: boolean;
}

interface Glitch {
  x: number;
  y: number;
  width: number;
  height: number;
  intensity: number;
  life: number;
}

const GlitchRunCyberEscape = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());
  
  const [gameState, setGameState] = useState({
    player: { x: 100, y: 400, vx: 0, vy: 0, grounded: false, health: 100, glitchEnergy: 100 } as Player,
    obstacles: [] as Obstacle[],
    glitches: [] as Glitch[],
    score: 0,
    distance: 0,
    gameOver: false,
    speed: 5,
    glitchMode: false,
    screenShake: 0
  });

  const createGlitch = (x: number, y: number, width: number = 50, height: number = 50) => {
    setGameState(prev => ({
      ...prev,
      glitches: [...prev.glitches, { x, y, width, height, intensity: 1, life: 60 }],
      screenShake: 10
    }));
  };

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.gameOver) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply screen shake
    if (gameState.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * gameState.screenShake;
      const shakeY = (Math.random() - 0.5) * gameState.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // Cyber background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000033');
    gradient.addColorStop(1, '#330066');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setGameState(prev => {
      const newState = { ...prev };

      // Screen shake decay
      newState.screenShake = Math.max(0, newState.screenShake - 1);

      // Player controls
      const moveSpeed = gameState.glitchMode ? 8 : 5;
      const jumpPower = gameState.glitchMode ? 18 : 15;
      
      if (keysRef.current.has('a') || keysRef.current.has('ArrowLeft')) {
        newState.player.vx = Math.max(-moveSpeed, newState.player.vx - 0.5);
      }
      if (keysRef.current.has('d') || keysRef.current.has('ArrowRight')) {
        newState.player.vx = Math.min(moveSpeed, newState.player.vx + 0.5);
      }
      if ((keysRef.current.has('w') || keysRef.current.has(' ')) && newState.player.grounded) {
        newState.player.vy = -jumpPower;
        newState.player.grounded = false;
      }

      // Glitch ability
      if (keysRef.current.has('q') && newState.player.glitchEnergy >= 30) {
        createGlitch(newState.player.x, newState.player.y);
        newState.glitchMode = true;
        newState.player.glitchEnergy -= 30;
        setTimeout(() => {
          setGameState(s => ({ ...s, glitchMode: false }));
        }, 1000);
        keysRef.current.delete('q');
      }

      // Apply gravity
      newState.player.vy += 0.8;
      
      // Update position
      newState.player.x += newState.player.vx;
      newState.player.y += newState.player.vy;

      // Friction
      newState.player.vx *= 0.9;

      // Ground collision
      if (newState.player.y >= 500) {
        newState.player.y = 500;
        newState.player.vy = 0;
        newState.player.grounded = true;
      }

      // Keep in bounds
      newState.player.x = Math.max(10, Math.min(canvas.width - 10, newState.player.x));

      // Generate obstacles
      if (Math.random() < 0.02) {
        const types: Obstacle['type'][] = ['wall', 'laser', 'pit', 'glitch'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        newState.obstacles.push({
          x: canvas.width,
          y: type === 'pit' ? 520 : 400 + Math.random() * 100,
          width: type === 'laser' ? 5 : 40,
          height: type === 'pit' ? 80 : type === 'laser' ? 200 : 60,
          type,
          active: true
        });
      }

      // Update obstacles
      newState.obstacles = newState.obstacles.map(obstacle => ({
        ...obstacle,
        x: obstacle.x - newState.speed,
        active: obstacle.type === 'laser' ? Math.sin(Date.now() * 0.01) > 0 : true
      })).filter(obstacle => obstacle.x > -100);

      // Update glitches
      newState.glitches = newState.glitches.map(glitch => ({
        ...glitch,
        life: glitch.life - 1,
        intensity: Math.sin(Date.now() * 0.02) * 0.5 + 0.5
      })).filter(glitch => glitch.life > 0);

      // Collision detection
      newState.obstacles.forEach(obstacle => {
        if (obstacle.active) {
          const hit = (
            newState.player.x < obstacle.x + obstacle.width &&
            newState.player.x + 20 > obstacle.x &&
            newState.player.y < obstacle.y + obstacle.height &&
            newState.player.y + 20 > obstacle.y
          );

          if (hit && !gameState.glitchMode) {
            if (obstacle.type === 'pit') {
              newState.gameOver = true;
            } else {
              newState.player.health -= 20;
              createGlitch(obstacle.x, obstacle.y);
              if (newState.player.health <= 0) {
                newState.gameOver = true;
              }
            }
          }
        }
      });

      // Update score and speed
      newState.distance += newState.speed;
      newState.score = Math.floor(newState.distance / 10);
      newState.speed = Math.min(12, 5 + newState.score / 1000);

      // Regenerate glitch energy
      if (newState.player.glitchEnergy < 100) {
        newState.player.glitchEnergy = Math.min(100, newState.player.glitchEnergy + 0.5);
      }

      return newState;
    });

    // Draw cyber grid
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Draw glitch effects
    gameState.glitches.forEach(glitch => {
      ctx.globalAlpha = glitch.intensity;
      
      // Random glitch colors
      const colors = ['#ff0099', '#00ff99', '#9900ff', '#ffff00'];
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      
      // Glitch rectangles
      for (let i = 0; i < 5; i++) {
        const x = glitch.x + (Math.random() - 0.5) * glitch.width;
        const y = glitch.y + (Math.random() - 0.5) * glitch.height;
        const w = Math.random() * 20;
        const h = Math.random() * 10;
        ctx.fillRect(x, y, w, h);
      }
      
      ctx.globalAlpha = 1;
    });

    // Draw obstacles
    gameState.obstacles.forEach(obstacle => {
      let color = '#666666';
      
      switch (obstacle.type) {
        case 'wall': color = '#ff6600'; break;
        case 'laser': color = obstacle.active ? '#ff0099' : '#440022'; break;
        case 'pit': color = '#000000'; break;
        case 'glitch': color = '#9900ff'; break;
      }
      
      ctx.fillStyle = color;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      
      if (obstacle.type === 'laser' && obstacle.active) {
        ctx.shadowColor = '#ff0099';
        ctx.shadowBlur = 10;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        ctx.shadowBlur = 0;
      }
    });

    // Draw player
    const playerColor = gameState.glitchMode ? '#00ffff' : '#0aff9d';
    ctx.fillStyle = playerColor;
    ctx.shadowColor = playerColor;
    ctx.shadowBlur = gameState.glitchMode ? 20 : 10;
    
    if (gameState.glitchMode) {
      // Glitchy player effect
      for (let i = 0; i < 3; i++) {
        const offsetX = (Math.random() - 0.5) * 10;
        const offsetY = (Math.random() - 0.5) * 10;
        ctx.fillRect(gameState.player.x + offsetX, gameState.player.y + offsetY, 20, 20);
      }
    } else {
      ctx.fillRect(gameState.player.x, gameState.player.y, 20, 20);
    }
    
    ctx.shadowBlur = 0;

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Health: ${gameState.player.health}`, 10, 25);
    ctx.fillText(`Score: ${gameState.score}`, 10, 45);
    ctx.fillText(`Glitch: ${Math.floor(gameState.player.glitchEnergy)}`, 10, 65);
    
    if (gameState.glitchMode) {
      ctx.fillStyle = '#00ffff';
      ctx.fillText('GLITCH MODE ACTIVE', 10, 85);
    }

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '12px monospace';
    ctx.fillText('AD: Move | W/Space: Jump | Q: Glitch Phase', 10, canvas.height - 20);

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SYSTEM ERROR', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px monospace';
      ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 40);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 70);
    }

    ctx.textAlign = 'left';
    
    // Reset transform
    if (gameState.screenShake > 0) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }, [gameState]);

  useEffect(() => {
    gameLoopRef.current = setInterval(gameLoop, 1000 / 60);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      
      if (e.key.toLowerCase() === 'r' && gameState.gameOver) {
        setGameState({
          player: { x: 100, y: 400, vx: 0, vy: 0, grounded: false, health: 100, glitchEnergy: 100 },
          obstacles: [],
          glitches: [],
          score: 0,
          distance: 0,
          gameOver: false,
          speed: 5,
          glitchMode: false,
          screenShake: 0
        });
      }
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
  }, [gameState.gameOver]);

  return (
    <GameLayout gameTitle="Glitch Run: Cyber Escape" gameCategory="Glitch through cyber obstacles">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg shadow-2xl"
        />
        <div className="text-center space-y-2">
          <p className="text-gray-300">AD: Move | W/Space: Jump | Q: Glitch Phase</p>
          <p className="text-gray-400">Escape the cyber maze using glitch abilities!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default GlitchRunCyberEscape;
