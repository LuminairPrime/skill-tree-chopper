## Context

The `ai-skill-auditor` extension has been implemented with functional logic but currently lacks both a formal testing infrastructure and user-facing documentation. To ensure long-term stability—especially concerning file system operations (`fs.rename` and `fs.delete`) which can be destructive if misconfigured—we need a robust test harness. We must also document the extension so users understand the mechanism of disabling skills via folder renaming (`-disabled`).

## Goals / Non-Goals

**Goals:**
- Provide clear, accessible user documentation via `README.md`.
- Establish a sandboxed test environment using Mocha/Chai (VS Code's default testing framework).
- Ensure that tests do not accidentally manipulate the developer's actual `~/.cursor` or `~/.agents` directories.
- Add npm scripts to run tests seamlessly (`npm run test`).

**Non-Goals:**
- Setting up a full continuous integration (CI) pipeline (e.g., GitHub Actions) in this specific change (to be handled separately if needed).
- Changing the existing implementation logic in `SkillTreeProvider.ts` or `extension.ts` unless required to expose methods for testability.

## Decisions

- **Test Framework**: We will use VS Code's standard test setup. We will include `@vscode/test-cli` and `@vscode/test-electron` to spin up a headless extension host for integration testing. This is the industry standard for VS Code extensions and guarantees accurate VS Code API simulations.
- **Sandboxing Strategy (Mocking)**: 
  - To prevent tests from touching real user data, we will use a mocking library like `sinon` or proxyquire to stub `os.homedir()` during tests, redirecting it to a temporary `/tmp/mock-homedir` directory created before the test run. 
  - Alternatively, we may refactor `SkillTreeProvider.ts` to accept a `homedirOverride` parameter in its constructor for easier dependency injection, eliminating the need for complex mocking libraries.
- **Documentation Format**: The `README.md` will follow standard VS Code extension publishing guidelines, including screenshots (placeholders if needed), feature lists, and explicit explanations of the `-disabled` renaming mechanism.

## Risks / Trade-offs

- **Risk:** Integration tests spinning up the VS Code host can be slow and brittle on different operating systems.
  - **Mitigation:** Keep the integration tests focused strictly on the VS Code API integration points (like the checkbox toggle event and the delete command).
- **Risk:** Modifying `SkillTreeProvider` for dependency injection might introduce regressions.
  - **Mitigation:** The changes will be minimal (e.g., adding an optional constructor argument) and will default to `os.homedir()` if not provided, ensuring production code remains unaffected.