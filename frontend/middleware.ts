import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ✅ FIX: Public paths that don't require authentication
const PUBLIC_PATHS = ['/', '/landing', '/login', '/register', '/about', '/welcome'];

// ✅ FIX: Protected paths that require authentication
const PROTECTED_PATHS = ['/dashboard', '/courses', '/profile', '/my-learning', '/messages', '/focus', '/flashcards', '/leaderboard'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('onthego_token');
  const { pathname } = request.nextUrl;

  // ✅ FIX: Check for session marker as fallback (set by login)
  const hasSession = request.cookies.get('onthego_session');

  const isAuthenticated = !!(token?.value || hasSession?.value);

  // Check if current path is public
  const isPublicPath = PUBLIC_PATHS.some(path =>
    pathname === path || pathname.startsWith(`${path}/`)
  );

  // Check if current path is protected
  const isProtectedPath = PROTECTED_PATHS.some(path =>
    pathname === path || pathname.startsWith(`${path}/`)
  );

  // ✅ FIX: Redirect authenticated users away from public pages (except /about)
  if (isAuthenticated && (pathname === '/' || pathname === '/landing' || pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ✅ FIX: Redirect unauthenticated users away from protected pages
  if (!isAuthenticated && isProtectedPath) {
    // Store the original URL to redirect back after login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('redirect_after_login', pathname, {
      httpOnly: false,
      maxAge: 60 * 5 // 5 minutes
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/landing/:path*',
    '/login',
    '/register',
    '/dashboard/:path*',
    '/courses/:path*',
    '/profile/:path*',
    '/my-learning/:path*',
    '/messages/:path*',
    '/focus/:path*',
    '/flashcards/:path*',
    '/leaderboard/:path*'
  ],
};
