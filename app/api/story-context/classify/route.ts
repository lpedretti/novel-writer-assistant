import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { classifyQuery } from '@/lib/story-context';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (user.role !== 'CREATOR' && user.role !== 'ADMINISTRATOR') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  let body: { query?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const query = body.query?.trim();
  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  const result = await classifyQuery(query);
  return NextResponse.json(result);
}
