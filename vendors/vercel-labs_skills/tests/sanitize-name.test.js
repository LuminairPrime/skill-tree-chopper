"use strict";
/**
 * Unit tests for sanitizeName function in installer.ts
 *
 * These tests verify the sanitization logic for skill names to ensure:
 * - Path traversal attacks are prevented
 * - Names follow kebab-case convention
 * - Special characters are handled safely
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const installer_ts_1 = require("../src/installer.ts");
(0, vitest_1.describe)('sanitizeName', () => {
    (0, vitest_1.describe)('basic transformations', () => {
        (0, vitest_1.it)('converts to lowercase', () => {
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('MySkill')).toBe('myskill');
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('UPPERCASE')).toBe('uppercase');
        });
        (0, vitest_1.it)('replaces spaces with hyphens', () => {
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('my skill')).toBe('my-skill');
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('Convex Best Practices')).toBe('convex-best-practices');
        });
        (0, vitest_1.it)('replaces multiple spaces with single hyphen', () => {
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('my   skill')).toBe('my-skill');
        });
        (0, vitest_1.it)('preserves dots and underscores', () => {
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('bun.sh')).toBe('bun.sh');
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('my_skill')).toBe('my_skill');
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('skill.v2_beta')).toBe('skill.v2_beta');
        });
        (0, vitest_1.it)('preserves numbers', () => {
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('skill123')).toBe('skill123');
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('v2.0')).toBe('v2.0');
        });
    });
    (0, vitest_1.describe)('special character handling', () => {
        (0, vitest_1.it)('replaces special characters with hyphens', () => {
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('skill@name')).toBe('skill-name');
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('skill#name')).toBe('skill-name');
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('skill$name')).toBe('skill-name');
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('skill!name')).toBe('skill-name');
        });
        (0, vitest_1.it)('collapses multiple special chars into single hyphen', () => {
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('skill@#$name')).toBe('skill-name');
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('a!!!b')).toBe('a-b');
        });
    });
    (0, vitest_1.describe)('path traversal prevention', () => {
        (0, vitest_1.it)('prevents path traversal with ../', () => {
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('../etc/passwd')).toBe('etc-passwd');
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('../../secret')).toBe('secret');
        });
        (0, vitest_1.it)('prevents path traversal with backslashes', () => {
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('..\\..\\secret')).toBe('secret');
        });
        (0, vitest_1.it)('handles absolute paths', () => {
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('/etc/passwd')).toBe('etc-passwd');
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('C:\\Windows\\System32')).toBe('c-windows-system32');
        });
    });
    (0, vitest_1.describe)('leading/trailing cleanup', () => {
        (0, vitest_1.it)('removes leading dots', () => {
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('.hidden')).toBe('hidden');
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('..hidden')).toBe('hidden');
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('...skill')).toBe('skill');
        });
        (0, vitest_1.it)('removes trailing dots', () => {
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('skill.')).toBe('skill');
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('skill..')).toBe('skill');
        });
        (0, vitest_1.it)('removes leading hyphens', () => {
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('-skill')).toBe('skill');
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('--skill')).toBe('skill');
        });
        (0, vitest_1.it)('removes trailing hyphens', () => {
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('skill-')).toBe('skill');
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('skill--')).toBe('skill');
        });
        (0, vitest_1.it)('removes mixed leading dots and hyphens', () => {
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('.-.-skill')).toBe('skill');
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('-.-.skill')).toBe('skill');
        });
    });
    (0, vitest_1.describe)('edge cases', () => {
        (0, vitest_1.it)('returns unnamed-skill for empty string', () => {
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('')).toBe('unnamed-skill');
        });
        (0, vitest_1.it)('returns unnamed-skill when only special chars', () => {
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('...')).toBe('unnamed-skill');
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('---')).toBe('unnamed-skill');
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('@#$%')).toBe('unnamed-skill');
        });
        (0, vitest_1.it)('handles very long names (truncates to 255 chars)', () => {
            const longName = 'a'.repeat(300);
            const result = (0, installer_ts_1.sanitizeName)(longName);
            (0, vitest_1.expect)(result.length).toBe(255);
            (0, vitest_1.expect)(result).toBe('a'.repeat(255));
        });
        (0, vitest_1.it)('handles unicode characters', () => {
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('skill日本語')).toBe('skill');
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('émoji🎉skill')).toBe('moji-skill');
        });
    });
    (0, vitest_1.describe)('real-world examples', () => {
        (0, vitest_1.it)('handles GitHub repo style names', () => {
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('vercel/next.js')).toBe('vercel-next.js');
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('owner/repo-name')).toBe('owner-repo-name');
        });
        (0, vitest_1.it)('handles URLs', () => {
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('https://example.com')).toBe('https-example.com');
        });
        (0, vitest_1.it)('handles mintlify style names', () => {
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('docs.example.com')).toBe('docs.example.com');
            (0, vitest_1.expect)((0, installer_ts_1.sanitizeName)('bun.sh')).toBe('bun.sh');
        });
    });
});
//# sourceMappingURL=sanitize-name.test.js.map