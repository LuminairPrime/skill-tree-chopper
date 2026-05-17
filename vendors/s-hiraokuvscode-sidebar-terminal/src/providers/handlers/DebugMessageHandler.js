'use strict';
/**
 * DebugMessageHandler
 *
 * Debug-related message handling extracted from SecondaryTerminalProvider.
 * Handles debugTest, htmlScriptTest, and timeoutTest messages.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.DebugMessageHandler = void 0;
const logger_1 = require('../../utils/logger');
class DebugMessageHandler {
  constructor(deps = {}) {
    this.deps = deps;
  }
  /**
   * Handle HTML inline script test messages
   */
  handleHtmlScriptTest(message) {
    (0, logger_1.provider)(
      '🔥 [DEBUG] ========== HTML INLINE SCRIPT TEST MESSAGE RECEIVED =========='
    );
    (0, logger_1.provider)('🔥 [DEBUG] HTML script communication is working!');
    (0, logger_1.provider)('🔥 [DEBUG] Message content:', message);
  }
  /**
   * Handle timeout test messages
   */
  handleTimeoutTest(message) {
    (0, logger_1.provider)('🔥 [DEBUG] ========== HTML TIMEOUT TEST MESSAGE RECEIVED ==========');
    (0, logger_1.provider)('🔥 [DEBUG] Timeout test communication is working!');
    (0, logger_1.provider)('🔥 [DEBUG] Message content:', message);
  }
  /**
   * Handle debug test messages
   */
  handleDebugTest(message) {
    if (message.type === 'initComplete') {
      (0, logger_1.provider)('🎆 [TRACE] ===============================');
      (0, logger_1.provider)('🎆 [TRACE] WEBVIEW CONFIRMS INIT COMPLETE!');
      try {
        if (this.deps.isDebugEnabled && this.deps.isDebugEnabled()) {
          (0, logger_1.provider)('🎆 [TRACE] Message data:', message);
        }
      } catch {
        // Silently ignore logger loading errors - debug logging is non-critical
      }
    }
  }
}
exports.DebugMessageHandler = DebugMessageHandler;
//# sourceMappingURL=DebugMessageHandler.js.map
