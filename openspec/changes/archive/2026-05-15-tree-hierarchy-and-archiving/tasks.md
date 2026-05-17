## 1. SkillTreeProvider Refactoring

- [x] 1.1 Update `SkillNode` types to represent the new hierarchy (`scope-root`, `agent-root`, `skill-folder`). Remove the `file` type entirely.
- [x] 1.2 Refactor `getWorkspaceSkills` and `getGlobalSkills` in `SkillTreeProvider.ts` to discover agent folders (e.g., `.cursor`) and skill folders, ignoring individual `.md` files in the tree output.
- [x] 1.3 Update the `buildHierarchy` logic to output the correct tree structure: Scope -> Agent Folder -> Skill Folder.
- [x] 1.4 Update the `SkillNode` constructor to calculate its checkbox state based on whether its parent folder is named `archived`.

## 2. Command and Archive Logic Refactoring

- [x] 2.1 Refactor the `treeView.onDidChangeCheckboxState` event handler in `extension.ts` to implement the new archive logic (moving folders instead of renaming suffixes).
- [x] 2.2 Add logic to the archive action to verify/create the `archived` subdirectory using `fs.mkdirSync` before invoking the `vscode.workspace.fs.rename` move command.
- [x] 2.3 Refactor the unarchive action (when a box is checked) to move the folder out of the `archived` subdirectory back to its parent `skills/` or `rules/` folder.
- [x] 2.4 Verify that the `aiSkills.deleteSkill` command now correctly accepts a `skill-folder` node type instead of a `file` node type and deletes the entire skill folder.
