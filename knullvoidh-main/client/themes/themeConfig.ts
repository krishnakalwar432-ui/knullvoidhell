export type ThemeName = 'voidGalaxy' | 'nebulaStorm' | 'solarFlare' | 'quantumFrost' | 'cosmicMidnight';

export interface ThemeConfig {
  name: ThemeName;
  label: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
    bg: string;
    bgAlt: string;
    card: string;
    cardBorder: string;
    text: string;
    textMuted: string;
    buttonBg: string;
    buttonBorder: string;
    buttonText: string;
    buttonHoverBg: string;
    scrollbar: string;
    scrollbarTrack: string;
  };
  css: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    primary: string;
    primaryForeground: string;
    border: string;
    ring: string;
  };
  font: string;
  particleColors: string[];
}

export const themes: Record<ThemeName, ThemeConfig> = {
  voidGalaxy: {
    name: 'voidGalaxy',
    label: 'Void Galaxy',
    description: 'Deep purple vortex with spiral debris',
    colors: {
      primary: '#a855f7',
      secondary: '#7c3aed',
      accent: '#c084fc',
      glow: 'rgba(168,85,247,0.6)',
      bg: '#050008',
      bgAlt: '#0d0015',
      card: 'rgba(15,0,30,0.7)',
      cardBorder: 'rgba(168,85,247,0.3)',
      text: '#e9d5ff',
      textMuted: '#a78bfa',
      buttonBg: 'rgba(168,85,247,0.15)',
      buttonBorder: 'rgba(168,85,247,0.5)',
      buttonText: '#c084fc',
      buttonHoverBg: 'rgba(168,85,247,0.3)',
      scrollbar: '#7c3aed',
      scrollbarTrack: '#0d0015',
    },
    css: {
      background: '270 100% 2%',
      foreground: '270 80% 92%',
      card: '270 100% 6%',
      cardForeground: '270 80% 92%',
      primary: '270 91% 65%',
      primaryForeground: '0 0% 100%',
      border: '270 50% 15%',
      ring: '270 91% 65%',
    },
    font: "'Orbitron', sans-serif",
    particleColors: ['#a855f7', '#7c3aed', '#c084fc', '#581c87', '#e9d5ff'],
  },
  nebulaStorm: {
    name: 'nebulaStorm',
    label: 'Nebula Storm',
    description: 'Pink/cyan nebula with electric particles',
    colors: {
      primary: '#ec4899',
      secondary: '#06b6d4',
      accent: '#f472b6',
      glow: 'rgba(236,72,153,0.5)',
      bg: '#05000a',
      bgAlt: '#0a0012',
      card: 'rgba(20,0,30,0.65)',
      cardBorder: 'rgba(236,72,153,0.3)',
      text: '#fce7f3',
      textMuted: '#f9a8d4',
      buttonBg: 'rgba(236,72,153,0.15)',
      buttonBorder: 'rgba(6,182,212,0.5)',
      buttonText: '#67e8f9',
      buttonHoverBg: 'rgba(6,182,212,0.3)',
      scrollbar: '#ec4899',
      scrollbarTrack: '#0a0012',
    },
    css: {
      background: '290 100% 2%',
      foreground: '330 80% 95%',
      card: '290 100% 5%',
      cardForeground: '330 80% 95%',
      primary: '330 81% 60%',
      primaryForeground: '0 0% 100%',
      border: '290 50% 12%',
      ring: '190 90% 46%',
    },
    font: "'Audiowide', sans-serif",
    particleColors: ['#ec4899', '#06b6d4', '#f472b6', '#22d3ee', '#a855f7'],
  },
  solarFlare: {
    name: 'solarFlare',
    label: 'Solar Flare',
    description: 'Orange/red solar winds with plasma effects',
    colors: {
      primary: '#f97316',
      secondary: '#ef4444',
      accent: '#fbbf24',
      glow: 'rgba(249,115,22,0.5)',
      bg: '#0a0200',
      bgAlt: '#120500',
      card: 'rgba(25,5,0,0.7)',
      cardBorder: 'rgba(249,115,22,0.3)',
      text: '#fff7ed',
      textMuted: '#fdba74',
      buttonBg: 'rgba(249,115,22,0.15)',
      buttonBorder: 'rgba(249,115,22,0.5)',
      buttonText: '#fb923c',
      buttonHoverBg: 'rgba(249,115,22,0.35)',
      scrollbar: '#f97316',
      scrollbarTrack: '#120500',
    },
    css: {
      background: '20 100% 2%',
      foreground: '30 80% 95%',
      card: '20 100% 5%',
      cardForeground: '30 80% 95%',
      primary: '25 95% 53%',
      primaryForeground: '0 0% 100%',
      border: '20 50% 12%',
      ring: '25 95% 53%',
    },
    font: "'Teko', sans-serif",
    particleColors: ['#f97316', '#ef4444', '#fbbf24', '#dc2626', '#fde68a'],
  },
  quantumFrost: {
    name: 'quantumFrost',
    label: 'Quantum Frost',
    description: 'Ice blue crystalline with geometric patterns',
    colors: {
      primary: '#38bdf8',
      secondary: '#818cf8',
      accent: '#7dd3fc',
      glow: 'rgba(56,189,248,0.4)',
      bg: '#000510',
      bgAlt: '#000a18',
      card: 'rgba(0,10,30,0.7)',
      cardBorder: 'rgba(56,189,248,0.3)',
      text: '#e0f2fe',
      textMuted: '#7dd3fc',
      buttonBg: 'rgba(56,189,248,0.12)',
      buttonBorder: 'rgba(56,189,248,0.4)',
      buttonText: '#38bdf8',
      buttonHoverBg: 'rgba(56,189,248,0.25)',
      scrollbar: '#38bdf8',
      scrollbarTrack: '#000a18',
    },
    css: {
      background: '215 100% 3%',
      foreground: '200 80% 95%',
      card: '215 100% 6%',
      cardForeground: '200 80% 95%',
      primary: '199 89% 48%',
      primaryForeground: '0 0% 100%',
      border: '215 50% 12%',
      ring: '199 89% 48%',
    },
    font: "'Rajdhani', sans-serif",
    particleColors: ['#38bdf8', '#818cf8', '#7dd3fc', '#e0f2fe', '#a5b4fc'],
  },
  cosmicMidnight: {
    name: 'cosmicMidnight',
    label: 'Cosmic Midnight',
    description: 'Dark teal/gold with constellation lines',
    colors: {
      primary: '#fbbf24',
      secondary: '#14b8a6',
      accent: '#fde68a',
      glow: 'rgba(251,191,36,0.4)',
      bg: '#020a08',
      bgAlt: '#041210',
      card: 'rgba(4,18,16,0.75)',
      cardBorder: 'rgba(251,191,36,0.25)',
      text: '#fef9c3',
      textMuted: '#a3a3a3',
      buttonBg: 'rgba(251,191,36,0.12)',
      buttonBorder: 'rgba(20,184,166,0.4)',
      buttonText: '#14b8a6',
      buttonHoverBg: 'rgba(20,184,166,0.25)',
      scrollbar: '#fbbf24',
      scrollbarTrack: '#041210',
    },
    css: {
      background: '165 70% 2%',
      foreground: '50 80% 92%',
      card: '165 60% 5%',
      cardForeground: '50 80% 92%',
      primary: '45 93% 47%',
      primaryForeground: '0 0% 5%',
      border: '165 30% 12%',
      ring: '168 76% 42%',
    },
    font: "'Saira', sans-serif",
    particleColors: ['#fbbf24', '#14b8a6', '#fde68a', '#2dd4bf', '#a78bfa'],
  },
};

export const themeNames: ThemeName[] = ['voidGalaxy', 'nebulaStorm', 'solarFlare', 'quantumFrost', 'cosmicMidnight'];

export const THEME_ROTATION_INTERVAL = 20000; // 20 seconds
export const THEME_TRANSITION_DURATION = 2000; // 2 seconds
