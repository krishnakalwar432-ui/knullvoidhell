import React, { useEffect, useRef } from 'react';

interface TreeLogoProps {
  size?: number;
  className?: string;
}

const TreeLogo: React.FC<TreeLogoProps> = ({ size = 72, className }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      el.style.setProperty('--rx', `${dy * 8}deg`);
      el.style.setProperty('--ry', `${-dx * 8}deg`);
    };

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        width: size,
        height: size,
        transformStyle: 'preserve-3d',
        transform: 'rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))',
        filter: 'drop-shadow(0 0 12px rgba(0,255,180,0.6)) drop-shadow(0 0 24px rgba(0,200,255,0.35))'
      }}
      aria-label="Knullvoid tree logo"
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          <radialGradient id="leafGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#00ffd5" stopOpacity="1" />
            <stop offset="60%" stopColor="#00ffa0" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00ff66" stopOpacity="0.2" />
          </radialGradient>
          <linearGradient id="trunkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a3f7ff" />
            <stop offset="100%" stopColor="#00ffd0" />
          </linearGradient>
        </defs>
        <g>
          <ellipse cx="50" cy="40" rx="34" ry="30" fill="url(#leafGlow)" opacity="0.95">
            <animate attributeName="opacity" values="0.8;1;0.85" dur="6s" repeatCount="indefinite" />
          </ellipse>
          <path d="M48 35 Q50 22 52 35 Q60 38 52 42 Q50 55 48 42 Q40 38 48 35 Z" fill="#e6fff9" opacity="0.25" />
          <rect x="45.5" y="40" width="9" height="30" rx="2" fill="url(#trunkGrad)" />
          <path d="M35 65 L65 65 L55 75 L45 75 Z" fill="#6fffe0" opacity="0.6" />
          <circle cx="50" cy="18" r="3" fill="#e6fff9">
            <animate attributeName="r" values="2.5;3.5;3" dur="4s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
    </div>
  );
};

export default TreeLogo;
