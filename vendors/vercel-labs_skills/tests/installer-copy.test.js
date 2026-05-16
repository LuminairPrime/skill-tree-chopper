"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const node_os_1 = require("node:os");
const installer_ts_1 = require("../src/installer.ts");
async function makeSkillSource(root, name) {
    const dir = (0, node_path_1.join)(root, 'source-skill');
    await (0, promises_1.mkdir)(dir, { recursive: true });
    await (0, promises_1.writeFile)((0, node_path_1.join)(dir, 'SKILL.md'), `---\nname: ${name}\ndescription: test\n---\n`, 'utf-8');
    return dir;
}
(0, vitest_1.describe)('installer copy mode', () => {
    (0, vitest_1.it)('preserves dotfiles while keeping explicit exclusions', async () => {
        const root = await (0, promises_1.mkdtemp)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'add-skill-copy-'));
        const projectDir = (0, node_path_1.join)(root, 'project');
        await (0, promises_1.mkdir)(projectDir, { recursive: true });
        const skillName = 'copy-dotfile-skill';
        const skillDir = await makeSkillSource(root, skillName);
        await (0, promises_1.writeFile)((0, node_path_1.join)(skillDir, '.prettierrc'), '{ "singleQuote": true }\n', 'utf-8');
        await (0, promises_1.writeFile)((0, node_path_1.join)(skillDir, 'metadata.json'), '{"private":true}\n', 'utf-8');
        await (0, promises_1.mkdir)((0, node_path_1.join)(skillDir, '.git'), { recursive: true });
        await (0, promises_1.writeFile)((0, node_path_1.join)(skillDir, '.git', 'config'), '[core]\n', 'utf-8');
        try {
            const result = await (0, installer_ts_1.installSkillForAgent)({ name: skillName, description: 'test', path: skillDir }, 'codex', { cwd: projectDir, mode: 'copy', global: false });
            (0, vitest_1.expect)(result.success).toBe(true);
            const installedDir = (0, node_path_1.join)(projectDir, '.agents/skills', skillName);
            await (0, vitest_1.expect)((0, promises_1.readFile)((0, node_path_1.join)(installedDir, '.prettierrc'), 'utf-8')).resolves.toBe('{ "singleQuote": true }\n');
            await (0, vitest_1.expect)((0, promises_1.access)((0, node_path_1.join)(installedDir, 'metadata.json'))).rejects.toThrow();
            await (0, vitest_1.expect)((0, promises_1.access)((0, node_path_1.join)(installedDir, '.git'))).rejects.toThrow();
        }
        finally {
            await (0, promises_1.rm)(root, { recursive: true, force: true });
        }
    });
});
//# sourceMappingURL=installer-copy.test.js.map