"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const test_utils_ts_1 = require("./test-utils.ts");
const skills_ts_1 = require("./skills.ts");
const add_ts_1 = require("./add.ts");
(0, vitest_1.describe)('add command', () => {
    let testDir;
    (0, vitest_1.beforeEach)(() => {
        testDir = (0, path_1.join)((0, os_1.tmpdir)(), `skills-add-test-${Date.now()}`);
        (0, fs_1.mkdirSync)(testDir, { recursive: true });
    });
    (0, vitest_1.afterEach)(() => {
        if ((0, fs_1.existsSync)(testDir)) {
            (0, fs_1.rmSync)(testDir, { recursive: true, force: true });
        }
    });
    (0, vitest_1.it)('should show error when no source provided', () => {
        const result = (0, test_utils_ts_1.runCli)(['add'], testDir);
        (0, vitest_1.expect)(result.stdout).toContain('ERROR');
        (0, vitest_1.expect)(result.stdout).toContain('Missing required argument: source');
        (0, vitest_1.expect)(result.exitCode).toBe(1);
    });
    (0, vitest_1.it)('should show error for non-existent local path', () => {
        const result = (0, test_utils_ts_1.runCli)(['add', './non-existent-path', '-y'], testDir);
        (0, vitest_1.expect)(result.stdout).toContain('Local path does not exist');
        (0, vitest_1.expect)(result.exitCode).toBe(1);
    });
    (0, vitest_1.it)('should list skills from local path with --list flag', () => {
        // Create a test skill
        const skillDir = (0, path_1.join)(testDir, 'test-skill');
        (0, fs_1.mkdirSync)(skillDir, { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(skillDir, 'SKILL.md'), `---
name: test-skill
description: A test skill for testing
---

# Test Skill

This is a test skill.
`);
        const result = (0, test_utils_ts_1.runCli)(['add', testDir, '--list'], testDir);
        (0, vitest_1.expect)(result.stdout).toContain('test-skill');
        (0, vitest_1.expect)(result.stdout).toContain('A test skill for testing');
        (0, vitest_1.expect)(result.exitCode).toBe(0);
    });
    (0, vitest_1.it)('should show no skills found for empty directory', () => {
        const result = (0, test_utils_ts_1.runCli)(['add', testDir, '-y'], testDir);
        (0, vitest_1.expect)(result.stdout).toContain('No skills found');
        (0, vitest_1.expect)(result.stdout).toContain('No valid skills found');
        (0, vitest_1.expect)(result.exitCode).toBe(1);
    });
    (0, vitest_1.it)('should install skill from local path with -y flag', () => {
        // Create a test skill
        const skillDir = (0, path_1.join)(testDir, 'skills', 'my-skill');
        (0, fs_1.mkdirSync)(skillDir, { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(skillDir, 'SKILL.md'), `---
name: my-skill
description: My test skill
---

# My Skill

Instructions here.
`);
        // Create a target directory to install to
        const targetDir = (0, path_1.join)(testDir, 'project');
        (0, fs_1.mkdirSync)(targetDir, { recursive: true });
        const result = (0, test_utils_ts_1.runCli)(['add', testDir, '-y', '-g', '--agent', 'claude-code'], targetDir);
        (0, vitest_1.expect)(result.stdout).toContain('my-skill');
        (0, vitest_1.expect)(result.stdout).toContain('Done!');
        (0, vitest_1.expect)(result.exitCode).toBe(0);
    });
    (0, vitest_1.it)('should filter skills by name with --skill flag', () => {
        // Create multiple test skills
        const skill1Dir = (0, path_1.join)(testDir, 'skills', 'skill-one');
        const skill2Dir = (0, path_1.join)(testDir, 'skills', 'skill-two');
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
        const result = (0, test_utils_ts_1.runCli)(['add', testDir, '--list', '--skill', 'skill-one'], testDir);
        // With --list, it should show only the filtered skill info
        (0, vitest_1.expect)(result.stdout).toContain('skill-one');
    });
    (0, vitest_1.it)('should show error for invalid agent name', () => {
        // Create a test skill
        const skillDir = (0, path_1.join)(testDir, 'test-skill');
        (0, fs_1.mkdirSync)(skillDir, { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(skillDir, 'SKILL.md'), `---
name: test-skill
description: Test
---
# Test
`);
        const result = (0, test_utils_ts_1.runCli)(['add', testDir, '-y', '--agent', 'invalid-agent'], testDir);
        (0, vitest_1.expect)(result.stdout).toContain('Invalid agents');
        (0, vitest_1.expect)(result.exitCode).toBe(1);
    });
    (0, vitest_1.it)('should support add command aliases (a, i, install)', () => {
        // Test that aliases work (just check they show missing source error)
        const resultA = (0, test_utils_ts_1.runCli)(['a'], testDir);
        const resultI = (0, test_utils_ts_1.runCli)(['i'], testDir);
        const resultInstall = (0, test_utils_ts_1.runCli)(['install'], testDir);
        // All should show the same "missing source" error
        (0, vitest_1.expect)(resultA.stdout).toContain('Missing required argument: source');
        (0, vitest_1.expect)(resultI.stdout).toContain('Missing required argument: source');
        (0, vitest_1.expect)(resultInstall.stdout).toContain('Missing required argument: source');
    });
    (0, vitest_1.it)('should restore from lock file with experimental_install', () => {
        const result = (0, test_utils_ts_1.runCli)(['experimental_install'], testDir);
        (0, vitest_1.expect)(result.stdout).toContain('No project skills found in skills-lock.json');
    });
    (0, vitest_1.describe)('internal skills', () => {
        (0, vitest_1.it)('should skip internal skills by default', () => {
            // Create an internal skill
            const skillDir = (0, path_1.join)(testDir, 'internal-skill');
            (0, fs_1.mkdirSync)(skillDir, { recursive: true });
            (0, fs_1.writeFileSync)((0, path_1.join)(skillDir, 'SKILL.md'), `---
name: internal-skill
description: An internal skill
metadata:
  internal: true
---

# Internal Skill

This is an internal skill.
`);
            const result = (0, test_utils_ts_1.runCli)(['add', testDir, '--list'], testDir);
            (0, vitest_1.expect)(result.stdout).not.toContain('internal-skill');
        });
        (0, vitest_1.it)('should show internal skills when INSTALL_INTERNAL_SKILLS=1', () => {
            // Create an internal skill
            const skillDir = (0, path_1.join)(testDir, 'internal-skill');
            (0, fs_1.mkdirSync)(skillDir, { recursive: true });
            (0, fs_1.writeFileSync)((0, path_1.join)(skillDir, 'SKILL.md'), `---
name: internal-skill
description: An internal skill
metadata:
  internal: true
---

# Internal Skill

This is an internal skill.
`);
            const result = (0, test_utils_ts_1.runCli)(['add', testDir, '--list'], testDir, {
                INSTALL_INTERNAL_SKILLS: '1',
            });
            (0, vitest_1.expect)(result.stdout).toContain('internal-skill');
            (0, vitest_1.expect)(result.stdout).toContain('An internal skill');
        });
        (0, vitest_1.it)('should show internal skills when INSTALL_INTERNAL_SKILLS=true', () => {
            // Create an internal skill
            const skillDir = (0, path_1.join)(testDir, 'internal-skill');
            (0, fs_1.mkdirSync)(skillDir, { recursive: true });
            (0, fs_1.writeFileSync)((0, path_1.join)(skillDir, 'SKILL.md'), `---
name: internal-skill
description: An internal skill
metadata:
  internal: true
---

# Internal Skill

This is an internal skill.
`);
            const result = (0, test_utils_ts_1.runCli)(['add', testDir, '--list'], testDir, {
                INSTALL_INTERNAL_SKILLS: 'true',
            });
            (0, vitest_1.expect)(result.stdout).toContain('internal-skill');
        });
        (0, vitest_1.it)('should show non-internal skills alongside internal when env var is set', () => {
            // Create both internal and non-internal skills
            const internalDir = (0, path_1.join)(testDir, 'skills', 'internal-skill');
            const publicDir = (0, path_1.join)(testDir, 'skills', 'public-skill');
            (0, fs_1.mkdirSync)(internalDir, { recursive: true });
            (0, fs_1.mkdirSync)(publicDir, { recursive: true });
            (0, fs_1.writeFileSync)((0, path_1.join)(internalDir, 'SKILL.md'), `---
name: internal-skill
description: An internal skill
metadata:
  internal: true
---
# Internal Skill
`);
            (0, fs_1.writeFileSync)((0, path_1.join)(publicDir, 'SKILL.md'), `---
name: public-skill
description: A public skill
---
# Public Skill
`);
            // Without env var - only public skill visible
            const resultWithout = (0, test_utils_ts_1.runCli)(['add', testDir, '--list'], testDir);
            (0, vitest_1.expect)(resultWithout.stdout).toContain('public-skill');
            (0, vitest_1.expect)(resultWithout.stdout).not.toContain('internal-skill');
            // With env var - both visible
            const resultWith = (0, test_utils_ts_1.runCli)(['add', testDir, '--list'], testDir, {
                INSTALL_INTERNAL_SKILLS: '1',
            });
            (0, vitest_1.expect)(resultWith.stdout).toContain('public-skill');
            (0, vitest_1.expect)(resultWith.stdout).toContain('internal-skill');
        });
        (0, vitest_1.it)('should not treat metadata.internal: false as internal', () => {
            const skillDir = (0, path_1.join)(testDir, 'not-internal-skill');
            (0, fs_1.mkdirSync)(skillDir, { recursive: true });
            (0, fs_1.writeFileSync)((0, path_1.join)(skillDir, 'SKILL.md'), `---
name: not-internal-skill
description: Explicitly not internal
metadata:
  internal: false
---
# Not Internal
`);
            const result = (0, test_utils_ts_1.runCli)(['add', testDir, '--list'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('not-internal-skill');
        });
    });
});
(0, vitest_1.describe)('shouldInstallInternalSkills', () => {
    const originalEnv = process.env;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetModules();
        process.env = { ...originalEnv };
    });
    (0, vitest_1.afterEach)(() => {
        process.env = originalEnv;
    });
    (0, vitest_1.it)('should return false when INSTALL_INTERNAL_SKILLS is not set', () => {
        delete process.env.INSTALL_INTERNAL_SKILLS;
        (0, vitest_1.expect)((0, skills_ts_1.shouldInstallInternalSkills)()).toBe(false);
    });
    (0, vitest_1.it)('should return true when INSTALL_INTERNAL_SKILLS=1', () => {
        process.env.INSTALL_INTERNAL_SKILLS = '1';
        (0, vitest_1.expect)((0, skills_ts_1.shouldInstallInternalSkills)()).toBe(true);
    });
    (0, vitest_1.it)('should return true when INSTALL_INTERNAL_SKILLS=true', () => {
        process.env.INSTALL_INTERNAL_SKILLS = 'true';
        (0, vitest_1.expect)((0, skills_ts_1.shouldInstallInternalSkills)()).toBe(true);
    });
    (0, vitest_1.it)('should return false for other values', () => {
        process.env.INSTALL_INTERNAL_SKILLS = '0';
        (0, vitest_1.expect)((0, skills_ts_1.shouldInstallInternalSkills)()).toBe(false);
        process.env.INSTALL_INTERNAL_SKILLS = 'false';
        (0, vitest_1.expect)((0, skills_ts_1.shouldInstallInternalSkills)()).toBe(false);
        process.env.INSTALL_INTERNAL_SKILLS = 'yes';
        (0, vitest_1.expect)((0, skills_ts_1.shouldInstallInternalSkills)()).toBe(false);
    });
});
(0, vitest_1.describe)('parseAddOptions', () => {
    (0, vitest_1.it)('should parse --all flag', () => {
        const result = (0, add_ts_1.parseAddOptions)(['source', '--all']);
        (0, vitest_1.expect)(result.source).toEqual(['source']);
        (0, vitest_1.expect)(result.options.all).toBe(true);
    });
    (0, vitest_1.it)('should parse --skill with wildcard', () => {
        const result = (0, add_ts_1.parseAddOptions)(['source', '--skill', '*']);
        (0, vitest_1.expect)(result.source).toEqual(['source']);
        (0, vitest_1.expect)(result.options.skill).toEqual(['*']);
    });
    (0, vitest_1.it)('should parse --agent with wildcard', () => {
        const result = (0, add_ts_1.parseAddOptions)(['source', '--agent', '*']);
        (0, vitest_1.expect)(result.source).toEqual(['source']);
        (0, vitest_1.expect)(result.options.agent).toEqual(['*']);
    });
    (0, vitest_1.it)('should parse --skill wildcard with specific agents', () => {
        const result = (0, add_ts_1.parseAddOptions)(['source', '--skill', '*', '--agent', 'claude-code']);
        (0, vitest_1.expect)(result.source).toEqual(['source']);
        (0, vitest_1.expect)(result.options.skill).toEqual(['*']);
        (0, vitest_1.expect)(result.options.agent).toEqual(['claude-code']);
    });
    (0, vitest_1.it)('should parse --agent wildcard with specific skills', () => {
        const result = (0, add_ts_1.parseAddOptions)(['source', '--agent', '*', '--skill', 'my-skill']);
        (0, vitest_1.expect)(result.source).toEqual(['source']);
        (0, vitest_1.expect)(result.options.agent).toEqual(['*']);
        (0, vitest_1.expect)(result.options.skill).toEqual(['my-skill']);
    });
    (0, vitest_1.it)('should parse combined flags with wildcards', () => {
        const result = (0, add_ts_1.parseAddOptions)(['source', '-g', '--skill', '*', '-y']);
        (0, vitest_1.expect)(result.source).toEqual(['source']);
        (0, vitest_1.expect)(result.options.global).toBe(true);
        (0, vitest_1.expect)(result.options.skill).toEqual(['*']);
        (0, vitest_1.expect)(result.options.yes).toBe(true);
    });
    (0, vitest_1.it)('should parse --full-depth flag', () => {
        const result = (0, add_ts_1.parseAddOptions)(['source', '--full-depth']);
        (0, vitest_1.expect)(result.source).toEqual(['source']);
        (0, vitest_1.expect)(result.options.fullDepth).toBe(true);
    });
    (0, vitest_1.it)('should parse --full-depth with other flags', () => {
        const result = (0, add_ts_1.parseAddOptions)(['source', '--full-depth', '--list', '-g']);
        (0, vitest_1.expect)(result.source).toEqual(['source']);
        (0, vitest_1.expect)(result.options.fullDepth).toBe(true);
        (0, vitest_1.expect)(result.options.list).toBe(true);
        (0, vitest_1.expect)(result.options.global).toBe(true);
    });
});
(0, vitest_1.describe)('openclaw source blocking', () => {
    let testDir;
    (0, vitest_1.beforeEach)(() => {
        testDir = (0, path_1.join)((0, os_1.tmpdir)(), `skills-openclaw-test-${Date.now()}`);
        (0, fs_1.mkdirSync)(testDir, { recursive: true });
    });
    (0, vitest_1.afterEach)(() => {
        if ((0, fs_1.existsSync)(testDir)) {
            (0, fs_1.rmSync)(testDir, { recursive: true, force: true });
        }
    });
    (0, vitest_1.it)('should block openclaw/skills without --dangerously-accept-openclaw-risks', () => {
        const result = (0, test_utils_ts_1.runCli)(['add', 'openclaw/skills', '-y'], testDir);
        (0, vitest_1.expect)(result.stdout).toContain('unverified community submissions');
        (0, vitest_1.expect)(result.stdout).toContain('--dangerously-accept-openclaw-risks');
        (0, vitest_1.expect)(result.stdout).toContain('Installation blocked');
        (0, vitest_1.expect)(result.exitCode).toBe(1);
    });
    (0, vitest_1.it)('should block openclaw/anything without the flag', () => {
        const result = (0, test_utils_ts_1.runCli)(['add', 'openclaw/some-repo', '-y'], testDir);
        (0, vitest_1.expect)(result.stdout).toContain('unverified community submissions');
        (0, vitest_1.expect)(result.stdout).toContain('--dangerously-accept-openclaw-risks');
        (0, vitest_1.expect)(result.exitCode).toBe(1);
    });
    (0, vitest_1.it)('should block OpenClaw/skills (case-insensitive)', () => {
        const result = (0, test_utils_ts_1.runCli)(['add', 'OpenClaw/skills', '-y'], testDir);
        (0, vitest_1.expect)(result.stdout).toContain('unverified community submissions');
        (0, vitest_1.expect)(result.stdout).toContain('--dangerously-accept-openclaw-risks');
        (0, vitest_1.expect)(result.exitCode).toBe(1);
    });
    (0, vitest_1.it)('should not block non-openclaw sources', () => {
        // Use a local path to avoid network calls that time out on slow CI runners
        const result = (0, test_utils_ts_1.runCli)(['add', testDir, '--list'], testDir);
        (0, vitest_1.expect)(result.stdout).not.toContain('--dangerously-accept-openclaw-risks');
        (0, vitest_1.expect)(result.stdout).not.toContain('Installation blocked');
    });
    (0, vitest_1.it)('should parse --dangerously-accept-openclaw-risks flag', () => {
        const result = (0, add_ts_1.parseAddOptions)([
            'openclaw/skills',
            '--dangerously-accept-openclaw-risks',
            '-y',
        ]);
        (0, vitest_1.expect)(result.source).toEqual(['openclaw/skills']);
        (0, vitest_1.expect)(result.options.dangerouslyAcceptOpenclawRisks).toBe(true);
        (0, vitest_1.expect)(result.options.yes).toBe(true);
    });
});
(0, vitest_1.describe)('find-skills prompt with -y flag', () => {
    let testDir;
    (0, vitest_1.beforeEach)(() => {
        testDir = (0, path_1.join)((0, os_1.tmpdir)(), `skills-yes-flag-test-${Date.now()}`);
        (0, fs_1.mkdirSync)(testDir, { recursive: true });
    });
    (0, vitest_1.afterEach)(() => {
        if ((0, fs_1.existsSync)(testDir)) {
            (0, fs_1.rmSync)(testDir, { recursive: true, force: true });
        }
    });
    (0, vitest_1.it)('should skip find-skills prompt when -y flag is passed', () => {
        // Create a test skill
        const skillDir = (0, path_1.join)(testDir, 'test-skill');
        (0, fs_1.mkdirSync)(skillDir, { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(skillDir, 'SKILL.md'), `---
name: yes-flag-test-skill
description: A test skill for -y flag testing
---

# Yes Flag Test Skill

This is a test skill for -y flag mode testing.
`);
        // Run with -y flag - should complete without hanging
        const result = (0, test_utils_ts_1.runCli)(['add', testDir, '-g', '-y', '--skill', 'yes-flag-test-skill'], testDir);
        // Should not contain the find-skills prompt
        (0, vitest_1.expect)(result.stdout).not.toContain('Install the find-skills skill');
        (0, vitest_1.expect)(result.stdout).not.toContain("One-time prompt - you won't be asked again");
        // Should complete successfully
        (0, vitest_1.expect)(result.exitCode).toBe(0);
    });
});
//# sourceMappingURL=add.test.js.map