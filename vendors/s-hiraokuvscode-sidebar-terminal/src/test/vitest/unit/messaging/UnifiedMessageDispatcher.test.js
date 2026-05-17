'use strict';
/**
 * UnifiedMessageDispatcher Unit Tests
 *
 * Tests for Bug #14: window.removeEventListener missing in dispose()
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const UnifiedMessageDispatcher_1 = require('../../../../messaging/UnifiedMessageDispatcher');
// Mock ManagerLogger
vitest_1.vi.mock('../../../../webview/utils/ManagerLogger', () => ({
  messageLogger: {
    info: vitest_1.vi.fn(),
    warn: vitest_1.vi.fn(),
    error: vitest_1.vi.fn(),
    debug: vitest_1.vi.fn(),
  },
}));
// Mock MessageQueue
vitest_1.vi.mock('../../../../webview/utils/MessageQueue', () => ({
  MessageQueue: vitest_1.vi.fn().mockImplementation(function () {
    this.enqueue = vitest_1.vi.fn();
    this.dispose = vitest_1.vi.fn();
    this.clear = vitest_1.vi.fn();
    this.flush = vitest_1.vi.fn();
    this.getQueueStats = vitest_1.vi.fn().mockReturnValue({
      normal: 0,
      highPriority: 0,
      isProcessing: false,
    });
  }),
}));
(0, vitest_1.describe)('UnifiedMessageDispatcher', () => {
  let dispatcher;
  let addEventListenerSpy;
  let removeEventListenerSpy;
  (0, vitest_1.beforeEach)(() => {
    addEventListenerSpy = vitest_1.vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vitest_1.vi.spyOn(window, 'removeEventListener');
    dispatcher = new UnifiedMessageDispatcher_1.UnifiedMessageDispatcher();
  });
  (0, vitest_1.afterEach)(() => {
    dispatcher.dispose();
    vitest_1.vi.restoreAllMocks();
  });
  (0, vitest_1.describe)('dispose - event listener cleanup', () => {
    (0, vitest_1.it)('should remove the message event listener on dispose', async () => {
      // Initialize to register the event listener
      await dispatcher.initialize();
      // Verify addEventListener was called with 'message'
      (0, vitest_1.expect)(addEventListenerSpy).toHaveBeenCalledWith(
        'message',
        vitest_1.expect.any(Function)
      );
      // Get the handler that was registered
      const registeredHandler = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];
      // Dispose should remove the event listener
      dispatcher.dispose();
      (0, vitest_1.expect)(removeEventListenerSpy).toHaveBeenCalledWith(
        'message',
        registeredHandler
      );
    });
    (0, vitest_1.it)('should not process messages after dispose', async () => {
      const mockCoordinator = {
        postMessageToExtension: vitest_1.vi.fn(),
        getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('term-1'),
      };
      await dispatcher.initialize(mockCoordinator);
      dispatcher.dispose();
      // Processing messages after dispose should return failure
      const result = await dispatcher.processMessage({ command: 'test' });
      (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('should handle dispose when initialize was not called', () => {
      // dispose without initialize should not throw
      (0, vitest_1.expect)(() => dispatcher.dispose()).not.toThrow();
      // removeEventListener should not be called since no listener was registered
      const messageRemoveCalls = removeEventListenerSpy.mock.calls.filter(
        (call) => call[0] === 'message'
      );
      (0, vitest_1.expect)(messageRemoveCalls.length).toBe(0);
    });
    (0, vitest_1.it)('should not call removeEventListener twice on double dispose', async () => {
      await dispatcher.initialize();
      dispatcher.dispose();
      const removeCallCount = removeEventListenerSpy.mock.calls.filter(
        (call) => call[0] === 'message'
      ).length;
      // Second dispose should not add more removeEventListener calls
      dispatcher.dispose();
      const newRemoveCallCount = removeEventListenerSpy.mock.calls.filter(
        (call) => call[0] === 'message'
      ).length;
      (0, vitest_1.expect)(newRemoveCallCount).toBe(removeCallCount);
    });
  });
});
//# sourceMappingURL=UnifiedMessageDispatcher.test.js.map
