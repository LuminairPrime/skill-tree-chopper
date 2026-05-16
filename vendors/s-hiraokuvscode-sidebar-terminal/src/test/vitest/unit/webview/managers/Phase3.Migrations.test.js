"use strict";
/**
 * Phase 3 Manager Migrations - Integration Tests
 *
 * Tests for Issue #216 Phase 3: Verifies TerminalEventManager
 * properly extends BaseManager with constructor injection pattern.
 *
 * Note: SimplePersistenceManager was removed in Issue #215 persistence consolidation,
 * replaced by WebViewPersistenceService.
 *
 * Vitest Migration: Converted from Mocha/Chai to Vitest
 *
 * @see docs/refactoring/issue-216-manager-standardization.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TerminalEventManager_1 = require("../../../../../webview/managers/TerminalEventManager");
(0, vitest_1.describe)('Phase 3 Manager Migrations', () => {
    (0, vitest_1.describe)('TerminalEventManager', () => {
        let manager;
        const mockCoordinator = {
            setActiveTerminalId: (_id) => { },
            deleteTerminalSafely: async (_id) => { },
            handleAiAgentToggle: (_id) => { },
        };
        const mockEventRegistry = {
            register: (_id, _element, _event, _handler) => { },
        };
        (0, vitest_1.beforeEach)(() => {
            manager = new TerminalEventManager_1.TerminalEventManager(mockCoordinator, mockEventRegistry);
        });
        (0, vitest_1.afterEach)(() => {
            if (manager && !manager['isDisposed']) {
                manager.dispose();
            }
        });
        (0, vitest_1.it)('should extend BaseManager', () => {
            (0, vitest_1.expect)(manager).toHaveProperty('initialize');
            (0, vitest_1.expect)(manager).toHaveProperty('dispose');
            (0, vitest_1.expect)(manager).toHaveProperty('getStatus');
        });
        (0, vitest_1.it)('should implement IDisposable', () => {
            const disposable = manager;
            (0, vitest_1.expect)(disposable).toHaveProperty('dispose');
        });
        (0, vitest_1.it)('should use constructor injection', () => {
            // Verify dependencies are provided via constructor (not setCoordinator)
            (0, vitest_1.expect)(manager['coordinator']).toBe(mockCoordinator);
            (0, vitest_1.expect)(manager['eventRegistry']).toBe(mockEventRegistry);
        });
        (0, vitest_1.it)('should initialize successfully', async () => {
            await manager.initialize();
            const status = manager.getStatus();
            (0, vitest_1.expect)(status.name).toBe('TerminalEventManager');
            (0, vitest_1.expect)(status.isReady).toBe(true);
        });
        (0, vitest_1.it)('should maintain existing event management functionality', () => {
            (0, vitest_1.expect)(manager).toHaveProperty('setupTerminalEvents');
            (0, vitest_1.expect)(manager).toHaveProperty('focusTerminal');
            (0, vitest_1.expect)(manager).toHaveProperty('blurTerminal');
            (0, vitest_1.expect)(manager).toHaveProperty('createContainerCallbacks');
            (0, vitest_1.expect)(typeof manager.setupTerminalEvents).toBe('function');
            (0, vitest_1.expect)(typeof manager.focusTerminal).toBe('function');
        });
        (0, vitest_1.it)('should dispose properly', async () => {
            await manager.initialize();
            manager.dispose();
            const status = manager.getStatus();
            (0, vitest_1.expect)(status.isDisposed).toBe(true);
        });
        (0, vitest_1.it)('should provide performance metrics', async () => {
            await manager.initialize();
            const metrics = manager.getPerformanceMetrics();
            (0, vitest_1.expect)(metrics).toHaveProperty('initializationTimeMs');
            (0, vitest_1.expect)(metrics).toHaveProperty('operationCount');
            (0, vitest_1.expect)(metrics.initializationTimeMs).toBeGreaterThan(0);
        });
    });
    (0, vitest_1.describe)('Migration Pattern Verification', () => {
        (0, vitest_1.it)('should follow constructor injection pattern (not late-binding)', () => {
            const mockCoordinator = {};
            const mockEventRegistry = {};
            // ✅ Good: Constructor injection
            const eventManager = new TerminalEventManager_1.TerminalEventManager(mockCoordinator, mockEventRegistry);
            // Verify no setCoordinator method exists (late-binding eliminated)
            (0, vitest_1.expect)(eventManager).not.toHaveProperty('setCoordinator');
            eventManager.dispose();
        });
        (0, vitest_1.it)('should enforce BaseManager lifecycle', async () => {
            const mockCoordinator = {};
            const mockEventRegistry = {};
            const manager = new TerminalEventManager_1.TerminalEventManager(mockCoordinator, mockEventRegistry);
            // Before initialization
            let status = manager.getStatus();
            (0, vitest_1.expect)(status.isReady).toBe(false);
            // After initialization
            await manager.initialize();
            status = manager.getStatus();
            (0, vitest_1.expect)(status.isReady).toBe(true);
            // After disposal
            manager.dispose();
            status = manager.getStatus();
            (0, vitest_1.expect)(status.isDisposed).toBe(true);
        });
        (0, vitest_1.it)('should support multiple manager instances with different dependencies', () => {
            const coordinator1 = { id: 'coord1' };
            const coordinator2 = { id: 'coord2' };
            const registry1 = { id: 'reg1' };
            const registry2 = { id: 'reg2' };
            const manager1 = new TerminalEventManager_1.TerminalEventManager(coordinator1, registry1);
            const manager2 = new TerminalEventManager_1.TerminalEventManager(coordinator2, registry2);
            (0, vitest_1.expect)(manager1['coordinator']).toBe(coordinator1);
            (0, vitest_1.expect)(manager2['coordinator']).toBe(coordinator2);
            (0, vitest_1.expect)(manager1['coordinator']).not.toBe(manager2['coordinator']);
            manager1.dispose();
            manager2.dispose();
        });
    });
    (0, vitest_1.describe)('Phase 3 Summary', () => {
        (0, vitest_1.it)('should verify Phase 3 migration pattern', () => {
            const mockCoordinator = {};
            const mockEventRegistry = {};
            // Phase 3: Constructor injection managers
            const eventManager = new TerminalEventManager_1.TerminalEventManager(mockCoordinator, mockEventRegistry);
            // Should extend BaseManager
            (0, vitest_1.expect)(eventManager).toHaveProperty('initialize');
            (0, vitest_1.expect)(eventManager).toHaveProperty('dispose');
            (0, vitest_1.expect)(eventManager).toHaveProperty('getStatus');
            (0, vitest_1.expect)(eventManager).toHaveProperty('getHealthStatus');
            (0, vitest_1.expect)(eventManager).toHaveProperty('getPerformanceMetrics');
            // Should use constructor injection (no setCoordinator)
            (0, vitest_1.expect)(eventManager).not.toHaveProperty('setCoordinator');
            eventManager.dispose();
        });
    });
});
//# sourceMappingURL=Phase3.Migrations.test.js.map