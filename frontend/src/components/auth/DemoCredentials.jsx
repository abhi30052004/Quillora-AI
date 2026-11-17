import React from 'react';
import { KeyRound, Sparkles, ArrowRight, UserCheck } from 'lucide-react';
import { DEMO_CREDENTIALS } from '../../services/authService';

export default function DemoCredentials({ onFillCredentials, onDirectLogin }) {
  return (
    <div className="bg-sky-50/80 border border-sky-200/80 rounded-2xl p-4 text-xs">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center space-x-1.5 text-sky-900 font-semibold">
          <KeyRound className="w-4 h-4 text-sky-600" />
          <span>Demo Account Credentials</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
          Evaluation
        </span>
      </div>

      <div className="bg-white/90 rounded-xl p-3 border border-sky-100 space-y-1.5 font-mono text-[11px] text-slate-700 shadow-2xs">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-sans font-medium">Username:</span>
          <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
            {DEMO_CREDENTIALS.username}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-sans font-medium">Password:</span>
          <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
            {DEMO_CREDENTIALS.password}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          type="button"
          onClick={() => onFillCredentials(DEMO_CREDENTIALS.username, DEMO_CREDENTIALS.password)}
          className="flex items-center justify-center space-x-1 px-3 py-2 bg-white hover:bg-sky-100/60 border border-sky-200 text-sky-800 font-semibold rounded-xl transition-all shadow-2xs"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Fill Inputs</span>
        </button>
        <button
          type="button"
          onClick={onDirectLogin}
          className="flex items-center justify-center space-x-1 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition-all shadow-xs"
        >
          <span>Direct Login</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
