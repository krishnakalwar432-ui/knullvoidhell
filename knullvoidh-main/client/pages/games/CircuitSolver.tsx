import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';
import { 
  getSafeCanvas2DContext, 
  createSafeAnimationManager, 
  createSafeKeyManager,
  checkCollision,
  clamp,
  distance,
  gameManager
} from '@/utils/universalGameFix';

interface Position {
  x: number;
  y: number;
}

interface CircuitNode extends Position {
  id: string;
  type: 'generator' | 'consumer' | 'junction' | 'switch';
  powered: boolean;
  connections: string[];
  powerLevel: number;
  maxPower: number;
  isOn: boolean; // For switches
  requirement?: number; // For consumers
  output?: number; // For generators
}

interface Wire {
  from: string;
  to: string;
  powered: boolean;
  points: Position[];
}

interface Particle extends Position {
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

const CircuitSolver: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<ReturnType<typeof createSafeAnimationManager> | null>(null);
  const keyHandlerRef = useRef<ReturnType<typeof createSafeKeyManager> | null>(null);

  const [gameState, setGameState] = useState<'menu' | 'playing' | 'levelComplete' | 'gameOver'>('menu');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [mousePos, setMousePos] = useState<Position>({ x: 400, y: 300 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [nodes, setNodes] = useState<CircuitNode[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [powerFlow, setPowerFlow] = useState<Array<{wireId: string, progress: number}>>([]);

  const gameId = 'circuit-solver';
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const NODE_SIZE = 30;

  const createParticles = useCallback((x: number, y: number, color: string, count: number = 10) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1,
        color,
        size: Math.random() * 3 + 2
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const generateLevel = useCallback((levelNum: number) => {
    const newNodes: CircuitNode[] = [];
    const newWires: Wire[] = [];
    
    // Create generators
    const generatorCount = Math.min(2 + Math.floor(levelNum / 3), 4);
    for (let i = 0; i < generatorCount; i++) {
      newNodes.push({
        id: `gen-${i}`,
        x: 100 + i * 150,
        y: 100,
        type: 'generator',
        powered: true,
        connections: [],
        powerLevel: 100,
        maxPower: 100,
        isOn: true,
        output: 50 + levelNum * 10
      });
    }
    
    // Create consumers (buildings to power)
    const consumerCount = 3 + levelNum;
    for (let i = 0; i < consumerCount; i++) {
      newNodes.push({
        id: `cons-${i}`,
        x: 100 + (i % 4) * 180 + Math.random() * 40,
        y: 400 + Math.floor(i / 4) * 80,
        type: 'consumer',
        powered: false,
        connections: [],
        powerLevel: 0,
        maxPower: 100,
        isOn: false,
        requirement: 30 + Math.random() * 40
      });
    }
    
    // Create junctions for complex routing
    const junctionCount = Math.floor(levelNum / 2) + 1;
    for (let i = 0; i < junctionCount; i++) {
      newNodes.push({
        id: `junction-${i}`,
        x: 200 + i * 120 + Math.random() * 80,
        y: 250 + Math.random() * 100,
        type: 'junction',
        powered: false,
        connections: [],
        powerLevel: 0,
        maxPower: 100,
        isOn: true
      });
    }
    
    // Create switches for puzzle elements
    const switchCount = Math.floor(levelNum / 3);
    for (let i = 0; i < switchCount; i++) {
      newNodes.push({
        id: `switch-${i}`,
        x: 300 + i * 100,
        y: 200 + Math.random() * 100,
        type: 'switch',
        powered: false,
        connections: [],
        powerLevel: 0,
        maxPower: 100,
        isOn: false
      });
    }
    
    setNodes(newNodes);
    setWires(newWires);
    setPowerFlow([]);
    setTimeLeft(60 + levelNum * 10);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    
    setMousePos({ x, y });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    
    // Check if clicking on a node
    const clickedNode = nodes.find(node => 
      distance(x, y, node.x, node.y) < NODE_SIZE
    );
    
    if (clickedNode) {
      if (clickedNode.type === 'switch') {
        // Toggle switch
        setNodes(prev => prev.map(node => 
          node.id === clickedNode.id 
            ? { ...node, isOn: !node.isOn }
            : node
        ));
        createParticles(clickedNode.x, clickedNode.y, '#ffff00', 8);
      } else if (selectedNode && selectedNode !== clickedNode.id) {
        // Create wire between selected node and clicked node
        const wireId = `${selectedNode}-${clickedNode.id}`;
        const reverseWireId = `${clickedNode.id}-${selectedNode}`;
        
        // Check if wire already exists
        const wireExists = wires.some(wire => 
          wire.from === selectedNode && wire.to === clickedNode.id ||
          wire.from === clickedNode.id && wire.to === selectedNode
        );
        
        if (!wireExists) {
          const fromNode = nodes.find(n => n.id === selectedNode);
          const toNode = nodes.find(n => n.id === clickedNode.id);
          
          if (fromNode && toNode) {
            setWires(prev => [...prev, {
              from: selectedNode,
              to: clickedNode.id,
              powered: false,
              points: [
                { x: fromNode.x, y: fromNode.y },
                { x: toNode.x, y: toNode.y }
              ]
            }]);
            
            // Update connections
            setNodes(prev => prev.map(node => {
              if (node.id === selectedNode) {
                return { ...node, connections: [...node.connections, clickedNode.id] };
              }
              if (node.id === clickedNode.id) {
                return { ...node, connections: [...node.connections, selectedNode] };
              }
              return node;
            }));
            
            createParticles(toNode.x, toNode.y, '#00ffff', 12);
          }
        }
        setSelectedNode(null);
      } else {
        setSelectedNode(clickedNode.id);
      }
    } else {
      setSelectedNode(null);
    }
  }, [nodes, wires, selectedNode, createParticles]);

  const simulatePowerFlow = useCallback(() => {
    // Reset all power levels
    setNodes(prev => prev.map(node => ({
      ...node,
      powered: node.type === 'generator' && node.isOn,
      powerLevel: node.type === 'generator' && node.isOn ? node.maxPower : 0
    })));
    
    // Propagate power through network
    let changed = true;
    let iterations = 0;
    
    while (changed && iterations < 10) {
      changed = false;
      iterations++;
      
      setNodes(prev => {
        const newNodes = [...prev];
        
        wires.forEach(wire => {
          const fromNode = newNodes.find(n => n.id === wire.from);
          const toNode = newNodes.find(n => n.id === wire.to);
          
          if (fromNode && toNode) {
            // Power flows from higher to lower potential
            if (fromNode.powered && fromNode.powerLevel > 10) {
              if (toNode.type === 'switch' && !toNode.isOn) {
                // Switch blocks power
                return;
              }
              
              if (!toNode.powered || toNode.powerLevel < fromNode.powerLevel - 10) {
                const powerTransfer = Math.min(
                  fromNode.powerLevel * 0.8,
                  toNode.maxPower - toNode.powerLevel
                );
                
                if (powerTransfer > 5) {
                  toNode.powered = true;
                  toNode.powerLevel += powerTransfer;
                  fromNode.powerLevel -= powerTransfer * 0.1; // Small loss in generator
                  changed = true;
                }
              }
            }
          }
        });
        
        return newNodes;
      });
    }
    
    // Update wire power status
    setWires(prev => prev.map(wire => {
      const fromNode = nodes.find(n => n.id === wire.from);
      const toNode = nodes.find(n => n.id === wire.to);
      
      return {
        ...wire,
        powered: (fromNode?.powered && fromNode.powerLevel > 10) || 
                (toNode?.powered && toNode.powerLevel > 10)
      };
    }));
  }, [nodes, wires]);

  const checkWinCondition = useCallback(() => {
    const consumers = nodes.filter(node => node.type === 'consumer');
    const poweredConsumers = consumers.filter(node => 
      node.powered && node.powerLevel >= (node.requirement || 50)
    );
    
    return poweredConsumers.length === consumers.length;
  }, [nodes]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getSafeCanvas2DContext(canvas);
    if (!ctx) return;

    // Clear with electrical grid background
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(0.5, '#002244');
    gradient.addColorStop(1, '#001133');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    if (gameState === 'playing') {
      // Update timer
      setTimeLeft(prev => {
        const newTime = prev - 0.016; // ~60fps
        if (newTime <= 0) {
          setGameState('gameOver');
          return 0;
        }
        return newTime;
      });

      // Simulate power flow
      simulatePowerFlow();

      // Update particles
      setParticles(prev => prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vx: particle.vx * 0.98,
          vy: particle.vy * 0.98,
          life: particle.life - 0.02,
          size: particle.size * 0.99
        }))
        .filter(particle => particle.life > 0)
      );

      // Update power flow animation
      setPowerFlow(prev => {
        const newFlow: Array<{wireId: string, progress: number}> = [];
        
        wires.forEach(wire => {
          if (wire.powered) {
            const existing = prev.find(f => f.wireId === `${wire.from}-${wire.to}`);
            const progress = existing ? (existing.progress + 0.05) % 1 : 0;
            newFlow.push({
              wireId: `${wire.from}-${wire.to}`,
              progress
            });
          }
        });
        
        return newFlow;
      });

      // Check win condition
      if (checkWinCondition()) {
        setGameState('levelComplete');
        setScore(prev => prev + Math.floor(timeLeft * 10) + level * 100);
      }
    }

    // Draw wires
    wires.forEach(wire => {
      const fromNode = nodes.find(n => n.id === wire.from);
      const toNode = nodes.find(n => n.id === wire.to);
      
      if (fromNode && toNode) {
        // Wire body
        ctx.strokeStyle = wire.powered ? '#ffff00' : '#666666';
        ctx.lineWidth = wire.powered ? 4 : 2;
        ctx.shadowColor = wire.powered ? '#ffff00' : 'transparent';
        ctx.shadowBlur = wire.powered ? 10 : 0;
        
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();
        
        // Power flow animation
        if (wire.powered) {
          const flow = powerFlow.find(f => f.wireId === `${wire.from}-${wire.to}`);
          if (flow) {
            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;
            const flowX = fromNode.x + dx * flow.progress;
            const flowY = fromNode.y + dy * flow.progress;
            
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(flowX, flowY, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    });
    ctx.shadowBlur = 0;

    // Draw particles
    particles.forEach(particle => {
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Draw nodes
    nodes.forEach(node => {
      // Node glow effect
      if (node.powered) {
        ctx.shadowColor = node.type === 'generator' ? '#00ff00' : 
                         node.type === 'consumer' ? '#ff0099' : '#ffff00';
        ctx.shadowBlur = 20;
      }
      
      // Node body
      if (node.type === 'generator') {
        ctx.fillStyle = node.powered ? '#00ff00' : '#004400';
        ctx.fillRect(node.x - NODE_SIZE/2, node.y - NODE_SIZE/2, NODE_SIZE, NODE_SIZE);
        
        // Generator symbol
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('G', node.x, node.y + 5);
        
      } else if (node.type === 'consumer') {
        const powerRatio = node.requirement ? node.powerLevel / node.requirement : 0;
        const isPowered = powerRatio >= 1;
        
        ctx.fillStyle = isPowered ? '#ff0099' : '#440022';
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_SIZE/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Power requirement indicator
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_SIZE/2 - 3, 0, Math.PI * 2 * Math.min(powerRatio, 1));
        ctx.stroke();
        
        // Building symbol
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('B', node.x, node.y + 4);
        
      } else if (node.type === 'junction') {
        ctx.fillStyle = node.powered ? '#ffff00' : '#444400';
        ctx.beginPath();
        ctx.moveTo(node.x, node.y - NODE_SIZE/2);
        ctx.lineTo(node.x + NODE_SIZE/2, node.y + NODE_SIZE/2);
        ctx.lineTo(node.x - NODE_SIZE/2, node.y + NODE_SIZE/2);
        ctx.closePath();
        ctx.fill();
        
      } else if (node.type === 'switch') {
        ctx.fillStyle = node.isOn ? (node.powered ? '#00ffff' : '#004444') : '#222222';
        ctx.fillRect(node.x - NODE_SIZE/2, node.y - NODE_SIZE/3, NODE_SIZE, NODE_SIZE/1.5);
        
        // Switch lever
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        const leverY = node.y + (node.isOn ? -8 : 8);
        ctx.moveTo(node.x - 10, leverY);
        ctx.lineTo(node.x + 10, leverY);
        ctx.stroke();
      }
      
      // Selection indicator
      if (selectedNode === node.id) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_SIZE/2 + 8, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Power level text
      if (node.powerLevel > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(Math.floor(node.powerLevel).toString(), node.x, node.y - NODE_SIZE/2 - 5);
      }
    });
    ctx.shadowBlur = 0;

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Level: ${level}`, 10, 25);
    ctx.fillText(`Score: ${score}`, 10, 50);
    ctx.fillText(`Time: ${Math.ceil(timeLeft)}s`, 10, 75);

    // Progress indicator
    const consumers = nodes.filter(node => node.type === 'consumer');
    const poweredConsumers = consumers.filter(node => 
      node.powered && node.powerLevel >= (node.requirement || 50)
    );
    ctx.fillText(`Buildings: ${poweredConsumers.length}/${consumers.length}`, 10, 100);

    // Instructions
    ctx.fillStyle = '#cccccc';
    ctx.font = '14px monospace';
    ctx.fillText('Click nodes to select, click another to connect', 10, CANVAS_HEIGHT - 60);
    ctx.fillText('Click switches to toggle them on/off', 10, CANVAS_HEIGHT - 40);
    ctx.fillText('Power all buildings to complete the level', 10, CANVAS_HEIGHT - 20);

    // Legend
    ctx.fillStyle = '#ffff00';
    ctx.font = '12px monospace';
    ctx.fillText('G = Generator', CANVAS_WIDTH - 150, 25);
    ctx.fillStyle = '#ff0099';
    ctx.fillText('B = Building', CANVAS_WIDTH - 150, 45);
    ctx.fillStyle = '#ffff00';
    ctx.fillText('△ = Junction', CANVAS_WIDTH - 150, 65);
    ctx.fillStyle = '#00ffff';
    ctx.fillText('▬ = Switch', CANVAS_WIDTH - 150, 85);

    // Game state overlays
    if (gameState === 'menu') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#ffff00';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CIRCUIT SOLVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.font = '24px monospace';
      ctx.fillText('Click to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      
      ctx.font = '16px monospace';
      ctx.fillText('Connect generators to buildings with wires', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    } else if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#ff0000';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TIME\'S UP!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.font = '24px monospace';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.fillText('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    } else if (gameState === 'levelComplete') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#00ff00';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LEVEL COMPLETE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.font = '24px monospace';
      ctx.fillText('All buildings powered!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.fillText('Click for next level', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    }

    ctx.textAlign = 'left';
  }, [gameState, nodes, wires, particles, powerFlow, timeLeft, selectedNode, level, score, simulatePowerFlow, checkWinCondition]);

  // Initialize game
  useEffect(() => {
    gameManager.registerGame(gameId);
    
    return () => {
      gameManager.unregisterGame(gameId);
      if (gameLoopRef.current) {
        gameLoopRef.current.stop();
      }
      if (keyHandlerRef.current) {
        keyHandlerRef.current.cleanup();
      }
    };
  }, []);

  // Handle special keys and clicks
  useEffect(() => {
    const handleSpecialKeys = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      if (key === 'r' && gameState === 'gameOver') {
        setGameState('menu');
        setScore(0);
        setLevel(1);
        setSelectedNode(null);
        setNodes([]);
        setWires([]);
        setParticles([]);
        setPowerFlow([]);
      }
      
      if (key === 'escape') {
        setSelectedNode(null);
      }
    };

    const handleClick = () => {
      if (gameState === 'menu') {
        setGameState('playing');
        generateLevel(level);
      } else if (gameState === 'levelComplete') {
        setLevel(prev => prev + 1);
        setGameState('playing');
        generateLevel(level + 1);
      }
    };

    window.addEventListener('keydown', handleSpecialKeys);
    window.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('keydown', handleSpecialKeys);
      window.removeEventListener('click', handleClick);
    };
  }, [gameState, level, generateLevel]);

  // Initialize game loop and input
  useEffect(() => {
    const keyHandler = createSafeKeyManager();
    keyHandlerRef.current = keyHandler;

    const animationManager = createSafeAnimationManager();
    gameLoopRef.current = animationManager;
    animationManager.start(gameLoop);

    return () => {
      animationManager.stop();
      keyHandler.cleanup();
    };
  }, [gameLoop]);

  return (
    <GameLayout 
      gameTitle="Circuit Solver" 
      gameCategory="Connect circuits to power up the city"
      score={gameState === 'playing' ? score : undefined}
    >
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-yellow-500 bg-black rounded-lg shadow-2xl cursor-pointer"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
        />
        <div className="text-center space-y-2">
          <p className="text-gray-300">Click nodes to select • Connect generators to buildings</p>
          <p className="text-gray-400">Power all buildings before time runs out!</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default CircuitSolver;
