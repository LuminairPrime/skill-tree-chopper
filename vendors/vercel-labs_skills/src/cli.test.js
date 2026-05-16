"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fs_1 = require("fs");
const path_1 = require("path");
const test_utils_ts_1 = require("./test-utils.ts");
(0, vitest_1.describe)('skills CLI', () => {
    (0, vitest_1.describe)('--help', () => {
        (0, vitest_1.it)('should display help message', () => {
            const output = (0, test_utils_ts_1.runCliOutput)(['--help']);
            (0, vitest_1.expect)(output).toContain('Usage: skills <command> [options]');
            (0, vitest_1.expect)(output).toContain('Manage Skills:');
            (0, vitest_1.expect)(output).toContain('init [name]');
            (0, vitest_1.expect)(output).toContain('add <package>');
            (0, vitest_1.expect)(output).toContain('update');
            (0, vitest_1.expect)(output).toContain('Add Options:');
            (0, vitest_1.expect)(output).toContain('-g, --global');
            (0, vitest_1.expect)(output).toContain('-a, --agent');
            (0, vitest_1.expect)(output).toContain('-s, --skill');
            (0, vitest_1.expect)(output).toContain('-l, --list');
            (0, vitest_1.expect)(output).toContain('-y, --yes');
            (0, vitest_1.expect)(output).toContain('--all');
        });
        (0, vitest_1.it)('should show same output for -h alias', () => {
            const helpOutput = (0, test_utils_ts_1.runCliOutput)(['--help']);
            const hOutput = (0, test_utils_ts_1.runCliOutput)(['-h']);
            (0, vitest_1.expect)(hOutput).toBe(helpOutput);
        });
    });
    (0, vitest_1.describe)('--version', () => {
        (0, vitest_1.it)('should display version number', () => {
            const output = (0, test_utils_ts_1.runCliOutput)(['--version']);
            (0, vitest_1.expect)(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
        });
        (0, vitest_1.it)('should match package.json version', () => {
            const output = (0, test_utils_ts_1.runCliOutput)(['--version']);
            const pkg = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(import.meta.dirname, '..', 'package.json'), 'utf-8'));
            (0, vitest_1.expect)(output.trim()).toBe(pkg.version);
        });
    });
    (0, vitest_1.describe)('no arguments', () => {
        (0, vitest_1.it)('should display banner', () => {
            const output = (0, test_utils_ts_1.stripLogo)((0, test_utils_ts_1.runCliOutput)([]));
            (0, vitest_1.expect)(output).toContain('The open agent skills ecosystem');
            (0, vitest_1.expect)(output).toContain('npx skills add');
            (0, vitest_1.expect)(output).toContain('npx skills update');
            (0, vitest_1.expect)(output).toContain('npx skills init');
            (0, vitest_1.expect)(output).toContain('skills.sh');
        });
    });
    (0, vitest_1.describe)('unknown command', () => {
        (0, vitest_1.it)('should show error for unknown command', () => {
            const output = (0, test_utils_ts_1.runCliOutput)(['unknown-command']);
            (0, vitest_1.expect)(output).toMatchInlineSnapshot(`
        "Unknown command: unknown-command
        Run skills --help for usage.
        "
      `);
        });
    });
    (0, vitest_1.describe)('logo display', () => {
        (0, vitest_1.it)('should not display logo for list command', () => {
            const output = (0, test_utils_ts_1.runCliOutput)(['list']);
            (0, vitest_1.expect)((0, test_utils_ts_1.hasLogo)(output)).toBe(false);
        });
        (0, vitest_1.it)('should not display logo for check command', () => {
            // Note: check command makes GitHub API calls, so we just verify initial output
            const output = (0, test_utils_ts_1.runCliOutput)(['check']);
            (0, vitest_1.expect)((0, test_utils_ts_1.hasLogo)(output)).toBe(false);
        }, 60000);
        (0, vitest_1.it)('should not display logo for update command', () => {
            // Note: update command makes GitHub API calls, so we just verify initial output
            const output = (0, test_utils_ts_1.runCliOutput)(['update']);
            (0, vitest_1.expect)((0, test_utils_ts_1.hasLogo)(output)).toBe(false);
        }, 60000);
    });
});
//# sourceMappingURL=cli.test.js.map