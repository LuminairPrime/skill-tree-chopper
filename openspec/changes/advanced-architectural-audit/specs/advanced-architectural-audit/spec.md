## ADDED Requirements

### Requirement: Non-Blocking File System Operations
The system SHALL ensure that large or slow file system traversals during the discovery phase do not block the VS Code extension host's main event loop.

#### Scenario: Scanning a slow network drive
- **WHEN** the extension initiates a scan on a workspace located on a high-latency drive
- **THEN** the UI must remain responsive, utilizing asynchronous file system APIs (`fs.promises`) and properly awaiting them instead of synchronous calls.

### Requirement: Race Condition Mitigation
The system SHALL safely handle concurrent folder modifications, particularly during mass-toggle operations that trigger multiple rapid file system moves.

#### Scenario: Mass-toggling skills
- **WHEN** the user checks a container node with 20 child skills
- **THEN** the system must execute the move commands sequentially or via safely managed parallel promises with individual error boundaries to prevent file lock collisions or partial failure states.

### Requirement: Algorithmic Efficiency
The discovery mapping algorithm SHALL operate with optimal time and space complexity ($O(N)$ where N is the number of active/archived skill folders).

#### Scenario: Parsing large numbers of skills
- **WHEN** the tree hierarchy is built from the discovered paths
- **THEN** it must utilize early-exit conditions (e.g., stopping the file scan as soon as `skill.md` is found) and avoid $O(N^2)$ array lookups by leveraging HashMaps or Sets.

### Requirement: Memory Leak Prevention
The system SHALL ensure that VS Code commands and Event Emitters are properly registered and disposed of to prevent memory leaks during the extension's lifecycle.

#### Scenario: Refreshing the tree view
- **WHEN** the `refresh` command is invoked rapidly
- **THEN** the `EventEmitter` must not orphan listeners, and the memory footprint must remain stable across garbage collection cycles.