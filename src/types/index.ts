export type ErrorCode =
  | 'NO_API_KEY'
  | 'NO_STAGED_CHANGES'
  | 'NO_GIT_REPO'
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'RATE_LIMIT'
  | 'INVALID_PROVIDER'
  | 'PROVIDER_NOT_CONFIGURED'
  | 'UNKNOWN';

// AI Provider Types
export type AIProviderType = 'gemini' | 'openai' | 'groq' | 'openrouter';

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  generateCommitMessage(diff: string, options: GenerateOptions): Promise<string>;
}

export interface ProviderConfig {
  type: AIProviderType;
  apiKey: string;
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public provider: AIProviderType,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

// Provider metadata for UI
export const PROVIDER_INFO: Record<AIProviderType, { label: string; model: string; placeholder: string }> = {
  gemini: { label: 'Google Gemini', model: 'gemini-2.5-flash', placeholder: 'AIza...' },
  openai: { label: 'OpenAI', model: 'gpt-4o-mini', placeholder: 'sk-...' },
  groq: { label: 'Groq', model: 'llama-3.3-70b-versatile', placeholder: 'gsk_...' },
  openrouter: { label: 'OpenRouter', model: 'google/gemini-2.0-flash-001', placeholder: 'sk-or-...' },
};

export type FileChangeStatus = 'M' | 'A' | 'D' | 'R' | 'U';

export interface FileChange {
  path: string;
  fileName: string;
  status: FileChangeStatus;
}

export type WebviewToExtensionMessage =
  | { command: 'generateCommit' }
  | { command: 'insertToGit'; message: string }
  | { command: 'copyToClipboard'; text: string }
  | { command: 'openSettings' }
  | { command: 'setApiKey' }
  | { command: 'webviewReady' }
  | { command: 'stageAll' }
  | { command: 'unstageAll' }
  | { command: 'discardAll' }
  | { command: 'stageFile'; path: string }
  | { command: 'unstageFile'; path: string }
  | { command: 'discardFile'; path: string }
  | { command: 'commit'; message: string }
  | { command: 'refreshChanges' };

export type ExtensionToWebviewMessage =
  | { type: 'setState'; state: SidebarState }
  | { type: 'commitGenerated'; message: string }
  | { type: 'error'; error: string; code: ErrorCode }
  | { type: 'loading'; isLoading: boolean }
  | { type: 'diffInfo'; files: number; insertions: number; deletions: number }
  | { type: 'changesUpdated'; changes: FileChange[]; staged: FileChange[] }
  | { type: 'commitSuccess' };

export type SidebarState = {
  hasApiKey: boolean;
  hasStagedChanges: boolean;
  isLoading: boolean;
  generatedMessage: string | null;
  error: string | null;
  currentProvider: AIProviderType;
  providerLabel: string;
};

export interface GenerateOptions {
  language: string;
  includeBody: boolean;
  maxDiffSize: number;
}
