import React, { useState, useEffect, useRef } from 'react';
import { Check, CheckCheck, X, Sparkles, AlertCircle, Copy, RotateCcw, Eye, Filter } from 'lucide-react';

export default function WritingCheckerPanel({
  issues = [],
  selectedId,
  onSelectIssue,
  onApplyIssue,
  onIgnoreIssue,
  onApplyAll,
  onOpenPreview,
  onCopyText,
  onReset,
  hasAppliedFixes,
  stats,
}) {
  const cardRefs = useRef({});
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Auto-scroll to selected card
  useEffect(() => {
    if (selectedId && cardRefs.current[selectedId]) {
      cardRefs.current[selectedId].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedId]);

  const categoryBadge = (cat) => {
    switch (cat) {
      case 'spelling':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
            Spelling
          </span>
        );
      case 'punctuation':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80">
            Punctuation
          </span>
        );
      case 'style':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
            Style
          </span>
        );
      case 'grammar':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
            Grammar
          </span>
        );
    }
  };

  const hasIssues = issues && issues.length > 0;

  // Filter issues based on active category
  const filteredIssues = issues
    .map((issue, originalIdx) => ({ issue, originalIdx }))
    .filter(({ issue }) => {
      if (selectedCategory === 'all') return true;
      return issue.category === selectedCategory;
    });

  // Dynamic category counts
  const counts = {
    all: issues.length,
    spelling: issues.filter(i => i.category === 'spelling').length,
    grammar: issues.filter(i => i.category === 'grammar').length,
    punctuation: issues.filter(i => i.category === 'punctuation').length,
    style: issues.filter(i => i.category === 'style').length,
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-200/80 bg-white flex items-center justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <h2 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight truncate">
              Writing Checker Results
            </h2>
            {hasIssues ? (
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold shrink-0">
                {issues.length}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold shrink-0">
                0
              </span>
            )}
          </div>
          {stats && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              Analyzed {stats.word_count} words in {(stats.processing_time_ms / 1000).toFixed(1)}s
            </p>
          )}
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {hasIssues && (
            <>
              <button
                onClick={onOpenPreview}
                className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-all shadow-2xs"
                title="Preview all corrections side-by-side"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Preview Changes</span>
              </button>
              <button
                onClick={onApplyAll}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-all shadow-xs hover:shadow"
                title="Apply all corrections"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Apply All</span>
              </button>
            </>
          )}

          <button
            onClick={onCopyText}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-all shadow-2xs"
            title="Copy document text to clipboard"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Copy Text</span>
          </button>

          {hasAppliedFixes && (
            <button
              onClick={onReset}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Reset to original text"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Category Filter Pills */}
      {hasIssues && (
        <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-1.5 text-xs overflow-x-auto shrink-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center space-x-1 ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>All</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              selectedCategory === 'all' ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'
            }`}>
              {counts.all}
            </span>
          </button>

          {counts.grammar > 0 && (
            <button
              onClick={() => setSelectedCategory('grammar')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center space-x-1 ${
                selectedCategory === 'grammar'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>Grammar</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === 'grammar' ? 'bg-amber-700 text-amber-100' : 'bg-amber-50 text-amber-700'
              }`}>
                {counts.grammar}
              </span>
            </button>
          )}

          {counts.spelling > 0 && (
            <button
              onClick={() => setSelectedCategory('spelling')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center space-x-1 ${
                selectedCategory === 'spelling'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>Spelling</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === 'spelling' ? 'bg-rose-700 text-rose-100' : 'bg-rose-50 text-rose-700'
              }`}>
                {counts.spelling}
              </span>
            </button>
          )}

          {counts.punctuation > 0 && (
            <button
              onClick={() => setSelectedCategory('punctuation')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center space-x-1 ${
                selectedCategory === 'punctuation'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>Punctuation</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === 'punctuation' ? 'bg-sky-700 text-sky-100' : 'bg-sky-50 text-sky-700'
              }`}>
                {counts.punctuation}
              </span>
            </button>
          )}

          {counts.style > 0 && (
            <button
              onClick={() => setSelectedCategory('style')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center space-x-1 ${
                selectedCategory === 'style'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>Style</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === 'style' ? 'bg-purple-700 text-purple-100' : 'bg-purple-50 text-purple-700'
              }`}>
                {counts.style}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Cards Scroll Area */}
      <div className="p-4 flex-1 min-h-0 overflow-y-auto space-y-3">
        {!hasIssues ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Check className="w-6 h-6 stroke-[2.5]" />
            </div>
            <p className="font-semibold text-slate-700 text-sm">No writing errors found</p>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Your document adheres to English spelling, grammar, punctuation, and style standards.
            </p>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <p className="font-medium text-slate-600 text-sm">No {selectedCategory} issues found</p>
            <button
              onClick={() => setSelectedCategory('all')}
              className="mt-2 text-xs text-sky-600 hover:underline"
            >
              View all {issues.length} issues
            </button>
          </div>
        ) : (
          filteredIssues.map(({ issue, originalIdx }) => {
            const itemId = `item-${originalIdx}`;
            const isSelected = selectedId === itemId;

            return (
              <div
                key={itemId}
                ref={(el) => (cardRefs.current[itemId] = el)}
                onClick={() => onSelectIssue(itemId, originalIdx)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/40 ring-1 ring-sky-500 shadow-xs'
                    : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs bg-white'
                }`}
              >
                {/* Card Top: Category Badge and Ignore Button */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center space-x-2">
                    {categoryBadge(issue.category)}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onIgnoreIssue(originalIdx);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                    title="Dismiss this suggestion"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Diff Comparison (Refined Typography) */}
                <div className="flex items-center space-x-2 text-sm my-2 flex-wrap">
                  <span className="line-through text-rose-600 bg-rose-50 border border-rose-200/70 px-2 py-0.5 rounded-md text-xs font-medium">
                    {issue.original}
                  </span>
                  <span className="text-slate-400 text-xs font-bold">→</span>
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-md text-xs font-semibold">
                    {issue.suggestion}
                  </span>
                </div>

                {/* Explanation */}
                <p className="text-xs text-slate-600 leading-normal mb-3">
                  {issue.explanation}
                </p>

                {/* Card Actions: Apply Button */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">Click to select in document</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onApplyIssue(originalIdx);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors shadow-2xs hover:shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
