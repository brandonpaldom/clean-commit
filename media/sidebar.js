const vscode = acquireVsCodeApi();

const elements = {
  noApiKey: document.getElementById('no-api-key'),
  noApiKeyText: document.getElementById('no-api-key-text'),
  mainContent: document.getElementById('main-content'),
  btnSetKey: document.getElementById('btn-set-key'),
  btnChangeKey: document.getElementById('btn-change-key'),
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
  changesList: document.getElementById('changes-list'),
  stagedList: document.getElementById('staged-list'),
  changesCount: document.getElementById('changes-count'),
  stagedCount: document.getElementById('staged-count'),
  providerBadge: document.getElementById('provider-badge'),
};

let state = {
  hasApiKey: false,
  hasStagedChanges: false,
  isLoading: false,
  hasGenerated: false,
  error: null,
  currentProvider: 'gemini',
  providerLabel: 'Google Gemini',
};

function updateUI() {
  elements.noApiKey.classList.toggle('hidden', state.hasApiKey);
  elements.mainContent.classList.toggle('hidden', !state.hasApiKey);

  // Update the no-api-key message with current provider
  if (elements.noApiKeyText) {
    elements.noApiKeyText.textContent = `Set your ${state.providerLabel} API key to get started.`;
  }

  // Update provider badge
  if (elements.providerBadge) {
    elements.providerBadge.textContent = state.providerLabel;
  }

  elements.btnGenerate.disabled = !state.hasStagedChanges || state.isLoading;
  elements.btnRegenerate.classList.toggle('hidden', !state.hasGenerated);
  elements.btnRegenerate.disabled = !state.hasStagedChanges || state.isLoading;
  elements.btnCommit.disabled = !state.hasStagedChanges || state.isLoading || !elements.commitMessage.value.trim();

  elements.loading.classList.toggle('hidden', !state.isLoading);

  elements.error.classList.toggle('hidden', !state.error);
  if (state.error) {
    elements.error.textContent = state.error;
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

elements.btnGenerate.addEventListener('click', () => {
  state.error = null;
  updateUI();
  vscode.postMessage({ command: 'generateCommit' });
});

elements.btnRegenerate.addEventListener('click', () => {
  state.error = null;
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
      break;

    case 'commitSuccess':
      elements.commitMessage.value = '';
      state.hasGenerated = false;
      state.error = null;
      break;

    case 'error':
      state.error = message.error;
      break;
  }

  updateUI();
});

// Notify extension that webview is ready
vscode.postMessage({ command: 'webviewReady' });
