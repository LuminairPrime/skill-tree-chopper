## MODIFIED Requirements

### Requirement: Discover global AI skill folders
The system SHALL scan predefined global AI agent configuration directories within the user's home directory (e.g., `~/.cursor/skills`, `~/.claude/skills`, `~/.agents/skills`) using a fast heuristic that checks for the presence of a single `SKILL.md` (or equivalent) rather than rigorously scanning every file in a directory.

#### Scenario: Global skills exist
- **WHEN** the user expands the global root node
- **THEN** it performs a shallow heuristic check on the predefined global paths to verify if they are populated with markdown files representing AI skills.

## ADDED Requirements

### Requirement: Handle read permission errors gracefully
The system SHALL catch `EACCES` or `EPERM` errors when attempting to read directories during discovery, and gracefully display the folder as read-only.

#### Scenario: Directory lacks read permissions
- **WHEN** the discovery algorithm attempts to read a protected directory and fails
- **THEN** the system catches the error and surfaces the directory node with a lock icon (`ThemeIcon('lock')`) and a read-only tooltip, rather than crashing or hanging.