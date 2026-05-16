"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const plugin_manifest_ts_1 = require("../src/plugin-manifest.ts");
const vitest_1 = require("vitest");
const promises_1 = require("fs/promises");
const TEST_DIR = (0, path_1.join)(process.cwd(), 'test-plugin-grouping');
(0, vitest_1.describe)('getPluginGroupings', () => {
    (0, vitest_1.beforeAll)(async () => {
        await (0, promises_1.mkdir)(TEST_DIR, { recursive: true });
        await (0, promises_1.mkdir)((0, path_1.join)(TEST_DIR, '.claude-plugin'), { recursive: true });
        const manifest = {
            plugins: [
                {
                    name: 'document-skills',
                    source: './',
                    skills: ['./skills/xlsx', './skills/docx'],
                },
                {
                    name: 'example-skills',
                    source: './',
                    skills: ['./skills/art'],
                },
            ],
        };
        await (0, promises_1.writeFile)((0, path_1.join)(TEST_DIR, '.claude-plugin/marketplace.json'), JSON.stringify(manifest));
    });
    (0, vitest_1.afterAll)(async () => {
        await (0, promises_1.rm)(TEST_DIR, { recursive: true, force: true });
    });
    (0, vitest_1.it)('should map skill paths to plugin names', async () => {
        const groupings = await (0, plugin_manifest_ts_1.getPluginGroupings)(TEST_DIR);
        const xlsxPath = (0, path_1.resolve)(TEST_DIR, 'skills/xlsx');
        const docxPath = (0, path_1.resolve)(TEST_DIR, 'skills/docx');
        const artPath = (0, path_1.resolve)(TEST_DIR, 'skills/art');
        (0, vitest_1.expect)(groupings.get(xlsxPath)).toBe('document-skills');
        (0, vitest_1.expect)(groupings.get(docxPath)).toBe('document-skills');
        (0, vitest_1.expect)(groupings.get(artPath)).toBe('example-skills');
    });
    (0, vitest_1.it)('should handle nested plugin sources', async () => {
        // Create nested structure
        const nestedDir = (0, path_1.join)(TEST_DIR, 'nested');
        await (0, promises_1.mkdir)(nestedDir, { recursive: true });
        await (0, promises_1.mkdir)((0, path_1.join)(nestedDir, '.claude-plugin'), { recursive: true });
        const manifest = {
            plugins: [
                {
                    name: 'nested-plugin',
                    source: './plugins/my-plugin',
                    skills: ['./skills/deep'],
                },
            ],
        };
        await (0, promises_1.writeFile)((0, path_1.join)(nestedDir, '.claude-plugin/marketplace.json'), JSON.stringify(manifest));
        const groupings = await (0, plugin_manifest_ts_1.getPluginGroupings)(nestedDir);
        // source: ./plugins/my-plugin, skill: ./skills/deep
        // path = nestedDir/plugins/my-plugin/skills/deep
        const expectedPath = (0, path_1.resolve)(nestedDir, 'plugins/my-plugin/skills/deep');
        (0, vitest_1.expect)(groupings.get(expectedPath)).toBe('nested-plugin');
    });
});
//# sourceMappingURL=plugin-grouping.test.js.map