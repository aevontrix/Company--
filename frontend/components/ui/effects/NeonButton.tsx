'use client';

import React, { useState, MouseEvent } from 'react';

interface NeonButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'cyan' | 'purple' | 'magenta' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

/**
 * NeonButton - Neon glow button with liquid effect
 * Based on ULTIMATE_ELITE_UI_TECHNIQUES
 *
 * Features:
 * - Liquid button expand effect on hover
 * - Neon glow shadow
 * - Multiple color variants
 * - Ripple effect on click
 */
export const NeonButton: React.FC<NeonButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
}) => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const variants = {
    cyan: 'shadow-neon-cyan hover:shadow-neon-cyan border-neon-cyan',
    purple: 'shadow-neon-purple hover:shadow-neon-purple border-primary-vivid',
    magenta: 'shadow-neon-magenta hover:shadow-neon-magenta border-neon-magenta',
    primary: 'shadow-glow-purple hover:shadow-neon border-primary-accent',
  };

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    // Create ripple effect
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = { x, y, id: Date.now() };
    setRipples((prev) => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);

    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        liquid-button
        relative
        ${sizes[size]}
        ${variants[variant]}
        bg-bg-card
        border
        rounded-lg
        font-semibold
        text-white
        transition-all
        duration-300
        disabled:opacity-50
        disabled:cursor-not-allowed
        overflow-hidden
        ${className}
      `}
    >
      {children}

      {/* Ripples */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 10,
            height: 10,
          }}
        />
      ))}
    </button>
  );
};
