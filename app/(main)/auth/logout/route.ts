import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/session';

export async function POST() {
  // Destroy the encrypted session
  await destroySession();

  return NextResponse.redirect(new URL('/auth/login', process.env.APP_URL || 'http://localhost:3000'));
}

export async function GET() {
  // Also support GET for direct navigation
  await destroySession();

  return NextResponse.redirect(new URL('/auth/login', process.env.APP_URL || 'http://localhost:3000'));
}
