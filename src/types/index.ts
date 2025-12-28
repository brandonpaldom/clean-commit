export type ErrorCode =
  | 'NO_API_KEY'
  | 'NO_STAGED_CHANGES'
  | 'NO_GIT_REPO'
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'RATE_LIMIT'
  | 'UNKNOWN';

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
};

export interface GenerateOptions {
  language: string;
  includeBody: boolean;
  maxDiffSize: number;
}
