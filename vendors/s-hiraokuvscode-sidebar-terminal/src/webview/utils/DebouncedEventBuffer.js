"use strict";
/**
 * DebouncedEventBuffer - Generic Debounced Event/Data Buffering Utility
 *
 * Consolidates common debouncing and buffering patterns used across the codebase.
 * Provides type-safe, reusable implementations for:
 * - Simple debouncing (delay execution until input stops)
 * - Throttling (limit execution rate)
 * - Event buffering with batch processing
 *
 * @example
 * ```typescript
 * // Simple debounce
 * const debouncedResize = new Debouncer(() => {
 *   refitTerminals();
 * }, { delay: 100 });
 *
 * window.addEventListener('resize', () => debouncedResize.trigger());
 *
 * // Event buffer with batch processing
 * const outputBuffer = new EventBuffer<string>({
 *   flushInterval: 16,
 *   maxBufferSize: 100,
 *   onFlush: (items) => terminal.write(items.join('')),
 * });
 *
 * outputBuffer.add(data);
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyedEventBuffer = exports.EventBuffer = exports.Throttler = exports.Debouncer = void 0;
exports.createDebouncer = createDebouncer;
exports.createResizeDebouncer = createResizeDebouncer;
exports.createOutputBuffer = createOutputBuffer;
const logger_1 = require("../../utils/logger");
// ============================================================================
// Constants
// ============================================================================
/**
 * Default timing constants for debouncing and buffering
 */
const BufferDefaults = {
    /** Default delay for resize debouncer (ms) */
    RESIZE_DEBOUNCE_DELAY_MS: 100,
    /** Default flush interval for output buffer (~60fps) */
    OUTPUT_BUFFER_FLUSH_INTERVAL_MS: 16,
    /** Default maximum buffer size for output buffer */
    OUTPUT_BUFFER_MAX_SIZE: 100,
};
/**
 * Simple debouncer for delaying execution
 */
class Debouncer {
    constructor(callback, options) {
        this.callback = callback;
        this.options = options;
        this.timer = null;
        this.lastCallTime = 0;
        this.isLeadingExecuted = false;
        // Default trailing to true
        if (this.options.trailing === undefined) {
            this.options.trailing = true;
        }
    }
    /**
     * Trigger the debounced callback
     */
    trigger() {
        const now = Date.now();
        // Handle leading edge execution
        if (this.options.leading && !this.isLeadingExecuted) {
            this.isLeadingExecuted = true;
            this.log('Executing (leading edge)');
            this.callback();
        }
        // Clear existing timer
        if (this.timer !== null) {
            clearTimeout(this.timer);
        }
        // Set up trailing edge execution
        if (this.options.trailing) {
            this.timer = setTimeout(() => {
                this.timer = null;
                this.isLeadingExecuted = false;
                this.log('Executing (trailing edge)');
                this.callback();
            }, this.options.delay);
        }
        this.lastCallTime = now;
    }
    /**
     * Cancel any pending execution
     */
    cancel() {
        if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.isLeadingExecuted = false;
        this.log('Cancelled');
    }
    /**
     * Execute immediately and cancel any pending execution
     */
    flush() {
        this.cancel();
        this.log('Flushing immediately');
        this.callback();
    }
    /**
     * Check if there's a pending execution
     */
    isPending() {
        return this.timer !== null;
    }
    /**
     * Dispose resources
     */
    dispose() {
        this.cancel();
        this.log('Disposed');
    }
    log(message) {
        if (this.options.debug) {
            const prefix = this.options.name ? `[Debouncer:${this.options.name}]` : '[Debouncer]';
            (0, logger_1.webview)(`${prefix} ${message}`);
        }
    }
}
exports.Debouncer = Debouncer;
/**
 * Throttler for limiting execution rate
 */
class Throttler {
    constructor(callback, options) {
        this.callback = callback;
        this.options = options;
        this.lastExecuteTime = 0;
        this.timer = null;
        this.pendingArgs = null;
        // Default leading and trailing to true
        if (this.options.leading === undefined)
            this.options.leading = true;
        if (this.options.trailing === undefined)
            this.options.trailing = true;
    }
    /**
     * Trigger the throttled callback
     */
    trigger(...args) {
        const now = Date.now();
        const timeSinceLastExecute = now - this.lastExecuteTime;
        if (timeSinceLastExecute >= this.options.interval) {
            // Can execute immediately
            if (this.options.leading) {
                this.lastExecuteTime = now;
                this.log('Executing (leading)');
                this.callback(...args);
            }
            else {
                // Schedule trailing execution
                this.pendingArgs = args;
                this.scheduleTrailing();
            }
        }
        else {
            // Within throttle window - schedule trailing if enabled
            if (this.options.trailing) {
                this.pendingArgs = args;
                this.scheduleTrailing();
            }
        }
    }
    scheduleTrailing() {
        if (this.timer !== null)
            return;
        const delay = this.options.interval - (Date.now() - this.lastExecuteTime);
        this.timer = setTimeout(() => {
            this.timer = null;
            if (this.pendingArgs !== null) {
                this.lastExecuteTime = Date.now();
                const args = this.pendingArgs;
                this.pendingArgs = null;
                this.log('Executing (trailing)');
                this.callback(...args);
            }
        }, Math.max(0, delay));
    }
    /**
     * Cancel any pending execution
     */
    cancel() {
        if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.pendingArgs = null;
        this.log('Cancelled');
    }
    /**
     * Dispose resources
     */
    dispose() {
        this.cancel();
        this.log('Disposed');
    }
    log(message) {
        if (this.options.debug) {
            const prefix = this.options.name ? `[Throttler:${this.options.name}]` : '[Throttler]';
            (0, logger_1.webview)(`${prefix} ${message}`);
        }
    }
}
exports.Throttler = Throttler;
/**
 * EventBuffer for batch processing of events
 */
class EventBuffer {
    constructor(options) {
        this.options = options;
        this.buffer = [];
        this.timer = null;
        // Default flushOnMax to true
        if (this.options.flushOnMax === undefined) {
            this.options.flushOnMax = true;
        }
    }
    /**
     * Add an item to the buffer
     */
    add(item) {
        this.buffer.push(item);
        this.log(`Added item (buffer size: ${this.buffer.length})`);
        // Check if we should flush due to max size
        if (this.options.flushOnMax &&
            this.options.maxBufferSize &&
            this.buffer.length >= this.options.maxBufferSize) {
            this.log('Max buffer size reached, flushing');
            this.flush();
            return;
        }
        // Schedule flush if not already scheduled
        this.scheduleFlush();
    }
    /**
     * Add multiple items to the buffer
     */
    addAll(items) {
        for (const item of items) {
            this.add(item);
        }
    }
    /**
     * Flush the buffer immediately
     */
    flush() {
        this.cancelTimer();
        if (this.buffer.length === 0) {
            return;
        }
        const items = this.buffer;
        this.buffer = [];
        this.log(`Flushing ${items.length} items`);
        this.options.onFlush(items);
    }
    /**
     * Clear the buffer without flushing
     */
    clear() {
        this.cancelTimer();
        const count = this.buffer.length;
        this.buffer = [];
        this.log(`Cleared ${count} items`);
    }
    /**
     * Get current buffer size
     */
    get size() {
        return this.buffer.length;
    }
    /**
     * Check if buffer is empty
     */
    get isEmpty() {
        return this.buffer.length === 0;
    }
    /**
     * Check if flush is scheduled
     */
    get isFlushScheduled() {
        return this.timer !== null;
    }
    /**
     * Dispose resources
     */
    dispose() {
        this.flush(); // Flush remaining items
        this.cancelTimer();
        this.log('Disposed');
    }
    scheduleFlush() {
        if (this.timer !== null)
            return;
        this.timer = setTimeout(() => {
            this.timer = null;
            this.flush();
        }, this.options.flushInterval);
    }
    cancelTimer() {
        if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
    log(message) {
        if (this.options.debug) {
            const prefix = this.options.name ? `[EventBuffer:${this.options.name}]` : '[EventBuffer]';
            (0, logger_1.webview)(`${prefix} ${message}`);
        }
    }
}
exports.EventBuffer = EventBuffer;
/**
 * KeyedEventBuffer for buffering events by key
 */
class KeyedEventBuffer {
    constructor(options) {
        this.options = options;
        this.buffers = new Map();
        if (this.options.flushOnMax === undefined) {
            this.options.flushOnMax = true;
        }
    }
    /**
     * Add an item to a specific key's buffer
     */
    add(key, item) {
        let entry = this.buffers.get(key);
        if (!entry) {
            entry = { items: [], timer: null };
            this.buffers.set(key, entry);
        }
        entry.items.push(item);
        this.log(`Added to ${key} (buffer size: ${entry.items.length})`);
        // Check if we should flush due to max size
        if (this.options.flushOnMax &&
            this.options.maxBufferSize &&
            entry.items.length >= this.options.maxBufferSize) {
            this.log(`Max buffer size reached for ${key}, flushing`);
            this.flushKey(key);
            return;
        }
        // Schedule flush if not already scheduled
        this.scheduleFlush(key, entry);
    }
    /**
     * Flush a specific key's buffer
     */
    flushKey(key) {
        const entry = this.buffers.get(key);
        if (!entry || entry.items.length === 0)
            return;
        if (entry.timer !== null) {
            clearTimeout(entry.timer);
            entry.timer = null;
        }
        const items = entry.items;
        entry.items = [];
        this.log(`Flushing ${items.length} items for ${key}`);
        this.options.onFlush(key, items);
    }
    /**
     * Flush all buffers
     */
    flushAll() {
        for (const key of this.buffers.keys()) {
            this.flushKey(key);
        }
    }
    /**
     * Clear a specific key's buffer without flushing
     */
    clearKey(key) {
        const entry = this.buffers.get(key);
        if (entry) {
            if (entry.timer !== null) {
                clearTimeout(entry.timer);
                entry.timer = null;
            }
            entry.items = [];
            this.log(`Cleared ${key}`);
        }
    }
    /**
     * Clear all buffers without flushing
     */
    clearAll() {
        for (const [, entry] of this.buffers) {
            if (entry.timer !== null) {
                clearTimeout(entry.timer);
            }
        }
        this.buffers.clear();
        this.log('Cleared all');
    }
    /**
     * Get buffer size for a specific key
     */
    getSize(key) {
        return this.buffers.get(key)?.items.length ?? 0;
    }
    /**
     * Get all keys with buffers
     */
    getKeys() {
        return Array.from(this.buffers.keys());
    }
    /**
     * Dispose resources
     */
    dispose() {
        this.flushAll();
        this.clearAll();
        this.log('Disposed');
    }
    scheduleFlush(key, entry) {
        if (entry.timer !== null)
            return;
        entry.timer = setTimeout(() => {
            entry.timer = null;
            this.flushKey(key);
        }, this.options.flushInterval);
    }
    log(message) {
        if (this.options.debug) {
            const prefix = this.options.name
                ? `[KeyedEventBuffer:${this.options.name}]`
                : '[KeyedEventBuffer]';
            (0, logger_1.webview)(`${prefix} ${message}`);
        }
    }
}
exports.KeyedEventBuffer = KeyedEventBuffer;
/**
 * Factory functions for common use cases
 */
/**
 * Create a simple debouncer
 */
function createDebouncer(callback, delay, options) {
    return new Debouncer(callback, { delay, ...options });
}
/**
 * Create a resize debouncer (common pattern)
 */
function createResizeDebouncer(callback, delay = BufferDefaults.RESIZE_DEBOUNCE_DELAY_MS) {
    return new Debouncer(callback, { delay, trailing: true, name: 'resize' });
}
/**
 * Create an output buffer (common pattern)
 */
function createOutputBuffer(onFlush, options) {
    return new EventBuffer({
        flushInterval: BufferDefaults.OUTPUT_BUFFER_FLUSH_INTERVAL_MS,
        maxBufferSize: BufferDefaults.OUTPUT_BUFFER_MAX_SIZE,
        onFlush,
        ...options,
    });
}
//# sourceMappingURL=DebouncedEventBuffer.js.map