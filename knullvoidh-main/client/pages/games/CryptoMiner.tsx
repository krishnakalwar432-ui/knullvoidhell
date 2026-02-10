import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface MiningRig {
  id: number;
  name: string;
  hashRate: number;
  cost: number;
  power: number;
  efficiency: number;
  level: number;
}

interface Cryptocurrency {
  name: string;
  symbol: string;
  price: number;
  volatility: number;
  color: string;
}

const CryptoMiner: React.FC = () => {
  const [gameState, setGameState] = useState<'playing' | 'paused'>('playing');
  const [score, setScore] = useState(0);
  const [balance, setBalance] = useState(1000);
  const [totalHashRate, setTotalHashRate] = useState(0);
  const [power, setPower] = useState(100);
  const [rigs, setRigs] = useState<MiningRig[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState(0);
  const [miningProgress, setMiningProgress] = useState(0);

  const rigTypes: Omit<MiningRig, 'id' | 'level'>[] = [
    { name: 'Basic CPU', hashRate: 10, cost: 100, power: 20, efficiency: 0.5 },
    { name: 'GPU Miner', hashRate: 50, cost: 500, power: 40, efficiency: 1.25 },
    { name: 'ASIC Miner', hashRate: 200, cost: 2000, power: 80, efficiency: 2.5 },
    { name: 'Quantum Rig', hashRate: 1000, cost: 10000, power: 150, efficiency: 6.67 },
    { name: 'Fusion Core', hashRate: 5000, cost: 50000, power: 300, efficiency: 16.67 }
  ];

  const cryptocurrencies: Cryptocurrency[] = [
    { name: 'CyberCoin', symbol: 'CYB', price: 100, volatility: 0.1, color: '#0aff9d' },
    { name: 'NeonToken', symbol: 'NEO', price: 50, volatility: 0.15, color: '#7000ff' },
    { name: 'VoidBit', symbol: 'VOID', price: 200, volatility: 0.2, color: '#ff0099' },
    { name: 'QuantumCash', symbol: 'QTC', price: 500, volatility: 0.25, color: '#00ffff' }
  ];

  const [cryptoPrices, setCryptoPrices] = useState(cryptocurrencies.map(c => c.price));

  // Update crypto prices
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setCryptoPrices(prev => prev.map((price, index) => {
        const crypto = cryptocurrencies[index];
        const change = (Math.random() - 0.5) * crypto.volatility;
        return Math.max(price * (1 + change), crypto.price * 0.1);
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [gameState]);

  // Mining process
  useEffect(() => {
    if (gameState !== 'playing' || totalHashRate === 0) return;

    const interval = setInterval(() => {
      setMiningProgress(prev => {
        const newProgress = prev + (totalHashRate / 100);
        if (newProgress >= 100) {
          const crypto = cryptocurrencies[selectedCrypto];
          const reward = (totalHashRate / 1000) * cryptoPrices[selectedCrypto];
          setBalance(prev => prev + reward);
          setScore(prev => prev + Math.floor(reward));
          return 0;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [gameState, totalHashRate, selectedCrypto, cryptoPrices]);

  // Update total hash rate and power
  useEffect(() => {
    const totalHash = rigs.reduce((sum, rig) => sum + rig.hashRate * rig.level, 0);
    const totalPower = rigs.reduce((sum, rig) => sum + rig.power * rig.level, 0);
    setTotalHashRate(totalHash);
    setPower(100 - totalPower);
  }, [rigs]);

  const buyRig = useCallback((rigTypeIndex: number) => {
    const rigType = rigTypes[rigTypeIndex];
    if (balance >= rigType.cost && power >= rigType.power) {
      const newRig: MiningRig = {
        ...rigType,
        id: Date.now(),
        level: 1
      };
      setRigs(prev => [...prev, newRig]);
      setBalance(prev => prev - rigType.cost);
    }
  }, [balance, power, rigTypes]);

  const upgradeRig = useCallback((rigId: number) => {
    setRigs(prev => prev.map(rig => {
      if (rig.id === rigId) {
        const upgradeCost = rig.cost * rig.level;
        if (balance >= upgradeCost) {
          setBalance(b => b - upgradeCost);
          return { ...rig, level: rig.level + 1 };
        }
      }
      return rig;
    }));
  }, [balance]);

  const sellRig = useCallback((rigId: number) => {
    setRigs(prev => prev.filter(rig => {
      if (rig.id === rigId) {
        setBalance(b => b + Math.floor(rig.cost * rig.level * 0.7));
        return false;
      }
      return true;
    }));
  }, []);

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore(0);
    setBalance(1000);
    setRigs([]);
    setMiningProgress(0);
    setGameState('playing');
  };

  return (
    <GameLayout
      gameTitle="Crypto Miner Sim"
      gameCategory="Simulation"
      score={score}
      isPlaying={gameState === 'playing'}
      onPause={handlePause}
      onReset={handleReset}
    >
      <div className="min-h-[calc(100vh-64px)] p-4 bg-gradient-to-br from-background/50 to-background">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Mining Status */}
          <div className="lg:col-span-3">
            <motion.div
              className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-border/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-green">${balance.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Balance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-purple">{totalHashRate.toFixed(0)}</div>
                  <div className="text-sm text-muted-foreground">Hash Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-pink">{power}%</div>
                  <div className="text-sm text-muted-foreground">Power Left</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">{rigs.length}</div>
                  <div className="text-sm text-muted-foreground">Mining Rigs</div>
                </div>
              </div>

              {/* Mining Progress */}
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Mining {cryptocurrencies[selectedCrypto].name}</span>
                  <span className="text-sm">{miningProgress.toFixed(1)}%</span>
                </div>
                <Progress value={miningProgress} className="h-3" />
              </div>

              {/* Crypto Selection */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {cryptocurrencies.map((crypto, index) => (
                  <Button
                    key={crypto.symbol}
                    variant={selectedCrypto === index ? "default" : "outline"}
                    className="h-12"
                    onClick={() => setSelectedCrypto(index)}
                    style={{
                      borderColor: selectedCrypto === index ? crypto.color : undefined,
                      color: selectedCrypto === index ? '#000' : crypto.color
                    }}
                  >
                    <div className="text-center">
                      <div className="font-bold">{crypto.symbol}</div>
                      <div className="text-xs">${cryptoPrices[index].toFixed(2)}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Buy Rigs */}
          <div className="lg:col-span-2">
            <motion.div
              className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-border/50"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-xl font-bold mb-4 text-neon-green">Mining Rigs Shop</h3>
              <div className="space-y-3">
                {rigTypes.map((rigType, index) => (
                  <motion.div
                    key={rigType.name}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold">{rigType.name}</h4>
                      <div className="text-sm text-muted-foreground">
                        {rigType.hashRate} H/s • {rigType.power}W • ${rigType.cost}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => buyRig(index)}
                      disabled={balance < rigType.cost || power < rigType.power}
                      className="bg-neon-green/20 text-neon-green hover:bg-neon-green/30"
                    >
                      Buy
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* My Rigs */}
          <div>
            <motion.div
              className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-border/50"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-bold mb-4 text-neon-purple">My Rigs</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {rigs.map((rig) => (
                    <motion.div
                      key={rig.id}
                      className="p-3 rounded-lg bg-background/50 border border-border/30"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      layout
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-sm">{rig.name}</h4>
                        <span className="text-xs bg-neon-purple/20 text-neon-purple px-2 py-1 rounded">
                          Lv.{rig.level}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {(rig.hashRate * rig.level).toFixed(0)} H/s
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-6 px-2"
                          onClick={() => upgradeRig(rig.id)}
                          disabled={balance < rig.cost * rig.level}
                        >
                          Upgrade (${rig.cost * rig.level})
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-6 px-2 text-red-400"
                          onClick={() => sellRig(rig.id)}
                        >
                          Sell
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {rigs.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No rigs yet. Buy your first mining rig!
                  </div>
                )}
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

export default CryptoMiner;
