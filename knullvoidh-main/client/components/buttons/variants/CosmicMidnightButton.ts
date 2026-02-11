import type { ThemeButtonConfig } from '../utils/buttonTypes';

export const cosmicMidnightConfig: ThemeButtonConfig = {
    themeName: 'cosmicMidnight',
    gradients: {
        primary: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 40%, #fbbf24 100%)',
        primaryHover: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 40%, #fde68a 100%)',
        destructive: 'linear-gradient(135deg, #ef4444 0%, #14b8a6 100%)',
    },
    glowColor: 'rgba(251, 191, 36, 0.4)',
    glowColorIntense: 'rgba(20, 184, 166, 0.7)',
    particleColors: ['#fbbf24', '#14b8a6', '#fde68a', '#2dd4bf', '#a78bfa'],
    borderColor: 'rgba(20, 184, 166, 0.35)',
    borderColorHover: 'rgba(251, 191, 36, 0.7)',
    textColor: '#fef9c3',
    textColorMuted: '#a3a3a3',
    shimmerColor: 'rgba(251, 191, 36, 0.12)',
    scanlineOpacity: 0,
    specialEffect: 'stars',
};
