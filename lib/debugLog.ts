/**
 * Debug logging utility that logs to both console and a file via API.
 *
 * Configuration:
 * - In development: Always enabled
 * - In production: Only enabled if NEXT_PUBLIC_DEBUG_LOGGING=true in .env
 *
 * The API endpoint (/api/debug-log) also respects DEBUG_LOGGING env var.
 */

// Check if debug logging is enabled
// NEXT_PUBLIC_ prefix makes it available on client side
const IS_DEV = process.env.NODE_ENV === 'development';
const DEBUG_ENABLED = IS_DEV || process.env.NEXT_PUBLIC_DEBUG_LOGGING === 'true';

// Debug prefixes we care about for the Reader component
const DEBUG_PREFIXES = ['📐', '🖼️', '🟢', '🟡', '🔵', '🔴', '⬇️', '⬆️', '🎨', '📍', '📖'];

/**
 * Log a debug message. In production builds without DEBUG_LOGGING, this is a no-op.
 */
export function debugLog(message: string, ...args: unknown[]) {
  if (!DEBUG_ENABLED) return;

  // Log to console
  console.log(message, ...args);

  // Send to API (fire and forget) - only in browser
  if (typeof window !== 'undefined') {
    const fullMessage = [message, ...args.map(a =>
      typeof a === 'object' ? JSON.stringify(a) : String(a)
    )].join(' ');

    fetch('/api/debug-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: fullMessage }),
    }).catch(() => {
      // Ignore errors - don't break the app for logging
    });
  }
}

/**
 * Clear all debug logs from the API
 */
export function clearDebugLogs() {
  if (typeof window !== 'undefined') {
    fetch('/api/debug-log', { method: 'DELETE' }).catch(() => {});
  }
}

/**
 * Initialize global console.log interception for Reader debugging.
 * Call this once at app startup to capture all debug logs automatically.
 * Returns a cleanup function to restore original console.log.
 */
export function initDebugLogInterceptor(): () => void {
  if (!DEBUG_ENABLED || typeof window === 'undefined') {
    return () => {}; // No-op cleanup
  }

  const originalLog = console.log;

  console.log = (...args: unknown[]) => {
    // Always call original
    originalLog.apply(console, args);

    // Check if this is a debug message we care about
    const message = String(args[0] || '');
    if (DEBUG_PREFIXES.some(prefix => message.includes(prefix))) {
      const fullMessage = args.map(a =>
        typeof a === 'object' ? JSON.stringify(a) : String(a)
      ).join(' ');

      fetch('/api/debug-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: fullMessage }),
      }).catch(() => {});
    }
  };

  // Clear logs on init
  clearDebugLogs();

  // Return cleanup function
  return () => {
    console.log = originalLog;
  };
}

/**
 * Check if debug logging is currently enabled
 */
export function isDebugEnabled(): boolean {
  return DEBUG_ENABLED;
}
