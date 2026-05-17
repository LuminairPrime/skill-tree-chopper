'use strict';
/**
 * Logger Unit Tests
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const logger_1 = require('../../../../utils/logger');
(0, vitest_1.describe)('Logger', () => {
  let consoleLogSpy;
  let consoleWarnSpy;
  let consoleErrorSpy;
  (0, vitest_1.beforeEach)(() => {
    consoleLogSpy = vitest_1.vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vitest_1.vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vitest_1.vi.spyOn(console, 'error').mockImplementation(() => {});
    // Set to DEBUG level for testing
    logger_1.logger.setLevel(logger_1.LogLevel.DEBUG);
  });
  (0, vitest_1.afterEach)(() => {
    vitest_1.vi.restoreAllMocks();
  });
  (0, vitest_1.describe)('Levels and Filtering', () => {
    (0, vitest_1.it)('should respect DEBUG level', () => {
      logger_1.logger.setLevel(logger_1.LogLevel.DEBUG);
      (0, logger_1.debug)('test debug');
      (0, vitest_1.expect)(consoleLogSpy).toHaveBeenCalledWith('[DEBUG]', 'test debug');
    });
    (0, vitest_1.it)('should respect ERROR level and filter others', () => {
      logger_1.logger.setLevel(logger_1.LogLevel.ERROR);
      (0, logger_1.debug)('test debug');
      (0, logger_1.info)('test info');
      (0, logger_1.warn)('test warn');
      (0, logger_1.error)('test error');
      (0, vitest_1.expect)(consoleLogSpy).not.toHaveBeenCalled();
      (0, vitest_1.expect)(consoleWarnSpy).not.toHaveBeenCalled();
      (0, vitest_1.expect)(consoleErrorSpy).toHaveBeenCalledWith('[ERROR]', 'test error');
    });
    (0, vitest_1.it)('should disable all logging when set to NONE', () => {
      logger_1.logger.setLevel(logger_1.LogLevel.NONE);
      (0, logger_1.error)('none');
      (0, vitest_1.expect)(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('Categorized Logging', () => {
    (0, vitest_1.beforeEach)(() => {
      logger_1.logger.setLevel(logger_1.LogLevel.DEBUG);
    });
    (0, vitest_1.it)('should format terminal logs with emoji', () => {
      (0, logger_1.terminal)('terminal message');
      (0, vitest_1.expect)(consoleLogSpy).toHaveBeenCalledWith(
        vitest_1.expect.stringContaining('✨ [DEBUG:TERMINAL]'),
        'terminal message'
      );
    });
    (0, vitest_1.it)('should format webview logs with emoji', () => {
      (0, logger_1.webview)('webview message');
      (0, vitest_1.expect)(consoleLogSpy).toHaveBeenCalledWith(
        vitest_1.expect.stringContaining('🌐 [DEBUG:WEBVIEW]'),
        'webview message'
      );
    });
    (0, vitest_1.it)('should handle object arguments by stringifying them', () => {
      (0, logger_1.info)('data', { a: 1 });
      (0, vitest_1.expect)(consoleLogSpy).toHaveBeenCalledWith(
        '[INFO]',
        'data',
        vitest_1.expect.stringContaining('"a": 1')
      );
    });
  });
  (0, vitest_1.describe)('Query Helpers', () => {
    (0, vitest_1.it)('should return correct status for enabled levels', () => {
      logger_1.logger.setLevel(logger_1.LogLevel.INFO);
      (0, vitest_1.expect)(logger_1.logger.isDebugEnabled()).toBe(false);
      (0, vitest_1.expect)(logger_1.logger.isInfoEnabled()).toBe(true);
    });
  });
});
//# sourceMappingURL=logger.test.js.map
