"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const KeyboardShortcutSetupHandler_1 = require("../../../../../../../webview/managers/input/handlers/KeyboardShortcutSetupHandler");
(0, vitest_1.describe)('KeyboardShortcutSetupHandler', () => {
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
            eventRegistry: {
                register: vitest_1.vi.fn(),
                unregister: vitest_1.vi.fn(),
                dispose: vitest_1.vi.fn(),
            },
            isIMEComposing: vitest_1.vi.fn().mockReturnValue(false),
            resolveKeybinding: vitest_1.vi.fn().mockReturnValue(null),
            shouldSkipShell: vitest_1.vi.fn().mockReturnValue(false),
            handleVSCodeCommand: vitest_1.vi.fn(),
            handlePanelNavigationKey: vitest_1.vi.fn().mockReturnValue(false),
            handleSpecialKeys: vitest_1.vi.fn().mockReturnValue(false),
            getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('terminal-1'),
        };
        handler = new KeyboardShortcutSetupHandler_1.KeyboardShortcutSetupHandler(mockDeps);
    });
    (0, vitest_1.afterEach)(() => {
        handler.dispose();
        vitest_1.vi.restoreAllMocks();
        vitest_1.vi.unstubAllGlobals();
        dom.window.close();
    });
    (0, vitest_1.describe)('setupKeyboardShortcuts', () => {
        (0, vitest_1.it)('should register keyboard-shortcuts event on document', () => {
            const mockManager = {};
            handler.setupKeyboardShortcuts(mockManager);
            (0, vitest_1.expect)(mockDeps.eventRegistry.register).toHaveBeenCalledWith('keyboard-shortcuts', dom.window.document, 'keydown', vitest_1.expect.any(Function));
        });
        (0, vitest_1.it)('should log setup completion', () => {
            const mockManager = {};
            handler.setupKeyboardShortcuts(mockManager);
            (0, vitest_1.expect)(mockDeps.logger).toHaveBeenCalledWith(vitest_1.expect.stringContaining('keyboard shortcuts'));
        });
        (0, vitest_1.it)('should delegate to panel navigation handler first', () => {
            const mockManager = {};
            mockDeps.handlePanelNavigationKey.mockReturnValue(true);
            handler.setupKeyboardShortcuts(mockManager);
            // Get the registered handler
            const registerCall = mockDeps.eventRegistry.register.mock
                .calls[0];
            const shortcutHandler = registerCall[3];
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'p',
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
            });
            shortcutHandler(event);
            (0, vitest_1.expect)(mockDeps.handlePanelNavigationKey).toHaveBeenCalledWith(event);
            // Should not proceed to IME check or keybinding resolution
            (0, vitest_1.expect)(mockDeps.isIMEComposing).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should block shortcuts during IME composition', () => {
            const mockManager = {};
            mockDeps.isIMEComposing.mockReturnValue(true);
            handler.setupKeyboardShortcuts(mockManager);
            const registerCall = mockDeps.eventRegistry.register.mock
                .calls[0];
            const shortcutHandler = registerCall[3];
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'a',
                bubbles: true,
                cancelable: true,
            });
            shortcutHandler(event);
            (0, vitest_1.expect)(mockDeps.isIMEComposing).toHaveBeenCalled();
            (0, vitest_1.expect)(mockDeps.resolveKeybinding).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle KEY_IN_COMPOSITION keycode 229', () => {
            const mockManager = {};
            handler.setupKeyboardShortcuts(mockManager);
            const registerCall = mockDeps.eventRegistry.register.mock
                .calls[0];
            const shortcutHandler = registerCall[3];
            const event = new dom.window.KeyboardEvent('keydown', {
                keyCode: 229,
                bubbles: true,
                cancelable: true,
            });
            const stopSpy = vitest_1.vi.spyOn(event, 'stopPropagation');
            shortcutHandler(event);
            (0, vitest_1.expect)(stopSpy).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should dispatch VS Code command when keybinding resolves and should skip shell', () => {
            const mockManager = {};
            mockDeps.resolveKeybinding.mockReturnValue('workbench.action.terminal.new');
            mockDeps.shouldSkipShell.mockReturnValue(true);
            handler.setupKeyboardShortcuts(mockManager);
            const registerCall = mockDeps.eventRegistry.register.mock
                .calls[0];
            const shortcutHandler = registerCall[3];
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'n',
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
            });
            const preventSpy = vitest_1.vi.spyOn(event, 'preventDefault');
            const stopSpy = vitest_1.vi.spyOn(event, 'stopPropagation');
            shortcutHandler(event);
            (0, vitest_1.expect)(preventSpy).toHaveBeenCalled();
            (0, vitest_1.expect)(stopSpy).toHaveBeenCalled();
            (0, vitest_1.expect)(mockDeps.handleVSCodeCommand).toHaveBeenCalledWith('workbench.action.terminal.new', mockManager);
        });
        (0, vitest_1.it)('should fall through to legacy shortcuts when no VS Code command matches', () => {
            const mockManager = {
                profileManager: { showProfileSelector: vitest_1.vi.fn() },
            };
            handler.setupKeyboardShortcuts(mockManager);
            const registerCall = mockDeps.eventRegistry.register.mock
                .calls[0];
            const shortcutHandler = registerCall[3];
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'Escape',
                bubbles: true,
                cancelable: true,
            });
            shortcutHandler(event);
            // Legacy shortcuts should be processed (Escape clears notifications)
            (0, vitest_1.expect)(mockDeps.logger).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Escape'));
        });
    });
    (0, vitest_1.describe)('handleLegacyShortcuts', () => {
        (0, vitest_1.it)('should clear notifications on Escape', () => {
            const mockManager = {};
            const notification = dom.window.document.createElement('div');
            notification.className = 'notification';
            dom.window.document.body.appendChild(notification);
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'Escape',
                bubbles: true,
                cancelable: true,
            });
            handler.handleLegacyShortcuts(event, mockManager);
            (0, vitest_1.expect)(dom.window.document.querySelectorAll('.notification').length).toBe(0);
        });
        (0, vitest_1.it)('should toggle debug panel on Ctrl+Shift+D', () => {
            const toggleDebugPanel = vitest_1.vi.fn();
            const mockManager = { toggleDebugPanel };
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'D',
                ctrlKey: true,
                shiftKey: true,
                bubbles: true,
                cancelable: true,
            });
            handler.handleLegacyShortcuts(event, mockManager);
            (0, vitest_1.expect)(toggleDebugPanel).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should show profile selector on Ctrl+Shift+P', () => {
            const showProfileSelector = vitest_1.vi.fn();
            const mockManager = {
                profileManager: { showProfileSelector },
            };
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'P',
                ctrlKey: true,
                shiftKey: true,
                bubbles: true,
                cancelable: true,
            });
            handler.handleLegacyShortcuts(event, mockManager);
            (0, vitest_1.expect)(showProfileSelector).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should create terminal with default profile on Ctrl+Alt+T', () => {
            const createTerminalWithDefaultProfile = vitest_1.vi.fn().mockResolvedValue(undefined);
            const mockManager = {
                profileManager: { createTerminalWithDefaultProfile },
            };
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 't',
                ctrlKey: true,
                altKey: true,
                bubbles: true,
                cancelable: true,
            });
            handler.handleLegacyShortcuts(event, mockManager);
            (0, vitest_1.expect)(createTerminalWithDefaultProfile).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should switch profile by index on Ctrl+Shift+1-5', () => {
            const switchToProfileByIndex = vitest_1.vi.fn().mockResolvedValue(undefined);
            const mockManager = {
                profileManager: { switchToProfileByIndex },
            };
            const event = new dom.window.KeyboardEvent('keydown', {
                key: '3',
                ctrlKey: true,
                shiftKey: true,
                bubbles: true,
                cancelable: true,
            });
            handler.handleLegacyShortcuts(event, mockManager);
            (0, vitest_1.expect)(switchToProfileByIndex).toHaveBeenCalledWith(2); // index = key - 1
        });
        (0, vitest_1.it)('should not crash when profileManager is missing', () => {
            const mockManager = {};
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'P',
                ctrlKey: true,
                shiftKey: true,
                bubbles: true,
                cancelable: true,
            });
            (0, vitest_1.expect)(() => handler.handleLegacyShortcuts(event, mockManager)).not.toThrow();
        });
    });
    (0, vitest_1.describe)('Agent interaction mode', () => {
        (0, vitest_1.it)('should default to agent interaction mode disabled', () => {
            (0, vitest_1.expect)(handler.isAgentInteractionMode()).toBe(false);
        });
        (0, vitest_1.it)('should always force disable agent interaction mode (VS Code standard)', () => {
            handler.setAgentInteractionMode(true);
            (0, vitest_1.expect)(handler.isAgentInteractionMode()).toBe(false);
        });
        (0, vitest_1.it)('should not call unregister when mode does not change (already false)', () => {
            // agentInteractionMode starts as false, actualEnabled is always false
            // so the condition `this.agentInteractionMode !== actualEnabled` is false
            handler.setAgentInteractionMode(true);
            (0, vitest_1.expect)(mockDeps.eventRegistry.unregister).not.toHaveBeenCalledWith('agent-arrow-keys');
        });
    });
    (0, vitest_1.describe)('setupGlobalKeyboardListener', () => {
        (0, vitest_1.it)('should register global-keyboard event on document', () => {
            handler.setupGlobalKeyboardListener();
            (0, vitest_1.expect)(mockDeps.eventRegistry.register).toHaveBeenCalledWith('global-keyboard', dom.window.document, 'keydown', vitest_1.expect.any(Function), true);
        });
        (0, vitest_1.it)('should delegate to handleSpecialKeys for active terminal', () => {
            mockDeps.handleSpecialKeys.mockReturnValue(true);
            handler.setupGlobalKeyboardListener();
            const registerCall = mockDeps.eventRegistry.register.mock.calls.find((call) => call[0] === 'global-keyboard');
            const globalHandler = registerCall[3];
            // Use a key that does NOT trigger the Ctrl+Shift+D early return guard
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'c',
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
            });
            // setupGlobalKeyboardListener needs a coordinator reference set via setupKeyboardShortcuts
            const mockManager = {};
            handler.setupKeyboardShortcuts(mockManager);
            globalHandler(event);
            (0, vitest_1.expect)(mockDeps.handleSpecialKeys).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should skip special keys when no active terminal', () => {
            mockDeps.getActiveTerminalId.mockReturnValue(null);
            handler.setupGlobalKeyboardListener();
            const registerCall = mockDeps.eventRegistry.register.mock.calls.find((call) => call[0] === 'global-keyboard');
            const globalHandler = registerCall[3];
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'c',
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
            });
            globalHandler(event);
            (0, vitest_1.expect)(mockDeps.handleSpecialKeys).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('setupAgentArrowKeyHandler', () => {
        (0, vitest_1.it)('should register agent-arrow-keys event on document', () => {
            handler.setupAgentArrowKeyHandler();
            (0, vitest_1.expect)(mockDeps.eventRegistry.register).toHaveBeenCalledWith('agent-arrow-keys', dom.window.document, 'keydown', vitest_1.expect.any(Function), true);
        });
        (0, vitest_1.it)('should return early during IME composition', () => {
            mockDeps.isIMEComposing.mockReturnValue(true);
            handler.setupAgentArrowKeyHandler();
            const registerCall = mockDeps.eventRegistry.register.mock.calls.find((call) => call[0] === 'agent-arrow-keys');
            const arrowHandler = registerCall[3];
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'ArrowUp',
                bubbles: true,
                cancelable: true,
            });
            arrowHandler(event);
            (0, vitest_1.expect)(mockDeps.logger).toHaveBeenCalledWith(vitest_1.expect.stringContaining('IME composition'));
        });
        (0, vitest_1.it)('should not log arrow keys when agent mode is disabled', () => {
            handler.setupAgentArrowKeyHandler();
            const registerCall = mockDeps.eventRegistry.register.mock.calls.find((call) => call[0] === 'agent-arrow-keys');
            const arrowHandler = registerCall[3];
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'ArrowUp',
                bubbles: true,
                cancelable: true,
            });
            arrowHandler(event);
            // Should not log about agent mode since it's disabled
            (0, vitest_1.expect)(mockDeps.logger).not.toHaveBeenCalledWith(vitest_1.expect.stringContaining('Arrow key'));
        });
    });
    (0, vitest_1.describe)('dispose', () => {
        (0, vitest_1.it)('should reset agent interaction mode', () => {
            handler.dispose();
            (0, vitest_1.expect)(handler.isAgentInteractionMode()).toBe(false);
        });
    });
});
//# sourceMappingURL=KeyboardShortcutSetupHandler.test.js.map