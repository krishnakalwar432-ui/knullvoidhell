import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  owned: number;
  power: number;
  costMultiplier: number;
  color: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  target: number;
  unlocked: boolean;
  reward: number;
}

const SingularityClicker: React.FC = () => {
  const [gameState, setGameState] = useState<'playing' | 'paused'>('playing');
  const [energy, setEnergy] = useState(0);
  const [energyPerSecond, setEnergyPerSecond] = useState(0);
  const [clickPower, setClickPower] = useState(1);
  const [totalClicks, setTotalClicks] = useState(0);
  const [prestige, setPrestige] = useState(0);
  const [singularityProgress, setSingularityProgress] = useState(0);

  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    {
      id: 'quantum-collector',
      name: 'Quantum Collector',
      description: 'Harvests quantum energy from the void',
      cost: 15,
      owned: 0,
      power: 1,
      costMultiplier: 1.15,
      color: '#0aff9d'
    },
    {
      id: 'fusion-reactor',
      name: 'Fusion Reactor',
      description: 'Generates massive amounts of energy',
      cost: 100,
      owned: 0,
      power: 8,
      costMultiplier: 1.20,
      color: '#7000ff'
    },
    {
      id: 'ai-processor',
      name: 'AI Processor',
      description: 'Self-improving AI that optimizes energy production',
      cost: 1100,
      owned: 0,
      power: 47,
      costMultiplier: 1.25,
      color: '#ff0099'
    },
    {
      id: 'dimensional-tap',
      name: 'Dimensional Tap',
      description: 'Extracts energy from parallel dimensions',
      cost: 12000,
      owned: 0,
      power: 260,
      costMultiplier: 1.30,
      color: '#00ffff'
    },
    {
      id: 'reality-engine',
      name: 'Reality Engine',
      description: 'Manipulates the fabric of spacetime for energy',
      cost: 130000,
      owned: 0,
      power: 1400,
      costMultiplier: 1.35,
      color: '#ffa500'
    },
    {
      id: 'singularity-core',
      name: 'Singularity Core',
      description: 'Harnesses the power of artificial black holes',
      cost: 1400000,
      owned: 0,
      power: 7800,
      costMultiplier: 1.40,
      color: '#ff6b6b'
    }
  ]);

  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: 'first-click', name: 'First Contact', description: 'Click the singularity for the first time', target: 1, unlocked: false, reward: 10 },
    { id: 'hundred-clicks', name: 'Persistent', description: 'Click 100 times', target: 100, unlocked: false, reward: 100 },
    { id: 'first-upgrade', name: 'Automation', description: 'Buy your first upgrade', target: 1, unlocked: false, reward: 50 },
    { id: 'energy-1k', name: 'Powered Up', description: 'Reach 1,000 energy', target: 1000, unlocked: false, reward: 200 },
    { id: 'energy-1m', name: 'Megawatt', description: 'Reach 1,000,000 energy', target: 1000000, unlocked: false, reward: 10000 }
  ]);

  // Auto-generate energy
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      const totalEPS = upgrades.reduce((sum, upgrade) => sum + (upgrade.owned * upgrade.power), 0);
      setEnergyPerSecond(totalEPS);
      setEnergy(prev => prev + totalEPS);
      
      // Update singularity progress
      setSingularityProgress(prev => Math.min(prev + totalEPS * 0.001, 100));
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, upgrades]);

  // Check achievements
  useEffect(() => {
    setAchievements(prev => prev.map(achievement => {
      if (!achievement.unlocked) {
        let currentValue = 0;
        switch (achievement.id) {
          case 'first-click':
          case 'hundred-clicks':
            currentValue = totalClicks;
            break;
          case 'first-upgrade':
            currentValue = upgrades.reduce((sum, u) => sum + u.owned, 0);
            break;
          case 'energy-1k':
          case 'energy-1m':
            currentValue = energy;
            break;
        }
        
        if (currentValue >= achievement.target) {
          setEnergy(e => e + achievement.reward);
          return { ...achievement, unlocked: true };
        }
      }
      return achievement;
    }));
  }, [totalClicks, energy, upgrades]);

  const handleClick = useCallback(() => {
    const clickValue = clickPower * (1 + prestige * 0.1);
    setEnergy(prev => prev + clickValue);
    setTotalClicks(prev => prev + 1);
    setSingularityProgress(prev => Math.min(prev + 0.1, 100));
  }, [clickPower, prestige]);

  const buyUpgrade = useCallback((upgradeId: string) => {
    setUpgrades(prev => prev.map(upgrade => {
      if (upgrade.id === upgradeId && energy >= upgrade.cost) {
        const newCost = Math.floor(upgrade.cost * upgrade.costMultiplier);
        setEnergy(e => e - upgrade.cost);
        return {
          ...upgrade,
          owned: upgrade.owned + 1,
          cost: newCost
        };
      }
      return upgrade;
    }));
  }, [energy]);

  const performPrestige = useCallback(() => {
    if (singularityProgress >= 100) {
      setPrestige(prev => prev + 1);
      setEnergy(0);
      setSingularityProgress(0);
      setUpgrades(prev => prev.map(upgrade => ({
        ...upgrade,
        owned: 0,
        cost: Math.floor(upgrade.cost / (upgrade.costMultiplier ** upgrade.owned))
      })));
      setEnergyPerSecond(0);
    }
  }, [singularityProgress]);

  const formatNumber = (num: number): string => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return Math.floor(num).toString();
  };

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setEnergy(0);
    setEnergyPerSecond(0);
    setClickPower(1);
    setTotalClicks(0);
    setPrestige(0);
    setSingularityProgress(0);
    setUpgrades(prev => prev.map(upgrade => ({ ...upgrade, owned: 0 })));
    setAchievements(prev => prev.map(achievement => ({ ...achievement, unlocked: false })));
    setGameState('playing');
  };

  return (
    <GameLayout
      gameTitle="Singularity Clicker"
      gameCategory="Idle"
      score={Math.floor(energy)}
      isPlaying={gameState === 'playing'}
      onPause={handlePause}
      onReset={handleReset}
    >
      <div className="min-h-[calc(100vh-64px)] p-4 bg-gradient-to-br from-background/50 to-background">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Clicker Area */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              
              {/* Stats */}
              <Card className="p-6 bg-card/30 backdrop-blur-sm border-border/50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-neon-green">{formatNumber(energy)}</div>
                    <div className="text-sm text-muted-foreground">Energy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-neon-purple">{formatNumber(energyPerSecond)}/s</div>
                    <div className="text-sm text-muted-foreground">Per Second</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-neon-pink">{totalClicks}</div>
                    <div className="text-sm text-muted-foreground">Total Clicks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-500">{prestige}</div>
                    <div className="text-sm text-muted-foreground">Prestige</div>
                  </div>
                </div>
              </Card>

              {/* Singularity Clicker */}
              <Card className="p-8 bg-card/30 backdrop-blur-sm border-border/50">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-neon-green mb-6">The Singularity</h3>
                  
                  <motion.div
                    className="relative mx-auto mb-6"
                    style={{ width: '200px', height: '200px' }}
                  >
                    <motion.button
                      onClick={handleClick}
                      className="w-full h-full rounded-full bg-gradient-to-br from-neon-green/20 to-neon-purple/20 border-4 border-neon-green/50 flex items-center justify-center text-4xl font-bold text-white relative overflow-hidden"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        boxShadow: '0 0 50px rgba(10, 255, 157, 0.5), inset 0 0 50px rgba(112, 0, 255, 0.3)'
                      }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-neon-green/30 to-neon-purple/30"
                        animate={{
                          rotate: 360,
                        }}
                        transition={{
                          duration: 10,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      />
                      <span className="relative z-10">◉</span>
                    </motion.button>
                    
                    {/* Click effects */}
                    <motion.div
                      key={totalClicks}
                      className="absolute inset-0 rounded-full border-4 border-neon-green/70"
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>

                  <div className="text-sm text-muted-foreground mb-4">
                    +{clickPower * (1 + prestige * 0.1)} energy per click
                  </div>

                  {/* Singularity Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Singularity Progress</span>
                      <span className="text-sm">{singularityProgress.toFixed(1)}%</span>
                    </div>
                    <Progress value={singularityProgress} className="h-3" />
                  </div>

                  {singularityProgress >= 100 && (
                    <Button
                      onClick={performPrestige}
                      className="bg-gradient-to-r from-neon-green to-neon-purple text-black font-bold"
                    >
                      Achieve Singularity (Prestige +1)
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Upgrades and Achievements */}
          <div className="space-y-6">
            
            {/* Upgrades */}
            <Card className="p-4 bg-card/30 backdrop-blur-sm border-border/50">
              <h3 className="text-xl font-bold text-neon-purple mb-4">Energy Generators</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {upgrades.map((upgrade) => (
                  <motion.div
                    key={upgrade.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm" style={{ color: upgrade.color }}>
                        {upgrade.name}
                      </h4>
                      <div className="text-xs text-muted-foreground mb-1">
                        {upgrade.description}
                      </div>
                      <div className="text-xs">
                        Owned: {upgrade.owned} | Power: +{upgrade.power}/s each
                      </div>
                    </div>
                    <div className="ml-2">
                      <Button
                        size="sm"
                        onClick={() => buyUpgrade(upgrade.id)}
                        disabled={energy < upgrade.cost}
                        className="text-xs h-8"
                        style={{
                          backgroundColor: energy >= upgrade.cost ? `${upgrade.color}20` : undefined,
                          borderColor: `${upgrade.color}50`,
                          color: upgrade.color
                        }}
                      >
                        {formatNumber(upgrade.cost)}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Achievements */}
            <Card className="p-4 bg-card/30 backdrop-blur-sm border-border/50">
              <h3 className="text-xl font-bold text-neon-green mb-4">Achievements</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <AnimatePresence>
                  {achievements.map((achievement) => (
                    <motion.div
                      key={achievement.id}
                      className={`p-3 rounded-lg border ${
                        achievement.unlocked 
                          ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' 
                          : 'bg-background/30 border-border/30 text-muted-foreground'
                      }`}
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: achievement.unlocked ? 1 : 0.5 }}
                      layout
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-sm">{achievement.name}</h4>
                          <div className="text-xs">{achievement.description}</div>
                        </div>
                        {achievement.unlocked && (
                          <div className="text-xs bg-neon-green/20 px-2 py-1 rounded">
                            +{achievement.reward}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </Card>
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

export default SingularityClicker;
