"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisposableStore = void 0;
exports.toDisposable = toDisposable;
exports.combineDisposables = combineDisposables;
/**
 * DisposableStore - A utility class to manage multiple disposables
 *
 * This class follows VS Code's DisposableStore pattern to prevent memory leaks
 * by ensuring all event subscriptions and resources are properly disposed.
 *
 * Usage:
 * ```typescript
 * class MyClass {
 *   private readonly _disposables = new DisposableStore();
 *
 *   constructor() {
 *     this._disposables.add(vscode.workspace.onDidChangeConfiguration(...));
 *     this._disposables.add(vscode.window.onDidChangeActiveTerminal(...));
 *   }
 *
 *   dispose(): void {
 *     this._disposables.dispose();
 *   }
 * }
 * ```
 */
class DisposableStore {
    constructor() {
        this._disposables = [];
        this._isDisposed = false;
    }
    /**
     * Add a disposable to the store
     * @param disposable The disposable to add
     * @returns The disposable that was added (for chaining)
     */
    add(disposable) {
        if (this._isDisposed) {
            console.warn('[DisposableStore] Attempting to add disposable to already disposed store');
            disposable.dispose();
            return disposable;
        }
        this._disposables.push(disposable);
        return disposable;
    }
    /**
     * Remove and dispose a specific disposable from the store
     * @param disposable The disposable to remove
     */
    remove(disposable) {
        const index = this._disposables.indexOf(disposable);
        if (index !== -1) {
            this._disposables.splice(index, 1);
            disposable.dispose();
        }
    }
    /**
     * Clear all disposables without disposing them
     * This is useful when you want to remove all disposables but they're managed elsewhere
     */
    clear() {
        this._disposables = [];
    }
    /**
     * Dispose all disposables in the store
     */
    dispose() {
        if (this._isDisposed) {
            return;
        }
        this._isDisposed = true;
        // Dispose all disposables in reverse order (LIFO)
        // This ensures proper cleanup order (last added, first disposed)
        for (let i = this._disposables.length - 1; i >= 0; i--) {
            const disposable = this._disposables[i];
            if (disposable) {
                try {
                    disposable.dispose();
                }
                catch (error) {
                    console.error('[DisposableStore] Error disposing item:', error);
                }
            }
        }
        this._disposables = [];
    }
    /**
     * Get the number of disposables in the store
     */
    get size() {
        return this._disposables.length;
    }
    /**
     * Check if the store has been disposed
     */
    get isDisposed() {
        return this._isDisposed;
    }
}
exports.DisposableStore = DisposableStore;
/**
 * Helper function to create a disposable from a cleanup function
 * @param cleanup The cleanup function to run when disposed
 * @returns A disposable object
 */
function toDisposable(cleanup) {
    return {
        dispose: cleanup,
    };
}
/**
 * Helper function to combine multiple disposables into one
 * @param disposables The disposables to combine
 * @returns A single disposable that disposes all the input disposables
 */
function combineDisposables(...disposables) {
    return {
        dispose: () => {
            for (const disposable of disposables) {
                if (disposable) {
                    try {
                        disposable.dispose();
                    }
                    catch (error) {
                        console.error('[combineDisposables] Error disposing item:', error);
                    }
                }
            }
        },
    };
}
//# sourceMappingURL=DisposableStore.js.map