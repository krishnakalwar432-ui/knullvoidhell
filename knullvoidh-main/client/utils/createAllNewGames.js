const fs = require('fs');
const path = require('path');

const gameTemplate = (gameName, gameTitle, gameCategory, controls) => `import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

const ${gameName} = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());

  const [gameState, setGameState] = useState({
    score: 0,
    gameOver: false,
    playing: true
  });

  const initializeGame = useCallback(() => {
    setGameState({
      score: 0,
      gameOver: false,
      playing: true
    });
  }, []);

  const update = useCallback(() => {
    if (gameState.gameOver) return;
    
    setGameState(prev => ({
      ...prev,
      score: prev.score + 1
    }));
  }, [gameState.gameOver]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw game content
    ctx.fillStyle = '#0aff9d';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('${gameTitle}', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Arial';
    ctx.fillText('Game Coming Soon!', canvas.width / 2, canvas.height / 2);
    
    ctx.fillStyle = '#ff0099';
    ctx.font = '16px Arial';
    ctx.fillText(\`Score: \${gameState.score}\`, canvas.width / 2, canvas.height / 2 + 50);

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#ff0099';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2);
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.add(key);
      
      if (key === 'r' && gameState.gameOver) {
        initializeGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.gameOver, initializeGame]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    gameLoopRef.current = setInterval(() => {
      update();
      render();
    }, 1000 / 60);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [update, render]);

  return (
    <GameLayout gameTitle="${gameTitle}" gameCategory="${gameCategory}">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg shadow-2xl"
        />
        <div className="text-center text-gray-300">
          <p>${controls}</p>
          <p>Full game implementation coming soon!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default ${gameName};
`;

const newGames = [
  { name: 'NeonRacer3D', title: 'Neon Racer 3D', category: 'Racing', controls: 'WASD: Drive | Space: Boost' },
  { name: 'TurboDrift', title: 'Turbo Drift', category: 'Racing', controls: 'Arrow Keys: Steer | Space: Drift' },
  { name: 'SpaceRally', title: 'Space Rally', category: 'Racing', controls: 'WASD: Navigate | R: Reset' },
  { name: 'CyberMotocross', title: 'Cyber Motocross', category: 'Racing', controls: 'Arrow Keys: Balance | Space: Jump' },
  { name: 'QuantumKart', title: 'Quantum Kart', category: 'Racing', controls: 'WASD: Drive | Q: Teleport' },
  { name: 'PlasmaWarrior', title: 'Plasma Warrior', category: 'Action', controls: 'WASD: Move | Mouse: Aim/Shoot' },
  { name: 'ShadowNinja', title: 'Shadow Ninja', category: 'Action', controls: 'WASD: Move | Space: Stealth' },
  { name: 'MechAssault', title: 'Mech Assault', category: 'Action', controls: 'WASD: Move | Mouse: Target' },
  { name: 'LaserCommando', title: 'Laser Commando', category: 'Action', controls: 'WASD: Move | Space: Shoot' },
  { name: 'CyberBrawler', title: 'Cyber Brawler', category: 'Action', controls: 'Arrow Keys: Move | Space: Attack' },
  { name: 'NeonBlocks', title: 'Neon Blocks', category: 'Puzzle', controls: 'Arrow Keys: Move | Space: Rotate' },
  { name: 'QuantumMaze', title: 'Quantum Maze', category: 'Puzzle', controls: 'WASD: Navigate | Q: Phase Shift' },
  { name: 'CircuitSolver', title: 'Circuit Solver', category: 'Puzzle', controls: 'Mouse: Connect Circuits' },
  { name: 'CrystalCascade', title: 'Crystal Cascade', category: 'Puzzle', controls: 'Mouse: Match Crystals' },
  { name: 'GravityShift', title: 'Gravity Shift', category: 'Puzzle', controls: 'Arrow Keys: Move | Space: Flip Gravity' },
  { name: 'CyberJumper', title: 'Cyber Jumper', category: 'Platform', controls: 'WASD: Move | Space: Jump' },
  { name: 'QuantumLeap', title: 'Quantum Leap', category: 'Platform', controls: 'Arrow Keys: Move | Q: Phase' },
  { name: 'NeonParkour', title: 'Neon Parkour', category: 'Platform', controls: 'WASD: Run | Space: Jump' },
  { name: 'RobotEscape', title: 'Robot Escape', category: 'Platform', controls: 'Arrow Keys: Move | Space: Jump' },
  { name: 'SpaceHopper', title: 'Space Hopper', category: 'Platform', controls: 'WASD: Float | Space: Boost' },
  { name: 'PlasmaDefender', title: 'Plasma Defender', category: 'Shooter', controls: 'Mouse: Aim/Shoot | WASD: Move' },
  { name: 'SpaceMarines', title: 'Space Marines', category: 'Shooter', controls: 'WASD: Move | Mouse: Shoot' },
  { name: 'LaserStorm', title: 'Laser Storm', category: 'Shooter', controls: 'Arrow Keys: Move | Space: Shoot' },
  { name: 'AsteroidBlaster', title: 'Asteroid Blaster', category: 'Shooter', controls: 'WASD: Rotate | Space: Shoot' },
  { name: 'CyberSniper', title: 'Cyber Sniper', category: 'Shooter', controls: 'Mouse: Aim | Click: Shoot' },
  { name: 'NeonPacman', title: 'Neon Pac-Man', category: 'Arcade', controls: 'Arrow Keys: Move' },
  { name: 'CyberBreakout', title: 'Cyber Breakout', category: 'Arcade', controls: 'Mouse: Move Paddle' },
  { name: 'PlasmaPong', title: 'Plasma Pong', category: 'Arcade', controls: 'W/S: Move Paddle' },
  { name: 'NeonFrogger', title: 'Neon Frogger', category: 'Arcade', controls: 'Arrow Keys: Navigate' },
  { name: 'QuantumCentipede', title: 'Quantum Centipede', category: 'Arcade', controls: 'Mouse: Aim | Click: Shoot' },
  { name: 'CyberQuest', title: 'Cyber Quest', category: 'RPG', controls: 'WASD: Move | Mouse: Interact' },
  { name: 'NeonWarriors', title: 'Neon Warriors', category: 'RPG', controls: 'Mouse: Select Actions' },
  { name: 'QuantumMage', title: 'Quantum Mage', category: 'RPG', controls: '1-5: Cast Spells | WASD: Move' },
  { name: 'RobotLegends', title: 'Robot Legends', category: 'RPG', controls: 'Mouse: Command Robots' },
  { name: 'SpaceExplorer', title: 'Space Explorer', category: 'RPG', controls: 'WASD: Explore | Mouse: Interact' },
  { name: 'CyberCity', title: 'Cyber City', category: 'Simulation', controls: 'Mouse: Build City' },
  { name: 'SpaceStation', title: 'Space Station', category: 'Simulation', controls: 'Mouse: Manage Station' },
  { name: 'RobotFactory', title: 'Robot Factory', category: 'Simulation', controls: 'Mouse: Design Robots' },
  { name: 'NeonFarm', title: 'Neon Farm', category: 'Simulation', controls: 'Mouse: Tend Crops' },
  { name: 'QuantumLab', title: 'Quantum Lab', category: 'Simulation', controls: 'Mouse: Conduct Experiments' },
  { name: 'CyberSoccer', title: 'Cyber Soccer', category: 'Sports', controls: 'WASD: Move | Space: Kick' },
  { name: 'NeonBasketball', title: 'Neon Basketball', category: 'Sports', controls: 'Mouse: Aim | Click: Shoot' },
  { name: 'QuantumTennis', title: 'Quantum Tennis', category: 'Sports', controls: 'Mouse: Move Racket' },
  { name: 'SpaceHockey', title: 'Space Hockey', category: 'Sports', controls: 'WASD: Move | Space: Hit' },
  { name: 'CyberGolf', title: 'Cyber Golf', category: 'Sports', controls: 'Mouse: Aim | Click: Swing' },
  { name: 'NeonRhythm', title: 'Neon Rhythm', category: 'Music', controls: 'Arrow Keys: Hit Beats' },
  { name: 'CyberDJ', title: 'Cyber DJ', category: 'Music', controls: 'Mouse: Mix Tracks' },
  { name: 'QuantumBeats', title: 'Quantum Beats', category: 'Music', controls: 'WASD: Match Rhythm' },
  { name: 'SpaceSymphony', title: 'Space Symphony', category: 'Music', controls: 'Mouse: Compose Music' },
  { name: 'DigitalPiano', title: 'Digital Piano', category: 'Music', controls: 'Keys: Play Piano' },
  { name: 'NeonPainter', title: 'Neon Painter', category: 'Creative', controls: 'Mouse: Paint Art' },
  { name: 'CyberSculptor', title: 'Cyber Sculptor', category: 'Creative', controls: 'Mouse: Sculpt 3D' },
  { name: 'QuantumBuilder', title: 'Quantum Builder', category: 'Creative', controls: 'Mouse: Build Structures' },
  { name: 'PixelDesigner', title: 'Pixel Designer', category: 'Creative', controls: 'Mouse: Design Pixels' },
  { name: 'HologramMaker', title: 'Hologram Maker', category: 'Creative', controls: 'Mouse: Create Holograms' },
  { name: 'CyberEmpire', title: 'Cyber Empire', category: 'Idle', controls: 'Mouse: Manage Empire' },
  { name: 'QuantumMiner', title: 'Quantum Miner', category: 'Idle', controls: 'Mouse: Upgrade Miners' },
  { name: 'SpaceTycoon', title: 'Space Tycoon', category: 'Idle', controls: 'Mouse: Build Business' },
  { name: 'RobotClicker', title: 'Robot Clicker', category: 'Idle', controls: 'Mouse: Click to Build' },
  { name: 'NeonClicker', title: 'Neon Clicker', category: 'Idle', controls: 'Mouse: Generate Energy' }
];

// Create game files
newGames.forEach(game => {
  const content = gameTemplate(game.name, game.title, game.category, game.controls);
  const filename = \`\${game.name}.tsx\`;
  const filepath = path.join(__dirname, '..', 'pages', 'games', filename);
  
  fs.writeFileSync(filepath, content);
  console.log(\`Created \${filename}\`);
});

console.log('All 57 new game files created successfully!');