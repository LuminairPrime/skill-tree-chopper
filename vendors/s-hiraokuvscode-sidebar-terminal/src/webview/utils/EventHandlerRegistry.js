"use strict";
/**
 * EventHandlerRegistry Utility
 *
 * Centralized event listener management to eliminate code duplication
 * across InputManager, TerminalLifecycleCoordinator, and other managers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalEventRegistry = exports.ScopedEventRegistry = exports.EventHandlerRegistry = void 0;
const logger_1 = require("../../utils/logger");
/**
 * Centralized event handler registry
 * Provides automatic cleanup and organized event listener management
 */
class EventHandlerRegistry {
    constructor() {
        this.listeners = new Map();
        this.disposed = false;
    }
    /**
     * Register an event listener with automatic cleanup tracking
     * @param key Unique identifier for this listener
     * @param element Element to attach listener to
     * @param type Event type (e.g., 'click', 'keydown')
     * @param listener Event listener function
     * @param options Event listener options
     */
    register(key, element, type, listener, options) {
        if (this.disposed) {
            (0, logger_1.webview)(`⚠️ EventRegistry: Cannot register ${key} - registry is disposed`);
            return;
        }
        // Remove existing listener with same key
        this.unregister(key);
        try {
            // Add the event listener
            element.addEventListener(type, listener, options);
            // Store the listener info for cleanup
            const registeredListener = {
                key,
                element,
                type,
                listener,
                options,
                registeredAt: Date.now(),
            };
            this.listeners.set(key, registeredListener);
            (0, logger_1.webview)(`📡 EventRegistry: Registered ${key} (${type} on ${this.getElementName(element)})`);
        }
        catch (error) {
            (0, logger_1.webview)(`❌ EventRegistry: Failed to register ${key}:`, error);
        }
    }
    /**
     * Register multiple event listeners at once
     * @param configs Array of event listener configurations
     */
    registerMultiple(configs) {
        for (const config of configs) {
            this.register(config.key, config.element, config.type, config.listener, config.options);
        }
    }
    /**
     * Unregister a specific event listener
     * @param key The listener key to remove
     */
    unregister(key) {
        const listener = this.listeners.get(key);
        if (!listener) {
            return false;
        }
        try {
            listener.element.removeEventListener(listener.type, listener.listener, listener.options);
            this.listeners.delete(key);
            (0, logger_1.webview)(`🧹 EventRegistry: Unregistered ${key} (${listener.type})`);
            return true;
        }
        catch (error) {
            (0, logger_1.webview)(`❌ EventRegistry: Failed to unregister ${key}:`, error);
            return false;
        }
    }
    /**
     * Unregister multiple listeners by key pattern
     * @param pattern RegExp pattern to match keys
     */
    unregisterByPattern(pattern) {
        const keysToRemove = Array.from(this.listeners.keys()).filter((key) => pattern.test(key));
        let removed = 0;
        for (const key of keysToRemove) {
            if (this.unregister(key)) {
                removed++;
            }
        }
        (0, logger_1.webview)(`🧹 EventRegistry: Unregistered ${removed} listeners matching pattern ${pattern}`);
        return removed;
    }
    /**
     * Check if a listener is registered
     * @param key The listener key to check
     */
    isRegistered(key) {
        return this.listeners.has(key);
    }
    /**
     * Get all registered listener keys
     */
    getRegisteredKeys() {
        return Array.from(this.listeners.keys());
    }
    /**
     * Get the count of registered listeners
     */
    getRegisteredCount() {
        return this.listeners.size;
    }
    /**
     * Get detailed information about a specific listener
     * @param key The listener key
     */
    getListenerInfo(key) {
        return this.listeners.get(key) || null;
    }
    /**
     * Get statistics about registered listeners
     */
    getStats() {
        const listeners = Array.from(this.listeners.values());
        return {
            totalListeners: listeners.length,
            eventTypes: [...new Set(listeners.map((l) => l.type))],
            elements: [...new Set(listeners.map((l) => this.getElementName(l.element)))],
            oldestRegistration: listeners.length > 0 ? Math.min(...listeners.map((l) => l.registeredAt)) : null,
            newestRegistration: listeners.length > 0 ? Math.max(...listeners.map((l) => l.registeredAt)) : null,
        };
    }
    /**
     * Create a scoped registry for a specific component
     * All listeners registered through this scope will have a prefix
     * @param prefix Prefix for all keys in this scope
     */
    createScope(prefix) {
        return new ScopedEventRegistry(this, prefix);
    }
    /**
     * Clean up all registered event listeners
     */
    dispose() {
        if (this.disposed) {
            return;
        }
        const listenerCount = this.listeners.size;
        (0, logger_1.webview)(`🧹 EventRegistry: Disposing ${listenerCount} listeners...`);
        // Remove all listeners
        for (const [key] of this.listeners) {
            this.unregister(key);
        }
        this.disposed = true;
        (0, logger_1.webview)('✅ EventRegistry: Disposed');
    }
    /**
     * Get a human-readable name for an element
     */
    getElementName(element) {
        if (element === window)
            return 'window';
        if (element === document)
            return 'document';
        if (element instanceof HTMLElement) {
            return `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.className ? `.${element.className.split(' ')[0]}` : ''}`;
        }
        return 'unknown';
    }
}
exports.EventHandlerRegistry = EventHandlerRegistry;
/**
 * Scoped event registry that automatically prefixes all keys
 */
class ScopedEventRegistry {
    constructor(registry, prefix) {
        this.registry = registry;
        this.prefix = prefix;
    }
    register(key, element, type, listener, options) {
        this.registry.register(`${this.prefix}:${key}`, element, type, listener, options);
    }
    registerMultiple(configs) {
        const prefixedConfigs = configs.map((config) => ({
            ...config,
            key: `${this.prefix}:${config.key}`,
        }));
        this.registry.registerMultiple(prefixedConfigs);
    }
    unregister(key) {
        return this.registry.unregister(`${this.prefix}:${key}`);
    }
    unregisterAll() {
        return this.registry.unregisterByPattern(new RegExp(`^${this.prefix}:`));
    }
    isRegistered(key) {
        return this.registry.isRegistered(`${this.prefix}:${key}`);
    }
    getRegisteredKeys() {
        return this.registry
            .getRegisteredKeys()
            .filter((key) => key.startsWith(`${this.prefix}:`))
            .map((key) => key.substring(this.prefix.length + 1));
    }
}
exports.ScopedEventRegistry = ScopedEventRegistry;
// Create a global instance for convenience
exports.globalEventRegistry = new EventHandlerRegistry();
//# sourceMappingURL=EventHandlerRegistry.js.map