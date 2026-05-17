'use strict';
/**
 * DIContainer Unit Tests
 *
 * Tests for the lightweight dependency injection container.
 *
 * Vitest Migration: Converted from Mocha/Chai to Vitest
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const DIContainer_1 = require('../../../../core/DIContainer');
(0, vitest_1.describe)('DIContainer', () => {
  let container;
  (0, vitest_1.beforeEach)(() => {
    container = new DIContainer_1.DIContainer();
  });
  (0, vitest_1.afterEach)(() => {
    container.dispose();
  });
  (0, vitest_1.describe)('Service Registration', () => {
    (0, vitest_1.it)('should register a service with singleton lifetime', () => {
      const ILogger = (0, DIContainer_1.createServiceToken)('ILogger');
      const logger = { log: (msg) => console.log(msg) };
      container.register(ILogger, () => logger, DIContainer_1.ServiceLifetime.Singleton);
      (0, vitest_1.expect)(container.isRegistered(ILogger)).toBe(true);
    });
    (0, vitest_1.it)('should throw error when registering duplicate service', () => {
      const ILogger = (0, DIContainer_1.createServiceToken)('ILogger');
      container.register(
        ILogger,
        () => ({ log: () => {} }),
        DIContainer_1.ServiceLifetime.Singleton
      );
      (0, vitest_1.expect)(() =>
        container.register(
          ILogger,
          () => ({ log: () => {} }),
          DIContainer_1.ServiceLifetime.Singleton
        )
      ).toThrow('Service already registered: ILogger');
    });
    (0, vitest_1.it)('should return service count', () => {
      const ILogger = (0, DIContainer_1.createServiceToken)('ILogger');
      const IConfig = (0, DIContainer_1.createServiceToken)('IConfig');
      container.register(ILogger, () => ({}), DIContainer_1.ServiceLifetime.Singleton);
      container.register(IConfig, () => ({}), DIContainer_1.ServiceLifetime.Singleton);
      (0, vitest_1.expect)(container.serviceCount).toBe(2);
    });
  });
  (0, vitest_1.describe)('Singleton Lifetime', () => {
    (0, vitest_1.it)('should return same instance for singleton services', () => {
      const ILogger = (0, DIContainer_1.createServiceToken)('ILogger');
      let idCounter = 0;
      container.register(
        ILogger,
        () => ({ id: ++idCounter }),
        DIContainer_1.ServiceLifetime.Singleton
      );
      const instance1 = container.resolve(ILogger);
      const instance2 = container.resolve(ILogger);
      (0, vitest_1.expect)(instance1).toBe(instance2);
      (0, vitest_1.expect)(instance1.id).toBe(1);
    });
  });
  (0, vitest_1.describe)('Transient Lifetime', () => {
    (0, vitest_1.it)('should return new instance for transient services', () => {
      const ILogger = (0, DIContainer_1.createServiceToken)('ILogger');
      let idCounter = 0;
      container.register(
        ILogger,
        () => ({ id: ++idCounter }),
        DIContainer_1.ServiceLifetime.Transient
      );
      const instance1 = container.resolve(ILogger);
      const instance2 = container.resolve(ILogger);
      (0, vitest_1.expect)(instance1).not.toBe(instance2);
      (0, vitest_1.expect)(instance1.id).toBe(1);
      (0, vitest_1.expect)(instance2.id).toBe(2);
    });
  });
  (0, vitest_1.describe)('Scoped Lifetime', () => {
    (0, vitest_1.it)('should return same instance within a scope', () => {
      const ILogger = (0, DIContainer_1.createServiceToken)('ILogger');
      let idCounter = 0;
      container.register(
        ILogger,
        () => ({ id: ++idCounter }),
        DIContainer_1.ServiceLifetime.Scoped
      );
      const scope = container.createScope();
      const instance1 = scope.resolve(ILogger);
      const instance2 = scope.resolve(ILogger);
      (0, vitest_1.expect)(instance1).toBe(instance2);
      (0, vitest_1.expect)(instance1.id).toBe(1);
      scope.dispose();
    });
    (0, vitest_1.it)('should return different instances across scopes', () => {
      const ILogger = (0, DIContainer_1.createServiceToken)('ILogger');
      let idCounter = 0;
      container.register(
        ILogger,
        () => ({ id: ++idCounter }),
        DIContainer_1.ServiceLifetime.Scoped
      );
      const scope1 = container.createScope();
      const scope2 = container.createScope();
      const instance1 = scope1.resolve(ILogger);
      const instance2 = scope2.resolve(ILogger);
      (0, vitest_1.expect)(instance1).not.toBe(instance2);
      (0, vitest_1.expect)(instance1.id).toBe(1);
      (0, vitest_1.expect)(instance2.id).toBe(2);
      scope1.dispose();
      scope2.dispose();
    });
  });
  (0, vitest_1.describe)('Circular Dependency Detection', () => {
    (0, vitest_1.it)('should detect circular dependencies', () => {
      const IServiceA = (0, DIContainer_1.createServiceToken)('IServiceA');
      const IServiceB = (0, DIContainer_1.createServiceToken)('IServiceB');
      container.register(
        IServiceA,
        (c) => ({ b: c.resolve(IServiceB) }),
        DIContainer_1.ServiceLifetime.Singleton
      );
      container.register(
        IServiceB,
        (c) => ({ a: c.resolve(IServiceA) }),
        DIContainer_1.ServiceLifetime.Singleton
      );
      (0, vitest_1.expect)(() => container.resolve(IServiceA)).toThrow(
        DIContainer_1.CircularDependencyError
      );
    });
    (0, vitest_1.it)('should include dependency chain in error', () => {
      const IServiceA = (0, DIContainer_1.createServiceToken)('IServiceA');
      const IServiceB = (0, DIContainer_1.createServiceToken)('IServiceB');
      container.register(
        IServiceA,
        (c) => ({ b: c.resolve(IServiceB) }),
        DIContainer_1.ServiceLifetime.Singleton
      );
      container.register(
        IServiceB,
        (c) => ({ a: c.resolve(IServiceA) }),
        DIContainer_1.ServiceLifetime.Singleton
      );
      try {
        container.resolve(IServiceA);
        vitest_1.expect.fail('Should have thrown CircularDependencyError');
      } catch (error) {
        (0, vitest_1.expect)(error).toBeInstanceOf(DIContainer_1.CircularDependencyError);
        const circularError = error;
        (0, vitest_1.expect)(circularError.dependencyChain).toContain('IServiceA');
        (0, vitest_1.expect)(circularError.dependencyChain).toContain('IServiceB');
      }
    });
  });
  (0, vitest_1.describe)('Service Resolution', () => {
    (0, vitest_1.it)('should throw error when resolving unregistered service', () => {
      const ILogger = (0, DIContainer_1.createServiceToken)('ILogger');
      (0, vitest_1.expect)(() => container.resolve(ILogger)).toThrow(
        DIContainer_1.ServiceNotRegisteredError
      );
    });
    (0, vitest_1.it)('should return undefined for tryResolve with unregistered service', () => {
      const ILogger = (0, DIContainer_1.createServiceToken)('ILogger');
      const result = container.tryResolve(ILogger);
      (0, vitest_1.expect)(result).toBeUndefined();
    });
    (0, vitest_1.it)('should resolve dependencies recursively', () => {
      const ILogger = (0, DIContainer_1.createServiceToken)('ILogger');
      const IService = (0, DIContainer_1.createServiceToken)('IService');
      container.register(
        ILogger,
        () => ({ log: () => {} }),
        DIContainer_1.ServiceLifetime.Singleton
      );
      container.register(
        IService,
        (c) => ({ logger: c.resolve(ILogger) }),
        DIContainer_1.ServiceLifetime.Singleton
      );
      const service = container.resolve(IService);
      (0, vitest_1.expect)(service.logger).toBeDefined();
    });
  });
  (0, vitest_1.describe)('Disposal', () => {
    (0, vitest_1.it)('should dispose all singletons when container is disposed', () => {
      let disposedCount = 0;
      const IService = (0, DIContainer_1.createServiceToken)('IService');
      container.register(
        IService,
        () => ({
          dispose: () => {
            disposedCount++;
          },
        }),
        DIContainer_1.ServiceLifetime.Singleton
      );
      // Resolve to create instance
      container.resolve(IService);
      container.dispose();
      (0, vitest_1.expect)(disposedCount).toBe(1);
    });
    (0, vitest_1.it)('should dispose singletons in reverse registration order', () => {
      const disposalOrder = [];
      const IService1 = (0, DIContainer_1.createServiceToken)('IService1');
      const IService2 = (0, DIContainer_1.createServiceToken)('IService2');
      container.register(
        IService1,
        () => ({
          dispose: () => {
            disposalOrder.push(1);
          },
        }),
        DIContainer_1.ServiceLifetime.Singleton
      );
      container.register(
        IService2,
        () => ({
          dispose: () => {
            disposalOrder.push(2);
          },
        }),
        DIContainer_1.ServiceLifetime.Singleton
      );
      // Resolve to create instances
      container.resolve(IService1);
      container.resolve(IService2);
      container.dispose();
      (0, vitest_1.expect)(disposalOrder).toEqual([2, 1]);
    });
    (0, vitest_1.it)('should throw error when using disposed container', () => {
      const IService = (0, DIContainer_1.createServiceToken)('IService');
      container.register(IService, () => ({}), DIContainer_1.ServiceLifetime.Singleton);
      container.dispose();
      (0, vitest_1.expect)(() => container.resolve(IService)).toThrow(
        'Cannot use disposed DIContainer'
      );
    });
    (0, vitest_1.it)('should dispose all scopes when container is disposed', () => {
      let scopeDisposedCount = 0;
      const IService = (0, DIContainer_1.createServiceToken)('IService');
      container.register(
        IService,
        () => ({
          dispose: () => {
            scopeDisposedCount++;
          },
        }),
        DIContainer_1.ServiceLifetime.Scoped
      );
      const scope1 = container.createScope();
      const scope2 = container.createScope();
      scope1.resolve(IService);
      scope2.resolve(IService);
      container.dispose();
      (0, vitest_1.expect)(scopeDisposedCount).toBe(2);
    });
  });
  (0, vitest_1.describe)('Parent-Child Containers', () => {
    (0, vitest_1.it)('should resolve from parent container when not found in child', () => {
      const ILogger = (0, DIContainer_1.createServiceToken)('ILogger');
      container.register(ILogger, () => ({ id: 1 }), DIContainer_1.ServiceLifetime.Singleton);
      const scope = container.createScope();
      const logger = scope.resolve(ILogger);
      (0, vitest_1.expect)(logger.id).toBe(1);
      scope.dispose();
    });
    (0, vitest_1.it)('should check registration in parent container', () => {
      const ILogger = (0, DIContainer_1.createServiceToken)('ILogger');
      container.register(ILogger, () => ({}), DIContainer_1.ServiceLifetime.Singleton);
      const scope = container.createScope();
      (0, vitest_1.expect)(scope.isRegistered(ILogger)).toBe(true);
      scope.dispose();
    });
  });
});
//# sourceMappingURL=DIContainer.test.js.map
