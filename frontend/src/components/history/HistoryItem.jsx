import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit2, Trash2, Check, X, FileText, Sparkles, CheckCheck } from 'lucide-react';

export default function HistoryItem({
  session,
  isActive,
  onSelect,
  onRename,
  onDelete,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(session.title);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleSaveRename = () => {
    if (editTitle.trim()) {
      onRename(session.id, editTitle.trim());
    } else {
      setEditTitle(session.title);
    }
    setIsEditing(false);
    setShowMenu(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      setEditTitle(session.title);
      setIsEditing(false);
      setShowMenu(false);
    }
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return '';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div
      onClick={() => !isEditing && onSelect(session)}
      className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-all ${
        isActive
          ? 'bg-sky-50 text-sky-950 font-semibold border border-sky-200/80 shadow-2xs'
          : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
      }`}
    >
      <div className="flex items-center space-x-2.5 min-w-0 flex-1">
        <div className={`p-1 rounded-lg shrink-0 ${isActive ? 'bg-sky-200/70 text-sky-800' : 'bg-slate-200/70 text-slate-500 group-hover:text-slate-700'}`}>
          {session.mode === 'enhancer' ? (
            <Sparkles className="w-3.5 h-3.5" />
          ) : (
            <FileText className="w-3.5 h-3.5" />
          )}
        </div>

        {isEditing ? (
          <div className="flex items-center space-x-1 flex-1" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-1.5 py-0.5 bg-white border border-sky-400 rounded text-xs outline-none focus:ring-1 focus:ring-sky-500 font-normal"
            />
            <button
              onClick={handleSaveRename}
              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
              title="Save"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                setEditTitle(session.title);
                setIsEditing(false);
              }}
              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
              title="Cancel"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <span className="truncate block font-medium">
              {session.title || 'Untitled Document'}
            </span>
            <span className="text-[10px] text-slate-400 font-normal block">
              {formatRelativeTime(session.updatedAt || session.createdAt)}
            </span>
          </div>
        )}
      </div>

      {/* Three-dot action button */}
      {!isEditing && (
        <div className="relative shrink-0 ml-1.5" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={`p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-opacity ${
              isActive || showMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            title="Options"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {/* Popup Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 text-xs font-normal">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Rename</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  if (window.confirm(`Delete writing session "${session.title}"?`)) {
                    onDelete(session.id);
                  }
                }}
                className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 flex items-center space-x-2"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
