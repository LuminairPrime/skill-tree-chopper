'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const DisposableBase_1 = require('../../../../patterns/DisposableBase');
// Mock vscode
vitest_1.vi.mock('vscode', () => ({
  Disposable: class {
    static from(..._args) {
      return { dispose: vitest_1.vi.fn() };
    }
    dispose() {}
  },
}));
// Concrete implementation for testing
class TestDisposable extends DisposableBase_1.DisposableBase {
  constructor() {
    super();
    this.doDisposeCalled = 0;
  }
  publicRegisterDisposable(disposable) {
    return this.registerDisposable(disposable);
  }
  publicRegisterDisposables(...disposables) {
    this.registerDisposables(...disposables);
  }
  publicRegisterCleanup(cleanup) {
    this.registerCleanup(cleanup);
  }
  publicThrowIfDisposed(methodName) {
    this.throwIfDisposed(methodName);
  }
  get publicDisposableCount() {
    return this.disposableCount;
  }
  get publicCleanupActionCount() {
    return this.cleanupActionCount;
  }
  doDispose() {
    this.doDisposeCalled++;
  }
}
(0, vitest_1.describe)('DisposableBase', () => {
  let testObj;
  beforeEach(() => {
    testObj = new TestDisposable();
  });
  (0, vitest_1.it)('should start not disposed', () => {
    (0, vitest_1.expect)(testObj.isDisposed()).toBe(false);
  });
  (0, vitest_1.describe)('registration', () => {
    (0, vitest_1.it)('should track registered disposables', () => {
      testObj.publicRegisterDisposable({ dispose: vitest_1.vi.fn() });
      (0, vitest_1.expect)(testObj.publicDisposableCount).toBe(1);
    });
    (0, vitest_1.it)('should track registered cleanup actions', () => {
      testObj.publicRegisterCleanup(() => {});
      (0, vitest_1.expect)(testObj.publicCleanupActionCount).toBe(1);
    });
    (0, vitest_1.it)('should dispose immediately if registered after disposal', () => {
      testObj.dispose();
      const disposable = { dispose: vitest_1.vi.fn() };
      testObj.publicRegisterDisposable(disposable);
      (0, vitest_1.expect)(disposable.dispose).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should run cleanup immediately if registered after disposal', () => {
      testObj.dispose();
      const cleanup = vitest_1.vi.fn();
      testObj.publicRegisterCleanup(cleanup);
      (0, vitest_1.expect)(cleanup).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('dispose', () => {
    (0, vitest_1.it)('should dispose resources in LIFO order', () => {
      const order = [];
      const d1 = { dispose: () => order.push('d1') };
      const d2 = { dispose: () => order.push('d2') };
      testObj.publicRegisterDisposable(d1);
      testObj.publicRegisterDisposable(d2);
      testObj.dispose();
      (0, vitest_1.expect)(order).toEqual(['d2', 'd1']);
      (0, vitest_1.expect)(testObj.isDisposed()).toBe(true);
    });
    (0, vitest_1.it)('should run cleanup actions after disposables', () => {
      const order = [];
      const d1 = { dispose: () => order.push('disposable') };
      const c1 = () => order.push('cleanup');
      testObj.publicRegisterDisposable(d1);
      testObj.publicRegisterCleanup(c1);
      testObj.dispose();
      (0, vitest_1.expect)(order).toEqual(['disposable', 'cleanup']);
    });
    (0, vitest_1.it)('should call doDispose exactly once', () => {
      testObj.dispose();
      testObj.dispose();
      (0, vitest_1.expect)(testObj.doDisposeCalled).toBe(1);
    });
    (0, vitest_1.it)('should handle errors in disposables gracefully', () => {
      const d1 = {
        dispose: () => {
          throw new Error('fail');
        },
      };
      const d2 = { dispose: vitest_1.vi.fn() };
      testObj.publicRegisterDisposable(d1);
      testObj.publicRegisterDisposable(d2);
      // Should not throw
      testObj.dispose();
      (0, vitest_1.expect)(d2.dispose).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('throwIfDisposed', () => {
    (0, vitest_1.it)('should throw if already disposed', () => {
      testObj.dispose();
      (0, vitest_1.expect)(() => testObj.publicThrowIfDisposed('testMethod')).toThrow(
        'Cannot call testMethod on disposed TestDisposable'
      );
    });
    (0, vitest_1.it)('should not throw if not disposed', () => {
      (0, vitest_1.expect)(() => testObj.publicThrowIfDisposed()).not.toThrow();
    });
  });
});
(0, vitest_1.describe)('DisposableCallback', () => {
  (0, vitest_1.it)('should call callback on dispose', () => {
    const cb = vitest_1.vi.fn();
    const d = new DisposableBase_1.DisposableCallback(cb);
    d.dispose();
    (0, vitest_1.expect)(cb).toHaveBeenCalled();
    (0, vitest_1.expect)(d.isDisposed()).toBe(true);
  });
  (0, vitest_1.it)('should only call callback once', () => {
    const cb = vitest_1.vi.fn();
    const d = new DisposableBase_1.DisposableCallback(cb);
    d.dispose();
    d.dispose();
    (0, vitest_1.expect)(cb).toHaveBeenCalledTimes(1);
  });
});
(0, vitest_1.describe)('toDisposable', () => {
  (0, vitest_1.it)('should create a working disposable', () => {
    const cb = vitest_1.vi.fn();
    const d = (0, DisposableBase_1.toDisposable)(cb);
    d.dispose();
    (0, vitest_1.expect)(cb).toHaveBeenCalled();
  });
});
//# sourceMappingURL=DisposableBase.test.js.map
