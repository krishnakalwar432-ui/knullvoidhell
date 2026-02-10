interface GameTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  color: string;
  difficulty: string;
}

const gameTemplates: GameTemplate[] = [
  // Racing Games
  { id: 'turbo-drift', name: 'TurboDrift', category: 'Racing', description: 'High-speed drifting with turbo boosts', color: '#ff6b35', difficulty: 'Medium' },
  { id: 'cyber-motocross', name: 'CyberMotocross', category: 'Racing', description: 'Futuristic motocross racing', color: '#00d4ff', difficulty: 'Hard' },
  { id: 'quantum-kart', name: 'QuantumKart', category: 'Racing', description: 'Quantum-powered kart racing', color: '#7c3aed', difficulty: 'Medium' },

  // Platform Games
  { id: 'cyber-jumper', name: 'CyberJumper', category: 'Platform', description: 'Cyberpunk platformer adventure', color: '#00ffff', difficulty: 'Medium' },
  { id: 'robot-escape', name: 'RobotEscape', category: 'Platform', description: 'Help robot escape the factory', color: '#ff3366', difficulty: 'Hard' },
  { id: 'space-hopper', name: 'SpaceHopper', category: 'Platform', description: 'Hop between space platforms', color: '#66ff66', difficulty: 'Easy' },

  // Shooter Games
  { id: 'plasma-defender', name: 'PlasmaDefender', category: 'Shooter', description: 'Defend with plasma weapons', color: '#ff00ff', difficulty: 'Hard' },
  { id: 'space-marines', name: 'SpaceMarines', category: 'Shooter', description: 'Elite space marine combat', color: '#ff6600', difficulty: 'Hard' },
  { id: 'laser-storm', name: 'LaserStorm', category: 'Shooter', description: 'Intense laser weapon combat', color: '#ff0066', difficulty: 'Medium' },
  { id: 'cyber-sniper', name: 'CyberSniper', category: 'Shooter', description: 'Precision cybernetic sniping', color: '#0099ff', difficulty: 'Hard' },

  // Arcade Games
  { id: 'neon-pacman', name: 'NeonPacman', category: 'Arcade', description: 'Classic Pacman with neon style', color: '#ffff00', difficulty: 'Easy' },
  { id: 'cyber-breakout', name: 'CyberBreakout', category: 'Arcade', description: 'Futuristic brick breaking game', color: '#ff3399', difficulty: 'Medium' },

  // RPG Games
  { id: 'neon-warriors', name: 'NeonWarriors', category: 'RPG', description: 'Cyberpunk warrior adventure', color: '#ff0099', difficulty: 'Hard' },
  { id: 'quantum-mage', name: 'QuantumMage', category: 'RPG', description: 'Master quantum magic spells', color: '#9900ff', difficulty: 'Hard' },
  { id: 'robot-legends', name: 'RobotLegends', category: 'RPG', description: 'Epic robot hero journey', color: '#0066ff', difficulty: 'Medium' },
  { id: 'space-explorer', name: 'SpaceExplorer', category: 'RPG', description: 'Explore the galaxy', color: '#6600ff', difficulty: 'Medium' },

  // Simulation Games
  { id: 'cyber-city', name: 'CyberCity', category: 'Simulation', description: 'Build your cyberpunk city', color: '#00ccff', difficulty: 'Medium' },
  { id: 'space-station', name: 'SpaceStation', category: 'Simulation', description: 'Manage a space station', color: '#cccccc', difficulty: 'Hard' },
  { id: 'robot-factory', name: 'RobotFactory', category: 'Simulation', description: 'Build and manage robots', color: '#ff9900', difficulty: 'Medium' },
  { id: 'neon-farm', name: 'NeonFarm', category: 'Simulation', description: 'Futuristic farming simulator', color: '#66ff00', difficulty: 'Easy' },
  { id: 'quantum-lab', name: 'QuantumLab', category: 'Simulation', description: 'Run quantum experiments', color: '#ff6699', difficulty: 'Hard' },

  // Sports Games
  { id: 'cyber-soccer', name: 'CyberSoccer', category: 'Sports', description: 'Futuristic soccer with robots', color: '#00ff33', difficulty: 'Medium' },
  { id: 'neon-basketball', name: 'NeonBasketball', category: 'Sports', description: 'Glowing basketball action', color: '#ff9933', difficulty: 'Medium' },
  { id: 'quantum-tennis', name: 'QuantumTennis', category: 'Sports', description: 'Tennis with quantum effects', color: '#3399ff', difficulty: 'Hard' },
  { id: 'space-hockey', name: 'SpaceHockey', category: 'Sports', description: 'Zero-gravity hockey game', color: '#99ff33', difficulty: 'Medium' },
  { id: 'cyber-golf', name: 'CyberGolf', category: 'Sports', description: 'Golf in cyberspace', color: '#33ff99', difficulty: 'Easy' },

  // Music Games
  { id: 'neon-rhythm', name: 'NeonRhythm', category: 'Music', description: 'Hit the neon beats', color: '#ff3366', difficulty: 'Medium' },
  { id: 'cyber-dj', name: 'CyberDJ', category: 'Music', description: 'Mix tracks like a cyber DJ', color: '#6633ff', difficulty: 'Hard' },
  { id: 'quantum-beats', name: 'QuantumBeats', category: 'Music', description: 'Create quantum music', color: '#ff6633', difficulty: 'Medium' },
  { id: 'space-symphony', name: 'SpaceSymphony', category: 'Music', description: 'Conduct space orchestra', color: '#3366ff', difficulty: 'Hard' },
  { id: 'digital-piano', name: 'DigitalPiano', category: 'Music', description: 'Play digital piano', color: '#ffffff', difficulty: 'Easy' },

  // Creative Games
  { id: 'neon-painter', name: 'NeonPainter', category: 'Creative', description: 'Paint with neon colors', color: '#ff0033', difficulty: 'Easy' },
  { id: 'cyber-sculptor', name: 'CyberSculptor', category: 'Creative', description: 'Sculpt in cyberspace', color: '#0033ff', difficulty: 'Medium' },
  { id: 'quantum-builder', name: 'QuantumBuilder', category: 'Creative', description: 'Build with quantum blocks', color: '#33ff00', difficulty: 'Medium' },
  { id: 'pixel-designer', name: 'PixelDesigner', category: 'Creative', description: 'Design pixel art', color: '#ff3300', difficulty: 'Easy' },
  { id: 'hologram-maker', name: 'HologramMaker', category: 'Creative', description: 'Create 3D holograms', color: '#0099cc', difficulty: 'Hard' },

  // Idle Games
  { id: 'cyber-empire', name: 'CyberEmpire', category: 'Idle', description: 'Build your cyber empire', color: '#cc0099', difficulty: 'Easy' },
  { id: 'quantum-miner', name: 'QuantumMiner', category: 'Idle', description: 'Mine quantum resources', color: '#9900cc', difficulty: 'Medium' },
  { id: 'space-tycoon', name: 'SpaceTycoon', category: 'Idle', description: 'Build space business empire', color: '#cc9900', difficulty: 'Medium' },
  { id: 'robot-clicker', name: 'RobotClicker', category: 'Idle', description: 'Click to build robots', color: '#00cc99', difficulty: 'Easy' },
  { id: 'neon-clicker', name: 'NeonClicker', category: 'Idle', description: 'Click for neon power', color: '#99cc00', difficulty: 'Easy' }
];

const generateGameComponent = (template: GameTemplate): string => {
  const colorClass = template.color === '#ffffff' ? 'gray' : template.color.replace('#', '');
  
  return `import React, { useState, useRef, useEffect, useCallback } from 'react';
import GameLayout from '../../components/GameLayout';

const ${template.name}: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameOver(false);
    setIsPlaying(true);
    setScore(0);
  }, []);

  const pauseGame = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const resetGame = useCallback(() => {
    setGameStarted(false);
    setGameOver(false);
    setIsPlaying(false);
    setScore(0);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, 800, 600);

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 800, 600);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    if (!gameStarted) {
      // Draw start screen
      ctx.fillStyle = '${template.color}';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('${template.name}', 400, 250);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.fillText('${template.description}', 400, 300);
      ctx.fillText('Press SPACE to start', 400, 350);
    } else if (gameOver) {
      // Draw game over screen
      ctx.fillStyle = '#ff0000';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', 400, 250);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.fillText(\`Final Score: \${score}\`, 400, 300);
      ctx.fillText('Press R to restart', 400, 350);
    } else {
      // Draw game content
      ctx.fillStyle = '${template.color}';
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Playing ${template.name}', 400, 300);
      
      // Placeholder game object
      ctx.fillStyle = '${template.color}';
      ctx.beginPath();
      ctx.arc(400, 300, 50, 0, Math.PI * 2);
      ctx.fill();
      
      // Score display
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(\`Score: \${score}\`, 20, 30);
    }

    ctx.textAlign = 'left';
  }, [gameStarted, gameOver, score]);

  const gameLoop = useCallback(() => {
    if (!isPlaying || gameOver) return;

    // Game logic updates would go here
    setScore(prev => prev + 1);

    draw();
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, gameOver, draw]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          if (!gameStarted) {
            startGame();
          }
          break;
        case 'r':
          e.preventDefault();
          if (gameOver) {
            resetGame();
          }
          break;
        case 'p':
          e.preventDefault();
          if (gameStarted && !gameOver) {
            pauseGame();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver, startGame, resetGame, pauseGame]);

  useEffect(() => {
    if (isPlaying && !gameOver) {
      gameLoop();
    } else {
      draw();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, gameOver, gameLoop, draw]);

  return (
    <GameLayout
      gameTitle="${template.name}"
      gameCategory="${template.category}"
      score={score}
      isPlaying={isPlaying}
      onPause={pauseGame}
      onReset={resetGame}
    >
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="border-2 border-${colorClass}-400 rounded-lg shadow-2xl bg-slate-800"
            tabIndex={0}
          />
          
          <div className="mt-4 text-center">
            <div className="text-${colorClass}-400 text-lg font-bold mb-2">
              Difficulty: ${template.difficulty}
            </div>
            <div className="flex justify-center space-x-4 text-sm text-gray-300">
              <span>Space: Start</span>
              <span>P: Pause</span>
              <span>R: Restart</span>
            </div>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default ${template.name};
`;
};

export { gameTemplates, generateGameComponent };
