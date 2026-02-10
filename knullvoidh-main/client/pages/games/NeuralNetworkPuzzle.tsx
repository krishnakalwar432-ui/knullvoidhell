import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import { Button } from '@/components/ui/button';

interface Node {
  id: number;
  x: number;
  y: number;
  active: boolean;
  type: 'input' | 'hidden' | 'output';
  value: number;
}

interface Connection {
  from: number;
  to: number;
  weight: number;
  active: boolean;
}

const NeuralNetworkPuzzle: React.FC = () => {
  const [gameState, setGameState] = useState<'playing' | 'paused'>('playing');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [nodes, setNodes] = useState<Node[]>([
    { id: 1, x: 100, y: 150, active: false, type: 'input', value: 0 },
    { id: 2, x: 100, y: 250, active: false, type: 'input', value: 0 },
    { id: 3, x: 100, y: 350, active: false, type: 'input', value: 0 },
    { id: 4, x: 300, y: 200, active: false, type: 'hidden', value: 0 },
    { id: 5, x: 300, y: 300, active: false, type: 'hidden', value: 0 },
    { id: 6, x: 500, y: 250, active: false, type: 'output', value: 0 },
  ]);
  const [connections, setConnections] = useState<Connection[]>([
    { from: 1, to: 4, weight: 0.5, active: false },
    { from: 2, to: 4, weight: 0.3, active: false },
    { from: 3, to: 5, weight: 0.7, active: false },
    { from: 4, to: 6, weight: 0.6, active: false },
    { from: 5, to: 6, weight: 0.4, active: false },
  ]);
  const [target, setTarget] = useState(0.8);

  const activateNode = useCallback((nodeId: number) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId && node.type === 'input' 
        ? { ...node, active: !node.active, value: node.active ? 0 : 1 }
        : node
    ));
  }, []);

  const processNetwork = useCallback(() => {
    setNodes(prev => {
      const newNodes = [...prev];
      
      // Reset hidden and output nodes
      newNodes.forEach(node => {
        if (node.type !== 'input') {
          node.value = 0;
          node.active = false;
        }
      });

      // Process connections
      connections.forEach(conn => {
        const fromNode = newNodes.find(n => n.id === conn.from);
        const toNode = newNodes.find(n => n.id === conn.to);
        
        if (fromNode && toNode && fromNode.active) {
          toNode.value += fromNode.value * conn.weight;
        }
      });

      // Activate nodes based on values
      newNodes.forEach(node => {
        if (node.type !== 'input') {
          node.active = node.value > 0.5;
        }
      });

      return newNodes;
    });

    // Check if target reached
    const outputNode = nodes.find(n => n.type === 'output');
    if (outputNode && Math.abs(outputNode.value - target) < 0.1) {
      setScore(prev => prev + 100);
      setLevel(prev => prev + 1);
      setTarget(Math.random() * 0.8 + 0.2);
    }
  }, [connections, nodes, target]);

  const adjustWeight = useCallback((from: number, to: number, delta: number) => {
    setConnections(prev => prev.map(conn => 
      conn.from === from && conn.to === to
        ? { ...conn, weight: Math.max(0, Math.min(1, conn.weight + delta)) }
        : conn
    ));
  }, []);

  const handlePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleReset = () => {
    setScore(0);
    setLevel(1);
    setTarget(0.8);
    setNodes([
      { id: 1, x: 100, y: 150, active: false, type: 'input', value: 0 },
      { id: 2, x: 100, y: 250, active: false, type: 'input', value: 0 },
      { id: 3, x: 100, y: 350, active: false, type: 'input', value: 0 },
      { id: 4, x: 300, y: 200, active: false, type: 'hidden', value: 0 },
      { id: 5, x: 300, y: 300, active: false, type: 'hidden', value: 0 },
      { id: 6, x: 500, y: 250, active: false, type: 'output', value: 0 },
    ]);
    setConnections([
      { from: 1, to: 4, weight: 0.5, active: false },
      { from: 2, to: 4, weight: 0.3, active: false },
      { from: 3, to: 5, weight: 0.7, active: false },
      { from: 4, to: 6, weight: 0.6, active: false },
      { from: 5, to: 6, weight: 0.4, active: false },
    ]);
    setGameState('playing');
  };

  return (
    <GameLayout
      gameTitle="Neural Network Puzzle"
      gameCategory="Puzzle"
      score={score}
      isPlaying={gameState === 'playing'}
      onPause={handlePause}
      onReset={handleReset}
    >
      <div className="min-h-[calc(100vh-64px)] p-4 bg-gradient-to-br from-background/50 to-background">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Network Visualization */}
            <div className="lg:col-span-3">
              <motion.div
                className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-border/50"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <h3 className="text-xl font-bold text-neon-green mb-4">Neural Network</h3>
                
                <svg width="600" height="400" className="border border-border/30 rounded-lg">
                  {/* Connections */}
                  {connections.map((conn, index) => {
                    const fromNode = nodes.find(n => n.id === conn.from);
                    const toNode = nodes.find(n => n.id === conn.to);
                    if (!fromNode || !toNode) return null;
                    
                    return (
                      <g key={index}>
                        <line
                          x1={fromNode.x}
                          y1={fromNode.y}
                          x2={toNode.x}
                          y2={toNode.y}
                          stroke={conn.weight > 0.5 ? '#0aff9d' : '#7000ff'}
                          strokeWidth={conn.weight * 5 + 1}
                          opacity={0.7}
                        />
                        <text
                          x={(fromNode.x + toNode.x) / 2}
                          y={(fromNode.y + toNode.y) / 2 - 10}
                          fill="#ffffff"
                          fontSize="12"
                          textAnchor="middle"
                        >
                          {conn.weight.toFixed(2)}
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* Nodes */}
                  {nodes.map(node => (
                    <g key={node.id}>
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="20"
                        fill={node.active ? '#0aff9d' : '#333'}
                        stroke={node.type === 'input' ? '#ff0099' : node.type === 'output' ? '#ffa500' : '#7000ff'}
                        strokeWidth="3"
                        style={{ cursor: node.type === 'input' ? 'pointer' : 'default' }}
                        onClick={() => node.type === 'input' && activateNode(node.id)}
                      />
                      <text
                        x={node.x}
                        y={node.y + 5}
                        fill="#ffffff"
                        fontSize="12"
                        textAnchor="middle"
                      >
                        {node.value.toFixed(1)}
                      </text>
                      <text
                        x={node.x}
                        y={node.y - 30}
                        fill="#ffffff"
                        fontSize="10"
                        textAnchor="middle"
                      >
                        {node.type.charAt(0).toUpperCase()}
                      </text>
                    </g>
                  ))}
                </svg>
                
                <div className="mt-4 flex justify-center">
                  <Button onClick={processNetwork} className="bg-neon-green/20 text-neon-green">
                    Process Network
                  </Button>
                </div>
              </motion.div>
            </div>

            {/* Controls */}
            <div>
              <motion.div
                className="bg-card/30 backdrop-blur-sm rounded-xl p-4 border border-border/50 mb-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h3 className="text-lg font-bold text-neon-purple mb-4">Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Level:</span>
                    <span className="text-neon-green">{level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Score:</span>
                    <span className="text-neon-purple">{score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target:</span>
                    <span className="text-neon-pink">{target.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Output:</span>
                    <span className="text-yellow-500">
                      {nodes.find(n => n.type === 'output')?.value.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-card/30 backdrop-blur-sm rounded-xl p-4 border border-border/50"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-lg font-bold text-neon-pink mb-4">Weight Controls</h3>
                <div className="space-y-3">
                  {connections.map((conn, index) => {
                    const fromNode = nodes.find(n => n.id === conn.from);
                    const toNode = nodes.find(n => n.id === conn.to);
                    
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-xs">
                          {fromNode?.id}→{toNode?.id}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-6 w-6 p-0"
                            onClick={() => adjustWeight(conn.from, conn.to, -0.1)}
                          >
                            -
                          </Button>
                          <span className="text-xs w-12 text-center">
                            {conn.weight.toFixed(1)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-6 w-6 p-0"
                            onClick={() => adjustWeight(conn.from, conn.to, 0.1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              <div className="mt-6 text-xs text-muted-foreground">
                <h4 className="font-semibold mb-2">How to Play:</h4>
                <ul className="space-y-1">
                  <li>• Click input nodes to activate</li>
                  <li>• Adjust connection weights</li>
                  <li>• Process network to see output</li>
                  <li>• Match target value to score</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default NeuralNetworkPuzzle;
