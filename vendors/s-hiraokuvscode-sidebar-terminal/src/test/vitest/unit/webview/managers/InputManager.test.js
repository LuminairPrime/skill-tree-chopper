"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const InputManager_1 = require("../../../../../webview/managers/InputManager");
// Mock dependencies
vitest_1.vi.mock('../../../../../webview/managers/input/handlers/IMEHandler', () => ({
    IMEHandler: class {
        constructor() {
            this.initialize = vitest_1.vi.fn();
            this.dispose = vitest_1.vi.fn();
            this.clearPendingInputEvents = vitest_1.vi.fn();
            this.isIMEComposing = vitest_1.vi.fn().mockReturnValue(false);
        }
    },
}));
vitest_1.vi.mock('../../../../../webview/managers/input/services/InputStateManager', () => ({
    InputStateManager: class {
        constructor() {
            this.dispose = vitest_1.vi.fn();
            this.updateAltClickState = vitest_1.vi.fn();
            this.updateIMEState = vitest_1.vi.fn();
            this.getStateSection = vitest_1.vi.fn().mockReturnValue({ isActive: false });
        }
    },
}));
vitest_1.vi.mock('../../../../../webview/managers/input/services/InputEventService', () => ({
    InputEventService: class {
        constructor() {
            this.dispose = vitest_1.vi.fn();
        }
    },
}));
vitest_1.vi.mock('../../../../../webview/managers/input/services/KeybindingService', () => ({
    KeybindingService: class {
        constructor() {
            this.updateSettings = vitest_1.vi.fn();
            this.shouldSkipShell = vitest_1.vi.fn().mockReturnValue(false);
            this.resolveKeybinding = vitest_1.vi.fn().mockReturnValue(null);
        }
    },
}));
vitest_1.vi.mock('../../../../../webview/managers/input/services/TerminalOperationsService', () => ({
    TerminalOperationsService: class {
        constructor() {
            this.scrollTerminal = vitest_1.vi.fn();
            this.clearTerminal = vitest_1.vi.fn();
            this.deleteWordLeft = vitest_1.vi.fn();
            this.deleteWordRight = vitest_1.vi.fn();
            this.moveToLineStart = vitest_1.vi.fn();
            this.moveToLineEnd = vitest_1.vi.fn();
            this.sizeToContent = vitest_1.vi.fn();
        }
    },
    ScrollDirection: {
        UP: 'up',
        DOWN: 'down',
    },
}));
// Mock logger
vitest_1.vi.mock('../../../../../utils/logger', () => ({
    webview: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('InputManager', () => {
    let dom;
    let manager;
    let mockCoordinator;
    let mockTerminal;
    (0, vitest_1.beforeEach)(() => {
        // Setup DOM environment
        dom = new jsdom_1.JSDOM('<!DOCTYPE html><html><body><div id="container"></div></body></html>', {
            url: 'http://localhost',
            pretendToBeVisual: true,
        });
        vitest_1.vi.stubGlobal('window', dom.window);
        vitest_1.vi.stubGlobal('document', dom.window.document);
        vitest_1.vi.stubGlobal('navigator', dom.window.navigator);
        vitest_1.vi.stubGlobal('performance', dom.window.performance);
        vitest_1.vi.useFakeTimers();
        // Mock terminal
        mockTerminal = {
            write: vitest_1.vi.fn(),
            focus: vitest_1.vi.fn(),
            clear: vitest_1.vi.fn(),
            hasSelection: vitest_1.vi.fn().mockReturnValue(false),
            getSelection: vitest_1.vi.fn().mockReturnValue(''),
            clearSelection: vitest_1.vi.fn(),
            onKey: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
            onData: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
            textarea: {},
            onFocus: vitest_1.vi.fn(),
            onBlur: vitest_1.vi.fn(),
        };
        // Mock coordinator
        mockCoordinator = {
            getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('terminal-1'),
            getTerminalInstance: vitest_1.vi.fn().mockReturnValue({
                terminal: mockTerminal,
                id: 'terminal-1',
                searchAddon: { findNext: vitest_1.vi.fn(), findPrevious: vitest_1.vi.fn() },
            }),
            postMessageToExtension: vitest_1.vi.fn().mockResolvedValue(undefined),
            getMessageManager: vitest_1.vi.fn().mockReturnValue({
                sendInput: vitest_1.vi.fn(),
            }),
        };
        manager = new InputManager_1.InputManager(mockCoordinator);
    });
    (0, vitest_1.afterEach)(() => {
        manager.dispose();
        vitest_1.vi.clearAllMocks();
        vitest_1.vi.useRealTimers();
        vitest_1.vi.restoreAllMocks();
        vitest_1.vi.unstubAllGlobals();
        dom.window.close();
    });
    (0, vitest_1.describe)('Initialization', () => {
        (0, vitest_1.it)('should initialize successfully', () => {
            manager.initialize();
            (0, vitest_1.expect)(manager).toBeDefined();
        });
        (0, vitest_1.it)('should initialize with default states', () => {
            (0, vitest_1.expect)(manager.isAgentInteractionMode()).toBe(false);
            (0, vitest_1.expect)(manager.isIMEComposing()).toBe(false);
        });
    });
    (0, vitest_1.describe)('Alt+Click Handling', () => {
        (0, vitest_1.it)('should determine if Alt+Click is enabled based on settings', () => {
            (0, vitest_1.expect)(manager.isVSCodeAltClickEnabled({ altClickMovesCursor: true, multiCursorModifier: 'alt' })).toBe(true);
            (0, vitest_1.expect)(manager.isVSCodeAltClickEnabled({ altClickMovesCursor: false })).toBe(false);
            (0, vitest_1.expect)(manager.isVSCodeAltClickEnabled({
                altClickMovesCursor: true,
                multiCursorModifier: 'ctrlCmd',
            })).toBe(false);
        });
        (0, vitest_1.it)('should update state when settings change', () => {
            manager.updateAltClickSettings({ altClickMovesCursor: true, multiCursorModifier: 'alt' });
            (0, vitest_1.expect)(manager.getAltClickState().isVSCodeAltClickEnabled).toBe(true);
        });
    });
    (0, vitest_1.describe)('Alt+Click Feedback', () => {
        (0, vitest_1.it)('should register alt key listeners', () => {
            const spy = vitest_1.vi.spyOn(dom.window.document, 'addEventListener');
            manager.setupAltKeyVisualFeedback();
            (0, vitest_1.expect)(spy).toHaveBeenCalledWith('keydown', vitest_1.expect.any(Function), undefined);
            (0, vitest_1.expect)(spy).toHaveBeenCalledWith('keyup', vitest_1.expect.any(Function), undefined);
        });
        (0, vitest_1.it)('should update cursor styles when alt is pressed', () => {
            // Setup DOM
            const terminal = dom.window.document.createElement('div');
            terminal.className = 'xterm';
            const container = dom.window.document.createElement('div');
            container.className = 'terminal-container';
            container.appendChild(terminal);
            dom.window.document.body.appendChild(container);
            manager.setupAltKeyVisualFeedback();
            // Simulate Alt press
            const keydown = new dom.window.KeyboardEvent('keydown', { altKey: true });
            dom.window.document.dispatchEvent(keydown);
            // By default disabled, so cursor should be empty or default
            (0, vitest_1.expect)(terminal.style.cursor).toBe('');
            // Enable setting
            manager.updateAltClickSettings({ altClickMovesCursor: true, multiCursorModifier: 'alt' });
            // Press Alt again
            dom.window.document.dispatchEvent(keydown);
            (0, vitest_1.expect)(terminal.style.cursor).toBe('default');
            // Release Alt
            const keyup = new dom.window.KeyboardEvent('keyup', { altKey: false });
            dom.window.document.dispatchEvent(keyup);
            (0, vitest_1.expect)(terminal.style.cursor).toBe('');
        });
    });
    (0, vitest_1.describe)('Keyboard Shortcuts', () => {
        (0, vitest_1.it)('should setup global keyboard listener', () => {
            const spy = vitest_1.vi.spyOn(dom.window.document, 'addEventListener');
            manager.initialize();
            (0, vitest_1.expect)(spy).toHaveBeenCalledWith('keydown', vitest_1.expect.any(Function), true);
        });
        (0, vitest_1.it)('should enter panel navigation mode on Ctrl+P', () => {
            // Given: initialized manager with keyboard shortcuts and panel navigation enabled
            manager.initialize();
            manager.setPanelNavigationEnabled(true);
            manager.setupKeyboardShortcuts(mockCoordinator);
            // When: press Ctrl+P
            const enterModeEvent = new dom.window.KeyboardEvent('keydown', {
                key: 'p',
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
            });
            vitest_1.vi.spyOn(enterModeEvent, 'preventDefault');
            vitest_1.vi.spyOn(enterModeEvent, 'stopPropagation');
            dom.window.document.dispatchEvent(enterModeEvent);
            // Then: event is intercepted
            (0, vitest_1.expect)(enterModeEvent.preventDefault).toHaveBeenCalled();
            (0, vitest_1.expect)(enterModeEvent.stopPropagation).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should navigate panels while in panel navigation mode', () => {
            // Given: manager in panel navigation mode
            manager.initialize();
            manager.setPanelNavigationEnabled(true);
            manager.setupKeyboardShortcuts(mockCoordinator);
            const enterEvent = new dom.window.KeyboardEvent('keydown', {
                key: 'p',
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
            });
            dom.window.document.dispatchEvent(enterEvent);
            mockCoordinator.postMessageToExtension.mockClear();
            // When: press ArrowRight
            const moveEvent = new dom.window.KeyboardEvent('keydown', {
                key: 'ArrowRight',
                bubbles: true,
                cancelable: true,
            });
            vitest_1.vi.spyOn(moveEvent, 'preventDefault');
            vitest_1.vi.spyOn(moveEvent, 'stopPropagation');
            dom.window.document.dispatchEvent(moveEvent);
            // Then: navigation event is sent
            (0, vitest_1.expect)(moveEvent.preventDefault).toHaveBeenCalled();
            (0, vitest_1.expect)(moveEvent.stopPropagation).toHaveBeenCalled();
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'terminalInteraction',
                type: 'switch-next',
                terminalId: 'terminal-1',
            }));
        });
        (0, vitest_1.it)('should exit panel navigation mode on Escape', () => {
            // Given: manager in panel navigation mode
            manager.initialize();
            manager.setPanelNavigationEnabled(true);
            manager.setupKeyboardShortcuts(mockCoordinator);
            dom.window.document.dispatchEvent(new dom.window.KeyboardEvent('keydown', {
                key: 'p',
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
            }));
            mockCoordinator.postMessageToExtension.mockClear();
            // When: press Escape
            const escapeEvent = new dom.window.KeyboardEvent('keydown', {
                key: 'Escape',
                bubbles: true,
                cancelable: true,
            });
            vitest_1.vi.spyOn(escapeEvent, 'preventDefault');
            vitest_1.vi.spyOn(escapeEvent, 'stopPropagation');
            dom.window.document.dispatchEvent(escapeEvent);
            // Then: mode exits and navigation keys no longer work
            (0, vitest_1.expect)(escapeEvent.preventDefault).toHaveBeenCalled();
            (0, vitest_1.expect)(escapeEvent.stopPropagation).toHaveBeenCalled();
            dom.window.document.dispatchEvent(new dom.window.KeyboardEvent('keydown', {
                key: 'ArrowRight',
                bubbles: true,
                cancelable: true,
            }));
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should exit panel navigation mode on Ctrl+P when already in mode', () => {
            // Given: manager in panel navigation mode
            manager.initialize();
            manager.setPanelNavigationEnabled(true);
            manager.setupKeyboardShortcuts(mockCoordinator);
            dom.window.document.dispatchEvent(new dom.window.KeyboardEvent('keydown', {
                key: 'p',
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
            }));
            // When: press Ctrl+P again to toggle off
            const exitEvent = new dom.window.KeyboardEvent('keydown', {
                key: 'p',
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
            });
            vitest_1.vi.spyOn(exitEvent, 'preventDefault');
            vitest_1.vi.spyOn(exitEvent, 'stopPropagation');
            dom.window.document.dispatchEvent(exitEvent);
            // Then: event is intercepted (mode toggled off)
            (0, vitest_1.expect)(exitEvent.preventDefault).toHaveBeenCalled();
            (0, vitest_1.expect)(exitEvent.stopPropagation).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should ignore non-navigation keys in panel navigation mode', () => {
            manager.initialize();
            manager.setPanelNavigationEnabled(true);
            manager.setupKeyboardShortcuts(mockCoordinator);
            // Enter panel navigation mode
            const enterModeEvent = new dom.window.KeyboardEvent('keydown', {
                key: 'p',
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
            });
            dom.window.document.dispatchEvent(enterModeEvent);
            mockCoordinator.postMessageToExtension.mockClear();
            // Send non-navigation keys — should be blocked and NOT trigger terminal switch
            const nonNavKeys = ['a', 'z', '1', 'Enter', 'Tab', ' '];
            for (const key of nonNavKeys) {
                const event = new dom.window.KeyboardEvent('keydown', {
                    key,
                    bubbles: true,
                    cancelable: true,
                });
                vitest_1.vi.spyOn(event, 'preventDefault');
                dom.window.document.dispatchEvent(event);
                (0, vitest_1.expect)(event.preventDefault).toHaveBeenCalled();
            }
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).not.toHaveBeenCalled();
        });
        vitest_1.it.each([
            ['r', 'create-terminal'],
            ['d', 'create-terminal'],
            ['x', 'kill-terminal'],
        ])('should handle %s key in panel navigation mode and emit %s', (key, expectedType) => {
            manager.initialize();
            manager.setPanelNavigationEnabled(true);
            manager.setupKeyboardShortcuts(mockCoordinator);
            // Enter panel navigation mode
            dom.window.document.dispatchEvent(new dom.window.KeyboardEvent('keydown', {
                key: 'p',
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
            }));
            mockCoordinator.postMessageToExtension.mockClear();
            const keyEvent = new dom.window.KeyboardEvent('keydown', {
                key,
                bubbles: true,
                cancelable: true,
            });
            vitest_1.vi.spyOn(keyEvent, 'preventDefault');
            vitest_1.vi.spyOn(keyEvent, 'stopPropagation');
            dom.window.document.dispatchEvent(keyEvent);
            (0, vitest_1.expect)(keyEvent.preventDefault).toHaveBeenCalled();
            (0, vitest_1.expect)(keyEvent.stopPropagation).toHaveBeenCalled();
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'terminalInteraction',
                type: expectedType,
            }));
        });
        (0, vitest_1.it)('should allow r/d/x keys to pass to terminal when panel mode is OFF', () => {
            manager.initialize();
            manager.setPanelNavigationEnabled(true);
            manager.setupKeyboardShortcuts(mockCoordinator);
            // Do NOT enter panel navigation mode
            // Press r/d/x keys — they should NOT be intercepted
            for (const key of ['r', 'd', 'x']) {
                const event = new dom.window.KeyboardEvent('keydown', {
                    key,
                    bubbles: true,
                    cancelable: true,
                });
                vitest_1.vi.spyOn(event, 'preventDefault');
                vitest_1.vi.spyOn(event, 'stopPropagation');
                dom.window.document.dispatchEvent(event);
                // Should NOT be blocked (these are normal character keys)
                (0, vitest_1.expect)(event.preventDefault).not.toHaveBeenCalled();
                (0, vitest_1.expect)(event.stopPropagation).not.toHaveBeenCalled();
            }
        });
        (0, vitest_1.it)('should show updated indicator text with r/d and x hints', () => {
            manager.initialize();
            manager.setPanelNavigationMode(true);
            const indicator = dom.window.document.querySelector('.panel-navigation-indicator');
            (0, vitest_1.expect)(indicator).not.toBeNull();
            (0, vitest_1.expect)(indicator?.textContent).toContain('r/d:new');
            (0, vitest_1.expect)(indicator?.textContent).toContain('x:close');
        });
        (0, vitest_1.it)('should not send navigation events when no active terminal', () => {
            manager.initialize();
            manager.setPanelNavigationEnabled(true);
            manager.setupKeyboardShortcuts(mockCoordinator);
            // Set no active terminal
            mockCoordinator.getActiveTerminalId.mockReturnValue(null);
            // Enter panel navigation mode
            const enterModeEvent = new dom.window.KeyboardEvent('keydown', {
                key: 'p',
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
            });
            dom.window.document.dispatchEvent(enterModeEvent);
            mockCoordinator.postMessageToExtension.mockClear();
            // Try navigation
            const moveEvent = new dom.window.KeyboardEvent('keydown', {
                key: 'ArrowRight',
                bubbles: true,
                cancelable: true,
            });
            dom.window.document.dispatchEvent(moveEvent);
            // Should NOT call postMessageToExtension since no active terminal
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should fallback to DOM active terminal when active terminal id is temporarily null', () => {
            manager.initialize();
            manager.setPanelNavigationEnabled(true);
            manager.setupKeyboardShortcuts(mockCoordinator);
            const activeContainer = dom.window.document.createElement('div');
            activeContainer.className = 'terminal-container active';
            activeContainer.setAttribute('data-terminal-id', 'terminal-dom');
            dom.window.document.body.appendChild(activeContainer);
            mockCoordinator.getActiveTerminalId.mockReturnValue(null);
            const enterModeEvent = new dom.window.KeyboardEvent('keydown', {
                key: 'p',
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
            });
            dom.window.document.dispatchEvent(enterModeEvent);
            mockCoordinator.postMessageToExtension.mockClear();
            const moveEvent = new dom.window.KeyboardEvent('keydown', {
                key: 'ArrowRight',
                bubbles: true,
                cancelable: true,
            });
            dom.window.document.dispatchEvent(moveEvent);
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'terminalInteraction',
                type: 'switch-next',
                terminalId: 'terminal-dom',
            }));
        });
        (0, vitest_1.it)('should not enter panel navigation mode with Ctrl+Shift+P or Ctrl+Alt+P', () => {
            manager.initialize();
            manager.setPanelNavigationEnabled(true);
            manager.setupKeyboardShortcuts(mockCoordinator);
            // Ctrl+Shift+P should NOT enter navigation mode
            const ctrlShiftP = new dom.window.KeyboardEvent('keydown', {
                key: 'p',
                ctrlKey: true,
                shiftKey: true,
                bubbles: true,
                cancelable: true,
            });
            dom.window.document.dispatchEvent(ctrlShiftP);
            // Ctrl+Alt+P should NOT enter navigation mode
            const ctrlAltP = new dom.window.KeyboardEvent('keydown', {
                key: 'p',
                ctrlKey: true,
                altKey: true,
                bubbles: true,
                cancelable: true,
            });
            dom.window.document.dispatchEvent(ctrlAltP);
            // Try arrow key — should NOT be intercepted (not in navigation mode)
            const moveEvent = new dom.window.KeyboardEvent('keydown', {
                key: 'ArrowRight',
                bubbles: true,
                cancelable: true,
            });
            dom.window.document.dispatchEvent(moveEvent);
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should not enter panel navigation mode with Cmd+P on macOS', () => {
            manager.initialize();
            manager.setPanelNavigationEnabled(true);
            manager.setupKeyboardShortcuts(mockCoordinator);
            const enterModeEvent = new dom.window.KeyboardEvent('keydown', {
                key: 'p',
                metaKey: true,
                bubbles: true,
                cancelable: true,
            });
            vitest_1.vi.spyOn(enterModeEvent, 'preventDefault');
            vitest_1.vi.spyOn(enterModeEvent, 'stopPropagation');
            dom.window.document.dispatchEvent(enterModeEvent);
            (0, vitest_1.expect)(enterModeEvent.preventDefault).not.toHaveBeenCalled();
            (0, vitest_1.expect)(enterModeEvent.stopPropagation).not.toHaveBeenCalled();
            mockCoordinator.postMessageToExtension.mockClear();
            const moveEvent = new dom.window.KeyboardEvent('keydown', {
                key: 'ArrowRight',
                bubbles: true,
                cancelable: true,
            });
            dom.window.document.dispatchEvent(moveEvent);
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should exit panel navigation mode on dispose', () => {
            manager.initialize();
            manager.setPanelNavigationEnabled(true);
            manager.setupKeyboardShortcuts(mockCoordinator);
            // Enter panel navigation mode
            const enterModeEvent = new dom.window.KeyboardEvent('keydown', {
                key: 'p',
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
            });
            dom.window.document.dispatchEvent(enterModeEvent);
            // Dispose manager
            manager.dispose();
            // Re-create manager and initialize
            manager = new InputManager_1.InputManager(mockCoordinator);
            manager.initialize();
            manager.setupKeyboardShortcuts(mockCoordinator);
            mockCoordinator.postMessageToExtension.mockClear();
            // Arrow key should NOT trigger navigation (mode was cleared)
            const moveEvent = new dom.window.KeyboardEvent('keydown', {
                key: 'ArrowRight',
                bubbles: true,
                cancelable: true,
            });
            dom.window.document.dispatchEvent(moveEvent);
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should map vim keys and arrow keys to terminal switch events in panel navigation mode', () => {
            manager.initialize();
            manager.setPanelNavigationEnabled(true);
            manager.setupKeyboardShortcuts(mockCoordinator);
            const enterModeEvent = new dom.window.KeyboardEvent('keydown', {
                key: 'p',
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
            });
            dom.window.document.dispatchEvent(enterModeEvent);
            mockCoordinator.postMessageToExtension.mockClear();
            const sendKey = (key) => {
                const event = new dom.window.KeyboardEvent('keydown', {
                    key,
                    bubbles: true,
                    cancelable: true,
                });
                dom.window.document.dispatchEvent(event);
            };
            sendKey('h');
            sendKey('k');
            sendKey('ArrowLeft');
            sendKey('ArrowUp');
            sendKey('j');
            sendKey('l');
            sendKey('ArrowRight');
            sendKey('ArrowDown');
            const interactionCalls = mockCoordinator.postMessageToExtension.mock.calls
                .map((call) => call[0])
                .filter((message) => message?.command === 'terminalInteraction');
            const previousCount = interactionCalls.filter((message) => message.type === 'switch-previous').length;
            const nextCount = interactionCalls.filter((message) => message.type === 'switch-next').length;
            (0, vitest_1.expect)(previousCount).toBe(4);
            (0, vitest_1.expect)(nextCount).toBe(4);
        });
        (0, vitest_1.it)('should allow panel navigation mode to be enabled externally', () => {
            manager.initialize();
            manager.setPanelNavigationEnabled(true);
            manager.setupKeyboardShortcuts(mockCoordinator);
            manager.setPanelNavigationMode(true);
            mockCoordinator.postMessageToExtension.mockClear();
            const moveEvent = new dom.window.KeyboardEvent('keydown', {
                key: 'ArrowRight',
                bubbles: true,
                cancelable: true,
            });
            dom.window.document.dispatchEvent(moveEvent);
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'terminalInteraction',
                type: 'switch-next',
                terminalId: 'terminal-1',
            }));
        });
        (0, vitest_1.it)('should show and hide panel navigation mode indicator', () => {
            manager.initialize();
            (0, vitest_1.expect)(dom.window.document.querySelector('.panel-navigation-indicator')).toBeNull();
            manager.setPanelNavigationMode(true);
            const indicator = dom.window.document.querySelector('.panel-navigation-indicator');
            (0, vitest_1.expect)(indicator).not.toBeNull();
            (0, vitest_1.expect)(indicator?.textContent).toContain('PANEL MODE');
            (0, vitest_1.expect)(indicator?.style.display).toBe('block');
            (0, vitest_1.expect)(dom.window.document.body.classList.contains('panel-navigation-mode')).toBe(true);
            manager.setPanelNavigationMode(false);
            (0, vitest_1.expect)(indicator?.style.display).toBe('none');
            (0, vitest_1.expect)(dom.window.document.body.classList.contains('panel-navigation-mode')).toBe(false);
        });
    });
    (0, vitest_1.describe)('Input Buffering & Flushing', () => {
        (0, vitest_1.it)('should buffer multiple characters and flush them after a delay', async () => {
            const sendInputSpy = mockCoordinator.getMessageManager().sendInput;
            // Use internal method access for testing
            manager.queueInputData('terminal-1', 'a', false);
            manager.queueInputData('terminal-1', 'b', false);
            // Should not be called yet
            (0, vitest_1.expect)(sendInputSpy).not.toHaveBeenCalled();
            // Advance timers
            vitest_1.vi.advanceTimersByTime(10);
            (0, vitest_1.expect)(sendInputSpy).toHaveBeenCalledWith('ab', 'terminal-1');
        });
        (0, vitest_1.it)('should flush immediately when Enter is pressed', () => {
            const sendInputSpy = mockCoordinator.getMessageManager().sendInput;
            manager.queueInputData('terminal-1', 'ls', false);
            manager.queueInputData('terminal-1', '\r', true);
            (0, vitest_1.expect)(sendInputSpy).toHaveBeenCalledWith('ls\r', 'terminal-1');
        });
    });
    (0, vitest_1.describe)('Special Keys Handling', () => {
        (0, vitest_1.it)('should handle Ctrl+C as interrupt when no selection', () => {
            const event = new dom.window.KeyboardEvent('keydown', {
                ctrlKey: true,
                key: 'c',
                keyCode: 67,
            });
            mockTerminal.hasSelection.mockReturnValue(false);
            const handled = manager.handleSpecialKeys(event, 'terminal-1', mockCoordinator);
            (0, vitest_1.expect)(handled).toBe(true);
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                type: 'interrupt',
            }));
        });
        (0, vitest_1.it)('should handle Ctrl+C as copy when selection exists', () => {
            const event = new dom.window.KeyboardEvent('keydown', {
                ctrlKey: true,
                key: 'c',
                keyCode: 67,
            });
            mockTerminal.hasSelection.mockReturnValue(true);
            mockTerminal.getSelection.mockReturnValue('selected text');
            const handled = manager.handleSpecialKeys(event, 'terminal-1', mockCoordinator);
            (0, vitest_1.expect)(handled).toBe(true);
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'copyToClipboard',
                text: 'selected text',
            }));
        });
        (0, vitest_1.it)('should handle Shift+Enter for multiline', () => {
            const event = new dom.window.KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });
            vitest_1.vi.spyOn(event, 'preventDefault');
            vitest_1.vi.spyOn(event, 'stopPropagation');
            const sendInputSpy = mockCoordinator.getMessageManager().sendInput;
            const result = manager.handleSpecialKeys(event, 'terminal-1', mockCoordinator);
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(event.preventDefault).toHaveBeenCalled();
            // Should send newline via queueInputData -> flushPendingInput -> sendInput
            vitest_1.vi.advanceTimersByTime(0);
            (0, vitest_1.expect)(sendInputSpy).toHaveBeenCalledWith('\n', 'terminal-1');
        });
        (0, vitest_1.it)('should block special keys during IME composition', () => {
            // Mock isIMEComposing to return true for this test
            manager.imeHandler.isIMEComposing.mockReturnValue(true);
            const event = new dom.window.KeyboardEvent('keydown', {
                ctrlKey: true,
                key: 'c',
            });
            const handled = manager.handleSpecialKeys(event, 'terminal-1', mockCoordinator);
            (0, vitest_1.expect)(handled).toBe(false); // blocked
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Input Queuing', () => {
        (0, vitest_1.it)('should queue and flush input via xterm handler', () => {
            const container = dom.window.document.createElement('div');
            const sendInputSpy = mockCoordinator.getMessageManager().sendInput;
            manager.addXtermClickHandler(mockTerminal, 'terminal-1', container, mockCoordinator);
            // Trigger onKey
            const onKeyHandler = mockTerminal.onKey.mock.calls[0][0];
            onKeyHandler({ key: 'a', domEvent: { key: 'a' } });
            // Should be queued, not sent immediately
            (0, vitest_1.expect)(sendInputSpy).not.toHaveBeenCalled();
            vitest_1.vi.advanceTimersByTime(0); // Flush queue
            (0, vitest_1.expect)(sendInputSpy).toHaveBeenCalledWith('a', 'terminal-1');
        });
        (0, vitest_1.it)('should flush immediate keys directly', () => {
            const container = dom.window.document.createElement('div');
            const sendInputSpy = mockCoordinator.getMessageManager().sendInput;
            manager.addXtermClickHandler(mockTerminal, 'terminal-1', container, mockCoordinator);
            const onKeyHandler = mockTerminal.onKey.mock.calls[0][0];
            // Enter is immediate
            onKeyHandler({ key: '\r', domEvent: { key: 'Enter' } });
            (0, vitest_1.expect)(sendInputSpy).toHaveBeenCalledWith('\r', 'terminal-1');
        });
    });
    (0, vitest_1.describe)('Keyboard Shortcut Interception', () => {
        (0, vitest_1.it)('should allow arrow keys to pass to shell (VS Code standard)', () => {
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'ArrowUp',
            });
            const intercepted = manager.shouldInterceptKeyForVSCode(event, mockTerminal, mockCoordinator);
            (0, vitest_1.expect)(intercepted).toBe(false); // Pass to shell
        });
        (0, vitest_1.it)('should intercept Cmd+K on macOS for clear', () => {
            // Mock macOS
            vitest_1.vi.stubGlobal('navigator', { ...dom.window.navigator, userAgent: 'Macintosh' });
            const event = new dom.window.KeyboardEvent('keydown', {
                metaKey: true,
                key: 'k',
            });
            const intercepted = manager.shouldInterceptKeyForVSCode(event, mockTerminal, mockCoordinator);
            (0, vitest_1.expect)(intercepted).toBe(true);
        });
    });
    (0, vitest_1.describe)('Terminal Handler Cleanup', () => {
        (0, vitest_1.it)('should remove terminal handlers and disposables on removeTerminalHandlers', () => {
            const container = dom.window.document.createElement('div');
            const onKeyDispose = vitest_1.vi.fn();
            const onDataDispose = vitest_1.vi.fn();
            mockTerminal.onKey.mockReturnValue({ dispose: onKeyDispose });
            mockTerminal.onData.mockReturnValue({ dispose: onDataDispose });
            manager.addXtermClickHandler(mockTerminal, 'terminal-1', container, mockCoordinator);
            // Verify handlers were added
            (0, vitest_1.expect)(mockTerminal.onKey).toHaveBeenCalled();
            (0, vitest_1.expect)(mockTerminal.onData).toHaveBeenCalled();
            // Remove handlers
            manager.removeTerminalHandlers('terminal-1');
            // Verify disposables were called
            (0, vitest_1.expect)(onKeyDispose).toHaveBeenCalled();
            (0, vitest_1.expect)(onDataDispose).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should clear pending input buffers on removeTerminalHandlers', () => {
            const container = dom.window.document.createElement('div');
            manager.addXtermClickHandler(mockTerminal, 'terminal-1', container, mockCoordinator);
            // Queue some input (not flushed yet)
            const onKeyHandler = mockTerminal.onKey.mock.calls[0][0];
            onKeyHandler({ key: 'a', domEvent: { key: 'a' } });
            onKeyHandler({ key: 'b', domEvent: { key: 'b' } });
            // Remove handlers (should clear pending buffer)
            manager.removeTerminalHandlers('terminal-1');
            // Advance timers - nothing should be sent because buffer was cleared
            vitest_1.vi.advanceTimersByTime(100);
            // Only the initial setup should have occurred, no additional sends after removal
            const sendInputCalls = mockCoordinator.getMessageManager().sendInput.mock.calls;
            // The removeTerminalHandlers should have cleared the buffer
            (0, vitest_1.expect)(sendInputCalls.length).toBe(0);
        });
        (0, vitest_1.it)('should handle removeTerminalHandlers for non-existent terminal gracefully', () => {
            // Should not throw
            (0, vitest_1.expect)(() => manager.removeTerminalHandlers('non-existent-terminal')).not.toThrow();
        });
        (0, vitest_1.it)('should clean up handlers when addXtermClickHandler is called for existing terminal', () => {
            const container = dom.window.document.createElement('div');
            const firstOnKeyDispose = vitest_1.vi.fn();
            const firstOnDataDispose = vitest_1.vi.fn();
            mockTerminal.onKey.mockReturnValueOnce({ dispose: firstOnKeyDispose });
            mockTerminal.onData.mockReturnValueOnce({ dispose: firstOnDataDispose });
            // First setup
            manager.addXtermClickHandler(mockTerminal, 'terminal-1', container, mockCoordinator);
            // Reset mocks for second setup
            const secondOnKeyDispose = vitest_1.vi.fn();
            const secondOnDataDispose = vitest_1.vi.fn();
            mockTerminal.onKey.mockReturnValue({ dispose: secondOnKeyDispose });
            mockTerminal.onData.mockReturnValue({ dispose: secondOnDataDispose });
            // Second setup for same terminal - should cleanup first
            manager.addXtermClickHandler(mockTerminal, 'terminal-1', container, mockCoordinator);
            // First handlers should have been disposed
            (0, vitest_1.expect)(firstOnKeyDispose).toHaveBeenCalled();
            (0, vitest_1.expect)(firstOnDataDispose).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=InputManager.test.js.map