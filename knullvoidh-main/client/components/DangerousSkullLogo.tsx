import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const DangerousSkullLogo = ({ className = '' }: { className?: string }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [bloodDrops, setBloodDrops] = useState<Array<{id: number, x: number, delay: number}>>([]);
  const [lightningFlash, setLightningFlash] = useState(false);

  useEffect(() => {
    // Generate random blood drops
    const drops = Array.from({length: 15}, (_, i) => ({
      id: i,
      x: 15 + Math.random() * 70,
      delay: Math.random() * 4
    }));
    setBloodDrops(drops);

    // Random lightning flashes
    const flashInterval = setInterval(() => {
      if (Math.random() < 0.3) {
        setLightningFlash(true);
        setTimeout(() => setLightningFlash(false), 150);
      }
    }, 3000);

    return () => clearInterval(flashInterval);
  }, []);

  return (
    <motion.div
      className={`relative ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={{ scale: 0, rotate: -360, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ 
        duration: 2.5, 
        type: "spring", 
        stiffness: 60,
        delay: 0.5 
      }}
    >
      <motion.svg
        width="160"
        height="160"
        viewBox="0 0 160 160"
        className="filter drop-shadow-2xl"
        animate={{
          rotateY: isHovered ? [0, 360] : 0,
          scale: isHovered ? [1, 1.2, 1] : [1, 1.05, 1],
          filter: lightningFlash ? 'brightness(3) saturate(2)' : 'brightness(1)',
        }}
        transition={{ 
          duration: isHovered ? 1.5 : 3,
          ease: "easeInOut",
          repeat: isHovered ? 0 : Infinity
        }}
      >
        {/* Menacing aura with multiple rings */}
        <motion.circle
          cx="80"
          cy="80"
          r="75"
          fill="none"
          stroke="url(#menacingAura)"
          strokeWidth="4"
          opacity={0.6}
          animate={{
            r: isHovered ? [75, 85, 75] : [75, 78, 75],
            opacity: isHovered ? [0.6, 1, 0.6] : [0.6, 0.8, 0.6],
            strokeWidth: lightningFlash ? 8 : 4,
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        <motion.circle
          cx="80"
          cy="80"
          r="65"
          fill="none"
          stroke="url(#darkAura)"
          strokeWidth="2"
          opacity={0.4}
          animate={{
            r: [65, 68, 65],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
        />

        {/* Main skull structure - more angular and menacing */}
        <motion.path
          d="M35 50 Q35 25 55 20 L105 20 Q125 25 125 50 L125 70 Q125 90 120 100 L110 115 Q100 125 80 125 Q60 125 50 115 L40 100 Q35 90 35 70 Z"
          fill="url(#skullGradient)"
          stroke="#1a1a1a"
          strokeWidth="3"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, delay: 1.5 }}
        />

        {/* Aggressive forehead ridges */}
        <motion.path
          d="M45 35 Q60 30 80 32 Q100 30 115 35 Q110 38 80 40 Q50 38 45 35"
          fill="#d0d0d0"
          stroke="#999999"
          strokeWidth="1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 2.2 }}
        />

        {/* Deep menacing eye sockets - larger and more hollow */}
        <motion.ellipse
          cx="60"
          cy="55"
          rx="12"
          ry="15"
          fill="#000000"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 2.5 }}
        />
        <motion.ellipse
          cx="100"
          cy="55"
          rx="12"
          ry="15"
          fill="#000000"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 2.6 }}
        />

        {/* Fierce glowing red eyes with evil intensity */}
        <motion.circle
          cx="60"
          cy="55"
          r="6"
          fill="#cc0000"
          opacity={0.9}
          animate={{
            opacity: [0.9, 1, 0.9],
            r: [6, 8, 6],
            fill: lightningFlash ? '#ffffff' : '#cc0000',
          }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <motion.circle
          cx="100"
          cy="55"
          r="6"
          fill="#cc0000"
          opacity={0.9}
          animate={{
            opacity: [0.9, 1, 0.9],
            r: [6, 8, 6],
            fill: lightningFlash ? '#ffffff' : '#cc0000',
          }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
        />

        {/* Inner eye flame effect */}
        <motion.circle
          cx="60"
          cy="55"
          r="3"
          fill="#ff6666"
          animate={{
            opacity: [0.8, 1, 0.8],
            r: [3, 4, 3],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.circle
          cx="100"
          cy="55"
          r="3"
          fill="#ff6666"
          animate={{
            opacity: [0.8, 1, 0.8],
            r: [3, 4, 3],
          }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.7 }}
        />

        {/* Evil eye pupils */}
        <motion.circle
          cx="60"
          cy="55"
          r="1.5"
          fill="#000000"
          animate={{
            opacity: [1, 0.5, 1],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.circle
          cx="100"
          cy="55"
          r="1.5"
          fill="#000000"
          animate={{
            opacity: [1, 0.5, 1],
          }}
          transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
        />

        {/* Menacing nasal cavity - more angular */}
        <motion.path
          d="M80 65 L70 80 Q80 85 90 80 L80 65 Z"
          fill="#000000"
          stroke="#660000"
          strokeWidth="2"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.5, delay: 2.8 }}
        />

        {/* Broken, blood-stained jagged teeth */}
        <motion.path d="M65 90 L68 105 L65 105 Z" fill="#f0f0e0" stroke="#990000" strokeWidth="0.5"
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ duration: 0.3, delay: 3.0 }} />
        <motion.path d="M70 88 L74 108 L70 108 Z" fill="#f0f0e0" stroke="#990000" strokeWidth="0.5"
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ duration: 0.3, delay: 3.1 }} />
        <motion.path d="M76 90 L79 105 L76 105 Z" fill="#f0f0e0" stroke="#990000" strokeWidth="0.5"
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ duration: 0.3, delay: 3.2 }} />
        <motion.path d="M82 89 L86 107 L82 107 Z" fill="#f0f0e0" stroke="#990000" strokeWidth="0.5"
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ duration: 0.3, delay: 3.3 }} />
        <motion.path d="M88 91 L91 104 L88 104 Z" fill="#f0f0e0" stroke="#990000" strokeWidth="0.5"
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ duration: 0.3, delay: 3.4 }} />
        <motion.path d="M94 92 L96 103 L94 103 Z" fill="#f0f0e0" stroke="#990000" strokeWidth="0.5"
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ duration: 0.3, delay: 3.5 }} />

        {/* Heavy blood stains on teeth */}
        <motion.rect x="70" y="95" width="4" height="8" fill="#880000" opacity="0.9"
          initial={{ opacity: 0 }} animate={{ opacity: 0.9 }}
          transition={{ duration: 0.5, delay: 3.8 }} />
        <motion.rect x="82" y="96" width="4" height="6" fill="#aa0000" opacity="0.8"
          initial={{ opacity: 0 }} animate={{ opacity: 0.8 }}
          transition={{ duration: 0.5, delay: 4.0 }} />
        <motion.rect x="88" y="98" width="3" height="4" fill="#660000" opacity="0.7"
          initial={{ opacity: 0 }} animate={{ opacity: 0.7 }}
          transition={{ duration: 0.5, delay: 4.1 }} />

        {/* Multiple deep cracks across skull */}
        <motion.path
          d="M95 40 Q92 45 94 50 Q91 55 93 60 Q90 63 92 67"
          fill="none"
          stroke="#330000"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 2.9 }}
        />
        <motion.path
          d="M50 45 Q53 50 51 55 Q54 58 52 62"
          fill="none"
          stroke="#440000"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 3.3 }}
        />
        <motion.path
          d="M80 25 Q78 35 80 45"
          fill="none"
          stroke="#220000"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 3.6 }}
        />

        {/* Blood dripping from multiple points */}
        <motion.path
          d="M60 70 Q58 75 60 80 Q62 85 60 90 Q58 95 60 100"
          fill="none"
          stroke="#990000"
          strokeWidth="3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.5, delay: 4.2 }}
        />
        <motion.path
          d="M100 70 Q102 75 100 80 Q98 85 100 90 Q102 95 100 100"
          fill="none"
          stroke="#990000"
          strokeWidth="3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.5, delay: 4.5 }}
        />
        <motion.path
          d="M80 85 Q78 90 80 95 Q82 100 80 105"
          fill="none"
          stroke="#aa0000"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 4.8 }}
        />

        {/* Blood pools */}
        <motion.ellipse cx="60" cy="102" rx="4" ry="2" fill="#770000"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 5.0 }} />
        <motion.ellipse cx="100" cy="102" rx="4" ry="2" fill="#770000"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 5.2 }} />
        <motion.ellipse cx="80" cy="107" rx="3" ry="1.5" fill="#880000"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 5.4 }} />

        {/* Additional blood splatters around skull */}
        <motion.circle cx="40" cy="70" r="2" fill="#990000" opacity="0.8"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.2, delay: 4.8 }} />
        <motion.circle cx="120" cy="65" r="1.5" fill="#aa0000" opacity="0.7"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.2, delay: 5.1 }} />
        <motion.circle cx="55" cy="25" r="1" fill="#660000" opacity="0.6"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.2, delay: 5.3 }} />
        <motion.circle cx="105" cy="30" r="1.2" fill="#770000" opacity="0.7"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.2, delay: 5.5 }} />

        {/* Floating blood drops around skull */}
        {bloodDrops.map((drop) => (
          <motion.circle
            key={drop.id}
            cx={drop.x}
            cy="15"
            r="1"
            fill="#cc0000"
            opacity={0.7}
            animate={{
              cy: [15, 145],
              opacity: [0.7, 0.9, 0.5, 0],
              r: [1, 1.5, 1, 0.5],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: drop.delay,
              ease: "easeIn"
            }}
          />
        ))}

        {/* Menacing dark energy rings */}
        <motion.circle
          cx="80"
          cy="80"
          r="90"
          fill="none"
          stroke="rgba(204, 0, 0, 0.3)"
          strokeWidth="2"
          opacity={0.4}
          animate={{
            r: [90, 95, 90],
            opacity: [0.4, 0.7, 0.4],
            strokeWidth: [2, 4, 2],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        <motion.circle
          cx="80"
          cy="80"
          r="100"
          fill="none"
          stroke="rgba(153, 0, 0, 0.2)"
          strokeWidth="1"
          opacity={0.3}
          animate={{
            r: [100, 110, 100],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        />

        {/* Gradients and effects */}
        <defs>
          <radialGradient id="menacingAura" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#cc0000" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#990000" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#660000" stopOpacity="0.4" />
          </radialGradient>

          <radialGradient id="darkAura" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#330000" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#660000" stopOpacity="0.2" />
          </radialGradient>

          <linearGradient id="skullGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5f5f5" />
            <stop offset="30%" stopColor="#e0e0e0" />
            <stop offset="70%" stopColor="#c8c8c8" />
            <stop offset="100%" stopColor="#999999" />
          </linearGradient>

          {/* Evil glow filter */}
          <filter id="evilGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Lightning filter */}
          <filter id="lightning" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feColorMatrix values="1.5 0 0 0 0  0 1.5 0 0 0  0 0 2 0 0  0 0 0 1 0"/>
          </filter>
        </defs>
      </motion.svg>

      {/* Floating menacing text */}
      <motion.div
        className="absolute -bottom-4 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? -10 : 10 }}
        transition={{ duration: 0.4 }}
      >
        <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-700 via-red-600 to-red-900 filter drop-shadow-lg">
          LETHAL
        </span>
      </motion.div>

      {/* Blood drip effect on hover */}
      {isHovered && (
        <motion.div
          className="absolute top-full left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 15 }}
          exit={{ opacity: 0, y: 25 }}
          transition={{ duration: 1.5 }}
        >
          <div className="w-2 h-12 bg-gradient-to-b from-red-700 via-red-800 to-transparent rounded-full"></div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DangerousSkullLogo;
