## ADDED Requirements

### Requirement: Render TreeView hierarchy

The system SHALL display discovered skill files in a native VS Code TreeView accessible via an Activity Bar icon.

#### Scenario: Displaying skills

- **WHEN** the "AI Skills" view is opened
- **THEN** it renders a hierarchy grouped by Root Folder (grandparent), Skill Folder (parent), and Skill File (leaf).

### Requirement: Tree item icons

The system SHALL apply appropriate native ThemeIcons to the tree nodes.

#### Scenario: Icons applied

- **WHEN** the tree nodes are rendered
- **THEN** the root node uses the `repo` icon, the skill folder node uses `folder-library`, and the file node uses `markdown`.

### Requirement: Open skill file on click

The system SHALL open the skill markdown file in the editor when the file node is clicked.

#### Scenario: User clicks a skill file

- **WHEN** the user clicks a leaf node (skill file)
- **THEN** the file opens in the active VS Code text editor.
