## MODIFIED Requirements

### Requirement: Disabling Skills
The system SHALL disable a skill by moving its parent folder into an `.archived` subdirectory within the agent's root skills directory.

#### Scenario: Disabling an active skill
- **WHEN** the user unchecks a skill folder (e.g., `.cursor/skills/my-skill`)
- **THEN** the system must invoke a file system move to `.cursor/skills/.archived/my-skill` after strictly validating the target folder contains a `skill.md` file.

#### Scenario: Enabling a disabled skill
- **WHEN** the user checks a disabled skill folder currently located in `.cursor/skills/.archived/my-skill`
- **THEN** the system must invoke a file system move to `.cursor/skills/my-skill`.

### Requirement: Mass Disabling Skills
The system SHALL support en-masse enabling and disabling of skill folders at the `skills` container level.

#### Scenario: Disabling all skills
- **WHEN** the user unchecks the intermediate `skills` container node
- **THEN** the system must invoke a move operation on all active child skill folders, placing them into the `.archived` directory.