'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.FocusTerminalHandler = void 0;
const BaseMessageHandler_1 = require('../../../messaging/handlers/BaseMessageHandler');
const logger_1 = require('../../../utils/logger');
const constants_1 = require('../../../constants');
/**
 * Handles terminal focus messages from WebView
 */
class FocusTerminalHandler extends BaseMessageHandler_1.BaseMessageHandler {
  constructor() {
    super(...arguments);
    this.supportedCommands = [
      'focusTerminal',
      constants_1.TERMINAL_CONSTANTS?.COMMANDS?.FOCUS_TERMINAL || 'focusTerminal',
    ];
  }
  async handle(message, context) {
    this.logMessageHandling(message, 'FocusTerminal');
    try {
      if (!this.hasTerminalId(message)) {
        (0, logger_1.provider)('❌ [FocusTerminal] No terminal ID provided');
        return;
      }
      (0, logger_1.provider)(`🎯 [FocusTerminal] Focusing terminal: ${message.terminalId}`);
      // Get current active terminal for logging
      const currentActive = context.terminalManager.getActiveTerminalId();
      (0, logger_1.provider)(
        `🔍 [FocusTerminal] Current active: ${currentActive} → Requested: ${message.terminalId}`
      );
      // Set the terminal as active
      context.terminalManager.setActiveTerminal(message.terminalId);
      // Verify the change was successful
      const newActive = context.terminalManager.getActiveTerminalId();
      if (newActive === message.terminalId) {
        (0, logger_1.provider)(
          `✅ [FocusTerminal] Successfully focused terminal: ${message.terminalId}`
        );
      } else {
        (0, logger_1.provider)(
          `❌ [FocusTerminal] Failed to focus terminal. Expected: ${message.terminalId}, Got: ${newActive}`
        );
      }
    } catch (error) {
      await this.handleErrorAsync(error, message, 'FocusTerminal');
    }
  }
}
exports.FocusTerminalHandler = FocusTerminalHandler;
//# sourceMappingURL=FocusTerminalHandler.js.map
