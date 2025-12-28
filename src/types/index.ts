export type WebviewToExtensionMessage =
  | { command: 'generateCommit' }
  | { command: 'insertToGit'; message: string }
  | { command: 'copyToClipboard'; text: string }
  | { command: 'openSettings' }
  | { command: 'setApiKey' }
  | { command: 'webviewReady' };

export type ExtensionToWebviewMessage =
  | { type: 'setState'; state: SidebarState }
  | { type: 'commitGenerated'; message: string }
  | { type: 'error'; error: string; code: ErrorCode }
  | { type: 'loading'; isLoading: boolean }
  | { type: 'diffInfo'; filesChanged: number; insertions: number; deletions: number };

export type SidebarState = {
  hasApiKey: boolean;
  hasStagedChanges: boolean;
  isLoading: boolean;
  generatedMessage: string | null;
  error: string | null;
};

export type ErrorCode =
  | 'NO_API_KEY'
  | 'NO_STAGED_CHANGES'
  | 'NO_GIT_REPO'
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'RATE_LIMIT'
  | 'UNKNOWN';

export interface GenerateOptions {
  language: string;
  includeBody: boolean;
  maxDiffSize: number;
}
