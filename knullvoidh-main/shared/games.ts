export interface Game {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isImplemented: boolean;
  mobileOptimized: boolean;
  thumbnail?: string;
  color: string;
}

export const games: Game[] = [
  // Keep existing working games that weren't in removal list
  {
    id: 'space-invaders',
    title: 'Space Invaders Extreme',
    description: 'Classic arcade action with modern 3D effects',
    category: 'Arcade',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#0aff9d'
  },
  {
    id: 'neon-pong',
    title: 'Neon Pong 3D',
    description: 'Retro pong with neon visuals and 3D physics',
    category: 'Sports',
    difficulty: 'Easy',
    isImplemented: true,
    mobileOptimized: true,
    color: '#7000ff'
  },
  {
    id: 'infinite-runner',
    title: 'Infinite Runner',
    description: 'Endless cosmic adventure through space',
    category: 'Action',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff0099'
  },
  {
    id: 'black-hole-puzzle',
    title: 'Black Hole Puzzle',
    description: 'Navigate through gravitational puzzles',
    category: 'Puzzle',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#7000ff'
  },
  {
    id: 'cyber-slash',
    title: 'Cyber Slash',
    description: 'Futuristic sword combat with neon effects',
    category: 'Action',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#0aff9d'
  },
  {
    id: 'gravity-dodge',
    title: 'Gravity Dodge',
    description: 'Physics-based obstacle avoidance',
    category: 'Arcade',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff6600'
  },
  {
    id: 'crypto-miner',
    title: 'Crypto Miner',
    description: 'Digital currency mining simulation',
    category: 'Simulation',
    difficulty: 'Easy',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ffff00'
  },
  {
    id: 'ai-dungeon',
    title: 'AI Dungeon',
    description: 'AI-powered adventure generation',
    category: 'RPG',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff0099'
  },
  {
    id: 'quantum-tetris',
    title: 'Quantum Tetris',
    description: 'Tetris with quantum mechanics twists',
    category: 'Puzzle',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#7000ff'
  },
  {
    id: 'plasma-snake',
    title: 'Plasma Snake',
    description: 'Modern snake with plasma effects',
    category: 'Arcade',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#0aff9d'
  },
  {
    id: 'singularity-clicker',
    title: 'Singularity Clicker',
    description: 'Incremental space-time manipulation',
    category: 'Idle',
    difficulty: 'Easy',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff6600'
  },
  {
    id: 'glitch-painter',
    title: 'Glitch Painter',
    description: 'Create art with digital glitch effects',
    category: 'Creative',
    difficulty: 'Easy',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff0099'
  },
  {
    id: 'pixel-zombies',
    title: 'Pixel Zombies',
    description: 'Retro zombie survival shooter',
    category: 'Action',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#00ff00'
  },
  {
    id: 'beat-sync-rhythm',
    title: 'Beat Sync Rhythm',
    description: 'Music rhythm game with cosmic beats',
    category: 'Music',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff0099'
  },

  // NEW RUNNER GAMES
  {
    id: 'run3-webgl',
    title: 'Run 3 (WebGL)',
    description: 'Space tunnel runner with wall-jumping mechanics',
    category: 'Runner',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#7000ff'
  },
  {
    id: 'slope',
    title: 'Slope',
    description: 'Fast reflex downhill runner with increasing difficulty',
    category: 'Runner',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff0099'
  },
  {
    id: 'g-switch-3',
    title: 'G-Switch 3',
    description: 'Gravity-flip running game with tight controls',
    category: 'Runner',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#0aff9d'
  },
  {
    id: 'ovo',
    title: 'OvO',
    description: 'Precision platformer with wall jumps and parkour',
    category: 'Platform',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ffff00'
  },
  {
    id: 'tomb-runner',
    title: 'Tomb Runner',
    description: 'Temple Run-style infinite runner',
    category: 'Runner',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff8000'
  },

  // NEW SHOOTER GAMES
  {
    id: 'galaga-special-edition',
    title: 'Galaga Special Edition',
    description: 'Retro-style alien shooter with modern features',
    category: 'Shooter',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#7000ff'
  },
  {
    id: 'nova-defender',
    title: 'Nova Defender',
    description: 'Fixed-position defense shooter with upgrade options',
    category: 'Shooter',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff0099'
  },
  {
    id: 'space-blaze-2',
    title: 'Space Blaze 2',
    description: 'Classic horizontal side-scrolling shoot em up',
    category: 'Shooter',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#0aff9d'
  },
  {
    id: 'galaxy-warriors',
    title: 'Galaxy Warriors',
    description: 'Bullet-hell inspired vertical shooter',
    category: 'Shooter',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#00ffff'
  },
  {
    id: 'alien-sky-invasion',
    title: 'Alien Sky Invasion',
    description: 'Space Invaders meets bullet chaos',
    category: 'Shooter',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff6600'
  },
  {
    id: 'sniper-clash-3d',
    title: 'Sniper Clash 3D',
    description: 'Quick deathmatch game with sniper rifles and 3D maps',
    category: 'Shooter',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#cc0000'
  },
  {
    id: 'mini-royale-2',
    title: 'Mini Royale 2',
    description: 'Battle Royale/FPS in the browser with multiplayer',
    category: 'Shooter',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#0066ff'
  },
  {
    id: 'combat-reloaded',
    title: 'Combat Reloaded',
    description: 'Classic browser FPS with multiple arenas and weapons',
    category: 'Shooter',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff3300'
  },

  // NEW CLASSIC GAMES
  {
    id: 'snake-3310',
    title: 'Snake 3310',
    description: 'True Nokia Snake clone in browser',
    category: 'Classic',
    difficulty: 'Easy',
    isImplemented: true,
    mobileOptimized: true,
    color: '#00ff00'
  },
  {
    id: 'bounce-classic-html5',
    title: 'Bounce Classic HTML5',
    description: 'Remake of the red ball bounce game',
    category: 'Classic',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff4444'
  },
  {
    id: 'space-impact-reborn',
    title: 'Space Impact Reborn',
    description: 'Recreated as a side-scrolling space shooter',
    category: 'Classic',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#7000ff'
  },
  {
    id: 'rapid-roll',
    title: 'Rapid Roll',
    description: 'Falling-ball style survival game from Nokia phones',
    category: 'Classic',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ffff00'
  },
  {
    id: 'car-racing-2d-retro',
    title: 'Car Racing 2D Retro',
    description: 'Top-down pixel racing game',
    category: 'Racing',
    difficulty: 'Medium',
    isImplemented: false,
    mobileOptimized: true,
    color: '#ff8000'
  },

  // NEW TOWER DEFENSE GAMES
  {
    id: 'kingdom-rush',
    title: 'Kingdom Rush',
    description: 'One of the best HTML5 tower defense games ever made',
    category: 'Strategy',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#0066cc'
  },
  {
    id: 'bloons-td5',
    title: 'Bloons Tower Defense 5',
    description: 'Pop waves of enemies with upgradable monkey towers',
    category: 'Strategy',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff0099'
  },
  {
    id: 'cursed-treasure',
    title: 'Cursed Treasure',
    description: 'Defend gems from waves of heroes in a dark fantasy world',
    category: 'Strategy',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#6600cc'
  },
  {
    id: 'zombie-defense-html5',
    title: 'Zombie Defense HTML5',
    description: 'Lane-based zombie defense like PvZ with weapons',
    category: 'Strategy',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#00aa00'
  },
  {
    id: 'empire-defender-td',
    title: 'Empire Defender TD',
    description: 'Classic map-based tower defense with hero upgrades',
    category: 'Strategy',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#cc6600'
  },
  {
    id: 'plants-vs-goblins',
    title: 'Plants vs Goblins',
    description: 'A direct PvZ-style clone with goblin enemies',
    category: 'Strategy',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#009900'
  },
  {
    id: 'defend-the-castle',
    title: 'Defend the Castle',
    description: 'Side-view defense with archers and catapults',
    category: 'Strategy',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#996633'
  },
  {
    id: 'protect-the-garden',
    title: 'Protect the Garden',
    description: 'A minimalist version of PvZ with bug-like enemies',
    category: 'Strategy',
    difficulty: 'Easy',
    isImplemented: true,
    mobileOptimized: true,
    color: '#66cc66'
  },
  {
    id: 'swamp-attack-web',
    title: 'Swamp Attack Web',
    description: 'Defend your shack from waves of weird swamp creatures',
    category: 'Strategy',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#669966'
  },
  {
    id: 'tiny-defense-2',
    title: 'Tiny Defense 2',
    description: 'Cartoony, grid-based defense with cute units',
    category: 'Strategy',
    difficulty: 'Easy',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff99cc'
  },

  // ADDITIONAL 57 GAMES TO REACH 100 TOTAL
  // Racing Games
  {
    id: 'neon-racer-3d',
    title: 'Neon Racer 3D',
    description: 'High-speed cyberpunk racing with neon trails',
    category: 'Racing',
    difficulty: 'Medium',
    isImplemented: false,
    mobileOptimized: true,
    color: '#ff0099'
  },
  {
    id: 'turbo-drift',
    title: 'Turbo Drift',
    description: 'Arcade-style drifting with explosive power-ups',
    category: 'Racing',
    difficulty: 'Hard',
    isImplemented: false,
    mobileOptimized: true,
    color: '#ff6600'
  },
  {
    id: 'space-rally',
    title: 'Space Rally',
    description: 'Zero-gravity racing across alien planets',
    category: 'Racing',
    difficulty: 'Medium',
    isImplemented: false,
    mobileOptimized: true,
    color: '#7000ff'
  },
  {
    id: 'cyber-motocross',
    title: 'Cyber Motocross',
    description: 'Futuristic bike racing with stunts',
    category: 'Racing',
    difficulty: 'Hard',
    isImplemented: false,
    mobileOptimized: true,
    color: '#0aff9d'
  },
  {
    id: 'quantum-kart',
    title: 'Quantum Kart',
    description: 'Teleporting kart racing with time manipulation',
    category: 'Racing',
    difficulty: 'Medium',
    isImplemented: false,
    mobileOptimized: true,
    color: '#ffff00'
  },

  // Action Games
  {
    id: 'plasma-warrior',
    title: 'Plasma Warrior',
    description: 'Intense combat with energy weapons',
    category: 'Action',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff0040'
  },
  {
    id: 'shadow-ninja',
    title: 'Shadow Ninja',
    description: 'Stealth-based action with ninja abilities',
    category: 'Action',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#4000ff'
  },
  {
    id: 'mech-assault',
    title: 'Mech Assault',
    description: 'Giant robot battles in destructible cities',
    category: 'Action',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff8000'
  },
  {
    id: 'laser-commando',
    title: 'Laser Commando',
    description: 'Top-down action shooter with laser weapons',
    category: 'Action',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff0099'
  },
  {
    id: 'cyber-brawler',
    title: 'Cyber Brawler',
    description: 'Street fighting in a cyberpunk world',
    category: 'Action',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#00ff80'
  },

  // Puzzle Games
  {
    id: 'neon-blocks',
    title: 'Neon Blocks',
    description: 'Glowing tetris-style puzzle with power-ups',
    category: 'Puzzle',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#0aff9d'
  },
  {
    id: 'quantum-maze',
    title: 'Quantum Maze',
    description: 'Navigate through reality-bending mazes',
    category: 'Puzzle',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#7000ff'
  },
  {
    id: 'circuit-solver',
    title: 'Circuit Solver',
    description: 'Connect circuits to power up the city',
    category: 'Puzzle',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ffff00'
  },
  {
    id: 'crystal-cascade',
    title: 'Crystal Cascade',
    description: 'Match-3 puzzle with crystalline gems',
    category: 'Puzzle',
    difficulty: 'Easy',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff00ff'
  },
  {
    id: 'gravity-shift',
    title: 'Gravity Shift',
    description: 'Manipulate gravity to solve puzzles',
    category: 'Puzzle',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#00ffff'
  },

  // Platform Games
  {
    id: 'cyber-jumper',
    title: 'Cyber Jumper',
    description: 'Precision platforming in neon environments',
    category: 'Platform',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff0099'
  },
  {
    id: 'quantum-leap',
    title: 'Quantum Leap',
    description: 'Phase through platforms in quantum dimensions',
    category: 'Platform',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#7000ff'
  },
  {
    id: 'neon-parkour',
    title: 'Neon Parkour',
    description: 'Fast-paced wall-running and jumping',
    category: 'Platform',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#0aff9d'
  },
  {
    id: 'robot-escape',
    title: 'Robot Escape',
    description: 'Help a robot escape from a digital prison',
    category: 'Platform',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff6600'
  },
  {
    id: 'space-hopper',
    title: 'Space Hopper',
    description: 'Gravity-defying platforming in zero-G',
    category: 'Platform',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff8000'
  },

  // Shooter Games
  {
    id: 'plasma-defender',
    title: 'Plasma Defender',
    description: 'Defend your base with plasma cannons',
    category: 'Shooter',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff0040'
  },
  {
    id: 'space-marines',
    title: 'Space Marines',
    description: 'Squad-based tactical shooting action',
    category: 'Shooter',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#004080'
  },
  {
    id: 'laser-storm',
    title: 'Laser Storm',
    description: 'Bullet-hell shooter with laser weapons',
    category: 'Shooter',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff0080'
  },
  {
    id: 'asteroid-blaster',
    title: 'Asteroid Blaster',
    description: 'Destroy asteroids to save Earth',
    category: 'Shooter',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#8000ff'
  },
  {
    id: 'cyber-sniper',
    title: 'Cyber Sniper',
    description: 'Precision shooting in cyberpunk city',
    category: 'Shooter',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff4000'
  },

  // Arcade Games
  {
    id: 'neon-pacman',
    title: 'Neon Pac-Man',
    description: 'Classic pac-man with neon glow effects',
    category: 'Arcade',
    difficulty: 'Easy',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ffff00'
  },
  {
    id: 'cyber-breakout',
    title: 'Cyber Breakout',
    description: 'Break blocks with a high-tech paddle',
    category: 'Arcade',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#0080ff'
  },
  {
    id: 'plasma-pong',
    title: 'Plasma Pong',
    description: 'Pong with plasma balls and power-ups',
    category: 'Arcade',
    difficulty: 'Easy',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff0099'
  },
  {
    id: 'neon-frogger',
    title: 'Neon Frogger',
    description: 'Cross digital highways and data streams',
    category: 'Arcade',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#00ff40'
  },
  {
    id: 'quantum-centipede',
    title: 'Quantum Centipede',
    description: 'Shoot at quantum centipedes and mushrooms',
    category: 'Arcade',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff8040'
  },

  // RPG Games
  {
    id: 'cyber-quest',
    title: 'Cyber Quest',
    description: 'Epic cyberpunk RPG adventure',
    category: 'RPG',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#8040ff'
  },
  {
    id: 'neon-warriors',
    title: 'Neon Warriors',
    description: 'Turn-based combat in a digital world',
    category: 'RPG',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff0080'
  },
  {
    id: 'quantum-mage',
    title: 'Quantum Mage',
    description: 'Cast spells with quantum mechanics',
    category: 'RPG',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#4080ff'
  },
  {
    id: 'robot-legends',
    title: 'Robot Legends',
    description: 'Build and battle with custom robots',
    category: 'RPG',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff4080'
  },
  {
    id: 'space-explorer',
    title: 'Space Explorer',
    description: 'Explore galaxies and discover new worlds',
    category: 'RPG',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#80ff40'
  },

  // Simulation Games
  {
    id: 'cyber-city',
    title: 'Cyber City',
    description: 'Build and manage a futuristic city',
    category: 'Simulation',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#4040ff'
  },
  {
    id: 'space-station',
    title: 'Space Station',
    description: 'Manage a space station and its crew',
    category: 'Simulation',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff8000'
  },
  {
    id: 'robot-factory',
    title: 'Robot Factory',
    description: 'Design and manufacture robots',
    category: 'Simulation',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#00ff80'
  },
  {
    id: 'neon-farm',
    title: 'Neon Farm',
    description: 'Grow crops with hydroponics technology',
    category: 'Simulation',
    difficulty: 'Easy',
    isImplemented: true,
    mobileOptimized: true,
    color: '#80ff00'
  },
  {
    id: 'quantum-lab',
    title: 'Quantum Lab',
    description: 'Conduct experiments in quantum physics',
    category: 'Simulation',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff0040'
  },

  // Sports Games
  {
    id: 'cyber-soccer',
    title: 'Cyber Soccer',
    description: 'Futuristic soccer with robot players',
    category: 'Sports',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#00ff40'
  },
  {
    id: 'neon-basketball',
    title: 'Neon Basketball',
    description: 'Shoot hoops with glowing basketballs',
    category: 'Sports',
    difficulty: 'Easy',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff8040'
  },
  {
    id: 'quantum-tennis',
    title: 'Quantum Tennis',
    description: 'Tennis with quantum ball physics',
    category: 'Sports',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#4080ff'
  },
  {
    id: 'space-hockey',
    title: 'Space Hockey',
    description: 'Zero-gravity hockey in space',
    category: 'Sports',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#8040ff'
  },
  {
    id: 'cyber-golf',
    title: 'Cyber Golf',
    description: 'Mini golf with digital obstacles',
    category: 'Sports',
    difficulty: 'Easy',
    isImplemented: true,
    mobileOptimized: true,
    color: '#40ff80'
  },

  // Music Games
  {
    id: 'neon-rhythm',
    title: 'Neon Rhythm',
    description: 'Hit the beats in neon environments',
    category: 'Music',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff0080'
  },
  {
    id: 'cyber-dj',
    title: 'Cyber DJ',
    description: 'Mix electronic beats and create music',
    category: 'Music',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#8000ff'
  },
  {
    id: 'quantum-beats',
    title: 'Quantum Beats',
    description: 'Rhythm game with quantum synchronization',
    category: 'Music',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff4000'
  },
  {
    id: 'space-symphony',
    title: 'Space Symphony',
    description: 'Create cosmic music compositions',
    category: 'Music',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#0040ff'
  },
  {
    id: 'digital-piano',
    title: 'Digital Piano',
    description: 'Play virtual piano with visual effects',
    category: 'Music',
    difficulty: 'Easy',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff8000'
  },

  // Creative Games
  {
    id: 'neon-painter',
    title: 'Neon Painter',
    description: 'Create glowing digital art',
    category: 'Creative',
    difficulty: 'Easy',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff0099'
  },
  {
    id: 'cyber-sculptor',
    title: 'Cyber Sculptor',
    description: 'Sculpt 3D models with digital tools',
    category: 'Creative',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#00ff80'
  },
  {
    id: 'quantum-builder',
    title: 'Quantum Builder',
    description: 'Build structures with quantum blocks',
    category: 'Creative',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#8040ff'
  },
  {
    id: 'pixel-designer',
    title: 'Pixel Designer',
    description: 'Design retro pixel art characters',
    category: 'Creative',
    difficulty: 'Easy',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff4080'
  },
  {
    id: 'hologram-maker',
    title: 'Hologram Maker',
    description: 'Create 3D holographic displays',
    category: 'Creative',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#40ff80'
  },

  // Idle Games
  {
    id: 'cyber-empire',
    title: 'Cyber Empire',
    description: 'Build a digital empire automatically',
    category: 'Idle',
    difficulty: 'Easy',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff8040'
  },
  {
    id: 'quantum-miner',
    title: 'Quantum Miner',
    description: 'Mine quantum crystals passively',
    category: 'Idle',
    difficulty: 'Easy',
    isImplemented: true,
    mobileOptimized: true,
    color: '#4080ff'
  },
  {
    id: 'space-tycoon',
    title: 'Space Tycoon',
    description: 'Manage an intergalactic business',
    category: 'Idle',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#80ff40'
  },
  {
    id: 'robot-clicker',
    title: 'Robot Clicker',
    description: 'Click to build robot armies',
    category: 'Idle',
    difficulty: 'Easy',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff4000'
  },
  {
    id: 'neon-clicker',
    title: 'Neon Clicker',
    description: 'Generate neon energy through clicking',
    category: 'Idle',
    difficulty: 'Easy',
    isImplemented: true,
    mobileOptimized: true,
    color: '#00ff40'
  }
,
  // Replacements for removed racing games
  {
    id: 'neon-drift-overdrive',
    title: 'Neon Drift Overdrive',
    description: '3D endless racer. Chain drifts for nitro through traffic and barriers with synth neon visuals.',
    category: 'Racing',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#00ffff'
  },
  {
    id: 'shadow-bot-protocol',
    title: 'Shadow Bot Protocol',
    description: 'Stealth puzzle infiltration. Manipulate lights, avoid cameras, hack terminals in real-time shadows.',
    category: 'Puzzle',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#7c3aed'
  },
  {
    id: 'cyber-strike-arena',
    title: 'Cyber Strike Arena',
    description: 'Neon top-down shooter with customizable avatars and weapon upgrades. Fight bots in fast arenas.',
    category: 'Shooter',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#ff00aa'
  },
  {
    id: 'pixel-forge-tycoon',
    title: 'Pixel Forge Tycoon',
    description: 'Idle builder sim. Hire staff, research upgrades, and grow a pixel-art game studio in 3D.',
    category: 'Simulation',
    difficulty: 'Easy',
    isImplemented: true,
    mobileOptimized: true,
    color: '#00ffaa'
  },
  {
    id: 'astral-leap',
    title: 'Astral Leap',
    description: '3D physics platformer. Leap between floating planets, collect shards, avoid black holes.',
    category: 'Platform',
    difficulty: 'Hard',
    isImplemented: true,
    mobileOptimized: true,
    color: '#80eaff'
  },
  {
    id: 'firewall-runner',
    title: 'Firewall Runner: Code Escape',
    description: 'Reflex runner in a neon grid. Dash through firewalls, decrypt locks, dodge antivirus drones.',
    category: 'Runner',
    difficulty: 'Medium',
    isImplemented: true,
    mobileOptimized: true,
    color: '#00ff7f'
  }
];

export const gameCategories = [
  'All',
  'Arcade',
  'Action',
  'Puzzle',
  'Sports',
  'RPG',
  'Simulation',
  'Strategy',
  'Racing',
  'Platform',
  'Creative',
  'Music',
  'Idle',
  'Runner',
  'Shooter',
  'Classic'
];
