'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const fs_1 = require('fs');
const path_1 = require('path');
const repoRoot = path_1.default.resolve(__dirname, '../../../../..');
const readText = (relativePath) =>
  fs_1.default.readFileSync(path_1.default.join(repoRoot, relativePath), 'utf8');
const readPackageJson = () => {
  const raw = readText('package.json');
  return JSON.parse(raw);
};
(0, vitest_1.describe)('Pre-commit workflow configuration (#272)', () => {
  let pkg;
  let devDeps;
  (0, vitest_1.beforeEach)(() => {
    pkg = readPackageJson();
    devDeps = pkg.devDependencies ?? {};
  });
  (0, vitest_1.afterEach)(() => {
    pkg = null;
    devDeps = null;
  });
  (0, vitest_1.it)('adds required dev dependencies for hooks and commit message linting', () => {
    // Given: package.json devDependencies
    // When: checking required hook packages
    // Then: all hook-related packages are present
    (0, vitest_1.expect)(devDeps).toHaveProperty('husky');
    (0, vitest_1.expect)(devDeps).toHaveProperty('lint-staged');
    (0, vitest_1.expect)(devDeps).toHaveProperty('@commitlint/cli');
    (0, vitest_1.expect)(devDeps).toHaveProperty('@commitlint/config-conventional');
  });
  (0, vitest_1.it)('registers prepare script in package.json', () => {
    // Given: package.json scripts
    // When: checking hook registration
    // Then: prepare script runs husky
    (0, vitest_1.expect)(pkg.scripts?.prepare).toBe('husky');
  });
  (0, vitest_1.it)('uses external lint-staged config file instead of package.json key', () => {
    // Given: lint-staged configuration
    // When: checking config location
    // Then: config lives in lint-staged.config.cjs, not package.json
    (0, vitest_1.expect)(pkg).not.toHaveProperty('lint-staged');
    (0, vitest_1.expect)(
      fs_1.default.existsSync(path_1.default.join(repoRoot, 'lint-staged.config.cjs'))
    ).toBe(true);
  });
  (0, vitest_1.it)('lint-staged config runs tsc --noEmit before lint and format', () => {
    // Given: lint-staged config for TypeScript files
    const configText = readText('lint-staged.config.cjs');
    // When: checking type check command
    // Then: tsc --noEmit is present
    (0, vitest_1.expect)(configText).toContain('tsc --noEmit');
  });
  (0, vitest_1.it)('lint-staged config includes eslint and prettier commands', () => {
    // Given: lint-staged config for TypeScript files
    const configText = readText('lint-staged.config.cjs');
    // When: checking lint and format commands
    // Then: eslint --fix and prettier --write are present
    (0, vitest_1.expect)(configText).toContain('eslint --fix');
    (0, vitest_1.expect)(configText).toContain('prettier --write');
  });
  (0, vitest_1.it)(
    'lint-staged uses function form for TypeScript to avoid file path appending',
    () => {
      // Given: lint-staged config
      const config = require(path_1.default.join(repoRoot, 'lint-staged.config.cjs'));
      // When: checking TypeScript pattern config type
      // Then: it is a function (prevents lint-staged from appending staged file paths)
      (0, vitest_1.expect)(typeof config['*.{ts,tsx}']).toBe('function');
    }
  );
  (0, vitest_1.it)('creates husky hooks for pre-commit and commit-msg', () => {
    // Given: husky hook files
    const preCommit = readText('.husky/pre-commit');
    const commitMsg = readText('.husky/commit-msg');
    // When: checking hook contents
    // Then: pre-commit runs lint-staged, commit-msg runs commitlint with quoted arg
    (0, vitest_1.expect)(preCommit).toContain('npx lint-staged');
    (0, vitest_1.expect)(commitMsg).toContain('commitlint --edit "$1"');
  });
  (0, vitest_1.it)('defines commitlint configuration using conventional commits', () => {
    // Given: commitlint config file
    const configText = readText('commitlint.config.cjs');
    // When: checking config content
    // Then: extends conventional commits and defines type-enum
    (0, vitest_1.expect)(configText).toContain("extends: ['@commitlint/config-conventional']");
    (0, vitest_1.expect)(configText).toContain("'type-enum'");
  });
});
//# sourceMappingURL=PreCommitWorkflowConfig.test.js.map
