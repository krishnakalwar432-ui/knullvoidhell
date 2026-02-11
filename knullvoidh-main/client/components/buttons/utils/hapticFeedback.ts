// Vibration API wrapper for haptic feedback on mobile devices
export type HapticPattern = 'click' | 'success' | 'error' | 'light';

const patterns: Record<HapticPattern, number | number[]> = {
    click: 10,
    light: 5,
    success: [10, 30, 10],
    error: [20, 40, 20, 40, 20],
};

let enabled = true;
export function setHapticEnabled(v: boolean) { enabled = v; }

export function triggerHaptic(pattern: HapticPattern = 'click') {
    if (!enabled) return;
    try {
        if ('vibrate' in navigator) {
            navigator.vibrate(patterns[pattern]);
        }
    } catch { /* silent fail — not all devices support vibrate */ }
}
