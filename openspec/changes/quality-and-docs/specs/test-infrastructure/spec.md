## ADDED Requirements

### Requirement: Sandboxed Test Environment

The system SHALL execute tests in an isolated, sandboxed environment to prevent modifications to the developer's actual file system during test runs.

#### Scenario: Running automated tests

- **WHEN** the test suite is executed
- **THEN** it must use mock directories or a mocked `os.homedir()` implementation instead of resolving to the host's actual global configuration directories.

### Requirement: Unit Testing Discovery Logic

The system SHALL contain unit tests that verify the correct behavior of the `SkillTreeProvider`'s file discovery and hierarchy building logic.

#### Scenario: Discovering skills in a mocked workspace

- **WHEN** the `getWorkspaceSkills` or `getGlobalSkills` method is invoked in a test context
- **THEN** it must correctly identify valid `.md` files and ignore non-matching files according to the established glob patterns and schema.

### Requirement: Integration Testing VS Code Interactions

The system SHALL contain integration tests that spin up the VS Code Extension Host to verify UI and file system command behavior.

#### Scenario: Disabling a skill via command

- **WHEN** the checkbox state change is simulated or the disable action is triggered
- **THEN** the system must invoke `vscode.workspace.fs.rename` to correctly append `-disabled` to the parent folder name.

#### Scenario: Deleting a skill via command

- **WHEN** the `aiSkills.deleteSkill` command is executed on a tree node
- **THEN** the system must invoke `vscode.workspace.fs.delete` with the `{ useTrash: true }` option.
