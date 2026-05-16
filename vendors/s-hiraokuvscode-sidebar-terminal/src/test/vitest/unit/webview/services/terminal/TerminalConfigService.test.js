"use strict";
/**
 * TerminalConfigService Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TerminalConfigService_1 = require("../../../../../../webview/services/terminal/TerminalConfigService");
(0, vitest_1.describe)('TerminalConfigService', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.unstubAllGlobals();
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.unstubAllGlobals();
    });
    (0, vitest_1.describe)('getDefaultConfig', () => {
        (0, vitest_1.it)('should return default configuration', () => {
            const config = TerminalConfigService_1.TerminalConfigService.getDefaultConfig();
            (0, vitest_1.expect)(config.cursorBlink).toBe(true);
            (0, vitest_1.expect)(config.scrollback).toBe(2000);
        });
        (0, vitest_1.it)('should prioritize VS Code terminal background when available', async () => {
            // Given
            vitest_1.vi.resetModules();
            vitest_1.vi.stubGlobal('navigator', { userAgent: 'Linux' });
            vitest_1.vi.stubGlobal('document', {
                documentElement: {},
            });
            vitest_1.vi.stubGlobal('getComputedStyle', vitest_1.vi.fn().mockReturnValue({
                getPropertyValue: (property) => {
                    if (property === '--vscode-terminal-background')
                        return '#003b49';
                    if (property === '--vscode-editor-background')
                        return '#1e1e1e';
                    return '';
                },
            }));
            // When
            const mod = await Promise.resolve().then(() => require('../../../../../../webview/services/terminal/TerminalConfigService'));
            const config = mod.TerminalConfigService.getDefaultConfig();
            // Then
            (0, vitest_1.expect)(config.theme?.background).toBe('#003b49');
        });
        (0, vitest_1.it)('should fall back to editor background when terminal background is unavailable', async () => {
            // Given
            vitest_1.vi.resetModules();
            vitest_1.vi.stubGlobal('navigator', { userAgent: 'Linux' });
            vitest_1.vi.stubGlobal('document', {
                documentElement: {},
            });
            vitest_1.vi.stubGlobal('getComputedStyle', vitest_1.vi.fn().mockReturnValue({
                getPropertyValue: (property) => {
                    if (property === '--vscode-editor-background')
                        return '#223344';
                    return '';
                },
            }));
            // When
            const mod = await Promise.resolve().then(() => require('../../../../../../webview/services/terminal/TerminalConfigService'));
            const config = mod.TerminalConfigService.getDefaultConfig();
            // Then
            (0, vitest_1.expect)(config.theme?.background).toBe('#223344');
        });
        (0, vitest_1.it)('should handle platform specific font size', async () => {
            // Test Mac
            vitest_1.vi.resetModules();
            vitest_1.vi.stubGlobal('navigator', { userAgent: 'Macintosh' });
            const modMac = await Promise.resolve().then(() => require('../../../../../../webview/services/terminal/TerminalConfigService'));
            const macConfig = modMac.TerminalConfigService.getDefaultConfig();
            (0, vitest_1.expect)(macConfig.fontSize).toBe(12);
            // Test Linux
            vitest_1.vi.resetModules();
            vitest_1.vi.stubGlobal('navigator', { userAgent: 'Linux' });
            const modLinux = await Promise.resolve().then(() => require('../../../../../../webview/services/terminal/TerminalConfigService'));
            const linuxConfig = modLinux.TerminalConfigService.getDefaultConfig();
            (0, vitest_1.expect)(linuxConfig.fontSize).toBe(14);
            (0, vitest_1.expect)(linuxConfig.lineHeight).toBe(1.1);
        });
    });
    (0, vitest_1.describe)('mergeConfig', () => {
        (0, vitest_1.it)('should override defaults with user settings', () => {
            const merged = TerminalConfigService_1.TerminalConfigService.mergeConfig({
                fontSize: 20,
                cursorStyle: 'bar',
            });
            (0, vitest_1.expect)(merged.fontSize).toBe(20);
            (0, vitest_1.expect)(merged.cursorStyle).toBe('bar');
            (0, vitest_1.expect)(merged.cursorBlink).toBe(true); // preserved default
        });
    });
    (0, vitest_1.describe)('validateConfig', () => {
        (0, vitest_1.it)('should accept valid config', () => {
            (0, vitest_1.expect)(TerminalConfigService_1.TerminalConfigService.validateConfig({ fontSize: 14 })).toBe(true);
        });
        (0, vitest_1.it)('should reject invalid font size', () => {
            (0, vitest_1.expect)(TerminalConfigService_1.TerminalConfigService.validateConfig({ fontSize: 2 })).toBe(false);
            (0, vitest_1.expect)(TerminalConfigService_1.TerminalConfigService.validateConfig({ fontSize: 100 })).toBe(false);
        });
        (0, vitest_1.it)('should reject invalid scrollback', () => {
            (0, vitest_1.expect)(TerminalConfigService_1.TerminalConfigService.validateConfig({ scrollback: -1 })).toBe(false);
        });
    });
});
//# sourceMappingURL=TerminalConfigService.test.js.map