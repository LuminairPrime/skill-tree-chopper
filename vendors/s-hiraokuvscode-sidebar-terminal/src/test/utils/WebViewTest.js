"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebViewTest = void 0;
const BaseTest_1 = require("./BaseTest");
/**
 * Specialized base class for WebView-related tests
 *
 * Features:
 * - Mock WebView creation and messaging
 * - Message queue simulation
 * - WebView state management
 * - HTML content generation helpers
 *
 * Usage:
 * ```typescript
 * class MyWebViewTest extends WebViewTest {
 *   protected override setup(): void {
 *     super.setup();
 *     // Custom WebView setup
 *   }
 * }
 * ```
 */
class WebViewTest extends BaseTest_1.BaseTest {
    constructor() {
        super(...arguments);
        this.messageQueue = [];
    }
    setup() {
        super.setup();
        // Create mock webview
        this.mockWebview = this.createMockWebview();
    }
    teardown() {
        this.messageQueue = [];
        super.teardown();
    }
    /**
     * Create a mock webview with common methods
     */
    createMockWebview() {
        const postMessage = this.sandbox.stub().callsFake((message) => {
            this.messageQueue.push(message);
            return Promise.resolve();
        });
        return {
            postMessage,
            onDidReceiveMessage: this.sandbox.stub(),
            asWebviewUri: this.sandbox.stub().callsFake((uri) => uri),
            cspSource: 'mock-csp-source',
            html: '',
        };
    }
    /**
     * Simulate receiving a message from webview
     */
    simulateWebviewMessage(message) {
        const handler = this.mockWebview.onDidReceiveMessage.getCall(0)?.args[0];
        if (handler) {
            handler(message);
        }
    }
    /**
     * Get messages posted to webview
     */
    getPostedMessages() {
        return this.messageQueue;
    }
    /**
     * Get last posted message
     */
    getLastPostedMessage() {
        return this.messageQueue[this.messageQueue.length - 1];
    }
    /**
     * Clear message queue
     */
    clearMessageQueue() {
        this.messageQueue = [];
        this.mockWebview.postMessage.resetHistory();
    }
    /**
     * Assert message was posted
     */
    assertMessagePosted(command, additionalChecks) {
        const found = this.messageQueue.find((msg) => {
            if (msg.command !== command)
                return false;
            if (additionalChecks)
                return additionalChecks(msg);
            return true;
        });
        if (!found) {
            throw new Error(`Expected message with command "${command}" to be posted, ` +
                `but found: ${JSON.stringify(this.messageQueue.map((m) => m.command))}`);
        }
    }
    /**
     * Wait for message to be posted
     */
    async waitForMessage(command, timeout = 1000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const message = this.messageQueue.find((m) => m.command === command);
            if (message)
                return message;
            await new Promise((resolve) => setTimeout(resolve, 10));
        }
        throw new Error(`Timeout waiting for message with command "${command}". ` +
            `Found: ${JSON.stringify(this.messageQueue.map((m) => m.command))}`);
    }
    /**
     * Create mock HTML content
     */
    createMockHtml(bodyContent = '') {
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Test WebView</title>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
    }
    /**
     * Mock WebView ready state
     */
    setWebViewReady(ready = true) {
        if (ready) {
            this.simulateWebviewMessage({ command: 'webviewReady' });
        }
    }
}
exports.WebViewTest = WebViewTest;
//# sourceMappingURL=WebViewTest.js.map