"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const PerformanceManager_1 = require("../../../../../webview/managers/PerformanceManager");
const ResizeManager_1 = require("../../../../../webview/utils/ResizeManager");
const DOMUtils_1 = require("../../../../../webview/utils/DOMUtils");
// Mock ResizeManager
vi.mock('../../../../../webview/utils/ResizeManager', () => ({
    ResizeManager: {
        debounceResize: vi.fn(),
        clearResize: vi.fn(),
    },
}));
// Mock DOMUtils
vi.mock('../../../../../webview/utils/DOMUtils', () => ({
    DOMUtils: {
        resetXtermInlineStyles: vi.fn(),
    },
}));
// Mock BaseManager
vi.mock('../../../../../webview/managers/BaseManager', () => {
    return {
        BaseManager: class {
            constructor() {
                this.logger = vi.fn();
            }
            dispose() { }
        },
    };
});
(0, vitest_1.describe)('PerformanceManager', () => {
    let manager;
    let mockTerminal;
    let mockCoordinator;
    let mockFitAddon;
    beforeEach(() => {
        vi.useFakeTimers();
        mockTerminal = {
            write: vi.fn(),
            resize: vi.fn(),
            buffer: {
                active: {
                    cursorX: 10,
                    cursorY: 5,
                },
            },
            element: {
                parentElement: {},
            },
        };
        mockCoordinator = {
            postMessageToExtension: vi.fn(),
        };
        mockFitAddon = {
            fit: vi.fn(),
        };
        manager = new PerformanceManager_1.PerformanceManager();
        manager.initializePerformance(mockCoordinator);
    });
    afterEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
    });
    (0, vitest_1.describe)('bufferedWrite', () => {
        (0, vitest_1.it)('should write data to terminal', () => {
            manager.bufferedWrite('test data', mockTerminal, 'term-1');
            // 'test data' is length 9, which is <= 10 (isSmallInput), so it should flush immediately
            (0, vitest_1.expect)(mockTerminal.write).toHaveBeenCalledWith('test data');
        });
        (0, vitest_1.it)('should handle DSR query', () => {
            const dsrQuery = '\x1b[6n';
            manager.bufferedWrite(dsrQuery, mockTerminal, 'term-1');
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'input',
                terminalId: 'term-1',
                data: '\x1b[6;11R', // row 6 (5+1), col 11 (10+1)
            }));
        });
        (0, vitest_1.it)('should buffer moderate output if not urgent', () => {
            // Create a moderate output that isn't "small" but not "large" enough to force flush immediately
            // isSmallInput <= 10
            // isModerateOutput >= 50
            // isLargeOutput >= 500
            const data = 'a'.repeat(40);
            manager.bufferedWrite(data, mockTerminal, 'term-1');
            (0, vitest_1.expect)(mockTerminal.write).not.toHaveBeenCalled();
            vi.advanceTimersByTime(100); // Advance time to trigger flush (default ~16ms)
            (0, vitest_1.expect)(mockTerminal.write).toHaveBeenCalledWith(data);
        });
    });
    (0, vitest_1.describe)('scheduleOutputBuffer', () => {
        (0, vitest_1.it)('should flush immediately for small input', () => {
            const smallInput = 'cmd';
            manager.scheduleOutputBuffer(smallInput, mockTerminal);
            (0, vitest_1.expect)(mockTerminal.write).toHaveBeenCalledWith(smallInput);
        });
        (0, vitest_1.it)('should flush immediately for large output', () => {
            const largeOutput = 'a'.repeat(600);
            manager.scheduleOutputBuffer(largeOutput, mockTerminal);
            (0, vitest_1.expect)(mockTerminal.write).toHaveBeenCalledWith(largeOutput);
        });
    });
    (0, vitest_1.describe)('debouncedResize', () => {
        (0, vitest_1.it)('should use ResizeManager to debounce resize', () => {
            manager.debouncedResize(100, 50, mockTerminal, mockFitAddon);
            (0, vitest_1.expect)(ResizeManager_1.ResizeManager.debounceResize).toHaveBeenCalled();
            // Simulate the callback execution
            // @ts-expect-error - test mock type
            const callback = vi.mocked(ResizeManager_1.ResizeManager.debounceResize).mock.calls[0][1];
            callback();
            (0, vitest_1.expect)(mockTerminal.resize).toHaveBeenCalledWith(100, 50);
            (0, vitest_1.expect)(DOMUtils_1.DOMUtils.resetXtermInlineStyles).toHaveBeenCalled();
            (0, vitest_1.expect)(mockFitAddon.fit).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('CliAgentMode', () => {
        (0, vitest_1.it)('should set and get mode', () => {
            (0, vitest_1.expect)(manager.getCliAgentMode()).toBe(false);
            manager.setCliAgentMode(true);
            (0, vitest_1.expect)(manager.getCliAgentMode()).toBe(true);
        });
        (0, vitest_1.it)('should flush buffer when disabling cli agent mode', () => {
            manager.setCliAgentMode(true);
            const data = 'a'.repeat(40);
            manager.bufferedWrite(data, mockTerminal, 'term-1');
            // Should be buffered
            (0, vitest_1.expect)(mockTerminal.write).not.toHaveBeenCalled();
            manager.setCliAgentMode(false);
            (0, vitest_1.expect)(mockTerminal.write).toHaveBeenCalledWith(data);
        });
    });
    (0, vitest_1.describe)('forceFlush', () => {
        (0, vitest_1.it)('should flush all buffers', () => {
            const data = 'a'.repeat(40);
            manager.bufferedWrite(data, mockTerminal, 'term-1');
            (0, vitest_1.expect)(mockTerminal.write).not.toHaveBeenCalled();
            manager.forceFlush();
            (0, vitest_1.expect)(mockTerminal.write).toHaveBeenCalledWith(data);
        });
    });
    (0, vitest_1.describe)('clearBuffers', () => {
        (0, vitest_1.it)('should clear buffers without writing', () => {
            const data = 'a'.repeat(40);
            manager.bufferedWrite(data, mockTerminal, 'term-1');
            manager.clearBuffers();
            vi.advanceTimersByTime(100);
            (0, vitest_1.expect)(mockTerminal.write).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should clear CLI mode timeout buffers without throwing', () => {
            manager.setCliAgentMode(true);
            const data = 'a'.repeat(40);
            manager.bufferedWrite(data, mockTerminal, 'term-1');
            (0, vitest_1.expect)(() => manager.clearBuffers()).not.toThrow();
            vi.advanceTimersByTime(100);
            (0, vitest_1.expect)(mockTerminal.write).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('getBufferStats', () => {
        (0, vitest_1.it)('should return correct stats', () => {
            const data = 'a'.repeat(40);
            manager.bufferedWrite(data, mockTerminal, 'term-1');
            const stats = manager.getBufferStats();
            (0, vitest_1.expect)(stats.bufferSize).toBe(1);
            (0, vitest_1.expect)(stats.isFlushScheduled).toBe(true);
            (0, vitest_1.expect)(stats.currentTerminal).toBe(true);
        });
    });
    (0, vitest_1.describe)('removeTerminal', () => {
        (0, vitest_1.it)('should remove the terminal entry from bufferEntries', () => {
            // Buffer some data to create an entry
            const data = 'a'.repeat(40);
            manager.bufferedWrite(data, mockTerminal, 'term-1');
            // Verify entry exists
            let stats = manager.getBufferStats();
            (0, vitest_1.expect)(stats.currentTerminal).toBe(true);
            // Remove terminal
            manager.removeTerminal(mockTerminal);
            // Entry should be gone
            stats = manager.getBufferStats();
            (0, vitest_1.expect)(stats.currentTerminal).toBe(false);
            (0, vitest_1.expect)(stats.bufferSize).toBe(0);
        });
        (0, vitest_1.it)('should flush pending data before removing terminal', () => {
            const data = 'a'.repeat(40);
            manager.bufferedWrite(data, mockTerminal, 'term-1');
            manager.removeTerminal(mockTerminal);
            // Data should have been flushed
            (0, vitest_1.expect)(mockTerminal.write).toHaveBeenCalledWith(data);
        });
        (0, vitest_1.it)('should cancel pending timer when removing terminal', () => {
            const data = 'a'.repeat(40);
            manager.bufferedWrite(data, mockTerminal, 'term-1');
            manager.removeTerminal(mockTerminal);
            // Advancing timers should not cause errors (timer was cleared)
            (0, vitest_1.expect)(() => vi.advanceTimersByTime(100)).not.toThrow();
        });
        (0, vitest_1.it)('should handle removing a terminal that has no buffer entry', () => {
            const unknownTerminal = { write: vi.fn() };
            (0, vitest_1.expect)(() => manager.removeTerminal(unknownTerminal)).not.toThrow();
        });
        (0, vitest_1.it)('should allow GC of terminal object after removal', () => {
            const data = 'a'.repeat(40);
            manager.bufferedWrite(data, mockTerminal, 'term-1');
            manager.removeTerminal(mockTerminal);
            // The map should no longer hold a reference to the terminal
            const stats = manager.getBufferStats();
            (0, vitest_1.expect)(stats.currentTerminal).toBe(false);
        });
    });
});
//# sourceMappingURL=PerformanceManager.test.js.map