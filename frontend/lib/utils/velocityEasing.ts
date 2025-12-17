/**
 * ARCHITECT ZERO - Velocity Easing Functions
 *
 * Custom easing curves for Velocity Grids
 * Creates non-linear "jumping/hitching" scroll behavior
 */

/**
 * Velocity Jump Easing
 *
 * Creates procedural "hitching" effect during scroll
 * - Triple-sine wave generates micro-pauses at 33%, 66%
 * - Damping prevents overshoot at extremes
 *
 * Mathematical Model:
 * f(t) = t + sin(3πt) * 0.08 + sin(6πt) * 0.04
 * Damping: (1 - (t-0.5)² * 0.3)
 *
 * @param t - Progress (0.0 to 1.0)
 * @returns Eased value with "jump" characteristics
 */
export function velocityJumpEasing(t: number): number {
  // Clamp input
  t = Math.max(0, Math.min(1, t));

  // Base linear progression
  const baseEase = t;

  // First jump: Major hitch at 33% and 66%
  const jump1 = Math.sin(t * Math.PI * 3) * 0.08;

  // Second jump: Micro-hitch for texture
  const jump2 = Math.sin(t * Math.PI * 6) * 0.04;

  // Damping function: Prevents extreme overshoot
  // Peak damping at t=0.5 (center), tapers toward edges
  const damping = 1 - Math.pow(t - 0.5, 2) * 0.3;

  // Combine and clamp
  const result = (baseEase + jump1 + jump2) * damping;
  return Math.min(1, Math.max(0, result));
}

/**
 * Aggressive Velocity Curve
 *
 * For rapid scroll events with sharp deceleration
 * Used in drag-to-scroll scenarios
 *
 * @param t - Progress (0.0 to 1.0)
 * @returns Eased value with sharp deceleration
 */
export function aggressiveVelocityCurve(t: number): number {
  // Exponential ease-out with overshoot
  return 1 - Math.pow(1 - t, 3) + Math.sin(t * Math.PI) * 0.05;
}

/**
 * EMP Pulse Easing
 *
 * Simulates electromagnetic pulse wave propagation
 * Sharp attack, exponential decay
 *
 * @param t - Progress (0.0 to 1.0)
 * @returns Eased value for EMP wave expansion
 */
export function empPulseEasing(t: number): number {
  if (t < 0.1) {
    // Sharp attack phase
    return Math.pow(t / 0.1, 0.5);
  } else {
    // Exponential decay
    const normalized = (t - 0.1) / 0.9;
    return 1 - Math.pow(normalized, 2);
  }
}

/**
 * Row Corruption Timing
 *
 * Easing for glitch corruption effect
 * Multiple peaks for "digital stutter"
 *
 * @param t - Progress (0.0 to 1.0)
 * @returns Intensity (0.0 to 1.0)
 */
export function rowCorruptionTiming(t: number): number {
  // Multiple sine waves create "stutter" peaks
  const peak1 = Math.sin(t * Math.PI * 4) * 0.4;
  const peak2 = Math.sin(t * Math.PI * 8) * 0.2;
  const envelope = Math.sin(t * Math.PI); // Overall fade in/out
  return Math.abs(peak1 + peak2) * envelope;
}

/**
 * Neon Flash Curve
 *
 * Timing for neon flash explosions
 * Fast attack (30%), slow decay (70%)
 *
 * @param t - Progress (0.0 to 1.0)
 * @returns Opacity/scale multiplier
 */
export function neonFlashCurve(t: number): number {
  if (t < 0.3) {
    // Fast attack
    return Math.pow(t / 0.3, 0.3);
  } else {
    // Slow decay with exponential falloff
    const normalized = (t - 0.3) / 0.7;
    return 1 - Math.pow(normalized, 1.5);
  }
}

/**
 * Spring Overshoot (from P1.1)
 *
 * Cubic-bezier approximation of spring physics
 * stiffness=400, damping=30
 *
 * @param t - Progress (0.0 to 1.0)
 * @returns Eased value with 60% overshoot
 */
export function springOvershoot(t: number): number {
  // Cubic-bezier(0.34, 1.56, 0.64, 1)
  // Approximation using polynomial
  const c1 = 0.34;
  const c2 = 1.56;
  const c3 = 0.64;
  const c4 = 1.0;

  const t2 = t * t;
  const t3 = t2 * t;

  // Bezier cubic formula
  return (
    3 * (1 - t) * (1 - t) * t * c1 +
    3 * (1 - t) * t2 * c2 +
    t3 * 1.0
  );
}

/**
 * Scroll Momentum Decay
 *
 * Natural decay curve for momentum-based scrolling
 * Simulates friction (μ = 0.015)
 *
 * @param velocity - Initial velocity (px/ms)
 * @param t - Time elapsed (ms)
 * @returns Current velocity
 */
export function scrollMomentumDecay(velocity: number, t: number): number {
  const friction = 0.015;
  return velocity * Math.exp(-friction * t);
}

/**
 * Procedural Grid Offset
 *
 * Generates non-uniform cell offsets for "data stream" effect
 * Used in real-time grid rendering
 *
 * @param cellIndex - Grid cell index
 * @param time - Animation time (ms)
 * @returns Offset in pixels
 */
export function proceduralGridOffset(cellIndex: number, time: number): number {
  // Perlin-like noise approximation using sine waves
  const freq1 = 0.1;
  const freq2 = 0.3;
  const timeScale = 0.001;

  const noise1 = Math.sin(cellIndex * freq1 + time * timeScale);
  const noise2 = Math.sin(cellIndex * freq2 + time * timeScale * 2);

  return (noise1 * 2 + noise2 * 0.5);
}
