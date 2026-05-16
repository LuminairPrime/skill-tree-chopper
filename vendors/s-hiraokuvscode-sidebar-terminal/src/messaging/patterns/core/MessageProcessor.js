"use strict";
/**
 * Message Processor
 *
 * Facade that coordinates all message handling components.
 * Provides a single, simplified interface for message processing.
 *
 * This is the main entry point that consolidates:
 * - ConsolidatedMessageManager
 * - SecondaryTerminalMessageRouter
 * - MessageRouter
 * - UnifiedMessageDispatcher
 * - ConsolidatedMessageService
 *
 * Related to: GitHub Issue #219
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageProcessor = void 0;
exports.createMessageProcessor = createMessageProcessor;
const MessageHandlerRegistry_1 = require("./MessageHandlerRegistry");
const MessageLogger_1 = require("./MessageLogger");
const MessageValidator_1 = require("./MessageValidator");
/**
 * Message processor facade
 */
class MessageProcessor {
    constructor(config = {}) {
        this.initialized = false;
        // Initialize logger
        this.logger =
            config.logger ||
                (0, MessageLogger_1.createMessageLogger)({
                    minLevel: config.logLevel ?? MessageLogger_1.LogLevel.INFO,
                });
        // Initialize validator
        this.validator = config.validator || (0, MessageValidator_1.createMessageValidator)();
        // Initialize registry
        this.registry = new MessageHandlerRegistry_1.MessageHandlerRegistry(this.logger, this.validator);
        // Store coordinator
        this.coordinator = config.coordinator;
        // Store configuration
        this.config = {
            enableValidation: config.enableValidation ?? true,
            enableLogging: config.enableLogging ?? true,
            logLevel: config.logLevel ?? MessageLogger_1.LogLevel.INFO,
            handlerTimeout: config.handlerTimeout ?? 30000, // 30 seconds default
        };
        this.logger.info('MessageProcessor', 'Message processor created');
    }
    /**
     * Initialize the processor
     */
    async initialize(coordinator) {
        if (this.initialized) {
            this.logger.warn('MessageProcessor', 'Already initialized');
            return;
        }
        if (coordinator) {
            this.coordinator = coordinator;
        }
        this.initialized = true;
        this.logger.info('MessageProcessor', 'Message processor initialized');
    }
    /**
     * Register a message handler
     */
    registerHandler(handler) {
        this.registry.register(handler);
    }
    /**
     * Register multiple handlers at once
     */
    registerHandlers(handlers) {
        for (const handler of handlers) {
            this.registry.register(handler);
        }
    }
    /**
     * Unregister a message handler
     */
    unregisterHandler(handler) {
        this.registry.unregister(handler);
    }
    /**
     * Process a message
     */
    async processMessage(message) {
        if (!this.initialized) {
            this.logger.warn('MessageProcessor', 'Processor not initialized');
            return {
                success: false,
                handledBy: 'none',
                processingTime: 0,
                error: 'Processor not initialized',
            };
        }
        // Create handler context
        const context = {
            coordinator: this.coordinator,
            log: (level, message, ...args) => {
                switch (level) {
                    case 'debug':
                        this.logger.debug('MessageHandler', message, args);
                        break;
                    case 'info':
                        this.logger.info('MessageHandler', message, args);
                        break;
                    case 'warn':
                        this.logger.warn('MessageHandler', message, args);
                        break;
                    case 'error':
                        this.logger.error('MessageHandler', message, args);
                        break;
                }
            },
            postMessage: this.coordinator
                ? async (msg) => {
                    this.coordinator.postMessageToExtension(msg);
                    return true;
                }
                : async (_msg) => false,
            metadata: {},
        };
        // Dispatch options
        const options = {
            validate: this.config.enableValidation,
            enableLogging: this.config.enableLogging,
            timeout: this.config.handlerTimeout,
        };
        // Dispatch to registry
        return await this.registry.dispatch(message, context, options);
    }
    /**
     * Process multiple messages in batch
     */
    async processMessages(messages) {
        return Promise.all(messages.map((msg) => this.processMessage(msg)));
    }
    /**
     * Check if a command has a registered handler
     */
    hasHandler(command) {
        return this.registry.hasHandler(command);
    }
    /**
     * Get all registered commands
     */
    getRegisteredCommands() {
        return this.registry.getRegisteredCommands();
    }
    /**
     * Get handlers for a specific command
     */
    getHandlersForCommand(command) {
        return this.registry.getHandlersForCommand(command);
    }
    /**
     * Get processor statistics
     */
    getStats() {
        const registryStats = this.registry.getStats();
        return {
            ...registryStats,
            isInitialized: this.initialized,
            registeredCommands: this.getRegisteredCommands(),
        };
    }
    /**
     * Set coordinator (for late binding)
     */
    setCoordinator(coordinator) {
        this.coordinator = coordinator;
        this.logger.info('MessageProcessor', 'Coordinator set');
    }
    /**
     * Get the logger instance
     */
    getLogger() {
        return this.logger;
    }
    /**
     * Get the validator instance
     */
    getValidator() {
        return this.validator;
    }
    /**
     * Get the registry instance
     */
    getRegistry() {
        return this.registry;
    }
    /**
     * Update configuration
     */
    updateConfig(config) {
        if (config.coordinator !== undefined) {
            this.coordinator = config.coordinator;
        }
        if (config.enableValidation !== undefined) {
            this.config.enableValidation = config.enableValidation;
        }
        if (config.enableLogging !== undefined) {
            this.config.enableLogging = config.enableLogging;
        }
        if (config.logLevel !== undefined) {
            this.config.logLevel = config.logLevel;
            this.logger.setMinLevel(config.logLevel);
        }
        if (config.handlerTimeout !== undefined) {
            this.config.handlerTimeout = config.handlerTimeout;
        }
        this.logger.info('MessageProcessor', 'Configuration updated', config);
    }
    /**
     * Clear all handlers
     */
    clearHandlers() {
        this.registry.clear();
        this.logger.info('MessageProcessor', 'All handlers cleared');
    }
    /**
     * Reset the processor to initial state
     */
    reset() {
        this.clearHandlers();
        this.initialized = false;
        this.coordinator = undefined;
        this.logger.info('MessageProcessor', 'Processor reset');
    }
    /**
     * Dispose the processor and clean up resources
     */
    dispose() {
        this.registry.dispose();
        this.initialized = false;
        this.coordinator = undefined;
        this.logger.info('MessageProcessor', 'Processor disposed');
    }
}
exports.MessageProcessor = MessageProcessor;
/**
 * Create a pre-configured message processor
 */
function createMessageProcessor(config) {
    return new MessageProcessor(config);
}
//# sourceMappingURL=MessageProcessor.js.map