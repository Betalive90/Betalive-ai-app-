export type Role = 'user' | 'model';
export type Language = 'en' | 'ar' | 'aii';
export type AuthMode = 'login' | 'register' | 'app';

export interface SecurityScanResult {
  isSafe: boolean;
  issues: string[];
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  images?: string[];
  generatedImages?: string[]; // For AI-generated images
  videoUrl?: string; // For uploaded or generated videos
  mode?: 'chat' | 'image' | 'creator' | 'video'; // To distinguish message type
  timestamp: number;
  isGenerating?: boolean;
  securityScanResult?: SecurityScanResult;
  rawResponse?: string;
  latency?: number; // Time in ms for model response
  isSensitive?: boolean; // For proactive security warnings
  isRevealed?: boolean; // For proactive security warnings
  originalText?: string; // To store original text for sensitive messages
}

export interface ChatSession {
  id:string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface EnabledModels {
  openai: boolean;
  meta: boolean;
  amazon: boolean;
  microsoft: boolean;
}

export interface ThirdPartyIntegrations {
    googleDrive: boolean;
    slack: boolean;
}

export interface AppSettings {
  language: Language;
  theme: 'light' | 'dark';
  enabledModels: EnabledModels;
  voiceCommands: boolean;
  textToSpeech: boolean;
  saveConversations: boolean;
  useCustomSystemPrompt: boolean;
  customSystemPrompt: string;
  enableCareerGuidance: boolean;
  appleIntelligence: boolean;
  developerMode: boolean;
  enableSecurityScan: boolean;
  enableQuickActions: boolean;
  // New advanced features
  showLatency: boolean;
  useAdvancedModelSettings: boolean;
  customTemperature: number; // 0.0 to 1.0
  customTopP: number; // 0.0 to 1.0
  thirdPartyIntegrations: ThirdPartyIntegrations;
  enablePrivacySandbox: boolean;
  warnSensitiveTopics: boolean;
  stripImageMetadata: boolean;
  enableEphemeralSessions: boolean;
  proactiveSecurityWarnings: boolean;
}

export interface ActivityLog {
    id: string;
    timestamp: number;
    action: string;
    details?: string;
}

export interface User {
  id: string;
  username: string;
  // In a real app, this would be a securely hashed password.
  // For this local-first app, we'll use a simple string for demonstration.
  password: string; 
  settings: AppSettings;
  session: ChatSession;
  activityLog: ActivityLog[];
}