import * as vscode from 'vscode';
import type { API as GitAPI, Repository } from './git';

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
    // Return the first repository for simplicity in MVP
    return this.gitApi.repositories[0];
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

  async getStagedChangesInfo(): Promise<{ files: number; insertions: number; deletions: number } | null> {
    const repo = this.getRepository();
    if (!repo) {
      return null;
    }

    const changes = repo.state.indexChanges;
    // Note: To get accurate insertions/deletions we would need to parse the diff
    // For now we just return the file count
    return {
      files: changes.length,
      insertions: 0, 
      deletions: 0,
    };
  }

  setCommitMessage(message: string): boolean {
    const repo = this.getRepository();
    if (!repo) {
      return false;
    }

    repo.inputBox.value = message;
    return true;
  }
}
