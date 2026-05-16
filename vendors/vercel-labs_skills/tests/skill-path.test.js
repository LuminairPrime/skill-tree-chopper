"use strict";
/**
 * Unit tests for skill path calculation in telemetry.
 *
 * These tests verify that the relativePath calculation for skillFiles
 * correctly produces paths relative to the repo root, not the search path.
 * Tests cover both Unix and Windows path styles.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const path_1 = require("path");
/**
 * Simulates the relativePath calculation from add.ts (cross-platform version)
 */
function calculateRelativePath(tempDir, skillPath, pathSep = path_1.sep) {
    if (tempDir && skillPath === tempDir) {
        // Skill is at root level of repo
        return 'SKILL.md';
    }
    else if (tempDir && skillPath.startsWith(tempDir + pathSep)) {
        // Compute path relative to repo root (tempDir)
        // Use forward slashes for telemetry (URL-style paths)
        return (skillPath
            .slice(tempDir.length + 1)
            .split(pathSep)
            .join('/') + '/SKILL.md');
    }
    else {
        // Local path - skip telemetry
        return null;
    }
}
(0, vitest_1.describe)('calculateRelativePath (Unix paths)', () => {
    // Explicitly use '/' as separator for Unix-style paths
    const unixSep = '/';
    (0, vitest_1.it)('skill at repo root', () => {
        const tempDir = '/tmp/abc123';
        const skillPath = '/tmp/abc123';
        const result = calculateRelativePath(tempDir, skillPath, unixSep);
        (0, vitest_1.expect)(result).toBe('SKILL.md');
    });
    (0, vitest_1.it)('skill in skills/ subdirectory', () => {
        const tempDir = '/tmp/abc123';
        const skillPath = '/tmp/abc123/skills/my-skill';
        const result = calculateRelativePath(tempDir, skillPath, unixSep);
        (0, vitest_1.expect)(result).toBe('skills/my-skill/SKILL.md');
    });
    (0, vitest_1.it)('skill in .claude/skills/ directory', () => {
        const tempDir = '/tmp/abc123';
        const skillPath = '/tmp/abc123/.claude/skills/my-skill';
        const result = calculateRelativePath(tempDir, skillPath, unixSep);
        (0, vitest_1.expect)(result).toBe('.claude/skills/my-skill/SKILL.md');
    });
    (0, vitest_1.it)('skill in nested subdirectory', () => {
        const tempDir = '/tmp/abc123';
        const skillPath = '/tmp/abc123/skills/.curated/advanced-skill';
        const result = calculateRelativePath(tempDir, skillPath, unixSep);
        (0, vitest_1.expect)(result).toBe('skills/.curated/advanced-skill/SKILL.md');
    });
    (0, vitest_1.it)('local path returns null', () => {
        const tempDir = null;
        const skillPath = '/Users/me/projects/my-skill';
        const result = calculateRelativePath(tempDir, skillPath, unixSep);
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('path not under tempDir returns null', () => {
        const tempDir = '/tmp/abc123';
        const skillPath = '/tmp/other/my-skill';
        const result = calculateRelativePath(tempDir, skillPath, unixSep);
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('onmax/nuxt-skills: skill in skills/ts-library', () => {
        const tempDir = '/tmp/clone-xyz';
        // discoverSkills finds /tmp/clone-xyz/skills/ts-library/SKILL.md
        // skill.path = dirname(skillMdPath) = /tmp/clone-xyz/skills/ts-library
        const skillPath = '/tmp/clone-xyz/skills/ts-library';
        const result = calculateRelativePath(tempDir, skillPath, unixSep);
        (0, vitest_1.expect)(result).toBe('skills/ts-library/SKILL.md');
    });
});
(0, vitest_1.describe)('calculateRelativePath (Windows paths)', () => {
    (0, vitest_1.it)('skill at repo root (Windows)', () => {
        const tempDir = 'C:\\Users\\test\\AppData\\Local\\Temp\\abc123';
        const skillPath = 'C:\\Users\\test\\AppData\\Local\\Temp\\abc123';
        const result = calculateRelativePath(tempDir, skillPath, '\\');
        (0, vitest_1.expect)(result).toBe('SKILL.md');
    });
    (0, vitest_1.it)('skill in skills\\ subdirectory (Windows)', () => {
        const tempDir = 'C:\\Users\\test\\AppData\\Local\\Temp\\abc123';
        const skillPath = 'C:\\Users\\test\\AppData\\Local\\Temp\\abc123\\skills\\my-skill';
        const result = calculateRelativePath(tempDir, skillPath, '\\');
        (0, vitest_1.expect)(result).toBe('skills/my-skill/SKILL.md');
    });
    (0, vitest_1.it)('skill in .claude\\skills\\ directory (Windows)', () => {
        const tempDir = 'C:\\Users\\test\\AppData\\Local\\Temp\\abc123';
        const skillPath = 'C:\\Users\\test\\AppData\\Local\\Temp\\abc123\\.claude\\skills\\my-skill';
        const result = calculateRelativePath(tempDir, skillPath, '\\');
        (0, vitest_1.expect)(result).toBe('.claude/skills/my-skill/SKILL.md');
    });
    (0, vitest_1.it)('skill in nested subdirectory (Windows)', () => {
        const tempDir = 'C:\\Users\\test\\AppData\\Local\\Temp\\abc123';
        const skillPath = 'C:\\Users\\test\\AppData\\Local\\Temp\\abc123\\skills\\.curated\\advanced-skill';
        const result = calculateRelativePath(tempDir, skillPath, '\\');
        (0, vitest_1.expect)(result).toBe('skills/.curated/advanced-skill/SKILL.md');
    });
    (0, vitest_1.it)('path not under tempDir returns null (Windows)', () => {
        const tempDir = 'C:\\Users\\test\\AppData\\Local\\Temp\\abc123';
        const skillPath = 'C:\\Users\\test\\AppData\\Local\\Temp\\other\\my-skill';
        const result = calculateRelativePath(tempDir, skillPath, '\\');
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('handles similar path prefixes correctly (Windows)', () => {
        // This tests that we don't match partial directory names
        const tempDir = 'C:\\Users\\test\\AppData\\Local\\Temp\\abc';
        const skillPath = 'C:\\Users\\test\\AppData\\Local\\Temp\\abc123\\skills\\my-skill';
        const result = calculateRelativePath(tempDir, skillPath, '\\');
        (0, vitest_1.expect)(result).toBeNull();
    });
});
//# sourceMappingURL=skill-path.test.js.map