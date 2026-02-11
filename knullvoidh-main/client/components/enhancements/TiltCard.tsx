import React, { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    glowColor?: string;
    intensity?: number;
}

/**
 * Non-destructive 3D tilt wrapper for game cards.
 * Wrap any card content with this to get mouse-following 3D perspective tilt,
 * dynamic glow, and a reflection sheen effect.
 * Children remain fully interactive and untouched.
 */
const TiltCard: React.FC<TiltCardProps> = ({
    children,
    className = "",
    style = {},
    glowColor = "rgba(168,85,247,0.3)",
    intensity = 12,
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!ref.current) return;
            const rect = ref.current.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            setTilt({
                x: (y - 0.5) * -intensity,
                y: (x - 0.5) * intensity,
            });
            setGlowPos({ x: x * 100, y: y * 100 });
        },
        [intensity]
    );

    const handleMouseLeave = useCallback(() => {
        setTilt({ x: 0, y: 0 });
        setIsHovered(false);
    }, []);

    return (
        <motion.div
            ref={ref}
            className={className}
            style={{
                ...style,
                perspective: "1000px",
                transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            animate={{
                rotateX: tilt.x,
                rotateY: tilt.y,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            {/* Dynamic glow that follows mouse */}
            {isHovered && (
                <div
                    className="absolute inset-0 pointer-events-none rounded-xl z-0"
                    style={{
                        background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, ${glowColor}, transparent 60%)`,
                        opacity: 0.5,
                    }}
                />
            )}

            {/* Reflection sheen */}
            {isHovered && (
                <div
                    className="absolute inset-0 pointer-events-none rounded-xl z-[1]"
                    style={{
                        background: `linear-gradient(${105 + tilt.y * 3}deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)`,
                    }}
                />
            )}

            {/* Actual content — fully interactive */}
            <div className="relative z-[2]">{children}</div>
        </motion.div>
    );
};

export default TiltCard;
