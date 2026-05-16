"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const test_utils_js_1 = require("./test-utils.js");
(0, vitest_1.describe)('remove command', { timeout: 30000 }, () => {
    let testDir;
    let skillsDir;
    (0, vitest_1.beforeEach)(() => {
        testDir = (0, path_1.join)((0, os_1.tmpdir)(), `skills-remove-test-${Date.now()}`);
        (0, fs_1.mkdirSync)(testDir, { recursive: true });
        // Create .agents/skills directory (canonical location)
        skillsDir = (0, path_1.join)(testDir, '.agents', 'skills');
        (0, fs_1.mkdirSync)(skillsDir, { recursive: true });
    });
    (0, vitest_1.afterEach)(() => {
        if ((0, fs_1.existsSync)(testDir)) {
            (0, fs_1.rmSync)(testDir, { recursive: true, force: true });
        }
    });
    function createTestSkill(name, description) {
        const skillDir = (0, path_1.join)(skillsDir, name);
        (0, fs_1.mkdirSync)(skillDir, { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(skillDir, 'SKILL.md'), `---
name: ${name}
description: ${description || `A test skill called ${name}`}
---

# ${name}

This is a test skill.
`);
    }
    function createAgentSkillsDir(agentName) {
        const agentSkillsDir = (0, path_1.join)(testDir, agentName, 'skills');
        (0, fs_1.mkdirSync)(agentSkillsDir, { recursive: true });
        return agentSkillsDir;
    }
    function createSymlink(skillName, targetDir) {
        const skillPath = (0, path_1.join)(skillsDir, skillName);
        const linkPath = (0, path_1.join)(targetDir, skillName);
        try {
            // Create relative symlink
            const relativePath = (0, path_1.join)('..', '..', '.agents', 'skills', skillName);
            const { symlinkSync } = require('fs');
            symlinkSync(relativePath, linkPath);
        }
        catch {
            // Skip if symlinks aren't supported
        }
    }
    (0, vitest_1.describe)('with no skills installed', () => {
        (0, vitest_1.it)('should show message when no skills found', () => {
            const result = (0, test_utils_js_1.runCli)(['remove', '-y'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('No skills found');
            (0, vitest_1.expect)(result.stdout).toContain('to remove');
            (0, vitest_1.expect)(result.exitCode).toBe(0);
        });
        (0, vitest_1.it)('should show error for non-existent skill name', () => {
            const result = (0, test_utils_js_1.runCli)(['remove', 'non-existent-skill', '-y'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('No skills found');
            (0, vitest_1.expect)(result.exitCode).toBe(0);
        });
    });
    (0, vitest_1.describe)('with skills installed', () => {
        (0, vitest_1.beforeEach)(() => {
            createTestSkill('skill-one', 'First test skill');
            createTestSkill('skill-two', 'Second test skill');
            createTestSkill('skill-three', 'Third test skill');
            // Create symlinks in agent directories
            const claudeSkillsDir = createAgentSkillsDir('.claude');
            createSymlink('skill-one', claudeSkillsDir);
            createSymlink('skill-two', claudeSkillsDir);
            const clineSkillsDir = createAgentSkillsDir('.cline');
            createSymlink('skill-one', clineSkillsDir);
            createSymlink('skill-three', clineSkillsDir);
        });
        (0, vitest_1.it)('should remove specific skill by name with -y flag', () => {
            const result = (0, test_utils_js_1.runCli)(['remove', 'skill-one', '-y'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('Successfully removed');
            (0, vitest_1.expect)(result.stdout).toContain('1 skill');
            // Verify skill was removed from canonical location
            (0, vitest_1.expect)((0, fs_1.existsSync)((0, path_1.join)(skillsDir, 'skill-one'))).toBe(false);
            // Verify other skills still exist
            (0, vitest_1.expect)((0, fs_1.existsSync)((0, path_1.join)(skillsDir, 'skill-two'))).toBe(true);
            (0, vitest_1.expect)((0, fs_1.existsSync)((0, path_1.join)(skillsDir, 'skill-three'))).toBe(true);
        });
        (0, vitest_1.it)('should remove multiple skills by name', () => {
            const result = (0, test_utils_js_1.runCli)(['remove', 'skill-one', 'skill-two', '-y'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('Successfully removed');
            (0, vitest_1.expect)(result.stdout).toContain('2 skill');
            (0, vitest_1.expect)((0, fs_1.existsSync)((0, path_1.join)(skillsDir, 'skill-one'))).toBe(false);
            (0, vitest_1.expect)((0, fs_1.existsSync)((0, path_1.join)(skillsDir, 'skill-two'))).toBe(false);
            (0, vitest_1.expect)((0, fs_1.existsSync)((0, path_1.join)(skillsDir, 'skill-three'))).toBe(true);
        });
        (0, vitest_1.it)('should remove all skills with --all flag', () => {
            const result = (0, test_utils_js_1.runCli)(['remove', '--all', '-y'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('Successfully removed');
            (0, vitest_1.expect)(result.stdout).toContain('3 skill');
            // All skills removed
            (0, vitest_1.expect)((0, fs_1.existsSync)((0, path_1.join)(skillsDir, 'skill-one'))).toBe(false);
            (0, vitest_1.expect)((0, fs_1.existsSync)((0, path_1.join)(skillsDir, 'skill-two'))).toBe(false);
            (0, vitest_1.expect)((0, fs_1.existsSync)((0, path_1.join)(skillsDir, 'skill-three'))).toBe(false);
        });
        (0, vitest_1.it)('should show error for non-existent skill name when skills exist', () => {
            const result = (0, test_utils_js_1.runCli)(['remove', 'non-existent', '-y'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('No matching skills');
            (0, vitest_1.expect)(result.exitCode).toBe(0);
        });
        (0, vitest_1.it)('should be case-insensitive when matching skill names', () => {
            const result = (0, test_utils_js_1.runCli)(['remove', 'SKILL-ONE', '-y'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('Successfully removed');
            (0, vitest_1.expect)((0, fs_1.existsSync)((0, path_1.join)(skillsDir, 'skill-one'))).toBe(false);
        });
        (0, vitest_1.it)('should remove only the specified skill and leave others', () => {
            (0, test_utils_js_1.runCli)(['remove', 'skill-two', '-y'], testDir);
            // skill-two removed
            (0, vitest_1.expect)((0, fs_1.existsSync)((0, path_1.join)(skillsDir, 'skill-two'))).toBe(false);
            // Others still exist
            (0, vitest_1.expect)((0, fs_1.existsSync)((0, path_1.join)(skillsDir, 'skill-one'))).toBe(true);
            (0, vitest_1.expect)((0, fs_1.existsSync)((0, path_1.join)(skillsDir, 'skill-three'))).toBe(true);
        });
        (0, vitest_1.it)('should list skills to remove before confirmation', () => {
            // Answer 'n' to cancel the confirmation prompt
            const result = (0, test_utils_js_1.runCliWithInput)(['remove', 'skill-one', 'skill-two'], 'n', testDir);
            // Should show the skills that will be removed
            (0, vitest_1.expect)(result.stdout).toContain('Skills to remove');
            (0, vitest_1.expect)(result.stdout).toContain('skill-one');
            (0, vitest_1.expect)(result.stdout).toContain('skill-two');
            (0, vitest_1.expect)(result.stdout).toContain('uninstall');
            // Skills should NOT be removed since we cancelled
            (0, vitest_1.expect)((0, fs_1.existsSync)((0, path_1.join)(skillsDir, 'skill-one'))).toBe(true);
            (0, vitest_1.expect)((0, fs_1.existsSync)((0, path_1.join)(skillsDir, 'skill-two'))).toBe(true);
        });
    });
    (0, vitest_1.describe)('agent filtering', () => {
        (0, vitest_1.beforeEach)(() => {
            createTestSkill('test-skill');
            createAgentSkillsDir('.claude');
            createAgentSkillsDir('.cline');
        });
        (0, vitest_1.it)('should show error for invalid agent name', () => {
            const result = (0, test_utils_js_1.runCli)(['remove', 'test-skill', '--agent', 'invalid-agent', '-y'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('Invalid agents');
            (0, vitest_1.expect)(result.stdout).toContain('invalid-agent');
            (0, vitest_1.expect)(result.stdout).toContain('Valid agents');
            (0, vitest_1.expect)(result.exitCode).toBe(1);
        });
        (0, vitest_1.it)('should accept valid agent names', () => {
            // This should not error on agent validation
            const result = (0, test_utils_js_1.runCli)(['remove', 'test-skill', '--agent', 'claude-code', '-y'], testDir);
            (0, vitest_1.expect)(result.stdout).not.toContain('Invalid agents');
        });
        (0, vitest_1.it)('should accept multiple agent names', () => {
            const result = (0, test_utils_js_1.runCli)(['remove', 'test-skill', '--agent', 'claude-code', 'cursor', '-y'], testDir);
            (0, vitest_1.expect)(result.stdout).not.toContain('Invalid agents');
        });
    });
    (0, vitest_1.describe)('global flag', () => {
        (0, vitest_1.beforeEach)(() => {
            createTestSkill('global-skill');
        });
        (0, vitest_1.it)('should accept --global flag without error', () => {
            const result = (0, test_utils_js_1.runCli)(['remove', 'global-skill', '--global', '-y'], testDir);
            // Command should run without error (skill may not be found in global scope from test dir)
            (0, vitest_1.expect)(result.exitCode).toBe(0);
        });
    });
    (0, vitest_1.describe)('command aliases', () => {
        (0, vitest_1.beforeEach)(() => {
            createTestSkill('alias-test-skill');
        });
        (0, vitest_1.it)('should support "rm" alias', () => {
            const result = (0, test_utils_js_1.runCli)(['rm', 'alias-test-skill', '-y'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('Successfully removed');
            (0, vitest_1.expect)(result.exitCode).toBe(0);
        });
        (0, vitest_1.it)('should support "r" alias', () => {
            const result = (0, test_utils_js_1.runCli)(['r', 'alias-test-skill', '-y'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('Successfully removed');
            (0, vitest_1.expect)(result.exitCode).toBe(0);
        });
    });
    (0, vitest_1.describe)('edge cases', () => {
        (0, vitest_1.it)('should handle skill names with special characters', () => {
            createTestSkill('skill-with-dashes');
            createTestSkill('skill_with_underscores');
            const result = (0, test_utils_js_1.runCli)(['remove', 'skill-with-dashes', '-y'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('Successfully removed');
            (0, vitest_1.expect)((0, fs_1.existsSync)((0, path_1.join)(skillsDir, 'skill-with-dashes'))).toBe(false);
            (0, vitest_1.expect)((0, fs_1.existsSync)((0, path_1.join)(skillsDir, 'skill_with_underscores'))).toBe(true);
        });
        (0, vitest_1.it)('should handle removing last remaining skill', () => {
            createTestSkill('last-skill');
            const result = (0, test_utils_js_1.runCli)(['remove', 'last-skill', '-y'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('Successfully removed');
            (0, vitest_1.expect)(result.stdout).toContain('1 skill');
            // Directory should be empty or removed
            const remaining = (0, fs_1.readdirSync)(skillsDir);
            (0, vitest_1.expect)(remaining.length).toBe(0);
        });
        (0, vitest_1.it)('should handle directory without SKILL.md file', () => {
            // Create a directory without SKILL.md
            const invalidSkillDir = (0, path_1.join)(skillsDir, 'invalid-skill');
            (0, fs_1.mkdirSync)(invalidSkillDir, { recursive: true });
            (0, fs_1.writeFileSync)((0, path_1.join)(invalidSkillDir, 'README.md'), 'Just a readme');
            createTestSkill('valid-skill');
            const result = (0, test_utils_js_1.runCli)(['remove', 'valid-skill', '-y'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('Successfully removed');
            // Invalid directory should still be removed
            (0, vitest_1.expect)((0, fs_1.existsSync)((0, path_1.join)(skillsDir, 'invalid-skill'))).toBe(true);
        });
    });
    (0, vitest_1.describe)('help and info', () => {
        (0, vitest_1.it)('should show help with --help', () => {
            const result = (0, test_utils_js_1.runCli)(['remove', '--help'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('Usage');
            (0, vitest_1.expect)(result.stdout).toContain('remove');
            (0, vitest_1.expect)(result.stdout).toContain('--global');
            (0, vitest_1.expect)(result.stdout).toContain('--agent');
            (0, vitest_1.expect)(result.stdout).toContain('--yes');
            (0, vitest_1.expect)(result.exitCode).toBe(0);
        });
        (0, vitest_1.it)('should show help with -h', () => {
            const result = (0, test_utils_js_1.runCli)(['remove', '-h'], testDir);
            (0, vitest_1.expect)(result.stdout).toContain('Usage');
            (0, vitest_1.expect)(result.exitCode).toBe(0);
        });
    });
    (0, vitest_1.describe)('option parsing', () => {
        (0, vitest_1.beforeEach)(() => {
            createTestSkill('parse-test-skill');
        });
        (0, vitest_1.it)('should parse -g as global', () => {
            const result = (0, test_utils_js_1.runCli)(['remove', 'parse-test-skill', '-g', '-y'], testDir);
            (0, vitest_1.expect)(result.stdout).not.toContain('error');
            (0, vitest_1.expect)(result.stdout).not.toContain('unrecognized');
        });
        (0, vitest_1.it)('should parse --yes flag', () => {
            const result = (0, test_utils_js_1.runCli)(['remove', 'parse-test-skill', '--yes'], testDir);
            (0, vitest_1.expect)(result.exitCode).toBe(0);
        });
        (0, vitest_1.it)('should parse -a as agent', () => {
            const result = (0, test_utils_js_1.runCli)(['remove', 'parse-test-skill', '-a', 'claude-code', '-y'], testDir);
            (0, vitest_1.expect)(result.stdout).not.toContain('Invalid agents');
        });
        (0, vitest_1.it)('should handle multiple values for --agent', () => {
            const result = (0, test_utils_js_1.runCli)(['remove', 'parse-test-skill', '--agent', 'claude-code', 'cursor', '-y'], testDir);
            (0, vitest_1.expect)(result.stdout).not.toContain('Invalid agents');
        });
    });
});
//# sourceMappingURL=remove.test.js.map