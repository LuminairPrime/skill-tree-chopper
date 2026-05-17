# Contributing to Skill Tree Chopper

Thank you for your interest in contributing! This document outlines the development workflow, quality standards, and publishing process for the extension.

## Development Setup

This project uses [mise](https://mise.jdx.dev/) as a task runner to manage builds, tests, and packaging.

1. Install dependencies: `npm install`
2. Build the extension: `mise run build`
3. Check code quality: `mise run lint`
4. Format the code: `mise run format`
5. Run unit tests: `mise run test`
6. Package the extension: `mise run package` (The `.vsix` will be generated in the `releases/` directory)
7. Clean up build artifacts: `mise run clean`

The unit tests live under `test/unit` and cover archive-state logic, skill discovery rules, and the extension's activation and checkbox-toggle wiring. See [docs/testing.md](docs/testing.md) for details.

## Code Quality & CI

This repository is protected by automated quality gates to ensure high standards:

- **Husky & lint-staged:** Before every commit, Prettier is automatically run on your staged files to guarantee consistent formatting.
- **GitHub Actions:** Every push to `main` and Pull Request triggers a CI workflow that verifies formatting, runs the linter, executes unit tests, and confirms the extension builds successfully.

## Publishing to the VS Code Marketplace

This extension is published under the `LuminairPrime` namespace.

1. **Create an Azure DevOps Personal Access Token (PAT):**
   You must have a PAT with the `Marketplace (Manage)` scope.
2. **Login:** Run `mise run login` and paste your PAT when prompted.
3. **Publish an Update:**
   The VS Code Marketplace **does not allow overwriting existing versions**. If you try to publish a version number that is already live, the Marketplace will reject it. You must bump the version for every new release.

   To automatically handle versioning, building, and publishing, run one of the following commands:
   - **`mise run publish`** (or `publish:patch`) — Auto-bumps the **patch** version (e.g., `1.0.0` -> `1.0.1`) for bug fixes. This is the safest and most common default.
   - **`mise run publish:minor`** — Auto-bumps the **minor** version (e.g., `1.0.1` -> `1.1.0`) for new features.
   - **`mise run publish:major`** — Auto-bumps the **major** version (e.g., `1.1.0` -> `2.0.0`) for breaking changes.

   **What happens under the hood when you run these?**
   1. **Quality Gates:** `mise` strictly enforces quality by verifying a clean Git working directory, running the linter (`mise run lint`), executing all tests (`mise run test`), and finally compiling the source (`mise run build`). If any step fails, the publish is aborted.
   2. **Version Bump & Git Tag:** The underlying `vsce` tool automatically increments the version in `package.json`, creates a Git commit, and tags the commit.
   3. **Package & Push:** It packages the clean `.vsix` payload (ignoring our development and archive files) and uploads it to the Marketplace.
