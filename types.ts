export type Role = 'user' | 'model';
export type Language = 'en' | 'ar' | 'aii';
export type LocationAccess = 'denied' | 'approximate' | 'granted';
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  images?: string[];
  timestamp: number;
  isGenerating?: boolean;
  sources?: GroundingSource[];
  videoKeyMoments?: { timestamp: string; description: string; }[];
  isRedacted?: boolean;
  isSensitive?: boolean;
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

export interface ThirdPartyApiKeys {
    openai: string;
}

export interface AppSettings {
  language: Language;
  enabledModels: EnabledModels;
  voiceCommands: boolean;
  textToSpeech: boolean;
  ttsVoice: string | null;
  appleIntelligence: boolean;
  carMode: boolean;
  saveConversations: boolean;
  conversationRetentionPolicy: 'forever' | 'onClose';
  logActivity: boolean;
  improveAI: boolean;
  useCustomSystemPrompt: boolean;
  customSystemPrompt: string;
  photoMetadataPrivacy: boolean;
  allowMicrophone: boolean;
  allowCamera: boolean;
  enableCallIntegration: boolean;
  hideIpAddress: boolean;
  locationAccess: LocationAccess;
  piiSendWarning: boolean;
  enableCareerGuidance: boolean;
  developerMode: boolean;
  enableThirdPartyIntegrations: boolean;
  // New developer settings for third-party models
  thirdPartyApiKeys: ThirdPartyApiKeys;
  activeThirdPartyModel: 'gemini' | 'openai';
  integrationApiKey: string;
  // New advanced developer options
  apiCallLogging: boolean;
  forceEphemeral: boolean;
  privacySandbox: boolean;
  // New Privacy Sandbox settings
  privacySandboxRedactionLevel: 'standard' | 'aggressive';
  privacySandboxTopicWarning: boolean;
  // New Developer setting
  developerLatencySimulation: number; // in ms
}

// --- New Types for User Authentication ---

export interface User {
    email: string;
    // In a real app, this would be a secure hash, not a plain password.
    // For this simulation, we'll store it directly but name it appropriately.
    passwordHash: string; 
    settings: AppSettings;
    sessions: ChatSession[];
    twoFactorEnabled: boolean;
}

export interface ActiveSession {
    id: string;
    browser: string;
    os: string;
    ipAddress: string;
    lastActive: string;
    isCurrent: boolean;
}


// New types for Threat Scanner
export interface PiiFinding {
    type: 'Email' | 'Phone' | 'Address' | 'Credit Card' | 'Other';
    context: string; // The message text containing the PII
    sessionId: string;
    messageId: string;
}

export interface SuspiciousLink {
    url: string;
    reason: string; // e.g., "Potential phishing site"
    sessionId: string;
    messageId: string;
}

export interface AppSettingFinding {
    setting: string;
    issue: string;
    recommendation: string;
}

export interface ThreatScanResult {
    piiFindings: PiiFinding[];
    suspiciousLinks: SuspiciousLink[];
    appSettingsFindings: AppSettingFinding[];
}

// New type for API Call Inspector
export interface ApiCallLog {
    id: string;
    timestamp: number;
    request: any;
    response: any;
}