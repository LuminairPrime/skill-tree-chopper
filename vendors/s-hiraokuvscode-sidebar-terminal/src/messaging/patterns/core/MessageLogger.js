"use strict";
/**
 * Message Logger
 *
 * Unified logging system for message handling.
 * Consolidates logging patterns from:
 * - messageLogger (webview/utils/ManagerLogger)
 * - provider logger (utils/logger)
 * - Inline console.log statements
 *
 * Related to: GitHub Issue #219
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageLogger = exports.ChildMessageLogger = exports.MessageLogger = exports.LogLevel = void 0;
exports.createMessageLogger = createMessageLogger;
/**
 * Log levels
 */
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["NONE"] = 4] = "NONE";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * Unified message logger
 */
class MessageLogger {
    constructor(config = {}) {
        this.history = [];
        this.levelNames = {
            [LogLevel.DEBUG]: 'DEBUG',
            [LogLevel.INFO]: 'INFO',
            [LogLevel.WARN]: 'WARN',
            [LogLevel.ERROR]: 'ERROR',
            [LogLevel.NONE]: 'NONE',
        };
        this.levelEmojis = {
            [LogLevel.DEBUG]: '🔍',
            [LogLevel.INFO]: 'ℹ️',
            [LogLevel.WARN]: '⚠️',
            [LogLevel.ERROR]: '❌',
            [LogLevel.NONE]: '',
        };
        this.config = {
            minLevel: config.minLevel ?? LogLevel.WARN,
            includeTimestamp: config.includeTimestamp ?? true,
            includeSource: config.includeSource ?? true,
            maxHistorySize: config.maxHistorySize ?? 1000,
            outputFn: config.outputFn,
        };
    }
    /**
     * Log debug message
     */
    debug(source, message, data) {
        this.log(LogLevel.DEBUG, source, message, data);
    }
    /**
     * Log info message
     */
    info(source, message, data) {
        this.log(LogLevel.INFO, source, message, data);
    }
    /**
     * Log warning message
     */
    warn(source, message, data) {
        this.log(LogLevel.WARN, source, message, data);
    }
    /**
     * Log error message
     */
    error(source, message, error) {
        this.log(LogLevel.ERROR, source, message, error);
    }
    /**
     * Log message received
     */
    logMessageReceived(source, message) {
        this.debug(source, `Message received: ${message.command}`, {
            command: message.command,
            timestamp: Date.now(),
        });
    }
    /**
     * Log message sent
     */
    logMessageSent(source, message) {
        const command = message?.command || 'unknown';
        this.debug(source, `Message sent: ${command}`, { command, timestamp: Date.now() });
    }
    /**
     * Log message handling started
     */
    logHandlingStarted(source, message, handlerName) {
        this.info(source, `Handler '${handlerName}' processing: ${message.command}`, {
            command: message.command,
            handler: handlerName,
        });
    }
    /**
     * Log message handling completed
     */
    logHandlingCompleted(source, message, handlerName, processingTime) {
        this.info(source, `Handler '${handlerName}' completed: ${message.command} in ${processingTime}ms`, { command: message.command, handler: handlerName, processingTime });
    }
    /**
     * Log message handling failed
     */
    logHandlingFailed(source, message, handlerName, error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.error(source, `Handler '${handlerName}' failed for ${message.command}: ${errorMessage}`, error);
    }
    /**
     * Log validation error
     */
    logValidationError(source, message, error) {
        this.error(source, `Validation failed for ${message.command}: ${error}`, {
            command: message.command,
            error,
        });
    }
    /**
     * Core log method
     */
    log(level, source, message, data) {
        // Skip if below minimum level
        if (level < this.config.minLevel) {
            return;
        }
        const entry = {
            level,
            timestamp: Date.now(),
            source,
            message,
            data,
        };
        // Add to history
        this.history.push(entry);
        if (this.history.length > this.config.maxHistorySize) {
            this.history.shift();
        }
        // Output
        if (this.config.outputFn) {
            this.config.outputFn(entry);
        }
        else {
            this.defaultOutput(entry);
        }
    }
    /**
     * Default console output
     */
    defaultOutput(entry) {
        const parts = [];
        // Emoji
        const emoji = this.levelEmojis[entry.level];
        if (emoji) {
            parts.push(emoji);
        }
        // Timestamp
        if (this.config.includeTimestamp) {
            const date = new Date(entry.timestamp);
            parts.push(`[${date.toISOString()}]`);
        }
        // Level
        parts.push(`[${this.levelNames[entry.level]}]`);
        // Source
        if (this.config.includeSource) {
            parts.push(`[${entry.source}]`);
        }
        // Message
        parts.push(entry.message);
        const fullMessage = parts.join(' ');
        // Use appropriate console method
        switch (entry.level) {
            case LogLevel.DEBUG:
                break;
            case LogLevel.INFO:
                break;
            case LogLevel.WARN:
                console.warn(fullMessage, entry.data);
                break;
            case LogLevel.ERROR:
                console.error(fullMessage, entry.data);
                break;
        }
    }
    /**
     * Get log history
     */
    getHistory() {
        return [...this.history];
    }
    /**
     * Clear log history
     */
    clearHistory() {
        this.history.length = 0;
    }
    /**
     * Set minimum log level
     */
    setMinLevel(level) {
        this.config.minLevel = level;
    }
    /**
     * Create a child logger with a specific source prefix
     */
    createChild(sourcePrefix) {
        return new ChildMessageLogger(this, sourcePrefix);
    }
}
exports.MessageLogger = MessageLogger;
/**
 * Child logger that automatically prefixes sources
 */
class ChildMessageLogger {
    constructor(parent, sourcePrefix) {
        this.parent = parent;
        this.sourcePrefix = sourcePrefix;
    }
    debug(message, data) {
        this.parent.debug(this.sourcePrefix, message, data);
    }
    info(message, data) {
        this.parent.info(this.sourcePrefix, message, data);
    }
    warn(message, data) {
        this.parent.warn(this.sourcePrefix, message, data);
    }
    error(message, error) {
        this.parent.error(this.sourcePrefix, message, error);
    }
}
exports.ChildMessageLogger = ChildMessageLogger;
/**
 * Create a default message logger instance
 */
function createMessageLogger(config) {
    return new MessageLogger(config);
}
/**
 * Singleton message logger instance
 */
exports.messageLogger = createMessageLogger({
    minLevel: LogLevel.DEBUG,
    includeTimestamp: true,
    includeSource: true,
});
//# sourceMappingURL=MessageLogger.js.map