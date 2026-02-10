import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameLayout from '@/components/GameLayout';

interface Position {
  x: number;
  y: number;
}

interface BlackHole extends Position {
  id: number;
  mass: number;
  radius: number;
  active: boolean;
}

interface Particle extends Position {
  id: number;
  vx: number;
  vy: number;
  trail: Position[];
  captured: boolean;
  target?: boolean;
}

interface Planet extends Position {
  id: number;
  radius: number;
  color: string;
  safe: boolean;
}

const BlackHolePuzzle: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'levelComplete' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [blackHoles, setBlackHoles] = useState<BlackHole[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [selectedParticle, setSelectedParticle] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState<Position | null>(null);
  const [showTrajectory, setShowTrajectory] = useState(false);

  const gameLoopRef = useRef<number>();
  const particleIdRef = useRef(0);
  const blackHoleIdRef = useRef(0);
  const planetIdRef = useRef(0);

  // Game constants
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const GRAVITY_CONSTANT = 50;
  const MAX_VELOCITY = 8;

  // Initialize level
  const initializeLevel = useCallback(() => {
    const newBlackHoles: BlackHole[] = [];
    const newParticles: Particle[] = [];
    const newPlanets: Planet[] = [];

    // Create black holes based on level
    for (let i = 0; i < level + 1; i++) {
      newBlackHoles.push({
        id: blackHoleIdRef.current++,
        x: 200 + (i * 200) + Math.random() * 100,
        y: 150 + Math.random() * 300,
        mass: 100 + Math.random() * 50,
        radius: 30 + Math.random() * 20,
        active: true
      });
    }

    // Create target planets
    for (let i = 0; i < 2 + level; i++) {
      newPlanets.push({
        id: planetIdRef.current++,
        x: 600 + Math.random() * 150,
        y: 100 + Math.random() * 400,
        radius: 20,
        color: '#0aff9d',
        safe: true
      });
    }

    // Create dangerous planets
    for (let i = 0; i < level; i++) {
      newPlanets.push({
        id: planetIdRef.current++,
        x: 300 + Math.random() * 200,
        y: 100 + Math.random() * 400,
        radius: 15,
        color: '#ff0099',
        safe: false
      });
    }

    // Create particles to guide
    for (let i = 0; i < 3 + level; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x: 50,
        y: 100 + i * 150,
        vx: 0,
        vy: 0,
        trail: [],
        captured: false,
        target: i < 2 + level
      });
    }

    setBlackHoles(newBlackHoles);
    setParticles(newParticles);
    setPlanets(newPlanets);
    setSelectedParticle(null);
    setDragStart(null);
  }, [level]);

  // Calculate gravitational force
  const calculateGravity = useCallback((particle: Particle, blackHole: BlackHole) => {
    const dx = blackHole.x - particle.x;
    const dy = blackHole.y - particle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < blackHole.radius) {
      return { fx: 0, fy: 0, captured: true };
    }
    
    const force = (GRAVITY_CONSTANT * blackHole.mass) / (distance * distance);
    const fx = (dx / distance) * force;
    const fy = (dy / distance) * force;
    
    return { fx, fy, captured: false };
  }, []);

  // Handle mouse/touch input
  const handlePointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;

    // Find clicked particle
    const clickedParticle = particles.find(p => {
      const dx = p.x - x;
      const dy = p.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 20 && !p.captured;
    });

    if (clickedParticle) {
      setSelectedParticle(clickedParticle.id);
      setDragStart({ x, y });
      setShowTrajectory(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (selectedParticle === null || !dragStart) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;

    // Update trajectory preview
    setDragStart({ x, y });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (selectedParticle === null || !dragStart) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;

    const particle = particles.find(p => p.id === selectedParticle);
    if (particle) {
      const dx = x - particle.x;
      const dy = y - particle.y;
      const power = Math.min(Math.sqrt(dx * dx + dy * dy) / 50, MAX_VELOCITY);
      
      setParticles(prev => prev.map(p => 
        p.id === selectedParticle 
          ? { 
              ...p, 
              vx: (dx / Math.sqrt(dx * dx + dy * dy)) * power,
              vy: (dy / Math.sqrt(dx * dx + dy * dy)) * power
            }
          : p
      ));
    }

    setSelectedParticle(null);
    setDragStart(null);
    setShowTrajectory(false);
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      setParticles(prev => prev.map(particle => {
        if (particle.captured) return particle;

        let newVx = particle.vx;
        let newVy = particle.vy;

        // Apply gravity from all black holes
        blackHoles.forEach(blackHole => {
          if (blackHole.active) {
            const gravity = calculateGravity(particle, blackHole);
            if (gravity.captured) {
              particle.captured = true;
              return;
            }
            newVx += gravity.fx * 0.016;
            newVy += gravity.fy * 0.016;
          }
        });

        // Limit velocity
        const speed = Math.sqrt(newVx * newVx + newVy * newVy);
        if (speed > MAX_VELOCITY) {
          newVx = (newVx / speed) * MAX_VELOCITY;
          newVy = (newVy / speed) * MAX_VELOCITY;
        }

        const newX = particle.x + newVx;
        const newY = particle.y + newVy;

        // Update trail
        const newTrail = [...particle.trail, { x: particle.x, y: particle.y }];
        if (newTrail.length > 20) {
          newTrail.shift();
        }

        // Check planet collisions
        planets.forEach(planet => {
          const dx = newX - planet.x;
          const dy = newY - planet.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < planet.radius + 10) {
            if (planet.safe && particle.target) {
              setScore(prev => prev + 100);
              particle.captured = true;
            } else if (!planet.safe) {
              particle.captured = true;
            }
          }
        });

        // Boundary check
        if (newX < 0 || newX > CANVAS_WIDTH || newY < 0 || newY > CANVAS_HEIGHT) {
          particle.captured = true;
        }

        return {
          ...particle,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          trail: newTrail
        };
      }));

      // Check win condition
      const targetParticles = particles.filter(p => p.target);
      const safePlanets = planets.filter(p => p.safe);
      let successfulParticles = 0;
      
      targetParticles.forEach(particle => {
        safePlanets.forEach(planet => {
          const dx = particle.x - planet.x;
          const dy = particle.y - planet.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < planet.radius + 10 && particle.captured) {
            successfulParticles++;
          }
        });
      });

      if (successfulParticles >= targetParticles.length && targetParticles.every(p => p.captured)) {
        setGameState('levelComplete');
        setTimeout(() => {
          setLevel(prev => prev + 1);
          setGameState('playing');
          initializeLevel();
        }, 2000);
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, particles, blackHoles, planets, calculateGravity, initializeLevel]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with space background
    const gradient = ctx.createRadialGradient(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 0, CANVAS_WIDTH/2, CANVAS_HEIGHT/2, CANVAS_WIDTH);
    gradient.addColorStop(0, '#1a0a2a');
    gradient.addColorStop(1, '#0a0a0f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw stars
    for (let i = 0; i < 100; i++) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = Math.random() * 0.8 + 0.2;
      const x = (i * 123) % CANVAS_WIDTH;
      const y = (i * 456) % CANVAS_HEIGHT;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;

    // Draw black holes
    blackHoles.forEach(blackHole => {
      if (blackHole.active) {
        // Event horizon
        const gradient = ctx.createRadialGradient(blackHole.x, blackHole.y, 0, blackHole.x, blackHole.y, blackHole.radius);
        gradient.addColorStop(0, '#000000');
        gradient.addColorStop(0.7, '#200020');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(blackHole.x, blackHole.y, blackHole.radius, 0, Math.PI * 2);
        ctx.fill();

        // Accretion disk
        ctx.strokeStyle = '#ff0099';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(blackHole.x, blackHole.y, blackHole.radius + 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });

    // Draw planets
    planets.forEach(planet => {
      ctx.fillStyle = planet.color;
      ctx.shadowColor = planet.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw particle trails
    particles.forEach(particle => {
      if (particle.trail.length > 1) {
        ctx.strokeStyle = particle.target ? '#0aff9d' : '#7000ff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
        particle.trail.forEach(point => {
          ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });

    // Draw particles
    particles.forEach(particle => {
      if (!particle.captured) {
        ctx.fillStyle = particle.target ? '#0aff9d' : '#7000ff';
        ctx.shadowColor = particle.target ? '#0aff9d' : '#7000ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // Draw trajectory preview
    if (showTrajectory && selectedParticle !== null && dragStart) {
      const particle = particles.find(p => p.id === selectedParticle);
      if (particle) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.7;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(dragStart.x, dragStart.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }
    }

    // Draw HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Level: ${level}`, 20, 30);
    ctx.fillText(`Score: ${score}`, 20, 50);

    if (gameState === 'levelComplete') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#0aff9d';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LEVEL COMPLETE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.textAlign = 'left';
    }

    if (gameState === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ffffff';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.textAlign = 'left';
    }
  });

  useEffect(() => {
    initializeLevel();
  }, [initializeLevel]);

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore(0);
    setLevel(1);
    setGameState('playing');
    initializeLevel();
  };

  return (
    <GameLayout
      gameTitle="Black Hole Puzzle"
      gameCategory="Puzzle"
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
            className="border border-neon-purple/50 rounded-lg bg-black/20 backdrop-blur-sm shadow-2xl max-w-full h-auto"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{ touchAction: 'none' }}
          />
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Drag particles to launch them • Guide green particles to green planets</p>
            <p>Avoid black holes and red planets</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default BlackHolePuzzle;
