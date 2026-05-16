"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const test_utils_ts_1 = require("./test-utils.ts");
const list_ts_1 = require("./list.ts");
(0, vitest_1.describe)('list command', () => {
    let testDir;
    (0, vitest_1.beforeEach)(() => {
        testDir = (0, path_1.join)((0, os_1.tmpdir)(), `skills-list-test-${Date.now()}`);
        (0, fs_1.mkdirSync)(testDir, { recursive: true });
    });
    (0, vitest_1.afterEach)(() => {
        if ((0, fs_1.existsSync)(testDir)) {
            (0, fs_1.rmSync)(testDir, { recursive: true, force: true });
        }
    });
    (0, vitest_1.describe)('parseListOptions', () => {
        (0, vitest_1.it)('should parse empty args', () => {
            const options = (0, list_ts_1.parseListOptions)([]);
            (0, vitest_1.expect)(options).toEqual({});
        });
        (0, vitest_1.it)('should parse -g flag', () => {
            const options = (0, list_ts_1.parseListOptions)(['-g']);
            (0, vitest_1.expect)(options.global).toBe(true);
        });
        (0, vitest_1.it)('should parse --global flag', () => {
            const options = (0, list_ts_1.parseListOptions)(['--global']);
            (0, vitest_1.expect)(options.global).toBe(true);
        });
        (0, vitest_1.it)('should parse -a flag with single agent', () => {
            const options = (0, list_ts_1.parseListOptions)(['-a', 'claude-code']);
            (0, vitest_1.expect)(options.agent).toEqual(['claude-code']);
        });
        (0, vitest_1.it)('should parse --agent flag with single agent', () => {
            const options = (0, list_ts_1.parseListOptions)(['--agent', 'cursor']);
            (0, vitest_1.expect)(options.agent).toEqual(['cursor']);
        });
        (0, vitest_1.it)('should parse -a flag with multiple agents', () => {
            const options = (0, list_ts_1.parseListOptions)(['-a', 'claude-code', 'cursor', 'codex']);
            (0, vitest_1.expect)(options.agent).toEqual(['claude-code', 'cursor', 'codex']);
        });
        (0, vitest_1.it)('should parse combined flags', () => {
            const options = (0, list_ts_1.parseListOptions)(['-g', '-a', 'claude-code', 'cursor']);
            (0, vitest_1.expect)(options.global).toBe(true);
            (0, vitest_1.expect)(options.agent).toEqual(['claude-code', 'cursor']);
        });
        (0, vitest_1.it)('should parse --json flag', () => {
            const options = (0, list_ts_1.parseListOptions)(['--json']);
            (0, vitest_1.expect)(options.json).toBe(true);
        });
        (0, vitest_1.it)('should parse combined --json and -g flags', () => {
            const options = (0, list_ts_1.parseListOptions)(['-g', '--json']);
            (0, vitest_1.expect)(options.global).toBe(true);
            (0, vitest_1.expect)(options.json).toBe(true);
        });
        (0, vitest_1.it)('should stop collecting agents at next flag', () => {
            const options = (0, list_ts_1.parseListOptions)(['-a', 'claude-code', '-g']);
            (0, vitest_1.expect)(options.agent).toEqual(['claude-code']);
            (0, vitest_1.expect)(options.global).toBe(true);
        });
    });
    (0, vitest_1.describe)('CLI integration', () => {
        (0, vitest_1.it)('should run list command', () => {
            const result = (0, test_utils_ts_1.runCli)(['list'], testDir);
            // Empty project dir shows "No project skills found"
            (0, vitest_1.expect)(result.stdout).toContain('No project skills found');
            (0, vitest_1.expect)(result.exitCode).toBe(0);
        });
        (0, vitest_1.it)('should run ls alias', () => {
            const result = (0, test_utils_ts_1.runCli)(['ls'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('No project skills found');
            (0, vitest_1.expect)(result.exitCode).toBe(0);
        });
        (0, vitest_1.it)('should output empty JSON array when no skills', () => {
            const result = (0, test_utils_ts_1.runCli)(['list', '--json'], testDir);
            (0, vitest_1.expect)(result.exitCode).toBe(0);
            const parsed = JSON.parse(result.stdout.trim());
            (0, vitest_1.expect)(parsed).toEqual([]);
        });
        (0, vitest_1.it)('should output valid JSON with --json flag', () => {
            const skillDir = (0, path_1.join)(testDir, '.agents', 'skills', 'json-skill');
            (0, fs_1.mkdirSync)(skillDir, { recursive: true });
            (0, fs_1.writeFileSync)((0, path_1.join)(skillDir, 'SKILL.md'), `---
name: json-skill
description: A skill for JSON testing
---

# JSON Skill
`);
            const result = (0, test_utils_ts_1.runCli)(['list', '--json'], testDir);
            (0, vitest_1.expect)(result.exitCode).toBe(0);
            const parsed = JSON.parse(result.stdout.trim());
            (0, vitest_1.expect)(Array.isArray(parsed)).toBe(true);
            (0, vitest_1.expect)(parsed.length).toBe(1);
            (0, vitest_1.expect)(parsed[0].name).toBe('json-skill');
            (0, vitest_1.expect)(parsed[0].path).toContain('json-skill');
            (0, vitest_1.expect)(parsed[0].scope).toBe('project');
            (0, vitest_1.expect)(Array.isArray(parsed[0].agents)).toBe(true);
            // No ANSI codes in JSON output
            (0, vitest_1.expect)(result.stdout).not.toMatch(/\x1b\[/);
        });
        (0, vitest_1.it)('should output multiple skills as JSON array', () => {
            const skill1Dir = (0, path_1.join)(testDir, '.agents', 'skills', 'skill-alpha');
            const skill2Dir = (0, path_1.join)(testDir, '.agents', 'skills', 'skill-beta');
            (0, fs_1.mkdirSync)(skill1Dir, { recursive: true });
            (0, fs_1.mkdirSync)(skill2Dir, { recursive: true });
            (0, fs_1.writeFileSync)((0, path_1.join)(skill1Dir, 'SKILL.md'), `---\nname: skill-alpha\ndescription: Alpha\n---\n# Alpha\n`);
            (0, fs_1.writeFileSync)((0, path_1.join)(skill2Dir, 'SKILL.md'), `---\nname: skill-beta\ndescription: Beta\n---\n# Beta\n`);
            const result = (0, test_utils_ts_1.runCli)(['list', '--json'], testDir);
            (0, vitest_1.expect)(result.exitCode).toBe(0);
            const parsed = JSON.parse(result.stdout.trim());
            (0, vitest_1.expect)(parsed.length).toBe(2);
            const names = parsed.map((s) => s.name);
            (0, vitest_1.expect)(names).toContain('skill-alpha');
            (0, vitest_1.expect)(names).toContain('skill-beta');
        });
        (0, vitest_1.it)('should show message when no project skills found', () => {
            const result = (0, test_utils_ts_1.runCli)(['list'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('No project skills found');
            (0, vitest_1.expect)(result.stdout).toContain('Try listing global skills with -g');
            (0, vitest_1.expect)(result.exitCode).toBe(0);
        });
        (0, vitest_1.it)('should list project skills', () => {
            // Create a skill in the canonical location
            const skillDir = (0, path_1.join)(testDir, '.agents', 'skills', 'test-skill');
            (0, fs_1.mkdirSync)(skillDir, { recursive: true });
            (0, fs_1.writeFileSync)((0, path_1.join)(skillDir, 'SKILL.md'), `---
name: test-skill
description: A test skill for listing
---

# Test Skill

This is a test skill.
`);
            const result = (0, test_utils_ts_1.runCli)(['list'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('test-skill');
            (0, vitest_1.expect)(result.stdout).toContain('Project Skills');
            // Description should not be shown
            (0, vitest_1.expect)(result.stdout).not.toContain('A test skill for listing');
            (0, vitest_1.expect)(result.exitCode).toBe(0);
        });
        (0, vitest_1.it)('should list multiple skills', () => {
            // Create multiple skills
            const skill1Dir = (0, path_1.join)(testDir, '.agents', 'skills', 'skill-one');
            const skill2Dir = (0, path_1.join)(testDir, '.agents', 'skills', 'skill-two');
            (0, fs_1.mkdirSync)(skill1Dir, { recursive: true });
            (0, fs_1.mkdirSync)(skill2Dir, { recursive: true });
            (0, fs_1.writeFileSync)((0, path_1.join)(skill1Dir, 'SKILL.md'), `---
name: skill-one
description: First skill
---
# Skill One
`);
            (0, fs_1.writeFileSync)((0, path_1.join)(skill2Dir, 'SKILL.md'), `---
name: skill-two
description: Second skill
---
# Skill Two
`);
            const result = (0, test_utils_ts_1.runCli)(['list'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('skill-one');
            (0, vitest_1.expect)(result.stdout).toContain('skill-two');
            (0, vitest_1.expect)(result.stdout).toContain('Project Skills');
            (0, vitest_1.expect)(result.exitCode).toBe(0);
        });
        (0, vitest_1.it)('should respect -g flag for global only', () => {
            // Create a project skill (should not be shown with -g)
            const skillDir = (0, path_1.join)(testDir, '.agents', 'skills', 'project-skill');
            (0, fs_1.mkdirSync)(skillDir, { recursive: true });
            (0, fs_1.writeFileSync)((0, path_1.join)(skillDir, 'SKILL.md'), `---
name: project-skill
description: A project skill
---
# Project Skill
`);
            const result = (0, test_utils_ts_1.runCli)(['list', '-g'], testDir);
            // Should not show project skill when -g is specified
            (0, vitest_1.expect)(result.stdout).not.toContain('project-skill');
            (0, vitest_1.expect)(result.stdout).toContain('Global Skills');
        });
        (0, vitest_1.it)('should show error for invalid agent filter', () => {
            const result = (0, test_utils_ts_1.runCli)(['list', '-a', 'invalid-agent'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('Invalid agents');
            (0, vitest_1.expect)(result.stdout).toContain('invalid-agent');
            (0, vitest_1.expect)(result.exitCode).toBe(1);
        });
        (0, vitest_1.it)('should filter by valid agent', () => {
            // Create a skill
            const skillDir = (0, path_1.join)(testDir, '.agents', 'skills', 'test-skill');
            (0, fs_1.mkdirSync)(skillDir, { recursive: true });
            (0, fs_1.writeFileSync)((0, path_1.join)(skillDir, 'SKILL.md'), `---
name: test-skill
description: A test skill
---
# Test Skill
`);
            const result = (0, test_utils_ts_1.runCli)(['list', '-a', 'claude-code'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('test-skill');
            (0, vitest_1.expect)(result.exitCode).toBe(0);
        });
        (0, vitest_1.it)('should ignore directories without SKILL.md', () => {
            // Create a valid skill
            const validDir = (0, path_1.join)(testDir, '.agents', 'skills', 'valid-skill');
            (0, fs_1.mkdirSync)(validDir, { recursive: true });
            (0, fs_1.writeFileSync)((0, path_1.join)(validDir, 'SKILL.md'), `---
name: valid-skill
description: Valid skill
---
# Valid
`);
            // Create an invalid directory (no SKILL.md)
            const invalidDir = (0, path_1.join)(testDir, '.agents', 'skills', 'invalid-skill');
            (0, fs_1.mkdirSync)(invalidDir, { recursive: true });
            (0, fs_1.writeFileSync)((0, path_1.join)(invalidDir, 'README.md'), '# Not a skill');
            const result = (0, test_utils_ts_1.runCli)(['list'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('valid-skill');
            (0, vitest_1.expect)(result.stdout).not.toContain('invalid-skill');
            (0, vitest_1.expect)(result.exitCode).toBe(0);
        });
        (0, vitest_1.it)('should handle SKILL.md with missing frontmatter', () => {
            // Create a valid skill
            const validDir = (0, path_1.join)(testDir, '.agents', 'skills', 'valid-skill');
            (0, fs_1.mkdirSync)(validDir, { recursive: true });
            (0, fs_1.writeFileSync)((0, path_1.join)(validDir, 'SKILL.md'), `---
name: valid-skill
description: Valid skill
---
# Valid
`);
            // Create a skill with invalid SKILL.md (no frontmatter)
            const invalidDir = (0, path_1.join)(testDir, '.agents', 'skills', 'invalid-skill');
            (0, fs_1.mkdirSync)(invalidDir, { recursive: true });
            (0, fs_1.writeFileSync)((0, path_1.join)(invalidDir, 'SKILL.md'), '# Invalid\nNo frontmatter here');
            const result = (0, test_utils_ts_1.runCli)(['list'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('valid-skill');
            (0, vitest_1.expect)(result.stdout).not.toContain('invalid-skill');
            (0, vitest_1.expect)(result.exitCode).toBe(0);
        });
        (0, vitest_1.it)('should show skill path', () => {
            const skillDir = (0, path_1.join)(testDir, '.agents', 'skills', 'test-skill');
            (0, fs_1.mkdirSync)(skillDir, { recursive: true });
            (0, fs_1.writeFileSync)((0, path_1.join)(skillDir, 'SKILL.md'), `---
name: test-skill
description: A test skill
---
# Test Skill
`);
            const result = (0, test_utils_ts_1.runCli)(['list'], testDir);
            // Path is shown inline with skill name (handles both Unix / and Windows \)
            (0, vitest_1.expect)(result.stdout).toMatch(/\.agents[/\\]skills[/\\]test-skill/);
        });
    });
    (0, vitest_1.describe)('help output', () => {
        (0, vitest_1.it)('should include list command in help', () => {
            const result = (0, test_utils_ts_1.runCli)(['--help']);
            (0, vitest_1.expect)(result.stdout).toContain('list, ls');
            (0, vitest_1.expect)(result.stdout).toContain('List installed skills');
        });
        (0, vitest_1.it)('should include list options in help', () => {
            const result = (0, test_utils_ts_1.runCli)(['--help']);
            (0, vitest_1.expect)(result.stdout).toContain('List Options:');
            (0, vitest_1.expect)(result.stdout).toContain('-g, --global');
            (0, vitest_1.expect)(result.stdout).toContain('-a, --agent');
        });
        (0, vitest_1.it)('should include list examples in help', () => {
            const result = (0, test_utils_ts_1.runCli)(['--help']);
            (0, vitest_1.expect)(result.stdout).toContain('skills list');
            (0, vitest_1.expect)(result.stdout).toContain('skills ls -g');
            (0, vitest_1.expect)(result.stdout).toContain('skills ls -a claude-code');
        });
    });
    (0, vitest_1.describe)('banner', () => {
        (0, vitest_1.it)('should include list command in banner', () => {
            const result = (0, test_utils_ts_1.runCli)([]);
            (0, vitest_1.expect)(result.stdout).toContain('npx skills list');
            (0, vitest_1.expect)(result.stdout).toContain('List installed skills');
        });
    });
});
//# sourceMappingURL=list.test.js.map