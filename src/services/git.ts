import * as vscode from 'vscode';

export interface API {
  readonly repositories: Repository[];
  onDidOpenRepository: vscode.Event<Repository>;
  onDidCloseRepository: vscode.Event<Repository>;
}

export interface Repository {
  readonly state: RepositoryState;
  readonly inputBox: InputBox;
  diff(staged?: boolean): Promise<string>;
  add(resources: (vscode.Uri | string)[]): Promise<void>;
  revert(resources: (vscode.Uri | string)[]): Promise<void>;
  clean(resources: (vscode.Uri | string)[]): Promise<void>;
  commit(message: string): Promise<void>;
}

export interface RepositoryState {
  readonly indexChanges: Change[];
  readonly workingTreeChanges: Change[];
  onDidChange(callback: () => void): vscode.Disposable;
}

export interface Change {
  readonly uri: vscode.Uri;
  readonly status: number;
}

export interface InputBox {
  value: string;
}
