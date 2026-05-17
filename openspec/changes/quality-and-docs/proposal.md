## Why

The current `ai-skill-auditor` MVP lacks test coverage and user documentation. Without tests, any future changes risk breaking core file-system and VS Code API interactions silently. Without documentation, users will not know why the extension exists, what problem it solves, or how to use the check-to-disable (rename) feature to manage context bloat safely. We must establish a baseline of quality and usability for this tool.

## What Changes

- Create a comprehensive `README.md` explaining the problem (context bloat), the solution (disabling vs deleting), supported directory paths, and usage instructions for the UI.
- Establish a test architecture and configuration, including a mock environment or sandbox to prevent accidental modifications to actual user files during testing.
- Implement automated unit tests targeting the `SkillTreeProvider` discovery and parsing logic.
- Implement an integration test framework (using VS Code extension testing utilities) to verify the UI interactions and file system commands (rename, delete).

## Capabilities

### New Capabilities

- `test-infrastructure`: Establishes the sandboxed automated testing environment (unit and integration tests) using mock file systems and the VS Code Extension test CLI.
- `user-documentation`: Creates the outward-facing documentation (`README.md`) detailing the extension's purpose, usage, and supported paths.

### Modified Capabilities

<!-- No existing requirement changes at the spec level. -->

## Impact

- **New Code**: Introduction of a test suite within the `src/test/` directory.
- **Documentation**: A new root-level `README.md` file.
- **Dependencies**: Addition of testing libraries as development dependencies (e.g., `@vscode/test-cli`, `@vscode/test-electron`, mock-fs tools if chosen) to `package.json`. No new runtime dependencies will be introduced.
