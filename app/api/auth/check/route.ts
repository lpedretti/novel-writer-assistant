import { getCurrentUser } from '@/lib/session';
import { NextResponse } from 'next/server';

/**
 * API endpoint to check if user is authenticated
 * Returns { isLoggedIn: boolean }
 */
export async function GET() {
  const user = await getCurrentUser();

  return NextResponse.json({
    isLoggedIn: !!user,
  });
}
