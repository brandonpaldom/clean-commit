const vscode = acquireVsCodeApi();

const elements = {
  noApiKey: document.getElementById('no-api-key'),
  mainContent: document.getElementById('main-content'),
  btnSetKey: document.getElementById('btn-set-key'),
  btnGenerate: document.getElementById('btn-generate'),
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
};

let state = {
  hasApiKey: false,
  hasStagedChanges: false,
  isLoading: false,
  error: null,
};

function updateUI() {
  elements.noApiKey.classList.toggle('hidden', state.hasApiKey);
  elements.mainContent.classList.toggle('hidden', !state.hasApiKey);

  elements.btnGenerate.disabled = !state.hasStagedChanges || state.isLoading;
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
  
  const actionsHtml = isStaged 
    ? `<button class="btn-unstage-file" title="Unstage file"><i data-lucide="minus-circle"></i></button>`
    : `<button class="btn-stage-file" title="Stage file"><i data-lucide="plus-circle"></i></button>
       <button class="btn-discard-file" title="Discard changes"><i data-lucide="trash-2"></i></button>`;

  div.innerHTML = `
    <span class="file-status ${file.status}" title="${getStatusLabel(file.status)}">${file.status}</span>
    <span class="file-name" title="${file.path}">${file.fileName}</span>
    <div class="file-actions">
      ${actionsHtml}
    </div>
  `;

  // Event Listeners for actions
  const btnStage = div.querySelector('.btn-stage-file');
  if (btnStage) {
    btnStage.addEventListener('click', (e) => {
      e.stopPropagation();
      vscode.postMessage({ command: 'stageFile', path: file.path });
    });
  }

  const btnUnstage = div.querySelector('.btn-unstage-file');
  if (btnUnstage) {
    btnUnstage.addEventListener('click', (e) => {
      e.stopPropagation();
      vscode.postMessage({ command: 'unstageFile', path: file.path });
    });
  }

  const btnDiscard = div.querySelector('.btn-discard-file');
  if (btnDiscard) {
    btnDiscard.addEventListener('click', (e) => {
      e.stopPropagation();
      vscode.postMessage({ command: 'discardFile', path: file.path });
    });
  }

  return div;
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
  container.innerHTML = '';
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

elements.btnGenerate.addEventListener('click', () => {
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
