import React, { useState } from 'react';
import { Feather, CheckCircle2, ShieldCheck, Sparkles, Eye, EyeOff, Lock, User, AlertCircle, History, Diff } from 'lucide-react';
import DemoCredentials from './DemoCredentials';
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

  const handleFillDemo = (demoUser, demoPass) => {
    setUsername(demoUser);
    setPassword(demoPass);
    setError('');
  };

  const handleDirectLogin = () => {
    setUsername('user');
    setPassword('123');
    setError('');
    setSubmitting(true);
    setTimeout(() => {
      doLogin('user', '123');
    }, 250);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* Left Section: Product Branding & Features */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-slate-950 shadow-md">
                <Feather className="w-6 h-6 stroke-[2.3]" />
              </div>
              <div>
                <span className="text-2xl font-bold tracking-tight text-white block">Quillora AI</span>
                <span className="text-[11px] text-sky-300 font-medium tracking-wide uppercase">Writing Assistant</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight mb-4">
              Write Clearly.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-indigo-200">
                Communicate Confidently.
              </span>
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed mb-8">
              The precision English assistant powered by authoritative knowledge injection. Elevate stories, essays, and reports without sacrificing your unique voice.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-3.5">
              <div className="flex items-start space-x-3 text-xs text-slate-200">
                <div className="p-1 rounded-lg bg-sky-500/20 text-sky-300 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-white block font-semibold">Intelligent Grammar Checking</strong>
                  <span>Accurate spelling, tense, and homophone detection.</span>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-xs text-slate-200">
                <div className="p-1 rounded-lg bg-indigo-500/20 text-indigo-300 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-white block font-semibold">Context-Aware Word Enhancement</strong>
                  <span>3 ranked alternatives tailored across 4 distinct voice tones.</span>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-xs text-slate-200">
                <div className="p-1 rounded-lg bg-sky-500/20 text-sky-300 mt-0.5">
                  <Diff className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-white block font-semibold">Smart Correction Preview</strong>
                  <span>Visual side-by-side diff with selective apply controls.</span>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-xs text-slate-200">
                <div className="p-1 rounded-lg bg-indigo-500/20 text-indigo-300 mt-0.5">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-white block font-semibold">Personal Writing History</strong>
                  <span>ChatGPT-style session organizer with automatic autosave.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="relative z-10 pt-8 border-t border-slate-800 text-[11px] text-slate-400">
            Single Source of Truth Knowledge Engine • Privacy First
          </div>
        </div>

        {/* Right Section: Login Form */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between bg-white">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to your account</h2>
                <p className="text-xs text-slate-500 mt-1">Access your saved drafts, writing checker, and vocabulary tools.</p>
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
                    placeholder="Enter your username (e.g. user)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all text-slate-800"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
                    placeholder="Enter your password (e.g. 123)"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all text-slate-800"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center space-x-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                  />
                  <span>Remember session</span>
                </label>
                <span className="text-slate-400 text-[11px]">Demo evaluation mode</span>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-all shadow-sm hover:shadow flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In to Quillora</span>
                )}
              </button>
            </form>

            {/* Clickable Demo Credentials Card */}
            <div className="mt-5">
              <DemoCredentials
                onFillCredentials={handleFillDemo}
                onDirectLogin={handleDirectLogin}
              />
            </div>
          </div>

          {/* Switch to Register */}
          <div className="pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
            <span>Don't have an account? </span>
            <button
              onClick={onSwitchToRegister}
              className="text-sky-600 hover:text-sky-700 font-semibold hover:underline"
            >
              Create demo account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
