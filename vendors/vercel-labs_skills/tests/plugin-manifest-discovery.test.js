"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Tests for discovering skills declared in plugin manifests.
 */
const vitest_1 = require("vitest");
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const skills_ts_1 = require("../src/skills.ts");
(0, vitest_1.describe)('discoverSkills with plugin manifests', () => {
    let testDir;
    (0, vitest_1.beforeEach)(() => {
        testDir = (0, path_1.join)((0, os_1.tmpdir)(), `skills-manifest-test-${Date.now()}`);
        (0, fs_1.mkdirSync)(testDir, { recursive: true });
    });
    (0, vitest_1.afterEach)(() => {
        (0, fs_1.rmSync)(testDir, { recursive: true, force: true });
    });
    (0, vitest_1.it)('should discover skills from marketplace.json', async () => {
        // Create marketplace.json
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, '.claude-plugin'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, '.claude-plugin/marketplace.json'), JSON.stringify({
            name: 'test-marketplace',
            owner: { name: 'Test' },
            plugins: [
                {
                    name: 'test-plugin',
                    source: './plugins/test-plugin',
                    skills: ['./skills/test-skill'],
                },
            ],
        }));
        // Create the skill
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'plugins/test-plugin/skills/test-skill'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'plugins/test-plugin/skills/test-skill/SKILL.md'), `---
name: manifest-skill
description: Skill discovered via manifest
---
# Test
`);
        const skills = await (0, skills_ts_1.discoverSkills)(testDir);
        (0, vitest_1.expect)(skills).toHaveLength(1);
        (0, vitest_1.expect)(skills[0].name).toBe('manifest-skill');
    });
    (0, vitest_1.it)('should respect metadata.pluginRoot', async () => {
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, '.claude-plugin'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, '.claude-plugin/marketplace.json'), JSON.stringify({
            metadata: { pluginRoot: './plugins' },
            plugins: [
                {
                    name: 'my-plugin',
                    source: 'my-plugin', // Relative to pluginRoot
                    skills: ['./skills/my-skill'],
                },
            ],
        }));
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'plugins/my-plugin/skills/my-skill'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'plugins/my-plugin/skills/my-skill/SKILL.md'), `---
name: pluginroot-skill
description: Test
---
`);
        const skills = await (0, skills_ts_1.discoverSkills)(testDir);
        (0, vitest_1.expect)(skills).toHaveLength(1);
        (0, vitest_1.expect)(skills[0].name).toBe('pluginroot-skill');
    });
    (0, vitest_1.it)('should discover skills from plugin.json', async () => {
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, '.claude-plugin'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, '.claude-plugin/plugin.json'), JSON.stringify({
            name: 'single-plugin',
            skills: ['./skills/single-skill'],
        }));
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'skills/single-skill'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'skills/single-skill/SKILL.md'), `---
name: single-plugin-skill
description: Test
---
`);
        const skills = await (0, skills_ts_1.discoverSkills)(testDir);
        (0, vitest_1.expect)(skills).toHaveLength(1);
        (0, vitest_1.expect)(skills[0].name).toBe('single-plugin-skill');
    });
    (0, vitest_1.it)('should skip remote source objects', async () => {
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, '.claude-plugin'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, '.claude-plugin/marketplace.json'), JSON.stringify({
            plugins: [
                {
                    name: 'remote-plugin',
                    source: { source: 'github', repo: 'owner/repo' },
                    skills: ['./skills/remote-skill'],
                },
            ],
        }));
        const skills = await (0, skills_ts_1.discoverSkills)(testDir);
        (0, vitest_1.expect)(skills).toHaveLength(0);
    });
    (0, vitest_1.it)('should handle missing manifest gracefully', async () => {
        // No .claude-plugin directory
        const skills = await (0, skills_ts_1.discoverSkills)(testDir);
        (0, vitest_1.expect)(skills).toHaveLength(0);
    });
    (0, vitest_1.it)('should handle invalid JSON gracefully', async () => {
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, '.claude-plugin'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, '.claude-plugin/marketplace.json'), 'not valid json');
        const skills = await (0, skills_ts_1.discoverSkills)(testDir);
        (0, vitest_1.expect)(skills).toHaveLength(0);
    });
    (0, vitest_1.it)('should deduplicate skills found via manifest and priority dirs', async () => {
        // Skill in both manifest path AND standard skills/ directory
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, '.claude-plugin'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, '.claude-plugin/plugin.json'), JSON.stringify({ skills: ['./skills/dupe-skill'] }));
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'skills/dupe-skill'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'skills/dupe-skill/SKILL.md'), `---
name: dupe-skill
description: Test
---
`);
        const skills = await (0, skills_ts_1.discoverSkills)(testDir);
        (0, vitest_1.expect)(skills).toHaveLength(1);
    });
    (0, vitest_1.it)('should discover multiple skills from multiple plugins', async () => {
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, '.claude-plugin'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, '.claude-plugin/marketplace.json'), JSON.stringify({
            plugins: [
                {
                    name: 'plugin-a',
                    source: './plugin-a',
                    skills: ['./skills/skill-1', './skills/skill-2'],
                },
                {
                    name: 'plugin-b',
                    source: './plugin-b',
                    skills: ['./skills/skill-3'],
                },
            ],
        }));
        // Create skills for plugin-a
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'plugin-a/skills/skill-1'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'plugin-a/skills/skill-1/SKILL.md'), `---
name: skill-1
description: Test
---
`);
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'plugin-a/skills/skill-2'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'plugin-a/skills/skill-2/SKILL.md'), `---
name: skill-2
description: Test
---
`);
        // Create skill for plugin-b
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'plugin-b/skills/skill-3'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'plugin-b/skills/skill-3/SKILL.md'), `---
name: skill-3
description: Test
---
`);
        const skills = await (0, skills_ts_1.discoverSkills)(testDir);
        (0, vitest_1.expect)(skills).toHaveLength(3);
        const names = skills.map((s) => s.name).sort();
        (0, vitest_1.expect)(names).toEqual(['skill-1', 'skill-2', 'skill-3']);
    });
    (0, vitest_1.it)('should handle plugin without source (root-level plugin)', async () => {
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, '.claude-plugin'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, '.claude-plugin/marketplace.json'), JSON.stringify({
            plugins: [
                {
                    name: 'root-plugin',
                    // No source - plugin is at root
                    skills: ['./skills/root-skill'],
                },
            ],
        }));
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'skills/root-skill'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'skills/root-skill/SKILL.md'), `---
name: root-skill
description: Test
---
`);
        const skills = await (0, skills_ts_1.discoverSkills)(testDir);
        (0, vitest_1.expect)(skills).toHaveLength(1);
        (0, vitest_1.expect)(skills[0].name).toBe('root-skill');
    });
    (0, vitest_1.it)('should discover skills from adjacent skills/ when plugin.json has no skills array', async () => {
        // plugin.json exists but doesn't declare skills
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, '.claude-plugin'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, '.claude-plugin/plugin.json'), JSON.stringify({
            name: 'plugin-without-skills-field',
            description: 'A plugin that does not declare skills explicitly',
        }));
        // Skills exist in conventional location
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'skills/undeclared-skill'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'skills/undeclared-skill/SKILL.md'), `---
name: undeclared-skill
description: Discovered from conventional skills/ directory
---
`);
        const skills = await (0, skills_ts_1.discoverSkills)(testDir);
        (0, vitest_1.expect)(skills).toHaveLength(1);
        (0, vitest_1.expect)(skills[0].name).toBe('undeclared-skill');
    });
    (0, vitest_1.it)('should discover skills from adjacent skills/ when plugin.json has empty skills array', async () => {
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, '.claude-plugin'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, '.claude-plugin/plugin.json'), JSON.stringify({
            name: 'plugin-with-empty-skills',
            skills: [], // Empty array
        }));
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'skills/empty-array-skill'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'skills/empty-array-skill/SKILL.md'), `---
name: empty-array-skill
description: Test
---
`);
        const skills = await (0, skills_ts_1.discoverSkills)(testDir);
        (0, vitest_1.expect)(skills).toHaveLength(1);
        (0, vitest_1.expect)(skills[0].name).toBe('empty-array-skill');
    });
    (0, vitest_1.it)('should discover skills from marketplace plugin without skills array', async () => {
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, '.claude-plugin'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, '.claude-plugin/marketplace.json'), JSON.stringify({
            plugins: [
                {
                    name: 'plugin-no-skills-field',
                    source: './my-plugin',
                    // No skills field - should discover from my-plugin/skills/
                },
            ],
        }));
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'my-plugin/skills/auto-discovered'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'my-plugin/skills/auto-discovered/SKILL.md'), `---
name: auto-discovered
description: Found via conventional skills/ in plugin
---
`);
        const skills = await (0, skills_ts_1.discoverSkills)(testDir);
        (0, vitest_1.expect)(skills).toHaveLength(1);
        (0, vitest_1.expect)(skills[0].name).toBe('auto-discovered');
    });
    (0, vitest_1.it)('should discover both explicit and conventional skills from same plugin', async () => {
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, '.claude-plugin'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, '.claude-plugin/marketplace.json'), JSON.stringify({
            plugins: [
                {
                    name: 'mixed-plugin',
                    source: './mixed',
                    skills: ['./custom-skills/explicit-skill'], // Explicit path
                },
            ],
        }));
        // Explicit skill in custom location
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'mixed/custom-skills/explicit-skill'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'mixed/custom-skills/explicit-skill/SKILL.md'), `---
name: explicit-skill
description: Explicitly declared
---
`);
        // Conventional skill in skills/
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'mixed/skills/conventional-skill'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'mixed/skills/conventional-skill/SKILL.md'), `---
name: conventional-skill
description: Found via convention
---
`);
        const skills = await (0, skills_ts_1.discoverSkills)(testDir);
        (0, vitest_1.expect)(skills).toHaveLength(2);
        const names = skills.map((s) => s.name).sort();
        (0, vitest_1.expect)(names).toEqual(['conventional-skill', 'explicit-skill']);
    });
    (0, vitest_1.it)('should reject paths that traverse outside basePath', async () => {
        // Create marketplace.json with malicious traversal paths
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, '.claude-plugin'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, '.claude-plugin/marketplace.json'), JSON.stringify({
            plugins: [
                { source: '../../../etc', skills: ['./passwd'] }, // Traversal via source
                { source: 'legit', skills: ['../../../outside/skill'] }, // Traversal via skill path
            ],
        }));
        // Create a legit plugin with a valid skill to ensure discovery still works
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'legit/skills/valid-skill'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'legit/skills/valid-skill/SKILL.md'), `---
name: valid-skill
description: A valid skill inside basePath
---
`);
        // Create a skill outside testDir that should NOT be discovered
        const outsideDir = (0, path_1.join)(testDir, '..', `outside-${Date.now()}`);
        (0, fs_1.mkdirSync)((0, path_1.join)(outsideDir, 'skill'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(outsideDir, 'skill/SKILL.md'), `---
name: outside-skill
description: Should not be discovered
---
`);
        try {
            const skills = await (0, skills_ts_1.discoverSkills)(testDir);
            // Should only find the valid skill, not the traversal attempts
            (0, vitest_1.expect)(skills).toHaveLength(1);
            (0, vitest_1.expect)(skills[0].name).toBe('valid-skill');
        }
        finally {
            // Clean up outside directory
            (0, fs_1.rmSync)(outsideDir, { recursive: true, force: true });
        }
    });
    (0, vitest_1.it)('should reject absolute paths in manifests', async () => {
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, '.claude-plugin'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, '.claude-plugin/plugin.json'), JSON.stringify({
            skills: ['/etc/passwd', '/tmp/malicious-skill'],
        }));
        // Create a valid skill via convention
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'skills/safe-skill'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'skills/safe-skill/SKILL.md'), `---
name: safe-skill
description: Safe skill in conventional location
---
`);
        const skills = await (0, skills_ts_1.discoverSkills)(testDir);
        // Should only find the conventional skill
        (0, vitest_1.expect)(skills).toHaveLength(1);
        (0, vitest_1.expect)(skills[0].name).toBe('safe-skill');
    });
    (0, vitest_1.it)('should reject paths without ./ prefix (per Claude Code convention)', async () => {
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, '.claude-plugin'), { recursive: true });
        // Paths without './' prefix should be rejected
        // Use a non-standard directory that WON'T be found by fallback search
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, '.claude-plugin/marketplace.json'), JSON.stringify({
            metadata: { pluginRoot: 'custom-plugins' }, // Missing './' prefix - INVALID
            plugins: [{ source: './my-plugin', skills: ['./custom-skills/my-skill'] }],
        }));
        // Create the plugin in a non-standard location only reachable via manifest
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'custom-plugins/my-plugin/custom-skills/my-skill'), {
            recursive: true,
        });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'custom-plugins/my-plugin/custom-skills/my-skill/SKILL.md'), `---
name: unreachable-skill
description: Should not be found - pluginRoot lacks ./
---
`);
        // Also create a skill in standard location to prevent fallback deep search
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'skills/standard-skill'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'skills/standard-skill/SKILL.md'), `---
name: standard-skill
description: Found via standard location
---
`);
        const skills = await (0, skills_ts_1.discoverSkills)(testDir);
        // Only the standard skill should be found, not the one behind invalid pluginRoot
        (0, vitest_1.expect)(skills).toHaveLength(1);
        (0, vitest_1.expect)(skills[0].name).toBe('standard-skill');
    });
    (0, vitest_1.it)('should reject plugin sources without ./ prefix', async () => {
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, '.claude-plugin'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, '.claude-plugin/marketplace.json'), JSON.stringify({
            plugins: [
                { source: 'bare-plugin', skills: ['./skills/skill1'] }, // Invalid - no './'
                { source: './valid-plugin', skills: ['./skills/skill2'] }, // Valid
            ],
        }));
        // Create both plugins
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'bare-plugin/skills/skill1'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'bare-plugin/skills/skill1/SKILL.md'), `---
name: bare-skill
description: Should not be found
---
`);
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'valid-plugin/skills/skill2'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'valid-plugin/skills/skill2/SKILL.md'), `---
name: valid-skill
description: Should be found
---
`);
        const skills = await (0, skills_ts_1.discoverSkills)(testDir);
        (0, vitest_1.expect)(skills).toHaveLength(1);
        (0, vitest_1.expect)(skills[0].name).toBe('valid-skill');
    });
    (0, vitest_1.it)('should reject skill paths without ./ prefix', async () => {
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, '.claude-plugin'), { recursive: true });
        // Use SEPARATE non-standard directories to isolate the test
        // (parent dir scanning would find siblings if in same parent)
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, '.claude-plugin/plugin.json'), JSON.stringify({
            skills: ['invalid-loc/bare-skill', './valid-loc/valid-skill'], // First lacks ./
        }));
        // Skill with invalid path (no ./) - in its own directory tree
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'invalid-loc/bare-skill'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'invalid-loc/bare-skill/SKILL.md'), `---
name: bare-skill
description: Should not be found - path lacks ./
---
`);
        // Skill with valid path - in separate directory tree
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'valid-loc/valid-skill'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'valid-loc/valid-skill/SKILL.md'), `---
name: valid-skill
description: Should be found - path has ./
---
`);
        // Add a skill in standard location to prevent fallback search
        (0, fs_1.mkdirSync)((0, path_1.join)(testDir, 'skills/standard'), { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(testDir, 'skills/standard/SKILL.md'), `---
name: standard-skill
description: Standard location
---
`);
        const skills = await (0, skills_ts_1.discoverSkills)(testDir);
        const names = skills.map((s) => s.name).sort();
        // Should find: valid-skill (via valid manifest path) and standard-skill (via convention)
        // Should NOT find: bare-skill (manifest path lacks ./)
        (0, vitest_1.expect)(names).toEqual(['standard-skill', 'valid-skill']);
    });
});
//# sourceMappingURL=plugin-manifest-discovery.test.js.map