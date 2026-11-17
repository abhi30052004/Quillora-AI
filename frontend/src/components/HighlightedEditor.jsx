import React from 'react';
import { Edit3, CheckCircle, Eye } from 'lucide-react';

export default function HighlightedEditor({
  text,
  onChangeText,
  items = [],
  selectedId,
  onSelectItem,
  isAnalyzing,
  mode = 'edit', // 'edit' | 'review'
  setMode,
  type = 'checker', // 'checker' | 'enhancer'
}) {
  // Build highlighted spans from sorted non-overlapping items
  const renderHighlightedContent = () => {
    if (!items || items.length === 0) {
      return <div className="whitespace-pre-wrap font-sans text-slate-800 leading-relaxed text-base">{text}</div>;
    }

    const elements = [];
    let lastIndex = 0;

    items.forEach((item, idx) => {
      const { start, end, category } = item;
      const itemId = `item-${idx}`;
      const isSelected = selectedId === itemId;

      // Add leading unhighlighted text
      if (start > lastIndex) {
        elements.push(
          <span key={`plain-${lastIndex}-${start}`} className="whitespace-pre-wrap">
            {text.slice(lastIndex, start)}
          </span>
        );
      }

      // Determine highlight style
      let colorClass = 'highlight-grammar';
      if (type === 'checker') {
        if (category === 'spelling') colorClass = 'highlight-spelling';
        else if (category === 'punctuation') colorClass = 'highlight-punctuation';
        else if (category === 'style') colorClass = 'highlight-style';
        else colorClass = 'highlight-grammar';
      } else {
        colorClass = 'highlight-enhance';
      }

      const activeClass = isSelected ? 'ring-2 ring-sky-600 ring-offset-1 font-semibold' : '';

      // Add highlighted span
      elements.push(
        <mark
          key={itemId}
          onClick={(e) => {
            e.stopPropagation();
            onSelectItem(itemId, idx);
          }}
          className={`${colorClass} ${activeClass} transition-all duration-150 rounded px-1 cursor-pointer`}
          title={`Click to view suggestion: ${item.suggestion || item.alternatives?.join(', ')}`}
        >
          {text.slice(start, end)}
        </mark>
      );

      lastIndex = end;
    });

    // Add trailing unhighlighted text
    if (lastIndex < text.length) {
      elements.push(
        <span key={`plain-${lastIndex}-${text.length}`} className="whitespace-pre-wrap">
          {text.slice(lastIndex)}
        </span>
      );
    }

    return (
      <div className="whitespace-pre-wrap font-sans text-slate-800 leading-relaxed text-base min-h-[300px]">
        {elements}
      </div>
    );
  };

  const hasItems = items && items.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[460px]">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/60 text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          {hasItems && (
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setMode('review')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all font-medium ${
                  mode === 'review'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-sky-600" />
                <span>Highlighted View ({items.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('edit')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all font-medium ${
                  mode === 'edit'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Raw Text Editor</span>
              </button>
            </div>
          )}
          {!hasItems && (
            <span className="font-medium text-slate-600 flex items-center space-x-1">
              <Edit3 className="w-3.5 h-3.5 mr-1" /> Document Input
            </span>
          )}
        </div>

        {/* Counter Stats */}
        <div className="flex items-center space-x-4">
          <span>
            <strong className="text-slate-700">{text.trim() ? text.trim().split(/\s+/).length : 0}</strong> words
          </span>
          <span className="border-l border-slate-200 pl-4">
            <strong className="text-slate-700">{text.length}</strong> chars
          </span>
        </div>
      </div>

      {/* Editor Body */}
      <div className="p-5 flex-1 relative overflow-y-auto">
        {mode === 'edit' || !hasItems ? (
          <textarea
            value={text}
            onChange={(e) => onChangeText(e.target.value)}
            placeholder="Paste your story, essay, email, or report here to analyze..."
            className="w-full h-full min-h-[360px] resize-none outline-none border-0 text-slate-800 placeholder-slate-400 leading-relaxed text-base bg-transparent font-sans"
            disabled={isAnalyzing}
          />
        ) : (
          <div className="w-full h-full cursor-text" onClick={() => onSelectItem(null, -1)}>
            {renderHighlightedContent()}
          </div>
        )}
      </div>
    </div>
  );
}
