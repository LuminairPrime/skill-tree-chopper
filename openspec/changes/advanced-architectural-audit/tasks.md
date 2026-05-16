## 1. Asynchronous I/O Refactoring

- [ ] 1.1 Create an `async pathExists(path)` helper function in `SkillTreeProvider.ts` to replace `fs.existsSync` usage.
- [ ] 1.2 Convert `scanAgentRoots` in `SkillTreeProvider.ts` to use `fs.promises.readdir` and properly `await` it.
- [ ] 1.3 Convert `scanForSkillFolders` in `SkillTreeProvider.ts` into an async function, utilizing `fs.promises.readdir`.
- [ ] 1.4 Refactor `extension.ts` to use `fs.promises.readdir` in the pre-flight `isValid` check.
- [ ] 1.5 Refactor `extension.ts` to use `fs.promises.mkdir` for `.archived` creation, and `pathExists` helper logic instead of `fs.existsSync`.

## 2. Race Condition and Performance Safety

- [ ] 2.1 Verify that `extension.ts` mass-toggle logic explicitly uses `for...of` with `await moveFolder()` to enforce sequential locking protection, explicitly rejecting `Promise.all()`.
- [ ] 2.2 Verify that `scanForSkillFolders` explicitly `break`s the loop immediately upon finding `skill.md` to guarantee $O(1)$ constant time validation.
- [ ] 2.3 Verify `context.subscriptions.push(treeView, refreshCommand, deleteCommand)` is intact to satisfy the `memory-leak-audit` requirements.