## Context

We researched existing tools in the ecosystem (`agent-skills-manager` and `skills-desktop`). These tools revealed critical failure points: deep system scans cause severe latency and permission hangs, while complex native dependencies (like `node-pty` or Tauri) complicate cross-platform distribution. To ensure the AI Skill Auditor VS Code extension remains robust and performant, we must refine our discovery algorithm using heuristics, implement graceful degradation for filesystem permissions, and explicitly defer standalone GUI complexity.

## Goals / Non-Goals

**Goals:**
- Eliminate startup lag by using a discovery heuristic (stopping at the first valid file) and lazy-loading the global `~` directory.
- Handle OS-level permission restrictions gracefully (fallback to read-only views or rename-to-disable actions if deletion is blocked).
- Target Windows, Linux, and macOS simultaneously by relying exclusively on VS Code's cross-platform `vscode.workspace.fs` API.

**Non-Goals:**
- Building the standalone desktop application in v1. This is explicitly deferred to v2 to avoid framework complexity (e.g., Tauri, Electron).
- Rigorously scanning every single sub-file within a skill directory to validate its contents.

## Decisions

- **Heuristic File Discovery**: Instead of reading all files inside `.agents/skills/`, we will check for the existence of *any* `.md` file matching our target array (`SKILL.md`, `.cursorrules`, etc.). Once one is found, the parent directory is marked as populated. We skip deep tree traversal.
- **Lazy Loading the Global Tree**: The `SkillTreeProvider` will set `collapsibleState = vscode.TreeItemCollapsibleState.Collapsed` for the global root node (`~`). Children of the global node will only be evaluated/scanned when the user clicks to expand it, preventing unnecessary disk I/O on extension activation.
- **Graceful Error Handling with `vscode.workspace.fs`**: 
  - **Read Errors**: Wrap directory reads in a `try/catch`. If an `EACCES` or `EPERM` error occurs, surface the folder node with a lock icon (`ThemeIcon('lock')`) and a tooltip indicating read-only mode.
  - **Delete Errors**: If `fs.delete` fails due to permissions, catch the error and attempt to use `fs.rename` to move it to a `-disabled` folder as a fallback mechanism.

## Risks / Trade-offs

- **Risk:** The heuristic might false-positive if an empty or unrelated `.md` file happens to share a name in the target directory.
  - **Mitigation:** The risk is acceptable since the user is simply presented with the folder in the GUI; they can still manually inspect it. It's a worthy trade-off for the massive latency reduction.
- **Risk:** Users might expect a standalone GUI immediately based on early roadmaps.
  - **Mitigation:** Clearly document that v1 is VS Code only, ensuring a highly stable experience before tackling desktop distribution.