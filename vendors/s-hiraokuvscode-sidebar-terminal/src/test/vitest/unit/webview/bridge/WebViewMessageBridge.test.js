'use strict';
/**
 * WebViewMessageBridge Unit Tests
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const WebViewMessageBridge_1 = require('../../../../../webview/bridge/WebViewMessageBridge');
(0, vitest_1.describe)('WebViewMessageBridge', () => {
  let bridge;
  let mockVscodeApi;
  (0, vitest_1.beforeEach)(() => {
    mockVscodeApi = {
      postMessage: vitest_1.vi.fn(),
      getState: vitest_1.vi.fn(),
      setState: vitest_1.vi.fn(),
    };
    vitest_1.vi.stubGlobal('acquireVsCodeApi', () => mockVscodeApi);
    bridge = new WebViewMessageBridge_1.WebViewMessageBridge();
  });
  (0, vitest_1.afterEach)(() => {
    vitest_1.vi.unstubAllGlobals();
    vitest_1.vi.clearAllMocks();
  });
  (0, vitest_1.describe)('Message Sending', () => {
    (0, vitest_1.it)('should send message to extension', () => {
      const msg = { command: 'test' };
      // @ts-expect-error - test mock type
      bridge.sendMessage(msg);
      (0, vitest_1.expect)(mockVscodeApi.postMessage).toHaveBeenCalledWith(msg);
    });
  });
  (0, vitest_1.describe)('Handler Registration', () => {
    (0, vitest_1.it)('should register and unregister handlers', () => {
      const handler = vitest_1.vi.fn();
      bridge.registerHandler('cmd', handler);
      (0, vitest_1.expect)(bridge.getHandlerCount()).toBe(1);
      (0, vitest_1.expect)(bridge.getRegisteredCommands()).toContain('cmd');
      bridge.unregisterHandler('cmd');
      (0, vitest_1.expect)(bridge.getHandlerCount()).toBe(0);
    });
  });
  (0, vitest_1.describe)('Message Processing', () => {
    (0, vitest_1.it)('should process message with registered handler', async () => {
      const handler = vitest_1.vi.fn().mockResolvedValue({ success: true });
      bridge.registerHandler('cmd', handler);
      const msg = { command: 'cmd' };
      // @ts-expect-error - test mock type
      const result = await bridge.processMessage(msg);
      (0, vitest_1.expect)(result.success).toBe(true);
      (0, vitest_1.expect)(handler).toHaveBeenCalledWith(msg);
    });
    (0, vitest_1.it)('should return failure if no handler registered', async () => {
      // @ts-expect-error - test mock type
      const result = await bridge.processMessage({ command: 'unknown' });
      (0, vitest_1.expect)(result.success).toBe(false);
      (0, vitest_1.expect)(result.error).toContain('No handler registered');
    });
    (0, vitest_1.it)('should handle errors in handlers', async () => {
      const handler = vitest_1.vi.fn().mockRejectedValue(new Error('Fail'));
      bridge.registerHandler('fail', handler);
      // @ts-expect-error - test mock type
      const result = await bridge.processMessage({ command: 'fail' });
      (0, vitest_1.expect)(result.success).toBe(false);
      (0, vitest_1.expect)(result.error).toBe('Fail');
    });
  });
  (0, vitest_1.describe)('Lifecycle', () => {
    (0, vitest_1.it)('should set ready state on initialize', async () => {
      (0, vitest_1.expect)(bridge.isReady()).toBe(false);
      await bridge.initialize();
      (0, vitest_1.expect)(bridge.isReady()).toBe(true);
    });
    (0, vitest_1.it)('should reset on dispose', () => {
      bridge.registerHandler('t', vitest_1.vi.fn());
      bridge.dispose();
      (0, vitest_1.expect)(bridge.getHandlerCount()).toBe(0);
      (0, vitest_1.expect)(bridge.isReady()).toBe(false);
    });
    (0, vitest_1.it)('Bug #9: should remove window message listener on dispose', async () => {
      const removeEventListenerSpy = vitest_1.vi.spyOn(window, 'removeEventListener');
      await bridge.initialize();
      bridge.dispose();
      // Should have called removeEventListener for 'message'
      const messageRemoveCalls = removeEventListenerSpy.mock.calls.filter(
        (call) => call[0] === 'message'
      );
      (0, vitest_1.expect)(messageRemoveCalls.length).toBe(1);
    });
    (0, vitest_1.it)('Bug #9: should not process messages after dispose', async () => {
      const handler = vitest_1.vi.fn().mockResolvedValue({ success: true });
      await bridge.initialize();
      bridge.registerHandler('test-cmd', handler);
      bridge.dispose();
      // Simulate a message event after dispose
      const event = new MessageEvent('message', {
        data: { command: 'test-cmd' },
      });
      window.dispatchEvent(event);
      // Handler should not be called because listener was removed
      (0, vitest_1.expect)(handler).not.toHaveBeenCalled();
    });
  });
});
//# sourceMappingURL=WebViewMessageBridge.test.js.map
