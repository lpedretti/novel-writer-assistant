import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Add the current pathname to the request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  // Define protected routes
  const protectedRoutes = ['/dashboard'];
  const adminRoutes = ['/dashboard/users'];

  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Get session from cookies using iron-session edge API
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    const session = await getIronSession<SessionData>(
      request,
      response,
      sessionOptions
    );

    // Check if user is authenticated
    if (!session.isLoggedIn || !session.userId) {
      const redirectUrl = `/auth/login?redirect=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Check admin role for admin routes
    if (isAdminRoute && session.role !== 'ADMINISTRATOR') {
      return NextResponse.redirect(new URL('/auth/login?error=You do not have permission to access this page', request.url));
    }

    return response;
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
