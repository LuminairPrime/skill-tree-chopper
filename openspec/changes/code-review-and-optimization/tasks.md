## 1. Asynchronous I/O Conversion

- [ ] 1.1 In `SkillTreeProvider.ts`, convert `scanAgentRoots` to use `fs.promises.readdir` instead of `fs.readdirSync`.
- [ ] 1.2 In `SkillTreeProvider.ts`, replace `fs.existsSync` checks with `await fs.promises.access` wrapped in try/catch blocks.
- [ ] 1.3 In `SkillTreeProvider.ts`, convert `scanForSkillFolders` to be an `async` function and use `fs.promises.readdir`. Wait for all folder scans to complete using `Promise.all` or sequential awaits.

## 2. Race Condition and Safety Fixes

- [ ] 2.1 In `extension.ts`, convert the pre-flight `.md` validation check in `moveFolder` to use `await fs.promises.readdir` instead of `fs.readdirSync`.
- [ ] 2.2 In `extension.ts`, convert the `archived` directory creation to use `await fs.promises.mkdir` instead of `fs.mkdirSync`.
- [ ] 2.3 In `extension.ts`, review the `onDidChangeCheckboxState` mass-toggle loop to verify that `await moveFolder()` is awaited sequentially, preventing race conditions from simultaneous `rename` events locking the file system.
