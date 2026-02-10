import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import { Button } from '@/components/ui/button';

interface CodeAttempt {
  guess: string[];
  feedback: ('correct' | 'partial' | 'wrong')[];
}

const CodeBreaker: React.FC = () => {
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'won' | 'lost'>('playing');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [secretCode, setSecretCode] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [attempts, setAttempts] = useState<CodeAttempt[]>([]);
  const [maxAttempts] = useState(8);
  const [codeLength] = useState(4);
  const [availableSymbols] = useState(['A', 'B', 'C', 'D', 'E', 'F']);
  const [timeLeft, setTimeLeft] = useState(120);

  // Generate secret code
  const generateCode = useCallback(() => {
    const newCode: string[] = [];
    for (let i = 0; i < codeLength; i++) {
      newCode.push(availableSymbols[Math.floor(Math.random() * availableSymbols.length)]);
    }
    setSecretCode(newCode);
    setCurrentGuess(new Array(codeLength).fill(''));
    setAttempts([]);
  }, [codeLength, availableSymbols]);

  // Check guess against secret code
  const checkGuess = useCallback((guess: string[]): ('correct' | 'partial' | 'wrong')[] => {
    const feedback: ('correct' | 'partial' | 'wrong')[] = [];
    const codeCopy = [...secretCode];
    const guessCopy = [...guess];

    // First pass: check for correct positions
    for (let i = 0; i < codeLength; i++) {
      if (guessCopy[i] === codeCopy[i]) {
        feedback[i] = 'correct';
        codeCopy[i] = '';
        guessCopy[i] = '';
      }
    }

    // Second pass: check for correct symbols in wrong positions
    for (let i = 0; i < codeLength; i++) {
      if (guessCopy[i] !== '' && feedback[i] === undefined) {
        const foundIndex = codeCopy.indexOf(guessCopy[i]);
        if (foundIndex !== -1) {
          feedback[i] = 'partial';
          codeCopy[foundIndex] = '';
        } else {
          feedback[i] = 'wrong';
        }
      }
    }

    return feedback;
  }, [secretCode, codeLength]);

  // Submit guess
  const submitGuess = useCallback(() => {
    if (currentGuess.some(symbol => symbol === '')) return;

    const feedback = checkGuess(currentGuess);
    const newAttempt: CodeAttempt = {
      guess: [...currentGuess],
      feedback
    };

    setAttempts(prev => [...prev, newAttempt]);

    // Check if won
    if (feedback.every(f => f === 'correct')) {
      setScore(prev => prev + (maxAttempts - attempts.length) * 100 + timeLeft * 5);
      setGameState('won');
      setTimeout(() => {
        setLevel(prev => prev + 1);
        setTimeLeft(120);
        generateCode();
        setGameState('playing');
      }, 2000);
    } else if (attempts.length + 1 >= maxAttempts) {
      setGameState('lost');
    } else {
      setCurrentGuess(new Array(codeLength).fill(''));
    }
  }, [currentGuess, checkGuess, attempts.length, maxAttempts, timeLeft, generateCode]);

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('lost');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // Initialize game
  useEffect(() => {
    generateCode();
  }, [generateCode]);

  const handleSymbolClick = (symbol: string, position: number) => {
    setCurrentGuess(prev => {
      const newGuess = [...prev];
      newGuess[position] = symbol;
      return newGuess;
    });
  };

  const clearPosition = (position: number) => {
    setCurrentGuess(prev => {
      const newGuess = [...prev];
      newGuess[position] = '';
      return newGuess;
    });
  };

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore(0);
    setLevel(1);
    setTimeLeft(120);
    generateCode();
    setGameState('playing');
  };

  const SymbolButton: React.FC<{ symbol: string; color: string }> = ({ symbol, color }) => (
    <Button
      variant="outline"
      className="w-12 h-12 text-lg font-bold border-2"
      style={{ borderColor: color, color }}
      onClick={() => {
        const emptyPosition = currentGuess.findIndex(s => s === '');
        if (emptyPosition !== -1) {
          handleSymbolClick(symbol, emptyPosition);
        }
      }}
    >
      {symbol}
    </Button>
  );

  const CodeSlot: React.FC<{ symbol: string; position: number; feedback?: 'correct' | 'partial' | 'wrong' }> = 
    ({ symbol, position, feedback }) => (
    <motion.button
      className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center text-xl font-bold ${
        feedback === 'correct' ? 'bg-green-500/20 border-green-500' :
        feedback === 'partial' ? 'bg-yellow-500/20 border-yellow-500' :
        feedback === 'wrong' ? 'bg-red-500/20 border-red-500' :
        symbol ? 'bg-blue-500/20 border-blue-500' : 'bg-gray-700 border-gray-500'
      }`}
      onClick={() => symbol && clearPosition(position)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {symbol}
    </motion.button>
  );

  return (
    <GameLayout
      gameTitle="Code Breaker"
      gameCategory="Puzzle"
      score={score}
      isPlaying={gameState === 'playing'}
      onPause={handlePause}
      onReset={handleReset}
    >
      <div className="min-h-[calc(100vh-64px)] p-4 bg-gradient-to-br from-background/50 to-background">
        <div className="max-w-4xl mx-auto">
          
          {/* Game Status */}
          <motion.div
            className="bg-card/30 backdrop-blur-sm rounded-xl p-4 border border-border/50 mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-neon-green">{score}</div>
                <div className="text-sm text-muted-foreground">Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-neon-purple">{level}</div>
                <div className="text-sm text-muted-foreground">Level</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-neon-pink">{maxAttempts - attempts.length}</div>
                <div className="text-sm text-muted-foreground">Attempts Left</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${timeLeft < 30 ? 'text-red-500' : 'text-yellow-500'}`}>
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-muted-foreground">Time Left</div>
              </div>
            </div>
          </motion.div>

          {/* Game Board */}
          <motion.div
            className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-border/50 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-xl font-bold text-center mb-6 text-neon-green">
              Break the Alien Communication Code
            </h3>

            {/* Previous Attempts */}
            <div className="space-y-3 mb-6">
              <AnimatePresence>
                {attempts.map((attempt, attemptIndex) => (
                  <motion.div
                    key={attemptIndex}
                    className="flex justify-center gap-2"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: attemptIndex * 0.1 }}
                  >
                    {attempt.guess.map((symbol, i) => (
                      <CodeSlot
                        key={i}
                        symbol={symbol}
                        position={i}
                        feedback={attempt.feedback[i]}
                      />
                    ))}
                    <div className="flex items-center ml-4">
                      <div className="text-sm text-muted-foreground">
                        {attempt.feedback.filter(f => f === 'correct').length} ✓{' '}
                        {attempt.feedback.filter(f => f === 'partial').length} ~{' '}
                        {attempt.feedback.filter(f => f === 'wrong').length} ✗
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Current Guess */}
            {gameState === 'playing' && (
              <motion.div
                className="flex justify-center gap-2 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {currentGuess.map((symbol, i) => (
                  <CodeSlot
                    key={i}
                    symbol={symbol}
                    position={i}
                  />
                ))}
              </motion.div>
            )}

            {/* Submit Button */}
            {gameState === 'playing' && (
              <div className="flex justify-center mb-6">
                <Button
                  onClick={submitGuess}
                  disabled={currentGuess.some(s => s === '')}
                  className="bg-neon-green/20 text-neon-green hover:bg-neon-green/30"
                  size="lg"
                >
                  Submit Code
                </Button>
              </div>
            )}

            {/* Symbol Selection */}
            {gameState === 'playing' && (
              <div className="flex justify-center gap-3">
                {availableSymbols.map((symbol, index) => (
                  <SymbolButton
                    key={symbol}
                    symbol={symbol}
                    color={['#0aff9d', '#7000ff', '#ff0099', '#00ffff', '#ffa500', '#ff6b6b'][index]}
                  />
                ))}
              </div>
            )}

            {/* Instructions */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>✓ = Correct symbol in correct position</p>
              <p>~ = Correct symbol in wrong position</p>
              <p>✗ = Symbol not in code</p>
            </div>
          </motion.div>

          {/* Legend */}
          <motion.div
            className="bg-card/30 backdrop-blur-sm rounded-xl p-4 border border-border/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="text-lg font-bold text-neon-purple mb-3">Code Breaking Guide</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-semibold mb-2">How to Play:</h5>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Select symbols to fill code slots</li>
                  <li>• Submit your guess to get feedback</li>
                  <li>• Use feedback to deduce the secret code</li>
                  <li>• Break the code within time and attempts</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold mb-2">Scoring:</h5>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Fewer attempts = higher score</li>
                  <li>• Time bonus for quick solutions</li>
                  <li>• Level progression increases difficulty</li>
                  <li>• Perfect games award bonus points</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Game End Overlays */}
        <AnimatePresence>
          {gameState === 'won' && (
            <motion.div
              className="fixed inset-0 bg-green-900/50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="bg-card border border-green-500 rounded-xl p-8 text-center">
                <h2 className="text-3xl font-bold text-green-500 mb-4">CODE BROKEN!</h2>
                <p className="text-muted-foreground mb-4">You cracked the alien communication!</p>
                <div className="text-lg">
                  Code was: {secretCode.join(' - ')}
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'lost' && (
            <motion.div
              className="fixed inset-0 bg-red-900/50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="bg-card border border-red-500 rounded-xl p-8 text-center">
                <h2 className="text-3xl font-bold text-red-500 mb-4">MISSION FAILED</h2>
                <p className="text-muted-foreground mb-4">The code remains unbroken...</p>
                <div className="text-lg mb-4">
                  The code was: {secretCode.join(' - ')}
                </div>
                <Button onClick={handleReset} className="bg-red-500 text-white">
                  Try Again
                </Button>
              </div>
            </motion.div>
          )}

          {gameState === 'paused' && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-6xl font-bold text-white">PAUSED</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameLayout>
  );
};

export default CodeBreaker;
