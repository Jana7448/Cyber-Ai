import React from 'react';
import { Sun, Moon, User as UserIcon, Settings as SettingsIcon, LogOut, History, Plus } from 'lucide-react';
import { CyberGuardLogo } from './CyberGuardLogo';
import { AppSettings, UserProfile } from '../types';

interface NavbarProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  user: UserProfile | null;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onNewChat: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  setSettings,
  user,
  onOpenProfile,
  onOpenSettings,
  onOpenHistory,
  onNewChat,
  onLogout,
}) => {
  const isLight = settings.theme === 'light';

  const toggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  return (
    <header className={`sticky top-0 z-40 w-full border-b transition-colors duration-300 ${
      isLight
        ? 'border-slate-200/80 bg-white/85 text-slate-800 shadow-md shadow-slate-200/50 backdrop-blur-xl'
        : 'border-sky-500/20 bg-slate-950/80 text-slate-100 shadow-lg shadow-black/50 backdrop-blur-xl'
    } px-4 py-3`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Left: CyberGuard AI Logo */}
        <div className="flex items-center gap-3">
          <CyberGuardLogo size="sm" showText={false} />
        </div>

        {/* Center: CyberGuard AI */}
        <div className="flex items-center gap-2">
          <h1 className="text-lg md:text-xl font-bold font-mono tracking-wider bg-gradient-to-r from-sky-500 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            CyberGuard AI
          </h1>
          <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" title="AI Engine Online" />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 md:gap-2.5 font-mono">
          
          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer shadow-xs ${
              isLight
                ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/10'
                : 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40'
            }`}
            title="Start New Chat Thread"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </button>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-transparent transition-all cursor-pointer text-xs ${
              isLight
                ? 'text-slate-700 hover:text-sky-600 hover:bg-sky-50 hover:border-sky-200'
                : 'text-slate-300 hover:text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/30'
            }`}
            title="Chat History"
            aria-label="Open Chat History"
          >
            <History className="w-4 h-4 text-sky-500" />
            <span className="hidden md:inline font-semibold">History</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border border-transparent transition-all cursor-pointer ${
              isLight
                ? 'text-slate-600 hover:text-sky-600 hover:bg-sky-50 hover:border-sky-200'
                : 'text-slate-300 hover:text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/30'
            }`}
            title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle Theme"
          >
            {isLight ? (
              <Moon className="w-5 h-5 text-sky-600" />
            ) : (
              <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" />
            )}
          </button>

          {/* Profile Icon */}
          <button
            onClick={onOpenProfile}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-transparent transition-all cursor-pointer ${
              isLight
                ? 'text-slate-700 hover:text-sky-600 hover:bg-sky-50 hover:border-sky-200'
                : 'text-slate-300 hover:text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/30'
            }`}
            title="User Profile"
            aria-label="Open Profile"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-purple-500 p-[1px] flex items-center justify-center">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className={`w-full h-full rounded-full flex items-center justify-center ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
                  <UserIcon className="w-3.5 h-3.5 text-sky-500" />
                </div>
              )}
            </div>
            <span className={`hidden md:inline text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              {user?.displayName || 'Agent'}
            </span>
          </button>

          {/* Settings Icon */}
          <button
            onClick={onOpenSettings}
            className={`p-2 rounded-xl border border-transparent transition-all cursor-pointer ${
              isLight
                ? 'text-slate-600 hover:text-sky-600 hover:bg-sky-50 hover:border-sky-200'
                : 'text-slate-300 hover:text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/30'
            }`}
            title="Settings"
            aria-label="Open Settings"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>

          {/* Logout Icon */}
          {user && (
            <button
              onClick={onLogout}
              className={`p-2 rounded-xl border border-transparent transition-all cursor-pointer ${
                isLight
                  ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200'
                  : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30'
              }`}
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
