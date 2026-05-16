"use strict";
/**
 * Message Router Service
 * Simplifies message handling extracted from SecondaryTerminalProvider
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseMessageHandler = exports.MessageRouterFactory = exports.MessageRouter = void 0;
const logger_1 = require("../utils/logger");
/**
 * Central message routing service
 * Handles all message routing with proper error handling and logging
 */
class MessageRouter {
    constructor(config) {
        this.handlers = new Map();
        this.activeHandlers = new Set();
        this.messageCounter = 0;
        this.disposed = false;
        this.config = config;
    }
    /**
     * Register a message handler for a specific command
     */
    registerHandler(command, handler) {
        if (this.disposed) {
            this.log(`Cannot register handler for '${command}': MessageRouter is disposed`);
            return;
        }
        if (this.handlers.has(command)) {
            throw new Error(`Handler for command '${command}' is already registered`);
        }
        this.handlers.set(command, handler);
        this.log(`Handler registered for command: ${command}`);
    }
    /**
     * Unregister a message handler
     */
    unregisterHandler(command) {
        if (this.disposed) {
            return false;
        }
        const removed = this.handlers.delete(command);
        if (removed) {
            this.log(`Handler unregistered for command: ${command}`);
        }
        return removed;
    }
    /**
     * Route a message to the appropriate handler
     */
    async routeMessage(command, data) {
        const startTime = performance.now();
        if (this.disposed) {
            return this.createErrorResult('MessageRouter is disposed', 0);
        }
        const messageId = `msg-${++this.messageCounter}`;
        this.log(`Routing message: ${command} (${messageId})`);
        // Check if we're at the concurrent handler limit
        if (this.activeHandlers.size >= this.config.maxConcurrentHandlers) {
            return this.createErrorResult(`Maximum concurrent handlers reached (${this.config.maxConcurrentHandlers})`, performance.now() - startTime);
        }
        // Find handler
        const handler = this.handlers.get(command);
        if (!handler) {
            return this.createErrorResult(`No handler registered for command: ${command}`, performance.now() - startTime);
        }
        // Validate data if required
        if (this.config.enableValidation && !this.validateMessageData(command, data)) {
            return this.createErrorResult(`Invalid data for command: ${command}`, performance.now() - startTime);
        }
        this.activeHandlers.add(messageId);
        try {
            // Execute handler with timeout
            const result = await this.executeWithTimeout(() => handler.handle(data), this.config.timeoutMs);
            const duration = performance.now() - startTime;
            this.log(`Message handled successfully: ${command} (${duration.toFixed(2)}ms)`);
            return {
                success: true,
                data: result,
                duration,
            };
        }
        catch (error) {
            const duration = performance.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.log(`Message handling failed: ${command} - ${errorMessage}`);
            return this.createErrorResult(errorMessage, duration);
        }
        finally {
            this.activeHandlers.delete(messageId);
        }
    }
    /**
     * Get all registered commands
     */
    getRegisteredCommands() {
        return Array.from(this.handlers.keys());
    }
    /**
     * Get active handler count
     */
    getActiveHandlerCount() {
        return this.activeHandlers.size;
    }
    /**
     * Check if a command has a registered handler
     */
    hasHandler(command) {
        return this.handlers.has(command);
    }
    /**
     * Clear all handlers
     */
    clearHandlers() {
        this.handlers.clear();
        this.log('All handlers cleared');
    }
    /**
     * Execute a function with timeout
     */
    async executeWithTimeout(fn, timeoutMs) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Handler timeout after ${timeoutMs}ms`));
            }, timeoutMs);
            Promise.resolve(fn())
                .then((result) => {
                clearTimeout(timeoutId);
                resolve(result);
            })
                .catch((error) => {
                clearTimeout(timeoutId);
                reject(error);
            });
        });
    }
    /**
     * Validate message data
     */
    validateMessageData(command, data) {
        // Basic validation - can be extended with more sophisticated validation
        switch (command) {
            case 'createTerminal':
            case 'deleteTerminal':
            case 'killTerminal':
                return typeof data === 'object';
            case 'terminalInput':
                return data && typeof data.terminalId === 'string' && typeof data.input === 'string';
            case 'terminalResize':
                return (data &&
                    typeof data.terminalId === 'string' &&
                    typeof data.cols === 'number' &&
                    typeof data.rows === 'number');
            default:
                return true; // Allow unknown commands by default
        }
    }
    /**
     * Create error result
     */
    createErrorResult(error, duration) {
        return {
            success: false,
            error,
            duration,
        };
    }
    /**
     * Log message if logging is enabled
     */
    log(message) {
        if (this.config.enableLogging) {
            (0, logger_1.log)(`[MessageRouter] ${message}`);
        }
    }
    /**
     * Dispose resources
     */
    dispose() {
        if (this.disposed) {
            return;
        }
        this.clearHandlers();
        this.activeHandlers.clear();
        this.disposed = true;
        this.log('Message router disposed');
    }
}
exports.MessageRouter = MessageRouter;
/**
 * Factory for creating message routers
 */
class MessageRouterFactory {
    static create(config = {}) {
        const defaultConfig = {
            enableLogging: true,
            enableValidation: true,
            timeoutMs: 30000, // 30 seconds
            maxConcurrentHandlers: 10,
        };
        return new MessageRouter({ ...defaultConfig, ...config });
    }
    static createDefault() {
        return MessageRouterFactory.create();
    }
}
exports.MessageRouterFactory = MessageRouterFactory;
/**
 * Abstract base class for message handlers
 */
class BaseMessageHandler {
    constructor(handlerName) {
        this.handlerName = handlerName;
    }
    log(message) {
        (0, logger_1.log)(`[${this.handlerName}] ${message}`);
    }
    validateRequired(data, fields) {
        for (const field of fields) {
            if (!(field in data) || data[field] === undefined || data[field] === null) {
                throw new Error(`Required field '${field}' is missing or null`);
            }
        }
    }
}
exports.BaseMessageHandler = BaseMessageHandler;
//# sourceMappingURL=MessageRouter.js.map