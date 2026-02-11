import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlowEffect from './effects/GlowEffect';
import RippleEffect from './effects/RippleEffect';
import type { RippleData, DynamicButtonProps } from './utils/buttonTypes';

const EnhancedButton: React.FC<DynamicButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
  particles = true,
  glow = true,
  ripple = true,
  className = '',
  type = 'button',
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState<RippleData[]>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | undefined>();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleIdRef = useRef(0);

  // Size classes
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white border border-purple-500/50',
    secondary: 'bg-gradient-to-r from-pink-600 to-orange-600 text-white border border-pink-500/50',
    ghost: 'bg-transparent text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/10',
    destructive: 'bg-gradient-to-r from-red-600 to-pink-600 text-white border border-red-500/50',
    icon: 'p-2 bg-transparent border border-gray-500/30 text-gray-300 hover:text-white',
    external: 'bg-transparent text-white border border-white/10 hover:border-white/30 hover:bg-white/6 backdrop-blur-sm px-3 py-1.5 rounded-lg',
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || !glow) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setMousePos({
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos(undefined);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // Create ripple effect
    if (ripple && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newRipple: RippleData = {
        id: rippleIdRef.current++,
        x,
        y,
        color: variant === 'destructive' ? '#ef4444' : '#06b6d4',
      };

      setRipples((prev) => [...prev, newRipple]);
    }

    onClick?.(e);
  };

  const handleRippleComplete = (id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  };

  const glowColors = {
    primary: '#a855f7',
    secondary: '#f97316',
    ghost: '#06b6d4',
    destructive: '#ef4444',
    icon: '#64748b',
    external: '#06b6d4',
  };

  return (
    <motion.button
      ref={buttonRef}
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      whileHover={!disabled && !loading ? { scale: 1.05 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.95 } : {}}
      className={`
        relative overflow-hidden rounded-lg font-semibold
        transition-all duration-300 ease-out
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${loading ? 'opacity-75' : ''}
        ${className}
      `}
      style={{ position: 'relative' }}
    >
      {/* Glow Effect Background */}
      {glow && !disabled && (
        <GlowEffect
          color={glowColors[variant]}
          intensity={0.6}
          isHovered={isHovered}
          mousePos={mousePos}
        />
      )}

      {/* Ripple Effect */}
      {ripple && <RippleEffect ripples={ripples} onComplete={handleRippleComplete} />}

      {/* Content */}
      <motion.span
        className="relative z-10 flex items-center justify-center gap-2"
        animate={loading ? { opacity: [1, 0.7, 1] } : {}}
        transition={loading ? { duration: 1.5, repeat: Infinity } : {}}
      >
        {loading && (
          <motion.span
            className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        )}
        {children}
      </motion.span>

      {/* Hover Border Glow */}
      {!disabled && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            border: `2px solid ${glowColors[variant]}`,
            boxShadow: `0 0 20px ${glowColors[variant]}`,
          }}
          animate={{
            opacity: isHovered ? 0.6 : 0.2,
            boxShadow: isHovered
              ? `0 0 30px ${glowColors[variant]}, inset 0 0 20px ${glowColors[variant]}40`
              : `0 0 10px ${glowColors[variant]}`,
          }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  );
};

export default EnhancedButton;
