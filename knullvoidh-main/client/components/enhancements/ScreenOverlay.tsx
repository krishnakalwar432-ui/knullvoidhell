import React from "react";
import { useTheme } from "@/themes/ThemeProvider";

/** Lightweight scan-lines + vignette overlay. pointer-events: none so it never blocks clicks. */
const ScreenOverlay: React.FC = () => {
    const { reducedMotion } = useTheme();
    if (reducedMotion) return null;

    return (
        <>
            {/* Scan lines */}
            <div
                className="fixed inset-0 pointer-events-none"
                style={{
                    zIndex: 9990,
                    background:
                        "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)",
                    mixBlendMode: "overlay",
                }}
            />
            {/* Vignette */}
            <div
                className="fixed inset-0 pointer-events-none"
                style={{
                    zIndex: 9989,
                    background:
                        "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.45) 100%)",
                }}
            />
        </>
    );
};

export default ScreenOverlay;
