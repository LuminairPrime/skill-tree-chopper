## 1. Parallel Validation

- [x] 1.1 In `SkillTreeProvider.ts`, refactor `scanForSkillFolders` to extract directory entries into a filtered `dirs` array, discarding any that are not directories or are named `.archived`.
- [x] 1.2 In `scanForSkillFolders`, map the `dirs` array into an array of asynchronous closures that call `hasSkillMd` on each constructed `skillFolderUri`.
- [x] 1.3 `await Promise.all` on the mapped array to execute the file system checks concurrently.
- [x] 1.4 Iterate through the resolved results and instantiate `SkillNode` objects to push to the `nodes` array for validation successes.