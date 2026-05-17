## Why

The current AI Skill Auditor extension implementation has several technical debt issues identified during a code review, including circular dependencies, inefficient file system access patterns, and minor UX inconsistencies. Addressing these issues now will improve robustness, performance, and maintainability. Additionally, the process for publishing and distributing the extension needs to be formally documented so that developers have a clear reference for packaging and sharing the extension.

## What Changes

- Refactor `SkillTreeProvider` and `extension.ts` to remove a circular dependency via constructor injection.
- Optimize the `hasSkillMd` file check to use a single case-insensitive directory read rather than up to four sequential `stat` calls.
- Simplify `vscode.workspace.fs.createDirectory` usage by leveraging its idempotency.
- Ensure event listeners like `onDidChangeCheckboxState` are properly pushed to `context.subscriptions`.
- Update `README.md` to accurately reflect the agent paths used in the code.
- Add a progress indicator (`vscode.window.withProgress`) to provide feedback during potentially long-running mass-toggle operations.
- Update the `package.json` `when` clause for the delete command so the trash icon only appears on actual skill-folder nodes.
- Create a new Markdown file documenting the end-to-end publishing process (local VSIX, GitHub Releases, and VS Code Marketplace).

## Capabilities

### New Capabilities

- `publishing-guide`: Documentation that details the process for packaging and distributing the extension.
- `code-quality-enhancements`: UX and architectural robustness improvements including progress indicators, fixed context menus, and optimized file system queries.

### Modified Capabilities

## Impact

- **Code:** `src/extension.ts`, `src/SkillTreeProvider.ts`, `package.json`, and `README.md`.
- **Performance:** Fewer I/O operations when validating skill folders; better UI responsiveness and user feedback during large folder moves.
- **Documentation:** A new publishing plan document will be available in the workspace.
