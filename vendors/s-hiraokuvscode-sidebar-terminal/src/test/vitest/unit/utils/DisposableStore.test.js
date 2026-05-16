"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const DisposableStore_1 = require("../../../../utils/DisposableStore");
(0, vitest_1.describe)('DisposableStore', () => {
    let store;
    (0, vitest_1.beforeEach)(() => {
        store = new DisposableStore_1.DisposableStore();
    });
    (0, vitest_1.describe)('add', () => {
        (0, vitest_1.it)('should add disposable to the store', () => {
            const disposable = { dispose: vitest_1.vi.fn() };
            store.add(disposable);
            (0, vitest_1.expect)(store.size).toBe(1);
        });
        (0, vitest_1.it)('should return the added disposable for chaining', () => {
            const disposable = { dispose: vitest_1.vi.fn() };
            const result = store.add(disposable);
            (0, vitest_1.expect)(result).toBe(disposable);
        });
        (0, vitest_1.it)('should add multiple disposables', () => {
            const disposable1 = { dispose: vitest_1.vi.fn() };
            const disposable2 = { dispose: vitest_1.vi.fn() };
            const disposable3 = { dispose: vitest_1.vi.fn() };
            store.add(disposable1);
            store.add(disposable2);
            store.add(disposable3);
            (0, vitest_1.expect)(store.size).toBe(3);
        });
        (0, vitest_1.it)('should dispose immediately when adding to already disposed store', () => {
            const disposable = { dispose: vitest_1.vi.fn() };
            const consoleSpy = vitest_1.vi.spyOn(console, 'warn').mockImplementation(() => { });
            store.dispose();
            store.add(disposable);
            (0, vitest_1.expect)(disposable.dispose).toHaveBeenCalled();
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith('[DisposableStore] Attempting to add disposable to already disposed store');
            consoleSpy.mockRestore();
        });
        (0, vitest_1.it)('should still return disposable even when store is disposed', () => {
            const disposable = { dispose: vitest_1.vi.fn() };
            vitest_1.vi.spyOn(console, 'warn').mockImplementation(() => { });
            store.dispose();
            const result = store.add(disposable);
            (0, vitest_1.expect)(result).toBe(disposable);
        });
    });
    (0, vitest_1.describe)('remove', () => {
        (0, vitest_1.it)('should remove and dispose a specific disposable', () => {
            const disposable = { dispose: vitest_1.vi.fn() };
            store.add(disposable);
            store.remove(disposable);
            (0, vitest_1.expect)(store.size).toBe(0);
            (0, vitest_1.expect)(disposable.dispose).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should not throw when removing non-existent disposable', () => {
            const disposable = { dispose: vitest_1.vi.fn() };
            (0, vitest_1.expect)(() => store.remove(disposable)).not.toThrow();
            (0, vitest_1.expect)(disposable.dispose).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should only remove the specified disposable', () => {
            const disposable1 = { dispose: vitest_1.vi.fn() };
            const disposable2 = { dispose: vitest_1.vi.fn() };
            store.add(disposable1);
            store.add(disposable2);
            store.remove(disposable1);
            (0, vitest_1.expect)(store.size).toBe(1);
            (0, vitest_1.expect)(disposable1.dispose).toHaveBeenCalled();
            (0, vitest_1.expect)(disposable2.dispose).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('clear', () => {
        (0, vitest_1.it)('should remove all disposables without disposing them', () => {
            const disposable1 = { dispose: vitest_1.vi.fn() };
            const disposable2 = { dispose: vitest_1.vi.fn() };
            store.add(disposable1);
            store.add(disposable2);
            store.clear();
            (0, vitest_1.expect)(store.size).toBe(0);
            (0, vitest_1.expect)(disposable1.dispose).not.toHaveBeenCalled();
            (0, vitest_1.expect)(disposable2.dispose).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('dispose', () => {
        (0, vitest_1.it)('should dispose all disposables in LIFO order', () => {
            const disposeOrder = [];
            const disposable1 = { dispose: () => disposeOrder.push(1) };
            const disposable2 = { dispose: () => disposeOrder.push(2) };
            const disposable3 = { dispose: () => disposeOrder.push(3) };
            store.add(disposable1);
            store.add(disposable2);
            store.add(disposable3);
            store.dispose();
            (0, vitest_1.expect)(disposeOrder).toEqual([3, 2, 1]); // LIFO order
        });
        (0, vitest_1.it)('should set isDisposed to true', () => {
            (0, vitest_1.expect)(store.isDisposed).toBe(false);
            store.dispose();
            (0, vitest_1.expect)(store.isDisposed).toBe(true);
        });
        (0, vitest_1.it)('should clear the disposables array after dispose', () => {
            const disposable = { dispose: vitest_1.vi.fn() };
            store.add(disposable);
            store.dispose();
            (0, vitest_1.expect)(store.size).toBe(0);
        });
        (0, vitest_1.it)('should not throw when disposing twice', () => {
            store.dispose();
            (0, vitest_1.expect)(() => store.dispose()).not.toThrow();
        });
        (0, vitest_1.it)('should not dispose items again when called twice', () => {
            const disposable = { dispose: vitest_1.vi.fn() };
            store.add(disposable);
            store.dispose();
            store.dispose();
            (0, vitest_1.expect)(disposable.dispose).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should handle errors in disposable.dispose gracefully', () => {
            const errorDisposable = {
                dispose: () => {
                    throw new Error('Dispose error');
                },
            };
            const normalDisposable = { dispose: vitest_1.vi.fn() };
            const consoleSpy = vitest_1.vi.spyOn(console, 'error').mockImplementation(() => { });
            store.add(normalDisposable);
            store.add(errorDisposable);
            (0, vitest_1.expect)(() => store.dispose()).not.toThrow();
            (0, vitest_1.expect)(normalDisposable.dispose).toHaveBeenCalled();
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith('[DisposableStore] Error disposing item:', vitest_1.expect.any(Error));
            consoleSpy.mockRestore();
        });
        (0, vitest_1.it)('should handle undefined disposables gracefully', () => {
            // @ts-expect-error - Testing edge case with null
            store['_disposables'].push(undefined);
            (0, vitest_1.expect)(() => store.dispose()).not.toThrow();
        });
    });
    (0, vitest_1.describe)('size', () => {
        (0, vitest_1.it)('should return 0 for empty store', () => {
            (0, vitest_1.expect)(store.size).toBe(0);
        });
        (0, vitest_1.it)('should return correct count after additions', () => {
            store.add({ dispose: vitest_1.vi.fn() });
            store.add({ dispose: vitest_1.vi.fn() });
            (0, vitest_1.expect)(store.size).toBe(2);
        });
        (0, vitest_1.it)('should return correct count after removals', () => {
            const disposable = { dispose: vitest_1.vi.fn() };
            store.add(disposable);
            store.add({ dispose: vitest_1.vi.fn() });
            store.remove(disposable);
            (0, vitest_1.expect)(store.size).toBe(1);
        });
    });
    (0, vitest_1.describe)('isDisposed', () => {
        (0, vitest_1.it)('should return false initially', () => {
            (0, vitest_1.expect)(store.isDisposed).toBe(false);
        });
        (0, vitest_1.it)('should return true after dispose', () => {
            store.dispose();
            (0, vitest_1.expect)(store.isDisposed).toBe(true);
        });
    });
});
(0, vitest_1.describe)('toDisposable', () => {
    (0, vitest_1.it)('should create a disposable from a cleanup function', () => {
        const cleanup = vitest_1.vi.fn();
        const disposable = (0, DisposableStore_1.toDisposable)(cleanup);
        (0, vitest_1.expect)(disposable).toHaveProperty('dispose');
    });
    (0, vitest_1.it)('should call cleanup function when disposed', () => {
        const cleanup = vitest_1.vi.fn();
        const disposable = (0, DisposableStore_1.toDisposable)(cleanup);
        disposable.dispose();
        (0, vitest_1.expect)(cleanup).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should allow multiple dispose calls', () => {
        const cleanup = vitest_1.vi.fn();
        const disposable = (0, DisposableStore_1.toDisposable)(cleanup);
        disposable.dispose();
        disposable.dispose();
        (0, vitest_1.expect)(cleanup).toHaveBeenCalledTimes(2);
    });
});
(0, vitest_1.describe)('combineDisposables', () => {
    (0, vitest_1.it)('should combine multiple disposables into one', () => {
        const disposable1 = { dispose: vitest_1.vi.fn() };
        const disposable2 = { dispose: vitest_1.vi.fn() };
        const disposable3 = { dispose: vitest_1.vi.fn() };
        const combined = (0, DisposableStore_1.combineDisposables)(disposable1, disposable2, disposable3);
        combined.dispose();
        (0, vitest_1.expect)(disposable1.dispose).toHaveBeenCalled();
        (0, vitest_1.expect)(disposable2.dispose).toHaveBeenCalled();
        (0, vitest_1.expect)(disposable3.dispose).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should handle empty array', () => {
        const combined = (0, DisposableStore_1.combineDisposables)();
        (0, vitest_1.expect)(() => combined.dispose()).not.toThrow();
    });
    (0, vitest_1.it)('should handle null/undefined disposables gracefully', () => {
        const disposable1 = { dispose: vitest_1.vi.fn() };
        // @ts-expect-error - Testing edge case
        const combined = (0, DisposableStore_1.combineDisposables)(disposable1, null, undefined);
        (0, vitest_1.expect)(() => combined.dispose()).not.toThrow();
        (0, vitest_1.expect)(disposable1.dispose).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should handle errors in individual disposables', () => {
        const errorDisposable = {
            dispose: () => {
                throw new Error('Dispose error');
            },
        };
        const normalDisposable = { dispose: vitest_1.vi.fn() };
        const consoleSpy = vitest_1.vi.spyOn(console, 'error').mockImplementation(() => { });
        const combined = (0, DisposableStore_1.combineDisposables)(normalDisposable, errorDisposable);
        (0, vitest_1.expect)(() => combined.dispose()).not.toThrow();
        (0, vitest_1.expect)(normalDisposable.dispose).toHaveBeenCalled();
        (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith('[combineDisposables] Error disposing item:', vitest_1.expect.any(Error));
        consoleSpy.mockRestore();
    });
});
//# sourceMappingURL=DisposableStore.test.js.map