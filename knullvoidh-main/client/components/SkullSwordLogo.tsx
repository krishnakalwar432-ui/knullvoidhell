import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const SkullSwordLogo = ({ className = '' }: { className?: string }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`relative ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ 
        duration: 1.5, 
        type: "spring", 
        stiffness: 100,
        delay: 0.5 
      }}
    >
      <motion.svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        className="filter drop-shadow-lg"
        animate={{
          rotateY: isHovered ? 360 : 0,
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        {/* Glowing background circle */}
        <motion.circle
          cx="60"
          cy="60"
          r="55"
          fill="none"
          stroke="url(#skullGlow)"
          strokeWidth="2"
          opacity={0.6}
          animate={{
            r: isHovered ? [55, 58, 55] : 55,
            opacity: isHovered ? [0.6, 1, 0.6] : 0.6,
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Sword blade */}
        <motion.path
          d="M60 10 L65 15 L62 70 L58 70 Z"
          fill="url(#swordGradient)"
          stroke="#00ffff"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
        />

        {/* Sword crossguard */}
        <motion.rect
          x="45"
          y="68"
          width="30"
          height="4"
          rx="2"
          fill="url(#goldGradient)"
          stroke="#ffff00"
          strokeWidth="1"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        />

        {/* Sword handle */}
        <motion.rect
          x="56"
          y="72"
          width="8"
          height="15"
          rx="4"
          fill="url(#handleGradient)"
          stroke="#8B4513"
          strokeWidth="1"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.5, delay: 1.3 }}
        />

        {/* Sword pommel */}
        <motion.circle
          cx="60"
          cy="90"
          r="4"
          fill="url(#goldGradient)"
          stroke="#ffff00"
          strokeWidth="1"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 1.5 }}
        />

        {/* Skull - main shape */}
        <motion.path
          d="M45 35 Q45 25 55 25 L65 25 Q75 25 75 35 L75 45 Q75 55 70 60 L65 65 L55 65 L50 60 Q45 55 45 45 Z"
          fill="url(#skullGradient)"
          stroke="#ffffff"
          strokeWidth="1.5"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, delay: 1.8 }}
        />

        {/* Skull eye sockets */}
        <motion.circle
          cx="52"
          cy="40"
          r="4"
          fill="#000000"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 2.2 }}
        />
        <motion.circle
          cx="68"
          cy="40"
          r="4"
          fill="#000000"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 2.3 }}
        />

        {/* Skull glowing eyes */}
        <motion.circle
          cx="52"
          cy="40"
          r="2"
          fill="#ff0099"
          opacity={0.8}
          animate={{
            opacity: [0.8, 1, 0.8],
            r: [2, 2.5, 2],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.circle
          cx="68"
          cy="40"
          r="2"
          fill="#ff0099"
          opacity={0.8}
          animate={{
            opacity: [0.8, 1, 0.8],
            r: [2, 2.5, 2],
          }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />

        {/* Skull nasal cavity */}
        <motion.path
          d="M60 45 L57 52 L60 55 L63 52 Z"
          fill="#000000"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.3, delay: 2.4 }}
        />

        {/* Skull teeth */}
        <motion.rect x="54" y="57" width="2" height="4" fill="#ffffff"
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ duration: 0.2, delay: 2.5 }} />
        <motion.rect x="57" y="55" width="2" height="6" fill="#ffffff"
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ duration: 0.2, delay: 2.6 }} />
        <motion.rect x="60" y="57" width="2" height="4" fill="#ffffff"
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ duration: 0.2, delay: 2.7 }} />
        <motion.rect x="63" y="55" width="2" height="6" fill="#ffffff"
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ duration: 0.2, delay: 2.8 }} />

        {/* Crack in skull */}
        <motion.path
          d="M68 30 Q65 32 67 35 Q64 37 66 40"
          fill="none"
          stroke="#330000"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 2.9 }}
        />

        {/* Energy aura particles */}
        {[...Array(8)].map((_, i) => (
          <motion.circle
            key={i}
            cx={60 + Math.cos((i * Math.PI * 2) / 8) * 65}
            cy={60 + Math.sin((i * Math.PI * 2) / 8) * 65}
            r="1.5"
            fill="#0aff9d"
            opacity={0.7}
            animate={{
              opacity: [0.7, 1, 0.7],
              r: [1.5, 2.5, 1.5],
              x: [0, Math.cos((i * Math.PI * 2) / 8) * 5, 0],
              y: [0, Math.sin((i * Math.PI * 2) / 8) * 5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: 3 + i * 0.2,
            }}
          />
        ))}

        {/* Gradients */}
        <defs>
          <radialGradient id="skullGlow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#ff0099" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#7000ff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0aff9d" stopOpacity="0.4" />
          </radialGradient>

          <linearGradient id="swordGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#cccccc" />
            <stop offset="100%" stopColor="#888888" />
          </linearGradient>

          <linearGradient id="skullGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f0f0f0" />
            <stop offset="50%" stopColor="#e0e0e0" />
            <stop offset="100%" stopColor="#cccccc" />
          </linearGradient>

          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffd700" />
            <stop offset="50%" stopColor="#ffed4e" />
            <stop offset="100%" stopColor="#daa520" />
          </linearGradient>

          <linearGradient id="handleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B4513" />
            <stop offset="50%" stopColor="#A0522D" />
            <stop offset="100%" stopColor="#654321" />
          </linearGradient>

          {/* Glowing filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </motion.svg>

      {/* Floating text effect */}
      <motion.div
        className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? -5 : 10 }}
        transition={{ duration: 0.3 }}
      >
        <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-purple-500 to-cyan-400">
          LEGENDARY
        </span>
      </motion.div>
    </motion.div>
  );
};

export default SkullSwordLogo;
