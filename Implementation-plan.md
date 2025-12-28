# CleanCommit: Plan de Implementación MVP

## 1. Resumen Ejecutivo

Extensión universal de VS Code para generar mensajes de commit asistidos por IA, compatible con el ecosistema VS Code y sus derivados (Cursor, Windsurf, VSCodium, etc.).

| Aspecto | Decisión |
|---------|----------|
| **Interfaz** | Panel Lateral (Sidebar) |
| **Motor IA** | Google Gemini (`gemini-1.5-flash`) |
| **Estándar** | Conventional Commits |
| **Engine** | `^1.90.0` |

---

## 2. Alcance del MVP

### MVP v0.1.0 (Scope)

- [ ] Sidebar panel con UI básica
- [ ] Botón "Generate Commit Message"
- [ ] Lectura de staged changes (`git diff --staged`)
- [ ] Integración con Gemini API
- [ ] Generación de mensaje en formato Conventional Commits
- [ ] Inserción del mensaje en el Git input box
- [ ] Configuración de API Key via SecretStorage
- [ ] Manejo básico de errores (sin key, sin cambios, sin conexión)

### MVP v0.2.0 - Git Changes Panel

- [ ] Sección "Changes" con lista de archivos modificados (unstaged)
- [ ] Counter de archivos con cambios
- [ ] Botón "Stage All Changes"
- [ ] Botón "Discard All Changes"
- [ ] Sección "Staged Changes" con lista de archivos en staging
- [ ] Counter de archivos staged
- [ ] Botón "Unstage All Changes"
- [ ] Botón "Commit" para ejecutar commit directamente
- [ ] Input editable para el mensaje de commit
- [ ] Actualización reactiva al detectar cambios en el repositorio

### Post-MVP (Futuro)

- [ ] Historial de commits generados
- [ ] Múltiples sugerencias de mensaje
- [ ] Edición inline del mensaje antes de insertar
- [ ] Soporte para múltiples idiomas
- [ ] Configuración de estilos de commit personalizados
- [ ] Integración con otros modelos de IA (OpenAI, Claude, Ollama)
- [ ] Análisis de calidad del commit
- [ ] Templates personalizables
- [ ] Stage/Unstage individual por archivo
- [ ] Discard individual por archivo
- [ ] Vista de diff por archivo

---

## 3. Estrategia de Compatibilidad

Para garantizar funcionamiento en Cursor, Windsurf, VSCodium, etc.:

### 3.1 Reglas de Diseño

1. **Cero Dependencias Microsoft**
   - No usar `Microsoft Authentication`
   - No usar Telemetría propietaria
   - Gestión de API keys via `SecretStorage` (estándar en todos los forks)

2. **API de Git Genérica**
   - Consumir `vscode.git` extension API
   - Verificación defensiva de existencia al iniciar
   - Fallback graceful si no está disponible

3. **Agnosticismo de Marketplace**
   - Publicar en Visual Studio Marketplace
   - Publicar en Open VSX Registry
   - Proveer `.vsix` en GitHub Releases

### 3.2 Theming Agnóstico

Usar exclusivamente CSS variables del editor:

```css
/* ✅ Correcto */
background-color: var(--vscode-sideBar-background);
color: var(--vscode-foreground);
border: 1px solid var(--vscode-panel-border);

/* ❌ Evitar */
background-color: #1e1e1e;
color: white;
```

---

## 4. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        VS Code Host                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │   Sidebar       │    │       Extension Host            │ │
│  │   (Webview)     │◄──►│                                 │ │
│  │                 │    │  ┌───────────┐ ┌─────────────┐  │ │
│  │  ┌───────────┐  │    │  │ Git       │ │ Gemini      │  │ │
│  │  │ Generate  │  │    │  │ Service   │ │ Service     │  │ │
│  │  │ Button    │  │    │  └───────────┘ └─────────────┘  │ │
│  │  └───────────┘  │    │                                 │ │
│  │                 │    │  ┌───────────────────────────┐  │ │
│  │  ┌───────────┐  │    │  │ Sidebar Provider          │  │ │
│  │  │ Message   │  │    │  │ (WebviewViewProvider)     │  │ │
│  │  │ Preview   │  │    │  └───────────────────────────┘  │ │
│  │  └───────────┘  │    │                                 │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                      VS Code Git Extension                   │
│                   (repository.inputBox.value)                │
└─────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Google Gemini API                         │
│                   (gemini-1.5-flash)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Estructura de Archivos

```
cleancommit/
├── .vscode/
│   ├── launch.json
│   └── settings.json
├── resources/
│   └── icon.svg                    # Icono del sidebar
├── src/
│   ├── extension.ts                # Entry point
│   ├── providers/
│   │   └── sidebarProvider.ts      # WebviewViewProvider
│   ├── services/
│   │   ├── gitService.ts           # Interacción con Git API
│   │   └── geminiService.ts        # Cliente de Gemini
│   ├── webview/
│   │   ├── sidebar.html            # Template HTML
│   │   ├── sidebar.css             # Estilos (CSS variables)
│   │   └── sidebar.js              # Lógica del webview
│   ├── prompts/
│   │   └── conventionalCommit.ts   # System prompts
│   └── types/
│       └── index.ts                # Type definitions
├── test/
│   ├── suite/
│   │   ├── gitService.test.ts
│   │   └── geminiService.test.ts
│   └── runTest.ts
├── package.json
├── tsconfig.json
├── esbuild.js
└── README.md
```

---

## 6. Package.json Completo

```json
{
  "name": "cleancommit",
  "displayName": "CleanCommit",
  "description": "AI-powered commit message generator using Conventional Commits",
  "version": "0.1.0",
  "publisher": "tu-publisher",
  "icon": "resources/icon.png",
  "repository": {
    "type": "git",
    "url": "https://github.com/tu-usuario/cleancommit"
  },
  "engines": {
    "vscode": "^1.90.0"
  },
  "categories": [
    "SCM Providers",
    "Machine Learning"
  ],
  "keywords": [
    "git",
    "commit",
    "ai",
    "conventional-commits",
    "gemini"
  ],
  "activationEvents": [
    "onView:cleancommit.sidebar"
  ],
  "main": "./dist/extension.js",
  "extensionDependencies": [
    "vscode.git"
  ],
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "cleancommit-container",
          "title": "CleanCommit",
          "icon": "resources/icon.svg"
        }
      ]
    },
    "views": {
      "cleancommit-container": [
        {
          "type": "webview",
          "id": "cleancommit.sidebar",
          "name": "Commit Assistant"
        }
      ]
    },
    "commands": [
      {
        "command": "cleancommit.generateCommit",
        "title": "Generate Commit Message",
        "category": "CleanCommit"
      },
      {
        "command": "cleancommit.setApiKey",
        "title": "Set Gemini API Key",
        "category": "CleanCommit"
      }
    ],
    "configuration": {
      "title": "CleanCommit",
      "properties": {
        "cleancommit.language": {
          "type": "string",
          "default": "en",
          "enum": ["en", "es"],
          "enumDescriptions": [
            "English",
            "Spanish"
          ],
          "description": "Language for generated commit messages"
        },
        "cleancommit.includeBody": {
          "type": "boolean",
          "default": false,
          "description": "Include detailed body in commit message"
        },
        "cleancommit.maxDiffSize": {
          "type": "number",
          "default": 4000,
          "description": "Maximum diff size in characters to send to AI"
        }
      }
    }
  },
  "scripts": {
    "vscode:prepublish": "npm run package",
    "compile": "npm run check-types && npm run lint && node esbuild.js",
    "watch": "npm-run-all -p watch:*",
    "watch:esbuild": "node esbuild.js --watch",
    "watch:tsc": "tsc --noEmit --watch --project tsconfig.json",
    "package": "npm run check-types && npm run lint && node esbuild.js --production",
    "compile-tests": "tsc -p . --outDir out",
    "watch-tests": "tsc -p . -w --outDir out",
    "pretest": "npm run compile-tests && npm run compile && npm run lint",
    "check-types": "tsc --noEmit",
    "lint": "eslint src",
    "test": "vscode-test",
    "publish:vsce": "vsce publish",
    "publish:ovsx": "ovsx publish"
  },
  "dependencies": {
    "@google/generative-ai": "^0.21.0"
  },
  "devDependencies": {
    "@types/vscode": "^1.90.0",
    "@types/mocha": "^10.0.10",
    "@types/node": "22.x",
    "@vscode/test-cli": "^0.0.12",
    "@vscode/test-electron": "^2.5.2",
    "@vscode/vsce": "^3.0.0",
    "esbuild": "^0.27.1",
    "eslint": "^9.39.1",
    "npm-run-all": "^4.1.5",
    "ovsx": "^0.9.0",
    "typescript": "^5.9.3",
    "typescript-eslint": "^8.48.1"
  }
}
```

---

## 7. Definición de Prompts

### 7.1 System Prompt Principal

```typescript
// src/prompts/conventionalCommit.ts

export const SYSTEM_PROMPT = `You are a commit message generator that strictly follows the Conventional Commits specification.

## Output Format
<type>(<scope>): <description>

[optional body]

## Commit Types
- feat: A new feature
- fix: A bug fix
- docs: Documentation only changes
- style: Changes that do not affect the meaning of the code (formatting)
- refactor: A code change that neither fixes a bug nor adds a feature
- perf: A code change that improves performance
- test: Adding missing tests or correcting existing tests
- chore: Changes to the build process or auxiliary tools

## Rules
1. Subject line MUST be max 72 characters
2. Use imperative mood: "add" not "added" or "adds"
3. Do NOT end subject line with a period
4. Scope is optional but recommended
5. Body should explain WHAT and WHY, not HOW
6. Analyze the diff to understand the actual changes made

## Examples
feat(auth): add OAuth2 login support
fix(api): handle null response from user endpoint
refactor(utils): simplify date formatting logic
`;

export const USER_PROMPT_TEMPLATE = (diff: string, language: string) => `
Analyze the following git diff and generate a commit message.
Language: ${language === 'es' ? 'Spanish' : 'English'}

\`\`\`diff
${diff}
\`\`\`

Generate ONLY the commit message, nothing else.
`;
```

### 7.2 Manejo de Diffs Grandes

```typescript
export function truncateDiff(diff: string, maxSize: number): string {
  if (diff.length <= maxSize) {
    return diff;
  }

  const truncated = diff.substring(0, maxSize);
  const lastNewline = truncated.lastIndexOf('\n');

  return truncated.substring(0, lastNewline) +
    '\n\n[... diff truncated due to size ...]';
}
```

---

## 8. Protocolo de Mensajes Webview

### 8.1 Mensajes: Webview → Extension Host

```typescript
// src/types/index.ts

export type WebviewToExtensionMessage =
  | { command: 'generateCommit' }
  | { command: 'insertToGit'; message: string }
  | { command: 'copyToClipboard'; text: string }
  | { command: 'openSettings' }
  | { command: 'setApiKey' }
  | { command: 'webviewReady' };
```

### 8.2 Mensajes: Extension Host → Webview

```typescript
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
  | 'UNKNOWN';
```

---

## 9. Manejo de Errores

### 9.1 Catálogo de Errores

| Código | Condición | Mensaje Usuario | Acción |
|--------|-----------|-----------------|--------|
| `NO_API_KEY` | API key no configurada | "Please set your Gemini API key to continue" | Mostrar botón "Set API Key" |
| `NO_STAGED_CHANGES` | Sin cambios en staging | "No staged changes found. Stage some files first" | Mostrar instrucción |
| `NO_GIT_REPO` | No es repositorio git | "No git repository found in this workspace" | - |
| `API_ERROR` | Error de Gemini (4xx/5xx) | "Failed to generate message. Check your API key" | Retry button |
| `NETWORK_ERROR` | Sin conexión | "Network error. Check your internet connection" | Retry button |
| `RATE_LIMIT` | Rate limiting | "Too many requests. Please wait a moment" | Auto-retry con backoff |

### 9.2 Implementación

```typescript
// src/services/geminiService.ts

export class GeminiError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

export async function generateCommitMessage(
  diff: string,
  apiKey: string,
  options: GenerateOptions
): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: USER_PROMPT_TEMPLATE(diff, options.language) }]
      }],
      systemInstruction: SYSTEM_PROMPT,
    });

    return result.response.text().trim();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        throw new GeminiError('Invalid API key', 'API_ERROR', false);
      }
      if (error.message.includes('RATE_LIMIT')) {
        throw new GeminiError('Rate limit exceeded', 'RATE_LIMIT', true);
      }
      if (error.message.includes('fetch')) {
        throw new GeminiError('Network error', 'NETWORK_ERROR', true);
      }
    }
    throw new GeminiError('Unknown error', 'UNKNOWN', false);
  }
}
```

---

## 10. Servicios Core

### 10.1 Git Service

```typescript
// src/services/gitService.ts

import * as vscode from 'vscode';
import type { API as GitAPI, Repository } from '../types/git';

export class GitService {
  private gitApi: GitAPI | undefined;

  async initialize(): Promise<boolean> {
    const gitExtension = vscode.extensions.getExtension<{ getAPI(version: number): GitAPI }>('vscode.git');

    if (!gitExtension) {
      return false;
    }

    if (!gitExtension.isActive) {
      await gitExtension.activate();
    }

    this.gitApi = gitExtension.exports.getAPI(1);
    return true;
  }

  getRepository(): Repository | undefined {
    if (!this.gitApi || this.gitApi.repositories.length === 0) {
      return undefined;
    }
    return this.gitApi.repositories[0];
  }

  async getStagedDiff(): Promise<string | null> {
    const repo = this.getRepository();
    if (!repo) return null;

    const diff = await repo.diff(true); // true = staged only
    return diff || null;
  }

  async getStagedChangesInfo(): Promise<{ files: number; insertions: number; deletions: number } | null> {
    const repo = this.getRepository();
    if (!repo) return null;

    const changes = repo.state.indexChanges;
    return {
      files: changes.length,
      insertions: 0, // Would need to parse diff for accurate count
      deletions: 0,
    };
  }

  setCommitMessage(message: string): boolean {
    const repo = this.getRepository();
    if (!repo) return false;

    repo.inputBox.value = message;
    return true;
  }
}
```

### 10.2 Sidebar Provider

```typescript
// src/providers/sidebarProvider.ts

import * as vscode from 'vscode';
import { GitService } from '../services/gitService';
import { generateCommitMessage } from '../services/geminiService';
import type { WebviewToExtensionMessage, SidebarState } from '../types';

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

    webviewView.webview.html = this.getHtmlContent(webviewView.webview);

    // Initialize git service
    await this.gitService.initialize();

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(this.handleMessage.bind(this));
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
        vscode.window.showInformationMessage('Commit message inserted!');
        break;

      case 'setApiKey':
        await this.handleSetApiKey();
        break;

      case 'copyToClipboard':
        await vscode.env.clipboard.writeText(message.text);
        vscode.window.showInformationMessage('Copied to clipboard!');
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
      const message = await generateCommitMessage(diff, apiKey, {
        language: config.get('language', 'en'),
        includeBody: config.get('includeBody', false),
        maxDiffSize: config.get('maxDiffSize', 4000),
      });

      this.postMessage({ type: 'commitGenerated', message });
    } catch (error) {
      const err = error as Error;
      this.postMessage({ type: 'error', error: err.message, code: 'API_ERROR' });
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

  private postMessage(message: any): void {
    this.view?.webview.postMessage(message);
  }

  private getHtmlContent(webview: vscode.Webview): string {
    // Load from file or return inline HTML
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CleanCommit</title>
      <style>
        body {
          padding: 12px;
          font-family: var(--vscode-font-family);
          color: var(--vscode-foreground);
          background: var(--vscode-sideBar-background);
        }
        button {
          width: 100%;
          padding: 8px 12px;
          margin: 4px 0;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
        }
        .primary {
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
        }
        .primary:hover {
          background: var(--vscode-button-hoverBackground);
        }
        .primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .secondary {
          background: var(--vscode-button-secondaryBackground);
          color: var(--vscode-button-secondaryForeground);
        }
        .message-box {
          margin: 12px 0;
          padding: 8px;
          border-radius: 4px;
          background: var(--vscode-input-background);
          border: 1px solid var(--vscode-input-border);
          font-family: var(--vscode-editor-font-family);
          font-size: 12px;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .error {
          color: var(--vscode-errorForeground);
          background: var(--vscode-inputValidation-errorBackground);
          border-color: var(--vscode-inputValidation-errorBorder);
          padding: 8px;
          border-radius: 4px;
          margin: 8px 0;
        }
        .info {
          color: var(--vscode-descriptionForeground);
          font-size: 12px;
          margin: 8px 0;
        }
        .loading {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--vscode-descriptionForeground);
        }
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid var(--vscode-foreground);
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        .actions button {
          flex: 1;
        }
        .hidden { display: none; }
      </style>
    </head>
    <body>
      <div id="no-api-key" class="hidden">
        <p class="info">Set your Gemini API key to get started.</p>
        <button class="primary" id="btn-set-key">Set API Key</button>
      </div>

      <div id="main-content" class="hidden">
        <button class="primary" id="btn-generate" disabled>
          Generate Commit Message
        </button>
        <p class="info" id="staged-info">No staged changes</p>

        <div id="loading" class="loading hidden">
          <div class="spinner"></div>
          <span>Generating...</span>
        </div>

        <div id="error" class="error hidden"></div>

        <div id="result" class="hidden">
          <div class="message-box" id="generated-message"></div>
          <div class="actions">
            <button class="primary" id="btn-insert">Insert to Git</button>
            <button class="secondary" id="btn-copy">Copy</button>
          </div>
        </div>
      </div>

      <script>
        const vscode = acquireVsCodeApi();

        const elements = {
          noApiKey: document.getElementById('no-api-key'),
          mainContent: document.getElementById('main-content'),
          btnSetKey: document.getElementById('btn-set-key'),
          btnGenerate: document.getElementById('btn-generate'),
          btnInsert: document.getElementById('btn-insert'),
          btnCopy: document.getElementById('btn-copy'),
          stagedInfo: document.getElementById('staged-info'),
          loading: document.getElementById('loading'),
          error: document.getElementById('error'),
          result: document.getElementById('result'),
          generatedMessage: document.getElementById('generated-message'),
        };

        let state = {
          hasApiKey: false,
          hasStagedChanges: false,
          isLoading: false,
          generatedMessage: null,
          error: null,
        };

        function updateUI() {
          // Show/hide sections based on API key
          elements.noApiKey.classList.toggle('hidden', state.hasApiKey);
          elements.mainContent.classList.toggle('hidden', !state.hasApiKey);

          // Update generate button
          elements.btnGenerate.disabled = !state.hasStagedChanges || state.isLoading;
          elements.stagedInfo.textContent = state.hasStagedChanges
            ? 'Ready to generate'
            : 'No staged changes';

          // Loading state
          elements.loading.classList.toggle('hidden', !state.isLoading);

          // Error state
          elements.error.classList.toggle('hidden', !state.error);
          if (state.error) {
            elements.error.textContent = state.error;
          }

          // Result
          elements.result.classList.toggle('hidden', !state.generatedMessage);
          if (state.generatedMessage) {
            elements.generatedMessage.textContent = state.generatedMessage;
          }
        }

        // Event listeners
        elements.btnSetKey.addEventListener('click', () => {
          vscode.postMessage({ command: 'setApiKey' });
        });

        elements.btnGenerate.addEventListener('click', () => {
          state.error = null;
          state.generatedMessage = null;
          updateUI();
          vscode.postMessage({ command: 'generateCommit' });
        });

        elements.btnInsert.addEventListener('click', () => {
          vscode.postMessage({ command: 'insertToGit', message: state.generatedMessage });
        });

        elements.btnCopy.addEventListener('click', () => {
          vscode.postMessage({ command: 'copyToClipboard', text: state.generatedMessage });
        });

        // Handle messages from extension
        window.addEventListener('message', (event) => {
          const message = event.data;

          switch (message.type) {
            case 'setState':
              state = { ...state, ...message.state };
              break;
            case 'loading':
              state.isLoading = message.isLoading;
              break;
            case 'commitGenerated':
              state.generatedMessage = message.message;
              state.error = null;
              break;
            case 'error':
              state.error = message.error;
              state.generatedMessage = null;
              break;
          }

          updateUI();
        });

        // Notify extension that webview is ready
        vscode.postMessage({ command: 'webviewReady' });
      </script>
    </body>
    </html>`;
  }
}
```

---

## 11. Entry Point

```typescript
// src/extension.ts

import * as vscode from 'vscode';
import { SidebarProvider } from './providers/sidebarProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('CleanCommit extension activated');

  // Register sidebar provider
  const sidebarProvider = new SidebarProvider(
    context.extensionUri,
    context.secrets
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'cleancommit.sidebar',
      sidebarProvider
    )
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('cleancommit.generateCommit', () => {
      vscode.commands.executeCommand('cleancommit.sidebar.focus');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('cleancommit.setApiKey', async () => {
      const apiKey = await vscode.window.showInputBox({
        prompt: 'Enter your Gemini API Key',
        password: true,
      });
      if (apiKey) {
        await context.secrets.store('cleancommit.apiKey', apiKey);
        vscode.window.showInformationMessage('API key saved!');
      }
    })
  );
}

export function deactivate() {}
```

---

## 12. Testing Strategy

### 12.1 Unit Tests

```typescript
// test/suite/gitService.test.ts

import * as assert from 'assert';
import { GitService } from '../../src/services/gitService';

suite('GitService Test Suite', () => {
  test('should return null when no repository', async () => {
    const service = new GitService();
    const diff = await service.getStagedDiff();
    assert.strictEqual(diff, null);
  });
});
```

### 12.2 Test Coverage Goals

| Área | Cobertura Objetivo |
|------|-------------------|
| GitService | 80% |
| GeminiService | 70% |
| SidebarProvider | 60% |
| Prompt utilities | 90% |

### 12.3 Manual Testing Checklist

- [ ] Probar en VS Code
- [ ] Probar en Cursor
- [ ] Probar en VSCodium
- [ ] Verificar theming claro/oscuro
- [ ] Verificar con/sin API key
- [ ] Verificar con/sin cambios staged
- [ ] Verificar manejo de errores de red
- [ ] Verificar rate limiting

---

## 13. Plan de Fases de Implementación

### Fase 1: Infraestructura Base (Día 1)

- [ ] Configurar `package.json` con contributions
- [ ] Crear estructura de carpetas
- [ ] Implementar `SidebarProvider` básico (solo HTML)
- [ ] Verificar que el sidebar aparece en VS Code y Cursor
- [ ] Crear icono SVG para el sidebar

### Fase 2: Git Integration (Día 2)

- [ ] Implementar `GitService`
- [ ] Obtener staged diff
- [ ] Detectar si hay cambios staged
- [ ] Insertar mensaje en input box
- [ ] Tests unitarios de GitService

### Fase 3: Gemini Integration (Día 3)

- [ ] Implementar `GeminiService`
- [ ] Configurar prompts
- [ ] Manejo de API key con SecretStorage
- [ ] Truncado de diffs grandes
- [ ] Tests unitarios de GeminiService

### Fase 4: UI Completa (Día 4)

- [ ] Implementar webview HTML/CSS/JS completo
- [ ] Protocolo de mensajes bidireccional
- [ ] Estados de loading/error/success
- [ ] Botones de copiar e insertar
- [ ] Theming agnóstico verificado

### Fase 5: Polish & Testing (Día 5)

- [ ] Manejo de todos los casos de error
- [ ] Testing manual en múltiples editores
- [ ] Documentación README
- [ ] Preparar para publicación

---

## 14. Límites y Validaciones

| Parámetro | Límite | Razón |
|-----------|--------|-------|
| Tamaño máximo de diff | 4000 chars (configurable) | Límite de tokens de Gemini |
| Timeout de API | 30 segundos | UX razonable |
| Retry attempts | 3 | Para errores transitorios |
| Backoff inicial | 1 segundo | Rate limiting |

---

## 15. Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| API de Git diferente en forks | Media | Alto | Usar API lógica, no DOM |
| Rate limiting de Gemini | Baja | Medio | Exponential backoff |
| Diffs muy grandes | Media | Medio | Truncado inteligente |
| Incompatibilidad de theming | Baja | Bajo | Solo CSS variables |
| API key expuesta | Baja | Alto | SecretStorage + nunca en logs |

---

## 16. Checklist Pre-Publicación

- [ ] `README.md` completo con screenshots
- [ ] `CHANGELOG.md` actualizado
- [ ] Icono 128x128 PNG
- [ ] License file
- [ ] `.vscodeignore` configurado
- [ ] Build sin warnings
- [ ] Tests pasando
- [ ] Probado en 3+ editores
- [ ] `.vsix` generado y probado manualmente
- [ ] Cuenta en VS Marketplace
- [ ] Cuenta en Open VSX

---

## 17. Feature: Git Changes Panel (v0.2.0)

### 17.1 Descripción

Panel integrado en el sidebar que permite a los usuarios visualizar y gestionar sus cambios de Git directamente desde la extensión, sin necesidad de cambiar al panel de Source Control nativo.

### 17.2 Mockup UI

```
┌─────────────────────────────────────┐
│  CleanCommit                        │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────────┐│
│  │ 📝 Commit Message               ││
│  │ ┌─────────────────────────────┐ ││
│  │ │ feat(auth): add login...   │ ││
│  │ └─────────────────────────────┘ ││
│  │ [✨ Generate]                   ││
│  └─────────────────────────────────┘│
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  📂 Changes (3)                     │
│  ┌─────────────────────────────────┐│
│  │ M  src/extension.ts             ││
│  │ M  src/services/git.ts          ││
│  │ A  src/utils/helper.ts          ││
│  └─────────────────────────────────┘│
│  [Stage All]  [Discard All]         │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  ✅ Staged Changes (2)              │
│  ┌─────────────────────────────────┐│
│  │ M  package.json                 ││
│  │ M  README.md                    ││
│  └─────────────────────────────────┘│
│  [Unstage All]                      │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  [        🚀 Commit        ]        │
│                                     │
└─────────────────────────────────────┘
```

### 17.3 Componentes UI

| Componente | Descripción |
|------------|-------------|
| **Commit Message Input** | Textarea editable para el mensaje de commit |
| **Generate Button** | Genera mensaje con IA (feature existente) |
| **Changes Section** | Lista de archivos modificados no staged |
| **Changes Counter** | Badge con número de archivos con cambios |
| **Stage All Button** | Añade todos los cambios al staging |
| **Discard All Button** | Descarta todos los cambios (con confirmación) |
| **Staged Section** | Lista de archivos en staging area |
| **Staged Counter** | Badge con número de archivos staged |
| **Unstage All Button** | Quita todos los archivos del staging |
| **Commit Button** | Ejecuta el commit con el mensaje actual |

### 17.4 Estados de Archivos (Iconos)

| Icono | Estado | Descripción |
|-------|--------|-------------|
| `M` | Modified | Archivo modificado |
| `A` | Added | Archivo nuevo |
| `D` | Deleted | Archivo eliminado |
| `R` | Renamed | Archivo renombrado |
| `U` | Untracked | Archivo sin seguimiento |

### 17.5 Nuevos Mensajes Webview

```typescript
// Mensajes adicionales: Webview → Extension Host
type WebviewToExtensionMessage =
  | { command: 'stageAll' }
  | { command: 'unstageAll' }
  | { command: 'discardAll' }
  | { command: 'commit'; message: string }
  | { command: 'refreshChanges' };

// Mensajes adicionales: Extension Host → Webview
type ExtensionToWebviewMessage =
  | { type: 'changesUpdated'; changes: FileChange[]; staged: FileChange[] }
  | { type: 'commitSuccess' }
  | { type: 'commitError'; error: string };

type FileChange = {
  path: string;
  fileName: string;
  status: 'M' | 'A' | 'D' | 'R' | 'U';
};
```

### 17.6 Extensiones al GitService

```typescript
// src/services/gitService.ts - Métodos adicionales

export class GitService {
  // ... métodos existentes ...

  /** Obtiene lista de archivos con cambios (no staged) */
  async getChanges(): Promise<FileChange[]> {
    const repo = this.getRepository();
    if (!repo) return [];

    return repo.state.workingTreeChanges.map(change => ({
      path: change.uri.fsPath,
      fileName: path.basename(change.uri.fsPath),
      status: this.mapStatus(change.status),
    }));
  }

  /** Obtiene lista de archivos staged */
  async getStagedChanges(): Promise<FileChange[]> {
    const repo = this.getRepository();
    if (!repo) return [];

    return repo.state.indexChanges.map(change => ({
      path: change.uri.fsPath,
      fileName: path.basename(change.uri.fsPath),
      status: this.mapStatus(change.status),
    }));
  }

  /** Stage todos los cambios */
  async stageAll(): Promise<void> {
    const repo = this.getRepository();
    if (!repo) throw new Error('No repository found');

    const uris = repo.state.workingTreeChanges.map(c => c.uri);
    await repo.add(uris);
  }

  /** Unstage todos los cambios */
  async unstageAll(): Promise<void> {
    const repo = this.getRepository();
    if (!repo) throw new Error('No repository found');

    const uris = repo.state.indexChanges.map(c => c.uri);
    await repo.revert(uris);
  }

  /** Descartar todos los cambios (working tree) */
  async discardAll(): Promise<void> {
    const repo = this.getRepository();
    if (!repo) throw new Error('No repository found');

    const uris = repo.state.workingTreeChanges.map(c => c.uri);
    await repo.clean(uris);
  }

  /** Ejecutar commit */
  async commit(message: string): Promise<void> {
    const repo = this.getRepository();
    if (!repo) throw new Error('No repository found');

    if (!message.trim()) {
      throw new Error('Commit message cannot be empty');
    }

    await repo.commit(message);
  }

  /** Suscribirse a cambios del repositorio */
  onDidChangeRepository(callback: () => void): vscode.Disposable {
    const repo = this.getRepository();
    if (!repo) {
      return { dispose: () => {} };
    }

    return repo.state.onDidChange(callback);
  }

  private mapStatus(status: number): FileChange['status'] {
    // VS Code Git Status enum mapping
    switch (status) {
      case 5: return 'M';  // MODIFIED
      case 1: return 'A';  // INDEX_ADDED
      case 6: return 'D';  // DELETED
      case 3: return 'R';  // INDEX_RENAMED
      case 7: return 'U';  // UNTRACKED
      default: return 'M';
    }
  }
}
```

### 17.7 Actualización del SidebarProvider

```typescript
// Añadir en resolveWebviewView()
private setupRepositoryWatcher(): void {
  const disposable = this.gitService.onDidChangeRepository(() => {
    this.sendChangesUpdate();
  });

  this.disposables.push(disposable);
}

private async sendChangesUpdate(): Promise<void> {
  const changes = await this.gitService.getChanges();
  const staged = await this.gitService.getStagedChanges();

  this.postMessage({
    type: 'changesUpdated',
    changes,
    staged,
  });
}

// Añadir handlers para nuevos comandos
private async handleMessage(message: WebviewToExtensionMessage): Promise<void> {
  switch (message.command) {
    // ... casos existentes ...

    case 'stageAll':
      await this.gitService.stageAll();
      await this.sendChangesUpdate();
      break;

    case 'unstageAll':
      await this.gitService.unstageAll();
      await this.sendChangesUpdate();
      break;

    case 'discardAll':
      const confirm = await vscode.window.showWarningMessage(
        'Discard all changes? This cannot be undone.',
        { modal: true },
        'Discard'
      );
      if (confirm === 'Discard') {
        await this.gitService.discardAll();
        await this.sendChangesUpdate();
      }
      break;

    case 'commit':
      try {
        await this.gitService.commit(message.message);
        this.postMessage({ type: 'commitSuccess' });
        vscode.window.showInformationMessage('Commit created successfully!');
        await this.sendChangesUpdate();
      } catch (error) {
        this.postMessage({
          type: 'commitError',
          error: (error as Error).message,
        });
      }
      break;

    case 'refreshChanges':
      await this.sendChangesUpdate();
      break;
  }
}
```

### 17.8 Estilos CSS Adicionales

```css
/* Sección de cambios */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  color: var(--vscode-foreground);
}

.counter {
  background: var(--vscode-badge-background);
  color: var(--vscode-badge-foreground);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: normal;
}

.file-list {
  max-height: 150px;
  overflow-y: auto;
  margin: 4px 0;
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  font-size: 12px;
  font-family: var(--vscode-editor-font-family);
}

.file-item:hover {
  background: var(--vscode-list-hoverBackground);
}

.file-status {
  width: 16px;
  margin-right: 8px;
  font-weight: bold;
}

.file-status.modified { color: var(--vscode-gitDecoration-modifiedResourceForeground); }
.file-status.added { color: var(--vscode-gitDecoration-addedResourceForeground); }
.file-status.deleted { color: var(--vscode-gitDecoration-deletedResourceForeground); }
.file-status.untracked { color: var(--vscode-gitDecoration-untrackedResourceForeground); }

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.button-row {
  display: flex;
  gap: 8px;
  margin: 8px 0;
}

.button-row button {
  flex: 1;
  padding: 4px 8px;
  font-size: 11px;
}

.btn-danger {
  background: var(--vscode-inputValidation-errorBackground);
  color: var(--vscode-errorForeground);
}

.btn-danger:hover {
  opacity: 0.9;
}

.divider {
  height: 1px;
  background: var(--vscode-panel-border);
  margin: 12px 0;
}

.commit-input {
  width: 100%;
  min-height: 60px;
  padding: 8px;
  border: 1px solid var(--vscode-input-border);
  border-radius: 4px;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  font-family: var(--vscode-editor-font-family);
  font-size: 12px;
  resize: vertical;
}

.commit-input:focus {
  outline: 1px solid var(--vscode-focusBorder);
}

.btn-commit {
  margin-top: 12px;
  padding: 10px;
  font-size: 13px;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 12px;
  color: var(--vscode-descriptionForeground);
  font-size: 12px;
  font-style: italic;
}
```

### 17.9 Plan de Implementación v0.2.0

#### Fase 1: Extensión GitService

- [ ] Implementar `getChanges()` y `getStagedChanges()`
- [ ] Implementar `stageAll()`, `unstageAll()`, `discardAll()`
- [ ] Implementar `commit(message)`
- [ ] Implementar `onDidChangeRepository()` para reactividad
- [ ] Tests unitarios para nuevos métodos

#### Fase 2: UI del Panel de Cambios

- [ ] Añadir sección "Changes" al HTML
- [ ] Añadir sección "Staged Changes" al HTML
- [ ] Implementar rendering de lista de archivos
- [ ] Añadir iconos de estado por tipo de cambio
- [ ] Añadir counters en headers de sección

#### Fase 3: Acciones de Git

- [ ] Implementar handler `stageAll`
- [ ] Implementar handler `unstageAll`
- [ ] Implementar handler `discardAll` con confirmación
- [ ] Conectar botones a handlers

#### Fase 4: Commit Flow

- [ ] Añadir textarea editable para mensaje
- [ ] Conectar "Generate" para llenar el textarea
- [ ] Implementar botón "Commit"
- [ ] Feedback visual de éxito/error
- [ ] Limpiar UI post-commit

#### Fase 5: Reactividad

- [ ] Suscribirse a cambios del repositorio
- [ ] Auto-refresh de listas al detectar cambios
- [ ] Debounce para evitar actualizaciones excesivas
- [ ] Testing de flujo completo

### 17.10 Consideraciones de UX

| Aspecto | Decisión |
|---------|----------|
| **Confirmación Discard** | Modal de confirmación obligatorio |
| **Commit vacío** | Deshabilitar botón si no hay mensaje |
| **Sin staged changes** | Deshabilitar botón Commit, mostrar mensaje |
| **Scroll en listas** | Max-height con overflow para listas largas |
| **Feedback** | Toast notifications para acciones exitosas |
| **Loading states** | Spinner en botones durante operaciones |

### 17.11 Riesgos Específicos

| Riesgo | Mitigación |
|--------|------------|
| Pérdida de cambios con Discard | Confirmación modal obligatoria |
| Conflictos durante commit | Mostrar error claro, sugerir resolver |
| Performance con muchos archivos | Virtualización de listas si >100 archivos |
| Desync entre UI y estado real | Watcher de repositorio + refresh manual |
