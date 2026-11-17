import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, ShieldCheck, ChevronDown, Sparkles } from 'lucide-react';
import ProfileModal from './ProfileModal';
import { useAuth } from '../../context/AuthContext';

export default function ProfileDropdown({ user: propUser, onSignOut: propOnSignOut, onOpenProfile }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const dropdownRef = useRef(null);
  const { user: authUser, logout } = useAuth();

  const user = propUser || authUser;
  const handleSignOut = propOnSignOut || logout;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const initial = (user?.name || user?.username || 'U')[0].toUpperCase();

  const handleOpenProfileModal = () => {
    setIsOpen(false);
    if (onOpenProfile) {
      onOpenProfile();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100/80 transition-colors border border-transparent hover:border-slate-200"
          title="Open user profile menu"
          aria-label="Open user profile menu"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            {initial}
          </div>
          <div className="text-left hidden lg:block leading-tight pr-1">
            <span className="text-xs font-semibold text-slate-800 block truncate max-w-[100px]">
              {user?.name || user?.username || 'Demo User'}
            </span>
            <span className="text-[10px] text-sky-700 font-medium">Demo Account</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-40 text-xs animate-scale-up">
            <div className="px-4 py-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 block truncate">
                {user?.name || 'Demo User'}
              </span>
              <span className="text-[11px] text-slate-400 block truncate">
                @{user?.username || 'user'}
              </span>
              <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                {user?.role || 'Evaluation Account'}
              </span>
            </div>

            <div className="py-1">
              <button
                onClick={handleOpenProfileModal}
                className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5 transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>View Profile</span>
              </button>
            </div>

            <div className="pt-1 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleSignOut();
                }}
                className="w-full px-4 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center space-x-2.5 transition-colors font-semibold"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile Detail Modal */}
      <ProfileModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        user={user}
        onSignOut={handleSignOut}
      />
    </>
  );
}
