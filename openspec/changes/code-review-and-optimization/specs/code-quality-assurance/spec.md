## ADDED Requirements

### Requirement: Non-Blocking File System Operations
The system SHALL ensure that large or slow file system traversals during the `getWorkspaceSkills` and `getGlobalSkills` operations do not block the VS Code extension host's main event loop.

#### Scenario: Scanning a slow network drive
- **WHEN** the extension initiates a scan on a workspace located on a high-latency drive
- **THEN** the UI must remain responsive, utilizing asynchronous file system APIs (`fs.promises` or `vscode.workspace.fs`) instead of synchronous ones where possible.

### Requirement: Race Condition Mitigation
The system SHALL safely handle concurrent folder modifications, particularly during mass-toggle operations that trigger multiple rapid file system moves.

#### Scenario: Mass-toggling skills
- **WHEN** the user checks a container node with 20 child skills
- **THEN** the system must execute the move commands either sequentially or via safely managed parallel promises to prevent file lock collisions or partial failure states.

### Requirement: Algorithmic Efficiency
The discovery mapping algorithm SHALL operate with optimal time and space complexity ($O(N)$ where N is the number of active/archived skill folders).

#### Scenario: Parsing large numbers of skills
- **WHEN** the tree hierarchy is built from the discovered paths
- **THEN** it must not use nested loops that degrade to $O(N^2)$ complexity, utilizing hash maps for constant-time lookups where appropriate.