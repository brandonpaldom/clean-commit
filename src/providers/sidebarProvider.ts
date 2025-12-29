import * as vscode from 'vscode';
import { GitService } from '../services/gitService';
import { generateCommitMessage } from '../services/geminiService';
import { truncateDiff } from '../prompts/conventionalCommit';
import type { 
  WebviewToExtensionMessage, 
  SidebarState, 
  ExtensionToWebviewMessage 
} from '../types';

export class SidebarProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private gitService: GitService;
  private disposables: vscode.Disposable[] = [];

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly secrets: vscode.SecretStorage
  ) {
    this.gitService = new GitService();
  }

  async resolveWebviewView(webviewView: vscode.WebviewView): Promise<void> {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = await this.getHtmlContent(webviewView.webview);

    await this.gitService.initialize();
    
    // Setup Git repository watcher
    this.setupRepositoryWatcher();

    webviewView.webview.onDidReceiveMessage((message: WebviewToExtensionMessage) => {
      this.handleMessage(message);
    });

    webviewView.onDidDispose(() => {
      this.disposables.forEach(d => d.dispose());
      this.disposables = [];
    });
  }

  private setupRepositoryWatcher(): void {
    const disposable = this.gitService.onDidChangeRepository(() => {
      this.sendChangesUpdate();
    });

    this.disposables.push(disposable);
  }

  private async sendChangesUpdate(): Promise<void> {
    if (!this.view) {
      return;
    }

    const [changes, staged] = await Promise.all([
      this.gitService.getChanges(),
      this.gitService.getStagedChanges(),
    ]);

    this.postMessage({
      type: 'changesUpdated',
      changes,
      staged,
    });
  }

  private async handleMessage(message: WebviewToExtensionMessage): Promise<void> {
    switch (message.command) {
      case 'webviewReady':
        await this.sendInitialState();
        await this.sendChangesUpdate();
        break;

      case 'generateCommit':
        await this.handleGenerateCommit();
        break;

      case 'insertToGit':
        this.gitService.setCommitMessage(message.message);
        break;

      case 'setApiKey':
        await this.handleSetApiKey();
        break;

      case 'copyToClipboard':
        await vscode.env.clipboard.writeText(message.text);
        vscode.window.showInformationMessage('Copied to clipboard!');
        break;
        
      case 'openSettings':
        vscode.commands.executeCommand('workbench.action.openSettings', 'cleancommit');
        break;

      case 'stageAll':
        try {
          await this.gitService.stageAll();
          // No need to manually refresh here as the watcher will catch it, but let's be safe
          await this.sendChangesUpdate();
        } catch (error) {
          this.showError('Failed to stage changes', error);
        }
        break;

      case 'unstageAll':
        try {
          await this.gitService.unstageAll();
          await this.sendChangesUpdate();
        } catch (error) {
          this.showError('Failed to unstage changes', error);
        }
        break;

      case 'discardAll':
        const confirm = await vscode.window.showWarningMessage(
          'Discard all changes? This cannot be undone.',
          { modal: true },
          'Discard'
        );
        if (confirm === 'Discard') {
          try {
            await this.gitService.discardAll();
            await this.sendChangesUpdate();
          } catch (error) {
            this.showError('Failed to discard changes', error);
          }
        }
        break;

      case 'commit':
        try {
          await this.gitService.commit(message.message);
          this.postMessage({ type: 'commitSuccess' });
          vscode.window.showInformationMessage('Commit created successfully!');
          // The repository watcher should trigger a refresh automatically
        } catch (error) {
          this.showError('Failed to commit', error);
        }
        break;

      case 'refreshChanges':
        await this.sendChangesUpdate();
        break;

      case 'stageFile':
        try {
          await this.gitService.stageFile(message.path);
          await this.sendChangesUpdate();
        } catch (error) {
          this.showError('Failed to stage file', error);
        }
        break;

      case 'unstageFile':
        try {
          await this.gitService.unstageFile(message.path);
          await this.sendChangesUpdate();
        } catch (error) {
          this.showError('Failed to unstage file', error);
        }
        break;

      case 'discardFile':
        const fileConfirm = await vscode.window.showWarningMessage(
          `Discard changes in ${vscode.Uri.file(message.path).fsPath}?`,
          { modal: true },
          'Discard'
        );
        if (fileConfirm === 'Discard') {
          try {
            await this.gitService.discardFile(message.path);
            await this.sendChangesUpdate();
          } catch (error) {
            this.showError('Failed to discard file', error);
          }
        }
        break;
    }
  }

  private showError(title: string, error: any) {
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`${title}: ${message}`);
    this.postMessage({ type: 'error', error: message, code: 'UNKNOWN' });
  }

  private async handleGenerateCommit(): Promise<void> {
    this.postMessage({ type: 'loading', isLoading: true });

    try {
      const apiKey = await this.secrets.get('cleancommit.apiKey');
      if (!apiKey) {
        this.postMessage({ type: 'error', error: 'API key not set', code: 'NO_API_KEY' });
        return;
      }

      const diff = await this.gitService.getStagedDiff();
      if (!diff) {
        this.postMessage({ type: 'error', error: 'No staged changes', code: 'NO_STAGED_CHANGES' });
        return;
      }

      const config = vscode.workspace.getConfiguration('cleancommit');
      const maxDiffSize = config.get('maxDiffSize', 4000);
      const language = config.get('language', 'en');
      const includeBody = config.get('includeBody', false);

      const truncatedDiff = truncateDiff(diff, maxDiffSize);
      
      const message = await generateCommitMessage(truncatedDiff, apiKey, {
        language,
        includeBody,
        maxDiffSize
      });

      this.postMessage({ type: 'commitGenerated', message });
    } catch (error: any) {
      this.postMessage({ 
        type: 'error', 
        error: error.message || 'Unknown error', 
        code: error.code || 'UNKNOWN' 
      });
    } finally {
      this.postMessage({ type: 'loading', isLoading: false });
    }
  }

  private async handleSetApiKey(): Promise<void> {
    const apiKey = await vscode.window.showInputBox({
      prompt: 'Enter your Gemini API Key',
      password: true,
      placeHolder: 'AIza...',
    });

    if (apiKey) {
      await this.secrets.store('cleancommit.apiKey', apiKey);
      vscode.window.showInformationMessage('API key saved successfully!');
      await this.sendInitialState();
    }
  }

  private async sendInitialState(): Promise<void> {
    const apiKey = await this.secrets.get('cleancommit.apiKey');
    const diff = await this.gitService.getStagedDiff();

    const state: SidebarState = {
      hasApiKey: !!apiKey,
      hasStagedChanges: !!diff,
      isLoading: false,
      generatedMessage: null,
      error: null,
    };

    this.postMessage({ type: 'setState', state });
  }

  private postMessage(message: ExtensionToWebviewMessage): void {
    this.view?.webview.postMessage(message);
  }

  private async getHtmlContent(webview: vscode.Webview): Promise<string> {
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'sidebar.css'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'sidebar.js'));
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' https://unpkg.com; img-src ${webview.cspSource} https:;">
      <link href="${styleUri}" rel="stylesheet">
      <title>CleanCommit</title>
    </head>
    <body>
      <div id="no-api-key" class="hidden">
        <p class="info">Set your Gemini API key to get started.</p>
        <button class="primary" id="btn-set-key">Set API Key</button>
      </div>
 
      <div id="main-content" class="hidden">
        <div class="section">
          <div class="section-header">
            <span>Commit Message</span>
            <button class="icon-button" id="btn-refresh" title="Refresh changes">
              <i data-lucide="refresh-cw"></i>
            </button>
          </div>
          <textarea id="commit-message" class="commit-input" placeholder="Enter commit message or generate..."></textarea>
          
          <div class="button-row">
            <button class="primary" id="btn-generate" title="Generate with AI">
              <i data-lucide="sparkles"></i> Generate
            </button>
            <button class="primary btn-commit" id="btn-commit" title="Commit staged changes">
              <i data-lucide="rocket"></i> Commit
            </button>
          </div>
        </div>

        <div id="loading" class="loading hidden">
          <div class="spinner"></div>
          <span>Generating...</span>
        </div>

        <div id="error" class="error hidden"></div>

        <div class="divider"></div>

        <div class="section">
          <div class="section-header">
            <span>Staged Changes</span>
            <span class="counter" id="staged-count">0</span>
          </div>
          <div id="staged-list" class="file-list">
            <div class="empty-state">No staged changes</div>
          </div>
          <button class="secondary full-width" id="btn-unstage-all">Unstage All</button>
        </div>

        <div class="divider"></div>

        <div class="section">
          <div class="section-header">
            <span>Changes</span>
            <span class="counter" id="changes-count">0</span>
          </div>
          <div id="changes-list" class="file-list">
            <div class="empty-state">No changes</div>
          </div>
          <div class="button-row">
            <button class="secondary" id="btn-stage-all">Stage All</button>
            <button class="secondary btn-danger" id="btn-discard-all">Discard All</button>
          </div>
        </div>
      </div>

      <div class="footer">
        <button class="icon-button" id="btn-settings" title="Open Settings">
           <i data-lucide="settings"></i> Settings
        </button>
      </div>

      <script nonce="${nonce}" src="https://unpkg.com/lucide@latest"></script>
      <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
  }

  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
