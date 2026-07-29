import React from 'react';
import { X, Moon, Sun, Globe, Type, Trash2, Check, Shield, Sparkles, Bot, Brain } from 'lucide-react';
import { AppSettings, FontSizeOption, LanguageOption, ModelSelection, RoleSelection } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onClearConversation: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  setSettings,
  onClearConversation,
}) => {
  if (!isOpen) return null;

  const isLight = settings.theme === 'light';

  const languages: LanguageOption[] = ['English', 'Spanish', 'French', 'German', 'Cyber-Code'];
  const fontSizes: { label: string; value: FontSizeOption }[] = [
    { label: 'Small', value: 'small' },
    { label: 'Medium', value: 'medium' },
    { label: 'Large', value: 'large' },
  ];

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in ${
      isLight ? 'bg-slate-900/30' : 'bg-black/80'
    }`}>
      <div className={`w-full max-w-lg border rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden transition-all ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/40'
          : 'bg-slate-950 border-sky-500/30 text-slate-100 shadow-sky-500/10'
      }`}>
        
        {/* Subtle Top Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-500 via-purple-500 to-blue-500" />

        {/* Modal Header */}
        <div className={`flex items-center justify-between border-b pb-4 ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-sky-500" />
            <h2 className={`text-lg font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
              System Settings
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

        {/* Settings Body */}
        <div className="space-y-5 font-sans">
          
          {/* Theme Selector */}
          <div className={`flex items-center justify-between p-3.5 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center gap-3">
              {settings.theme === 'dark' ? (
                <Moon className="w-5 h-5 text-sky-400" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <p className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Appearance Mode
                </p>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Choose dark cyber theme or light view
                </p>
              </div>
            </div>
            <div className={`flex p-1 rounded-lg border ${
              isLight ? 'bg-slate-200/80 border-slate-300' : 'bg-slate-950 border-slate-800'
            }`}>
              <button
                onClick={() => setSettings((s) => ({ ...s, theme: 'dark' }))}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
                  settings.theme === 'dark'
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                    : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-white'
                }`}
              >
                Dark
              </button>
              <button
                onClick={() => setSettings((s) => ({ ...s, theme: 'light' }))}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
                  settings.theme === 'light'
                    ? 'bg-sky-500 text-white font-bold shadow-sm'
                    : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-white'
                }`}
              >
                Light
              </button>
            </div>
          </div>

          {/* Gemini AI Model Selection */}
          <div className={`space-y-2 p-3.5 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-sky-500" />
              <label className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                Gemini Model Engine
              </label>
            </div>
            <p className={`text-xs mb-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Select AI model tier based on query complexity and speed needs
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'gemini-3.1-flash-lite', label: '⚡ Fast', desc: 'gemini-3.1-flash-lite' },
                { id: 'gemini-3.6-flash', label: '🌐 General', desc: 'gemini-3.6-flash' },
                { id: 'gemini-3.1-pro-preview', label: '🧠 Complex Pro', desc: 'gemini-3.1-pro-preview' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSettings((s) => ({ ...s, model: m.id as ModelSelection }))}
                  className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                    settings.model === m.id
                      ? isLight
                        ? 'bg-sky-50 border-sky-400 text-sky-800 font-bold'
                        : 'bg-sky-500/20 border-sky-400 text-sky-200 font-bold'
                      : isLight
                        ? 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-mono">{m.label}</div>
                  <div className="text-[10px] opacity-70 font-mono truncate">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* High Thinking Mode Toggle */}
          <div className={`flex items-center justify-between p-3.5 rounded-xl border ${
            isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-amber-500/10 border-amber-500/30'
          }`}>
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-amber-500 animate-pulse" />
              <div>
                <p className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  High Thinking Mode (Deep Reasoning)
                </p>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Uses gemini-3.1-pro-preview with ThinkingLevel.HIGH for deep security audits
                </p>
              </div>
            </div>
            <button
              onClick={() => setSettings((s) => ({ ...s, enableThinking: !s.enableThinking }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                settings.enableThinking
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                  : isLight
                    ? 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {settings.enableThinking ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          {/* Chatbot System Role Selection */}
          <div className={`space-y-2 p-3.5 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Bot className="w-4 h-4 text-purple-500" />
              <label className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                Chatbot Persona / System Role
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'cyber_expert', label: '🛡️ Cyber Expert', roleDesc: 'Full Security Specialist' },
                { id: 'malware_analyst', label: '🔍 Malware Analyst', roleDesc: 'Log & Threat Triage' },
                { id: 'ethical_hacker', label: '⚔️ PenTester', roleDesc: 'Offensive Security' },
                { id: 'code_auditor', label: '💻 Code Auditor', roleDesc: 'SAST & Vulnerability Fix' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSettings((s) => ({ ...s, role: r.id as RoleSelection }))}
                  className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                    settings.role === r.id
                      ? isLight
                        ? 'bg-purple-50 border-purple-400 text-purple-800 font-bold'
                        : 'bg-purple-500/20 border-purple-400 text-purple-200 font-bold'
                      : isLight
                        ? 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-mono">{r.label}</div>
                  <div className="text-[10px] opacity-70 font-sans truncate">{r.roleDesc}</div>
                </button>
              ))}
            </div>
          </div>
          <div className={`space-y-2 p-3.5 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-purple-500" />
              <label className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                Language Preference
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSettings((s) => ({ ...s, language: lang }))}
                  className={`px-3 py-2 rounded-lg text-xs font-mono border transition-all flex items-center justify-between cursor-pointer ${
                    settings.language === lang
                      ? isLight
                        ? 'bg-purple-50 border-purple-300 text-purple-700 font-bold'
                        : 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold'
                      : isLight
                        ? 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span>{lang}</span>
                  {settings.language === lang && <Check className="w-3.5 h-3.5 text-purple-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size Option */}
          <div className={`space-y-2 p-3.5 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Type className="w-4 h-4 text-sky-500" />
              <label className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                Chat Font Size
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {fontSizes.map((fs) => (
                <button
                  key={fs.value}
                  onClick={() => setSettings((s) => ({ ...s, fontSize: fs.value }))}
                  className={`px-3 py-2 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                    settings.fontSize === fs.value
                      ? isLight
                        ? 'bg-sky-50 border-sky-300 text-sky-700 font-bold'
                        : 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold'
                      : isLight
                        ? 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {fs.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Current Conversation */}
          <div className="pt-2">
            <button
              onClick={() => {
                onClearConversation();
                onClose();
              }}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-mono font-bold transition-all shadow-sm cursor-pointer ${
                isLight
                  ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
                  : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-300'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Current Conversation</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
