'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
/**
 * DebugMessageHandler Tests
 */
const vitest_1 = require('vitest');
// Mock vscode (required by logger)
vitest_1.vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vitest_1.vi.fn().mockReturnValue({
      get: vitest_1.vi.fn().mockReturnValue(false),
    }),
  },
}));
// Mock logger to verify log calls
vitest_1.vi.mock('../../../../../utils/logger', () => ({
  provider: vitest_1.vi.fn(),
}));
const DebugMessageHandler_1 = require('../../../../../providers/handlers/DebugMessageHandler');
const logger_1 = require('../../../../../utils/logger');
function createMockDeps(isDebugEnabled = false) {
  return {
    isDebugEnabled: vitest_1.vi.fn().mockReturnValue(isDebugEnabled),
  };
}
(0, vitest_1.describe)('DebugMessageHandler', () => {
  let handler;
  let deps;
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
    deps = createMockDeps();
    handler = new DebugMessageHandler_1.DebugMessageHandler(deps);
  });
  (0, vitest_1.describe)('handleHtmlScriptTest', () => {
    (0, vitest_1.it)('should log debug message with message content', () => {
      const message = { command: 'htmlScriptTest', data: 'test' };
      handler.handleHtmlScriptTest(message);
      (0, vitest_1.expect)(logger_1.provider).toHaveBeenCalledWith(
        '🔥 [DEBUG] ========== HTML INLINE SCRIPT TEST MESSAGE RECEIVED =========='
      );
      (0, vitest_1.expect)(logger_1.provider).toHaveBeenCalledWith(
        '🔥 [DEBUG] HTML script communication is working!'
      );
      (0, vitest_1.expect)(logger_1.provider).toHaveBeenCalledWith(
        '🔥 [DEBUG] Message content:',
        message
      );
    });
  });
  (0, vitest_1.describe)('handleTimeoutTest', () => {
    (0, vitest_1.it)('should log debug message with message content', () => {
      const message = { command: 'timeoutTest', data: 'test' };
      handler.handleTimeoutTest(message);
      (0, vitest_1.expect)(logger_1.provider).toHaveBeenCalledWith(
        '🔥 [DEBUG] ========== HTML TIMEOUT TEST MESSAGE RECEIVED =========='
      );
      (0, vitest_1.expect)(logger_1.provider).toHaveBeenCalledWith(
        '🔥 [DEBUG] Timeout test communication is working!'
      );
      (0, vitest_1.expect)(logger_1.provider).toHaveBeenCalledWith(
        '🔥 [DEBUG] Message content:',
        message
      );
    });
  });
  (0, vitest_1.describe)('handleDebugTest', () => {
    (0, vitest_1.it)('should log init complete when message type is initComplete', () => {
      const message = {
        command: 'test',
        type: 'initComplete',
      };
      handler.handleDebugTest(message);
      (0, vitest_1.expect)(logger_1.provider).toHaveBeenCalledWith(
        '🎆 [TRACE] ==============================='
      );
      (0, vitest_1.expect)(logger_1.provider).toHaveBeenCalledWith(
        '🎆 [TRACE] WEBVIEW CONFIRMS INIT COMPLETE!'
      );
    });
    (0, vitest_1.it)('should log message data when debug is enabled', () => {
      const debugDeps = createMockDeps(true);
      const debugHandler = new DebugMessageHandler_1.DebugMessageHandler(debugDeps);
      const message = {
        command: 'test',
        type: 'initComplete',
      };
      debugHandler.handleDebugTest(message);
      (0, vitest_1.expect)(logger_1.provider).toHaveBeenCalledWith(
        '🎆 [TRACE] Message data:',
        message
      );
    });
    (0, vitest_1.it)('should not log message data when debug is disabled', () => {
      const message = {
        command: 'test',
        type: 'initComplete',
      };
      handler.handleDebugTest(message);
      (0, vitest_1.expect)(logger_1.provider).not.toHaveBeenCalledWith(
        '🎆 [TRACE] Message data:',
        message
      );
    });
    (0, vitest_1.it)('should not log anything when message type is not initComplete', () => {
      const message = {
        command: 'test',
        type: 'other',
      };
      handler.handleDebugTest(message);
      (0, vitest_1.expect)(logger_1.provider).not.toHaveBeenCalledWith(
        '🎆 [TRACE] ==============================='
      );
    });
    (0, vitest_1.it)('should handle missing dependencies gracefully', () => {
      const noDepsHandler = new DebugMessageHandler_1.DebugMessageHandler();
      const message = {
        command: 'test',
        type: 'initComplete',
      };
      // Should not throw
      noDepsHandler.handleDebugTest(message);
    });
  });
});
//# sourceMappingURL=DebugMessageHandler.test.js.map
