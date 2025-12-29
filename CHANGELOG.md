# Changelog

All notable changes to the **CleanCommit** extension will be documented in this file.

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