# Testing

Skill Tree Chopper uses **Vitest** for focused unit testing of the archive and skill-detection rules.

## Test Layout

- `test/unit/skillFolderState.test.ts`: archive-path, checkbox-state, and `skill.md` detection rules.
- `test/unit/SkillTreeProvider.test.ts`: skill-folder discovery, checkbox aggregation, and root-tree assembly.
- `test/mocks/vscode.ts`: lightweight `vscode` runtime mock used by the provider unit tests.

## Commands

- `npm test`: run the full unit suite once.
- `npm run test:watch`: run the unit suite in watch mode.

## Scope

The current suite is intentionally small and targets the highest-risk logic that powers the main feature:

- determining whether a skill is active or archived
- computing the next path when a skill is toggled
- deciding how the `skills` container checkbox should behave
- ensuring only folders with `skill.md` count as skills
- verifying that workspace and global tree roots only include valid skill directories

As the extension grows, keep new pure logic under unit coverage first and only add heavier VS Code host tests when the behavior cannot be validated outside the extension runtime.