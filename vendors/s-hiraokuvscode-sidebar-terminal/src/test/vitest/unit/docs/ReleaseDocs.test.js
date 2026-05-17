'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const fs_1 = require('fs');
const path_1 = require('path');
const repoRoot = path_1.default.resolve(__dirname, '../../../../..');
const readDoc = (relativePath) =>
  fs_1.default.readFileSync(path_1.default.join(repoRoot, relativePath), 'utf8');
(0, vitest_1.describe)('Release documentation', () => {
  (0, vitest_1.it)('documents main as the release branch', () => {
    const content = readDoc('docs/operations/RELEASE_PROCESS.md');
    (0, vitest_1.expect)(content).toContain('git checkout main');
    (0, vitest_1.expect)(content).not.toContain('for-publish');
  });
  (0, vitest_1.it)('uses supported release scripts instead of deprecated slash commands', () => {
    const content = readDoc('docs/operations/releases/RELEASE_COMMANDS.md');
    (0, vitest_1.expect)(content).toContain('npm run release:patch');
    (0, vitest_1.expect)(content).toContain('npm run release:minor');
    (0, vitest_1.expect)(content).toContain('npm run release:major');
    (0, vitest_1.expect)(content).not.toMatch(/^\/release\s+/m);
    (0, vitest_1.expect)(content).not.toMatch(/^\/quality\b/m);
    (0, vitest_1.expect)(content).not.toMatch(/^\/fix\b/m);
    (0, vitest_1.expect)(content).not.toMatch(/release:(patch|minor|major):safe/);
    (0, vitest_1.expect)(content).not.toMatch(/quality:(check|fix)/);
  });
  (0, vitest_1.it)('documents standard-version in CLAUDE.md', () => {
    const content = readDoc('CLAUDE.md');
    (0, vitest_1.expect)(content).toContain('standard-version');
  });
  (0, vitest_1.it)('avoids deprecated safe release scripts in emergency rollback guidance', () => {
    const content = readDoc('docs/operations/EMERGENCY_ROLLBACK.md');
    (0, vitest_1.expect)(content).toContain('npm run release:patch');
    (0, vitest_1.expect)(content).not.toMatch(/release:patch:safe/);
  });
});
//# sourceMappingURL=ReleaseDocs.test.js.map
