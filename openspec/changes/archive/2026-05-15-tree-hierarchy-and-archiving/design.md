## Context

The initial MVP of the `ai-skill-auditor` implemented a flat list of discovered Markdown files under the Tree View and used a rudimentary suffix (`-disabled`) on the parent folder to disable a skill. We learned that:
1. Standard agent discovery logic stops one level deep inside the `skills/` directory. By moving a skill folder into an `archived/` subfolder, agents will naturally skip it without us needing to mutate the top-level directory names.
2. The user experience is confusing because it shows individual `.md` files instead of the higher-level "Skill Folder", and the distinction between Workspace and Global skills wasn't structurally apparent.

## Goals / Non-Goals

**Goals:**
- Refactor `SkillTreeProvider.ts` to build a 4-tier tree: `Scope (Workspace/Global)` -> `Agent Folder (.cursor/.agents)` -> `Archived/Active state (optional visual grouping or implicit via folder location)` -> `Skill Folder`.
- Refactor the tree items so they stop at the folder level.
- Change the `onDidChangeCheckboxState` event handler to move folders into and out of an `archived/` subfolder, rather than using string replacement on the parent directory suffix.

**Non-Goals:**
- Expanding discovery logic to new globs or paths not previously supported.
- Modifying the contents of the `.md` files.

## Decisions

- **Hierarchy Representation**: We will introduce explicit `SkillNode` types for `scope-root` (Workspace vs. Global) and `agent-root` (e.g., `.cursor`, `.agents`). The leaf nodes will be `skill-folder`.
- **Archive Logic**: 
  - To disable `~/.cursor/skills/my-skill`, we will run `fs.rename` to move it to `~/.cursor/skills/archived/my-skill`.
  - We must ensure the `archived/` directory is created if it does not exist before performing the move. We will use `fs.mkdirSync(archivedPath, { recursive: true })`.
- **Tree View State**: When scanning, if a skill folder is found inside an `archived` directory, its `SkillNode` will have its checkbox set to `Unchecked`. If it is at the root of `skills/` or `rules/`, it will be `Checked`.

## Risks / Trade-offs

- **Risk:** Existing `-disabled` folders from the old MVP approach might be orphaned or cause errors.
  - **Mitigation:** We will update the `README` to explain the new mechanism. If necessary in the future, we could add a one-time migration command, but for now, users can manually move them back.
- **Risk:** File system locks when moving folders.
  - **Mitigation:** We will wrap the `fs.rename` in a try/catch and use `vscode.window.showErrorMessage` to inform the user if the archive action fails due to permissions or locks.