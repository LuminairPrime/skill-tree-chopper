"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const VersionUtils_1 = require("../../../../utils/VersionUtils");
// Mock vscode module
vitest_1.vi.mock('vscode', () => ({
    extensions: {
        getExtension: vitest_1.vi.fn(),
    },
}));
const vscode = require("vscode");
(0, vitest_1.describe)('VersionUtils', () => {
    (0, vitest_1.beforeEach)(() => {
        // Clear cache before each test
        VersionUtils_1.VersionUtils.clearCache();
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.afterEach)(() => {
        VersionUtils_1.VersionUtils.clearCache();
    });
    (0, vitest_1.describe)('getExtensionVersion', () => {
        (0, vitest_1.it)('should return version from extension manifest', () => {
            vitest_1.vi.mocked(vscode.extensions.getExtension).mockReturnValue({
                packageJSON: { version: '1.2.3' },
            });
            const version = VersionUtils_1.VersionUtils.getExtensionVersion();
            (0, vitest_1.expect)(version).toBe('1.2.3');
        });
        (0, vitest_1.it)('should cache the version on subsequent calls', () => {
            vitest_1.vi.mocked(vscode.extensions.getExtension).mockReturnValue({
                packageJSON: { version: '1.2.3' },
            });
            VersionUtils_1.VersionUtils.getExtensionVersion();
            VersionUtils_1.VersionUtils.getExtensionVersion();
            VersionUtils_1.VersionUtils.getExtensionVersion();
            (0, vitest_1.expect)(vscode.extensions.getExtension).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should return cached version', () => {
            vitest_1.vi.mocked(vscode.extensions.getExtension).mockReturnValue({
                packageJSON: { version: '1.2.3' },
            });
            const version1 = VersionUtils_1.VersionUtils.getExtensionVersion();
            // Change the mock return value
            vitest_1.vi.mocked(vscode.extensions.getExtension).mockReturnValue({
                packageJSON: { version: '4.5.6' },
            });
            const version2 = VersionUtils_1.VersionUtils.getExtensionVersion();
            // Should still return cached version
            (0, vitest_1.expect)(version1).toBe('1.2.3');
            (0, vitest_1.expect)(version2).toBe('1.2.3');
        });
        (0, vitest_1.it)('should return Unknown when extension is not found', () => {
            vitest_1.vi.mocked(vscode.extensions.getExtension).mockReturnValue(undefined);
            const consoleSpy = vitest_1.vi.spyOn(console, 'warn').mockImplementation(() => { });
            const version = VersionUtils_1.VersionUtils.getExtensionVersion();
            (0, vitest_1.expect)(version).toBe('Unknown');
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith('[VersionUtils] Extension not found, returning fallback version');
            consoleSpy.mockRestore();
        });
        (0, vitest_1.it)('should return Unknown when packageJSON is undefined', () => {
            vitest_1.vi.mocked(vscode.extensions.getExtension).mockReturnValue({
                packageJSON: undefined,
            });
            vitest_1.vi.spyOn(console, 'warn').mockImplementation(() => { });
            const version = VersionUtils_1.VersionUtils.getExtensionVersion();
            (0, vitest_1.expect)(version).toBe('Unknown');
        });
        (0, vitest_1.it)('should return Unknown when version is undefined', () => {
            vitest_1.vi.mocked(vscode.extensions.getExtension).mockReturnValue({
                packageJSON: {},
            });
            vitest_1.vi.spyOn(console, 'warn').mockImplementation(() => { });
            const version = VersionUtils_1.VersionUtils.getExtensionVersion();
            (0, vitest_1.expect)(version).toBe('Unknown');
        });
        (0, vitest_1.it)('should return Unknown when getExtension throws an error', () => {
            vitest_1.vi.mocked(vscode.extensions.getExtension).mockImplementation(() => {
                throw new Error('Extension error');
            });
            const consoleSpy = vitest_1.vi.spyOn(console, 'error').mockImplementation(() => { });
            const version = VersionUtils_1.VersionUtils.getExtensionVersion();
            (0, vitest_1.expect)(version).toBe('Unknown');
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith('[VersionUtils] Error getting extension version:', vitest_1.expect.any(Error));
            consoleSpy.mockRestore();
        });
    });
    (0, vitest_1.describe)('getFormattedVersion', () => {
        (0, vitest_1.it)('should return version with v prefix', () => {
            vitest_1.vi.mocked(vscode.extensions.getExtension).mockReturnValue({
                packageJSON: { version: '1.2.3' },
            });
            const formattedVersion = VersionUtils_1.VersionUtils.getFormattedVersion();
            (0, vitest_1.expect)(formattedVersion).toBe('v1.2.3');
        });
        (0, vitest_1.it)('should return Unknown without v prefix when version is unknown', () => {
            vitest_1.vi.mocked(vscode.extensions.getExtension).mockReturnValue(undefined);
            vitest_1.vi.spyOn(console, 'warn').mockImplementation(() => { });
            const formattedVersion = VersionUtils_1.VersionUtils.getFormattedVersion();
            (0, vitest_1.expect)(formattedVersion).toBe('Unknown');
        });
    });
    (0, vitest_1.describe)('getExtensionDisplayInfo', () => {
        (0, vitest_1.it)('should return display name and version', () => {
            vitest_1.vi.mocked(vscode.extensions.getExtension).mockReturnValue({
                packageJSON: {
                    displayName: 'My Extension',
                    version: '1.2.3',
                },
            });
            const displayInfo = VersionUtils_1.VersionUtils.getExtensionDisplayInfo();
            (0, vitest_1.expect)(displayInfo).toBe('My Extension v1.2.3');
        });
        (0, vitest_1.it)('should use Secondary Terminal as default display name', () => {
            vitest_1.vi.mocked(vscode.extensions.getExtension).mockReturnValue({
                packageJSON: {
                    version: '1.2.3',
                },
            });
            const displayInfo = VersionUtils_1.VersionUtils.getExtensionDisplayInfo();
            (0, vitest_1.expect)(displayInfo).toBe('Secondary Terminal v1.2.3');
        });
        (0, vitest_1.it)('should return fallback when extension is not found', () => {
            vitest_1.vi.mocked(vscode.extensions.getExtension).mockReturnValue(undefined);
            vitest_1.vi.spyOn(console, 'warn').mockImplementation(() => { });
            const displayInfo = VersionUtils_1.VersionUtils.getExtensionDisplayInfo();
            (0, vitest_1.expect)(displayInfo).toBe('Secondary Terminal Unknown');
        });
        (0, vitest_1.it)('should return error fallback when getExtension throws', () => {
            vitest_1.vi.mocked(vscode.extensions.getExtension).mockImplementation(() => {
                throw new Error('Extension error');
            });
            const consoleSpy = vitest_1.vi.spyOn(console, 'error').mockImplementation(() => { });
            const displayInfo = VersionUtils_1.VersionUtils.getExtensionDisplayInfo();
            (0, vitest_1.expect)(displayInfo).toBe('Secondary Terminal Unknown');
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith('[VersionUtils] Error getting extension display info:', vitest_1.expect.any(Error));
            consoleSpy.mockRestore();
        });
    });
    (0, vitest_1.describe)('clearCache', () => {
        (0, vitest_1.it)('should clear the cached version', () => {
            vitest_1.vi.mocked(vscode.extensions.getExtension).mockReturnValue({
                packageJSON: { version: '1.2.3' },
            });
            VersionUtils_1.VersionUtils.getExtensionVersion();
            (0, vitest_1.expect)(vscode.extensions.getExtension).toHaveBeenCalledTimes(1);
            VersionUtils_1.VersionUtils.clearCache();
            VersionUtils_1.VersionUtils.getExtensionVersion();
            (0, vitest_1.expect)(vscode.extensions.getExtension).toHaveBeenCalledTimes(2);
        });
    });
});
//# sourceMappingURL=VersionUtils.test.js.map