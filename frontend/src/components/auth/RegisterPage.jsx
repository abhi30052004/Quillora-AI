import React, { useState } from 'react';
import {
  Feather,
  User,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage({ onRegister, onSwitchToLogin }) {
  const { register } = useAuth();
  const doRegister = onRegister || register;

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Username and password are required.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 3) {
      setError('Password must be at least 3 characters.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const res = doRegister({
        name: formData.name || formData.username,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      if (!res.success) {
        setError(res.error || 'Registration failed.');
        setSubmitting(false);
      }
    }, 200);
  };

  return (
    <div className="w-screen h-screen min-h-[100svh] flex flex-col lg:flex-row bg-[#0B1220] overflow-x-hidden font-sans">
      {/* LEFT SECTION */}
      <div className="relative w-full lg:w-[48%] min-h-[440px] lg:min-h-screen bg-[#0B1220] p-8 sm:p-12 lg:p-16 flex flex-col justify-between text-white overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] bg-sky-500/10 rounded-full blur-[110px] pointer-events-none animate-pulse-subtle" />
        <div className="absolute top-1/2 -left-20 w-[360px] h-[360px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse-subtle" />
        <div className="absolute -bottom-32 right-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-10 sm:mb-14">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Feather className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white block leading-tight">
                Quillora AI
              </span>
              <span className="text-[10px] text-sky-400 font-bold tracking-widest uppercase">
                WRITING ASSISTANT
              </span>
            </div>
          </div>

          <div className="max-w-md mb-8 sm:mb-10">
            <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-black tracking-tight text-white leading-[1.2] mb-4">
              Write Clearly.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-300 to-indigo-300">
                Communicate Better.
              </span><br />
              Write Confidently.
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed max-w-md">
              Create your free evaluation account to access real-time grammar checks and vocabulary enhancements.
            </p>
          </div>

          <div className="space-y-4 max-w-md">
            <div className="flex items-start space-x-3.5">
              <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0 mt-0.5 border border-sky-400/20 shadow-xs">
                <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">Instant Demo Workspace</h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                  Immediate access with no credit card required.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-400/20 shadow-xs">
                <Sparkles className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">Client-Side Session Storage</h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                  Your drafts and history stay private in your browser.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-6 mt-8 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>&copy; 2026 Quillora AI</span>
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium tracking-wide">AI Writing Engine Active</span>
          </div>
        </div>

        {/* ASYMMETRIC ORGANIC CURVED DIVIDER (Desktop & Tablet Wide) */}
        <div className="hidden lg:block absolute -right-10 top-0 bottom-0 w-10 h-full pointer-events-none z-20 overflow-visible">
          <svg
            viewBox="0 0 80 1000"
            preserveAspectRatio="none"
            className="w-full h-full text-[#0B1220] filter drop-shadow-[3px_0_12px_rgba(56,189,248,0.18)]"
          >
            <path
              d="M0,0 C38,240 70,380 42,600 C20,760 48,880 0,1000 L0,0 Z"
              fill="currentColor"
            />
            <path
              d="M0,0 C38,240 70,380 42,600 C20,760 48,880 0,1000"
              fill="none"
              stroke="url(#quillora-curve-glow-reg)"
              strokeWidth="2.2"
              opacity="0.75"
            />
            <defs>
              <linearGradient id="quillora-curve-glow-reg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.1" />
                <stop offset="25%" stopColor="#38BDF8" stopOpacity="0.85" />
                <stop offset="60%" stopColor="#6366F1" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.15" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* RIGHT REGISTRATION SECTION */}
      <div className="w-full lg:w-[52%] min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 sm:p-10 lg:p-12 relative z-10">
        <div className="w-full max-w-[420px] bg-white p-7 sm:p-9 rounded-2xl sm:rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-200/80 animate-fade-in">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Create Account
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Start improving your writing with Quillora AI.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Jane Doe"
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Username *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 3 chars"
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:from-blue-700 hover:via-sky-700 hover:to-indigo-700 text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-500">
            <span>Already have an account? </span>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-semibold text-sky-600 hover:text-sky-700 hover:underline"
            >
              Sign In Instead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
