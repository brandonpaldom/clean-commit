# CleanCommit

AI-powered commit message generator that follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.

Generate clear, consistent, and meaningful commit messages in seconds.

![CleanCommit Demo](resources/demo.gif)

## Features

- **AI-Generated Messages**: Automatically generates commit messages based on your staged changes
- **Conventional Commits**: All messages follow the standard format (`feat`, `fix`, `docs`, `refactor`, etc.)
- **Git Integration**: View, stage, unstage, and discard changes directly from the sidebar
- **One-Click Commit**: Commit your changes without leaving the panel
- **Multi-Language**: Generate messages in English or Spanish
- **Cross-Compatible**: Works with VS Code, Cursor, Windsurf, VSCodium, and other VS Code-based editors

## Installation

1. Open your editor's Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`)
2. Search for **CleanCommit**
3. Click **Install**

Or install from the command line:

```bash
code --install-extension cleancommit-dev.clean-commit
```

## Getting Started

### 1. Get a Gemini API Key

CleanCommit uses Google Gemini to generate commit messages. Get your free API key:

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy your new API key

### 2. Configure the Extension

1. Open the CleanCommit panel from the sidebar (look for the CleanCommit icon)
2. Click **Set API Key**
3. Paste your Gemini API key
4. You're ready to go!

> Your API key is stored securely in your editor's secret storage and never leaves your machine except to communicate with Google's API.

## Usage

### Generate a Commit Message

1. Stage your changes (using Git or the CleanCommit panel)
2. Click **Generate** in the CleanCommit sidebar
3. Review the generated message
4. Click **Commit** to create the commit, or **Copy** to use it elsewhere

### Manage Changes

The CleanCommit panel shows your repository status:

| Section | Description |
|---------|-------------|
| **Changes** | Files with uncommitted modifications |
| **Staged Changes** | Files ready to be committed |

Available actions:
- **Stage All**: Add all changes to staging
- **Unstage All**: Remove all files from staging
- **Discard All**: Revert all changes (requires confirmation)
- **Commit**: Create a commit with the current message

## Settings

Configure CleanCommit in your editor settings (`Ctrl+,` / `Cmd+,`):

| Setting | Description | Default |
|---------|-------------|---------|
| `cleancommit.language` | Language for commit messages (`en` or `es`) | `en` |
| `cleancommit.includeBody` | Include detailed body in commit message | `false` |
| `cleancommit.maxDiffSize` | Maximum diff size sent for analysis (characters) | `4000` |

## Commands

Access these commands via the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command | Description |
|---------|-------------|
| `CleanCommit: Generate Commit Message` | Generate a message for staged changes |
| `CleanCommit: Set Gemini API Key` | Configure or update your API key |

## Compatibility

CleanCommit is designed to work with:

- VS Code 1.90.0+
- Cursor
- Windsurf
- VSCodium
- Other VS Code-based editors

## Requirements

- Git must be installed and available in your PATH
- A Google Gemini API key (free tier available)

## Privacy

- Your API key is stored locally in your editor's secure storage
- Only your staged diff content is sent to Google Gemini for analysis
- No telemetry or usage data is collected

## Troubleshooting

### "No staged changes found"
Make sure you have staged some files before generating a commit message. Use `git add` or the **Stage All** button.

### "API key not set"
Click **Set API Key** in the sidebar or run the command `CleanCommit: Set Gemini API Key`.

### "Failed to generate message"
- Check your internet connection
- Verify your API key is valid
- If the diff is very large, try staging fewer files

### Extension not appearing in sidebar
Restart your editor. If the issue persists, check that the Git extension is enabled.

## Feedback & Support

Found a bug or have a feature request?

- [Open an issue](https://github.com/cleancommit-dev/clean-commit/issues)
- [View source code](https://github.com/cleancommit-dev/clean-commit)

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Happy committing!**
