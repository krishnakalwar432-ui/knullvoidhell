import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const CosmicVoidLogo = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <motion.div
      className="relative w-48 h-48 flex items-center justify-center cursor-pointer"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
    >
      <svg
        width="200"
        height="200"
        className="filter drop-shadow-2xl"
        viewBox="0 0 200 200"
      >
        <defs>
          {/* Cosmic gradients */}
          <radialGradient id="voidCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00ffff" stopOpacity="0.9" />
            <stop offset="30%" stopColor="#7000ff" stopOpacity="0.7" />
            <stop offset="70%" stopColor="#00ff9d" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="voidGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#00ffff" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#7000ff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ffff" />
            <stop offset="50%" stopColor="#ff00d4" />
            <stop offset="100%" stopColor="#00ff9d" />
          </linearGradient>

          {/* Glow filters */}
          <filter id="cosmicGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="intenseGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Noise pattern for void effect */}
          <filter id="voidNoise" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="4"
              result="noise"
              seed="2"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
          </filter>
        </defs>

        {/* Background void circle */}
        <motion.circle
          cx="100"
          cy="100"
          r="85"
          fill="none"
          stroke="url(#voidGlow)"
          strokeWidth="2"
          filter="url(#cosmicGlow)"
          animate={{
            strokeOpacity: [0.3, 0.8, 0.3],
            r: [85, 90, 85],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Main void orb - core */}
        <motion.circle
          cx="100"
          cy="100"
          r="45"
          fill="url(#voidCore)"
          filter="url(#intenseGlow)"
          animate={
            isHovered
              ? {
                  r: [45, 50, 45],
                  opacity: [1, 0.9, 1],
                }
              : {
                  r: [45, 48, 45],
                  opacity: [0.95, 1, 0.95],
                }
          }
          transition={{
            duration: isHovered ? 0.6 : 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Void distortion rings */}
        <motion.circle
          cx="100"
          cy="100"
          r="55"
          fill="none"
          stroke="url(#orbitGrad)"
          strokeWidth="1"
          opacity="0.4"
          animate={{
            r: [55, 60, 55],
            opacity: [0.2, 0.5, 0.2],
            strokeDashoffset: isHovered ? [-400, 0] : [0, 400],
          }}
          transition={{
            duration: isHovered ? 1 : 4,
            repeat: Infinity,
            ease: "linear",
          }}
          strokeDasharray="400"
        />

        <motion.circle
          cx="100"
          cy="100"
          r="70"
          fill="none"
          stroke="url(#orbitGrad)"
          strokeWidth="1"
          opacity="0.3"
          animate={{
            r: [70, 65, 70],
            opacity: [0.1, 0.4, 0.1],
            strokeDashoffset: isHovered ? [400, 0] : [0, -400],
          }}
          transition={{
            duration: isHovered ? 1.2 : 5,
            repeat: Infinity,
            ease: "linear",
          }}
          strokeDasharray="400"
        />

        {/* Orbital particles */}
        {[0, 1, 2, 3].map((index) => {
          const angle = (index * Math.PI) / 2;
          const x = 100 + Math.cos(angle) * 65;
          const y = 100 + Math.sin(angle) * 65;

          return (
            <motion.g key={index}>
              <motion.circle
                cx={x}
                cy={y}
                r="4"
                fill={["#00ffff", "#ff00d4", "#00ff9d", "#ff9900"][index]}
                filter="url(#cosmicGlow)"
                animate={
                  isHovered
                    ? {
                        r: [4, 6, 4],
                        opacity: [1, 0.5, 1],
                      }
                    : {
                        r: [4, 5, 4],
                        opacity: [0.8, 1, 0.8],
                      }
                }
                transition={{
                  duration: isHovered ? 0.5 : 2,
                  repeat: Infinity,
                  delay: index * 0.3,
                  ease: "easeInOut",
                }}
              />
              <motion.circle
                cx={x}
                cy={y}
                r="8"
                fill="none"
                stroke={["#00ffff", "#ff00d4", "#00ff9d", "#ff9900"][index]}
                strokeWidth="1"
                opacity="0.3"
                animate={{
                  r: [8, 12, 8],
                  opacity: [0.2, 0.6, 0.2],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.3,
                  ease: "easeInOut",
                }}
              />
            </motion.g>
          );
        })}

        {/* Energy pulses emanating from core */}
        {[0, 1, 2].map((index) => (
          <motion.circle
            key={`pulse-${index}`}
            cx="100"
            cy="100"
            r="50"
            fill="none"
            stroke="#00ffff"
            strokeWidth="2"
            opacity="0"
            animate={{
              r: [50, 90, 50],
              opacity: [0.8, 0, 0.8],
              strokeWidth: [2, 1, 2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: index * 0.6,
              ease: "easeOut",
            }}
          />
        ))}

        {/* Central void symbol */}
        <motion.g
          animate={
            isHovered
              ? {
                  rotate: 360,
                }
              : {
                  rotate: 0,
                }
          }
          transition={{
            duration: isHovered ? 3 : 20,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ transformOrigin: "100px 100px" }}
        >
          {/* Infinity-like symbol inside void */}
          <motion.path
            d="M 70 100 Q 80 85 100 85 Q 120 85 130 100 Q 120 115 100 115 Q 80 115 70 100 Z"
            fill="none"
            stroke="url(#orbitGrad)"
            strokeWidth="2"
            filter="url(#cosmicGlow)"
            strokeLinecap="round"
            animate={{
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.g>
      </svg>

      {/* Hovering enhancement effect */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 opacity-20 blur-2xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.3, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Glow label */}
      <motion.div
        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <motion.span
          className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400"
          animate={{
            textShadow: [
              "0 0 10px #00ffff",
              "0 0 20px #7000ff",
              "0 0 10px #00ffff",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          VOID CORE
        </motion.span>
      </motion.div>
    </motion.div>
  );
};

export default CosmicVoidLogo;
