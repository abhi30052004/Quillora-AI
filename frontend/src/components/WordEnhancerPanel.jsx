import React, { useEffect, useRef } from 'react';
import { Sparkles, Check, X, Copy, RotateCcw, Eye } from 'lucide-react';

export default function WordEnhancerPanel({
  suggestions,
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
    { id: 'formal', label: 'Formal', desc: 'Authoritative & academic' },
    { id: 'casual', label: 'Casual', desc: 'Natural & relaxed' },
    { id: 'creative', label: 'Creative', desc: 'Evocative & descriptive' },
  ];

  const hasSuggestions = suggestions && suggestions.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[460px] overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-800 text-sm flex items-center space-x-2">
            <span>Vocabulary Enhancer</span>
            {hasSuggestions && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                {suggestions.length}
              </span>
            )}
          </h2>
          {stats && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              Targeted {stats.total_issues} weak words across {stats.word_count} words in {stats.processing_time_ms}ms
            </p>
          )}
        </div>

        {/* Global Actions */}
        <div className="flex items-center space-x-2">
          {hasSuggestions && (
            <button
              onClick={onOpenPreview}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
              title="Preview all word enhancements side-by-side before applying"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Enhancements</span>
            </button>
          )}

          <button
            onClick={onCopyText}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
            title="Copy enhanced text to clipboard"
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

      {/* Tone Selector Pills */}
      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/40">
        <label className="text-xs font-semibold text-slate-500 block mb-1.5 uppercase tracking-wider">
          Selected Voice Tone:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {tones.map((t) => (
            <button
              key={t.id}
              onClick={() => onChangeTone(t.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-all ${
                selectedTone === t.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="font-semibold">{t.label}</div>
              <div className={`text-[10px] ${selectedTone === t.id ? 'text-emerald-100' : 'text-slate-400'}`}>
                {t.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Suggestions List */}
      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        {!hasSuggestions ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 stroke-[2]" />
            </div>
            <p className="font-semibold text-slate-700 text-sm">Vocabulary is sharp</p>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              No weak, vague, or repetitive words found for this section.
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
                    ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                {/* Header: Target word & Ignore */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Target Word:</span>
                    <span className="bg-slate-100 text-slate-800 font-mono text-xs font-bold px-2 py-0.5 rounded">
                      "{item.original}"
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onIgnoreSuggestion(idx);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                    title="Ignore this suggestion"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Explanation */}
                <p className="text-xs text-slate-600 leading-normal mb-3">
                  {item.explanation}
                </p>

                {/* 3 Ranked Alternatives */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Choose Alternative:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {item.alternatives.map((alt, altIdx) => (
                      <button
                        key={altIdx}
                        onClick={(e) => {
                          e.stopPropagation();
                          onApplyAlternative(idx, alt);
                        }}
                        className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all border flex items-center justify-between ${
                          altIdx === 0
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-semibold">{alt}</span>
                        {altIdx === 0 && (
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider ml-1">
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
