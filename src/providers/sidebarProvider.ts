import * as vscode from 'vscode';
import { GitService } from '../services/gitService';
import { createProvider, PROVIDER_SECRET_KEYS } from '../services/providerFactory';
import { truncateDiff } from '../prompts/conventionalCommit';
import type { 
  WebviewToExtensionMessage, 
  SidebarState, 
  ExtensionToWebviewMessage,
  AIProviderType,
  AIProviderError
} from '../types';
import { PROVIDER_INFO, PROVIDER_MODEL_SETTING_KEYS } from '../types';

export class SidebarProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private gitService: GitService;
  private disposables: vscode.Disposable[] = [];
  private gitOperationInProgress = false;

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
    
    // Setup configuration watcher (for provider changes)
    this.setupConfigurationWatcher();

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

  private setupConfigurationWatcher(): void {
    const disposable = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('cleancommit')) {
        this.sendInitialState();
      }
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
      hasRepository: !!this.gitService.getRepository(),
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
        await this.setApiKey();
        break;

      case 'changeProvider':
        await this.updateSetting('provider', message.provider);
        break;

      case 'changeLanguage':
        await this.updateSetting('language', message.language);
        break;

      case 'changeIncludeBody':
        await this.updateSetting('includeBody', message.includeBody);
        break;

      case 'resetModel':
        await this.resetModel();
        break;

      case 'copyToClipboard':
        await vscode.env.clipboard.writeText(message.text);
        vscode.window.showInformationMessage('Copied to clipboard!');
        break;
        
      case 'openSettings':
        vscode.commands.executeCommand('workbench.action.openSettings', 'cleancommit');
        break;

      case 'stageAll':
        await this.runGitOperation('Staging all changes...', 'Failed to stage changes', () => this.gitService.stageAll());
        break;

      case 'unstageAll':
        await this.runGitOperation('Unstaging all changes...', 'Failed to unstage changes', () => this.gitService.unstageAll());
        break;

      case 'discardAll':
        const confirm = await vscode.window.showWarningMessage(
          'Discard all changes? This cannot be undone.',
          { modal: true },
          'Discard'
        );
        if (confirm === 'Discard') {
          await this.runGitOperation('Discarding all changes...', 'Failed to discard changes', () => this.gitService.discardAll());
        }
        break;

      case 'commit':
        if (!(await this.confirmCommitIfNeeded(message.message))) {
          break;
        }
        await this.runGitOperation(
          'Creating commit...',
          'Failed to commit',
          () => this.gitService.commit(message.message),
          () => {
            this.postMessage({ type: 'commitSuccess' });
            vscode.window.showInformationMessage('Commit created successfully!');
          }
        );
        break;

      case 'refreshChanges':
        await this.sendChangesUpdate();
        break;

      case 'stageFile':
        await this.runGitOperation('Staging file...', 'Failed to stage file', () => this.gitService.stageFile(message.path));
        break;

      case 'unstageFile':
        await this.runGitOperation('Unstaging file...', 'Failed to unstage file', () => this.gitService.unstageFile(message.path));
        break;

      case 'discardFile':
        const fileConfirm = await vscode.window.showWarningMessage(
          `Discard changes in ${vscode.Uri.file(message.path).fsPath}?`,
          { modal: true },
          'Discard'
        );
        if (fileConfirm === 'Discard') {
          await this.runGitOperation('Discarding file changes...', 'Failed to discard file', () => this.gitService.discardFile(message.path));
        }
        break;
    }
  }

  private async runGitOperation(
    label: string,
    errorTitle: string,
    operation: () => Promise<void>,
    onSuccess?: () => void
  ): Promise<void> {
    if (this.gitOperationInProgress) {
      return;
    }

    this.gitOperationInProgress = true;
    this.postMessage({ type: 'operation', isLoading: true, label });

    try {
      await operation();
      onSuccess?.();
      await this.sendChangesUpdate();
    } catch (error) {
      this.showError(errorTitle, error);
    } finally {
      this.gitOperationInProgress = false;
      this.postMessage({ type: 'operation', isLoading: false });
    }
  }

  private async confirmCommitIfNeeded(message: string): Promise<boolean> {
    const config = vscode.workspace.getConfiguration('cleancommit');
    if (!config.get('confirmBeforeCommit', false)) {
      return true;
    }

    const subject = message.split('\n', 1)[0];
    const confirmation = await vscode.window.showInformationMessage(
      `Create commit “${subject}”?`,
      { modal: true },
      'Commit'
    );
    return confirmation === 'Commit';
  }

  private showError(title: string, error: any) {
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`${title}: ${message}`);
    this.postMessage({ type: 'error', error: message, code: 'UNKNOWN' });
  }

  private async handleGenerateCommit(): Promise<void> {
    this.postMessage({ type: 'loading', isLoading: true });

    try {
      const config = vscode.workspace.getConfiguration('cleancommit');
      const providerType = config.get<AIProviderType>('provider', 'gemini');
      const secretKey = PROVIDER_SECRET_KEYS[providerType];
      const apiKey = await this.secrets.get(secretKey);
      
      if (!apiKey) {
        const providerLabel = PROVIDER_INFO[providerType].label;
        this.postMessage({ 
          type: 'error', 
          error: `API key not set for ${providerLabel}`, 
          code: 'NO_API_KEY' 
        });
        return;
      }

      const diff = await this.gitService.getStagedDiff();
      if (!diff) {
        this.postMessage({ type: 'error', error: 'No staged changes', code: 'NO_STAGED_CHANGES' });
        return;
      }

      const maxDiffSize = config.get('maxDiffSize', 12000);
      const language = config.get('language', 'en');
      const includeBody = config.get('includeBody', false);

      const truncatedDiff = truncateDiff(diff, maxDiffSize);
      
      const provider = createProvider(providerType, apiKey, this.getConfiguredModel(config, providerType));
      const message = await provider.generateCommitMessage(truncatedDiff, {
        language,
        includeBody,
        maxDiffSize
      });

      this.postMessage({ type: 'commitGenerated', message });
    } catch (error: unknown) {
      const aiError = error as AIProviderError;
      this.postMessage({ 
        type: 'error', 
        error: aiError.message || 'Unknown error', 
        code: aiError.code || 'UNKNOWN' 
      });
    } finally {
      this.postMessage({ type: 'loading', isLoading: false });
    }
  }

  async setApiKey(): Promise<void> {
    const config = vscode.workspace.getConfiguration('cleancommit');
    const providerType = config.get<AIProviderType>('provider', 'gemini');
    const providerInfo = PROVIDER_INFO[providerType];
    const secretKey = PROVIDER_SECRET_KEYS[providerType];

    const apiKey = await vscode.window.showInputBox({
      prompt: `Enter your ${providerInfo.label} API Key`,
      password: true,
      placeHolder: providerInfo.placeholder,
    });

    if (apiKey) {
      await this.secrets.store(secretKey, apiKey);
      vscode.window.showInformationMessage(`${providerInfo.label} API key saved successfully!`);
      await this.sendInitialState();
    }
  }

  async resetModel(): Promise<void> {
    const config = vscode.workspace.getConfiguration('cleancommit');
    const providerType = config.get<AIProviderType>('provider', 'gemini');
    const settingKey = PROVIDER_MODEL_SETTING_KEYS[providerType];
    await config.update(settingKey, undefined, vscode.ConfigurationTarget.Workspace);
    await config.update(settingKey, undefined, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(
      `${PROVIDER_INFO[providerType].label} model restored to ${PROVIDER_INFO[providerType].model}.`
    );
    await this.sendInitialState();
  }

  private async updateSetting(
    key: 'provider' | 'language' | 'includeBody',
    value: AIProviderType | 'en' | 'es' | boolean
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration('cleancommit');
    await config.update(key, value, vscode.ConfigurationTarget.Workspace);
    await this.sendInitialState();
  }

  private getConfiguredModel(
    config: vscode.WorkspaceConfiguration,
    providerType: AIProviderType
  ): string {
    const recommendedModel = PROVIDER_INFO[providerType].model;
    return config.get<string>(PROVIDER_MODEL_SETTING_KEYS[providerType], recommendedModel).trim() || recommendedModel;
  }

  private async sendInitialState(): Promise<void> {
    const config = vscode.workspace.getConfiguration('cleancommit');
    const providerType = config.get<AIProviderType>('provider', 'gemini');
    const providerInfo = PROVIDER_INFO[providerType];
    const secretKey = PROVIDER_SECRET_KEYS[providerType];
    const apiKey = await this.secrets.get(secretKey);
    const diff = await this.gitService.getStagedDiff();
    const language = config.get<'en' | 'es'>('language', 'en');
    const includeBody = config.get('includeBody', false);

    const state: SidebarState = {
      hasApiKey: !!apiKey,
      hasRepository: !!this.gitService.getRepository(),
      hasStagedChanges: !!diff,
      isLoading: false,
      generatedMessage: null,
      error: null,
      currentProvider: providerType,
      providerLabel: providerInfo.label,
      providerModel: this.getConfiguredModel(config, providerType),
      language,
      includeBody,
    };

    this.postMessage({ type: 'setState', state });
  }

  private postMessage(message: ExtensionToWebviewMessage): void {
    this.view?.webview.postMessage(message);
  }

  private async getHtmlContent(webview: vscode.Webview): Promise<string> {
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'sidebar.css'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'sidebar.js'));
    const lucideUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'lucide.min.js'));
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https:;">
      <link href="${styleUri}" rel="stylesheet">
      <title>CleanCommit</title>
    </head>
    <body>
      <div id="main-content">
        <div id="repository-state" class="state-callout hidden"></div>

        <div class="section">
          <div class="section-header">
            <span>Commit Message</span>
            <button class="icon-button" id="btn-refresh" title="Refresh changes">
              <i data-lucide="refresh-cw"></i>
            </button>
          </div>

          <div id="no-api-key" class="setup-callout hidden">
            <p class="info" id="no-api-key-text">Set your API key to generate commit messages.</p>
            <p class="info hint">Git actions and manual commits remain available without AI.</p>
            <button class="primary" id="btn-set-key">
              <i data-lucide="key"></i> Set API Key
            </button>
          </div>

          <textarea id="commit-message" class="commit-input" placeholder="Enter commit message or generate..."></textarea>
          
          <div class="button-row">
            <button class="primary" id="btn-generate" title="Generate with AI">
              <i data-lucide="sparkles"></i> Generate
            </button>
            <button class="secondary hidden" id="btn-regenerate" title="Regenerate message">
              <i data-lucide="refresh-cw"></i> Regenerate
            </button>
            <button class="primary btn-commit" id="btn-commit" title="Commit staged changes">
              <i data-lucide="rocket"></i> Commit
            </button>
          </div>
          
          <div class="quick-settings">
            <label class="quick-setting">
              <span>Provider</span>
              <select id="provider-select">
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="groq">Groq</option>
                <option value="openrouter">OpenRouter</option>
              </select>
            </label>

            <label class="quick-setting">
              <span>Language</span>
              <select id="language-select">
                <option value="en">English</option>
                <option value="es">Spanish</option>
              </select>
            </label>

            <label class="checkbox-setting">
              <input type="checkbox" id="include-body">
              <span>Include commit body</span>
            </label>

            <div class="provider-info">
              <div class="provider-summary">
                <span class="provider-badge" id="provider-badge">Loading...</span>
                <code id="provider-model"></code>
              </div>
              <button class="link-button" id="btn-change-key" title="Change API Key" aria-label="Change API Key">
                <i data-lucide="key"></i>
              </button>
              <button class="link-button" id="btn-reset-model" title="Restore recommended model" aria-label="Restore recommended model">
                <i data-lucide="rotate-ccw"></i>
              </button>
            </div>
          </div>
        </div>

        <div id="loading" class="loading hidden">
          <div class="spinner"></div>
          <span>Generating...</span>
        </div>

        <div id="operation-status" class="loading hidden">
          <div class="spinner"></div>
          <span id="operation-label">Updating repository...</span>
        </div>

        <div id="error" class="error hidden"></div>
        <div id="success" class="success hidden"></div>

        <div class="divider"></div>

        <div class="section">
          <div class="section-header">
            <span>Staged Changes</span>
            <span class="counter" id="staged-count">0</span>
          </div>
          <div id="staged-list" class="file-list">
            <div class="empty-state">No staged changes</div>
          </div>
          <button class="secondary full-width hidden" id="btn-unstage-all">Unstage All</button>
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
          <div class="button-row hidden" id="changes-actions">
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

      <script nonce="${nonce}" src="${lucideUri}"></script>
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
