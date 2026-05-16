## Why

The current `scanForSkillFolders` implementation checks each folder for a `skill.md` file sequentially. While local SSDs hide this latency, remote workspaces (SSH, WSL, network drives) suffer from consecutive I/O waits. Parallelizing these read-only checks significantly improves startup and refresh performance.

## What Changes

- Refactor `scanForSkillFolders` in `SkillTreeProvider.ts` to execute `hasSkillMd` checks concurrently using `Promise.all()`.

## Capabilities

### New Capabilities
- `parallel-scan`: Concurrent directory validation for skill discovery.

### Modified Capabilities

## Impact

- **Code:** `src/SkillTreeProvider.ts`
- **Performance:** Dramatically reduced I/O wait time during tree view population by batching read operations.