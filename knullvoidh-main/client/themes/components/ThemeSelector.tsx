import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/themes/ThemeProvider';
import { themes, themeNames, ThemeName } from '@/themes/themeConfig';

const ThemeSelector: React.FC = () => {
  const { themeName, setTheme, autoRotate, setAutoRotate, reducedMotion, setReducedMotion, performanceMode, setPerformanceMode } = useTheme();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Theme orbs */}
      <div className="flex gap-2 bg-black/60 backdrop-blur-md rounded-full px-3 py-2 border border-white/10">
        {themeNames.map((name) => {
          const t = themes[name];
          const isActive = name === themeName;
          return (
            <motion.button
              key={name}
              title={t.label}
              onClick={() => setTheme(name)}
              className="relative w-7 h-7 rounded-full border-2 transition-all"
              style={{
                background: `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.secondary})`,
                borderColor: isActive ? '#fff' : 'transparent',
                boxShadow: isActive ? `0 0 12px ${t.colors.glow}` : 'none',
              }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              aria-label={`Switch to ${t.label} theme`}
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ border: '2px solid white' }}
                  layoutId="theme-indicator"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex gap-1 bg-black/60 backdrop-blur-md rounded-lg px-2 py-1 border border-white/10 text-xs">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-2 py-1 rounded transition-colors ${autoRotate ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'}`}
          title="Auto-rotate themes"
        >
          {autoRotate ? '⟳ On' : '⟳ Off'}
        </button>
        <button
          onClick={() => setReducedMotion(!reducedMotion)}
          className={`px-2 py-1 rounded transition-colors ${reducedMotion ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'}`}
          title="Reduced motion"
        >
          {reducedMotion ? '◉ Still' : '◎ Motion'}
        </button>
        <button
          onClick={() => setPerformanceMode(!performanceMode)}
          className={`px-2 py-1 rounded transition-colors ${performanceMode ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'}`}
          title="Performance mode"
        >
          {performanceMode ? '⚡ Perf' : '✦ Full'}
        </button>
      </div>
    </div>
  );
};

export default ThemeSelector;
