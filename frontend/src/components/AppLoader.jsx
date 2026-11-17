import React from 'react';
import { Feather, Sparkles } from 'lucide-react';

export default function AppLoader({ message = "Preparing your writing workspace..." }) {
  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white font-sans animate-fade-in">
      {/* Brand Icon with Pulsing Halo */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-2xl shadow-sky-500/30 animate-pulse">
          <Feather className="w-10 h-10 stroke-[2.2] animate-bounce" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] animate-spin">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* App Title */}
      <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
        Quillora AI
      </h2>
      <p className="text-xs text-sky-300 font-medium tracking-wide uppercase mb-6">
        Linguistic Engine Initializing
      </p>

      {/* Progress Bar Animation */}
      <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3 border border-slate-700/50">
        <div className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full animate-progress" />
      </div>

      {/* Status Subtitle */}
      <p className="text-xs text-slate-400 font-medium">
        {message}
      </p>
    </div>
  );
}
