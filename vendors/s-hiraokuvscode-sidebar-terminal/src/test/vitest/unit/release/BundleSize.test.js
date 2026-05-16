"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const repoRoot = process.cwd();
const distDir = node_path_1.default.join(repoRoot, 'dist');
const oneMiB = 1024 * 1024;
const getDistPath = (fileName) => node_path_1.default.join(distDir, fileName);
const hasBuiltBundle = node_fs_1.default.existsSync(getDistPath('webview.js'));
const describeIfBuilt = hasBuiltBundle ? vitest_1.describe : vitest_1.describe.skip;
const expectDistFile = (fileName) => {
    const artifactPath = getDistPath(fileName);
    (0, vitest_1.expect)(node_fs_1.default.existsSync(artifactPath), `${fileName} should exist`).toBe(true);
    const stats = node_fs_1.default.statSync(artifactPath);
    (0, vitest_1.expect)(stats.isFile(), `${fileName} should be emitted as a file`).toBe(true);
    return stats;
};
describeIfBuilt('webview release bundle artifacts', () => {
    (0, vitest_1.it)('keeps the main webview entry bundle at or below 1 MiB', () => {
        const webviewBundleStats = expectDistFile('webview.js');
        (0, vitest_1.expect)(webviewBundleStats.size).toBeLessThanOrEqual(oneMiB);
    });
    (0, vitest_1.it)('does not ship the obsolete webview-simple build artifact', () => {
        (0, vitest_1.expect)(node_fs_1.default.existsSync(getDistPath('webview-simple.js'))).toBe(false);
        (0, vitest_1.expect)(node_fs_1.default.existsSync(getDistPath('webview-simple.js.map'))).toBe(false);
    });
    (0, vitest_1.it)('ships all split chunks injected by WebViewHtmlGenerationService', () => {
        for (const chunk of [
            'vendors.js',
            'xterm-vendor.js',
            'webview-services.js',
            'webview-managers.js',
        ]) {
            expectDistFile(chunk);
        }
    });
});
//# sourceMappingURL=BundleSize.test.js.map