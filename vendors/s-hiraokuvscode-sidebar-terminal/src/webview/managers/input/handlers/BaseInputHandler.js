"use strict";
/**
 * BaseInputHandler - Base class for all input handlers
 * Eliminates code duplication identified by similarity analysis
 * Provides common functionality for event management, state tracking, and disposal
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseInputHandler = void 0;
const BaseManager_1 = require("../../BaseManager");
const EventHandlerRegistry_1 = require("../../../utils/EventHandlerRegistry");
/**
 * Base input handler class that provides common functionality
 * Identified patterns: 92% similarity in event registration and state management
 */
class BaseInputHandler extends BaseManager_1.BaseManager {
    constructor(handlerName, eventDebounceTimers, config = {}) {
        super(handlerName, {
            enableLogging: true,
            enableValidation: true,
            enableErrorRecovery: true,
        });
        // Event handler registry for centralized event management
        this.eventRegistry = new EventHandlerRegistry_1.EventHandlerRegistry();
        // Registered event handlers for tracking and cleanup
        this.registeredHandlers = new Map();
        // Handler state for debugging and validation
        this.handlerState = new Map();
        // Handler-specific metrics
        this.metrics = {
            eventsRegistered: 0,
            eventsProcessed: 0,
            eventsDebounced: 0,
            lastEventTimestamp: 0,
        };
        this.eventDebounceTimers = eventDebounceTimers;
        // Set default configuration
        this.config = {
            enableDebouncing: true,
            debounceDelay: 50,
            enableStateTracking: true,
            enableEventPrevention: false,
            ...config,
        };
        this.logger('initialization', 'starting');
    }
    /**
     * Register event handler with centralized management and debouncing
     * Eliminates duplicate event registration patterns (85% similarity)
     */
    registerEventHandler(id, element, eventType, handler, options, enableDebounce = false) {
        // Check for duplicate registration
        if (this.registeredHandlers.has(id)) {
            this.logger(`Event handler ${id} already registered, skipping`);
            return;
        }
        let finalHandler = handler;
        // Use unique ID per manager to avoid collisions in shared timers map
        const uniqueId = `${this.managerName}-${id}`;
        // Add debouncing if enabled
        if (enableDebounce && this.config.enableDebouncing) {
            finalHandler = this.createDebouncedHandler(uniqueId, handler);
        }
        // Add state tracking wrapper
        if (this.config.enableStateTracking) {
            finalHandler = this.createStateTrackingHandler(uniqueId, finalHandler);
        }
        // Add error handling wrapper
        finalHandler = this.createErrorHandlingWrapper(uniqueId, finalHandler);
        // Register with EventHandlerRegistry
        this.eventRegistry.register(id, element, eventType, finalHandler, options);
        // Track registration
        this.registeredHandlers.set(id, {
            id,
            element,
            eventType,
            handler: finalHandler,
            options,
            debounced: enableDebounce,
        });
        this.metrics.eventsRegistered++;
        this.logger(`Registered event handler: ${id} (${eventType}) - debounced: ${enableDebounce}`);
    }
    /**
     * Create debounced event handler
     * Eliminates duplicate debouncing logic (88% similarity)
     */
    createDebouncedHandler(id, handler) {
        return (event) => {
            const debounceKey = `${id}-debounce`;
            // Clear existing timer
            if (this.eventDebounceTimers.has(debounceKey)) {
                clearTimeout(this.eventDebounceTimers.get(debounceKey));
            }
            // Set new timer
            const timer = window.setTimeout(() => {
                handler(event);
                this.eventDebounceTimers.delete(debounceKey);
                this.metrics.eventsDebounced++;
            }, this.config.debounceDelay);
            this.eventDebounceTimers.set(debounceKey, timer);
        };
    }
    /**
     * Create state tracking wrapper for event handlers
     */
    createStateTrackingHandler(id, handler) {
        return (event) => {
            // Track event processing
            this.handlerState.set(`${id}-lastEvent`, {
                type: event.type,
                timestamp: Date.now(),
                target: event.target,
            });
            this.metrics.eventsProcessed++;
            this.metrics.lastEventTimestamp = Date.now();
            // Call original handler
            handler(event);
        };
    }
    /**
     * Create error handling wrapper
     * Eliminates duplicate error handling patterns (90% similarity)
     */
    createErrorHandlingWrapper(id, handler) {
        return (event) => {
            try {
                handler(event);
            }
            catch (error) {
                this.logger(`Error in event handler ${id}: ${error}`);
                // Prevent event propagation on error if configured
                if (this.config.enableEventPrevention) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                // Track error state
                if (this.config.enableStateTracking) {
                    this.handlerState.set(`${id}-lastError`, {
                        error: error instanceof Error ? error.message : String(error),
                        timestamp: Date.now(),
                        eventType: event.type,
                    });
                }
            }
        };
    }
    /**
     * Unregister specific event handler
     */
    unregisterEventHandler(id) {
        const entry = this.registeredHandlers.get(id);
        if (entry) {
            // Clear any pending debounce timers
            const uniqueId = `${this.managerName}-${id}`;
            const debounceKey = `${uniqueId}-debounce`;
            if (this.eventDebounceTimers.has(debounceKey)) {
                clearTimeout(this.eventDebounceTimers.get(debounceKey));
                this.eventDebounceTimers.delete(debounceKey);
            }
            this.eventRegistry.unregister(id);
            this.registeredHandlers.delete(id);
            this.logger(`Unregistered event handler: ${id}`);
        }
    }
    /**
     * Check if handler is in a valid state
     */
    isHandlerHealthy() {
        const now = Date.now();
        const timeSinceLastEvent = now - this.metrics.lastEventTimestamp;
        // Consider healthy if events processed recently or no events expected
        return this.metrics.eventsProcessed === 0 || timeSinceLastEvent < 30000; // 30 seconds
    }
    /**
     * Get handler metrics for debugging
     */
    getHandlerMetrics() {
        return { ...this.metrics };
    }
    /**
     * Get handler state for debugging
     */
    getHandlerState() {
        const state = {};
        for (const [key, value] of this.handlerState) {
            // Return a deep copy to prevent external modification
            state[key] =
                typeof value === 'object' && value !== null ? JSON.parse(JSON.stringify(value)) : value;
        }
        return state;
    }
    /**
     * Clear all debounce timers for this handler
     */
    clearAllDebounceTimers() {
        for (const [key, timer] of this.eventDebounceTimers) {
            if (key.includes(this.managerName)) {
                clearTimeout(timer);
                this.eventDebounceTimers.delete(key);
            }
        }
    }
    /**
     * Dispose handler resources (enhanced base implementation)
     */
    doDispose() {
        this.logger('disposal', 'starting');
        // Clear all debounce timers
        this.clearAllDebounceTimers();
        // Clear state tracking
        this.handlerState.clear();
        // Clear registered handlers tracking
        this.registeredHandlers.clear();
        // Reset metrics
        this.metrics = {
            eventsRegistered: 0,
            eventsProcessed: 0,
            eventsDebounced: 0,
            lastEventTimestamp: 0,
        };
        this.logger('disposal', 'completed');
    }
    /**
     * Dispose of all event listeners and cleanup resources
     */
    dispose() {
        this.logger(`Disposing ${this.managerName}`);
        // Dispose EventHandlerRegistry - this will clean up all registered event listeners
        this.eventRegistry.dispose();
        // Call parent dispose which will call doDispose()
        super.dispose();
        this.logger(`${this.managerName}`, 'completed');
    }
}
exports.BaseInputHandler = BaseInputHandler;
//# sourceMappingURL=BaseInputHandler.js.map