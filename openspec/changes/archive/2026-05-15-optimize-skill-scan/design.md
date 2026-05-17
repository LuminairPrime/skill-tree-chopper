## Context

The `ai-skill-auditor` scans specific agent folders (e.g., `.cursor/skills`) to find valid skill directories. Currently, it loops through each directory and `await`s the `hasSkillMd` check sequentially. While this is mathematically safe and works perfectly on fast local SSDs, running sequential `await`s for I/O bounds limits its scalability when used across remote SSH workspaces or network drives where latency stacks linearly.

## Goals / Non-Goals

**Goals:**

- Parallelize read-only filesystem validation (`hasSkillMd`).
- Maintain sequential constraints for write operations (mass-toggling via `moveFolder`).

**Non-Goals:**

- Lazy loading the global tree (the static targeted `KNOWN_AGENT_PREFIXES` scan combined with this parallelism is fast enough that complex asynchronous hydration strategies are unnecessary).

## Decisions

- **Promise.all for Read-Only Validation:** We will filter directory entries, map them into an array of async `hasSkillMd` promise checks, and execute `await Promise.all()` to resolve them concurrently. We then iterate over the results to push valid `SkillNode`s to the output array. This effectively turns $O(N)$ wait operations into an $O(1)$ batch wait.

## Risks / Trade-offs

- **Risk:** Firing many concurrent `readDirectory` calls might hit file descriptor limits on highly constrained systems or operating systems with artificially low open file limitations.
  - **Mitigation:** The number of skill folders per container is typically small (usually < 100), making OS-level file descriptor limits extremely unlikely to be breached. NodeJS handles batch promises elegantly for this scale.
