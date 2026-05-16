"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ThemeUtils_1 = require("../../../../../webview/utils/ThemeUtils");
(0, vitest_1.describe)('ThemeUtils', () => {
    beforeEach(() => {
        // Reset document body styles
        document.body.style.backgroundColor = '';
        document.body.style.setProperty('--vscode-editor-background', '');
        document.body.style.setProperty('--vscode-panel-background', '');
    });
    (0, vitest_1.describe)('detectTheme', () => {
        (0, vitest_1.it)('should detect dark theme from hex color', () => {
            document.body.style.setProperty('--vscode-editor-background', '#1e1e1e');
            (0, vitest_1.expect)(ThemeUtils_1.ThemeUtils.detectTheme()).toBe('dark');
        });
        (0, vitest_1.it)('should detect light theme from hex color', () => {
            document.body.style.setProperty('--vscode-editor-background', '#ffffff');
            (0, vitest_1.expect)(ThemeUtils_1.ThemeUtils.detectTheme()).toBe('light');
        });
        (0, vitest_1.it)('should detect dark theme from rgb color', () => {
            document.body.style.setProperty('--vscode-editor-background', 'rgb(30, 30, 30)');
            (0, vitest_1.expect)(ThemeUtils_1.ThemeUtils.detectTheme()).toBe('dark');
        });
        (0, vitest_1.it)('should detect light theme from rgb color', () => {
            document.body.style.setProperty('--vscode-editor-background', 'rgb(255, 255, 255)');
            (0, vitest_1.expect)(ThemeUtils_1.ThemeUtils.detectTheme()).toBe('light');
        });
        (0, vitest_1.it)('should fallback to panel background', () => {
            document.body.style.setProperty('--vscode-panel-background', '#ffffff');
            (0, vitest_1.expect)(ThemeUtils_1.ThemeUtils.detectTheme()).toBe('light');
        });
        (0, vitest_1.it)('should fallback to body background color', () => {
            document.body.style.backgroundColor = '#ffffff';
            (0, vitest_1.expect)(ThemeUtils_1.ThemeUtils.detectTheme()).toBe('light');
        });
        (0, vitest_1.it)('should default to dark if no color found', () => {
            (0, vitest_1.expect)(ThemeUtils_1.ThemeUtils.detectTheme()).toBe('dark');
        });
    });
    (0, vitest_1.describe)('getThemeColors', () => {
        (0, vitest_1.it)('should return dark theme colors when theme is dark', () => {
            const colors = ThemeUtils_1.ThemeUtils.getThemeColors('dark');
            (0, vitest_1.expect)(colors).toBeDefined();
            // Assuming THEME_CONSTANTS.DARK_THEME has background
            (0, vitest_1.expect)(colors.background).toBeDefined();
        });
        (0, vitest_1.it)('should return light theme colors when theme is light', () => {
            const colors = ThemeUtils_1.ThemeUtils.getThemeColors('light');
            (0, vitest_1.expect)(colors).toBeDefined();
        });
        (0, vitest_1.it)('should detect theme when theme is auto', () => {
            document.body.style.setProperty('--vscode-editor-background', '#ffffff');
            const colors = ThemeUtils_1.ThemeUtils.getThemeColors('auto');
            // Should match light theme
            (0, vitest_1.expect)(colors.background).toBe('#ffffff');
        });
    });
    (0, vitest_1.describe)('calculateBrightness', () => {
        (0, vitest_1.it)('should calculate brightness for hex colors', () => {
            (0, vitest_1.expect)(ThemeUtils_1.ThemeUtils.calculateBrightness('#000000')).toBe(0);
            (0, vitest_1.expect)(ThemeUtils_1.ThemeUtils.calculateBrightness('#ffffff')).toBe(255);
        });
        (0, vitest_1.it)('should calculate brightness for rgb colors', () => {
            (0, vitest_1.expect)(ThemeUtils_1.ThemeUtils.calculateBrightness('rgb(0, 0, 0)')).toBe(0);
            (0, vitest_1.expect)(ThemeUtils_1.ThemeUtils.calculateBrightness('rgb(255, 255, 255)')).toBe(255);
        });
        (0, vitest_1.it)('should return 0 for invalid colors', () => {
            (0, vitest_1.expect)(ThemeUtils_1.ThemeUtils.calculateBrightness('invalid')).toBe(0);
        });
    });
    (0, vitest_1.describe)('isDarkColor', () => {
        (0, vitest_1.it)('should return true for dark colors', () => {
            (0, vitest_1.expect)(ThemeUtils_1.ThemeUtils.isDarkColor('#000000')).toBe(true);
            (0, vitest_1.expect)(ThemeUtils_1.ThemeUtils.isDarkColor('#7f7f7f')).toBe(true);
        });
        (0, vitest_1.it)('should return false for light colors', () => {
            (0, vitest_1.expect)(ThemeUtils_1.ThemeUtils.isDarkColor('#ffffff')).toBe(false);
            (0, vitest_1.expect)(ThemeUtils_1.ThemeUtils.isDarkColor('#808080')).toBe(false);
        });
    });
    (0, vitest_1.describe)('getVSCodeColor', () => {
        (0, vitest_1.it)('should return value from CSS variable', () => {
            document.documentElement.style.setProperty('--vscode-test-color', '#ff0000');
            (0, vitest_1.expect)(ThemeUtils_1.ThemeUtils.getVSCodeColor('test-color', '#000000')).toBe('#ff0000');
        });
        (0, vitest_1.it)('should return fallback if variable not found', () => {
            (0, vitest_1.expect)(ThemeUtils_1.ThemeUtils.getVSCodeColor('non-existent', '#000000')).toBe('#000000');
        });
    });
});
//# sourceMappingURL=ThemeUtils.test.js.map