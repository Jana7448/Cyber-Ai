export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
  images?: Array<{ data: string; mimeType: string; name?: string }>;
  thinkingActive?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  model?: ModelSelection;
  role?: RoleSelection;
}

export type ThemeMode = 'dark' | 'light';

export type FontSizeOption = 'small' | 'medium' | 'large';

export type LanguageOption = 'English' | 'Spanish' | 'French' | 'German' | 'Cyber-Code';

export type ModelSelection = 'gemini-3.1-flash-lite' | 'gemini-3.6-flash' | 'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-live-preview';

export type RoleSelection = 'cyber_expert' | 'malware_analyst' | 'ethical_hacker' | 'code_auditor';

export interface AppSettings {
  theme: ThemeMode;
  language: LanguageOption;
  fontSize: FontSizeOption;
  model: ModelSelection;
  role: RoleSelection;
  enableThinking: boolean;
}
