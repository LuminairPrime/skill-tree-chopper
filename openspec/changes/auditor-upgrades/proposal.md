## Why

While the foundational AI Skill Auditor successfully maps and manages scattered skill files, we need to optimize it for latency and reliability. Other tools in this space (like `agent-skills-manager` and `skills-desktop`) have struggled with deep system scans that hang or trigger permission errors, and relied heavily on complex native dependencies. We need to introduce performance heuristics, graceful permission degradation, and establish a cross-platform strategy that defers the standalone GUI to ensure a stable, lightweight v1 release in VS Code.

## What Changes

- Implement a fast-fail heuristic for discovery: Instead of rigorously scanning every file in a directory, we simply check if a single `SKILL.md` (or equivalent) exists at the expected depth to mark a directory as populated.
- Optimize UI latency by keeping the global skills folder collapsed by default (lazy loading).
- Add graceful degradation for file operations: If read permissions fail, display the folder as read-only. If delete permissions fail, fall back to disabling via folder renaming.
- Establish a cross-platform roadmap, ensuring the VS Code extension works on Windows, Linux, and macOS without native binding hell, while officially deferring a standalone GUI app to a future version.

## Capabilities

### New Capabilities
- `cross-platform-architecture`: Establishes the cross-platform constraints (Windows/Linux/macOS) and explicitly defers the standalone GUI app for v2.

### Modified Capabilities
- `skill-discovery`: Replacing deep scanning with a fast heuristic (checking for a single skill file presence) and handling read-permission degradation.
- `skill-tree-view`: Adding lazy loading/default-collapsed state for the global skills folder to improve initial load latency.
- `skill-management`: Adding a graceful fallback mechanism to rename/disable folders if deletion permissions are restricted.

## Impact

- **Performance**: Massive reduction in disk I/O during startup by using heuristics and lazy-loading global directories.
- **Reliability**: Eliminates crashes or hangs caused by OS permission prompts.
- **Product Strategy**: Explicitly scopes the v1 release strictly to the VS Code extension, deferring the standalone desktop app to avoid native UI framework complexity.