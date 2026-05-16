"use strict";
/**
 * Typed Event Bus for decoupled component communication
 *
 * Provides publish-subscribe pattern with type safety, automatic cleanup,
 * and debugging support through event replay.
 *
 * @example
 * ```typescript
 * const eventBus = new EventBus();
 * const TerminalCreated = createEventType<{id: string}>('terminal.created');
 *
 * const subscription = eventBus.subscribe(TerminalCreated, (event) => {
 *   console.log('Terminal created:', event.data.id);
 * });
 *
 * eventBus.publish(TerminalCreated, {id: '1'});
 * subscription.dispose();
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBus = exports.EventType = void 0;
exports.createEventType = createEventType;
const logger_1 = require("../utils/logger");
/**
 * Event type identifier with associated data type
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class EventType {
    constructor(name) {
        this.name = name;
    }
}
exports.EventType = EventType;
/**
 * Create a typed event type identifier
 *
 * @param name Event type name (use dot notation for namespacing, e.g., 'terminal.created')
 * @returns Event type identifier
 *
 * @example
 * ```typescript
 * const TerminalCreatedEvent = createEventType<{id: string}>('terminal.created');
 * ```
 */
function createEventType(name) {
    return new EventType(name);
}
/**
 * Typed Event Bus implementation
 */
class EventBus {
    constructor(options = {}) {
        this._subscriptions = new Map();
        this._eventHistory = [];
        this._eventIdCounter = 0;
        this._isDisposed = false;
        this._maxHistorySize = options.maxHistorySize ?? 1000;
    }
    /**
     * Subscribe to an event type
     *
     * @param eventType Event type to subscribe to
     * @param handler Event handler function
     * @returns Disposable subscription
     *
     * @example
     * ```typescript
     * const subscription = eventBus.subscribe(TerminalCreated, (event) => {
     *   console.log(event.data);
     * });
     * // Later...
     * subscription.dispose();
     * ```
     */
    subscribe(eventType, handler) {
        this._ensureNotDisposed();
        const subscription = {
            handler,
            disposed: false,
        };
        // Get or create subscription list for this event type
        let subscriptions = this._subscriptions.get(eventType.name);
        if (!subscriptions) {
            subscriptions = [];
            this._subscriptions.set(eventType.name, subscriptions);
        }
        subscriptions.push(subscription);
        // Return disposable to unsubscribe
        return {
            dispose: () => {
                if (subscription.disposed) {
                    return;
                }
                subscription.disposed = true;
                const subs = this._subscriptions.get(eventType.name);
                if (subs) {
                    const index = subs.indexOf(subscription);
                    if (index !== -1) {
                        subs.splice(index, 1);
                    }
                    // Cleanup empty subscription lists
                    if (subs.length === 0) {
                        this._subscriptions.delete(eventType.name);
                    }
                }
            },
        };
    }
    /**
     * Publish an event to all subscribers
     *
     * @param eventType Event type to publish
     * @param data Event data
     *
     * @example
     * ```typescript
     * eventBus.publish(TerminalCreated, {id: '1', name: 'Terminal 1'});
     * ```
     */
    publish(eventType, data) {
        this._ensureNotDisposed();
        const event = {
            type: eventType,
            data,
            timestamp: new Date(),
            id: this._generateEventId(),
        };
        // Add to history
        this._addToHistory(event);
        // Get subscribers for this event type
        const subscriptions = this._subscriptions.get(eventType.name);
        if (!subscriptions || subscriptions.length === 0) {
            return;
        }
        // Notify all subscribers
        // Use slice() to avoid issues if handlers modify subscription list
        for (const subscription of subscriptions.slice()) {
            if (subscription.disposed) {
                continue;
            }
            try {
                const result = subscription.handler(event);
                // Handle async handlers
                if (result && typeof result.then === 'function') {
                    result.catch((error) => {
                        this._handleHandlerError(event, error);
                    });
                }
            }
            catch (error) {
                this._handleHandlerError(event, error);
            }
        }
    }
    /**
     * Get event history since a specific timestamp
     *
     * @param since Optional timestamp to filter events (defaults to all events)
     * @returns Array of events
     *
     * @example
     * ```typescript
     * const lastMinute = new Date(Date.now() - 60000);
     * const recentEvents = eventBus.replay(lastMinute);
     * ```
     */
    replay(since) {
        this._ensureNotDisposed();
        if (!since) {
            return this._eventHistory.map((entry) => entry.event);
        }
        return this._eventHistory
            .filter((entry) => entry.event.timestamp >= since)
            .map((entry) => entry.event);
    }
    /**
     * Get the number of subscribers for an event type
     *
     * @param eventType Event type to check
     * @returns Number of subscribers
     */
    getSubscriberCount(eventType) {
        const subscriptions = this._subscriptions.get(eventType.name);
        return subscriptions ? subscriptions.filter((s) => !s.disposed).length : 0;
    }
    /**
     * Get total number of active subscriptions
     */
    get totalSubscriptions() {
        let count = 0;
        for (const subscriptions of this._subscriptions.values()) {
            count += subscriptions.filter((s) => !s.disposed).length;
        }
        return count;
    }
    /**
     * Get event history size
     */
    get historySize() {
        return this._eventHistory.length;
    }
    /**
     * Clear event history
     */
    clearHistory() {
        this._eventHistory.length = 0;
    }
    /**
     * Dispose the event bus and cleanup all subscriptions
     */
    dispose() {
        if (this._isDisposed) {
            return;
        }
        // Mark all subscriptions as disposed
        for (const subscriptions of this._subscriptions.values()) {
            for (const subscription of subscriptions) {
                subscription.disposed = true;
            }
        }
        this._subscriptions.clear();
        this._eventHistory.length = 0;
        this._isDisposed = true;
    }
    _generateEventId() {
        return `evt_${++this._eventIdCounter}_${Date.now()}`;
    }
    _addToHistory(event) {
        this._eventHistory.push({ event });
        // Maintain max history size (FIFO)
        if (this._eventHistory.length > this._maxHistorySize) {
            this._eventHistory.shift();
        }
    }
    _handleHandlerError(event, error) {
        // Log error but don't prevent other handlers from running
        (0, logger_1.error)(`Error in event handler for ${event.type.name}:`, error);
        // Add error to history for debugging
        const historyEntry = this._eventHistory.find((entry) => entry.event.id === event.id);
        if (historyEntry) {
            historyEntry.error = error;
        }
    }
    _ensureNotDisposed() {
        if (this._isDisposed) {
            throw new Error('Cannot use disposed EventBus');
        }
    }
}
exports.EventBus = EventBus;
//# sourceMappingURL=EventBus.js.map