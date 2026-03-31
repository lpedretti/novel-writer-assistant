'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Send, X, ChevronDown, ChevronRight, AlertTriangle, Search } from 'lucide-react';
import type { KnowledgeResponse } from '@/lib/knowledge-assistant';
import type { BookQueryResponse } from '@/lib/story-context';
import { BookContextResultCard } from './BookContextResultCard';

// ── Archive Icon (layered: head profile + brain + cog) ──
// Icons from icon-icons.com: head #151671, brain #126739, cog #125323 (CC BY 4.0)

function ArchiveIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Layer 1: Head profile (outer silhouette only — single-line stroke) */}
      <path
        d="M63.37,13.79c-7.53-2.13-14.42-2.7-20.51-1.68a21,21,0,0,0-11.07,5.13,21.42,21.42,0,0,0-5.34,8.66h0l-.24.68c-.25.74-.52,1.47-.79,2.21A37.65,37.65,0,0,0,24,33.34a10.87,10.87,0,0,0-.11,4.5c.12.61.26,1.14.4,1.62a3.54,3.54,0,0,1-.13,3.2,23.33,23.33,0,0,1-2.94,4.53c-.16.2-.35.4-.54.61-1,1.12-2.47,2.66-2,4.69A4.81,4.81,0,0,0,21.49,56l.22.08a2.72,2.72,0,0,1,.6.26.55.55,0,0,1,0,.12c0,.42-.07,1-.12,1.49-.13,1.14-.21,1.83.16,2.38a12.46,12.46,0,0,0,1,1.18,2.5,2.5,0,0,0-.53,1.78A4.08,4.08,0,0,0,24,65.18a6.83,6.83,0,0,1,.65.83,8.26,8.26,0,0,1-.28.94,8.61,8.61,0,0,0-.59,3.11c.19,2.74,2.37,4.57,6.47,5.43a31.37,31.37,0,0,0,7.28.46c.51,0,1.12,0,1.5,0A16.38,16.38,0,0,1,40,79.15c.12.55.24,1.1.38,1.59.6,2.2,1.78,6.71,1.79,6.71l.38,1.46,30-14.28-.36-1.06c0-.06-2.33-7-.56-11.65a39.68,39.68,0,0,1,3.6-6.29C78,51.38,81,46.58,81.37,41.9,81.83,35.12,81,18.79,63.37,13.79Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        opacity="0.7"
      />
      {/* Layer 2: Brain — nested SVG with its own viewBox for correct mapping */}
      <svg x="25" y="5" width="55" height="55" viewBox="0 0 1920 1920" opacity="0.7">
        <g fill="none" stroke="currentColor" strokeWidth="60" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit={10}>
          <path d="M811.7 1023s30.6-46.7 120.3-48.8c150.6-3.5 147 128.9 150.6 157.6"/>
          <path d="M1253.4 774s-51.9 55.2-129.4 9.9c-63.6-37.2-56.6-92.6-51.3-121.1"/>
          <path d="M626.9 1162.2c-80.8 16.7-159.9-35.3-176.6-116.1-7.8-37.6-.7-74.8 17.3-105.6"/>
          <path d="M601.4 1325.7c-15 2-30.4 3.1-46 3.1-186.9 0-338.5-151.5-338.5-338.5s151.5-338.5 338.5-338.5"/>
          <path d="M527 785.9c-2.9-14.4-7.5-29.5-4.5-44.4C545.2 630.7 630.1 525.3 743 521c45.6-1.7 88.1 13.9 123.3 37.7"/>
          <path d="M1187.4 582s-38-82.6-161.2-82.6c-73.3 0-137.4 39.7-171.8 98.8"/>
          <path d="M1640.4 1013.8c34.7-73.3 69.2-141.1 4.9-227.9-66.8-90.1-177.8-43.4-177.8-43.4"/>
          <path d="M987.2 1235c-12.7 88.6-76 162.7-164.2 180.6-113.9 23.2-226.2-56.1-250.8-177.1-5-24.7-6-49.1-3.4-72.7"/>
          <path d="M1377.1 954.8c29.3-17.2 63.5-27.1 100-27.1 109.4 0 198.1 88.7 198.1 198.1s-88.7 198.1-198.1 198.1c0 0-33.9 131.9-238.9 164.8"/>
          <path d="M1170.6 604c31.5-31.5 75.1-51.1 123.2-51.1 96.3 0 174.3 78 174.3 174.3 0 31.9-8.5 61.7-23.5 87.4"/>
        </g>
      </svg>
      {/* Layer 3: Cog — nested SVG with its own viewBox for correct mapping */}
      <svg x="38" y="40" width="25" height="25" viewBox="-247 370.9 100 100" opacity="0.9">
        <g fill="none" stroke="currentColor" strokeWidth="5">
          <path d="M-148,412.8c-0.7-2.2-2.6-4.1-5.4-4.1h-6.4c-0.6-1.9-1.4-3.8-2.3-5.6l4.9-4.9c1-1,1.5-2.3,1.5-3.6s-0.5-2.6-1.5-3.6l-10-10c-2-2-5.2-2-7.3,0l-5,5c-1.6-0.8-3.4-1.5-5.6-2.2v-6.6c0-3.1-2.5-5.6-5.6-5.6h-12.8c-3.1,0-5.6,2.5-5.6,5.6v6.6c-1.9,0.6-3.7,1.4-5.5,2.3l-5-5.1c-2-2-5.2-2-7.2,0l-10,10c-1,1-1.5,2.3-1.5,3.6s0.5,2.6,1.5,3.6l4.8,4.8c-0.9,1.8-1.7,3.7-2.3,5.6h-6.4c-3.1,0-5.6,2.5-5.6,5.6v13c0,3.1,2.5,5.6,5.6,5.6h6.5c0.6,1.9,1.4,3.8,2.3,5.7l-4.9,4.9c-1,1-1.5,2.3-1.5,3.6c0,1.5,0.6,2.8,1.6,3.7l9.9,9.9c1.9,1.9,5.1,1.9,7.1,0.1l4.9-4.9c1.7,0.9,3.7,1.8,5.8,2.4v6.2c0,3.1,2.5,5.6,5.6,5.6h13c3.1,0,5.6-2.5,5.6-5.6v-6.2c2.3-0.8,4.2-1.5,5.8-2.3l4.8,4.8c1,1,2.3,1.5,3.6,1.5s2.6-0.5,3.6-1.5l10-10c1-1,1.5-2.3,1.5-3.6s-0.5-2.6-1.5-3.6l-4.9-4.9c0.9-1.7,1.7-3.6,2.3-5.7h6.4c3.1,0,5.6-2.5,5.6-5.6v-14L-148,412.8z"/>
          <path d="M-195.6,400.9l-1.3,0c-5.5,0-10.5,2.1-14.3,5.8c-4.1,4-6.3,9.7-5.9,15.5c0.7,9.9,8.9,18.2,18.8,18.8c0.5,0,0.9,0,1.4,0c5.3,0,10.4-2.1,14.1-5.9l0,0c4-4.2,6.2-9.8,5.9-15.5C-177.4,409.8-185.7,401.5-195.6,400.9z"/>
        </g>
      </svg>
    </svg>
  );
}

// ── Types ──

type QueryMode = 'auto' | 'general' | 'book';

interface HistoryEntry {
  query: string;
  resolvedQuery?: string;
  response: KnowledgeResponse | null;
  bookResponse: BookQueryResponse | null;
  detectedMode?: 'book' | 'general';
  error: string | null;
  loading: boolean;
  sectionContext?: { id: number; title: string | null; chapter: { id: number; title: string } } | null;
}

interface AnalysisStatus {
  total: number;
  completed: number;
  processing: number;
  pending: number;
}

interface PersistedEntry {
  id: number;
  originalQuery: string | null;
  createdAt: string;
  sectionId: number | null;
  section: { id: number; title: string | null; chapter: { id: number; title: string } } | null;
  cachedResponse: {
    id: number;
    query: string;
    response: KnowledgeResponse;
    refusal: boolean;
    refusalReason: string | null;
  };
}

interface KnowledgeAssistantProps {
  bookId: number;
  sectionId: number | null;
}

// ── Helpers ──

function summarizeResponse(response: KnowledgeResponse): string {
  const parts = [
    ...response.answer_bullets.slice(0, 2),
    ...response.definitions_and_scope.slice(0, 1),
    ...response.writer_hooks.slice(0, 1),
  ];
  return parts.join('; ').substring(0, 500);
}

// ── Constants ──

const SECTION_CONFIG = [
  { key: 'answer_bullets', label: 'Key Facts' },
  { key: 'definitions_and_scope', label: 'Definitions & Scope' },
  { key: 'uncertainty_assumptions', label: 'Uncertainties' },
  { key: 'common_misconceptions', label: 'Common Misconceptions' },
  { key: 'writer_hooks', label: 'Writer Hooks' },
  { key: 'verification_keywords', label: 'Verify With' },
] as const;

type SectionKey = (typeof SECTION_CONFIG)[number]['key'];

// ── Result Card ──

function ArchiveResultCard({
  entry,
  index,
  isLatest,
  expandedSection,
  onToggleSection,
  showContext,
}: {
  entry: HistoryEntry;
  index: number;
  isLatest: boolean;
  expandedSection: string | null;
  onToggleSection: (key: string) => void;
  showContext?: boolean;
}) {
  const sectionId = (key: string) => `${index}-${key}`;

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">
      {/* Query header */}
      <div className="px-4 py-2.5 bg-primary/5 border-b border-base-300">
        <p className="text-sm text-primary font-medium truncate">{entry.query}</p>
        {entry.resolvedQuery && entry.resolvedQuery !== entry.query && (
          <p className="text-xs text-neutral/40 mt-0.5 truncate italic">
            &rarr; {entry.resolvedQuery}
          </p>
        )}
        {showContext && entry.sectionContext && (
          <p className="text-xs text-neutral/40 mt-0.5 truncate">
            {entry.sectionContext.chapter.title}
            {entry.sectionContext.title ? ` / ${entry.sectionContext.title}` : ''}
          </p>
        )}
      </div>

      <div className="p-3">
        {/* Loading state */}
        {entry.loading && (
          <div className="flex items-center gap-3 text-neutral/50 py-2">
            <span className="loading loading-spinner loading-sm" />
            <span className="text-sm">Researching...</span>
          </div>
        )}

        {/* Error state */}
        {entry.error && (
          <div className="flex items-center gap-2 text-error">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="text-sm">{entry.error}</span>
          </div>
        )}

        {/* Refusal state */}
        {entry.response?.refusal && (
          <div className="flex items-center gap-2 text-warning">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="text-sm">{entry.response.refusal_reason}</span>
          </div>
        )}

        {/* Success state */}
        {entry.response && !entry.response.refusal && (
          <div className="space-y-0.5">
            {SECTION_CONFIG.map(({ key, label }) => {
              const items = entry.response![key as SectionKey];
              if (!items || items.length === 0) return null;

              const sid = sectionId(key);
              const isExpanded = expandedSection === sid || (isLatest && expandedSection === null && key === 'answer_bullets');

              return (
                <div key={key}>
                  <button
                    onClick={() => onToggleSection(sid)}
                    className="flex items-center gap-2 w-full text-left py-1.5 px-2 hover:bg-base-200 rounded transition-colors cursor-pointer"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-primary/50" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-primary/50" />
                    )}
                    <span className="text-sm text-neutral/70 font-medium">{label}</span>
                    <span className="text-xs text-primary/50 bg-primary/10 px-1.5 rounded-full">
                      {items.length}
                    </span>
                  </button>

                  {isExpanded && (
                    <ul className="pl-8 pr-2 pb-2 space-y-1">
                      {items.map((item, i) => (
                        <li key={i} className="text-sm text-neutral/80 leading-relaxed list-disc">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ──

// Module-level state survives Suspense re-suspension (revalidatePath remounts)
// but resets on full page reload — so the panel doesn't persist across navigation
let _persistedIsOpen = false;

export function KnowledgeAssistant({ bookId, sectionId }: KnowledgeAssistantProps) {
  const [isOpen, _setIsOpen] = useState(_persistedIsOpen);
  const setIsOpen = useCallback((open: boolean) => {
    _persistedIsOpen = open;
    _setIsOpen(open);
  }, []);
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [queryMode, setQueryMode] = useState<QueryMode>('auto');
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchRef = useRef<string>('');

  // Convert persisted entries to HistoryEntry format
  const fromPersisted = useCallback((entries: PersistedEntry[]): HistoryEntry[] => {
    return entries.map((e) => {
      const resp = e.cachedResponse.response;
      const isBookResponse = resp && typeof resp === 'object' && 'mode' in resp && resp.mode === 'book';

      return {
        query: e.originalQuery || e.cachedResponse.query,
        resolvedQuery: e.originalQuery ? e.cachedResponse.query : undefined,
        response: isBookResponse ? null : resp as KnowledgeResponse,
        bookResponse: isBookResponse ? resp as unknown as BookQueryResponse : null,
        detectedMode: isBookResponse ? 'book' as const : undefined,
        error: null,
        loading: false,
        sectionContext: e.section,
      };
    });
  }, []);

  // Fetch history from API
  const fetchHistory = useCallback(
    async (opts: { sectionId?: number | null; q?: string } = {}) => {
      const params = new URLSearchParams({ bookId: String(bookId) });
      if (opts.sectionId != null) params.set('sectionId', String(opts.sectionId));
      if (opts.q) params.set('q', opts.q);

      const key = params.toString();
      if (key === lastFetchRef.current) return;
      lastFetchRef.current = key;

      try {
        const res = await fetch(`/api/knowledge-assistant/history?${params}`);
        if (!res.ok) return;
        const data: PersistedEntry[] = await res.json();
        setHistory(fromPersisted(data.reverse()));
      } catch {
        // Silently fail — user can still make new queries
      }
    },
    [bookId, fromPersisted]
  );

  // Load history when panel opens or section changes
  useEffect(() => {
    if (!isOpen) return;
    if (searchTerm) return; // Don't reload section history while searching
    lastFetchRef.current = ''; // Reset to allow re-fetch
    fetchHistory({ sectionId });
  }, [isOpen, sectionId, fetchHistory, searchTerm]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    if (!searchTerm) {
      lastFetchRef.current = ''; // Reset to allow re-fetch
      fetchHistory({ sectionId });
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setIsSearching(true);
      lastFetchRef.current = ''; // Reset to allow re-fetch
      fetchHistory({ q: searchTerm }).finally(() => setIsSearching(false));
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm, isOpen, sectionId, fetchHistory]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Poll analysis status while panel is open
  useEffect(() => {
    if (!isOpen) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/story-context/status?bookId=${bookId}`);
        if (res.ok) {
          setAnalysisStatus(await res.json());
        }
      } catch {
        // Silently fail
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30_000);
    return () => clearInterval(interval);
  }, [isOpen, bookId]);

  // Auto-scroll when a single new entry is added (new query), not on bulk history loads
  const prevHistoryLenRef = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const added = history.length - prevHistoryLenRef.current;
    if (added === 1 && !searchTerm) {
      // Scroll within the panel container only — avoid scrollIntoView which
      // bubbles to <html> and can trigger Next.js route transition detection
      const container = scrollContainerRef.current;
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
    }
    prevHistoryLenRef.current = history.length;
  }, [history.length, searchTerm]);

  const toggleSection = (key: string) => {
    setExpandedSection((prev) => (prev === key ? null : key));
  };

  const submitAsMode = async (trimmed: string, mode: 'book' | 'general') => {
    const entryIndex = history.length;
    const newEntry: HistoryEntry = {
      query: trimmed,
      response: null,
      bookResponse: null,
      detectedMode: mode,
      error: null,
      loading: true,
    };

    setHistory((prev) => [...prev, newEntry]);
    setQuery('');
    setIsLoading(true);
    setExpandedSection(null);

    try {
      if (mode === 'book') {
        // Book query flow
        const res = await fetch('/api/story-context/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: trimmed, bookId, sectionId }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || `Request failed (${res.status})`);
        }

        const data: BookQueryResponse = await res.json();
        setHistory((prev) =>
          prev.map((e, i) =>
            i === entryIndex
              ? { ...e, bookResponse: data, detectedMode: 'book', loading: false }
              : e
          )
        );
      } else {
        // General knowledge flow (existing)
        const completedEntries = history.filter(
          (e) => !e.loading && !e.error && e.response && !e.response.refusal
        );
        const recentEntries = completedEntries.slice(-3);
        const conversationContext =
          recentEntries.length > 0
            ? recentEntries.map((e) => ({
                query: e.resolvedQuery || e.query,
                summary: summarizeResponse(e.response!),
              }))
            : undefined;

        const res = await fetch('/api/knowledge-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: trimmed, bookId, sectionId, conversationContext }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || `Request failed (${res.status})`);
        }

        const data = await res.json();
        setHistory((prev) =>
          prev.map((e, i) =>
            i === entryIndex
              ? { ...e, response: data, resolvedQuery: data.resolvedQuery, detectedMode: 'general', loading: false }
              : e
          )
        );
      }
    } catch (err) {
      setHistory((prev) =>
        prev.map((e, i) =>
          i === entryIndex
            ? { ...e, error: err instanceof Error ? err.message : 'Unknown error', loading: false }
            : e
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    const trimmed = query.trim();
    if (!trimmed || isLoading) return;

    // Clear search mode when submitting a new query
    if (searchTerm) setSearchTerm('');

    if (queryMode === 'general') {
      return submitAsMode(trimmed, 'general');
    }

    if (queryMode === 'book') {
      return submitAsMode(trimmed, 'book');
    }

    // Auto mode: classify first
    try {
      const classifyRes = await fetch('/api/story-context/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      });

      if (classifyRes.ok) {
        const { mode } = await classifyRes.json();
        return submitAsMode(trimmed, mode);
      }
    } catch {
      // Classification failed — fall through to general
    }

    return submitAsMode(trimmed, 'general');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleNavigateToSection = (targetSectionId: number) => {
    // Navigate to the section in the editor by updating URL params
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', String(targetSectionId));
    router.push(`?${params.toString()}`);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    textareaRef.current?.focus();
  };

  const handleRetryAsGeneral = (originalQuery: string) => {
    setQuery(originalQuery);
    setQueryMode('general');
    textareaRef.current?.focus();
  };

  const handleRetryAsBook = (originalQuery: string) => {
    setQuery(originalQuery);
    setQueryMode('book');
    textareaRef.current?.focus();
  };

  const isInSearchMode = searchTerm.length > 0;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Orb */}
      <button
        onClick={() => setIsOpen(true)}
        className={`group fixed bottom-6 right-6 z-40 flex flex-col items-center gap-1 rounded-2xl bg-primary text-white border border-primary/30 cursor-pointer transition-all duration-300 animate-archive-pulse hover:border-secondary/60 ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{ padding: '5px 7px 4px' }}
        title="Open Knowledge Archive"
      >
        <ArchiveIcon className="w-28 h-28 shrink-0" />
        <span className="text-lg text-center leading-tight" style={{ fontFamily: 'var(--font-marck-script), cursive' }}>
          Knowledge<br />Archive
        </span>
      </button>

      {/* Slide Panel */}
      <div
        className={`fixed top-0 right-0 h-full z-40 w-[960px] flex flex-col bg-base-100 border-l border-base-300 shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Scanline overlay */}
        <div className="absolute inset-0 archive-scanlines pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center gap-3 px-5 py-3 border-b border-base-300 bg-base-100">
          <ArchiveIcon className="w-28 h-28 text-primary" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-neutral leading-tight" style={{ fontFamily: 'var(--font-marck-script), cursive' }}>Knowledge<br />Archive</h2>
            <p className="text-xs text-neutral/40">Knowledge Assistant</p>
            {analysisStatus && analysisStatus.total > 0 && (
              <p className="text-xs text-neutral/30 mt-0.5">
                Story indexed: {analysisStatus.completed}/{analysisStatus.total} sections
                {analysisStatus.processing > 0 && (
                  <span className="ml-1">
                    <span className="loading loading-spinner loading-xs align-middle" />
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="btn btn-ghost btn-xs btn-square text-neutral/40 hover:text-neutral/70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search bar */}
        <div className="relative px-4 py-2 border-b border-base-300 bg-base-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral/30" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search past research..."
              className="input input-bordered input-sm w-full pl-9 text-sm"
            />
            {isSearching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 loading loading-spinner loading-xs" />
            )}
          </div>
          {isInSearchMode && (
            <p className="text-xs text-neutral/40 mt-1">
              Showing results across all sections
            </p>
          )}
        </div>

        {/* Results area */}
        <div ref={scrollContainerRef} className="relative flex-1 overflow-y-auto p-4 space-y-3 bg-base-200">
          {history.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-neutral/20">
              <ArchiveIcon className="w-64 h-64 mb-3" />
              <p className="text-sm text-center leading-relaxed">
                {isInSearchMode
                  ? 'No results found.'
                  : (
                    <>
                      Research topics or ask about your book.
                      <br />
                      History, science, culture, characters, plot, and more.
                    </>
                  )}
              </p>
            </div>
          )}

          {history.map((entry, i) => {
            // Book query response
            if (entry.bookResponse || entry.detectedMode === 'book') {
              return (
                <BookContextResultCard
                  key={i}
                  entry={{
                    query: entry.query,
                    response: entry.bookResponse,
                    error: entry.error,
                    loading: entry.loading,
                    detectedMode: entry.detectedMode,
                  }}
                  index={i}
                  isLatest={i === history.length - 1}
                  onSuggestionClick={handleSuggestionClick}
                  onNavigateToSection={handleNavigateToSection}
                  onRetryAsGeneral={handleRetryAsGeneral}
                />
              );
            }

            // General knowledge response (existing card)
            return (
              <div key={i}>
                <ArchiveResultCard
                  entry={entry}
                  index={i}
                  isLatest={i === history.length - 1}
                  expandedSection={expandedSection}
                  onToggleSection={toggleSection}
                  showContext={isInSearchMode}
                />
                {/* Mode badge and override for auto-detected general queries */}
                {entry.detectedMode === 'general' && !entry.loading && !entry.error && (
                  <div className="mt-1 px-2">
                    <button
                      onClick={() => handleRetryAsBook(entry.query)}
                      className="text-xs text-neutral/40 hover:text-neutral/60 cursor-pointer"
                    >
                      Not what you expected? Try as book question
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Query input */}
        <div className="relative border-t border-base-300 p-4 bg-base-100">
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                queryMode === 'book'
                  ? 'Ask about your book...'
                  : queryMode === 'general'
                    ? 'Ask about a topic...'
                    : 'Ask about a topic or your book...'
              }
              rows={2}
              className="textarea textarea-bordered flex-1 text-sm resize-none"
            />
            <button
              onClick={handleSubmit}
              disabled={!query.trim() || isLoading}
              className="self-end btn btn-primary btn-sm btn-square"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          {/* Mode toggle */}
          <div className="flex items-center gap-1 mt-2">
            {(['auto', 'general', 'book'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setQueryMode(mode)}
                className={`btn btn-xs ${
                  queryMode === mode
                    ? 'btn-primary'
                    : 'btn-ghost text-neutral/50'
                }`}
              >
                {mode === 'auto' ? 'Auto' : mode === 'general' ? 'General Knowledge' : 'My Book'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
