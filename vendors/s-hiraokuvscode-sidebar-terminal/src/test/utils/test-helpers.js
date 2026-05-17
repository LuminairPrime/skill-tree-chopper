'use strict';
/**
 * Test Helper Utilities
 *
 * Common utilities and helpers for writing tests
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.createTypedStub = createTypedStub;
exports.createMock = createMock;
exports.createResolveStub = createResolveStub;
exports.createRejectStub = createRejectStub;
exports.waitFor = waitFor;
exports.delay = delay;
exports.captureStubCalls = captureStubCalls;
exports.resetAllStubs = resetAllStubs;
exports.createSpy = createSpy;
exports.assertStubCalledWith = assertStubCalledWith;
exports.assertStubCallCount = assertStubCallCount;
/**
 * Creates a typed stub for better IntelliSense support
 */
function createTypedStub(sandbox, object, method) {
  return sandbox.stub(object, method);
}
/**
 * Creates a partial mock object with type safety
 */
function createMock(partial = {}) {
  return partial;
}
/**
 * Creates a stub that resolves to a value
 */
function createResolveStub(sandbox, value) {
  return sandbox.stub().resolves(value);
}
/**
 * Creates a stub that rejects with an error
 */
function createRejectStub(sandbox, error) {
  return sandbox.stub().rejects(error);
}
/**
 * Waits for a condition to be true with timeout
 */
async function waitFor(condition, timeout = 1000, interval = 10) {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}
/**
 * Creates a delay promise
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Captures all calls to a stub and returns the arguments
 */
function captureStubCalls(stub) {
  return stub.getCalls().map((call) => call.args);
}
/**
 * Resets all stubs in an object
 */
function resetAllStubs(obj) {
  Object.values(obj).forEach((value) => {
    if (
      value &&
      typeof value === 'object' &&
      'reset' in value &&
      typeof value.reset === 'function'
    ) {
      value.reset();
    }
  });
}
/**
 * Creates a spy that tracks calls but doesn't replace the original function
 */
function createSpy(sandbox, fn) {
  return sandbox.spy(fn);
}
/**
 * Asserts that a stub was called with specific arguments
 */
function assertStubCalledWith(stub, ...args) {
  const calls = stub.getCalls();
  const found = calls.some((call) => args.every((arg, index) => call.args[index] === arg));
  if (!found) {
    throw new Error(
      `Expected stub to be called with ${JSON.stringify(args)}, but it was called with: ${calls.map((c) => JSON.stringify(c.args)).join(', ')}`
    );
  }
}
/**
 * Asserts that a stub was called a specific number of times
 */
function assertStubCallCount(stub, expectedCount) {
  const actualCount = stub.callCount;
  if (actualCount !== expectedCount) {
    throw new Error(
      `Expected stub to be called ${expectedCount} times, but was called ${actualCount} times`
    );
  }
}
//# sourceMappingURL=test-helpers.js.map
