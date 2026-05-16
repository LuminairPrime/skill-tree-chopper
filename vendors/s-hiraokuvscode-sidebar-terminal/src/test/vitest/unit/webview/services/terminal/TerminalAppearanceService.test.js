"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const TerminalAppearanceService_1 = require("../../../../../../webview/services/terminal/TerminalAppearanceService");
(0, vitest_1.describe)('TerminalAppearanceService', () => {
    let dom;
    let service;
    (0, vitest_1.beforeEach)(() => {
        dom = new jsdom_1.JSDOM('<!DOCTYPE html><body></body>');
        vitest_1.vi.stubGlobal('window', dom.window);
        vitest_1.vi.stubGlobal('document', dom.window.document);
        vitest_1.vi.stubGlobal('HTMLElement', dom.window.HTMLElement);
        vitest_1.vi.stubGlobal('Element', dom.window.Element);
        service = new TerminalAppearanceService_1.TerminalAppearanceService({
            coordinator: {
                currentSettings: {
                    theme: 'dark',
                    multiCursorModifier: 'ctrlCmd',
                },
            },
        });
    });
    (0, vitest_1.afterEach)(() => {
        dom.window.close();
        vitest_1.vi.restoreAllMocks();
        vitest_1.vi.unstubAllGlobals();
    });
    (0, vitest_1.it)('prefers submitted font settings and coordinator theme fallback when preparing config', () => {
        const result = service.prepareTerminalConfig({
            fontFamily: 'JetBrains Mono',
            fontSize: 16,
        }, {
            getCurrentSettings: vitest_1.vi.fn().mockReturnValue({ theme: 'auto' }),
            getCurrentFontSettings: vitest_1.vi.fn().mockReturnValue({
                fontFamily: 'Fira Code',
                fontSize: 14,
            }),
        });
        (0, vitest_1.expect)(result.currentSettings?.theme).toBe('dark');
        (0, vitest_1.expect)(result.currentFontSettings?.fontFamily).toBe('JetBrains Mono');
        (0, vitest_1.expect)(result.currentFontSettings?.fontSize).toBe(16);
        (0, vitest_1.expect)(result.terminalConfig.fontFamily).toBe('JetBrains Mono');
        (0, vitest_1.expect)(result.terminalConfig.fontSize).toBe(16);
        (0, vitest_1.expect)(result.linkModifier).toBe('ctrlCmd');
    });
    (0, vitest_1.it)('applies visual settings and updates terminal backgrounds after open', () => {
        const terminal = {};
        const container = document.createElement('div');
        const terminalContent = document.createElement('div');
        const xterm = document.createElement('div');
        xterm.className = 'xterm';
        const viewport = document.createElement('div');
        viewport.className = 'xterm-viewport';
        container.appendChild(xterm);
        container.appendChild(viewport);
        const uiManager = {
            applyAllVisualSettings: vitest_1.vi.fn(),
            applyFontSettings: vitest_1.vi.fn(),
        };
        service.applyPostOpenSettings({
            terminalId: 'terminal-1',
            terminal,
            container,
            terminalContent,
            currentSettings: { theme: 'dark' },
            currentFontSettings: { fontFamily: 'JetBrains Mono', fontSize: 14 },
            configManager: undefined,
            uiManager,
        });
        (0, vitest_1.expect)(uiManager.applyAllVisualSettings).toHaveBeenCalledWith(terminal, { theme: 'dark' });
        (0, vitest_1.expect)(uiManager.applyFontSettings).toHaveBeenCalledWith(terminal, {
            fontFamily: 'JetBrains Mono',
            fontSize: 14,
        });
        (0, vitest_1.expect)(terminalContent.style.backgroundColor).not.toBe('');
        (0, vitest_1.expect)(xterm.style.backgroundColor).not.toBe('');
        (0, vitest_1.expect)(viewport.style.backgroundColor).not.toBe('');
    });
});
//# sourceMappingURL=TerminalAppearanceService.test.js.map