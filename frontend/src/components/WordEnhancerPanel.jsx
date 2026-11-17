import React, { useEffect, useRef } from 'react';
import { Sparkles, Check, X, Copy, RotateCcw, Eye } from 'lucide-react';

export default function WordEnhancerPanel({
  suggestions = [],
  selectedTone,
  onChangeTone,
  selectedId,
  onSelectSuggestion,
  onApplyAlternative,
  onIgnoreSuggestion,
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

  const tones = [
    { id: 'neutral', label: 'Neutral', desc: 'Balanced & clear' },
    { id: 'formal', label: 'Formal', desc: 'Authoritative' },
    { id: 'casual', label: 'Casual', desc: 'Natural & relaxed' },
    { id: 'creative', label: 'Creative', desc: 'Evocative & vivid' },
  ];

  const hasSuggestions = suggestions && suggestions.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-200/80 bg-white flex items-center justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <h2 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight truncate">
              Vocabulary Enhancer
            </h2>
            {hasSuggestions ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold shrink-0">
                {suggestions.length}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold shrink-0">
                0
              </span>
            )}
          </div>
          {stats && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {stats.total_issues} opportunities in {stats.word_count} words • {(stats.processing_time_ms / 1000).toFixed(1)}s
            </p>
          )}
        </div>

        {/* Global Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {hasSuggestions && (
            <button
              onClick={onOpenPreview}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-all shadow-2xs"
              title="Preview all word enhancements side-by-side before applying"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Preview Enhancements</span>
            </button>
          )}

          <button
            onClick={onCopyText}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-all shadow-2xs"
            title="Copy enhanced text to clipboard"
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

      {/* Tone Selector Pills */}
      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 shrink-0">
        <label className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
          Target Voice Tone:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {tones.map((t) => (
            <button
              key={t.id}
              onClick={() => onChangeTone(t.id)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium text-left transition-all ${
                selectedTone === t.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200/90 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="font-semibold text-xs">{t.label}</div>
              <div className={`text-[10px] truncate ${selectedTone === t.id ? 'text-emerald-100' : 'text-slate-400'}`}>
                {t.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Suggestions List */}
      <div className="p-4 flex-1 min-h-0 overflow-y-auto space-y-3">
        {!hasSuggestions ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 stroke-[2]" />
            </div>
            <p className="font-semibold text-slate-700 text-sm">Vocabulary is sharp</p>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              No weak, vague, or repetitive words found for this tone.
            </p>
          </div>
        ) : (
          suggestions.map((item, idx) => {
            const itemId = `item-${idx}`;
            const isSelected = selectedId === itemId;

            return (
              <div
                key={itemId}
                ref={(el) => (cardRefs.current[itemId] = el)}
                onClick={() => onSelectSuggestion(itemId, idx)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500 shadow-xs'
                    : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs bg-white'
                }`}
              >
                {/* Header: Target word & Ignore */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Target Word:</span>
                    <span className="bg-slate-100 text-slate-800 text-xs font-semibold px-2 py-0.5 rounded-md border border-slate-200/70">
                      "{item.original}"
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onIgnoreSuggestion(idx);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                    title="Dismiss this suggestion"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Explanation */}
                <p className="text-xs text-slate-600 leading-normal mb-3">
                  {item.explanation}
                </p>

                {/* 3 Ranked Alternatives */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Choose Alternative to Replace:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {item.alternatives.map((alt, altIdx) => (
                      <button
                        key={altIdx}
                        onClick={(e) => {
                          e.stopPropagation();
                          onApplyAlternative(idx, alt);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-all border flex items-center justify-between shadow-2xs hover:shadow-xs ${
                          altIdx === 0
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <span className="font-semibold">{alt}</span>
                        {altIdx === 0 && (
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider ml-1 bg-emerald-100 px-1.5 py-0.2 rounded">
                            Best
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
