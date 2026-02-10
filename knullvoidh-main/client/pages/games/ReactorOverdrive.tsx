import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';

interface Reactor {
  id: number;
  x: number;
  y: number;
  temperature: number;
  pressure: number;
  output: number;
  stability: number;
  coolantFlow: number;
  rodPosition: number;
  isOverheating: boolean;
  isCritical: boolean;
}

interface Alert {
  id: number;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  time: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

const ReactorOverdrive = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysRef = useRef<Set<string>>(new Set());
  
  const [gameState, setGameState] = useState({
    reactors: [] as Reactor[],
    selectedReactor: 0,
    alerts: [] as Alert[],
    particles: [] as Particle[],
    score: 0,
    powerOutput: 0,
    emergencyShutdown: false,
    gameOver: false,
    level: 1,
    time: 0,
    targetOutput: 1000,
    safetyRating: 100
  });

  const addAlert = (message: string, severity: Alert['severity']) => {
    const newAlert: Alert = {
      id: Date.now(),
      message,
      severity,
      time: Date.now()
    };
    
    setGameState(prev => ({
      ...prev,
      alerts: [...prev.alerts, newAlert].slice(-10) // Keep only last 10 alerts
    }));
  };

  const addParticles = (x: number, y: number, color: string, count: number = 8) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 30 + Math.random() * 30,
        color,
        size: 2 + Math.random() * 4
      });
    }
    setGameState(prev => ({
      ...prev,
      particles: [...prev.particles, ...newParticles]
    }));
  };

  const initializeGame = useCallback(() => {
    const reactors: Reactor[] = [];
    const numReactors = Math.min(6, 2 + gameState.level);
    
    for (let i = 0; i < numReactors; i++) {
      const angle = (i / numReactors) * Math.PI * 2;
      const radius = 150;
      
      reactors.push({
        id: i,
        x: 400 + Math.cos(angle) * radius,
        y: 300 + Math.sin(angle) * radius,
        temperature: 300 + Math.random() * 100, // Normal operating temp
        pressure: 1.0 + Math.random() * 0.5,
        output: 100 + Math.random() * 50,
        stability: 80 + Math.random() * 20,
        coolantFlow: 50 + Math.random() * 30,
        rodPosition: 50 + Math.random() * 20,
        isOverheating: false,
        isCritical: false
      });
    }
    
    setGameState(prev => ({
      ...prev,
      reactors,
      selectedReactor: 0,
      alerts: [],
      particles: [],
      emergencyShutdown: false,
      gameOver: false,
      time: 0,
      targetOutput: 1000 + prev.level * 500,
      safetyRating: 100
    }));
  }, [gameState.level]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.gameOver) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with reactor facility background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(0.5, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setGameState(prev => {
      const newState = { ...prev };
      newState.time += 1;

      // Handle reactor selection
      if (keysRef.current.has('1')) newState.selectedReactor = 0;
      if (keysRef.current.has('2')) newState.selectedReactor = 1;
      if (keysRef.current.has('3')) newState.selectedReactor = 2;
      if (keysRef.current.has('4')) newState.selectedReactor = 3;
      if (keysRef.current.has('5')) newState.selectedReactor = 4;
      if (keysRef.current.has('6')) newState.selectedReactor = 5;

      const selectedReactor = newState.reactors[newState.selectedReactor];
      
      if (selectedReactor) {
        // Control rod position (affects temperature and output)
        if (keysRef.current.has('ArrowUp') || keysRef.current.has('w')) {
          selectedReactor.rodPosition = Math.min(100, selectedReactor.rodPosition + 1);
        }
        if (keysRef.current.has('ArrowDown') || keysRef.current.has('s')) {
          selectedReactor.rodPosition = Math.max(0, selectedReactor.rodPosition - 1);
        }
        
        // Coolant flow control
        if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) {
          selectedReactor.coolantFlow = Math.max(0, selectedReactor.coolantFlow - 1);
        }
        if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) {
          selectedReactor.coolantFlow = Math.min(100, selectedReactor.coolantFlow + 1);
        }
      }

      // Emergency shutdown
      if (keysRef.current.has(' ')) {
        newState.emergencyShutdown = !newState.emergencyShutdown;
        keysRef.current.delete(' ');
        
        if (newState.emergencyShutdown) {
          addAlert('EMERGENCY SHUTDOWN ACTIVATED', 'critical');
          newState.reactors.forEach(reactor => {
            reactor.rodPosition = 0;
            reactor.coolantFlow = 100;
          });
        } else {
          addAlert('EMERGENCY SHUTDOWN DEACTIVATED', 'medium');
        }
      }

      // Update each reactor
      newState.reactors = newState.reactors.map(reactor => {
        const updatedReactor = { ...reactor };
        
        if (!newState.emergencyShutdown) {
          // Rod position affects neutron flux and temperature
          const neutronFlux = (updatedReactor.rodPosition / 100) * 1.5;
          
          // Temperature calculations
          const heatGeneration = neutronFlux * (100 + Math.random() * 50);
          const cooling = (updatedReactor.coolantFlow / 100) * 80;
          updatedReactor.temperature += (heatGeneration - cooling) * 0.1;
          
          // Pressure is affected by temperature
          updatedReactor.pressure = 1.0 + (updatedReactor.temperature - 300) * 0.01;
          
          // Power output calculation
          updatedReactor.output = neutronFlux * 200 * (updatedReactor.temperature / 400);
          
          // Stability affected by operating conditions
          const tempFactor = Math.abs(updatedReactor.temperature - 350) / 100;
          const pressureFactor = Math.abs(updatedReactor.pressure - 1.2) * 50;
          updatedReactor.stability = Math.max(0, 100 - tempFactor * 20 - pressureFactor);
          
          // Check for critical conditions
          updatedReactor.isOverheating = updatedReactor.temperature > 600;
          updatedReactor.isCritical = updatedReactor.temperature > 800 || 
                                     updatedReactor.pressure > 3.0 || 
                                     updatedReactor.stability < 20;
          
          // Random events based on stability
          if (Math.random() < (100 - updatedReactor.stability) / 1000) {
            const events = [
              'Coolant leak detected',
              'Control rod malfunction',
              'Pressure spike',
              'Temperature fluctuation',
              'Neutron flux anomaly'
            ];
            const event = events[Math.floor(Math.random() * events.length)];
            addAlert(`Reactor ${reactor.id + 1}: ${event}`, 'medium');
            
            // Apply random effect
            switch (event) {
              case 'Coolant leak detected':
                updatedReactor.coolantFlow *= 0.8;
                break;
              case 'Control rod malfunction':
                updatedReactor.rodPosition += (Math.random() - 0.5) * 20;
                break;
              case 'Pressure spike':
                updatedReactor.pressure += 0.5;
                break;
              case 'Temperature fluctuation':
                updatedReactor.temperature += (Math.random() - 0.5) * 100;
                break;
            }
          }
          
          // Critical alerts
          if (updatedReactor.isCritical && Math.random() < 0.1) {
            addAlert(`REACTOR ${reactor.id + 1} CRITICAL!`, 'critical');
            addParticles(updatedReactor.x, updatedReactor.y, '#ff0099', 15);
          }
          
          // Meltdown check
          if (updatedReactor.temperature > 1000) {
            newState.gameOver = true;
            addAlert('REACTOR MELTDOWN! GAME OVER!', 'critical');
          }
        } else {
          // Emergency shutdown - gradually cool down
          updatedReactor.temperature = Math.max(200, updatedReactor.temperature - 5);
          updatedReactor.pressure = Math.max(0.5, updatedReactor.pressure - 0.05);
          updatedReactor.output = Math.max(0, updatedReactor.output - 10);
          updatedReactor.stability = Math.min(100, updatedReactor.stability + 2);
          updatedReactor.isOverheating = false;
          updatedReactor.isCritical = false;
        }

        return updatedReactor;
      });

      // Calculate total power output
      newState.powerOutput = newState.reactors.reduce((total, reactor) => total + reactor.output, 0);
      
      // Calculate safety rating
      const avgStability = newState.reactors.reduce((sum, r) => sum + r.stability, 0) / newState.reactors.length;
      const criticalCount = newState.reactors.filter(r => r.isCritical).length;
      newState.safetyRating = Math.max(0, avgStability - criticalCount * 20);
      
      // Score calculation
      if (!newState.emergencyShutdown && newState.powerOutput > newState.targetOutput * 0.8) {
        newState.score += Math.floor(newState.powerOutput / 10);
      }
      
      // Level completion check
      if (newState.powerOutput >= newState.targetOutput && newState.safetyRating > 60 && newState.time > 1800) {
        // Level complete
        newState.level++;
        addAlert('LEVEL COMPLETE! INCREASING DIFFICULTY', 'medium');
        setTimeout(() => initializeGame(), 2000);
      }

      // Update particles
      newState.particles = newState.particles.map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        vx: particle.vx * 0.98,
        vy: particle.vy * 0.98,
        life: particle.life - 1,
        size: particle.size * 0.98
      })).filter(particle => particle.life > 0);

      // Age alerts
      newState.alerts = newState.alerts.filter(alert => Date.now() - alert.time < 10000);

      return newState;
    });

    // Draw control room grid
    ctx.strokeStyle = 'rgba(0, 255, 153, 0.2)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw particles (steam, sparks, etc.)
    gameState.particles.forEach(particle => {
      ctx.globalAlpha = particle.life / 60;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Draw reactors
    gameState.reactors.forEach((reactor, index) => {
      const isSelected = index === gameState.selectedReactor;
      
      // Reactor core
      let coreColor = '#0aff9d';
      if (reactor.isCritical) coreColor = '#ff0099';
      else if (reactor.isOverheating) coreColor = '#ff6600';
      else if (reactor.output > 200) coreColor = '#ffff00';
      
      ctx.fillStyle = coreColor;
      ctx.shadowColor = coreColor;
      ctx.shadowBlur = reactor.isCritical ? 30 : 15;
      
      const pulseSize = 30 + Math.sin(gameState.time * 0.1) * (reactor.output / 50);
      ctx.beginPath();
      ctx.arc(reactor.x, reactor.y, pulseSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Selection indicator
      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(reactor.x, reactor.y, 50, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      // Reactor ID
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`R${index + 1}`, reactor.x, reactor.y - 60);
      
      // Temperature indicator
      const tempColor = reactor.temperature > 700 ? '#ff0099' : 
                       reactor.temperature > 500 ? '#ff6600' : '#0aff9d';
      ctx.fillStyle = tempColor;
      ctx.fillRect(reactor.x - 15, reactor.y + 40, 30, 4);
      
      // Coolant pipes
      ctx.strokeStyle = 'rgba(0, 153, 255, 0.6)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(reactor.x, reactor.y, 35, 0, Math.PI * 2);
      ctx.stroke();
      
      // Control rods visual
      const rodHeight = (reactor.rodPosition / 100) * 20;
      ctx.fillStyle = '#666666';
      ctx.fillRect(reactor.x - 2, reactor.y - 25, 4, rodHeight);
    });

    // Draw central control station
    ctx.fillStyle = 'rgba(112, 0, 255, 0.3)';
    ctx.fillRect(350, 250, 100, 100);
    ctx.strokeStyle = '#7000ff';
    ctx.strokeRect(350, 250, 100, 100);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CONTROL', 400, 295);
    ctx.fillText('STATION', 400, 310);

    // UI - Main display
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 10, 300, 200);
    ctx.strokeStyle = '#0aff9d';
    ctx.strokeRect(10, 10, 300, 200);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('REACTOR CONTROL SYSTEM', 20, 30);
    ctx.fillText(`Level: ${gameState.level}`, 20, 50);
    ctx.fillText(`Score: ${gameState.score}`, 20, 70);
    ctx.fillText(`Power Output: ${Math.floor(gameState.powerOutput)}MW`, 20, 90);
    ctx.fillText(`Target: ${gameState.targetOutput}MW`, 20, 110);
    ctx.fillText(`Safety Rating: ${Math.floor(gameState.safetyRating)}%`, 20, 130);
    ctx.fillText(`Time: ${Math.floor(gameState.time / 60)}:${(gameState.time % 60).toString().padStart(2, '0')}`, 20, 150);
    
    if (gameState.emergencyShutdown) {
      ctx.fillStyle = '#ff0099';
      ctx.fillText('EMERGENCY SHUTDOWN ACTIVE', 20, 170);
    }

    // Selected reactor details
    if (gameState.reactors[gameState.selectedReactor]) {
      const reactor = gameState.reactors[gameState.selectedReactor];
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(canvas.width - 220, 10, 210, 180);
      ctx.strokeStyle = '#0aff9d';
      ctx.strokeRect(canvas.width - 220, 10, 210, 180);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px monospace';
      ctx.fillText(`REACTOR ${gameState.selectedReactor + 1}`, canvas.width - 210, 30);
      ctx.fillText(`Temp: ${Math.floor(reactor.temperature)}°C`, canvas.width - 210, 50);
      ctx.fillText(`Pressure: ${reactor.pressure.toFixed(2)} atm`, canvas.width - 210, 70);
      ctx.fillText(`Output: ${Math.floor(reactor.output)}MW`, canvas.width - 210, 90);
      ctx.fillText(`Stability: ${Math.floor(reactor.stability)}%`, canvas.width - 210, 110);
      ctx.fillText(`Coolant: ${Math.floor(reactor.coolantFlow)}%`, canvas.width - 210, 130);
      ctx.fillText(`Rods: ${Math.floor(reactor.rodPosition)}%`, canvas.width - 210, 150);
      
      // Status indicators
      if (reactor.isCritical) {
        ctx.fillStyle = '#ff0099';
        ctx.fillText('CRITICAL!', canvas.width - 210, 170);
      } else if (reactor.isOverheating) {
        ctx.fillStyle = '#ff6600';
        ctx.fillText('OVERHEATING', canvas.width - 210, 170);
      } else {
        ctx.fillStyle = '#0aff9d';
        ctx.fillText('NOMINAL', canvas.width - 210, 170);
      }
    }

    // Alerts panel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, canvas.height - 150, canvas.width - 20, 140);
    ctx.strokeStyle = '#ff6600';
    ctx.strokeRect(10, canvas.height - 150, canvas.width - 20, 140);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.fillText('ALERTS:', 20, canvas.height - 130);
    
    gameState.alerts.slice(-8).forEach((alert, index) => {
      let color = '#ffffff';
      switch (alert.severity) {
        case 'critical': color = '#ff0099'; break;
        case 'high': color = '#ff6600'; break;
        case 'medium': color = '#ffff00'; break;
        case 'low': color = '#0aff9d'; break;
      }
      
      ctx.fillStyle = color;
      ctx.fillText(alert.message, 20, canvas.height - 110 + index * 12);
    });

    // Controls help
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '10px monospace';
    ctx.fillText('1-6: Select Reactor | WASD/Arrows: Control Rods/Coolant | Space: Emergency Shutdown', 20, canvas.height - 20);

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0099';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('REACTOR MELTDOWN', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px monospace';
      ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 40);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 70);
    }

    ctx.textAlign = 'left';
  }, [gameState, initializeGame]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

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
      keysRef.current.add(e.key.toLowerCase());
      
      if (e.key.toLowerCase() === 'r' && gameState.gameOver) {
        setGameState(prev => ({ ...prev, level: 1 }));
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

  return (
    <GameLayout 
      gameTitle="Reactor Overdrive"
      gameCategory="Manage nuclear reactors under pressure"
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
          <p className="text-gray-300">1-6: Select Reactor | WASD/Arrows: Control Rods/Coolant | Space: Emergency Shutdown</p>
          <p className="text-gray-400">Maintain power output while keeping reactors safe!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default ReactorOverdrive;
