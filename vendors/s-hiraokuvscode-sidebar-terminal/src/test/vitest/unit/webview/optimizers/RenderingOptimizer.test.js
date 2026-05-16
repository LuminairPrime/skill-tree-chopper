"use strict";
/**
 * RenderingOptimizer Unit Tests
 *
 * Vitest Migration: Converted from Mocha/Chai to Vitest
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const RenderingOptimizer_1 = require("../../../../../webview/optimizers/RenderingOptimizer");
(0, vitest_1.describe)('RenderingOptimizer', () => {
    let optimizer;
    let mockTerminal;
    let mockFitAddon;
    let mockContainer;
    (0, vitest_1.beforeEach)(() => {
        // Create mock terminal
        mockTerminal = {
            loadAddon: vitest_1.vi.fn(),
            refresh: vitest_1.vi.fn(),
            rows: 24,
            options: {
                smoothScrollDuration: 0,
            },
        };
        // Create mock fit addon
        mockFitAddon = {
            fit: vitest_1.vi.fn(),
        };
        // Create mock container using a real element for DOM compatibility
        mockContainer = document.createElement('div');
        mockContainer.className = 'terminal-container';
        // Add required internal structure for resetXtermInlineStyles
        const terminalContent = document.createElement('div');
        terminalContent.className = 'terminal-content';
        mockContainer.appendChild(terminalContent);
        const xterm = document.createElement('div');
        xterm.className = 'xterm';
        terminalContent.appendChild(xterm);
        const viewport = document.createElement('div');
        viewport.className = 'xterm-viewport';
        xterm.appendChild(viewport);
        const screen = document.createElement('div');
        screen.className = 'xterm-screen';
        xterm.appendChild(screen);
        const canvas = document.createElement('canvas');
        screen.appendChild(canvas);
        // Create optimizer with default options
        optimizer = new RenderingOptimizer_1.RenderingOptimizer();
    });
    (0, vitest_1.afterEach)(() => {
        if (optimizer) {
            optimizer.dispose();
        }
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('Dimension Validation', () => {
        (0, vitest_1.it)('should accept valid dimensions (>50px)', async () => {
            vitest_1.vi.useFakeTimers();
            // Create with specific min dimensions
            const customOptimizer = new RenderingOptimizer_1.RenderingOptimizer({
                minWidth: 50,
                minHeight: 50,
            });
            // Mock ResizeObserver
            const mockEntry = {
                contentRect: {
                    width: 100,
                    height: 100,
                },
            };
            let resizeCallback;
            class MockResizeObserver {
                constructor(callback) {
                    this.observe = vitest_1.vi.fn();
                    this.disconnect = vitest_1.vi.fn();
                    this.unobserve = vitest_1.vi.fn();
                    resizeCallback = callback;
                }
            }
            vitest_1.vi.stubGlobal('ResizeObserver', MockResizeObserver);
            customOptimizer.setupOptimizedResize(mockTerminal, mockFitAddon, mockContainer, 'test-terminal');
            // Trigger resize
            resizeCallback([mockEntry]);
            // Wait for debounce
            vitest_1.vi.advanceTimersByTime(150);
            (0, vitest_1.expect)(mockFitAddon.fit).toHaveBeenCalled();
            customOptimizer.dispose();
            vitest_1.vi.useRealTimers();
        });
        (0, vitest_1.it)('should reject invalid dimensions (≤50px)', async () => {
            vitest_1.vi.useFakeTimers();
            const customOptimizer = new RenderingOptimizer_1.RenderingOptimizer({
                minWidth: 50,
                minHeight: 50,
                resizeDebounceMs: 10, // Shorter delay for test
            });
            const mockEntry = {
                contentRect: {
                    width: 30, // Below minimum
                    height: 100,
                },
            };
            let resizeCallback;
            class MockResizeObserver {
                constructor(callback) {
                    this.observe = vitest_1.vi.fn();
                    this.disconnect = vitest_1.vi.fn();
                    this.unobserve = vitest_1.vi.fn();
                    resizeCallback = callback;
                }
            }
            vitest_1.vi.stubGlobal('ResizeObserver', MockResizeObserver);
            customOptimizer.setupOptimizedResize(mockTerminal, mockFitAddon, mockContainer, 'test-terminal');
            // Trigger resize with invalid dimensions
            resizeCallback([mockEntry]);
            // Wait for debounce
            vitest_1.vi.advanceTimersByTime(50);
            (0, vitest_1.expect)(mockFitAddon.fit).not.toHaveBeenCalled();
            customOptimizer.dispose();
            vitest_1.vi.useRealTimers();
        });
    });
    (0, vitest_1.describe)('Device Detection', () => {
        (0, vitest_1.it)('should detect trackpad (deltaMode = 0)', () => {
            const trackpadEvent = {
                deltaMode: 0,
            };
            const device = optimizer.detectDevice(trackpadEvent);
            (0, vitest_1.expect)(device.isTrackpad).toBe(true);
            (0, vitest_1.expect)(device.smoothScrollDuration).toBe(0);
        });
        (0, vitest_1.it)('should detect mouse wheel (deltaMode = 1)', () => {
            const mouseEvent = {
                deltaMode: 1,
            };
            const device = optimizer.detectDevice(mouseEvent);
            (0, vitest_1.expect)(device.isTrackpad).toBe(false);
            (0, vitest_1.expect)(device.smoothScrollDuration).toBe(125);
        });
    });
    (0, vitest_1.describe)('Smooth Scroll Duration', () => {
        (0, vitest_1.it)('should update terminal smooth scroll duration', () => {
            optimizer.updateSmoothScrollDuration(mockTerminal, 125);
            (0, vitest_1.expect)(mockTerminal.options.smoothScrollDuration).toBe(125);
        });
        (0, vitest_1.it)('should handle errors in updateSmoothScrollDuration', () => {
            const faultyTerminal = {
                get options() {
                    throw new Error('Faulty');
                },
            };
            (0, vitest_1.expect)(() => optimizer.updateSmoothScrollDuration(faultyTerminal, 100)).not.toThrow();
        });
        (0, vitest_1.it)('should setup smooth scrolling with passive listener', () => {
            const addEventListenerSpy = vitest_1.vi.spyOn(mockContainer, 'addEventListener');
            optimizer.setupSmoothScrolling(mockTerminal, mockContainer, 'test-terminal');
            (0, vitest_1.expect)(addEventListenerSpy).toHaveBeenCalled();
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(addEventListenerSpy.mock.calls[0][0]).toBe('wheel');
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(addEventListenerSpy.mock.calls[0][2]).toEqual({
                passive: true,
            });
        });
        (0, vitest_1.it)('should update duration when wheel event is triggered', () => {
            optimizer.setupSmoothScrolling(mockTerminal, mockContainer, 'test-terminal');
            // Simulate wheel event (deltaMode 1 = lines/mouse)
            const wheelEvent = new CustomEvent('wheel', {
                bubbles: true,
                cancelable: true,
            });
            wheelEvent.deltaMode = 1;
            mockContainer.dispatchEvent(wheelEvent);
            (0, vitest_1.expect)(mockTerminal.options.smoothScrollDuration).toBe(125);
        });
    });
    (0, vitest_1.describe)('WebGL Fallback', () => {
        (0, vitest_1.it)('should return false when WebGL is disabled', async () => {
            const noWebGLOptimizer = new RenderingOptimizer_1.RenderingOptimizer({
                enableWebGL: false,
            });
            const result = await noWebGLOptimizer.enableWebGL(mockTerminal, 'test-terminal');
            (0, vitest_1.expect)(result).toBe(false);
            (0, vitest_1.expect)(mockTerminal.loadAddon).not.toHaveBeenCalled();
            noWebGLOptimizer.dispose();
        });
        (0, vitest_1.it)('should clear selection and refresh after DOM renderer fallback', () => {
            vitest_1.vi.useFakeTimers();
            mockTerminal.clearSelection = vitest_1.vi.fn();
            // Simulate webglAddon
            const mockAddon = { dispose: vitest_1.vi.fn(), onContextLoss: vitest_1.vi.fn() };
            optimizer.webglAddon = mockAddon;
            // Call fallbackToDOMRenderer
            optimizer.fallbackToDOMRenderer(mockTerminal, 'test-terminal');
            // Addon should be disposed
            (0, vitest_1.expect)(mockAddon.dispose).toHaveBeenCalled();
            // clearSelection should be called synchronously
            (0, vitest_1.expect)(mockTerminal.clearSelection).toHaveBeenCalled();
            // refresh should be called after the setTimeout
            vitest_1.vi.advanceTimersByTime(50);
            (0, vitest_1.expect)(mockTerminal.refresh).toHaveBeenCalledWith(0, mockTerminal.rows - 1);
            vitest_1.vi.useRealTimers();
        });
    });
    (0, vitest_1.describe)('Dispose', () => {
        (0, vitest_1.it)('should dispose all resources', () => {
            class MockResizeObserver {
                constructor() {
                    this.observe = vitest_1.vi.fn();
                    this.disconnect = vitest_1.vi.fn();
                    this.unobserve = vitest_1.vi.fn();
                }
            }
            vitest_1.vi.stubGlobal('ResizeObserver', MockResizeObserver);
            optimizer.setupOptimizedResize(mockTerminal, mockFitAddon, mockContainer, 'test-terminal');
            optimizer.dispose();
            // Verify cleanup
            (0, vitest_1.expect)(() => optimizer.dispose()).not.toThrow();
        });
        (0, vitest_1.it)('should dispose webglAddon if present', () => {
            const mockAddon = { dispose: vitest_1.vi.fn() };
            optimizer.webglAddon = mockAddon;
            optimizer.dispose();
            (0, vitest_1.expect)(mockAddon.dispose).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=RenderingOptimizer.test.js.map