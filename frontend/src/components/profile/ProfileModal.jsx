import React from 'react';
import { X, User, Mail, ShieldCheck, Clock, LogOut, KeyRound } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, user, onSignOut }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-7 font-sans animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-xs">
              {(user?.name || user?.username || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {user?.name || 'Demo User'}
              </h3>
              <span className="text-xs font-medium text-slate-400 block">
                @{user?.username || 'user'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Account Details */}
        <div className="py-4 space-y-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Account Type:</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold">
                {user?.role || 'Demo Account'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center space-x-1.5">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>Email Address:</span>
              </span>
              <span className="font-mono text-slate-700 font-medium">
                {user?.email || 'user@quillora.ai'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center space-x-1.5">
                <KeyRound className="w-4 h-4 text-slate-400" />
                <span>Linguistic Engine:</span>
              </span>
              <span className="font-mono text-emerald-700 font-bold">
                Groq 120B (Active)
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed px-1">
            This demo session operates locally within your browser. Writing history and document snapshots are isolated to your device.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onSignOut();
            }}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
