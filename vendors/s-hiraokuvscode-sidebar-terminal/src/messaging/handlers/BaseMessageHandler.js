'use strict';
/**
 * Unified Base Message Handler
 *
 * Abstract base class for all message handlers (both Extension and WebView).
 * Provides common functionality and enforces consistent patterns.
 *
 * Unified from:
 * - messaging/handlers/BaseMessageHandler.ts (priority system, generic validation)
 * - services/webview/messageHandlers/BaseMessageHandler.ts (WebView-specific helpers)
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.BaseMessageHandler = void 0;
const UnifiedMessageDispatcher_1 = require('../UnifiedMessageDispatcher');
const logger_1 = require('../../utils/logger');
/**
 * Abstract base class for unified message handlers
 * Implements both IUnifiedMessageHandler and IMessageHandler for compatibility
 */
class BaseMessageHandler {
  constructor(supportedCommands, priority = UnifiedMessageDispatcher_1.MessagePriority.NORMAL) {
    this.supportedCommands = supportedCommands;
    this.priority = priority;
  }
  /**
   * Check if this handler can process the given message
   */
  canHandle(message) {
    return this.supportedCommands.includes(message.command);
  }
  /**
   * Get handler priority
   */
  getPriority() {
    return this.priority;
  }
  /**
   * Get supported commands
   */
  getSupportedCommands() {
    return [...this.supportedCommands]; // Return copy to prevent modification
  }
  // =============================================================================
  // Generic Validation Methods
  // =============================================================================
  /**
   * Validate required message properties
   */
  validateMessage(message, requiredProps) {
    for (const prop of requiredProps) {
      if (!(prop in message) || message[prop] === undefined) {
        throw new Error(`Missing required property: ${prop}`);
      }
    }
  }
  // =============================================================================
  // WebView-Specific Type Guards (from services/webview/messageHandlers)
  // =============================================================================
  /**
   * Validate message has terminal ID
   */
  hasTerminalId(message) {
    return typeof message.terminalId === 'string' && message.terminalId.length > 0;
  }
  /**
   * Validate message has resize parameters
   */
  hasResizeParams(message) {
    const { cols, rows } = message;
    return typeof cols === 'number' && typeof rows === 'number' && cols > 0 && rows > 0;
  }
  /**
   * Validate message has input data
   */
  hasInputData(message) {
    return typeof message.data === 'string' && message.data.length > 0;
  }
  /**
   * Validate message has settings
   */
  hasSettings(message) {
    return !!message.settings && typeof message.settings === 'object';
  }
  // =============================================================================
  // Logging Methods
  // =============================================================================
  /**
   * Log handler activity
   */
  logActivity(context, message, data) {
    if ('logger' in context && context.logger) {
      context.logger.debug(`[${this.constructor.name}] ${message}`, data);
    } else {
      (0, logger_1.provider)(`[${this.constructor.name}] ${message}`, data);
    }
  }
  /**
   * Log message handling (WebView-style)
   */
  logMessageHandling(message, handlerName) {
    (0, logger_1.provider)(`📨 [${handlerName}] Processing message: ${message.command}`);
  }
  // =============================================================================
  // Error Handling Methods
  // =============================================================================
  /**
   * Handle errors consistently (throws for control flow)
   */
  handleError(context, command, error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if ('logger' in context && context.logger) {
      context.logger.error(
        `[${this.constructor.name}] Error handling ${command}: ${errorMessage}`,
        error
      );
    } else {
      (0, logger_1.provider)(
        `❌ [${this.constructor.name}] Error handling ${command}: ${errorMessage}`,
        error
      );
    }
    throw new Error(`Handler ${this.constructor.name} failed: ${errorMessage}`);
  }
  /**
   * Handle errors in message processing (WebView-style, async)
   */
  async handleErrorAsync(error, message, handlerName) {
    (0, logger_1.provider)(`❌ [${handlerName}] Error handling message ${message.command}:`, error);
    // Import error handler dynamically to avoid circular dependencies
    try {
      const { TerminalErrorHandler } = await Promise.resolve().then(() =>
        require('../../utils/feedback')
      );
      TerminalErrorHandler.handleWebviewError(error);
    } catch (importError) {
      console.error(`Failed to import TerminalErrorHandler:`, importError);
    }
  }
}
exports.BaseMessageHandler = BaseMessageHandler;
//# sourceMappingURL=BaseMessageHandler.js.map
