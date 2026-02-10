import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Note {
  id: number;
  lane: number;
  y: number;
  hit: boolean;
  type: 'normal' | 'long' | 'special';
  color: string;
}

interface ScoreEffect {
  id: number;
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

const BeatSyncRhythm: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [notes, setNotes] = useState<Note[]>([]);
  const [scoreEffects, setScoreEffects] = useState<ScoreEffect[]>([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [bpm] = useState(120);
  const [song] = useState('Cyber Beats');

  const gameLoopRef = useRef<number>();
  const noteIdRef = useRef(0);
  const scoreEffectIdRef = useRef(0);
  const totalHits = useRef(0);
  const perfectHits = useRef(0);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const LANE_WIDTH = 100;
  const NUM_LANES = 4;
  const HIT_ZONE_Y = CANVAS_HEIGHT - 80;
  const NOTE_SPEED = 4;

  const laneKeys = ['a', 's', 'd', 'f'];
  const laneColors = ['#0aff9d', '#7000ff', '#ff0099', '#00ffff'];

  // Create score effect
  const createScoreEffect = useCallback((x: number, y: number, text: string, color: string) => {
    setScoreEffects(prev => [...prev, {
      id: scoreEffectIdRef.current++,
      x,
      y,
      text,
      life: 1.0,
      color
    }]);
  }, []);

  // Spawn note
  const spawnNote = useCallback(() => {
    const lane = Math.floor(Math.random() * NUM_LANES);
    const types: Note['type'][] = ['normal', 'normal', 'normal', 'long', 'special'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const note: Note = {
      id: noteIdRef.current++,
      lane,
      y: -20,
      hit: false,
      type,
      color: type === 'special' ? '#ffa500' : type === 'long' ? '#ff6b6b' : laneColors[lane]
    };

    setNotes(prev => [...prev, note]);
  }, []);

  // Check note hit
  const checkHit = useCallback((lane: number) => {
    const laneNotes = notes.filter(note => note.lane === lane && !note.hit)
      .sort((a, b) => Math.abs(a.y - HIT_ZONE_Y) - Math.abs(b.y - HIT_ZONE_Y));
    
    if (laneNotes.length === 0) return;

    const closestNote = laneNotes[0];
    const distance = Math.abs(closestNote.y - HIT_ZONE_Y);
    
    let hitType = '';
    let points = 0;
    let accuracyBonus = 0;

    if (distance < 15) {
      hitType = 'PERFECT';
      points = closestNote.type === 'special' ? 300 : closestNote.type === 'long' ? 150 : 100;
      accuracyBonus = 100;
      perfectHits.current++;
    } else if (distance < 30) {
      hitType = 'GOOD';
      points = closestNote.type === 'special' ? 200 : closestNote.type === 'long' ? 100 : 75;
      accuracyBonus = 80;
    } else if (distance < 50) {
      hitType = 'OK';
      points = closestNote.type === 'special' ? 100 : closestNote.type === 'long' ? 50 : 50;
      accuracyBonus = 60;
    } else {
      return; // Too far to hit
    }

    // Update note as hit
    setNotes(prev => prev.map(note => 
      note.id === closestNote.id ? { ...note, hit: true } : note
    ));

    // Update score and combo
    const comboMultiplier = Math.min(Math.floor(combo / 10) + 1, 4);
    const finalPoints = points * comboMultiplier;
    
    setScore(prev => prev + finalPoints);
    setCombo(prev => prev + 1);
    totalHits.current++;

    // Update accuracy
    const totalAccuracy = (perfectHits.current * 100 + (totalHits.current - perfectHits.current) * accuracyBonus) / totalHits.current;
    setAccuracy(Math.floor(totalAccuracy));

    // Create score effect
    const laneX = (CANVAS_WIDTH - NUM_LANES * LANE_WIDTH) / 2 + lane * LANE_WIDTH + LANE_WIDTH / 2;
    createScoreEffect(laneX, HIT_ZONE_Y - 30, `${hitType} +${finalPoints}`, closestNote.color);
  }, [notes, combo, createScoreEffect]);

  // Handle input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setKeys(prev => new Set([...prev, key]));
      
      const laneIndex = laneKeys.indexOf(key);
      if (laneIndex !== -1) {
        checkHit(laneIndex);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(e.key.toLowerCase());
        return newKeys;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [checkHit]);

  // Touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    
    // Determine which lane was touched
    const laneStartX = (CANVAS_WIDTH - NUM_LANES * LANE_WIDTH) / 2;
    const lane = Math.floor((x - laneStartX) / LANE_WIDTH);
    
    if (lane >= 0 && lane < NUM_LANES) {
      checkHit(lane);
    }
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      // Move notes down
      setNotes(prev => prev
        .map(note => ({ ...note, y: note.y + NOTE_SPEED }))
        .filter(note => note.y < CANVAS_HEIGHT + 50)
      );

      // Check for missed notes
      setNotes(prev => {
        const missedNotes = prev.filter(note => 
          !note.hit && note.y > HIT_ZONE_Y + 60
        );
        
        if (missedNotes.length > 0) {
          setCombo(0);
          totalHits.current += missedNotes.length;
          setAccuracy(Math.floor((perfectHits.current * 100) / totalHits.current));
        }
        
        return prev.filter(note => 
          note.hit || note.y <= HIT_ZONE_Y + 60
        );
      });

      // Update score effects
      setScoreEffects(prev => prev
        .map(effect => ({
          ...effect,
          y: effect.y - 2,
          life: effect.life - 0.02
        }))
        .filter(effect => effect.life > 0)
      );

      // Spawn notes based on BPM
      const beatInterval = (60 / bpm) * 60; // Convert BPM to frames
      if (Math.random() < 1 / beatInterval) {
        spawnNote();
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, bpm, spawnNote]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with rhythm background
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0a0a0f');
    gradient.addColorStop(0.5, '#1a0a2a');
    gradient.addColorStop(1, '#0f0f1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw lanes
    const laneStartX = (CANVAS_WIDTH - NUM_LANES * LANE_WIDTH) / 2;
    
    for (let i = 0; i < NUM_LANES; i++) {
      const x = laneStartX + i * LANE_WIDTH;
      const isPressed = keys.has(laneKeys[i]);
      
      // Lane background
      ctx.fillStyle = isPressed ? laneColors[i] + '30' : laneColors[i] + '10';
      ctx.fillRect(x, 0, LANE_WIDTH, CANVAS_HEIGHT);
      
      // Lane borders
      ctx.strokeStyle = laneColors[i];
      ctx.lineWidth = 2;
      ctx.strokeRect(x, 0, LANE_WIDTH, CANVAS_HEIGHT);
      
      // Hit zone
      ctx.fillStyle = laneColors[i] + '50';
      ctx.fillRect(x, HIT_ZONE_Y - 20, LANE_WIDTH, 40);
      
      // Lane label
      ctx.fillStyle = laneColors[i];
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(laneKeys[i].toUpperCase(), x + LANE_WIDTH / 2, HIT_ZONE_Y + 50);
    }

    // Draw notes
    notes.forEach(note => {
      if (note.hit) return;
      
      const x = laneStartX + note.lane * LANE_WIDTH;
      ctx.fillStyle = note.color;
      ctx.shadowColor = note.color;
      ctx.shadowBlur = 10;
      
      if (note.type === 'long') {
        // Long note
        ctx.fillRect(x + 10, note.y, LANE_WIDTH - 20, 40);
      } else if (note.type === 'special') {
        // Special note - diamond shape
        ctx.beginPath();
        ctx.moveTo(x + LANE_WIDTH / 2, note.y);
        ctx.lineTo(x + LANE_WIDTH - 10, note.y + 15);
        ctx.lineTo(x + LANE_WIDTH / 2, note.y + 30);
        ctx.lineTo(x + 10, note.y + 15);
        ctx.closePath();
        ctx.fill();
      } else {
        // Normal note
        ctx.fillRect(x + 15, note.y, LANE_WIDTH - 30, 20);
      }
      
      ctx.shadowBlur = 0;
    });

    // Draw score effects
    scoreEffects.forEach(effect => {
      ctx.globalAlpha = effect.life;
      ctx.fillStyle = effect.color;
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(effect.text, effect.x, effect.y);
    });
    ctx.globalAlpha = 1;

    // Draw UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Song: ${song}`, 20, 30);
    ctx.fillText(`Score: ${score.toLocaleString()}`, 20, 55);
    ctx.fillText(`Combo: ${combo}x`, 20, 80);
    ctx.fillText(`Accuracy: ${accuracy}%`, 20, 105);
    ctx.fillText(`BPM: ${bpm}`, 20, 130);

    // Draw combo meter
    if (combo > 10) {
      ctx.fillStyle = '#0aff9d';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${combo}x COMBO!`, CANVAS_WIDTH / 2, 80);
    }

    if (gameState === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ffffff';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SONG COMPLETE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px monospace';
      ctx.fillText(`Final Score: ${score.toLocaleString()}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.fillText(`Accuracy: ${accuracy}%`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    }
  });

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore(0);
    setCombo(0);
    setAccuracy(100);
    setNotes([]);
    setScoreEffects([]);
    totalHits.current = 0;
    perfectHits.current = 0;
    setGameState('playing');
  };

  return (
    <GameLayout
      gameTitle="Beat Sync Rhythm"
      gameCategory="Music"
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
            onTouchStart={handleTouchStart}
            style={{ touchAction: 'none' }}
          />
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p className="md:hidden">Touch lanes to hit notes as they reach the target zone</p>
            <p className="hidden md:block">Press A, S, D, F keys to hit notes • Hit when notes reach the glowing zone</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default BeatSyncRhythm;
