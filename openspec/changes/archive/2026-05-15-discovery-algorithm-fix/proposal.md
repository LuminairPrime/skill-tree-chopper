## Why

The current file discovery algorithm uses overly permissive glob patterns (`**`) which causes the extension to mistakenly index random `.md` files buried deep within non-agent directories (such as `vendors/` or `node_modules/`). AI programming agents only scan a very specific, shallow path (`.agent/skills/<skill-folder>/skill.md`). If we do not restrict our discovery and move logic strictly to this established schema, we risk corrupting arbitrary user folders. Furthermore, users need a way to enable/disable entire blocks of skills en masse rather than clicking individual checkboxes one by one.

## What Changes

- **BREAKING**: Constrain the discovery algorithm to strictly look at known global and workspace agent paths (e.g. `.claude/skills/`, `.cursor/rules/`). It will only go one folder deep to look for a `skill.md` file. It will no longer recursively search `**`.
- **BREAKING**: Rename the archive folder from `archived` to `.archived` to clearly signal it as a hidden, managed state folder.
- Add an intermediate "skills" node in the tree (between the Agent node and the Skill folders) that includes a checkbox. Toggling this checkbox will en-masse move all child skill folders into or out of the `.archived` directory.
- Update the archive move logic to rigorously verify that the source folder *actually contains* a `skill.md` file before invoking any file system rename commands, ensuring we do not accidentally move unrelated folders.

## Capabilities

### New Capabilities
<!-- No brand new specs -->

### Modified Capabilities
- `skill-discovery`: The algorithm is changing from deep recursive globs to strict path-joining with a 1-level depth check.
- `skill-tree-view`: The tree hierarchy is being updated to include the intermediate `skills`/`rules` folder which will have its own mass-toggle checkbox.
- `skill-management`: The archive target is renamed to `.archived` and the move commands will incorporate strict validation checks.

## Impact

- **Performance**: Discovery will be significantly faster because we are explicitly targeting paths rather than relying on deep file system crawling.
- **Safety**: Strict validation prevents the extension from touching arbitrary `.md` files in the user's workspace.
- **Documentation**: The `README.md` must be updated to explain the `.archived` folder naming convention.