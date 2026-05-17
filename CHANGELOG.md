# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- **Feature:** Expanded agent directory support. The extension now discovers skills for over 50 AI environments including `.codeium/windsurf`, `.github` (Copilot), `.openclaw`, `.continue`, and others based on the OpenSpec and PRPM specifications.
- Removed the unfinished delete command contribution so the extension surface matches the archive or restore behavior that is actually implemented.
- Fixed the activity bar icon path and made `vscode:prepublish` work on non-Windows environments.
- Added unit coverage for activation, refresh, single-skill archive, and container restore flows.

Earlier marketplace releases predate this changelog.
