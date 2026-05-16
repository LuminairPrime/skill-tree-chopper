"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const ThemeManager_1 = require("../../../../../webview/utils/ThemeManager");
(0, vitest_1.describe)('ThemeManager', () => {
    let dom;
    (0, vitest_1.beforeEach)(() => {
        dom = new jsdom_1.JSDOM('<!DOCTYPE html><html><body><div class="test-element"></div></body></html>');
        vitest_1.vi.stubGlobal('window', dom.window);
        vitest_1.vi.stubGlobal('document', dom.window.document);
        vitest_1.vi.stubGlobal('getComputedStyle', dom.window.getComputedStyle);
        vitest_1.vi.stubGlobal('HTMLElement', dom.window.HTMLElement);
        ThemeManager_1.ThemeManager.dispose();
    });
    (0, vitest_1.afterEach)(() => {
        ThemeManager_1.ThemeManager.dispose();
        vitest_1.vi.restoreAllMocks();
        dom.window.close();
        vitest_1.vi.unstubAllGlobals();
    });
    (0, vitest_1.describe)('getThemeColors', () => {
        (0, vitest_1.it)('should return default colors initially', () => {
            const colors = ThemeManager_1.ThemeManager.getThemeColors();
            (0, vitest_1.expect)(colors.background).toBe('#1e1e1e');
        });
        (0, vitest_1.it)('should prioritize terminal background over editor background', () => {
            // Given
            document.documentElement.style.setProperty('--vscode-terminal-background', '#003b49');
            document.documentElement.style.setProperty('--vscode-editor-background', '#1e1e1e');
            // When
            ThemeManager_1.ThemeManager.initialize();
            const colors = ThemeManager_1.ThemeManager.getThemeColors();
            // Then
            (0, vitest_1.expect)(colors.background).toBe('#003b49');
        });
        (0, vitest_1.it)('should update colors from CSS variables', () => {
            // Given
            document.documentElement.style.setProperty('--vscode-editor-background', '#ff0000');
            // When
            ThemeManager_1.ThemeManager.initialize();
            const colors = ThemeManager_1.ThemeManager.getThemeColors();
            // Then
            (0, vitest_1.expect)(colors.background).toBe('#ff0000');
        });
    });
    (0, vitest_1.describe)('applyTheme', () => {
        (0, vitest_1.it)('should apply colors to element style', () => {
            const element = document.createElement('div');
            ThemeManager_1.ThemeManager.applyTheme(element, { background: '#00ff00', foreground: '#0000ff' });
            (0, vitest_1.expect)(element.style.background).toBe('rgb(0, 255, 0)');
            (0, vitest_1.expect)(element.style.color).toBe('rgb(0, 0, 255)');
        });
        (0, vitest_1.it)('should use current theme colors if no custom theme provided', () => {
            const element = document.createElement('div');
            document.documentElement.style.setProperty('--vscode-editor-background', '#ff0000');
            ThemeManager_1.ThemeManager.initialize();
            ThemeManager_1.ThemeManager.applyTheme(element);
            (0, vitest_1.expect)(element.style.background).toBe('rgb(255, 0, 0)');
        });
    });
    (0, vitest_1.describe)('createTerminalTheme', () => {
        (0, vitest_1.it)('should use terminal background when available', () => {
            document.documentElement.style.setProperty('--vscode-terminal-background', '#003b49');
            document.documentElement.style.setProperty('--vscode-editor-background', '#1e1e1e');
            ThemeManager_1.ThemeManager.initialize();
            const theme = ThemeManager_1.ThemeManager.createTerminalTheme();
            (0, vitest_1.expect)(theme.background).toBe('#003b49');
        });
        (0, vitest_1.it)('should fall back to editor background when terminal background is unavailable', () => {
            document.documentElement.style.setProperty('--vscode-editor-background', '#ff0000');
            ThemeManager_1.ThemeManager.initialize();
            const theme = ThemeManager_1.ThemeManager.createTerminalTheme();
            (0, vitest_1.expect)(theme.background).toBe('#ff0000');
        });
        (0, vitest_1.it)('should create a terminal theme with VS Code colors', () => {
            document.documentElement.style.setProperty('--vscode-terminalCursor-foreground', '#ffff00');
            ThemeManager_1.ThemeManager.initialize();
            const theme = ThemeManager_1.ThemeManager.createTerminalTheme();
            (0, vitest_1.expect)(theme.cursor).toBe('#ffff00');
        });
        (0, vitest_1.it)('should allow overrides', () => {
            const theme = ThemeManager_1.ThemeManager.createTerminalTheme({ background: '#000000' });
            (0, vitest_1.expect)(theme.background).toBe('#000000');
        });
    });
    (0, vitest_1.describe)('updateElementTheme', () => {
        (0, vitest_1.it)('should update all elements matching selector', () => {
            const el1 = document.createElement('div');
            el1.className = 'my-class';
            const el2 = document.createElement('div');
            el2.className = 'my-class';
            document.body.appendChild(el1);
            document.body.appendChild(el2);
            ThemeManager_1.ThemeManager.updateElementTheme('.my-class', { backgroundColor: 'red' });
            (0, vitest_1.expect)(el1.style.backgroundColor).toBe('red');
            (0, vitest_1.expect)(el2.style.backgroundColor).toBe('red');
        });
    });
    (0, vitest_1.describe)('getThemeVariables', () => {
        (0, vitest_1.it)('should return map of VS Code variables', () => {
            document.documentElement.style.setProperty('--vscode-editor-background', '#123456');
            const variables = ThemeManager_1.ThemeManager.getThemeVariables();
            (0, vitest_1.expect)(variables['--vscode-editor-background']).toBe('#123456');
        });
    });
});
//# sourceMappingURL=ThemeManager.test.js.map