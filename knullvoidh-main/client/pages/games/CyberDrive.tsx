import React, { useState, useEffect, useRef } from 'react';
import GameLayout from '@/components/GameLayout';

const CyberDrive: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(5);
  const [player, setPlayer] = useState({ x: 400, lane: 1, targetLane: 1 });
  const [buildings, setBuildings] = useState<Array<{x: number, height: number, color: string}>>([]);
  const [cars, setCars] = useState<Array<{x: number, lane: number, speed: number, color: string}>>([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const LANES = 3;
  const LANE_WIDTH = 80;
  const ROAD_START_Y = 400;

  useEffect(() => {
    // Initialize buildings
    const newBuildings = [];
    for (let i = 0; i < 50; i++) {
      newBuildings.push({
        x: i * 60,
        height: 100 + Math.random() * 200,
        color: ['#ff0099', '#7000ff', '#0aff9d', '#ffff00'][Math.floor(Math.random() * 4)]
      });
    }
    setBuildings(newBuildings);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => setKeys(prev => new Set([...prev, e.key.toLowerCase()]));
    const handleKeyUp = (e: KeyboardEvent) => setKeys(prev => { const newKeys = new Set(prev); newKeys.delete(e.key.toLowerCase()); return newKeys; });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const gameLoop = setInterval(() => {
      // Update player lane
      setPlayer(prev => {
        let newTargetLane = prev.targetLane;
        if ((keys.has('a') || keys.has('arrowleft')) && prev.targetLane > 0) newTargetLane = prev.targetLane - 1;
        if ((keys.has('d') || keys.has('arrowright')) && prev.targetLane < LANES - 1) newTargetLane = prev.targetLane + 1;
        
        const targetX = 300 + newTargetLane * LANE_WIDTH;
        const newX = prev.x + (targetX - prev.x) * 0.1;
        
        return { x: newX, lane: Math.round((newX - 300) / LANE_WIDTH), targetLane: newTargetLane };
      });

      // Update buildings (parallax scrolling)
      setBuildings(prev => prev.map(building => ({
        ...building,
        x: building.x - speed * 0.3
      })).filter(building => building.x > -100));

      // Add new buildings
      setBuildings(prev => {
        const lastBuilding = prev[prev.length - 1];
        if (!lastBuilding || lastBuilding.x < CANVAS_WIDTH) {
          return [...prev, {
            x: (lastBuilding ? lastBuilding.x : 0) + 60,
            height: 100 + Math.random() * 200,
            color: ['#ff0099', '#7000ff', '#0aff9d', '#ffff00'][Math.floor(Math.random() * 4)]
          }];
        }
        return prev;
      });

      // Spawn cars
      if (Math.random() < 0.02) {
        setCars(prev => [...prev, {
          x: CANVAS_WIDTH + 100,
          lane: Math.floor(Math.random() * LANES),
          speed: 3 + Math.random() * 4,
          color: ['#ff6600', '#00ffff', '#ff0099'][Math.floor(Math.random() * 3)]
        }]);
      }

      // Update cars
      setCars(prev => prev
        .map(car => ({ ...car, x: car.x - (speed + car.speed) }))
        .filter(car => car.x > -100)
      );

      // Collision detection
      cars.forEach(car => {
        const carLane = Math.round((300 + car.lane * LANE_WIDTH - 300) / LANE_WIDTH);
        if (carLane === player.lane && car.x > 250 && car.x < 350) {
          setGameState('gameOver');
        }
      });

      // Update score and speed
      setScore(prev => prev + Math.floor(speed));
      setSpeed(prev => Math.min(prev + 0.002, 12));
    }, 16);
    return () => clearInterval(gameLoop);
  }, [gameState, player, speed, keys]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Cyber sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, ROAD_START_Y);
    skyGradient.addColorStop(0, '#000011');
    skyGradient.addColorStop(0.5, '#001122');
    skyGradient.addColorStop(1, '#002244');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, ROAD_START_Y);

    // Draw cyber city buildings
    buildings.forEach(building => {
      if (building.x > -100 && building.x < CANVAS_WIDTH + 100) {
        ctx.fillStyle = building.color;
        ctx.shadowColor = building.color;
        ctx.shadowBlur = 20;
        ctx.fillRect(building.x, ROAD_START_Y - building.height, 50, building.height);
        
        // Building windows
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        for (let i = 0; i < building.height; i += 30) {
          if (Math.random() > 0.3) {
            ctx.fillRect(building.x + 10, ROAD_START_Y - building.height + i + 5, 8, 8);
            ctx.fillRect(building.x + 25, ROAD_START_Y - building.height + i + 5, 8, 8);
          }
        }
        ctx.shadowBlur = 0;
      }
    });

    // Draw road with perspective
    const roadGradient = ctx.createLinearGradient(0, ROAD_START_Y, 0, CANVAS_HEIGHT);
    roadGradient.addColorStop(0, '#333333');
    roadGradient.addColorStop(1, '#111111');
    ctx.fillStyle = roadGradient;
    ctx.fillRect(0, ROAD_START_Y, CANVAS_WIDTH, CANVAS_HEIGHT - ROAD_START_Y);

    // Road lanes
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 20]);
    for (let i = 1; i < LANES; i++) {
      const x = 300 + i * LANE_WIDTH;
      ctx.beginPath();
      ctx.moveTo(x, ROAD_START_Y);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Road edges
    ctx.strokeStyle = '#ff0099';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(300, ROAD_START_Y);
    ctx.lineTo(300, CANVAS_HEIGHT);
    ctx.moveTo(300 + LANES * LANE_WIDTH, ROAD_START_Y);
    ctx.lineTo(300 + LANES * LANE_WIDTH, CANVAS_HEIGHT);
    ctx.stroke();

    // Draw cars
    cars.forEach(car => {
      const carX = 300 + car.lane * LANE_WIDTH + LANE_WIDTH / 2;
      const carY = ROAD_START_Y + (car.x - 300) * 0.3;
      const scale = 1 + (car.x - 300) * 0.001;
      
      if (carY > ROAD_START_Y && carY < CANVAS_HEIGHT) {
        ctx.fillStyle = car.color;
        ctx.shadowColor = car.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(carX - 20 * scale, carY, 40 * scale, 20 * scale);
        
        // Car lights
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.fillRect(carX - 15 * scale, carY - 5 * scale, 8 * scale, 5 * scale);
        ctx.fillRect(carX + 7 * scale, carY - 5 * scale, 8 * scale, 5 * scale);
        ctx.shadowBlur = 0;
      }
    });

    // Draw player car
    const playerY = ROAD_START_Y + 150;
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    ctx.fillRect(player.x - 25, playerY, 50, 30);
    
    // Player car details
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 20;
    ctx.fillRect(player.x - 20, playerY - 10, 10, 8);
    ctx.fillRect(player.x + 10, playerY - 10, 10, 8);
    ctx.shadowBlur = 0;

    // HUD
    ctx.fillStyle = '#00ffff';
    ctx.font = '18px monospace';
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Speed: ${speed.toFixed(1)} km/h`, 20, 55);

    // Speedometer
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH - 100, 80, 40, Math.PI, Math.PI * 2);
    ctx.stroke();
    
    const speedAngle = Math.PI + (speed / 12) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH - 100, 80);
    ctx.lineTo(CANVAS_WIDTH - 100 + Math.cos(speedAngle) * 35, 80 + Math.sin(speedAngle) * 35);
    ctx.stroke();

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ff0000';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CRASH!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  });

  const handlePause = () => setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  const handleReset = () => {
    setScore(0);
    setSpeed(5);
    setPlayer({ x: 400, lane: 1, targetLane: 1 });
    setCars([]);
    setGameState('playing');
  };

  return (
    <GameLayout gameTitle="Cyber Drive" gameCategory="Racing" score={score} isPlaying={gameState === 'playing'} onPause={handlePause} onReset={handleReset}>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="relative">
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="border border-neon-cyan/50 rounded-lg bg-black/20 backdrop-blur-sm shadow-2xl max-w-full h-auto" style={{ touchAction: 'none' }} />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>A/D or Arrow keys to change lanes • Drive through the cyber city!</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default CyberDrive;
