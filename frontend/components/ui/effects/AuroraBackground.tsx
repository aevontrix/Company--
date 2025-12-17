'use client';

import React from 'react';

interface AuroraBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * AuroraBackground - Animated aurora mesh gradient background
 * Based on NEXUS_FUSION_UI_UX_RESEARCH - Aurora/Mesh Gradients
 *
 * Features:
 * - Animated gradient mesh
 * - Multiple layers
 * - Fixed position
 * - Performance optimized with GPU acceleration
 */
export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Aurora effect container */}
      <div className="aurora-background" />

      {/* Content layer */}
      {children && (
        <div className="relative z-10">{children}</div>
      )}
    </div>
  );
};
