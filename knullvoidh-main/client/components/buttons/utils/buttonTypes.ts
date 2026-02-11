import React from 'react';
import { ThemeName } from '@/themes/themeConfig';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon' | 'destructive' | 'external';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface DynamicButtonProps {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;

  // Content
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';

  // States
  loading?: boolean;
  disabled?: boolean;
  success?: boolean;
  error?: boolean;

  // Effects
  particles?: boolean;
  sound?: boolean;
  haptic?: boolean;
  magnetic?: boolean;
  tilt?: boolean;
  ripple?: boolean;
  glow?: boolean;

  // Accessibility
  'aria-label'?: string;
  shortcut?: string;
  tabIndex?: number;

  // Animation config
  animationDuration?: number;
  scaleOnHover?: number;

  // Polymorphic
  as?: 'button' | 'a';
  href?: string;
  target?: string;
  rel?: string;
  type?: 'button' | 'submit' | 'reset';

  // Custom
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  title?: string;
}

export interface ThemeButtonConfig {
  themeName: ThemeName;
  gradients: {
    primary: string;
    primaryHover: string;
    destructive: string;
  };
  glowColor: string;
  glowColorIntense: string;
  particleColors: string[];
  borderColor: string;
  borderColorHover: string;
  textColor: string;
  textColorMuted: string;
  shimmerColor: string;
  scanlineOpacity: number;
  specialEffect: 'orbiting' | 'lightning' | 'embers' | 'snowflakes' | 'stars';
}

export interface RippleData {
  id: number;
  x: number;
  y: number;
  color: string;
}

export const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: 'kv-btn-xs',
  sm: 'kv-btn-sm',
  md: 'kv-btn-md',
  lg: 'kv-btn-lg',
  xl: 'kv-btn-xl',
};
