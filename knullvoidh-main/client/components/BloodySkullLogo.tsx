import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const BloodySkullLogo = ({ className = '' }: { className?: string }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [bloodDrops, setBloodDrops] = useState<Array<{id: number, x: number, delay: number}>>([]);

  useEffect(() => {
    // Generate random blood drops
    const drops = Array.from({length: 12}, (_, i) => ({
      id: i,
      x: 20 + Math.random() * 80, // Random x position
      delay: Math.random() * 3 // Random delay
    }));
    setBloodDrops(drops);
  }, []);

  return (
    <motion.div
      className={`relative ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={{ scale: 0, rotate: -180, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ 
        duration: 2, 
        type: "spring", 
        stiffness: 80,
        delay: 0.5 
      }}
    >
      <motion.svg
        width="140"
        height="140"
        viewBox="0 0 140 140"
        className="filter drop-shadow-2xl"
        animate={{
          rotateY: isHovered ? [0, 360] : 0,
          scale: isHovered ? [1, 1.15, 1] : 1,
        }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      >
        {/* Glowing blood aura */}
        <motion.circle
          cx="70"
          cy="70"
          r="65"
          fill="none"
          stroke="url(#bloodGlow)"
          strokeWidth="3"
          opacity={0.4}
          animate={{
            r: isHovered ? [65, 75, 65] : [65, 68, 65],
            opacity: isHovered ? [0.4, 0.8, 0.4] : [0.4, 0.6, 0.4],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Main skull structure */}
        <motion.path
          d="M40 45 Q40 30 50 25 L90 25 Q100 30 100 45 L100 60 Q100 75 95 85 L90 95 Q85 100 70 100 Q55 100 50 95 L45 85 Q40 75 40 60 Z"
          fill="url(#skullGradient)"
          stroke="#2a2a2a"
          strokeWidth="2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, delay: 1.5 }}
        />

        {/* Skull cracks - multiple realistic fractures */}
        <motion.path
          d="M85 35 Q82 38 84 42 Q81 45 83 48 Q80 50 82 53"
          fill="none"
          stroke="#800000"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 2.8 }}
        />
        <motion.path
          d="M92 40 Q89 43 91 46 Q88 48 90 51"
          fill="none"
          stroke="#660000"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 3.2 }}
        />
        <motion.path
          d="M45 50 Q48 53 46 56 Q49 58 47 61"
          fill="none"
          stroke="#4d0000"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 3.5 }}
        />

        {/* Deep, menacing eye sockets */}
        <motion.ellipse
          cx="55"
          cy="50"
          rx="8"
          ry="10"
          fill="#000000"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 2.5 }}
        />
        <motion.ellipse
          cx="85"
          cy="50"
          rx="8"
          ry="10"
          fill="#000000"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 2.6 }}
        />

        {/* Glowing red eyes with blood effect */}
        <motion.circle
          cx="55"
          cy="50"
          r="4"
          fill="#ff0000"
          opacity={0.9}
          animate={{
            opacity: [0.9, 1, 0.9],
            r: [4, 5, 4],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.circle
          cx="85"
          cy="50"
          r="4"
          fill="#ff0000"
          opacity={0.9}
          animate={{
            opacity: [0.9, 1, 0.9],
            r: [4, 5, 4],
          }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        />

        {/* Inner eye glow */}
        <motion.circle
          cx="55"
          cy="50"
          r="2"
          fill="#ffaaaa"
          animate={{
            opacity: [0.8, 1, 0.8],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.circle
          cx="85"
          cy="50"
          r="2"
          fill="#ffaaaa"
          animate={{
            opacity: [0.8, 1, 0.8],
          }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
        />

        {/* Damaged nasal cavity */}
        <motion.path
          d="M70 58 L65 68 Q70 72 75 68 L70 58 Z"
          fill="#000000"
          stroke="#800000"
          strokeWidth="1"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.5, delay: 2.8 }}
        />

        {/* Broken, bloody teeth */}
        <motion.rect x="58" y="78" width="3" height="8" fill="#f5f5dc" rx="1"
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ duration: 0.3, delay: 3.0 }} />
        <motion.rect x="63" y="75" width="3" height="11" fill="#f5f5dc" rx="1"
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ duration: 0.3, delay: 3.1 }} />
        <motion.rect x="68" y="78" width="3" height="8" fill="#f5f5dc" rx="1"
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ duration: 0.3, delay: 3.2 }} />
        <motion.rect x="73" y="76" width="3" height="9" fill="#f5f5dc" rx="1"
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ duration: 0.3, delay: 3.3 }} />
        <motion.rect x="78" y="79" width="2" height="6" fill="#f5f5dc" rx="1"
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ duration: 0.3, delay: 3.4 }} />

        {/* Blood stains on teeth */}
        <motion.rect x="63" y="80" width="3" height="3" fill="#990000" opacity="0.8"
          initial={{ opacity: 0 }} animate={{ opacity: 0.8 }}
          transition={{ duration: 0.5, delay: 3.8 }} />
        <motion.rect x="68" y="82" width="3" height="2" fill="#cc0000" opacity="0.7"
          initial={{ opacity: 0 }} animate={{ opacity: 0.7 }}
          transition={{ duration: 0.5, delay: 4.0 }} />

        {/* Blood dripping from eye sockets */}
        <motion.path
          d="M55 60 Q54 65 55 70 Q56 75 55 80"
          fill="none"
          stroke="#cc0000"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 4.2 }}
        />
        <motion.path
          d="M85 60 Q86 65 85 70 Q84 75 85 80"
          fill="none"
          stroke="#cc0000"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 4.5 }}
        />

        {/* Blood drops at bottom */}
        <motion.circle cx="55" cy="82" r="2" fill="#990000"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 5.0 }} />
        <motion.circle cx="85" cy="82" r="2" fill="#990000"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 5.2 }} />

        {/* Additional blood splatters */}
        <motion.circle cx="45" cy="65" r="1.5" fill="#cc0000" opacity="0.8"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.2, delay: 4.8 }} />
        <motion.circle cx="95" cy="58" r="1" fill="#990000" opacity="0.7"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.2, delay: 5.1 }} />
        <motion.circle cx="52" cy="35" r="1" fill="#800000" opacity="0.6"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.2, delay: 5.3 }} />

        {/* Floating blood particles around skull */}
        {bloodDrops.map((drop) => (
          <motion.circle
            key={drop.id}
            cx={drop.x}
            cy="20"
            r="0.8"
            fill="#cc0000"
            opacity={0.6}
            animate={{
              cy: [20, 120],
              opacity: [0.6, 0.8, 0.3, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: drop.delay,
              ease: "easeIn"
            }}
          />
        ))}

        {/* Menacing shadow/aura around skull */}
        <motion.circle
          cx="70"
          cy="70"
          r="50"
          fill="none"
          stroke="rgba(255, 0, 0, 0.2)"
          strokeWidth="4"
          opacity={0.3}
          animate={{
            r: [50, 55, 50],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Gradients and filters */}
        <defs>
          <radialGradient id="bloodGlow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#ff0000" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#cc0000" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#800000" stopOpacity="0.3" />
          </radialGradient>

          <linearGradient id="skullGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5f5f5" />
            <stop offset="30%" stopColor="#e8e8e8" />
            <stop offset="70%" stopColor="#d0d0d0" />
            <stop offset="100%" stopColor="#a8a8a8" />
          </linearGradient>

          {/* Blood glow filter */}
          <filter id="bloodGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Shadow filter */}
          <filter id="dropshadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.8"/>
          </filter>
        </defs>
      </motion.svg>

      {/* Floating text effect with blood theme */}
      <motion.div
        className="absolute -bottom-3 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? -8 : 10 }}
        transition={{ duration: 0.4 }}
      >
        <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-500 to-red-800">
          BRUTAL
        </span>
      </motion.div>

      {/* Blood drip effect on hover */}
      {isHovered && (
        <motion.div
          className="absolute top-full left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 10 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 1 }}
        >
          <div className="w-1 h-8 bg-gradient-to-b from-red-600 to-transparent rounded-full"></div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BloodySkullLogo;
