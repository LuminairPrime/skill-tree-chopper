## Context

The discovery logic in the current prototype is deeply flawed: it synchronously scans the entire global home directory (causing massive performance hits) and performs nested synchronous directory reads to validate the existence of `skill.md` files. Furthermore, it relies on the Node.js `fs` module, which breaks compatibility with VS Code remote workspaces (like Dev Containers or SSH), and it silently swallows all execution errors.

## Goals / Non-Goals

**Goals:**
- Shift all file system calls to `vscode.workspace.fs.*`.
- Make `SkillTreeProvider.ts` completely asynchronous.
- Implement an explicit array of `KNOWN_AGENT_PREFIXES` to avoid walking irrelevant directories in the user's home folder.
- Establish an `OutputChannel` in `extension.ts` for centralized, visible error logging.
- Retain sequential awaiting in mass-toggles to prevent file system locks.

**Non-Goals:**
- Designing a UI busy indicator for the checkbox state. VS Code tree checkboxes fire asynchronously and update their state naturally when the data provider refreshes.

## Decisions

- **API Migration**: We will utilize `vscode.workspace.fs.readDirectory()` and `vscode.workspace.fs.stat()`. These are natively async and return standard `[name, FileType]` arrays, eliminating the need to polyfill `withFileTypes` behavior.
- **O(1) Validation**: To check if a folder is a skill folder, we will NOT read its directory contents. We will explicitly try to run `vscode.workspace.fs.stat(vscode.Uri.file(path.join(folder, 'skill.md')))` or its `skill.MD` variations. If it succeeds, it's a skill. If it throws, it's not. This is a true constant-time check.
- **Output Channel**: We will create `const outputChannel = vscode.window.createOutputChannel('AI Skill Auditor');` in `activate` and pass it down or export it as a singleton so `SkillTreeProvider` can log `try/catch` failures to it.
- **Memory Safety**: We will explicitly add `outputChannel` to `context.subscriptions` alongside the commands and the `treeView`.

## Risks / Trade-offs

- **Risk**: Moving from Node's `fs` to `vscode.workspace.fs` requires converting paths to `vscode.Uri` objects extensively, which can be verbose.
  - **Mitigation**: We will ensure tight helper functions or clean mapping logic is used to keep the path manipulation readable.