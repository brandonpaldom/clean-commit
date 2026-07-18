const vscode = acquireVsCodeApi();

const elements = {
  noApiKey: document.getElementById('no-api-key'),
  noApiKeyText: document.getElementById('no-api-key-text'),
  btnSetKey: document.getElementById('btn-set-key'),
  btnChangeKey: document.getElementById('btn-change-key'),
  btnResetModel: document.getElementById('btn-reset-model'),
  btnGenerate: document.getElementById('btn-generate'),
  btnRegenerate: document.getElementById('btn-regenerate'),
  btnCommit: document.getElementById('btn-commit'),
  btnRefresh: document.getElementById('btn-refresh'),
  btnStageAll: document.getElementById('btn-stage-all'),
  btnUnstageAll: document.getElementById('btn-unstage-all'),
  btnDiscardAll: document.getElementById('btn-discard-all'),
  btnSettings: document.getElementById('btn-settings'),
  commitMessage: document.getElementById('commit-message'),
  loading: document.getElementById('loading'),
  error: document.getElementById('error'),
  success: document.getElementById('success'),
  repositoryState: document.getElementById('repository-state'),
  operationStatus: document.getElementById('operation-status'),
  operationLabel: document.getElementById('operation-label'),
  changesActions: document.getElementById('changes-actions'),
  changesList: document.getElementById('changes-list'),
  stagedList: document.getElementById('staged-list'),
  changesCount: document.getElementById('changes-count'),
  stagedCount: document.getElementById('staged-count'),
  providerBadge: document.getElementById('provider-badge'),
  providerModel: document.getElementById('provider-model'),
  providerSelect: document.getElementById('provider-select'),
  languageSelect: document.getElementById('language-select'),
  includeBody: document.getElementById('include-body'),
};

let state = {
  hasApiKey: false,
  hasRepository: false,
  hasStagedChanges: false,
  isLoading: false,
  isOperating: false,
  operationLabel: '',
  hasGenerated: false,
  error: null,
  success: null,
  changesCount: 0,
  stagedCount: 0,
  currentProvider: 'gemini',
  providerLabel: 'Google Gemini',
  providerModel: '',
  language: 'en',
  includeBody: false,
};

function updateUI() {
  elements.noApiKey.classList.toggle('hidden', state.hasApiKey);

  // Update the no-api-key message with current provider
  if (elements.noApiKeyText) {
    elements.noApiKeyText.textContent = `Set your ${state.providerLabel} API key to get started.`;
  }

  // Update provider badge
  if (elements.providerBadge) {
    elements.providerBadge.textContent = state.providerLabel;
  }
  elements.providerModel.textContent = state.providerModel;
  elements.providerSelect.value = state.currentProvider;
  elements.languageSelect.value = state.language;
  elements.includeBody.checked = state.includeBody;

  const isBusy = state.isLoading || state.isOperating;

  elements.btnGenerate.disabled = !state.hasApiKey || !state.hasStagedChanges || isBusy;
  elements.btnRegenerate.classList.toggle('hidden', !state.hasGenerated);
  elements.btnRegenerate.disabled = !state.hasApiKey || !state.hasStagedChanges || isBusy;
  elements.btnCommit.disabled = !state.hasRepository || !state.hasStagedChanges || isBusy || !elements.commitMessage.value.trim();
  elements.btnStageAll.disabled = isBusy;
  elements.btnUnstageAll.disabled = isBusy;
  elements.btnDiscardAll.disabled = isBusy;
  elements.btnRefresh.disabled = isBusy;
  elements.providerSelect.disabled = isBusy;
  elements.languageSelect.disabled = isBusy;
  elements.includeBody.disabled = isBusy;
  elements.btnResetModel.disabled = isBusy;
  elements.btnUnstageAll.classList.toggle('hidden', state.stagedCount === 0);
  elements.changesActions.classList.toggle('hidden', state.changesCount === 0);
  document.querySelectorAll('.file-actions button').forEach(button => {
    button.disabled = isBusy;
  });

  elements.loading.classList.toggle('hidden', !state.isLoading);
  elements.operationStatus.classList.toggle('hidden', !state.isOperating);
  elements.operationLabel.textContent = state.operationLabel || 'Updating repository...';

  const repositoryMessage = !state.hasRepository
    ? 'No Git repository found. Open a folder containing a Git repository.'
    : state.changesCount === 0 && state.stagedCount === 0
      ? 'Repository is clean. There are no changes to commit.'
      : '';
  elements.repositoryState.classList.toggle('hidden', !repositoryMessage);
  elements.repositoryState.textContent = repositoryMessage;

  elements.error.classList.toggle('hidden', !state.error);
  if (state.error) {
    elements.error.textContent = state.error;
  }

  elements.success.classList.toggle('hidden', !state.success);
  if (state.success) {
    elements.success.textContent = state.success;
  }
  
  // Refresh icons for static elements if needed
  lucide.createIcons();
}

function createFileItem(file, isStaged) {
  const div = document.createElement('div');
  div.className = 'file-item';

  const status = document.createElement('span');
  status.className = `file-status ${file.status}`;
  status.title = getStatusLabel(file.status);
  status.textContent = file.status;

  const name = document.createElement('span');
  name.className = 'file-name';
  name.title = file.path;
  name.textContent = file.fileName;

  const actions = document.createElement('div');
  actions.className = 'file-actions';

  if (isStaged) {
    actions.appendChild(createFileAction(
      'btn-unstage-file',
      'Unstage file',
      'minus-circle',
      'unstageFile',
      file.path
    ));
  } else {
    actions.appendChild(createFileAction(
      'btn-stage-file',
      'Stage file',
      'plus-circle',
      'stageFile',
      file.path
    ));
    actions.appendChild(createFileAction(
      'btn-discard-file',
      'Discard changes',
      'trash-2',
      'discardFile',
      file.path
    ));
  }

  div.append(status, name, actions);

  return div;
}

function createFileAction(className, label, iconName, command, filePath) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.title = label;
  button.setAttribute('aria-label', label);

  const icon = document.createElement('i');
  icon.dataset.lucide = iconName;
  button.appendChild(icon);

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    vscode.postMessage({ command, path: filePath });
  });

  return button;
}

function getStatusLabel(status) {
  switch (status) {
    case 'M': return 'Modified';
    case 'A': return 'Added';
    case 'D': return 'Deleted';
    case 'R': return 'Renamed';
    case 'U': return 'Untracked';
    default: return 'Changed';
  }
}

function renderFileList(container, files, emptyText, isStaged) {
  container.replaceChildren();
  if (files.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = emptyText;
    container.appendChild(empty);
    return;
  }

  files.forEach(file => {
    container.appendChild(createFileItem(file, isStaged));
  });
  
  // Initialize newly added icons
  lucide.createIcons();
}

// Event Listeners
elements.btnSetKey.addEventListener('click', () => {
  vscode.postMessage({ command: 'setApiKey' });
});

elements.btnChangeKey?.addEventListener('click', () => {
  vscode.postMessage({ command: 'setApiKey' });
});

elements.btnResetModel.addEventListener('click', () => {
  vscode.postMessage({ command: 'resetModel' });
});

elements.providerSelect.addEventListener('change', () => {
  vscode.postMessage({ command: 'changeProvider', provider: elements.providerSelect.value });
});

elements.languageSelect.addEventListener('change', () => {
  vscode.postMessage({ command: 'changeLanguage', language: elements.languageSelect.value });
});

elements.includeBody.addEventListener('change', () => {
  vscode.postMessage({ command: 'changeIncludeBody', includeBody: elements.includeBody.checked });
});

elements.btnGenerate.addEventListener('click', () => {
  state.error = null;
  state.success = null;
  updateUI();
  vscode.postMessage({ command: 'generateCommit' });
});

elements.btnRegenerate.addEventListener('click', () => {
  state.error = null;
  state.success = null;
  updateUI();
  vscode.postMessage({ command: 'generateCommit' });
});

elements.btnCommit.addEventListener('click', () => {
  const message = elements.commitMessage.value.trim();
  if (message) {
    vscode.postMessage({ command: 'commit', message });
  }
});

elements.btnRefresh.addEventListener('click', () => {
  vscode.postMessage({ command: 'refreshChanges' });
});

elements.btnStageAll.addEventListener('click', () => {
  vscode.postMessage({ command: 'stageAll' });
});

elements.btnUnstageAll.addEventListener('click', () => {
  vscode.postMessage({ command: 'unstageAll' });
});

elements.btnDiscardAll.addEventListener('click', () => {
  vscode.postMessage({ command: 'discardAll' });
});

elements.btnSettings.addEventListener('click', () => {
  vscode.postMessage({ command: 'openSettings' });
});

elements.commitMessage.addEventListener('input', () => {
  updateUI();
});

// Handle messages from extension
window.addEventListener('message', (event) => {
  const message = event.data;

  switch (message.type) {
    case 'setState':
      state = { ...state, ...message.state };
      if (message.state.generatedMessage) {
        elements.commitMessage.value = message.state.generatedMessage;
      }
      break;

    case 'loading':
      state.isLoading = message.isLoading;
      break;

    case 'commitGenerated':
      elements.commitMessage.value = message.message;
      state.hasGenerated = true;
      state.error = null;
      break;

    case 'changesUpdated':
      renderFileList(elements.changesList, message.changes, 'No changes', false);
      renderFileList(elements.stagedList, message.staged, 'No staged changes', true);
      elements.changesCount.textContent = message.changes.length;
      elements.stagedCount.textContent = message.staged.length;
      state.hasStagedChanges = message.staged.length > 0;
      state.hasRepository = message.hasRepository;
      state.changesCount = message.changes.length;
      state.stagedCount = message.staged.length;
      break;

    case 'operation':
      state.isOperating = message.isLoading;
      state.operationLabel = message.label || '';
      if (message.isLoading) {
        state.error = null;
        state.success = null;
      }
      break;

    case 'commitSuccess':
      elements.commitMessage.value = '';
      state.hasGenerated = false;
      state.error = null;
      state.success = 'Commit created successfully.';
      break;

    case 'error':
      state.error = message.error;
      state.success = null;
      break;
  }

  updateUI();
});

// Notify extension that webview is ready
vscode.postMessage({ command: 'webviewReady' });
