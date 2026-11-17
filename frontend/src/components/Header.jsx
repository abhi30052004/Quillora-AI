import React from 'react';
import { Feather, Menu } from 'lucide-react';
import ProfileDropdown from './profile/ProfileDropdown';

export default function Header({
  activeTab,
  setActiveTab,
  health,
  onToggleSidebar,
  onOpenProfile,
}) {
  const isOnline = health?.status === 'ok';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap md:flex-nowrap items-center justify-between py-2 md:py-0 md:h-16 gap-2">
          {/* Brand & Sidebar Toggle */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            <button
              onClick={onToggleSidebar}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Toggle writing history sidebar"
              aria-label="Toggle history sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Feather className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">Quillora AI</span>
                <span className="text-[10px] sm:text-xs px-1.5 py-0.5 font-medium rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Authoritative English Writing Assistant</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="order-3 md:order-2 flex w-full md:w-auto bg-slate-100 p-1 rounded-xl justify-center">
            <button
              onClick={() => setActiveTab('checker')}
              className={`flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'checker'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Writing Checker</span>
            </button>
            <button
              onClick={() => setActiveTab('enhancer')}
              className={`flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'enhancer'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Word Enhancer</span>
            </button>
          </div>

          {/* Connection Status & Profile */}
          <div className="order-2 md:order-3 flex items-center space-x-2 shrink-0">
            {/* Status Indicator */}
            <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-700 font-medium">Ready</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-rose-600 font-medium">Offline</span>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="pl-1 border-l border-slate-200">
              <ProfileDropdown onOpenProfile={onOpenProfile} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
