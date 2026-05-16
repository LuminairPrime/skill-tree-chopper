"use strict";
/**
 * Tests for path traversal prevention in subpath handling.
 *
 * These tests verify that:
 * 1. parseSource() rejects subpaths containing ".." segments
 * 2. isSubpathSafe() correctly detects traversal attempts
 * 3. discoverSkills() throws on unsafe subpaths
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const source_parser_ts_1 = require("../src/source-parser.ts");
const skills_ts_1 = require("../src/skills.ts");
(0, vitest_1.describe)('sanitizeSubpath', () => {
    (0, vitest_1.it)('allows normal subpaths', () => {
        (0, vitest_1.expect)((0, source_parser_ts_1.sanitizeSubpath)('skills/my-skill')).toBe('skills/my-skill');
        (0, vitest_1.expect)((0, source_parser_ts_1.sanitizeSubpath)('path/to/skill')).toBe('path/to/skill');
        (0, vitest_1.expect)((0, source_parser_ts_1.sanitizeSubpath)('src')).toBe('src');
    });
    (0, vitest_1.it)('rejects subpaths with .. segments', () => {
        (0, vitest_1.expect)(() => (0, source_parser_ts_1.sanitizeSubpath)('../etc')).toThrow('Unsafe subpath');
        (0, vitest_1.expect)(() => (0, source_parser_ts_1.sanitizeSubpath)('../../etc/passwd')).toThrow('Unsafe subpath');
        (0, vitest_1.expect)(() => (0, source_parser_ts_1.sanitizeSubpath)('skills/../../etc')).toThrow('Unsafe subpath');
        (0, vitest_1.expect)(() => (0, source_parser_ts_1.sanitizeSubpath)('a/b/../../../etc')).toThrow('Unsafe subpath');
    });
    (0, vitest_1.it)('rejects subpaths with backslash traversal', () => {
        (0, vitest_1.expect)(() => (0, source_parser_ts_1.sanitizeSubpath)('..\\etc')).toThrow('Unsafe subpath');
        (0, vitest_1.expect)(() => (0, source_parser_ts_1.sanitizeSubpath)('..\\..\\secret')).toThrow('Unsafe subpath');
    });
    (0, vitest_1.it)('allows paths with dots that are not traversal', () => {
        (0, vitest_1.expect)((0, source_parser_ts_1.sanitizeSubpath)('.hidden')).toBe('.hidden');
        (0, vitest_1.expect)((0, source_parser_ts_1.sanitizeSubpath)('file.txt')).toBe('file.txt');
        (0, vitest_1.expect)((0, source_parser_ts_1.sanitizeSubpath)('path/to/.config')).toBe('path/to/.config');
        (0, vitest_1.expect)((0, source_parser_ts_1.sanitizeSubpath)('..skill')).toBe('..skill');
        (0, vitest_1.expect)((0, source_parser_ts_1.sanitizeSubpath)('skill..')).toBe('skill..');
    });
});
(0, vitest_1.describe)('isSubpathSafe', () => {
    (0, vitest_1.it)('returns true for subpaths within basePath', () => {
        (0, vitest_1.expect)((0, skills_ts_1.isSubpathSafe)('/tmp/repo', 'skills')).toBe(true);
        (0, vitest_1.expect)((0, skills_ts_1.isSubpathSafe)('/tmp/repo', 'skills/my-skill')).toBe(true);
        (0, vitest_1.expect)((0, skills_ts_1.isSubpathSafe)('/tmp/repo', 'a/b/c')).toBe(true);
    });
    (0, vitest_1.it)('returns false for subpaths that escape basePath', () => {
        (0, vitest_1.expect)((0, skills_ts_1.isSubpathSafe)('/tmp/repo', '..')).toBe(false);
        (0, vitest_1.expect)((0, skills_ts_1.isSubpathSafe)('/tmp/repo', '../etc')).toBe(false);
        (0, vitest_1.expect)((0, skills_ts_1.isSubpathSafe)('/tmp/repo', '../../etc/passwd')).toBe(false);
        (0, vitest_1.expect)((0, skills_ts_1.isSubpathSafe)('/tmp/repo', 'skills/../../..')).toBe(false);
    });
    (0, vitest_1.it)('handles normalized traversal that stays within', () => {
        // "skills/../other" normalizes to "other" which is still within basePath
        (0, vitest_1.expect)((0, skills_ts_1.isSubpathSafe)('/tmp/repo', 'skills/../other')).toBe(true);
    });
    (0, vitest_1.it)('handles edge case of subpath resolving to basePath itself', () => {
        (0, vitest_1.expect)((0, skills_ts_1.isSubpathSafe)('/tmp/repo', '.')).toBe(true);
        (0, vitest_1.expect)((0, skills_ts_1.isSubpathSafe)('/tmp/repo', 'skills/..')).toBe(true);
    });
});
(0, vitest_1.describe)('parseSource rejects traversal in subpaths', () => {
    (0, vitest_1.describe)('GitHub tree URLs with path traversal', () => {
        (0, vitest_1.it)('rejects .. in GitHub tree URL subpath', () => {
            (0, vitest_1.expect)(() => (0, source_parser_ts_1.parseSource)('https://github.com/owner/repo/tree/main/../../etc')).toThrow('Unsafe subpath');
        });
        (0, vitest_1.it)('rejects deeply nested traversal', () => {
            (0, vitest_1.expect)(() => (0, source_parser_ts_1.parseSource)('https://github.com/owner/repo/tree/main/a/b/../../../etc')).toThrow('Unsafe subpath');
        });
        (0, vitest_1.it)('allows valid GitHub tree URL subpath', () => {
            const result = (0, source_parser_ts_1.parseSource)('https://github.com/owner/repo/tree/main/skills/my-skill');
            (0, vitest_1.expect)(result.subpath).toBe('skills/my-skill');
        });
    });
    (0, vitest_1.describe)('GitLab tree URLs with path traversal', () => {
        (0, vitest_1.it)('rejects .. in GitLab tree URL subpath', () => {
            (0, vitest_1.expect)(() => (0, source_parser_ts_1.parseSource)('https://gitlab.com/owner/repo/-/tree/main/../../etc')).toThrow('Unsafe subpath');
        });
        (0, vitest_1.it)('allows valid GitLab tree URL subpath', () => {
            const result = (0, source_parser_ts_1.parseSource)('https://gitlab.com/owner/repo/-/tree/main/src/skills');
            (0, vitest_1.expect)(result.subpath).toBe('src/skills');
        });
    });
    (0, vitest_1.describe)('GitHub shorthand with path traversal', () => {
        (0, vitest_1.it)('rejects .. in shorthand subpath', () => {
            // Note: owner/repo/../../etc is parsed as owner/repo with subpath ../../etc
            // The shorthand regex captures everything after owner/repo as subpath
            (0, vitest_1.expect)(() => (0, source_parser_ts_1.parseSource)('owner/repo/../../etc')).toThrow('Unsafe subpath');
        });
        (0, vitest_1.it)('allows valid shorthand subpath', () => {
            const result = (0, source_parser_ts_1.parseSource)('owner/repo/skills/my-skill');
            (0, vitest_1.expect)(result.subpath).toBe('skills/my-skill');
        });
    });
});
//# sourceMappingURL=subpath-traversal.test.js.map