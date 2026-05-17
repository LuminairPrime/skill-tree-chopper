## Context

The previous refactor (`tree-hierarchy-and-archiving`) inadvertently caused the extension to scan the entire workspace deeply using a broad glob (`**/{skills,rules}/**/{SKILL.md,*.md}`). This resulted in false positives (e.g., scanning the `vendors` folder or `node_modules`). Furthermore, the logic for archiving skills needs to explicitly target a `.archived` hidden folder, not just `archived`, to conform to standards and clearly indicate it's a tool-managed state directory. Finally, users need an intermediate container (`skills` or `rules`) in the tree view that acts as a mass-toggle for all child skills.

## Goals / Non-Goals

**Goals:**

- Replace the `vscode.workspace.findFiles` deep-glob approach with a highly targeted, manual directory scanning algorithm (depth of 1) for workspace scopes, mirroring the global logic.
- Change the archive folder name from `archived` to `.archived`.
- Introduce a `skills-container` Node Type in the tree that holds a checkbox for en-masse operations.
- Introduce a strict validation check before moving folders to ensure they contain a `skill.md` or `.md` file.

**Non-Goals:**

- Supporting agent config directories outside the standard set (`.cursor`, `.agents`, `.claude`).

## Decisions

- **Discovery Algorithm**: We will unify `getWorkspaceSkills` and `getGlobalSkills` to use a shared `scanAgentRoots(basePaths[])` function. This function will explicitly look for `['.cursor', '.agents', '.claude']`, then look explicitly inside `skills` and `rules`, and finally scan exactly one level deep to find folders. Within those found folders, it will read the directory contents to confirm the existence of `skill.md` (case insensitive) before adding it to the tree.
- **Tree View State (En-Masse)**: The `onDidChangeCheckboxState` event provides an array of changed items. If a `skills-container` node is checked/unchecked, the handler will recursively iterate over its `children` and apply the move logic to each `skill-folder`.
- **Validation**: Before `vscode.workspace.fs.rename` is called, we will `fs.readdirSync` the source folder to verify it contains a valid skill file.

## Risks / Trade-offs

- **Risk:** Synchronous `fs` operations on the workspace might block the extension host thread if the disk is slow.
  - **Mitigation:** The depth is strictly limited to 1, and the targeted folders (`.cursor`, etc.) are generally small, so synchronous `fs.readdirSync` is acceptable and simplifies the code significantly.
- **Risk:** Existing users who have an `archived` folder from the last version will have orphaned skills.
  - **Mitigation:** The documentation will instruct them to manually rename their `archived` folders to `.archived`.
