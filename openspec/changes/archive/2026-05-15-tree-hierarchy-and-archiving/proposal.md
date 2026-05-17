## Why

The current tree view UI is misrepresenting the hierarchy of AI skills, leading to confusion between workspace and global scopes, and displaying unnecessary file-level nodes (`.md` files) when the "skill" is fundamentally the containing folder. Additionally, the current disable mechanism (renaming the root `skills` folder to `skills-disabled`) is destructive to the directory structure and disrupts standard AI agent scanning behavior. Research shows that standard agents only shallow-scan one level deep, meaning we can elegantly disable a skill by moving it into a nested `archived/` subfolder.

## What Changes

- **BREAKING**: Refactor the tree view to enforce a strict visual hierarchy: `Workspace Skills` (expanded by default) and `Global Skills` (collapsed by default) at the absolute root.
- Remove individual `.md` files from the tree UI. The "Skill Folder" (e.g., `my-skill`) is the lowest level leaf node.
- Update the tree hierarchy to correctly group by the agent type (e.g., `.cursor`, `.agents`) underneath the `Workspace` or `Global` roots.
- **BREAKING**: Change the disable logic. Instead of renaming folders with a `-disabled` suffix, unchecking a skill will move the skill folder into an `archived` subdirectory (e.g., `.cursor/skills/my-skill` moves to `.cursor/skills/archived/my-skill`). Checking the box moves it back.

## Capabilities

### New Capabilities

<!-- No new net-new capabilities, only modifying existing ones. -->

### Modified Capabilities

- `skill-tree-view`: Changing the root structural hierarchy and removing file-level leaf nodes.
- `skill-management`: Changing the disable/enable mechanism from suffix-renaming to `archived` subdirectory moving.

## Impact

- **UI**: The TreeView will be cleaner and strictly folder-based.
- **File System**: Disabling skills will now create nested `archived` directories rather than changing top-level folder names.
- **Agent Integration**: This aligns natively with how agents scan for skills, leveraging depth-limits instead of string matching.
