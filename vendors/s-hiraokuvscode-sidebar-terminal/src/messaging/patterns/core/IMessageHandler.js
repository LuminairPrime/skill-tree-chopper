"use strict";
/**
 * Message Handler Interfaces
 *
 * Base interfaces and classes for message handler pattern.
 * Provides common functionality for command handlers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseCommandHandler = void 0;
/**
 * Base class for command handlers
 * Provides common functionality like logging and validation
 */
class BaseCommandHandler {
    constructor(name, supportedCommands, priority = 50) {
        this.name = name;
        this.supportedCommands = supportedCommands;
        this.priority = priority;
    }
    /**
     * Get handler name (for compatibility with existing code)
     */
    getName() {
        return this.name;
    }
    /**
     * Get supported commands (for compatibility with existing code)
     */
    getSupportedCommands() {
        return this.supportedCommands;
    }
    /**
     * Get priority (for compatibility with existing code)
     */
    getPriority() {
        return this.priority;
    }
    /**
     * Check if this handler can process the message
     */
    canHandle(message, _context) {
        return this.supportedCommands.includes(message.command);
    }
    /**
     * Dispose resources (optional)
     */
    dispose() {
        // Override in subclasses if cleanup is needed
    }
    /**
     * Log a message using the context logger
     */
    log(context, level, message, ...args) {
        if (context.log) {
            context.log(level, `[${this.name}] ${message}`, ...args);
        }
    }
    /**
     * Validate required fields in message data
     */
    validateRequired(data, requiredFields) {
        if (!data) {
            return false;
        }
        return requiredFields.every((field) => field in data && data[field] !== undefined);
    }
    /**
     * Send success response
     */
    async sendSuccess(context, command, data) {
        await context.postMessage({
            command: `${command}Success`,
            ...data,
        });
    }
    /**
     * Send error response
     */
    async sendError(context, command, error) {
        const errorMessage = error instanceof Error ? error.message : error;
        await context.postMessage({
            command: `${command}Error`,
            error: errorMessage,
        });
    }
}
exports.BaseCommandHandler = BaseCommandHandler;
//# sourceMappingURL=IMessageHandler.js.map