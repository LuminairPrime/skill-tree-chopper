"use strict";
/**
 * StateTracker - Generic State Tracking Utility
 *
 * Provides a type-safe, reusable state tracking mechanism
 * that consolidates common Set-based tracking patterns.
 *
 * Key Features:
 * - Type-safe generic implementation
 * - Optional TTL (Time-To-Live) for auto-expiring entries
 * - Event callbacks for state changes
 * - Statistics and debugging support
 *
 * @example
 * ```typescript
 * // Simple usage
 * const restoredTerminals = new StateTracker<string>();
 * restoredTerminals.add('terminal-1');
 * restoredTerminals.has('terminal-1'); // true
 *
 * // With TTL (auto-expire after 5 seconds)
 * const tempStates = new StateTracker<string>({ ttlMs: 5000 });
 * tempStates.add('temp-item');
 * // Item auto-expires after 5 seconds
 *
 * // With callbacks
 * const tracked = new StateTracker<string>({
 *   onAdd: (item) => console.log(`Added: ${item}`),
 *   onRemove: (item) => console.log(`Removed: ${item}`),
 * });
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateTracker = void 0;
exports.createIdTracker = createIdTracker;
exports.createExpiringTracker = createExpiringTracker;
const logger_1 = require("../../utils/logger");
/**
 * StateTracker - Generic state tracking with optional TTL and callbacks
 */
class StateTracker {
    constructor(options = {}) {
        this.entries = new Map();
        this.options = options;
        // Start cleanup timer if TTL is enabled
        if (options.ttlMs && options.ttlMs > 0) {
            this.startCleanupTimer();
        }
        this.log('StateTracker initialized');
    }
    /**
     * Add an item to the tracker
     * @returns true if item was newly added, false if already existed
     */
    add(item) {
        if (this.entries.has(item)) {
            // Update expiry time if TTL is set
            if (this.options.ttlMs) {
                const entry = this.entries.get(item);
                if (entry) {
                    entry.expiresAt = Date.now() + this.options.ttlMs;
                }
            }
            return false;
        }
        const entry = {
            item,
            addedAt: Date.now(),
            expiresAt: this.options.ttlMs ? Date.now() + this.options.ttlMs : undefined,
        };
        this.entries.set(item, entry);
        this.log(`Added: ${this.itemToString(item)}`);
        this.options.onAdd?.(item);
        return true;
    }
    /**
     * Check if an item is in the tracker
     */
    has(item) {
        const entry = this.entries.get(item);
        if (!entry)
            return false;
        // Check if expired
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this.remove(item);
            return false;
        }
        return true;
    }
    /**
     * Remove an item from the tracker
     * @returns true if item was removed, false if not found
     */
    remove(item) {
        if (!this.entries.has(item)) {
            return false;
        }
        this.entries.delete(item);
        this.log(`Removed: ${this.itemToString(item)}`);
        this.options.onRemove?.(item);
        return true;
    }
    /**
     * Get all tracked items
     */
    getAll() {
        this.cleanupExpired();
        return Array.from(this.entries.keys());
    }
    /**
     * Get the number of tracked items
     */
    get size() {
        this.cleanupExpired();
        return this.entries.size;
    }
    /**
     * Clear all tracked items
     */
    clear() {
        const items = Array.from(this.entries.keys());
        this.entries.clear();
        this.log('Cleared all entries');
        // Call onRemove for each item
        if (this.options.onRemove) {
            for (const item of items) {
                this.options.onRemove(item);
            }
        }
    }
    /**
     * Get statistics about tracked items
     */
    getStats() {
        this.cleanupExpired();
        if (this.entries.size === 0) {
            return { total: 0 };
        }
        const now = Date.now();
        let oldest;
        let newest;
        for (const [item, entry] of this.entries) {
            const age = now - entry.addedAt;
            if (!oldest || age > oldest.age) {
                oldest = { item, age };
            }
            if (!newest || age < newest.age) {
                newest = { item, age };
            }
        }
        return {
            total: this.entries.size,
            oldest,
            newest,
        };
    }
    /**
     * Add multiple items at once
     */
    addAll(items) {
        let addedCount = 0;
        for (const item of items) {
            if (this.add(item)) {
                addedCount++;
            }
        }
        return addedCount;
    }
    /**
     * Remove multiple items at once
     */
    removeAll(items) {
        let removedCount = 0;
        for (const item of items) {
            if (this.remove(item)) {
                removedCount++;
            }
        }
        return removedCount;
    }
    /**
     * Check if any of the given items are tracked
     */
    hasAny(items) {
        return items.some((item) => this.has(item));
    }
    /**
     * Check if all of the given items are tracked
     */
    hasAll(items) {
        return items.every((item) => this.has(item));
    }
    /**
     * Dispose the tracker and cleanup resources
     */
    dispose() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
        this.entries.clear();
        this.log('StateTracker disposed');
    }
    /**
     * Start the cleanup timer for TTL-based expiration
     */
    startCleanupTimer() {
        // Run cleanup at half the TTL interval for responsive expiration
        const interval = Math.max(1000, (this.options.ttlMs ?? 0) / 2);
        this.cleanupTimer = setInterval(() => {
            this.cleanupExpired();
        }, interval);
    }
    /**
     * Remove expired entries
     */
    cleanupExpired() {
        if (!this.options.ttlMs)
            return;
        const now = Date.now();
        const expired = [];
        for (const [item, entry] of this.entries) {
            if (entry.expiresAt && now > entry.expiresAt) {
                expired.push(item);
            }
        }
        for (const item of expired) {
            this.remove(item);
        }
    }
    /**
     * Convert item to string for logging
     */
    itemToString(item) {
        if (typeof item === 'string')
            return item;
        if (typeof item === 'number')
            return String(item);
        try {
            return JSON.stringify(item);
        }
        catch {
            return String(item);
        }
    }
    /**
     * Log message if debug is enabled
     */
    log(message) {
        if (this.options.debug) {
            const prefix = this.options.name ? `[StateTracker:${this.options.name}]` : '[StateTracker]';
            (0, logger_1.webview)(`${prefix} ${message}`);
        }
    }
}
exports.StateTracker = StateTracker;
/**
 * Create a simple boolean state tracker (like a Set<string> for IDs)
 */
function createIdTracker(options) {
    return new StateTracker(options);
}
/**
 * Create a state tracker with automatic expiration
 */
function createExpiringTracker(ttlMs, options) {
    return new StateTracker({ ...options, ttlMs });
}
//# sourceMappingURL=StateTracker.js.map