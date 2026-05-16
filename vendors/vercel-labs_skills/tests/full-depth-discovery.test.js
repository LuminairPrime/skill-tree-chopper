"use strict";
/**
 * Tests for the --full-depth option in skill discovery.
 *
 * When a repository has both a root SKILL.md and nested skills in subdirectories,
 * the --full-depth flag allows discovering all skills instead of just the root one.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const skills_ts_1 = require("../src/skills.ts");
(0, vitest_1.describe)('discoverSkills with fullDepth option', () => {
    let testDir;
    (0, vitest_1.beforeEach)(() => {
        testDir = (0, path_1.join)((0, os_1.tmpdir)(), `skills-full-depth-test-${Date.now()}`);
        (0, fs_1.mkdirSync)(testDir, { recursive: true });
    });
    (0, vitest_1.afterEach)(() => {
        (0, fs_1.rmSync)(testDir, { recursive: true, force: true });
    });
    (0, vitest_1.it)('should only return root skill when fullDepth is false', async () => {
        // Create root SKILL.md
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'SKILL.md'), `---
name: root-skill
description: Root level skill
---

# Root Skill
`);
        // Create nested skill in skills/ directory
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'skills', 'nested-skill'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'skills', 'nested-skill', 'SKILL.md'), `---
name: nested-skill
description: Nested skill
---

# Nested Skill
`);
        const skills = await (0, skills_ts_1.discoverSkills)(testDir, undefined, { fullDepth: false });
        (0, vitest_1.expect)(skills).toHaveLength(1);
        (0, vitest_1.expect)(skills[0].name).toBe('root-skill');
    });
    (0, vitest_1.it)('should return all skills when fullDepth is true', async () => {
        // Create root SKILL.md
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'SKILL.md'), `---
name: root-skill
description: Root level skill
---

# Root Skill
`);
        // Create nested skills in skills/ directory
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'skills', 'nested-skill-1'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'skills', 'nested-skill-1', 'SKILL.md'), `---
name: nested-skill-1
description: Nested skill 1
---

# Nested Skill 1
`);
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'skills', 'nested-skill-2'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'skills', 'nested-skill-2', 'SKILL.md'), `---
name: nested-skill-2
description: Nested skill 2
---

# Nested Skill 2
`);
        const skills = await (0, skills_ts_1.discoverSkills)(testDir, undefined, { fullDepth: true });
        (0, vitest_1.expect)(skills).toHaveLength(3);
        const names = skills.map((s) => s.name).sort();
        (0, vitest_1.expect)(names).toEqual(['nested-skill-1', 'nested-skill-2', 'root-skill']);
    });
    (0, vitest_1.it)('should default to early return (fullDepth: false behavior) when no option is provided', async () => {
        // Create root SKILL.md
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'SKILL.md'), `---
name: root-skill
description: Root level skill
---

# Root Skill
`);
        // Create nested skill
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'skills', 'nested-skill'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'skills', 'nested-skill', 'SKILL.md'), `---
name: nested-skill
description: Nested skill
---

# Nested Skill
`);
        // No options passed - should default to early return
        const skills = await (0, skills_ts_1.discoverSkills)(testDir);
        (0, vitest_1.expect)(skills).toHaveLength(1);
        (0, vitest_1.expect)(skills[0].name).toBe('root-skill');
    });
    (0, vitest_1.it)('should still find all skills when no root SKILL.md exists (regardless of fullDepth)', async () => {
        // No root SKILL.md, just nested skills
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'skills', 'skill-1'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'skills', 'skill-1', 'SKILL.md'), `---
name: skill-1
description: Skill 1
---

# Skill 1
`);
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'skills', 'skill-2'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'skills', 'skill-2', 'SKILL.md'), `---
name: skill-2
description: Skill 2
---

# Skill 2
`);
        // Without fullDepth
        const skillsDefault = await (0, skills_ts_1.discoverSkills)(testDir);
        (0, vitest_1.expect)(skillsDefault).toHaveLength(2);
        // With fullDepth
        const skillsFullDepth = await (0, skills_ts_1.discoverSkills)(testDir, undefined, { fullDepth: true });
        (0, vitest_1.expect)(skillsFullDepth).toHaveLength(2);
    });
    (0, vitest_1.it)('should not duplicate skills when root and nested have the same name', async () => {
        // Edge case: root SKILL.md and a nested skill with the same name
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'SKILL.md'), `---
name: my-skill
description: Root level skill
---

# Root Skill
`);
        // Create nested skill with same name
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'skills', 'my-skill'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'skills', 'my-skill', 'SKILL.md'), `---
name: my-skill
description: Nested skill with same name
---

# Nested Skill
`);
        const skills = await (0, skills_ts_1.discoverSkills)(testDir, undefined, { fullDepth: true });
        // Should only have one skill (deduplication by name)
        (0, vitest_1.expect)(skills).toHaveLength(1);
        (0, vitest_1.expect)(skills[0].name).toBe('my-skill');
    });
});
//# sourceMappingURL=full-depth-discovery.test.js.map