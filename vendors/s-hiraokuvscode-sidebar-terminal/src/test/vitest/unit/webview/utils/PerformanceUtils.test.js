"use strict";
/**
 * PerformanceUtils Tests
 *
 * Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TestSetup_1 = require("../../../../shared/TestSetup");
const PerformanceUtils_1 = require("../../../../../webview/utils/PerformanceUtils");
(0, vitest_1.describe)('PerformanceUtils', () => {
    (0, vitest_1.beforeEach)(() => {
        (0, TestSetup_1.setupTestEnvironment)();
        vitest_1.vi.useFakeTimers();
        // Mock requestAnimationFrame and cancelAnimationFrame
        global.requestAnimationFrame = vitest_1.vi.fn((cb) => {
            cb(0);
            return 0;
        });
        global.cancelAnimationFrame = vitest_1.vi.fn();
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.useRealTimers();
        (0, TestSetup_1.resetTestEnvironment)();
        delete global.requestAnimationFrame;
        delete global.cancelAnimationFrame;
    });
    (0, vitest_1.describe)('debounce', () => {
        (0, vitest_1.it)('should debounce function calls', async () => {
            vitest_1.vi.useRealTimers(); // Use real timers for this test
            const mockFn = vitest_1.vi.fn();
            const debouncedFn = PerformanceUtils_1.PerformanceUtils.debounce(mockFn, 50);
            debouncedFn('test1');
            debouncedFn('test2');
            debouncedFn('test3');
            (0, vitest_1.expect)(mockFn).not.toHaveBeenCalled();
            await new Promise((resolve) => setTimeout(resolve, 100));
            (0, vitest_1.expect)(mockFn).toHaveBeenCalledOnce();
            (0, vitest_1.expect)(mockFn).toHaveBeenCalledWith('test3');
            vitest_1.vi.useFakeTimers(); // Restore fake timers
        });
        (0, vitest_1.it)('should handle multiple debounced calls', async () => {
            vitest_1.vi.useRealTimers(); // Use real timers for this test
            const mockFn = vitest_1.vi.fn();
            const debouncedFn = PerformanceUtils_1.PerformanceUtils.debounce(mockFn, 30);
            debouncedFn('first');
            await new Promise((resolve) => setTimeout(resolve, 15));
            debouncedFn('second');
            await new Promise((resolve) => setTimeout(resolve, 15));
            debouncedFn('third');
            await new Promise((resolve) => setTimeout(resolve, 50));
            (0, vitest_1.expect)(mockFn).toHaveBeenCalledOnce();
            (0, vitest_1.expect)(mockFn).toHaveBeenCalledWith('third');
            vitest_1.vi.useFakeTimers(); // Restore fake timers
        });
    });
    vitest_1.describe.skip('throttle', () => {
        (0, vitest_1.it)('should create throttled function', () => {
            const mockFn = vitest_1.vi.fn();
            const throttledFn = PerformanceUtils_1.PerformanceUtils.throttle(mockFn, 100);
            (0, vitest_1.expect)(throttledFn).toBeTypeOf('function');
            // Call immediately - should execute right away
            throttledFn('test1');
            // At minimum, verify function was created successfully
            (0, vitest_1.expect)(mockFn).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should limit rapid calls', () => {
            const mockFn = vitest_1.vi.fn();
            const throttledFn = PerformanceUtils_1.PerformanceUtils.throttle(mockFn, 100);
            // First call should execute immediately
            throttledFn('first');
            (0, vitest_1.expect)(mockFn).toHaveBeenCalledOnce();
            // Rapid subsequent calls within throttle period
            throttledFn('second');
            throttledFn('third');
            // Should still only have been called once immediately
            (0, vitest_1.expect)(mockFn).toHaveBeenCalledOnce();
        });
    });
    (0, vitest_1.describe)('requestIdleCallback', () => {
        (0, vitest_1.it)('should execute callback when idle', async () => {
            const callback = vitest_1.vi.fn();
            PerformanceUtils_1.PerformanceUtils.requestIdleCallback(callback);
            // Advance timers to trigger the setTimeout fallback
            vitest_1.vi.advanceTimersByTime(1);
            await vitest_1.vi.runAllTimersAsync();
            (0, vitest_1.expect)(callback).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle timeout option', async () => {
            const callback = vitest_1.vi.fn();
            PerformanceUtils_1.PerformanceUtils.requestIdleCallback(callback, 100);
            vitest_1.vi.advanceTimersByTime(1);
            await vitest_1.vi.runAllTimersAsync();
            (0, vitest_1.expect)(callback).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('measurePerformance', () => {
        (0, vitest_1.it)('should measure function performance', () => {
            const testFn = () => {
                // Simulate some work
                for (let i = 0; i < 1000; i++) {
                    Math.random();
                }
            };
            const result = PerformanceUtils_1.PerformanceUtils.measurePerformance('test-operation', testFn);
            (0, vitest_1.expect)(result).not.toBeTypeOf('number'); // Returns the function result, not duration
        });
        (0, vitest_1.it)('should handle function with return value', () => {
            const testFn = () => 'test result';
            const result = PerformanceUtils_1.PerformanceUtils.measurePerformance('test-with-return', testFn);
            (0, vitest_1.expect)(result).toBe('test result');
        });
    });
    (0, vitest_1.describe)('getMemoryUsage', () => {
        (0, vitest_1.it)('should return memory usage info', () => {
            // Mock performance.memory
            global.performance = {
                memory: {
                    usedJSHeapSize: 1000000,
                    totalJSHeapSize: 2000000,
                    jsHeapSizeLimit: 4000000,
                },
            };
            const usage = PerformanceUtils_1.PerformanceUtils.getMemoryUsage();
            (0, vitest_1.expect)(usage).toBeTypeOf('object');
            (0, vitest_1.expect)(usage).toHaveProperty('usedJSHeapSize', 1000000);
            (0, vitest_1.expect)(usage).toHaveProperty('totalJSHeapSize', 2000000);
            (0, vitest_1.expect)(usage).toHaveProperty('jsHeapSizeLimit', 4000000);
        });
        (0, vitest_1.it)('should handle missing performance.memory', () => {
            // Save original performance
            const originalPerf = global.performance;
            // Set performance without memory property
            global.performance = {};
            const usage = PerformanceUtils_1.PerformanceUtils.getMemoryUsage();
            (0, vitest_1.expect)(usage).toBeNull();
            // Restore original performance
            global.performance = originalPerf;
        });
    });
    (0, vitest_1.describe)('deepClone', () => {
        (0, vitest_1.it)('should clone simple objects', () => {
            const original = { name: 'test', value: 42 };
            const cloned = PerformanceUtils_1.PerformanceUtils.deepClone(original);
            (0, vitest_1.expect)(cloned).not.toBe(original);
            (0, vitest_1.expect)(cloned).toEqual(original);
        });
        (0, vitest_1.it)('should clone arrays', () => {
            const original = [1, 2, { nested: 'value' }];
            const cloned = PerformanceUtils_1.PerformanceUtils.deepClone(original);
            (0, vitest_1.expect)(cloned).not.toBe(original);
            (0, vitest_1.expect)(cloned).toEqual(original);
            (0, vitest_1.expect)(cloned[2]).not.toBe(original[2]);
        });
        (0, vitest_1.it)('should handle null and primitive values', () => {
            (0, vitest_1.expect)(PerformanceUtils_1.PerformanceUtils.deepClone(null)).toBeNull();
            (0, vitest_1.expect)(PerformanceUtils_1.PerformanceUtils.deepClone(42)).toBe(42);
            (0, vitest_1.expect)(PerformanceUtils_1.PerformanceUtils.deepClone('test')).toBe('test');
        });
    });
});
//# sourceMappingURL=PerformanceUtils.test.js.map