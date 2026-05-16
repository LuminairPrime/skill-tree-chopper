## Context

The initial MVP of the `ai-skill-auditor` utilized `fs.*Sync` methods for rapid prototyping. However, following a rigorous review against the `vscode-ext-commands` and `memory-leak-audit` community standards, we identified several enterprise-grade violations. Specifically: synchronous I/O blocks the VS Code Extension Host (which runs on a single Node.js event loop thread), mass-toggling triggers un-managed parallel `fs.rename` promises causing file-lock race conditions, and EventEmitters must be strictly managed to avoid memory bloat.

## Goals / Non-Goals

**Goals:**
- Completely eradicate `fs.*Sync` calls (`fs.readdirSync`, `fs.mkdirSync`, `fs.existsSync`) in favor of `fs.promises`.
- Enforce strict sequential execution with discrete error boundary `try/catch` blocks inside the `extension.ts` mass-toggle loop.
- Optimize the `scanForSkillFolders` loop to explicitly `break` out of the file-scanning loop the absolute millisecond a `skill.md` is found to achieve true optimal $O(1)$ constant time validation per folder.
- Ensure all commands and event listeners are properly pushed to the `context.subscriptions` array for safe memory disposal when the extension deactivates.

**Non-Goals:**
- Changing the visual layout of the tree.
- Modifying the strict discovery rules established in the previous refactor (dot-folders only, exactly `skills`, exactly `skill.md`).

## Decisions

- **Asynchronous Conversion**: `fs.existsSync` does not have a direct `fs.promises` equivalent. We will replace it with a helper function utilizing `try { await fs.promises.access(path); return true; } catch { return false; }`. `readdirSync` and `mkdirSync` map directly to `fs.promises.readdir` and `fs.promises.mkdir`.
- **Sequential Awaits over Promise.all**: When the user clicks the mass-toggle checkbox on a `skills-container` containing 50 skills, `Promise.all` would slam the OS with 50 simultaneous `rename` commands, highly risking `EPERM` or `EBUSY` locks on Windows. We will use a standard `for...of` loop with `await` to move the folders sequentially. This is slightly slower on paper, but infinitely more stable on disk.
- **Memory Management**: The `SkillTreeProvider` currently instantiates its `EventEmitter` safely as a class property, and the commands are pushed to `context.subscriptions`. We will audit these to ensure no cyclic references exist.

## Risks / Trade-offs

- **Risk:** Sequential awaiting of 50 folders might take 1-2 seconds, creating a visual delay in the UI checkbox state updating.
  - **Mitigation:** This is an acceptable trade-off for data integrity. The UI will naturally block the checkbox from fully rendering until the underlying `rename` promises resolve, which serves as a natural busy-indicator.