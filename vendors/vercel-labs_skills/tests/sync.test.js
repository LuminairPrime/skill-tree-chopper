"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const test_utils_ts_1 = require("../src/test-utils.ts");
(0, vitest_1.describe)('experimental_sync command', () => {
    let testDir;
    (0, vitest_1.beforeEach)(() => {
        testDir = (0, path_1.join)((0, os_1.tmpdir)(), `skills-sync-test-${Date.now()}`);
        (0, fs_1.mkdirSync)(testDir, { recursive: true });
    });
    (0, vitest_1.afterEach)(() => {
        if ((0, fs_1.existsSync)(testDir)) {
            (0, fs_1.rmSync)(testDir, { recursive: true, force: true });
        }
    });
    (0, vitest_1.describe)('node_modules discovery', () => {
        (0, vitest_1.it)('should find SKILL.md at package root', () => {
            // Create a package with SKILL.md at root
            const pkgDir = (0, path_1.join)(testDir, 'node_modules', 'my-skill-pkg');
            (0, fs_1.mkdirSync)(pkgDir, { recursive: true });
            (0, fs_1.writeFileSync)((0, path_1.join)(pkgDir, 'SKILL.md'), `---
name: root-skill
description: A skill at package root
---

# Root Skill
Instructions.
`);
            const result = (0, test_utils_ts_1.runCli)(['experimental_sync', '-y', '-a', 'claude-code'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('root-skill');
            (0, vitest_1.expect)(result.stdout).toContain('my-skill-pkg');
        });
        (0, vitest_1.it)('should find skills in skills/ subdirectory', () => {
            const skillDir = (0, path_1.join)(testDir, 'node_modules', 'my-lib', 'skills', 'helper-skill');
            (0, fs_1.mkdirSync)(skillDir, { recursive: true });
            (0, fs_1.writeFileSync)((0, path_1.join)(skillDir, 'SKILL.md'), `---
name: helper-skill
description: A helper skill in skills/ dir
---

# Helper
Instructions.
`);
            const result = (0, test_utils_ts_1.runCli)(['experimental_sync', '-y', '-a', 'claude-code'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('helper-skill');
            (0, vitest_1.expect)(result.stdout).toContain('my-lib');
        });
        (0, vitest_1.it)('should find skills in scoped packages', () => {
            const pkgDir = (0, path_1.join)(testDir, 'node_modules', '@acme', 'tools');
            (0, fs_1.mkdirSync)(pkgDir, { recursive: true });
            (0, fs_1.writeFileSync)((0, path_1.join)(pkgDir, 'SKILL.md'), `---
name: acme-tool
description: A skill from a scoped package
---

# Acme Tool
Instructions.
`);
            const result = (0, test_utils_ts_1.runCli)(['experimental_sync', '-y', '-a', 'claude-code'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('acme-tool');
            (0, vitest_1.expect)(result.stdout).toContain('@acme/tools');
        });
        (0, vitest_1.it)('should show no skills found when node_modules is empty', () => {
            (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'node_modules'), { recursive: true });
            const result = (0, test_utils_ts_1.runCli)(['experimental_sync', '-y'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('No skills found');
        });
        (0, vitest_1.it)('should show no skills found when no node_modules exists', () => {
            const result = (0, test_utils_ts_1.runCli)(['experimental_sync', '-y'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('No skills found');
        });
    });
    (0, vitest_1.describe)('skills-lock.json', () => {
        (0, vitest_1.it)('should write skills-lock.json after sync', () => {
            const pkgDir = (0, path_1.join)(testDir, 'node_modules', 'my-pkg');
            (0, fs_1.mkdirSync)(pkgDir, { recursive: true });
            (0, fs_1.writeFileSync)((0, path_1.join)(pkgDir, 'SKILL.md'), `---
name: lock-test-skill
description: Test lock file writing
---

# Lock Test
Instructions.
`);
            (0, test_utils_ts_1.runCli)(['experimental_sync', '-y', '-a', 'claude-code'], testDir);
            const lockPath = (0, path_1.join)(testDir, 'skills-lock.json');
            (0, vitest_1.expect)((0, fs_1.existsSync)(lockPath)).toBe(true);
            const lock = JSON.parse((0, fs_1.readFileSync)(lockPath, 'utf-8'));
            (0, vitest_1.expect)(lock.version).toBe(1);
            (0, vitest_1.expect)(lock.skills['lock-test-skill']).toBeDefined();
            (0, vitest_1.expect)(lock.skills['lock-test-skill'].source).toBe('my-pkg');
            (0, vitest_1.expect)(lock.skills['lock-test-skill'].sourceType).toBe('node_modules');
            (0, vitest_1.expect)(lock.skills['lock-test-skill'].computedHash).toMatch(/^[a-f0-9]{64}$/);
        });
        (0, vitest_1.it)('should not have timestamps in lock entries', () => {
            const pkgDir = (0, path_1.join)(testDir, 'node_modules', 'my-pkg');
            (0, fs_1.mkdirSync)(pkgDir, { recursive: true });
            (0, fs_1.writeFileSync)((0, path_1.join)(pkgDir, 'SKILL.md'), `---
name: no-timestamp-skill
description: No timestamps
---

# Test
`);
            (0, test_utils_ts_1.runCli)(['experimental_sync', '-y', '-a', 'claude-code'], testDir);
            const lock = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(testDir, 'skills-lock.json'), 'utf-8'));
            const entry = lock.skills['no-timestamp-skill'];
            (0, vitest_1.expect)(entry.installedAt).toBeUndefined();
            (0, vitest_1.expect)(entry.updatedAt).toBeUndefined();
        });
        (0, vitest_1.it)('should sort skills alphabetically in lock file', () => {
            // Create three packages in reverse order
            for (const name of ['zebra-skill', 'alpha-skill', 'mid-skill']) {
                const pkgDir = (0, path_1.join)(testDir, 'node_modules', name);
                (0, fs_1.mkdirSync)(pkgDir, { recursive: true });
                (0, fs_1.writeFileSync)((0, path_1.join)(pkgDir, 'SKILL.md'), `---
name: ${name}
description: ${name} description
---

# ${name}
`);
            }
            (0, test_utils_ts_1.runCli)(['experimental_sync', '-y', '-a', 'claude-code'], testDir);
            const raw = (0, fs_1.readFileSync)((0, path_1.join)(testDir, 'skills-lock.json'), 'utf-8');
            const keys = Object.keys(JSON.parse(raw).skills);
            (0, vitest_1.expect)(keys).toEqual(['alpha-skill', 'mid-skill', 'zebra-skill']);
        });
        (0, vitest_1.it)('should skip unchanged skills on second sync', () => {
            const pkgDir = (0, path_1.join)(testDir, 'node_modules', 'my-pkg');
            (0, fs_1.mkdirSync)(pkgDir, { recursive: true });
            (0, fs_1.writeFileSync)((0, path_1.join)(pkgDir, 'SKILL.md'), `---
name: cached-skill
description: Test caching
---

# Cached
`);
            // First sync
            (0, test_utils_ts_1.runCli)(['experimental_sync', '-y', '-a', 'claude-code'], testDir);
            // Second sync - should say up to date
            const result = (0, test_utils_ts_1.runCli)(['experimental_sync', '-y', '-a', 'claude-code'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('up to date');
        });
        (0, vitest_1.it)('should reinstall when --force is used', () => {
            const pkgDir = (0, path_1.join)(testDir, 'node_modules', 'my-pkg');
            (0, fs_1.mkdirSync)(pkgDir, { recursive: true });
            (0, fs_1.writeFileSync)((0, path_1.join)(pkgDir, 'SKILL.md'), `---
name: force-skill
description: Test force
---

# Force
`);
            // First sync
            (0, test_utils_ts_1.runCli)(['experimental_sync', '-y', '-a', 'claude-code'], testDir);
            // Second sync with --force should reinstall
            const result = (0, test_utils_ts_1.runCli)(['experimental_sync', '-y', '-a', 'claude-code', '--force'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('force-skill');
            (0, vitest_1.expect)(result.stdout).not.toContain('All skills are up to date');
        });
    });
    (0, vitest_1.describe)('CLI routing', () => {
        (0, vitest_1.it)('should show experimental_sync in help output', () => {
            const result = (0, test_utils_ts_1.runCli)(['--help']);
            (0, vitest_1.expect)(result.stdout).toContain('experimental_sync');
        });
        (0, vitest_1.it)('should show experimental_sync in banner', () => {
            const result = (0, test_utils_ts_1.runCli)([]);
            (0, vitest_1.expect)(result.stdout).toContain('experimental_sync');
        });
    });
    (0, vitest_1.describe)('multiple skills from one package', () => {
        (0, vitest_1.it)('should discover multiple skills in skills/ subdirectory', () => {
            const pkg = (0, path_1.join)(testDir, 'node_modules', 'multi-skill-pkg');
            for (const name of ['skill-one', 'skill-two']) {
                const dir = (0, path_1.join)(pkg, 'skills', name);
                (0, fs_1.mkdirSync)(dir, { recursive: true });
                (0, fs_1.writeFileSync)((0, path_1.join)(dir, 'SKILL.md'), `---
name: ${name}
description: ${name} from multi package
---

# ${name}
`);
            }
            const result = (0, test_utils_ts_1.runCli)(['experimental_sync', '-y', '-a', 'claude-code'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('skill-one');
            (0, vitest_1.expect)(result.stdout).toContain('skill-two');
            (0, vitest_1.expect)(result.stdout).toContain('multi-skill-pkg');
        });
    });
});
//# sourceMappingURL=sync.test.js.map