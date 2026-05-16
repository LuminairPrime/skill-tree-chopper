"use strict";
/**
 * BaseInputHandler TDD Test Suite
 * Following t-wada's TDD methodology for comprehensive input handler testing
 * RED-GREEN-REFACTOR cycles with clear arrange-act-assert patterns
 *
 * Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const BaseInputHandler_1 = require("../../../../../../../webview/managers/input/handlers/BaseInputHandler");
// Test implementation of BaseInputHandler for testing abstract methods
class TestInputHandler extends BaseInputHandler_1.BaseInputHandler {
    constructor(handlerName = 'TestHandler', eventDebounceTimers = new Map(), config) {
        super(handlerName, eventDebounceTimers, config);
        this.initializeCalled = false;
    }
    doInitialize() {
        this.initializeCalled = true;
    }
    wasInitializeCalled() {
        return this.initializeCalled;
    }
    // Expose protected methods for testing
    testRegisterEventHandler(id, element, eventType, handler, options, enableDebounce = false) {
        this.registerEventHandler(id, element, eventType, handler, options, enableDebounce);
    }
    testUnregisterEventHandler(id) {
        this.unregisterEventHandler(id);
    }
    testIsHandlerHealthy() {
        return this.isHandlerHealthy();
    }
    testClearAllDebounceTimers() {
        this.clearAllDebounceTimers();
    }
    // Implement missing BaseManager methods
    getManagerName() {
        return this.managerName;
    }
    isInitialized() {
        return this.isReady;
    }
}
/**
 * SKIP REASON: These tests rely on timer/debounce behavior that doesn't work correctly
 * with Vitest fake timers + JSDOM event dispatch. The debounce implementation uses
 * real setTimeout calls that don't interact correctly with vi.useFakeTimers().
 * TODO: Investigate using real timers or mocking the debounce implementation directly.
 */
(0, vitest_1.describe)('BaseInputHandler TDD Test Suite', () => {
    let handler;
    let sharedDebounceTimers;
    let testElement;
    let consoleLogSpy;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.useFakeTimers();
        // Set up DOM elements in the existing environment
        document.body.innerHTML = '<div id="test-element"></div>';
        // Setup test elements
        testElement = document.getElementById('test-element');
        // Setup shared state
        sharedDebounceTimers = new Map();
        // Spy on console.log for testing log output
        consoleLogSpy = vitest_1.vi.spyOn(console, 'log').mockImplementation(() => { });
        // Create handler instance
        handler = new TestInputHandler('TestHandler', sharedDebounceTimers);
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.useRealTimers();
        consoleLogSpy.mockRestore();
        handler?.dispose();
        document.body.innerHTML = '';
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('TDD Red Phase: Initialization and Configuration', () => {
        (0, vitest_1.describe)('Handler Construction and Default Configuration', () => {
            (0, vitest_1.it)('should initialize with default configuration values', () => {
                // Arrange: Default configuration expectations
                const expectedDefaults = {
                    enableDebouncing: true,
                    debounceDelay: 50,
                    enableStateTracking: true,
                    enableEventPrevention: false,
                };
                // Act: Handler is created in beforeEach
                // Assert: Configuration should match defaults
                const config = handler.config;
                (0, vitest_1.expect)(config.enableDebouncing).toBe(expectedDefaults.enableDebouncing);
                (0, vitest_1.expect)(config.debounceDelay).toBe(expectedDefaults.debounceDelay);
                (0, vitest_1.expect)(config.enableStateTracking).toBe(expectedDefaults.enableStateTracking);
                (0, vitest_1.expect)(config.enableEventPrevention).toBe(expectedDefaults.enableEventPrevention);
            });
            (0, vitest_1.it)('should override default configuration with provided values', () => {
                // Arrange: Custom configuration
                const customConfig = {
                    enableDebouncing: false,
                    debounceDelay: 100,
                    enableStateTracking: false,
                    enableEventPrevention: true,
                };
                // Act: Create handler with custom config
                const customHandler = new TestInputHandler('CustomHandler', sharedDebounceTimers, customConfig);
                // Assert: Configuration should match custom values
                const config = customHandler.config;
                (0, vitest_1.expect)(config.enableDebouncing).toBe(false);
                (0, vitest_1.expect)(config.debounceDelay).toBe(100);
                (0, vitest_1.expect)(config.enableStateTracking).toBe(false);
                (0, vitest_1.expect)(config.enableEventPrevention).toBe(true);
                // Cleanup
                customHandler.dispose();
            });
            (0, vitest_1.it)('should initialize with empty metrics and state', () => {
                // Act: Handler is created in beforeEach
                // Assert: Initial metrics should be zero
                const metrics = handler.getHandlerMetrics();
                (0, vitest_1.expect)(metrics.eventsRegistered).toBe(0);
                (0, vitest_1.expect)(metrics.eventsProcessed).toBe(0);
                (0, vitest_1.expect)(metrics.eventsDebounced).toBe(0);
                (0, vitest_1.expect)(metrics.lastEventTimestamp).toBe(0);
                // Assert: Initial state should be empty
                const state = handler.getHandlerState();
                (0, vitest_1.expect)(Object.keys(state).length).toBe(0);
            });
            (0, vitest_1.it)('should share debounce timers reference with external map', () => {
                // Arrange: Add timer to shared map
                sharedDebounceTimers.set('external-timer', 12345);
                // Act: Access handler's timer map
                const handlerTimers = handler.eventDebounceTimers;
                // Assert: Should be same reference
                (0, vitest_1.expect)(handlerTimers).toBe(sharedDebounceTimers);
                (0, vitest_1.expect)(handlerTimers.get('external-timer')).toBe(12345);
            });
        });
        (0, vitest_1.describe)('BaseManager Integration', () => {
            (0, vitest_1.it)('should inherit logging capabilities from BaseManager', () => {
                // Act: Initialize handler (triggers logging)
                handler.initialize();
                // Assert: Should have logged initialization
                (0, vitest_1.expect)(consoleLogSpy).toHaveBeenCalled();
                (0, vitest_1.expect)(handler.wasInitializeCalled()).toBe(true);
            });
            (0, vitest_1.it)('should properly implement manager name functionality', () => {
                // Act: Get manager name
                const managerName = handler.getManagerName();
                // Assert: Should match constructor name
                (0, vitest_1.expect)(managerName).toBe('TestHandler');
            });
        });
    });
    (0, vitest_1.describe)('TDD Red Phase: Event Registration and Management', () => {
        (0, vitest_1.describe)('Basic Event Registration', () => {
            (0, vitest_1.it)('should register event handler and update metrics', () => {
                // Arrange: Event handler function
                let eventCalled = false;
                const testHandler = () => {
                    eventCalled = true;
                };
                // Act: Register event handler
                handler.testRegisterEventHandler('test-click', testElement, 'click', testHandler);
                // Assert: Metrics should be updated
                const metrics = handler.getHandlerMetrics();
                (0, vitest_1.expect)(metrics.eventsRegistered).toBe(1);
                // Assert: Event should be registered and functional
                testElement.dispatchEvent(new Event('click'));
                (0, vitest_1.expect)(eventCalled).toBe(true);
            });
            (0, vitest_1.it)('should prevent duplicate event registration', () => {
                // Arrange: Two identical registrations
                const handler1 = vitest_1.vi.fn();
                const handler2 = vitest_1.vi.fn();
                // Act: Register same handler ID twice
                handler.testRegisterEventHandler('duplicate-test', testElement, 'click', handler1);
                handler.testRegisterEventHandler('duplicate-test', testElement, 'click', handler2);
                // Assert: Only first registration should count
                const metrics = handler.getHandlerMetrics();
                (0, vitest_1.expect)(metrics.eventsRegistered).toBe(1);
                // Assert: Only first handler should be active
                testElement.dispatchEvent(new Event('click'));
                (0, vitest_1.expect)(handler1).toHaveBeenCalled();
                (0, vitest_1.expect)(handler2).not.toHaveBeenCalled();
            });
            (0, vitest_1.it)('should track registered handlers internally', () => {
                // Arrange: Multiple handlers
                const handlers = ['handler1', 'handler2', 'handler3'];
                // Act: Register multiple handlers
                handlers.forEach((id) => {
                    handler.testRegisterEventHandler(id, testElement, 'click', () => { });
                });
                // Assert: All handlers should be tracked
                const registeredHandlers = handler.registeredHandlers;
                (0, vitest_1.expect)(registeredHandlers.size).toBe(3);
                handlers.forEach((id) => {
                    (0, vitest_1.expect)(registeredHandlers.has(id)).toBe(true);
                });
            });
        });
        (0, vitest_1.describe)('Debouncing Functionality', () => {
            (0, vitest_1.it)('should create debounced handler when enableDebounce is true', () => {
                // Arrange: Debounced handler
                let callCount = 0;
                const debouncedHandler = () => {
                    callCount++;
                };
                // Act: Register with debouncing enabled
                handler.testRegisterEventHandler('debounced-test', testElement, 'input', debouncedHandler, undefined, true);
                // Act: Trigger multiple rapid events
                for (let i = 0; i < 5; i++) {
                    testElement.dispatchEvent(new Event('input'));
                }
                // Assert: Should not execute immediately
                (0, vitest_1.expect)(callCount).toBe(0);
                // Act: Advance time by debounce delay
                vitest_1.vi.advanceTimersByTime(50);
                // Assert: Should execute once after delay
                (0, vitest_1.expect)(callCount).toBe(1);
                const metrics = handler.getHandlerMetrics();
                (0, vitest_1.expect)(metrics.eventsDebounced).toBe(1);
            });
            (0, vitest_1.it)('should execute immediately when enableDebounce is false', () => {
                // Arrange: Non-debounced handler
                let callCount = 0;
                const immediateHandler = () => {
                    callCount++;
                };
                // Act: Register without debouncing
                handler.testRegisterEventHandler('immediate-test', testElement, 'input', immediateHandler, undefined, false);
                // Act: Trigger multiple events
                for (let i = 0; i < 3; i++) {
                    testElement.dispatchEvent(new Event('input'));
                }
                // Assert: Should execute immediately for each event
                (0, vitest_1.expect)(callCount).toBe(3);
                const metrics = handler.getHandlerMetrics();
                (0, vitest_1.expect)(metrics.eventsDebounced).toBe(0);
            });
            (0, vitest_1.it)('should clear previous debounce timer on new events', () => {
                // Arrange: Debounced handler
                let callCount = 0;
                const debouncedHandler = () => {
                    callCount++;
                };
                handler.testRegisterEventHandler('debounce-clear-test', testElement, 'input', debouncedHandler, undefined, true);
                // Act: Trigger event, wait partial time, trigger again
                testElement.dispatchEvent(new Event('input'));
                vitest_1.vi.advanceTimersByTime(25); // Half the debounce delay
                testElement.dispatchEvent(new Event('input'));
                vitest_1.vi.advanceTimersByTime(25); // Another half delay
                // Assert: Should not have executed yet
                (0, vitest_1.expect)(callCount).toBe(0);
                // Act: Complete the second debounce cycle
                vitest_1.vi.advanceTimersByTime(25);
                // Assert: Should execute only once
                (0, vitest_1.expect)(callCount).toBe(1);
            });
        });
        (0, vitest_1.describe)('State Tracking Functionality', () => {
            (0, vitest_1.it)('should track event processing when state tracking is enabled', () => {
                // Arrange: Handler with state tracking enabled
                const config = { enableStateTracking: true };
                const stateTrackingHandler = new TestInputHandler('StateTracker', sharedDebounceTimers, config);
                const testHandler = () => { };
                stateTrackingHandler.testRegisterEventHandler('state-test', testElement, 'click', testHandler);
                // Act: Trigger event
                testElement.dispatchEvent(new Event('click'));
                // Assert: State should be tracked
                const state = stateTrackingHandler.getHandlerState();
                const stateKey = 'StateTracker-state-test-lastEvent';
                (0, vitest_1.expect)(state).toHaveProperty(stateKey);
                const lastEvent = state[stateKey];
                (0, vitest_1.expect)(lastEvent.type).toBe('click');
                (0, vitest_1.expect)(lastEvent.target).toBeDefined(); // happy-dom target behavior
                (0, vitest_1.expect)(typeof lastEvent.timestamp).toBe('number');
                // Assert: Metrics should be updated
                const metrics = stateTrackingHandler.getHandlerMetrics();
                (0, vitest_1.expect)(metrics.eventsProcessed).toBe(1);
                (0, vitest_1.expect)(metrics.lastEventTimestamp).toBeGreaterThan(0);
                stateTrackingHandler.dispose();
            });
            (0, vitest_1.it)('should not track state when state tracking is disabled', () => {
                // Arrange: Handler with state tracking disabled
                const config = { enableStateTracking: false };
                const noStateHandler = new TestInputHandler('NoStateTracker', sharedDebounceTimers, config);
                const testHandler = () => { };
                noStateHandler.testRegisterEventHandler('no-state-test', testElement, 'click', testHandler);
                // Act: Trigger event
                testElement.dispatchEvent(new Event('click'));
                // Assert: State should not be tracked
                const state = noStateHandler.getHandlerState();
                (0, vitest_1.expect)(Object.keys(state).length).toBe(0);
                noStateHandler.dispose();
            });
        });
        (0, vitest_1.describe)('Error Handling and Recovery', () => {
            (0, vitest_1.it)('should handle errors in event handlers gracefully', () => {
                // Arrange: Handler that throws error
                const errorHandler = () => {
                    throw new Error('Test error');
                };
                // Act: Register error handler
                handler.testRegisterEventHandler('error-test', testElement, 'click', errorHandler);
                // Act: Trigger event (should not throw)
                (0, vitest_1.expect)(() => {
                    testElement.dispatchEvent(new Event('click'));
                }).not.toThrow();
                // Assert: Error should be logged
                (0, vitest_1.expect)(consoleLogSpy).toHaveBeenCalled();
                const logCalls = consoleLogSpy.mock.calls;
                const errorLogs = logCalls.some((call) => call.some((arg) => typeof arg === 'string' &&
                    arg.includes('Error in event handler TestHandler-error-test')));
                (0, vitest_1.expect)(errorLogs).toBe(true);
            });
            (0, vitest_1.it)('should track error state when state tracking is enabled', () => {
                // Arrange: Handler with state tracking and error prevention
                const config = {
                    enableStateTracking: true,
                    enableEventPrevention: true,
                };
                const errorTrackingHandler = new TestInputHandler('ErrorTracker', sharedDebounceTimers, config);
                const errorHandler = () => {
                    throw new Error('Tracked error');
                };
                errorTrackingHandler.testRegisterEventHandler('error-state-test', testElement, 'click', errorHandler);
                // Act: Trigger error
                testElement.dispatchEvent(new Event('click'));
                // Assert: Error state should be tracked
                const state = errorTrackingHandler.getHandlerState();
                const errorStateKey = 'ErrorTracker-error-state-test-lastError';
                (0, vitest_1.expect)(state).toHaveProperty(errorStateKey);
                const lastError = state[errorStateKey];
                (0, vitest_1.expect)(lastError.error).toBe('Tracked error');
                (0, vitest_1.expect)(typeof lastError.timestamp).toBe('number');
                (0, vitest_1.expect)(lastError.eventType).toBe('click');
                errorTrackingHandler.dispose();
            });
            (0, vitest_1.it)('should prevent event propagation on error when configured', () => {
                // Arrange: Handler with event prevention enabled
                const config = { enableEventPrevention: true };
                const preventionHandler = new TestInputHandler('PreventionHandler', sharedDebounceTimers, config);
                const errorHandler = () => {
                    throw new Error('Prevention test');
                };
                preventionHandler.testRegisterEventHandler('prevention-test', testElement, 'click', errorHandler);
                // Arrange: Event with propagation tracking
                let propagationStopped = false;
                let defaultPrevented = false;
                const event = new Event('click', { bubbles: true, cancelable: true });
                // Mock stopPropagation and preventDefault on the event instance
                const originalStopPropagation = event.stopPropagation.bind(event);
                const originalPreventDefault = event.preventDefault.bind(event);
                event.stopPropagation = () => {
                    propagationStopped = true;
                    originalStopPropagation();
                };
                event.preventDefault = () => {
                    defaultPrevented = true;
                    originalPreventDefault();
                };
                // Act: Trigger error event
                testElement.dispatchEvent(event);
                // Assert: Event propagation should be stopped
                (0, vitest_1.expect)(propagationStopped).toBe(true);
                (0, vitest_1.expect)(defaultPrevented).toBe(true);
                preventionHandler.dispose();
            });
        });
        (0, vitest_1.describe)('Event Unregistration', () => {
            (0, vitest_1.it)('should unregister event handler and remove tracking', () => {
                // Arrange: Register handler
                let eventCalled = false;
                const testHandler = () => {
                    eventCalled = true;
                };
                handler.testRegisterEventHandler('unregister-test', testElement, 'click', testHandler);
                (0, vitest_1.expect)(handler.getHandlerMetrics().eventsRegistered).toBe(1);
                // Act: Unregister handler
                handler.testUnregisterEventHandler('unregister-test');
                // Assert: Handler should be removed from tracking
                const registeredHandlers = handler.registeredHandlers;
                (0, vitest_1.expect)(registeredHandlers.has('unregister-test')).toBe(false);
                // Assert: Event should no longer trigger
                testElement.dispatchEvent(new Event('click'));
                (0, vitest_1.expect)(eventCalled).toBe(false);
            });
            (0, vitest_1.it)('should handle unregistering non-existent handler gracefully', () => {
                // Act: Attempt to unregister non-existent handler
                (0, vitest_1.expect)(() => {
                    handler.testUnregisterEventHandler('non-existent');
                }).not.toThrow();
                // Assert: No changes to metrics
                (0, vitest_1.expect)(handler.getHandlerMetrics().eventsRegistered).toBe(0);
            });
        });
    });
    (0, vitest_1.describe)('TDD Red Phase: Health Monitoring and Diagnostics', () => {
        (0, vitest_1.describe)('Handler Health Status', () => {
            (0, vitest_1.it)('should report healthy status for recently active handler', () => {
                // Arrange: Register and trigger handler
                const activeHandler = () => { };
                handler.testRegisterEventHandler('health-test', testElement, 'click', activeHandler);
                // Act: Trigger recent event
                testElement.dispatchEvent(new Event('click'));
                // Assert: Should be healthy
                (0, vitest_1.expect)(handler.testIsHandlerHealthy()).toBe(true);
            });
            (0, vitest_1.it)('should report healthy status for handler with no events', () => {
                // Act: Check health of unused handler
                const isHealthy = handler.testIsHandlerHealthy();
                // Assert: Should be healthy (no events expected)
                (0, vitest_1.expect)(isHealthy).toBe(true);
            });
            (0, vitest_1.it)('should report unhealthy status for stale handler', () => {
                // Arrange: Register and trigger handler
                const staleHandler = () => { };
                handler.testRegisterEventHandler('stale-test', testElement, 'click', staleHandler);
                // Act: Trigger event and advance time beyond threshold
                testElement.dispatchEvent(new Event('click'));
                vitest_1.vi.advanceTimersByTime(35000); // 35 seconds (beyond 30 second threshold)
                // Assert: Should be unhealthy
                (0, vitest_1.expect)(handler.testIsHandlerHealthy()).toBe(false);
            });
        });
        (0, vitest_1.describe)('Metrics Collection', () => {
            (0, vitest_1.it)('should accurately track event registration metrics', () => {
                // Act: Register multiple handlers
                for (let i = 0; i < 5; i++) {
                    handler.testRegisterEventHandler(`test-${i}`, testElement, 'click', () => { });
                }
                // Assert: Metrics should reflect registrations
                const metrics = handler.getHandlerMetrics();
                (0, vitest_1.expect)(metrics.eventsRegistered).toBe(5);
                (0, vitest_1.expect)(metrics.eventsProcessed).toBe(0);
                (0, vitest_1.expect)(metrics.eventsDebounced).toBe(0);
            });
            (0, vitest_1.it)('should track event processing metrics accurately', () => {
                // Arrange: Register handler
                let processCount = 0;
                const processingHandler = () => {
                    processCount++;
                };
                handler.testRegisterEventHandler('processing-test', testElement, 'click', processingHandler);
                // Act: Trigger multiple events
                for (let i = 0; i < 3; i++) {
                    testElement.dispatchEvent(new Event('click'));
                }
                // Assert: Processing metrics should be accurate
                const metrics = handler.getHandlerMetrics();
                (0, vitest_1.expect)(metrics.eventsProcessed).toBe(3);
                (0, vitest_1.expect)(processCount).toBe(3);
                (0, vitest_1.expect)(metrics.lastEventTimestamp).toBeGreaterThan(0);
            });
            (0, vitest_1.it)('should track debounce metrics separately from processing', () => {
                // Arrange: Register debounced handler
                let callCount = 0;
                const debouncedHandler = () => {
                    callCount++;
                };
                handler.testRegisterEventHandler('debounce-metrics', testElement, 'input', debouncedHandler, undefined, true);
                // Act: Trigger multiple rapid events
                for (let i = 0; i < 4; i++) {
                    testElement.dispatchEvent(new Event('input'));
                }
                // Act: Advance time to trigger debounced execution
                vitest_1.vi.advanceTimersByTime(50);
                // Assert: Debounce metrics should be tracked
                const metrics = handler.getHandlerMetrics();
                (0, vitest_1.expect)(metrics.eventsProcessed).toBe(4); // All events processed
                (0, vitest_1.expect)(metrics.eventsDebounced).toBe(1); // But only 1 debounced execution
                (0, vitest_1.expect)(callCount).toBe(1); // Actual handler called once
            });
        });
        (0, vitest_1.describe)('State Inspection', () => {
            (0, vitest_1.it)('should provide deep copy of handler state for debugging', () => {
                // Arrange: Handler with state tracking
                const config = { enableStateTracking: true };
                const stateHandler = new TestInputHandler('StateInspector', sharedDebounceTimers, config);
                const testHandler = () => { };
                stateHandler.testRegisterEventHandler('state-inspect', testElement, 'click', testHandler);
                // Act: Trigger event to create state
                testElement.dispatchEvent(new Event('click'));
                // Act: Get state and modify it
                const state = stateHandler.getHandlerState();
                const stateKey = 'StateInspector-state-inspect-lastEvent';
                const originalTimestamp = state[stateKey].timestamp;
                state[stateKey].timestamp = 999999;
                // Act: Get state again
                const freshState = stateHandler.getHandlerState();
                // Assert: Original state should be unchanged (deep copy)
                (0, vitest_1.expect)(freshState[stateKey].timestamp).toBe(originalTimestamp);
                stateHandler.dispose();
            });
            (0, vitest_1.it)('should return empty object when no state is tracked', () => {
                // Arrange: Handler with state tracking disabled
                const config = { enableStateTracking: false };
                const noStateHandler = new TestInputHandler('NoStateHandler', sharedDebounceTimers, config);
                // Act: Get state
                const state = noStateHandler.getHandlerState();
                // Assert: Should be empty
                (0, vitest_1.expect)(Object.keys(state).length).toBe(0);
                (0, vitest_1.expect)(state).toEqual({});
                noStateHandler.dispose();
            });
        });
    });
    (0, vitest_1.describe)('TDD Red Phase: Resource Management and Cleanup', () => {
        (0, vitest_1.describe)('Debounce Timer Management', () => {
            (0, vitest_1.it)('should clear specific handler debounce timers', () => {
                // Arrange: Multiple handlers with different names
                const handler1 = new TestInputHandler('Handler1', sharedDebounceTimers);
                const handler2 = new TestInputHandler('Handler2', sharedDebounceTimers);
                // Add timers for both handlers
                sharedDebounceTimers.set('Handler1-debounce-1', 111);
                sharedDebounceTimers.set('Handler1-debounce-2', 222);
                sharedDebounceTimers.set('Handler2-debounce-1', 333);
                sharedDebounceTimers.set('other-timer', 444);
                (0, vitest_1.expect)(sharedDebounceTimers.size).toBe(4);
                // Act: Clear handler1 timers
                handler1.testClearAllDebounceTimers();
                // Assert: Only Handler1 timers should be cleared
                (0, vitest_1.expect)(sharedDebounceTimers.size).toBe(2);
                (0, vitest_1.expect)(sharedDebounceTimers.has('Handler2-debounce-1')).toBe(true);
                (0, vitest_1.expect)(sharedDebounceTimers.has('other-timer')).toBe(true);
                handler1.dispose();
                handler2.dispose();
            });
            (0, vitest_1.it)('should clear active debounce timers on disposal', () => {
                // Arrange: Register debounced handlers
                const debouncedHandler = vitest_1.vi.fn();
                handler.testRegisterEventHandler('cleanup-test', testElement, 'input', debouncedHandler, undefined, true);
                // Act: Trigger events to create active timers
                for (let i = 0; i < 3; i++) {
                    testElement.dispatchEvent(new Event('input'));
                }
                // Verify timer exists
                (0, vitest_1.expect)(sharedDebounceTimers.size).toBeGreaterThan(0);
                // Act: Dispose handler
                handler.dispose();
                // Assert: Debounce timers should be cleared
                // (Remaining timers should be cleared by dispose)
                // Advance time to ensure debounced handlers don't execute
                vitest_1.vi.advanceTimersByTime(100);
                (0, vitest_1.expect)(debouncedHandler).not.toHaveBeenCalled();
            });
        });
        (0, vitest_1.describe)('Complete Resource Disposal', () => {
            (0, vitest_1.it)('should reset all internal state on disposal', () => {
                // Arrange: Populate handler with state
                const stateHandler = () => { };
                handler.testRegisterEventHandler('disposal-test', testElement, 'click', stateHandler);
                // Trigger some events to populate metrics and state
                testElement.dispatchEvent(new Event('click'));
                // Verify initial state
                (0, vitest_1.expect)(handler.getHandlerMetrics().eventsRegistered).toBeGreaterThan(0);
                (0, vitest_1.expect)(handler.getHandlerMetrics().eventsProcessed).toBeGreaterThan(0);
                // Act: Dispose handler
                handler.dispose();
                // Assert: All metrics should be reset
                const metrics = handler.getHandlerMetrics();
                (0, vitest_1.expect)(metrics.eventsRegistered).toBe(0);
                (0, vitest_1.expect)(metrics.eventsProcessed).toBe(0);
                (0, vitest_1.expect)(metrics.eventsDebounced).toBe(0);
                (0, vitest_1.expect)(metrics.lastEventTimestamp).toBe(0);
                // Assert: State should be cleared
                const state = handler.getHandlerState();
                (0, vitest_1.expect)(Object.keys(state).length).toBe(0);
            });
            (0, vitest_1.it)('should dispose EventHandlerRegistry and cleanup all listeners', () => {
                // Arrange: Register multiple event handlers
                const handlers = ['handler1', 'handler2', 'handler3'];
                handlers.forEach((id) => {
                    handler.testRegisterEventHandler(id, testElement, 'click', () => { });
                });
                // Verify handlers are registered
                let eventsCaught = 0;
                testElement.addEventListener('click', () => eventsCaught++);
                testElement.dispatchEvent(new Event('click'));
                (0, vitest_1.expect)(eventsCaught).toBeGreaterThan(0); // Baseline check
                // Act: Dispose handler
                handler.dispose();
                // Assert: EventHandlerRegistry should be disposed
                // New events should not trigger disposed handlers
                eventsCaught = 0;
                testElement.dispatchEvent(new Event('click'));
                // The original listener we added should still work, but handler's listeners should be gone
                (0, vitest_1.expect)(eventsCaught).toBe(1); // Only our test listener
            });
            (0, vitest_1.it)('should handle double disposal gracefully', () => {
                // Arrange: Register some handlers
                handler.testRegisterEventHandler('double-disposal', testElement, 'click', () => { });
                // Act: Dispose twice
                handler.dispose();
                (0, vitest_1.expect)(() => {
                    handler.dispose();
                }).not.toThrow();
                // Assert: Second disposal should be safe
                (0, vitest_1.expect)(handler.getHandlerMetrics().eventsRegistered).toBe(0);
            });
        });
        (0, vitest_1.describe)('Memory Leak Prevention', () => {
            (0, vitest_1.it)('should not retain references after disposal', () => {
                // Arrange: Create handler with references
                const config = { enableStateTracking: true };
                const memoryTestHandler = new TestInputHandler('MemoryTest', sharedDebounceTimers, config);
                memoryTestHandler.testRegisterEventHandler('memory-test', testElement, 'click', () => { });
                testElement.dispatchEvent(new Event('click'));
                // Verify initial state exists
                (0, vitest_1.expect)(Object.keys(memoryTestHandler.getHandlerState()).length).toBeGreaterThan(0);
                // Act: Dispose
                memoryTestHandler.dispose();
                // Assert: Internal maps should be cleared
                const registeredHandlers = memoryTestHandler.registeredHandlers;
                const handlerState = memoryTestHandler.handlerState;
                (0, vitest_1.expect)(registeredHandlers.size).toBe(0);
                (0, vitest_1.expect)(handlerState.size).toBe(0);
            });
            (0, vitest_1.it)('should clear validation rules on disposal', () => {
                // Arrange: Add some validation rules (if any exist in base class)
                // This tests the disposal completeness
                // Act: Dispose
                handler.dispose();
                // Assert: Should not throw when accessing after disposal
                (0, vitest_1.expect)(() => {
                    handler.getHandlerMetrics();
                    handler.getHandlerState();
                }).not.toThrow();
            });
        });
    });
    (0, vitest_1.describe)('TDD Red Phase: Edge Cases and Error Scenarios', () => {
        (0, vitest_1.describe)('Boundary Conditions', () => {
            (0, vitest_1.it)('should handle zero debounce delay', () => {
                // Arrange: Handler with zero debounce delay
                const config = { debounceDelay: 0 };
                const zeroDelayHandler = new TestInputHandler('ZeroDelay', sharedDebounceTimers, config);
                let callCount = 0;
                const testHandler = () => {
                    callCount++;
                };
                // Act: Register with debouncing enabled but zero delay
                zeroDelayHandler.testRegisterEventHandler('zero-delay', testElement, 'input', testHandler, undefined, true);
                // Trigger events
                testElement.dispatchEvent(new Event('input'));
                testElement.dispatchEvent(new Event('input'));
                // Act: Advance minimal time
                vitest_1.vi.advanceTimersByTime(1);
                // Assert: Should execute with minimal delay
                (0, vitest_1.expect)(callCount).toBe(1);
                zeroDelayHandler.dispose();
            });
            (0, vitest_1.it)('should handle extremely high debounce delay', () => {
                // Arrange: Handler with very high debounce delay
                const config = { debounceDelay: 10000 };
                const highDelayHandler = new TestInputHandler('HighDelay', sharedDebounceTimers, config);
                let callCount = 0;
                const testHandler = () => {
                    callCount++;
                };
                // Act: Register with high delay
                highDelayHandler.testRegisterEventHandler('high-delay', testElement, 'input', testHandler, undefined, true);
                testElement.dispatchEvent(new Event('input'));
                // Act: Advance time less than delay
                vitest_1.vi.advanceTimersByTime(5000);
                (0, vitest_1.expect)(callCount).toBe(0);
                // Act: Complete the delay
                vitest_1.vi.advanceTimersByTime(5000);
                (0, vitest_1.expect)(callCount).toBe(1);
                highDelayHandler.dispose();
            });
            (0, vitest_1.it)('should handle null event targets gracefully', () => {
                // Arrange: Mock event with null target
                const mockEvent = {
                    type: 'click',
                    target: null,
                    preventDefault: vitest_1.vi.fn(),
                    stopPropagation: vitest_1.vi.fn(),
                };
                let handlerCalled = false;
                const nullTargetHandler = () => {
                    handlerCalled = true;
                };
                // Act: Register handler (this should work)
                handler.testRegisterEventHandler('null-target', testElement, 'click', nullTargetHandler);
                // Simulate event dispatch with null target (manual trigger)
                const registeredHandlers = handler.registeredHandlers;
                const handlerEntry = registeredHandlers.get('null-target');
                // Act: Call handler directly with null target event
                (0, vitest_1.expect)(() => {
                    handlerEntry.handler(mockEvent);
                }).not.toThrow();
                // Assert: Handler should still execute
                (0, vitest_1.expect)(handlerCalled).toBe(true);
            });
        });
        (0, vitest_1.describe)('Concurrent Operations', () => {
            (0, vitest_1.it)('should handle rapid registration and unregistration', () => {
                // Arrange: Prepare multiple handlers
                const handlerIds = ['rapid1', 'rapid2', 'rapid3', 'rapid4', 'rapid5'];
                // Act: Rapidly register and unregister
                handlerIds.forEach((id) => {
                    handler.testRegisterEventHandler(id, testElement, 'click', () => { });
                    handler.testUnregisterEventHandler(id);
                });
                // Assert: Should not cause issues
                (0, vitest_1.expect)(handler.getHandlerMetrics().eventsRegistered).toBe(5);
                const registeredHandlers = handler.registeredHandlers;
                (0, vitest_1.expect)(registeredHandlers.size).toBe(0);
            });
            (0, vitest_1.it)('should handle events during disposal process', () => {
                // Arrange: Register handler
                let eventDuringDisposal = false;
                const testHandler = () => {
                    eventDuringDisposal = true;
                };
                handler.testRegisterEventHandler('disposal-event', testElement, 'click', testHandler);
                // Act: Start disposal and trigger event (simulating race condition)
                // This tests the robustness of the disposal process
                handler.dispose();
                // Event after disposal should not cause errors
                (0, vitest_1.expect)(() => {
                    testElement.dispatchEvent(new Event('click'));
                }).not.toThrow();
                // Handler should not execute after disposal
                (0, vitest_1.expect)(eventDuringDisposal).toBe(false);
            });
        });
        (0, vitest_1.describe)('Configuration Edge Cases', () => {
            (0, vitest_1.it)('should handle invalid configuration values gracefully', () => {
                // Arrange: Invalid configuration (negative values)
                const invalidConfig = {
                    debounceDelay: -100,
                    enableDebouncing: null,
                    enableStateTracking: undefined,
                };
                // Act: Create handler with invalid config (should not throw)
                (0, vitest_1.expect)(() => {
                    const invalidHandler = new TestInputHandler('InvalidConfig', sharedDebounceTimers, invalidConfig);
                    invalidHandler.dispose();
                }).not.toThrow();
            });
            (0, vitest_1.it)('should handle partial configuration objects', () => {
                // Arrange: Minimal config
                const partialConfig = { enableDebouncing: false };
                // Act: Create handler with partial config
                const partialHandler = new TestInputHandler('PartialConfig', sharedDebounceTimers, partialConfig);
                // Assert: Should fill in defaults for missing values
                const config = partialHandler.config;
                (0, vitest_1.expect)(config.enableDebouncing).toBe(false);
                (0, vitest_1.expect)(typeof config.debounceDelay).toBe('number');
                (0, vitest_1.expect)(typeof config.enableStateTracking).toBe('boolean');
                partialHandler.dispose();
            });
        });
    });
    (0, vitest_1.describe)('TDD Red Phase: Integration with BaseManager', () => {
        (0, vitest_1.describe)('Lifecycle Management', () => {
            (0, vitest_1.it)('should properly integrate with BaseManager lifecycle', async () => {
                // Act: Initialize handler
                await handler.initialize();
                // Assert: Should have called derived implementation
                (0, vitest_1.expect)(handler.wasInitializeCalled()).toBe(true);
                // Assert: Should be in initialized state
                (0, vitest_1.expect)(handler.isInitialized()).toBe(true);
            });
            (0, vitest_1.it)('should handle initialization errors gracefully', async () => {
                // Arrange: Handler that throws during initialization
                class ErrorInitHandler extends BaseInputHandler_1.BaseInputHandler {
                    doInitialize() {
                        throw new Error('Initialization failed');
                    }
                }
                const errorHandler = new ErrorInitHandler('ErrorInit', sharedDebounceTimers);
                // Act & Assert: Should handle initialization error (initialize is async)
                await (0, vitest_1.expect)(errorHandler.initialize()).rejects.toThrow('Initialization failed');
                errorHandler.dispose();
            });
        });
        (0, vitest_1.describe)('Manager Name and Identity', () => {
            (0, vitest_1.it)('should maintain consistent manager identity', () => {
                // Assert: Manager name should be consistent
                (0, vitest_1.expect)(handler.getManagerName()).toBe('TestHandler');
                // Act: After operations, name should remain the same
                handler.testRegisterEventHandler('identity-test', testElement, 'click', () => { });
                (0, vitest_1.expect)(handler.getManagerName()).toBe('TestHandler');
                // After disposal, name should still be accessible
                handler.dispose();
                (0, vitest_1.expect)(handler.getManagerName()).toBe('TestHandler');
            });
        });
    });
});
//# sourceMappingURL=BaseInputHandler.test.js.map