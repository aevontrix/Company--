'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================
// AUTH GUARD - ЗАЩИТА МАРШРУТОВ
// ============================================================
// Компонент перенаправляет неавторизованных пользователей
// на приветственную страницу
// ============================================================

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();

  // Публичные маршруты (доступны без авторизации)
  const publicRoutes = ['/welcome', '/login', '/register', '/about', '/landing-v2', '/landing', '/'];

  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/landing/');

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated && !isPublicRoute) {
        // Неавторизованный пользователь пытается зайти на защищенный маршрут
        router.push('/landing');
      } else if (isAuthenticated && (pathname === '/welcome' || pathname === '/login' || pathname === '/register' || pathname === '/landing' || pathname.startsWith('/landing/'))) {
        // Авторизованный пользователь пытается зайти на login/register/welcome/landing
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, loading, pathname, isPublicRoute, router]);

  // Показываем loader пока проверяем авторизацию
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#050505',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            border: '3px solid rgba(77, 189, 255, 0.2)',
            borderTop: '3px solid #4DBDFF',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style jsx>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  // Если неавторизован и пытается зайти на защищенный маршрут - не показываем контент
  // (перенаправление уже произошло в useEffect)
  if (!isAuthenticated && !isPublicRoute) {
    return null;
  }

  // Если авторизован и пытается зайти на login/register/welcome/landing - не показываем контент
  if (isAuthenticated && (pathname === '/welcome' || pathname === '/login' || pathname === '/register' || pathname === '/landing' || pathname.startsWith('/landing/'))) {
    return null;
  }

  return <>{children}</>;
}
