import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('onthego_token');
  const { pathname } = request.nextUrl;

  if (token && (pathname === '/' || pathname.startsWith('/landing'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!token && (pathname.startsWith('/dashboard') || pathname.startsWith('/courses') || pathname.startsWith('/profile') || pathname.startsWith('/my-learning'))) {
    return NextResponse.redirect(new URL('/landing', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/landing/:path*', '/dashboard/:path*', '/courses/:path*', '/profile/:path*', '/my-learning/:path*'],
};
