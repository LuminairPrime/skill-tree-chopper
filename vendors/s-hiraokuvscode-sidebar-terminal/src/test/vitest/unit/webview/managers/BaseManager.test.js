"use strict";
/**
 * BaseManager Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const BaseManager_1 = require("../../../../../webview/managers/BaseManager");
// Concrete implementation for testing
class TestManager extends BaseManager_1.BaseManager {
    constructor() {
        super('TestManager');
        this.doInitCalled = 0;
        this.doDisposeCalled = 0;
    }
    async doInitialize() {
        this.doInitCalled++;
    }
    doDispose() {
        this.doDisposeCalled++;
    }
    // Expose protected methods for testing
    testSafeExecute(op, name) {
        return this.safeExecute(op, name);
    }
    testRegisterCleanup(fn) {
        this.registerResourceCleanup(fn);
    }
}
// Mock logger
vitest_1.vi.mock('../../../../../webview/utils/logger', () => ({
    webview: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('BaseManager', () => {
    let manager;
    (0, vitest_1.beforeEach)(() => {
        manager = new TestManager();
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('Lifecycle', () => {
        (0, vitest_1.it)('should initialize successfully', async () => {
            await manager.initialize();
            (0, vitest_1.expect)(manager.doInitCalled).toBe(1);
            (0, vitest_1.expect)(manager.getStatus().isReady).toBe(true);
        });
        (0, vitest_1.it)('should not initialize twice', async () => {
            await manager.initialize();
            await manager.initialize();
            (0, vitest_1.expect)(manager.doInitCalled).toBe(1);
        });
        (0, vitest_1.it)('should handle initialization failure', async () => {
            const failingManager = new (class extends BaseManager_1.BaseManager {
                async doInitialize() {
                    throw new Error('Init fail');
                }
                doDispose() { }
            })('Failing');
            await (0, vitest_1.expect)(failingManager.initialize()).rejects.toThrow('Init fail');
            (0, vitest_1.expect)(failingManager.getStatus().isReady).toBe(false);
        });
        (0, vitest_1.it)('should dispose successfully', async () => {
            await manager.initialize();
            manager.dispose();
            (0, vitest_1.expect)(manager.doDisposeCalled).toBe(1);
            (0, vitest_1.expect)(manager.getStatus().isDisposed).toBe(true);
            (0, vitest_1.expect)(manager.getStatus().isReady).toBe(false);
        });
        (0, vitest_1.it)('should not dispose twice', () => {
            manager.dispose();
            manager.dispose();
            (0, vitest_1.expect)(manager.doDisposeCalled).toBe(1);
        });
    });
    (0, vitest_1.describe)('Safe Execution', () => {
        (0, vitest_1.it)('should return null if executing before init', async () => {
            const result = await manager.testSafeExecute(async () => 'ok', 'op');
            (0, vitest_1.expect)(result).toBeNull();
        });
        (0, vitest_1.it)('should execute successfully after init', async () => {
            await manager.initialize();
            const result = await manager.testSafeExecute(async () => 'success', 'op');
            (0, vitest_1.expect)(result).toBe('success');
        });
        (0, vitest_1.it)('should return null and log error if operation fails', async () => {
            await manager.initialize();
            const result = await manager.testSafeExecute(async () => {
                throw new Error('Fail');
            }, 'op');
            (0, vitest_1.expect)(result).toBeNull();
        });
    });
    (0, vitest_1.describe)('Resource Management', () => {
        (0, vitest_1.it)('should run registered cleanup functions on dispose', () => {
            const cleanup = vitest_1.vi.fn();
            manager.testRegisterCleanup(cleanup);
            manager.dispose();
            (0, vitest_1.expect)(cleanup).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle cleanup errors gracefully', () => {
            const cleanup = () => {
                throw new Error('Cleanup fail');
            };
            manager.testRegisterCleanup(cleanup);
            // Should not throw
            (0, vitest_1.expect)(() => manager.dispose()).not.toThrow();
        });
    });
    (0, vitest_1.describe)('Health and Metrics', () => {
        (0, vitest_1.it)('should provide health status', async () => {
            await manager.initialize();
            const status = manager.getHealthStatus();
            (0, vitest_1.expect)(status.managerName).toBe('TestManager');
            (0, vitest_1.expect)(status.isHealthy).toBe(true);
        });
        (0, vitest_1.it)('should track performance metrics', async () => {
            await manager.initialize();
            const metrics = manager.getPerformanceMetrics();
            (0, vitest_1.expect)(metrics.initializationTimeMs).toBeGreaterThanOrEqual(0);
        });
    });
});
//# sourceMappingURL=BaseManager.test.js.map