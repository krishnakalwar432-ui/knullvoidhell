import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/themes/ThemeProvider';

const ThemeTransition: React.FC = () => {
  const { isTransitioning, currentTheme } = useTheme();

  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          className="fixed inset-0 z-[100] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          style={{
            background: `radial-gradient(circle at center, ${currentTheme.colors.primary}30 0%, ${currentTheme.colors.bg} 70%)`,
          }}
        />
      )}
    </AnimatePresence>
  );
};

export default ThemeTransition;
