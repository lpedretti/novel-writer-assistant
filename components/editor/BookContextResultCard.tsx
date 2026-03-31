'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, BookOpen, Lightbulb, HelpCircle } from 'lucide-react';
import type { BookQueryResponse } from '@/lib/story-context';

interface BookHistoryEntry {
  query: string;
  response: BookQueryResponse | null;
  error: string | null;
  loading: boolean;
  detectedMode?: 'book' | 'general';
}

function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'text-success bg-success/10',
    medium: 'text-warning bg-warning/10',
    low: 'text-error bg-error/10',
  };
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded-full ${colors[confidence]}`}>
      {confidence} confidence
    </span>
  );
}

export function BookContextResultCard({
  entry,
  index,
  isLatest,
  onSuggestionClick,
  onNavigateToSection,
  onRetryAsGeneral,
}: {
  entry: BookHistoryEntry;
  index: number;
  isLatest: boolean;
  onSuggestionClick?: (suggestion: string) => void;
  onNavigateToSection?: (sectionId: number) => void;
  onRetryAsGeneral?: (query: string) => void;
}) {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    isLatest ? 'evidence' : null
  );

  const toggleSection = (key: string) => {
    setExpandedSection((prev) => (prev === key ? null : key));
  };

  const sectionId = (key: string) => `${index}-${key}`;

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">
      {/* Query header */}
      <div className="px-4 py-2.5 bg-secondary/5 border-b border-base-300">
        <div className="flex items-center gap-2">
          <p className="text-sm text-secondary font-medium truncate flex-1">{entry.query}</p>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-secondary/10 text-secondary shrink-0">
            Book
          </span>
        </div>
      </div>

      <div className="p-3">
        {/* Loading state */}
        {entry.loading && (
          <div className="flex items-center gap-3 text-neutral/50 py-2">
            <span className="loading loading-spinner loading-sm" />
            <span className="text-sm">Searching your book...</span>
          </div>
        )}

        {/* Error state */}
        {entry.error && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-error">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="text-sm">{entry.error}</span>
            </div>
            {onRetryAsGeneral && (
              <button
                onClick={() => onRetryAsGeneral(entry.query)}
                className="text-xs text-primary hover:underline cursor-pointer"
              >
                Try as general knowledge question instead?
              </button>
            )}
          </div>
        )}

        {/* Success state */}
        {entry.response && (
          <div className="space-y-2">
            {/* Main answer */}
            <div className="text-sm text-neutral/90 leading-relaxed">
              {entry.response.answer}
            </div>

            {/* Confidence */}
            <div className="flex items-center gap-2">
              <ConfidenceBadge confidence={entry.response.confidence} />
            </div>

            {/* Evidence section */}
            {entry.response.evidence.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection(sectionId('evidence'))}
                  className="flex items-center gap-2 w-full text-left py-1.5 px-2 hover:bg-base-200 rounded transition-colors cursor-pointer"
                >
                  {expandedSection === sectionId('evidence') ? (
                    <ChevronDown className="w-4 h-4 text-secondary/50" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-secondary/50" />
                  )}
                  <BookOpen className="w-3.5 h-3.5 text-secondary/60" />
                  <span className="text-sm text-neutral/70 font-medium">Evidence</span>
                  <span className="text-xs text-secondary/50 bg-secondary/10 px-1.5 rounded-full">
                    {entry.response.evidence.length}
                  </span>
                </button>

                {expandedSection === sectionId('evidence') && (
                  <div className="pl-8 pr-2 pb-2 space-y-2">
                    {entry.response.evidence.map((ev, i) => (
                      <div key={i} className="border-l-2 border-secondary/20 pl-3 py-1">
                        <button
                          onClick={() => onNavigateToSection?.(ev.sectionId)}
                          className="text-xs text-secondary hover:underline cursor-pointer font-medium"
                        >
                          {ev.chapterTitle}
                          {ev.sectionTitle ? ` / ${ev.sectionTitle}` : ''}
                        </button>
                        <p className="text-sm text-neutral/70 mt-0.5">{ev.excerpt}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Gaps section */}
            {entry.response.gaps.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection(sectionId('gaps'))}
                  className="flex items-center gap-2 w-full text-left py-1.5 px-2 hover:bg-base-200 rounded transition-colors cursor-pointer"
                >
                  {expandedSection === sectionId('gaps') ? (
                    <ChevronDown className="w-4 h-4 text-warning/50" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-warning/50" />
                  )}
                  <HelpCircle className="w-3.5 h-3.5 text-warning/60" />
                  <span className="text-sm text-neutral/70 font-medium">Not Found</span>
                  <span className="text-xs text-warning/50 bg-warning/10 px-1.5 rounded-full">
                    {entry.response.gaps.length}
                  </span>
                </button>

                {expandedSection === sectionId('gaps') && (
                  <ul className="pl-8 pr-2 pb-2 space-y-1">
                    {entry.response.gaps.map((gap, i) => (
                      <li key={i} className="text-sm text-neutral/60 leading-relaxed list-disc">
                        {gap}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Suggestions section */}
            {entry.response.suggestions.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection(sectionId('suggestions'))}
                  className="flex items-center gap-2 w-full text-left py-1.5 px-2 hover:bg-base-200 rounded transition-colors cursor-pointer"
                >
                  {expandedSection === sectionId('suggestions') ? (
                    <ChevronDown className="w-4 h-4 text-info/50" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-info/50" />
                  )}
                  <Lightbulb className="w-3.5 h-3.5 text-info/60" />
                  <span className="text-sm text-neutral/70 font-medium">Follow-up Ideas</span>
                </button>

                {expandedSection === sectionId('suggestions') && (
                  <div className="pl-8 pr-2 pb-2 space-y-1">
                    {entry.response.suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => onSuggestionClick?.(suggestion)}
                        className="block text-sm text-info hover:underline cursor-pointer text-left"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Mode override hint */}
            {onRetryAsGeneral && (
              <div className="pt-1 border-t border-base-300 mt-2">
                <button
                  onClick={() => onRetryAsGeneral(entry.query)}
                  className="text-xs text-neutral/40 hover:text-neutral/60 cursor-pointer"
                >
                  Not what you expected? Try as general knowledge question
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
