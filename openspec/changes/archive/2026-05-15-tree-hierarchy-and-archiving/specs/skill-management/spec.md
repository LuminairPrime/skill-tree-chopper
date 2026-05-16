## MODIFIED Requirements

### Requirement: Disabling Skills
The system SHALL disable a skill by moving its parent folder into an `archived` subdirectory within the agent's root skills directory.

#### Scenario: Disabling an active skill
- **WHEN** the user unchecks a skill folder (e.g., `.cursor/skills/my-skill`)
- **THEN** the system must invoke a file system move to `.cursor/skills/archived/my-skill`.

#### Scenario: Enabling a disabled skill
- **WHEN** the user checks a disabled skill folder currently located in `.cursor/skills/archived/my-skill`
- **THEN** the system must invoke a file system move to `.cursor/skills/my-skill`.