import * as vscode from 'vscode';
import * as path from 'path';
import type { API as GitAPI, Repository } from './git';

export type FileChangeStatus = 'M' | 'A' | 'D' | 'R' | 'U';

export interface FileChange {
  path: string;
  fileName: string;
  status: FileChangeStatus;
}

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
    // Return the first repository for simplicity in MVP/v0.2.0
    return this.gitApi.repositories[0];
  }

  async getChanges(): Promise<FileChange[]> {
    const repo = this.getRepository();
    if (!repo) {
      return [];
    }

    return repo.state.workingTreeChanges.map(change => ({
      path: change.uri.fsPath,
      fileName: path.basename(change.uri.fsPath),
      status: this.mapStatus(change.status),
    }));
  }

  async getStagedChanges(): Promise<FileChange[]> {
    const repo = this.getRepository();
    if (!repo) {
      return [];
    }

    return repo.state.indexChanges.map(change => ({
      path: change.uri.fsPath,
      fileName: path.basename(change.uri.fsPath),
      status: this.mapStatus(change.status),
    }));
  }

  async stageAll(): Promise<void> {
    const repo = this.getRepository();
    if (!repo) {
      throw new Error('No repository found');
    }

    const paths = repo.state.workingTreeChanges.map(c => c.uri.fsPath);
    console.log(`[GitService] Attempting to stage ${paths.length} files:`, paths);
    
    if (paths.length > 0) {
      try {
        await repo.add(paths);
        console.log('[GitService] Stage All successful');
      } catch (err) {
        console.error('[GitService] repo.add failed:', err);
        throw err;
      }
    }
  }

  async unstageAll(): Promise<void> {
    const repo = this.getRepository();
    if (!repo) {
      throw new Error('No repository found');
    }

    const paths = repo.state.indexChanges.map(c => c.uri.fsPath);
    if (paths.length > 0) {
      await repo.revert(paths);
    }
  }

  async discardAll(): Promise<void> {
    const repo = this.getRepository();
    if (!repo) {
      throw new Error('No repository found');
    }

    const paths = repo.state.workingTreeChanges.map(c => c.uri.fsPath);
    if (paths.length > 0) {
      await repo.clean(paths);
    }
  }

  async stageFile(filePath: string): Promise<void> {
    const repo = this.getRepository();
    if (!repo) {
      throw new Error('No repository found');
    }
    await repo.add([filePath]);
  }

  async unstageFile(filePath: string): Promise<void> {
    const repo = this.getRepository();
    if (!repo) {
      throw new Error('No repository found');
    }
    await repo.revert([filePath]);
  }

  async discardFile(filePath: string): Promise<void> {
    const repo = this.getRepository();
    if (!repo) {
      throw new Error('No repository found');
    }
    await repo.clean([filePath]);
  }

  async commit(message: string): Promise<void> {
    const repo = this.getRepository();
    if (!repo) {
      throw new Error('No repository found');
    }

    if (!message.trim()) {
      throw new Error('Commit message cannot be empty');
    }

    await repo.commit(message);
  }

  onDidChangeRepository(callback: () => void): vscode.Disposable {
    const repo = this.getRepository();
    if (!repo) {
      return { dispose: () => {} };
    }

    return repo.state.onDidChange(callback);
  }

  async getStagedDiff(): Promise<string | null> {
    const repo = this.getRepository();
    if (!repo) {
      return null;
    }

    // true = staged only
    const diff = await repo.diff(true);
    return diff || null;
  }

  setCommitMessage(message: string): boolean {
    const repo = this.getRepository();
    if (!repo) {
      return false;
    }

    repo.inputBox.value = message;
    return true;
  }

  private mapStatus(status: number | undefined): FileChangeStatus {
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
