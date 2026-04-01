import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';

export interface SessionData {
  userId: number;
  email: string;
  name: string | null;
  role: Role;
  isLoggedIn: boolean;
}

// Session configuration
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'nwa_session',
  cookieOptions: {
    httpOnly: true, // Cookie cannot be accessed by client-side JavaScript
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax', // CSRF protection
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  },
};

// Validate session secret
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error(
    'SESSION_SECRET must be set and at least 32 characters long. ' +
    'Generate one with: openssl rand -base64 32'
  );
}

/**
 * Get the current session
 * Use this in Server Components and Server Actions
 */
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

/**
 * Get the current user from session
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<SessionData | null> {
  const session = await getSession();

  if (!session.isLoggedIn || !session.userId) {
    return null;
  }

  return {
    userId: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
    isLoggedIn: session.isLoggedIn,
  };
}

/**
 * Require authentication
 * Redirects to login with return URL if not authenticated
 */
export async function requireAuth(): Promise<SessionData> {
  const user = await getCurrentUser();

  if (!user) {
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || headersList.get('referer') || '/dashboard';
    const returnUrl = pathname.startsWith('http')
      ? new URL(pathname).pathname
      : pathname;

    redirect(`/auth/login?redirect=${encodeURIComponent(returnUrl)}`);
  }

  return user;
}

/**
 * Require specific role
 * Redirects to login if not authenticated, shows error if wrong role
 */
export async function requireRole(allowedRoles: Role[]): Promise<SessionData> {
  const user = await requireAuth(); // This will redirect to login if not authenticated

  if (!allowedRoles.includes(user.role)) {
    redirect('/auth/login?error=You do not have permission to access this page');
  }

  return user;
}

/**
 * Create a new session (login)
 */
export async function createSession(userData: Omit<SessionData, 'isLoggedIn'>): Promise<void> {
  const session = await getSession();

  session.userId = userData.userId;
  session.email = userData.email;
  session.name = userData.name;
  session.role = userData.role;
  session.isLoggedIn = true;

  await session.save();
}

/**
 * Destroy session (logout)
 */
export async function destroySession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}
