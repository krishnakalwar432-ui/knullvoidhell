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
  quantumCharges: number;
  trail: {x: number, y: number, alpha: number}[];
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'solid' | 'quantum' | 'moving';
  color: string;
  quantumState?: 'stable' | 'unstable' | 'phasing';
  moveDirection?: number;
  moveSpeed?: number;
}

interface QuantumGate {
  x: number;
  y: number;
  width: number;
  height: number;
  targetX: number;
  targetY: number;
  active: boolean;
  color: string;
}

interface Collectible {
  x: number;
  y: number;
  collected: boolean;
  type: 'energy' | 'quantum_charge';
  value: number;
  pulsePhase: number;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const MOVE_SPEED = 5;

export default function QuantumLeapPlatformer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [level, setLevel] = useState(1);
  const [player, setPlayer] = useState<Player>({
    x: 50,
    y: GAME_HEIGHT - 150,
    vx: 0,
    vy: 0,
    width: 20,
    height: 30,
    onGround: false,
    quantumCharges: 3,
    trail: []
  });
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [quantumGates, setQuantumGates] = useState<QuantumGate[]>([]);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [keys, setKeys] = useState<{[key: string]: boolean}>({});
  const [teleportTarget, setTeleportTarget] = useState<{x: number, y: number} | null>(null);
  const [levelComplete, setLevelComplete] = useState(false);

  const generateLevel = useCallback((levelNum: number) => {
    const newPlatforms: Platform[] = [
      // Ground
      { x: 0, y: GAME_HEIGHT - 20, width: GAME_WIDTH, height: 20, color: '#001d3d', type: 'solid' },
      
      // Regular platforms
      { x: 150, y: GAME_HEIGHT - 120, width: 100, height: 20, color: '#7000ff', type: 'solid' },
      { x: 300, y: GAME_HEIGHT - 200, width: 80, height: 20, color: '#ff0099', type: 'moving', moveDirection: 1, moveSpeed: 2 },
      { x: 500, y: GAME_HEIGHT - 150, width: 60, height: 20, color: '#00ffff', type: 'quantum', quantumState: 'stable' },
      { x: 650, y: GAME_HEIGHT - 280, width: 100, height: 20, color: '#0aff9d', type: 'solid' },
      
      // Quantum platforms (phase in/out)
      { x: 200, y: GAME_HEIGHT - 350, width: 80, height: 20, color: '#ffa500', type: 'quantum', quantumState: 'unstable' },
      { x: 450, y: GAME_HEIGHT - 400, width: 60, height: 20, color: '#ff6600', type: 'quantum', quantumState: 'phasing' }
    ];

    const newQuantumGates: QuantumGate[] = [
      { x: 100, y: GAME_HEIGHT - 180, width: 15, height: 60, targetX: 600, targetY: GAME_HEIGHT - 340, active: true, color: '#00ffff' },
      { x: 400, y: GAME_HEIGHT - 250, width: 15, height: 60, targetX: 700, targetY: GAME_HEIGHT - 200, active: true, color: '#ff00ff' }
    ];

    const newCollectibles: Collectible[] = [
      { x: 175, y: GAME_HEIGHT - 160, collected: false, type: 'energy', value: 10, pulsePhase: 0 },
      { x: 325, y: GAME_HEIGHT - 240, collected: false, type: 'quantum_charge', value: 1, pulsePhase: 0 },
      { x: 525, y: GAME_HEIGHT - 190, collected: false, type: 'energy', value: 15, pulsePhase: 0 },
      { x: 675, y: GAME_HEIGHT - 320, collected: false, type: 'quantum_charge', value: 1, pulsePhase: 0 },
      { x: 225, y: GAME_HEIGHT - 390, collected: false, type: 'energy', value: 25, pulsePhase: 0 }
    ];

    setPlatforms(newPlatforms);
    setQuantumGates(newQuantumGates);
    setCollectibles(newCollectibles);
    setPlayer(prev => ({ 
      ...prev, 
      x: 50, 
      y: GAME_HEIGHT - 150, 
      vx: 0, 
      vy: 0,
      quantumCharges: 3,
      trail: []
    }));
    setLevelComplete(false);
    setTeleportTarget(null);
  }, []);

  const checkCollision = useCallback((rect1: any, rect2: any) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }, []);

  const quantumTeleport = useCallback((targetX: number, targetY: number) => {
    if (player.quantumCharges > 0) {
      // Add trail effect
      const trailPoints: {x: number, y: number, alpha: number}[] = [];
      const steps = 20;
      for (let i = 0; i < steps; i++) {
        const progress = i / steps;
        trailPoints.push({
          x: player.x + (targetX - player.x) * progress,
          y: player.y + (targetY - player.y) * progress,
          alpha: 1 - progress
        });
      }

      setPlayer(prev => ({
        ...prev,
        x: targetX,
        y: targetY,
        vx: 0,
        vy: 0,
        quantumCharges: prev.quantumCharges - 1,
        trail: trailPoints
      }));
    }
  }, [player]);

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
        newPlayer.vx *= 0.8;
      }

      if ((keys['ArrowUp'] || keys['w'] || keys['W'] || keys[' ']) && newPlayer.onGround) {
        newPlayer.vy = JUMP_FORCE;
        newPlayer.onGround = false;
      }

      // Apply gravity
      newPlayer.vy += GRAVITY;

      // Update position
      newPlayer.x += newPlayer.vx;
      newPlayer.y += newPlayer.vy;

      // Platform collision
      newPlayer.onGround = false;
      platforms.forEach(platform => {
        // Check if platform is solid (quantum platforms may phase)
        let isSolid = true;
        if (platform.type === 'quantum') {
          const time = Date.now() * 0.001;
          if (platform.quantumState === 'phasing') {
            isSolid = Math.sin(time * 2) > 0;
          } else if (platform.quantumState === 'unstable') {
            isSolid = Math.sin(time * 3) > -0.5;
          }
        }

        if (isSolid && checkCollision(newPlayer, platform)) {
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

      // Boundary checks
      if (newPlayer.x < 0) newPlayer.x = 0;
      if (newPlayer.x + newPlayer.width > GAME_WIDTH) newPlayer.x = GAME_WIDTH - newPlayer.width;

      // Update trail
      newPlayer.trail = newPlayer.trail.map(point => ({
        ...point,
        alpha: point.alpha - 0.05
      })).filter(point => point.alpha > 0);

      // Check if fell off screen
      if (newPlayer.y > GAME_HEIGHT) {
        return { ...newPlayer, x: 50, y: GAME_HEIGHT - 150, vx: 0, vy: 0 };
      }

      return newPlayer;
    });

    // Update moving platforms
    setPlatforms(prevPlatforms => prevPlatforms.map(platform => {
      if (platform.type === 'moving' && platform.moveDirection !== undefined) {
        let newX = platform.x + (platform.moveSpeed || 1) * platform.moveDirection;
        let newDirection = platform.moveDirection;
        
        if (newX <= 0 || newX + platform.width >= GAME_WIDTH) {
          newDirection = -platform.moveDirection;
          newX = platform.x + (platform.moveSpeed || 1) * newDirection;
        }
        
        return { ...platform, x: newX, moveDirection: newDirection };
      }
      return platform;
    }));

    // Update collectibles
    setCollectibles(prevCollectibles => prevCollectibles.map(collectible => {
      const newCollectible = { ...collectible, pulsePhase: collectible.pulsePhase + 0.1 };
      
      if (!newCollectible.collected && checkCollision(player, { ...newCollectible, width: 20, height: 20 })) {
        if (newCollectible.type === 'energy') {
          setScore(prevScore => prevScore + newCollectible.value);
        } else if (newCollectible.type === 'quantum_charge') {
          setPlayer(prev => ({ ...prev, quantumCharges: prev.quantumCharges + 1 }));
        }
        newCollectible.collected = true;
      }
      
      return newCollectible;
    }));

    // Check quantum gate interactions
    quantumGates.forEach(gate => {
      if (checkCollision(player, gate) && keys['e'] || keys['E']) {
        quantumTeleport(gate.targetX, gate.targetY);
      }
    });

    // Check level completion
    const allCollected = collectibles.every(c => c.collected);
    if (allCollected && player.x > GAME_WIDTH - 100) {
      setLevelComplete(true);
    }

  }, [isPlaying, isPaused, keys, player, platforms, collectibles, quantumGates, checkCollision, quantumTeleport]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Quantum background effect
    const time = Date.now() * 0.001;
    const gradient = ctx.createRadialGradient(
      GAME_WIDTH/2, GAME_HEIGHT/2, 0,
      GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH
    );
    gradient.addColorStop(0, `rgba(0,20,40,${0.8 + Math.sin(time) * 0.1})`);
    gradient.addColorStop(1, `rgba(0,8,20,${0.9 + Math.cos(time * 1.5) * 0.1})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw quantum field lines
    ctx.strokeStyle = `rgba(0,255,255,${0.1 + Math.sin(time * 2) * 0.05})`;
    ctx.lineWidth = 1;
    for (let x = 0; x < GAME_WIDTH; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x + Math.sin(time + x * 0.01) * 10, 0);
      ctx.lineTo(x + Math.sin(time + x * 0.01) * 10, GAME_HEIGHT);
      ctx.stroke();
    }

    // Draw platforms
    platforms.forEach(platform => {
      let alpha = 1;
      if (platform.type === 'quantum') {
        if (platform.quantumState === 'phasing') {
          alpha = Math.sin(time * 2) > 0 ? 1 : 0.3;
        } else if (platform.quantumState === 'unstable') {
          alpha = Math.sin(time * 3) > -0.5 ? 1 : 0.5;
        }
      }

      ctx.globalAlpha = alpha;
      ctx.fillStyle = platform.color;
      ctx.shadowColor = platform.color;
      ctx.shadowBlur = platform.type === 'quantum' ? 15 : 8;
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });

    // Draw quantum gates
    quantumGates.forEach(gate => {
      // Gate portal effect
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = gate.color;
      ctx.shadowColor = gate.color;
      ctx.shadowBlur = 20;
      ctx.fillRect(gate.x, gate.y, gate.width, gate.height);
      
      // Pulsing effect
      const pulse = Math.sin(time * 4) * 0.5 + 0.5;
      ctx.globalAlpha = pulse * 0.5;
      ctx.fillRect(gate.x - 5, gate.y - 5, gate.width + 10, gate.height + 10);
      ctx.restore();

      // Draw connection line to target
      ctx.strokeStyle = gate.color + '60';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gate.x + gate.width/2, gate.y + gate.height/2);
      ctx.lineTo(gate.targetX, gate.targetY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Target indicator
      ctx.fillStyle = gate.color;
      ctx.beginPath();
      ctx.arc(gate.targetX, gate.targetY, 10, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw player trail
    player.trail.forEach(point => {
      ctx.save();
      ctx.globalAlpha = point.alpha;
      ctx.fillStyle = '#0aff9d';
      ctx.fillRect(point.x, point.y, player.width, player.height);
      ctx.restore();
    });

    // Draw player
    ctx.fillStyle = '#0aff9d';
    ctx.shadowColor = '#0aff9d';
    ctx.shadowBlur = 12;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.shadowBlur = 0;

    // Quantum energy aura around player
    if (player.quantumCharges > 0) {
      ctx.save();
      ctx.globalAlpha = 0.3 + Math.sin(time * 5) * 0.2;
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x + player.width/2, player.y + player.height/2, 25, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw collectibles
    collectibles.forEach(collectible => {
      if (!collectible.collected) {
        const pulse = Math.sin(collectible.pulsePhase) * 0.3 + 0.7;
        const color = collectible.type === 'energy' ? '#ffff00' : '#ff00ff';
        
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(collectible.x + 10, collectible.y + 10, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    // UI
    ctx.fillStyle = '#0aff9d';
    ctx.font = '16px Arial';
    ctx.fillText(`Level: ${level}`, 10, 30);
    ctx.fillText(`Quantum Charges: ${player.quantumCharges}`, 10, 50);
    
    if (levelComplete) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      
      ctx.fillStyle = '#0aff9d';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('QUANTUM LEAP COMPLETE!', GAME_WIDTH/2, GAME_HEIGHT/2);
      ctx.textAlign = 'left';
    }
  }, [player, platforms, quantumGates, collectibles, level, levelComplete]);

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
      
      // Quantum teleport on Q key
      if ((e.key === 'q' || e.key === 'Q') && teleportTarget && player.quantumCharges > 0) {
        quantumTeleport(teleportTarget.x, teleportTarget.y);
      }
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
  }, [teleportTarget, player.quantumCharges, quantumTeleport]);

  useEffect(() => {
    if (levelComplete) {
      setTimeout(() => {
        setLevel(prev => prev + 1);
        generateLevel(level + 1);
      }, 2000);
    }
  }, [levelComplete, level, generateLevel]);

  const startGame = () => {
    setScore(0);
    setLevel(1);
    generateLevel(1);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseGame = () => setIsPaused(!isPaused);
  const resetGame = () => {
    setIsPlaying(false);
    setScore(0);
    setLevel(1);
  };

  return (
    <GameLayout
      gameTitle="Quantum Leap Platformer"
      gameCategory="Platform game with quantum teleportation mechanics!"
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
          style={{ background: 'radial-gradient(circle, #001428, #000814)' }}
        />
        
        <div className="text-center text-sm text-gray-400 max-w-md">
          WASD/Arrows to move and jump. Press E near quantum gates to teleport. 
          Some platforms phase in and out of existence!
        </div>
      </div>
    </GameLayout>
  );
}
