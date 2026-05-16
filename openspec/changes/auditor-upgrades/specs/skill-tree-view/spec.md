## MODIFIED Requirements

### Requirement: Render TreeView hierarchy
The system SHALL display discovered skill files in a native VS Code TreeView accessible via an Activity Bar icon. The global root node (`~`) SHALL be collapsed by default to enable lazy-loading.

#### Scenario: Displaying skills
- **WHEN** the "AI Skills" view is opened
- **THEN** it renders a hierarchy grouped by Root Folder (grandparent), Skill Folder (parent), and Skill File (leaf).
- **AND** the global root directory is rendered in a collapsed state to prevent immediate scanning.