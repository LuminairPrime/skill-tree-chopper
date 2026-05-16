"use strict";
/**
 * MouseTrackingService Unit Tests
 *
 * Tests mouse tracking detection and scroll behavior toggling
 * for terminal apps like zellij, vim, tmux that use mouse modes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const MouseTrackingService_1 = require("../../../../../../webview/services/terminal/MouseTrackingService");
// Mock logger
vitest_1.vi.mock('../../../../../../webview/utils/ManagerLogger', () => ({
    terminalLogger: {
        info: vitest_1.vi.fn(),
        warn: vitest_1.vi.fn(),
        error: vitest_1.vi.fn(),
        debug: vitest_1.vi.fn(),
    },
}));
/**
 * Create a mock Terminal with parser.registerCsiHandler
 */
function createMockTerminal() {
    const handlers = new Map();
    // Create mock screen element
    const screenElement = document.createElement('div');
    screenElement.className = 'xterm-screen';
    // Create mock terminal element containing screen
    const terminalElement = document.createElement('div');
    terminalElement.className = 'terminal xterm';
    terminalElement.appendChild(screenElement);
    // Mock dimensions (JSDOM doesn't render, so clientWidth/Height are 0)
    Object.defineProperty(terminalElement, 'clientWidth', { value: 720, configurable: true });
    Object.defineProperty(terminalElement, 'clientHeight', { value: 408, configurable: true });
    // Mock getBoundingClientRect for screen element
    screenElement.getBoundingClientRect = () => ({
        left: 0,
        top: 0,
        right: 720,
        bottom: 408,
        width: 720,
        height: 408,
        x: 0,
        y: 0,
        toJSON: () => ({}),
    });
    // Create a mock element object with explicit dimensions
    // (JSDOM element properties may not work reliably)
    const mockElement = {
        clientWidth: 720,
        clientHeight: 408,
        querySelector: (selector) => (selector === '.xterm-screen' ? screenElement : null),
        appendChild: terminalElement.appendChild.bind(terminalElement),
    };
    return {
        element: mockElement,
        cols: 80,
        rows: 24,
        parser: {
            registerCsiHandler: vitest_1.vi.fn((identifier, handler) => {
                // Store with prefix for proper identification
                const key = `${identifier.prefix || ''}${identifier.final}`;
                handlers.set(key, handler);
                return {
                    dispose: vitest_1.vi.fn(),
                };
            }),
        },
        // Helper to simulate CSI sequences (private mode with ? prefix)
        _simulateCsi: (final, params) => {
            const handler = handlers.get(`?${final}`);
            if (handler) {
                handler(params);
            }
        },
    };
}
(0, vitest_1.describe)('MouseTrackingService', () => {
    let service;
    let mockTerminal;
    let viewport;
    let mockSendInput;
    (0, vitest_1.beforeEach)(() => {
        service = new MouseTrackingService_1.MouseTrackingService();
        mockTerminal = createMockTerminal();
        viewport = document.createElement('div');
        viewport.className = 'xterm-viewport';
        viewport.style.overflow = 'auto'; // Initial state from TerminalScrollbarService
        mockSendInput = vitest_1.vi.fn();
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.afterEach)(() => {
        service.dispose();
    });
    (0, vitest_1.describe)('setup', () => {
        (0, vitest_1.it)('should register CSI handlers for DECSET and DECRST', () => {
            service.setup(mockTerminal, 't1', viewport, mockSendInput);
            // Should register handlers for '?h' (DECSET) and '?l' (DECRST)
            (0, vitest_1.expect)(mockTerminal.parser.registerCsiHandler).toHaveBeenCalledTimes(2);
            (0, vitest_1.expect)(mockTerminal.parser.registerCsiHandler).toHaveBeenCalledWith({ prefix: '?', final: 'h' }, vitest_1.expect.any(Function));
            (0, vitest_1.expect)(mockTerminal.parser.registerCsiHandler).toHaveBeenCalledWith({ prefix: '?', final: 'l' }, vitest_1.expect.any(Function));
        });
        (0, vitest_1.it)('should warn if setup called twice for same terminal', async () => {
            const { terminalLogger } = vitest_1.vi.mocked(await Promise.resolve().then(() => require('../../../../../../webview/utils/ManagerLogger')));
            service.setup(mockTerminal, 't1', viewport, mockSendInput);
            service.setup(mockTerminal, 't1', viewport, mockSendInput);
            (0, vitest_1.expect)(terminalLogger.warn).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Already setup for terminal: t1'));
        });
    });
    (0, vitest_1.describe)('mouse tracking mode detection', () => {
        (0, vitest_1.beforeEach)(() => {
            service.setup(mockTerminal, 't1', viewport, mockSendInput);
        });
        (0, vitest_1.it)('should disable native scroll when mouse mode 1000 enabled (DECSET)', () => {
            (0, vitest_1.expect)(viewport.style.overflow).toBe('auto');
            // Simulate CSI ? 1000 h (X10 mouse reporting)
            mockTerminal._simulateCsi('h', [1000]);
            (0, vitest_1.expect)(viewport.style.overflow).toBe('hidden');
            (0, vitest_1.expect)(service.isMouseTrackingActive('t1')).toBe(true);
        });
        (0, vitest_1.it)('should disable native scroll when mouse mode 1002 enabled', () => {
            mockTerminal._simulateCsi('h', [1002]);
            (0, vitest_1.expect)(viewport.style.overflow).toBe('hidden');
            (0, vitest_1.expect)(service.getActiveModes('t1')).toContain(1002);
        });
        (0, vitest_1.it)('should disable native scroll when mouse mode 1003 enabled', () => {
            mockTerminal._simulateCsi('h', [1003]);
            (0, vitest_1.expect)(viewport.style.overflow).toBe('hidden');
            (0, vitest_1.expect)(service.getActiveModes('t1')).toContain(1003);
        });
        (0, vitest_1.it)('should disable native scroll when mouse mode 1006 enabled (SGR)', () => {
            mockTerminal._simulateCsi('h', [1006]);
            (0, vitest_1.expect)(viewport.style.overflow).toBe('hidden');
            (0, vitest_1.expect)(service.getActiveModes('t1')).toContain(1006);
        });
        (0, vitest_1.it)('should restore native scroll when mouse mode disabled (DECRST)', () => {
            // Enable mouse mode
            mockTerminal._simulateCsi('h', [1000]);
            (0, vitest_1.expect)(viewport.style.overflow).toBe('hidden');
            // Disable mouse mode
            mockTerminal._simulateCsi('l', [1000]);
            (0, vitest_1.expect)(viewport.style.overflow).toBe('auto');
            (0, vitest_1.expect)(service.isMouseTrackingActive('t1')).toBe(false);
        });
        (0, vitest_1.it)('should handle multiple mouse modes simultaneously', () => {
            // Apps like zellij enable multiple modes at once
            mockTerminal._simulateCsi('h', [1000]);
            mockTerminal._simulateCsi('h', [1002]);
            mockTerminal._simulateCsi('h', [1006]);
            (0, vitest_1.expect)(viewport.style.overflow).toBe('hidden');
            (0, vitest_1.expect)(service.getActiveModes('t1')).toEqual(vitest_1.expect.arrayContaining([1000, 1002, 1006]));
            // Disable one mode - should still be hidden
            mockTerminal._simulateCsi('l', [1000]);
            (0, vitest_1.expect)(viewport.style.overflow).toBe('hidden');
            (0, vitest_1.expect)(service.isMouseTrackingActive('t1')).toBe(true);
            // Disable remaining modes
            mockTerminal._simulateCsi('l', [1002]);
            mockTerminal._simulateCsi('l', [1006]);
            (0, vitest_1.expect)(viewport.style.overflow).toBe('auto');
            (0, vitest_1.expect)(service.isMouseTrackingActive('t1')).toBe(false);
        });
        (0, vitest_1.it)('should ignore non-mouse-tracking modes', () => {
            // Mode 25 is cursor visibility, not mouse tracking
            mockTerminal._simulateCsi('h', [25]);
            (0, vitest_1.expect)(viewport.style.overflow).toBe('auto');
            (0, vitest_1.expect)(service.isMouseTrackingActive('t1')).toBe(false);
        });
    });
    (0, vitest_1.describe)('wheel event handling', () => {
        (0, vitest_1.beforeEach)(() => {
            service.setup(mockTerminal, 't1', viewport, mockSendInput);
            // Enable mouse mode to activate wheel handler
            mockTerminal._simulateCsi('h', [1006]);
        });
        (0, vitest_1.it)('should send SGR escape sequence on wheel down', () => {
            const screenElement = mockTerminal.element.querySelector('.xterm-screen');
            // Simulate wheel event (happy-dom doesn't populate clientX/Y from constructor)
            const wheelEvent = new WheelEvent('wheel', {
                deltaY: 100,
                bubbles: true,
                cancelable: true,
            });
            Object.defineProperty(wheelEvent, 'clientX', { value: 50 });
            Object.defineProperty(wheelEvent, 'clientY', { value: 50 });
            screenElement.dispatchEvent(wheelEvent);
            // Should call sendInput with SGR wheel down sequence (button 65)
            (0, vitest_1.expect)(mockSendInput).toHaveBeenCalled();
            const call = mockSendInput.mock.calls[0];
            (0, vitest_1.expect)(call[0]).toBe('t1');
            (0, vitest_1.expect)(call[1]).toMatch(/\x1b\[<65;\d+;\d+M/);
        });
        (0, vitest_1.it)('should send SGR escape sequence on wheel up', () => {
            const screenElement = mockTerminal.element.querySelector('.xterm-screen');
            // Simulate wheel event (happy-dom doesn't populate clientX/Y from constructor)
            const wheelEvent = new WheelEvent('wheel', {
                deltaY: -100,
                bubbles: true,
                cancelable: true,
            });
            Object.defineProperty(wheelEvent, 'clientX', { value: 50 });
            Object.defineProperty(wheelEvent, 'clientY', { value: 50 });
            screenElement.dispatchEvent(wheelEvent);
            // Should call sendInput with SGR wheel up sequence (button 64)
            (0, vitest_1.expect)(mockSendInput).toHaveBeenCalled();
            const call = mockSendInput.mock.calls[0];
            (0, vitest_1.expect)(call[0]).toBe('t1');
            (0, vitest_1.expect)(call[1]).toMatch(/\x1b\[<64;\d+;\d+M/);
        });
    });
    (0, vitest_1.describe)('cleanup', () => {
        (0, vitest_1.it)('should dispose handlers and restore scroll on cleanup', () => {
            service.setup(mockTerminal, 't1', viewport, mockSendInput);
            // Enable mouse mode
            mockTerminal._simulateCsi('h', [1000]);
            (0, vitest_1.expect)(viewport.style.overflow).toBe('hidden');
            // Cleanup
            service.cleanup('t1');
            // Scroll should be restored
            (0, vitest_1.expect)(viewport.style.overflow).toBe('auto');
            (0, vitest_1.expect)(service.isMouseTrackingActive('t1')).toBe(false);
        });
        (0, vitest_1.it)('should handle cleanup for non-existent terminal gracefully', () => {
            // Should not throw
            (0, vitest_1.expect)(() => service.cleanup('nonexistent')).not.toThrow();
        });
    });
    (0, vitest_1.describe)('dispose', () => {
        (0, vitest_1.it)('should cleanup all terminals on dispose', () => {
            const viewport2 = document.createElement('div');
            viewport2.style.overflow = 'auto';
            const mockTerminal2 = createMockTerminal();
            service.setup(mockTerminal, 't1', viewport, mockSendInput);
            service.setup(mockTerminal2, 't2', viewport2, mockSendInput);
            // Enable mouse modes
            mockTerminal._simulateCsi('h', [1000]);
            mockTerminal2._simulateCsi('h', [1003]);
            (0, vitest_1.expect)(viewport.style.overflow).toBe('hidden');
            (0, vitest_1.expect)(viewport2.style.overflow).toBe('hidden');
            // Dispose service
            service.dispose();
            // Both should be restored
            (0, vitest_1.expect)(viewport.style.overflow).toBe('auto');
            (0, vitest_1.expect)(viewport2.style.overflow).toBe('auto');
        });
    });
    (0, vitest_1.describe)('getActiveModes', () => {
        (0, vitest_1.it)('should return empty array for unknown terminal', () => {
            (0, vitest_1.expect)(service.getActiveModes('unknown')).toEqual([]);
        });
        (0, vitest_1.it)('should return active modes for known terminal', () => {
            service.setup(mockTerminal, 't1', viewport, mockSendInput);
            mockTerminal._simulateCsi('h', [1000]);
            mockTerminal._simulateCsi('h', [1006]);
            const modes = service.getActiveModes('t1');
            (0, vitest_1.expect)(modes).toHaveLength(2);
            (0, vitest_1.expect)(modes).toContain(1000);
            (0, vitest_1.expect)(modes).toContain(1006);
        });
    });
});
//# sourceMappingURL=MouseTrackingService.test.js.map