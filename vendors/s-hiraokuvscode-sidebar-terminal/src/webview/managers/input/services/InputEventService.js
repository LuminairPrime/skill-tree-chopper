"use strict";
/**
 * InputEventService - Centralized event management for input handlers
 * Based on similarity analysis showing 400+ lines of duplicate event handling
 * Provides unified event registration, debouncing, and state management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputEventService = void 0;
const EventHandlerRegistry_1 = require("../../../utils/EventHandlerRegistry");
const logger_1 = require("../../../../utils/logger");
/**
 * Centralized input event service
 * Eliminates duplicate event handling patterns across input managers
 */
class InputEventService {
    constructor(logger = logger_1.webview) {
        // Core event registry
        this.eventRegistry = new EventHandlerRegistry_1.EventHandlerRegistry();
        // Debounce timers management
        this.debounceTimers = new Map();
        // Registered events tracking
        this.registeredEvents = new Map();
        // Global metrics
        this.metrics = {
            totalRegistered: 0,
            totalProcessed: 0,
            totalDebounced: 0,
            totalErrors: 0,
            lastEventTimestamp: 0,
            averageProcessingTime: 0,
        };
        this.logger = logger;
        this.logger('InputEventService initialized');
    }
    /**
     * Register event handler with advanced configuration
     * Centralizes event registration patterns found in multiple handlers
     */
    registerEventHandler(id, element, eventType, handler, config = {}) {
        // Check for duplicate registration
        if (this.registeredEvents.has(id)) {
            this.logger(`Event handler ${id} already registered, skipping`);
            return;
        }
        // Set default configuration
        const finalConfig = {
            debounce: false,
            debounceDelay: 50,
            preventDefault: false,
            stopPropagation: false,
            once: false,
            passive: false,
            capture: false,
            ...config,
        };
        // Create wrapped handler with all features
        const wrappedHandler = this.createWrappedHandler(id, handler, finalConfig);
        // Create event listener options
        const options = {
            once: finalConfig.once,
            passive: finalConfig.passive,
            capture: finalConfig.capture,
        };
        // Register with EventHandlerRegistry
        this.eventRegistry.register(id, element, eventType, wrappedHandler, options);
        // Track registration
        const registeredEvent = {
            id,
            element,
            eventType,
            originalHandler: handler,
            wrappedHandler,
            config: finalConfig,
            registeredAt: Date.now(),
            metrics: {
                callCount: 0,
                errorCount: 0,
                totalProcessingTime: 0,
            },
        };
        this.registeredEvents.set(id, registeredEvent);
        this.metrics.totalRegistered++;
        this.logger(`Registered event handler: ${id} (${eventType}) - ` +
            `debounced: ${finalConfig.debounce}, passive: ${finalConfig.passive}`);
    }
    /**
     * Create wrapped event handler with all features
     * Eliminates duplicate wrapper creation patterns (92% similarity)
     */
    createWrappedHandler(id, originalHandler, config) {
        return (event) => {
            const startTime = performance.now();
            const registeredEvent = this.registeredEvents.get(id);
            if (!registeredEvent) {
                this.logger(`Registered event not found for ${id}`);
                return;
            }
            try {
                // Handle event prevention
                if (config.preventDefault) {
                    event.preventDefault();
                }
                if (config.stopPropagation) {
                    event.stopPropagation();
                }
                // Call original handler
                if (config.debounce) {
                    this.handleDebouncedEvent(id, originalHandler, event, config.debounceDelay);
                }
                else {
                    originalHandler(event);
                }
            }
            catch (error) {
                // Handle errors
                registeredEvent.metrics.errorCount++;
                this.metrics.totalErrors++;
                this.logger(`Error in event handler ${id}: ${error}`);
                // Prevent further propagation on error
                event.preventDefault();
                event.stopPropagation();
            }
            finally {
                // Update metrics regardless of success/error
                const endTime = performance.now();
                const processingTime = endTime - startTime;
                registeredEvent.metrics.callCount++;
                registeredEvent.metrics.totalProcessingTime += processingTime;
                this.metrics.totalProcessed++;
                this.metrics.lastEventTimestamp = Date.now();
                this.updateAverageProcessingTime(processingTime);
            }
        };
    }
    /**
     * Handle debounced event execution
     * Centralizes debouncing logic found across multiple handlers
     */
    handleDebouncedEvent(id, handler, event, delay) {
        const debounceKey = `${id}-debounce`;
        // Clear existing timer
        const existingTimer = this.debounceTimers.get(debounceKey);
        if (existingTimer !== undefined) {
            clearTimeout(existingTimer);
        }
        // Set new timer
        const timer = setTimeout(() => {
            try {
                handler(event);
                this.metrics.totalDebounced++;
            }
            catch (error) {
                this.logger(`Error in debounced handler ${id}: ${error}`);
                this.metrics.totalErrors++;
            }
            finally {
                this.debounceTimers.delete(debounceKey);
            }
        }, delay);
        this.debounceTimers.set(debounceKey, timer);
    }
    /**
     * Update average processing time
     */
    updateAverageProcessingTime(newTime) {
        if (this.metrics.totalProcessed === 1) {
            this.metrics.averageProcessingTime = newTime;
        }
        else {
            // Running average calculation
            this.metrics.averageProcessingTime =
                (this.metrics.averageProcessingTime * (this.metrics.totalProcessed - 1) + newTime) /
                    this.metrics.totalProcessed;
        }
    }
    /**
     * Unregister specific event handler
     */
    unregisterEventHandler(id) {
        const registeredEvent = this.registeredEvents.get(id);
        if (registeredEvent) {
            // Clear any pending debounce timers
            this.clearDebounceTimer(id);
            // Unregister from EventHandlerRegistry
            this.eventRegistry.unregister(id);
            // Remove tracking
            this.registeredEvents.delete(id);
            this.logger(`Unregistered event handler: ${id}`);
        }
    }
    /**
     * Clear debounce timer for specific handler
     */
    clearDebounceTimer(id) {
        const debounceKey = `${id}-debounce`;
        if (this.debounceTimers.has(debounceKey)) {
            clearTimeout(this.debounceTimers.get(debounceKey));
            this.debounceTimers.delete(debounceKey);
        }
    }
    /**
     * Clear all debounce timers
     */
    clearAllDebounceTimers() {
        for (const [, timer] of this.debounceTimers) {
            clearTimeout(timer);
        }
        this.debounceTimers.clear();
    }
    /**
     * Get metrics for specific event handler
     */
    getEventHandlerMetrics(id) {
        const registeredEvent = this.registeredEvents.get(id);
        return registeredEvent ? { ...registeredEvent.metrics } : null;
    }
    /**
     * Get global event service metrics
     */
    getGlobalMetrics() {
        return { ...this.metrics };
    }
    /**
     * Get all registered event handlers (for debugging)
     */
    getRegisteredHandlers() {
        return Array.from(this.registeredEvents.keys());
    }
    /**
     * Check if event handler exists
     */
    hasEventHandler(id) {
        return this.registeredEvents.has(id);
    }
    /**
     * Get health status of event service
     */
    getHealthStatus() {
        const now = Date.now();
        const lastEventAge = now - this.metrics.lastEventTimestamp;
        const errorRate = this.metrics.totalProcessed > 0 ? this.metrics.totalErrors / this.metrics.totalProcessed : 0;
        return {
            isHealthy: errorRate < 0.1 && this.metrics.averageProcessingTime < 100, // < 10% error rate, < 100ms avg
            totalHandlers: this.registeredEvents.size,
            averageProcessingTime: this.metrics.averageProcessingTime,
            errorRate,
            lastEventAge,
        };
    }
    /**
     * Reset all metrics (useful for testing)
     */
    resetMetrics() {
        this.metrics = {
            totalRegistered: this.registeredEvents.size, // Keep current registration count
            totalProcessed: 0,
            totalDebounced: 0,
            totalErrors: 0,
            lastEventTimestamp: 0,
            averageProcessingTime: 0,
        };
        // Reset individual handler metrics
        for (const registeredEvent of this.registeredEvents.values()) {
            registeredEvent.metrics = {
                callCount: 0,
                errorCount: 0,
                totalProcessingTime: 0,
            };
        }
        this.logger('Event service metrics reset');
    }
    /**
     * Dispose of all event handlers and cleanup resources
     */
    dispose() {
        this.logger('Disposing InputEventService');
        // Clear all debounce timers
        this.clearAllDebounceTimers();
        // Dispose EventHandlerRegistry
        this.eventRegistry.dispose();
        // Clear tracking
        this.registeredEvents.clear();
        // Reset metrics
        this.metrics = {
            totalRegistered: 0,
            totalProcessed: 0,
            totalDebounced: 0,
            totalErrors: 0,
            lastEventTimestamp: 0,
            averageProcessingTime: 0,
        };
        this.logger('InputEventService disposed');
    }
}
exports.InputEventService = InputEventService;
//# sourceMappingURL=InputEventService.js.map