'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.WebViewReadyHandler = void 0;
const BaseMessageHandler_1 = require('../../../messaging/handlers/BaseMessageHandler');
const logger_1 = require('../../../utils/logger');
const constants_1 = require('../../../constants');
/**
 * Handles WebView ready messages and initialization
 */
class WebViewReadyHandler extends BaseMessageHandler_1.BaseMessageHandler {
  constructor() {
    super(...arguments);
    this.supportedCommands = [
      'webviewReady',
      constants_1.TERMINAL_CONSTANTS?.COMMANDS?.READY || 'ready',
    ];
  }
  async handle(message, context) {
    this.logMessageHandling(message, 'WebViewReady');
    try {
      // Check if already initialized to prevent duplicate initialization
      const stateManager = context.stateManager;
      if (stateManager?.isInitialized()) {
        (0, logger_1.provider)(
          '🔄 [WebViewReady] Already initialized, skipping duplicate initialization'
        );
        return;
      }
      (0, logger_1.provider)('🎯 [WebViewReady] Initializing WebView immediately');
      if (stateManager) {
        stateManager.setInitialized(true);
      }
      // Initialize terminal
      await this.initializeTerminal(context);
      (0, logger_1.provider)('✅ [WebViewReady] Terminal initialization completed');
      // Ensure minimum terminal creation after short delay
      setTimeout(() => {
        this.ensureMinimumTerminals(context);
      }, 100);
    } catch (error) {
      await this.handleErrorAsync(error, message, 'WebViewReady');
    }
  }
  /**
   * Initialize terminal system
   */
  async initializeTerminal(context) {
    try {
      // This will be handled by WebViewStateManager in the future
      // For now, we'll call the provider's method directly
      const provider = context.provider;
      if (provider && provider._initializeTerminal) {
        await provider._initializeTerminal();
      }
    } catch (error) {
      (0, logger_1.provider)('❌ [WebViewReady] Failed to initialize terminal:', error);
      throw error;
    }
  }
  /**
   * Ensure minimum number of terminals exist
   */
  ensureMinimumTerminals(context) {
    try {
      if (context.terminalManager.getTerminals().length === 0) {
        (0, logger_1.provider)('🎯 [WebViewReady] No terminals exist - creating minimum set');
        const terminalId = context.terminalManager.createTerminal();
        context.terminalManager.setActiveTerminal(terminalId);
        (0, logger_1.provider)(`✅ [WebViewReady] Created minimum terminal: ${terminalId}`);
      }
    } catch (error) {
      (0, logger_1.provider)('❌ [WebViewReady] Failed to ensure minimum terminals:', error);
    }
  }
}
exports.WebViewReadyHandler = WebViewReadyHandler;
//# sourceMappingURL=WebViewReadyHandler.js.map
