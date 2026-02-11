import React, { useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/themes/ThemeProvider";

interface Trail {
    x: number; y: number; alpha: number; size: number; color: string;
}

const CursorTrail: React.FC = () => {
    const { currentTheme, reducedMotion } = useTheme();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const trails = useRef<Trail[]>([]);
    const mouse = useRef({ x: -100, y: -100 });
    const raf = useRef<number>(0);

    const colors = [
        currentTheme.colors.primary,
        currentTheme.colors.secondary,
        currentTheme.colors.accent,
    ];

    const handleMouseMove = useCallback((e: MouseEvent) => {
        mouse.current = { x: e.clientX, y: e.clientY };
        // Add trail particles
        for (let i = 0; i < 2; i++) {
            trails.current.push({
                x: e.clientX + (Math.random() - 0.5) * 8,
                y: e.clientY + (Math.random() - 0.5) * 8,
                alpha: 0.8,
                size: 2 + Math.random() * 3,
                color: colors[Math.floor(Math.random() * colors.length)],
            });
        }
        // Cap trail length
        if (trails.current.length > 60) trails.current = trails.current.slice(-60);
    }, [colors]);

    useEffect(() => {
        if (reducedMotion) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();

        window.addEventListener("resize", resize);
        window.addEventListener("mousemove", handleMouseMove);

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw and fade trail particles
            trails.current = trails.current.filter(t => {
                t.alpha -= 0.025;
                t.size *= 0.97;

                if (t.alpha <= 0) return false;

                ctx.beginPath();
                ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
                ctx.fillStyle = t.color;
                ctx.globalAlpha = t.alpha;
                ctx.fill();

                // Glow
                ctx.beginPath();
                ctx.arc(t.x, t.y, t.size * 2.5, 0, Math.PI * 2);
                ctx.fillStyle = t.color;
                ctx.globalAlpha = t.alpha * 0.2;
                ctx.fill();

                return true;
            });

            // Draw main cursor dot
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(mouse.current.x, mouse.current.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = currentTheme.colors.primary;
            ctx.fill();

            // Cursor ring
            ctx.beginPath();
            ctx.arc(mouse.current.x, mouse.current.y, 12, 0, Math.PI * 2);
            ctx.strokeStyle = currentTheme.colors.primary;
            ctx.globalAlpha = 0.3;
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.globalAlpha = 1;
            raf.current = requestAnimationFrame(animate);
        };

        raf.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(raf.current);
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, [currentTheme, reducedMotion, handleMouseMove]);

    if (reducedMotion) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: 9998 }}
        />
    );
};

export default CursorTrail;
