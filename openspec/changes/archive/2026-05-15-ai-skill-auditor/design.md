## Context

AI programming tools and extensions often write custom rule or instruction markdown files (such as `SKILL.md`, `.cursorrules`, etc.) into specific, predictable `.hidden` directories in both global user spaces and project workspaces. We need a way to track, manage, and cleanly display these rule files within a native VS Code TreeView to allow users to disable them when not in use.

## Goals / Non-Goals

**Goals:**
- Provide a responsive VS Code sidebar tree view that lists discovered agent skills.
- Use zero external NPM runtime dependencies, utilizing VS Code native APIs where possible for file IO, searching, and UI.
- Use an extensible algorithm to locate skill files using known patterns from the `vercel-labs/skills` schema.
- Allow disabling and deleting skills reliably without prompting security warnings.

**Non-Goals:**
- Creating a separate native desktop application.
- Supporting environments outside of VS Code.
- Parsing or modifying the content of the markdown files (we are only managing their location and state).

## Decisions

- **Discovery Algorithm**: 
  - **Local Workspace**: Use the "Vercel Method" pattern (`**/.*/{skills,rules}/**/{SKILL.md,*.md}` and `**/skills/**/{SKILL.md,*.md}`) via `vscode.workspace.findFiles`. This provides future-proofing for new AI agents without updating the plugin source code.
  - **Global Space**: Iterate over known directories in `os.homedir()` (e.g. `~/.cursor/skills`, `~/.agents/skills`) using a shallow scan to maintain performance.
- **Disabling Mechanism**: Instead of modifying the markdown file names inline (e.g. `skill.md.disabled`), we rename the parent container from `/skills/` to `/skills-disabled/` or `/rules/` to `/rules-disabled/`. This is a bulletproof approach because many AI agents ingest any text-based file from the directory indiscriminately. We will use `vscode.workspace.fs.rename`.
- **Tree UI & State**: Use `vscode.window.createTreeView` with custom tree nodes (`SkillNode`). To implement disabling functionality, we will leverage `vscode.TreeItemCheckboxState`. We will intercept the native check/uncheck events to trigger folder renaming, which is visually represented to the user as enabling/disabling a skill.
- **Deletion**: Map a native VS Code context menu command (`aiSkills.deleteSkill`) to a trash icon on tree items. Under the hood, this will use `vscode.workspace.fs.delete` with `{ useTrash: true }` to move the file/directory to the system Recycle Bin.

## Risks / Trade-offs

- **Risk:** Scanning the entire home directory could be slow.
  - **Mitigation:** We only scan specific, hardcoded global tool directories such as `~/.cursor/rules`, `~/.claude/skills`, `~/.agents/skills`, etc., using efficient shallow reads.
- **Risk:** Renaming folders dynamically may cause errors if the target directory already exists.
  - **Mitigation:** Wrap the `fs.rename` logic in a robust error handler, providing clear information messages to the user via `vscode.window.showErrorMessage`.