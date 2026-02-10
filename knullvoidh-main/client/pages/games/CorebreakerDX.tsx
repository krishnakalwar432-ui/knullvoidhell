import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Core {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  type: 'data' | 'security' | 'quantum' | 'master';
  shields: number;
  rotation: number;
  connections: number[];
  isBreaking: boolean;
  breakProgress: number;
}

interface Virus {
  x: number;
  y: number;
  targetCore: number;
  damage: number;
  speed: number;
  trail: Array<{x: number, y: number}>;
}

interface Firewall {
  x: number;
  y: number;
  radius: number;
  strength: number;
  active: boolean;
}

interface DataStream {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  flow: number;
  color: string;
}

const CorebreakerDX = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef({ x: 0, y: 0, down: false });
  
  const [gameState, setGameState] = useState({
    cores: [] as Core[],
    viruses: [] as Virus[],
    firewalls: [] as Firewall[],
    dataStreams: [] as DataStream[],
    selectedCore: 0,
    hackingPower: 100,
    score: 0,
    level: 1,
    gameOver: false,
    levelComplete: false,
    systemIntegrity: 100,
    virusCount: 0,
    maxViruses: 5
  });

  const createCore = (x: number, y: number, type: Core['type']): Core => {
    let health = 100;
    let shields = 0;
    
    switch (type) {
      case 'security':
        health = 150;
        shields = 50;
        break;
      case 'quantum':
        health = 200;
        shields = 100;
        break;
      case 'master':
        health = 300;
        shields = 150;
        break;
    }
    
    return {
      x, y, health, maxHealth: health, type, shields,
      rotation: 0, connections: [], isBreaking: false, breakProgress: 0
    };
  };

  const createDataStream = (core1: Core, core2: Core): DataStream => {
    const colors = ['#0aff9d', '#7000ff', '#ff0099', '#ff6600'];
    return {
      x1: core1.x,
      y1: core1.y,
      x2: core2.x,
      y2: core2.y,
      flow: Math.random(),
      color: colors[Math.floor(Math.random() * colors.length)]
    };
  };

  const deployVirus = useCallback((targetCore: number) => {
    if (gameState.virusCount >= gameState.maxViruses || gameState.hackingPower < 20) return;
    
    setGameState(prev => {
      if (prev.virusCount >= prev.maxViruses) return prev;
      
      const virus: Virus = {
        x: prev.cores[prev.selectedCore]?.x || 400,
        y: prev.cores[prev.selectedCore]?.y || 300,
        targetCore,
        damage: 25,
        speed: 2,
        trail: []
      };
      
      return {
        ...prev,
        viruses: [...prev.viruses, virus],
        hackingPower: prev.hackingPower - 20,
        virusCount: prev.virusCount + 1
      };
    });
  }, [gameState.virusCount, gameState.maxViruses, gameState.hackingPower, gameState.selectedCore]);

  const initializeLevel = useCallback(() => {
    const cores: Core[] = [];
    const level = gameState.level;
    
    // Create cores in network topology
    const coreCount = Math.min(8, 4 + level);
    const masterCoreIndex = coreCount - 1;
    
    for (let i = 0; i < coreCount; i++) {
      const angle = (i / coreCount) * Math.PI * 2;
      const radius = 200 + (i % 2) * 100;
      
      let type: Core['type'] = 'data';
      if (i === masterCoreIndex) type = 'master';
      else if (i % 3 === 0 && level > 2) type = 'security';
      else if (i % 4 === 0 && level > 4) type = 'quantum';
      
      cores.push(createCore(
        400 + Math.cos(angle) * radius,
        300 + Math.sin(angle) * radius,
        type
      ));
    }
    
    // Create connections between cores
    cores.forEach((core, index) => {
      const nextIndex = (index + 1) % cores.length;
      core.connections.push(nextIndex);
      if (index < cores.length - 1) {
        cores[nextIndex].connections.push(index);
      }
    });
    
    // Create data streams
    const dataStreams: DataStream[] = [];
    cores.forEach((core, index) => {
      core.connections.forEach(connIndex => {
        if (index < connIndex) { // Avoid duplicate streams
          dataStreams.push(createDataStream(core, cores[connIndex]));
        }
      });
    });
    
    // Create firewalls
    const firewalls: Firewall[] = [];
    for (let i = 0; i < level; i++) {
      firewalls.push({
        x: 200 + Math.random() * 400,
        y: 150 + Math.random() * 300,
        radius: 50 + Math.random() * 30,
        strength: 80 + Math.random() * 40,
        active: true
      });
    }
    
    setGameState(prev => ({
      ...prev,
      cores,
      dataStreams,
      firewalls,
      viruses: [],
      selectedCore: 0,
      hackingPower: 100,
      gameOver: false,
      levelComplete: false,
      systemIntegrity: 100,
      virusCount: 0,
      maxViruses: 3 + level
    }));
  }, [gameState.level]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.gameOver) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with cyber matrix background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#000811');
    gradient.addColorStop(0.5, '#001122');
    gradient.addColorStop(1, '#000033');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setGameState(prev => {
      const newState = { ...prev };

      // Handle core selection
      if (keysRef.current.has('1') && newState.cores[0]) newState.selectedCore = 0;
      if (keysRef.current.has('2') && newState.cores[1]) newState.selectedCore = 1;
      if (keysRef.current.has('3') && newState.cores[2]) newState.selectedCore = 2;
      if (keysRef.current.has('4') && newState.cores[3]) newState.selectedCore = 3;
      if (keysRef.current.has('5') && newState.cores[4]) newState.selectedCore = 4;
      if (keysRef.current.has('6') && newState.cores[5]) newState.selectedCore = 5;
      if (keysRef.current.has('7') && newState.cores[6]) newState.selectedCore = 6;
      if (keysRef.current.has('8') && newState.cores[7]) newState.selectedCore = 7;

      // Virus deployment
      if (mouseRef.current.down) {
        // Find closest core to mouse
        let closestCore = 0;
        let minDistance = Infinity;
        
        newState.cores.forEach((core, index) => {
          const distance = Math.hypot(
            mouseRef.current.x - core.x,
            mouseRef.current.y - core.y
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestCore = index;
          }
        });
        
        if (minDistance < 100) {
          deployVirus(closestCore);
          mouseRef.current.down = false;
        }
      }

      // Update cores
      newState.cores = newState.cores.map((core, index) => {
        const updatedCore = { ...core };
        updatedCore.rotation += 0.02;
        
        // Breaking animation
        if (updatedCore.isBreaking) {
          updatedCore.breakProgress += 2;
          if (updatedCore.breakProgress >= 100) {
            updatedCore.health = 0;
            updatedCore.shields = 0;
          }
        }
        
        // Shield regeneration for security cores
        if (updatedCore.type === 'security' && updatedCore.shields < 50) {
          updatedCore.shields = Math.min(50, updatedCore.shields + 0.5);
        }
        
        return updatedCore;
      });

      // Update viruses
      newState.viruses = newState.viruses.filter(virus => {
        const targetCore = newState.cores[virus.targetCore];
        
        if (!targetCore || targetCore.health <= 0) {
          newState.virusCount--;
          return false;
        }
        
        // Move towards target
        const dx = targetCore.x - virus.x;
        const dy = targetCore.y - virus.y;
        const distance = Math.hypot(dx, dy);
        
        // Update trail
        virus.trail.push({ x: virus.x, y: virus.y });
        if (virus.trail.length > 10) {
          virus.trail.shift();
        }
        
        if (distance < 5) {
          // Virus reached target
          if (targetCore.shields > 0) {
            targetCore.shields = Math.max(0, targetCore.shields - virus.damage);
          } else {
            targetCore.health = Math.max(0, targetCore.health - virus.damage);
            
            if (targetCore.health <= 0 && !targetCore.isBreaking) {
              targetCore.isBreaking = true;
              newState.score += targetCore.type === 'master' ? 1000 : 
                               targetCore.type === 'quantum' ? 500 :
                               targetCore.type === 'security' ? 300 : 100;
            }
          }
          
          newState.virusCount--;
          return false;
        }
        
        // Check firewall collisions
        let blocked = false;
        newState.firewalls.forEach(firewall => {
          if (firewall.active) {
            const firewallDist = Math.hypot(virus.x - firewall.x, virus.y - firewall.y);
            if (firewallDist < firewall.radius) {
              firewall.strength -= 10;
              if (firewall.strength <= 0) {
                firewall.active = false;
                newState.score += 50;
              } else {
                blocked = true;
              }
            }
          }
        });
        
        if (!blocked) {
          virus.x += (dx / distance) * virus.speed;
          virus.y += (dy / distance) * virus.speed;
        }
        
        return true;
      });

      // Update data streams
      newState.dataStreams = newState.dataStreams.map(stream => ({
        ...stream,
        flow: (stream.flow + 0.05) % 1
      }));

      // Check level completion (master core destroyed)
      const masterCore = newState.cores.find(core => core.type === 'master');
      if (masterCore && masterCore.health <= 0) {
        newState.levelComplete = true;
      }

      // Regenerate hacking power
      if (newState.hackingPower < 100) {
        newState.hackingPower = Math.min(100, newState.hackingPower + 0.3);
      }

      // Update system integrity
      const aliveCores = newState.cores.filter(core => core.health > 0).length;
      newState.systemIntegrity = (aliveCores / newState.cores.length) * 100;

      return newState;
    });

    // Draw matrix grid
    ctx.strokeStyle = 'rgba(0, 255, 153, 0.15)';
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

    // Draw data streams
    gameState.dataStreams.forEach(stream => {
      ctx.strokeStyle = stream.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6;
      
      // Animated flow
      ctx.setLineDash([10, 10]);
      ctx.lineDashOffset = -stream.flow * 20;
      
      ctx.beginPath();
      ctx.moveTo(stream.x1, stream.y1);
      ctx.lineTo(stream.x2, stream.y2);
      ctx.stroke();
      
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    });

    // Draw firewalls
    gameState.firewalls.forEach(firewall => {
      if (firewall.active) {
        const alpha = firewall.strength / 120;
        ctx.globalAlpha = alpha;
        
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.arc(firewall.x, firewall.y, firewall.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        
        // Firewall strength indicator
        ctx.fillStyle = '#ff6600';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(Math.floor(firewall.strength).toString(), firewall.x, firewall.y + 3);
      }
    });

    // Draw virus trails
    gameState.viruses.forEach(virus => {
      virus.trail.forEach((point, index) => {
        const alpha = (index + 1) / virus.trail.length * 0.5;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ff0099';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    });

    // Draw viruses
    gameState.viruses.forEach(virus => {
      ctx.fillStyle = '#ff0099';
      ctx.shadowColor = '#ff0099';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(virus.x, virus.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw cores
    gameState.cores.forEach((core, index) => {
      if (core.health <= 0) return;
      
      const isSelected = index === gameState.selectedCore;
      let coreColor = '#0aff9d';
      let size = 25;
      
      switch (core.type) {
        case 'security':
          coreColor = '#ff6600';
          size = 30;
          break;
        case 'quantum':
          coreColor = '#7000ff';
          size = 35;
          break;
        case 'master':
          coreColor = '#ff0099';
          size = 40;
          break;
      }
      
      // Core breaking effect
      if (core.isBreaking) {
        ctx.globalAlpha = 1 - (core.breakProgress / 100) * 0.7;
        size += Math.sin(core.breakProgress * 0.2) * 5;
      }
      
      // Core body
      ctx.fillStyle = coreColor;
      ctx.shadowColor = coreColor;
      ctx.shadowBlur = 20;
      
      ctx.save();
      ctx.translate(core.x, core.y);
      ctx.rotate(core.rotation);
      
      // Draw core shape based on type
      if (core.type === 'master') {
        // Hexagon for master core
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const x = Math.cos(angle) * size;
          const y = Math.sin(angle) * size;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        // Circle for other cores
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
      ctx.shadowBlur = 0;
      
      // Shield indicator
      if (core.shields > 0) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(core.x, core.y, size + 8, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Selection indicator
      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(core.x, core.y, size + 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      ctx.globalAlpha = 1;
      
      // Core info
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${index + 1}`, core.x, core.y - size - 10);
      
      // Health bar
      const healthPercent = core.health / core.maxHealth;
      ctx.fillStyle = '#333333';
      ctx.fillRect(core.x - 20, core.y + size + 10, 40, 4);
      ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
      ctx.fillRect(core.x - 20, core.y + size + 10, 40 * healthPercent, 4);
    });

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Level: ${gameState.level}`, 10, 25);
    ctx.fillText(`Score: ${gameState.score}`, 10, 45);
    ctx.fillText(`Hacking Power: ${Math.floor(gameState.hackingPower)}`, 10, 65);
    ctx.fillText(`Viruses: ${gameState.virusCount}/${gameState.maxViruses}`, 10, 85);
    ctx.fillText(`System Integrity: ${Math.floor(gameState.systemIntegrity)}%`, 10, 105);

    // Selected core info
    if (gameState.cores[gameState.selectedCore]) {
      const core = gameState.cores[gameState.selectedCore];
      ctx.fillText(`Selected: Core ${gameState.selectedCore + 1} (${core.type.toUpperCase()})`, 10, 130);
      ctx.fillText(`Health: ${Math.floor(core.health)}/${core.maxHealth}`, 10, 150);
      if (core.shields > 0) {
        ctx.fillText(`Shields: ${Math.floor(core.shields)}`, 10, 170);
      }
    }

    // Instructions
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '12px monospace';
    ctx.fillText('1-8: Select Core | Mouse: Deploy Virus | Break the Master Core!', 10, canvas.height - 20);

    if (gameState.levelComplete) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0aff9d';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CORE BREACHED', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px monospace';
      ctx.fillText('Press N for next level', canvas.width / 2, canvas.height / 2 + 40);
    }

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SYSTEM SECURE', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px monospace';
      ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 40);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 70);
    }

    ctx.textAlign = 'left';
  }, [gameState, deployVirus]);

  useEffect(() => {
    initializeLevel();
  }, [initializeLevel]);

  useEffect(() => {
    if (!gameState.gameOver) {
      gameLoopRef.current = setInterval(gameLoop, 1000 / 60);
    }
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameLoop, gameState.gameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.add(key);
      
      if (key === 'r' && gameState.gameOver) {
        setGameState(prev => ({ ...prev, level: 1 }));
        initializeLevel();
      }
      
      if (key === 'n' && gameState.levelComplete) {
        setGameState(prev => ({ ...prev, level: prev.level + 1, levelComplete: false }));
        initializeLevel();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    const handleMouseDown = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        mouseRef.current.x = e.clientX - rect.left;
        mouseRef.current.y = e.clientY - rect.top;
        mouseRef.current.down = true;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    if (canvasRef.current) {
      canvasRef.current.addEventListener('mousedown', handleMouseDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('mousedown', handleMouseDown);
      }
    };
  }, [gameState.gameOver, gameState.levelComplete, initializeLevel]);

  return (
    <GameLayout 
      gameTitle="Corebreaker DX"
      gameCategory="Break through digital cores"
    >
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 bg-black rounded-lg shadow-2xl"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        <div className="text-center space-y-2">
          <p className="text-gray-300">1-8: Select Core | Mouse: Deploy Virus</p>
          <p className="text-gray-400">Break through firewalls and destroy the master core!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default CorebreakerDX;
