import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/themes/ThemeProvider';
import type { ThemeName } from '@/themes/themeConfig';

const themeStyles: Record<ThemeName, {
  gradient: string;
  glow: string;
  glowColor: string;
  textShadow: string;
  hoverScale: number;
}> = {
  voidGalaxy: {
    gradient: 'linear-gradient(180deg, #c084fc 0%, #7c3aed 40%, #581c87 100%)',
    glow: 'radial-gradient(ellipse at center, rgba(168,85,247,0.4) 0%, transparent 70%)',
    glowColor: 'rgba(168,85,247,0.8)',
    textShadow: '0 0 40px rgba(168,85,247,0.8), 0 0 80px rgba(124,58,237,0.5), 0 0 120px rgba(88,28,135,0.3)',
    hoverScale: 1.08,
  },
  nebulaStorm: {
    gradient: 'linear-gradient(180deg, #f472b6 0%, #ec4899 30%, #06b6d4 100%)',
    glow: 'radial-gradient(ellipse at center, rgba(236,72,153,0.35) 0%, rgba(6,182,212,0.15) 50%, transparent 70%)',
    glowColor: 'rgba(236,72,153,0.7)',
    textShadow: '0 0 40px rgba(236,72,153,0.7), 0 0 80px rgba(6,182,212,0.4), 0 0 120px rgba(168,85,247,0.2)',
    hoverScale: 1.06,
  },
  solarFlare: {
    gradient: 'linear-gradient(180deg, #fde68a 0%, #f97316 40%, #dc2626 100%)',
    glow: 'radial-gradient(ellipse at center, rgba(249,115,22,0.4) 0%, rgba(239,68,68,0.15) 50%, transparent 70%)',
    glowColor: 'rgba(249,115,22,0.8)',
    textShadow: '0 0 40px rgba(249,115,22,0.8), 0 0 80px rgba(239,68,68,0.5), 0 0 120px rgba(251,191,36,0.3)',
    hoverScale: 1.1,
  },
  quantumFrost: {
    gradient: 'linear-gradient(180deg, #e0f2fe 0%, #38bdf8 40%, #818cf8 100%)',
    glow: 'radial-gradient(ellipse at center, rgba(56,189,248,0.35) 0%, rgba(129,140,248,0.15) 50%, transparent 70%)',
    glowColor: 'rgba(56,189,248,0.7)',
    textShadow: '0 0 40px rgba(56,189,248,0.7), 0 0 80px rgba(129,140,248,0.4), 0 0 120px rgba(224,242,254,0.2)',
    hoverScale: 1.05,
  },
  cosmicMidnight: {
    gradient: 'linear-gradient(180deg, #fde68a 0%, #fbbf24 40%, #14b8a6 100%)',
    glow: 'radial-gradient(ellipse at center, rgba(251,191,36,0.3) 0%, rgba(20,184,166,0.15) 50%, transparent 70%)',
    glowColor: 'rgba(251,191,36,0.6)',
    textShadow: '0 0 40px rgba(251,191,36,0.6), 0 0 80px rgba(20,184,166,0.4), 0 0 120px rgba(253,230,138,0.2)',
    hoverScale: 1.07,
  },
};

const DynamicLogo: React.FC<{ className?: string; compact?: boolean }> = ({ className = '', compact = false }) => {
  const { themeName, currentTheme, reducedMotion } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout>>();
  const style = themeStyles[themeName];
  const letters = 'KNULLVOID'.split('');

  const handleClick = () => {
    setClickCount(prev => prev + 1);
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => setClickCount(0), 2000);
  };

  // Particle burst on click
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([]);
  const burstId = useRef(0);

  const handleBurst = (e: React.MouseEvent) => {
    handleClick();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const id = burstId.current++;
    setBursts(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setBursts(prev => prev.filter(b => b.id !== id)), 800);
  };

  const fontSize = compact ? 'text-3xl md:text-4xl' : 'text-5xl md:text-7xl lg:text-8xl';

  return (
    <motion.div
      className={`relative inline-block cursor-pointer select-none ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleBurst}
      animate={isHovered ? { scale: style.hoverScale } : { scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Glow backdrop */}
      <motion.div
        className="absolute inset-0 blur-3xl -z-10 pointer-events-none"
        style={{ background: style.glow }}
        animate={reducedMotion ? {} : {
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Reflection below (only non-compact) */}
      {!compact && (
        <div
          className="absolute top-full left-0 right-0 h-12 opacity-20 blur-sm pointer-events-none"
          style={{
            background: style.gradient,
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)',
            transform: 'scaleY(-1)',
          }}
        />
      )}

      {/* Letters */}
      <div className="flex items-center justify-center" style={{ fontFamily: currentTheme.font }}>
        {letters.map((letter, index) => (
          <motion.span
            key={`${themeName}-${index}`}
            className={`${fontSize} font-black inline-block`}
            style={{
              color: 'transparent',
              background: style.gradient,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              textShadow: style.textShadow,
              filter: `drop-shadow(0 0 8px ${style.glowColor})`,
            }}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{
              opacity: 1,
              y: reducedMotion ? 0 : [0, -3, 0],
              scale: 1,
            }}
            transition={reducedMotion ? { duration: 0.3 } : {
              opacity: { duration: 0.4, delay: index * 0.05 },
              y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.15 },
              scale: { duration: 0.4, delay: index * 0.05 },
            }}
            whileHover={reducedMotion ? {} : {
              scale: 1.15,
              y: -8,
              transition: { duration: 0.2 },
            }}
          >
            {letter}
          </motion.span>
        ))}
      </div>

      {/* Click burst particles */}
      <AnimatePresence>
        {bursts.map(burst => (
          <React.Fragment key={burst.id}>
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const dist = 40 + Math.random() * 30;
              return (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full pointer-events-none"
                  style={{
                    left: burst.x,
                    top: burst.y,
                    backgroundColor: currentTheme.particleColors[i % currentTheme.particleColors.length],
                    boxShadow: `0 0 6px ${currentTheme.colors.primary}`,
                  }}
                  initial={{ scale: 1, x: 0, y: 0, opacity: 1 }}
                  animate={{
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist,
                    opacity: 0,
                    scale: 0,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              );
            })}
          </React.Fragment>
        ))}
      </AnimatePresence>

      {/* Easter egg: 5 clicks party mode flash */}
      {clickCount >= 5 && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 0.5 }}
          style={{ background: 'linear-gradient(45deg, #ff0080, #00ffff, #ff0080, #fbbf24)' }}
        />
      )}
    </motion.div>
  );
};

export default DynamicLogo;
