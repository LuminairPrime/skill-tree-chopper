"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const os_1 = require("os");
const installer_ts_1 = require("../src/installer.ts");
const agentsModule = require("../src/agents.ts");
(0, vitest_1.describe)('listInstalledSkills', () => {
    let testDir;
    (0, vitest_1.beforeEach)(async () => {
        testDir = (0, path_1.join)((0, os_1.tmpdir)(), `add-skill-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
        await (0, promises_1.mkdir)(testDir, { recursive: true });
    });
    (0, vitest_1.afterEach)(async () => {
        await (0, promises_1.rm)(testDir, { recursive: true, force: true });
    });
    // Helper to create a skill directory with SKILL.md
    async function createSkillDir(basePath, skillName, skillData) {
        const skillDir = (0, path_1.join)(basePath, '.agents', 'skills', skillName);
        await (0, promises_1.mkdir)(skillDir, { recursive: true });
        const skillMdContent = `---
name: ${skillData.name}
description: ${skillData.description}
---

# ${skillData.name}

${skillData.description}
`;
        await (0, promises_1.writeFile)((0, path_1.join)(skillDir, 'SKILL.md'), skillMdContent);
        return skillDir;
    }
    (0, vitest_1.it)('should return empty array for empty directory', async () => {
        const skills = await (0, installer_ts_1.listInstalledSkills)({ global: false, cwd: testDir });
        (0, vitest_1.expect)(skills).toEqual([]);
    });
    (0, vitest_1.it)('should find single skill in project directory', async () => {
        await createSkillDir(testDir, 'test-skill', {
            name: 'test-skill',
            description: 'A test skill',
        });
        const skills = await (0, installer_ts_1.listInstalledSkills)({ global: false, cwd: testDir });
        (0, vitest_1.expect)(skills).toHaveLength(1);
        (0, vitest_1.expect)(skills[0].name).toBe('test-skill');
        (0, vitest_1.expect)(skills[0].description).toBe('A test skill');
        (0, vitest_1.expect)(skills[0].scope).toBe('project');
    });
    (0, vitest_1.it)('should find multiple skills', async () => {
        await createSkillDir(testDir, 'skill-1', {
            name: 'skill-1',
            description: 'First skill',
        });
        await createSkillDir(testDir, 'skill-2', {
            name: 'skill-2',
            description: 'Second skill',
        });
        const skills = await (0, installer_ts_1.listInstalledSkills)({ global: false, cwd: testDir });
        (0, vitest_1.expect)(skills).toHaveLength(2);
        const skillNames = skills.map((s) => s.name).sort();
        (0, vitest_1.expect)(skillNames).toEqual(['skill-1', 'skill-2']);
    });
    (0, vitest_1.it)('should ignore directories without SKILL.md', async () => {
        await createSkillDir(testDir, 'valid-skill', {
            name: 'valid-skill',
            description: 'Valid skill',
        });
        // Create a directory without SKILL.md
        const invalidDir = (0, path_1.join)(testDir, '.agents', 'skills', 'invalid-skill');
        await (0, promises_1.mkdir)(invalidDir, { recursive: true });
        await (0, promises_1.writeFile)((0, path_1.join)(invalidDir, 'other-file.txt'), 'content');
        const skills = await (0, installer_ts_1.listInstalledSkills)({ global: false, cwd: testDir });
        (0, vitest_1.expect)(skills).toHaveLength(1);
        (0, vitest_1.expect)(skills[0].name).toBe('valid-skill');
    });
    (0, vitest_1.it)('should handle invalid SKILL.md gracefully', async () => {
        await createSkillDir(testDir, 'valid-skill', {
            name: 'valid-skill',
            description: 'Valid skill',
        });
        // Create a directory with invalid SKILL.md (missing name/description)
        const invalidDir = (0, path_1.join)(testDir, '.agents', 'skills', 'invalid-skill');
        await (0, promises_1.mkdir)(invalidDir, { recursive: true });
        await (0, promises_1.writeFile)((0, path_1.join)(invalidDir, 'SKILL.md'), '# Invalid\nNo frontmatter');
        const skills = await (0, installer_ts_1.listInstalledSkills)({ global: false, cwd: testDir });
        (0, vitest_1.expect)(skills).toHaveLength(1);
        (0, vitest_1.expect)(skills[0].name).toBe('valid-skill');
    });
    (0, vitest_1.it)('should filter by scope - project only', async () => {
        await createSkillDir(testDir, 'project-skill', {
            name: 'project-skill',
            description: 'Project skill',
        });
        const skills = await (0, installer_ts_1.listInstalledSkills)({ global: false, cwd: testDir });
        (0, vitest_1.expect)(skills).toHaveLength(1);
        (0, vitest_1.expect)(skills[0].scope).toBe('project');
    });
    (0, vitest_1.it)('should handle global scope option', async () => {
        // Test with global: true - verifies the function doesn't crash
        // Note: This checks ~/.agents/skills, results depend on system state
        const skills = await (0, installer_ts_1.listInstalledSkills)({
            global: true,
            cwd: testDir,
        });
        (0, vitest_1.expect)(Array.isArray(skills)).toBe(true);
    });
    (0, vitest_1.it)('should apply agent filter', async () => {
        await createSkillDir(testDir, 'test-skill', {
            name: 'test-skill',
            description: 'Test skill',
        });
        // Filter by a specific agent (skill should still be returned)
        const skills = await (0, installer_ts_1.listInstalledSkills)({
            global: false,
            cwd: testDir,
            agentFilter: ['cursor'],
        });
        (0, vitest_1.expect)(skills).toHaveLength(1);
        (0, vitest_1.expect)(skills[0].name).toBe('test-skill');
    });
    // Issue #225 part 1: Only installed agents should be attributed
    (0, vitest_1.it)('should only attribute skills to installed agents (issue #225)', async () => {
        // Mock: only Amp is installed (not Kimi, even though they share .agents/skills)
        vitest_1.vi.spyOn(agentsModule, 'detectInstalledAgents').mockResolvedValue(['amp']);
        await createSkillDir(testDir, 'test-skill', {
            name: 'test-skill',
            description: 'Test skill',
        });
        const skills = await (0, installer_ts_1.listInstalledSkills)({ global: false, cwd: testDir });
        (0, vitest_1.expect)(skills).toHaveLength(1);
        // Should only show amp, not kimi-cli
        (0, vitest_1.expect)(skills[0].agents).toContain('amp');
        (0, vitest_1.expect)(skills[0].agents).not.toContain('kimi-cli');
        vitest_1.vi.restoreAllMocks();
    });
    // Directory symlinks pointing at a real skill dir should be discovered.
    (0, vitest_1.it)('should find skill when the skill directory is a symlink', async () => {
        const realSkillDir = (0, path_1.join)(testDir, 'shared', 'linked-skill');
        await (0, promises_1.mkdir)(realSkillDir, { recursive: true });
        await (0, promises_1.writeFile)((0, path_1.join)(realSkillDir, 'SKILL.md'), `---
name: linked-skill
description: Skill reached through a directory symlink
---

# linked-skill
`);
        const agentSkillsDir = (0, path_1.join)(testDir, '.agents', 'skills');
        await (0, promises_1.mkdir)(agentSkillsDir, { recursive: true });
        await (0, promises_1.symlink)(realSkillDir, (0, path_1.join)(agentSkillsDir, 'linked-skill'), 'dir');
        const skills = await (0, installer_ts_1.listInstalledSkills)({ global: false, cwd: testDir });
        (0, vitest_1.expect)(skills).toHaveLength(1);
        (0, vitest_1.expect)(skills[0].name).toBe('linked-skill');
    });
    (0, vitest_1.it)('should ignore dangling symlinks without a reachable SKILL.md', async () => {
        const agentSkillsDir = (0, path_1.join)(testDir, '.agents', 'skills');
        await (0, promises_1.mkdir)(agentSkillsDir, { recursive: true });
        await (0, promises_1.symlink)((0, path_1.join)(testDir, 'does-not-exist'), (0, path_1.join)(agentSkillsDir, 'broken'), 'dir');
        const skills = await (0, installer_ts_1.listInstalledSkills)({ global: false, cwd: testDir });
        (0, vitest_1.expect)(skills).toEqual([]);
    });
    (0, vitest_1.it)('should ignore symlinks that point to a regular file', async () => {
        const filePath = (0, path_1.join)(testDir, 'not-a-skill.md');
        await (0, promises_1.writeFile)(filePath, '# not a skill');
        const agentSkillsDir = (0, path_1.join)(testDir, '.agents', 'skills');
        await (0, promises_1.mkdir)(agentSkillsDir, { recursive: true });
        await (0, promises_1.symlink)(filePath, (0, path_1.join)(agentSkillsDir, 'file-link'));
        const skills = await (0, installer_ts_1.listInstalledSkills)({ global: false, cwd: testDir });
        (0, vitest_1.expect)(skills).toEqual([]);
    });
    // Issue #225 part 2: Skills in agent-specific directories should be found
    (0, vitest_1.it)('should find skills in agent-specific directories (issue #225)', async () => {
        vitest_1.vi.spyOn(agentsModule, 'detectInstalledAgents').mockResolvedValue(['cursor']);
        // Cursor now uses .agents/skills (universal directory)
        const cursorSkillDir = (0, path_1.join)(testDir, '.agents', 'skills', 'cursor-skill');
        await (0, promises_1.mkdir)(cursorSkillDir, { recursive: true });
        await (0, promises_1.writeFile)((0, path_1.join)(cursorSkillDir, 'SKILL.md'), `---
name: cursor-skill
description: A skill in cursor directory
---

# cursor-skill
`);
        const skills = await (0, installer_ts_1.listInstalledSkills)({ global: false, cwd: testDir });
        (0, vitest_1.expect)(skills).toHaveLength(1);
        (0, vitest_1.expect)(skills[0].name).toBe('cursor-skill');
        (0, vitest_1.expect)(skills[0].agents).toContain('cursor');
        vitest_1.vi.restoreAllMocks();
    });
});
//# sourceMappingURL=list-installed.test.js.map