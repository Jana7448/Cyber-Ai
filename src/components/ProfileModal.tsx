import React, { useState } from 'react';
import { X, User, Mail, Lock, LogOut, Check, Shield } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateProfile,
  onLogout,
}) => {
  if (!isOpen) return null;

  const isLight = document.documentElement.classList.contains('light-mode');

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savedSuccess, setSavedSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [passwordError, setPasswordError] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({ displayName, photoURL });
    setSavedSuccess('Profile details updated!');
    setTimeout(() => setSavedSuccess(''), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      setPasswordError('New password must contain uppercase, lowercase, numbers, and special characters.');
      return;
    }

    // Check current password in localStorage db
    try {
      const savedDb = localStorage.getItem('cyberguard_users_db');
      if (savedDb) {
        const accounts = JSON.parse(savedDb);
        if (Array.isArray(accounts)) {
          const accIndex = accounts.findIndex(a => a.email.toLowerCase() === (user?.email || '').toLowerCase());
          if (accIndex !== -1) {
            if (accounts[accIndex].passwordHash !== currentPassword) {
              setPasswordError('Current password provided is incorrect.');
              return;
            }
            // Update password
            accounts[accIndex].passwordHash = newPassword;
            localStorage.setItem('cyberguard_users_db', JSON.stringify(accounts));
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    setPasswordSuccess('Security Password updated successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setTimeout(() => setPasswordSuccess(''), 3500);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in ${
      isLight ? 'bg-slate-900/30' : 'bg-black/80'
    }`}>
      <div className={`w-full max-w-md border rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden transition-all ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/40'
          : 'bg-slate-950 border-sky-500/30 text-slate-100 shadow-sky-500/10'
      }`}>
        
        {/* Top Accent Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-500 via-purple-500 to-blue-500" />

        {/* Header */}
        <div className={`flex items-center justify-between border-b pb-4 ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-sky-500" />
            <h2 className={`text-lg font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Agent Profile
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4 font-sans">
          
          {/* Avatar Preview */}
          <div className={`flex items-center gap-4 p-3 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-500 to-purple-500 p-[2px] flex items-center justify-center flex-shrink-0">
              {photoURL ? (
                <img src={photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className={`w-full h-full rounded-full flex items-center justify-center ${
                  isLight ? 'bg-white' : 'bg-slate-950'
                }`}>
                  <User className="w-7 h-7 text-sky-500" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <label className={`text-xs font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Avatar Image URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                className={`w-full px-3 py-1.5 rounded-lg border text-xs font-mono focus:outline-none focus:border-sky-500 ${
                  isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}
              />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-1">
            <label className={`text-xs font-mono flex items-center gap-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              <User className="w-3.5 h-3.5 text-sky-500" /> Username
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-sm font-sans focus:outline-none focus:border-sky-500 ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
              }`}
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className={`text-xs font-mono flex items-center gap-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              <Mail className="w-3.5 h-3.5 text-sky-500" /> Email
            </label>
            <input
              type="email"
              disabled
              value={user?.email || 'agent@cyberguard.ai'}
              className={`w-full px-3 py-2 rounded-xl border text-sm cursor-not-allowed font-sans ${
                isLight ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-slate-900/50 border-slate-800 text-slate-400'
              }`}
            />
          </div>

          {savedSuccess && (
            <p className="text-xs text-emerald-600 font-mono flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {savedSuccess}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-2 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono font-bold text-xs transition-all shadow-md cursor-pointer"
          >
            Update Profile
          </button>
        </form>

        {/* Change Password Section */}
        <form onSubmit={handleChangePassword} className={`border-t pt-4 space-y-3 font-sans ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <h3 className={`text-xs font-mono font-bold flex items-center gap-1 ${
            isLight ? 'text-slate-700' : 'text-slate-300'
          }`}>
            <Lock className="w-3.5 h-3.5 text-purple-500" /> Change Security Password
          </h3>

          <input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-purple-500 ${
              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
            }`}
          />

          <input
            type="password"
            placeholder="New Password (min 6 chars)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-purple-500 ${
              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
            }`}
          />

          {passwordError && (
            <p className="text-xs text-rose-500 font-mono bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
              {passwordError}
            </p>
          )}

          {passwordSuccess && (
            <p className="text-xs text-emerald-600 font-mono flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {passwordSuccess}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs transition-all shadow-md cursor-pointer"
          >
            Update Password
          </button>
        </form>

        {/* Logout Footer */}
        <div className={`border-t pt-3 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
              isLight
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
            }`}
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>
    </div>
  );
};
