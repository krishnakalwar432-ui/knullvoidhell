const fs = require('fs');

const gameTemplates = {
  runner: `import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

const GAME_NAME = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());

  const [gameState, setGameState] = useState({
    player: { x: 100, y: 300, vx: 5, vy: 0 },
    obstacles: [] as Array<{x: number, y: number, width: number, height: number}>,
    score: 0,
    gameOver: false
  });

  const update = useCallback(() => {
    if (gameState.gameOver) return;
    
    setGameState(prev => {
      const newState = { ...prev };
      
      // Basic runner game logic
      newState.player.x += newState.player.vx;
      newState.player.vy += 0.5; // gravity
      newState.player.y += newState.player.vy;
      
      if (newState.player.y > 500) {
        newState.player.y = 500;
        newState.player.vy = 0;
      }
      
      // Jump control
      if (keysRef.current.has(' ') && newState.player.y >= 500) {
        newState.player.vy = -12;
      }
      
      newState.score += 1;
      return newState;
    });
  }, [gameState.gameOver]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 800, 600);

    // Draw player
    ctx.fillStyle = '#0aff9d';
    ctx.fillRect(gameState.player.x, gameState.player.y, 20, 20);

    // Draw ground
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 520, 800, 80);

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText(\`Score: \${gameState.score}\`, 20, 40);

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', 400, 250);
      ctx.fillText('Press R to restart', 400, 350);
      ctx.textAlign = 'left';
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key === 'r' && gameState.gameOver) {
        setGameState({
          player: { x: 100, y: 300, vx: 5, vy: 0 },
          obstacles: [],
          score: 0,
          gameOver: false
        });
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
  }, [gameState.gameOver]);

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
    <GameLayout gameTitle="GAME_TITLE" gameCategory="GAME_CATEGORY">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg"
        />
        <p className="text-gray-300">Space: Jump | R: Restart</p>
      </div>
    </GameLayout>
  );
};

export default GAME_NAME;`,

  shooter: `import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

const GAME_NAME = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());

  const [gameState, setGameState] = useState({
    player: { x: 400, y: 500, health: 100 },
    bullets: [] as Array<{x: number, y: number, vx: number, vy: number}>,
    enemies: [] as Array<{x: number, y: number, health: number}>,
    score: 0,
    gameOver: false
  });

  const update = useCallback(() => {
    if (gameState.gameOver) return;
    
    setGameState(prev => {
      const newState = { ...prev };
      
      // Player movement
      if (keysRef.current.has('a')) newState.player.x = Math.max(0, newState.player.x - 5);
      if (keysRef.current.has('d')) newState.player.x = Math.min(800, newState.player.x + 5);
      
      // Shooting
      if (keysRef.current.has(' ')) {
        if (newState.bullets.length < 10) {
          newState.bullets.push({
            x: newState.player.x,
            y: newState.player.y - 20,
            vx: 0,
            vy: -10
          });
        }
      }
      
      // Update bullets
      newState.bullets = newState.bullets.filter(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        return bullet.y > 0;
      });
      
      // Spawn enemies
      if (Math.random() < 0.02) {
        newState.enemies.push({
          x: Math.random() * 800,
          y: 0,
          health: 1
        });
      }
      
      // Update enemies
      newState.enemies.forEach(enemy => {
        enemy.y += 2;
      });
      newState.enemies = newState.enemies.filter(enemy => enemy.y < 600);
      
      newState.score += 1;
      return newState;
    });
  }, [gameState.gameOver]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 800, 600);

    // Draw player
    ctx.fillStyle = '#0aff9d';
    ctx.fillRect(gameState.player.x - 15, gameState.player.y - 15, 30, 30);

    // Draw bullets
    ctx.fillStyle = '#ffff00';
    gameState.bullets.forEach(bullet => {
      ctx.fillRect(bullet.x - 2, bullet.y - 5, 4, 10);
    });

    // Draw enemies
    ctx.fillStyle = '#ff0099';
    gameState.enemies.forEach(enemy => {
      ctx.fillRect(enemy.x - 10, enemy.y - 10, 20, 20);
    });

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText(\`Score: \${gameState.score}\`, 20, 40);

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', 400, 250);
      ctx.fillText('Press R to restart', 400, 350);
      ctx.textAlign = 'left';
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key === 'r' && gameState.gameOver) {
        setGameState({
          player: { x: 400, y: 500, health: 100 },
          bullets: [],
          enemies: [],
          score: 0,
          gameOver: false
        });
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
  }, [gameState.gameOver]);

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
    <GameLayout gameTitle="GAME_TITLE" gameCategory="GAME_CATEGORY">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg"
        />
        <p className="text-gray-300">A/D: Move | Space: Shoot | R: Restart</p>
      </div>
    </GameLayout>
  );
};

export default GAME_NAME;`,

  strategy: `import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

const GAME_NAME = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();

  const [gameState, setGameState] = useState({
    towers: [] as Array<{x: number, y: number, type: string, level: number}>,
    enemies: [] as Array<{x: number, y: number, health: number, maxHealth: number, path: number}>,
    money: 100,
    lives: 20,
    wave: 1,
    score: 0,
    gameOver: false
  });

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#001122';
    ctx.fillRect(0, 0, 800, 600);

    // Draw path
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 40;
    ctx.beginPath();
    ctx.moveTo(0, 300);
    ctx.lineTo(800, 300);
    ctx.stroke();

    // Draw towers
    ctx.fillStyle = '#0aff9d';
    gameState.towers.forEach(tower => {
      ctx.fillRect(tower.x - 15, tower.y - 15, 30, 30);
    });

    // Draw enemies
    ctx.fillStyle = '#ff0099';
    gameState.enemies.forEach(enemy => {
      ctx.fillRect(enemy.x - 10, enemy.y - 10, 20, 20);
      
      // Health bar
      const healthPercent = enemy.health / enemy.maxHealth;
      ctx.fillStyle = 'red';
      ctx.fillRect(enemy.x - 12, enemy.y - 20, 24, 4);
      ctx.fillStyle = 'green';
      ctx.fillRect(enemy.x - 12, enemy.y - 20, 24 * healthPercent, 4);
      ctx.fillStyle = '#ff0099';
    });

    // Draw UI
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(\`Money: $\${gameState.money}\`, 20, 30);
    ctx.fillText(\`Lives: \${gameState.lives}\`, 20, 55);
    ctx.fillText(\`Wave: \${gameState.wave}\`, 20, 80);
    ctx.fillText(\`Score: \${gameState.score}\`, 20, 105);

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', 400, 250);
      ctx.fillText('Press R to restart', 400, 350);
      ctx.textAlign = 'left';
    }
  }, [gameState]);

  const update = useCallback(() => {
    if (gameState.gameOver) return;
    
    setGameState(prev => {
      const newState = { ...prev };
      
      // Spawn enemies
      if (Math.random() < 0.01) {
        newState.enemies.push({
          x: 0,
          y: 300,
          health: 10,
          maxHealth: 10,
          path: 0
        });
      }
      
      // Move enemies
      newState.enemies.forEach(enemy => {
        enemy.x += 1;
      });
      
      // Remove enemies that reached the end
      const enemiesAtEnd = newState.enemies.filter(enemy => enemy.x >= 800);
      newState.lives -= enemiesAtEnd.length;
      newState.enemies = newState.enemies.filter(enemy => enemy.x < 800);
      
      if (newState.lives <= 0) {
        newState.gameOver = true;
      }
      
      newState.score += 1;
      return newState;
    });
  }, [gameState.gameOver]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Place tower if we have money and click is valid
    if (gameState.money >= 25 && Math.abs(y - 300) > 50) {
      setGameState(prev => ({
        ...prev,
        towers: [...prev.towers, { x, y, type: 'basic', level: 1 }],
        money: prev.money - 25
      }));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' && gameState.gameOver) {
        setGameState({
          towers: [],
          enemies: [],
          money: 100,
          lives: 20,
          wave: 1,
          score: 0,
          gameOver: false
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.gameOver]);

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
    <GameLayout gameTitle="GAME_TITLE" gameCategory="GAME_CATEGORY">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg cursor-crosshair"
          onClick={handleCanvasClick}
        />
        <p className="text-gray-300">Click to place towers ($25) | R: Restart</p>
      </div>
    </GameLayout>
  );
};

export default GAME_NAME;`,

  classic: `import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

const GAME_NAME = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());

  const [gameState, setGameState] = useState({
    player: { x: 400, y: 300 },
    score: 0,
    gameOver: false
  });

  const update = useCallback(() => {
    if (gameState.gameOver) return;
    
    setGameState(prev => {
      const newState = { ...prev };
      
      // Simple movement
      if (keysRef.current.has('a')) newState.player.x = Math.max(0, newState.player.x - 3);
      if (keysRef.current.has('d')) newState.player.x = Math.min(800, newState.player.x + 3);
      if (keysRef.current.has('w')) newState.player.y = Math.max(0, newState.player.y - 3);
      if (keysRef.current.has('s')) newState.player.y = Math.min(600, newState.player.y + 3);
      
      newState.score += 1;
      return newState;
    });
  }, [gameState.gameOver]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 800, 600);

    // Draw player
    ctx.fillStyle = '#0aff9d';
    ctx.fillRect(gameState.player.x - 10, gameState.player.y - 10, 20, 20);

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText(\`Score: \${gameState.score}\`, 20, 40);

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', 400, 250);
      ctx.fillText('Press R to restart', 400, 350);
      ctx.textAlign = 'left';
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key === 'r' && gameState.gameOver) {
        setGameState({
          player: { x: 400, y: 300 },
          score: 0,
          gameOver: false
        });
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
  }, [gameState.gameOver]);

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
    <GameLayout gameTitle="GAME_TITLE" gameCategory="GAME_CATEGORY">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg"
        />
        <p className="text-gray-300">WASD: Move | R: Restart</p>
      </div>
    </GameLayout>
  );
};

export default GAME_NAME;`
};

const games = [
  { id: 'g-switch-3', name: 'GSwitch3', title: 'G-Switch 3', category: 'Gravity-flip running game', type: 'runner' },
  { id: 'ovo', name: 'Ovo', title: 'OvO', category: 'Precision platformer', type: 'runner' },
  { id: 'tomb-runner', name: 'TombRunner', title: 'Tomb Runner', category: 'Temple Run-style runner', type: 'runner' },
  { id: 'galaga-special-edition', name: 'GalagaSpecialEdition', title: 'Galaga Special Edition', category: 'Retro alien shooter', type: 'shooter' },
  { id: 'nova-defender', name: 'NovaDefender', title: 'Nova Defender', category: 'Defense shooter', type: 'shooter' },
  { id: 'space-blaze-2', name: 'SpaceBlaze2', title: 'Space Blaze 2', category: 'Side-scrolling shooter', type: 'shooter' },
  { id: 'galaxy-warriors', name: 'GalaxyWarriors', title: 'Galaxy Warriors', category: 'Bullet-hell shooter', type: 'shooter' },
  { id: 'alien-sky-invasion', name: 'AlienSkyInvasion', title: 'Alien Sky Invasion', category: 'Space shooter', type: 'shooter' },
  { id: 'snake-3310', name: 'Snake3310', title: 'Snake 3310', category: 'Nokia Snake clone', type: 'classic' },
  { id: 'bounce-classic-html5', name: 'BounceClassicHTML5', title: 'Bounce Classic HTML5', category: 'Ball bounce game', type: 'classic' },
  { id: 'space-impact-reborn', name: 'SpaceImpactReborn', title: 'Space Impact Reborn', category: 'Side-scrolling space shooter', type: 'classic' },
  { id: 'rapid-roll', name: 'RapidRoll', title: 'Rapid Roll', category: 'Falling-ball survival', type: 'classic' },
  { id: 'car-racing-2d-retro', name: 'CarRacing2DRetro', title: 'Car Racing 2D Retro', category: 'Top-down racing', type: 'classic' },
  { id: 'kingdom-rush', name: 'KingdomRush', title: 'Kingdom Rush', category: 'Tower defense', type: 'strategy' },
  { id: 'bloons-td5', name: 'BloonsTD5', title: 'Bloons Tower Defense 5', category: 'Tower defense', type: 'strategy' },
  { id: 'cursed-treasure', name: 'CursedTreasure', title: 'Cursed Treasure', category: 'Dark fantasy tower defense', type: 'strategy' },
  { id: 'zombie-defense-html5', name: 'ZombieDefenseHTML5', title: 'Zombie Defense HTML5', category: 'Zombie tower defense', type: 'strategy' },
  { id: 'empire-defender-td', name: 'EmpireDefenderTD', title: 'Empire Defender TD', category: 'Classic tower defense', type: 'strategy' },
  { id: 'plants-vs-goblins', name: 'PlantsVsGoblins', title: 'Plants vs Goblins', category: 'PvZ-style defense', type: 'strategy' },
  { id: 'defend-the-castle', name: 'DefendTheCastle', title: 'Defend the Castle', category: 'Castle defense', type: 'strategy' },
  { id: 'protect-the-garden', name: 'ProtectTheGarden', title: 'Protect the Garden', category: 'Garden defense', type: 'strategy' },
  { id: 'swamp-attack-web', name: 'SwampAttackWeb', title: 'Swamp Attack Web', category: 'Swamp creature defense', type: 'strategy' },
  { id: 'tiny-defense-2', name: 'TinyDefense2', title: 'Tiny Defense 2', category: 'Cartoony tower defense', type: 'strategy' },
  { id: 'sniper-clash-3d', name: 'SniperClash3D', title: 'Sniper Clash 3D', category: '3D sniper combat', type: 'shooter' },
  { id: 'mini-royale-2', name: 'MiniRoyale2', title: 'Mini Royale 2', category: 'Battle Royale FPS', type: 'shooter' },
  { id: 'combat-reloaded', name: 'CombatReloaded', title: 'Combat Reloaded', category: 'Arena FPS', type: 'shooter' }
];

games.forEach(game => {
  const template = gameTemplates[game.type];
  const content = template
    .replace(/GAME_NAME/g, game.name)
    .replace(/GAME_TITLE/g, game.title)
    .replace(/GAME_CATEGORY/g, game.category);
  
  fs.writeFileSync(`client/pages/games/${game.name}.tsx`, content);
  console.log(`Created ${game.name}.tsx`);
});

console.log('All game components created!');
