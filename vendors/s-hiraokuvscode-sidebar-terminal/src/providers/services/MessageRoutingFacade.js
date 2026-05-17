'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.MessageRoutingFacade = void 0;
const type_guards_1 = require('../../types/type-guards');
const SecondaryTerminalMessageRouter_1 = require('../SecondaryTerminalMessageRouter');
const logger_1 = require('../../utils/logger');
/**
 * MessageRoutingFacade
 *
 * Provides a high-level interface for managing and routing WebView messages
 * to appropriate handlers. This facade simplifies message handling by providing
 * validation, categorization, and organized handler registration.
 *
 * Responsibilities:
 * - Register message handlers by category
 * - Validate incoming messages
 * - Route messages to appropriate handlers
 * - Provide logging and debugging capabilities
 * - Manage handler lifecycle
 *
 * Part of Issue #214 refactoring to apply Facade pattern
 */
class MessageRoutingFacade {
  constructor() {
    this._handlerRegistry = [];
    this._isInitialized = false;
    this._router = new SecondaryTerminalMessageRouter_1.SecondaryTerminalMessageRouter();
  }
  /**
   * Register a message handler
   *
   * @param command The command string to handle
   * @param handler The handler function
   * @param category Optional category for organization
   * @param description Optional description for debugging
   */
  registerHandler(command, handler, category, description) {
    if (!command) {
      (0, logger_1.provider)('⚠️ [ROUTING] Cannot register handler with empty command');
      return;
    }
    // Register with the underlying router
    this._router.register(command, handler);
    // Track in registry for debugging and organization
    this._handlerRegistry.push({
      command,
      handler,
      category,
      description,
    });
    (0, logger_1.provider)(
      `✅ [ROUTING] Registered handler for '${command}'${category ? ` (${category})` : ''}`
    );
  }
  /**
   * Register multiple handlers at once
   *
   * @param handlers Array of handler registrations
   */
  registerHandlers(handlers) {
    for (const registration of handlers) {
      this.registerHandler(
        registration.command,
        registration.handler,
        registration.category,
        registration.description
      );
    }
  }
  /**
   * Validate that a message is a proper WebviewMessage
   */
  isValidMessage(message) {
    if (!(0, type_guards_1.isWebviewMessage)(message)) {
      (0, logger_1.provider)('⚠️ [ROUTING] Invalid message format:', message);
      return false;
    }
    return true;
  }
  /**
   * Dispatch a message to its handler
   *
   * @param message The message to dispatch
   * @returns Promise<boolean> True if handler was found and executed
   */
  async dispatch(message) {
    try {
      (0, logger_1.provider)(`📨 [ROUTING] Dispatching message: ${message.command}`);
      const handled = await this._router.dispatch(message);
      if (!handled) {
        (0, logger_1.provider)(`⚠️ [ROUTING] No handler found for command: ${message.command}`);
      } else {
        (0, logger_1.provider)(`✅ [ROUTING] Message handled successfully: ${message.command}`);
      }
      return handled;
    } catch (error) {
      (0, logger_1.provider)(`❌ [ROUTING] Error dispatching message ${message.command}:`, error);
      throw error;
    }
  }
  /**
   * Handle an incoming message with validation
   *
   * @param message The raw message from WebView
   * @returns Promise<boolean> True if message was valid and handled
   */
  async handleMessage(message) {
    // Validate message format
    if (!this.isValidMessage(message)) {
      return false;
    }
    // Dispatch to handler
    return await this.dispatch(message);
  }
  /**
   * Get all registered handlers by category
   */
  getHandlersByCategory(category) {
    return this._handlerRegistry.filter((reg) => reg.category === category);
  }
  /**
   * Get all registered commands
   */
  getRegisteredCommands() {
    return this._handlerRegistry.map((reg) => reg.command);
  }
  /**
   * Get handler count
   */
  getHandlerCount() {
    return this._handlerRegistry.length;
  }
  /**
   * Check if a handler is registered for a command
   */
  hasHandler(command) {
    return this._router.has(command);
  }
  /**
   * Validate that required handlers are registered; logs any gaps for early detection.
   */
  validateHandlers(requiredCommands) {
    const commands = requiredCommands.filter(Boolean);
    const missing = commands.filter((cmd) => !this._router.has(cmd));
    if (missing.length > 0) {
      (0, logger_1.provider)(
        `❌ [ROUTING] Missing handlers for critical commands: ${missing.join(', ')}`
      );
      (0, logger_1.provider)(
        '📋 [ROUTING] Currently registered commands:',
        this._router.getRegisteredCommands()
      );
    } else {
      (0, logger_1.provider)('✅ [ROUTING] All critical handlers registered');
    }
  }
  /**
   * Mark facade as initialized
   */
  setInitialized(initialized) {
    this._isInitialized = initialized;
  }
  /**
   * Check if facade is initialized
   */
  isInitialized() {
    return this._isInitialized;
  }
  /**
   * Log all registered handlers (useful for debugging)
   */
  logRegisteredHandlers() {
    (0, logger_1.provider)('📋 [ROUTING] === Registered Message Handlers ===');
    (0, logger_1.provider)(`📋 [ROUTING] Total handlers: ${this._handlerRegistry.length}`);
    // Group by category
    const categories = ['terminal', 'settings', 'persistence', 'ui', 'debug', 'other'];
    for (const category of categories) {
      const handlers = this.getHandlersByCategory(category);
      if (handlers.length > 0) {
        (0, logger_1.provider)(`📋 [ROUTING] ${category.toUpperCase()}:`);
        for (const handler of handlers) {
          const desc = handler.description ? ` - ${handler.description}` : '';
          (0, logger_1.provider)(`📋 [ROUTING]   - ${handler.command}${desc}`);
        }
      }
    }
    // Handlers without category
    const uncategorized = this._handlerRegistry.filter((reg) => !reg.category);
    if (uncategorized.length > 0) {
      (0, logger_1.provider)('📋 [ROUTING] UNCATEGORIZED:');
      for (const handler of uncategorized) {
        (0, logger_1.provider)(`📋 [ROUTING]   - ${handler.command}`);
      }
    }
  }
  /**
   * Clear all registered handlers
   */
  clear() {
    (0, logger_1.provider)('🧹 [ROUTING] Clearing all message handlers');
    this._router.clear();
    this._handlerRegistry.length = 0;
    this._isInitialized = false;
    (0, logger_1.provider)('✅ [ROUTING] All handlers cleared');
  }
  /**
   * Reset the router (same as clear, for backward compatibility)
   */
  reset() {
    this.clear();
  }
}
exports.MessageRoutingFacade = MessageRoutingFacade;
//# sourceMappingURL=MessageRoutingFacade.js.map
