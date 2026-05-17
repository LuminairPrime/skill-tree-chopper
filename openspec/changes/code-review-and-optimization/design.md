## Context

The extension currently heavily relies on synchronous `fs` methods (e.g., `fs.readdirSync`, `fs.mkdirSync`, `fs.existsSync`). While these are simple to write and fast for shallow directories, they block the single-threaded Node.js event loop used by the VS Code Extension Host. If a user's home directory or workspace is on a slow networked drive, the entire VS Code UI could freeze during the tree view generation. Furthermore, mass toggling executes multiple `vscode.workspace.fs.rename` commands in rapid succession.

## Goals / Non-Goals

**Goals:**

- Convert synchronous `fs.*Sync` calls in `SkillTreeProvider.ts` and `extension.ts` to their asynchronous counterparts (`fs.promises.*`).
- Ensure the tree hierarchy algorithm maintains $O(N)$ efficiency.
- Prevent race conditions during mass toggles by awaiting promises safely.

**Non-Goals:**

- Completely rewriting the tree structure; the hierarchy logic established in the previous refactor is correct, we are just optimizing its execution.

## Decisions

- **Asynchronous File System**: Replace `fs.readdirSync` with `fs.promises.readdir` and `fs.existsSync` with try/catch blocks around `fs.promises.stat` or `fs.promises.access`. This will yield the event loop back to VS Code during I/O.
- **Mass Toggle Concurrency**: In `extension.ts`, the mass toggle iterates over children and calls `moveFolder` asynchronously. To avoid slamming the file system with too many concurrent rename locks, we will execute these moves sequentially inside the `for...of` loop by properly `await`ing each one before proceeding to the next.
- **Algorithm Optimization**: The current `scanAgentRoots` uses a nested loop structure. While it looks like $O(N^3)$, the bounds are strictly limited (3 agent roots _ 2 container names _ max depth 1). It is effectively $O(F)$ where F is the total number of files in those specific shallow directories. We will retain this structure as it is mathematically optimal, but the async conversion will make it non-blocking.

## Risks / Trade-offs

- **Risk:** Converting synchronous code to asynchronous requires wrapping tree generation logic in Promises, which can introduce unhandled rejection errors if not properly caught.
  - **Mitigation:** We will ensure `try/catch` blocks wrap all `fs.promises` calls, failing gracefully and returning empty arrays rather than crashing the extension host.
