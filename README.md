# CleanCommit

AI-powered commit message generator that follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.

Generate clear, consistent, and meaningful commit messages in seconds using your favorite AI provider.

![CleanCommit Demo](resources/demo.gif)

## Features

- **Multi-Provider Support**: Choose from Google Gemini, OpenAI, Groq, or OpenRouter
- **AI-Generated Messages**: Automatically generates commit messages based on your staged changes
- **Conventional Commits**: All messages follow the standard format (`feat`, `fix`, `docs`, `refactor`, etc.)
- **Git Integration**: View, stage, unstage, and discard changes directly from the sidebar
- **One-Click Commit**: Commit your changes without leaving the panel
- **Multi-Language**: Generate messages in English or Spanish
- **Cross-Compatible**: Works with VS Code, Cursor, Windsurf, VSCodium, and other VS Code-based editors

## Supported AI Providers

| Provider | Model | Pricing |
|----------|-------|---------|
| **Google Gemini** (default) | `gemini-2.5-flash` | Free tier available |
| **OpenAI** | `gpt-4o-mini` | ~$0.15/1M tokens |
| **Groq** | `llama-3.3-70b-versatile` | Free tier available |
| **OpenRouter** | `google/gemini-2.0-flash-001` | Pay-as-you-go |

## Installation

1. Open your editor's Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`)
2. Search for **CleanCommit**
3. Click **Install**

Or install from the command line:

```bash
code --install-extension cleancommit-dev.clean-commit
```

## Getting Started

### 1. Get an API Key

CleanCommit supports multiple AI providers. Choose one and get your API key:

| Provider | Get API Key |
|----------|-------------|
| Google Gemini | [Google AI Studio](https://aistudio.google.com/apikey) |
| OpenAI | [OpenAI Platform](https://platform.openai.com/api-keys) |
| Groq | [Groq Console](https://console.groq.com/keys) |
| OpenRouter | [OpenRouter Keys](https://openrouter.ai/keys) |

### 2. Configure the Extension

1. Open the CleanCommit panel from the sidebar (look for the CleanCommit icon)
2. Click **Set API Key**
3. Paste your API key
4. You're ready to go!

### 3. Change Provider (Optional)

1. Open Settings (`Ctrl+,` / `Cmd+,`)
2. Search for `cleancommit.provider`
3. Select your preferred provider
4. Set the API key for that provider if not already configured

> Your API keys are stored securely in your editor's secret storage. Each provider has its own key, so you can switch without losing configurations.

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
| `cleancommit.provider` | AI provider (`gemini`, `openai`, `groq`, `openrouter`) | `gemini` |
| `cleancommit.language` | Language for commit messages (`en` or `es`) | `en` |
| `cleancommit.includeBody` | Include detailed body in commit message | `false` |
| `cleancommit.maxDiffSize` | Maximum diff size sent for analysis (characters) | `4000` |

## Commands

Access these commands via the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command | Description |
|---------|-------------|
| `CleanCommit: Generate Commit Message` | Generate a message for staged changes |
| `CleanCommit: Set API Key` | Configure or update your API key for the current provider |

## Compatibility

CleanCommit is designed to work with:

- VS Code 1.90.0+
- Cursor
- Windsurf
- VSCodium
- Other VS Code-based editors

## Requirements

- Git must be installed and available in your PATH
- An API key from one of the supported providers

## Privacy

- Your API keys are stored locally in your editor's secure storage
- Only your staged diff content is sent to the selected AI provider for analysis
- No telemetry or usage data is collected

## Troubleshooting

### "No staged changes found"
Make sure you have staged some files before generating a commit message. Use `git add` or the **Stage All** button.

### "API key not set for [Provider]"
Click **Set API Key** in the sidebar or run the command `CleanCommit: Set API Key`. Make sure you're setting the key for the correct provider.

### "Rate limit exceeded" or "Insufficient credits"
- **OpenAI**: Check your billing at [platform.openai.com/account/billing](https://platform.openai.com/account/billing)
- **Gemini/Groq**: Wait a moment and try again, or switch to another provider
- **OpenRouter**: Add credits at [openrouter.ai/account](https://openrouter.ai/account)

### "Failed to generate message"
- Check your internet connection
- Verify your API key is valid
- If the diff is very large, try staging fewer files

### Extension not appearing in sidebar
Restart your editor. If the issue persists, check that the Git extension is enabled.

## Feedback & Support

Found a bug or have a feature request?

- [Open an issue](https://github.com/brandonpaldom/clean-commit/issues)
- [View source code](https://github.com/brandonpaldom/clean-commit)

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Happy committing!**
