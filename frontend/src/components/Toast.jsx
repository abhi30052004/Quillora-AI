import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
      <div
        className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
          isError
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        {isError ? (
          <AlertCircle className="w-4 h-4 text-rose-500" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        )}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
