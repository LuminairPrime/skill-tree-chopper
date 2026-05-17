'use strict';
/**
 * Scrollback Coordinator
 *
 * Handles scrollback data collection and session restoration
 * Extracted from SecondaryTerminalProvider for better separation of concerns
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.ScrollbackCoordinator = void 0;
const logger_1 = require('../../utils/logger');
/**
 * Scrollback Coordinator
 *
 * Responsibilities:
 * - Requesting scrollback data from WebView
 * - Handling scrollback data responses
 * - Managing scrollback collection state
 */
class ScrollbackCoordinator {
  constructor(_sendMessage) {
    this._sendMessage = _sendMessage;
    this._pendingScrollbackRequests = new Map();
  }
  /**
   * Request scrollback data for a specific terminal
   */
  async requestScrollbackData(terminalId, maxLines = 1000) {
    const requestId = `scrollback-${terminalId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    (0, logger_1.provider)(
      `📋 [SCROLLBACK-COORDINATOR] Requesting scrollback data for terminal ${terminalId} (requestId: ${requestId})`
    );
    return new Promise((resolve, reject) => {
      // Set timeout for request
      const timeout = setTimeout(() => {
        (0, logger_1.provider)(
          `⏰ [SCROLLBACK-COORDINATOR] Timeout for terminal ${terminalId} scrollback request`
        );
        this._pendingScrollbackRequests.delete(requestId);
        resolve([]); // Return empty array on timeout
      }, 10000); // 10 second timeout
      // Store pending request
      this._pendingScrollbackRequests.set(requestId, {
        resolve,
        reject,
        timeout,
        terminalId,
      });
      // Send request to WebView
      void this._sendMessage({
        command: 'extractScrollbackData',
        terminalId,
        requestId,
        maxLines,
        timestamp: Date.now(),
      });
    });
  }
  /**
   * Request scrollback data for multiple terminals
   */
  async requestMultipleScrollbackData(terminalIds, maxLines = 1000) {
    (0, logger_1.provider)(
      `📋 [SCROLLBACK-COORDINATOR] Requesting scrollback data for ${terminalIds.length} terminals`
    );
    const scrollbackDataMap = {};
    // Request scrollback data for all terminals in parallel
    await Promise.all(
      terminalIds.map(async (terminalId) => {
        try {
          const scrollbackData = await this.requestScrollbackData(terminalId, maxLines);
          if (scrollbackData && scrollbackData.length > 0) {
            scrollbackDataMap[terminalId] = scrollbackData;
            (0, logger_1.provider)(
              `✅ [SCROLLBACK-COORDINATOR] Collected ${scrollbackData.length} lines for terminal ${terminalId}`
            );
          }
        } catch (error) {
          (0, logger_1.provider)(
            `❌ [SCROLLBACK-COORDINATOR] Failed to collect scrollback for terminal ${terminalId}:`,
            error
          );
        }
      })
    );
    (0, logger_1.provider)(
      `📋 [SCROLLBACK-COORDINATOR] Collected scrollback data for ${Object.keys(scrollbackDataMap).length}/${terminalIds.length} terminals`
    );
    return scrollbackDataMap;
  }
  /**
   * Handle scrollback data response from WebView
   */
  handleScrollbackDataResponse(message) {
    const requestId = message.requestId;
    if (!requestId) {
      (0, logger_1.provider)('⚠️ [SCROLLBACK-COORDINATOR] Scrollback response missing requestId');
      return;
    }
    const pendingRequest = this._pendingScrollbackRequests.get(requestId);
    if (!pendingRequest) {
      (0, logger_1.provider)(
        `⚠️ [SCROLLBACK-COORDINATOR] No pending request found for requestId: ${requestId}`
      );
      return;
    }
    // Clear timeout
    clearTimeout(pendingRequest.timeout);
    this._pendingScrollbackRequests.delete(requestId);
    if (message.error) {
      (0, logger_1.provider)(
        `⚠️ [SCROLLBACK-COORDINATOR] Scrollback extraction error for terminal ${message.terminalId}: ${message.error}`
      );
      pendingRequest.resolve([]); // Resolve with empty array on error
    } else {
      (0, logger_1.provider)(
        `✅ [SCROLLBACK-COORDINATOR] Scrollback data received for terminal ${message.terminalId}: ${message.scrollbackData?.length || 0} lines`
      );
      pendingRequest.resolve(message.scrollbackData || []);
    }
  }
  /**
   * Get pending requests count (for debugging)
   */
  getPendingRequestsCount() {
    return this._pendingScrollbackRequests.size;
  }
  /**
   * Clear all pending requests
   */
  clearPendingRequests() {
    this._pendingScrollbackRequests.forEach((request) => {
      clearTimeout(request.timeout);
      request.resolve([]); // Resolve with empty array
    });
    this._pendingScrollbackRequests.clear();
    (0, logger_1.provider)('🧹 [SCROLLBACK-COORDINATOR] Cleared all pending scrollback requests');
  }
  /**
   * Clean up resources
   */
  dispose() {
    this.clearPendingRequests();
    (0, logger_1.provider)('🧹 [SCROLLBACK-COORDINATOR] Disposed');
  }
}
exports.ScrollbackCoordinator = ScrollbackCoordinator;
//# sourceMappingURL=ScrollbackCoordinator.js.map
