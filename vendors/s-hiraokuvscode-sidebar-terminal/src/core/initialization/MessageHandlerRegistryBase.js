"use strict";
/**
 * Message Handler Registry Base
 *
 * Abstract base class for registering and managing message handlers.
 * Consolidates message handling patterns across:
 * - SecondaryTerminalProvider (webview message listener)
 * - WebviewCoordinator (command-to-handler mappings)
 * - LightweightTerminalWebviewManager (event handler setup)
 *
 * Provides:
 * - Centralized handler registration
 * - Command-to-handler mapping
 * - Handler validation
 * - Duplicate handler detection
 *
 * @see https://github.com/s-hiraoku/vscode-sidebar-terminal/issues/218
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageHandlerRegistryBase = void 0;
const logger_1 = require("../../utils/logger");
/**
 * Abstract base class for message handler registration
 */
class MessageHandlerRegistryBase {
    constructor() {
        this.handlers = new Map();
        this._registrationMetrics = {
            totalHandlers: 0,
            commandCount: 0,
            duplicateAttempts: 0,
            validationFailures: 0,
        };
    }
    /**
     * Template Method - Register all handlers
     *
     * This method should NOT be overridden by subclasses.
     * Instead, implement registerCoreHandlers() and registerSpecializedHandlers().
     */
    registerAllHandlers(options) {
        const opts = {
            allowOverride: false,
            validate: true,
            logRegistration: false,
            ...options,
        };
        try {
            this.logRegistration('Starting handler registration...');
            // Register core handlers (required)
            this.registerCoreHandlers();
            // Register specialized handlers (optional)
            this.registerSpecializedHandlers();
            // Validate registered handlers
            if (opts.validate) {
                this.validateHandlers();
            }
            this._registrationMetrics.totalHandlers = this.handlers.size;
            this.logRegistration(`Registration complete: ${this.handlers.size} handlers for ${this._registrationMetrics.commandCount} commands`);
        }
        catch (error) {
            this.logError('Handler registration failed', error);
            throw error;
        }
    }
    /**
     * Dispatch a message to the appropriate handler
     */
    async dispatch(message, context, commandExtractor) {
        const command = commandExtractor ? commandExtractor(message) : this.extractCommand(message);
        const handler = this.handlers.get(command);
        if (!handler) {
            this.handleUnknownCommand(command, message);
            return;
        }
        try {
            await handler(message, context);
        }
        catch (error) {
            this.handleDispatchError(command, message, error);
        }
    }
    /**
     * Get registered command list
     */
    getRegisteredCommands() {
        return Array.from(this.handlers.keys());
    }
    /**
     * Check if a command is registered
     */
    hasHandler(command) {
        return this.handlers.has(command);
    }
    /**
     * Get handler metrics
     */
    getMetrics() {
        return { ...this._registrationMetrics };
    }
    // ============================================================================
    // HOOK METHODS - Optional overrides with default implementations
    // ============================================================================
    /**
     * Register specialized handlers (optional)
     *
     * Override to add context-specific handlers.
     *
     * Example:
     * - WebviewCoordinator: Register CLI agent, profile handlers
     */
    registerSpecializedHandlers() {
        // Default: No-op
    }
    /**
     * Validate registered handlers
     *
     * Override to implement custom validation logic.
     *
     * Example:
     * - Check that all required commands have handlers
     * - Verify handler function signatures
     */
    validateHandlers() {
        // Default: Basic validation (at least one handler registered)
        if (this.handlers.size === 0) {
            throw new Error('No handlers registered');
        }
    }
    /**
     * Handle unknown command
     *
     * Override to implement custom unknown command handling.
     *
     * Example:
     * - Log warning
     * - Send error message back to sender
     */
    handleUnknownCommand(command, _message) {
        this.logWarning(`Unknown command: ${String(command)}`);
    }
    /**
     * Handle dispatch error
     *
     * Override to implement custom error handling.
     *
     * Example:
     * - Log error with context
     * - Send error notification
     * - Retry with fallback handler
     */
    handleDispatchError(command, message, error) {
        this.logError(`Error dispatching command '${String(command)}'`, error);
    }
    // ============================================================================
    // CONCRETE UTILITY METHODS - Reusable (DO NOT override)
    // ============================================================================
    /**
     * Register a single handler for one command
     */
    registerHandler(command, handler, options) {
        const opts = {
            allowOverride: false,
            validate: true,
            logRegistration: false,
            ...options,
        };
        // Check for duplicate registration
        if (this.handlers.has(command) && !opts.allowOverride) {
            this._registrationMetrics.duplicateAttempts++;
            this.logWarning(`Handler already registered for command '${String(command)}' (skipped)`);
            return;
        }
        // Validate handler
        if (opts.validate && !this.isValidHandler(handler)) {
            this._registrationMetrics.validationFailures++;
            throw new Error(`Invalid handler for command '${String(command)}'`);
        }
        // Register handler
        this.handlers.set(command, handler);
        this._registrationMetrics.commandCount++;
        if (opts.logRegistration) {
            this.logRegistration(`Registered handler for command '${String(command)}'`);
        }
    }
    /**
     * Register a handler for multiple commands
     *
     * Convenience method for registering the same handler for multiple commands.
     *
     * Example:
     * ```typescript
     * this.register(
     *   ['init', 'output', 'terminalCreated'],
     *   (message, context) => this.lifecycleHandler.handleMessage(message, context)
     * );
     * ```
     */
    register(commands, handler, options) {
        commands.forEach((command) => this.registerHandler(command, handler, options));
    }
    /**
     * Unregister a handler
     */
    unregisterHandler(command) {
        const deleted = this.handlers.delete(command);
        if (deleted) {
            this._registrationMetrics.commandCount--;
        }
        return deleted;
    }
    /**
     * Clear all handlers
     */
    clearHandlers() {
        this.handlers.clear();
        this._registrationMetrics.commandCount = 0;
        this._registrationMetrics.totalHandlers = 0;
    }
    /**
     * Validate handler function
     */
    isValidHandler(handler) {
        return typeof handler === 'function';
    }
    /**
     * Log registration information
     */
    logRegistration(message) {
        (0, logger_1.info)(`[HandlerRegistry] ${message}`);
    }
    /**
     * Log warning
     */
    logWarning(message) {
        (0, logger_1.warn)(`[HandlerRegistry] ${message}`);
    }
    /**
     * Log error
     */
    logError(message, error) {
        (0, logger_1.error)(`[HandlerRegistry] ${message}:`, error);
    }
}
exports.MessageHandlerRegistryBase = MessageHandlerRegistryBase;
//# sourceMappingURL=MessageHandlerRegistryBase.js.map