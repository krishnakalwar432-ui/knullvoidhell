import type { Variants } from 'framer-motion';

// ── Framer Motion Variants ──────────────────────────────────────────

export const buttonMotionVariants: Variants = {
    idle: { scale: 1, y: 0 },
    hover: { scale: 1.05, y: -2, transition: { type: 'spring', stiffness: 400, damping: 15 } },
    tap: { scale: 0.95, y: 1, transition: { type: 'spring', stiffness: 500, damping: 20 } },
    disabled: { scale: 1, opacity: 0.5 },
};

export const iconBounceVariants: Variants = {
    idle: { rotate: 0, scale: 1 },
    hover: { rotate: [0, -10, 10, 0], scale: 1.15, transition: { duration: 0.4 } },
};

export const loadingSpinnerVariants: Variants = {
    spin: {
        rotate: 360,
        transition: { duration: 1, repeat: Infinity, ease: 'linear' },
    },
};

export const successVariants: Variants = {
    initial: { scale: 0, opacity: 0 },
    animate: {
        scale: [0, 1.3, 1],
        opacity: 1,
        transition: { duration: 0.4, ease: 'easeOut' },
    },
};

export const errorShakeVariants: Variants = {
    shake: {
        x: [0, -6, 6, -4, 4, -2, 2, 0],
        transition: { duration: 0.5 },
    },
};

export const glowPulseVariants: Variants = {
    idle: { opacity: 0.4 },
    hover: { opacity: 1, transition: { duration: 0.3 } },
};

export const rippleVariants: Variants = {
    initial: { scale: 0, opacity: 0.6 },
    animate: { scale: 4, opacity: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

// ── Stagger helpers ──

export const particleBurstConfig = {
    count: 12,
    spread: 120,
    speed: 2,
    lifetime: 600,
    sizeRange: [3, 7] as [number, number],
};
