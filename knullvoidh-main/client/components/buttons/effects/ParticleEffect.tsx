import React, { useEffect, useRef, useCallback } from 'react';

interface ParticleEffectProps {
    trigger: number; // increment to trigger burst
    colors: string[];
    count?: number;
    spread?: number;
    parentRef: React.RefObject<HTMLElement>;
    clickPos?: { x: number; y: number } | null;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    life: number;
    maxLife: number;
    rotation: number;
    rotationSpeed: number;
}

const ParticleEffect: React.FC<ParticleEffectProps> = ({
    trigger,
    colors,
    count = 14,
    spread = 140,
    parentRef,
    clickPos,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);
    const rafId = useRef<number>(0);

    const spawnParticles = useCallback((cx: number, cy: number) => {
        const newParticles: Particle[] = [];
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const speed = 1.5 + Math.random() * spread / 40;
            newParticles.push({
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1,
                maxLife: 0.4 + Math.random() * 0.4,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
            });
        }
        particles.current.push(...newParticles);
    }, [colors, count, spread]);

    // Trigger burst
    useEffect(() => {
        if (trigger <= 0) return;
        const canvas = canvasRef.current;
        const parent = parentRef.current;
        if (!canvas || !parent) return;

        const rect = parent.getBoundingClientRect();
        canvas.width = rect.width + 80;
        canvas.height = rect.height + 80;

        let cx: number, cy: number;
        if (clickPos) {
            cx = clickPos.x - rect.left + 40;
            cy = clickPos.y - rect.top + 40;
        } else {
            cx = canvas.width / 2;
            cy = canvas.height / 2;
        }
        spawnParticles(cx, cy);
    }, [trigger, spawnParticles, parentRef, clickPos]);

    // Animation loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const alive: Particle[] = [];

            for (const p of particles.current) {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.04; // gravity
                p.vx *= 0.98; // drag
                p.life -= 1 / 60 / p.maxLife;
                p.rotation += p.rotationSpeed;

                if (p.life <= 0) continue;
                alive.push(p);

                ctx.save();
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 6;

                // Draw diamond-shaped particle
                const s = p.size * p.life;
                ctx.beginPath();
                ctx.moveTo(0, -s);
                ctx.lineTo(s * 0.6, 0);
                ctx.moveTo(0, s);
                ctx.lineTo(-s * 0.6, 0);
                ctx.closePath();
                ctx.fill();

                // Circular glow
                ctx.beginPath();
                ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }

            particles.current = alive;

            if (alive.length > 0) {
                rafId.current = requestAnimationFrame(animate);
            }
        };

        rafId.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafId.current);
    }, [trigger]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute pointer-events-none"
            style={{ top: -40, left: -40, zIndex: 50 }}
        />
    );
};

export default ParticleEffect;
