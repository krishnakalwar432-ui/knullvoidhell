import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Phantom {
  x: number;
  y: number;
  vx: number;
  vy: number;
  health: number;
  stealth: number;
  hacking: number;
  energy: number;
  mode: 'stealth';
}

interface Target {
  x: number;
  y: number;
  type: 'server' | 'guard' | 'camera' | 'terminal';
  health: number;
  hacked: boolean;
  alertLevel: number;
  active: boolean;
}

interface CodeStream {
  x: number;
  y: number;
  characters: string[];
  speed: number;
  color: string;
}

const CodePhantomOps = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());
  
  const [gameState, setGameState] = useState({
    phantom: { 
      x: 100, y: 300, vx: 0, vy: 0, health: 100, stealth: 100, 
      hacking: 0, energy: 100, mode: 'stealth' as const
    },
    targets: [] as Target[],
    codeStreams: [] as CodeStream[],
    hackingProgress: {} as Record<string, number>,
    score: 0,
    mission: 1,
    gameOver: false,
    missionComplete: false,
    detected: false,
    systemAlert: 0
  });

  const createCodeStream = (x: number, y: number) => {
    const characters = '01ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()'.split('');
    const stream: CodeStream = {
      x, y,
      characters: Array(20).fill(0).map(() => characters[Math.floor(Math.random() * characters.length)]),
      speed: 2 + Math.random() * 3,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    };
    
    setGameState(prev => ({
      ...prev,
      codeStreams: [...prev.codeStreams, stream]
    }));
  };

  const spawnTargets = useCallback((mission: number) => {
    const targets: Target[] = [];
    const canvas = canvasRef.current;
    if (!canvas) return targets;

    // Servers
    for (let i = 0; i < 2 + mission; i++) {
      targets.push({
        x: 200 + i * 150,
        y: 150 + Math.random() * 300,
        type: 'server',
        health: 100,
        hacked: false,
        alertLevel: 0,
        active: true
      });
    }

    // Guards
    for (let i = 0; i < mission; i++) {
      targets.push({
        x: 300 + i * 200,
        y: 250 + Math.random() * 200,
        type: 'guard',
        health: 80,
        hacked: false,
        alertLevel: 0,
        active: true
      });
    }

    // Cameras
    for (let i = 0; i < 3; i++) {
      targets.push({
        x: 150 + i * 250,
        y: 100 + Math.random() * 100,
        type: 'camera',
        health: 50,
        hacked: false,
        alertLevel: 0,
        active: true
      });
    }

    return targets;
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.gameOver) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark cyber background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setGameState(prev => {
      const newState = { ...prev };

      // Phantom movement
      const moveSpeed = newState.phantom.mode === 'stealth' ? 3 : 5;
      
      if (keysRef.current.has('a')) {
        newState.phantom.vx = Math.max(-moveSpeed, newState.phantom.vx - 0.5);
      } else if (keysRef.current.has('d')) {
        newState.phantom.vx = Math.min(moveSpeed, newState.phantom.vx + 0.5);
      } else {
        newState.phantom.vx *= 0.8;
      }

      if (keysRef.current.has('w')) {
        newState.phantom.vy = Math.max(-moveSpeed, newState.phantom.vy - 0.5);
      } else if (keysRef.current.has('s')) {
        newState.phantom.vy = Math.min(moveSpeed, newState.phantom.vy + 0.5);
      } else {
        newState.phantom.vy *= 0.8;
      }

      // Mode switching
      if (keysRef.current.has('1')) {
        newState.phantom.mode = 'stealth';
        keysRef.current.delete('1');
      }
      if (keysRef.current.has('2')) {
        newState.phantom.mode = 'stealth';
        keysRef.current.delete('2');
      }
      if (keysRef.current.has('3')) {
        newState.phantom.mode = 'stealth';
        keysRef.current.delete('3');
      }

      // Update position
      newState.phantom.x += newState.phantom.vx;
      newState.phantom.y += newState.phantom.vy;

      // Keep in bounds
      newState.phantom.x = Math.max(20, Math.min(canvas.width - 20, newState.phantom.x));
      newState.phantom.y = Math.max(20, Math.min(canvas.height - 20, newState.phantom.y));

      // Hacking interaction
      if (keysRef.current.has(' ')) {
        newState.targets.forEach((target, index) => {
          const distance = Math.hypot(
            newState.phantom.x - target.x,
            newState.phantom.y - target.y
          );
          
          if (distance < 50 && !target.hacked && newState.phantom.mode === 'stealth') {
            const targetKey = `${target.type}-${index}`;
            
            if (!newState.hackingProgress[targetKey]) {
              newState.hackingProgress[targetKey] = 0;
            }
            
            newState.hackingProgress[targetKey] += 2;
            newState.phantom.energy -= 1;
            
            if (newState.hackingProgress[targetKey] >= 100) {
              target.hacked = true;
              newState.score += target.type === 'server' ? 500 : 
                               target.type === 'guard' ? 300 :
                               target.type === 'camera' ? 200 : 100;
              createCodeStream(target.x, target.y);
              
              if (target.type === 'camera') {
                // Disable camera surveillance
                newState.systemAlert = Math.max(0, newState.systemAlert - 20);
              }
            }
          }
        });
      }

      // Target behavior
      newState.targets = newState.targets.map(target => {
        const updatedTarget = { ...target };
        const phantomDistance = Math.hypot(
          newState.phantom.x - target.x,
          newState.phantom.y - target.y
        );

        if (target.type === 'guard' && !target.hacked) {
          // Guard patrol and detection
          updatedTarget.x += Math.sin(Date.now() * 0.001) * 2;
          
          if (phantomDistance < 80 && newState.phantom.mode !== 'stealth') {
            updatedTarget.alertLevel = Math.min(100, updatedTarget.alertLevel + 3);
            newState.systemAlert = Math.min(100, newState.systemAlert + 2);
            
            if (updatedTarget.alertLevel > 50) {
              newState.detected = true;
            }
          } else {
            updatedTarget.alertLevel = Math.max(0, updatedTarget.alertLevel - 1);
          }
        }

        if (target.type === 'camera' && !target.hacked) {
          // Camera scanning
          if (phantomDistance < 100 && newState.phantom.mode !== 'stealth') {
            newState.systemAlert = Math.min(100, newState.systemAlert + 1);
          }
        }

        return updatedTarget;
      });

      // Update code streams
      newState.codeStreams = newState.codeStreams.map(stream => ({
        ...stream,
        y: stream.y + stream.speed,
        characters: stream.characters.map(() => {
          const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()'.split('');
          return Math.random() < 0.1 ? chars[Math.floor(Math.random() * chars.length)] : stream.characters[0];
        })
      })).filter(stream => stream.y < canvas.height + 200);

      // Spawn random code streams
      if (Math.random() < 0.02) {
        createCodeStream(Math.random() * canvas.width, -20);
      }

      // Mode effects
      switch (newState.phantom.mode) {
        case 'stealth':
          newState.phantom.stealth = Math.min(100, newState.phantom.stealth + 2);
          newState.phantom.energy = Math.min(100, newState.phantom.energy + 0.5);
          break;

      }

      // System alert decay
      if (newState.systemAlert > 0) {
        newState.systemAlert = Math.max(0, newState.systemAlert - 0.5);
      }

      // Mission completion check
      const serversHacked = newState.targets.filter(t => t.type === 'server' && t.hacked).length;
      const totalServers = newState.targets.filter(t => t.type === 'server').length;
      
      if (serversHacked >= totalServers && !newState.missionComplete) {
        newState.missionComplete = true;
      }

      // Failure conditions
      if (newState.systemAlert >= 100 || newState.phantom.energy <= 0) {
        newState.gameOver = true;
      }

      return newState;
    });

    // Draw code streams
    gameState.codeStreams.forEach(stream => {
      ctx.fillStyle = stream.color;
      ctx.font = '12px monospace';
      stream.characters.forEach((char, index) => {
        const alpha = 1 - (index / stream.characters.length);
        ctx.globalAlpha = alpha;
        ctx.fillText(char, stream.x, stream.y - index * 15);
      });
      ctx.globalAlpha = 1;
    });

    // Draw cyber grid
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw targets
    gameState.targets.forEach((target, index) => {
      let color = '#666666';
      let size = 20;
      
      switch (target.type) {
        case 'server':
          color = target.hacked ? '#00ff00' : '#ff6600';
          size = 25;
          break;
        case 'guard':
          color = target.hacked ? '#00ff00' : (target.alertLevel > 50 ? '#ff0099' : '#ffff00');
          size = 15;
          break;
        case 'camera':
          color = target.hacked ? '#00ff00' : '#7000ff';
          size = 12;
          break;
        case 'terminal':
          color = target.hacked ? '#00ff00' : '#0aff9d';
          size = 18;
          break;
      }
      
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      
      if (target.type === 'server') {
        ctx.fillRect(target.x - size/2, target.y - size/2, size, size);
      } else {
        ctx.beginPath();
        ctx.arc(target.x, target.y, size/2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.shadowBlur = 0;
      
      // Hacking progress
      const targetKey = `${target.type}-${index}`;
      const progress = gameState.hackingProgress[targetKey] || 0;
      
      if (progress > 0 && progress < 100) {
        ctx.fillStyle = '#333333';
        ctx.fillRect(target.x - 20, target.y - 30, 40, 6);
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(target.x - 20, target.y - 30, (progress / 100) * 40, 6);
      }
      
      // Alert indicators
      if (target.alertLevel > 0) {
        ctx.strokeStyle = '#ff0099';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(target.x, target.y, size/2 + 5, 0, (target.alertLevel / 100) * Math.PI * 2);
        ctx.stroke();
      }
    });

    // Draw phantom
    let phantomColor = '#ffffff';
    let phantomAlpha = 1;
    
    switch (gameState.phantom.mode) {
      case 'stealth':
        phantomColor = '#00ffff';
        phantomAlpha = 0.6;
        break;

    }
    
    ctx.globalAlpha = phantomAlpha;
    ctx.fillStyle = phantomColor;
    ctx.shadowColor = phantomColor;
    ctx.shadowBlur = 15;
    ctx.fillRect(gameState.phantom.x - 8, gameState.phantom.y - 8, 16, 16);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Mode indicator around phantom
    ctx.strokeStyle = phantomColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(gameState.phantom.x, gameState.phantom.y, 20, 0, Math.PI * 2);
    ctx.stroke();

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Mode: ${gameState.phantom.mode.toUpperCase()}`, 10, 25);
    ctx.fillText(`Energy: ${Math.floor(gameState.phantom.energy)}`, 10, 45);
    ctx.fillText(`Stealth: ${Math.floor(gameState.phantom.stealth)}`, 10, 65);
    ctx.fillText(`Score: ${gameState.score}`, 10, 85);
    ctx.fillText(`Mission: ${gameState.mission}`, 10, 105);
    
    // System alert bar
    ctx.fillText('System Alert:', 10, 130);
    ctx.fillStyle = '#333333';
    ctx.fillRect(130, 115, 100, 10);
    ctx.fillStyle = gameState.systemAlert > 70 ? '#ff0099' : 
                   gameState.systemAlert > 40 ? '#ffff00' : '#00ff00';
    ctx.fillRect(130, 115, gameState.systemAlert, 10);

    // Instructions
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '12px monospace';
    ctx.fillText('WASD: Move | Space: Hack | 1: Stealth | 2: Hack | 3: Combat', 10, canvas.height - 20);

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DETECTED', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px monospace';
      ctx.fillText('Mission Failed', canvas.width / 2, canvas.height / 2 + 40);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 70);
    }

    if (gameState.missionComplete) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00ff00';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('MISSION SUCCESS', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px monospace';
      ctx.fillText('Press N for next mission', canvas.width / 2, canvas.height / 2 + 40);
    }

    ctx.textAlign = 'left';
  }, [gameState, spawnTargets]);

  useEffect(() => {
    setGameState(prev => ({ ...prev, targets: spawnTargets(prev.mission) }));
  }, [spawnTargets]);

  useEffect(() => {
    gameLoopRef.current = setInterval(gameLoop, 1000 / 60);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      
      if (e.key.toLowerCase() === 'r' && gameState.gameOver) {
        setGameState(prev => ({
          ...prev,
          phantom: { 
            x: 100, y: 300, vx: 0, vy: 0, health: 100, stealth: 100, 
            hacking: 0, energy: 100, mode: 'stealth'
          },
          targets: spawnTargets(1),
          hackingProgress: {},
          gameOver: false,
          mission: 1,
          systemAlert: 0,
          detected: false
        }));
      }
      
      if (e.key.toLowerCase() === 'n' && gameState.missionComplete) {
        setGameState(prev => ({
          ...prev,
          mission: prev.mission + 1,
          targets: spawnTargets(prev.mission + 1),
          hackingProgress: {},
          missionComplete: false,
          systemAlert: 0,
          detected: false,
          phantom: {
            ...prev.phantom,
            x: 100,
            y: 300,
            vx: 0,
            vy: 0,
            energy: 100
          }
        }));
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
  }, [gameState.gameOver, gameState.missionComplete, spawnTargets]);

  return (
    <GameLayout gameTitle="Code Phantom Ops" gameCategory="Stealth hacking infiltration missions">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg shadow-2xl"
        />
        <div className="text-center space-y-2">
          <p className="text-gray-300">WASD: Move | Space: Hack | 1: Stealth | 2: Hack | 3: Combat</p>
          <p className="text-gray-400">Infiltrate systems and avoid detection!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default CodePhantomOps;
