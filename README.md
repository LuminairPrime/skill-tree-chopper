# Skill Tree Chopper

**Skill Tree Chopper** is a VS Code extension designed to help developers manage, audit, and disable AI "skill" and rule files that are scattered across global and workspace directories.

## Why it exists (The Problem)

Modern AI programming tools (like Cursor, Windsurf, Cline, Copilot, etc.) often write custom rule or instruction markdown files (such as `skill.md` or `.cursorrules`) into specific `.hidden` directories in both your global user space and your project workspaces. 

Over time, this causes **"context bloat."** AI agents ingest all these scattered files indiscriminately. This leads to erratic AI behavior, conflicting instructions, and token waste because it is difficult for developers to manually track which rules are actively being loaded and applied.

## How it works (The Solution)

This extension provides a unified visual dashboard in the VS Code Activity Bar. It scans for known AI skill directories and displays them in a native Tree View.

Instead of parsing or attempting to modify the contents of these markdown files, Skill Tree Chopper manages their state by **moving the skill folders into a `.archived` subdirectory**. 

When you "disable" a skill by unchecking its box in the UI, the extension validates that the folder is a legitimate skill (contains a `.md` file) and moves it (e.g., from `.cursor/skills/my-skill` into `.cursor/skills/.archived/my-skill`). Because AI tools are configured to only scan exactly one folder deep for their skills, they will completely ignore folders hidden inside `.archived`. This is a bulletproof approach that requires no external dependencies.

## Supported Paths

The extension currently monitors the following paths:

### Global Paths (in your Home Directory `~`)
- `~/.cursor/skills` (and its `.archived` counterpart)
- `~/.claude/skills`
- `~/.agents/skills`
- `~/.gemini/skills`
- `~/.forge/skills`

### Workspace Paths (in your current open project)
- The exact same folder structure as above, but located at the root of your VS Code workspace (e.g. `[WorkspaceRoot]/.cursor/skills`).

## Usage Instructions

1. **Open the Auditor:** Click the AI Skills icon (a robot/hubot icon) in the VS Code Activity Bar on the left.
2. **View Skills:** The tree view will display all discovered global and workspace skills. The hierarchy is organized by Scope (Workspace vs Global), Agent (`.cursor`, `.agents`), and the container folder (`skills`).
3. **Mass Toggle:** You can click the checkbox next to the `skills` container to immediately archive or unarchive ALL skill folders inside it at once.
4. **Individual Toggle:** Click the checkbox next to any specific skill folder to toggle its archive state.
5. **Delete a Skill:** Hover over a specific skill folder in the tree and click the **Trash** icon to permanently delete the entire folder and its contents (moves it to the OS Recycle Bin).
6. **Refresh:** Click the refresh icon at the top of the view to manually rescan the file system if you added skills outside of the extension.