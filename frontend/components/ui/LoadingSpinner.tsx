'use client';

import { cn } from '@/lib/utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'primary' | 'white' | 'purple' | 'cyan';
  label?: string;
}

const sizeStyles = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
  xl: 'w-16 h-16 border-4',
};

const colorStyles = {
  primary: 'border-neon-cyan/30 border-t-neon-cyan',
  white: 'border-white/30 border-t-white',
  purple: 'border-neon-purple/30 border-t-neon-purple',
  cyan: 'border-neon-cyan/30 border-t-neon-cyan',
};

/**
 * Animated loading spinner
 */
export function LoadingSpinner({
  size = 'md',
  className,
  color = 'primary',
  label,
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn(
          'rounded-full animate-spin',
          sizeStyles[size],
          colorStyles[color]
        )}
        role="status"
        aria-label={label || 'Loading'}
      />
      {label && (
        <span className="text-sm text-text-muted animate-pulse">{label}</span>
      )}
    </div>
  );
}

/**
 * Full page loading overlay
 */
export function LoadingOverlay({
  message = 'Загрузка...',
  transparent = false,
}: {
  message?: string;
  transparent?: boolean;
}) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        transparent ? 'bg-dark-primary/80' : 'bg-dark-primary'
      )}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Animated logo */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-neon-purple/30 animate-pulse" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-neon-cyan animate-spin" />
        </div>

        {/* Loading text */}
        <div className="text-center">
          <div className="text-xl font-semibold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
            ONTHEGO
          </div>
          <div className="text-sm text-text-muted mt-1">{message}</div>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-neon-cyan animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Inline loading indicator for buttons/actions
 */
export function InlineLoader({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {[...Array(3)].map((_, i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </span>
  );
}

export default LoadingSpinner;
