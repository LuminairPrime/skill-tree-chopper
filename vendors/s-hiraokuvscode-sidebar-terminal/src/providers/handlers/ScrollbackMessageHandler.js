'use strict';
/**
 * ScrollbackMessageHandler
 *
 * Scrollback-related message handling extracted from SecondaryTerminalProvider.
 * Handles pushScrollbackData, scrollbackDataCollected, and scrollbackRefreshRequest messages.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.ScrollbackMessageHandler = void 0;
const logger_1 = require('../../utils/logger');
class ScrollbackMessageHandler {
  constructor(deps) {
    this.deps = deps;
  }
  /**
   * Handle pushScrollbackData messages from WebView
   */
  async handlePushScrollbackData(message) {
    const persistenceService = this.deps.getExtensionPersistenceService();
    if (!persistenceService) {
      (0, logger_1.provider)(
        '⚠️ [PROVIDER] Received pushScrollbackData but persistence service is unavailable'
      );
      return;
    }
    const handler = persistenceService.handlePushedScrollbackData;
    if (typeof handler !== 'function') {
      (0, logger_1.provider)(
        '⚠️ [PROVIDER] Persistence service does not support pushScrollbackData'
      );
      return;
    }
    try {
      handler.call(persistenceService, message);
    } catch (error) {
      (0, logger_1.provider)('❌ [PROVIDER] Failed to process pushScrollbackData message:', error);
    }
  }
  /**
   * Handle scrollbackDataCollected messages from WebView
   */
  async handleScrollbackDataCollected(message) {
    const scrollbackData = message?.scrollbackData ?? message?.scrollbackContent;
    const requestId = message?.requestId;
    const terminalId = message?.terminalId;
    if (!Array.isArray(scrollbackData)) {
      (0, logger_1.provider)('⚠️ [PROVIDER] scrollbackDataCollected missing scrollbackData array');
      return;
    }
    // Forward to persistence service for handling (supports both cache update and pending request resolution)
    const persistenceService = this.deps.getExtensionPersistenceService();
    if (persistenceService) {
      const handler = persistenceService.handleScrollbackDataCollected;
      if (typeof handler === 'function') {
        handler.call(persistenceService, { terminalId, requestId, scrollbackData });
        (0, logger_1.provider)(
          `✅ [PROVIDER] scrollbackDataCollected forwarded to persistence service (requestId=${requestId || 'none'})`
        );
        return;
      }
    }
    // Fallback: treat as pushScrollbackData for cache update
    message.command = 'pushScrollbackData';
    await this.handlePushScrollbackData(message);
  }
  /**
   * Handle scrollback refresh request from WebView after sleep/wake
   */
  async handleScrollbackRefreshRequest(message) {
    const persistenceService = this.deps.getExtensionPersistenceService();
    if (!persistenceService) {
      (0, logger_1.provider)(
        '⚠️ [PROVIDER] Received requestScrollbackRefresh but persistence service is unavailable'
      );
      return;
    }
    const handler = persistenceService.handleScrollbackRefreshRequest;
    if (typeof handler !== 'function') {
      (0, logger_1.provider)(
        '⚠️ [PROVIDER] Persistence service does not support handleScrollbackRefreshRequest'
      );
      return;
    }
    try {
      await handler.call(persistenceService, message);
      (0, logger_1.provider)('✅ [PROVIDER] Scrollback refresh request handled');
    } catch (error) {
      (0, logger_1.provider)('❌ [PROVIDER] Failed to process scrollback refresh request:', error);
    }
  }
}
exports.ScrollbackMessageHandler = ScrollbackMessageHandler;
//# sourceMappingURL=ScrollbackMessageHandler.js.map
