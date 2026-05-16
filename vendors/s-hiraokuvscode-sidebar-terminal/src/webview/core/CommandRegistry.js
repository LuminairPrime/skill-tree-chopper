"use strict";
/**
 * Command Registry - Unified Message/Command Routing
 *
 * Provides centralized command handler registration and dispatch.
 * Eliminates duplicate switch-case routing across 8+ message handlers.
 *
 * Key Features:
 * - Type-safe command registration
 * - Priority-based handler execution
 * - Category grouping for related commands
 * - Middleware support for cross-cutting concerns
 * - Bulk registration for cleaner code
 *
 * @example
 * ```typescript
 * const registry = new CommandRegistry();
 *
 * // Register single handler
 * registry.register('terminalCreated', async (msg) => {
 *   await handleTerminalCreated(msg);
 * }, { priority: 'high', category: 'lifecycle' });
 *
 * // Bulk registration
 * registry.registerBulk({
 *   'terminalCreated': handleTerminalCreated,
 *   'terminalDeleted': handleTerminalDeleted,
 *   'terminalOutput': handleTerminalOutput,
 * });
 *
 * // Dispatch
 * const handled = await registry.dispatch(message);
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandRegistry = void 0;
exports.createLoggingMiddleware = createLoggingMiddleware;
exports.createPerformanceMiddleware = createPerformanceMiddleware;
const logger_1 = require("../../utils/logger");
const webview_1 = require("../constants/webview");
/**
 * Priority value mapping
 */
const PRIORITY_VALUES = {
    high: 0,
    normal: 50,
    low: 100,
};
/**
 * Command Registry for unified message routing
 */
class CommandRegistry {
    constructor() {
        this.handlers = new Map();
        this.middlewares = [];
        this.categories = new Map();
    }
    /**
     * Register a command handler
     *
     * @param command Command name to handle
     * @param handler Handler function
     * @param options Registration options
     */
    register(command, handler, options = {}) {
        const priorityValue = PRIORITY_VALUES[options.priority ?? 'normal'] ?? PRIORITY_VALUES.normal;
        const registered = {
            handler: handler,
            options,
            priorityValue,
        };
        // Get or create handlers array for this command
        let commandHandlers = this.handlers.get(command);
        if (!commandHandlers) {
            commandHandlers = [];
            this.handlers.set(command, commandHandlers);
        }
        // Insert in priority order
        const insertIndex = commandHandlers.findIndex((h) => h.priorityValue > priorityValue);
        if (insertIndex === -1) {
            commandHandlers.push(registered);
        }
        else {
            commandHandlers.splice(insertIndex, 0, registered);
        }
        // Track category
        if (options.category) {
            let categoryCommands = this.categories.get(options.category);
            if (!categoryCommands) {
                categoryCommands = new Set();
                this.categories.set(options.category, categoryCommands);
            }
            categoryCommands.add(command);
        }
        (0, logger_1.webview)(`[CommandRegistry] ✅ Registered: ${command}${options.category ? ` [${options.category}]` : ''}`);
    }
    /**
     * Register multiple handlers at once
     *
     * @param handlers Object mapping command names to handlers
     * @param commonOptions Options applied to all handlers
     */
    registerBulk(handlers, commonOptions = {}) {
        for (const [command, handler] of Object.entries(handlers)) {
            this.register(command, handler, commonOptions);
        }
        (0, logger_1.webview)(`[CommandRegistry] ✅ Bulk registered ${Object.keys(handlers).length} handlers`);
    }
    /**
     * Unregister a command handler
     */
    unregister(command) {
        const existed = this.handlers.has(command);
        this.handlers.delete(command);
        // Remove from categories
        for (const categoryCommands of this.categories.values()) {
            categoryCommands.delete(command);
        }
        if (existed) {
            (0, logger_1.webview)(`[CommandRegistry] 🗑️ Unregistered: ${command}`);
        }
        return existed;
    }
    /**
     * Add middleware for cross-cutting concerns
     *
     * @param middleware Middleware function
     */
    use(middleware) {
        this.middlewares.push(middleware);
        (0, logger_1.webview)(`[CommandRegistry] ✅ Added middleware (total: ${this.middlewares.length})`);
    }
    /**
     * Dispatch a message to registered handlers
     *
     * @param message Message to dispatch
     * @returns true if handled, false if no handler found
     */
    async dispatch(message) {
        const handlers = this.handlers.get(message.command);
        if (!handlers || handlers.length === 0) {
            return false;
        }
        const context = {
            registry: this,
            data: {},
        };
        // Build middleware chain
        const executeHandlers = async () => {
            for (const registered of handlers) {
                try {
                    await registered.handler(message, context);
                }
                catch (error) {
                    (0, logger_1.webview)(`[CommandRegistry] ❌ Handler error for ${message.command}:`, error);
                    if (!registered.options.continueOnError) {
                        throw error;
                    }
                }
            }
        };
        // Execute with middleware
        try {
            await this.executeWithMiddleware(message, context, executeHandlers);
            return true;
        }
        catch (error) {
            (0, logger_1.webview)(`[CommandRegistry] ❌ Dispatch failed for ${message.command}:`, error);
            throw error;
        }
    }
    /**
     * Execute handler chain with middleware
     */
    async executeWithMiddleware(message, context, handlers) {
        if (this.middlewares.length === 0) {
            await handlers();
            return;
        }
        // Build middleware chain
        let index = 0;
        const next = async () => {
            if (index < this.middlewares.length) {
                const middleware = this.middlewares[index++];
                if (middleware) {
                    await middleware(message, context, next);
                }
            }
            else {
                await handlers();
            }
        };
        await next();
    }
    /**
     * Check if a command has registered handlers
     */
    has(command) {
        return this.handlers.has(command) && (this.handlers.get(command)?.length ?? 0) > 0;
    }
    /**
     * Get all commands in a category
     */
    getByCategory(category) {
        return Array.from(this.categories.get(category) ?? []);
    }
    /**
     * Get all registered commands
     */
    getCommands() {
        return Array.from(this.handlers.keys());
    }
    /**
     * Get statistics about registered handlers
     */
    getStats() {
        let totalHandlers = 0;
        for (const handlers of this.handlers.values()) {
            totalHandlers += handlers.length;
        }
        return {
            totalCommands: this.handlers.size,
            totalHandlers,
            categories: Array.from(this.categories.keys()),
            middlewareCount: this.middlewares.length,
        };
    }
    /**
     * Clear all registrations
     */
    clear() {
        this.handlers.clear();
        this.categories.clear();
        this.middlewares.length = 0;
        (0, logger_1.webview)('[CommandRegistry] 🧹 Cleared all registrations');
    }
}
exports.CommandRegistry = CommandRegistry;
/**
 * Create common middleware for logging
 */
function createLoggingMiddleware(logger = logger_1.webview) {
    return async (message, context, next) => {
        const startTime = performance.now();
        logger(`[Command] → ${message.command}`);
        try {
            await next();
            const elapsed = performance.now() - startTime;
            logger(`[Command] ✅ ${message.command} (${elapsed.toFixed(2)}ms)`);
        }
        catch (error) {
            const elapsed = performance.now() - startTime;
            logger(`[Command] ❌ ${message.command} failed (${elapsed.toFixed(2)}ms):`, error);
            throw error;
        }
    };
}
/**
 * Create common middleware for performance tracking
 */
function createPerformanceMiddleware(threshold = webview_1.COMMAND_REGISTRY_CONSTANTS.SLOW_COMMAND_THRESHOLD_MS) {
    return async (message, context, next) => {
        const startTime = performance.now();
        await next();
        const elapsed = performance.now() - startTime;
        if (elapsed > threshold) {
            (0, logger_1.webview)(`[Command] ⚠️ Slow command: ${message.command} (${elapsed.toFixed(2)}ms)`);
        }
    };
}
//# sourceMappingURL=CommandRegistry.js.map