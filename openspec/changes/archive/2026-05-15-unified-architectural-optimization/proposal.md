## Why

The current discovery algorithm and file operations in `ai-skill-auditor` suffer from critical performance bottlenecks, race conditions, and poor error visibility. Specifically, synchronous `fs` methods block the VS Code UI event loop, the global discovery blindly scans the entire `os.homedir()` (the single largest performance sink), and mass-toggle operations risk file-lock crashes. This unified proposal supersedes previous optimization attempts to deliver a fast, remote-compatible, and enterprise-grade extension.

## What Changes

- **Asynchronous I/O**: Completely eliminate `fs.*Sync` operations. We will migrate discovery to `vscode.workspace.fs.readDirectory()` to natively support VS Code's remote development (SSH, Containers, WSL) and ensure the UI never freezes.
- **Home Directory Allowlist**: Stop scanning the entire `os.homedir()`. Discovery will strictly target a known list of agent roots (`.cursor`, `.claude`, `.agents`, `.gemini`, `.forge`, etc.).
- **O(1) Validation Checks**: Replace the inner directory read used for checking `skill.md` with a targeted, constant-time `fs.promises.access(path.join(..., 'skill.md'))` to eliminate nested $O(n^2)$ read patterns.
- **Error Visibility**: Create a VS Code `OutputChannel` ("AI Skill Auditor") to surface errors gracefully instead of silently swallowing exceptions.
- **Safe Mass-Toggling**: Ensure `moveFolder` commands are executed sequentially in `extension.ts` to prevent TOCTOU (Time-of-Check to Time-of-Use) file-lock collisions.
- **Memory Safety**: Verify the disposal of the `EventEmitter` and command registrations.

## Capabilities

### New Capabilities

- `unified-architectural-optimization`: Establishes the baseline for non-blocking I/O, error visibility, and secure sequential file manipulation.

### Modified Capabilities

<!-- No modified requirements for existing capabilities, just foundational architectural upgrades. -->

## Impact

- **Performance**: Startup speed will increase dramatically by omitting the `os.homedir()` iteration, and the UI will remain completely responsive during deep scans.
- **Reliability**: Remote development environments will be natively supported via `vscode.workspace.fs`, and file operations will be immune to parallel-execution locks.
- **Debugging**: Users and developers will have an Output Channel to view logs when permissions or file locks fail.
