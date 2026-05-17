# Skill Tree Chopper

**Skill Tree Chopper** is a VS Code extension designed to help developers audit and disable AI skill folders that are scattered across global and workspace directories.

## Why it exists (The Problem)

AI tools can accumulate local skill folders over time, especially when you experiment with different prompts, workflows, and project-specific instructions. Those folders are easy to forget because they live in hidden directories under your home folder or workspace root.

Over time, this causes **"context bloat."** Multiple active skills can push an agent in different directions, make behavior harder to reason about, and waste tokens on instructions you no longer want loaded.

## How it works (The Solution)

This extension provides a unified dashboard in the VS Code Activity Bar. It scans a known set of skill directories and displays them in a native Tree View.

Instead of editing skill contents, Skill Tree Chopper manages state by **moving skill folders into a `.archived` subdirectory**.

When you disable a skill by unchecking its box, the extension validates that the folder contains a `skill.md` file and moves it from the active `skills` directory into `.archived`. Re-enabling a skill moves it back into the active folder. The extension does not delete skills; if you want to remove one permanently, do that directly in your file system.

## Installation

After publication, install from the VS Code Marketplace by searching for **Skill Tree Chopper**.

For local or pre-release installs:

1. Open VS Code.
2. Open the Extensions view.
3. Open the view menu in the top-right corner.
4. Choose **Install from VSIX...**.
5. Select the `.vsix` package you want to install.

## Supported Paths

The extension currently monitors these exact locations:

### Global Paths (in your Home Directory `~`)
- `~/.cursor/skills` (and its `.archived` counterpart)
- `~/.claude/skills`
- `~/.agents/skills`
- `~/.gemini/skills`
- `~/.forge/skills`

### Workspace Paths (in your current open project)
- The exact same folder structure as above, but located at the root of your VS Code workspace (e.g. `[WorkspaceRoot]/.cursor/skills`).

## Limitations

- The extension only scans the agent roots listed above.
- It only treats subfolders of a directory named `skills` as manageable skills.
- A folder is considered a skill only when it contains a `skill.md` file.

## Usage Instructions

1. **Open the Auditor:** Click the AI Skills icon (a robot/hubot icon) in the VS Code Activity Bar on the left.
2. **View Skills:** The tree view will display all discovered global and workspace skills. The hierarchy is organized by Scope (Workspace vs Global), Agent (`.cursor`, `.agents`), and the container folder (`skills`).
3. **Mass Toggle:** You can click the checkbox next to the `skills` container to immediately archive or unarchive ALL skill folders inside it at once.
4. **Individual Toggle:** Click the checkbox next to any specific skill folder to toggle its archive state.
5. **Refresh:** Click the refresh icon at the top of the view to manually rescan the file system if you added, removed, or moved skills outside of the extension.

## Development

This project uses [mise](https://mise.jdx.dev/) as a task runner to manage builds, tests, and packaging.

1. Install dependencies: `npm install`
2. Build the extension: `mise run build`
3. Run unit tests: `mise run test`
4. Package the extension: `mise run package` (The `.vsix` will be generated in the `releases/` directory)
5. Clean up build artifacts: `mise run clean`

### Publishing to the VS Code Marketplace

This extension is published under the `LuminairPrime` namespace. 

1. **Create an Azure DevOps Personal Access Token (PAT):** 
   You must have a PAT with the `Marketplace (Manage)` scope. 
2. **Login:** Run `mise run login` and paste your PAT when prompted.
3. **Publish an Update:** 
   The VS Code Marketplace **does not allow overwriting existing versions**. If you try to publish a version number that is already live, the Marketplace will reject it. You must bump the version for every new release.

   To automatically handle versioning, building, and publishing, run one of the following commands:
   * **`mise run publish`** (or `publish:patch`) — Auto-bumps the **patch** version (e.g., `1.0.0` -> `1.0.1`) for bug fixes. This is the safest and most common default.
   * **`mise run publish:minor`** — Auto-bumps the **minor** version (e.g., `1.0.1` -> `1.1.0`) for new features.
   * **`mise run publish:major`** — Auto-bumps the **major** version (e.g., `1.1.0` -> `2.0.0`) for breaking changes.

   **What happens under the hood when you run these?**
   1. **Version Bump & Git Tag:** The underlying `vsce` tool automatically increments the version in `package.json`, creates a Git commit, and tags the commit.
   2. **Rebuild:** `mise` guarantees the latest code is compiled by running the `build` task as a dependency.
   3. **Package & Push:** It packages the clean `.vsix` payload (ignoring our development and archive files) and uploads it to the Marketplace.

The unit tests live under `test/unit` and currently focus on archive-state logic and skill discovery rules. See [docs/testing.md](docs/testing.md) for details.