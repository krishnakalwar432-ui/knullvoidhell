import type { ThemeButtonConfig } from '../utils/buttonTypes';

export const solarFlareConfig: ThemeButtonConfig = {
    themeName: 'solarFlare',
    gradients: {
        primary: 'linear-gradient(135deg, #f97316 0%, #ef4444 50%, #fbbf24 100%)',
        primaryHover: 'linear-gradient(135deg, #fb923c 0%, #f87171 50%, #fde68a 100%)',
        destructive: 'linear-gradient(135deg, #dc2626 0%, #f97316 100%)',
    },
    glowColor: 'rgba(249, 115, 22, 0.5)',
    glowColorIntense: 'rgba(249, 115, 22, 0.8)',
    particleColors: ['#f97316', '#ef4444', '#fbbf24', '#dc2626', '#fde68a'],
    borderColor: 'rgba(249, 115, 22, 0.4)',
    borderColorHover: 'rgba(249, 115, 22, 0.8)',
    textColor: '#fff7ed',
    textColorMuted: '#fdba74',
    shimmerColor: 'rgba(251, 191, 36, 0.15)',
    scanlineOpacity: 0,
    specialEffect: 'embers',
};
