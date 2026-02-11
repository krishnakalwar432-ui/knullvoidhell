import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RippleData } from '../utils/buttonTypes';

interface RippleEffectProps {
    ripples: RippleData[];
    onComplete: (id: number) => void;
}

const RippleEffect: React.FC<RippleEffectProps> = ({ ripples, onComplete }) => {
    return (
        <span className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none" style={{ zIndex: 5 }}>
            <AnimatePresence>
                {ripples.map((r) => (
                    <motion.span
                        key={r.id}
                        className="absolute rounded-full pointer-events-none"
                        style={{
                            left: r.x,
                            top: r.y,
                            width: 20,
                            height: 20,
                            marginLeft: -10,
                            marginTop: -10,
                            background: `radial-gradient(circle, ${r.color}60, ${r.color}20, transparent)`,
                        }}
                        initial={{ scale: 0, opacity: 0.7 }}
                        animate={{ scale: 6, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        onAnimationComplete={() => onComplete(r.id)}
                    />
                ))}
            </AnimatePresence>
        </span>
    );
};

export default RippleEffect;
