'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const LazyInitializable_1 = require('../../../../patterns/LazyInitializable');
// Concrete implementation for testing
class TestLazyInitializable extends LazyInitializable_1.LazyInitializable {
  constructor() {
    super();
    this.doInitializeCalled = 0;
    this.mockInitLogic = () => {};
  }
  async publicEnsureInitializedAsync() {
    return await this.ensureInitializedAsync();
  }
  publicEnsureInitialized() {
    this.ensureInitialized();
  }
  publicResetInitialization() {
    this.resetInitialization();
  }
  doInitialize() {
    this.doInitializeCalled++;
    return this.mockInitLogic();
  }
}
(0, vitest_1.describe)('LazyInitializable', () => {
  let testObj;
  beforeEach(() => {
    testObj = new TestLazyInitializable();
  });
  (0, vitest_1.it)('should start in UNINITIALIZED state', () => {
    (0, vitest_1.expect)(testObj.initializationState).toBe(
      LazyInitializable_1.InitializationState.UNINITIALIZED
    );
    (0, vitest_1.expect)(testObj.isInitialized).toBe(false);
    (0, vitest_1.expect)(testObj.isInitializing).toBe(false);
  });
  (0, vitest_1.describe)('ensureInitialized (Sync)', () => {
    (0, vitest_1.it)('should initialize successfully', () => {
      testObj.mockInitLogic = () => {}; // Sync logic
      testObj.publicEnsureInitialized();
      (0, vitest_1.expect)(testObj.isInitialized).toBe(true);
      (0, vitest_1.expect)(testObj.doInitializeCalled).toBe(1);
    });
    (0, vitest_1.it)('should only initialize once', () => {
      testObj.mockInitLogic = () => {}; // Sync logic
      testObj.publicEnsureInitialized();
      testObj.publicEnsureInitialized();
      (0, vitest_1.expect)(testObj.doInitializeCalled).toBe(1);
    });
    (0, vitest_1.it)('should throw InitializationError if doInitialize throws', () => {
      testObj.mockInitLogic = () => {
        throw new Error('Sync fail');
      };
      (0, vitest_1.expect)(() => testObj.publicEnsureInitialized()).toThrow(
        LazyInitializable_1.InitializationError
      );
      (0, vitest_1.expect)(testObj.initializationState).toBe(
        LazyInitializable_1.InitializationState.FAILED
      );
    });
  });
  (0, vitest_1.describe)('ensureInitializedAsync', () => {
    (0, vitest_1.it)('should initialize successfully', async () => {
      testObj.mockInitLogic = async () => {}; // Async logic
      await testObj.publicEnsureInitializedAsync();
      (0, vitest_1.expect)(testObj.isInitialized).toBe(true);
      (0, vitest_1.expect)(testObj.doInitializeCalled).toBe(1);
    });
    (0, vitest_1.it)('should handle concurrent initialization calls', async () => {
      let resolveInit;
      const initPromise = new Promise((resolve) => {
        resolveInit = resolve;
      });
      testObj.mockInitLogic = () => initPromise;
      const call1 = testObj.publicEnsureInitializedAsync();
      const call2 = testObj.publicEnsureInitializedAsync();
      (0, vitest_1.expect)(testObj.isInitializing).toBe(true);
      resolveInit();
      await Promise.all([call1, call2]);
      (0, vitest_1.expect)(testObj.isInitialized).toBe(true);
      (0, vitest_1.expect)(testObj.doInitializeCalled).toBe(1);
    });
    (0, vitest_1.it)('should throw InitializationError if async initialization fails', async () => {
      testObj.mockInitLogic = async () => {
        throw new Error('Async fail');
      };
      await (0, vitest_1.expect)(testObj.publicEnsureInitializedAsync()).rejects.toThrow(
        LazyInitializable_1.InitializationError
      );
      (0, vitest_1.expect)(testObj.initializationState).toBe(
        LazyInitializable_1.InitializationState.FAILED
      );
    });
  });
  (0, vitest_1.describe)('resetInitialization', () => {
    (0, vitest_1.it)('should reset state to UNINITIALIZED', async () => {
      testObj.mockInitLogic = async () => {};
      await testObj.publicEnsureInitializedAsync();
      (0, vitest_1.expect)(testObj.isInitialized).toBe(true);
      testObj.publicResetInitialization();
      (0, vitest_1.expect)(testObj.initializationState).toBe(
        LazyInitializable_1.InitializationState.UNINITIALIZED
      );
      (0, vitest_1.expect)(testObj.isInitialized).toBe(false);
      await testObj.publicEnsureInitializedAsync();
      (0, vitest_1.expect)(testObj.doInitializeCalled).toBe(2);
    });
  });
});
(0, vitest_1.describe)('withLazyInitialization mixin', () => {
  class BaseClass {
    constructor() {
      this.baseProp = 'base';
    }
  }
  class MixinTestClass extends (0, LazyInitializable_1.withLazyInitialization)(BaseClass) {
    constructor() {
      super(...arguments);
      this.doInitCalled = 0;
      this.mockLogic = () => {};
    }
    doInitialize() {
      this.doInitCalled++;
      return this.mockLogic();
    }
    async triggerInit() {
      await this.ensureInitializedAsync();
    }
    triggerInitSync() {
      this.ensureInitialized();
    }
  }
  (0, vitest_1.it)('should preserve base class functionality', () => {
    const instance = new MixinTestClass();
    (0, vitest_1.expect)(instance.baseProp).toBe('base');
  });
  (0, vitest_1.it)('should initialize via ensureInitializedAsync', async () => {
    const instance = new MixinTestClass();
    instance.mockLogic = async () => {};
    await instance.triggerInit();
    (0, vitest_1.expect)(instance.isInitialized).toBe(true);
    (0, vitest_1.expect)(instance.doInitCalled).toBe(1);
  });
  (0, vitest_1.it)('should initialize via ensureInitialized', () => {
    const instance = new MixinTestClass();
    instance.mockLogic = () => {}; // Sync logic
    instance.triggerInitSync();
    (0, vitest_1.expect)(instance.isInitialized).toBe(true);
    (0, vitest_1.expect)(instance.doInitCalled).toBe(1);
  });
});
//# sourceMappingURL=LazyInitializable.test.js.map
