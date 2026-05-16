## MODIFIED Requirements

### Requirement: Delete skill via context menu
The system SHALL provide a context menu action (with a trash icon) on skill files to delete them safely. If deletion is blocked by OS permissions, the system SHALL attempt to disable the skill by moving it to a `-disabled` folder as a fallback.

#### Scenario: Deleting a skill file
- **WHEN** the user invokes the "Delete Skill" command on a file node
- **THEN** the file is moved to the OS Recycle Bin using `vscode.workspace.fs.delete` with `{ useTrash: true }`.

#### Scenario: Deleting a skill file fails due to permissions
- **WHEN** the user invokes the "Delete Skill" command on a file node and `vscode.workspace.fs.delete` throws an `EPERM` or `EACCES` error
- **THEN** the system catches the error and falls back to invoking the renaming/disabling logic to append `-disabled` to the parent folder.