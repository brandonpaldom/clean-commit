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

    webviewView.webview.onDidReceiveMessage((message: WebviewToExtensionMessage) => {
      this.handleMessage(message);
    });
  }

  private async handleMessage(message: WebviewToExtensionMessage): Promise<void> {
    switch (message.command) {
      case 'webviewReady':
        await this.sendInitialState();
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
    }
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
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'src', 'webview', 'sidebar.css'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'src', 'webview', 'sidebar.js'));
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
      <link href="${styleUri}" rel="stylesheet">
      <title>CleanCommit</title>
    </head>
    <body>
      <div id="no-api-key" class="hidden">
        <p class="info">Set your Gemini API key to get started.</p>
        <button class="primary" id="btn-set-key">Set API Key</button>
      </div>

      <div id="main-content" class="hidden">
        <button class="primary" id="btn-generate" disabled title="Stage some changes first">
          Generate Commit Message
        </button>
        <p class="info" id="staged-info">No staged changes found</p>

        <div id="loading" class="loading hidden">
          <div class="spinner"></div>
          <span>Generating...</span>
        </div>

        <div id="error" class="error hidden"></div>

        <div id="result" class="hidden">
          <div class="message-box" id="generated-message"></div>
          <div class="actions">
            <button class="primary" id="btn-insert">Insert</button>
            <button class="secondary" id="btn-copy">Copy</button>
          </div>
        </div>
      </div>

      <div class="footer">
        <button class="icon-button" id="btn-settings" title="Open Settings">
           ⚙️ Settings
        </button>
      </div>

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
