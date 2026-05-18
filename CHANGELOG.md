# Changelog

All notable changes to this project will be documented in this file.

## [1.0.22] - 2026-05-18

- **Feature:** Added `scripts/watch-workflows.js` script to monitor post-release CI progress automatically.
- **Fix:** Corrected dirty-tree check logic in `release.js` which previously exited with code 0 instead of 1.
- **Fix:** Added a 10-minute timeout to the GitHub Actions workflow watcher.
- **Chore:** Consolidated multi-step release pipeline into a unified `scripts/release.js` orchestrator.
- **Chore:** Expanded `lint-staged` configuration to cover JavaScript files (`*.js`, `*.mjs`, `*.cjs`).

## Unreleased

- **Feature:** Expanded agent directory support. The extension now discovers skills for over 50 AI environments including `.codeium/windsurf`, `.github` (Copilot), `.openclaw`, `.continue`, and others based on the OpenSpec and PRPM specifications.
- Removed the unfinished delete command contribution so the extension surface matches the archive or restore behavior that is actually implemented.
- Fixed the activity bar icon path and made `vscode:prepublish` work on non-Windows environments.
- Added unit coverage for activation, refresh, single-skill archive, and container restore flows.

Earlier marketplace releases predate this changelog.
