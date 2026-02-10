import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Player {
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  skills: {
    javascript: number;
    python: number;
    cpp: number;
    debugging: number;
  };
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  language: keyof Player['skills'];
  difficulty: number;
  code: string;
  solution: string;
  reward: { xp: number; skill: number };
}

interface Monster {
  name: string;
  health: number;
  maxHealth: number;
  weakness: keyof Player['skills'];
}

const challenges: Challenge[] = [
  {
    id: 'array-sum',
    title: 'Array Sum Bug',
    description: 'Fix the function that should sum all numbers in an array',
    language: 'javascript',
    difficulty: 1,
    code: 'function sumArray(arr) {\n  let sum = 0;\n  for (let i = 0; i <= arr.length; i++) {\n    sum += arr[i];\n  }\n  return sum;\n}',
    solution: 'i < arr.length',
    reward: { xp: 50, skill: 1 }
  },
  {
    id: 'recursive-factorial',
    title: 'Recursive Factorial',
    description: 'Complete the recursive factorial function',
    language: 'python',
    difficulty: 2,
    code: 'def factorial(n):\n  if n == 0:\n    return 1\n  return n * factorial(___)',
    solution: 'n - 1',
    reward: { xp: 75, skill: 2 }
  },
  {
    id: 'memory-leak',
    title: 'Memory Management',
    description: 'Fix the memory leak in this C++ code',
    language: 'cpp',
    difficulty: 3,
    code: 'void process() {\n  int* data = new int[100];\n  // process data\n  // Missing cleanup\n}',
    solution: 'delete[] data;',
    reward: { xp: 100, skill: 3 }
  }
];

export default function CodeQuestRPG() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [player, setPlayer] = useState<Player>({
    name: 'Code Warrior',
    level: 1,
    xp: 0,
    xpToNext: 100,
    health: 100,
    maxHealth: 100,
    mana: 50,
    maxMana: 50,
    skills: { javascript: 1, python: 1, cpp: 1, debugging: 1 }
  });
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [userInput, setUserInput] = useState('');
  const [gameState, setGameState] = useState<'exploring' | 'challenge' | 'battle' | 'victory'>('exploring');
  const [monster, setMonster] = useState<Monster | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);

  const spawnChallenge = useCallback(() => {
    const challenge = challenges[Math.floor(Math.random() * challenges.length)];
    setCurrentChallenge(challenge);
    setGameState('challenge');
    setUserInput('');
  }, []);

  const spawnMonster = useCallback(() => {
    const monsters = [
      { name: 'Syntax Error Dragon', health: 80, maxHealth: 80, weakness: 'debugging' as const },
      { name: 'Runtime Exception Goblin', health: 60, maxHealth: 60, weakness: 'javascript' as const },
      { name: 'Memory Leak Troll', health: 120, maxHealth: 120, weakness: 'cpp' as const },
      { name: 'Logic Bug Spider', health: 50, maxHealth: 50, weakness: 'python' as const }
    ];
    
    const newMonster = monsters[Math.floor(Math.random() * monsters.length)];
    setMonster(newMonster);
    setGameState('battle');
    setBattleLog([`A wild ${newMonster.name} appears!`]);
  }, []);

  const submitChallenge = useCallback(() => {
    if (!currentChallenge) return;
    
    const isCorrect = userInput.toLowerCase().includes(currentChallenge.solution.toLowerCase());
    
    if (isCorrect) {
      setPlayer(prev => {
        const newXp = prev.xp + currentChallenge.reward.xp;
        const newLevel = newXp >= prev.xpToNext ? prev.level + 1 : prev.level;
        const newSkills = { ...prev.skills };
        newSkills[currentChallenge.language] += currentChallenge.reward.skill;
        
        return {
          ...prev,
          xp: newLevel > prev.level ? newXp - prev.xpToNext : newXp,
          level: newLevel,
          xpToNext: newLevel > prev.level ? prev.xpToNext + 50 : prev.xpToNext,
          skills: newSkills,
          maxHealth: newLevel > prev.level ? prev.maxHealth + 20 : prev.maxHealth,
          maxMana: newLevel > prev.level ? prev.maxMana + 10 : prev.maxMana
        };
      });
      
      setScore(prev => prev + currentChallenge.reward.xp);
      setGameState('exploring');
      setCurrentChallenge(null);
    } else {
      setBattleLog(['Incorrect solution! Try again.']);
    }
  }, [currentChallenge, userInput]);

  const attackMonster = useCallback((skill: keyof Player['skills']) => {
    if (!monster) return;
    
    const skillLevel = player.skills[skill];
    const isWeakness = skill === monster.weakness;
    const damage = skillLevel * (isWeakness ? 25 : 15);
    
    const newHealth = Math.max(0, monster.health - damage);
    setMonster(prev => prev ? { ...prev, health: newHealth } : null);
    
    setBattleLog(prev => [
      ...prev,
      `You cast ${skill.toUpperCase()} for ${damage} damage!`,
      ...(isWeakness ? ['Critical hit! Monster weakness exploited!'] : [])
    ]);
    
    if (newHealth <= 0) {
      const xpGain = 30 + (monster.maxHealth / 2);
      setPlayer(prev => ({ ...prev, xp: prev.xp + xpGain }));
      setScore(prev => prev + xpGain);
      setBattleLog(prev => [...prev, `${monster.name} defeated! +${xpGain} XP`]);
      setGameState('exploring');
      setMonster(null);
    } else {
      // Monster attacks back
      const monsterDamage = 15 + Math.random() * 10;
      setPlayer(prev => ({ 
        ...prev, 
        health: Math.max(0, prev.health - monsterDamage) 
      }));
      setBattleLog(prev => [...prev, `${monster.name} attacks for ${Math.round(monsterDamage)} damage!`]);
    }
  }, [monster, player.skills]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#001122';
    ctx.fillRect(0, 0, 800, 600);

    // Code matrix background
    ctx.fillStyle = '#003300';
    ctx.font = '12px monospace';
    for (let x = 0; x < 800; x += 15) {
      for (let y = 0; y < 600; y += 20) {
        ctx.fillText(Math.random() > 0.5 ? '1' : '0', x, y);
      }
    }

    // Player stats panel
    ctx.fillStyle = 'rgba(0, 20, 40, 0.9)';
    ctx.fillRect(10, 10, 300, 150);

    ctx.fillStyle = '#0aff9d';
    ctx.font = '16px Arial';
    ctx.fillText(`${player.name} - Level ${player.level}`, 20, 35);
    ctx.fillText(`XP: ${player.xp}/${player.xpToNext}`, 20, 55);
    ctx.fillText(`Health: ${player.health}/${player.maxHealth}`, 20, 75);
    ctx.fillText(`Mana: ${player.mana}/${player.maxMana}`, 20, 95);

    // Skills
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText(`JS: ${player.skills.javascript}`, 20, 115);
    ctx.fillText(`Python: ${player.skills.python}`, 80, 115);
    ctx.fillText(`C++: ${player.skills.cpp}`, 20, 135);
    ctx.fillText(`Debug: ${player.skills.debugging}`, 80, 135);

    // Game state specific rendering
    if (gameState === 'challenge' && currentChallenge) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(50, 200, 700, 300);
      
      ctx.fillStyle = '#ffff00';
      ctx.font = '18px Arial';
      ctx.fillText(currentChallenge.title, 70, 230);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';
      ctx.fillText(currentChallenge.description, 70, 250);
      
      // Code block
      ctx.fillStyle = '#222222';
      ctx.fillRect(70, 270, 660, 150);
      ctx.fillStyle = '#00ff00';
      ctx.font = '12px monospace';
      const lines = currentChallenge.code.split('\n');
      lines.forEach((line, i) => {
        ctx.fillText(line, 80, 290 + i * 20);
      });
    }

    if (gameState === 'battle' && monster) {
      ctx.fillStyle = 'rgba(100, 0, 0, 0.7)';
      ctx.fillRect(200, 250, 400, 200);
      
      ctx.fillStyle = '#ff0099';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(monster.name, 400, 280);
      
      // Monster health bar
      const healthPercent = monster.health / monster.maxHealth;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(250, 300, 300, 20);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(250, 300, 300 * healthPercent, 20);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';
      ctx.fillText(`Weakness: ${monster.weakness.toUpperCase()}`, 400, 340);
      
      ctx.textAlign = 'left';
    }

    // Battle log
    if (battleLog.length > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(10, 450, 780, 140);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      battleLog.slice(-8).forEach((log, i) => {
        ctx.fillText(log, 20, 470 + i * 16);
      });
    }

  }, [player, gameState, currentChallenge, monster, battleLog]);

  useEffect(() => {
    const interval = setInterval(draw, 16);
    return () => clearInterval(interval);
  }, [draw]);

  useEffect(() => {
    if (gameState === 'exploring') {
      const timer = setTimeout(() => {
        Math.random() > 0.5 ? spawnChallenge() : spawnMonster();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState, spawnChallenge, spawnMonster]);

  const startGame = () => {
    setScore(0);
    setPlayer({
      name: 'Code Warrior',
      level: 1,
      xp: 0,
      xpToNext: 100,
      health: 100,
      maxHealth: 100,
      mana: 50,
      maxMana: 50,
      skills: { javascript: 1, python: 1, cpp: 1, debugging: 1 }
    });
    setGameState('exploring');
    setBattleLog(['Welcome to Code Quest! Prepare for coding challenges...']);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseGame = () => setIsPaused(!isPaused);
  const resetGame = () => setIsPlaying(false);

  return (
    <GameLayout
      gameTitle="Code Quest RPG"
      gameCategory="Level up by solving coding challenges!"
      score={score}
      isPlaying={isPlaying}
      onPause={pauseGame}
      onReset={resetGame}
    >
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border-2 border-neon-green rounded-lg max-w-full h-auto"
        />
        
        {isPlaying && gameState === 'challenge' && (
          <div className="flex flex-col gap-2 w-full max-w-2xl">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Enter your solution..."
              className="px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white"
            />
            <button
              onClick={submitChallenge}
              className="px-6 py-2 bg-neon-green text-black rounded hover:bg-neon-green/80"
            >
              Submit Solution
            </button>
          </div>
        )}
        
        {isPlaying && gameState === 'battle' && (
          <div className="flex gap-2 flex-wrap justify-center">
            {Object.keys(player.skills).map(skill => (
              <button
                key={skill}
                onClick={() => attackMonster(skill as keyof Player['skills'])}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                {skill.toUpperCase()} (Lvl {player.skills[skill as keyof Player['skills']]})
              </button>
            ))}
          </div>
        )}
        
        <div className="text-center text-sm text-gray-400 max-w-md">
          Solve coding challenges and battle bugs to level up your programming skills!
        </div>
      </div>
    </GameLayout>
  );
}
