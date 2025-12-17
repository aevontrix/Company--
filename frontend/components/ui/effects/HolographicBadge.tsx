'use client';

import React from 'react';

interface HolographicBadgeProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'gold' | 'purple' | 'cyan' | 'green';
  className?: string;
}

/**
 * HolographicBadge - Holographic rotating badge
 * Based on ULTIMATE_ELITE_UI_TECHNIQUES - Badge Holographic
 *
 * Features:
 * - Conic gradient animation on hover
 * - 3D flip effect
 * - Customizable colors
 * - Size variants
 */
export const HolographicBadge: React.FC<HolographicBadgeProps> = ({
  children,
  size = 'md',
  variant = 'gold',
  className = '',
}) => {
  const sizes = {
    sm: 'w-16 h-16 text-xl',
    md: 'w-20 h-20 text-2xl',
    lg: 'w-24 h-24 text-3xl',
  };

  const variants = {
    gold: 'from-yellow-400 to-yellow-600',
    purple: 'from-purple-500 to-purple-700',
    cyan: 'from-cyan-400 to-cyan-600',
    green: 'from-green-400 to-green-600',
  };

  return (
    <div
      className={`badge-holographic bg-gradient-to-br ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </div>
  );
};
