"use strict";
/**
 * MessageHandlerFactory - Centralized message handling to reduce duplication
 * Factory pattern for creating consistent message handlers across managers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageHandlerFactory = void 0;
const logger_1 = require("../../utils/logger");
const ValidationUtils_1 = require("../utils/ValidationUtils");
/**
 * Centralized factory for creating consistent message handlers
 */
class MessageHandlerFactory {
    /**
     * Register a message handler
     */
    static registerHandler(config, handler) {
        if (this.handlers.has(config.command)) {
            (0, logger_1.webview)(`⚠️ ${this.defaultLogPrefix} Handler for command '${config.command}' already exists, overriding`);
        }
        this.handlers.set(config.command, {
            config: {
                requiresCoordinator: true,
                async: false,
                logPrefix: this.defaultLogPrefix,
                ...config,
            },
            handler,
        });
        (0, logger_1.webview)(`✅ ${this.defaultLogPrefix} Registered handler for command: ${config.command}`);
    }
    /**
     * Create a standardized message processor
     */
    static createMessageProcessor(coordinator, logPrefix = this.defaultLogPrefix) {
        return async (message) => {
            // Basic message validation
            const basicValidation = this.validateBasicMessage(message);
            if (!basicValidation.isValid) {
                (0, logger_1.webview)(`❌ ${logPrefix} ${basicValidation.error}`);
                throw new Error(basicValidation.error);
            }
            const command = message.command;
            const entry = this.handlers.get(command);
            if (!entry) {
                (0, logger_1.webview)(`⚠️ ${logPrefix} No handler registered for command: ${command}`);
                return this.createDefaultResponse(command, 'No handler registered');
            }
            const { config, handler } = entry;
            try {
                // Validate coordinator requirement
                if (config.requiresCoordinator && !coordinator) {
                    throw new Error(`Handler for '${command}' requires coordinator but none provided`);
                }
                // Run custom validation if provided
                if (config.validator) {
                    const validation = config.validator(message);
                    if (!validation.isValid) {
                        throw new Error(validation.error || 'Message validation failed');
                    }
                }
                // Execute handler
                (0, logger_1.webview)(`🔄 ${config.logPrefix} Processing command: ${command}`);
                const result = config.async
                    ? await handler(message, coordinator)
                    : handler(message, coordinator);
                (0, logger_1.webview)(`✅ ${config.logPrefix} Successfully processed command: ${command}`);
                return result;
            }
            catch (error) {
                const errorMessage = `Handler for '${command}' failed: ${String(error)}`;
                (0, logger_1.webview)(`❌ ${config.logPrefix} ${errorMessage}`);
                // Return error response instead of throwing to prevent cascading failures
                return this.createErrorResponse(command, errorMessage);
            }
        };
    }
    /**
     * Create a batch message processor for handling multiple messages
     */
    static createBatchProcessor(coordinator, logPrefix = this.defaultLogPrefix) {
        const singleProcessor = this.createMessageProcessor(coordinator, logPrefix);
        return async (messages) => {
            (0, logger_1.webview)(`📦 ${logPrefix} Processing batch of ${messages.length} messages`);
            const results = await Promise.allSettled(messages.map((msg) => singleProcessor(msg)));
            const successful = results.filter((r) => r.status === 'fulfilled').length;
            const failed = results.length - successful;
            (0, logger_1.webview)(`📊 ${logPrefix} Batch processing complete: ${successful} successful, ${failed} failed`);
            return results.map((result) => result.status === 'fulfilled'
                ? result.value
                : this.createErrorResponse('batch', result.reason));
        };
    }
    /**
     * Create a standardized queue processor
     */
    static createQueueProcessor(coordinator, options = {}) {
        const { maxConcurrent = 5, retryAttempts = 3, retryDelay = 1000, logPrefix = this.defaultLogPrefix, } = options;
        const queue = [];
        const processor = this.createMessageProcessor(coordinator, logPrefix);
        let processing = false;
        const processQueue = async () => {
            if (processing || queue.length === 0)
                return;
            processing = true;
            (0, logger_1.webview)(`🔄 ${logPrefix} Processing queue of ${queue.length} messages`);
            const concurrent = Math.min(maxConcurrent, queue.length);
            const batch = queue.splice(0, concurrent);
            await Promise.all(batch.map(async (item) => {
                try {
                    const result = await processor(item.message);
                    item.resolve(result);
                }
                catch (error) {
                    item.attempts--;
                    if (item.attempts > 0) {
                        (0, logger_1.webview)(`🔄 ${logPrefix} Retrying message, ${item.attempts} attempts remaining`);
                        setTimeout(() => {
                            queue.unshift(item);
                            processQueue();
                        }, retryDelay);
                    }
                    else {
                        item.reject(error instanceof Error ? error : new Error(String(error)));
                    }
                }
            }));
            processing = false;
            // Process remaining queue
            if (queue.length > 0) {
                setTimeout(processQueue, 0);
            }
        };
        return {
            process: (message) => {
                return new Promise((resolve, reject) => {
                    queue.push({
                        message,
                        resolve,
                        reject,
                        attempts: retryAttempts,
                    });
                    processQueue();
                });
            },
            processQueue,
            getQueueSize: () => queue.length,
            clearQueue: () => {
                queue.length = 0;
                processing = false;
            },
        };
    }
    /**
     * Create common validators
     */
    static createCommonValidators() {
        return {
            terminalId: (message) => {
                return ValidationUtils_1.ValidationUtils.validateTerminalId(message.terminalId);
            },
            requiredData: (message) => {
                if (!message.data) {
                    return { isValid: false, error: 'Message data is required' };
                }
                return { isValid: true, value: message.data };
            },
            settings: (message) => {
                return ValidationUtils_1.ValidationUtils.validateTerminalSettings(message.settings);
            },
            terminalOutput: (message) => {
                const dataValidation = ValidationUtils_1.ValidationUtils.sanitizeData(message.data, 1024 * 1024); // 1MB limit
                if (!dataValidation.isValid) {
                    return dataValidation;
                }
                if (message.terminalId) {
                    const idValidation = ValidationUtils_1.ValidationUtils.validateTerminalId(message.terminalId);
                    if (!idValidation.isValid) {
                        return idValidation;
                    }
                }
                return { isValid: true };
            },
        };
    }
    /**
     * Get registered handlers summary
     */
    static getHandlersSummary() {
        return Array.from(this.handlers.entries()).map(([command, entry]) => ({
            command,
            config: entry.config,
        }));
    }
    /**
     * Clear all registered handlers (useful for testing)
     */
    static clearHandlers() {
        this.handlers.clear();
        (0, logger_1.webview)(`🧹 ${this.defaultLogPrefix} Cleared all registered handlers`);
    }
    /**
     * Basic message validation
     */
    static validateBasicMessage(message) {
        if (!message || typeof message !== 'object') {
            return { isValid: false, error: 'Message must be an object' };
        }
        const msg = message;
        if (!msg.command || typeof msg.command !== 'string') {
            return { isValid: false, error: 'Message must have a string command' };
        }
        return { isValid: true };
    }
    /**
     * Create standardized default response
     */
    static createDefaultResponse(command, message) {
        return {
            success: false,
            command,
            error: message,
            timestamp: Date.now(),
        };
    }
    /**
     * Create standardized error response
     */
    static createErrorResponse(command, error) {
        return {
            success: false,
            command,
            error,
            timestamp: Date.now(),
        };
    }
}
exports.MessageHandlerFactory = MessageHandlerFactory;
MessageHandlerFactory.handlers = new Map();
MessageHandlerFactory.defaultLogPrefix = '[MESSAGE_HANDLER]';
//# sourceMappingURL=MessageHandlerFactory.js.map