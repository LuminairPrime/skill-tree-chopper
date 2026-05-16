"use strict";
/**
 * Base Message Handler
 *
 * Abstract base class for all message handlers with common patterns and utilities.
 *
 * Provides:
 * - Common validation logic
 * - Standardized error handling using ErrorHandler
 * - Common disposal pattern
 * - Logger integration
 * - Type-safe message handling
 * - CommandRegistry-based dispatch (optional)
 *
 * @see openspec/changes/refactor-terminal-foundation/specs/unify-message-handlers/spec.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistryBasedMessageHandler = exports.BaseMessageHandler = void 0;
const ErrorHandler_1 = require("../../utils/ErrorHandler");
const CommandRegistry_1 = require("../../core/CommandRegistry");
/**
 * Abstract base class for message handlers
 *
 * Provides common functionality and enforces consistent patterns across all handlers.
 *
 * @example
 * class MyCustomHandler extends BaseMessageHandler {
 *   protected supportedCommands = ['myCommand1', 'myCommand2'];
 *
 *   public async handleMessage(msg: MessageCommand, coordinator: IManagerCoordinator): Promise<void> {
 *     const command = this.getCommand(msg);
 *     switch (command) {
 *       case 'myCommand1':
 *         this.handleMyCommand1(msg, coordinator);
 *         break;
 *       default:
 *         this.handleUnknownCommand(command);
 *     }
 *   }
 * }
 */
class BaseMessageHandler {
    constructor(messageQueue, logger) {
        this.messageQueue = messageQueue;
        this.logger = logger;
    }
    /**
     * Get the command types that this handler supports
     */
    getSupportedCommands() {
        return this.supportedCommands;
    }
    /**
     * Extract command from message
     * Common utility for all handlers
     */
    getCommand(msg) {
        return msg.command;
    }
    /**
     * Validate message structure
     * Override in subclasses for custom validation
     */
    validate(msg) {
        const command = this.getCommand(msg);
        if (!command) {
            this.logger.warn('Message missing command field');
            return false;
        }
        if (!this.supportedCommands.includes(command)) {
            return false;
        }
        return true;
    }
    /**
     * Handle validation failure
     * Common pattern for all handlers
     */
    handleValidationError(msg) {
        const command = this.getCommand(msg);
        this.logger.warn(`Validation failed for command: ${command}`);
    }
    /**
     * Handle unknown command
     * Common pattern for all handlers
     */
    handleUnknownCommand(command) {
        this.logger.warn(`Unknown command: ${command}`);
    }
    /**
     * Handle errors with standardized ErrorHandler
     * Common error handling for all handlers
     */
    handleError(error, operation, context) {
        ErrorHandler_1.ErrorHandler.handleOperationError(operation, error, {
            severity: 'error',
            context,
            rethrow: false,
        });
    }
    /**
     * Handle errors with warning severity
     * For non-critical errors
     */
    handleWarning(error, operation, context) {
        ErrorHandler_1.ErrorHandler.handleOperationError(operation, error, {
            severity: 'warn',
            context,
            rethrow: false,
        });
    }
    /**
     * Execute operation with error handling
     * Wraps operation in try-catch with standardized error handling
     */
    async safeExecute(operation, operationName, context) {
        try {
            return await operation();
        }
        catch (error) {
            this.handleError(error, operationName, context);
            return undefined;
        }
    }
    /**
     * Check if property exists on message
     * Type-safe property check
     */
    hasProperty(msg, prop) {
        return prop in msg;
    }
    /**
     * Extract typed property from message
     * Returns undefined if property doesn't exist
     */
    getProperty(msg, prop) {
        if (this.hasProperty(msg, prop)) {
            return msg[prop];
        }
        return undefined;
    }
    /**
     * Extract required property from message
     * Logs warning if property is missing
     */
    getRequiredProperty(msg, prop) {
        const value = this.getProperty(msg, prop);
        if (value === undefined) {
            this.logger.warn(`Required property '${prop}' missing from message`);
        }
        return value;
    }
    /**
     * Clean up resources
     * Override in subclasses if custom cleanup is needed
     */
    dispose() {
        // Default implementation - no cleanup needed
        // Subclasses can override for custom cleanup
    }
}
exports.BaseMessageHandler = BaseMessageHandler;
/**
 * Registry-based Message Handler
 *
 * Alternative base class that uses CommandRegistry for automatic dispatch.
 * Eliminates switch-case patterns by using a registry-based approach.
 *
 * @example
 * class MyHandler extends RegistryBasedMessageHandler {
 *   protected registerHandlers(): void {
 *     this.registerCommand('myCommand1', (msg, coord) => this.handleMyCommand1(msg, coord));
 *     this.registerCommand('myCommand2', (msg, coord) => this.handleMyCommand2(msg, coord));
 *   }
 * }
 */
class RegistryBasedMessageHandler {
    constructor(messageQueue, logger) {
        this.messageQueue = messageQueue;
        this.logger = logger;
        this.registry = new CommandRegistry_1.CommandRegistry();
        this.registerHandlers();
    }
    /**
     * Handle incoming message by dispatching to registered handlers
     */
    async handleMessage(msg, coordinator) {
        const command = msg.command;
        if (!command) {
            this.logger.warn('Message received without command property');
            return;
        }
        try {
            const handled = await this.registry.dispatch({
                command,
                msg,
                coordinator,
            });
            if (!handled) {
                this.logger.warn(`Unknown command: ${command}`);
            }
        }
        catch (error) {
            this.logger.error(`Error handling command ${command}:`, error);
            throw error;
        }
    }
    /**
     * Get list of supported commands
     */
    getSupportedCommands() {
        return this.registry.getCommands();
    }
    /**
     * Register a single command handler
     */
    registerCommand(command, handler, options) {
        this.registry.register(command, (context) => {
            const typedContext = context;
            return handler(typedContext.msg, typedContext.coordinator);
        }, options);
    }
    /**
     * Register multiple command handlers at once
     */
    registerCommands(handlers, options) {
        for (const [command, handler] of Object.entries(handlers)) {
            this.registerCommand(command, handler, options);
        }
    }
    /**
     * Register command aliases (multiple commands mapping to same handler)
     */
    registerAliases(commands, handler, options) {
        for (const command of commands) {
            this.registerCommand(command, handler, options);
        }
    }
    /**
     * Check if a command is registered
     */
    hasCommand(command) {
        return this.registry.has(command);
    }
    /**
     * Get handler statistics
     */
    getStats() {
        return this.registry.getStats();
    }
    /**
     * Extract typed property from message
     */
    getProperty(msg, prop) {
        if (prop in msg) {
            return msg[prop];
        }
        return undefined;
    }
    /**
     * Handle errors with standardized ErrorHandler
     */
    handleError(error, operation, context) {
        ErrorHandler_1.ErrorHandler.handleOperationError(operation, error, {
            severity: 'error',
            context,
            rethrow: false,
        });
    }
    /**
     * Dispose resources
     */
    dispose() {
        this.registry.clear();
    }
}
exports.RegistryBasedMessageHandler = RegistryBasedMessageHandler;
//# sourceMappingURL=BaseMessageHandler.js.map