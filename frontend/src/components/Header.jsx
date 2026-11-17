import React from 'react';
import { Feather, Menu } from 'lucide-react';
import ProfileDropdown from './profile/ProfileDropdown';

export default function Header({
  activeTab,
  setActiveTab,
  health,
  onToggleSidebar,
  onOpenProfile,
  isSidebarOpen = true,
}) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs h-auto md:h-16 flex items-center">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap md:flex-nowrap items-center justify-between py-2 md:py-0 h-full gap-2">
          {/* Left: Sidebar Toggle & Context */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={onToggleSidebar}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Toggle writing history sidebar"
              aria-label="Toggle history sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* When sidebar is closed on desktop: show the brand in header so user still has brand recognition */}
            {!isSidebarOpen && (
              <div className="hidden md:flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
                  <Feather className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-lg font-bold tracking-tight text-slate-900">Quillora AI</span>
                  <span className="text-[10px] px-1.5 py-0.5 font-medium rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                    v1.0
                  </span>
                </div>
              </div>
            )}

            {/* On mobile: always show brand here since sidebar is in a slide-out drawer */}
            <div className="flex md:hidden items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <Feather className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900">Quillora AI</span>
            </div>

            {/* When sidebar is open on desktop: show clean workspace indicator */}
            {isSidebarOpen && (
              <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400">
                <span className="font-medium text-slate-500">Writing Assistant</span>
              </div>
            )}
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

          {/* Profile */}
          <div className="order-2 md:order-3 flex items-center shrink-0">
            <ProfileDropdown onOpenProfile={onOpenProfile} />
          </div>
        </div>
      </div>
    </header>
  );
}
