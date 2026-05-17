## Why

AI programming tools and IDEs (Cursor, Windsurf, Cline, Copilot, etc.) scatter skill/rules markdown files across the global user directory and local project workspaces. This "skill scattering" causes AI context bloat, leading to erratic behavior and token waste because developers cannot easily track what rules are actively being loaded. A unified visual dashboard within VS Code to audit, disable (via `-disabled` directories), and delete these sprawling configuration files will give developers control over their AI tooling context without requiring an untrusted third-party app with potential security risks.

## What Changes

- Create a new native VS Code extension named "AI Skill Auditor".
- Add an Activity Bar icon (using the built-in `$(hubot)` icon).
- Implement a TreeView in the sidebar to display all known global and workspace AI skill directories.
- Introduce an algorithm to crawl file locations using a robust schema of known agent paths (from tools like `vercel-labs/skills` and `ai-rules-manager`).
- Add native VS Code TreeView checkboxes allowing users to enable/disable skills by moving them to and from `-disabled` directories (e.g., from `.cursor/skills` to `.cursor/skills-disabled`).
- Add an inline context menu action (trash icon) to delete skill files (moving them to the OS Recycle Bin).

## Capabilities

### New Capabilities

- `skill-discovery`: Discovers AI skill folders across global (`~`) and workspace scopes using a predefined schema of known agent paths.
- `skill-tree-view`: Displays the discovered skill directories and files in a native VS Code TreeView, grouping them by root and skill folders.
- `skill-management`: Allows enabling/disabling skills via checkboxes (folder renaming) and deleting skills via a context menu.

### Modified Capabilities

## Impact

- **New Extension Codebase**: Sets up the foundation for a new VS Code extension.
- **Dependencies**: Uses 100% native VS Code APIs (`vscode.workspace.fs`, `vscode.window.createTreeView`, etc.) with zero external NPM runtime dependencies, ensuring high security and performance.
