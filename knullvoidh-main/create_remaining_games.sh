#!/bin/bash

# List of games to create
games=(
    "TombRunner:Tomb Runner:Temple Run style runner"
    "GalagaSpecialEdition:Galaga Special Edition:Retro alien shooter"
    "NovaDefender:Nova Defender:Defense shooter"
    "SpaceBlaze2:Space Blaze 2:Side-scrolling shooter"
    "GalaxyWarriors:Galaxy Warriors:Bullet-hell shooter"
    "AlienSkyInvasion:Alien Sky Invasion:Space shooter chaos"
    "BounceClassicHTML5:Bounce Classic HTML5:Red ball bounce game"
    "SpaceImpactReborn:Space Impact Reborn:Side-scrolling space shooter"
    "RapidRoll:Rapid Roll:Falling-ball survival"
    "CarRacing2DRetro:Car Racing 2D Retro:Top-down racing"
    "CursedTreasure:Cursed Treasure:Dark fantasy tower defense"
    "ZombieDefenseHTML5:Zombie Defense HTML5:PvZ-style defense"
    "EmpireDefenderTD:Empire Defender TD:Classic tower defense"
    "PlantsVsGoblins:Plants vs Goblins:PvZ clone"
    "DefendTheCastle:Defend the Castle:Castle defense"
    "ProtectTheGarden:Protect the Garden:Garden defense"
    "SwampAttackWeb:Swamp Attack Web:Swamp defense"
    "TinyDefense2:Tiny Defense 2:Cartoony tower defense"
    "SniperClash3D:Sniper Clash 3D:3D sniper combat"
    "MiniRoyale2:Mini Royale 2:Battle Royale FPS"
    "CombatReloaded:Combat Reloaded:Arena FPS"
)

for game in "${games[@]}"; do
    IFS=':' read -r component_name title description <<< "$game"
    
    cat > "client/pages/games/${component_name}.tsx" << EOF
import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

const ${component_name} = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());

  const [gameState, setGameState] = useState({
    player: { x: 400, y: 300, health: 100 },
    score: 0,
    gameOver: false
  });

  const update = useCallback(() => {
    if (gameState.gameOver) return;
    
    setGameState(prev => {
      const newState = { ...prev };
      
      // Basic game logic
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

    ctx.fillStyle = '#001122';
    ctx.fillRect(0, 0, 800, 600);

    // Draw player
    ctx.fillStyle = '#0aff9d';
    ctx.shadowColor = '#0aff9d';
    ctx.shadowBlur = 10;
    ctx.fillRect(gameState.player.x - 10, gameState.player.y - 10, 20, 20);
    ctx.shadowBlur = 0;

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
          player: { x: 400, y: 300, health: 100 },
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
    <GameLayout gameTitle="${title}" gameCategory="${description}">
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

export default ${component_name};
EOF

    echo "Created ${component_name}.tsx"
done

echo "All game components created!"
