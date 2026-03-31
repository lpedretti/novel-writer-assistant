import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { checkLlamaHealth } from '@/lib/knowledge-assistant';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (user.role !== 'CREATOR' && user.role !== 'ADMINISTRATOR') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const healthy = await checkLlamaHealth();

  if (healthy) {
    return NextResponse.json({ status: 'ok' });
  }

  return NextResponse.json({ status: 'unavailable' }, { status: 502 });
}
