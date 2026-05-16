## MODIFIED Requirements

### Requirement: Hierarchical Display
The system MUST display skills in a nested tree view grouped structurally by Scope, then by Agent Directory, and finally listing the Skill Folders as leaf nodes.

#### Scenario: Expanding the workspace scope
- **WHEN** the user expands the "Workspace Skills" root node
- **THEN** they see folders representing agent directories (e.g., `.cursor`, `.agents`), and within those, the skill folders (e.g., `my-skill`).

#### Scenario: Removing file-level nodes
- **WHEN** the tree view renders the lowest level of discovered skills
- **THEN** it must only display the containing skill folder (e.g., `my-skill`) and MUST NOT display the underlying `.md` file.