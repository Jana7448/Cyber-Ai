import React, { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Search, 
  Download, 
  History, 
  Clock, 
  ShieldAlert,
  ChevronLeft
} from 'lucide-react';
import { ChatSession } from '../types';

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onClearAllSessions: () => void;
  isLight: boolean;
}

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onClearAllSessions,
  isLight,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  if (!isOpen) return null;

  // Filter sessions by search query
  const filteredSessions = sessions.filter((session) => {
    const query = searchQuery.toLowerCase();
    if (session.title.toLowerCase().includes(query)) return true;
    return session.messages.some((m) => m.text.toLowerCase().includes(query));
  });

  // Categorize sessions by age
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  const todaySessions = filteredSessions.filter((s) => now - s.updatedAt < ONE_DAY);
  const yesterdaySessions = filteredSessions.filter(
    (s) => now - s.updatedAt >= ONE_DAY && now - s.updatedAt < 2 * ONE_DAY
  );
  const weekSessions = filteredSessions.filter(
    (s) => now - s.updatedAt >= 2 * ONE_DAY && now - s.updatedAt < 7 * ONE_DAY
  );
  const olderSessions = filteredSessions.filter((s) => now - s.updatedAt >= 7 * ONE_DAY);

  const startEditing = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveRename = (id: string, e: React.FormEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  // Export current session transcript
  const handleExportSession = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    let transcript = `# CyberGuard AI Chat Transcript - ${session.title}\nDate: ${new Date(session.createdAt).toLocaleString()}\n\n`;
    session.messages.forEach((m) => {
      transcript += `### [${m.timestamp}] ${m.sender === 'user' ? 'User' : 'CyberGuard AI'}\n${m.text}\n\n`;
    });

    const blob = new Blob([transcript], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cyberguard_chat_${session.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderGroup = (groupTitle: string, groupList: ChatSession[]) => {
    if (groupList.length === 0) return null;

    return (
      <div className="space-y-1.5 mb-4">
        <div className={`px-3 text-[10px] font-mono font-bold uppercase tracking-wider ${
          isLight ? 'text-slate-400' : 'text-slate-500'
        }`}>
          {groupTitle}
        </div>

        {groupList.map((session) => {
          const isActive = session.id === activeSessionId;
          const isEditing = session.id === editingId;

          return (
            <div
              key={session.id}
              onClick={() => {
                if (!isEditing) {
                  onSelectSession(session.id);
                  onClose();
                }
              }}
              className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-mono transition-all cursor-pointer border ${
                isActive
                  ? isLight
                    ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold shadow-sm'
                    : 'bg-sky-500/15 border-sky-500/40 text-sky-200 font-bold shadow-md shadow-sky-500/5'
                  : isLight
                    ? 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700 hover:text-slate-900'
                    : 'bg-slate-900/40 hover:bg-slate-800/80 border-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              {/* Left Icon & Title */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${
                  isActive ? 'text-sky-500' : isLight ? 'text-slate-400' : 'text-slate-500'
                }`} />

                {isEditing ? (
                  <form onSubmit={(e) => handleSaveRename(session.id, e)} className="flex items-center gap-1 flex-1 pr-1">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      autoFocus
                      className={`w-full px-2 py-0.5 rounded text-xs focus:outline-none border ${
                        isLight ? 'bg-white border-sky-400 text-slate-900' : 'bg-slate-950 border-sky-400 text-white'
                      }`}
                    />
                    <button
                      type="submit"
                      onClick={(e) => handleSaveRename(session.id, e)}
                      className="p-1 text-emerald-500 hover:text-emerald-400 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(null);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-sans font-medium">{session.title}</p>
                    <p className={`text-[10px] font-mono opacity-60 flex items-center gap-1 mt-0.5`}>
                      <span>{session.messages.length} msgs</span>
                      <span>•</span>
                      <span>{new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons on Hover or Active */}
              {!isEditing && (
                <div className="hidden group-hover:flex items-center gap-1 pl-1 flex-shrink-0">
                  <button
                    onClick={(e) => handleExportSession(session, e)}
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      isLight ? 'hover:bg-slate-200 text-slate-500 hover:text-sky-600' : 'hover:bg-slate-700 text-slate-400 hover:text-sky-400'
                    }`}
                    title="Export Markdown Transcript"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => startEditing(session.id, session.title, e)}
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      isLight ? 'hover:bg-slate-200 text-slate-500 hover:text-purple-600' : 'hover:bg-slate-700 text-slate-400 hover:text-purple-400'
                    }`}
                    title="Rename Chat"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete chat "${session.title}"?`)) {
                        onDeleteSession(session.id);
                      }
                    }}
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      isLight ? 'hover:bg-rose-100 text-slate-500 hover:text-rose-600' : 'hover:bg-rose-500/20 text-slate-400 hover:text-rose-400'
                    }`}
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 z-50 flex justify-end animate-fade-in ${
      isLight ? 'bg-slate-900/30 backdrop-blur-xs' : 'bg-black/60 backdrop-blur-sm'
    }`}>
      
      {/* Click outside backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Panel */}
      <div className={`w-full max-w-sm h-full flex flex-col border-l shadow-2xl transition-all duration-300 relative z-10 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
          : 'bg-slate-950 border-slate-800 text-slate-100 shadow-black/80'
      }`}>
        
        {/* Drawer Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isLight ? 'border-slate-200 bg-slate-50/80' : 'border-slate-800 bg-slate-900/50'
        }`}>
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-sky-500" />
            <h2 className="text-sm font-bold font-mono tracking-wide">Chat History & Logs</h2>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action: New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold font-mono text-xs transition-all cursor-pointer shadow-md ${
              isLight
                ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/10'
                : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 shadow-sky-500/20'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Start New Chat Thread</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3 pb-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search past conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-transparent focus:outline-none ${
                isLight ? 'text-slate-900 placeholder-slate-400' : 'text-slate-100 placeholder-slate-500'
              }`}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-0.5 text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-400/50" />
              <p className={`text-xs font-mono font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {searchQuery ? 'No matching chat sessions found.' : 'No saved chat history yet.'}
              </p>
              <p className="text-[11px] text-slate-400">
                Start a conversation with CyberGuard AI to log sessions.
              </p>
            </div>
          ) : (
            <>
              {renderGroup('Today', todaySessions)}
              {renderGroup('Yesterday', yesterdaySessions)}
              {renderGroup('Last 7 Days', weekSessions)}
              {renderGroup('Older History', olderSessions)}
            </>
          )}
        </div>

        {/* Drawer Footer: Clear All */}
        {sessions.length > 0 && (
          <div className={`p-3 border-t ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/50'}`}>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear ALL chat history? This cannot be undone.')) {
                  onClearAllSessions();
                }
              }}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                isLight
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Chat History</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
