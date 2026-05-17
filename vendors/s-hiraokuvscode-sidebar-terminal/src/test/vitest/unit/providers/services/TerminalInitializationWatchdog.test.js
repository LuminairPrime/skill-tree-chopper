'use strict';
/**
 * TerminalInitializationWatchdog Unit Tests
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const TerminalInitializationWatchdog_1 = require('../../../../../providers/services/TerminalInitializationWatchdog');
// Mock logger
vitest_1.vi.mock('../../../../../utils/logger', () => ({
  provider: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('TerminalInitializationWatchdog', () => {
  let watchdog;
  let mockCallback;
  const terminalId = 'term-123';
  (0, vitest_1.beforeEach)(() => {
    mockCallback = vitest_1.vi.fn();
    vitest_1.vi.useFakeTimers();
    watchdog = new TerminalInitializationWatchdog_1.TerminalInitializationWatchdog(mockCallback, {
      initialDelayMs: 100,
      maxAttempts: 3,
      backoffFactor: 2,
    });
  });
  (0, vitest_1.afterEach)(() => {
    watchdog.dispose();
    vitest_1.vi.useRealTimers();
  });
  (0, vitest_1.it)('should trigger callback after initial delay', () => {
    watchdog.start(terminalId, 'test');
    vitest_1.vi.advanceTimersByTime(100);
    (0, vitest_1.expect)(mockCallback).toHaveBeenCalledWith(terminalId, {
      attempt: 1,
      isFinalAttempt: false,
    });
  });
  (0, vitest_1.it)('should use backoff for subsequent attempts', () => {
    watchdog.start(terminalId, 'test');
    // 1st attempt at 100ms
    vitest_1.vi.advanceTimersByTime(100);
    (0, vitest_1.expect)(mockCallback).toHaveBeenCalledTimes(1);
    // 2nd attempt at +200ms (100 * 2)
    vitest_1.vi.advanceTimersByTime(200);
    (0, vitest_1.expect)(mockCallback).toHaveBeenCalledTimes(2);
    (0, vitest_1.expect)(mockCallback).toHaveBeenLastCalledWith(terminalId, {
      attempt: 2,
      isFinalAttempt: false,
    });
  });
  (0, vitest_1.it)('should stop after max attempts', () => {
    watchdog.start(terminalId, 'test');
    vitest_1.vi.advanceTimersByTime(100 + 200 + 400); // 1st, 2nd, 3rd (final)
    (0, vitest_1.expect)(mockCallback).toHaveBeenCalledTimes(3);
    (0, vitest_1.expect)(mockCallback).toHaveBeenLastCalledWith(terminalId, {
      attempt: 3,
      isFinalAttempt: true,
    });
    // Should not trigger again
    vitest_1.vi.advanceTimersByTime(1000);
    (0, vitest_1.expect)(mockCallback).toHaveBeenCalledTimes(3);
  });
  (0, vitest_1.it)('should not trigger callback if stopped', () => {
    watchdog.start(terminalId, 'test');
    vitest_1.vi.advanceTimersByTime(50);
    watchdog.stop(terminalId, 'done');
    vitest_1.vi.advanceTimersByTime(100);
    (0, vitest_1.expect)(mockCallback).not.toHaveBeenCalled();
  });
  (0, vitest_1.it)('should handle multiple terminals independently', () => {
    const term2 = 'term-456';
    watchdog.start(terminalId, 'test1');
    vitest_1.vi.advanceTimersByTime(50);
    watchdog.start(term2, 'test2');
    vitest_1.vi.advanceTimersByTime(50);
    (0, vitest_1.expect)(mockCallback).toHaveBeenCalledWith(terminalId, vitest_1.expect.anything());
    (0, vitest_1.expect)(mockCallback).not.toHaveBeenCalledWith(term2, vitest_1.expect.anything());
    vitest_1.vi.advanceTimersByTime(50);
    (0, vitest_1.expect)(mockCallback).toHaveBeenCalledWith(term2, vitest_1.expect.anything());
  });
  (0, vitest_1.it)('should clean up on dispose', () => {
    watchdog.start(terminalId, 'test');
    watchdog.dispose();
    vitest_1.vi.advanceTimersByTime(1000);
    (0, vitest_1.expect)(mockCallback).not.toHaveBeenCalled();
  });
});
//# sourceMappingURL=TerminalInitializationWatchdog.test.js.map
