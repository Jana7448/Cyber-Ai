import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, ChatMessage, ChatSession, UserProfile } from './types';
import { Navbar } from './components/Navbar';
import { ChatInterface } from './components/ChatInterface';
import { SettingsModal } from './components/SettingsModal';
import { ProfileModal } from './components/ProfileModal';
import { AuthModal } from './components/AuthModal';
import { BackgroundParticles } from './components/BackgroundParticles';
import { ChatHistorySidebar } from './components/ChatHistorySidebar';

export function App() {
  // User Authentication State
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('cyberguard_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return {
      uid: 'agent_001',
      email: 'agent@cyberguard.ai',
      displayName: 'CyberAgent',
    };
  });

  // System Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('cyberguard_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          theme: parsed.theme || 'dark',
          language: parsed.language || 'English',
          fontSize: parsed.fontSize || 'medium',
          model: parsed.model || 'gemini-3.6-flash',
          role: parsed.role || 'cyber_expert',
          enableThinking: parsed.enableThinking ?? false,
        };
      } catch (e) { /* fallback */ }
    }
    return {
      theme: 'dark',
      language: 'English',
      fontSize: 'medium',
      model: 'gemini-3.6-flash',
      role: 'cyber_expert',
      enableThinking: false,
    };
  });

  // Chat Sessions & History State
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const savedSessions = localStorage.getItem('cyberguard_chat_sessions');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { /* fallback */ }
    }

    // Migration from old flat chat messages array if exists
    const savedOldMsgs = localStorage.getItem('cyberguard_chat_messages');
    let initialMsgs: ChatMessage[] = [];
    if (savedOldMsgs) {
      try { initialMsgs = JSON.parse(savedOldMsgs); } catch (e) { /* empty */ }
    }

    const defaultId = 'session_' + Date.now();
    const defaultTitle = initialMsgs.length > 0
      ? (initialMsgs[0].text.slice(0, 32) + '...')
      : 'New CyberGuard Chat';

    return [{
      id: defaultId,
      title: defaultTitle,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: initialMsgs,
      model: settings.model,
      role: settings.role,
    }];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const savedActive = localStorage.getItem('cyberguard_active_session_id');
    if (savedActive && sessions.some((s) => s.id === savedActive)) {
      return savedActive;
    }
    return sessions[0]?.id || 'session_' + Date.now();
  });

  // Modals & Drawers visibility
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync settings to localStorage and body dark/light class
  useEffect(() => {
    localStorage.setItem('cyberguard_settings', JSON.stringify(settings));
    if (settings.theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [settings]);

  // Sync user state to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('cyberguard_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cyberguard_user');
    }
  }, [user]);

  // Sync sessions to localStorage
  useEffect(() => {
    localStorage.setItem('cyberguard_chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Sync active session ID
  useEffect(() => {
    localStorage.setItem('cyberguard_active_session_id', activeSessionId);
  }, [activeSessionId]);

  // Active Session object
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = activeSession ? activeSession.messages : [];

  // Helper to set messages for the currently active session
  const setMessages = (action: React.SetStateAction<ChatMessage[]>) => {
    setSessions((prevSessions) => {
      return prevSessions.map((s) => {
        if (s.id === activeSessionId) {
          const newMsgs = typeof action === 'function' ? action(s.messages) : action;
          return {
            ...s,
            messages: newMsgs,
            updatedAt: Date.now(),
          };
        }
        return s;
      });
    });
  };

  // Start a New Chat Thread
  const handleNewChat = () => {
    if (isGenerating && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }

    const newId = 'session_' + Date.now();
    const newSession: ChatSession = {
      id: newId,
      title: 'New CyberGuard Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      model: settings.model,
      role: settings.role,
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
  };

  // Delete a specific session
  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const freshId = 'session_' + Date.now();
        const freshSession: ChatSession = {
          id: freshId,
          title: 'New CyberGuard Chat',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
          model: settings.model,
          role: settings.role,
        };
        setActiveSessionId(freshId);
        return [freshSession];
      }
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Rename a specific session
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s))
    );
  };

  // Clear all sessions history
  const handleClearAllSessions = () => {
    if (isGenerating && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
    const freshId = 'session_' + Date.now();
    const freshSession: ChatSession = {
      id: freshId,
      title: 'New CyberGuard Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      model: settings.model,
      role: settings.role,
    };
    setSessions([freshSession]);
    setActiveSessionId(freshId);
    localStorage.removeItem('cyberguard_chat_messages');
  };

  // Handle Send Message
  const handleSendMessage = async (text: string, images: Array<{ data: string; mimeType: string; name?: string }> = []) => {
    if (!text.trim() && images.length === 0) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text,
      timestamp: timeStr,
      images: images.length > 0 ? images : undefined,
    };

    // Prepare multi-turn history payload from current active session
    const currentMsgs = activeSession?.messages || [];
    const historyPayload = currentMsgs.slice(-12).map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    // Auto-title update if session is brand new
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          const isDefaultTitle = s.title === 'New CyberGuard Chat' || s.messages.length === 0;
          const updatedTitle = isDefaultTitle
            ? (text ? text.slice(0, 36) + (text.length > 36 ? '...' : '') : 'Multimodal Image Audit')
            : s.title;

          return {
            ...s,
            title: updatedTitle,
            messages: [...s.messages, userMessage],
            updatedAt: Date.now(),
          };
        }
        return s;
      })
    );

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          images: images.map((img) => ({ mimeType: img.mimeType, data: img.data })),
          history: historyPayload,
          model: settings.model,
          role: settings.role,
          enableThinking: settings.enableThinking,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const responseText = data.text || "I am CyberGuard AI and can only answer cybersecurity-related questions.";

      const aiMessage: ChatMessage = {
        id: 'msg_' + (Date.now() + 1),
        sender: 'assistant',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        thinkingActive: data.thinkingActive || settings.enableThinking,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("Generation aborted by user");
      } else {
        const errorMessage: ChatMessage = {
          id: 'msg_' + (Date.now() + 1),
          sender: 'assistant',
          text: "I am CyberGuard AI. An error occurred while communicating with the neural core. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  // Regenerate last response (removes trailing assistant message and re-fetches cleanly)
  const handleRegenerateResponse = async () => {
    if (messages.length === 0 || isGenerating) return;

    // Find last user message
    const lastUserIndex = [...messages].map(m => m.sender).lastIndexOf('user');
    if (lastUserIndex === -1) return;

    const lastUserMsg = messages[lastUserIndex];

    // Remove any assistant responses after lastUserIndex
    const truncatedMessages = messages.slice(0, lastUserIndex + 1);
    setMessages(truncatedMessages);

    // Prepare history payload prior to last user message
    const historyPayload = messages.slice(0, lastUserIndex).slice(-12).map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: lastUserMsg.text,
          history: historyPayload,
          model: settings.model,
          role: settings.role,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const responseText = data.text || "I am CyberGuard AI and can only answer cybersecurity-related questions.";

      const aiMessage: ChatMessage = {
        id: 'msg_' + (Date.now() + 1),
        sender: 'assistant',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("Generation aborted by user");
      } else {
        const errorMessage: ChatMessage = {
          id: 'msg_' + (Date.now() + 1),
          sender: 'assistant',
          text: "I am CyberGuard AI. An error occurred while communicating with the neural core. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Logout
  const handleLogout = () => {
    setUser(null);
  };

  // If user is not authenticated, render Auth Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center">
        <BackgroundParticles />
        <AuthModal onLoginSuccess={(u) => setUser(u)} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      settings.theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-[#030712] text-slate-100'
    } flex flex-col font-sans selection:bg-sky-500 selection:text-slate-950 relative overflow-hidden`}>
      
      {/* Background Glow Particles */}
      <BackgroundParticles />

      {/* Top Navigation Bar */}
      <Navbar
        settings={settings}
        setSettings={setSettings}
        user={user}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onNewChat={handleNewChat}
        onLogout={handleLogout}
      />

      {/* Main Full Screen Chat Interface */}
      <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto relative z-10">
        <ChatInterface
          messages={messages}
          setMessages={setMessages}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
          settings={settings}
          setSettings={setSettings}
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          onRegenerateResponse={handleRegenerateResponse}
          onOpenHistory={() => setIsHistoryOpen(true)}
        />
      </main>

      {/* Chat History Sidebar Drawer */}
      <ChatHistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => setActiveSessionId(id)}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onClearAllSessions={handleClearAllSessions}
        isLight={settings.theme === 'light'}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        setSettings={setSettings}
        onClearConversation={() => {
          setMessages([]);
        }}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onUpdateProfile={(updated) => setUser((prev) => (prev ? { ...prev, ...updated } : null))}
        onLogout={handleLogout}
      />

    </div>
  );
}

export default App;
