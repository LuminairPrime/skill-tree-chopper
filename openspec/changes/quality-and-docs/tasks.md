## 1. Documentation

- [x] 1.1 Create `README.md` at the root of the project.
- [x] 1.2 Write the "Why it exists" and "How it works" (context bloat and `-disabled` folders) sections in the README.
- [x] 1.3 List the supported global and workspace paths scanned by the extension in the README.
- [x] 1.4 Add basic usage instructions (Activity Bar, Checkbox to toggle, Trash icon to delete) to the README.

## 2. Test Infrastructure Setup

- [ ] 2.1 Add `@vscode/test-cli`, `@vscode/test-electron`, `@types/mocha`, and `@types/chai` to `devDependencies` in `package.json`.
- [ ] 2.2 Configure the `test` script in `package.json` to use `vscode-test`.
- [ ] 2.3 Refactor `SkillTreeProvider.ts` constructor to accept an optional `homedirOverride?: string` parameter for dependency injection during testing.

## 3. Unit Tests Implementation

- [ ] 3.1 Create `src/test/suite/index.ts` to configure the Mocha test runner.
- [ ] 3.2 Create `src/test/suite/SkillTreeProvider.test.ts`.
- [ ] 3.3 Implement test setup logic to create a temporary mocked `homedir` and inject it into a new instance of `SkillTreeProvider`.
- [ ] 3.4 Write a unit test asserting that `getGlobalSkills()` correctly identifies `.md` files in mock active skill folders.
- [ ] 3.5 Write a unit test asserting that `getGlobalSkills()` correctly parses mock `-disabled` folders.

## 4. Integration Tests Implementation

- [ ] 4.1 Create `src/test/suite/extension.test.ts`.
- [ ] 4.2 Write an integration test that triggers the `aiSkills.refresh` command to ensure it does not throw an error.
- [ ] 4.3 Write an integration test that mocks a `vscode.window.createTreeView` checkbox state change and verifies `vscode.workspace.fs.rename` is invoked correctly.
- [ ] 4.4 Write an integration test that calls the `aiSkills.deleteSkill` command with a mock `SkillNode` and verifies `vscode.workspace.fs.delete` is invoked.