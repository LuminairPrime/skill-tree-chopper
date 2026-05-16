"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const vitest_1 = require("vitest");
const agents_ts_1 = require("../src/agents.ts");
(0, vitest_1.describe)('openclaw global path resolution', () => {
    const home = '/tmp/home';
    (0, vitest_1.it)('prefers ~/.openclaw when present', () => {
        const exists = (path) => path === (0, path_1.join)(home, '.openclaw') ||
            path === (0, path_1.join)(home, '.clawdbot') ||
            path === (0, path_1.join)(home, '.moltbot');
        (0, vitest_1.expect)((0, agents_ts_1.getOpenClawGlobalSkillsDir)(home, exists)).toBe((0, path_1.join)(home, '.openclaw/skills'));
    });
    (0, vitest_1.it)('falls back to ~/.clawdbot when ~/.openclaw is missing', () => {
        const exists = (path) => path === (0, path_1.join)(home, '.clawdbot') || path === (0, path_1.join)(home, '.moltbot');
        (0, vitest_1.expect)((0, agents_ts_1.getOpenClawGlobalSkillsDir)(home, exists)).toBe((0, path_1.join)(home, '.clawdbot/skills'));
    });
    (0, vitest_1.it)('falls back to ~/.moltbot when only legacy path exists', () => {
        const exists = (path) => path === (0, path_1.join)(home, '.moltbot');
        (0, vitest_1.expect)((0, agents_ts_1.getOpenClawGlobalSkillsDir)(home, exists)).toBe((0, path_1.join)(home, '.moltbot/skills'));
    });
    (0, vitest_1.it)('defaults to ~/.openclaw when no known path exists', () => {
        (0, vitest_1.expect)((0, agents_ts_1.getOpenClawGlobalSkillsDir)(home, () => false)).toBe((0, path_1.join)(home, '.openclaw/skills'));
    });
});
//# sourceMappingURL=openclaw-paths.test.js.map