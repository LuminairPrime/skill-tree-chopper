## 1. Extension Scaffolding and Configuration

- [x] 1.1 Scaffold the base VS Code extension (e.g., using `npx yo code` or manual setup).
- [x] 1.2 Update `package.json` to define the `viewsContainers` (activity bar) and `views` (`skillTree`).
- [x] 1.3 Add the `aiSkills.deleteSkill` command to `package.json` and configure it to appear inline as a trash icon in the view menu.
- [x] 1.4 Define the `aiSkills.refresh` command in `package.json` to allow manual reloading of the tree.

## 2. Discovery Algorithm and Tree Provider

- [x] 2.1 Create the `SkillTreeProvider.ts` class implementing `vscode.TreeDataProvider`.
- [x] 2.2 Implement logic to shallow-scan predefined global directories (e.g., `~/.cursor/skills`, `~/.agents/skills`) using `fs`.
- [x] 2.3 Implement logic to scan the workspace using `vscode.workspace.findFiles` with the `**/{skills,rules}/**/{SKILL.md,*.md}` glob patterns.
- [x] 2.4 Implement the parsing algorithm to map discovered paths into a nested hierarchy of Grandparent (Root), Parent (Skill Folder), and File (`SkillNode` instances).

## 3. Tree Actions and State Management

- [x] 3.1 Configure the `SkillNode` constructor to render checkboxes based on the presence of `-disabled` in the folder path.
- [x] 3.2 Listen to the `onDidChangeCheckboxState` event on the `TreeView` and implement the folder renaming logic using `vscode.workspace.fs.rename`.
- [x] 3.3 Implement the `aiSkills.deleteSkill` command handler to move skill files to the OS Recycle Bin via `vscode.workspace.fs.delete({ useTrash: true })`.
- [x] 3.4 Register the provider, tree view, and commands in `extension.ts`.

## 4. Testing and Polish

- [x] 4.1 Test that both global and workspace skills are accurately discovered and categorized.
- [x] 4.2 Verify that toggling the checkbox properly renames the parent folder to and from `-disabled` paths.
- [x] 4.3 Verify that the trash icon successfully deletes the file.
- [x] 4.4 Polish the UI by ensuring `ThemeIcon` instances (`repo`, `folder-library`, `markdown`) are displayed appropriately.
