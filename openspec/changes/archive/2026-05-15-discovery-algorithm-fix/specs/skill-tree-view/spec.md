## MODIFIED Requirements

### Requirement: Hierarchical Display

The system MUST display skills in a nested tree view grouped structurally by Scope, then by Agent Directory, then by intermediate Skills container, and finally listing the Skill Folders as leaf nodes.

#### Scenario: Expanding the workspace scope

- **WHEN** the user expands the "Workspace Skills" root node
- **THEN** they see folders representing agent directories (e.g., `.cursor`, `.agents`), and within those, an intermediate `skills` or `rules` folder.

#### Scenario: Interacting with the intermediate container

- **WHEN** the tree view renders the intermediate `skills` container
- **THEN** this container must have a checkbox that allows the user to en-masse toggle the state of all child skill folders.
