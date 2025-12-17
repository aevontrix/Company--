/**
 * ONTHEGO Design System
 * Strict design tokens for consistent UI
 */

export const spacing = {
  // 8-point grid system
  xs: '0.5rem',    // 8px
  sm: '1rem',      // 16px
  md: '1.5rem',    // 24px
  lg: '2rem',      // 32px
  xl: '3rem',      // 48px
  '2xl': '4rem',   // 64px
  '3xl': '6rem',   // 96px
} as const;

export const typography = {
  // Clear hierarchy
  display: {
    size: 'text-6xl lg:text-7xl',
    weight: 'font-black',
    lineHeight: 'leading-tight',
  },
  h1: {
    size: 'text-4xl lg:text-5xl',
    weight: 'font-bold',
    lineHeight: 'leading-tight',
  },
  h2: {
    size: 'text-3xl lg:text-4xl',
    weight: 'font-bold',
    lineHeight: 'leading-snug',
  },
  h3: {
    size: 'text-2xl lg:text-3xl',
    weight: 'font-semibold',
    lineHeight: 'leading-snug',
  },
  body: {
    size: 'text-base lg:text-lg',
    weight: 'font-normal',
    lineHeight: 'leading-relaxed',
  },
  caption: {
    size: 'text-sm',
    weight: 'font-medium',
    lineHeight: 'leading-normal',
  },
} as const;

export const borderRadius = {
  sm: 'rounded-lg',      // 8px
  md: 'rounded-xl',      // 12px
  lg: 'rounded-2xl',     // 16px
  xl: 'rounded-3xl',     // 24px
  full: 'rounded-full',
} as const;

export const container = {
  // Consistent container padding
  base: 'container mx-auto px-4 sm:px-6 lg:px-8',
  section: 'py-16 lg:py-24',
} as const;

export const grid = {
  // Responsive grid patterns
  cols2: 'grid grid-cols-1 md:grid-cols-2',
  cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  cols4: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
} as const;

export const animation = {
  // Performance-optimized animations
  transition: 'transition-all duration-300 ease-out',
  transitionFast: 'transition-all duration-150 ease-out',
  transitionSlow: 'transition-all duration-500 ease-out',
  hover: 'hover:scale-105',
  focus: 'focus:outline-none focus:ring-2 focus:ring-neon-purple focus:ring-offset-2 focus:ring-offset-dark-primary',
} as const;

// ===== SHADOWS =====
export const shadows = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  // Neon shadows (for CTAs and important elements)
  purple: 'shadow-lg shadow-neon-purple/50',
  purpleHover: 'shadow-xl shadow-neon-purple/70',
  cyan: 'shadow-lg shadow-neon-cyan/50',
  pink: 'shadow-lg shadow-neon-pink/50',
  card: 'shadow-xl shadow-neon-purple/10',
  cardHover: 'shadow-2xl shadow-neon-purple/20',
} as const;

// ===== GRADIENTS =====
export const gradients = {
  primary: 'bg-gradient-to-r from-neon-purple to-neon-pink',
  secondary: 'bg-gradient-to-r from-neon-blue to-neon-cyan',
  accent: 'bg-gradient-to-r from-neon-pink to-neon-magenta',
  text: 'bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan bg-clip-text text-transparent',
  card: 'bg-gradient-to-br from-dark-card/40 to-dark-primary/60',
  bg: 'bg-gradient-to-br from-dark-primary to-dark-secondary',
} as const;

// ===== BUTTON SIZES (standardized) =====
export const buttonSizes = {
  sm: {
    padding: 'px-4 py-2',
    text: 'text-sm',
    minWidth: 'min-w-[120px]',
  },
  md: {
    padding: 'px-6 py-3',
    text: 'text-base',
    minWidth: 'min-w-[160px]',
  },
  lg: {
    padding: 'px-8 py-4',
    text: 'text-lg',
    minWidth: 'min-w-[200px]',
  },
} as const;

// ===== Z-INDEX SCALE =====
export const zIndex = {
  base: 'z-0',
  dropdown: 'z-10',
  sticky: 'z-20',
  fixed: 'z-30',
  overlay: 'z-40',
  modal: 'z-50',
  tooltip: 'z-60',
  max: 'z-[9999]',
} as const;

// ===== BREAKPOINTS (для reference в JS) =====
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ===== SEMANTIC COLORS =====
export const colors = {
  // Status colors
  success: 'text-green-400',
  successBg: 'bg-green-500/20',
  successBorder: 'border-green-500/30',

  warning: 'text-yellow-400',
  warningBg: 'bg-yellow-500/20',
  warningBorder: 'border-yellow-500/30',

  error: 'text-red-400',
  errorBg: 'bg-red-500/20',
  errorBorder: 'border-red-500/30',

  info: 'text-blue-400',
  infoBg: 'bg-blue-500/20',
  infoBorder: 'border-blue-500/30',

  // Brand colors
  primary: 'text-neon-purple',
  primaryBg: 'bg-neon-purple/20',
  primaryBorder: 'border-neon-purple/30',

  secondary: 'text-neon-cyan',
  secondaryBg: 'bg-neon-cyan/20',
  secondaryBorder: 'border-neon-cyan/30',

  // State colors
  disabled: 'text-text-muted',
  disabledBg: 'bg-dark-card/30',

  focus: 'ring-neon-cyan',
  focusBorder: 'border-neon-cyan',

  // Difficulty levels
  beginner: 'text-green-400',
  beginnerBg: 'bg-green-500/20',
  beginnerBorder: 'border-green-500/30',

  intermediate: 'text-yellow-400',
  intermediateBg: 'bg-yellow-500/20',
  intermediateBorder: 'border-yellow-500/30',

  advanced: 'text-red-400',
  advancedBg: 'bg-red-500/20',
  advancedBorder: 'border-red-500/30',
} as const;
