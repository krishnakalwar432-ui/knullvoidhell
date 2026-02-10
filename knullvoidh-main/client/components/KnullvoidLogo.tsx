import React, { useState } from 'react';
import { motion } from 'framer-motion';

const KnullvoidLogo: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [isHovered, setIsHovered] = useState(false);

  const letterVariants = {
    initial: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
    animate: {
      opacity: [1, 0.3, 1],
      y: [0, -5, 0],
      scale: [1, 1.1, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    hover: {
      opacity: [1, 0, 1],
      scale: [1, 0.8, 1.2, 1],
      transition: {
        duration: 0.6,
        ease: "easeInOut"
      }
    }
  };

  const glowVariants = {
    initial: {
      boxShadow: "0 0 30px rgba(0,255,255,0.3)"
    },
    animate: {
      boxShadow: [
        "0 0 30px rgba(0,255,255,0.3)",
        "0 0 50px rgba(0,255,255,0.5)",
        "0 0 70px rgba(138,43,226,0.4)",
        "0 0 50px rgba(0,255,255,0.5)",
        "0 0 30px rgba(0,255,255,0.3)"
      ],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const letters = "KNULLVOID".split("");

  return (
    <motion.div
      className={`relative inline-block cursor-pointer px-4 py-2 ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      variants={glowVariants}
      initial="initial"
      animate="animate"
    >
      <div className="flex">
        {letters.map((letter, index) => (
          <motion.span
            key={index}
            className="text-5xl md:text-7xl font-black"
            variants={letterVariants}
            initial="initial"
            animate={isHovered ? "hover" : "animate"}
            custom={index}
            style={{
              color: 'transparent',
              background: 'linear-gradient(180deg, #00ffff 0%, #0088aa 50%, #004466 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              textShadow: '0 0 40px rgba(0,255,255,0.8), 0 0 80px rgba(0,255,255,0.4), 0 0 120px rgba(0,255,255,0.2)',
              filter: 'drop-shadow(0 0 10px rgba(0,255,255,0.8))',
              animationDelay: `${index * 0.1}s`,
            }}
          >
            {letter}
          </motion.span>
        ))}
      </div>
      <motion.div
        className="absolute inset-0 blur-2xl -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,255,255,0.3) 0%, rgba(0,100,150,0.1) 50%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
};

export default KnullvoidLogo;
