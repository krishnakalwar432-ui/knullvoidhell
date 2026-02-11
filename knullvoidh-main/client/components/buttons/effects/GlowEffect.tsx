import React from 'react';
import { motion } from 'framer-motion';

interface GlowEffectProps {
    color: string;
    intensity?: number; // 0-1
    isHovered: boolean;
    mousePos?: { x: number; y: number }; // relative 0-1
}

const GlowEffect: React.FC<GlowEffectProps> = ({ color, intensity = 0.6, isHovered, mousePos }) => {
    const bgX = mousePos ? `${mousePos.x * 100}%` : '50%';
    const bgY = mousePos ? `${mousePos.y * 100}%` : '50%';

    return (
        <>
            {/* Outer glow aura */}
            <motion.span
                className="absolute -inset-1 rounded-[inherit] pointer-events-none"
                style={{
                    background: `radial-gradient(ellipse at ${bgX} ${bgY}, ${color}40, transparent 70%)`,
                    filter: 'blur(8px)',
                    zIndex: 0,
                }}
                animate={{
                    opacity: isHovered ? intensity : intensity * 0.3,
                    scale: isHovered ? 1.08 : 1,
                }}
                transition={{ duration: 0.3 }}
            />
            {/* Inner shimmer sweep */}
            <motion.span
                className="absolute inset-0 rounded-[inherit] pointer-events-none overflow-hidden"
                style={{ zIndex: 2 }}
            >
                <motion.span
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `linear-gradient(105deg, transparent 40%, ${color}18 45%, ${color}30 50%, ${color}18 55%, transparent 60%)`,
                    }}
                    animate={isHovered ? {
                        x: ['100%', '-100%'],
                    } : {}}
                    transition={isHovered ? {
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 1,
                        ease: 'easeInOut',
                    } : {}}
                />
            </motion.span>
        </>
    );
};

export default GlowEffect;
