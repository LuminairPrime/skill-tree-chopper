"use strict";
/**
 * DOM Manager - VS Code dom.ts Pattern
 *
 * Provides utilities for scheduling DOM operations with priority control
 * to prevent layout thrashing and optimize rendering performance.
 *
 * Based on VS Code: src/vs/base/browser/dom.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOMManager = void 0;
/**
 * DOM Operation Scheduler
 *
 * Schedules DOM operations at the next animation frame with priority control.
 * Higher priority operations execute first (Read operations have higher priority).
 *
 * Priority convention (matching VS Code):
 * - Read operations (measure): priority 10000
 * - Write operations (modify): priority -10000
 */
class DOMManager {
    /**
     * Schedule a callback to execute at the next animation frame
     *
     * @param callback Function to execute
     * @param priority Execution priority (higher executes first)
     * @returns Disposable to cancel the scheduled callback
     */
    static scheduleAtNextAnimationFrame(callback, priority = 0) {
        // Add to pending callbacks
        this.pendingCallbacks.push({ callback, priority });
        // Schedule execution if not already scheduled
        if (!this.isScheduled) {
            this.isScheduled = true;
            requestAnimationFrame(() => this.executeCallbacks());
        }
        // Return disposable to allow cancellation
        return {
            dispose: () => {
                const index = this.pendingCallbacks.findIndex((item) => item.callback === callback);
                if (index >= 0) {
                    this.pendingCallbacks.splice(index, 1);
                }
            },
        };
    }
    /**
     * Run callback immediately if possible, otherwise schedule for next frame
     *
     * @param callback Function to execute
     * @param priority Execution priority
     */
    static runAtThisOrScheduleAtNextAnimationFrame(callback, priority = 0) {
        if (this.pendingCallbacks.length === 0) {
            // No pending callbacks, run immediately
            callback();
        }
        else {
            // Already have pending callbacks, schedule this one
            this.scheduleAtNextAnimationFrame(callback, priority);
        }
    }
    /**
     * Execute all pending callbacks in priority order
     *
     * @private
     */
    static executeCallbacks() {
        this.isScheduled = false;
        if (this.pendingCallbacks.length === 0) {
            return;
        }
        // Sort by priority (higher priority first)
        const callbacks = [...this.pendingCallbacks].sort((a, b) => b.priority - a.priority);
        // Clear pending callbacks
        this.pendingCallbacks = [];
        // Execute callbacks in priority order
        for (const item of callbacks) {
            try {
                item.callback();
            }
            catch (error) {
                console.error('[DOMManager] Error executing callback:', error);
            }
        }
    }
    /**
     * Convenience method for scheduling Read operations
     *
     * @param callback Function that reads from DOM
     */
    static scheduleRead(callback) {
        return this.scheduleAtNextAnimationFrame(callback, this.Priority.READ);
    }
    /**
     * Convenience method for scheduling Write operations
     *
     * @param callback Function that writes to DOM
     */
    static scheduleWrite(callback) {
        return this.scheduleAtNextAnimationFrame(callback, this.Priority.WRITE);
    }
    /**
     * Clear all pending callbacks (useful for testing/cleanup)
     */
    static clearPendingCallbacks() {
        this.pendingCallbacks = [];
        this.isScheduled = false;
    }
}
exports.DOMManager = DOMManager;
DOMManager.pendingCallbacks = [];
DOMManager.isScheduled = false;
/**
 * Priority constants (matching VS Code)
 */
DOMManager.Priority = {
    /** Read operations (DOM measurements) - highest priority */
    READ: 10000,
    /** Write operations (DOM modifications) - lowest priority */
    WRITE: -10000,
    /** Normal priority */
    NORMAL: 0,
};
//# sourceMappingURL=DOMManager.js.map