import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ThemeName, ThemeConfig, themes, themeNames, THEME_ROTATION_INTERVAL, THEME_TRANSITION_DURATION } from './themeConfig';

interface ThemeContextType {
  currentTheme: ThemeConfig;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  nextTheme: () => void;
  prevTheme: () => void;
  isTransitioning: boolean;
  autoRotate: boolean;
  setAutoRotate: (v: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
  performanceMode: boolean;
  setPerformanceMode: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('knullvoid-theme') as ThemeName | null;
    if (saved && themes[saved]) return saved;
    // Random on first load
    return themeNames[Math.floor(Math.random() * themeNames.length)];
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [autoRotate, setAutoRotate] = useState(() => {
    const saved = localStorage.getItem('knullvoid-autorotate');
    return saved !== 'false';
  });
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });
  const [performanceMode, setPerformanceMode] = useState(() => {
    return localStorage.getItem('knullvoid-performance') === 'true';
  });
  const rotationTimer = useRef<ReturnType<typeof setInterval>>();

  const currentTheme = themes[themeName];

  // Apply CSS variables when theme changes
  useEffect(() => {
    const root = document.documentElement;
    const t = themes[themeName];

    root.style.setProperty('--theme-primary', t.colors.primary);
    root.style.setProperty('--theme-secondary', t.colors.secondary);
    root.style.setProperty('--theme-accent', t.colors.accent);
    root.style.setProperty('--theme-glow', t.colors.glow);
    root.style.setProperty('--theme-bg', t.colors.bg);
    root.style.setProperty('--theme-bg-alt', t.colors.bgAlt);
    root.style.setProperty('--theme-card', t.colors.card);
    root.style.setProperty('--theme-card-border', t.colors.cardBorder);
    root.style.setProperty('--theme-text', t.colors.text);
    root.style.setProperty('--theme-text-muted', t.colors.textMuted);
    root.style.setProperty('--theme-button-bg', t.colors.buttonBg);
    root.style.setProperty('--theme-button-border', t.colors.buttonBorder);
    root.style.setProperty('--theme-button-text', t.colors.buttonText);
    root.style.setProperty('--theme-button-hover-bg', t.colors.buttonHoverBg);
    root.style.setProperty('--theme-scrollbar', t.colors.scrollbar);
    root.style.setProperty('--theme-scrollbar-track', t.colors.scrollbarTrack);
    root.style.setProperty('--theme-font', t.font);

    // Update HSL css vars
    root.style.setProperty('--background', t.css.background);
    root.style.setProperty('--foreground', t.css.foreground);
    root.style.setProperty('--card', t.css.card);
    root.style.setProperty('--card-foreground', t.css.cardForeground);
    root.style.setProperty('--primary', t.css.primary);
    root.style.setProperty('--primary-foreground', t.css.primaryForeground);
    root.style.setProperty('--border', t.css.border);
    root.style.setProperty('--ring', t.css.ring);

    // Set theme data attribute
    root.setAttribute('data-theme', themeName);

    localStorage.setItem('knullvoid-theme', themeName);
  }, [themeName]);

  useEffect(() => {
    localStorage.setItem('knullvoid-autorotate', String(autoRotate));
  }, [autoRotate]);

  useEffect(() => {
    localStorage.setItem('knullvoid-performance', String(performanceMode));
  }, [performanceMode]);

  const setTheme = useCallback((name: ThemeName) => {
    if (name === themeName) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setThemeName(name);
      setTimeout(() => setIsTransitioning(false), THEME_TRANSITION_DURATION);
    }, 100);
  }, [themeName]);

  const nextTheme = useCallback(() => {
    const idx = themeNames.indexOf(themeName);
    const next = themeNames[(idx + 1) % themeNames.length];
    setTheme(next);
  }, [themeName, setTheme]);

  const prevTheme = useCallback(() => {
    const idx = themeNames.indexOf(themeName);
    const prev = themeNames[(idx - 1 + themeNames.length) % themeNames.length];
    setTheme(prev);
  }, [themeName, setTheme]);

  // Auto rotation
  useEffect(() => {
    if (autoRotate && !reducedMotion) {
      rotationTimer.current = setInterval(nextTheme, THEME_ROTATION_INTERVAL);
    }
    return () => {
      if (rotationTimer.current) clearInterval(rotationTimer.current);
    };
  }, [autoRotate, reducedMotion, nextTheme]);

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      themeName,
      setTheme,
      nextTheme,
      prevTheme,
      isTransitioning,
      autoRotate,
      setAutoRotate,
      reducedMotion,
      setReducedMotion,
      performanceMode,
      setPerformanceMode,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
