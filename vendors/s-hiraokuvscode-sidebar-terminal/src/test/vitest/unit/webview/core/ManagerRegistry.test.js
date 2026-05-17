'use strict';
/**
 * ManagerRegistry Unit Tests
 *
 * Tests for unified lifecycle management including:
 * - Manager registration (eager and lazy)
 * - Dependency-ordered initialization
 * - LIFO disposal pattern
 * - Type-safe manager retrieval
 * - Priority-based ordering
 * - Circular dependency detection
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const ManagerRegistry_1 = require('../../../../../webview/core/ManagerRegistry');
// Mock logger
vi.mock('../../../../../utils/logger', () => ({
  webview: vi.fn(),
}));
// Helper to create mock managers
function createMockManager(options = {}) {
  return {
    initialize: options.initializeImpl ?? vi.fn(),
    dispose: options.disposeImpl ?? vi.fn(),
  };
}
(0, vitest_1.describe)('ManagerRegistry', () => {
  let registry;
  beforeEach(() => {
    registry = new ManagerRegistry_1.ManagerRegistry();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });
  (0, vitest_1.describe)('register', () => {
    (0, vitest_1.it)('should register a manager', () => {
      const manager = createMockManager();
      registry.register('test', () => manager);
      (0, vitest_1.expect)(registry.has('test')).toBe(true);
    });
    (0, vitest_1.it)('should return manager instance on registration', () => {
      const manager = createMockManager();
      const result = registry.register('test', () => manager);
      (0, vitest_1.expect)(result).toBe(manager);
    });
    (0, vitest_1.it)('should not register duplicate managers', () => {
      const manager1 = createMockManager();
      const manager2 = createMockManager();
      registry.register('test', () => manager1);
      const result = registry.register('test', () => manager2);
      (0, vitest_1.expect)(result).toBe(manager1);
    });
    (0, vitest_1.it)('should support lazy registration', () => {
      const factory = vi.fn(() => createMockManager());
      const result = registry.register('test', factory, { lazy: true });
      (0, vitest_1.expect)(result).toBeNull();
      (0, vitest_1.expect)(factory).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should create lazy manager on first access', () => {
      const manager = createMockManager();
      const factory = vi.fn(() => manager);
      registry.register('test', factory, { lazy: true });
      const result = registry.get('test');
      (0, vitest_1.expect)(factory).toHaveBeenCalledTimes(1);
      (0, vitest_1.expect)(result).toBe(manager);
    });
  });
  (0, vitest_1.describe)('get', () => {
    (0, vitest_1.it)('should return registered manager', () => {
      const manager = createMockManager();
      registry.register('test', () => manager);
      (0, vitest_1.expect)(registry.get('test')).toBe(manager);
    });
    (0, vitest_1.it)('should return undefined for unregistered manager', () => {
      (0, vitest_1.expect)(registry.get('nonexistent')).toBeUndefined();
    });
    (0, vitest_1.it)('should return typed manager', () => {
      const manager = {
        ...createMockManager(),
        customMethod: vi.fn(),
      };
      registry.register('custom', () => manager);
      const result = registry.get('custom');
      (0, vitest_1.expect)(result?.customMethod).toBeDefined();
    });
  });
  (0, vitest_1.describe)('has', () => {
    (0, vitest_1.it)('should return true for registered manager', () => {
      registry.register('test', () => createMockManager());
      (0, vitest_1.expect)(registry.has('test')).toBe(true);
    });
    (0, vitest_1.it)('should return false for unregistered manager', () => {
      (0, vitest_1.expect)(registry.has('nonexistent')).toBe(false);
    });
  });
  (0, vitest_1.describe)('initializeAll', () => {
    (0, vitest_1.it)('should initialize all registered managers', async () => {
      const initFn1 = vi.fn();
      const initFn2 = vi.fn();
      registry.register('manager1', () => createMockManager({ initializeImpl: initFn1 }));
      registry.register('manager2', () => createMockManager({ initializeImpl: initFn2 }));
      await registry.initializeAll();
      (0, vitest_1.expect)(initFn1).toHaveBeenCalled();
      (0, vitest_1.expect)(initFn2).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should initialize managers in dependency order', async () => {
      const order = [];
      registry.register(
        'dependent',
        () =>
          createMockManager({
            initializeImpl: () => {
              order.push('dependent');
            },
          }),
        { dependsOn: ['dependency'] }
      );
      registry.register('dependency', () =>
        createMockManager({
          initializeImpl: () => {
            order.push('dependency');
          },
        })
      );
      await registry.initializeAll();
      (0, vitest_1.expect)(order).toEqual(['dependency', 'dependent']);
    });
    (0, vitest_1.it)('should initialize managers by priority', async () => {
      const order = [];
      registry.register(
        'low',
        () =>
          createMockManager({
            initializeImpl: () => {
              order.push('low');
            },
          }),
        { priority: 1 }
      );
      registry.register(
        'high',
        () =>
          createMockManager({
            initializeImpl: () => {
              order.push('high');
            },
          }),
        { priority: 10 }
      );
      registry.register(
        'medium',
        () =>
          createMockManager({
            initializeImpl: () => {
              order.push('medium');
            },
          }),
        { priority: 5 }
      );
      await registry.initializeAll();
      (0, vitest_1.expect)(order).toEqual(['high', 'medium', 'low']);
    });
    (0, vitest_1.it)('should handle async initialization', async () => {
      const initFn = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
      registry.register('async', () => createMockManager({ initializeImpl: initFn }));
      await registry.initializeAll();
      (0, vitest_1.expect)(initFn).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should throw on circular dependency', async () => {
      registry.register('a', () => createMockManager(), { dependsOn: ['b'] });
      registry.register('b', () => createMockManager(), { dependsOn: ['a'] });
      await (0, vitest_1.expect)(registry.initializeAll()).rejects.toThrow(/Circular dependency/);
    });
    (0, vitest_1.it)('should throw when initializing after disposal', async () => {
      registry.disposeAll();
      await (0, vitest_1.expect)(registry.initializeAll()).rejects.toThrow(
        /Cannot initialize after disposal/
      );
    });
    (0, vitest_1.it)('should propagate initialization errors', async () => {
      const error = new Error('Init failed');
      registry.register('failing', () =>
        createMockManager({
          initializeImpl: () => {
            throw error;
          },
        })
      );
      await (0, vitest_1.expect)(registry.initializeAll()).rejects.toThrow('Init failed');
    });
    (0, vitest_1.it)('should handle managers without initialize method', async () => {
      const manager = {
        dispose: vi.fn(),
      };
      registry.register('noInit', () => manager);
      await (0, vitest_1.expect)(registry.initializeAll()).resolves.not.toThrow();
    });
    (0, vitest_1.it)('should initialize lazy managers', async () => {
      const initFn = vi.fn();
      registry.register('lazy', () => createMockManager({ initializeImpl: initFn }), {
        lazy: true,
      });
      await registry.initializeAll();
      (0, vitest_1.expect)(initFn).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('disposeAll', () => {
    (0, vitest_1.it)('should dispose all managers', () => {
      const disposeFn1 = vi.fn();
      const disposeFn2 = vi.fn();
      registry.register('manager1', () => createMockManager({ disposeImpl: disposeFn1 }));
      registry.register('manager2', () => createMockManager({ disposeImpl: disposeFn2 }));
      registry.disposeAll();
      (0, vitest_1.expect)(disposeFn1).toHaveBeenCalled();
      (0, vitest_1.expect)(disposeFn2).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should dispose in reverse order (LIFO)', () => {
      const order = [];
      registry.register('first', () =>
        createMockManager({
          disposeImpl: () => {
            order.push('first');
          },
        })
      );
      registry.register('second', () =>
        createMockManager({
          disposeImpl: () => {
            order.push('second');
          },
        })
      );
      registry.register('third', () =>
        createMockManager({
          disposeImpl: () => {
            order.push('third');
          },
        })
      );
      registry.disposeAll();
      (0, vitest_1.expect)(order).toEqual(['third', 'second', 'first']);
    });
    (0, vitest_1.it)('should clear all managers after disposal', () => {
      registry.register('test', () => createMockManager());
      registry.disposeAll();
      (0, vitest_1.expect)(registry.has('test')).toBe(false);
    });
    (0, vitest_1.it)('should handle multiple dispose calls gracefully', () => {
      const disposeFn = vi.fn();
      registry.register('test', () => createMockManager({ disposeImpl: disposeFn }));
      registry.disposeAll();
      registry.disposeAll();
      (0, vitest_1.expect)(disposeFn).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)('should handle disposal errors gracefully', () => {
      registry.register('failing', () =>
        createMockManager({
          disposeImpl: () => {
            throw new Error('Dispose failed');
          },
        })
      );
      (0, vitest_1.expect)(() => registry.disposeAll()).not.toThrow();
    });
    (0, vitest_1.it)('should not dispose lazy managers that were never accessed', () => {
      const disposeFn = vi.fn();
      registry.register('lazy', () => createMockManager({ disposeImpl: disposeFn }), {
        lazy: true,
      });
      registry.disposeAll();
      (0, vitest_1.expect)(disposeFn).not.toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('getStats', () => {
    (0, vitest_1.it)('should return correct statistics', async () => {
      registry.register('eager1', () => createMockManager());
      registry.register('eager2', () => createMockManager());
      registry.register('lazy1', () => createMockManager(), { lazy: true });
      await registry.initializeAll();
      const stats = registry.getStats();
      (0, vitest_1.expect)(stats.total).toBe(3);
      (0, vitest_1.expect)(stats.initialized).toBe(3);
      (0, vitest_1.expect)(stats.lazy).toBe(1);
      (0, vitest_1.expect)(stats.names).toContain('eager1');
      (0, vitest_1.expect)(stats.names).toContain('eager2');
      (0, vitest_1.expect)(stats.names).toContain('lazy1');
    });
    (0, vitest_1.it)('should return empty statistics for empty registry', () => {
      const stats = registry.getStats();
      (0, vitest_1.expect)(stats.total).toBe(0);
      (0, vitest_1.expect)(stats.initialized).toBe(0);
      (0, vitest_1.expect)(stats.lazy).toBe(0);
      (0, vitest_1.expect)(stats.names).toEqual([]);
    });
  });
  (0, vitest_1.describe)('Complex Dependency Scenarios', () => {
    (0, vitest_1.it)('should handle deep dependency chains', async () => {
      const order = [];
      registry.register(
        'level3',
        () =>
          createMockManager({
            // @ts-expect-error - test mock type
            initializeImpl: () => order.push('level3'),
          }),
        { dependsOn: ['level2'] }
      );
      registry.register(
        'level2',
        () =>
          createMockManager({
            // @ts-expect-error - test mock type
            initializeImpl: () => order.push('level2'),
          }),
        { dependsOn: ['level1'] }
      );
      registry.register('level1', () =>
        createMockManager({
          // @ts-expect-error - test mock type
          initializeImpl: () => order.push('level1'),
        })
      );
      await registry.initializeAll();
      (0, vitest_1.expect)(order).toEqual(['level1', 'level2', 'level3']);
    });
    (0, vitest_1.it)('should handle multiple dependencies', async () => {
      const order = [];
      registry.register(
        'final',
        () =>
          createMockManager({
            // @ts-expect-error - test mock type
            initializeImpl: () => order.push('final'),
          }),
        { dependsOn: ['dep1', 'dep2'] }
      );
      registry.register('dep1', () =>
        createMockManager({
          // @ts-expect-error - test mock type
          initializeImpl: () => order.push('dep1'),
        })
      );
      registry.register('dep2', () =>
        createMockManager({
          // @ts-expect-error - test mock type
          initializeImpl: () => order.push('dep2'),
        })
      );
      await registry.initializeAll();
      // dep1 and dep2 should be before final
      (0, vitest_1.expect)(order.indexOf('final')).toBeGreaterThan(order.indexOf('dep1'));
      (0, vitest_1.expect)(order.indexOf('final')).toBeGreaterThan(order.indexOf('dep2'));
    });
    (0, vitest_1.it)('should handle diamond dependency pattern', async () => {
      const order = [];
      registry.register('base', () =>
        createMockManager({
          // @ts-expect-error - test mock type
          initializeImpl: () => order.push('base'),
        })
      );
      registry.register(
        'left',
        () =>
          createMockManager({
            // @ts-expect-error - test mock type
            initializeImpl: () => order.push('left'),
          }),
        { dependsOn: ['base'] }
      );
      registry.register(
        'right',
        () =>
          createMockManager({
            // @ts-expect-error - test mock type
            initializeImpl: () => order.push('right'),
          }),
        { dependsOn: ['base'] }
      );
      registry.register(
        'top',
        () =>
          createMockManager({
            // @ts-expect-error - test mock type
            initializeImpl: () => order.push('top'),
          }),
        { dependsOn: ['left', 'right'] }
      );
      await registry.initializeAll();
      // base should be first, top should be last
      (0, vitest_1.expect)(order[0]).toBe('base');
      (0, vitest_1.expect)(order[order.length - 1]).toBe('top');
    });
  });
  (0, vitest_1.describe)('Edge Cases', () => {
    (0, vitest_1.it)('should handle empty registry', async () => {
      await (0, vitest_1.expect)(registry.initializeAll()).resolves.not.toThrow();
      (0, vitest_1.expect)(() => registry.disposeAll()).not.toThrow();
    });
    (0, vitest_1.it)('should handle single manager', async () => {
      const initFn = vi.fn();
      const disposeFn = vi.fn();
      registry.register('single', () =>
        createMockManager({
          initializeImpl: initFn,
          disposeImpl: disposeFn,
        })
      );
      await registry.initializeAll();
      registry.disposeAll();
      (0, vitest_1.expect)(initFn).toHaveBeenCalledTimes(1);
      (0, vitest_1.expect)(disposeFn).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)('should handle managers registered after partial initialization', async () => {
      const initFn1 = vi.fn();
      registry.register('first', () => createMockManager({ initializeImpl: initFn1 }));
      await registry.initializeAll();
      (0, vitest_1.expect)(initFn1).toHaveBeenCalled();
      // Register and initialize new manager
      const initFn2 = vi.fn();
      registry.register('second', () => createMockManager({ initializeImpl: initFn2 }));
      await registry.initializeAll();
      (0, vitest_1.expect)(initFn2).toHaveBeenCalled();
    });
  });
});
//# sourceMappingURL=ManagerRegistry.test.js.map
