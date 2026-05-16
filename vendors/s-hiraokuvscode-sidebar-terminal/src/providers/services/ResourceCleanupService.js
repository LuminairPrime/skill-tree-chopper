"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceCleanupService = void 0;
const logger_1 = require("../../utils/logger");
const DisposableStore_1 = require("../../utils/DisposableStore");
/**
 * ResourceCleanupService
 *
 * Manages the lifecycle of disposable resources in the SecondaryTerminalProvider.
 * Uses DisposableStore internally for consistent LIFO disposal.
 *
 * Responsibilities:
 * - Track all disposable resources
 * - Dispose of resources in proper order (LIFO via DisposableStore)
 * - Clear references to prevent memory leaks
 * - Send cleanup notifications to WebView
 *
 * Part of Issue #214 refactoring to apply Facade pattern
 */
class ResourceCleanupService {
    constructor() {
        this._store = new DisposableStore_1.DisposableStore();
        this._isDisposed = false;
        /**
         * Callbacks for cleanup operations
         */
        this._cleanupCallbacks = [];
    }
    /**
     * Add a disposable resource to be cleaned up later
     *
     * @param disposable The disposable resource to track
     */
    addDisposable(disposable) {
        if (this._isDisposed) {
            (0, logger_1.provider)('⚠️ [CLEANUP] Cannot add disposable, service already disposed');
            disposable.dispose();
            return;
        }
        this._store.add(disposable);
    }
    /**
     * Add multiple disposable resources at once
     *
     * @param disposables Array of disposable resources to track
     */
    addDisposables(...disposables) {
        disposables.forEach((d) => this.addDisposable(d));
    }
    /**
     * Register a cleanup callback to be executed during disposal
     *
     * Callbacks are executed in LIFO order (last registered, first executed)
     * to ensure proper cleanup of dependent resources
     *
     * @param callback Function to execute during cleanup
     */
    registerCleanupCallback(callback) {
        if (this._isDisposed) {
            (0, logger_1.provider)('⚠️ [CLEANUP] Cannot register callback, service already disposed');
            return;
        }
        this._cleanupCallbacks.push(callback);
    }
    /**
     * Get the number of tracked disposables
     */
    getDisposableCount() {
        return this._store.size;
    }
    /**
     * Check if the service has been disposed
     */
    isDisposed() {
        return this._isDisposed;
    }
    /**
     * Dispose of all tracked resources
     *
     * This method:
     * 1. Executes all registered cleanup callbacks (LIFO)
     * 2. Disposes all tracked disposable resources (LIFO via DisposableStore)
     * 3. Clears all references
     * 4. Marks the service as disposed
     */
    dispose() {
        if (this._isDisposed) {
            (0, logger_1.provider)('⚠️ [CLEANUP] Service already disposed, skipping');
            return;
        }
        (0, logger_1.provider)('🔧 [CLEANUP] ResourceCleanupService disposing resources...');
        (0, logger_1.provider)(`🔧 [CLEANUP] Disposing ${this._store.size} disposables`);
        (0, logger_1.provider)(`🔧 [CLEANUP] Executing ${this._cleanupCallbacks.length} cleanup callbacks`);
        // Execute cleanup callbacks in LIFO order
        const callbacks = [...this._cleanupCallbacks].reverse();
        for (const callback of callbacks) {
            try {
                const result = callback();
                if (result instanceof Promise) {
                    // Fire and forget for async callbacks
                    result.catch((error) => (0, logger_1.provider)(`⚠️ [CLEANUP] Async cleanup callback failed: ${error}`));
                }
            }
            catch (error) {
                (0, logger_1.provider)(`⚠️ [CLEANUP] Cleanup callback failed: ${error}`);
            }
        }
        // Dispose all tracked disposables via DisposableStore (LIFO order)
        this._store.dispose();
        // Clear cleanup callbacks
        this._cleanupCallbacks.length = 0;
        // Mark as disposed
        this._isDisposed = true;
        (0, logger_1.provider)('✅ [CLEANUP] ResourceCleanupService disposed successfully');
    }
    /**
     * Create a cleanup message for the WebView
     *
     * This message instructs the WebView to save terminal sessions
     * before the provider is disposed
     */
    createWebViewCleanupMessage() {
        return {
            command: 'saveAllTerminalSessions',
            timestamp: Date.now(),
        };
    }
}
exports.ResourceCleanupService = ResourceCleanupService;
//# sourceMappingURL=ResourceCleanupService.js.map