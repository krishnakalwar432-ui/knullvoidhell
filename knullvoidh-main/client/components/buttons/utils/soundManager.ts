// Procedural sound synthesis via Web Audio API — no external files needed
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
    try {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    } catch {
        return null;
    }
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.08) {
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, volume = 0.03) {
    const ctx = getCtx();
    if (!ctx) return;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 4000;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
}

export type SoundType = 'click' | 'hover' | 'success' | 'error' | 'whoosh';

const soundMap: Record<SoundType, () => void> = {
    click: () => {
        playTone(800, 0.08, 'square', 0.06);
        playNoise(0.05, 0.02);
    },
    hover: () => {
        playTone(1200, 0.06, 'sine', 0.03);
    },
    success: () => {
        playTone(523, 0.12, 'sine', 0.06);
        setTimeout(() => playTone(659, 0.12, 'sine', 0.06), 80);
        setTimeout(() => playTone(784, 0.18, 'sine', 0.06), 160);
    },
    error: () => {
        playTone(300, 0.15, 'sawtooth', 0.05);
        setTimeout(() => playTone(200, 0.2, 'sawtooth', 0.05), 100);
    },
    whoosh: () => {
        const ctx = getCtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
        playNoise(0.1, 0.015);
    },
};

let enabled = true;
export function setSoundEnabled(v: boolean) { enabled = v; }
export function isSoundEnabled() { return enabled; }

export function playSound(type: SoundType) {
    if (!enabled) return;
    try { soundMap[type](); } catch { /* silent fail */ }
}
