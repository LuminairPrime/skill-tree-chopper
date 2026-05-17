## ADDED Requirements

### Requirement: Break circular dependencies

The system SHALL NOT contain circular module imports between the extension entry point and the TreeDataProvider.

#### Scenario: Extension initialization

- **WHEN** the extension is activated
- **THEN** it instantiates the OutputChannel and injects it into the SkillTreeProvider constructor.

### Requirement: Optimized skill validation

The system SHALL validate skill directories efficiently.

#### Scenario: Validating a skill directory

- **WHEN** the system checks if a directory is a skill
- **THEN** it executes a single directory read and performs a case-insensitive match for "skill.md".

### Requirement: Safe directory creation

The system SHALL create the archive directory robustly.

#### Scenario: Archiving a skill

- **WHEN** a skill is moved to the `.archived` folder
- **THEN** the system calls `createDirectory` without checking prior existence.

### Requirement: Contextual action precision

The system SHALL only display the delete action on valid skill nodes.

#### Scenario: User right-clicks a node

- **WHEN** a user right-clicks an `agent-root` or `skills-container` node
- **THEN** the delete trash icon is hidden.
- **WHEN** a user right-clicks a `skill-folder` node
- **THEN** the delete trash icon is visible.

### Requirement: Mass toggle progress indication

The system SHALL provide user feedback during long operations.

#### Scenario: User toggles a large container

- **WHEN** a user clicks the checkbox for a `skills-container` with many children
- **THEN** a progress indicator notification is displayed until the toggling is complete.
