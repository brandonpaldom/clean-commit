(function () {
  const vscode = acquireVsCodeApi();

  const elements = {
    noApiKey: document.getElementById('no-api-key'),
    mainContent: document.getElementById('main-content'),
    btnSetKey: document.getElementById('btn-set-key'),
    btnGenerate: document.getElementById('btn-generate'),
    btnInsert: document.getElementById('btn-insert'),
    btnCopy: document.getElementById('btn-copy'),
    btnSettings: document.getElementById('btn-settings'),
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

  // Initial state request
  vscode.postMessage({ command: 'webviewReady' });

  // Handle messages from extension
  window.addEventListener('message', event => {
    const message = event.data;

    switch (message.type) {
      case 'setState':
        state = { ...state, ...message.state };
        updateUI();
        break;

      case 'commitGenerated':
        state.generatedMessage = message.message;
        state.error = null;
        updateUI();
        break;

      case 'error':
        state.error = message.error;
        state.generatedMessage = null;
        updateUI();
        break;

      case 'loading':
        state.isLoading = message.isLoading;
        updateUI();
        break;

      case 'diffInfo':
        // Optional: show more details about changes
        break;
    }
  });

  function updateUI() {
    // Show/hide sections based on API key
    elements.noApiKey.classList.toggle('hidden', state.hasApiKey);
    elements.mainContent.classList.toggle('hidden', !state.hasApiKey);

    // Update Generate button
    elements.btnGenerate.disabled = !state.hasStagedChanges || state.isLoading;
    elements.stagedInfo.textContent = state.hasStagedChanges 
      ? 'Staged changes detected' 
      : 'No staged changes found';

    // Loading state
    elements.loading.classList.toggle('hidden', !state.isLoading);
    if (state.isLoading) {
      elements.error.classList.add('hidden');
      elements.result.classList.add('hidden');
    }

    // Error state
    if (state.error) {
      elements.error.textContent = state.error;
      elements.error.classList.remove('hidden');
    } else {
      elements.error.classList.add('hidden');
    }

    // Result state
    if (state.generatedMessage) {
      elements.generatedMessage.textContent = state.generatedMessage;
      elements.result.classList.remove('hidden');
    } else {
      elements.result.classList.add('hidden');
    }
  }

  // Event Listeners
  elements.btnSetKey.addEventListener('click', () => {
    vscode.postMessage({ command: 'setApiKey' });
  });

  elements.btnGenerate.addEventListener('click', () => {
    vscode.postMessage({ command: 'generateCommit' });
  });

  elements.btnInsert.addEventListener('click', () => {
    vscode.postMessage({ 
      command: 'insertToGit', 
      message: state.generatedMessage 
    });
  });

  elements.btnCopy.addEventListener('click', () => {
    vscode.postMessage({ 
      command: 'copyToClipboard', 
      text: state.generatedMessage 
    });
  });

  elements.btnSettings.addEventListener('click', () => {
    vscode.postMessage({ command: 'openSettings' });
  });

}());
