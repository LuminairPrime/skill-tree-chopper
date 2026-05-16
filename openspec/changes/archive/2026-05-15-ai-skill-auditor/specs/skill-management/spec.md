## ADDED Requirements

### Requirement: Enable and disable skills via checkbox
The system SHALL display a checkbox on tree items representing the skill state (enabled/disabled) and toggle this state by moving the skill folder between its active directory (e.g., `skills/` or `rules/`) and an inactive directory (`skills-disabled/` or `rules-disabled/`).

#### Scenario: Disabling an enabled skill
- **WHEN** the user unchecks the checkbox for a skill folder
- **THEN** the system renames the parent folder to append `-disabled` (e.g., from `.cursor/skills/xyz` to `.cursor/skills-disabled/xyz`) using VS Code FS APIs.

#### Scenario: Enabling a disabled skill
- **WHEN** the user checks the checkbox for a disabled skill folder
- **THEN** the system removes `-disabled` from the parent folder name (e.g., from `.cursor/skills-disabled/xyz` to `.cursor/skills/xyz`).

### Requirement: Delete skill via context menu
The system SHALL provide a context menu action (with a trash icon) on skill files to delete them safely.

#### Scenario: Deleting a skill file
- **WHEN** the user invokes the "Delete Skill" command on a file node
- **THEN** the file is moved to the OS Recycle Bin using `vscode.workspace.fs.delete` with `{ useTrash: true }`.