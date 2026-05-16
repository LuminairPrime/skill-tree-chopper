"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const test_utils_ts_1 = require("./test-utils.ts");
(0, vitest_1.describe)('init command', () => {
    let testDir;
    (0, vitest_1.beforeEach)(() => {
        testDir = (0, path_1.join)((0, os_1.tmpdir)(), `skills-test-${Date.now()}`);
        (0, fs_1.mkdirSync)(testDir, { recursive: true });
    });
    (0, vitest_1.afterEach)(() => {
        if ((0, fs_1.existsSync)(testDir)) {
            (0, fs_1.rmSync)(testDir, { recursive: true, force: true });
        }
    });
    (0, vitest_1.it)('should initialize a skill and create SKILL.md', () => {
        const output = (0, test_utils_ts_1.stripLogo)((0, test_utils_ts_1.runCliOutput)(['init', 'my-test-skill'], testDir));
        (0, vitest_1.expect)(output).toMatchInlineSnapshot(`
      "Initialized skill: my-test-skill

      Created:
        my-test-skill/SKILL.md

      Next steps:
        1. Edit my-test-skill/SKILL.md to define your skill instructions
        2. Update the name and description in the frontmatter

      Publishing:
        GitHub:  Push to a repo, then npx skills add <owner>/<repo>
        URL:     Host the file, then npx skills add https://example.com/my-test-skill/SKILL.md

      Browse existing skills for inspiration at https://skills.sh/

      "
    `);
        const skillPath = (0, path_1.join)(testDir, 'my-test-skill', 'SKILL.md');
        (0, vitest_1.expect)((0, fs_1.existsSync)(skillPath)).toBe(true);
        const content = (0, fs_1.readFileSync)(skillPath, 'utf-8');
        (0, vitest_1.expect)(content).toMatchInlineSnapshot(`
      "---
      name: my-test-skill
      description: A brief description of what this skill does
      ---

      # my-test-skill

      Instructions for the agent to follow when this skill is activated.

      ## When to use

      Describe when this skill should be used.

      ## Instructions

      1. First step
      2. Second step
      3. Additional steps as needed
      "
    `);
    });
    (0, vitest_1.it)('should allow multiple skills in same directory', () => {
        (0, test_utils_ts_1.runCliOutput)(['init', 'hydration-fix'], testDir);
        (0, test_utils_ts_1.runCliOutput)(['init', 'waterfall-data-fetching'], testDir);
        (0, vitest_1.expect)((0, fs_1.existsSync)((0, path_1.join)(testDir, 'hydration-fix', 'SKILL.md'))).toBe(true);
        (0, vitest_1.expect)((0, fs_1.existsSync)((0, path_1.join)(testDir, 'waterfall-data-fetching', 'SKILL.md'))).toBe(true);
    });
    (0, vitest_1.it)('should init SKILL.md in cwd when no name provided', () => {
        const output = (0, test_utils_ts_1.stripLogo)((0, test_utils_ts_1.runCliOutput)(['init'], testDir));
        (0, vitest_1.expect)(output).toContain('Initialized skill:');
        (0, vitest_1.expect)(output).toContain('Created:\n  SKILL.md'); // directly in cwd, not in a subfolder
        (0, vitest_1.expect)(output).toContain('Publishing:');
        (0, vitest_1.expect)(output).toContain('GitHub:');
        (0, vitest_1.expect)(output).toContain('npx skills add <owner>/<repo>');
        (0, vitest_1.expect)(output).toContain('URL:');
        (0, vitest_1.expect)(output).toContain('npx skills add https://example.com/SKILL.md');
        (0, vitest_1.expect)((0, fs_1.existsSync)((0, path_1.join)(testDir, 'SKILL.md'))).toBe(true);
    });
    (0, vitest_1.it)('should show publishing hints with skill path', () => {
        const output = (0, test_utils_ts_1.stripLogo)((0, test_utils_ts_1.runCliOutput)(['init', 'my-skill'], testDir));
        (0, vitest_1.expect)(output).toContain('Publishing:');
        (0, vitest_1.expect)(output).toContain('GitHub:  Push to a repo, then npx skills add <owner>/<repo>');
        (0, vitest_1.expect)(output).toContain('URL:     Host the file, then npx skills add https://example.com/my-skill/SKILL.md');
    });
    (0, vitest_1.it)('should show error if skill already exists', () => {
        (0, test_utils_ts_1.runCliOutput)(['init', 'existing-skill'], testDir);
        const output = (0, test_utils_ts_1.stripLogo)((0, test_utils_ts_1.runCliOutput)(['init', 'existing-skill'], testDir));
        (0, vitest_1.expect)(output).toMatchInlineSnapshot(`
      "Skill already exists at existing-skill/SKILL.md
      "
    `);
    });
});
//# sourceMappingURL=init.test.js.map