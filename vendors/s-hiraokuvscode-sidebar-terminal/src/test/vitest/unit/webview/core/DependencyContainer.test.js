'use strict';
/**
 * DependencyContainer Unit Tests
 *
 * Tests for dependency injection container including:
 * - Service registration (factory and instance)
 * - Dependency resolution
 * - Lifecycle management
 * - Circular dependency detection
 * - LIFO disposal pattern
 * - Scoped containers
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const DependencyContainer_1 = require('../../../../../webview/core/DependencyContainer');
// Mock logger
vitest_1.vi.mock('../../../../../utils/logger', () => ({
  webview: vitest_1.vi.fn(),
}));
// Helper to create mock services
function createMockService(options = {}) {
  return {
    initialize: options.initializeImpl ?? vitest_1.vi.fn(),
    dispose: options.disposeImpl ?? vitest_1.vi.fn(),
    getHealthStatus: options.getHealthStatusImpl ?? vitest_1.vi.fn(() => ({ healthy: true })),
  };
}
// Simple mock service without IEnhancedBaseManager interface
function createSimpleService() {
  return {
    doSomething: vitest_1.vi.fn(),
  };
}
(0, vitest_1.describe)('DependencyContainer', () => {
  let container;
  (0, vitest_1.beforeEach)(() => {
    container = new DependencyContainer_1.DependencyContainer();
  });
  (0, vitest_1.afterEach)(() => {
    vitest_1.vi.clearAllMocks();
  });
  (0, vitest_1.describe)('register', () => {
    (0, vitest_1.it)('should register a service with factory', () => {
      const factory = () => createMockService();
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, factory);
      (0, vitest_1.expect)(
        container.isRegistered(DependencyContainer_1.ServiceType.UI_MANAGER)
      ).toBe(true);
    });
    (0, vitest_1.it)('should throw when registering duplicate service', () => {
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, () => createMockService());
      (0, vitest_1.expect)(() => {
        container.register(DependencyContainer_1.ServiceType.UI_MANAGER, () => createMockService());
      }).toThrow('Service ui_manager is already registered');
    });
    (0, vitest_1.it)('should register service with dependencies', () => {
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, () => createMockService(), [
        DependencyContainer_1.ServiceType.SETTINGS_COORDINATOR,
      ]);
      const graph = container.getDependencyGraph();
      (0, vitest_1.expect)(graph.get(DependencyContainer_1.ServiceType.UI_MANAGER)).toContain(
        DependencyContainer_1.ServiceType.SETTINGS_COORDINATOR
      );
    });
  });
  (0, vitest_1.describe)('registerInstance', () => {
    (0, vitest_1.it)('should register an existing instance', () => {
      const instance = createMockService();
      container.registerInstance(DependencyContainer_1.ServiceType.UI_MANAGER, instance);
      (0, vitest_1.expect)(
        container.isRegistered(DependencyContainer_1.ServiceType.UI_MANAGER)
      ).toBe(true);
      (0, vitest_1.expect)(container.isResolved(DependencyContainer_1.ServiceType.UI_MANAGER)).toBe(
        true
      );
    });
    (0, vitest_1.it)('should immediately mark instance as initialized', async () => {
      const instance = createMockService();
      container.registerInstance(DependencyContainer_1.ServiceType.UI_MANAGER, instance);
      const resolved = await container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER);
      (0, vitest_1.expect)(resolved).toBe(instance);
    });
  });
  (0, vitest_1.describe)('resolve', () => {
    (0, vitest_1.it)('should resolve a registered service', async () => {
      const mockService = createMockService();
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, () => mockService);
      const resolved = await container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER);
      (0, vitest_1.expect)(resolved).toBe(mockService);
    });
    (0, vitest_1.it)('should return same instance on multiple resolves', async () => {
      const mockService = createMockService();
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, () => mockService);
      const resolved1 = await container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER);
      const resolved2 = await container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER);
      (0, vitest_1.expect)(resolved1).toBe(resolved2);
    });
    (0, vitest_1.it)('should throw for unregistered service', async () => {
      await (0, vitest_1.expect)(
        container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER)
      ).rejects.toThrow('Service ui_manager is not registered');
    });
    (0, vitest_1.it)('should resolve dependencies before service', async () => {
      const order = [];
      container.register(DependencyContainer_1.ServiceType.SETTINGS_COORDINATOR, () => {
        order.push('settings');
        return createSimpleService();
      });
      container.register(
        DependencyContainer_1.ServiceType.UI_MANAGER,
        () => {
          order.push('ui');
          return createSimpleService();
        },
        [DependencyContainer_1.ServiceType.SETTINGS_COORDINATOR]
      );
      await container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER);
      (0, vitest_1.expect)(order).toEqual(['settings', 'ui']);
    });
    (0, vitest_1.it)('should handle async factory functions', async () => {
      const asyncService = createMockService();
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return asyncService;
      });
      const resolved = await container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER);
      (0, vitest_1.expect)(resolved).toBe(asyncService);
    });
    (0, vitest_1.it)('should throw when resolving during disposal', async () => {
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, () => createMockService());
      await container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER);
      // Start disposal
      const disposePromise = container.dispose();
      await disposePromise;
      await (0, vitest_1.expect)(
        container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER)
      ).rejects.toThrow('Container is disposing, cannot resolve services');
    });
    (0, vitest_1.it)('should handle concurrent resolution of same service', async () => {
      let callCount = 0;
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, async () => {
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return createMockService();
      });
      // Resolve concurrently
      const [result1, result2, result3] = await Promise.all([
        container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER),
        container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER),
        container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER),
      ]);
      // Factory should only be called once
      (0, vitest_1.expect)(callCount).toBe(1);
      (0, vitest_1.expect)(result1).toBe(result2);
      (0, vitest_1.expect)(result2).toBe(result3);
    });
  });
  (0, vitest_1.describe)('isRegistered', () => {
    (0, vitest_1.it)('should return true for registered service', () => {
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, () => createMockService());
      (0, vitest_1.expect)(
        container.isRegistered(DependencyContainer_1.ServiceType.UI_MANAGER)
      ).toBe(true);
    });
    (0, vitest_1.it)('should return false for unregistered service', () => {
      (0, vitest_1.expect)(
        container.isRegistered(DependencyContainer_1.ServiceType.UI_MANAGER)
      ).toBe(false);
    });
  });
  (0, vitest_1.describe)('isResolved', () => {
    (0, vitest_1.it)('should return true for resolved service', async () => {
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, () => createMockService());
      await container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER);
      (0, vitest_1.expect)(container.isResolved(DependencyContainer_1.ServiceType.UI_MANAGER)).toBe(
        true
      );
    });
    (0, vitest_1.it)('should return false for registered but not resolved service', () => {
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, () => createMockService());
      (0, vitest_1.expect)(container.isResolved(DependencyContainer_1.ServiceType.UI_MANAGER)).toBe(
        false
      );
    });
    (0, vitest_1.it)('should return false for unregistered service', () => {
      (0, vitest_1.expect)(container.isResolved(DependencyContainer_1.ServiceType.UI_MANAGER)).toBe(
        false
      );
    });
  });
  (0, vitest_1.describe)('getResolvedServices', () => {
    (0, vitest_1.it)('should return all resolved services', async () => {
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, () => createMockService());
      container.register(DependencyContainer_1.ServiceType.INPUT_MANAGER, () =>
        createMockService()
      );
      await container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER);
      const resolved = container.getResolvedServices();
      (0, vitest_1.expect)(resolved.size).toBe(1);
      (0, vitest_1.expect)(resolved.has(DependencyContainer_1.ServiceType.UI_MANAGER)).toBe(true);
      (0, vitest_1.expect)(resolved.has(DependencyContainer_1.ServiceType.INPUT_MANAGER)).toBe(
        false
      );
    });
    (0, vitest_1.it)('should return empty map when no services resolved', () => {
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, () => createMockService());
      const resolved = container.getResolvedServices();
      (0, vitest_1.expect)(resolved.size).toBe(0);
    });
  });
  (0, vitest_1.describe)('getServiceHealth', () => {
    (0, vitest_1.it)('should return health status for all registered services', async () => {
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, () => createMockService());
      container.register(DependencyContainer_1.ServiceType.INPUT_MANAGER, () =>
        createMockService()
      );
      await container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER);
      const health = container.getServiceHealth();
      (0, vitest_1.expect)(
        health.get(DependencyContainer_1.ServiceType.UI_MANAGER)?.lifecycle
      ).toBe(DependencyContainer_1.ServiceLifecycle.INITIALIZED);
      (0, vitest_1.expect)(
        health.get(DependencyContainer_1.ServiceType.INPUT_MANAGER)?.lifecycle
      ).toBe(DependencyContainer_1.ServiceLifecycle.REGISTERED);
    });
    (0, vitest_1.it)('should include error message for failed services', async () => {
      const error = new Error('Initialization failed');
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, () => {
        throw error;
      });
      try {
        await container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER);
      } catch {
        // Expected to fail
      }
      const health = container.getServiceHealth();
      (0, vitest_1.expect)(
        health.get(DependencyContainer_1.ServiceType.UI_MANAGER)?.lifecycle
      ).toBe(DependencyContainer_1.ServiceLifecycle.ERROR);
      (0, vitest_1.expect)(health.get(DependencyContainer_1.ServiceType.UI_MANAGER)?.error).toBe(
        'Initialization failed'
      );
    });
  });
  (0, vitest_1.describe)('getDependencyGraph', () => {
    (0, vitest_1.it)('should return complete dependency graph', () => {
      container.register(DependencyContainer_1.ServiceType.SETTINGS_COORDINATOR, () =>
        createSimpleService()
      );
      container.register(
        DependencyContainer_1.ServiceType.UI_MANAGER,
        () => createSimpleService(),
        [DependencyContainer_1.ServiceType.SETTINGS_COORDINATOR]
      );
      container.register(
        DependencyContainer_1.ServiceType.INPUT_MANAGER,
        () => createSimpleService(),
        [
          DependencyContainer_1.ServiceType.UI_MANAGER,
          DependencyContainer_1.ServiceType.SETTINGS_COORDINATOR,
        ]
      );
      const graph = container.getDependencyGraph();
      (0, vitest_1.expect)(
        graph.get(DependencyContainer_1.ServiceType.SETTINGS_COORDINATOR)
      ).toEqual([]);
      (0, vitest_1.expect)(graph.get(DependencyContainer_1.ServiceType.UI_MANAGER)).toEqual([
        DependencyContainer_1.ServiceType.SETTINGS_COORDINATOR,
      ]);
      (0, vitest_1.expect)(graph.get(DependencyContainer_1.ServiceType.INPUT_MANAGER)).toContain(
        DependencyContainer_1.ServiceType.UI_MANAGER
      );
      (0, vitest_1.expect)(graph.get(DependencyContainer_1.ServiceType.INPUT_MANAGER)).toContain(
        DependencyContainer_1.ServiceType.SETTINGS_COORDINATOR
      );
    });
  });
  (0, vitest_1.describe)('validateDependencyGraph', () => {
    (0, vitest_1.it)('should validate correct dependency graph', () => {
      container.register(DependencyContainer_1.ServiceType.SETTINGS_COORDINATOR, () =>
        createSimpleService()
      );
      container.register(
        DependencyContainer_1.ServiceType.UI_MANAGER,
        () => createSimpleService(),
        [DependencyContainer_1.ServiceType.SETTINGS_COORDINATOR]
      );
      const result = container.validateDependencyGraph();
      (0, vitest_1.expect)(result.isValid).toBe(true);
      (0, vitest_1.expect)(result.errors).toEqual([]);
    });
    (0, vitest_1.it)('should detect circular dependencies', () => {
      container.register(
        DependencyContainer_1.ServiceType.UI_MANAGER,
        () => createSimpleService(),
        [DependencyContainer_1.ServiceType.INPUT_MANAGER]
      );
      container.register(
        DependencyContainer_1.ServiceType.INPUT_MANAGER,
        () => createSimpleService(),
        [DependencyContainer_1.ServiceType.UI_MANAGER]
      );
      const result = container.validateDependencyGraph();
      (0, vitest_1.expect)(result.isValid).toBe(false);
      (0, vitest_1.expect)(result.errors.some((e) => e.includes('Circular dependency'))).toBe(true);
    });
    (0, vitest_1.it)('should detect missing dependencies', () => {
      container.register(
        DependencyContainer_1.ServiceType.UI_MANAGER,
        () => createSimpleService(),
        [DependencyContainer_1.ServiceType.SETTINGS_COORDINATOR]
      );
      // Note: SETTINGS_COORDINATOR is not registered
      const result = container.validateDependencyGraph();
      (0, vitest_1.expect)(result.isValid).toBe(false);
      (0, vitest_1.expect)(result.errors.some((e) => e.includes('Missing dependency'))).toBe(true);
    });
    (0, vitest_1.it)('should detect complex circular chains', () => {
      container.register(
        DependencyContainer_1.ServiceType.UI_MANAGER,
        () => createSimpleService(),
        [DependencyContainer_1.ServiceType.INPUT_MANAGER]
      );
      container.register(
        DependencyContainer_1.ServiceType.INPUT_MANAGER,
        () => createSimpleService(),
        [DependencyContainer_1.ServiceType.CONFIG_MANAGER]
      );
      container.register(
        DependencyContainer_1.ServiceType.CONFIG_MANAGER,
        () => createSimpleService(),
        [DependencyContainer_1.ServiceType.UI_MANAGER]
      );
      const result = container.validateDependencyGraph();
      (0, vitest_1.expect)(result.isValid).toBe(false);
      (0, vitest_1.expect)(result.errors.some((e) => e.includes('Circular dependency'))).toBe(true);
    });
  });
  (0, vitest_1.describe)('dispose', () => {
    (0, vitest_1.it)('should dispose all resolved services', async () => {
      const disposeFn1 = vitest_1.vi.fn();
      const disposeFn2 = vitest_1.vi.fn();
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, () =>
        createMockService({ disposeImpl: disposeFn1 })
      );
      container.register(DependencyContainer_1.ServiceType.INPUT_MANAGER, () =>
        createMockService({ disposeImpl: disposeFn2 })
      );
      await container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER);
      await container.resolve(DependencyContainer_1.ServiceType.INPUT_MANAGER);
      await container.dispose();
      (0, vitest_1.expect)(disposeFn1).toHaveBeenCalled();
      (0, vitest_1.expect)(disposeFn2).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should dispose in reverse initialization order (LIFO)', async () => {
      const order = [];
      container.register(DependencyContainer_1.ServiceType.SETTINGS_COORDINATOR, () =>
        createMockService({
          disposeImpl: () => order.push('settings'),
        })
      );
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, () =>
        createMockService({
          disposeImpl: () => order.push('ui'),
        })
      );
      container.register(DependencyContainer_1.ServiceType.INPUT_MANAGER, () =>
        createMockService({
          disposeImpl: () => order.push('input'),
        })
      );
      // Resolve in order: settings, ui, input
      await container.resolve(DependencyContainer_1.ServiceType.SETTINGS_COORDINATOR);
      await container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER);
      await container.resolve(DependencyContainer_1.ServiceType.INPUT_MANAGER);
      await container.dispose();
      // Should dispose in reverse order: input, ui, settings
      (0, vitest_1.expect)(order).toEqual(['input', 'ui', 'settings']);
    });
    (0, vitest_1.it)('should clear all registrations after disposal', async () => {
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, () => createMockService());
      await container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER);
      await container.dispose();
      (0, vitest_1.expect)(
        container.isRegistered(DependencyContainer_1.ServiceType.UI_MANAGER)
      ).toBe(false);
    });
    (0, vitest_1.it)('should handle multiple dispose calls gracefully', async () => {
      const disposeFn = vitest_1.vi.fn();
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, () =>
        createMockService({ disposeImpl: disposeFn })
      );
      await container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER);
      await container.dispose();
      await container.dispose();
      // First dispose clears services, second does nothing
      (0, vitest_1.expect)(disposeFn).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)('should handle disposal errors gracefully', async () => {
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, () =>
        createMockService({
          disposeImpl: () => {
            throw new Error('Dispose failed');
          },
        })
      );
      await container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER);
      // Should not throw
      await (0, vitest_1.expect)(container.dispose()).resolves.not.toThrow();
    });
    (0, vitest_1.it)(
      'should not dispose services without IEnhancedBaseManager interface',
      async () => {
        const simpleService = createSimpleService();
        container.register(DependencyContainer_1.ServiceType.UI_MANAGER, () => simpleService);
        await container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER);
        // Should not throw even without dispose method
        await (0, vitest_1.expect)(container.dispose()).resolves.not.toThrow();
      }
    );
  });
  (0, vitest_1.describe)('createScope', () => {
    (0, vitest_1.it)('should create a new container with copied registrations', () => {
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, () => createMockService());
      container.register(DependencyContainer_1.ServiceType.INPUT_MANAGER, () =>
        createMockService()
      );
      const scope = container.createScope();
      (0, vitest_1.expect)(scope.isRegistered(DependencyContainer_1.ServiceType.UI_MANAGER)).toBe(
        true
      );
      (0, vitest_1.expect)(
        scope.isRegistered(DependencyContainer_1.ServiceType.INPUT_MANAGER)
      ).toBe(true);
    });
    (0, vitest_1.it)('should not share instances with parent container', async () => {
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, () => createMockService());
      const scope = container.createScope();
      const parentInstance = await container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER);
      const scopeInstance = await scope.resolve(DependencyContainer_1.ServiceType.UI_MANAGER);
      (0, vitest_1.expect)(parentInstance).not.toBe(scopeInstance);
    });
    (0, vitest_1.it)('should copy dependencies', () => {
      container.register(DependencyContainer_1.ServiceType.SETTINGS_COORDINATOR, () =>
        createSimpleService()
      );
      container.register(
        DependencyContainer_1.ServiceType.UI_MANAGER,
        () => createSimpleService(),
        [DependencyContainer_1.ServiceType.SETTINGS_COORDINATOR]
      );
      const scope = container.createScope();
      const graph = scope.getDependencyGraph();
      (0, vitest_1.expect)(graph.get(DependencyContainer_1.ServiceType.UI_MANAGER)).toEqual([
        DependencyContainer_1.ServiceType.SETTINGS_COORDINATOR,
      ]);
    });
  });
  (0, vitest_1.describe)('getStatistics', () => {
    (0, vitest_1.it)('should return correct statistics', async () => {
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, () => createMockService());
      container.register(DependencyContainer_1.ServiceType.INPUT_MANAGER, () =>
        createMockService()
      );
      container.register(DependencyContainer_1.ServiceType.CONFIG_MANAGER, () => {
        throw new Error('Failed');
      });
      await container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER);
      try {
        await container.resolve(DependencyContainer_1.ServiceType.CONFIG_MANAGER);
      } catch {
        // Expected
      }
      const stats = container.getStatistics();
      (0, vitest_1.expect)(stats.totalServices).toBe(3);
      (0, vitest_1.expect)(stats.registeredServices).toBe(3);
      (0, vitest_1.expect)(stats.initializedServices).toBe(1);
      (0, vitest_1.expect)(stats.errorServices).toBe(1);
      (0, vitest_1.expect)(stats.memoryUsage).toBeGreaterThan(0);
    });
    (0, vitest_1.it)('should return empty statistics for empty container', () => {
      const stats = container.getStatistics();
      (0, vitest_1.expect)(stats.totalServices).toBe(0);
      (0, vitest_1.expect)(stats.registeredServices).toBe(0);
      (0, vitest_1.expect)(stats.initializedServices).toBe(0);
      (0, vitest_1.expect)(stats.errorServices).toBe(0);
    });
  });
  (0, vitest_1.describe)('IEnhancedBaseManager initialization', () => {
    (0, vitest_1.it)('should call initialize on enhanced managers', async () => {
      const initializeFn = vitest_1.vi.fn();
      const mockManager = createMockService({ initializeImpl: initializeFn });
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, () => mockManager);
      await container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER);
      (0, vitest_1.expect)(initializeFn).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should pass resolved dependencies to initialize', async () => {
      let passedDeps = null;
      const mockManager = {
        initialize: vitest_1.vi.fn((deps) => {
          passedDeps = deps;
        }),
        dispose: vitest_1.vi.fn(),
        getHealthStatus: vitest_1.vi.fn(() => ({ healthy: true })),
      };
      const settingsService = createSimpleService();
      container.register(
        DependencyContainer_1.ServiceType.SETTINGS_COORDINATOR,
        () => settingsService
      );
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, () => mockManager, [
        DependencyContainer_1.ServiceType.SETTINGS_COORDINATOR,
      ]);
      await container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER);
      (0, vitest_1.expect)(passedDeps).toBeDefined();
      (0, vitest_1.expect)(passedDeps.settingsCoordinator).toBe(settingsService);
    });
  });
  (0, vitest_1.describe)('Error handling', () => {
    (0, vitest_1.it)('should track error state on initialization failure', async () => {
      const error = new Error('Init failed');
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, () => {
        throw error;
      });
      try {
        await container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER);
      } catch {
        // Expected
      }
      const health = container.getServiceHealth();
      (0, vitest_1.expect)(
        health.get(DependencyContainer_1.ServiceType.UI_MANAGER)?.lifecycle
      ).toBe(DependencyContainer_1.ServiceLifecycle.ERROR);
    });
    (0, vitest_1.it)('should propagate errors from factory', async () => {
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, () => {
        throw new Error('Factory error');
      });
      await (0, vitest_1.expect)(
        container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER)
      ).rejects.toThrow('Factory error');
    });
    (0, vitest_1.it)('should propagate errors from async factory', async () => {
      container.register(DependencyContainer_1.ServiceType.UI_MANAGER, async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw new Error('Async factory error');
      });
      await (0, vitest_1.expect)(
        container.resolve(DependencyContainer_1.ServiceType.UI_MANAGER)
      ).rejects.toThrow('Async factory error');
    });
  });
});
//# sourceMappingURL=DependencyContainer.test.js.map
