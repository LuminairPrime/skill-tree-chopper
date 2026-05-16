"use strict";
/**
 * TerminalEventManager Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const TerminalEventManager_1 = require("../../../../../webview/managers/TerminalEventManager");
const EventHandlerRegistry_1 = require("../../../../../webview/utils/EventHandlerRegistry");
// Mock generic logger
vitest_1.vi.mock('../../../../../webview/utils/ManagerLogger', () => ({
    terminalLogger: {
        info: vitest_1.vi.fn(),
        warn: vitest_1.vi.fn(),
        error: vitest_1.vi.fn(),
        debug: vitest_1.vi.fn(),
    },
}));
// Mock EventHandlerRegistry
vitest_1.vi.mock('../../../../../webview/utils/EventHandlerRegistry', () => ({
    EventHandlerRegistry: class {
        constructor() {
            this.register = vitest_1.vi.fn();
            this.unregister = vitest_1.vi.fn();
            this.unregisterByPattern = vitest_1.vi.fn();
            this.dispose = vitest_1.vi.fn();
        }
    },
}));
(0, vitest_1.describe)('TerminalEventManager', () => {
    let manager;
    let mockCoordinator;
    let mockRegistry;
    let dom;
    let mockTerminal;
    let mockContainer;
    (0, vitest_1.beforeEach)(() => {
        dom = new jsdom_1.JSDOM('<!DOCTYPE html><div></div>');
        global.document = dom.window.document;
        global.window = dom.window;
        global.HTMLElement = dom.window.HTMLElement;
        global.Event = dom.window.Event;
        mockCoordinator = {
            postMessageToExtension: vitest_1.vi.fn(),
            setActiveTerminalId: vitest_1.vi.fn(),
            deleteTerminalSafely: vitest_1.vi.fn(),
            handleAiAgentToggle: vitest_1.vi.fn(),
            getManagers: vitest_1.vi.fn().mockReturnValue({}),
        };
        mockRegistry = new EventHandlerRegistry_1.EventHandlerRegistry();
        // Mock terminal
        mockTerminal = {
            onData: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
            textarea: document.createElement('textarea'),
            hasSelection: vitest_1.vi.fn().mockReturnValue(false),
            focus: vitest_1.vi.fn(),
        };
        // Mock container
        mockContainer = document.createElement('div');
        const xtermElement = document.createElement('div');
        xtermElement.className = 'xterm';
        mockContainer.appendChild(xtermElement);
        manager = new TerminalEventManager_1.TerminalEventManager(mockCoordinator, mockRegistry);
    });
    (0, vitest_1.afterEach)(() => {
        manager.dispose();
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('Initialization', () => {
        (0, vitest_1.it)('should initialize successfully', async () => {
            // BaseManager initialization logic
            await manager.initialize();
            // Indirectly verified by no error throw
        });
    });
    (0, vitest_1.describe)('Input Handler Setup', () => {
        (0, vitest_1.it)('should setup legacy input handler when InputManager is missing', () => {
            // Setup coordinator without InputManager
            mockCoordinator.inputManager = undefined;
            mockCoordinator.getManagers = () => ({});
            manager.setupTerminalEvents(mockTerminal, 't1', mockContainer);
            (0, vitest_1.expect)(mockTerminal.onData).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should skip legacy input handler when InputManager is present', () => {
            // Setup coordinator with InputManager
            mockCoordinator.inputManager = {};
            manager.setupTerminalEvents(mockTerminal, 't1', mockContainer);
            (0, vitest_1.expect)(mockTerminal.onData).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should send input to extension via legacy handler', () => {
            // Setup legacy handler
            mockCoordinator.inputManager = undefined;
            manager.setupTerminalEvents(mockTerminal, 't1', mockContainer);
            // Simulate input
            const onDataCallback = mockTerminal.onData.mock.calls[0][0];
            onDataCallback('test input');
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith({
                command: 'input',
                data: 'test input',
                terminalId: 't1',
            });
        });
    });
    (0, vitest_1.describe)('Click Handling', () => {
        (0, vitest_1.it)('should setup click handler for activation', () => {
            manager.setupTerminalEvents(mockTerminal, 't1', mockContainer);
            (0, vitest_1.expect)(mockRegistry.register).toHaveBeenCalledWith('terminal-t1-click', vitest_1.expect.anything(), 'click', vitest_1.expect.any(Function));
        });
        (0, vitest_1.it)('should activate terminal on click if no selection', () => {
            manager.setupTerminalEvents(mockTerminal, 't1', mockContainer);
            // Get registered handler
            const calls = mockRegistry.register.mock.calls;
            const clickCall = calls.find((call) => call[0] === 'terminal-t1-click');
            const clickHandler = clickCall[3];
            // Simulate click
            mockTerminal.hasSelection.mockReturnValue(false);
            clickHandler(new Event('click'));
            (0, vitest_1.expect)(mockCoordinator.setActiveTerminalId).toHaveBeenCalledWith('t1');
        });
        (0, vitest_1.it)('should NOT activate terminal on click if selection exists', () => {
            manager.setupTerminalEvents(mockTerminal, 't1', mockContainer);
            const calls = mockRegistry.register.mock.calls;
            const clickCall = calls.find((call) => call[0] === 'terminal-t1-click');
            const clickHandler = clickCall[3];
            mockTerminal.hasSelection.mockReturnValue(true);
            clickHandler(new Event('click'));
            (0, vitest_1.expect)(mockCoordinator.setActiveTerminalId).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Focus Optimization', () => {
        (0, vitest_1.it)('should register focus and blur handlers', () => {
            manager.setupTerminalEvents(mockTerminal, 't1', mockContainer);
            (0, vitest_1.expect)(mockRegistry.register).toHaveBeenCalledWith('terminal-t1-focus', mockTerminal.textarea, 'focus', vitest_1.expect.any(Function));
            (0, vitest_1.expect)(mockRegistry.register).toHaveBeenCalledWith('terminal-t1-blur', mockTerminal.textarea, 'blur', vitest_1.expect.any(Function));
        });
    });
    (0, vitest_1.describe)('Container Callbacks', () => {
        (0, vitest_1.it)('should provide header click callback', () => {
            const callbacks = manager.createContainerCallbacks('t1');
            callbacks.onHeaderClick('t1');
            (0, vitest_1.expect)(mockCoordinator.setActiveTerminalId).toHaveBeenCalledWith('t1');
        });
        (0, vitest_1.it)('should provide container click callback', () => {
            const callbacks = manager.createContainerCallbacks('t1');
            callbacks.onContainerClick('t1');
            (0, vitest_1.expect)(mockCoordinator.setActiveTerminalId).toHaveBeenCalledWith('t1');
        });
        (0, vitest_1.it)('should provide close click callback', () => {
            const callbacks = manager.createContainerCallbacks('t1');
            callbacks.onCloseClick('t1');
            (0, vitest_1.expect)(mockCoordinator.deleteTerminalSafely).toHaveBeenCalledWith('t1');
        });
        (0, vitest_1.it)('should provide AI agent toggle callback', () => {
            const callbacks = manager.createContainerCallbacks('t1');
            callbacks.onAiAgentToggleClick('t1');
            (0, vitest_1.expect)(mockCoordinator.handleAiAgentToggle).toHaveBeenCalledWith('t1');
        });
    });
    (0, vitest_1.describe)('Focus Management', () => {
        (0, vitest_1.it)('should focus terminal if not focused', () => {
            vitest_1.vi.useFakeTimers();
            // textarea does not have 'focused' attribute initially
            manager.focusTerminal(mockTerminal, 't1');
            vitest_1.vi.advanceTimersByTime(10);
            (0, vitest_1.expect)(mockTerminal.focus).toHaveBeenCalled();
            vitest_1.vi.useRealTimers();
        });
        (0, vitest_1.it)('should skip focus if already active element', () => {
            vitest_1.vi.useFakeTimers();
            // Mock active element
            Object.defineProperty(document, 'activeElement', {
                value: mockTerminal.textarea,
                configurable: true,
            });
            manager.focusTerminal(mockTerminal, 't1');
            vitest_1.vi.advanceTimersByTime(10);
            (0, vitest_1.expect)(mockTerminal.focus).not.toHaveBeenCalled();
            vitest_1.vi.useRealTimers();
        });
    });
    (0, vitest_1.describe)('Event Removal with Regex Metacharacters', () => {
        (0, vitest_1.it)('should escape regex metacharacters in terminalId before unregistering', () => {
            const terminalId = '$1[test]';
            const unregisterByPatternSpy = vitest_1.vi.spyOn(mockRegistry, 'unregisterByPattern');
            manager.setupTerminalEvents(mockTerminal, terminalId, mockContainer);
            const registerCalls = mockRegistry.register.mock.calls;
            (0, vitest_1.expect)(registerCalls.length).toBeGreaterThan(0);
            manager.removeTerminalEvents(terminalId);
            (0, vitest_1.expect)(unregisterByPatternSpy).toHaveBeenCalled();
            (0, vitest_1.expect)(unregisterByPatternSpy.mock.calls.length).toBeGreaterThan(0);
            const firstCallArgs = unregisterByPatternSpy.mock.calls[0];
            if (firstCallArgs && firstCallArgs[0]) {
                const patternArg = firstCallArgs[0];
                (0, vitest_1.expect)(patternArg).toBeInstanceOf(RegExp);
                // Verify the escaped pattern matches the expected terminal event keys
                (0, vitest_1.expect)(patternArg.test('terminal-$1[test]-click')).toBe(true);
                (0, vitest_1.expect)(patternArg.test('terminal-$1[test]-pointerdown')).toBe(true);
                // Should NOT match other terminals
                (0, vitest_1.expect)(patternArg.test('terminal-$2-click')).toBe(false);
                (0, vitest_1.expect)(patternArg.test('terminal-click')).toBe(false);
            }
        });
        (0, vitest_1.it)('should not remove events for other terminals when removing one', () => {
            const unregisterByPatternSpy = vitest_1.vi.spyOn(mockRegistry, 'unregisterByPattern');
            manager.setupTerminalEvents(mockTerminal, 't1', mockContainer);
            manager.setupTerminalEvents(mockTerminal, 't2', mockContainer);
            const t1Registers = mockRegistry.register.mock.calls.filter((call) => call[0].startsWith('terminal-t1'));
            const t2Registers = mockRegistry.register.mock.calls.filter((call) => call[0].startsWith('terminal-t2'));
            (0, vitest_1.expect)(t1Registers.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(t2Registers.length).toBeGreaterThan(0);
            manager.removeTerminalEvents('t1');
            (0, vitest_1.expect)(unregisterByPatternSpy).toHaveBeenCalled();
            // t2 registrations should remain unchanged
            const t2RegistersAfter = mockRegistry.register.mock.calls.filter((call) => call[0].startsWith('terminal-t2'));
            (0, vitest_1.expect)(t2RegistersAfter.length).toBe(t2Registers.length);
        });
    });
});
//# sourceMappingURL=TerminalEventManager.test.js.map