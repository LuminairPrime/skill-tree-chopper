"use strict";
/**
 * Unit tests for filterSkills function in skills.ts
 *
 * These tests verify the skill matching logic. Multi-word skill names
 * must be quoted on the command line (e.g., --skill "Convex Best Practices").
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const skills_ts_1 = require("../src/skills.ts");
// Mock skill factory
function makeSkill(name, path = '/tmp/skill') {
    return { name, description: 'desc', path };
}
const skills = [
    makeSkill('convex-best-practices'),
    makeSkill('Convex Best Practices'),
    makeSkill('simple-skill'),
    makeSkill('foo'),
    makeSkill('bar'),
];
(0, vitest_1.describe)('filterSkills', () => {
    (0, vitest_1.describe)('direct matching', () => {
        (0, vitest_1.it)('matches exact name', () => {
            const result = (0, skills_ts_1.filterSkills)(skills, ['foo']);
            (0, vitest_1.expect)(result.length).toBe(1);
            (0, vitest_1.expect)(result[0].name).toBe('foo');
        });
        (0, vitest_1.it)('matches case insensitive', () => {
            const result = (0, skills_ts_1.filterSkills)(skills, ['FOO']);
            (0, vitest_1.expect)(result.length).toBe(1);
            (0, vitest_1.expect)(result[0].name).toBe('foo');
        });
        (0, vitest_1.it)('matches kebab-case skill name', () => {
            const result = (0, skills_ts_1.filterSkills)(skills, ['convex-best-practices']);
            (0, vitest_1.expect)(result.length).toBe(1);
            (0, vitest_1.expect)(result[0].name).toBe('convex-best-practices');
        });
        (0, vitest_1.it)('matches multiple skills', () => {
            const result = (0, skills_ts_1.filterSkills)(skills, ['foo', 'bar']);
            (0, vitest_1.expect)(result.length).toBe(2);
            const names = result.map((s) => s.name).sort();
            (0, vitest_1.expect)(names).toEqual(['bar', 'foo']);
        });
    });
    (0, vitest_1.describe)('quoted multi-word names', () => {
        (0, vitest_1.it)('matches quoted multi-word name', () => {
            // Simulates: --skill "Convex Best Practices"
            const result = (0, skills_ts_1.filterSkills)(skills, ['Convex Best Practices']);
            (0, vitest_1.expect)(result.length).toBe(1);
            (0, vitest_1.expect)(result[0].name).toBe('Convex Best Practices');
        });
        (0, vitest_1.it)('matches quoted multi-word name case insensitive', () => {
            const result = (0, skills_ts_1.filterSkills)(skills, ['convex best practices']);
            (0, vitest_1.expect)(result.length).toBe(1);
            (0, vitest_1.expect)(result[0].name).toBe('Convex Best Practices');
        });
    });
    (0, vitest_1.describe)('unquoted multi-word names (should not match)', () => {
        (0, vitest_1.it)('does not match unquoted multi-word args', () => {
            // Simulates: --skill Convex Best Practices (unquoted - shell splits into 3 args)
            // This should NOT match - users must quote multi-word names
            const result = (0, skills_ts_1.filterSkills)(skills, ['Convex', 'Best', 'Practices']);
            (0, vitest_1.expect)(result.length).toBe(0);
        });
        (0, vitest_1.it)('does not match partial words', () => {
            const result = (0, skills_ts_1.filterSkills)(skills, ['Convex', 'Best']);
            (0, vitest_1.expect)(result.length).toBe(0);
        });
    });
    (0, vitest_1.describe)('no matches', () => {
        (0, vitest_1.it)('returns empty array when no matches', () => {
            const result = (0, skills_ts_1.filterSkills)(skills, ['nonexistent']);
            (0, vitest_1.expect)(result.length).toBe(0);
        });
        (0, vitest_1.it)('returns empty array for empty input', () => {
            const result = (0, skills_ts_1.filterSkills)(skills, []);
            (0, vitest_1.expect)(result.length).toBe(0);
        });
    });
});
(0, vitest_1.describe)('parseSkillMd with non-string frontmatter values', () => {
    let testDir;
    (0, vitest_1.beforeEach)(() => {
        testDir = (0, path_1.join)((0, os_1.tmpdir)(), `skills-nonstring-test-${Date.now()}`);
        (0, fs_1.mkdirSync)(testDir, { recursive: true });
    });
    (0, vitest_1.afterEach)(() => {
        (0, fs_1.rmSync)(testDir, { recursive: true, force: true });
    });
    (0, vitest_1.it)('rejects skill with numeric name', async () => {
        const skillPath = (0, path_1.join)(testDir, 'SKILL.md');
        (0, fs_1.writeFileSync)(skillPath, `---
name: 123
description: A skill with numeric name
---

# Numeric Name Skill
`);
        const result = await (0, skills_ts_1.parseSkillMd)(skillPath);
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('rejects skill with boolean name', async () => {
        const skillPath = (0, path_1.join)(testDir, 'SKILL.md');
        (0, fs_1.writeFileSync)(skillPath, `---
name: true
description: A skill with boolean name
---

# Boolean Name Skill
`);
        const result = await (0, skills_ts_1.parseSkillMd)(skillPath);
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('rejects skill with array name', async () => {
        const skillPath = (0, path_1.join)(testDir, 'SKILL.md');
        (0, fs_1.writeFileSync)(skillPath, `---
name:
  - foo
  - bar
description: A skill with array name
---

# Array Name Skill
`);
        const result = await (0, skills_ts_1.parseSkillMd)(skillPath);
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('rejects skill with numeric description', async () => {
        const skillPath = (0, path_1.join)(testDir, 'SKILL.md');
        (0, fs_1.writeFileSync)(skillPath, `---
name: valid-name
description: 456
---

# Numeric Description Skill
`);
        const result = await (0, skills_ts_1.parseSkillMd)(skillPath);
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('accepts skill with valid string name and description', async () => {
        const skillPath = (0, path_1.join)(testDir, 'SKILL.md');
        (0, fs_1.writeFileSync)(skillPath, `---
name: valid-skill
description: A valid skill
---

# Valid Skill
`);
        const result = await (0, skills_ts_1.parseSkillMd)(skillPath);
        (0, vitest_1.expect)(result).not.toBeNull();
        (0, vitest_1.expect)(result.name).toBe('valid-skill');
    });
});
//# sourceMappingURL=skill-matching.test.js.map