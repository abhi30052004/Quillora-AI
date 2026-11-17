import React, { useState, useMemo } from 'react';
import { X, Check, CheckCheck, XCircle, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Sparkles, AlertCircle, FileText, CheckCircle2, Diff } from 'lucide-react';

export default function WritingPreviewModal({
  isOpen,
  onClose,
  originalText,
  items = [],
  type = 'checker', // 'checker' | 'enhancer'
  onApplySelected,
}) {
  if (!isOpen) return null;

  // Track which items are accepted / selected. Default to ALL selected.
  const [selectedIndices, setSelectedIndices] = useState(() => new Set(items.map((_, i) => i)));
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  // For Word Enhancer: track which alternative is picked per item (default to index 0: 'Best')
  const [chosenAlternatives, setChosenAlternatives] = useState(() => {
    const initial = {};
    items.forEach((item, idx) => {
      if (item.alternatives && item.alternatives.length > 0) {
        initial[idx] = item.alternatives[0];
      }
    });
    return initial;
  });

  const toggleSelect = (idx) => {
    const next = new Set(selectedIndices);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setSelectedIndices(next);
  };

  const handleSelectAll = () => {
    setSelectedIndices(new Set(items.map((_, i) => i)));
  };

  const handleDeselectAll = () => {
    setSelectedIndices(new Set());
  };

  const handleNext = () => {
    if (activeItemIndex < items.length - 1) {
      setActiveItemIndex(activeItemIndex + 1);
    }
  };

  const handlePrev = () => {
    if (activeItemIndex > 0) {
      setActiveItemIndex(activeItemIndex - 1);
    }
  };

  // Generate the corrected preview text using safe Right-to-Left replacement
  const correctedPreviewText = useMemo(() => {
    const selectedItems = items
      .map((item, idx) => ({ ...item, idx }))
      .filter(item => selectedIndices.has(item.idx));

    // Sort descending by start offset (Right-to-Left)
    selectedItems.sort((a, b) => b.start - a.start);

    let text = originalText;
    for (const item of selectedItems) {
      const replacement = type === 'checker'
        ? item.suggestion
        : (chosenAlternatives[item.idx] || (item.alternatives && item.alternatives[0]) || item.suggestion || '');

      text = text.slice(0, item.start) + replacement + text.slice(item.end);
    }
    return text;
  }, [originalText, items, selectedIndices, chosenAlternatives, type]);

  // Compute summary stats
  const totalIssues = items.length;
  const selectedCount = selectedIndices.size;
  const ignoredCount = totalIssues - selectedCount;
  const estimatedWordsChanged = useMemo(() => {
    let count = 0;
    items.forEach((item, idx) => {
      if (selectedIndices.has(idx)) {
        const words = item.original.trim().split(/\s+/).length;
        count += words;
      }
    });
    return count;
  }, [items, selectedIndices]);

  const handleConfirmApply = () => {
    onApplySelected({
      selectedIndices,
      chosenAlternatives,
    });
    onClose();
  };

  const currentItem = items[activeItemIndex];

  return (
    <div
      id="quillora-preview-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 lg:p-8"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-6xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-scale-up font-sans">
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Diff className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  {type === 'checker' ? 'Preview All Writing Corrections' : 'Preview Vocabulary Enhancements'}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-semibold">
                  Side-by-Side Review
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Review proposed AI replacements, toggle individual suggestions, and apply with zero character offset drift.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
            title="Back to Editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Metric Strip */}
        <div className="px-6 py-2.5 bg-sky-50/50 border-b border-sky-100 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-4 sm:space-x-6">
            <div>
              <span className="text-slate-500">Total Detected:</span>{' '}
              <strong className="text-slate-800 font-semibold">{totalIssues}</strong>
            </div>
            <div>
              <span className="text-slate-500">Selected:</span>{' '}
              <strong className="text-emerald-700 font-semibold">{selectedCount}</strong>
            </div>
            <div>
              <span className="text-slate-500">Ignored:</span>{' '}
              <strong className="text-slate-500 font-semibold">{ignoredCount}</strong>
            </div>
            <div className="hidden sm:block">
              <span className="text-slate-500">Words Affected:</span>{' '}
              <strong className="text-sky-700 font-semibold">~{estimatedWordsChanged}</strong>
            </div>
          </div>

          {/* Quick Selection Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSelectAll}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              Accept All
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              Reject All
            </button>
          </div>
        </div>

        {/* Modal Main Body: 3-column / Split View */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Column 1: Original Text with Deletion Highlights (4 cols) */}
          <div className="lg:col-span-4 p-5 overflow-y-auto flex flex-col bg-slate-50/30 max-h-[38vh] lg:max-h-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Original Submitted Text</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {originalText.length} chars
              </span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 text-sm leading-relaxed text-slate-800 font-sans flex-1 overflow-y-auto whitespace-pre-wrap">
              {originalText}
            </div>
          </div>

          {/* Column 2: Corrected Preview with Green Highlights (5 cols) */}
          <div className="lg:col-span-5 p-5 overflow-y-auto flex flex-col bg-emerald-50/10 max-h-[38vh] lg:max-h-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Corrected Preview (Result)</span>
              </span>
              <span className="text-[11px] text-emerald-700 font-mono">
                {correctedPreviewText.length} chars
              </span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-emerald-200/80 text-sm leading-relaxed text-slate-800 font-sans flex-1 overflow-y-auto whitespace-pre-wrap shadow-2xs">
              {correctedPreviewText}
            </div>
          </div>

          {/* Column 3: Step-by-Step Item Selector & Navigator (3 cols) */}
          <div className="lg:col-span-3 p-4 overflow-y-auto flex flex-col bg-slate-50/50">
            {/* Step Navigation Bar */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-700">
                Correction {items.length > 0 ? activeItemIndex + 1 : 0} of {items.length}
              </span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={handlePrev}
                  disabled={activeItemIndex === 0}
                  className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                  title="Previous correction"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  disabled={activeItemIndex >= items.length - 1}
                  className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                  title="Next correction"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List of items */}
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {items.map((item, idx) => {
                const isSelected = selectedIndices.has(idx);
                const isFocused = idx === activeItemIndex;
                const chosen = chosenAlternatives[idx] || (item.alternatives && item.alternatives[0]) || item.suggestion;

                return (
                  <div
                    key={idx}
                    onClick={() => setActiveItemIndex(idx)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isFocused
                        ? 'border-sky-500 bg-sky-50/50 ring-1 ring-sky-500 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        className="flex items-center space-x-2 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(idx)}
                          className="w-3.5 h-3.5 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                        />
                        <span className={`font-semibold uppercase text-[10px] ${
                          item.category === 'spelling' ? 'text-rose-600' :
                          item.category === 'punctuation' ? 'text-sky-600' :
                          item.category === 'style' ? 'text-purple-600' : 'text-amber-600'
                        }`}>
                          {item.category || 'Enhance'}
                        </span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        chars {item.start}–{item.end}
                      </span>
                    </div>

                    {/* Diff Preview in Card */}
                    <div className="my-1 text-xs">
                      <span className="line-through text-rose-500 bg-rose-50 px-1 py-0.5 rounded font-mono">
                        {item.original}
                      </span>
                      <span className="text-slate-400 mx-1">→</span>
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-mono">
                        {chosen}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      {item.explanation}
                    </p>

                    {/* If Word Enhancer: Alternative Selector Pills */}
                    {type === 'enhancer' && item.alternatives && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                          Select Alternative:
                        </span>
                        <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                          {item.alternatives.map((alt, altIdx) => (
                            <button
                              key={altIdx}
                              onClick={() => {
                                setChosenAlternatives({ ...chosenAlternatives, [idx]: alt });
                                if (!selectedIndices.has(idx)) {
                                  toggleSelect(idx);
                                }
                              }}
                              className={`w-full text-left px-2 py-1 rounded-md text-[11px] transition-all flex items-center justify-between ${
                                chosen === alt
                                  ? 'bg-emerald-600 text-white font-semibold'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              <span>{alt}</span>
                              {altIdx === 0 && (
                                <span className={`text-[9px] uppercase font-bold ${chosen === alt ? 'text-emerald-100' : 'text-emerald-700'}`}>
                                  Best
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Editor</span>
          </button>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-500 hidden sm:inline">
              Ready to apply <strong>{selectedCount}</strong> change{selectedCount !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handleConfirmApply}
              disabled={selectedCount === 0}
              className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition-all shadow-sm hover:shadow"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Apply {selectedCount} Selected Change{selectedCount !== 1 ? 's' : ''}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
