/**
 * SkipLink Component
 * Provides keyboard users a way to skip repetitive navigation
 * WCAG 2.4.1 (Level A) - Bypass Blocks
 */

export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-neon-purple focus:text-white focus:font-bold focus:rounded-lg focus:shadow-lg focus:shadow-neon-purple/50 focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:ring-offset-2 focus:ring-offset-dark-primary transition-all"
    >
      Перейти к основному содержанию
    </a>
  );
}
