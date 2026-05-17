'use strict';
/**
 * Terminal Lifecycle Handler
 *
 * Handles terminal creation, deletion, and state management messages.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.TerminalLifecycleHandler = void 0;
const UnifiedMessageDispatcher_1 = require('../UnifiedMessageDispatcher');
const BaseMessageHandler_1 = require('./BaseMessageHandler');
class TerminalLifecycleHandler extends BaseMessageHandler_1.BaseMessageHandler {
  constructor() {
    super(
      [
        'terminalCreated',
        'createTerminal',
        'terminalRemoved',
        'deleteTerminalResponse',
        'focusTerminal',
        'clear',
      ],
      UnifiedMessageDispatcher_1.MessagePriority.HIGH
    );
  }
  async handle(message, context) {
    this.logActivity(context, `Processing lifecycle message: ${message.command}`);
    try {
      switch (message.command) {
        case 'terminalCreated':
          await this.handleTerminalCreated(message, context);
          break;
        case 'createTerminal':
          await this.handleNewTerminal(message, context);
          break;
        case 'terminalRemoved':
          await this.handleTerminalRemoved(message, context);
          break;
        case 'deleteTerminalResponse':
          await this.handleDeleteTerminalResponse(message, context);
          break;
        case 'focusTerminal':
          await this.handleFocusTerminal(message, context);
          break;
        case 'clear':
          await this.handleClearTerminal(message, context);
          break;
        default:
          context.logger.warn(`Unhandled lifecycle command: ${message.command}`);
      }
    } catch (error) {
      this.handleError(context, message.command, error);
    }
  }
  /**
   * Handle terminal created message from extension
   */
  async handleTerminalCreated(message, context) {
    const terminalId = message.terminalId;
    const terminalName = message.terminalName;
    const terminalNumber = message.terminalNumber;
    const config = message.config;
    if (terminalId && terminalName && config) {
      context.logger.info(
        `🔍 TERMINAL_CREATED message received: ${terminalId} (${terminalName}) #${terminalNumber || 'unknown'}`
      );
      context.logger.info(
        `🔍 Current terminal count before creation: ${context.coordinator.getAllTerminalInstances().size}`
      );
      const result = await context.coordinator.createTerminal(
        terminalId,
        terminalName,
        config,
        terminalNumber,
        'extension'
      );
      context.logger.info(`🔍 Terminal creation result: ${result ? 'SUCCESS' : 'FAILED'}`);
      context.logger.info(
        `🔍 Current terminal count after creation: ${context.coordinator.getAllTerminalInstances().size}`
      );
      this.logActivity(context, 'createTerminal result', {
        terminalId,
        terminalName,
        terminalNumber,
        success: !!result,
        existingTerminals: Array.from(context.coordinator.getAllTerminalInstances().keys()),
      });
    } else {
      context.logger.error('Invalid terminalCreated message', {
        hasTerminalId: !!terminalId,
        hasTerminalName: !!terminalName,
        hasTerminalNumber: !!terminalNumber,
        hasConfig: !!config,
      });
    }
  }
  /**
   * Handle new terminal creation message
   */
  async handleNewTerminal(message, context) {
    const terminalId = message.terminalId;
    const terminalName = message.terminalName;
    const config = message.config;
    if (terminalId && terminalName) {
      context.logger.info(`New terminal request: ${terminalId} (${terminalName})`);
      // Send terminal interaction event
      await context.postMessage({
        command: 'terminalInteraction',
        type: 'new-terminal',
        terminalId,
        data: { terminalName, config },
        timestamp: Date.now(),
      });
    }
  }
  /**
   * Handle terminal removed message from extension
   */
  async handleTerminalRemoved(message, context) {
    const terminalId = message.terminalId;
    if (terminalId) {
      context.logger.info(`Terminal removed from extension: ${terminalId}`);
      await this.handleTerminalRemovedFromExtension(terminalId, context);
    }
  }
  /**
   * Handle terminal removed from extension - clean up UI
   */
  async handleTerminalRemovedFromExtension(terminalId, context) {
    context.logger.info(`Handling terminal removal from extension: ${terminalId}`);
    if (
      'handleTerminalRemovedFromExtension' in context.coordinator &&
      typeof context.coordinator.handleTerminalRemovedFromExtension === 'function'
    ) {
      context.coordinator.handleTerminalRemovedFromExtension(terminalId);
    } else {
      context.logger.warn('handleTerminalRemovedFromExtension method not found on coordinator');
    }
  }
  /**
   * Handle delete terminal response from extension
   */
  async handleDeleteTerminalResponse(message, context) {
    const terminalId = message.terminalId;
    const success = message.success;
    const reason = message.reason;
    context.logger.info(
      `Delete terminal response: ${terminalId}, success: ${success}, reason: ${reason || 'none'}`
    );
    if (!success) {
      // Delete failed - restore terminal in WebView if it was removed prematurely
      context.logger.warn(`Terminal deletion failed: ${reason}`);
      // Clear deletion tracking since operation failed
      if (
        'clearTerminalDeletionTracking' in context.coordinator &&
        typeof context.coordinator.clearTerminalDeletionTracking === 'function'
      ) {
        context.coordinator.clearTerminalDeletionTracking(terminalId);
      }
      // Show user notification
      if (context.coordinator.getManagers && context.coordinator.getManagers().notification) {
        const notificationManager = context.coordinator.getManagers().notification;
        if (
          'showWarning' in notificationManager &&
          typeof notificationManager.showWarning === 'function'
        ) {
          notificationManager.showWarning(reason || 'Terminal deletion failed');
        }
      }
    } else {
      // Delete succeeded - terminal should already be removed from WebView
      context.logger.info(`Terminal deletion confirmed by Extension: ${terminalId}`);
      // Ensure terminal is properly removed from WebView
      if (
        'removeTerminal' in context.coordinator &&
        typeof context.coordinator.removeTerminal === 'function'
      ) {
        context.coordinator.removeTerminal(terminalId);
      }
    }
  }
  /**
   * Handle focus terminal message
   */
  async handleFocusTerminal(message, context) {
    const terminalId = message.terminalId;
    if (terminalId) {
      context.coordinator.ensureTerminalFocus(terminalId);
      context.logger.info(`Terminal focused: ${terminalId}`);
    }
  }
  /**
   * Handle clear terminal message from extension
   */
  async handleClearTerminal(message, context) {
    const terminalId = message.terminalId;
    if (terminalId) {
      const terminal = context.coordinator.getTerminalInstance(terminalId);
      if (terminal) {
        terminal.terminal.clear();
        context.logger.info(`Terminal cleared: ${terminalId}`);
      }
    }
  }
}
exports.TerminalLifecycleHandler = TerminalLifecycleHandler;
//# sourceMappingURL=TerminalLifecycleHandler.js.map
