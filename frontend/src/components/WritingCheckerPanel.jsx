import React, { useEffect, useRef } from 'react';
import { Check, CheckCheck, X, Sparkles, AlertCircle, Copy, RotateCcw, Eye } from 'lucide-react';

export default function WritingCheckerPanel({
  issues,
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
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-rose-100 text-rose-700">Spelling</span>;
      case 'punctuation':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-sky-100 text-sky-700">Punctuation</span>;
      case 'style':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-purple-100 text-purple-700">Style</span>;
      case 'grammar':
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-amber-100 text-amber-700">Grammar</span>;
    }
  };

  const hasIssues = issues && issues.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[460px] overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-800 text-sm flex items-center space-x-2">
            <span>Writing Checker Results</span>
            {hasIssues && (
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
                {issues.length}
              </span>
            )}
          </h2>
          {stats && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              Analyzed {stats.word_count} words across {stats.chunks} chunk{stats.chunks > 1 ? 's' : ''} in {stats.processing_time_ms}ms
            </p>
          )}
        </div>

        {/* Global Actions */}
        <div className="flex items-center space-x-2">
          {hasIssues && (
            <>
              <button
                onClick={onOpenPreview}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs"
                title="Preview all corrections side-by-side with visual diff before applying"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview All Changes</span>
              </button>
              <button
                onClick={onApplyAll}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors shadow-xs"
                title="Apply all remaining corrections right-to-left"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Apply All</span>
              </button>
            </>
          )}

          <button
            onClick={onCopyText}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
            title="Copy current document text to clipboard"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Text</span>
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

      {/* Category Pills Bar */}
      {hasIssues && (
        <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/30 flex items-center space-x-2 text-xs overflow-x-auto">
          <span className="text-slate-400 font-medium">Categories:</span>
          {stats?.spelling_count > 0 && (
            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60 font-medium">
              {stats.spelling_count} spelling
            </span>
          )}
          {stats?.grammar_count > 0 && (
            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 font-medium">
              {stats.grammar_count} grammar
            </span>
          )}
          {stats?.punctuation_count > 0 && (
            <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200/60 font-medium">
              {stats.punctuation_count} punctuation
            </span>
          )}
          {stats?.style_count > 0 && (
            <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/60 font-medium">
              {stats.style_count} style
            </span>
          )}
        </div>
      )}

      {/* Cards Scroll Area */}
      <div className="p-4 flex-1 overflow-y-auto space-y-3">
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
        ) : (
          issues.map((issue, idx) => {
            const itemId = `item-${idx}`;
            const isSelected = selectedId === itemId;

            return (
              <div
                key={itemId}
                ref={(el) => (cardRefs.current[itemId] = el)}
                onClick={() => onSelectIssue(itemId, idx)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/40 ring-1 ring-sky-500 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                {/* Card Top: Category and Ignore */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {categoryBadge(issue.category)}
                    <span className="text-[11px] text-slate-400 font-mono">
                      chars {issue.start}–{issue.end}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onIgnoreIssue(idx);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                    title="Ignore this suggestion"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Diff Comparison */}
                <div className="flex items-center space-x-2 text-sm my-2 flex-wrap">
                  <span className="line-through text-rose-500 font-mono bg-rose-50 px-1.5 py-0.5 rounded text-xs">
                    {issue.original}
                  </span>
                  <span className="text-slate-400 text-xs font-bold">→</span>
                  <span className="text-emerald-700 font-semibold font-mono bg-emerald-50 px-1.5 py-0.5 rounded text-xs">
                    {issue.suggestion}
                  </span>
                </div>

                {/* Plain Explanation */}
                <p className="text-xs text-slate-600 leading-normal mb-3">
                  {issue.explanation}
                </p>

                {/* Apply Button */}
                <div className="flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onApplyIssue(idx);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-xs"
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
