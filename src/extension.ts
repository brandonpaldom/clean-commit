import * as vscode from 'vscode';
import { SidebarProvider } from './providers/sidebarProvider';

export function activate(context: vscode.ExtensionContext) {
	console.log('CleanCommit is now active');

	const sidebarProvider = new SidebarProvider(context.extensionUri, context.secrets);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			'cleancommit.sidebar',
			sidebarProvider
		)
	);

	// Register commands
	context.subscriptions.push(
		vscode.commands.registerCommand('cleancommit.setApiKey', async () => {
			// This is also handled by the sidebar, but we expose it as a command too
			const apiKey = await vscode.window.showInputBox({
				prompt: 'Enter your Gemini API Key',
				password: true,
				placeHolder: 'AIza...',
			});

			if (apiKey) {
				await context.secrets.store('cleancommit.apiKey', apiKey);
				vscode.window.showInformationMessage('API key saved successfully!');
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('cleancommit.generateCommit', () => {
			// Focus the sidebar when the command is run
			vscode.commands.executeCommand('cleancommit.sidebar.focus');
		})
	);
}

export function deactivate() {}
