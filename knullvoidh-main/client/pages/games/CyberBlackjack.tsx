import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import { Button } from '@/components/ui/button';

interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: number; // 1-13 (1=A, 11=J, 12=Q, 13=K)
  name: string;
  color: string;
}

const CyberBlackjack: React.FC = () => {
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(1000);
  const [bet, setBet] = useState(50);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [roundState, setRoundState] = useState<'betting' | 'playing' | 'dealer' | 'finished'>('betting');
  const [message, setMessage] = useState('Place your bet and start the game!');

  // Create deck
  const createDeck = useCallback((): Card[] => {
    const suits = [
      { name: 'hearts', color: '#ff0099' },
      { name: 'diamonds', color: '#00ffff' },
      { name: 'clubs', color: '#0aff9d' },
      { name: 'spades', color: '#7000ff' }
    ];
    const newDeck: Card[] = [];

    suits.forEach(suit => {
      for (let value = 1; value <= 13; value++) {
        let name = value.toString();
        if (value === 1) name = 'A';
        else if (value === 11) name = 'J';
        else if (value === 12) name = 'Q';
        else if (value === 13) name = 'K';

        newDeck.push({
          suit: suit.name as any,
          value,
          name,
          color: suit.color
        });
      }
    });

    // Shuffle deck
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }

    return newDeck;
  }, []);

  // Calculate hand value
  const calculateHandValue = useCallback((hand: Card[]): number => {
    let value = 0;
    let aces = 0;

    hand.forEach(card => {
      if (card.value === 1) {
        aces++;
        value += 11;
      } else if (card.value > 10) {
        value += 10;
      } else {
        value += card.value;
      }
    });

    // Adjust for aces
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }

    return value;
  }, []);

  // Deal card
  const dealCard = useCallback((fromDeck: Card[]): { card: Card; newDeck: Card[] } => {
    if (fromDeck.length === 0) {
      const freshDeck = createDeck();
      return { card: freshDeck[0], newDeck: freshDeck.slice(1) };
    }
    return { card: fromDeck[0], newDeck: fromDeck.slice(1) };
  }, [createDeck]);

  // Start new round
  const startRound = useCallback(() => {
    if (score < bet) {
      setMessage('Insufficient credits!');
      return;
    }

    setScore(prev => prev - bet);
    let currentDeck = deck.length < 10 ? createDeck() : deck;

    // Deal initial cards
    const { card: playerCard1, newDeck: deck1 } = dealCard(currentDeck);
    const { card: dealerCard1, newDeck: deck2 } = dealCard(deck1);
    const { card: playerCard2, newDeck: deck3 } = dealCard(deck2);
    const { card: dealerCard2, newDeck: finalDeck } = dealCard(deck3);

    setPlayerHand([playerCard1, playerCard2]);
    setDealerHand([dealerCard1, dealerCard2]);
    setDeck(finalDeck);
    setRoundState('playing');
    setMessage('Hit or Stand?');
  }, [bet, score, deck, dealCard, createDeck]);

  // Player hits
  const hit = useCallback(() => {
    if (roundState !== 'playing') return;

    const { card, newDeck } = dealCard(deck);
    const newHand = [...playerHand, card];
    setPlayerHand(newHand);
    setDeck(newDeck);

    const value = calculateHandValue(newHand);
    if (value > 21) {
      setMessage('Bust! You lose.');
      setRoundState('finished');
    } else if (value === 21) {
      setMessage('21! Standing automatically.');
      setTimeout(() => stand(), 1000);
    }
  }, [roundState, deck, playerHand, dealCard, calculateHandValue]);

  // Player stands
  const stand = useCallback(() => {
    if (roundState !== 'playing') return;
    setRoundState('dealer');
    setMessage('Dealer is playing...');

    // Dealer logic
    setTimeout(() => {
      let currentDealerHand = [...dealerHand];
      let currentDeck = [...deck];

      while (calculateHandValue(currentDealerHand) < 17) {
        const { card, newDeck } = dealCard(currentDeck);
        currentDealerHand.push(card);
        currentDeck = newDeck;
      }

      setDealerHand(currentDealerHand);
      setDeck(currentDeck);

      // Determine winner
      const playerValue = calculateHandValue(playerHand);
      const dealerValue = calculateHandValue(currentDealerHand);

      if (dealerValue > 21) {
        setMessage('Dealer busts! You win!');
        setScore(prev => prev + bet * 2);
      } else if (dealerValue > playerValue) {
        setMessage('Dealer wins.');
      } else if (playerValue > dealerValue) {
        setMessage('You win!');
        setScore(prev => prev + bet * 2);
      } else {
        setMessage('Push! Bet returned.');
        setScore(prev => prev + bet);
      }

      setRoundState('finished');
    }, 1500);
  }, [roundState, dealerHand, deck, playerHand, bet, dealCard, calculateHandValue]);

  // Reset for new round
  const newRound = useCallback(() => {
    setPlayerHand([]);
    setDealerHand([]);
    setRoundState('betting');
    setMessage('Place your bet and start the game!');
  }, []);

  React.useEffect(() => {
    setDeck(createDeck());
  }, [createDeck]);

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore(1000);
    setBet(50);
    setPlayerHand([]);
    setDealerHand([]);
    setRoundState('betting');
    setMessage('Place your bet and start the game!');
    setDeck(createDeck());
    setGameState('playing');
  };

  const CardComponent: React.FC<{ card: Card; hidden?: boolean; index: number }> = ({ card, hidden, index }) => (
    <motion.div
      className="w-16 h-24 rounded-lg border-2 border-gray-300 bg-gray-800 flex flex-col items-center justify-center text-white relative"
      style={{ borderColor: hidden ? '#666' : card.color }}
      initial={{ rotateY: 180, x: 50 }}
      animate={{ rotateY: 0, x: 0 }}
      transition={{ delay: index * 0.2 }}
    >
      {hidden ? (
        <div className="text-center">
          <div className="text-2xl">🔒</div>
        </div>
      ) : (
        <div className="text-center">
          <div className="text-lg font-bold" style={{ color: card.color }}>
            {card.name}
          </div>
          <div className="text-2xl">
            {card.suit === 'hearts' ? '♥' : 
             card.suit === 'diamonds' ? '♦' : 
             card.suit === 'clubs' ? '♣' : '♠'}
          </div>
        </div>
      )}
    </motion.div>
  );

  return (
    <GameLayout
      gameTitle="Cyber Blackjack"
      gameCategory="Card"
      score={score}
      isPlaying={gameState === 'playing'}
      onPause={handlePause}
      onReset={handleReset}
    >
      <div className="min-h-[calc(100vh-64px)] p-4 bg-gradient-to-br from-background/50 to-background">
        <div className="max-w-4xl mx-auto">
          
          {/* Game Table */}
          <motion.div
            className="bg-green-900/20 rounded-2xl p-8 border border-neon-green/30 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            
            {/* Dealer Hand */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-neon-purple mb-4">
                Dealer Hand {dealerHand.length > 0 && roundState !== 'playing' && `(${calculateHandValue(dealerHand)})`}
              </h3>
              <div className="flex gap-2 justify-center">
                <AnimatePresence>
                  {dealerHand.map((card, index) => (
                    <CardComponent 
                      key={index} 
                      card={card} 
                      hidden={index === 1 && roundState === 'playing'}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Game Message */}
            <div className="text-center mb-6">
              <motion.div
                className="text-2xl font-bold text-neon-green"
                key={message}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {message}
              </motion.div>
            </div>

            {/* Player Hand */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-neon-green mb-4">
                Your Hand {playerHand.length > 0 && `(${calculateHandValue(playerHand)})`}
              </h3>
              <div className="flex gap-2 justify-center">
                <AnimatePresence>
                  {playerHand.map((card, index) => (
                    <CardComponent key={index} card={card} index={index} />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              {roundState === 'betting' && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-white">Bet:</span>
                    <input
                      type="number"
                      value={bet}
                      onChange={(e) => setBet(Math.max(10, Math.min(score, parseInt(e.target.value) || 10)))}
                      className="w-20 p-2 rounded bg-gray-700 text-white"
                      min="10"
                      max={score}
                    />
                    <span className="text-neon-green">credits</span>
                  </div>
                  <Button
                    onClick={startRound}
                    disabled={score < bet}
                    className="bg-neon-green/20 text-neon-green hover:bg-neon-green/30"
                  >
                    Deal Cards
                  </Button>
                </div>
              )}

              {roundState === 'playing' && (
                <div className="flex gap-4">
                  <Button
                    onClick={hit}
                    className="bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30"
                  >
                    Hit
                  </Button>
                  <Button
                    onClick={stand}
                    className="bg-neon-pink/20 text-neon-pink hover:bg-neon-pink/30"
                  >
                    Stand
                  </Button>
                </div>
              )}

              {roundState === 'finished' && (
                <Button
                  onClick={newRound}
                  className="bg-neon-green/20 text-neon-green hover:bg-neon-green/30"
                >
                  New Round
                </Button>
              )}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="bg-card/30 backdrop-blur-sm rounded-xl p-4 border border-border/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-neon-green">{score}</div>
                <div className="text-sm text-muted-foreground">Credits</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-neon-purple">{bet}</div>
                <div className="text-sm text-muted-foreground">Current Bet</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-neon-pink">{deck.length}</div>
                <div className="text-sm text-muted-foreground">Cards Left</div>
              </div>
            </div>
          </motion.div>
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

export default CyberBlackjack;
