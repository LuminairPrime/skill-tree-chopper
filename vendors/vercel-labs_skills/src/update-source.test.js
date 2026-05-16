"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const update_source_ts_1 = require("./update-source.ts");
(0, vitest_1.describe)('update-source', () => {
    (0, vitest_1.describe)('formatSourceInput', () => {
        (0, vitest_1.it)('appends ref fragment when provided', () => {
            (0, vitest_1.expect)((0, update_source_ts_1.formatSourceInput)('https://github.com/owner/repo.git', 'feature/install')).toBe('https://github.com/owner/repo.git#feature/install');
        });
        (0, vitest_1.it)('returns source unchanged when ref is missing', () => {
            (0, vitest_1.expect)((0, update_source_ts_1.formatSourceInput)('https://github.com/owner/repo.git')).toBe('https://github.com/owner/repo.git');
        });
    });
    (0, vitest_1.describe)('buildUpdateInstallSource', () => {
        (0, vitest_1.it)('builds root-level install source without trailing slash', () => {
            const result = (0, update_source_ts_1.buildUpdateInstallSource)({
                source: 'owner/repo',
                sourceUrl: 'https://github.com/owner/repo.git',
                ref: 'feature/install',
                skillPath: 'SKILL.md',
            });
            (0, vitest_1.expect)(result).toBe('owner/repo#feature/install');
        });
        (0, vitest_1.it)('builds nested skill install source with ref', () => {
            const result = (0, update_source_ts_1.buildUpdateInstallSource)({
                source: 'owner/repo',
                sourceUrl: 'https://github.com/owner/repo.git',
                ref: 'feature/install',
                skillPath: 'skills/my-skill/SKILL.md',
            });
            (0, vitest_1.expect)(result).toBe('owner/repo/skills/my-skill#feature/install');
        });
        (0, vitest_1.it)('falls back to sourceUrl when skillPath is missing', () => {
            const result = (0, update_source_ts_1.buildUpdateInstallSource)({
                source: 'owner/repo',
                sourceUrl: 'https://github.com/owner/repo.git',
                ref: 'feature/install',
            });
            (0, vitest_1.expect)(result).toBe('https://github.com/owner/repo.git#feature/install');
        });
    });
    (0, vitest_1.describe)('buildLocalUpdateSource', () => {
        (0, vitest_1.it)('appends skill folder from skillPath with ref', () => {
            const result = (0, update_source_ts_1.buildLocalUpdateSource)({
                source: 'owner/repo',
                ref: 'main',
                skillPath: 'skills/my-skill/SKILL.md',
            });
            (0, vitest_1.expect)(result).toBe('owner/repo/skills/my-skill#main');
        });
        (0, vitest_1.it)('appends skill folder from skillPath without ref', () => {
            const result = (0, update_source_ts_1.buildLocalUpdateSource)({
                source: 'owner/repo',
                skillPath: 'skills/my-skill/SKILL.md',
            });
            (0, vitest_1.expect)(result).toBe('owner/repo/skills/my-skill');
        });
        (0, vitest_1.it)('keeps root-level skillPath from collapsing to trailing slash', () => {
            const result = (0, update_source_ts_1.buildLocalUpdateSource)({
                source: 'owner/repo',
                skillPath: 'SKILL.md',
            });
            (0, vitest_1.expect)(result).toBe('owner/repo');
        });
        (0, vitest_1.it)('falls back to bare source when skillPath is missing', () => {
            const result = (0, update_source_ts_1.buildLocalUpdateSource)({
                source: 'owner/repo',
                ref: 'main',
            });
            (0, vitest_1.expect)(result).toBe('owner/repo#main');
        });
    });
});
//# sourceMappingURL=update-source.test.js.map