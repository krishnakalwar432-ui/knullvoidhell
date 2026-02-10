import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Game } from '@shared/games';
import { Badge } from '@/components/ui/badge';
import { Gamepad2, Smartphone } from 'lucide-react';

interface GameCardProps {
  game: Game;
  index: number;
}

const GameCard: React.FC<GameCardProps> = ({ game, index }) => {
  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: index * 0.05,
        duration: 0.4,
        ease: "easeOut"
      }
    },
    hover: {
      y: -5,
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  const glowVariants = {
    initial: { opacity: 0 },
    hover: { 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      className="group relative"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
      layout={false}
      onAnimationComplete={() => {}}
      onLayoutAnimationStart={() => {}}
      onLayoutAnimationComplete={() => {}}
    >
      <Link to={game.isImplemented ? `/game/${game.id}` : '/coming-soon'}>
        <div
          className="relative bg-card border border-border rounded-xl p-6 overflow-hidden transition-all duration-300 hover:border-primary/50"
          style={{
            background: `linear-gradient(135deg, ${game.color}15 0%, transparent 50%, ${game.color}10 100%)`,
            minHeight: '200px',
            contain: 'layout style'
          }}
        >
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `linear-gradient(135deg, ${game.color}30 0%, transparent 50%, ${game.color}20 100%)`,
              filter: 'blur(10px)',
            }}
            variants={glowVariants}
            initial="initial"
            whileHover="hover"
          />
          
          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gamepad2 
                  className="w-6 h-6 text-primary" 
                  style={{ color: game.color }}
                />
                {game.mobileOptimized && (
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                )}
              </div>
              <Badge
                variant={game.isImplemented ? "default" : "secondary"}
                className={game.isImplemented ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" : ""}
              >
                {game.isImplemented ? "Play Now" : "Coming Soon"}
              </Badge>
            </div>
            
            <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
              {game.title}
            </h3>
            
            <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
              {game.description}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs px-2 py-1 rounded-full bg-secondary/30 text-secondary-foreground">
                {game.category}
              </span>
              <span 
                className="text-xs font-medium"
                style={{ color: game.color }}
              >
                {game.difficulty}
              </span>
            </div>
          </div>
          
          {/* Simple border effect */}
          <div
            className="absolute inset-0 rounded-xl border border-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-300"
            style={{
              borderColor: game.color,
            }}
          />
        </div>
      </Link>
    </motion.div>
  );
};

export default GameCard;
