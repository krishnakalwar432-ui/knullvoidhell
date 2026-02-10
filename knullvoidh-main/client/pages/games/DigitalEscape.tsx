import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  onGround: boolean;
  color: string;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  type: 'solid' | 'moving' | 'disappearing';
  movingDirection?: number;
  moveSpeed?: number;
  disappearTime?: number;
}

interface Collectible {
  x: number;
  y: number;
  collected: boolean;
  value: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const MOVE_SPEED = 5;

export default function DigitalEscape() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [player, setPlayer] = useState<Player>({
    x: 50,
    y: GAME_HEIGHT - 150,
    vx: 0,
    vy: 0,
    width: 20,
    height: 30,
    onGround: false,
    color: '#0aff9d'
  });
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [keys, setKeys] = useState<{[key: string]: boolean}>({});
  const [levelComplete, setLevelComplete] = useState(false);

  const generateLevel = useCallback((levelNum: number) => {
    const newPlatforms: Platform[] = [
      // Ground
      { x: 0, y: GAME_HEIGHT - 20, width: GAME_WIDTH, height: 20, color: '#001d3d', type: 'solid' },
      
      // Level-specific platforms
      { x: 150, y: GAME_HEIGHT - 120, width: 100, height: 20, color: '#7000ff', type: 'solid' },
      { x: 300, y: GAME_HEIGHT - 200, width: 80, height: 20, color: '#ff0099', type: 'moving', movingDirection: 1, moveSpeed: 2 },
      { x: 450, y: GAME_HEIGHT - 150, width: 60, height: 20, color: '#00ffff', type: 'disappearing', disappearTime: 0 },
      { x: 550, y: GAME_HEIGHT - 280, width: 100, height: 20, color: '#7000ff', type: 'solid' },
      { x: 700, y: GAME_HEIGHT - 180, width: 80, height: 20, color: '#0aff9d', type: 'solid' },
      
      // Additional platforms for higher levels
      ...(levelNum > 1 ? [
        { x: 200, y: GAME_HEIGHT - 350, width: 60, height: 20, color: '#ff0099', type: 'moving' as const, movingDirection: -1, moveSpeed: 1.5 },
        { x: 400, y: GAME_HEIGHT - 400, width: 50, height: 20, color: '#00ffff', type: 'disappearing' as const, disappearTime: 0 }
      ] : [])
    ];

    const newCollectibles: Collectible[] = [
      { x: 175, y: GAME_HEIGHT - 160, collected: false, value: 10, color: '#ffff00' },
      { x: 320, y: GAME_HEIGHT - 240, collected: false, value: 15, color: '#ff8000' },
      { x: 470, y: GAME_HEIGHT - 190, collected: false, value: 20, color: '#ff0080' },
      { x: 575, y: GAME_HEIGHT - 320, collected: false, value: 25, color: '#8000ff' },
      { x: 720, y: GAME_HEIGHT - 220, collected: false, value: 30, color: '#00ff80' },
      
      ...(levelNum > 1 ? [
        { x: 220, y: GAME_HEIGHT - 390, collected: false, value: 50, color: '#ffffff' },
        { x: 420, y: GAME_HEIGHT - 440, collected: false, value: 100, color: '#gold' }
      ] : [])
    ];

    setPlatforms(newPlatforms);
    setCollectibles(newCollectibles);
    setPlayer(prev => ({ ...prev, x: 50, y: GAME_HEIGHT - 150, vx: 0, vy: 0 }));
    setLevelComplete(false);
  }, []);

  const createParticles = useCallback((x: number, y: number, color: string, count: number = 5) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 30,
        color
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const checkCollision = useCallback((rect1: any, rect2: any) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }, []);

  const gameLoop = useCallback(() => {
    if (!isPlaying || isPaused) return;

    setPlayer(prevPlayer => {
      let newPlayer = { ...prevPlayer };

      // Handle input
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        newPlayer.vx = -MOVE_SPEED;
      } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        newPlayer.vx = MOVE_SPEED;
      } else {
        newPlayer.vx *= 0.8; // Friction
      }

      if ((keys['ArrowUp'] || keys['w'] || keys['W'] || keys[' ']) && newPlayer.onGround) {
        newPlayer.vy = JUMP_FORCE;
        newPlayer.onGround = false;
        createParticles(newPlayer.x + newPlayer.width/2, newPlayer.y + newPlayer.height, '#0aff9d');
      }

      // Apply gravity
      newPlayer.vy += GRAVITY;

      // Update position
      newPlayer.x += newPlayer.vx;
      newPlayer.y += newPlayer.vy;

      // Check platform collisions
      newPlayer.onGround = false;
      platforms.forEach(platform => {
        if (checkCollision(newPlayer, platform)) {
          // Landing on top
          if (prevPlayer.y + prevPlayer.height <= platform.y && newPlayer.vy > 0) {
            newPlayer.y = platform.y - newPlayer.height;
            newPlayer.vy = 0;
            newPlayer.onGround = true;
          }
          // Hitting from below
          else if (prevPlayer.y >= platform.y + platform.height && newPlayer.vy < 0) {
            newPlayer.y = platform.y + platform.height;
            newPlayer.vy = 0;
          }
          // Side collisions
          else if (prevPlayer.x + prevPlayer.width <= platform.x) {
            newPlayer.x = platform.x - newPlayer.width;
            newPlayer.vx = 0;
          }
          else if (prevPlayer.x >= platform.x + platform.width) {
            newPlayer.x = platform.x + platform.width;
            newPlayer.vx = 0;
          }
        }
      });

      // Check boundaries
      if (newPlayer.x < 0) newPlayer.x = 0;
      if (newPlayer.x + newPlayer.width > GAME_WIDTH) newPlayer.x = GAME_WIDTH - newPlayer.width;

      // Check if fell off screen
      if (newPlayer.y > GAME_HEIGHT) {
        setLives(prev => prev - 1);
        createParticles(newPlayer.x + newPlayer.width/2, GAME_HEIGHT/2, '#ff0000', 10);
        return { ...newPlayer, x: 50, y: GAME_HEIGHT - 150, vx: 0, vy: 0 };
      }

      return newPlayer;
    });

    // Update moving platforms
    setPlatforms(prevPlatforms => prevPlatforms.map(platform => {
      if (platform.type === 'moving' && platform.movingDirection !== undefined) {
        let newX = platform.x + (platform.moveSpeed || 1) * platform.movingDirection;
        let newDirection = platform.movingDirection;
        
        if (newX <= 0 || newX + platform.width >= GAME_WIDTH) {
          newDirection = -platform.movingDirection;
          newX = platform.x + (platform.moveSpeed || 1) * newDirection;
        }
        
        return { ...platform, x: newX, movingDirection: newDirection };
      }
      
      if (platform.type === 'disappearing') {
        const playerOnPlatform = checkCollision(player, platform) && player.onGround;
        if (playerOnPlatform) {
          return { ...platform, disappearTime: (platform.disappearTime || 0) + 1 };
        }
      }
      
      return platform;
    }).filter(platform => platform.type !== 'disappearing' || (platform.disappearTime || 0) < 60));

    // Check collectible collection
    setCollectibles(prevCollectibles => prevCollectibles.map(collectible => {
      if (!collectible.collected && checkCollision(player, { ...collectible, width: 20, height: 20 })) {
        setScore(prevScore => prevScore + collectible.value);
        createParticles(collectible.x + 10, collectible.y + 10, collectible.color);
        return { ...collectible, collected: true };
      }
      return collectible;
    }));

    // Update particles
    setParticles(prevParticles => prevParticles.map(particle => ({
      ...particle,
      x: particle.x + particle.vx,
      y: particle.y + particle.vy,
      vx: particle.vx * 0.98,
      vy: particle.vy * 0.98,
      life: particle.life - 1
    })).filter(particle => particle.life > 0));

    // Check level completion
    const allCollected = collectibles.every(c => c.collected);
    if (allCollected && !levelComplete && player.x > GAME_WIDTH - 100) {
      setLevelComplete(true);
      setLevel(prev => prev + 1);
      createParticles(player.x + player.width/2, player.y + player.height/2, '#ffff00', 20);
    }
  }, [isPlaying, isPaused, keys, player, platforms, collectibles, checkCollision, createParticles, levelComplete]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(1, '#000814');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw grid pattern
    ctx.strokeStyle = '#001d3d';
    ctx.lineWidth = 1;
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < GAME_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_WIDTH, y);
      ctx.stroke();
    }

    // Draw platforms
    platforms.forEach(platform => {
      ctx.fillStyle = platform.color;
      ctx.shadowColor = platform.color;
      ctx.shadowBlur = platform.type === 'disappearing' ? 5 : 10;
      
      const alpha = platform.type === 'disappearing' && platform.disappearTime 
        ? Math.max(0, 1 - (platform.disappearTime / 60)) 
        : 1;
      
      ctx.globalAlpha = alpha;
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    });

    // Draw collectibles
    collectibles.forEach(collectible => {
      if (!collectible.collected) {
        ctx.fillStyle = collectible.color;
        ctx.shadowColor = collectible.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(collectible.x + 10, collectible.y + 10, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Pulsing effect
        const pulse = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
        ctx.globalAlpha = 0.3 + pulse * 0.7;
        ctx.beginPath();
        ctx.arc(collectible.x + 10, collectible.y + 10, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    });

    // Draw particles
    particles.forEach(particle => {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.life / 30;
      ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2);
      ctx.globalAlpha = 1;
    });

    // Draw player
    ctx.fillStyle = player.color;
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 10;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.shadowBlur = 0;

    // Draw player eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(player.x + 4, player.y + 6, 3, 3);
    ctx.fillRect(player.x + 13, player.y + 6, 3, 3);

    // Draw UI
    ctx.fillStyle = '#0aff9d';
    ctx.font = '16px Arial';
    ctx.fillText(`Lives: ${lives}`, 10, 30);
    ctx.fillText(`Level: ${level}`, 10, 50);
    
    if (levelComplete) {
      ctx.fillStyle = '#ffff00';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Level Complete!', GAME_WIDTH/2, GAME_HEIGHT/2);
      ctx.textAlign = 'left';
    }
  }, [player, platforms, collectibles, particles, lives, level, levelComplete]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(gameLoop, 16);
    return () => clearInterval(interval);
  }, [gameLoop, isPlaying]);

  useEffect(() => {
    const interval = setInterval(draw, 16);
    return () => clearInterval(interval);
  }, [draw]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key]: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (levelComplete) {
      setTimeout(() => {
        generateLevel(level);
      }, 2000);
    }
  }, [levelComplete, level, generateLevel]);

  useEffect(() => {
    if (lives <= 0) {
      setIsPlaying(false);
    }
  }, [lives]);

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setLives(3);
    generateLevel(1);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseGame = () => setIsPaused(!isPaused);
  const resetGame = () => {
    setIsPlaying(false);
    setScore(0);
    setLevel(1);
    setLives(3);
  };

  return (
    <GameLayout
      gameTitle="Digital Escape"
      gameCategory="Navigate through cyber platforms and collect data!"
      score={score}
      isPlaying={isPlaying}
      onPause={pauseGame}
      onReset={resetGame}
    >
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="border-2 border-neon-green rounded-lg max-w-full h-auto"
          style={{ background: 'linear-gradient(180deg, #001122, #000814)' }}
        />
        
        <div className="text-center text-sm text-gray-400 max-w-md">
          Use WASD or Arrow Keys to move and jump. Collect all data orbs and reach the exit to advance!
          Avoid falling off platforms and watch out for disappearing ones.
        </div>
      </div>
    </GameLayout>
  );
}
