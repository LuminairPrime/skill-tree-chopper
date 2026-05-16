"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const SpecialKeysHandler_1 = require("../../../../../../../webview/managers/input/handlers/SpecialKeysHandler");
(0, vitest_1.describe)('SpecialKeysHandler', () => {
    let dom;
    let handler;
    let mockDeps;
    (0, vitest_1.beforeEach)(() => {
        dom = new jsdom_1.JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url: 'http://localhost',
            pretendToBeVisual: true,
        });
        vitest_1.vi.stubGlobal('window', dom.window);
        vitest_1.vi.stubGlobal('document', dom.window.document);
        mockDeps = {
            logger: vitest_1.vi.fn(),
            isIMEComposing: vitest_1.vi.fn().mockReturnValue(false),
            handleTerminalCopy: vitest_1.vi.fn(),
            handleTerminalPaste: vitest_1.vi.fn(),
            emitTerminalInteractionEvent: vitest_1.vi.fn(),
            queueInputData: vitest_1.vi.fn(),
            getTerminalInstance: vitest_1.vi.fn().mockReturnValue(null),
        };
        handler = new SpecialKeysHandler_1.SpecialKeysHandler(mockDeps);
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.restoreAllMocks();
        vitest_1.vi.unstubAllGlobals();
        dom.window.close();
    });
    (0, vitest_1.describe)('IME composition blocking', () => {
        (0, vitest_1.it)('should block special keys during IME composition', () => {
            mockDeps.isIMEComposing.mockReturnValue(true);
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'c',
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
            });
            const manager = {};
            const result = handler.handleSpecialKeys(event, 'terminal-1', manager);
            (0, vitest_1.expect)(result).toBe(false);
            (0, vitest_1.expect)(mockDeps.logger).toHaveBeenCalledWith(vitest_1.expect.stringContaining('blocked during IME composition'));
        });
        (0, vitest_1.it)('should block KEY_IN_COMPOSITION (keyCode 229)', () => {
            const event = new dom.window.KeyboardEvent('keydown', {
                keyCode: 229,
                bubbles: true,
                cancelable: true,
            });
            const stopSpy = vitest_1.vi.spyOn(event, 'stopPropagation');
            const manager = {};
            const result = handler.handleSpecialKeys(event, 'terminal-1', manager);
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(stopSpy).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Copy (Ctrl+C / Cmd+C)', () => {
        (0, vitest_1.it)('should copy when terminal has selection', () => {
            const mockTerminal = {
                terminal: { hasSelection: vitest_1.vi.fn().mockReturnValue(true) },
            };
            mockDeps.getTerminalInstance.mockReturnValue(mockTerminal);
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'c',
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
            });
            const preventSpy = vitest_1.vi.spyOn(event, 'preventDefault');
            const stopSpy = vitest_1.vi.spyOn(event, 'stopPropagation');
            const manager = {};
            const result = handler.handleSpecialKeys(event, 'terminal-1', manager);
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(preventSpy).toHaveBeenCalled();
            (0, vitest_1.expect)(stopSpy).toHaveBeenCalled();
            (0, vitest_1.expect)(mockDeps.handleTerminalCopy).toHaveBeenCalledWith(manager);
        });
        (0, vitest_1.it)('should send interrupt on Ctrl+C without selection', () => {
            const mockTerminal = {
                terminal: { hasSelection: vitest_1.vi.fn().mockReturnValue(false) },
            };
            mockDeps.getTerminalInstance.mockReturnValue(mockTerminal);
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'c',
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
            });
            const manager = {};
            const result = handler.handleSpecialKeys(event, 'terminal-1', manager);
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(mockDeps.emitTerminalInteractionEvent).toHaveBeenCalledWith('interrupt', 'terminal-1', undefined, manager);
        });
        (0, vitest_1.it)('should not send interrupt on Cmd+C (macOS) without selection', () => {
            const mockTerminal = {
                terminal: { hasSelection: vitest_1.vi.fn().mockReturnValue(false) },
            };
            mockDeps.getTerminalInstance.mockReturnValue(mockTerminal);
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'c',
                metaKey: true,
                bubbles: true,
                cancelable: true,
            });
            const manager = {};
            const result = handler.handleSpecialKeys(event, 'terminal-1', manager);
            (0, vitest_1.expect)(result).toBe(false);
            (0, vitest_1.expect)(mockDeps.emitTerminalInteractionEvent).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Paste handling', () => {
        (0, vitest_1.it)('should not intercept Ctrl+V (let paste event handler process)', () => {
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'v',
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
            });
            const manager = {};
            const result = handler.handleSpecialKeys(event, 'terminal-1', manager);
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should handle Shift+Insert paste', () => {
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'Insert',
                shiftKey: true,
                bubbles: true,
                cancelable: true,
            });
            const preventSpy = vitest_1.vi.spyOn(event, 'preventDefault');
            const stopSpy = vitest_1.vi.spyOn(event, 'stopPropagation');
            const manager = {};
            const result = handler.handleSpecialKeys(event, 'terminal-1', manager);
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(preventSpy).toHaveBeenCalled();
            (0, vitest_1.expect)(stopSpy).toHaveBeenCalled();
            (0, vitest_1.expect)(mockDeps.handleTerminalPaste).toHaveBeenCalledWith(manager);
        });
    });
    (0, vitest_1.describe)('Ctrl+Insert copy', () => {
        (0, vitest_1.it)('should copy on Ctrl+Insert when terminal has selection', () => {
            const mockTerminal = {
                terminal: { hasSelection: vitest_1.vi.fn().mockReturnValue(true) },
            };
            mockDeps.getTerminalInstance.mockReturnValue(mockTerminal);
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'Insert',
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
            });
            const preventSpy = vitest_1.vi.spyOn(event, 'preventDefault');
            const manager = {};
            const result = handler.handleSpecialKeys(event, 'terminal-1', manager);
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(preventSpy).toHaveBeenCalled();
            (0, vitest_1.expect)(mockDeps.handleTerminalCopy).toHaveBeenCalledWith(manager);
        });
    });
    (0, vitest_1.describe)('Multiline input (Shift/Alt/Cmd+Enter)', () => {
        (0, vitest_1.it)('should send newline on Shift+Enter', () => {
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'Enter',
                shiftKey: true,
                bubbles: true,
                cancelable: true,
            });
            const preventSpy = vitest_1.vi.spyOn(event, 'preventDefault');
            const stopSpy = vitest_1.vi.spyOn(event, 'stopPropagation');
            const manager = {};
            const result = handler.handleSpecialKeys(event, 'terminal-1', manager);
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(preventSpy).toHaveBeenCalled();
            (0, vitest_1.expect)(stopSpy).toHaveBeenCalled();
            (0, vitest_1.expect)(mockDeps.queueInputData).toHaveBeenCalledWith('terminal-1', '\n', true);
        });
        (0, vitest_1.it)('should send newline on Alt+Enter', () => {
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'Enter',
                altKey: true,
                bubbles: true,
                cancelable: true,
            });
            const manager = {};
            const result = handler.handleSpecialKeys(event, 'terminal-1', manager);
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(mockDeps.queueInputData).toHaveBeenCalledWith('terminal-1', '\n', true);
        });
    });
    (0, vitest_1.describe)('Unhandled keys', () => {
        (0, vitest_1.it)('should return false for unhandled keys', () => {
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'a',
                bubbles: true,
                cancelable: true,
            });
            const manager = {};
            const result = handler.handleSpecialKeys(event, 'terminal-1', manager);
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
});
//# sourceMappingURL=SpecialKeysHandler.test.js.map