import React, { useRef, useCallback, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface MagneticEffectProps {
    children: React.ReactNode;
    intensity?: number; // pixels of attraction, default 15
    disabled?: boolean;
}

const MagneticEffect: React.FC<MagneticEffectProps> = ({ children, intensity = 15, disabled = false }) => {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, { stiffness: 300, damping: 20 });
    const springY = useSpring(y, { stiffness: 300, damping: 20 });

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (disabled || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.max(rect.width, rect.height) * 1.5;

        if (dist < maxDist) {
            const factor = (1 - dist / maxDist) * intensity;
            x.set(dx * factor / maxDist);
            y.set(dy * factor / maxDist);
        }
    }, [disabled, intensity, x, y]);

    const handleMouseLeave = useCallback(() => {
        x.set(0);
        y.set(0);
    }, [x, y]);

    return (
        <motion.div
            ref={ref}
            className="inline-block"
            style={{ x: springX, y: springY }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {children}
        </motion.div>
    );
};

export default MagneticEffect;
