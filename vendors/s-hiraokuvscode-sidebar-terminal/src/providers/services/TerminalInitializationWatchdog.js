'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.TerminalInitializationWatchdog = void 0;
const logger_1 = require('../../utils/logger');
const DEFAULT_OPTIONS = {
  initialDelayMs: 700,
  maxAttempts: 4,
  backoffFactor: 2,
};
const MAX_DELAY_MS = 6000;
/**
 * Reusable watchdog that fires callbacks when initialization ACKs are missing.
 * Each terminal has its own timer with exponential backoff and bounded attempts.
 */
class TerminalInitializationWatchdog {
  constructor(callback, defaultOptions = DEFAULT_OPTIONS) {
    this.callback = callback;
    this.defaultOptions = defaultOptions;
    this.watchers = new Map();
  }
  start(terminalId, reason, overrideOptions) {
    this.stop(terminalId, `restart:${reason}`);
    const mergedOptions = {
      ...this.defaultOptions,
      ...overrideOptions,
    };
    const entry = {
      attempt: 0,
      delay: mergedOptions.initialDelayMs,
      options: mergedOptions,
    };
    this.watchers.set(terminalId, entry);
    (0, logger_1.provider)(
      `⏳ [WATCHDOG] Started for ${terminalId} (reason=${reason}, initialDelay=${mergedOptions.initialDelayMs}ms, maxAttempts=${mergedOptions.maxAttempts})`
    );
    this.scheduleNext(terminalId, entry);
  }
  stop(terminalId, reason) {
    const entry = this.watchers.get(terminalId);
    if (!entry) {
      return;
    }
    if (entry.timer) {
      clearTimeout(entry.timer);
    }
    this.watchers.delete(terminalId);
    (0, logger_1.provider)(`🛑 [WATCHDOG] Stopped for ${terminalId} (reason=${reason})`);
  }
  dispose() {
    for (const [terminalId, entry] of this.watchers.entries()) {
      if (entry.timer) {
        clearTimeout(entry.timer);
      }
      (0, logger_1.provider)(`🛑 [WATCHDOG] Disposed pending watchdog for ${terminalId}`);
    }
    this.watchers.clear();
  }
  scheduleNext(terminalId, entry) {
    const nextAttempt = entry.attempt + 1;
    const delay =
      nextAttempt === 1
        ? entry.delay
        : Math.min(entry.delay * entry.options.backoffFactor, MAX_DELAY_MS);
    entry.timer = setTimeout(() => {
      const isFinalAttempt = nextAttempt >= entry.options.maxAttempts;
      (0, logger_1.provider)(
        `⚠️ [WATCHDOG] Attempt #${nextAttempt} for ${terminalId} (delay=${delay}ms, final=${isFinalAttempt})`
      );
      this.callback(terminalId, { attempt: nextAttempt, isFinalAttempt });
      if (isFinalAttempt) {
        this.watchers.delete(terminalId);
        return;
      }
      entry.attempt = nextAttempt;
      entry.delay = delay;
      this.scheduleNext(terminalId, entry);
    }, delay);
  }
}
exports.TerminalInitializationWatchdog = TerminalInitializationWatchdog;
//# sourceMappingURL=TerminalInitializationWatchdog.js.map
