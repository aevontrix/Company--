'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * Header - Точная копия навигации из diego.html
 *
 * Особенности:
 * - Logo с розовой точкой (pulsing dot)
 * - Nav links с underline анимацией
 * - Buttons: Outline + Primary
 * - Scrolled state: backdrop blur + border
 */
export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-[1000] transition-all duration-400 ${
        scrolled
          ? 'py-4 bg-bg-dark/80 backdrop-blur-[16px] border-b border-border-light'
          : 'py-6'
      }`}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
      }}
    >
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center">
          {/* Logo with Pink Dot */}
          <Link
            href="/"
            className="font-['Syne'] font-extrabold text-2xl tracking-tight text-white relative"
          >
            ONTHEGO
            <span
              className="absolute -right-1.5 top-0 w-1.5 h-1.5 bg-neon-pink rounded-full animate-pulse-glow"
              style={{
                boxShadow: '0 0 10px #FF4DFF',
              }}
            />
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex gap-8">
            {[
              { href: '#features', label: 'Преимущества' },
              { href: '#courses', label: 'Курсы' },
              { href: '#ai', label: 'AI Mentor' },
              { href: '#blog', label: 'Блог' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-white/70 relative transition-colors duration-300 hover:text-white group"
              >
                {link.label}
                <span className="absolute bottom-[-4px] left-0 w-0 h-[2px] bg-neon-cyan transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {/* Outline Button - Войти */}
            <Link
              href="/login"
              className="px-7 py-3 rounded-full font-semibold text-[0.95rem] bg-transparent border border-white/20 text-white transition-all duration-300 hover:border-neon-cyan hover:text-neon-cyan"
              style={{
                boxShadow: 'none',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 15px rgba(77, 189, 255, 0.2) inset';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Войти
            </Link>

            {/* Primary Button - Начать */}
            <Link
              href="/register"
              className="relative px-7 py-3 rounded-full font-semibold text-[0.95rem] bg-white text-black overflow-hidden z-[1] transition-all duration-300 hover:text-white"
              onMouseEnter={(e) => {
                const before = e.currentTarget.querySelector('.btn-gradient');
                if (before) {
                  (before as HTMLElement).style.transform = 'scaleX(1)';
                }
                e.currentTarget.style.boxShadow = '0 0 30px rgba(177, 60, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                const before = e.currentTarget.querySelector('.btn-gradient');
                if (before) {
                  (before as HTMLElement).style.transform = 'scaleX(0)';
                }
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span
                className="btn-gradient absolute top-0 left-0 w-full h-full -z-[1] transition-transform duration-500"
                style={{
                  background: 'linear-gradient(90deg, #B13CFF, #FF4DFF)',
                  transformOrigin: 'left',
                  transform: 'scaleX(0)',
                  transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)',
                }}
              />
              Начать
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
