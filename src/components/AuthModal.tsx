import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, KeyRound, Shield, ArrowRight, Check, AlertCircle, Eye, EyeOff, ShieldCheck, RefreshCw } from 'lucide-react';
import { CyberGuardLogo } from './CyberGuardLogo';
import { UserProfile } from '../types';

interface StoredAccount {
  uid: string;
  email: string;
  displayName: string;
  passwordHash: string; // Stored password
  securityPin: string;  // 6-digit 2FA security PIN
  createdAt: number;
}

interface AuthModalProps {
  onLoginSuccess: (user: UserProfile) => void;
}

// Default pre-seeded demo agent account
const DEFAULT_DEMO_ACCOUNT: StoredAccount = {
  uid: 'agent_001',
  email: 'agent@cyberguard.ai',
  displayName: 'CyberAgent',
  passwordHash: 'CyberGuard@2026!',
  securityPin: '123456',
  createdAt: Date.now() - 100000000,
};

export const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'mfa_verify' | 'forgot'>('login');
  
  // Input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [securityPin, setSecurityPin] = useState('');
  const [inputPin, setInputPin] = useState('');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [pendingUser, setPendingUser] = useState<StoredAccount | null>(null);

  // Load existing accounts from localStorage or initialize with default demo
  const getAccounts = (): StoredAccount[] => {
    try {
      const saved = localStorage.getItem('cyberguard_users_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure default demo account is included if missing
          if (!parsed.some((a: StoredAccount) => a.email.toLowerCase() === DEFAULT_DEMO_ACCOUNT.email.toLowerCase())) {
            parsed.unshift(DEFAULT_DEMO_ACCOUNT);
          }
          return parsed;
        }
      }
    } catch (e) { /* fallback */ }
    return [DEFAULT_DEMO_ACCOUNT];
  };

  const saveAccount = (account: StoredAccount) => {
    const accounts = getAccounts();
    const updated = [account, ...accounts.filter(a => a.email.toLowerCase() !== account.email.toLowerCase())];
    localStorage.setItem('cyberguard_users_db', JSON.stringify(updated));
  };

  // Password Strength Calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-700' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { score, label: 'Weak (Requires 8+ chars, upper, lower, number & symbol)', color: 'bg-rose-500' };
    if (score <= 4) return { score, label: 'Moderate (Add special characters for higher security)', color: 'bg-amber-500' };
    return { score, label: 'Strong Security Passed', color: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  // Email format regex
  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // --- FORGOT PASSWORD MODE ---
    if (mode === 'forgot') {
      if (!email.trim() || !isValidEmail(email)) {
        setError('Please enter a valid email address.');
        return;
      }
      const accounts = getAccounts();
      const existing = accounts.find(a => a.email.toLowerCase() === email.trim().toLowerCase());
      if (!existing) {
        setError('Security Error: No account registered with this email address.');
        return;
      }
      setSuccessMsg(`Security reset instruction & PIN dispatched to ${email}`);
      setTimeout(() => {
        setSuccessMsg('');
        setMode('login');
      }, 3500);
      return;
    }

    // --- REGISTRATION MODE ---
    if (mode === 'register') {
      if (!displayName.trim()) {
        setError('Agent Username is required.');
        return;
      }
      if (!email.trim() || !isValidEmail(email)) {
        setError('Please enter a valid email address (e.g. agent@cyberguard.ai).');
        return;
      }
      
      const accounts = getAccounts();
      const duplicate = accounts.find(a => a.email.toLowerCase() === email.trim().toLowerCase());
      if (duplicate) {
        setError('Account registration failed: An account with this email address already exists. Please Sign In.');
        return;
      }

      if (password.length < 8) {
        setError('Security Requirement: Password must be at least 8 characters long.');
        return;
      }
      if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
        setError('Security Requirement: Password must contain uppercase, lowercase, numbers, and special characters (!@#$%^&*).');
        return;
      }
      if (password !== confirmPassword) {
        setError('Password mismatch: Password and Confirm Password do not match.');
        return;
      }
      if (securityPin.length !== 6 || !/^\d{6}$/.test(securityPin)) {
        setError('2FA Requirement: Security PIN must be exactly 6 digits.');
        return;
      }

      // Save new account
      const newAccount: StoredAccount = {
        uid: 'user_' + Math.random().toString(36).substring(2, 10),
        email: email.trim().toLowerCase(),
        displayName: displayName.trim(),
        passwordHash: password,
        securityPin,
        createdAt: Date.now(),
      };

      saveAccount(newAccount);

      setSuccessMsg('Agent Account registered successfully! Proceeding to 2FA PIN verification...');
      setPendingUser(newAccount);
      setTimeout(() => {
        setSuccessMsg('');
        setMode('mfa_verify');
      }, 1500);
      return;
    }

    // --- SIGN IN MODE ---
    if (mode === 'login') {
      if (!email.trim() || !isValidEmail(email)) {
        setError('Authentication Error: Please enter a valid email address.');
        return;
      }
      if (!password) {
        setError('Authentication Error: Please enter your security password.');
        return;
      }

      const accounts = getAccounts();
      const account = accounts.find(a => a.email.toLowerCase() === email.trim().toLowerCase());

      // STRICT VERIFICATION STEP 1: Verify Email exists
      if (!account) {
        setError('Authentication Failed: Email address not recognized in agent database. Check for typos or Register.');
        return;
      }

      // STRICT VERIFICATION STEP 2: Verify Password matches exactly
      if (account.passwordHash !== password) {
        setError('Authentication Failed: Invalid security password provided. Access denied.');
        return;
      }

      // SUCCESSFUL CREDENTIAL MATCH -> Proceed to 2FA PIN Verification
      setPendingUser(account);
      setError('');
      setMode('mfa_verify');
      return;
    }

    // --- MFA PIN VERIFICATION MODE ---
    if (mode === 'mfa_verify') {
      if (!pendingUser) {
        setError('Session expired. Please sign in again.');
        setMode('login');
        return;
      }

      // STRICT VERIFICATION STEP 3: Verify 6-Digit 2FA Security PIN
      if (inputPin.trim() !== pendingUser.securityPin) {
        setError('2FA Access Denied: Incorrect 6-digit Security PIN. Verification failed.');
        return;
      }

      // ALL DETAILS STRICTLY VERIFIED! Grant full login access.
      setSuccessMsg('All authentication credentials strictly verified! Access Granted.');
      setTimeout(() => {
        onLoginSuccess({
          uid: pendingUser.uid,
          email: pendingUser.email,
          displayName: pendingUser.displayName,
        });
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030712] text-slate-100 font-sans">
      <div className="w-full max-w-md bg-slate-950/95 border border-sky-500/40 rounded-3xl p-7 shadow-2xl shadow-sky-500/25 backdrop-blur-2xl relative overflow-hidden space-y-5 transition-all">
        
        {/* Top Glow Header Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-sky-400 via-blue-500 to-purple-500" />

        {/* Logo and Security Header */}
        <div className="text-center space-y-1.5">
          <div className="flex justify-center">
            <CyberGuardLogo size="lg" showText={false} />
          </div>
          <h1 className="text-2xl font-bold font-mono tracking-tight bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <span>CyberGuard AI</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400 inline" />
          </h1>
          <p className="text-xs text-slate-400 font-sans">
            Strict Multi-Factor Encrypted Access Core
          </p>
        </div>

        {/* Demo Quick Credentials Badge */}
        {mode === 'login' && (
          <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-2.5 text-[11px] font-mono text-sky-300 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="font-bold text-sky-400">Demo Agent Access:</p>
              <p className="opacity-90">Email: <span className="text-white">agent@cyberguard.ai</span></p>
              <p className="opacity-90">Pass: <span className="text-white">CyberGuard@2026!</span> | PIN: <span className="text-white">123456</span></p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEmail('agent@cyberguard.ai');
                setPassword('CyberGuard@2026!');
                setError('');
              }}
              className="px-2 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/40 text-[10px] cursor-pointer"
            >
              Autofill
            </button>
          </div>
        )}

        {/* Auth Mode Tabs (Sign In / Register) */}
        {mode !== 'mfa_verify' && (
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 font-mono text-xs">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                mode === 'login' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                mode === 'register' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register Agent
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5 font-sans">
          
          {/* --- MFA PIN VERIFICATION VIEW --- */}
          {mode === 'mfa_verify' && pendingUser && (
            <div className="space-y-4 bg-slate-900/80 p-4 rounded-2xl border border-sky-500/30">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mx-auto text-purple-400">
                  <KeyRound className="w-5 h-5 animate-pulse" />
                </div>
                <h3 className="text-sm font-bold font-mono text-purple-300">
                  Two-Factor PIN Verification Required
                </h3>
                <p className="text-xs text-slate-400">
                  Identity matched for <span className="text-sky-300 font-mono font-bold">{pendingUser.email}</span>. Enter 6-digit PIN to finalize sign in.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300 flex items-center justify-between">
                  <span>6-Digit Security PIN</span>
                  <span className="text-[10px] text-slate-500 font-normal">Default Demo PIN: 123456</span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="• • • • • •"
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-purple-500/40 text-center font-mono text-lg tracking-widest text-purple-200 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setInputPin(''); setError(''); }}
                  className="w-1/3 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-mono font-bold text-xs shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify PIN</span>
                </button>
              </div>
            </div>
          )}

          {/* --- USERNAME (REGISTER MODE ONLY) --- */}
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-sky-400" /> Agent Username / Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CyberAgent Alex"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          )}

          {/* --- EMAIL ADDRESS --- */}
          {mode !== 'mfa_verify' && (
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-sky-400" /> Verified Email Address
              </label>
              <input
                type="email"
                required
                placeholder="agent@cyberguard.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          )}

          {/* --- PASSWORD --- */}
          {mode !== 'forgot' && mode !== 'mfa_verify' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-slate-300 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-purple-400" /> Security Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); }}
                    className="text-[11px] text-sky-400 hover:underline font-mono cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 pr-10 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter in Register Mode */}
              {mode === 'register' && password && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400">Password Complexity:</span>
                    <span className={passwordStrength.score >= 4 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- CONFIRM PASSWORD & 2FA PIN SETUP (REGISTER MODE ONLY) --- */}
          {mode === 'register' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-purple-400" /> Confirm Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Set 6-Digit 2FA Security PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={securityPin}
                  onChange={(e) => setSecurityPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-mono text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
            </>
          )}

          {/* --- ERROR MESSAGE --- */}
          {error && (
            <div className="text-xs text-rose-300 font-mono bg-rose-500/15 p-3 rounded-xl border border-rose-500/30 flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* --- SUCCESS MESSAGE --- */}
          {successMsg && (
            <div className="text-xs text-emerald-300 font-mono bg-emerald-500/15 p-3 rounded-xl border border-emerald-500/30 flex items-start gap-2 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* --- SUBMIT BUTTON --- */}
          {mode !== 'mfa_verify' && (
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-sm transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>
                {mode === 'login' ? 'Validate Credentials & Continue' : mode === 'register' ? 'Register Account with 2FA' : 'Dispatch Password Reset'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </form>

        <div className="text-center pt-2 border-t border-slate-800">
          <p className="text-[11px] text-slate-500 font-mono flex items-center justify-center gap-1">
            <Shield className="w-3 h-3 text-sky-500" />
            <span>Encrypted Session • Neural AI Cybersecurity Core</span>
          </p>
        </div>

      </div>
    </div>
  );
};

