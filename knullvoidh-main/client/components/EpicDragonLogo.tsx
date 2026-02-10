import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const EpicDragonLogo = () => {
  const [fireBreathing, setFireBreathing] = useState(false);
  const [eyeGlow, setEyeGlow] = useState(false);
  const [roaring, setRoaring] = useState(false);

  useEffect(() => {
    const fireInterval = setInterval(() => {
      setFireBreathing(true);
      setTimeout(() => setFireBreathing(false), 3000);
    }, 6000);

    const eyeInterval = setInterval(() => {
      setEyeGlow(true);
      setTimeout(() => setEyeGlow(false), 2000);
    }, 4000);

    const roarInterval = setInterval(() => {
      setRoaring(true);
      setTimeout(() => setRoaring(false), 1500);
    }, 8000);

    return () => {
      clearInterval(fireInterval);
      clearInterval(eyeInterval);
      clearInterval(roarInterval);
    };
  }, []);

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
    >
      <svg width="180" height="180" className="filter drop-shadow-2xl">
        <defs>
          {/* Dark dragon gradients */}
          <linearGradient id="dragonBodyDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a0000" />
            <stop offset="30%" stopColor="#4d0000" />
            <stop offset="70%" stopColor="#800000" />
            <stop offset="100%" stopColor="#cc0000" />
          </linearGradient>
          
          <linearGradient id="dragonWingsDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#000000" />
            <stop offset="50%" stopColor="#330000" />
            <stop offset="100%" stopColor="#660000" />
          </linearGradient>
          
          <linearGradient id="dragonBellyDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#660000" />
            <stop offset="100%" stopColor="#990000" />
          </linearGradient>
          
          <radialGradient id="dangerousEye" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff0000" />
            <stop offset="50%" stopColor="#ff4500" />
            <stop offset="100%" stopColor="#8b0000" />
          </radialGradient>
          
          <linearGradient id="hellFire" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b0000" />
            <stop offset="30%" stopColor="#ff0000" />
            <stop offset="60%" stopColor="#ff4500" />
            <stop offset="100%" stopColor="#ffa500" />
          </linearGradient>

          {/* Menacing glow filters */}
          <filter id="dangerGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#ff0000" floodOpacity="1"/>
            <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#8b0000" floodOpacity="0.8"/>
          </filter>
          
          <filter id="hellFireGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#ff0000" floodOpacity="1"/>
            <feDropShadow dx="0" dy="0" stdDeviation="15" floodColor="#ff4500" floodOpacity="0.8"/>
          </filter>

          <filter id="eyeIntensity" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#ff0000" floodOpacity="1"/>
            <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#ff0000" floodOpacity="0.6"/>
          </filter>
        </defs>

        {/* Left Wing - more bat-like and menacing */}
        <motion.path
          d="M20 80 Q10 55 5 65 Q8 45 15 35 Q25 38 30 55 Q35 45 40 50 L35 85 Q30 100 20 95 Q15 90 10 85 Z"
          fill="url(#dragonWingsDark)"
          filter="url(#dangerGlow)"
          animate={roaring ? { 
            d: "M15 75 Q5 50 0 60 Q3 40 10 30 Q20 33 25 50 Q30 40 35 45 L30 80 Q25 95 15 90 Q10 85 5 80 Z",
            scale: [1, 1.1, 1]
          } : {}}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />

        {/* Right Wing */}
        <motion.path
          d="M160 80 Q170 55 175 65 Q172 45 165 35 Q155 38 150 55 Q145 45 140 50 L145 85 Q150 100 160 95 Q165 90 170 85 Z"
          fill="url(#dragonWingsDark)"
          filter="url(#dangerGlow)"
          animate={roaring ? { 
            d: "M165 75 Q175 50 180 60 Q177 40 170 30 Q160 33 155 50 Q150 40 145 45 L150 80 Q155 95 165 90 Q170 85 175 80 Z",
            scale: [1, 1.1, 1]
          } : {}}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />

        {/* Dragon Body - more muscular and intimidating */}
        <motion.ellipse
          cx="90"
          cy="90"
          rx="50"
          ry="40"
          fill="url(#dragonBodyDark)"
          filter="url(#dangerGlow)"
          animate={roaring ? { 
            rx: [50, 55, 50],
            ry: [40, 45, 40]
          } : {
            rx: [50, 52, 50],
            ry: [40, 42, 40]
          }}
          transition={{ duration: roaring ? 1.5 : 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Dragon Belly - dark and armored looking */}
        <ellipse
          cx="90"
          cy="95"
          rx="35"
          ry="25"
          fill="url(#dragonBellyDark)"
        />

        {/* Dragon Head - more angular and menacing */}
        <motion.path
          d="M90 65 Q65 50 70 70 Q75 45 90 40 Q105 45 110 70 Q115 50 90 65"
          fill="url(#dragonBodyDark)"
          filter="url(#dangerGlow)"
          animate={roaring ? { 
            d: "M90 65 Q60 45 65 70 Q70 40 90 35 Q110 40 115 70 Q120 45 90 65",
            scale: [1, 1.2, 1]
          } : {}}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* Menacing snout with fangs */}
        <motion.path
          d="M90 50 Q75 45 80 55 Q85 40 90 38 Q95 40 100 55 Q105 45 90 50"
          fill="url(#dragonBodyDark)"
          animate={roaring ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 1.5 }}
        />

        {/* Nostrils - smoking */}
        <motion.circle 
          cx="82" 
          cy="48" 
          r="3" 
          fill="#000000"
          animate={fireBreathing ? { r: [3, 5, 3] } : {}}
        />
        <motion.circle 
          cx="98" 
          cy="48" 
          r="3" 
          fill="#000000"
          animate={fireBreathing ? { r: [3, 5, 3] } : {}}
        />

        {/* Dangerous glowing eyes */}
        <motion.circle
          cx="75"
          cy="58"
          r="8"
          fill="url(#dangerousEye)"
          filter={eyeGlow ? "url(#eyeIntensity)" : "url(#dangerGlow)"}
          animate={eyeGlow ? { 
            r: [8, 12, 8],
            opacity: [1, 0.7, 1]
          } : {
            r: [8, 10, 8],
            opacity: [0.9, 1, 0.9]
          }}
          transition={{ duration: eyeGlow ? 0.5 : 2, repeat: Infinity }}
        />
        <motion.circle
          cx="105"
          cy="58"
          r="8"
          fill="url(#dangerousEye)"
          filter={eyeGlow ? "url(#eyeIntensity)" : "url(#dangerGlow)"}
          animate={eyeGlow ? { 
            r: [8, 12, 8],
            opacity: [1, 0.7, 1]
          } : {
            r: [8, 10, 8],
            opacity: [0.9, 1, 0.9]
          }}
          transition={{ duration: eyeGlow ? 0.5 : 2, repeat: Infinity }}
        />

        {/* Pupils - slit like a serpent */}
        <motion.ellipse cx="75" cy="58" rx="1" ry="5" fill="#000000" />
        <motion.ellipse cx="105" cy="58" rx="1" ry="5" fill="#000000" />

        {/* Sharp horns */}
        <motion.path
          d="M70 45 L65 25 L75 30 Z"
          fill="url(#dragonBodyDark)"
          filter="url(#dangerGlow)"
          animate={roaring ? { 
            d: "M70 45 L60 20 L80 25 Z"
          } : {}}
          transition={{ duration: 1.5 }}
        />
        <motion.path
          d="M110 45 L115 25 L105 30 Z"
          fill="url(#dragonBodyDark)"
          filter="url(#dangerGlow)"
          animate={roaring ? { 
            d: "M110 45 L120 20 L100 25 Z"
          } : {}}
          transition={{ duration: 1.5 }}
        />

        {/* Menacing spikes on back */}
        <motion.path
          d="M55 85 L50 70 L60 75 Z"
          fill="url(#dragonBodyDark)"
          filter="url(#dangerGlow)"
          animate={{ 
            d: ["M55 85 L50 70 L60 75 Z", "M55 85 L48 68 L62 73 Z", "M55 85 L50 70 L60 75 Z"]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.path
          d="M90 80 L85 65 L95 70 Z"
          fill="url(#dragonBodyDark)"
          filter="url(#dangerGlow)"
          animate={{ 
            d: ["M90 80 L85 65 L95 70 Z", "M90 80 L83 63 L97 68 Z", "M90 80 L85 65 L95 70 Z"]
          }}
          transition={{ duration: 4, repeat: Infinity, delay: 0.7 }}
        />
        <motion.path
          d="M125 85 L120 70 L130 75 Z"
          fill="url(#dragonBodyDark)"
          filter="url(#dangerGlow)"
          animate={{ 
            d: ["M125 85 L120 70 L130 75 Z", "M125 85 L118 68 L132 73 Z", "M125 85 L120 70 L130 75 Z"]
          }}
          transition={{ duration: 4, repeat: Infinity, delay: 1.4 }}
        />

        {/* Massive spiked tail */}
        <motion.path
          d="M140 100 Q155 105 170 120 Q165 135 150 130 Q145 115 140 110"
          stroke="url(#dragonBodyDark)"
          strokeWidth="12"
          fill="none"
          filter="url(#dangerGlow)"
          animate={{ 
            d: ["M140 100 Q155 105 170 120 Q165 135 150 130 Q145 115 140 110",
                "M140 100 Q158 108 172 122 Q167 137 152 132 Q147 117 140 110",
                "M140 100 Q155 105 170 120 Q165 135 150 130 Q145 115 140 110"]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Tail spikes */}
        <motion.path
          d="M155 115 L150 105 L160 110 Z"
          fill="url(#dragonBodyDark)"
          filter="url(#dangerGlow)"
          animate={{ 
            d: ["M155 115 L150 105 L160 110 Z", "M157 117 L152 107 L162 112 Z", "M155 115 L150 105 L160 110 Z"]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Hell fire breath effect */}
        {fireBreathing && (
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0.9, 0], scale: [0, 1, 1.5, 0] }}
            transition={{ duration: 3, ease: "easeOut" }}
          >
            {/* Main fire stream */}
            <motion.path
              d="M110 48 Q130 43 145 38 Q140 33 150 28 Q155 38 160 33 Q165 28 170 35"
              stroke="url(#hellFire)"
              strokeWidth="8"
              fill="none"
              filter="url(#hellFireGlow)"
              animate={{
                d: [
                  "M110 48 Q130 43 145 38 Q140 33 150 28 Q155 38 160 33 Q165 28 170 35",
                  "M110 48 Q135 40 150 35 Q145 30 155 25 Q160 35 165 30 Q170 25 175 32",
                  "M110 48 Q125 45 140 40 Q135 35 145 30 Q150 40 155 35 Q160 30 165 37"
                ]
              }}
              transition={{ duration: 0.1, repeat: 30 }}
            />
            <motion.path
              d="M110 48 Q125 53 140 48 Q145 43 155 48"
              stroke="url(#hellFire)"
              strokeWidth="6"
              fill="none"
              filter="url(#hellFireGlow)"
              animate={{
                d: [
                  "M110 48 Q125 53 140 48 Q145 43 155 48",
                  "M110 48 Q127 55 142 50 Q147 45 157 50",
                  "M110 48 Q123 51 138 46 Q143 41 153 46"
                ]
              }}
              transition={{ duration: 0.12, repeat: 25 }}
            />
            
            {/* Fire particles */}
            {[...Array(8)].map((_, i) => (
              <motion.circle
                key={i}
                cx={120 + i * 8}
                cy={45 + Math.sin(i) * 8}
                r="3"
                fill="#ff0000"
                animate={{
                  cy: [45 + Math.sin(i) * 8, 40 + Math.sin(i) * 8, 50 + Math.sin(i) * 8],
                  opacity: [1, 0.3, 1],
                  r: [3, 5, 2]
                }}
                transition={{
                  duration: 0.3 + i * 0.1,
                  repeat: 10,
                  delay: i * 0.1
                }}
              />
            ))}
          </motion.g>
        )}

        {/* Smoke from nostrils */}
        <motion.g>
          {[...Array(4)].map((_, i) => (
            <motion.circle
              key={i}
              cx={82 + (i % 2) * 16}
              cy={140 + i * 15}
              r="2"
              fill="#333333"
              animate={{
                cy: [140 + i * 15, 130 + i * 15, 140 + i * 15],
                opacity: [0.8, 0.3, 0.8],
                scale: [0.5, 1.2, 0.5]
              }}
              transition={{
                duration: 3 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.5
              }}
            />
          ))}
        </motion.g>
      </svg>

      {/* Menacing text below dragon */}
      <motion.div
        className="absolute -bottom-4 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <motion.span
          className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-800 via-red-600 to-red-400 filter drop-shadow-lg"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            textShadow: ['0 0 10px #ff0000', '0 0 20px #ff0000', '0 0 10px #ff0000']
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          DANGEROUS
        </motion.span>
      </motion.div>
    </motion.div>
  );
};

export default EpicDragonLogo;
