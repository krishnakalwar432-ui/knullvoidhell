import React, { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/themes/ThemeProvider";

interface GamePageWrapperProps {
    children: React.ReactNode;
    gameTitle?: string;
}

const GamePageWrapper: React.FC<GamePageWrapperProps> = ({ children, gameTitle }) => {
    const { currentTheme } = useTheme();
    const navigate = useNavigate();
    const c = currentTheme.colors;
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    return (
        <div ref={containerRef} className="relative min-h-screen" style={{ background: c.bg }}>
            {/* Top HUD Bar */}
            <motion.div
                className="sticky top-0 z-50 flex items-center justify-between px-4 py-2 border-b backdrop-blur-md"
                style={{
                    background: `${c.card}e6`,
                    borderColor: c.cardBorder,
                    fontFamily: currentTheme.font,
                }}
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
            >
                {/* Left: Back */}
                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all hover:scale-105"
                    style={{
                        borderColor: c.cardBorder,
                        color: c.text,
                        background: c.buttonBg,
                    }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Back to Games</span>
                </button>

                {/* Center: Title */}
                {gameTitle && (
                    <h1 className="text-sm font-bold tracking-wider uppercase truncate mx-4" style={{ color: c.text }}>
                        {gameTitle}
                    </h1>
                )}

                {/* Right: Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullscreen}
                        className="w-8 h-8 rounded-lg border flex items-center justify-center transition-all hover:scale-110"
                        style={{ borderColor: c.cardBorder, color: c.textMuted, background: c.buttonBg }}
                        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                    >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                </div>
            </motion.div>

            {/* Corner Brackets */}
            <div className="absolute top-14 left-4 w-5 h-5 border-l-2 border-t-2 pointer-events-none opacity-30" style={{ borderColor: c.primary }} />
            <div className="absolute top-14 right-4 w-5 h-5 border-r-2 border-t-2 pointer-events-none opacity-30" style={{ borderColor: c.primary }} />
            <div className="absolute bottom-4 left-4 w-5 h-5 border-l-2 border-b-2 pointer-events-none opacity-30" style={{ borderColor: c.primary }} />
            <div className="absolute bottom-4 right-4 w-5 h-5 border-r-2 border-b-2 pointer-events-none opacity-30" style={{ borderColor: c.primary }} />

            {/* Glowing border line at top */}
            <div
                className="h-[1px] w-full"
                style={{
                    background: `linear-gradient(90deg, transparent, ${c.primary}, ${c.secondary}, ${c.primary}, transparent)`,
                    boxShadow: `0 0 8px ${c.glow}`,
                }}
            />

            {/* Game Content — completely untouched */}
            <div className="relative z-10">
                {children}
            </div>

            {/* Bottom accent */}
            <div
                className="h-[1px] w-full mt-auto"
                style={{
                    background: `linear-gradient(90deg, transparent, ${c.primary}40, transparent)`,
                }}
            />
        </div>
    );
};

export default GamePageWrapper;
