import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Canvas Particle System ──
interface Particle {
    x: number; y: number; vx: number; vy: number;
    targetX: number; targetY: number;
    size: number; alpha: number; color: string;
    phase: number; // 0=explode, 1=converge, 2=stable
}

const COLORS = ["#a855f7", "#7c3aed", "#c084fc", "#ec4899", "#06b6d4", "#f97316", "#38bdf8", "#fbbf24"];

function createParticles(cx: number, cy: number, count: number): Particle[] {
    return Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        return {
            x: cx, y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            targetX: cx + (Math.random() - 0.5) * 200,
            targetY: cy + (Math.random() - 0.5) * 100,
            size: 1 + Math.random() * 2.5,
            alpha: 0.6 + Math.random() * 0.4,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            phase: 0,
        };
    });
}

// ── Status Terminal Lines ──
const STATUS_LINES = [
    { text: "INITIALIZING VOID MATRIX...", delay: 2000 },
    { text: "CALIBRATING QUANTUM FIELDS... ✓", delay: 3200 },
    { text: "RENDERING COSMIC LAYERS... ✓", delay: 4000 },
    { text: "SYNCHRONIZING VOID MATRIX... ✓", delay: 4800 },
    { text: "LOADING GAME MODULES... ✓", delay: 5400 },
    { text: "READY.", delay: 6200 },
];

// ── Number Scrambler ──
function useScrambleNumber(target: number, active: boolean, duration = 2000) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        if (!active) return;
        const start = performance.now();
        let raf: number;
        const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            // Add scramble jitter in early stages
            const jitter = progress < 0.8 ? Math.floor(Math.random() * 8) : 0;
            setDisplay(Math.min(Math.floor(eased * target) + jitter, target));
            if (progress < 1) raf = requestAnimationFrame(animate);
        };
        raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, [target, active, duration]);
    return display;
}

interface LoadingScreenProps {
    onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const [phase, setPhase] = useState(0); // 0-4
    const [progress, setProgress] = useState(0);
    const [visibleLines, setVisibleLines] = useState<string[]>([]);
    const [showSkip, setShowSkip] = useState(false);
    const [exiting, setExiting] = useState(false);
    const startTime = useRef(Date.now());
    const animFrameRef = useRef<number>(0);
    const completedRef = useRef(false);

    const percentage = useScrambleNumber(100, phase >= 2, 3000);

    // Check if user has seen intro before
    const skipIntro = useRef(localStorage.getItem("knullvoid-skip-intro") === "true");

    const finish = useCallback(() => {
        if (completedRef.current) return;
        completedRef.current = true;
        localStorage.setItem("knullvoid-intro-seen", "true");
        setExiting(true);
        setTimeout(onComplete, 800);
    }, [onComplete]);

    // Auto-skip for returning users
    useEffect(() => {
        if (skipIntro.current) {
            finish();
            return;
        }
    }, [finish]);

    // Show skip button after 2s
    useEffect(() => {
        const t = setTimeout(() => setShowSkip(true), 2000);
        return () => clearTimeout(t);
    }, []);

    // ESC to skip
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") finish(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [finish]);

    // Phase progression
    useEffect(() => {
        if (skipIntro.current) return;
        const timers = [
            setTimeout(() => setPhase(1), 1500),  // Genesis
            setTimeout(() => setPhase(2), 3000),  // Convergence
            setTimeout(() => setPhase(3), 5000),  // Stabilization
            setTimeout(() => setPhase(4), 6500),  // Launch
            setTimeout(() => finish(), 7500),     // Complete
        ];
        return () => timers.forEach(clearTimeout);
    }, [finish]);

    // Status lines
    useEffect(() => {
        if (skipIntro.current) return;
        const timers = STATUS_LINES.map(({ text, delay }) =>
            setTimeout(() => setVisibleLines(prev => [...prev, text]), delay)
        );
        return () => timers.forEach(clearTimeout);
    }, []);

    // Progress bar
    useEffect(() => {
        if (skipIntro.current) return;
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime.current;
            setProgress(Math.min((elapsed / 6500) * 100, 100));
        }, 50);
        return () => clearInterval(interval);
    }, []);

    // ── Canvas Particle Animation ──
    useEffect(() => {
        if (skipIntro.current) return;
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

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        particlesRef.current = createParticles(cx, cy, 600);

        // Letter target positions for "KNULLVOID"
        const letters = "KNULLVOID";
        const letterSpacing = 38;
        const startX = cx - ((letters.length - 1) * letterSpacing) / 2;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const elapsed = Date.now() - startTime.current;

            particlesRef.current.forEach((p, i) => {
                if (elapsed < 1500) {
                    // Phase 1: Explode outward
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vx *= 0.98;
                    p.vy *= 0.98;
                    p.alpha = Math.max(0.1, p.alpha - 0.002);
                } else if (elapsed < 3000) {
                    // Phase 2: Converge to letter positions
                    const letterIdx = i % letters.length;
                    const tx = startX + letterIdx * letterSpacing;
                    const ty = cy + (Math.random() - 0.5) * 20;
                    p.x += (tx - p.x) * 0.04;
                    p.y += (ty - p.y) * 0.04;
                    p.alpha = Math.min(1, p.alpha + 0.01);
                } else if (elapsed < 5000) {
                    // Phase 3: Orbit around formation
                    const letterIdx = i % letters.length;
                    const tx = startX + letterIdx * letterSpacing;
                    const ty = cy;
                    const dist = Math.sqrt((p.x - tx) ** 2 + (p.y - ty) ** 2);
                    if (dist > 30) {
                        p.x += (tx - p.x) * 0.06;
                        p.y += (ty - p.y) * 0.06;
                    } else {
                        // Orbit
                        const angle = (elapsed * 0.002) + (i * 0.1);
                        const orbitR = 5 + (i % 20);
                        p.x = tx + Math.cos(angle) * orbitR;
                        p.y = ty + Math.sin(angle) * orbitR;
                    }
                    p.alpha = 0.5 + Math.sin(elapsed * 0.005 + i) * 0.3;
                } else {
                    // Phase 4-5: Stable glow
                    const letterIdx = i % letters.length;
                    const tx = startX + letterIdx * letterSpacing;
                    const ty = cy;
                    const angle = (elapsed * 0.001) + (i * 0.1);
                    const orbitR = 3 + (i % 15);
                    p.x = tx + Math.cos(angle) * orbitR;
                    p.y = ty + Math.sin(angle) * orbitR;
                    p.alpha = 0.4 + Math.sin(elapsed * 0.003 + i * 0.5) * 0.4;
                }

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.alpha;
                ctx.fill();

                // Glow
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.alpha * 0.15;
                ctx.fill();
            });

            ctx.globalAlpha = 1;
            animFrameRef.current = requestAnimationFrame(animate);
        };

        animFrameRef.current = requestAnimationFrame(animate);
        return () => {
            cancelAnimationFrame(animFrameRef.current);
            window.removeEventListener("resize", resize);
        };
    }, []);

    if (skipIntro.current && !exiting) return null;

    return (
        <AnimatePresence>
            {!exiting ? (
                <motion.div
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
                    style={{ background: "#000" }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    {/* Grain overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.04] z-10"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                        }}
                    />

                    {/* Scan lines */}
                    {phase >= 3 && (
                        <motion.div
                            className="absolute inset-0 pointer-events-none z-20"
                            style={{
                                background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        />
                    )}

                    {/* Canvas particles */}
                    <canvas ref={canvasRef} className="absolute inset-0 z-0" />

                    {/* ── Phase 1: Void orb ── */}
                    {phase === 0 && (
                        <motion.div
                            className="absolute z-10"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: [0, 0.3, 1], opacity: [0, 0.5, 1] }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        >
                            <div
                                className="w-4 h-4 rounded-full"
                                style={{
                                    background: "radial-gradient(circle, #a855f7, #7c3aed, transparent)",
                                    boxShadow: "0 0 40px 20px rgba(168,85,247,0.5), 0 0 80px 40px rgba(124,58,237,0.3)",
                                }}
                            />
                        </motion.div>
                    )}

                    {/* ── Phase 2+: KNULLVOID Text ── */}
                    {phase >= 1 && (
                        <motion.div
                            className="relative z-30 flex items-center justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h1
                                className="text-5xl md:text-7xl lg:text-8xl font-black tracking-wider select-none"
                                style={{ fontFamily: "'Orbitron', sans-serif" }}
                            >
                                {"KNULLVOID".split("").map((letter, i) => (
                                    <motion.span
                                        key={i}
                                        className="inline-block"
                                        style={{
                                            color: "transparent",
                                            background: `linear-gradient(180deg, #c084fc 0%, #a855f7 40%, #7c3aed 100%)`,
                                            WebkitBackgroundClip: "text",
                                            backgroundClip: "text",
                                            textShadow: phase >= 3
                                                ? "0 0 40px rgba(168,85,247,0.8), 0 0 80px rgba(124,58,237,0.5)"
                                                : "none",
                                            filter: `drop-shadow(0 0 ${phase >= 3 ? 12 : 6}px rgba(168,85,247,0.8))`,
                                        }}
                                        initial={{ opacity: 0, y: 40, scale: 0.5, rotateX: 90 }}
                                        animate={{
                                            opacity: phase >= 2 ? 1 : [0, 1, 0.7, 1],
                                            y: 0,
                                            scale: 1,
                                            rotateX: 0,
                                        }}
                                        transition={{
                                            delay: i * 0.08,
                                            duration: 0.6,
                                            ease: "easeOut",
                                        }}
                                    >
                                        {letter}
                                    </motion.span>
                                ))}
                            </h1>

                            {/* Orbital ring */}
                            {phase >= 2 && (
                                <motion.div
                                    className="absolute pointer-events-none"
                                    style={{
                                        width: "120%",
                                        height: "120%",
                                        border: "1px solid rgba(168,85,247,0.2)",
                                        borderRadius: "50%",
                                    }}
                                    initial={{ scale: 0, opacity: 0, rotate: 0 }}
                                    animate={{ scale: 1, opacity: 0.5, rotate: 360 }}
                                    transition={{ duration: 8, ease: "linear", repeat: Infinity }}
                                />
                            )}
                            {phase >= 2 && (
                                <motion.div
                                    className="absolute pointer-events-none"
                                    style={{
                                        width: "140%",
                                        height: "80%",
                                        border: "1px solid rgba(124,58,237,0.15)",
                                        borderRadius: "50%",
                                    }}
                                    initial={{ scale: 0, opacity: 0, rotate: 45 }}
                                    animate={{ scale: 1, opacity: 0.4, rotate: 405 }}
                                    transition={{ duration: 12, ease: "linear", repeat: Infinity }}
                                />
                            )}
                        </motion.div>
                    )}

                    {/* ── HUD Corners ── */}
                    {phase >= 3 && (
                        <>
                            {[
                                { top: 16, left: 16, borderTop: true, borderLeft: true },
                                { top: 16, right: 16, borderTop: true, borderRight: true },
                                { bottom: 16, left: 16, borderBottom: true, borderLeft: true },
                                { bottom: 16, right: 16, borderBottom: true, borderRight: true },
                            ].map((pos, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute z-40 w-8 h-8"
                                    style={{
                                        ...Object.fromEntries(
                                            Object.entries(pos).filter(([k]) => ["top", "left", "right", "bottom"].includes(k))
                                        ),
                                        borderColor: "rgba(168,85,247,0.4)",
                                        borderTopWidth: pos.borderTop ? 2 : 0,
                                        borderBottomWidth: pos.borderBottom ? 2 : 0,
                                        borderLeftWidth: pos.borderLeft ? 2 : 0,
                                        borderRightWidth: pos.borderRight ? 2 : 0,
                                    }}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 * i, duration: 0.3 }}
                                />
                            ))}
                        </>
                    )}

                    {/* ── Progress Bar ── */}
                    {phase >= 2 && (
                        <motion.div
                            className="absolute bottom-32 left-1/2 -translate-x-1/2 z-40 w-64 md:w-80"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Percentage */}
                            <div className="flex justify-between items-center mb-2">
                                <span
                                    className="text-xs font-mono tracking-widest"
                                    style={{ color: "rgba(168,85,247,0.7)", fontFamily: "'Orbitron', sans-serif" }}
                                >
                                    LOADING
                                </span>
                                <span
                                    className="text-sm font-mono font-bold tabular-nums"
                                    style={{ color: "#a855f7", fontFamily: "'Orbitron', sans-serif" }}
                                >
                                    {percentage}%
                                </span>
                            </div>

                            {/* Bar */}
                            <div
                                className="h-1 rounded-full overflow-hidden"
                                style={{ background: "rgba(168,85,247,0.15)" }}
                            >
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{
                                        background: "linear-gradient(90deg, #7c3aed, #a855f7, #c084fc)",
                                        boxShadow: "0 0 12px rgba(168,85,247,0.6)",
                                        width: `${progress}%`,
                                    }}
                                    transition={{ duration: 0.1 }}
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* ── Status Terminal ── */}
                    {phase >= 2 && (
                        <motion.div
                            className="absolute bottom-44 left-1/2 -translate-x-1/2 z-40 w-64 md:w-80"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="space-y-1">
                                {visibleLines.map((line, i) => (
                                    <motion.div
                                        key={i}
                                        className="text-[10px] font-mono tracking-wider"
                                        style={{
                                            color: line.includes("READY") ? "#4ade80" : line.includes("✓") ? "rgba(168,85,247,0.6)" : "rgba(168,85,247,0.4)",
                                            fontFamily: "'Rajdhani', monospace",
                                        }}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {line.includes("READY") ? "▸ " : "  "}{line}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── Phase 4: Launch flash ── */}
                    {phase >= 4 && (
                        <motion.div
                            className="absolute inset-0 z-50 pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.7, 0] }}
                            transition={{ duration: 0.6 }}
                            style={{ background: "radial-gradient(circle, rgba(168,85,247,0.4), transparent 70%)" }}
                        />
                    )}

                    {/* ── Skip Button ── */}
                    {showSkip && (
                        <motion.button
                            className="absolute bottom-6 right-6 z-50 text-xs font-mono px-3 py-1.5 rounded-md border transition-colors"
                            style={{
                                color: "rgba(168,85,247,0.5)",
                                borderColor: "rgba(168,85,247,0.2)",
                                background: "rgba(0,0,0,0.5)",
                                fontFamily: "'Rajdhani', sans-serif",
                            }}
                            onClick={finish}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            whileHover={{ color: "#a855f7", borderColor: "rgba(168,85,247,0.5)" }}
                        >
                            SKIP ⏭ (ESC)
                        </motion.button>
                    )}

                    {/* ── Don't show again checkbox ── */}
                    {showSkip && (
                        <motion.label
                            className="absolute bottom-6 left-6 z-50 text-[10px] font-mono flex items-center gap-1.5 cursor-pointer"
                            style={{ color: "rgba(168,85,247,0.4)", fontFamily: "'Rajdhani', sans-serif" }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <input
                                type="checkbox"
                                className="w-3 h-3 accent-purple-500"
                                onChange={(e) => localStorage.setItem("knullvoid-skip-intro", String(e.target.checked))}
                            />
                            Don't show again
                        </motion.label>
                    )}
                </motion.div>
            ) : (
                /* ── Exit warp effect ── */
                <motion.div
                    className="fixed inset-0 z-[9999] pointer-events-none"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    style={{
                        background: "radial-gradient(circle, rgba(168,85,247,0.3), #000 70%)",
                    }}
                />
            )}
        </AnimatePresence>
    );
};

export default LoadingScreen;
