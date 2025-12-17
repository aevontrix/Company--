'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { useEffect, useState } from 'react';
import SkipLink from '@/components/ui/SkipLink';
import Button from '@/components/ui/Button';

export default function Header() {
  const { user, isAuthenticated, fetchCurrentUser, logout } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <SkipLink />
      <header
        className={`fixed top-0 left-0 w-full z-[1000] transition-all duration-400 ${
          scrolled
            ? 'py-4 bg-dark-primary/80 backdrop-blur-md border-b border-white/10'
            : 'py-6 bg-transparent'
        }`}
      >
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="relative text-2xl font-black tracking-tight text-white hover:scale-105 transition-transform font-display"
              style={{ fontFamily: 'var(--font-display), sans-serif', letterSpacing: '-1px' }}
            >
              ONTHEGO
              <span
                className="absolute -right-1.5 top-0 w-1.5 h-1.5 bg-neon-pink rounded-full"
                style={{ boxShadow: '0 0 10px #FF4DFF' }}
              />
            </Link>

            {/* Nav Links - Desktop */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                href="/courses"
                className="relative text-sm font-medium text-white/70 hover:text-white transition-colors duration-300
                  before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5 before:bg-neon-cyan
                  before:transition-all before:duration-300 hover:before:w-full"
              >
                Курсы
              </Link>
              <Link
                href="/categories"
                className="relative text-sm font-medium text-white/70 hover:text-white transition-colors duration-300
                  before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5 before:bg-neon-cyan
                  before:transition-all before:duration-300 hover:before:w-full"
              >
                Категории
              </Link>
              <Link
                href="/about"
                className="relative text-sm font-medium text-white/70 hover:text-white transition-colors duration-300
                  before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5 before:bg-neon-cyan
                  before:transition-all before:duration-300 hover:before:w-full"
              >
                О платформе
              </Link>
              {isAuthenticated && (
                <Link
                  href="/my-learning"
                  className="relative text-sm font-medium text-white/70 hover:text-white transition-colors duration-300
                    before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5 before:bg-neon-cyan
                    before:transition-all before:duration-300 hover:before:w-full"
                >
                  Моё обучение
                </Link>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <span className="text-text-secondary hidden sm:inline text-sm">{user?.first_name}</span>
                  <Button
                    onClick={logout}
                    variant="outline"
                    size="sm"
                    style={{ borderRadius: '100px' }}
                  >
                    Выход
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      variant="outline"
                      size="sm"
                      style={{ borderRadius: '100px', border: '1px solid rgba(255,255,255,0.2)' }}
                    >
                      Войти
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      variant="primary"
                      size="sm"
                      style={{ borderRadius: '100px' }}
                    >
                      Начать
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}
