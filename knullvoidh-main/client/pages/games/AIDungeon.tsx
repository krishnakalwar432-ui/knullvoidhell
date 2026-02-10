import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface Story {
  id: number;
  text: string;
  type: 'story' | 'action' | 'choice';
  choices?: string[];
}

interface Character {
  name: string;
  health: number;
  mana: number;
  level: number;
  inventory: string[];
}

const AIDungeon: React.FC = () => {
  const [gameState, setGameState] = useState<'playing' | 'paused'>('playing');
  const [score, setScore] = useState(0);
  const [character, setCharacter] = useState<Character>({
    name: 'Cyber Explorer',
    health: 100,
    mana: 50,
    level: 1,
    inventory: ['Neural Interface', 'Data Scanner']
  });
  const [story, setStory] = useState<Story[]>([
    {
      id: 1,
      text: "You awaken in a dimly lit cyber laboratory. Holographic displays flicker around you, showing streams of data cascading like digital rain. Your neural interface hums to life, connecting you to the vast network known as the Quantum Web. A voice echoes in your mind: 'Welcome, Explorer. Your mission is to navigate the digital realms and uncover the truth behind the Void Protocol.'",
      type: 'story'
    },
    {
      id: 2,
      text: "Before you stretches three pathways, each glowing with different colored light:",
      type: 'choice',
      choices: [
        'Take the green path - leads to the Data Gardens',
        'Take the purple path - leads to the Code Crypts', 
        'Take the red path - leads to the Firewall Fortress'
      ]
    }
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Predefined story paths and responses
  const storyPaths = {
    'data gardens': [
      "You enter the Data Gardens, where digital trees made of flowing code stretch toward a pixelated sky. Each leaf contains fragments of information, and as you walk, you hear whispers of forgotten algorithms.",
      "A friendly AI sprite appears before you, its form shifting between different geometric shapes. 'Greetings, traveler! I am Echo-7. These gardens hold the memory banks of the old internet. What knowledge do you seek?'"
    ],
    'code crypts': [
      "The Code Crypts are ancient, filled with the ghosts of deleted programs. Obsolete software entities wander the corridors, speaking in languages no longer understood by modern systems.",
      "You discover a terminal displaying an encrypted message. Your neural interface detects it's written in a cipher from the first digital age. Solving it might reveal important secrets..."
    ],
    'firewall fortress': [
      "The Firewall Fortress towers before you, its walls crackling with defensive algorithms. Security protocols scan your presence, deciding whether you're friend or foe.",
      "A guardian program materializes - a towering figure of pure energy. 'Halt! This is restricted space. State your purpose or be deleted!' Your response will determine if you fight or find peace."
    ]
  };

  const responses = {
    'look around': "You scan your surroundings with enhanced perception. Digital particles drift through the air like snow, and you notice hidden pathways that weren't visible before.",
    'check inventory': `You access your digital inventory: ${character.inventory.join(', ')}. Each item pulses with its own energy signature.`,
    'use scanner': "Your Data Scanner activates, revealing hidden information streams around you. You detect encrypted data packets floating nearby.",
    'rest': "You interface with a nearby data node to restore your energy. Your mana increases, and your neural pathways feel refreshed.",
    'help': "Available commands: look around, check inventory, use scanner, rest, attack, cast spell, or describe any action you'd like to take."
  };

  const addStoryEntry = useCallback((text: string, type: Story['type'] = 'story', choices?: string[]) => {
    setIsTyping(true);
    setTimeout(() => {
      setStory(prev => [...prev, {
        id: Date.now(),
        text,
        type,
        choices
      }]);
      setIsTyping(false);
    }, 1000);
  }, []);

  const handleChoice = useCallback((choice: string) => {
    // Add player's choice
    addStoryEntry(`> ${choice}`, 'action');
    
    // Generate response based on choice
    setTimeout(() => {
      const lowerChoice = choice.toLowerCase();
      
      if (lowerChoice.includes('data gardens') || lowerChoice.includes('green')) {
        const gardenStories = storyPaths['data gardens'];
        addStoryEntry(gardenStories[Math.floor(Math.random() * gardenStories.length)]);
        setScore(prev => prev + 50);
      } else if (lowerChoice.includes('code crypts') || lowerChoice.includes('purple')) {
        const cryptStories = storyPaths['code crypts'];
        addStoryEntry(cryptStories[Math.floor(Math.random() * cryptStories.length)]);
        setScore(prev => prev + 75);
      } else if (lowerChoice.includes('firewall') || lowerChoice.includes('red')) {
        const fortressStories = storyPaths['firewall fortress'];
        addStoryEntry(fortressStories[Math.floor(Math.random() * fortressStories.length)]);
        setScore(prev => prev + 100);
      }
      
      // Add new choices
      setTimeout(() => {
        addStoryEntry("What do you do next?", 'choice', [
          'Investigate further',
          'Try to communicate',
          'Use your neural interface',
          'Prepare for potential danger'
        ]);
      }, 1500);
    }, 1500);
  }, [addStoryEntry]);

  const handleInput = useCallback(() => {
    if (!currentInput.trim()) return;
    
    const input = currentInput.trim();
    addStoryEntry(`> ${input}`, 'action');
    setCurrentInput('');
    
    // Generate AI response
    setTimeout(() => {
      const lowerInput = input.toLowerCase();
      let response = "The digital realm responds to your action in unexpected ways. Reality shifts around you as the quantum algorithms process your request.";
      
      // Check for specific commands
      for (const [command, commandResponse] of Object.entries(responses)) {
        if (lowerInput.includes(command)) {
          response = commandResponse;
          break;
        }
      }
      
      // Special actions
      if (lowerInput.includes('attack') || lowerInput.includes('fight')) {
        response = "You engage in digital combat! Energy crackles as your programs clash with enemy algorithms. Roll for initiative!";
        setCharacter(prev => ({ ...prev, health: Math.max(prev.health - 10, 0) }));
        setScore(prev => prev + 25);
      } else if (lowerInput.includes('spell') || lowerInput.includes('magic')) {
        if (character.mana >= 10) {
          response = "You cast a cyber-spell! Reality bends to your will as code reshapes around you.";
          setCharacter(prev => ({ ...prev, mana: prev.mana - 10 }));
          setScore(prev => prev + 30);
        } else {
          response = "Your mana is too low to cast spells. You need to rest at a data node.";
        }
      } else if (lowerInput.includes('explore') || lowerInput.includes('move')) {
        response = "You venture deeper into the digital realm, discovering new sectors of cyberspace.";
        setScore(prev => prev + 15);
      }
      
      addStoryEntry(response);
      
      // Sometimes add random events
      if (Math.random() < 0.3) {
        setTimeout(() => {
          const events = [
            "Suddenly, a data storm sweeps through the area!",
            "You discover a hidden cache of digital artifacts!",
            "A rogue AI program appears, curious about your presence.",
            "The quantum field fluctuates, opening a portal to another sector."
          ];
          addStoryEntry(events[Math.floor(Math.random() * events.length)]);
        }, 2000);
      }
    }, 1200);
  }, [currentInput, addStoryEntry, character.mana]);

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore(0);
    setCharacter({
      name: 'Cyber Explorer',
      health: 100,
      mana: 50,
      level: 1,
      inventory: ['Neural Interface', 'Data Scanner']
    });
    setStory([
      {
        id: 1,
        text: "You awaken in a dimly lit cyber laboratory...",
        type: 'story'
      }
    ]);
    setGameState('playing');
  };

  return (
    <GameLayout
      gameTitle="AI Dungeon"
      gameCategory="RPG"
      score={score}
      isPlaying={gameState === 'playing'}
      onPause={handlePause}
      onReset={handleReset}
    >
      <div className="min-h-[calc(100vh-64px)] p-4 bg-gradient-to-br from-background/50 to-background">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Character Panel */}
          <div className="lg:col-span-1">
            <Card className="p-4 bg-card/30 backdrop-blur-sm border-border/50">
              <h3 className="text-lg font-bold text-neon-green mb-4">{character.name}</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Health</span>
                    <span className="text-red-400">{character.health}/100</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-red-400 h-2 rounded-full transition-all"
                      style={{ width: `${character.health}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Mana</span>
                    <span className="text-blue-400">{character.mana}/50</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-400 h-2 rounded-full transition-all"
                      style={{ width: `${(character.mana / 50) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <span className="text-sm">Level: </span>
                  <span className="text-neon-purple font-bold">{character.level}</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Inventory:</h4>
                  <div className="space-y-1">
                    {character.inventory.map((item, index) => (
                      <div key={index} className="text-xs bg-background/50 rounded px-2 py-1">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Story Panel */}
          <div className="lg:col-span-3">
            <Card className="p-6 bg-card/30 backdrop-blur-sm border-border/50 h-[600px] flex flex-col">
              <h3 className="text-xl font-bold text-neon-purple mb-4">Digital Chronicles</h3>
              
              {/* Story Display */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                <AnimatePresence>
                  {story.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`${
                        entry.type === 'action' 
                          ? 'text-neon-green italic' 
                          : entry.type === 'choice'
                          ? 'text-neon-purple'
                          : 'text-foreground'
                      }`}
                    >
                      <p className="leading-relaxed">{entry.text}</p>
                      
                      {entry.choices && (
                        <div className="mt-3 space-y-2">
                          {entry.choices.map((choice, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="block w-full text-left border-neon-purple/50 hover:bg-neon-purple/10"
                              onClick={() => handleChoice(choice)}
                            >
                              {choice}
                            </Button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                  
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-muted-foreground italic"
                    >
                      The AI is thinking...
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Input Area */}
              <div className="flex gap-2">
                <Input
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder="What do you do? (e.g., 'look around', 'use scanner', 'attack')"
                  onKeyPress={(e) => e.key === 'Enter' && handleInput()}
                  className="flex-1 bg-background/50 border-border/50"
                  disabled={isTyping}
                />
                <Button 
                  onClick={handleInput}
                  disabled={isTyping || !currentInput.trim()}
                  className="bg-neon-green/20 text-neon-green hover:bg-neon-green/30"
                >
                  Act
                </Button>
              </div>
              
              <div className="mt-2 text-xs text-muted-foreground">
                Try commands like: look around, check inventory, use scanner, rest, attack, cast spell
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

export default AIDungeon;
