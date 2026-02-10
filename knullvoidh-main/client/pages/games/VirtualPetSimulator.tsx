import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface Pet {
  name: string;
  type: 'cyber-cat' | 'nano-dog' | 'quantum-bird';
  happiness: number;
  hunger: number;
  energy: number;
  health: number;
  age: number;
  level: number;
  experience: number;
  mood: 'happy' | 'sad' | 'sleeping' | 'hungry' | 'sick' | 'playful';
}

interface Activity {
  name: string;
  icon: string;
  effects: Partial<Pet>;
  cost: number;
  cooldown: number;
  description: string;
}

const VirtualPetSimulator: React.FC = () => {
  const [gameState, setGameState] = useState<'playing' | 'paused'>('playing');
  const [score, setScore] = useState(0);
  const [currency, setCurrency] = useState(100);
  const [pet, setPet] = useState<Pet>({
    name: 'CyberPet',
    type: 'cyber-cat',
    happiness: 80,
    hunger: 70,
    energy: 90,
    health: 100,
    age: 0,
    level: 1,
    experience: 0,
    mood: 'happy'
  });
  const [activities, setActivities] = useState<Record<string, number>>({});
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  const petTypes = {
    'cyber-cat': { emoji: '🐱', name: 'Cyber Cat', baseStats: { happiness: 80, energy: 90 } },
    'nano-dog': { emoji: '🐶', name: 'Nano Dog', baseStats: { happiness: 90, energy: 85 } },
    'quantum-bird': { emoji: '🦜', name: 'Quantum Bird', baseStats: { happiness: 85, energy: 95 } }
  };

  const availableActivities: Record<string, Activity> = {
    feed: {
      name: 'Feed',
      icon: '🍖',
      effects: { hunger: 30, happiness: 10, experience: 5 },
      cost: 10,
      cooldown: 30,
      description: 'Give your pet some cyber-food'
    },
    play: {
      name: 'Play',
      icon: '🎾',
      effects: { happiness: 25, energy: -15, experience: 10 },
      cost: 5,
      cooldown: 60,
      description: 'Play games with your pet'
    },
    sleep: {
      name: 'Sleep',
      icon: '😴',
      effects: { energy: 40, happiness: 5, experience: 3 },
      cost: 0,
      cooldown: 120,
      description: 'Let your pet rest and recharge'
    },
    heal: {
      name: 'Medical',
      icon: '💊',
      effects: { health: 30, happiness: -5, experience: 2 },
      cost: 25,
      cooldown: 180,
      description: 'Heal your pet with nano-medicine'
    },
    train: {
      name: 'Train',
      icon: '🏋️',
      effects: { experience: 20, energy: -25, happiness: 15 },
      cost: 15,
      cooldown: 90,
      description: 'Train your pet to increase experience'
    },
    treat: {
      name: 'Treat',
      icon: '🍭',
      effects: { happiness: 35, hunger: 10, experience: 8 },
      cost: 20,
      cooldown: 45,
      description: 'Give your pet a special cyber-treat'
    }
  };

  // Update pet mood based on stats
  const updateMood = useCallback((petStats: Pet): Pet['mood'] => {
    if (petStats.health < 30) return 'sick';
    if (petStats.energy < 20) return 'sleeping';
    if (petStats.hunger < 30) return 'hungry';
    if (petStats.happiness < 40) return 'sad';
    if (petStats.happiness > 80 && petStats.energy > 60) return 'playful';
    return 'happy';
  }, []);

  // Perform activity
  const performActivity = useCallback((activityKey: string) => {
    const activity = availableActivities[activityKey];
    const cooldownEnd = activities[activityKey] || 0;
    
    if (Date.now() < cooldownEnd || currency < activity.cost) return;

    setCurrency(prev => prev - activity.cost);
    setActivities(prev => ({
      ...prev,
      [activityKey]: Date.now() + activity.cooldown * 1000
    }));

    setPet(prev => {
      const newStats = { ...prev };
      
      // Apply activity effects
      Object.entries(activity.effects).forEach(([stat, change]) => {
        if (stat in newStats && typeof change === 'number') {
          (newStats as any)[stat] = Math.max(0, Math.min(100, (newStats as any)[stat] + change));
        }
      });

      // Check for level up
      if (newStats.experience >= newStats.level * 100) {
        newStats.level += 1;
        newStats.experience = 0;
        newStats.happiness = Math.min(100, newStats.happiness + 20);
        setScore(prev => prev + newStats.level * 100);
        setCurrency(prev => prev + newStats.level * 50);
      }

      newStats.mood = updateMood(newStats);
      return newStats;
    });

    setScore(prev => prev + 10);
  }, [activities, currency, availableActivities, updateMood]);

  // Passive stat decay
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setPet(prev => {
        const newStats = { ...prev };
        
        // Gradual stat decay
        newStats.hunger = Math.max(0, newStats.hunger - 0.5);
        newStats.happiness = Math.max(0, newStats.happiness - 0.3);
        newStats.energy = Math.max(0, newStats.energy - 0.2);
        
        // Health effects
        if (newStats.hunger < 20 || newStats.happiness < 20) {
          newStats.health = Math.max(0, newStats.health - 0.5);
        } else if (newStats.health < 100) {
          newStats.health = Math.min(100, newStats.health + 0.1);
        }

        // Age progression
        newStats.age += 0.01;

        newStats.mood = updateMood(newStats);
        
        // Auto-earn currency
        setCurrency(prev => prev + 1);
        
        return newStats;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, updateMood]);

  const getMoodEmoji = (mood: Pet['mood']): string => {
    switch (mood) {
      case 'happy': return '😊';
      case 'sad': return '😢';
      case 'sleeping': return '😴';
      case 'hungry': return '😋';
      case 'sick': return '🤒';
      case 'playful': return '😸';
      default: return '😐';
    }
  };

  const getStatColor = (value: number): string => {
    if (value > 70) return '#0aff9d';
    if (value > 40) return '#ffa500';
    return '#ff0099';
  };

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore(0);
    setCurrency(100);
    setPet({
      name: 'CyberPet',
      type: 'cyber-cat',
      happiness: 80,
      hunger: 70,
      energy: 90,
      health: 100,
      age: 0,
      level: 1,
      experience: 0,
      mood: 'happy'
    });
    setActivities({});
    setSelectedActivity(null);
    setGameState('playing');
  };

  return (
    <GameLayout
      gameTitle="Virtual Pet Simulator"
      gameCategory="Simulation"
      score={score}
      isPlaying={gameState === 'playing'}
      onPause={handlePause}
      onReset={handleReset}
    >
      <div className="min-h-[calc(100vh-64px)] p-4 bg-gradient-to-br from-background/50 to-background">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Pet Display */}
          <div className="lg:col-span-2">
            <motion.div
              className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-border/50 mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {/* Pet Info */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-neon-green mb-2">{pet.name}</h2>
                <div className="text-sm text-muted-foreground mb-4">
                  {petTypes[pet.type].name} • Level {pet.level} • Age {pet.age.toFixed(1)} years
                </div>
                
                {/* Pet Avatar */}
                <motion.div
                  className="text-8xl mb-4"
                  animate={{
                    scale: pet.mood === 'playful' ? [1, 1.1, 1] : 1,
                    rotate: pet.mood === 'sleeping' ? [0, -5, 5, 0] : 0
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {petTypes[pet.type].emoji}
                </motion.div>
                
                {/* Mood Display */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-2xl">{getMoodEmoji(pet.mood)}</span>
                  <span className="capitalize text-lg font-semibold" style={{ color: getStatColor(pet.happiness) }}>
                    {pet.mood}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Happiness', value: pet.happiness, icon: '😊' },
                  { name: 'Hunger', value: pet.hunger, icon: '🍖' },
                  { name: 'Energy', value: pet.energy, icon: '⚡' },
                  { name: 'Health', value: pet.health, icon: '❤️' }
                ].map(stat => (
                  <div key={stat.name} className="bg-background/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium flex items-center gap-1">
                        <span>{stat.icon}</span>
                        {stat.name}
                      </span>
                      <span className="text-sm font-bold" style={{ color: getStatColor(stat.value) }}>
                        {Math.round(stat.value)}%
                      </span>
                    </div>
                    <Progress 
                      value={stat.value} 
                      className="h-2"
                      style={{
                        backgroundColor: getStatColor(stat.value) + '20'
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Experience Bar */}
              <div className="mt-4 bg-background/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Experience</span>
                  <span className="text-sm font-bold text-neon-purple">
                    {Math.round(pet.experience)}/{pet.level * 100}
                  </span>
                </div>
                <Progress 
                  value={(pet.experience / (pet.level * 100)) * 100} 
                  className="h-2"
                />
              </div>
            </motion.div>

            {/* Currency Display */}
            <motion.div
              className="bg-card/30 backdrop-blur-sm rounded-xl p-4 border border-border/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">💰</span>
                <span className="text-xl font-bold text-neon-green">{currency}</span>
                <span className="text-sm text-muted-foreground">Cyber Coins</span>
              </div>
            </motion.div>
          </div>

          {/* Activities Panel */}
          <div>
            <motion.div
              className="bg-card/30 backdrop-blur-sm rounded-xl p-4 border border-border/50"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-lg font-bold text-neon-purple mb-4">Activities</h3>
              
              <div className="space-y-3">
                {Object.entries(availableActivities).map(([key, activity]) => {
                  const cooldownEnd = activities[key] || 0;
                  const onCooldown = Date.now() < cooldownEnd;
                  const canAfford = currency >= activity.cost;
                  const timeLeft = Math.max(0, cooldownEnd - Date.now()) / 1000;

                  return (
                    <motion.button
                      key={key}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                        onCooldown || !canAfford
                          ? 'border-gray-600 bg-gray-800/50 opacity-50'
                          : 'border-neon-green/50 bg-neon-green/10 hover:bg-neon-green/20'
                      }`}
                      onClick={() => performActivity(key)}
                      disabled={onCooldown || !canAfford}
                      whileHover={!onCooldown && canAfford ? { scale: 1.02 } : {}}
                      whileTap={!onCooldown && canAfford ? { scale: 0.98 } : {}}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{activity.icon}</span>
                          <span className="font-semibold">{activity.name}</span>
                        </div>
                        <span className="text-sm text-neon-green">
                          {activity.cost > 0 ? `${activity.cost} coins` : 'Free'}
                        </span>
                      </div>
                      
                      <div className="text-xs text-muted-foreground mb-2">
                        {activity.description}
                      </div>
                      
                      {onCooldown && (
                        <div className="text-xs text-yellow-500">
                          Cooldown: {Math.ceil(timeLeft)}s
                        </div>
                      )}
                      
                      {!canAfford && !onCooldown && (
                        <div className="text-xs text-red-500">
                          Not enough coins
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Care Tips */}
              <div className="mt-6 p-3 bg-background/50 rounded-lg">
                <h4 className="text-sm font-semibold text-neon-pink mb-2">Care Tips</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Feed regularly to maintain hunger</li>
                  <li>• Play and give treats for happiness</li>
                  <li>• Let your pet sleep when energy is low</li>
                  <li>• Use medicine if health drops</li>
                  <li>• Train to gain experience faster</li>
                  <li>• Level up for bonus rewards!</li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Pause Overlay */}
        <AnimatePresence>
          {gameState === 'paused' && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-6xl font-bold text-white">PAUSED</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameLayout>
  );
};

export default VirtualPetSimulator;
