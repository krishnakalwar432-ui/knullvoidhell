import type { ThemeButtonConfig } from '../utils/buttonTypes';

export const voidGalaxyConfig: ThemeButtonConfig = {
    themeName: 'voidGalaxy',
    gradients: {
        primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #a855f7 100%)',
        primaryHover: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 40%, #c084fc 100%)',
        destructive: 'linear-gradient(135deg, #dc2626 0%, #7c3aed 100%)',
    },
    glowColor: 'rgba(168, 85, 247, 0.5)',
    glowColorIntense: 'rgba(168, 85, 247, 0.8)',
    particleColors: ['#a855f7', '#7c3aed', '#c084fc', '#581c87', '#e9d5ff'],
    borderColor: 'rgba(168, 85, 247, 0.4)',
    borderColorHover: 'rgba(168, 85, 247, 0.8)',
    textColor: '#e9d5ff',
    textColorMuted: '#a78bfa',
    shimmerColor: 'rgba(196, 132, 252, 0.15)',
    scanlineOpacity: 0.03,
    specialEffect: 'orbiting',
};
