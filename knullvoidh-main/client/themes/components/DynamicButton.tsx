import React, { useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/themes/ThemeProvider';
import { ThemeName } from '@/themes/themeConfig';

// Utils
import type { DynamicButtonProps, RippleData, ThemeButtonConfig, ButtonVariant } from '@/components/buttons/utils/buttonTypes';
import { SIZE_CLASSES } from '@/components/buttons/utils/buttonTypes';
import { playSound } from '@/components/buttons/utils/soundManager';
import { triggerHaptic } from '@/components/buttons/utils/hapticFeedback';
import { buttonMotionVariants } from '@/components/buttons/utils/animations';

// Effects
import RippleEffect from '@/components/buttons/effects/RippleEffect';
import GlowEffect from '@/components/buttons/effects/GlowEffect';
import ParticleEffect from '@/components/buttons/effects/ParticleEffect';
import MagneticEffect from '@/components/buttons/effects/MagneticEffect';
import HoverTilt from '@/components/buttons/effects/HoverTilt';

// Theme variant configs
import { voidGalaxyConfig } from '@/components/buttons/variants/VoidGalaxyButton';
import { nebulaStormConfig } from '@/components/buttons/variants/NebulaStormButton';
import { solarFlareConfig } from '@/components/buttons/variants/SolarFlareButton';
import { quantumFrostConfig } from '@/components/buttons/variants/QuantumFrostButton';
import { cosmicMidnightConfig } from '@/components/buttons/variants/CosmicMidnightButton';

// CSS
import '@/components/buttons/styles/buttonBase.css';
import '@/components/buttons/styles/buttonThemes.css';

// ── Theme config map ──
const themeConfigs: Record<ThemeName, ThemeButtonConfig> = {
  voidGalaxy: voidGalaxyConfig,
  nebulaStorm: nebulaStormConfig,
  solarFlare: solarFlareConfig,
  quantumFrost: quantumFrostConfig,
  cosmicMidnight: cosmicMidnightConfig,
};

// ── Ripple counter ──
let rippleCounter = 0;

const DynamicButton: React.FC<DynamicButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  onHoverStart,
  onHoverEnd,
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  success = false,
  error = false,
  particles = true,
  sound = false,
  haptic = false,
  magnetic = false,
  tilt = false,
  ripple = true,
  glow = true,
  'aria-label': ariaLabel,
  shortcut,
  tabIndex,
  animationDuration = 0.3,
  scaleOnHover = 1.05,
  as = 'button',
  href,
  target,
  rel,
  type = 'button',
  className = '',
  style,
  id,
  title,
}) => {
  const { currentTheme, themeName, reducedMotion } = useTheme();
  const btnRef = useRef<HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState<RippleData[]>([]);
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  const tc = themeConfigs[themeName] || themeConfigs.voidGalaxy;
  const c = currentTheme.colors;
  const isIconOnly = variant === 'icon';
  const isDisabled = disabled || loading;

  // ── Variant styles ──
  const variantStyle = useMemo((): React.CSSProperties => {
    const base: React.CSSProperties = {
      fontFamily: currentTheme.font,
      willChange: 'transform, box-shadow',
    };

    switch (variant) {
      case 'primary':
        return {
          ...base,
          background: tc.gradients.primary,
          borderColor: tc.borderColor,
          color: tc.textColor,
          boxShadow: `0 0 15px ${tc.glowColor}, inset 0 0 12px rgba(255,255,255,0.04)`,
        };
      case 'secondary':
        return {
          ...base,
          background: `${c.primary}08`,
          borderColor: `${c.primary}35`,
          color: c.text,
          backdropFilter: 'blur(12px)',
        };
      case 'ghost':
        return {
          ...base,
          background: 'transparent',
          borderColor: 'transparent',
          color: c.textMuted,
        };
      case 'icon':
        return {
          ...base,
          background: `${c.primary}12`,
          borderColor: `${c.primary}30`,
          color: c.primary,
        };
      case 'destructive':
        return {
          ...base,
          background: tc.gradients.destructive,
          borderColor: 'rgba(239, 68, 68, 0.5)',
          color: '#fecaca',
          boxShadow: '0 0 12px rgba(239, 68, 68, 0.3)',
        };
      default:
        return base;
    }
  }, [variant, tc, c, currentTheme.font]);

  // ── Hover style overrides ──
  const hoverStyle = useMemo((): React.CSSProperties => {
    if (!isHovered || isDisabled) return {};
    switch (variant) {
      case 'primary':
        return {
          background: tc.gradients.primaryHover,
          borderColor: tc.borderColorHover,
          boxShadow: `0 0 25px ${tc.glowColor}, 0 0 50px ${tc.glowColor}, inset 0 0 20px rgba(255,255,255,0.06)`,
        };
      case 'secondary':
        return {
          background: `${c.primary}18`,
          borderColor: `${c.primary}60`,
          boxShadow: `0 0 15px ${tc.glowColor}`,
        };
      case 'ghost':
        return {
          background: `${c.primary}08`,
          color: c.primary,
        };
      case 'icon':
        return {
          background: `${c.primary}25`,
          borderColor: `${c.primary}60`,
          boxShadow: `0 0 12px ${tc.glowColor}`,
        };
      case 'destructive':
        return {
          boxShadow: '0 0 25px rgba(239, 68, 68, 0.5), 0 0 50px rgba(239, 68, 68, 0.2)',
        };
      default:
        return {};
    }
  }, [isHovered, isDisabled, variant, tc, c]);

  // ── Handlers ──
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  const handleHoverStart = useCallback(() => {
    setIsHovered(true);
    if (sound) playSound('hover');
    onHoverStart?.();
  }, [sound, onHoverStart]);

  const handleHoverEnd = useCallback(() => {
    setIsHovered(false);
    onHoverEnd?.();
  }, [onHoverEnd]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (isDisabled) return;

    // Ripple
    if (ripple && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setRipples(prev => [...prev, { id: ++rippleCounter, x, y, color: tc.glowColor }]);
    }

    // Particles
    if (particles && !reducedMotion) {
      setClickPos({ x: e.clientX, y: e.clientY });
      setParticleTrigger(prev => prev + 1);
    }

    // Sound & haptic
    if (sound) playSound(variant === 'destructive' ? 'whoosh' : 'click');
    if (haptic) triggerHaptic(variant === 'destructive' ? 'error' : 'click');

    onClick?.(e);
  }, [isDisabled, ripple, particles, reducedMotion, sound, haptic, variant, tc.glowColor, onClick]);

  const removeRipple = useCallback((id: number) => {
    setRipples(prev => prev.filter(r => r.id !== id));
  }, []);

  // ── Motion variants ──
  const motionConfig = useMemo(() => {
    if (reducedMotion || isDisabled) return {};
    return {
      whileHover: { scale: scaleOnHover, y: -2, transition: { type: 'spring' as const, stiffness: 400, damping: 15 } },
      whileTap: { scale: 0.95, y: 1, transition: { type: 'spring' as const, stiffness: 500, damping: 20 } },
    };
  }, [reducedMotion, isDisabled, scaleOnHover]);

  // ── Success / Error overlay ──
  const stateOverlay = useMemo(() => {
    if (success) return { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.6)', icon: '✓', color: '#4ade80' };
    if (error) return { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.6)', icon: '✕', color: '#f87171' };
    return null;
  }, [success, error]);

  // ── Build class names ──
  const classNames = [
    'kv-btn',
    SIZE_CLASSES[size],
    `kv-btn-${variant}`,
    isIconOnly && 'kv-btn-icon-only',
    variant === 'primary' && tc.scanlineOpacity > 0 && 'kv-btn-scanline',
    variant === 'primary' && 'kv-btn-shimmer',
    variant === 'destructive' && 'kv-btn-destructive',
    loading && 'kv-btn-loading',
    className,
  ].filter(Boolean).join(' ');

  // ── Element props ──
  const Tag = as as any;
  const elProps: any = {
    id,
    title,
    ref: btnRef,
    className: classNames,
    style: { ...variantStyle, ...hoverStyle, ...(stateOverlay ? { background: stateOverlay.bg, borderColor: stateOverlay.border } : {}), ...style },
    onClick: handleClick,
    onMouseMove: handleMouseMove,
    onMouseEnter: handleHoverStart,
    onMouseLeave: handleHoverEnd,
    'aria-label': ariaLabel,
    'aria-disabled': isDisabled || undefined,
    tabIndex: isDisabled ? -1 : tabIndex,
  };

  if (as === 'button') {
    elProps.type = type;
    elProps.disabled = isDisabled;
  } else {
    elProps.href = href;
    elProps.target = target;
    elProps.rel = rel;
  }

  // ── Content ──
  const content = (
    <>
      {/* Glow Effect */}
      {glow && !reducedMotion && variant !== 'ghost' && (
        <GlowEffect
          color={variant === 'destructive' ? 'rgba(239,68,68,0.5)' : tc.glowColor}
          isHovered={isHovered}
          mousePos={mousePos}
          intensity={variant === 'primary' ? 0.7 : 0.4}
        />
      )}

      {/* Ripple Effect */}
      {ripple && <RippleEffect ripples={ripples} onComplete={removeRipple} />}

      {/* Particle Effect */}
      {particles && !reducedMotion && (
        <ParticleEffect
          trigger={particleTrigger}
          colors={tc.particleColors}
          parentRef={btnRef as React.RefObject<HTMLElement>}
          clickPos={clickPos}
          count={isIconOnly ? 8 : 14}
        />
      )}

      {/* Content layer */}
      <span className="relative z-10 flex items-center gap-2 justify-center kv-btn-text">
        {/* Loading spinner */}
        {loading && (
          <motion.span
            className="kv-btn-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Success/Error icon */}
        {stateOverlay && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            transition={{ duration: 0.4 }}
            style={{ color: stateOverlay.color, fontWeight: 900 }}
          >
            {stateOverlay.icon}
          </motion.span>
        )}

        {/* Left icon */}
        {!loading && !stateOverlay && icon && iconPosition === 'left' && (
          <motion.span
            className="inline-flex"
            animate={isHovered && !reducedMotion ? { scale: 1.15, rotate: [0, -8, 8, 0] } : { scale: 1, rotate: 0 }}
            transition={{ duration: 0.3 }}
          >
            {icon}
          </motion.span>
        )}

        {/* Label */}
        {!isIconOnly && !loading && !stateOverlay && children}
        {loading && <span className="ml-1">{children || 'Loading...'}</span>}
        {stateOverlay && <span className="ml-1">{success ? 'Success!' : 'Error'}</span>}

        {/* Right icon */}
        {!loading && !stateOverlay && icon && iconPosition === 'right' && (
          <motion.span
            className="inline-flex"
            animate={isHovered && !reducedMotion ? { scale: 1.15 } : { scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {icon}
          </motion.span>
        )}

        {/* Icon-only content */}
        {isIconOnly && !loading && !stateOverlay && icon}

        {/* Keyboard shortcut hint */}
        {shortcut && <span className="kv-btn-shortcut">{shortcut}</span>}
      </span>
    </>
  );

  // ── Build button element ──
  const buttonElement = (
    <motion.div
      className="relative inline-block"
      {...motionConfig}
    >
      <Tag {...elProps}>
        {content}
      </Tag>
    </motion.div>
  );

  // ── Wrap with optional effects ──
  let wrapped = buttonElement;

  if (tilt && !reducedMotion && !isDisabled) {
    wrapped = <HoverTilt intensity={6}>{wrapped}</HoverTilt>;
  }

  if (magnetic && !reducedMotion && !isDisabled) {
    wrapped = <MagneticEffect intensity={12}>{wrapped}</MagneticEffect>;
  }

  return wrapped;
};

export default DynamicButton;
