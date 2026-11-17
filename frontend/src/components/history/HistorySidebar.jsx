import React, { useState } from 'react';
import { Feather, Plus, Search, ChevronLeft, ChevronRight, X, Clock, FilePlus, Sparkles } from 'lucide-react';
import HistoryItem from './HistoryItem';
import { historyService } from '../../services/historyService';

export default function HistorySidebar({
  sessions = [],
  activeSessionId,
  onSelectSession,
  onNewSession,
  onRenameSession,
  onDeleteSession,
  isOpen,
  onToggleOpen,
  isMobile,
  onCloseMobile,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (s.title && s.title.toLowerCase().includes(q)) ||
      (s.content && s.content.toLowerCase().includes(q))
    );
  });

  const grouped = historyService.groupSessionsByDate(filteredSessions);

  const renderSection = (title, items) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mb-4">
        <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {title}
        </div>
        <div className="space-y-1">
          {items.map(session => (
            <HistoryItem
              key={session.id}
              session={session}
              isActive={session.id === activeSessionId}
              onSelect={(s) => {
                onSelectSession(s);
                if (isMobile) onCloseMobile();
              }}
              onRename={onRenameSession}
              onDelete={onDeleteSession}
            />
          ))}
        </div>
      </div>
    );
  };

  // If collapsed on desktop
  if (!isOpen && !isMobile) {
    return (
      <div className="hidden md:flex flex-col items-center py-4 px-2 bg-slate-50 border-r border-slate-200/80 w-16 transition-all shrink-0">
        <button
          onClick={onToggleOpen}
          className="p-2.5 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors mb-4"
          title="Expand History Sidebar"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <button
          onClick={onNewSession}
          className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-colors mb-6"
          title="New Document"
        >
          <Plus className="w-5 h-5" />
        </button>

        <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500">
          <Clock className="w-4 h-4" />
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200/80 w-72 md:w-64 lg:w-72 select-none">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/60 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-2xs">
            <Feather className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-slate-900 block leading-tight">Quillora AI</span>
            <span className="text-[10px] text-slate-400 font-medium">Session History</span>
          </div>
        </div>

        {isMobile ? (
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onToggleOpen}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* New Document Button */}
      <div className="p-3">
        <button
          onClick={() => {
            onNewSession();
            if (isMobile) onCloseMobile();
          }}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-white hover:bg-slate-100/90 border border-slate-200/90 text-slate-800 rounded-xl text-xs font-semibold shadow-2xs transition-all hover:border-slate-300"
        >
          <Plus className="w-4 h-4 text-sky-600" />
          <span>New Document</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-sky-500 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Sessions Grouped List */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 px-4 text-xs text-slate-400">
            {searchQuery ? 'No documents match your search.' : 'No writing sessions yet.'}
          </div>
        ) : (
          <>
            {renderSection('Today', grouped.today)}
            {renderSection('Yesterday', grouped.yesterday)}
            {renderSection('Previous 7 Days', grouped.previous7Days)}
            {renderSection('Older', grouped.older)}
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-200/60 text-[11px] text-slate-400 flex items-center justify-between">
        <span>{sessions.length} document{sessions.length !== 1 ? 's' : ''} saved</span>
        <span className="font-mono text-[10px] text-slate-400">Local Drafts</span>
      </div>
    </div>
  );

  // If Mobile Drawer
  if (isMobile) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in"
          onClick={onCloseMobile}
        />
        {/* Drawer */}
        <div className="relative z-10 animate-slide-right shadow-2xl">
          {sidebarContent}
        </div>
      </div>
    );
  }

  // Desktop inline sidebar
  return (
    <aside className="shrink-0 h-full hidden md:block">
      {sidebarContent}
    </aside>
  );
}
