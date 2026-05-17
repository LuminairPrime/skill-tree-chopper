## 1. Discovery Algorithm Unification

- [x] 1.1 Replace `getWorkspaceSkills` and `getGlobalSkills` in `SkillTreeProvider.ts` with a unified scanning logic that accepts an array of root paths.
- [x] 1.2 Implement strict shallow-scanning (depth 1) for specific agent folders (`.cursor`, `.agents`, `.claude`) and their respective `skills`/`rules` subfolders.
- [x] 1.3 Add validation inside the scanner to ensure a folder is only yielded if it contains a file matching `skill.md` (case insensitive) or `*.md`.
- [x] 1.4 Update the archive path detection from `archived` to `.archived` across the scanning logic.

## 2. Tree Hierarchy and Container Checkboxes

- [x] 2.1 Add the `skills-container` type to `SkillNodeType`.
- [x] 2.2 Update `buildHierarchy` to group `skill-folder` nodes under a `skills-container` node (named `skills` or `rules`) which is then grouped under the `agent-root`.
- [x] 2.3 Configure the `SkillNode` constructor to render a checkbox for the `skills-container` node. Its state should be `Checked` if ANY child is `Checked`, and `Unchecked` only if ALL children are `Unchecked`.
- [x] 2.4 Update the `SkillNode` constructor to recognize `.archived` (instead of `archived`) when calculating the checkbox state for `skill-folder` nodes.

## 3. Command and Archive Logic

- [x] 3.1 Update the `treeView.onDidChangeCheckboxState` handler in `extension.ts` to rename paths using `.archived` instead of `archived`.
- [x] 3.2 Add a pre-flight validation check in the archive handler: verify `skill.md` exists in the source folder using `fs.readdirSync` before calling `fs.rename`.
- [x] 3.3 Implement mass-toggle logic: If a `skills-container` is toggled, iterate over its `children` and programmatically trigger the move logic for each `skill-folder`.
- [x] 3.4 Update the README to reflect the change from `archived` to `.archived` and the new mass-toggle feature.
