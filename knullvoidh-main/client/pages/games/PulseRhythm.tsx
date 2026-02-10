import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Note {
  id: number;
  lane: number;
  y: number;
  hit: boolean;
  color: string;
  type: 'normal' | 'hold' | 'special';
  holdLength?: number;
}

interface ScorePopup {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const LANE_COUNT = 4;
const LANE_WIDTH = GAME_WIDTH / LANE_COUNT;
const HIT_ZONE_Y = GAME_HEIGHT - 100;
const NOTE_SPEED = 3;

const LANE_KEYS = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'];
const LANE_COLORS = ['#ff0099', '#0aff9d', '#7000ff', '#00ffff'];

export default function PulseRhythm() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [notes, setNotes] = useState<Note[]>([]);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [pressedLanes, setPressedLanes] = useState<boolean[]>(new Array(LANE_COUNT).fill(false));
  const [hitEffects, setHitEffects] = useState<{lane: number, time: number}[]>([]);
  const [bpm, setBpm] = useState(120);
  const [currentTime, setCurrentTime] = useState(0);
  const noteIdRef = useRef(0);
  const popupIdRef = useRef(0);
  const lastSpawnTime = useRef(0);
  const totalNotes = useRef(0);
  const hitNotes = useRef(0);

  // Create audio context and sounds
  const createSound = useCallback((frequency: number, duration: number = 0.1) => {
    if (!audioContextRef.current) return;
    
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
    
    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + duration);
  }, []);

  const spawnNote = useCallback((lane: number, type: 'normal' | 'hold' | 'special' = 'normal') => {
    const newNote: Note = {
      id: noteIdRef.current++,
      lane,
      y: -50,
      hit: false,
      color: LANE_COLORS[lane],
      type,
      holdLength: type === 'hold' ? 100 + Math.random() * 100 : undefined
    };
    setNotes(prev => [...prev, newNote]);
    totalNotes.current++;
  }, []);

  const createScorePopup = useCallback((x: number, y: number, text: string, color: string) => {
    const popup: ScorePopup = {
      id: popupIdRef.current++,
      x,
      y,
      text,
      color,
      life: 60
    };
    setScorePopups(prev => [...prev, popup]);
  }, []);

  const hitNote = useCallback((lane: number) => {
    const hitZoneTop = HIT_ZONE_Y - 30;
    const hitZoneBottom = HIT_ZONE_Y + 30;
    
    const noteToHit = notes.find(note => 
      note.lane === lane && 
      !note.hit &&
      note.y >= hitZoneTop && 
      note.y <= hitZoneBottom
    );

    if (noteToHit) {
      // Calculate hit accuracy
      const perfect = Math.abs(noteToHit.y - HIT_ZONE_Y) < 10;
      const good = Math.abs(noteToHit.y - HIT_ZONE_Y) < 20;
      
      let points = 0;
      let accuracyBonus = 0;
      let text = '';
      let color = '';

      if (perfect) {
        points = 300;
        accuracyBonus = 100;
        text = 'PERFECT';
        color = '#ffff00';
      } else if (good) {
        points = 200;
        accuracyBonus = 80;
        text = 'GOOD';
        color = '#0aff9d';
      } else {
        points = 100;
        accuracyBonus = 60;
        text = 'OK';
        color = '#ffffff';
      }

      // Combo bonus
      const comboBonus = Math.floor(combo / 10) * 50;
      const totalPoints = points + comboBonus;

      setScore(prev => prev + totalPoints);
      setCombo(prev => {
        const newCombo = prev + 1;
        setMaxCombo(max => Math.max(max, newCombo));
        return newCombo;
      });

      hitNotes.current++;
      setAccuracy(Math.round((hitNotes.current / totalNotes.current) * 100));

      noteToHit.hit = true;
      
      // Create hit effect
      setHitEffects(prev => [...prev, { lane, time: currentTime }]);
      
      // Create score popup
      createScorePopup(
        lane * LANE_WIDTH + LANE_WIDTH / 2, 
        HIT_ZONE_Y - 50, 
        `${text} +${totalPoints}`, 
        color
      );

      // Play hit sound
      const frequencies = [261, 294, 329, 349]; // C, D, E, F
      createSound(frequencies[lane], 0.1);

    } else {
      // Miss - reset combo
      setCombo(0);
      createScorePopup(
        lane * LANE_WIDTH + LANE_WIDTH / 2, 
        HIT_ZONE_Y - 50, 
        'MISS', 
        '#ff0000'
      );
    }
  }, [notes, combo, currentTime, createScorePopup, createSound]);

  const generatePattern = useCallback(() => {
    const patterns = [
      // Simple patterns
      [0], [1], [2], [3],
      [0, 2], [1, 3], [0, 3], [1, 2],
      
      // Complex patterns
      [0, 1, 2], [1, 2, 3], [0, 2, 3], [0, 1, 3],
      [0, 1, 2, 3],
      
      // Special patterns
      [], // Rest
    ];

    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    pattern.forEach(lane => {
      const noteType = Math.random() < 0.1 ? 'special' : 
                      Math.random() < 0.2 ? 'hold' : 'normal';
      spawnNote(lane, noteType);
    });
  }, [spawnNote]);

  const gameLoop = useCallback(() => {
    if (!isPlaying || isPaused) return;

    setCurrentTime(prev => prev + 16);

    // Spawn notes based on BPM
    const spawnInterval = (60 / bpm) * 1000; // ms per beat
    if (currentTime - lastSpawnTime.current > spawnInterval) {
      generatePattern();
      lastSpawnTime.current = currentTime;
    }

    // Update notes
    setNotes(prev => prev.map(note => ({
      ...note,
      y: note.y + NOTE_SPEED
    })).filter(note => {
      // Remove notes that are too far down and not hit
      if (note.y > GAME_HEIGHT + 50) {
        if (!note.hit) {
          setCombo(0); // Miss penalty
          setAccuracy(Math.round((hitNotes.current / totalNotes.current) * 100));
        }
        return false;
      }
      return true;
    }));

    // Update score popups
    setScorePopups(prev => prev.map(popup => ({
      ...popup,
      y: popup.y - 2,
      life: popup.life - 1
    })).filter(popup => popup.life > 0));

    // Update hit effects
    setHitEffects(prev => prev.filter(effect => currentTime - effect.time < 300));

    // Increase BPM gradually
    setBpm(prev => Math.min(180, prev + 0.001));

  }, [isPlaying, isPaused, currentTime, bpm, generatePattern]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#000814');
    gradient.addColorStop(0.5, '#001d3d');
    gradient.addColorStop(1, '#000814');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw lanes
    for (let i = 0; i < LANE_COUNT; i++) {
      const x = i * LANE_WIDTH;
      
      // Lane background
      ctx.fillStyle = pressedLanes[i] ? LANE_COLORS[i] + '30' : 'rgba(255,255,255,0.1)';
      ctx.fillRect(x, 0, LANE_WIDTH, GAME_HEIGHT);
      
      // Lane border
      ctx.strokeStyle = LANE_COLORS[i];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_HEIGHT);
      ctx.stroke();
      
      // Hit effects
      hitEffects.forEach(effect => {
        if (effect.lane === i) {
          const progress = (currentTime - effect.time) / 300;
          const alpha = 1 - progress;
          const size = 20 + progress * 50;
          
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = LANE_COLORS[i];
          ctx.shadowColor = LANE_COLORS[i];
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(x + LANE_WIDTH/2, HIT_ZONE_Y, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });
    }

    // Draw hit zone
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(0, HIT_ZONE_Y - 30, GAME_WIDTH, 60);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, HIT_ZONE_Y);
    ctx.lineTo(GAME_WIDTH, HIT_ZONE_Y);
    ctx.stroke();

    // Draw notes
    notes.forEach(note => {
      if (note.hit) return;
      
      const x = note.lane * LANE_WIDTH + 10;
      const width = LANE_WIDTH - 20;
      const height = note.type === 'hold' ? (note.holdLength || 20) : 20;
      
      ctx.fillStyle = note.color;
      ctx.shadowColor = note.color;
      ctx.shadowBlur = note.type === 'special' ? 15 : 8;
      
      if (note.type === 'special') {
        // Special note - star shape
        ctx.save();
        ctx.translate(x + width/2, note.y + height/2);
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5;
          const radius = i % 2 === 0 ? 15 : 7;
          const xPos = Math.cos(angle) * radius;
          const yPos = Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(xPos, yPos);
          else ctx.lineTo(xPos, yPos);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        // Normal/hold note
        ctx.fillRect(x, note.y, width, height);
        
        if (note.type === 'hold') {
          // Hold note trail
          ctx.fillStyle = note.color + '50';
          ctx.fillRect(x + width/4, note.y - (note.holdLength || 0), width/2, note.holdLength || 0);
        }
      }
      
      ctx.shadowBlur = 0;
    });

    // Draw score popups
    scorePopups.forEach(popup => {
      ctx.fillStyle = popup.color;
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.globalAlpha = popup.life / 60;
      ctx.fillText(popup.text, popup.x, popup.y);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    });

    // Draw UI
    ctx.fillStyle = '#0aff9d';
    ctx.font = '18px Arial';
    ctx.fillText(`Combo: ${combo}`, 10, 30);
    ctx.fillText(`Accuracy: ${accuracy}%`, 10, 55);
    ctx.fillText(`BPM: ${Math.round(bpm)}`, 10, 80);
    
    // Draw lane indicators
    ctx.font = '14px Arial';
    ['D', 'F', 'J', 'K'].forEach((key, i) => {
      const x = i * LANE_WIDTH + LANE_WIDTH/2;
      ctx.fillStyle = pressedLanes[i] ? '#ffffff' : '#888888';
      ctx.textAlign = 'center';
      ctx.fillText(key, x, GAME_HEIGHT - 10);
    });
    ctx.textAlign = 'left';
  }, [notes, scorePopups, pressedLanes, hitEffects, currentTime, combo, accuracy, bpm]);

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
      const laneIndex = LANE_KEYS.indexOf(e.code);
      if (laneIndex !== -1 && !pressedLanes[laneIndex]) {
        setPressedLanes(prev => {
          const newPressed = [...prev];
          newPressed[laneIndex] = true;
          return newPressed;
        });
        hitNote(laneIndex);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const laneIndex = LANE_KEYS.indexOf(e.code);
      if (laneIndex !== -1) {
        setPressedLanes(prev => {
          const newPressed = [...prev];
          newPressed[laneIndex] = false;
          return newPressed;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [hitNote, pressedLanes]);

  useEffect(() => {
    // Initialize audio context
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startGame = () => {
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setAccuracy(100);
    setBpm(120);
    setCurrentTime(0);
    setNotes([]);
    setScorePopups([]);
    setHitEffects([]);
    noteIdRef.current = 0;
    popupIdRef.current = 0;
    lastSpawnTime.current = 0;
    totalNotes.current = 0;
    hitNotes.current = 0;
    setIsPlaying(true);
    setIsPaused(false);
    
    // Resume audio context if needed
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const pauseGame = () => setIsPaused(!isPaused);
  const resetGame = () => {
    setIsPlaying(false);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setAccuracy(100);
    setBpm(120);
  };

  return (
    <GameLayout
      gameTitle="Pulse Rhythm"
      gameCategory="Hit the beats with perfect timing!"
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
          style={{ background: 'linear-gradient(180deg, #000814, #001d3d, #000814)' }}
        />
        
        <div className="text-center text-sm text-gray-400 max-w-md">
          Use D, F, J, K keys to hit notes in rhythm. Perfect timing gives maximum points!
          Build combos and maintain accuracy for high scores. Max Combo: {maxCombo}
        </div>
      </div>
    </GameLayout>
  );
}
