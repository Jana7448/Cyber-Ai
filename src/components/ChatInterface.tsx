import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Square,
  Mic,
  MicOff,
  Paperclip,
  Copy,
  Check,
  RefreshCw,
  Shield,
  User,
  Bot,
  Zap,
  Sparkles,
  Volume2,
  VolumeX,
  Brain,
  Image as ImageIcon,
  X,
  History,
  Terminal,
  Search,
  FileText,
  Code2,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { ChatMessage, AppSettings, ModelSelection, RoleSelection } from '../types';
import { CyberGuardLogo } from './CyberGuardLogo';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isGenerating: boolean;
  setIsGenerating: (val: boolean) => void;
  settings: AppSettings;
  setSettings?: React.Dispatch<React.SetStateAction<AppSettings>>;
  onSendMessage: (text: string, images?: Array<{ data: string; mimeType: string; name?: string }>) => void;
  onStopGeneration: () => void;
  onRegenerateResponse: () => void;
  onOpenHistory?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  setMessages,
  isGenerating,
  setIsGenerating,
  settings,
  setSettings,
  onSendMessage,
  onStopGeneration,
  onRegenerateResponse,
  onOpenHistory,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [attachedImages, setAttachedImages] = useState<Array<{ data: string; mimeType: string; name: string }>>([]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const isLight = settings.theme === 'light';

  // Font size map
  const fontSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  };

  // Auto scroll to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  // Adjust textarea height dynamically
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if ((!trimmed && attachedImages.length === 0) || isGenerating) return;

    onSendMessage(trimmed, attachedImages);
    setInputText('');
    setAttachedImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Speech Synthesis
  const speakText = (text: string, msgId: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/```[\s\S]*?```/g, ' Code snippet omitted for speech. ').replace(/[*#_~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Web Speech Recognition for Voice Input
  const [micError, setMicError] = useState<string | null>(null);

  const toggleMic = () => {
    setMicError(null);
    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) { /* ignore */ }
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError("Speech recognition is not natively supported in this browser. You can type or click the voice prompt shortcut below.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        if (currentText) {
          setInputText((prev) => {
            // Avoid duplicate appends if already starts with text
            if (!prev) return currentText;
            if (prev.endsWith(currentText)) return prev;
            return prev + ' ' + currentText;
          });
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 192)}px`;
          }
        }
      };

      recognition.onerror = (err: any) => {
        console.warn("Speech Recognition Error:", err);
        setIsRecording(false);
        if (err.error === 'not-allowed' || err.error === 'service-not-allowed') {
          setMicError("Microphone access blocked by browser or iframe permissions. Click 'Try Voice Sample' to simulate voice query.");
        } else if (err.error !== 'no-speech') {
          setMicError(`Voice error (${err.error || 'unknown'}). Please check microphone settings.`);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsRecording(false);
      setMicError("Unable to initialize microphone. Please check system permissions.");
    }
  };

  const insertVoiceSample = (sampleText: string) => {
    setInputText(sampleText);
    setMicError(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 192)}px`;
    }
  };

  // Image File Attachment
  const handleImageAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          if (uploadEvent.target?.result) {
            const dataUrl = uploadEvent.target.result as string;
            setAttachedImages((prev) => [
              ...prev,
              {
                data: dataUrl,
                mimeType: file.type || 'image/png',
                name: file.name,
              },
            ]);
          }
        };
        reader.readAsDataURL(file);
      });
      e.target.value = '';
    }
  };

  const removeAttachedImage = (index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-61px)] overflow-hidden relative z-10">
      
      {/* Top Model Engine & Control Bar */}
      <div className={`px-4 py-2 border-b flex flex-wrap items-center justify-end gap-2 text-xs font-mono transition-colors z-20 ${
        isLight ? 'bg-white/90 border-slate-200 text-slate-800 shadow-sm' : 'bg-slate-950/80 border-slate-800/80 text-slate-200 backdrop-blur-md'
      }`}>
        
        {/* Right: High Thinking Toggle & Gemini Model Tier Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* High Thinking Mode Toggle Button */}
          <button
            onClick={() => setSettings && setSettings((s) => ({ ...s, enableThinking: !s.enableThinking }))}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              settings.enableThinking
                ? isLight
                  ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-sm animate-pulse'
                  : 'bg-amber-500/20 border-amber-400/80 text-amber-300 shadow-md shadow-amber-500/10 animate-pulse'
                : isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-600 hover:text-amber-700'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-400'
            }`}
            title="Enable High Reasoning Thinking Mode with gemini-3.1-pro-preview"
          >
            <Brain className={`w-3.5 h-3.5 ${settings.enableThinking ? 'text-amber-400 animate-spin-slow' : 'text-slate-400'}`} />
            <span>High Thinking {settings.enableThinking ? 'ON' : 'OFF'}</span>
          </button>

          {/* Model Selector Pills */}
          <div className="flex items-center gap-1 border-l pl-2 border-slate-700/40">
            {[
              { id: 'gemini-3.1-flash-lite', label: '⚡ Fast', tip: 'gemini-3.1-flash-lite' },
              { id: 'gemini-3.6-flash', label: '🌐 General', tip: 'gemini-3.6-flash' },
              { id: 'gemini-3.1-pro-preview', label: '🧠 Pro Reasoning', tip: 'gemini-3.1-pro-preview' },
            ].map((m) => (
              <button
                key={m.id}
                title={m.tip}
                onClick={() => setSettings && setSettings((s) => ({ ...s, model: m.id as ModelSelection }))}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer whitespace-nowrap border ${
                  settings.model === m.id
                    ? isLight
                      ? 'bg-sky-100 border-sky-300 text-sky-800 font-bold shadow-xs'
                      : 'bg-sky-500/20 border-sky-400/60 text-sky-300 font-bold'
                    : isLight
                      ? 'bg-slate-100/80 border-slate-200 text-slate-600 hover:text-slate-900'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Scrollable Conversation Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 scrollbar-thin">
        
        {/* Animated Welcome Message when chat is fresh */}
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto my-auto pt-6 md:pt-12 text-center space-y-6"
            >
              <div className={`inline-flex items-center justify-center p-3 rounded-3xl border shadow-xl ${
                isLight
                  ? 'bg-sky-50 border-sky-200/80 shadow-sky-500/5'
                  : 'bg-sky-500/10 border-sky-500/20 shadow-sky-500/10'
              }`}>
                <CyberGuardLogo size="lg" showText={false} />
              </div>

              <div className="space-y-2">
                <h2 className={`text-3xl md:text-4xl font-bold font-mono tracking-tight ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  Hello! I'm <span className="bg-gradient-to-r from-sky-500 via-blue-600 to-purple-600 bg-clip-text text-transparent">CyberGuard AI</span>.
                </h2>
                <p className={`text-sm md:text-base font-sans font-medium ${
                  isLight ? 'text-slate-600' : 'text-slate-300'
                }`}>
                  Select a security topic below for instant AI analysis & information:
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message Bubbles List */}
        <div className="max-w-4xl mx-auto space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const isUser = m.sender === 'user';

              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3 md:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* AI Avatar */}
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-purple-600 p-[1px] flex items-center justify-center flex-shrink-0 shadow-md shadow-sky-500/20">
                      <div className={`w-full h-full rounded-[inherit] flex items-center justify-center ${
                        isLight ? 'bg-white' : 'bg-slate-950'
                      }`}>
                        <Shield className="w-4 h-4 text-sky-500" />
                      </div>
                    </div>
                  )}

                  {/* Bubble Body */}
                  <div className={`flex flex-col max-w-[88%] sm:max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                    
                    {/* Top Sender Tag & Timestamp */}
                    <div className={`flex items-center gap-2 px-1 mb-1 font-mono text-[11px] ${
                      isLight ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      <span className={isUser ? (isLight ? 'text-sky-700 font-semibold' : 'text-sky-300 font-semibold') : (isLight ? 'text-purple-700 font-semibold' : 'text-purple-300 font-semibold')}>
                        {isUser ? 'You' : 'CyberGuard AI'}
                      </span>
                      <span>•</span>
                      <span>{m.timestamp}</span>
                    </div>

                    {/* Chat Bubble Container */}
                    <div
                      className={`rounded-2xl p-4 md:p-5 shadow-lg relative group transition-colors duration-300 ${
                        isUser
                          ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white border border-sky-400/30 rounded-tr-sm'
                          : isLight
                            ? 'bg-white text-slate-800 border border-slate-200/90 shadow-md shadow-slate-200/50 rounded-tl-sm'
                            : 'glass-panel text-slate-100 border border-sky-500/20 rounded-tl-sm'
                      }`}
                    >
                      {/* Attached Images in User Message */}
                      {isUser && m.images && m.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {m.images.map((img, idx) => (
                            <div key={idx} className="relative rounded-xl overflow-hidden border border-white/30 max-w-[220px] max-h-[160px] shadow-md">
                              <img src={img.data} alt={img.name || `attachment_${idx}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Thinking Mode Active Badge for Assistant Responses */}
                      {!isUser && m.thinkingActive && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[11px] font-bold mb-3">
                          <Brain className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          <span>Gemini 3.1 Pro High Thinking Applied</span>
                        </div>
                      )}

                      {/* Message Content */}
                      <div className={`markdown-body ${fontSizeClasses[settings.fontSize]} leading-relaxed`}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              const codeString = String(children).replace(/\n$/, '');
                              if (!inline) {
                                return (
                                  <div className="my-3 rounded-xl border border-sky-500/30 bg-[#020617] overflow-hidden shadow-xl text-left">
                                    <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                                      <span className="text-sky-400 font-bold uppercase tracking-wider">
                                        {match ? match[1] : 'CODE'}
                                      </span>
                                      <button
                                        onClick={() => handleCopyText(codeString, m.id + '-code')}
                                        className="flex items-center gap-1.5 text-slate-400 hover:text-sky-300 transition-colors font-mono cursor-pointer"
                                      >
                                        {copiedId === m.id + '-code' ? (
                                          <>
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                            <span className="text-emerald-400">Copied</span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Copy Code</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                    <pre className="p-4 text-xs font-mono text-sky-200 overflow-x-auto leading-relaxed">
                                      <code>{codeString}</code>
                                    </pre>
                                  </div>
                                );
                              }
                              return (
                                <code className={`${
                                  isLight
                                    ? 'bg-slate-100 text-sky-800 border border-slate-200'
                                    : 'bg-slate-900 text-sky-300 border border-slate-800'
                                } px-1.5 py-0.5 rounded text-[11px] font-mono`} {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {m.text}
                        </ReactMarkdown>
                      </div>

                      {/* AI Response Tools Bar */}
                      {!isUser && (
                        <div className={`flex items-center gap-2 mt-4 pt-3 border-t text-xs font-mono ${
                          isLight ? 'border-slate-100' : 'border-slate-800/80'
                        }`}>
                          
                          {/* Copy Button */}
                          <button
                            onClick={() => handleCopyText(m.text, m.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                              isLight
                                ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-sky-600 border-slate-200'
                                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-sky-300 border-slate-800'
                            }`}
                            title="Copy Response"
                          >
                            {copiedId === m.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-500 font-bold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          {/* Read Aloud Voice Button */}
                          <button
                            onClick={() => speakText(m.text, m.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                              speakingMessageId === m.id
                                ? 'bg-sky-500/20 text-sky-400 border-sky-400 animate-pulse'
                                : isLight
                                  ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-sky-600 border-slate-200'
                                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-sky-300 border-slate-800'
                            }`}
                            title={speakingMessageId === m.id ? 'Stop Voice Playback' : 'Read Aloud Voice'}
                          >
                            {speakingMessageId === m.id ? (
                              <>
                                <VolumeX className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                                <span className="text-sky-400 font-bold">Stop Voice</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5" />
                                <span>Speak</span>
                              </>
                            )}
                          </button>

                          {/* Regenerate Button */}
                          <button
                            onClick={onRegenerateResponse}
                            disabled={isGenerating}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer disabled:opacity-50 ${
                              isLight
                                ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-purple-600 border-slate-200'
                                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-purple-300 border-slate-800'
                            }`}
                            title="Regenerate Response"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                            <span>Regenerate</span>
                          </button>

                        </div>
                      )}

                    </div>

                  </div>

                  {/* User Avatar */}
                  {isUser && (
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-bold font-mono text-xs shadow-md ${
                      isLight
                        ? 'bg-slate-100 border border-slate-300 text-sky-700'
                        : 'bg-slate-800 border border-slate-700 text-sky-400'
                    }`}>
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 items-start max-w-md"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-purple-600 p-[1px] flex items-center justify-center flex-shrink-0 shadow-md">
                <div className={`w-full h-full rounded-[inherit] flex items-center justify-center ${
                  isLight ? 'bg-white' : 'bg-slate-950'
                }`}>
                  <Shield className="w-4 h-4 text-sky-500 animate-pulse" />
                </div>
              </div>
              <div className={`rounded-2xl p-4 text-xs font-mono border flex items-center gap-3 ${
                isLight
                  ? 'bg-white text-sky-700 border-slate-200 shadow-md'
                  : 'glass-panel text-sky-300 border-sky-500/30'
              }`}>
                <RefreshCw className="w-4 h-4 text-sky-500 animate-spin" />
                <div className="flex items-center gap-1">
                  <span>CyberGuard AI is typing</span>
                  <span className="inline-flex gap-1 ml-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>

      </div>

      {/* Bottom Input Area */}
      <div className={`p-3 md:p-5 border-t transition-colors duration-300 ${
        isLight
          ? 'bg-white/80 border-slate-200/90 backdrop-blur-2xl'
          : 'bg-slate-950/90 border-sky-500/20 backdrop-blur-2xl'
      }`}>
        <div className="max-w-4xl mx-auto relative space-y-2">

          {/* Quick Topic Shortcut Bar (Always accessible small buttons) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none font-mono text-[11px]">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-900 text-slate-400'
            }`}>
              Quick Topics:
            </span>
            <button
              onClick={() => {
                if (setSettings) setSettings((s) => ({ ...s, role: 'ethical_hacker' }));
                onSendMessage('Explain Ethical Hacking methodologies, penetration testing phases, reconnaissance tools, and vulnerability exploitation concepts in detail.');
              }}
              className={`px-2.5 py-1 rounded-full border font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 hover:scale-105 active:scale-95 ${
                isLight ? 'bg-sky-50 border-sky-300 text-sky-800' : 'bg-sky-500/10 border-sky-500/30 text-sky-300'
              }`}
            >
              <span>⚔️ Ethical Hacking</span>
            </button>
            <button
              onClick={() => {
                if (setSettings) setSettings((s) => ({ ...s, role: 'malware_analyst' }));
                onSendMessage('Explain Malware Analysis methodologies (static vs dynamic analysis) and key log artifacts to analyze during a security breach.');
              }}
              className={`px-2.5 py-1 rounded-full border font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 hover:scale-105 active:scale-95 ${
                isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}
            >
              <span>🔍 Malware & Log Analysis</span>
            </button>
            <button
              onClick={() => {
                if (setSettings) setSettings((s) => ({ ...s, role: 'cyber_expert' }));
                onSendMessage('Explain the NIST Incident Response Lifecycle (Preparation, Detection, Containment & Eradication, Post-Incident) with real-world guidance.');
              }}
              className={`px-2.5 py-1 rounded-full border font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 hover:scale-105 active:scale-95 ${
                isLight ? 'bg-purple-50 border-purple-300 text-purple-800' : 'bg-purple-500/10 border-purple-500/30 text-purple-300'
              }`}
            >
              <span>🛡️ Incident Response</span>
            </button>
            <button
              onClick={() => {
                if (setSettings) setSettings((s) => ({ ...s, role: 'code_auditor' }));
                onSendMessage('Explain the OWASP Top 10 web security vulnerabilities with code examples (SQL Injection, XSS, CSRF, IDOR) and secure remediation techniques.');
              }}
              className={`px-2.5 py-1 rounded-full border font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 hover:scale-105 active:scale-95 ${
                isLight ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <span>💻 OWASP Code Audit</span>
            </button>
          </div>

          {/* Voice Recording Live Banner */}
          {isRecording && (
            <div className="bg-rose-500/15 border border-rose-500/30 rounded-2xl p-2.5 px-3.5 flex items-center justify-between text-xs font-mono text-rose-300 animate-fade-in shadow-lg shadow-rose-500/10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <Mic className="w-4 h-4 text-rose-400" />
                <span className="font-bold text-rose-200">Listening to your Voice...</span>
                <span className="text-[11px] text-rose-300/80 hidden sm:inline">(Speak clearly into microphone)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInputText('')}
                  className="px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-[10px] cursor-pointer"
                >
                  Clear Text
                </button>
                <button
                  onClick={toggleMic}
                  className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-[11px] cursor-pointer flex items-center gap-1 shadow"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop Dictation</span>
                </button>
              </div>
            </div>
          )}

          {/* Voice Error & Fallback Quick Action Banner */}
          {micError && (
            <div className="bg-amber-500/15 border border-amber-500/30 rounded-2xl p-2.5 px-3 flex items-center justify-between text-xs font-mono text-amber-300 animate-fade-in">
              <div className="flex items-center gap-2">
                <MicOff className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="text-[11px] text-amber-200">{micError}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => insertVoiceSample("Explain ethical hacking penetration testing methodology and Nmap reconnaissance steps")}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-[10px] font-bold cursor-pointer"
                >
                  Try Voice Sample
                </button>
                <button
                  type="button"
                  onClick={() => setMicError(null)}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
          
          <div className={`rounded-3xl border p-2 md:p-3 shadow-2xl transition-all flex flex-col gap-2 ${
            isLight
              ? 'bg-white border-slate-200/90 shadow-slate-200/50 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20'
              : 'glass-panel border-sky-500/30 focus-within:border-sky-400/60'
          }`}>
            
            {/* Attached Image Previews in Input Tray */}
            {attachedImages.length > 0 && (
              <div className="flex flex-wrap gap-2 px-3 pt-2">
                {attachedImages.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-sky-500/30 w-16 h-16 bg-slate-900 flex-shrink-0">
                    <img src={img.data} alt={img.name} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeAttachedImage(idx)}
                      className="absolute top-1 right-1 bg-rose-600/90 hover:bg-rose-600 text-white p-0.5 rounded-full cursor-pointer shadow-md transition-transform hover:scale-110"
                      title="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={attachedImages.length > 0 ? "Ask CyberGuard AI to analyze these attached images..." : "Ask anything about Cybersecurity..."}
              className={`w-full bg-transparent px-3 py-1.5 font-sans text-sm focus:outline-none resize-none max-h-48 scrollbar-thin ${
                isLight ? 'text-slate-900 placeholder-slate-400' : 'text-slate-100 placeholder-slate-500'
              }`}
            />

            {/* Bottom Actions Bar */}
            <div className={`flex items-center justify-between pt-1 border-t font-mono ${
              isLight ? 'border-slate-100' : 'border-slate-800/60'
            }`}>
              
              {/* Left Action Buttons (Attachment, Image Upload, Mic) */}
              <div className="flex items-center gap-1">
                
                {/* Image Upload Button */}
                <label className={`p-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1 ${
                  isLight
                    ? 'text-slate-500 hover:text-sky-600 hover:bg-sky-50'
                    : 'text-slate-400 hover:text-sky-400 hover:bg-sky-500/10'
                }`} title="Upload screenshot, architecture diagram, or log image for Gemini analysis">
                  <ImageIcon className="w-4 h-4 text-sky-400" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageAttach}
                    className="hidden"
                  />
                </label>

                {/* Microphone Button */}
                <button
                  onClick={toggleMic}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    isRecording
                      ? 'bg-rose-500/20 text-rose-500 animate-pulse border border-rose-500/30'
                      : isLight
                        ? 'text-slate-500 hover:text-sky-600 hover:bg-sky-50'
                        : 'text-slate-400 hover:text-sky-400 hover:bg-sky-500/10'
                  }`}
                  title={isRecording ? 'Listening...' : 'Voice input'}
                >
                  <Mic className="w-4 h-4" />
                </button>

                {isRecording && (
                  <span className="text-[11px] text-rose-500 animate-pulse font-semibold ml-1">
                    Voice Active...
                  </span>
                )}
              </div>

              {/* Right Action Button (Send / Stop Generation) */}
              <div>
                {isGenerating ? (
                  <button
                    onClick={onStopGeneration}
                    className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-600 border border-rose-500/40 font-bold text-xs transition-all shadow-md cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Generation</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={!inputText.trim() && attachedImages.length === 0}
                    className={`flex items-center gap-1.5 py-2 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 font-bold text-xs transition-all shadow-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      isLight ? 'text-white shadow-sky-500/10' : 'text-slate-950 shadow-sky-500/20'
                    }`}
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>

          </div>

          <p className={`text-[10px] text-center mt-2 font-mono ${
            isLight ? 'text-slate-400' : 'text-slate-500'
          }`}>
            CyberGuard AI enforces strict cybersecurity scope guidelines • Shift + Enter for new line
          </p>

        </div>
      </div>

    </div>
  );
};
