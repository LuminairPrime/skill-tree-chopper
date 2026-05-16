## 1. Discovery Optimization

- [ ] 1.1 Refactor global directory scanning to stop scanning after finding the first valid `SKILL.md` (heuristic discovery).
- [ ] 1.2 Update the `SkillTreeProvider` to set `collapsibleState = vscode.TreeItemCollapsibleState.Collapsed` for the global root node (`~`) by default.
- [ ] 1.3 Ensure `getChildren` logic for the global root node only executes discovery when the node is actively expanded by the user.

## 2. Graceful Permission Handling

- [ ] 2.1 Wrap file/directory read operations in `try/catch` blocks.
- [ ] 2.2 Update `SkillNode` logic to assign a lock icon (`ThemeIcon('lock')`) and a read-only tooltip when `EACCES` or `EPERM` is caught.
- [ ] 2.3 Refactor the delete action handler (`aiSkills.deleteSkill`) to catch permission errors and trigger the rename-to-disable fallback automatically.

## 3. Cross-Platform Assurance

- [ ] 3.1 Verify `package.json` has no native dependencies that would block cross-platform distribution.
- [ ] 3.2 Add explicit documentation to the repository stating that the standalone GUI is deferred to v2.