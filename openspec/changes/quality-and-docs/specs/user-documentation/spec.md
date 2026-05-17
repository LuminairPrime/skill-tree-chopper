## ADDED Requirements

### Requirement: Comprehensive README Documentation

The project SHALL contain a root-level `README.md` file that explains the extension's purpose, functionality, and usage instructions.

#### Scenario: User navigates to the repository or marketplace page

- **WHEN** a user views the `README.md`
- **THEN** they must understand that the extension manages context bloat by moving AI skill files into `-disabled` folders.

### Requirement: Documentation of Supported Paths

The `README.md` SHALL explicitly list the file paths and glob patterns that the extension monitors for both global and workspace configurations.

#### Scenario: User configures their environment

- **WHEN** reading the "Supported Paths" section of the documentation
- **THEN** the user can determine if their specific AI agent's configuration directory (e.g., `~/.cursor/skills`, `~/.agents`) is natively supported by the extension's discovery algorithm.
