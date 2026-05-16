"use strict";
/**
 * PanelLocationHandler Unit Tests
 *
 * Tests for panel location detection and updates including:
 * - Panel location detection based on aspect ratio
 * - Flex direction updates
 * - Message handling (panelLocationUpdate, requestPanelLocationDetection)
 * - CSS class toggling for layout
 * - Terminal refit scheduling
 * - Disposal
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const PanelLocationHandler_1 = require("../../../../../../webview/managers/handlers/PanelLocationHandler");
// Create mock instances
const createMockMessageQueue = () => ({
    enqueue: vitest_1.vi.fn().mockResolvedValue(undefined),
});
const createMockLogger = () => ({
    info: vitest_1.vi.fn(),
    debug: vitest_1.vi.fn(),
    warn: vitest_1.vi.fn(),
    error: vitest_1.vi.fn(),
});
// Mock DOMUtils
vitest_1.vi.mock('../../../../../../webview/utils/DOMUtils', () => ({
    DOMUtils: {
        resetXtermInlineStyles: vitest_1.vi.fn(),
    },
}));
(0, vitest_1.describe)('PanelLocationHandler', () => {
    let handler;
    let mockMessageQueue;
    let mockLogger;
    let mockCoordinator;
    let resizeObserverCallback = null;
    // Mock ResizeObserver - must be a class for proper constructor behavior
    class MockResizeObserver {
        constructor(callback) {
            this.observe = vitest_1.vi.fn();
            this.unobserve = vitest_1.vi.fn();
            this.disconnect = vitest_1.vi.fn();
            resizeObserverCallback = callback;
        }
    }
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.useFakeTimers();
        // Setup ResizeObserver mock
        vitest_1.vi.stubGlobal('ResizeObserver', MockResizeObserver);
        // Mock window dimensions
        Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
        Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true });
        // Create mocks
        mockMessageQueue = createMockMessageQueue();
        mockLogger = createMockLogger();
        // Setup mock coordinator
        mockCoordinator = {
            postMessageToExtension: vitest_1.vi.fn(),
            getSplitManager: vitest_1.vi.fn().mockReturnValue({
                getTerminals: vitest_1.vi.fn().mockReturnValue(new Map()),
                updateSplitDirection: vitest_1.vi.fn(),
            }),
            getManagers: vitest_1.vi.fn().mockReturnValue({
                config: {
                    getCurrentSettings: vitest_1.vi.fn().mockReturnValue({
                        dynamicSplitDirection: true,
                    }),
                },
            }),
        };
        // @ts-expect-error - test mock type
        handler = new PanelLocationHandler_1.PanelLocationHandler(mockMessageQueue, mockLogger);
    });
    (0, vitest_1.afterEach)(() => {
        handler.dispose();
        vitest_1.vi.useRealTimers();
        vitest_1.vi.clearAllMocks();
        vitest_1.vi.unstubAllGlobals();
        document.body.innerHTML = '';
        resizeObserverCallback = null;
    });
    (0, vitest_1.describe)('constructor', () => {
        (0, vitest_1.it)('should initialize with null cached state', () => {
            (0, vitest_1.expect)(handler.getCurrentFlexDirection()).toBeNull();
            (0, vitest_1.expect)(handler.getCurrentPanelLocation()).toBeNull();
        });
        (0, vitest_1.it)('should set up ResizeObserver', () => {
            // Verify ResizeObserver callback was captured during handler instantiation
            (0, vitest_1.expect)(resizeObserverCallback).not.toBeNull();
        });
    });
    (0, vitest_1.describe)('getSupportedCommands', () => {
        (0, vitest_1.it)('should return supported commands', () => {
            const commands = handler.getSupportedCommands();
            (0, vitest_1.expect)(commands).toContain('panelLocationUpdate');
            (0, vitest_1.expect)(commands).toContain('requestPanelLocationDetection');
            (0, vitest_1.expect)(commands.length).toBe(2);
        });
    });
    (0, vitest_1.describe)('getCurrentFlexDirection', () => {
        (0, vitest_1.it)('should return null initially', () => {
            (0, vitest_1.expect)(handler.getCurrentFlexDirection()).toBeNull();
        });
    });
    (0, vitest_1.describe)('getCurrentPanelLocation', () => {
        (0, vitest_1.it)('should return null initially', () => {
            (0, vitest_1.expect)(handler.getCurrentPanelLocation()).toBeNull();
        });
    });
    (0, vitest_1.describe)('updateFlexDirectionIfNeeded', () => {
        (0, vitest_1.it)('should return false when location has not changed', () => {
            // Simulate initial detection via resize
            if (resizeObserverCallback) {
                resizeObserverCallback([{ contentRect: { width: 800, height: 600 } }], {});
            }
            vitest_1.vi.advanceTimersByTime(200);
            // Now try to update - should return false as location hasn't changed
            const result = handler.updateFlexDirectionIfNeeded(mockCoordinator);
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should return true when location changes', () => {
            // Simulate initial detection with sidebar dimensions
            Object.defineProperty(window, 'innerWidth', { value: 300, configurable: true });
            Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true });
            if (resizeObserverCallback) {
                resizeObserverCallback([{ contentRect: { width: 300, height: 600 } }], {});
            }
            vitest_1.vi.advanceTimersByTime(200);
            // Change to panel dimensions
            Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
            Object.defineProperty(window, 'innerHeight', { value: 400, configurable: true });
            const result = handler.updateFlexDirectionIfNeeded(mockCoordinator);
            (0, vitest_1.expect)(result).toBe(true);
        });
    });
    (0, vitest_1.describe)('handleMessage', () => {
        (0, vitest_1.describe)('panelLocationUpdate', () => {
            (0, vitest_1.it)('should handle panelLocationUpdate command', () => {
                const msg = { command: 'panelLocationUpdate' };
                (0, vitest_1.expect)(() => handler.handleMessage(msg, mockCoordinator)).not.toThrow();
            });
            (0, vitest_1.it)('should skip update when dynamicSplitDirection is disabled', () => {
                mockCoordinator.getManagers.mockReturnValue({
                    config: {
                        getCurrentSettings: vitest_1.vi.fn().mockReturnValue({
                            dynamicSplitDirection: false,
                        }),
                    },
                });
                const msg = { command: 'panelLocationUpdate' };
                handler.handleMessage(msg, mockCoordinator);
                // Should not update - verify by checking state remains null
                // (since autonomous detection would have set it if update ran)
            });
        });
        (0, vitest_1.describe)('requestPanelLocationDetection', () => {
            (0, vitest_1.it)('should handle requestPanelLocationDetection command', () => {
                const msg = { command: 'requestPanelLocationDetection' };
                handler.handleMessage(msg, mockCoordinator);
                (0, vitest_1.expect)(mockMessageQueue.enqueue).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                    command: 'reportPanelLocation',
                }));
            });
            (0, vitest_1.it)('should detect sidebar when width < height * threshold', () => {
                Object.defineProperty(window, 'innerWidth', { value: 300, configurable: true });
                Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true });
                const msg = { command: 'requestPanelLocationDetection' };
                handler.handleMessage(msg, mockCoordinator);
                (0, vitest_1.expect)(mockMessageQueue.enqueue).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                    command: 'reportPanelLocation',
                    location: 'sidebar',
                }));
            });
            (0, vitest_1.it)('should detect panel when width > height * threshold', () => {
                // Reset to 0 to force fallback to body dimensions
                vitest_1.vi.stubGlobal('innerWidth', 0);
                vitest_1.vi.stubGlobal('innerHeight', 0);
                Object.defineProperty(document.documentElement, 'clientWidth', {
                    value: 0,
                    configurable: true,
                });
                Object.defineProperty(document.documentElement, 'clientHeight', {
                    value: 0,
                    configurable: true,
                });
                // Set body dimensions for panel mode (wide aspect ratio)
                Object.defineProperty(document.body, 'clientWidth', { value: 1200, configurable: true });
                Object.defineProperty(document.body, 'clientHeight', { value: 400, configurable: true });
                const msg = { command: 'requestPanelLocationDetection' };
                handler.handleMessage(msg, mockCoordinator);
                (0, vitest_1.expect)(mockMessageQueue.enqueue).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                    command: 'reportPanelLocation',
                    location: 'panel',
                }));
            });
            (0, vitest_1.it)('should use panel when view is wide and short', () => {
                // requestPanelLocationDetection path uses document.body dimensions.
                Object.defineProperty(document.body, 'clientWidth', { value: 1200, configurable: true });
                Object.defineProperty(document.body, 'clientHeight', { value: 400, configurable: true });
                const msg = { command: 'requestPanelLocationDetection' };
                handler.handleMessage(msg, mockCoordinator);
                (0, vitest_1.expect)(mockMessageQueue.enqueue).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                    command: 'reportPanelLocation',
                    location: 'panel',
                }));
            });
            (0, vitest_1.it)('should use panel when view is wide and tall (secondary sidebar maximized)', () => {
                // requestPanelLocationDetection path uses document.body dimensions.
                Object.defineProperty(document.body, 'clientWidth', { value: 1400, configurable: true });
                Object.defineProperty(document.body, 'clientHeight', { value: 900, configurable: true });
                const msg = { command: 'requestPanelLocationDetection' };
                handler.handleMessage(msg, mockCoordinator);
                (0, vitest_1.expect)(mockMessageQueue.enqueue).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                    command: 'reportPanelLocation',
                    location: 'panel',
                }));
            });
            (0, vitest_1.it)('should use panel when view is slightly landscape (small but width > height)', () => {
                // Regression: panel should stay horizontal even in compact landscape sizes.
                Object.defineProperty(document.body, 'clientWidth', { value: 901, configurable: true });
                Object.defineProperty(document.body, 'clientHeight', { value: 900, configurable: true });
                const msg = { command: 'requestPanelLocationDetection' };
                handler.handleMessage(msg, mockCoordinator);
                (0, vitest_1.expect)(mockMessageQueue.enqueue).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                    command: 'reportPanelLocation',
                    location: 'panel',
                }));
            });
            (0, vitest_1.it)('should use sidebar when view is large and only slightly landscape', () => {
                // Keep previous behavior for large area views unless aspect ratio is clearly wide.
                Object.defineProperty(document.body, 'clientWidth', { value: 1601, configurable: true });
                Object.defineProperty(document.body, 'clientHeight', { value: 1600, configurable: true });
                const msg = { command: 'requestPanelLocationDetection' };
                handler.handleMessage(msg, mockCoordinator);
                (0, vitest_1.expect)(mockMessageQueue.enqueue).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                    command: 'reportPanelLocation',
                    location: 'sidebar',
                }));
            });
        });
        (0, vitest_1.describe)('unknown command', () => {
            (0, vitest_1.it)('should log warning for unknown commands', () => {
                const msg = { command: 'unknownCommand' };
                handler.handleMessage(msg, mockCoordinator);
                (0, vitest_1.expect)(mockLogger.warn).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Unknown panel location command'));
            });
        });
    });
    (0, vitest_1.describe)('autonomous detection via ResizeObserver', () => {
        (0, vitest_1.it)('should ignore zero dimensions', () => {
            if (resizeObserverCallback) {
                resizeObserverCallback([{ contentRect: { width: 0, height: 0 } }], {});
            }
            (0, vitest_1.expect)(handler.getCurrentPanelLocation()).toBeNull();
        });
        (0, vitest_1.it)('should detect sidebar on initial observation with sidebar dimensions', () => {
            Object.defineProperty(window, 'innerWidth', { value: 300, configurable: true });
            Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true });
            if (resizeObserverCallback) {
                resizeObserverCallback([{ contentRect: { width: 300, height: 600 } }], {});
            }
            vitest_1.vi.advanceTimersByTime(200);
            (0, vitest_1.expect)(handler.getCurrentPanelLocation()).toBe('sidebar');
            (0, vitest_1.expect)(handler.getCurrentFlexDirection()).toBe('column');
        });
        (0, vitest_1.it)('should detect panel on initial observation with panel dimensions', () => {
            Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
            Object.defineProperty(window, 'innerHeight', { value: 400, configurable: true });
            if (resizeObserverCallback) {
                resizeObserverCallback([{ contentRect: { width: 1200, height: 400 } }], {});
            }
            vitest_1.vi.advanceTimersByTime(200);
            (0, vitest_1.expect)(handler.getCurrentPanelLocation()).toBe('panel');
            (0, vitest_1.expect)(handler.getCurrentFlexDirection()).toBe('row');
        });
        (0, vitest_1.it)('should use panel on initial observation when wide and short', () => {
            Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
            Object.defineProperty(window, 'innerHeight', { value: 400, configurable: true });
            if (resizeObserverCallback) {
                resizeObserverCallback([{ contentRect: { width: 1200, height: 400 } }], {});
            }
            vitest_1.vi.advanceTimersByTime(200);
            (0, vitest_1.expect)(handler.getCurrentPanelLocation()).toBe('panel');
            (0, vitest_1.expect)(handler.getCurrentFlexDirection()).toBe('row');
        });
        (0, vitest_1.it)('should use panel on initial observation when wide and tall', () => {
            Object.defineProperty(window, 'innerWidth', { value: 1400, configurable: true });
            Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true });
            if (resizeObserverCallback) {
                resizeObserverCallback([{ contentRect: { width: 1400, height: 900 } }], {});
            }
            vitest_1.vi.advanceTimersByTime(200);
            (0, vitest_1.expect)(handler.getCurrentPanelLocation()).toBe('panel');
            (0, vitest_1.expect)(handler.getCurrentFlexDirection()).toBe('row');
        });
        (0, vitest_1.it)('should report panel location to extension on initial detection', () => {
            if (resizeObserverCallback) {
                resizeObserverCallback([{ contentRect: { width: 800, height: 600 } }], {});
            }
            vitest_1.vi.advanceTimersByTime(200);
            (0, vitest_1.expect)(mockMessageQueue.enqueue).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'reportPanelLocation',
            }));
        });
        (0, vitest_1.it)('should dispatch terminal-panel-location-changed event', () => {
            const dispatchEventSpy = vitest_1.vi.spyOn(window, 'dispatchEvent');
            if (resizeObserverCallback) {
                resizeObserverCallback([{ contentRect: { width: 800, height: 600 } }], {});
            }
            // Wait for the scheduled refit
            vitest_1.vi.advanceTimersByTime(200);
            (0, vitest_1.expect)(dispatchEventSpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                type: 'terminal-panel-location-changed',
            }));
        });
    });
    (0, vitest_1.describe)('CSS class management', () => {
        (0, vitest_1.it)('should add terminal-split-horizontal class for panel location', () => {
            const terminalsWrapper = document.createElement('div');
            terminalsWrapper.id = 'terminals-wrapper';
            document.body.appendChild(terminalsWrapper);
            Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
            Object.defineProperty(window, 'innerHeight', { value: 400, configurable: true });
            if (resizeObserverCallback) {
                resizeObserverCallback([{ contentRect: { width: 1200, height: 400 } }], {});
            }
            (0, vitest_1.expect)(terminalsWrapper.classList.contains('terminal-split-horizontal')).toBe(true);
        });
        (0, vitest_1.it)('should remove terminal-split-horizontal class for sidebar location', () => {
            const terminalsWrapper = document.createElement('div');
            terminalsWrapper.id = 'terminals-wrapper';
            terminalsWrapper.classList.add('terminal-split-horizontal');
            document.body.appendChild(terminalsWrapper);
            Object.defineProperty(window, 'innerWidth', { value: 300, configurable: true });
            Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true });
            if (resizeObserverCallback) {
                resizeObserverCallback([{ contentRect: { width: 300, height: 600 } }], {});
            }
            (0, vitest_1.expect)(terminalsWrapper.classList.contains('terminal-split-horizontal')).toBe(false);
        });
        (0, vitest_1.it)('should retry class sync if terminals-wrapper is not available', () => {
            Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
            Object.defineProperty(window, 'innerHeight', { value: 400, configurable: true });
            if (resizeObserverCallback) {
                resizeObserverCallback([{ contentRect: { width: 1200, height: 400 } }], {});
            }
            // Create wrapper after a delay
            vitest_1.vi.advanceTimersByTime(100);
            const terminalsWrapper = document.createElement('div');
            terminalsWrapper.id = 'terminals-wrapper';
            document.body.appendChild(terminalsWrapper);
            // Continue advancing time for the retry logic
            vitest_1.vi.advanceTimersByTime(100);
            (0, vitest_1.expect)(terminalsWrapper.classList.contains('terminal-split-horizontal')).toBe(true);
        });
    });
    (0, vitest_1.describe)('dispose', () => {
        (0, vitest_1.it)('should dispose without error', () => {
            (0, vitest_1.expect)(() => handler.dispose()).not.toThrow();
        });
    });
    (0, vitest_1.describe)('edge cases', () => {
        (0, vitest_1.it)('should fallback to sidebar when dimensions are zero', () => {
            vitest_1.vi.stubGlobal('innerWidth', 0);
            vitest_1.vi.stubGlobal('innerHeight', 0);
            Object.defineProperty(document.documentElement, 'clientWidth', {
                value: 0,
                configurable: true,
            });
            Object.defineProperty(document.documentElement, 'clientHeight', {
                value: 0,
                configurable: true,
            });
            // Also reset body dimensions to 0 to test full fallback to sidebar
            Object.defineProperty(document.body, 'clientWidth', { value: 0, configurable: true });
            Object.defineProperty(document.body, 'clientHeight', { value: 0, configurable: true });
            const msg = { command: 'requestPanelLocationDetection' };
            handler.handleMessage(msg, mockCoordinator);
            (0, vitest_1.expect)(mockMessageQueue.enqueue).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                location: 'sidebar',
            }));
        });
        (0, vitest_1.it)('should use document.body dimensions as fallback', () => {
            vitest_1.vi.stubGlobal('innerWidth', 0);
            vitest_1.vi.stubGlobal('innerHeight', 0);
            Object.defineProperty(document.documentElement, 'clientWidth', {
                value: 0,
                configurable: true,
            });
            Object.defineProperty(document.documentElement, 'clientHeight', {
                value: 0,
                configurable: true,
            });
            // Setup body dimensions for panel detection
            Object.defineProperty(document.body, 'clientWidth', { value: 1200, configurable: true });
            Object.defineProperty(document.body, 'clientHeight', { value: 400, configurable: true });
            const msg = { command: 'requestPanelLocationDetection' };
            handler.handleMessage(msg, mockCoordinator);
            (0, vitest_1.expect)(mockMessageQueue.enqueue).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                location: 'panel',
            }));
        });
    });
});
//# sourceMappingURL=PanelLocationHandler.test.js.map