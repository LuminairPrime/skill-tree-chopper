'use strict';
/**
 * Input Handling Performance TDD Test Suite
 * Following t-wada's TDD methodology for performance testing
 * RED-GREEN-REFACTOR cycles with focus on performance requirements and optimization
 * Tests input handling architecture under various load conditions
 */
Object.defineProperty(exports, '__esModule', { value: true });
const chai_1 = require('chai');
const mocha_1 = require('mocha');
const sinon_1 = require('sinon');
const jsdom_1 = require('jsdom');
const BaseInputHandler_1 = require('../../../webview/managers/input/handlers/BaseInputHandler');
const InputEventService_1 = require('../../../webview/managers/input/services/InputEventService');
const InputStateManager_1 = require('../../../webview/managers/input/services/InputStateManager');
// Performance benchmark thresholds (configurable based on requirements)
const PERFORMANCE_THRESHOLDS = {
  // Event processing performance
  MAX_EVENT_PROCESSING_TIME: 10, // milliseconds per event
  MAX_BATCH_PROCESSING_TIME: 100, // milliseconds per batch of 100 events
  MAX_DEBOUNCE_PRECISION_VARIANCE: 5, // milliseconds variance in debounce timing
  // Memory performance
  MAX_MEMORY_GROWTH_PER_EVENT: 1024, // bytes per event (1KB)
  MAX_SUSTAINED_MEMORY_GROWTH: 10 * 1024 * 1024, // 10MB total growth
  // State management performance
  MAX_STATE_UPDATE_TIME: 5, // milliseconds per state update
  MAX_STATE_LISTENER_NOTIFICATION_TIME: 2, // milliseconds per listener notification
  // Throughput requirements
  MIN_EVENTS_PER_SECOND: 1000, // Minimum event processing rate
  MIN_STATE_UPDATES_PER_SECOND: 500, // Minimum state update rate
  // Resource cleanup performance
  MAX_DISPOSAL_TIME: 50, // milliseconds for complete disposal
  MAX_LISTENER_CLEANUP_TIME: 10, // milliseconds for listener cleanup
};
// Performance testing utility class
class PerformanceTestHarness {
  constructor() {
    this.memoryBaseline = 0;
    this.performanceMarks = new Map();
  }
  startMemoryTracking() {
    if (global.gc) {
      global.gc();
    }
    this.memoryBaseline = process.memoryUsage().heapUsed;
  }
  getMemoryGrowth() {
    if (global.gc) {
      global.gc();
    }
    return process.memoryUsage().heapUsed - this.memoryBaseline;
  }
  markStart(label) {
    this.performanceMarks.set(`${label}_start`, Date.now());
  }
  markEnd(label) {
    const startTime = this.performanceMarks.get(`${label}_start`);
    if (!startTime) {
      throw new Error(`No start mark found for ${label}`);
    }
    const duration = Date.now() - startTime;
    this.performanceMarks.set(`${label}_duration`, duration);
    return duration;
  }
  getDuration(label) {
    const duration = this.performanceMarks.get(`${label}_duration`);
    if (!duration) {
      throw new Error(`No duration found for ${label}`);
    }
    return duration;
  }
  createHighFrequencyEventSequence(count) {
    const events = [];
    for (let i = 0; i < count; i++) {
      const eventType = ['keydown', 'input', 'click', 'compositionstart'][i % 4];
      events.push(() => {
        switch (eventType) {
          case 'keydown':
            return new global.KeyboardEvent('keydown', {
              key: String.fromCharCode(65 + (i % 26)), // A-Z
              ctrlKey: i % 10 === 0,
              altKey: i % 15 === 0,
            });
          case 'input':
            return new global.Event('input');
          case 'click':
            return new global.MouseEvent('click', {
              clientX: i % 500,
              clientY: i % 300,
            });
          case 'compositionstart':
            return new global.CompositionEvent('compositionstart', {
              data: `comp${i}`,
            });
          default:
            return new global.Event('input');
        }
      });
    }
    return events;
  }
  measureEventProcessingRate(eventService, element, eventCount) {
    const events = this.createHighFrequencyEventSequence(eventCount);
    let processedCount = 0;
    const handler = () => {
      processedCount++;
    };
    eventService.registerEventHandler('perf-test', element, 'click', handler);
    this.markStart('event-processing');
    events.forEach((eventFactory) => {
      const event = eventFactory();
      if (event.type === 'click') {
        element.dispatchEvent(event);
      }
    });
    const duration = this.markEnd('event-processing');
    const eventsPerSecond = (processedCount / duration) * 1000;
    const avgProcessingTime = duration / processedCount;
    return { eventsPerSecond, avgProcessingTime };
  }
}
// Test implementation for performance testing
class PerformanceTestInputHandler extends BaseInputHandler_1.BaseInputHandler {
  constructor(eventDebounceTimers = new Map()) {
    super('PerformanceTestHandler', eventDebounceTimers);
    this.processedEvents = 0;
    this.processingTimes = [];
  }
  doInitialize() {
    // Setup performance monitoring
  }
  registerPerformanceHandler(element, eventType) {
    this.testRegisterEventHandler('perf-handler', element, eventType, (event) => {
      const startTime = performance.now();
      this.processEvent(event);
      const endTime = performance.now();
      this.processedEvents++;
      this.processingTimes.push(endTime - startTime);
    });
  }
  processEvent(event) {
    // Simulate processing work
    const data = {
      type: event.type,
      timestamp: Date.now(),
      target: event.target,
    };
    // Minimal processing to simulate real work
    JSON.stringify(data);
  }
  getProcessedEventCount() {
    return this.processedEvents;
  }
  getAverageProcessingTime() {
    if (this.processingTimes.length === 0) return 0;
    return this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
  }
  getMaxProcessingTime() {
    return Math.max(...this.processingTimes);
  }
  // Expose protected methods for testing
  testRegisterEventHandler(id, element, eventType, handler, options, enableDebounce = false) {
    this.registerEventHandler(id, element, eventType, handler, options, enableDebounce);
  }
}
(0, mocha_1.describe)('Input Handling Performance TDD Test Suite', () => {
  let jsdom;
  let clock;
  let testElement;
  let eventService;
  let stateManager;
  let performanceHandler;
  let perfHarness;
  (0, mocha_1.beforeEach)(() => {
    // Arrange: Setup high-performance test environment
    jsdom = new jsdom_1.JSDOM(
      `
      <!DOCTYPE html>
      <html>
        <body>
          <div id="performance-test-element" style="width: 1000px; height: 1000px;"></div>
        </body>
      </html>
    `,
      {
        url: 'http://localhost',
        pretendToBeVisual: true,
        resources: 'usable',
      }
    );
    // Setup global environment
    global.window = jsdom.window;
    global.document = jsdom.window.document;
    global.Event = jsdom.window.Event;
    global.KeyboardEvent = jsdom.window.KeyboardEvent;
    global.MouseEvent = jsdom.window.MouseEvent;
    global.CompositionEvent = jsdom.window.CompositionEvent;
    global.performance = jsdom.window.performance || {
      now: () => Date.now(),
    };
    testElement = document.getElementById('performance-test-element');
    // Setup fake timers for controlled testing
    clock = sinon_1.default.useFakeTimers();
    // Setup services
    eventService = new InputEventService_1.InputEventService(() => {}); // Silent logger for performance
    stateManager = new InputStateManager_1.InputStateManager(() => {});
    performanceHandler = new PerformanceTestInputHandler();
    performanceHandler.initialize();
    // Setup performance harness
    perfHarness = new PerformanceTestHarness();
  });
  (0, mocha_1.afterEach)(() => {
    // Cleanup
    clock.restore();
    performanceHandler.dispose();
    eventService.dispose();
    stateManager.dispose();
    jsdom.window.close();
  });
  (0, mocha_1.describe)('TDD Red Phase: Event Processing Performance', () => {
    (0, mocha_1.describe)('High-Frequency Event Processing', () => {
      (0, mocha_1.it)('should process events within performance thresholds', function () {
        this.timeout(10000); // Extended timeout for performance tests
        // Act: Register handler and measure processing performance
        performanceHandler.registerPerformanceHandler(testElement, 'click');
        perfHarness.markStart('high-frequency-processing');
        // Generate high-frequency events
        const eventCount = 1000;
        for (let i = 0; i < eventCount; i++) {
          const clickEvent = new jsdom.window.MouseEvent('click', {
            clientX: i % 500,
            clientY: i % 300,
            bubbles: true,
          });
          testElement.dispatchEvent(clickEvent);
        }
        const totalTime = perfHarness.markEnd('high-frequency-processing');
        // Assert: Performance should meet requirements
        (0, chai_1.expect)(performanceHandler.getProcessedEventCount()).to.equal(eventCount);
        const avgProcessingTime = performanceHandler.getAverageProcessingTime();
        const maxProcessingTime = performanceHandler.getMaxProcessingTime();
        const eventsPerSecond = (eventCount / totalTime) * 1000;
        (0, chai_1.expect)(avgProcessingTime).to.be.lessThan(
          PERFORMANCE_THRESHOLDS.MAX_EVENT_PROCESSING_TIME
        );
        (0, chai_1.expect)(maxProcessingTime).to.be.lessThan(
          PERFORMANCE_THRESHOLDS.MAX_EVENT_PROCESSING_TIME * 2
        );
        (0, chai_1.expect)(eventsPerSecond).to.be.greaterThan(
          PERFORMANCE_THRESHOLDS.MIN_EVENTS_PER_SECOND
        );
        console.log(`Performance metrics:
          - Events processed: ${eventCount}
          - Total time: ${totalTime}ms
          - Average processing time: ${avgProcessingTime.toFixed(3)}ms
          - Max processing time: ${maxProcessingTime.toFixed(3)}ms
          - Events per second: ${eventsPerSecond.toFixed(0)}
        `);
      });
      (0, mocha_1.it)('should maintain performance under sustained load', function () {
        this.timeout(15000);
        // Arrange: Setup sustained load test
        performanceHandler.registerPerformanceHandler(testElement, 'keydown');
        const batchSize = 100;
        const batchCount = 20;
        const processingTimes = [];
        // Act: Process multiple batches to test sustained performance
        for (let batch = 0; batch < batchCount; batch++) {
          perfHarness.markStart(`batch-${batch}`);
          for (let i = 0; i < batchSize; i++) {
            const keyEvent = new jsdom.window.KeyboardEvent('keydown', {
              key: String.fromCharCode(65 + (i % 26)),
              ctrlKey: i % 10 === 0,
            });
            testElement.dispatchEvent(keyEvent);
          }
          const batchTime = perfHarness.markEnd(`batch-${batch}`);
          processingTimes.push(batchTime);
          // Small delay between batches
          clock.tick(1);
        }
        // Assert: Performance should remain consistent across batches
        const totalEvents = batchSize * batchCount;
        (0, chai_1.expect)(performanceHandler.getProcessedEventCount()).to.equal(totalEvents);
        // Check batch processing times
        processingTimes.forEach((time, index) => {
          (0, chai_1.expect)(time).to.be.lessThan(
            PERFORMANCE_THRESHOLDS.MAX_BATCH_PROCESSING_TIME,
            `Batch ${index} processing time exceeded threshold`
          );
        });
        // Check for performance degradation across batches
        const firstBatchAvg = processingTimes.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
        const lastBatchAvg = processingTimes.slice(-5).reduce((a, b) => a + b, 0) / 5;
        const degradation = (lastBatchAvg - firstBatchAvg) / firstBatchAvg;
        (0, chai_1.expect)(degradation).to.be.lessThan(0.5, 'Performance degradation exceeded 50%');
      });
      (0, mocha_1.it)('should handle event bursts without significant delays', function () {
        this.timeout(5000);
        // Arrange: Setup burst testing
        eventService.registerEventHandler('burst-test', testElement, 'input', () => {}, {
          debounce: true,
          debounceDelay: 50,
        });
        // Act: Generate event bursts
        const burstSizes = [1, 10, 50, 100, 200, 500];
        const burstResults = [];
        burstSizes.forEach((burstSize) => {
          perfHarness.markStart(`burst-${burstSize}`);
          // Generate rapid burst
          for (let i = 0; i < burstSize; i++) {
            const inputEvent = new jsdom.window.Event('input');
            testElement.dispatchEvent(inputEvent);
          }
          const processingTime = perfHarness.markEnd(`burst-${burstSize}`);
          burstResults.push({ size: burstSize, processingTime });
          // Advance clock to trigger debounced events
          clock.tick(50);
        });
        // Assert: Burst processing should scale reasonably
        burstResults.forEach(({ size, processingTime }) => {
          const timePerEvent = processingTime / size;
          (0, chai_1.expect)(timePerEvent).to.be.lessThan(
            PERFORMANCE_THRESHOLDS.MAX_EVENT_PROCESSING_TIME
          );
        });
        // Assert: Processing time should scale sub-linearly with burst size
        const smallBurst = burstResults[1]; // 10 events
        const largeBurst = burstResults[burstResults.length - 1]; // 500 events
        (0, chai_1.expect)(smallBurst).to.exist;
        (0, chai_1.expect)(largeBurst).to.exist;
        const scalingFactor = largeBurst.processingTime / smallBurst.processingTime;
        const eventRatio = largeBurst.size / smallBurst.size;
        (0, chai_1.expect)(scalingFactor).to.be.lessThan(
          eventRatio * 0.5,
          'Processing time should scale sub-linearly with event count'
        );
      });
    });
    (0, mocha_1.describe)('Debouncing Performance', () => {
      (0, mocha_1.it)('should maintain precise debouncing timing under load', function () {
        this.timeout(5000);
        // Arrange: Setup debouncing precision test
        const debounceDelay = 100;
        const executionTimes = [];
        eventService.registerEventHandler(
          'debounce-precision',
          testElement,
          'input',
          () => {
            executionTimes.push(Date.now());
          },
          { debounce: true, debounceDelay }
        );
        // Act: Generate events with known timing
        const eventTimes = [];
        for (let i = 0; i < 10; i++) {
          const eventTime = i * 50; // Every 50ms
          clock.tick(eventTime - clock.now);
          const inputEvent = new jsdom.window.Event('input');
          testElement.dispatchEvent(inputEvent);
          eventTimes.push(clock.now);
        }
        // Complete all debounce delays
        clock.tick(debounceDelay + 10);
        // Assert: Debounce precision should be maintained
        (0, chai_1.expect)(executionTimes.length).to.equal(
          1,
          'Should debounce to single execution'
        );
        const expectedExecutionTime = Math.max(...eventTimes) + debounceDelay;
        const actualExecutionTime = executionTimes[0];
        (0, chai_1.expect)(actualExecutionTime).to.exist;
        const timingVariance = Math.abs(actualExecutionTime - expectedExecutionTime);
        (0, chai_1.expect)(timingVariance).to.be.lessThan(
          PERFORMANCE_THRESHOLDS.MAX_DEBOUNCE_PRECISION_VARIANCE
        );
      });
      (0, mocha_1.it)('should handle multiple concurrent debouncing efficiently', function () {
        this.timeout(5000);
        // Arrange: Register multiple debounced handlers
        const handlerCount = 50;
        const executionCounts = new Array(handlerCount).fill(0);
        for (let i = 0; i < handlerCount; i++) {
          eventService.registerEventHandler(
            `concurrent-debounce-${i}`,
            testElement,
            'input',
            () => {
              executionCounts[i]++;
            },
            { debounce: true, debounceDelay: 50 + (i % 10) } // Varied delays
          );
        }
        perfHarness.markStart('concurrent-debouncing');
        // Act: Trigger events for all handlers
        for (let round = 0; round < 5; round++) {
          for (let i = 0; i < 20; i++) {
            const inputEvent = new jsdom.window.Event('input');
            testElement.dispatchEvent(inputEvent);
          }
          clock.tick(10); // Small intervals between rounds
        }
        // Complete all debounce delays
        clock.tick(70); // Max debounce delay + buffer
        const concurrentTime = perfHarness.markEnd('concurrent-debouncing');
        // Assert: Concurrent debouncing should be efficient
        (0, chai_1.expect)(concurrentTime).to.be.lessThan(
          200,
          'Concurrent debouncing took too long'
        );
        // All handlers should have executed once due to debouncing
        executionCounts.forEach((count, index) => {
          (0, chai_1.expect)(count).to.equal(1, `Handler ${index} execution count incorrect`);
        });
        const metrics = eventService.getGlobalMetrics();
        (0, chai_1.expect)(metrics.totalDebounced).to.equal(handlerCount);
      });
    });
  });
  (0, mocha_1.describe)('TDD Red Phase: State Management Performance', () => {
    (0, mocha_1.describe)('State Update Performance', () => {
      (0, mocha_1.it)('should update state within performance thresholds', function () {
        this.timeout(5000);
        // Act: Measure state update performance
        perfHarness.markStart('state-updates');
        const updateCount = 1000;
        for (let i = 0; i < updateCount; i++) {
          stateManager.updateIMEState({
            data: `update-${i}`,
            timestamp: Date.now() + i,
          });
          stateManager.updateKeyboardState({
            lastKeyPressed: String.fromCharCode(65 + (i % 26)),
            lastKeyTimestamp: Date.now() + i,
          });
        }
        const totalUpdateTime = perfHarness.markEnd('state-updates');
        // Assert: State updates should be fast
        const avgUpdateTime = totalUpdateTime / (updateCount * 2); // 2 updates per iteration
        (0, chai_1.expect)(avgUpdateTime).to.be.lessThan(
          PERFORMANCE_THRESHOLDS.MAX_STATE_UPDATE_TIME
        );
        const updatesPerSecond = ((updateCount * 2) / totalUpdateTime) * 1000;
        (0, chai_1.expect)(updatesPerSecond).to.be.greaterThan(
          PERFORMANCE_THRESHOLDS.MIN_STATE_UPDATES_PER_SECOND
        );
        console.log(`State update performance:
          - Total updates: ${updateCount * 2}
          - Total time: ${totalUpdateTime}ms
          - Average update time: ${avgUpdateTime.toFixed(3)}ms
          - Updates per second: ${updatesPerSecond.toFixed(0)}
        `);
      });
      (0, mocha_1.it)('should handle state listener notifications efficiently', function () {
        this.timeout(5000);
        // Arrange: Register multiple state listeners
        const listenerCount = 100;
        let totalNotifications = 0;
        for (let i = 0; i < listenerCount; i++) {
          stateManager.addStateListener('ime', () => {
            totalNotifications++;
          });
        }
        perfHarness.markStart('listener-notifications');
        // Act: Trigger state updates that will notify all listeners
        const stateUpdateCount = 50;
        for (let i = 0; i < stateUpdateCount; i++) {
          stateManager.updateIMEState({
            data: `notification-test-${i}`,
            timestamp: Date.now() + i,
          });
        }
        const notificationTime = perfHarness.markEnd('listener-notifications');
        // Assert: Listener notifications should be efficient
        (0, chai_1.expect)(totalNotifications).to.equal(listenerCount * stateUpdateCount);
        const avgNotificationTime = notificationTime / totalNotifications;
        (0, chai_1.expect)(avgNotificationTime).to.be.lessThan(
          PERFORMANCE_THRESHOLDS.MAX_STATE_LISTENER_NOTIFICATION_TIME
        );
      });
      (0, mocha_1.it)('should maintain state history efficiently under load', function () {
        this.timeout(5000);
        // Arrange: Generate extensive state history
        perfHarness.startMemoryTracking();
        const historyGenerationCount = 500;
        for (let i = 0; i < historyGenerationCount; i++) {
          stateManager.updateIMEState({
            data: `history-${i}`,
            timestamp: Date.now() + i,
          });
          stateManager.updateKeyboardState({
            lastKeyPressed: `key-${i}`,
            lastKeyTimestamp: Date.now() + i,
          });
          // Periodically check memory growth
          if (i % 100 === 0) {
            const memoryGrowth = perfHarness.getMemoryGrowth();
            const expectedMaxGrowth = i * PERFORMANCE_THRESHOLDS.MAX_MEMORY_GROWTH_PER_EVENT;
            if (memoryGrowth > expectedMaxGrowth) {
              console.warn(`Memory growth warning at iteration ${i}: ${memoryGrowth} bytes`);
            }
          }
        }
        // Assert: Memory usage should be reasonable
        const finalMemoryGrowth = perfHarness.getMemoryGrowth();
        (0, chai_1.expect)(finalMemoryGrowth).to.be.lessThan(
          PERFORMANCE_THRESHOLDS.MAX_SUSTAINED_MEMORY_GROWTH
        );
        // Assert: History should be managed efficiently
        const history = stateManager.getStateHistory(200);
        (0, chai_1.expect)(history.length).to.be.lessThanOrEqual(
          100,
          'History size should be capped'
        );
        console.log(`Memory performance:
          - State updates: ${historyGenerationCount * 2}
          - Memory growth: ${(finalMemoryGrowth / 1024 / 1024).toFixed(2)}MB
          - History entries: ${history.length}
        `);
      });
    });
    (0, mocha_1.describe)('Critical State Detection Performance', () => {
      (0, mocha_1.it)('should detect critical state changes quickly', function () {
        this.timeout(3000);
        // Act: Measure critical state detection performance
        perfHarness.markStart('critical-state-detection');
        const detectionCount = 1000;
        for (let i = 0; i < detectionCount; i++) {
          // Toggle critical states rapidly
          stateManager.updateIMEState({ isActive: i % 2 === 0 });
          stateManager.updateKeyboardState({ isInChordMode: i % 3 === 0 });
          stateManager.updateAgentState({ isAwaitingResponse: i % 5 === 0 });
          // Check critical state (this is the performance-critical operation)
          const hasCriticalState = stateManager.hasCriticalStateActive();
          // Verify correctness while measuring performance
          const expectedCritical = i % 2 === 0 || i % 3 === 0 || i % 5 === 0;
          (0, chai_1.expect)(hasCriticalState).to.equal(expectedCritical);
        }
        const detectionTime = perfHarness.markEnd('critical-state-detection');
        // Assert: Critical state detection should be fast
        const avgDetectionTime = detectionTime / detectionCount;
        (0, chai_1.expect)(avgDetectionTime).to.be.lessThan(1); // Less than 1ms per detection
        console.log(`Critical state detection performance:
          - Detections: ${detectionCount}
          - Total time: ${detectionTime}ms
          - Average detection time: ${avgDetectionTime.toFixed(3)}ms
        `);
      });
    });
  });
  (0, mocha_1.describe)('TDD Red Phase: Memory Management Performance', () => {
    (0, mocha_1.describe)('Memory Leak Prevention', () => {
      (0, mocha_1.it)('should prevent memory leaks during extended operation', function () {
        this.timeout(10000);
        // Arrange: Setup memory tracking
        perfHarness.startMemoryTracking();
        const operationCycles = 50;
        const eventsPerCycle = 100;
        // Act: Simulate extended operation cycles
        for (let cycle = 0; cycle < operationCycles; cycle++) {
          // Create temporary handler for this cycle
          const cycleHandler = new PerformanceTestInputHandler();
          cycleHandler.initialize();
          cycleHandler.registerPerformanceHandler(testElement, 'click');
          // Generate events
          for (let i = 0; i < eventsPerCycle; i++) {
            const clickEvent = new jsdom.window.MouseEvent('click', {
              clientX: i,
              clientY: i,
            });
            testElement.dispatchEvent(clickEvent);
          }
          // Dispose handler to test cleanup
          cycleHandler.dispose();
          // Periodic memory check
          if (cycle % 10 === 0) {
            const memoryGrowth = perfHarness.getMemoryGrowth();
            console.log(`Memory at cycle ${cycle}: ${(memoryGrowth / 1024).toFixed(2)}KB`);
          }
        }
        // Final memory assessment
        const finalMemoryGrowth = perfHarness.getMemoryGrowth();
        // Assert: Memory growth should be reasonable
        (0, chai_1.expect)(finalMemoryGrowth).to.be.lessThan(
          PERFORMANCE_THRESHOLDS.MAX_SUSTAINED_MEMORY_GROWTH
        );
        const memoryPerEvent = finalMemoryGrowth / (operationCycles * eventsPerCycle);
        (0, chai_1.expect)(memoryPerEvent).to.be.lessThan(
          PERFORMANCE_THRESHOLDS.MAX_MEMORY_GROWTH_PER_EVENT
        );
        console.log(`Memory leak test results:
          - Total operations: ${operationCycles * eventsPerCycle}
          - Final memory growth: ${(finalMemoryGrowth / 1024 / 1024).toFixed(2)}MB
          - Memory per event: ${memoryPerEvent.toFixed(2)} bytes
        `);
      });
      (0, mocha_1.it)('should clean up resources efficiently on disposal', function () {
        this.timeout(5000);
        // Arrange: Create services with significant state
        const largeEventService = new InputEventService_1.InputEventService(() => {});
        const largeStateManager = new InputStateManager_1.InputStateManager(() => {});
        // Generate significant state
        for (let i = 0; i < 200; i++) {
          largeEventService.registerEventHandler(
            `cleanup-test-${i}`,
            testElement,
            'click',
            () => {}
          );
          largeStateManager.updateIMEState({
            data: `cleanup-data-${i}`,
            timestamp: Date.now() + i,
          });
        }
        // Act: Measure disposal performance
        perfHarness.markStart('resource-disposal');
        largeEventService.dispose();
        largeStateManager.dispose();
        const disposalTime = perfHarness.markEnd('resource-disposal');
        // Assert: Disposal should be fast
        (0, chai_1.expect)(disposalTime).to.be.lessThan(PERFORMANCE_THRESHOLDS.MAX_DISPOSAL_TIME);
        // Verify cleanup
        (0, chai_1.expect)(largeEventService.getRegisteredHandlers()).to.have.length(0);
        (0, chai_1.expect)(largeStateManager.getStateHistory()).to.have.length(0);
        console.log(`Disposal performance:
          - Resources cleaned up: 200 event handlers + state
          - Disposal time: ${disposalTime}ms
        `);
      });
    });
    (0, mocha_1.describe)('Resource Scaling Performance', () => {
      (0, mocha_1.it)('should handle increasing resource counts gracefully', function () {
        this.timeout(15000);
        // Act: Test performance scaling with increasing resource counts
        const resourceCounts = [10, 50, 100, 200, 500, 1000];
        const scalingResults = [];
        resourceCounts.forEach((count) => {
          const scalingEventService = new InputEventService_1.InputEventService(() => {});
          // Measure setup time
          perfHarness.markStart(`setup-${count}`);
          for (let i = 0; i < count; i++) {
            scalingEventService.registerEventHandler(
              `scaling-${i}`,
              testElement,
              'click',
              () => {},
              { debounce: i % 10 === 0 } // Some debounced
            );
          }
          const setupTime = perfHarness.markEnd(`setup-${count}`);
          // Measure processing time
          perfHarness.markStart(`processing-${count}`);
          for (let i = 0; i < 100; i++) {
            const clickEvent = new jsdom.window.MouseEvent('click', {
              clientX: i,
              clientY: i,
            });
            testElement.dispatchEvent(clickEvent);
          }
          const processingTime = perfHarness.markEnd(`processing-${count}`);
          scalingResults.push({ count, setupTime, processingTime });
          // Cleanup
          scalingEventService.dispose();
        });
        // Assert: Performance should scale reasonably
        scalingResults.forEach(({ count, setupTime, processingTime }) => {
          const setupTimePerResource = setupTime / count;
          (0, chai_1.expect)(setupTimePerResource).to.be.lessThan(
            2,
            `Setup scaling failed at ${count} resources`
          );
          // Processing time should not grow linearly with resource count
          (0, chai_1.expect)(processingTime).to.be.lessThan(
            count * 0.5,
            `Processing scaling failed at ${count} resources`
          );
        });
        // Check that scaling is sub-linear
        const smallScale = scalingResults[1]; // 50 resources
        const largeScale = scalingResults[scalingResults.length - 1]; // 1000 resources
        (0, chai_1.expect)(smallScale).to.exist;
        (0, chai_1.expect)(largeScale).to.exist;
        const setupScalingFactor = largeScale.setupTime / smallScale.setupTime;
        const resourceRatio = largeScale.count / smallScale.count;
        (0, chai_1.expect)(setupScalingFactor).to.be.lessThan(
          resourceRatio * 0.7,
          'Setup time should scale sub-linearly'
        );
        console.log('Scaling performance results:');
        scalingResults.forEach(({ count, setupTime, processingTime }) => {
          console.log(`  ${count} resources: setup=${setupTime}ms, processing=${processingTime}ms`);
        });
      });
    });
  });
  (0, mocha_1.describe)('TDD Red Phase: Real-World Performance Scenarios', () => {
    (0, mocha_1.describe)('Gaming and High-Interaction Scenarios', () => {
      (0, mocha_1.it)('should handle gaming-level input frequencies', function () {
        this.timeout(10000);
        // Simulate gaming scenario: 120 FPS with multiple inputs per frame
        const fps = 120;
        const inputsPerFrame = 3; // Mouse movement, clicks, keys
        const testDurationSeconds = 2;
        const totalInputs = fps * inputsPerFrame * testDurationSeconds;
        eventService.registerEventHandler('gaming-mouse', testElement, 'mousemove', () => {});
        eventService.registerEventHandler('gaming-click', testElement, 'click', () => {});
        eventService.registerEventHandler('gaming-keys', testElement, 'keydown', () => {});
        perfHarness.startMemoryTracking();
        perfHarness.markStart('gaming-simulation');
        // Act: Generate gaming-level input frequency
        for (let frame = 0; frame < fps * testDurationSeconds; frame++) {
          // Mouse movement (smooth)
          const mouseMoveEvent = new jsdom.window.MouseEvent('mousemove', {
            clientX: 400 + Math.sin(frame * 0.1) * 200,
            clientY: 300 + Math.cos(frame * 0.1) * 150,
          });
          testElement.dispatchEvent(mouseMoveEvent);
          // Occasional clicks
          if (frame % 30 === 0) {
            // ~4 clicks per second
            const clickEvent = new jsdom.window.MouseEvent('click', {
              clientX: 400,
              clientY: 300,
            });
            testElement.dispatchEvent(clickEvent);
          }
          // Key presses (WASD movement pattern)
          if (frame % 8 === 0) {
            // ~15 key presses per second
            const keys = ['w', 'a', 's', 'd'];
            const keyEvent = new jsdom.window.KeyboardEvent('keydown', {
              key: keys[frame % keys.length],
            });
            testElement.dispatchEvent(keyEvent);
          }
          // Small frame delay
          clock.tick(1000 / fps);
        }
        const gamingTime = perfHarness.markEnd('gaming-simulation');
        const memoryGrowth = perfHarness.getMemoryGrowth();
        // Assert: Should handle gaming frequencies smoothly
        const metrics = eventService.getGlobalMetrics();
        (0, chai_1.expect)(metrics.totalProcessed).to.be.greaterThan(totalInputs * 0.8); // Allow some tolerance
        const avgProcessingTime = metrics.averageProcessingTime;
        (0, chai_1.expect)(avgProcessingTime).to.be.lessThan(1); // Sub-millisecond processing
        // Memory should not grow excessively
        (0, chai_1.expect)(memoryGrowth).to.be.lessThan(50 * 1024 * 1024); // 50MB limit
        console.log(`Gaming scenario performance:
          - Total inputs: ${metrics.totalProcessed}
          - Duration: ${gamingTime}ms
          - Avg processing: ${avgProcessingTime.toFixed(3)}ms
          - Memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB
          - Inputs per second: ${((metrics.totalProcessed / gamingTime) * 1000).toFixed(0)}
        `);
      });
    });
    (0, mocha_1.describe)('Professional Development Scenarios', () => {
      (0, mocha_1.it)('should handle intensive coding session patterns', function () {
        this.timeout(8000);
        // Simulate intensive coding: lots of typing, frequent shortcuts, IME input
        eventService.registerEventHandler('coding-keys', testElement, 'keydown', () => {});
        eventService.registerEventHandler('coding-ime', testElement, 'compositionstart', () => {});
        let shortcutCount = 0;
        eventService.registerEventHandler('coding-shortcuts', testElement, 'keydown', (event) => {
          const keyEvent = event;
          if (keyEvent.ctrlKey || keyEvent.altKey) {
            shortcutCount++;
          }
        });
        perfHarness.markStart('coding-session');
        // Act: Simulate 5-minute intensive coding session (compressed)
        const codingPatterns = [
          // Rapid typing bursts
          () => {
            for (let i = 0; i < 50; i++) {
              const keyEvent = new jsdom.window.KeyboardEvent('keydown', {
                key: String.fromCharCode(97 + (i % 26)), // a-z
              });
              testElement.dispatchEvent(keyEvent);
            }
          },
          // Shortcut sequences
          () => {
            const shortcuts = [
              { key: 's', ctrlKey: true }, // Save
              { key: 'c', ctrlKey: true }, // Copy
              { key: 'v', ctrlKey: true }, // Paste
              { key: 'z', ctrlKey: true }, // Undo
            ];
            shortcuts.forEach((shortcut) => {
              const shortcutEvent = new jsdom.window.KeyboardEvent('keydown', shortcut);
              testElement.dispatchEvent(shortcutEvent);
            });
          },
          // IME input (Japanese comments)
          () => {
            const imeEvent = new jsdom.window.CompositionEvent('compositionstart', {
              data: 'konnichiwa',
            });
            testElement.dispatchEvent(imeEvent);
          },
        ];
        // Execute coding patterns repeatedly
        for (let session = 0; session < 20; session++) {
          codingPatterns.forEach((pattern) => pattern());
          clock.tick(100); // Small breaks between patterns
        }
        const codingTime = perfHarness.markEnd('coding-session');
        // Assert: Should handle coding patterns efficiently
        const metrics = eventService.getGlobalMetrics();
        (0, chai_1.expect)(metrics.totalProcessed).to.be.greaterThan(1000);
        (0, chai_1.expect)(shortcutCount).to.be.greaterThan(50);
        const avgProcessingTime = metrics.averageProcessingTime;
        (0, chai_1.expect)(avgProcessingTime).to.be.lessThan(5); // Should be very fast for coding
        console.log(`Coding session performance:
          - Total events: ${metrics.totalProcessed}
          - Shortcuts: ${shortcutCount}
          - Duration: ${codingTime}ms
          - Avg processing: ${avgProcessingTime.toFixed(3)}ms
        `);
      });
    });
  });
});
//# sourceMappingURL=InputHandling.test.js.map
