## Context

A recent code review for the `ai-skill-auditor` v1.0.0 extension identified multiple areas where technical debt can be reduced. While the extension correctly implements core functional requirements, its file system I/O patterns can be optimized (specifically `hasSkillMd`), circular module dependencies risk runtime errors, and some UX elements (lack of progress indication, overly permissive contextual menus) can be improved. A secondary need has emerged to capture the extension publishing workflow so others can distribute updates in the future.

## Goals / Non-Goals

**Goals:**
- Eliminate the circular dependency between `extension.ts` and `SkillTreeProvider.ts`.
- Optimize file validation (`hasSkillMd`) to `O(1)` file system read per directory.
- Simplify filesystem API calls for creating directories.
- Ensure proper lifecycle management of all `vscode.Disposable` objects.
- Correct `package.json` to properly limit the display of the delete button.
- Add `vscode.window.withProgress` to mass-toggle commands.
- Provide a clear, persistent guide on publishing the extension.

**Non-Goals:**
- Modifying the underlying behavior of skill discovery.
- Adding comprehensive end-to-end tests for the UI components.
- Rewriting the TreeDataProvider logic.

## Decisions

- **Constructor Injection:** To break the circular dependency where `SkillTreeProvider` imports `outputChannel` from `extension.ts`, we will instantiate `outputChannel` in `activate()` and pass it into the `SkillTreeProvider` via its constructor.
- **`hasSkillMd` Optimization:** Instead of attempting to `stat` four different string variants sequentially, we will perform a single `vscode.workspace.fs.readDirectory` on the skill folder and use a case-insensitive check on the results to locate `skill.md`. This is a much faster and more resilient approach.
- **Idempotency in Directory Creation:** `vscode.workspace.fs.createDirectory` acts like `mkdir -p` natively. We will remove the surrounding `stat` checks and `try/catch` and simply call `createDirectory`.
- **Delete Button Condition:** We will update the `"when"` clause for `aiSkills.deleteSkill` in `package.json` from `"view == aiSkillAuditor"` to `"view == aiSkillAuditor && viewItem == skillFolder"`. This relies on `SkillNode`'s `contextValue = 'skillFolder'`.
- **Publishing Documentation:** The extension publishing guide will be a static markdown file detailing local packaging (`.vsix`), GitHub Releases, and VS Code Marketplace workflows.

## Risks / Trade-offs

- **Risk:** Optimizing the `hasSkillMd` function by reading the entire directory might have a slight penalty if the directory contains thousands of files.
  - **Mitigation:** Skill directories are typically extremely small (containing just the `skill.md` file and maybe a script or two), making `readDirectory` strictly faster and less expensive than multiple missing file stat exceptions.
