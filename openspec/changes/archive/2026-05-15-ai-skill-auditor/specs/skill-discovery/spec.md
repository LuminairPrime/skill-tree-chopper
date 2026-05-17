## ADDED Requirements

### Requirement: Discover global AI skill folders

The system SHALL scan predefined global AI agent configuration directories within the user's home directory (e.g., `~/.cursor/skills`, `~/.claude/skills`, `~/.agents/skills`) to find global skill rules.

#### Scenario: Global skills exist

- **WHEN** the extension initializes or the refresh command is invoked
- **THEN** it performs a file read on the predefined global paths to locate markdown files representing AI skills.

### Requirement: Discover workspace AI skill folders

The system SHALL utilize VS Code's native file discovery API to locate skill files within the currently opened workspace.

#### Scenario: Workspace skills exist

- **WHEN** the extension searches the workspace
- **THEN** it executes a find operation using globs like `**/{skills,rules}/**/{SKILL.md,*.md}` to dynamically locate nested rule files across all open folders.
