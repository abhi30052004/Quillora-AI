import React, { useState } from 'react';
import {
  Feather,
  CheckCircle2,
  Sparkles,
  Wand2,
  Eye,
  EyeOff,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage({ onLogin, onSwitchToRegister }) {
  const { login } = useAuth();
  const doLogin = onLogin || login;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e?.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please provide both username and password.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const res = doLogin(username, password);
      if (!res.success) {
        setError(res.error || 'Invalid credentials. Try: user / 123');
        setSubmitting(false);
      }
    }, 200);
  };

  const handleFillDemo = () => {
    setUsername('user');
    setPassword('123');
    setError('');
  };

  const handleQuickLogin = () => {
    setUsername('user');
    setPassword('123');
    setError('');
    setSubmitting(true);
    setTimeout(() => {
      doLogin('user', '123');
    }, 200);
  };

  return (
    <div className="w-screen h-screen min-h-[100svh] flex flex-col lg:flex-row bg-[#0B1220] overflow-x-hidden font-sans">
      {/* ============================================================== */}
      {/* 1. LEFT BRANDING SECTION (Approximately 48% desktop width)      */}
      {/* ============================================================== */}
      <div className="relative w-full lg:w-[48%] min-h-[440px] lg:min-h-screen bg-[#0B1220] p-8 sm:p-12 lg:p-16 flex flex-col justify-between text-white overflow-hidden">
        {/* Ambient Blue Radial Glows */}
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] bg-sky-500/10 rounded-full blur-[110px] pointer-events-none animate-pulse-subtle" />
        <div className="absolute top-1/2 -left-20 w-[360px] h-[360px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse-subtle" />
        <div className="absolute -bottom-32 right-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Faint Typography / Quill Ambient Watermark */}
        <div className="absolute right-6 top-1/4 w-80 h-80 opacity-[0.035] pointer-events-none text-sky-300 select-none hidden lg:block">
          <Feather className="w-full h-full stroke-[0.8]" />
        </div>

        {/* Top: Branding Logo & Subtitle */}
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-10 sm:mb-12">
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

          {/* Main Headline & Description */}
          <div className="max-w-md mb-8 sm:mb-10">
            <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-black tracking-tight text-white leading-[1.2] mb-4">
              Write Clearly.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-300 to-indigo-300">
                Communicate Better.
              </span><br />
              Write Confidently.
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed max-w-md">
              Your intelligent writing companion for better grammar, stronger vocabulary and clearer communication.
            </p>
          </div>

          {/* 3 Clean Horizontal Feature Rows */}
          <div className="space-y-4 max-w-md">
            {/* Feature 1: Grammar Intelligence */}
            <div className="flex items-start space-x-3.5 group cursor-default">
              <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0 mt-0.5 border border-sky-400/20 shadow-xs group-hover:scale-105 group-hover:bg-sky-500/25 transition-all duration-200">
                <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight group-hover:text-sky-300 transition-colors">
                  Grammar Intelligence
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                  Correct grammar, spelling and punctuation.
                </p>
              </div>
            </div>

            {/* Feature 2: Context-Aware Vocabulary */}
            <div className="flex items-start space-x-3.5 group cursor-default">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-400/20 shadow-xs group-hover:scale-105 group-hover:bg-indigo-500/25 transition-all duration-200">
                <Sparkles className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight group-hover:text-indigo-300 transition-colors">
                  Context-Aware Vocabulary
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                  Discover better words that fit your meaning.
                </p>
              </div>
            </div>

            {/* Feature 3: Smart Writing Improvement */}
            <div className="flex items-start space-x-3.5 group cursor-default">
              <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center shrink-0 mt-0.5 border border-teal-400/20 shadow-xs group-hover:scale-105 group-hover:bg-teal-500/25 transition-all duration-200">
                <Wand2 className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight group-hover:text-teal-300 transition-colors">
                  Smart Writing Improvement
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                  Refine sentences while preserving your voice.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
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
            {/* Extended Dark Navy Base with Organic Bezier Curve */}
            <path
              d="M0,0 C38,240 70,380 42,600 C20,760 48,880 0,1000 L0,0 Z"
              fill="currentColor"
            />
            {/* Luminous Edge Line with Subtle Glow */}
            <path
              d="M0,0 C38,240 70,380 42,600 C20,760 48,880 0,1000"
              fill="none"
              stroke="url(#quillora-curve-glow)"
              strokeWidth="2.2"
              opacity="0.75"
            />
            <defs>
              <linearGradient id="quillora-curve-glow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.1" />
                <stop offset="25%" stopColor="#38BDF8" stopOpacity="0.85" />
                <stop offset="60%" stopColor="#6366F1" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.15" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. RIGHT LOGIN SECTION (Approximately 52% desktop width)       */}
      {/* ============================================================== */}
      <div className="w-full lg:w-[52%] min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 sm:p-10 lg:p-12 relative z-10">
        <div className="w-full max-w-[420px] bg-white p-7 sm:p-9 rounded-2xl sm:rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-200/80 animate-fade-in">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome Back
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Your next great writing starts here.
            </p>
          </div>

          {/* Compact Elegant Demo Access Section (Above Login Form) */}
          <div className="mb-6 p-3 rounded-xl bg-sky-50/70 border border-sky-100 text-xs text-slate-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5 font-semibold text-slate-900 text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>Demo Account</span>
              </div>
              <div className="flex items-center space-x-2 font-mono text-[11px] text-slate-600">
                <span>User: <strong className="text-slate-900">user</strong></span>
                <span className="text-slate-300">|</span>
                <span>Pass: <strong className="text-slate-900">123</strong></span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleFillDemo}
                className="flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white border border-sky-200/90 text-sky-700 hover:bg-sky-50 font-medium text-xs transition-colors"
                title="Populate username and password inputs"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Fill Demo Credentials</span>
              </button>
              <button
                type="button"
                onClick={handleQuickLogin}
                className="flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs transition-colors shadow-2xs"
                title="Directly enter workspace with demo account"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Quick Login</span>
              </button>
            </div>
          </div>

          {/* Error Notification */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Demo Mode Indicator */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span>Remember session</span>
              </label>
              <span className="text-slate-400 text-[11px]">Demo mode</span>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:from-blue-700 hover:via-sky-700 hover:to-indigo-700 text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2 active:scale-98"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration Option */}
          <div className="mt-6 text-center text-xs text-slate-500">
            <span>Don't have an account? </span>
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-semibold text-sky-600 hover:text-sky-700 hover:underline"
            >
              Create Free Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
