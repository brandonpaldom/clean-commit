import * as vscode from 'vscode';

export interface API {
  readonly repositories: Repository[];
}

export interface Repository {
  readonly state: RepositoryState;
  readonly inputBox: InputBox;
  diff(staged?: boolean): Promise<string>;
}

export interface RepositoryState {
  readonly indexChanges: Change[];
}

export interface Change {
  readonly uri: vscode.Uri;
}

export interface InputBox {
  value: string;
}
