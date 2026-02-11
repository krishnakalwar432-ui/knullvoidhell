import React, { useRef, useCallback, useState } from 'react';

interface HoverTiltProps {
    children: React.ReactNode;
    intensity?: number; // degrees
    disabled?: boolean;
}

const HoverTilt: React.FC<HoverTiltProps> = ({ children, intensity = 8, disabled = false }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState('perspective(600px) rotateX(0deg) rotateY(0deg)');

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (disabled || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setTransform(`perspective(600px) rotateX(${-y * intensity}deg) rotateY(${x * intensity}deg)`);
    }, [disabled, intensity]);

    const handleMouseLeave = useCallback(() => {
        setTransform('perspective(600px) rotateX(0deg) rotateY(0deg)');
    }, []);

    return (
        <div
            ref={ref}
            style={{
                transform,
                transition: 'transform 0.15s ease-out',
                transformStyle: 'preserve-3d',
                willChange: 'transform',
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {children}
        </div>
    );
};

export default HoverTilt;
