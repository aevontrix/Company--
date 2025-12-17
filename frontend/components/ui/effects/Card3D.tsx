'use client';

import React, { useRef, useState, MouseEvent } from 'react';

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  shine?: boolean;
}

/**
 * Card3D - 3D transform card with mouse tracking
 * Based on ULTIMATE_ELITE_UI_TECHNIQUES
 *
 * Features:
 * - Mouse-tracking 3D transform
 * - Dynamic shine effect
 * - Smooth transitions
 * - GPU-accelerated
 */
export const Card3D: React.FC<Card3DProps> = ({
  children,
  className = '',
  intensity = 15,
  shine = true,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [mouseX, setMouseX] = useState(50);
  const [mouseY, setMouseY] = useState(50);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();

    // Calculate mouse position relative to card center (0-100%)
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Calculate rotation (-intensity to +intensity degrees)
    const rotY = ((x - 50) / 50) * intensity;
    const rotX = ((50 - y) / 50) * intensity;

    setRotateX(rotX);
    setRotateY(rotY);
    setMouseX(x);
    setMouseY(y);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    setMouseX(50);
    setMouseY(50);
  };

  return (
    <div
      ref={cardRef}
      className={`card-3d gpu-accelerated ${className}`}
      style={{
        '--rotateX': `${rotateX}deg`,
        '--rotateY': `${rotateY}deg`,
        '--mouse-x': `${mouseX}%`,
        '--mouse-y': `${mouseY}%`,
        transform: isHovered
          ? `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
      } as React.CSSProperties}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {/* Shine overlay */}
      {shine && (
        <div
          className="absolute inset-0 pointer-events-none rounded-inherit opacity-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${mouseX}% ${mouseY}%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)`,
            opacity: isHovered ? 1 : 0,
          }}
        />
      )}
    </div>
  );
};
