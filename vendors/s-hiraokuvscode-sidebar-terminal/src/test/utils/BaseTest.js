"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTest = void 0;
const sinon = require("sinon");
const vscode_mocks_1 = require("../fixtures/vscode-mocks");
/**
 * Base test class providing common test infrastructure
 *
 * Features:
 * - Automatic sinon sandbox creation and cleanup
 * - VS Code mock setup and teardown
 * - Common assertion helpers
 * - Lifecycle hooks for setup and teardown
 *
 * Usage:
 * ```typescript
 * class MyTest extends BaseTest {
 *   protected setup(): void {
 *     // Custom setup logic
 *   }
 *
 *   protected teardown(): void {
 *     // Custom teardown logic
 *   }
 * }
 *
 * describe('My Feature', () => {
 *   const test = new MyTest();
 *
 *   beforeEach(() => test.beforeEach());
 *   afterEach(() => test.afterEach());
 *
 *   it('should work', () => {
 *     // Use test.sandbox, test.vscode
 *   });
 * });
 * ```
 */
class BaseTest {
    /**
     * Called before each test
     * Sets up sandbox and VS Code mocks
     */
    beforeEach() {
        this.sandbox = sinon.createSandbox();
        this.vscode = vscode_mocks_1.VSCodeMockFactory.setupGlobalMock(this.sandbox);
        this.logSpy = this.sandbox.stub(console, 'log');
        // Call custom setup hook
        this.setup();
    }
    /**
     * Called after each test
     * Restores all stubs and clears state
     */
    afterEach() {
        // Call custom teardown hook
        this.teardown();
        // Restore sandbox
        this.sandbox.restore();
    }
    /**
     * Custom setup logic - override in subclasses
     */
    setup() {
        // Override in subclasses
    }
    /**
     * Custom teardown logic - override in subclasses
     */
    teardown() {
        // Override in subclasses
    }
    /**
     * Configure VS Code configuration defaults
     */
    configureDefaults(defaults) {
        vscode_mocks_1.VSCodeMockFactory.configureDefaults(this.vscode.configuration, defaults);
    }
    /**
     * Stub a method on an object
     */
    stub(object, method) {
        return this.sandbox.stub(object, method);
    }
    /**
     * Create a spy on a method
     */
    spy(object, method) {
        return this.sandbox.spy(object, method);
    }
    /**
     * Create a fake object with partial implementation
     */
    fake(partial = {}) {
        return partial;
    }
    /**
     * Wait for a condition to be true
     */
    async waitFor(condition, timeout = 1000, interval = 10) {
        const startTime = Date.now();
        while (!condition()) {
            if (Date.now() - startTime > timeout) {
                throw new Error('Timeout waiting for condition');
            }
            await new Promise((resolve) => setTimeout(resolve, interval));
        }
    }
    /**
     * Wait for an async operation to complete
     */
    async waitForAsync(operation, timeout = 1000) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Async operation timeout'));
            }, timeout);
            operation()
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
     * Assert that a stub was called with specific arguments
     */
    assertCalledWith(stub, ...args) {
        if (!stub.calledWith(...args)) {
            throw new Error(`Expected stub to be called with ${JSON.stringify(args)}, ` +
                `but it was called with ${JSON.stringify(stub.args)}`);
        }
    }
    /**
     * Assert that a stub was called exactly N times
     */
    assertCallCount(stub, count) {
        if (stub.callCount !== count) {
            throw new Error(`Expected stub to be called ${count} times, ` + `but it was called ${stub.callCount} times`);
        }
    }
    /**
     * Reset a specific stub
     */
    resetStub(stub) {
        stub.resetHistory();
        stub.resetBehavior();
    }
    /**
     * Reset all stubs in sandbox
     */
    resetAllStubs() {
        this.sandbox.resetHistory();
        this.sandbox.resetBehavior();
    }
}
exports.BaseTest = BaseTest;
//# sourceMappingURL=BaseTest.js.map