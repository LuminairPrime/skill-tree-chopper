# Skill Tree Chopper

**Skill Tree Chopper** is a VS Code extension designed to help developers audit and toggle AI skill folders that are scattered across global and workspace directories.

## Why it exists (The Problem)

AI tools can accumulate local skill folders over time, especially when you experiment with different prompts, workflows, and project-specific instructions. Those folders are easy to forget because they live in hidden directories under your home folder or workspace root.

Over time, this causes **"context bloat."** Multiple active skills can push an agent in different directions, make behavior harder to reason about, and waste tokens on instructions you no longer want loaded.

## How it works (The Solution)

This extension provides a unified dashboard in the VS Code Activity Bar. It scans a known set of skill directories and displays them in a native Tree View.

Instead of editing skill contents, Skill Tree Chopper manages state by **moving skill folders into a `.archived` subdirectory**.

When you disable a skill by unchecking its box, the extension validates that the folder contains a `skill.md` file and moves it from the active `skills` directory into `.archived`. Re-enabling a skill moves it back into the active folder. The extension does not delete skills; if you want to remove one permanently, do that directly in your file system.

## Installation

After publication, install from the VS Code Marketplace by searching for **Skill Tree Chopper**!!

For local or pre-release installs:

1. Open VS Code.
2. Open the Extensions view.
3. Open the view menu in the top-right corner.
4. Choose **Install from VSIX...**.
5. Select the `.vsix` package you want to install.

## Supported Paths

The extension monitors an exhaustive list of standard agent directories based on industry frameworks (like OpenSpec, PRPM, and the Agent Skills standard), covering over 50 different AI tools.

### Global Paths (in your Home Directory `~`)

It scans for `skills` subfolders within these agent directories, including:

- **Major Assistants:** `~/.claude`, `~/.cursor`, `~/.gemini`, `~/.github` (Copilot), `~/.codeium/windsurf`, `~/.codex`
- **Universal Standards:** `~/.agents`, `~/.agent`, `~/.prompts`
- **Ecosystems & CLI Agents:** `.amazonq`, `.augment`, `.cline`, `.continue`, `.factory`, `.kiro`, `.opencode`, `.roo`, `.trae`, and many more.

_(For the complete list, see `KNOWN_AGENT_PREFIXES` in the source code.)_

### Workspace Paths (in your current open project)

- The exact same folder structure as above, but located at the root of your VS Code workspace (e.g. `[WorkspaceRoot]/.cursor/skills`).

## Limitations

- The extension only scans the agent roots listed above.
- It only treats subfolders of a directory named `skills` as manageable skills.
- A folder is considered a skill only when it contains a `skill.md` file.

## Usage Instructions

1. **Open the Auditor:** Click the Skill Tree Chopper icon in the VS Code Activity Bar on the left.
2. **View Skills:** The tree view will display all discovered global and workspace skills. The hierarchy is organized by Scope (Workspace vs Global), Agent (`.cursor`, `.agents`), and the container folder (`skills`).
3. **Mass Toggle:** You can click the checkbox next to the `skills` container to immediately archive or unarchive ALL skill folders inside it at once.
4. **Individual Toggle:** Click the checkbox next to any specific skill folder to toggle its archive state.
5. **Refresh:** Click the refresh icon at the top of the view to manually rescan the file system if you added, removed, or moved skills outside of the extension.

## Contributing

Interested in building the extension from source, running the tests, or publishing an update?

Please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) guide for full details on our `mise` workflows, quality gates, and deployment process. Release notes live in [CHANGELOG.md](CHANGELOG.md).
