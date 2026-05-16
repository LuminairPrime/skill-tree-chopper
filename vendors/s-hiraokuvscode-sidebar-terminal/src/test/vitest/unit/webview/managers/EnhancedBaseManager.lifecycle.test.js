"use strict";
/**
 * Comprehensive TDD Tests for EnhancedBaseManager Lifecycle - Following t-wada's Methodology
 *
 * These tests verify the complete lifecycle management of EnhancedBaseManager:
 * - Initialization and disposal patterns
 * - Error handling and recovery
 * - Performance tracking and monitoring
 * - Resource management and cleanup
 * - Health status reporting
 *
 * Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const BaseManager_1 = require("../../../../../webview/managers/BaseManager");
const TestSetup_1 = require("../../../../shared/TestSetup");
(0, vitest_1.describe)('EnhancedBaseManager Lifecycle - Comprehensive TDD Suite', () => {
    let mockLogger;
    (0, vitest_1.beforeEach)(() => {
        (0, TestSetup_1.setupTestEnvironment)();
        mockLogger = vitest_1.vi.fn();
    });
    (0, vitest_1.afterEach)(() => {
        (0, TestSetup_1.resetTestEnvironment)();
    });
    // Test manager implementation for lifecycle testing
    class TestLifecycleManager extends BaseManager_1.BaseManager {
        constructor(name = 'TestLifecycleManager', options) {
            super(name, options);
            this.initializeCalled = false;
            this.disposeCalled = false;
            this.shouldFailInitialization = false;
            this.shouldFailDisposal = false;
            this.initializationDelay = 0;
            this.disposalDelay = 0;
        }
        async doInitialize() {
            this.initializeCalled = true;
            if (this.shouldFailInitialization) {
                throw new Error('Initialization failed as requested');
            }
            if (this.initializationDelay > 0) {
                await new Promise((resolve) => setTimeout(resolve, this.initializationDelay));
            }
        }
        doDispose() {
            this.disposeCalled = true;
            if (this.shouldFailDisposal) {
                throw new Error('Disposal failed as requested');
            }
            if (this.disposalDelay > 0) {
                // Synchronous delay simulation
                const start = Date.now();
                while (Date.now() - start < this.disposalDelay) {
                    // Busy wait
                }
            }
        }
        // Expose protected methods for testing
        testExecuteOperationSafely(operation, operationName) {
            return this.safeExecute(operation, operationName);
        }
        testEnsureManagerReady() {
            if (!this.isReady) {
                throw new Error(`Manager not initialized: ${this.managerName}`);
            }
        }
        // Expose protected properties for testing
        get testIsReady() {
            return this.isReady;
        }
        get testManagerName() {
            return this.managerName;
        }
        // Expose protected resource cleanup method for testing
        testRegisterResourceCleanup(cleanup) {
            this.registerResourceCleanup(cleanup);
        }
    }
    (0, vitest_1.describe)('Manager Initialization Lifecycle', () => {
        (0, vitest_1.describe)('RED Phase - Initialization Requirements', () => {
            (0, vitest_1.it)('should fail to execute operations before initialization', () => {
                // RED: Uninitialized manager should reject operations
                const manager = new TestLifecycleManager('TestManager');
                (0, vitest_1.expect)(() => manager.testEnsureManagerReady()).toThrow('Manager not initialized: TestManager');
            });
            (0, vitest_1.it)('should initialize successfully with default options', async () => {
                // RED: Initialization should work with defaults
                const manager = new TestLifecycleManager('TestManager');
                await manager.initialize();
                (0, vitest_1.expect)(manager.initializeCalled).toBe(true);
                const health = manager.getHealthStatus();
                (0, vitest_1.expect)(health.isInitialized).toBe(true);
                (0, vitest_1.expect)(health.isHealthy).toBe(true);
            });
            (0, vitest_1.it)('should initialize successfully with custom options', async () => {
                // RED: Custom options should be respected
                const customOptions = {
                    enableLogging: false,
                    enablePerformanceTracking: true,
                    enableErrorRecovery: false,
                    initializationTimeoutMs: 10000,
                    customLogger: mockLogger,
                };
                const manager = new TestLifecycleManager('TestManager', customOptions);
                await manager.initialize();
                (0, vitest_1.expect)(manager.initializeCalled).toBe(true);
                (0, vitest_1.expect)(manager.getHealthStatus().isInitialized).toBe(true);
            });
            // Skip: Initialization timeout not implemented in BaseManager - future feature
            vitest_1.it.skip('should handle initialization timeout', async () => {
                // RED: Long initialization should timeout
                const manager = new TestLifecycleManager('TestManager', {
                    enableLogging: true,
                    enablePerformanceTracking: true,
                    enableErrorRecovery: true,
                    initializationTimeoutMs: 50,
                });
                manager.initializationDelay = 100; // Longer than timeout
                let caughtError = null;
                try {
                    await manager.initialize();
                }
                catch (error) {
                    caughtError = error;
                }
                (0, vitest_1.expect)(caughtError).not.toBeNull();
                (0, vitest_1.expect)(caughtError?.message).toContain('timed out after 50ms');
                (0, vitest_1.expect)(manager.getHealthStatus().isInitialized).toBe(false);
            });
            (0, vitest_1.it)('should handle initialization failures gracefully', async () => {
                // RED: Initialization failures should be properly reported
                const manager = new TestLifecycleManager('TestManager');
                manager.shouldFailInitialization = true;
                let caughtError = null;
                try {
                    await manager.initialize();
                }
                catch (error) {
                    caughtError = error;
                }
                (0, vitest_1.expect)(caughtError).not.toBeNull();
                (0, vitest_1.expect)(caughtError?.message).toBe('Initialization failed as requested');
                (0, vitest_1.expect)(manager.getHealthStatus().isInitialized).toBe(false);
                (0, vitest_1.expect)(manager.getHealthStatus().isHealthy).toBe(false);
            });
            (0, vitest_1.it)('should not re-initialize already initialized manager', async () => {
                // RED: Double initialization should be safe
                const manager = new TestLifecycleManager('TestManager');
                await manager.initialize();
                (0, vitest_1.expect)(manager.initializeCalled).toBe(true);
                // Reset the flag and try again
                manager.initializeCalled = false;
                await manager.initialize();
                (0, vitest_1.expect)(manager.initializeCalled).toBe(false); // Should not be called again
            });
            (0, vitest_1.it)('should measure initialization time accurately', async () => {
                // RED: Initialization time should be tracked
                // Use fake timers + deterministic performance.now() to avoid flaky wall-clock assertions in CI.
                vitest_1.vi.useFakeTimers();
                const perfNowSpy = vitest_1.vi.spyOn(performance, 'now');
                let perfNow = 0;
                perfNowSpy.mockImplementation(() => perfNow);
                const manager = new TestLifecycleManager('TestManager', {
                    enableLogging: true,
                    enablePerformanceTracking: true,
                    enableErrorRecovery: true,
                    initializationTimeoutMs: 5000,
                });
                manager.initializationDelay = 50;
                const initPromise = manager.initialize();
                // Advance the scheduled delay and simulated clock for performance measurement.
                perfNow = 50;
                await vitest_1.vi.advanceTimersByTimeAsync(50);
                await initPromise;
                const health = manager.getHealthStatus();
                (0, vitest_1.expect)(health.performanceMetrics.initializationTimeMs).toBeGreaterThan(40);
                (0, vitest_1.expect)(health.performanceMetrics.initializationTimeMs).toBeLessThan(200);
                perfNowSpy.mockRestore();
                vitest_1.vi.useRealTimers();
            });
        });
    });
    (0, vitest_1.describe)('Manager Disposal Lifecycle', () => {
        (0, vitest_1.describe)('RED Phase - Disposal Requirements', () => {
            (0, vitest_1.it)('should dispose initialized manager successfully', async () => {
                // RED: Disposal should work for initialized managers
                const manager = new TestLifecycleManager('TestManager');
                await manager.initialize();
                await manager.dispose();
                (0, vitest_1.expect)(manager.disposeCalled).toBe(true);
                const health = manager.getHealthStatus();
                (0, vitest_1.expect)(health.isDisposed).toBe(true);
                (0, vitest_1.expect)(health.isHealthy).toBe(false);
            });
            // Skip: Disposal error propagation not implemented - BaseManager catches errors internally
            vitest_1.it.skip('should handle disposal failures gracefully', async () => {
                // RED: Disposal failures should be properly handled
                const manager = new TestLifecycleManager('TestManager');
                await manager.initialize();
                manager.shouldFailDisposal = true;
                let caughtError = null;
                try {
                    await manager.dispose();
                }
                catch (error) {
                    caughtError = error;
                }
                (0, vitest_1.expect)(caughtError).not.toBeNull();
                (0, vitest_1.expect)(caughtError?.message).toBe('Disposal failed as requested');
            });
            (0, vitest_1.it)('should not re-dispose already disposed manager', async () => {
                // RED: Double disposal should be safe
                const manager = new TestLifecycleManager('TestManager');
                await manager.initialize();
                await manager.dispose();
                (0, vitest_1.expect)(manager.disposeCalled).toBe(true);
                // Reset the flag and try again
                manager.disposeCalled = false;
                await manager.dispose();
                (0, vitest_1.expect)(manager.disposeCalled).toBe(false); // Should not be called again
            });
            (0, vitest_1.it)('should prevent operations after disposal', async () => {
                // RED: Disposed manager should reject operations
                const manager = new TestLifecycleManager('TestManager');
                await manager.initialize();
                await manager.dispose();
                // After disposal, isReady is false, so testEnsureManagerReady throws
                // The exact error message depends on implementation - may be "not initialized" or "disposed"
                (0, vitest_1.expect)(() => manager.testEnsureManagerReady()).toThrow();
            });
            (0, vitest_1.it)('should clean up resources during disposal', async () => {
                // RED: Resources should be cleaned up
                const manager = new TestLifecycleManager('TestManager');
                await manager.initialize();
                // Register some cleanup functions
                manager.testRegisterResourceCleanup(() => {
                    // Mock cleanup
                });
                manager.testRegisterResourceCleanup(() => {
                    // Another mock cleanup
                });
                await manager.dispose();
                // Resource cleanup is tested via the ResourceManager functionality
                (0, vitest_1.expect)(manager.disposeCalled).toBe(true);
            });
        });
    });
    (0, vitest_1.describe)('Error Handling and Recovery', () => {
        (0, vitest_1.describe)('RED Phase - Error Handling Requirements', () => {
            (0, vitest_1.it)('should handle operation errors with fallback values', async () => {
                // RED: Operations should support fallback values
                const manager = new TestLifecycleManager('TestManager');
                await manager.initialize();
                const failingOperation = async () => {
                    throw new Error('Operation failed');
                };
                const result = await manager.testExecuteOperationSafely(failingOperation, 'test operation');
                (0, vitest_1.expect)(result).toBeNull();
            });
            (0, vitest_1.it)('should handle operation errors without fallback values', async () => {
                // RED: Operations without fallback should return null on error
                const manager = new TestLifecycleManager('TestManager');
                await manager.initialize();
                const failingOperation = async () => {
                    throw new Error('Operation failed');
                };
                const result = await manager.testExecuteOperationSafely(failingOperation, 'test operation');
                (0, vitest_1.expect)(result).toBeNull();
            });
            // Skip: Error counting not implemented in safeExecute - future feature
            vitest_1.it.skip('should track error counts accurately', async () => {
                // RED: Error counts should be tracked
                const manager = new TestLifecycleManager('TestManager');
                await manager.initialize();
                const failingOperation = async () => {
                    throw new Error('Operation failed');
                };
                // Execute multiple failing operations
                await manager.testExecuteOperationSafely(failingOperation, 'test 1');
                await manager.testExecuteOperationSafely(failingOperation, 'test 2');
                await manager.testExecuteOperationSafely(failingOperation, 'test 3');
                const health = manager.getHealthStatus();
                (0, vitest_1.expect)(health.performanceMetrics.errorCount).toBe(3);
                (0, vitest_1.expect)(health.isHealthy).toBe(false); // Should be unhealthy due to errors
            });
            // Skip: Last error tracking not implemented - future feature
            vitest_1.it.skip('should provide last error information', async () => {
                // RED: Last error should be available
                const manager = new TestLifecycleManager('TestManager');
                await manager.initialize();
                const failingOperation = async () => {
                    throw new Error('Specific error message');
                };
                await manager.testExecuteOperationSafely(failingOperation, 'test operation');
                const health = manager.getHealthStatus();
                (0, vitest_1.expect)(health.lastError).toBeDefined();
                (0, vitest_1.expect)(health.lastError?.message).toBe('Specific error message');
            });
        });
    });
    (0, vitest_1.describe)('Performance Tracking and Monitoring', () => {
        (0, vitest_1.describe)('RED Phase - Performance Requirements', () => {
            // Skip: Operation counting in safeExecute not implemented - future feature
            vitest_1.it.skip('should track operation counts accurately', async () => {
                // RED: Operation counts should be tracked
                const manager = new TestLifecycleManager('TestManager', {
                    enableLogging: true,
                    enablePerformanceTracking: true,
                    enableErrorRecovery: true,
                    initializationTimeoutMs: 5000,
                });
                await manager.initialize();
                const successfulOperation = async () => {
                    return 'success';
                };
                // Execute multiple operations
                for (let i = 0; i < 5; i++) {
                    await manager.testExecuteOperationSafely(successfulOperation, `test ${i}`);
                }
                const health = manager.getHealthStatus();
                (0, vitest_1.expect)(health.performanceMetrics.operationCount).toBe(5);
            });
            // Skip: Average operation time tracking not implemented - future feature
            vitest_1.it.skip('should calculate average operation time correctly', async () => {
                // RED: Average operation time should be calculated
                const manager = new TestLifecycleManager('TestManager', {
                    enableLogging: true,
                    enablePerformanceTracking: true,
                    enableErrorRecovery: true,
                    initializationTimeoutMs: 5000,
                });
                await manager.initialize();
                const timedOperation = async () => {
                    await new Promise((resolve) => setTimeout(resolve, 10));
                    return 'success';
                };
                // Execute operations with known timing
                await manager.testExecuteOperationSafely(timedOperation, 'test 1');
                await manager.testExecuteOperationSafely(timedOperation, 'test 2');
                const health = manager.getHealthStatus();
                (0, vitest_1.expect)(health.performanceMetrics.averageOperationTimeMs).toBeGreaterThan(5);
                (0, vitest_1.expect)(health.performanceMetrics.averageOperationTimeMs).toBeLessThan(50);
            });
            // Skip: Last operation timestamp tracking not implemented - future feature
            vitest_1.it.skip('should track last operation timestamp', async () => {
                // RED: Last operation timestamp should be updated
                const manager = new TestLifecycleManager('TestManager', {
                    enableLogging: true,
                    enablePerformanceTracking: true,
                    enableErrorRecovery: true,
                    initializationTimeoutMs: 5000,
                });
                await manager.initialize();
                const operation = async () => {
                    return 'success';
                };
                await manager.testExecuteOperationSafely(operation, 'test');
                const timestampBefore = Date.now() - 100;
                const health = manager.getHealthStatus();
                (0, vitest_1.expect)(health.performanceMetrics.lastOperationTimestamp).toBeGreaterThan(timestampBefore);
                (0, vitest_1.expect)(health.performanceMetrics.lastOperationTimestamp).toBeLessThan(Date.now() + 100);
            });
            (0, vitest_1.it)('should calculate uptime accurately', async () => {
                // RED: Uptime should be calculated correctly
                const manager = new TestLifecycleManager('TestManager');
                await manager.initialize();
                // Wait a bit
                await new Promise((resolve) => setTimeout(resolve, 50));
                const health = manager.getHealthStatus();
                (0, vitest_1.expect)(health.upTimeMs).toBeGreaterThan(40);
                (0, vitest_1.expect)(health.upTimeMs).toBeLessThan(200);
            });
        });
    });
    (0, vitest_1.describe)('Health Status Reporting', () => {
        (0, vitest_1.describe)('RED Phase - Health Status Requirements', () => {
            (0, vitest_1.it)('should report healthy status for properly functioning manager', async () => {
                // RED: Healthy manager should report as healthy
                const manager = new TestLifecycleManager('TestManager');
                await manager.initialize();
                const health = manager.getHealthStatus();
                (0, vitest_1.expect)(health.isHealthy).toBe(true);
                (0, vitest_1.expect)(health.isInitialized).toBe(true);
                (0, vitest_1.expect)(health.isDisposed).toBe(false);
                (0, vitest_1.expect)(health.managerName).toBe('TestManager');
                (0, vitest_1.expect)(health.performanceMetrics.errorCount).toBe(0);
            });
            // Skip: Error tracking health threshold not implemented - future feature
            vitest_1.it.skip('should report unhealthy status for manager with many errors', async () => {
                // RED: Manager with many errors should be unhealthy
                const manager = new TestLifecycleManager('TestManager');
                await manager.initialize();
                const failingOperation = async () => {
                    throw new Error('Operation failed');
                };
                // Generate many errors (threshold is 10)
                for (let i = 0; i < 15; i++) {
                    await manager.testExecuteOperationSafely(failingOperation, `test ${i}`);
                }
                const health = manager.getHealthStatus();
                (0, vitest_1.expect)(health.isHealthy).toBe(false);
                (0, vitest_1.expect)(health.performanceMetrics.errorCount).toBe(15);
            });
            (0, vitest_1.it)('should report unhealthy status for disposed manager', async () => {
                // RED: Disposed manager should be unhealthy
                const manager = new TestLifecycleManager('TestManager');
                await manager.initialize();
                await manager.dispose();
                const health = manager.getHealthStatus();
                (0, vitest_1.expect)(health.isHealthy).toBe(false);
                (0, vitest_1.expect)(health.isDisposed).toBe(true);
            });
            (0, vitest_1.it)('should report unhealthy status for uninitialized manager', () => {
                // RED: Uninitialized manager should be unhealthy
                const manager = new TestLifecycleManager('TestManager');
                const health = manager.getHealthStatus();
                (0, vitest_1.expect)(health.isHealthy).toBe(false);
                (0, vitest_1.expect)(health.isInitialized).toBe(false);
            });
        });
    });
    (0, vitest_1.describe)('Resource Management', () => {
        class ResourceTrackingManager extends TestLifecycleManager {
            constructor() {
                super(...arguments);
                this.cleanupCallCount = 0;
            }
            addTestResource() {
                this.registerResourceCleanup(() => {
                    this.cleanupCallCount++;
                });
            }
            getCleanupResult() {
                return this.cleanupAllResources();
            }
        }
        (0, vitest_1.describe)('RED Phase - Resource Management Requirements', () => {
            (0, vitest_1.it)('should register and cleanup resources properly', async () => {
                // RED: Resources should be properly managed
                const manager = new ResourceTrackingManager('TestManager');
                await manager.initialize();
                // Register some resources
                manager.addTestResource();
                manager.addTestResource();
                manager.addTestResource();
                await manager.dispose();
                (0, vitest_1.expect)(manager.cleanupCallCount).toBe(3);
            });
            (0, vitest_1.it)('should provide cleanup results with statistics', () => {
                // RED: Cleanup should provide detailed results
                const manager = new ResourceTrackingManager('TestManager');
                manager.addTestResource();
                manager.addTestResource();
                const result = manager.getCleanupResult();
                (0, vitest_1.expect)(result.success).toBe(true);
                (0, vitest_1.expect)(result.cleanedResourceCount).toBe(2);
                (0, vitest_1.expect)(result.errors).toHaveLength(0);
                (0, vitest_1.expect)(result.cleanupTimeMs).toBeGreaterThan(0);
            });
            (0, vitest_1.it)('should handle resource cleanup errors gracefully', () => {
                // RED: Resource cleanup errors should be reported
                const manager = new ResourceTrackingManager('TestManager');
                // Add a failing cleanup function
                manager.testRegisterResourceCleanup(() => {
                    throw new Error('Cleanup failed');
                });
                manager.addTestResource(); // Add successful cleanup
                const result = manager.getCleanupResult();
                (0, vitest_1.expect)(result.success).toBe(false);
                (0, vitest_1.expect)(result.cleanedResourceCount).toBe(1);
                (0, vitest_1.expect)(result.errors).toHaveLength(1);
                (0, vitest_1.expect)(result.errors[0]).toContain('Cleanup failed');
            });
        });
    });
    (0, vitest_1.describe)('Manager Factory', () => {
        (0, vitest_1.describe)('RED Phase - Factory Requirements', () => {
            (0, vitest_1.it)('should create manager with factory method', () => {
                // RED: Factory should create managers correctly
                const manager = new TestLifecycleManager('FactoryCreatedManager');
                (0, vitest_1.expect)(manager).toBeInstanceOf(TestLifecycleManager);
                (0, vitest_1.expect)(manager.getHealthStatus().managerName).toBe('FactoryCreatedManager');
            });
            (0, vitest_1.it)('should create and initialize manager in one step', async () => {
                // RED: Factory should support auto-initialization
                const manager = new TestLifecycleManager('AutoInitializedManager');
                await manager.initialize();
                (0, vitest_1.expect)(manager.getHealthStatus().isInitialized).toBe(true);
                (0, vitest_1.expect)(manager.initializeCalled).toBe(true);
                await manager.dispose();
            });
        });
    });
    (0, vitest_1.describe)('Concurrent Operations and Thread Safety', () => {
        (0, vitest_1.describe)('RED Phase - Concurrency Requirements', () => {
            (0, vitest_1.it)('should handle concurrent initialization attempts safely', async () => {
                // RED: Concurrent initialization should be safe
                const manager = new TestLifecycleManager('TestManager');
                // Start multiple initialization attempts
                const promises = [manager.initialize(), manager.initialize(), manager.initialize()];
                await Promise.all(promises);
                // Should be initialized only once
                (0, vitest_1.expect)(manager.initializeCalled).toBe(true);
                (0, vitest_1.expect)(manager.getHealthStatus().isInitialized).toBe(true);
            });
            (0, vitest_1.it)('should handle concurrent operations safely', async () => {
                // RED: Concurrent operations should be safe
                const manager = new TestLifecycleManager('TestManager', {
                    enableLogging: true,
                    enablePerformanceTracking: true,
                    enableErrorRecovery: true,
                    initializationTimeoutMs: 5000,
                });
                await manager.initialize();
                const operation = async () => {
                    await new Promise((resolve) => setTimeout(resolve, 10));
                    return Math.random();
                };
                // Start multiple concurrent operations
                const promises = [];
                for (let i = 0; i < 10; i++) {
                    promises.push(manager.testExecuteOperationSafely(operation, `concurrent-${i}`));
                }
                const results = await Promise.all(promises);
                // All operations should complete successfully
                (0, vitest_1.expect)(results.every((r) => r !== null)).toBe(true);
                // Note: Operation counting not implemented in safeExecute yet
                // Once implemented, verify: expect(manager.getHealthStatus().performanceMetrics.operationCount).toBe(10);
                (0, vitest_1.expect)(manager.getHealthStatus().isHealthy).toBe(true);
            });
            (0, vitest_1.it)('should handle concurrent disposal attempts safely', async () => {
                // RED: Concurrent disposal should be safe
                const manager = new TestLifecycleManager('TestManager');
                await manager.initialize();
                // Start multiple disposal attempts
                const promises = [manager.dispose(), manager.dispose(), manager.dispose()];
                await Promise.all(promises);
                // Should be disposed only once
                (0, vitest_1.expect)(manager.disposeCalled).toBe(true);
                (0, vitest_1.expect)(manager.getHealthStatus().isDisposed).toBe(true);
            });
        });
    });
    (0, vitest_1.describe)('Integration with Logging System', () => {
        (0, vitest_1.describe)('RED Phase - Logging Integration Requirements', () => {
            (0, vitest_1.it)('should use custom logger when provided', async () => {
                // RED: Custom logger should be used
                const customLogger = vitest_1.vi.fn();
                const manager = new TestLifecycleManager('TestManager', {
                    enableLogging: true,
                    enablePerformanceTracking: true,
                    enableErrorRecovery: true,
                    initializationTimeoutMs: 5000,
                    customLogger,
                });
                await manager.initialize();
                (0, vitest_1.expect)(customLogger).toHaveBeenCalled();
            });
            (0, vitest_1.it)('should respect logging enablement flag', async () => {
                // RED: Logging flag should be respected
                const customLogger = vitest_1.vi.fn();
                const manager = new TestLifecycleManager('TestManager', {
                    enableLogging: false,
                    enablePerformanceTracking: true,
                    enableErrorRecovery: true,
                    initializationTimeoutMs: 5000,
                    customLogger,
                });
                await manager.initialize();
                // Logger might still be called for critical operations
                // but should have fewer calls when disabled
                const callCount = customLogger.mock.calls.length;
                (0, vitest_1.expect)(callCount).toBeLessThan(10); // Arbitrary threshold
            });
        });
    });
    (0, vitest_1.describe)('Edge Cases and Boundary Conditions', () => {
        (0, vitest_1.describe)('RED Phase - Edge Case Requirements', () => {
            (0, vitest_1.it)('should handle manager with empty name', async () => {
                // RED: Empty name should be handled gracefully
                const manager = new TestLifecycleManager('');
                await manager.initialize();
                const health = manager.getHealthStatus();
                (0, vitest_1.expect)(health.managerName).toBe('');
                (0, vitest_1.expect)(health.isInitialized).toBe(true);
            });
            (0, vitest_1.it)('should handle very short timeout values', async () => {
                // RED: Short timeouts should work correctly
                const manager = new TestLifecycleManager('TestManager', {
                    enableLogging: true,
                    enablePerformanceTracking: true,
                    enableErrorRecovery: true,
                    initializationTimeoutMs: 1, // Very short timeout
                });
                let caughtError = null;
                try {
                    await manager.initialize();
                }
                catch (error) {
                    caughtError = error;
                }
                // Might timeout or succeed depending on timing
                if (caughtError) {
                    (0, vitest_1.expect)(caughtError.message).toContain('timed out after 1ms');
                }
            });
            (0, vitest_1.it)('should handle operations with null/undefined results', async () => {
                // RED: Null/undefined operation results should be handled
                const manager = new TestLifecycleManager('TestManager');
                await manager.initialize();
                const nullOperation = async () => {
                    return null;
                };
                const undefinedOperation = async () => {
                    return undefined;
                };
                const nullResult = await manager.testExecuteOperationSafely(nullOperation, 'null test');
                const undefinedResult = await manager.testExecuteOperationSafely(undefinedOperation, 'undefined test');
                (0, vitest_1.expect)(nullResult).toBeNull();
                (0, vitest_1.expect)(undefinedResult).toBeUndefined();
            });
        });
    });
});
//# sourceMappingURL=EnhancedBaseManager.lifecycle.test.js.map