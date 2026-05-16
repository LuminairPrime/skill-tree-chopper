"use strict";
/**
 * ResizeManager Utility
 *
 * Centralized debounced resize logic to eliminate code duplication
 * across TerminalLifecycleCoordinator, PerformanceManager, and SplitManager
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResizeManager = void 0;
const logger_1 = require("../../utils/logger");
/**
 * Centralized resize management utility
 * Provides debounced resize functionality with comprehensive cleanup
 */
class ResizeManager {
    /**
     * Execute a resize callback with debouncing
     * @param key Unique identifier for this resize operation
     * @param callback The resize function to execute
     * @param options Resize configuration options
     */
    static debounceResize(key, callback, options = {}) {
        const { delay = this.DEFAULT_DELAY, immediate = false, onStart, onComplete } = options;
        // Clear existing timer for this key
        this.clearResize(key);
        // Execute immediately if requested
        if (immediate) {
            this.executeResize(key, callback, onStart, onComplete);
            return;
        }
        // Call onStart callback if provided
        if (onStart) {
            try {
                onStart();
            }
            catch (error) {
                (0, logger_1.webview)(`❌ ResizeManager onStart error for ${key}:`, error);
            }
        }
        // Set up debounced execution
        const timer = window.setTimeout(() => {
            this.timers.delete(key);
            this.executeResize(key, callback, undefined, onComplete);
        }, delay);
        this.timers.set(key, timer);
        (0, logger_1.webview)(`⏱️ ResizeManager: Debounced resize scheduled for ${key} (${delay}ms)`);
    }
    /**
     * Execute resize callback immediately
     */
    static async executeResize(key, callback, onStart, onComplete) {
        try {
            if (onStart) {
                onStart();
            }
            await callback();
            if (onComplete) {
                onComplete();
            }
            (0, logger_1.webview)(`✅ ResizeManager: Resize completed for ${key}`);
        }
        catch (error) {
            (0, logger_1.webview)(`❌ ResizeManager: Resize failed for ${key}:`, error);
        }
    }
    /**
     * Clear pending resize operation for specific key
     * @param key The resize operation key to clear
     */
    static clearResize(key) {
        const timer = this.timers.get(key);
        if (timer) {
            window.clearTimeout(timer);
            this.timers.delete(key);
            (0, logger_1.webview)(`🧹 ResizeManager: Cleared resize timer for ${key}`);
        }
    }
    /**
     * Setup ResizeObserver for element with centralized management
     * @param key Unique identifier for this observer
     * @param element Element to observe
     * @param callback Callback to execute on resize
     * @param options Resize configuration options
     */
    static observeResize(key, element, callback, options = {}) {
        // Clean up existing observer
        this.unobserveResize(key);
        // 🔧 FIX: Use skipFirstCallback option (default: true for backward compatibility)
        const shouldSkipFirstCallback = options.skipFirstCallback !== false;
        try {
            // Store callback for potential resume
            this.observerCallbacks.set(key, callback);
            // Mark to skip first callback (common pattern to avoid initial resize)
            // 🔧 FIX: Only skip if explicitly requested or default behavior
            this.firstCallbackSkip.set(key, shouldSkipFirstCallback);
            const observer = new ResizeObserver((entries) => {
                // Skip if globally paused
                if (this.paused) {
                    (0, logger_1.webview)(`⏸️ ResizeManager: Observer ${key} paused, skipping callback`);
                    return;
                }
                for (const entry of entries) {
                    // Skip first callback to avoid initial resize during creation
                    if (this.firstCallbackSkip.get(key)) {
                        this.firstCallbackSkip.set(key, false);
                        (0, logger_1.webview)(`⏭️ ResizeManager: Skipped first callback for ${key}`);
                        continue;
                    }
                    this.debounceResize(`observer-${key}`, () => callback(entry), options);
                }
            });
            observer.observe(element);
            this.observers.set(key, observer);
            (0, logger_1.webview)(`👁️ ResizeManager: Observer setup for ${key} (skipFirstCallback: ${shouldSkipFirstCallback})`);
        }
        catch (error) {
            (0, logger_1.webview)(`❌ ResizeManager: Failed to setup observer for ${key}:`, error);
        }
    }
    /**
     * Remove ResizeObserver for specific key
     * @param key The observer key to remove
     */
    static unobserveResize(key) {
        const observer = this.observers.get(key);
        if (observer) {
            observer.disconnect();
            this.observers.delete(key);
            this.observerCallbacks.delete(key);
            this.firstCallbackSkip.delete(key);
            (0, logger_1.webview)(`🧹 ResizeManager: Observer removed for ${key}`);
        }
    }
    /**
     * Pause all ResizeObservers temporarily
     * Useful during terminal creation to prevent premature resize triggers
     */
    static pauseObservers() {
        if (!this.paused) {
            this.paused = true;
            (0, logger_1.webview)(`⏸️ ResizeManager: All observers paused (${this.observers.size} active)`);
        }
    }
    /**
     * Resume all ResizeObservers
     */
    static resumeObservers() {
        if (this.paused) {
            this.paused = false;
            (0, logger_1.webview)(`▶️ ResizeManager: All observers resumed (${this.observers.size} active)`);
        }
    }
    /**
     * Check if observers are currently paused
     */
    static isPaused() {
        return this.paused;
    }
    /**
     * Check if a resize operation is pending
     * @param key The resize operation key to check
     */
    static isPending(key) {
        return this.timers.has(key);
    }
    /**
     * Get all pending resize operation keys
     */
    static getPendingKeys() {
        return Array.from(this.timers.keys());
    }
    /**
     * Get all active observer keys
     */
    static getObserverKeys() {
        return Array.from(this.observers.keys());
    }
    /**
     * Force execute all pending resize operations immediately
     */
    static flushAll() {
        const pendingKeys = this.getPendingKeys();
        (0, logger_1.webview)(`🚀 ResizeManager: Flushing ${pendingKeys.length} pending operations`);
        for (const key of pendingKeys) {
            const timer = this.timers.get(key);
            if (timer) {
                window.clearTimeout(timer);
                this.timers.delete(key);
            }
        }
    }
    /**
     * Clean up all resize operations and observers
     * Call this on disposal to prevent memory leaks
     */
    static dispose() {
        // Clear all timers
        for (const [, timer] of this.timers) {
            window.clearTimeout(timer);
        }
        this.timers.clear();
        // Disconnect all observers
        for (const [, observer] of this.observers) {
            observer.disconnect();
        }
        this.observers.clear();
        this.observerCallbacks.clear();
        this.firstCallbackSkip.clear();
        this.paused = false;
        (0, logger_1.webview)('🧹 ResizeManager: Disposed all resources');
    }
    /**
     * Get current status for debugging
     */
    static getStatus() {
        return {
            pendingTimers: this.timers.size,
            activeObservers: this.observers.size,
            pendingKeys: this.getPendingKeys(),
            observerKeys: this.getObserverKeys(),
        };
    }
}
exports.ResizeManager = ResizeManager;
ResizeManager.timers = new Map();
ResizeManager.observers = new Map();
ResizeManager.observerCallbacks = new Map();
ResizeManager.firstCallbackSkip = new Map();
ResizeManager.DEFAULT_DELAY = 100;
ResizeManager.paused = false;
// ResizeObserverEntry is available as a global type
//# sourceMappingURL=ResizeManager.js.map