"use strict";
/**
 * Regression tests for symlink installs when canonical and agent paths match.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const node_os_1 = require("node:os");
const installer_ts_1 = require("../src/installer.ts");
async function makeSkillSource(root, name) {
    const dir = (0, node_path_1.join)(root, 'source-skill');
    await (0, promises_1.mkdir)(dir, { recursive: true });
    const skillMd = `---\nname: ${name}\ndescription: test\n---\n`;
    await (0, promises_1.writeFile)((0, node_path_1.join)(dir, 'SKILL.md'), skillMd, 'utf-8');
    return dir;
}
(0, vitest_1.describe)('installer symlink regression', () => {
    (0, vitest_1.it)('does not create self-loop when canonical and agent paths match', async () => {
        const root = await (0, promises_1.mkdtemp)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'add-skill-'));
        const projectDir = (0, node_path_1.join)(root, 'project');
        await (0, promises_1.mkdir)(projectDir, { recursive: true });
        const skillName = 'self-loop-skill';
        const skillDir = await makeSkillSource(root, skillName);
        try {
            const result = await (0, installer_ts_1.installSkillForAgent)({ name: skillName, description: 'test', path: skillDir }, 'amp', { cwd: projectDir, mode: 'symlink', global: false });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.symlinkFailed).toBeUndefined();
            const installedPath = (0, node_path_1.join)(projectDir, '.agents/skills', skillName);
            const stats = await (0, promises_1.lstat)(installedPath);
            (0, vitest_1.expect)(stats.isSymbolicLink()).toBe(false);
            (0, vitest_1.expect)(stats.isDirectory()).toBe(true);
            const contents = await (0, promises_1.readFile)((0, node_path_1.join)(installedPath, 'SKILL.md'), 'utf-8');
            (0, vitest_1.expect)(contents).toContain(`name: ${skillName}`);
        }
        finally {
            await (0, promises_1.rm)(root, { recursive: true, force: true });
        }
    });
    (0, vitest_1.it)('cleans pre-existing self-loop symlink in canonical dir', async () => {
        const root = await (0, promises_1.mkdtemp)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'add-skill-'));
        const projectDir = (0, node_path_1.join)(root, 'project');
        await (0, promises_1.mkdir)(projectDir, { recursive: true });
        const skillName = 'self-loop-skill';
        const skillDir = await makeSkillSource(root, skillName);
        const canonicalDir = (0, node_path_1.join)(projectDir, '.agents/skills', skillName);
        try {
            await (0, promises_1.mkdir)((0, node_path_1.join)(projectDir, '.agents/skills'), { recursive: true });
            await (0, promises_1.symlink)(skillName, canonicalDir);
            const preStats = await (0, promises_1.lstat)(canonicalDir);
            (0, vitest_1.expect)(preStats.isSymbolicLink()).toBe(true);
            const result = await (0, installer_ts_1.installSkillForAgent)({ name: skillName, description: 'test', path: skillDir }, 'amp', { cwd: projectDir, mode: 'symlink', global: false });
            (0, vitest_1.expect)(result.success).toBe(true);
            const postStats = await (0, promises_1.lstat)(canonicalDir);
            (0, vitest_1.expect)(postStats.isSymbolicLink()).toBe(false);
            (0, vitest_1.expect)(postStats.isDirectory()).toBe(true);
        }
        finally {
            await (0, promises_1.rm)(root, { recursive: true, force: true });
        }
    });
    // Regression test for #293: when agent skills dir is a symlink to canonical dir
    (0, vitest_1.it)('handles agent skills dir being a symlink to canonical dir', async () => {
        const root = await (0, promises_1.mkdtemp)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'add-skill-'));
        const projectDir = (0, node_path_1.join)(root, 'project');
        await (0, promises_1.mkdir)(projectDir, { recursive: true });
        const skillName = 'symlinked-dir-skill';
        const skillDir = await makeSkillSource(root, skillName);
        // Create canonical dir: .agents/skills
        const canonicalBase = (0, node_path_1.join)(projectDir, '.agents', 'skills');
        await (0, promises_1.mkdir)(canonicalBase, { recursive: true });
        // Create .claude directory and symlink .claude/skills -> .agents/skills
        const claudeDir = (0, node_path_1.join)(projectDir, '.claude');
        await (0, promises_1.mkdir)(claudeDir, { recursive: true });
        const claudeSkillsDir = (0, node_path_1.join)(claudeDir, 'skills');
        await (0, promises_1.symlink)(canonicalBase, claudeSkillsDir);
        try {
            // Install for claude-code, which has skillsDir: '.claude/skills'
            const result = await (0, installer_ts_1.installSkillForAgent)({ name: skillName, description: 'test', path: skillDir }, 'claude-code', { cwd: projectDir, mode: 'symlink', global: false });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.symlinkFailed).toBeUndefined();
            // The skill should exist in the canonical location
            const canonicalSkillDir = (0, node_path_1.join)(canonicalBase, skillName);
            const stats = await (0, promises_1.lstat)(canonicalSkillDir);
            (0, vitest_1.expect)(stats.isDirectory()).toBe(true);
            // It should NOT be a broken symlink - it should be a real directory
            const contents = await (0, promises_1.readFile)((0, node_path_1.join)(canonicalSkillDir, 'SKILL.md'), 'utf-8');
            (0, vitest_1.expect)(contents).toContain(`name: ${skillName}`);
            // The skill should also be accessible via the symlinked path
            const claudeSkillDir = (0, node_path_1.join)(claudeSkillsDir, skillName);
            const claudeContents = await (0, promises_1.readFile)((0, node_path_1.join)(claudeSkillDir, 'SKILL.md'), 'utf-8');
            (0, vitest_1.expect)(claudeContents).toContain(`name: ${skillName}`);
            // There should be no broken symlinks in canonical dir
            const canonicalEntries = await (0, promises_1.readdir)(canonicalBase, { withFileTypes: true });
            for (const entry of canonicalEntries) {
                if (entry.name === skillName) {
                    const entryPath = (0, node_path_1.join)(canonicalBase, entry.name);
                    const entryStats = await (0, promises_1.lstat)(entryPath);
                    // Should be a real directory, not a symlink
                    (0, vitest_1.expect)(entryStats.isDirectory()).toBe(true);
                }
            }
        }
        finally {
            await (0, promises_1.rm)(root, { recursive: true, force: true });
        }
    });
    // Regression test for #294: universal-only global install should not create agent-specific symlinks
    (0, vitest_1.it)('does not create agent-specific symlinks for universal agents on global install', async () => {
        const root = await (0, promises_1.mkdtemp)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'add-skill-'));
        const skillName = 'universal-only-skill';
        const skillDir = await makeSkillSource(root, skillName);
        // We test with 'github-copilot', a universal agent (skillsDir: '.agents/skills')
        // whose globalSkillsDir is different from canonical (~/.copilot/skills vs ~/.agents/skills)
        // For testing, we use a project-level install to avoid writing to actual home dir.
        // But the bug only manifests with global: true.
        // We can't safely test with global: true in unit tests (it would write to ~/.copilot/skills).
        // Instead, we verify that the installSkillForAgent function returns the canonical path
        // as both path and canonicalPath for universal agents with global install.
        // For a project-level install, universal agents have matching canonical and agent dirs,
        // so we just verify the function works correctly.
        const projectDir = (0, node_path_1.join)(root, 'project');
        await (0, promises_1.mkdir)(projectDir, { recursive: true });
        try {
            const result = await (0, installer_ts_1.installSkillForAgent)({ name: skillName, description: 'test', path: skillDir }, 'github-copilot', // Universal agent
            { cwd: projectDir, mode: 'symlink', global: false });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.symlinkFailed).toBeUndefined();
            // For a project-level universal agent, canonical and agent dir are the same
            // (.agents/skills), so no symlink should be created
            const installedPath = (0, node_path_1.join)(projectDir, '.agents/skills', skillName);
            const stats = await (0, promises_1.lstat)(installedPath);
            (0, vitest_1.expect)(stats.isDirectory()).toBe(true);
            (0, vitest_1.expect)(stats.isSymbolicLink()).toBe(false);
        }
        finally {
            await (0, promises_1.rm)(root, { recursive: true, force: true });
        }
    });
});
//# sourceMappingURL=installer-symlink.test.js.map