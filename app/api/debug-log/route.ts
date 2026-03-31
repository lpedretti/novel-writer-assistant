import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync, existsSync } from 'fs';

// Only enable in development mode or when explicitly enabled via env
const IS_ENABLED = process.env.NODE_ENV === 'development' || process.env.DEBUG_LOGGING === 'true';

// Write to /tmp to avoid triggering Next.js hot reload
const LOG_FILE = '/tmp/reader-debug-logs.json';

// Initialize or read existing logs
function getLogs(): Array<{ timestamp: number; message: string; data?: unknown }> {
  if (!IS_ENABLED) return [];
  if (existsSync(LOG_FILE)) {
    try {
      return JSON.parse(readFileSync(LOG_FILE, 'utf-8'));
    } catch {
      return [];
    }
  }
  return [];
}

// Write logs to file
function saveLogs(logs: Array<{ timestamp: number; message: string; data?: unknown }>) {
  if (!IS_ENABLED) return;
  writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

// POST - Add a new log entry
export async function POST(request: NextRequest) {
  if (!IS_ENABLED) {
    return NextResponse.json({ success: false, reason: 'disabled' });
  }

  try {
    const body = await request.json();
    const logs = getLogs();

    logs.push({
      timestamp: Date.now(),
      message: body.message,
      data: body.data,
    });

    // Keep only last 500 entries
    if (logs.length > 500) {
      logs.splice(0, logs.length - 500);
    }

    saveLogs(logs);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// GET - Retrieve all logs
export async function GET() {
  if (!IS_ENABLED) {
    return NextResponse.json([]);
  }
  const logs = getLogs();
  return NextResponse.json(logs);
}

// DELETE - Clear all logs
export async function DELETE() {
  if (!IS_ENABLED) {
    return NextResponse.json({ success: false, reason: 'disabled' });
  }
  saveLogs([]);
  return NextResponse.json({ success: true });
}
