"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const node_child_process_1 = require("node:child_process");
const node_path_1 = require("node:path");
const rootDir = (0, node_path_1.join)(import.meta.dirname, '..');
(0, vitest_1.describe)('dist build', () => {
    (0, vitest_1.it)('builds and runs without errors', { timeout: 30000 }, () => {
        // Build the project
        (0, node_child_process_1.execSync)('pnpm build', { cwd: rootDir, stdio: 'pipe' });
        // Run the CLI - should exit cleanly with help output
        const result = (0, node_child_process_1.execSync)('node dist/cli.mjs --help', {
            cwd: rootDir,
            stdio: 'pipe',
            encoding: 'utf-8',
        });
        (0, vitest_1.expect)(result).toContain('skills');
    });
});
//# sourceMappingURL=dist.test.js.map