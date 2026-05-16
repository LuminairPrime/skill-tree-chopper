"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const node_os_1 = require("node:os");
const remove_ts_1 = require("../src/remove.ts");
const agentsModule = require("../src/agents.ts");
// Mock detectInstalledAgents
vitest_1.vi.mock('../src/agents.ts', async () => {
    const actual = await vitest_1.vi.importActual('../src/agents.ts');
    return {
        ...actual,
        detectInstalledAgents: vitest_1.vi.fn(),
    };
});
(0, vitest_1.describe)('removeCommand canonical protection', () => {
    let tempDir;
    let oldCwd;
    (0, vitest_1.beforeEach)(async () => {
        tempDir = await (0, node_path_1.resolve)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'skills-remove-test-' + Date.now()));
        await (0, promises_1.mkdir)(tempDir, { recursive: true });
        oldCwd = process.cwd();
        process.chdir(tempDir);
        // Mock/Setup agent directories
        // We need to simulate the structure that getInstallPath and getCanonicalPath expect
        // Default skills dir is .agents/skills
        await (0, promises_1.mkdir)((0, node_path_1.join)(tempDir, '.agents/skills'), { recursive: true });
        // Setup two agents that use different dirs
        // Claude uses .claude/skills
        await (0, promises_1.mkdir)((0, node_path_1.join)(tempDir, '.claude/skills'), { recursive: true });
        // Continue uses .continue/skills
        await (0, promises_1.mkdir)((0, node_path_1.join)(tempDir, '.continue/skills'), { recursive: true });
    });
    (0, vitest_1.afterEach)(async () => {
        process.chdir(oldCwd);
        await (0, promises_1.rm)(tempDir, { recursive: true, force: true });
    });
    (0, vitest_1.it)('should NOT remove canonical storage if other agents still have the skill installed', async () => {
        const skillName = 'test-skill';
        const canonicalPath = (0, node_path_1.join)(tempDir, '.agents/skills', skillName);
        const claudePath = (0, node_path_1.join)(tempDir, '.claude/skills', skillName);
        const continuePath = (0, node_path_1.join)(tempDir, '.continue/skills', skillName);
        // 1. Create canonical storage
        await (0, promises_1.mkdir)(canonicalPath, { recursive: true });
        await (0, promises_1.writeFile)((0, node_path_1.join)(canonicalPath, 'SKILL.md'), '# Test');
        // 2. Install (symlink) to Claude and Continue
        await (0, promises_1.symlink)(canonicalPath, claudePath, 'junction');
        await (0, promises_1.symlink)(canonicalPath, continuePath, 'junction');
        // Verify setup
        (0, vitest_1.expect)((await (0, promises_1.lstat)(claudePath)).isSymbolicLink() || (await (0, promises_1.lstat)(claudePath)).isDirectory()).toBe(true);
        (0, vitest_1.expect)((await (0, promises_1.lstat)(continuePath)).isSymbolicLink() || (await (0, promises_1.lstat)(continuePath)).isDirectory()).toBe(true);
        // Mock agents: Claude and Continue are installed
        vitest_1.vi.mocked(agentsModule.detectInstalledAgents).mockResolvedValue(['claude-code', 'continue']);
        // 3. Remove from Claude only
        // -a claude-code
        await (0, remove_ts_1.removeCommand)([skillName], { agent: ['claude-code'], yes: true });
        // 4. Verify results
        // Claude path should be gone
        await (0, vitest_1.expect)((0, promises_1.lstat)(claudePath)).rejects.toThrow();
        // Canonical path SHOULD STILL EXIST because Continue uses it
        (0, vitest_1.expect)((await (0, promises_1.lstat)(canonicalPath)).isDirectory()).toBe(true);
        // Continue path should still be valid
        (0, vitest_1.expect)((await (0, promises_1.lstat)(continuePath)).isSymbolicLink() || (await (0, promises_1.lstat)(continuePath)).isDirectory()).toBe(true);
    });
    (0, vitest_1.it)('should remove canonical storage if NO other agents are using it', async () => {
        const skillName = 'test-skill-2';
        const canonicalPath = (0, node_path_1.join)(tempDir, '.agents/skills', skillName);
        const claudePath = (0, node_path_1.join)(tempDir, '.claude/skills', skillName);
        await (0, promises_1.mkdir)(canonicalPath, { recursive: true });
        await (0, promises_1.writeFile)((0, node_path_1.join)(canonicalPath, 'SKILL.md'), '# Test');
        await (0, promises_1.symlink)(canonicalPath, claudePath, 'junction');
        // Mock agents: Only Claude is installed
        vitest_1.vi.mocked(agentsModule.detectInstalledAgents).mockResolvedValue(['claude-code']);
        // Remove from Claude
        await (0, remove_ts_1.removeCommand)([skillName], { agent: ['claude-code'], yes: true });
        // Both should be gone
        await (0, vitest_1.expect)((0, promises_1.lstat)(claudePath)).rejects.toThrow();
        await (0, vitest_1.expect)((0, promises_1.lstat)(canonicalPath)).rejects.toThrow();
    });
});
//# sourceMappingURL=remove-canonical.test.js.map