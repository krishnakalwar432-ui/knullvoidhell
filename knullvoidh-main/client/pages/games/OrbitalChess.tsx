import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameLayout from '@/components/GameLayout';

interface ChessPiece {
  type: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
  color: 'white' | 'black';
  symbol: string;
  value: number;
}

interface Position {
  x: number;
  y: number;
}

interface Square {
  piece: ChessPiece | null;
  position: Position;
  highlighted: boolean;
  orbit: number;
}

// Initialize pieces outside component to prevent re-creation
const pieces: { [key: string]: ChessPiece } = {
  'king': { type: 'king', color: 'white', symbol: '♔', value: 0 },
  'queen': { type: 'queen', color: 'white', symbol: '♕', value: 9 },
  'rook': { type: 'rook', color: 'white', symbol: '♖', value: 5 },
  'bishop': { type: 'bishop', color: 'white', symbol: '♗', value: 3 },
  'knight': { type: 'knight', color: 'white', symbol: '♘', value: 3 },
  'pawn': { type: 'pawn', color: 'white', symbol: '♙', value: 1 },
  'bking': { type: 'king', color: 'black', symbol: '♚', value: 0 },
  'bqueen': { type: 'queen', color: 'black', symbol: '♛', value: 9 },
  'brook': { type: 'rook', color: 'black', symbol: '♜', value: 5 },
  'bbishop': { type: 'bishop', color: 'black', symbol: '♝', value: 3 },
  'bknight': { type: 'knight', color: 'black', symbol: '♞', value: 3 },
  'bpawn': { type: 'pawn', color: 'black', symbol: '♟', value: 1 }
};

const OrbitalChess: React.FC = () => {
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'checkmate'>('playing');
  const [score, setScore] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [board, setBoard] = useState<Square[][]>([]);
  const [capturedPieces, setCapturedPieces] = useState<{ white: ChessPiece[], black: ChessPiece[] }>({ white: [], black: [] });
  const [moveCount, setMoveCount] = useState(0);

  // Initialize board
  const initializeBoard = useCallback(() => {
    const newBoard: Square[][] = [];
    
    for (let y = 0; y < 8; y++) {
      newBoard[y] = [];
      for (let x = 0; x < 8; x++) {
        const orbit = Math.max(Math.abs(x - 3.5), Math.abs(y - 3.5));
        let piece: ChessPiece | null = null;

        // Set up initial positions
        if (y === 0) {
          const pieceOrder = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
          piece = { ...pieces[pieceOrder[x]] };
        } else if (y === 1) {
          piece = { ...pieces.pawn };
        } else if (y === 6) {
          piece = { ...pieces.bpawn };
        } else if (y === 7) {
          const pieceOrder = ['brook', 'bknight', 'bbishop', 'bqueen', 'bking', 'bbishop', 'bknight', 'brook'];
          piece = { ...pieces[pieceOrder[x]] };
        }

        newBoard[y][x] = {
          piece,
          position: { x, y },
          highlighted: false,
          orbit: Math.floor(orbit)
        };
      }
    }
    
    setBoard(newBoard);
  }, []);

  // Check if move is valid (simplified orbital chess rules)
  const isValidMove = useCallback((from: Position, to: Position, piece: ChessPiece): boolean => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Basic piece movement rules with orbital modifications
    switch (piece.type) {
      case 'pawn':
        const direction = piece.color === 'white' ? 1 : -1;
        return (dx === 0 && dy === direction) || (Math.abs(dx) === 1 && dy === direction);
      case 'rook':
        return (dx === 0 || dy === 0) && distance <= 4;
      case 'bishop':
        return Math.abs(dx) === Math.abs(dy) && distance <= 4;
      case 'queen':
        return ((dx === 0 || dy === 0) || (Math.abs(dx) === Math.abs(dy))) && distance <= 6;
      case 'king':
        return distance <= 1.5;
      case 'knight':
        return (Math.abs(dx) === 2 && Math.abs(dy) === 1) || (Math.abs(dx) === 1 && Math.abs(dy) === 2);
      default:
        return false;
    }
  }, []);

  // Handle square click
  const handleSquareClick = useCallback((position: Position) => {
    const square = board[position.y][position.x];
    
    if (selectedSquare) {
      const selectedPiece = board[selectedSquare.y][selectedSquare.x].piece;
      
      if (selectedPiece && selectedPiece.color === currentPlayer) {
        if (isValidMove(selectedSquare, position, selectedPiece)) {
          // Make move
          const newBoard = board.map(row => row.map(sq => ({ ...sq, highlighted: false })));
          
          // Capture piece if present
          if (square.piece && square.piece.color !== selectedPiece.color) {
            setCapturedPieces(prev => ({
              ...prev,
              [square.piece!.color]: [...prev[square.piece!.color], square.piece!]
            }));
            setScore(prev => prev + square.piece!.value * 10);
          }
          
          // Move piece
          newBoard[position.y][position.x].piece = selectedPiece;
          newBoard[selectedSquare.y][selectedSquare.x].piece = null;
          
          setBoard(newBoard);
          setCurrentPlayer(prev => prev === 'white' ? 'black' : 'white');
          setMoveCount(prev => prev + 1);
        }
      }
      
      setSelectedSquare(null);
    } else if (square.piece && square.piece.color === currentPlayer) {
      setSelectedSquare(position);
      
      // Highlight possible moves
      const newBoard = board.map(row => 
        row.map(sq => ({
          ...sq,
          highlighted: sq.position.x === position.x && sq.position.y === position.y
        }))
      );
      setBoard(newBoard);
    }
  }, [board, selectedSquare, currentPlayer, isValidMove]);

  React.useEffect(() => {
    initializeBoard();
  }, [initializeBoard]);

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore(0);
    setCurrentPlayer('white');
    setSelectedSquare(null);
    setCapturedPieces({ white: [], black: [] });
    setMoveCount(0);
    initializeBoard();
    setGameState('playing');
  };

  return (
    <GameLayout
      gameTitle="Orbital Chess"
      gameCategory="Strategy"
      score={score}
      isPlaying={gameState === 'playing'}
      onPause={handlePause}
      onReset={handleReset}
    >
      <div className="min-h-[calc(100vh-64px)] p-4 bg-gradient-to-br from-background/50 to-background">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Game Info */}
          <div className="lg:col-span-4 mb-4">
            <motion.div
              className="bg-card/30 backdrop-blur-sm rounded-xl p-4 border border-border/50"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-neon-green">{score}</div>
                  <div className="text-sm text-muted-foreground">Score</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${currentPlayer === 'white' ? 'text-white' : 'text-gray-600'}`}>
                    {currentPlayer === 'white' ? '♔' : '♚'}
                  </div>
                  <div className="text-sm text-muted-foreground">Current Player</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-neon-purple">{moveCount}</div>
                  <div className="text-sm text-muted-foreground">Moves</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-neon-pink">
                    {capturedPieces.white.length + capturedPieces.black.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Captures</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Chess Board */}
          <div className="lg:col-span-3">
            <motion.div
              className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-border/50"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="grid grid-cols-8 gap-1 max-w-md mx-auto">
                {board.map((row, y) =>
                  row.map((square, x) => (
                    <motion.button
                      key={`${x}-${y}`}
                      className={`
                        aspect-square flex items-center justify-center text-2xl font-bold border-2 rounded-lg
                        ${(x + y) % 2 === 0 ? 'bg-gray-700' : 'bg-gray-800'}
                        ${square.highlighted ? 'border-neon-green' : 'border-gray-600'}
                        hover:bg-gray-600 transition-all
                      `}
                      onClick={() => handleSquareClick({ x, y })}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        boxShadow: square.orbit > 0 ? `0 0 ${square.orbit * 3}px rgba(10, 255, 157, 0.3)` : 'none'
                      }}
                    >
                      {square.piece && (
                        <span style={{ 
                          color: square.piece.color === 'white' ? '#ffffff' : '#666666',
                          filter: square.orbit > 1 ? `drop-shadow(0 0 ${square.orbit * 2}px #0aff9d)` : 'none'
                        }}>
                          {square.piece.symbol}
                        </span>
                      )}
                    </motion.button>
                  ))
                )}
              </div>
              
              <div className="mt-4 text-center text-sm text-muted-foreground">
                <p>Orbital Chess: Pieces glow stronger in outer orbits and have modified ranges</p>
              </div>
            </motion.div>
          </div>

          {/* Captured Pieces */}
          <div>
            <motion.div
              className="bg-card/30 backdrop-blur-sm rounded-xl p-4 border border-border/50"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h3 className="text-lg font-bold text-neon-purple mb-4">Captured</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">White Pieces</h4>
                  <div className="flex flex-wrap gap-1">
                    {capturedPieces.white.map((piece, index) => (
                      <span key={index} className="text-lg text-gray-400">
                        {piece.symbol}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Black Pieces</h4>
                  <div className="flex flex-wrap gap-1">
                    {capturedPieces.black.map((piece, index) => (
                      <span key={index} className="text-lg text-gray-600">
                        {piece.symbol}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Game Rules */}
              <div className="mt-6 text-xs text-muted-foreground">
                <h4 className="font-semibold mb-2">Orbital Rules:</h4>
                <ul className="space-y-1">
                  <li>• Outer orbits enhance pieces</li>
                  <li>• Limited movement ranges</li>
                  <li>• Capture to score points</li>
                  <li>• Strategic positioning matters</li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default OrbitalChess;
