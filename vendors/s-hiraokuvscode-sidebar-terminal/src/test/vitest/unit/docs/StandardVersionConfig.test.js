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
(0, vitest_1.describe)('standard-version configuration (#273)', () => {
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
  (0, vitest_1.describe)('.versionrc.cjs existence and structure', () => {
    (0, vitest_1.it)('has .versionrc.cjs at the repository root', () => {
      (0, vitest_1.expect)(
        fs_1.default.existsSync(path_1.default.join(repoRoot, '.versionrc.cjs'))
      ).toBe(true);
    });
    (0, vitest_1.it)('exports an object with tagPrefix "v"', () => {
      const config = require(path_1.default.join(repoRoot, '.versionrc.cjs'));
      (0, vitest_1.expect)(config.tagPrefix).toBe('v');
    });
    (0, vitest_1.it)('skips tag creation to support safe release procedure', () => {
      const config = require(path_1.default.join(repoRoot, '.versionrc.cjs'));
      (0, vitest_1.expect)(config.skip?.tag).toBe(true);
    });
    (0, vitest_1.it)('skips push to support safe release procedure', () => {
      const config = require(path_1.default.join(repoRoot, '.versionrc.cjs'));
      (0, vitest_1.expect)(config.skip?.push).toBe(true);
    });
  });
  (0, vitest_1.describe)('conventional commit type mappings', () => {
    let config;
    (0, vitest_1.beforeEach)(() => {
      config = require(path_1.default.join(repoRoot, '.versionrc.cjs'));
    });
    (0, vitest_1.it)('maps feat to Added section', () => {
      const types = config.types;
      const feat = types.find((t) => t.type === 'feat');
      (0, vitest_1.expect)(feat?.section).toBe('Added');
    });
    (0, vitest_1.it)('maps fix to Fixed section', () => {
      const types = config.types;
      const fix = types.find((t) => t.type === 'fix');
      (0, vitest_1.expect)(fix?.section).toBe('Fixed');
    });
    (0, vitest_1.it)('maps perf and refactor to Changed section', () => {
      const types = config.types;
      const perf = types.find((t) => t.type === 'perf');
      const refactor = types.find((t) => t.type === 'refactor');
      (0, vitest_1.expect)(perf?.section).toBe('Changed');
      (0, vitest_1.expect)(refactor?.section).toBe('Changed');
    });
    (0, vitest_1.it)('hides test, chore, and ci types', () => {
      const types = config.types;
      for (const typeName of ['test', 'chore', 'ci']) {
        const entry = types.find((t) => t.type === typeName);
        (0, vitest_1.expect)(entry?.hidden, `${typeName} should be hidden`).toBe(true);
      }
    });
    (0, vitest_1.it)('covers all commitlint type-enum values', () => {
      const commitlintConfig = require(path_1.default.join(repoRoot, 'commitlint.config.cjs'));
      const commitlintTypes = commitlintConfig.rules['type-enum'][2];
      const types = config.types;
      const configuredTypes = types.map((t) => t.type);
      for (const commitType of commitlintTypes) {
        (0, vitest_1.expect)(configuredTypes, `missing type: ${commitType}`).toContain(commitType);
      }
    });
  });
  (0, vitest_1.describe)('devDependencies', () => {
    (0, vitest_1.it)('includes standard-version', () => {
      (0, vitest_1.expect)(devDeps).toHaveProperty('standard-version');
    });
  });
  (0, vitest_1.describe)('release scripts use standard-version', () => {
    (0, vitest_1.it)('release:patch uses standard-version', () => {
      (0, vitest_1.expect)(pkg.scripts?.['release:patch']).toContain('standard-version');
      (0, vitest_1.expect)(pkg.scripts?.['release:patch']).toContain('--release-as patch');
    });
    (0, vitest_1.it)('release:minor uses standard-version', () => {
      (0, vitest_1.expect)(pkg.scripts?.['release:minor']).toContain('standard-version');
      (0, vitest_1.expect)(pkg.scripts?.['release:minor']).toContain('--release-as minor');
    });
    (0, vitest_1.it)('release:major uses standard-version', () => {
      (0, vitest_1.expect)(pkg.scripts?.['release:major']).toContain('standard-version');
      (0, vitest_1.expect)(pkg.scripts?.['release:major']).toContain('--release-as major');
    });
    (0, vitest_1.it)('release scripts do not use --follow-tags', () => {
      (0, vitest_1.expect)(pkg.scripts?.['release:patch']).not.toContain('--follow-tags');
      (0, vitest_1.expect)(pkg.scripts?.['release:minor']).not.toContain('--follow-tags');
      (0, vitest_1.expect)(pkg.scripts?.['release:major']).not.toContain('--follow-tags');
    });
    (0, vitest_1.it)('has a changelog preview script', () => {
      (0, vitest_1.expect)(pkg.scripts?.['changelog']).toBeDefined();
      (0, vitest_1.expect)(pkg.scripts?.['changelog']).toContain('standard-version');
    });
  });
  (0, vitest_1.describe)('commands/release.js', () => {
    (0, vitest_1.it)('exists at the repository root', () => {
      (0, vitest_1.expect)(
        fs_1.default.existsSync(path_1.default.join(repoRoot, 'commands/release.js'))
      ).toBe(true);
    });
  });
});
//# sourceMappingURL=StandardVersionConfig.test.js.map
