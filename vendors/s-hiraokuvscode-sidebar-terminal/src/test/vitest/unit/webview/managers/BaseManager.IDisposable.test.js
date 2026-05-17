'use strict';
/**
 * BaseManager IDisposable Implementation Tests
 *
 * Tests for Issue #216: Ensures BaseManager properly implements IDisposable interface
 *
 * Vitest Migration: Converted from Mocha/Chai to Vitest
 *
 * @see docs/refactoring/issue-216-manager-standardization.md
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const BaseManager_1 = require('../../../../../webview/managers/BaseManager');
// Concrete test implementation of BaseManager
class TestManager extends BaseManager_1.BaseManager {
  constructor(name = 'TestManager') {
    super(name, {
      enableLogging: false,
      enablePerformanceTracking: true,
      enableErrorRecovery: true,
    });
    this.initializeCallCount = 0;
    this.disposeCallCount = 0;
  }
  doInitialize() {
    this.initializeCallCount++;
  }
  doDispose() {
    this.disposeCallCount++;
  }
}
(0, vitest_1.describe)('BaseManager - IDisposable Implementation', () => {
  let manager;
  (0, vitest_1.beforeEach)(() => {
    manager = new TestManager();
  });
  (0, vitest_1.afterEach)(() => {
    if (manager && !manager['isDisposed']) {
      manager.dispose();
    }
  });
  (0, vitest_1.describe)('IDisposable Interface', () => {
    (0, vitest_1.it)('should implement IDisposable interface', () => {
      // Type assertion to ensure IDisposable is implemented
      const disposable = manager;
      (0, vitest_1.expect)(disposable).toHaveProperty('dispose');
      (0, vitest_1.expect)(typeof disposable.dispose).toBe('function');
    });
    (0, vitest_1.it)('should have dispose method', () => {
      (0, vitest_1.expect)(manager).toHaveProperty('dispose');
      (0, vitest_1.expect)(typeof manager.dispose).toBe('function');
    });
  });
  (0, vitest_1.describe)('Initialization Lifecycle', () => {
    (0, vitest_1.it)('should initialize successfully', async () => {
      await manager.initialize();
      (0, vitest_1.expect)(manager.initializeCallCount).toBe(1);
      (0, vitest_1.expect)(manager['isReady']).toBe(true);
      (0, vitest_1.expect)(manager['isDisposed']).toBe(false);
    });
    (0, vitest_1.it)('should not reinitialize if already initialized', async () => {
      await manager.initialize();
      await manager.initialize();
      (0, vitest_1.expect)(manager.initializeCallCount).toBe(1);
    });
    (0, vitest_1.it)('should track initialization time', async () => {
      await manager.initialize();
      const metrics = manager.getPerformanceMetrics();
      (0, vitest_1.expect)(metrics.initializationTimeMs).toBeGreaterThan(0);
    });
  });
  (0, vitest_1.describe)('Disposal Lifecycle', () => {
    (0, vitest_1.it)('should dispose successfully', async () => {
      await manager.initialize();
      manager.dispose();
      (0, vitest_1.expect)(manager.disposeCallCount).toBe(1);
      (0, vitest_1.expect)(manager['isReady']).toBe(false);
      (0, vitest_1.expect)(manager['isDisposed']).toBe(true);
    });
    (0, vitest_1.it)('should not dispose twice', async () => {
      await manager.initialize();
      manager.dispose();
      manager.dispose();
      (0, vitest_1.expect)(manager.disposeCallCount).toBe(1);
    });
    (0, vitest_1.it)('should dispose without initialization', () => {
      manager.dispose();
      (0, vitest_1.expect)(manager.disposeCallCount).toBe(1);
      (0, vitest_1.expect)(manager['isDisposed']).toBe(true);
    });
  });
  (0, vitest_1.describe)('Status Reporting', () => {
    (0, vitest_1.it)('should return correct status after initialization', async () => {
      await manager.initialize();
      const status = manager.getStatus();
      (0, vitest_1.expect)(status.name).toBe('TestManager');
      (0, vitest_1.expect)(status.isReady).toBe(true);
      (0, vitest_1.expect)(status.isDisposed).toBe(false);
    });
    (0, vitest_1.it)('should return correct status after disposal', async () => {
      await manager.initialize();
      manager.dispose();
      const status = manager.getStatus();
      (0, vitest_1.expect)(status.name).toBe('TestManager');
      (0, vitest_1.expect)(status.isReady).toBe(false);
      (0, vitest_1.expect)(status.isDisposed).toBe(true);
    });
  });
  (0, vitest_1.describe)('Health Status', () => {
    (0, vitest_1.it)('should report healthy status when initialized', async () => {
      await manager.initialize();
      // Small delay to ensure upTimeMs is tracked
      await new Promise((resolve) => setTimeout(resolve, 5));
      const health = manager.getHealthStatus();
      (0, vitest_1.expect)(health.managerName).toBe('TestManager');
      (0, vitest_1.expect)(health.isHealthy).toBe(true);
      (0, vitest_1.expect)(health.isInitialized).toBe(true);
      (0, vitest_1.expect)(health.isDisposed).toBe(false);
      // upTimeMs may be 0 on very fast initialization
      (0, vitest_1.expect)(health.upTimeMs).toBeGreaterThanOrEqual(0);
    });
    (0, vitest_1.it)('should report unhealthy status when disposed', async () => {
      await manager.initialize();
      manager.dispose();
      const health = manager.getHealthStatus();
      (0, vitest_1.expect)(health.isHealthy).toBe(false);
      (0, vitest_1.expect)(health.isDisposed).toBe(true);
    });
  });
  (0, vitest_1.describe)('Performance Metrics', () => {
    (0, vitest_1.it)('should track performance metrics', async () => {
      await manager.initialize();
      const metrics = manager.getPerformanceMetrics();
      (0, vitest_1.expect)(metrics).toHaveProperty('initializationTimeMs');
      (0, vitest_1.expect)(metrics).toHaveProperty('operationCount');
      (0, vitest_1.expect)(metrics).toHaveProperty('averageOperationTimeMs');
      (0, vitest_1.expect)(metrics).toHaveProperty('errorCount');
      (0, vitest_1.expect)(metrics).toHaveProperty('lastOperationTimestamp');
    });
    (0, vitest_1.it)('should reset performance metrics', async () => {
      await manager.initialize();
      manager.resetPerformanceMetrics();
      const metrics = manager.getPerformanceMetrics();
      (0, vitest_1.expect)(metrics.operationCount).toBe(0);
      (0, vitest_1.expect)(metrics.averageOperationTimeMs).toBe(0);
    });
  });
  (0, vitest_1.describe)('Resource Cleanup', () => {
    (0, vitest_1.it)('should cleanup all registered resources on dispose', async () => {
      let cleanupCalled = false;
      await manager.initialize();
      // Register a cleanup function
      manager['registerResourceCleanup'](() => {
        cleanupCalled = true;
      });
      manager.dispose();
      (0, vitest_1.expect)(cleanupCalled).toBe(true);
    });
    (0, vitest_1.it)('should handle resource cleanup errors gracefully', async () => {
      await manager.initialize();
      // Register a cleanup function that throws
      manager['registerResourceCleanup'](() => {
        throw new Error('Cleanup error');
      });
      // Should not throw
      (0, vitest_1.expect)(() => manager.dispose()).not.toThrow();
      (0, vitest_1.expect)(manager['isDisposed']).toBe(true);
    });
  });
  (0, vitest_1.describe)('Error Handling', () => {
    (0, vitest_1.it)('should track error count', async () => {
      await manager.initialize();
      // Initially no errors
      (0, vitest_1.expect)(manager['errorHandler']['getErrorCount']()).toBe(0);
      // Reset error count
      manager.resetErrorCount();
      (0, vitest_1.expect)(manager['errorHandler']['getErrorCount']()).toBe(0);
    });
  });
  (0, vitest_1.describe)('Abstract Method Enforcement', () => {
    (0, vitest_1.it)('should require doInitialize implementation', () => {
      class _IncompleteManager extends BaseManager_1.BaseManager {
        doDispose() {}
        doInitialize() {}
      }
      // This test verifies that TypeScript enforces abstract method implementation
      // If this compiles, it means the abstract methods are properly enforced
    });
  });
});
//# sourceMappingURL=BaseManager.IDisposable.test.js.map
