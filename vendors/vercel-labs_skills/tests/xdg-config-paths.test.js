"use strict";
/**
 * Tests for XDG config path handling (cross-platform).
 *
 * These tests verify that agents using XDG Base Directory specification
 * (OpenCode, Amp, Goose) use ~/.config paths consistently across all platforms,
 * NOT platform-specific paths like ~/Library/Preferences on macOS.
 *
 * This is critical because OpenCode uses xdg-basedir which always returns
 * ~/.config (or $XDG_CONFIG_HOME if set), regardless of platform.
 * The skills CLI must match this behavior to install skills in the correct location.
 *
 * See: https://github.com/vercel-labs/skills/pull/66
 * See: https://github.com/vercel-labs/skills/issues/63
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const os_1 = require("os");
const path_1 = require("path");
const agents_ts_1 = require("../src/agents.ts");
(0, vitest_1.describe)('XDG config paths', () => {
    const home = (0, os_1.homedir)();
    (0, vitest_1.describe)('OpenCode', () => {
        (0, vitest_1.it)('uses ~/.config/opencode/skills for global skills (not ~/Library/Preferences)', () => {
            const expected = (0, path_1.join)(home, '.config', 'opencode', 'skills');
            (0, vitest_1.expect)(agents_ts_1.agents.opencode.globalSkillsDir).toBe(expected);
        });
        (0, vitest_1.it)('does NOT use platform-specific paths like ~/Library/Preferences', () => {
            (0, vitest_1.expect)(agents_ts_1.agents.opencode.globalSkillsDir).not.toContain('Library');
            (0, vitest_1.expect)(agents_ts_1.agents.opencode.globalSkillsDir).not.toContain('Preferences');
            (0, vitest_1.expect)(agents_ts_1.agents.opencode.globalSkillsDir).not.toContain('AppData');
        });
    });
    (0, vitest_1.describe)('Amp', () => {
        (0, vitest_1.it)('uses ~/.config/agents/skills for global skills', () => {
            const expected = (0, path_1.join)(home, '.config', 'agents', 'skills');
            (0, vitest_1.expect)(agents_ts_1.agents.amp.globalSkillsDir).toBe(expected);
        });
        (0, vitest_1.it)('does NOT use platform-specific paths', () => {
            (0, vitest_1.expect)(agents_ts_1.agents.amp.globalSkillsDir).not.toContain('Library');
            (0, vitest_1.expect)(agents_ts_1.agents.amp.globalSkillsDir).not.toContain('Preferences');
            (0, vitest_1.expect)(agents_ts_1.agents.amp.globalSkillsDir).not.toContain('AppData');
        });
    });
    (0, vitest_1.describe)('Goose', () => {
        (0, vitest_1.it)('uses ~/.config/goose/skills for global skills', () => {
            const expected = (0, path_1.join)(home, '.config', 'goose', 'skills');
            (0, vitest_1.expect)(agents_ts_1.agents.goose.globalSkillsDir).toBe(expected);
        });
        (0, vitest_1.it)('does NOT use platform-specific paths', () => {
            (0, vitest_1.expect)(agents_ts_1.agents.goose.globalSkillsDir).not.toContain('Library');
            (0, vitest_1.expect)(agents_ts_1.agents.goose.globalSkillsDir).not.toContain('Preferences');
            (0, vitest_1.expect)(agents_ts_1.agents.goose.globalSkillsDir).not.toContain('AppData');
        });
    });
    (0, vitest_1.describe)('skill lock file path', () => {
        function getSkillLockPath(xdgStateHome, homeDir) {
            if (xdgStateHome) {
                return (0, path_1.join)(xdgStateHome, 'skills', '.skill-lock.json');
            }
            return (0, path_1.join)(homeDir, '.agents', '.skill-lock.json');
        }
        (0, vitest_1.it)('uses XDG_STATE_HOME when set', () => {
            const result = getSkillLockPath('/custom/state', home);
            (0, vitest_1.expect)(result).toBe((0, path_1.join)('/custom/state', 'skills', '.skill-lock.json'));
        });
        (0, vitest_1.it)('falls back to ~/.agents when XDG_STATE_HOME is not set', () => {
            const result = getSkillLockPath(undefined, home);
            (0, vitest_1.expect)(result).toBe((0, path_1.join)(home, '.agents', '.skill-lock.json'));
        });
    });
    (0, vitest_1.describe)('non-XDG agents', () => {
        (0, vitest_1.it)('cursor uses ~/.cursor/skills (home-based, not XDG)', () => {
            const expected = (0, path_1.join)(home, '.cursor', 'skills');
            (0, vitest_1.expect)(agents_ts_1.agents.cursor.globalSkillsDir).toBe(expected);
        });
        (0, vitest_1.it)('cline uses ~/.agents/skills (home-based, not XDG)', () => {
            const expected = (0, path_1.join)(home, '.agents', 'skills');
            (0, vitest_1.expect)(agents_ts_1.agents.cline.globalSkillsDir).toBe(expected);
        });
    });
});
//# sourceMappingURL=xdg-config-paths.test.js.map