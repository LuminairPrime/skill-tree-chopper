## Why

The `ai-skill-auditor` extension has rapidly evolved through multiple structural refactors (such as the algorithm unification and `.archived` tree logic). Before we consider this stable, we need to perform a comprehensive code review to identify and mitigate race conditions, file integrity risks during synchronous I/O operations, algorithmic bottlenecks ($O(n)$ complexity issues), and general best-practice violations.

## What Changes

- We will audit the synchronous file system calls (`fs.readdirSync`, `fs.mkdirSync`) used during discovery to ensure they do not cause event loop blocking that degrades the VS Code UI experience.
- We will review the `fs.rename` and `fs.delete` operations for race conditions or file locking issues, particularly when mass-toggling skills.
- We will analyze the Big O time and space complexity of the mapping algorithms in `buildHierarchy` and `scanAgentRoots`.
- We will refactor or optimize code blocks identified during the review, adding appropriate error handling and safety checks.

## Capabilities

### New Capabilities

- `code-quality-assurance`: Establishes the baseline performance and safety metrics for the extension, ensuring robust file operations and non-blocking discovery.

### Modified Capabilities

<!-- No functional requirement changes, this is an optimization and safety pass. -->

## Impact

- **Performance**: Discovery speed and memory footprint should improve or be validated as optimal.
- **Stability**: Mass-toggling and deleting skills will be more robust against OS-level file locking or race conditions.
- **Codebase**: Internal refactoring of `SkillTreeProvider.ts` and `extension.ts` without changing the external behavior or user interface.
