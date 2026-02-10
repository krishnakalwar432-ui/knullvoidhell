import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Car {
  x: number;
  y: number;
  speed: number;
  color: string;
}

interface Note {
  x: number;
  y: number;
  lane: number;
  hit: boolean;
  color: string;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const LANE_COUNT = 4;
const LANE_WIDTH = GAME_WIDTH / LANE_COUNT;

export default function RhythmRacer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [car, setCar] = useState<Car>({ x: LANE_WIDTH * 2, y: GAME_HEIGHT - 100, speed: 0, color: '#0aff9d' });
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentLane, setCurrentLane] = useState(2);
  const [combo, setCombo] = useState(0);
  const [keys, setKeys] = useState<{[key: string]: boolean}>({});

  const spawnNote = useCallback(() => {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    const newNote: Note = {
      x: lane * LANE_WIDTH + LANE_WIDTH/2,
      y: -20,
      lane,
      hit: false,
      color: '#ff0099'
    };
    setNotes(prev => [...prev, newNote]);
  }, []);

  const gameLoop = useCallback(() => {
    if (!isPlaying || isPaused) return;

    // Move car
    setCar(prev => {
      let newLane = currentLane;
      if (keys['ArrowLeft'] && newLane > 0) newLane--;
      if (keys['ArrowRight'] && newLane < LANE_COUNT - 1) newLane++;
      
      setCurrentLane(newLane);
      return { ...prev, x: newLane * LANE_WIDTH + LANE_WIDTH/2 };
    });

    // Update notes
    setNotes(prev => prev.map(note => ({ ...note, y: note.y + 5 }))
      .filter(note => note.y < GAME_HEIGHT + 50));

    // Hit detection
    if (keys[' ']) {
      const hitNote = notes.find(note => 
        !note.hit && 
        note.lane === currentLane && 
        Math.abs(note.y - car.y) < 50
      );
      
      if (hitNote) {
        hitNote.hit = true;
        setScore(prev => prev + 100 + combo * 10);
        setCombo(prev => prev + 1);
      }
    }

    // Spawn notes
    if (Math.random() < 0.03) spawnNote();

  }, [isPlaying, isPaused, keys, currentLane, car.y, notes, combo, spawnNote]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    // Racing track background
    ctx.fillStyle = '#001122';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Track lanes
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    for (let i = 1; i < LANE_COUNT; i++) {
      ctx.beginPath();
      ctx.moveTo(i * LANE_WIDTH, 0);
      ctx.lineTo(i * LANE_WIDTH, GAME_HEIGHT);
      ctx.stroke();
    }

    // Moving road lines
    ctx.strokeStyle = '#666666';
    ctx.setLineDash([20, 20]);
    for (let y = (Date.now() * 0.3) % 40; y < GAME_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_WIDTH, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Car
    ctx.fillStyle = car.color;
    ctx.shadowColor = car.color;
    ctx.shadowBlur = 15;
    ctx.fillRect(car.x - 15, car.y - 30, 30, 60);
    ctx.shadowBlur = 0;

    // Notes
    notes.forEach(note => {
      if (!note.hit) {
        ctx.fillStyle = note.color;
        ctx.shadowColor = note.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(note.x, note.y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Combo: ${combo}`, 10, 60);

  }, [car, notes, score, combo]);

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
    const handleKeyDown = (e: KeyboardEvent) => setKeys(prev => ({ ...prev, [e.key]: true }));
    const handleKeyUp = (e: KeyboardEvent) => setKeys(prev => ({ ...prev, [e.key]: false }));
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const startGame = () => {
    setScore(0);
    setCombo(0);
    setNotes([]);
    setCurrentLane(2);
    setCar({ x: LANE_WIDTH * 2, y: GAME_HEIGHT - 100, speed: 0, color: '#0aff9d' });
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseGame = () => setIsPaused(!isPaused);
  const resetGame = () => setIsPlaying(false);

  return (
    <GameLayout
      gameTitle="Rhythm Racer"
      gameCategory="Race to the beat of the music!"
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
        />
        <div className="text-center text-sm text-gray-400 max-w-md">
          Left/Right arrows to change lanes, Space to hit notes in rhythm!
        </div>
      </div>
    </GameLayout>
  );
}
