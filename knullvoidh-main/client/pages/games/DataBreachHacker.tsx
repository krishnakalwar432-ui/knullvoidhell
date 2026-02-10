import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';

interface System {
  id: number;
  name: string;
  security: number;
  maxSecurity: number;
  value: number;
  hacked: boolean;
  type: 'database' | 'server' | 'mainframe' | 'firewall';
  color: string;
}

interface HackAttempt {
  id: number;
  type: 'bruteforce' | 'social' | 'exploit' | 'virus';
  power: number;
  cost: number;
  cooldown: number;
  maxCooldown: number;
}

const DataBreachHacker: React.FC = () => {
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'busted'>('playing');
  const [score, setScore] = useState(0);
  const [heat, setHeat] = useState(0);
  const [reputation, setReputation] = useState(1);
  const [systems, setSystems] = useState<System[]>([]);
  const [hackTools, setHackTools] = useState<HackAttempt[]>([
    { id: 1, type: 'bruteforce', power: 10, cost: 5, cooldown: 0, maxCooldown: 30 },
    { id: 2, type: 'social', power: 15, cost: 10, cooldown: 0, maxCooldown: 45 },
    { id: 3, type: 'exploit', power: 25, cost: 20, cooldown: 0, maxCooldown: 60 },
    { id: 4, type: 'virus', power: 50, cost: 50, cooldown: 0, maxCooldown: 120 }
  ]);
  const [selectedSystem, setSelectedSystem] = useState<number | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '> INITIATING HACK SESSION...',
    '> CONNECTION ESTABLISHED',
    '> SCANNING FOR TARGETS...'
  ]);
  const [commandInput, setCommandInput] = useState('');

  // Initialize systems
  const generateSystems = useCallback(() => {
    const systemTypes = [
      { name: 'Corporate Database', type: 'database' as const, base: 50, value: 100, color: '#0aff9d' },
      { name: 'Government Server', type: 'server' as const, base: 80, value: 200, color: '#7000ff' },
      { name: 'Bank Mainframe', type: 'mainframe' as const, base: 120, value: 500, color: '#ff0099' },
      { name: 'Military Firewall', type: 'firewall' as const, base: 200, value: 1000, color: '#ff0000' }
    ];

    const newSystems: System[] = [];
    for (let i = 0; i < 6; i++) {
      const template = systemTypes[Math.floor(Math.random() * systemTypes.length)];
      const securityLevel = template.base + Math.floor(Math.random() * 50);
      
      newSystems.push({
        id: i,
        name: `${template.name} #${i + 1}`,
        security: securityLevel,
        maxSecurity: securityLevel,
        value: template.value + Math.floor(Math.random() * template.value),
        hacked: false,
        type: template.type,
        color: template.color
      });
    }
    
    setSystems(newSystems);
  }, []);

  // Add terminal output
  const addTerminalLine = useCallback((line: string) => {
    setTerminalOutput(prev => [...prev.slice(-15), `> ${line}`]);
  }, []);

  // Execute hack
  const executeHack = useCallback((systemId: number, toolId: number) => {
    const system = systems.find(s => s.id === systemId);
    const tool = hackTools.find(t => t.id === toolId);
    
    if (!system || !tool || tool.cooldown > 0 || score < tool.cost) return;

    // Deduct cost
    setScore(prev => prev - tool.cost);
    
    // Set cooldown
    setHackTools(prev => prev.map(t => 
      t.id === toolId ? { ...t, cooldown: t.maxCooldown } : t
    ));

    // Calculate success
    const successChance = tool.power / system.security;
    const success = Math.random() < successChance;
    
    if (success) {
      setSystems(prev => prev.map(s => 
        s.id === systemId 
          ? { ...s, security: Math.max(0, s.security - tool.power) }
          : s
      ));
      
      addTerminalLine(`${tool.type.toUpperCase()} attack on ${system.name} successful!`);
      
      if (system.security - tool.power <= 0) {
        setSystems(prev => prev.map(s => 
          s.id === systemId ? { ...s, hacked: true } : s
        ));
        setScore(prev => prev + system.value);
        setReputation(prev => prev + 1);
        addTerminalLine(`SYSTEM BREACHED! +${system.value} credits`);
      }
    } else {
      addTerminalLine(`${tool.type.toUpperCase()} attack failed. Security alerted!`);
      setHeat(prev => Math.min(prev + 10, 100));
    }
  }, [systems, hackTools, score, addTerminalLine]);

  // Handle terminal commands
  const executeCommand = useCallback(() => {
    const cmd = commandInput.toLowerCase().trim();
    addTerminalLine(commandInput);
    
    switch (cmd) {
      case 'scan':
        addTerminalLine('Scanning for vulnerable systems...');
        setTimeout(() => {
          const vulnerableSystems = systems.filter(s => !s.hacked && s.security < 100);
          addTerminalLine(`Found ${vulnerableSystems.length} vulnerable targets`);
        }, 1000);
        break;
      case 'status':
        addTerminalLine(`Reputation: ${reputation} | Heat: ${heat}% | Credits: ${score}`);
        break;
      case 'help':
        addTerminalLine('Available commands: scan, status, hide, upgrade');
        break;
      case 'hide':
        setHeat(prev => Math.max(prev - 20, 0));
        addTerminalLine('Hiding digital footprints... Heat reduced');
        break;
      case 'upgrade':
        if (score >= 100) {
          setScore(prev => prev - 100);
          setHackTools(prev => prev.map(tool => ({ 
            ...tool, 
            power: tool.power + 5 
          })));
          addTerminalLine('Tools upgraded! +5 power to all attacks');
        } else {
          addTerminalLine('Insufficient credits for upgrade (100 needed)');
        }
        break;
      default:
        addTerminalLine('Unknown command. Type "help" for available commands');
    }
    
    setCommandInput('');
  }, [commandInput, addTerminalLine, systems, reputation, heat, score]);

  // Game loop for cooldowns and heat
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      // Reduce cooldowns
      setHackTools(prev => prev.map(tool => ({
        ...tool,
        cooldown: Math.max(0, tool.cooldown - 1)
      })));

      // Increase heat gradually
      setHeat(prev => {
        const newHeat = Math.min(prev + 0.1, 100);
        if (newHeat >= 100) {
          setGameState('busted');
          addTerminalLine('ALERT: AUTHORITIES HAVE TRACED YOUR LOCATION!');
        }
        return newHeat;
      });

      // Generate new systems occasionally
      if (systems.filter(s => !s.hacked).length < 3 && Math.random() < 0.1) {
        generateSystems();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gameState, systems, addTerminalLine, generateSystems]);

  useEffect(() => {
    generateSystems();
  }, [generateSystems]);

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore(0);
    setHeat(0);
    setReputation(1);
    setSelectedSystem(null);
    setTerminalOutput(['> INITIATING HACK SESSION...', '> CONNECTION ESTABLISHED']);
    setCommandInput('');
    setHackTools([
      { id: 1, type: 'bruteforce', power: 10, cost: 5, cooldown: 0, maxCooldown: 30 },
      { id: 2, type: 'social', power: 15, cost: 10, cooldown: 0, maxCooldown: 45 },
      { id: 3, type: 'exploit', power: 25, cost: 20, cooldown: 0, maxCooldown: 60 },
      { id: 4, type: 'virus', power: 50, cost: 50, cooldown: 0, maxCooldown: 120 }
    ]);
    generateSystems();
    setGameState('playing');
  };

  return (
    <GameLayout
      gameTitle="Data Breach Hacker Sim"
      gameCategory="Simulation"
      score={score}
      isPlaying={gameState === 'playing'}
      onPause={handlePause}
      onReset={handleReset}
    >
      <div className="min-h-[calc(100vh-64px)] p-4 bg-gradient-to-br from-background/50 to-background">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Status Panel */}
          <div className="lg:col-span-3">
            <motion.div
              className="bg-card/30 backdrop-blur-sm rounded-xl p-4 border border-border/50 mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-green">{score}</div>
                  <div className="text-sm text-muted-foreground">Credits</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-purple">{reputation}</div>
                  <div className="text-sm text-muted-foreground">Reputation</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${heat > 80 ? 'text-red-500' : heat > 50 ? 'text-yellow-500' : 'text-neon-green'}`}>
                    {heat.toFixed(0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Heat Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-pink">
                    {systems.filter(s => s.hacked).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Systems Hacked</div>
                </div>
              </div>
              
              {/* Heat Bar */}
              <div className="mt-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Heat Level</span>
                  <span className="text-sm text-red-400">
                    {heat >= 90 ? 'CRITICAL' : heat >= 70 ? 'HIGH' : heat >= 40 ? 'MEDIUM' : 'LOW'}
                  </span>
                </div>
                <Progress 
                  value={heat} 
                  className="h-2"
                  style={{
                    background: heat > 80 ? '#ff000020' : heat > 50 ? '#ffaa0020' : '#00ff0020'
                  }}
                />
              </div>
            </motion.div>
          </div>

          {/* Terminal */}
          <div className="lg:col-span-2">
            <motion.div
              className="bg-black/80 rounded-xl p-4 border border-neon-green/50 h-96"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="text-neon-green font-mono text-sm h-full flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-1">
                  <AnimatePresence>
                    {terminalOutput.map((line, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="whitespace-pre-wrap"
                      >
                        {line}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                
                <div className="flex mt-2">
                  <span className="text-neon-green mr-2">$</span>
                  <Input
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && executeCommand()}
                    className="bg-transparent border-none text-neon-green font-mono p-0 focus:ring-0"
                    placeholder="Enter command..."
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Tools */}
          <div>
            <motion.div
              className="bg-card/30 backdrop-blur-sm rounded-xl p-4 border border-border/50 mb-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h3 className="text-lg font-bold text-neon-purple mb-4">Hack Tools</h3>
              <div className="space-y-3">
                {hackTools.map(tool => (
                  <div key={tool.id} className="p-3 rounded-lg bg-background/50 border border-border/30">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold capitalize">{tool.type}</span>
                      <span className="text-sm text-muted-foreground">
                        Power: {tool.power} | Cost: {tool.cost}
                      </span>
                    </div>
                    {tool.cooldown > 0 && (
                      <div className="mb-2">
                        <Progress value={(1 - tool.cooldown / tool.maxCooldown) * 100} className="h-1" />
                        <span className="text-xs text-muted-foreground">
                          Cooldown: {(tool.cooldown / 10).toFixed(1)}s
                        </span>
                      </div>
                    )}
                    <Button
                      size="sm"
                      disabled={tool.cooldown > 0 || score < tool.cost || selectedSystem === null}
                      onClick={() => selectedSystem !== null && executeHack(selectedSystem, tool.id)}
                      className="w-full"
                    >
                      Execute
                    </Button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Systems */}
          <div className="lg:col-span-3">
            <motion.div
              className="bg-card/30 backdrop-blur-sm rounded-xl p-4 border border-border/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-lg font-bold text-neon-green mb-4">Available Targets</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {systems.map(system => (
                  <motion.div
                    key={system.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      system.hacked 
                        ? 'bg-green-900/20 border-green-500/50' 
                        : selectedSystem === system.id
                        ? 'bg-blue-900/20 border-blue-500'
                        : 'bg-background/50 border-border/30 hover:border-primary/50'
                    }`}
                    onClick={() => !system.hacked && setSelectedSystem(system.id)}
                    whileHover={{ scale: system.hacked ? 1 : 1.02 }}
                    style={{ borderColor: selectedSystem === system.id ? system.color : undefined }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-sm">{system.name}</h4>
                      <span className="text-xs px-2 py-1 rounded bg-secondary/30">
                        {system.type}
                      </span>
                    </div>
                    
                    {!system.hacked && (
                      <div className="mb-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs">Security</span>
                          <span className="text-xs">{system.security}/{system.maxSecurity}</span>
                        </div>
                        <Progress 
                          value={(system.security / system.maxSecurity) * 100} 
                          className="h-2"
                        />
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: system.color }}>
                        Value: {system.value}
                      </span>
                      {system.hacked && (
                        <span className="text-xs text-green-400 font-bold">HACKED</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Game Over Overlay */}
        <AnimatePresence>
          {gameState === 'busted' && (
            <motion.div
              className="fixed inset-0 bg-red-900/50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="bg-card border border-red-500 rounded-xl p-8 text-center">
                <h2 className="text-3xl font-bold text-red-500 mb-4">BUSTED!</h2>
                <p className="text-muted-foreground mb-6">The authorities have traced your location!</p>
                <div className="text-2xl font-bold text-white mb-6">
                  Final Score: {score.toLocaleString()}
                </div>
                <Button onClick={handleReset} className="bg-red-500 text-white">
                  Start New Session
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameLayout>
  );
};

export default DataBreachHacker;
