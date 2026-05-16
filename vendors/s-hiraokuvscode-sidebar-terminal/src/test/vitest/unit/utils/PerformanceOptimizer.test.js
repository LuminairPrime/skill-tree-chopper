"use strict";
/**
 * PerformanceMonitor Unit Tests
 *
 * Tests for performance monitoring utilities including
 * metrics collection and bounded growth.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const PerformanceOptimizer_1 = require("../../../../utils/PerformanceOptimizer");
// Mock logger
vitest_1.vi.mock('../../../../utils/logger', () => ({
    log: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('PerformanceMonitor', () => {
    let monitor;
    (0, vitest_1.beforeEach)(() => {
        // Reset singleton for each test
        PerformanceOptimizer_1.PerformanceMonitor.instance = undefined;
        monitor = PerformanceOptimizer_1.PerformanceMonitor.getInstance();
        monitor.clearMetrics();
    });
    (0, vitest_1.describe)('singleton', () => {
        (0, vitest_1.it)('should return the same instance', () => {
            const instance1 = PerformanceOptimizer_1.PerformanceMonitor.getInstance();
            const instance2 = PerformanceOptimizer_1.PerformanceMonitor.getInstance();
            (0, vitest_1.expect)(instance1).toBe(instance2);
        });
    });
    (0, vitest_1.describe)('timer operations', () => {
        (0, vitest_1.it)('should start and end timer', () => {
            monitor.startTimer('test-op');
            const duration = monitor.endTimer('test-op');
            (0, vitest_1.expect)(duration).toBeGreaterThanOrEqual(0);
        });
        (0, vitest_1.it)('should return null for unknown timer', () => {
            const duration = monitor.endTimer('unknown');
            (0, vitest_1.expect)(duration).toBeNull();
        });
        (0, vitest_1.it)('should return metrics', () => {
            monitor.startTimer('op1');
            monitor.endTimer('op1');
            const metrics = monitor.getMetrics();
            (0, vitest_1.expect)(metrics).toHaveProperty('op1');
        });
    });
    (0, vitest_1.describe)('Bug #6: metrics unbounded growth', () => {
        (0, vitest_1.it)('should not grow beyond MAX_METRICS_SIZE entries', () => {
            const MAX_SIZE = 1000;
            // Add more entries than the max
            for (let i = 0; i < MAX_SIZE + 200; i++) {
                monitor.startTimer(`metric-${i}`);
                monitor.endTimer(`metric-${i}`);
            }
            // The metrics map should not exceed MAX_SIZE
            const metrics = monitor.getMetrics();
            const metricCount = Object.keys(metrics).length;
            (0, vitest_1.expect)(metricCount).toBeLessThanOrEqual(MAX_SIZE);
        });
        (0, vitest_1.it)('should evict oldest entries when max size is reached', () => {
            const MAX_SIZE = 1000;
            // Fill to capacity
            for (let i = 0; i < MAX_SIZE; i++) {
                monitor.startTimer(`old-metric-${i}`);
                monitor.endTimer(`old-metric-${i}`);
            }
            // Add one more
            monitor.startTimer('new-metric');
            monitor.endTimer('new-metric');
            const metrics = monitor.getMetrics();
            // The newest metric should be present
            (0, vitest_1.expect)(metrics).toHaveProperty('new-metric');
            // Total count should not exceed MAX_SIZE
            (0, vitest_1.expect)(Object.keys(metrics).length).toBeLessThanOrEqual(MAX_SIZE);
        });
        (0, vitest_1.it)('should clear all metrics', () => {
            monitor.startTimer('op1');
            monitor.endTimer('op1');
            monitor.clearMetrics();
            const metrics = monitor.getMetrics();
            (0, vitest_1.expect)(Object.keys(metrics).length).toBe(0);
        });
    });
});
//# sourceMappingURL=PerformanceOptimizer.test.js.map