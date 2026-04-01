/**
 * Story Context Worker
 *
 * Standalone background process that monitors book sections for changes
 * and processes them through the LLM for narrative element extraction.
 * Runs alongside Next.js via `npm run dev`.
 */

import { createHash } from 'crypto';
import { prisma } from '../lib/prisma';
import { processSection } from '../lib/story-context';
import { checkLlmHealth } from '../lib/llm-client';
import { extractPlainText } from '../lib/tiptap-utils';

// ── Configuration (env overrides supported) ──

const IDLE_THRESHOLD_MS = Number(process.env.IDLE_THRESHOLD_MS) || 30_000;
const POLL_SLEEP_MS = Number(process.env.POLL_SLEEP_MS) || 5_000;
const STUCK_THRESHOLD_MS = Number(process.env.STUCK_THRESHOLD_MS) || 10 * 60_000;
const HEALTH_CHECK_INTERVAL_MS = Number(process.env.HEALTH_CHECK_INTERVAL_MS) || 10_000;
const HEALTH_CHECK_MAX_MS = Number(process.env.HEALTH_CHECK_MAX_MS) || 5 * 60_000;
const COOLDOWN_AFTER_FAILURE_MS = Number(process.env.COOLDOWN_AFTER_FAILURE_MS) || 60_000;

// ── Shutdown Handling ──

let shuttingDown = false;

function setupShutdownHandlers() {
  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log('[worker] Shutting down...');

    // Hard timeout in case graceful shutdown hangs
    setTimeout(() => {
      console.error('[worker] Forced exit after timeout');
      process.exit(1);
    }, 30_000).unref();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// ── Helpers ──

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);

  const parts: string[] = [error.message];

  // Include cause chain for fetch/network errors
  if ('cause' in error && error.cause instanceof Error) {
    parts.push(`cause: ${error.cause.message}`);
  }

  // Include HTTP status if available
  if ('status' in error && typeof (error as any).status === 'number') {
    parts.push(`status: ${(error as any).status}`);
  }

  return parts.join(' — ');
}

function isLlmError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes('timed out')
    || msg.includes('unavailable')
    || msg.includes('502')
    || msg.includes('503')
    || msg.includes('504')
    || msg.includes('econnrefused')
    || msg.includes('fetch failed');
}

// ── Stuck Section Recovery ──

async function recoverStuckSections(): Promise<number> {
  const stuckThreshold = new Date(Date.now() - STUCK_THRESHOLD_MS);
  const result = await prisma.sectionAnalysis.updateMany({
    where: {
      status: 'processing',
      updatedAt: { lt: stuckThreshold },
    },
    data: {
      status: 'failed',
      errorMessage: 'Recovered from stuck processing state',
    },
  });
  return result.count;
}

// ── Section Discovery ──

interface PendingSection {
  id: number;
  bookId: number;
}

async function findSectionsNeedingAnalysis(): Promise<PendingSection[]> {
  const idleThreshold = new Date(Date.now() - IDLE_THRESHOLD_MS);

  const idleSections = await prisma.chapterSection.findMany({
    where: {
      updatedAt: { lt: idleThreshold },
    },
    select: {
      id: true,
      content: true,
      updatedAt: true,
      chapter: {
        select: { bookId: true },
      },
      analysis: {
        select: { contentHash: true, status: true, updatedAt: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const needsAnalysis: PendingSection[] = [];

  for (const section of idleSections) {
    if (section.analysis?.status === 'processing') continue;

    // Never analyzed
    if (!section.analysis) {
      needsAnalysis.push({ id: section.id, bookId: section.chapter.bookId });
      continue;
    }

    // Previously failed — retry
    if (section.analysis.status === 'failed') {
      needsAnalysis.push({ id: section.id, bookId: section.chapter.bookId });
      continue;
    }

    // Content may have changed
    if (section.updatedAt > section.analysis.updatedAt) {
      const plainText = extractPlainText(section.content);
      const contentHash = createHash('sha256').update(plainText).digest('hex');

      if (contentHash !== section.analysis.contentHash) {
        needsAnalysis.push({ id: section.id, bookId: section.chapter.bookId });
      }
    }
  }

  return needsAnalysis;
}

// ── Main Loop ──

async function run() {
  setupShutdownHandlers();
  console.log('[worker] Story context worker started');

  let consecutiveFailures = 0;

  while (!shuttingDown) {
    try {
      // Recover stuck sections
      const recovered = await recoverStuckSections();
      if (recovered > 0) {
        console.log(`[worker] Recovered ${recovered} stuck section(s)`);
      }

      // Find sections needing analysis
      const sections = await findSectionsNeedingAnalysis();

      if (sections.length === 0) {
        consecutiveFailures = 0;
        await sleep(POLL_SLEEP_MS);
        continue;
      }

      console.log(`[worker] Found ${sections.length} section(s) to process`);

      // Process each section sequentially
      for (const section of sections) {
        if (shuttingDown) break;

        try {
          await processSection(section.id, section.bookId);
          console.log(`[worker] Processed section ${section.id} (book ${section.bookId})`);
          consecutiveFailures = 0;
        } catch (error) {
          console.error(`[worker] Failed section ${section.id}: ${formatError(error)}`);

          if (isLlmError(error)) {
            consecutiveFailures++;
            // Brief pause, then check health once — don't loop for remote providers
            console.log(`[worker] LLM error (attempt ${consecutiveFailures}), checking health...`);
            await sleep(HEALTH_CHECK_INTERVAL_MS);
            const healthy = await checkLlmHealth();
            if (healthy) {
              console.log('[worker] LLM health OK, likely a transient error — retrying');
            } else {
              console.warn('[worker] LLM unreachable, cooling down...');
              await sleep(COOLDOWN_AFTER_FAILURE_MS);
            }
            break; // Re-poll to get fresh list
          }
          // Non-LLM errors: processSection already marked status as 'failed', continue
        }
      }

      // Queue had items — immediately re-poll to catch newly idle sections
    } catch (error) {
      console.error(`[worker] Cycle error: ${formatError(error)}`);
      await sleep(POLL_SLEEP_MS);
    }
  }

  // Graceful cleanup
  console.log('[worker] Disconnecting from database...');
  await prisma.$disconnect();
  console.log('[worker] Worker stopped');
  process.exit(0);
}

run();
