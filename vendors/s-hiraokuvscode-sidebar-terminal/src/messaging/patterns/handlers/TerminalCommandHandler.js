'use strict';
/**
 * Terminal Command Handler
 *
 * Handles terminal lifecycle and interaction commands.
 * Consolidates logic from:
 * - ConsolidatedMessageManager (lifecycle cases)
 * - TerminalLifecycleMessageHandler
 *
 * Related to: GitHub Issue #219
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.TerminalCommandHandler = void 0;
const IMessageHandler_1 = require('../core/IMessageHandler');
/**
 * Handler for terminal-related commands
 */
class TerminalCommandHandler extends IMessageHandler_1.BaseCommandHandler {
  constructor() {
    super(
      'TerminalCommandHandler',
      [
        'init',
        'output',
        'terminalCreated',
        'newTerminal',
        'focusTerminal',
        'setActiveTerminal',
        'deleteTerminalResponse',
        'terminalRemoved',
        'clear',
      ],
      75 // High priority for terminal operations
    );
  }
  async handle(message, context) {
    const { command } = message;
    const coordinator = context.coordinator;
    if (!coordinator) {
      throw new Error('Coordinator not available for terminal operations');
    }
    this.log(context, 'info', `Processing terminal command: ${command}`);
    switch (command) {
      case 'init':
        await this.handleInit(message, coordinator, context);
        break;
      case 'output':
        await this.handleOutput(message, coordinator, context);
        break;
      case 'terminalCreated':
      case 'newTerminal':
        await this.handleTerminalCreated(message, coordinator, context);
        break;
      case 'focusTerminal':
      case 'setActiveTerminal':
        await this.handleFocusTerminal(message, coordinator, context);
        break;
      case 'deleteTerminalResponse':
      case 'terminalRemoved':
        await this.handleTerminalRemoved(message, coordinator, context);
        break;
      case 'clear':
        await this.handleClear(message, coordinator, context);
        break;
      default:
        this.log(context, 'warn', `Unknown terminal command: ${command}`);
    }
  }
  /**
   * Handle terminal initialization
   */
  async handleInit(message, coordinator, context) {
    this.log(context, 'debug', 'Initializing terminal');
    // Delegate to coordinator's terminal manager or other components
    // This is a placeholder for actual initialization logic
    if (typeof coordinator.initializeTerminal === 'function') {
      await coordinator.initializeTerminal(message);
    }
  }
  /**
   * Handle terminal output
   */
  async handleOutput(message, coordinator, context) {
    const { terminalId, data } = message;
    if (!terminalId) {
      throw new Error('Missing terminalId for output command');
    }
    this.log(context, 'debug', `Output for terminal ${terminalId}`, {
      dataLength: data?.length || 0,
    });
    const terminalInstance = coordinator.getTerminalInstance(terminalId);
    if (terminalInstance && typeof terminalInstance.terminal?.write === 'function') {
      terminalInstance.terminal.write(data);
    } else {
      this.log(context, 'warn', `Terminal instance not found: ${terminalId}`);
    }
  }
  /**
   * Handle terminal created event
   */
  async handleTerminalCreated(message, coordinator, context) {
    const { terminalId } = message;
    this.log(context, 'info', `Terminal created: ${terminalId || 'new'}`);
    // Delegate to coordinator's create terminal logic
    if (typeof coordinator.createTerminal === 'function') {
      await coordinator.createTerminal(message);
    }
  }
  /**
   * Handle focus terminal command
   */
  async handleFocusTerminal(message, coordinator, context) {
    const { terminalId } = message;
    if (!terminalId) {
      throw new Error('Missing terminalId for focus command');
    }
    this.log(context, 'info', `Focusing terminal: ${terminalId}`);
    if (typeof coordinator.setActiveTerminal === 'function') {
      coordinator.setActiveTerminal(terminalId);
    }
  }
  /**
   * Handle terminal removed event
   */
  async handleTerminalRemoved(message, coordinator, context) {
    const { terminalId } = message;
    if (!terminalId) {
      throw new Error('Missing terminalId for remove command');
    }
    this.log(context, 'info', `Terminal removed: ${terminalId}`);
    if (typeof coordinator.removeTerminal === 'function') {
      coordinator.removeTerminal(terminalId);
    }
  }
  /**
   * Handle clear terminal command
   */
  async handleClear(message, coordinator, context) {
    const { terminalId } = message;
    this.log(context, 'debug', `Clearing terminal: ${terminalId || 'active'}`);
    const targetId = terminalId || coordinator.getActiveTerminalId();
    if (targetId) {
      const terminalInstance = coordinator.getTerminalInstance(targetId);
      if (terminalInstance && typeof terminalInstance.terminal?.clear === 'function') {
        terminalInstance.terminal.clear();
      }
    }
  }
}
exports.TerminalCommandHandler = TerminalCommandHandler;
//# sourceMappingURL=TerminalCommandHandler.js.map
