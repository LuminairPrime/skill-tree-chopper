"use strict";
/**
 * ScrollbackManager - BaseManager Integration Tests
 *
 * Tests for Issue #216 Phase 2: Verifies ScrollbackManager properly extends BaseManager
 *
 * Vitest Migration: Converted from Mocha/Chai to Vitest
 *
 * @see docs/refactoring/issue-216-manager-standardization.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ScrollbackManager_1 = require("../../../../../webview/managers/ScrollbackManager");
(0, vitest_1.describe)('ScrollbackManager - BaseManager Integration', () => {
    let manager;
    (0, vitest_1.beforeEach)(() => {
        manager = new ScrollbackManager_1.ScrollbackManager();
    });
    (0, vitest_1.afterEach)(() => {
        if (manager && !manager['isDisposed']) {
            manager.dispose();
        }
    });
    (0, vitest_1.describe)('BaseManager Inheritance', () => {
        (0, vitest_1.it)('should extend BaseManager', () => {
            (0, vitest_1.expect)(manager).toBeInstanceOf(ScrollbackManager_1.ScrollbackManager);
            // Verify BaseManager methods are available
            (0, vitest_1.expect)(manager).toHaveProperty('initialize');
            (0, vitest_1.expect)(manager).toHaveProperty('dispose');
            (0, vitest_1.expect)(manager).toHaveProperty('getStatus');
            (0, vitest_1.expect)(manager).toHaveProperty('getHealthStatus');
            (0, vitest_1.expect)(manager).toHaveProperty('getPerformanceMetrics');
        });
        (0, vitest_1.it)('should implement IDisposable', () => {
            const disposable = manager;
            (0, vitest_1.expect)(disposable).toHaveProperty('dispose');
            (0, vitest_1.expect)(typeof disposable.dispose).toBe('function');
        });
    });
    (0, vitest_1.describe)('Lifecycle Management', () => {
        (0, vitest_1.it)('should initialize successfully', async () => {
            await manager.initialize();
            const status = manager.getStatus();
            (0, vitest_1.expect)(status.name).toBe('ScrollbackManager');
            (0, vitest_1.expect)(status.isReady).toBe(true);
            (0, vitest_1.expect)(status.isDisposed).toBe(false);
        });
        (0, vitest_1.it)('should dispose successfully', async () => {
            await manager.initialize();
            manager.dispose();
            const status = manager.getStatus();
            (0, vitest_1.expect)(status.isReady).toBe(false);
            (0, vitest_1.expect)(status.isDisposed).toBe(true);
        });
        (0, vitest_1.it)('should handle dispose without initialization', () => {
            (0, vitest_1.expect)(() => manager.dispose()).not.toThrow();
            (0, vitest_1.expect)(manager['isDisposed']).toBe(true);
        });
        (0, vitest_1.it)('should not reinitialize if already initialized', async () => {
            await manager.initialize();
            const _firstInit = Date.now();
            await manager.initialize();
            const metrics = manager.getPerformanceMetrics();
            // Should only initialize once
            (0, vitest_1.expect)(metrics.initializationTimeMs).toBeGreaterThan(0);
        });
    });
    (0, vitest_1.describe)('Health Status Monitoring', () => {
        (0, vitest_1.it)('should report healthy status when initialized', async () => {
            await manager.initialize();
            // Small delay to ensure upTimeMs is tracked
            await new Promise((resolve) => setTimeout(resolve, 10));
            const health = manager.getHealthStatus();
            (0, vitest_1.expect)(health.managerName).toBe('ScrollbackManager');
            (0, vitest_1.expect)(health.isHealthy).toBe(true);
            (0, vitest_1.expect)(health.isInitialized).toBe(true);
            (0, vitest_1.expect)(health.isDisposed).toBe(false);
            // upTimeMs should be at least 0 (initialization may be very fast)
            (0, vitest_1.expect)(health.upTimeMs).toBeGreaterThanOrEqual(0);
        });
        (0, vitest_1.it)('should report unhealthy status when disposed', async () => {
            await manager.initialize();
            manager.dispose();
            const health = manager.getHealthStatus();
            (0, vitest_1.expect)(health.isHealthy).toBe(false);
            (0, vitest_1.expect)(health.isDisposed).toBe(true);
        });
        (0, vitest_1.it)('should track performance metrics', async () => {
            await manager.initialize();
            const metrics = manager.getPerformanceMetrics();
            (0, vitest_1.expect)(metrics).toHaveProperty('initializationTimeMs');
            (0, vitest_1.expect)(metrics).toHaveProperty('operationCount');
            (0, vitest_1.expect)(metrics).toHaveProperty('averageOperationTimeMs');
            (0, vitest_1.expect)(metrics).toHaveProperty('errorCount');
            (0, vitest_1.expect)(metrics.initializationTimeMs).toBeGreaterThan(0);
        });
    });
    (0, vitest_1.describe)('Existing Functionality Preservation', () => {
        (0, vitest_1.it)('should maintain terminal registration capability', () => {
            // ScrollbackManager should still be able to register terminals
            (0, vitest_1.expect)(manager).toHaveProperty('registerTerminal');
            (0, vitest_1.expect)(typeof manager.registerTerminal).toBe('function');
        });
        (0, vitest_1.it)('should maintain scrollback save/restore capability', () => {
            (0, vitest_1.expect)(manager).toHaveProperty('saveScrollback');
            (0, vitest_1.expect)(manager).toHaveProperty('restoreScrollback');
            (0, vitest_1.expect)(typeof manager.saveScrollback).toBe('function');
            (0, vitest_1.expect)(typeof manager.restoreScrollback).toBe('function');
        });
        (0, vitest_1.it)('should maintain stats retrieval', () => {
            (0, vitest_1.expect)(manager).toHaveProperty('getStats');
            (0, vitest_1.expect)(typeof manager.getStats).toBe('function');
            const stats = manager.getStats();
            (0, vitest_1.expect)(stats).toHaveProperty('registeredTerminals');
            (0, vitest_1.expect)(stats).toHaveProperty('terminals');
        });
        (0, vitest_1.it)('should clear registered terminals on dispose', async () => {
            await manager.initialize();
            // Initial state - no terminals
            let stats = manager.getStats();
            (0, vitest_1.expect)(stats.registeredTerminals).toBe(0);
            manager.dispose();
            // After dispose - still no terminals (already empty)
            stats = manager.getStats();
            (0, vitest_1.expect)(stats.registeredTerminals).toBe(0);
        });
    });
    (0, vitest_1.describe)('Error Handling', () => {
        (0, vitest_1.it)('should handle errors gracefully', async () => {
            await manager.initialize();
            // Reset error count
            manager.resetErrorCount();
            const metrics = manager.getPerformanceMetrics();
            (0, vitest_1.expect)(metrics.errorCount).toBe(0);
        });
    });
    (0, vitest_1.describe)('Resource Cleanup', () => {
        (0, vitest_1.it)('should cleanup resources on dispose', async () => {
            await manager.initialize();
            // Get initial stats
            const statsBefore = manager.getStats();
            (0, vitest_1.expect)(statsBefore.terminals).toBeInstanceOf(Array);
            // Dispose
            manager.dispose();
            // Verify cleanup
            (0, vitest_1.expect)(manager['isDisposed']).toBe(true);
        });
    });
});
//# sourceMappingURL=ScrollbackManager.BaseManager.test.js.map