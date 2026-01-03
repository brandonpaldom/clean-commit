# Changelog

All notable changes to the **CleanCommit** extension will be documented in this file.

## [1.0.0] - 2026-01-03

### Added
- **Multi-Provider Support**: Choose between multiple AI providers for commit message generation:
  - **Google Gemini** (default) - `gemini-2.5-flash`
  - **OpenAI** - `gpt-4o-mini`
  - **Groq** - `llama-3.3-70b-versatile` (free tier available)
  - **OpenRouter** - `google/gemini-2.0-flash-001` (100+ models available)
- **Provider Selector**: New setting `cleancommit.provider` to choose your preferred AI provider.
- **Independent API Keys**: Each provider has its own API key stored securely. Switch providers without losing your keys.
- **Dynamic UI**: Sidebar now shows the active provider and allows changing API keys on the fly.
- **Auto-refresh on Provider Change**: Sidebar automatically updates when you change providers in settings.

### Changed
- Refactored AI service architecture to support multiple providers via a unified interface.
- Improved error messages with provider-specific details (rate limits, insufficient credits, etc.).

## [0.2.2] - 2025-12-29

### Changed
- **Updated Extension Icons**: Refreshed icons for better visibility and consistency across themes.

## [0.2.1] - 2025-12-28

### Fixed
- **Production UI Assets**: Fixed an issue where CSS and JS files were missing in the published extension due to `.vscodeignore` rules.
- **Icon Rendering**: Improved Content Security Policy (CSP) to ensure Lucide icons and styles load correctly in production.

## [0.2.0] - 2025-12-28

### Added
- **Git Changes Panel**: New sidebar section to visualize "Changes" and "Staged Changes" in real-time.
- **Git Actions**: Added buttons for "Stage All", "Unstage All", and "Discard All" (with confirmation).
- **Individual File Actions**: Hover over files to stage, unstage, or discard changes individually.
- **Improved UI**: Replaced emojis with professional **Lucide Icons**.
- **Editable Commit Message**: The AI-generated message is now placed in an editable textarea.
- **In-Panel Commit**: Perform commits directly from the extension sidebar using the new "Commit" button.

### Fixed
- **Repository Auto-Refresh**: Fixed an issue where changes wouldn't load automatically on startup or after opening the extension for the first time.
- **UI Overflow**: Fixed horizontal scroll issues in narrow sidebars by enforcing consistent box-sizing.
- **Git URI Error**: Resolved common "Failed to execute git" errors by using system file paths instead of URI objects.

### Changed
- Refined project naming for technical compatibility while maintaining the **CleanCommit** brand name.

## [0.1.0] - 2024-12-27

### Added
- Initial release of CleanCommit.
- AI-powered commit message generation using Gemini 2.0/2.5 Flash.
- Support for Conventional Commits specification.
- Multi-language support (English and Spanish).