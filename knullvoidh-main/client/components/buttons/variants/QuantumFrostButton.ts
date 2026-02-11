import type { ThemeButtonConfig } from '../utils/buttonTypes';

export const quantumFrostConfig: ThemeButtonConfig = {
    themeName: 'quantumFrost',
    gradients: {
        primary: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #7dd3fc 100%)',
        primaryHover: 'linear-gradient(135deg, #7dd3fc 0%, #a5b4fc 50%, #e0f2fe 100%)',
        destructive: 'linear-gradient(135deg, #ef4444 0%, #38bdf8 100%)',
    },
    glowColor: 'rgba(56, 189, 248, 0.4)',
    glowColorIntense: 'rgba(56, 189, 248, 0.7)',
    particleColors: ['#38bdf8', '#818cf8', '#7dd3fc', '#e0f2fe', '#a5b4fc'],
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderColorHover: 'rgba(56, 189, 248, 0.7)',
    textColor: '#e0f2fe',
    textColorMuted: '#7dd3fc',
    shimmerColor: 'rgba(125, 211, 252, 0.15)',
    scanlineOpacity: 0,
    specialEffect: 'snowflakes',
};
