import React, { useEffect, useRef, useState } from 'react';
import GameLayout from '@/components/GameLayout';
import { SafeKeyHandler, getSafeCanvasContext, SafeGameLoop } from '@/utils/gameUtils';

interface Obstacle { x: number; y: number; w: number; h: number; }

const NeonDriftOverdrive: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const keyHandlerRef = useRef<SafeKeyHandler>();
  const loopRef = useRef<SafeGameLoop>();

  const reset = () => {
    setScore(0);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = getSafeCanvasContext(canvas);
    if (!canvas || !ctx) return;

    const W = 800; const H = 500;
    canvas.width = W; canvas.height = H;

    const car = { x: W / 2, y: H - 90, vx: 0, width: 40, height: 70, angle: 0 };
    let drift = 0; // side-slip factor
    let speed = 6;
    let nitro = 0;
    let frame = 0;
    const obstacles: Obstacle[] = [];

    keyHandlerRef.current = new SafeKeyHandler();
    const keys = keyHandlerRef.current;

    const spawnObstacle = () => {
      const lane = Math.floor(Math.random() * 3); // 3 lanes
      const laneX = W * (0.25 + lane * 0.25);
      obstacles.push({ x: laneX - 25, y: -60, w: 50, h: 60 });
    };

    const drawCar = () => {
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate((car.angle * Math.PI) / 180);
      ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 20;
      ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);
      // glow trails
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#00e6ff';
      ctx.fillRect(-car.width / 2, car.height / 2 - 6, 10, 8);
      ctx.fillRect(car.width / 2 - 10, car.height / 2 - 6, 10, 8);
      ctx.restore();
      ctx.globalAlpha = 1;
    };

    const collides = (a: {x:number;y:number;width:number;height:number}, b: Obstacle) =>
      a.x - a.width/2 < b.x + b.w && a.x + a.width/2 > b.x && a.y - a.height/2 < b.y + b.h && a.y + a.height/2 > b.y;

    const gameFn = () => {
      frame++;
      // input
      let steer = 0;
      if (keys.isPressed('arrowleft') || keys.isPressed('a')) steer -= 1;
      if (keys.isPressed('arrowright') || keys.isPressed('d')) steer += 1;
      const drifting = steer !== 0;

      // drift physics
      drift = drift * 0.9 + steer * 0.6; // inertia
      car.vx = car.vx * 0.88 + drift * (2 + nitro * 0.05);
      car.angle = car.vx * 2.5;
      car.x = Math.max(60, Math.min(W - 60, car.x + car.vx));

      // nitro charge on chained drift
      nitro = Math.max(0, Math.min(100, nitro + (drifting ? 0.3 : -0.4)));
      const laneSpeed = speed + nitro * 0.02;

      // spawn obstacles
      if (frame % 28 === 0) spawnObstacle();
      // update obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.y += laneSpeed;
        if (o.y > H + 100) obstacles.splice(i, 1);
      }

      // collisions
      for (const o of obstacles) {
        if (collides({ x: car.x, y: car.y, width: car.width, height: car.height }, o)) {
          setIsPlaying(false);
          loopRef.current?.stop();
        }
      }

      // score
      if (frame % 5 === 0) setScore(s => s + Math.floor(1 + nitro * 0.05));

      // draw
      ctx.clearRect(0, 0, W, H);
      // road bg
      const grd = ctx.createLinearGradient(0, 0, W, H);
      grd.addColorStop(0, '#0a0f1e');
      grd.addColorStop(1, '#06111a');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
      // lanes
      ctx.strokeStyle = 'rgba(0,255,255,0.35)';
      ctx.lineWidth = 2;
      for (let i = 1; i < 4; i++) {
        const x = (W / 4) * i;
        ctx.setLineDash([10, 16]);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      // obstacles
      obstacles.forEach(o => {
        ctx.fillStyle = 'rgba(255,0,136,0.9)';
        ctx.shadowColor = '#ff0088';
        ctx.shadowBlur = 15;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.shadowBlur = 0;
      });
      // car
      drawCar();
      // nitro bar
      ctx.fillStyle = '#00333a';
      ctx.fillRect(20, 20, 200, 10);
      ctx.fillStyle = '#00ffcc';
      ctx.fillRect(20, 20, 2 * nitro, 10);
    };

    loopRef.current = new SafeGameLoop(gameFn, { useRequestAnimationFrame: true });
    setIsPlaying(true);
    loopRef.current.start();

    return () => {
      loopRef.current?.stop();
      keyHandlerRef.current?.cleanup();
    };
  }, []);

  return (
    <GameLayout 
      gameTitle="Neon Drift Overdrive" 
      gameCategory="Racing"
      score={score}
      isPlaying={isPlaying}
      onReset={() => window.location.reload()}
      onPause={() => {
        if (isPlaying) loopRef.current?.stop(); else loopRef.current?.start();
        setIsPlaying(p => !p);
      }}
    >
      <div className="w-full flex justify-center p-4">
        <canvas ref={canvasRef} className="max-w-full border border-cyan-400/30 rounded-lg bg-black" />
      </div>
    </GameLayout>
  );
};

export default NeonDriftOverdrive;
