'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.AsyncTest = void 0;
const BaseTest_1 = require('./BaseTest');
const sinon = require('sinon');
/**
 * Specialized base class for async operation testing
 *
 * Features:
 * - Fake timers for time-based testing
 * - Promise tracking and resolution helpers
 * - Async operation race condition testing
 * - Timeout and retry helpers
 *
 * Usage:
 * ```typescript
 * class MyAsyncTest extends AsyncTest {
 *   protected useFakeTimers = true; // Enable fake timers
 * }
 * ```
 */
class AsyncTest extends BaseTest_1.BaseTest {
  constructor() {
    super(...arguments);
    this.useFakeTimers = false;
    this.pendingPromises = new Set();
  }
  setup() {
    super.setup();
    if (this.useFakeTimers) {
      this.clock = sinon.useFakeTimers();
    }
  }
  teardown() {
    if (this.clock) {
      this.clock.restore();
    }
    this.pendingPromises.clear();
    super.teardown();
  }
  /**
   * Advance fake timers by specified milliseconds
   */
  async tick(ms) {
    if (!this.clock) {
      throw new Error('Fake timers not enabled. Set useFakeTimers = true');
    }
    await this.clock.tickAsync(ms);
  }
  /**
   * Advance fake timers to next scheduled timer
   */
  async tickNext() {
    if (!this.clock) {
      throw new Error('Fake timers not enabled. Set useFakeTimers = true');
    }
    await this.clock.nextAsync();
  }
  /**
   * Run all pending timers
   */
  async tickAll() {
    if (!this.clock) {
      throw new Error('Fake timers not enabled. Set useFakeTimers = true');
    }
    await this.clock.runAllAsync();
  }
  /**
   * Track a promise for later resolution checking
   */
  track(promise) {
    this.pendingPromises.add(promise);
    promise
      .then(() => {
        this.pendingPromises.delete(promise);
      })
      .catch(() => {
        this.pendingPromises.delete(promise);
      });
    return promise;
  }
  /**
   * Check if any tracked promises are still pending
   */
  hasPendingPromises() {
    return this.pendingPromises.size > 0;
  }
  /**
   * Wait for all tracked promises to resolve
   */
  async waitForAllPromises(timeout = 1000) {
    const startTime = Date.now();
    while (this.pendingPromises.size > 0) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Timeout waiting for ${this.pendingPromises.size} pending promises`);
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
  /**
   * Create a deferred promise with manual resolution/rejection
   */
  createDeferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }
  /**
   * Wait for a promise to be rejected
   */
  async expectRejection(promise, expectedError) {
    try {
      await promise;
      throw new Error('Expected promise to be rejected, but it resolved');
    } catch (error) {
      if (expectedError) {
        const message = error.message;
        if (typeof expectedError === 'string') {
          if (!message.includes(expectedError)) {
            throw new Error(
              `Expected error message to include "${expectedError}", ` + `but got "${message}"`
            );
          }
        } else {
          if (!expectedError.test(message)) {
            throw new Error(
              `Expected error message to match ${expectedError}, ` + `but got "${message}"`
            );
          }
        }
      }
      return error;
    }
  }
  /**
   * Wait for a promise to resolve within timeout
   */
  async expectResolution(promise, timeout = 1000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Promise did not resolve within ${timeout}ms`));
      }, timeout);
      promise
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }
  /**
   * Test race condition by running operations concurrently
   */
  async testRaceCondition(operations) {
    const promises = operations.map((op) => op());
    return Promise.all(promises);
  }
  /**
   * Simulate network delay
   */
  async delay(ms) {
    if (this.clock) {
      await this.tick(ms);
    } else {
      await new Promise((resolve) => setTimeout(resolve, ms));
    }
  }
  /**
   * Stub async method with controlled resolution
   */
  stubAsync(object, method, resolveWith, rejectWith) {
    const stub = this.stub(object, method);
    if (rejectWith) {
      stub.rejects(rejectWith);
    } else {
      stub.resolves(resolveWith);
    }
    return stub;
  }
  /**
   * Create a stub that resolves after a delay
   */
  stubAsyncWithDelay(object, method, delay, resolveWith) {
    const stub = this.stub(object, method);
    stub.callsFake(async () => {
      await this.delay(delay);
      return resolveWith;
    });
    return stub;
  }
  /**
   * Test retry logic
   */
  async testRetry(operation, maxRetries, expectedFailures) {
    const errors = [];
    let attempts = 0;
    let result;
    for (let i = 0; i <= maxRetries; i++) {
      attempts++;
      try {
        result = await operation();
        break;
      } catch (error) {
        errors.push(error);
        if (i === maxRetries) {
          throw error;
        }
      }
    }
    if (errors.length !== expectedFailures) {
      throw new Error(`Expected ${expectedFailures} failures, but got ${errors.length}`);
    }
    return { result, attempts, errors };
  }
  /**
   * Wait for a specific number of calls to a stub
   */
  async waitForCalls(stub, count, timeout = 1000) {
    const startTime = Date.now();
    while (stub.callCount < count) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Timeout waiting for ${count} calls. Got ${stub.callCount} calls`);
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
}
exports.AsyncTest = AsyncTest;
//# sourceMappingURL=AsyncTest.js.map
