## 1. Documentation Updates

- [x] 1.1 Create `docs/publishing-guide.md` with instructions on creating local `.vsix` packages, attaching releases on GitHub, and publishing to Azure DevOps / VS Code Marketplace.
- [x] 1.2 Update `README.md` to document `.gemini` and `.forge` as known agent prefixes, and remove references to `.rules` to accurately reflect the codebase.

## 2. Refactoring Dependencies

- [x] 2.1 In `SkillTreeProvider.ts`, remove the import of `outputChannel` and add it to the `SkillTreeProvider` class constructor.
- [x] 2.2 In `extension.ts`, remove the `export` keyword from `outputChannel` and pass it as an argument when instantiating `new SkillTreeProvider(outputChannel)`.

## 3. Code Quality and UX Fixes

- [x] 3.1 In `SkillTreeProvider.ts`, refactor `hasSkillMd` to use a single `vscode.workspace.fs.readDirectory` call and a case-insensitive check for `skill.md`, removing the fallback stat calls.
- [x] 3.2 In `extension.ts`, modify `moveFolder` so the `.archived` directory creation is a simple, unconditional `await vscode.workspace.fs.createDirectory(archivedDirUri)`.
- [x] 3.3 In `extension.ts`, explicitly push the `Disposable` returned by `treeView.onDidChangeCheckboxState` into `context.subscriptions`.
- [x] 3.4 In `extension.ts`, wrap the `for (const child of item.children)` mass-toggle loop with `vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Toggling skills...' }, async () => { ... })`.

## 4. Package Configuration

- [x] 4.1 In `package.json`, update the `"when"` clause for `aiSkills.deleteSkill` in the `view/item/context` menu to be `"view == aiSkillAuditor && viewItem == skillFolder"`.