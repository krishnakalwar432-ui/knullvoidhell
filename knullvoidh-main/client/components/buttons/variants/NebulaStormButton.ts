import type { ThemeButtonConfig } from '../utils/buttonTypes';

export const nebulaStormConfig: ThemeButtonConfig = {
    themeName: 'nebulaStorm',
    gradients: {
        primary: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%)',
        primaryHover: 'linear-gradient(135deg, #f472b6 0%, #a855f7 50%, #22d3ee 100%)',
        destructive: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)',
    },
    glowColor: 'rgba(236, 72, 153, 0.4)',
    glowColorIntense: 'rgba(6, 182, 212, 0.7)',
    particleColors: ['#ec4899', '#06b6d4', '#f472b6', '#22d3ee', '#a855f7'],
    borderColor: 'rgba(6, 182, 212, 0.4)',
    borderColorHover: 'rgba(236, 72, 153, 0.8)',
    textColor: '#fce7f3',
    textColorMuted: '#f9a8d4',
    shimmerColor: 'rgba(6, 182, 212, 0.15)',
    scanlineOpacity: 0,
    specialEffect: 'lightning',
};
