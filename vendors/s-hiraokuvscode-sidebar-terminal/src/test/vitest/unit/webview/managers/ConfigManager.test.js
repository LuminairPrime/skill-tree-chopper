"use strict";
/**
 * ConfigManager Test Suite - Settings management, validation, and persistence
 *
 * TDD Pattern: Covers settings loading, saving, validation, and normalization
 *
 * Vitest Migration: Converted from Mocha/Chai to Vitest
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ConfigManager_1 = require("../../../../../webview/managers/ConfigManager");
// Mock VS Code API
const mockVscodeState = {};
globalThis.vscode = {
    getState: () => mockVscodeState,
    setState: (state) => Object.assign(mockVscodeState, state),
};
(0, vitest_1.describe)('ConfigManager', () => {
    let configManager;
    (0, vitest_1.beforeEach)(() => {
        // Reset mock state
        Object.keys(mockVscodeState).forEach((key) => delete mockVscodeState[key]);
        configManager = new ConfigManager_1.ConfigManager();
    });
    (0, vitest_1.afterEach)(() => {
        configManager.dispose();
    });
    (0, vitest_1.describe)('Initialization', () => {
        (0, vitest_1.it)('should create instance correctly', () => {
            (0, vitest_1.expect)(configManager).toBeInstanceOf(ConfigManager_1.ConfigManager);
        });
        (0, vitest_1.it)('should have default settings', () => {
            const settings = configManager.getCurrentSettings();
            (0, vitest_1.expect)(settings).toBeDefined();
            (0, vitest_1.expect)(settings.fontSize).toBe(14);
            (0, vitest_1.expect)(settings.theme).toBe('auto');
            (0, vitest_1.expect)(settings.enableTerminalHeaderEnhancements).toBe(true);
        });
    });
    (0, vitest_1.describe)('Settings Loading', () => {
        (0, vitest_1.it)('should load settings from VS Code state', () => {
            const savedSettings = {
                fontSize: 18,
                fontFamily: 'JetBrains Mono',
                theme: 'dark',
            };
            mockVscodeState.terminalSettings = savedSettings;
            const settings = configManager.loadSettings();
            (0, vitest_1.expect)(settings.fontSize).toBe(18);
            (0, vitest_1.expect)(settings.fontFamily).toBe('JetBrains Mono');
            (0, vitest_1.expect)(settings.theme).toBe('dark');
        });
        (0, vitest_1.it)('should use defaults when no saved settings exist', () => {
            const settings = configManager.loadSettings();
            (0, vitest_1.expect)(settings.fontSize).toBe(14);
            (0, vitest_1.expect)(settings.theme).toBe('auto');
        });
        (0, vitest_1.it)('should handle corrupted state gracefully', () => {
            globalThis.vscode.getState = () => {
                throw new Error('State corrupted');
            };
            const settings = configManager.loadSettings();
            // Should return defaults on error
            (0, vitest_1.expect)(settings.fontSize).toBe(14);
            (0, vitest_1.expect)(settings.theme).toBe('auto');
            // Restore normal behavior
            globalThis.vscode.getState = () => mockVscodeState;
        });
    });
    (0, vitest_1.describe)('Settings Saving', () => {
        (0, vitest_1.it)('should save settings to VS Code state', () => {
            const settings = {
                fontSize: 16,
                fontFamily: 'Fira Code',
                theme: 'light',
            };
            configManager.saveSettings(settings);
            (0, vitest_1.expect)(mockVscodeState.terminalSettings).toBeDefined();
            (0, vitest_1.expect)(mockVscodeState.terminalSettings.fontSize).toBe(16);
        });
        (0, vitest_1.it)('should validate settings before saving', () => {
            const invalidSettings = {
                fontSize: 5, // Too small (min 8)
                scrollback: -100, // Invalid
            };
            configManager.saveSettings(invalidSettings);
            const saved = mockVscodeState.terminalSettings;
            (0, vitest_1.expect)(saved.fontSize).toBe(14); // Should fall back to default
            (0, vitest_1.expect)(saved.scrollback).toBe(2000); // Should fall back to default
        });
        (0, vitest_1.it)('should handle save errors gracefully', () => {
            globalThis.vscode.setState = () => {
                throw new Error('Save failed');
            };
            // Should not throw
            (0, vitest_1.expect)(() => {
                configManager.saveSettings({ fontSize: 16 });
            }).not.toThrow();
            // Restore normal behavior
            globalThis.vscode.setState = (state) => Object.assign(mockVscodeState, state);
        });
    });
    (0, vitest_1.describe)('Settings Validation', () => {
        (0, vitest_1.it)('should validate fontSize within range', () => {
            // Too small
            configManager.saveSettings({ fontSize: 4 });
            (0, vitest_1.expect)(configManager.getCurrentSettings().fontSize).toBe(14);
            // Too large
            configManager.saveSettings({ fontSize: 100 });
            (0, vitest_1.expect)(configManager.getCurrentSettings().fontSize).toBe(14);
            // Valid range
            configManager.saveSettings({ fontSize: 20 });
            (0, vitest_1.expect)(configManager.getCurrentSettings().fontSize).toBe(20);
        });
        (0, vitest_1.it)('should validate theme values', () => {
            // Valid themes
            configManager.saveSettings({ theme: 'dark' });
            (0, vitest_1.expect)(configManager.getCurrentSettings().theme).toBe('dark');
            configManager.saveSettings({ theme: 'light' });
            (0, vitest_1.expect)(configManager.getCurrentSettings().theme).toBe('light');
            configManager.saveSettings({ theme: 'auto' });
            (0, vitest_1.expect)(configManager.getCurrentSettings().theme).toBe('auto');
            // Invalid theme
            configManager.saveSettings({ theme: 'invalid' });
            (0, vitest_1.expect)(configManager.getCurrentSettings().theme).toBe('auto');
        });
        (0, vitest_1.it)('should validate scrollback range', () => {
            // Valid scrollback
            configManager.saveSettings({ scrollback: 5000 });
            (0, vitest_1.expect)(configManager.getCurrentSettings().scrollback).toBe(5000);
            // Too large
            configManager.saveSettings({ scrollback: 200000 });
            (0, vitest_1.expect)(configManager.getCurrentSettings().scrollback).toBe(2000);
            // Negative
            configManager.saveSettings({ scrollback: -100 });
            (0, vitest_1.expect)(configManager.getCurrentSettings().scrollback).toBe(2000);
        });
        (0, vitest_1.it)('should validate boolean settings', () => {
            configManager.saveSettings({ cursorBlink: true });
            (0, vitest_1.expect)(configManager.getCurrentSettings().cursorBlink).toBe(true);
            configManager.saveSettings({ cursorBlink: false });
            (0, vitest_1.expect)(configManager.getCurrentSettings().cursorBlink).toBe(false);
            // Non-boolean should use default
            configManager.saveSettings({ cursorBlink: 'yes' });
            (0, vitest_1.expect)(configManager.getCurrentSettings().cursorBlink).toBe(true);
        });
        (0, vitest_1.it)('should validate enableTerminalHeaderEnhancements setting', () => {
            configManager.saveSettings({ enableTerminalHeaderEnhancements: false });
            (0, vitest_1.expect)(configManager.getCurrentSettings().enableTerminalHeaderEnhancements).toBe(false);
            configManager.saveSettings({ enableTerminalHeaderEnhancements: 'no' });
            (0, vitest_1.expect)(configManager.getCurrentSettings().enableTerminalHeaderEnhancements).toBe(true);
        });
        (0, vitest_1.it)('should validate maxTerminals range', () => {
            // Valid range
            configManager.saveSettings({ maxTerminals: 3 });
            (0, vitest_1.expect)(configManager.getCurrentSettings().maxTerminals).toBe(3);
            // Too small
            configManager.saveSettings({ maxTerminals: 0 });
            (0, vitest_1.expect)(configManager.getCurrentSettings().maxTerminals).toBe(10);
            // Too large
            configManager.saveSettings({ maxTerminals: 20 });
            (0, vitest_1.expect)(configManager.getCurrentSettings().maxTerminals).toBe(10);
        });
        (0, vitest_1.it)('should validate cursor settings', () => {
            configManager.saveSettings({
                cursor: { style: 'underline', blink: false },
            });
            const settings = configManager.getCurrentSettings();
            (0, vitest_1.expect)(settings.cursor?.style).toBe('underline');
            (0, vitest_1.expect)(settings.cursor?.blink).toBe(false);
        });
        (0, vitest_1.it)('should validate cursor style values', () => {
            // Valid styles
            configManager.saveSettings({ cursor: { style: 'block', blink: true } });
            (0, vitest_1.expect)(configManager.getCurrentSettings().cursor?.style).toBe('block');
            configManager.saveSettings({ cursor: { style: 'underline', blink: true } });
            (0, vitest_1.expect)(configManager.getCurrentSettings().cursor?.style).toBe('underline');
            configManager.saveSettings({ cursor: { style: 'bar', blink: true } });
            (0, vitest_1.expect)(configManager.getCurrentSettings().cursor?.style).toBe('bar');
            // Invalid style
            configManager.saveSettings({ cursor: { style: 'invalid', blink: true } });
            (0, vitest_1.expect)(configManager.getCurrentSettings().cursor?.style).toBe('block');
        });
        (0, vitest_1.it)('should validate multiCursorModifier', () => {
            configManager.saveSettings({ multiCursorModifier: 'ctrl' });
            (0, vitest_1.expect)(configManager.getCurrentSettings().multiCursorModifier).toBe('ctrl');
            configManager.saveSettings({ multiCursorModifier: 'invalid' });
            (0, vitest_1.expect)(configManager.getCurrentSettings().multiCursorModifier).toBe('alt');
        });
        (0, vitest_1.it)('should validate shell args as array', () => {
            configManager.saveSettings({ shellArgs: ['--login', '-i'] });
            (0, vitest_1.expect)(configManager.getCurrentSettings().shellArgs).toEqual(['--login', '-i']);
            // Filter non-strings
            configManager.saveSettings({ shellArgs: ['valid', 123, 'also-valid'] });
            const args = configManager.getCurrentSettings().shellArgs;
            (0, vitest_1.expect)(args).toEqual(['valid', 'also-valid']);
        });
    });
    (0, vitest_1.describe)('Font Settings', () => {
        (0, vitest_1.it)('should get current font settings', () => {
            const fontSettings = configManager.getCurrentFontSettings();
            (0, vitest_1.expect)(typeof fontSettings.fontSize).toBe('number');
            (0, vitest_1.expect)(typeof fontSettings.fontFamily).toBe('string');
        });
        (0, vitest_1.it)('should apply font settings', () => {
            const terminals = new Map();
            const mockTerminal = {
                terminal: { options: {} },
            };
            terminals.set('test-1', mockTerminal);
            const fontSettings = {
                fontSize: 18,
                fontFamily: 'Fira Code',
            };
            configManager.applyFontSettings(fontSettings, terminals);
            const currentSettings = configManager.getCurrentSettings();
            (0, vitest_1.expect)(currentSettings.fontSize).toBe(18);
            (0, vitest_1.expect)(currentSettings.fontFamily).toBe('Fira Code');
        });
        (0, vitest_1.it)('should validate font settings', () => {
            const terminals = new Map();
            // Invalid font size
            configManager.applyFontSettings({ fontSize: 4, fontFamily: '' }, terminals);
            const settings = configManager.getCurrentFontSettings();
            (0, vitest_1.expect)(settings.fontSize).toBe(14); // Default
        });
        (0, vitest_1.it)('should set font settings service', () => {
            const mockFontSettingsService = {
                getCurrentSettings: () => ({
                    fontSize: 20,
                    fontFamily: 'Monaco',
                }),
            };
            configManager.setFontSettingsService(mockFontSettingsService);
            const fontSettings = configManager.getCurrentFontSettings();
            (0, vitest_1.expect)(fontSettings.fontSize).toBe(20);
            (0, vitest_1.expect)(fontSettings.fontFamily).toBe('Monaco');
        });
    });
    (0, vitest_1.describe)('Apply Settings to Terminals', () => {
        (0, vitest_1.it)('should apply settings to all terminals', () => {
            const mockTerminal1 = { options: {} };
            const mockTerminal2 = { options: {} };
            const terminals = new Map([
                ['term-1', { terminal: mockTerminal1 }],
                ['term-2', { terminal: mockTerminal2 }],
            ]);
            const settings = {
                cursorBlink: true,
                scrollback: 5000,
            };
            configManager.applySettings(settings, terminals);
            (0, vitest_1.expect)(mockTerminal1.options['cursorBlink']).toBe(true);
            (0, vitest_1.expect)(mockTerminal1.options['scrollback']).toBe(5000);
            (0, vitest_1.expect)(mockTerminal2.options['cursorBlink']).toBe(true);
            (0, vitest_1.expect)(mockTerminal2.options['scrollback']).toBe(5000);
        });
        (0, vitest_1.it)('should handle terminal apply errors gracefully', () => {
            const badTerminal = {
                get options() {
                    throw new Error('Terminal error');
                },
            };
            const terminals = new Map([['term-1', { terminal: badTerminal }]]);
            (0, vitest_1.expect)(() => {
                configManager.applySettings({ scrollback: 1000 }, terminals);
            }).not.toThrow();
        });
    });
    (0, vitest_1.describe)('Alt+Click Setting', () => {
        (0, vitest_1.it)('should update Alt+Click setting for terminals', () => {
            const mockTerminal = { options: {} };
            const terminals = new Map([['term-1', { terminal: mockTerminal }]]);
            configManager.updateAltClickSetting(terminals, {
                altClickMovesCursor: true,
                multiCursorModifier: 'alt',
            });
            (0, vitest_1.expect)(mockTerminal.options['altClickMovesCursor']).toBe(true);
        });
        (0, vitest_1.it)('should disable Alt+Click when modifier is not alt', () => {
            const mockTerminal = { options: {} };
            const terminals = new Map([['term-1', { terminal: mockTerminal }]]);
            configManager.updateAltClickSetting(terminals, {
                altClickMovesCursor: true,
                multiCursorModifier: 'ctrl',
            });
            (0, vitest_1.expect)(mockTerminal.options['altClickMovesCursor']).toBe(false);
        });
        (0, vitest_1.it)('should handle update errors gracefully', () => {
            const badTerminal = {
                get options() {
                    throw new Error('Terminal error');
                },
            };
            const terminals = new Map([['term-1', { terminal: badTerminal }]]);
            (0, vitest_1.expect)(() => {
                configManager.updateAltClickSetting(terminals, {
                    altClickMovesCursor: true,
                });
            }).not.toThrow();
        });
    });
    (0, vitest_1.describe)('Reset to Defaults', () => {
        (0, vitest_1.it)('should reset all settings to defaults', () => {
            // First save custom settings
            configManager.saveSettings({
                fontSize: 20,
                theme: 'light',
                scrollback: 10000,
            });
            // Reset
            const defaultSettings = configManager.resetToDefaults();
            (0, vitest_1.expect)(defaultSettings.fontSize).toBe(14);
            (0, vitest_1.expect)(defaultSettings.theme).toBe('auto');
            (0, vitest_1.expect)(defaultSettings.scrollback).toBe(2000);
        });
    });
    (0, vitest_1.describe)('Export and Import', () => {
        (0, vitest_1.it)('should export settings as JSON', () => {
            configManager.saveSettings({
                fontSize: 16,
                theme: 'dark',
            });
            const exported = configManager.exportSettings();
            const parsed = JSON.parse(exported);
            (0, vitest_1.expect)(parsed.settings).toBeDefined();
            (0, vitest_1.expect)(parsed.settings.fontSize).toBe(16);
            (0, vitest_1.expect)(parsed.fontSettings).toBeDefined();
            (0, vitest_1.expect)(typeof parsed.timestamp).toBe('string');
        });
        (0, vitest_1.it)('should import settings from JSON', () => {
            const backup = JSON.stringify({
                settings: {
                    fontSize: 18,
                    theme: 'light',
                    scrollback: 3000,
                },
            });
            const imported = configManager.importSettings(backup);
            (0, vitest_1.expect)(imported.fontSize).toBe(18);
            (0, vitest_1.expect)(imported.theme).toBe('light');
            (0, vitest_1.expect)(imported.scrollback).toBe(3000);
        });
        (0, vitest_1.it)('should validate imported settings', () => {
            const backup = JSON.stringify({
                settings: {
                    fontSize: 4, // Invalid
                    scrollback: -100, // Invalid
                },
            });
            const imported = configManager.importSettings(backup);
            (0, vitest_1.expect)(imported.fontSize).toBe(14); // Default
            (0, vitest_1.expect)(imported.scrollback).toBe(2000); // Default
        });
        (0, vitest_1.it)('should throw on invalid import format', () => {
            (0, vitest_1.expect)(() => {
                configManager.importSettings('{}');
            }).toThrow('Invalid settings format');
            (0, vitest_1.expect)(() => {
                configManager.importSettings('invalid json');
            }).toThrow();
        });
    });
    (0, vitest_1.describe)('Dispose', () => {
        (0, vitest_1.it)('should save settings on dispose', () => {
            configManager.saveSettings({ fontSize: 20 });
            configManager.dispose();
            // Settings should be saved
            (0, vitest_1.expect)(mockVscodeState.terminalSettings.fontSize).toBe(20);
        });
    });
});
//# sourceMappingURL=ConfigManager.test.js.map