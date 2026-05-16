"use strict";
/**
 * ManagerLogger Utility
 *
 * Standardized logging across all managers to eliminate duplicate logging patterns
 * and provide consistent log formatting with manager identification
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.containerLogger = exports.configLogger = exports.notificationLogger = exports.messageLogger = exports.splitLogger = exports.performanceLogger = exports.inputLogger = exports.uiLogger = exports.terminalLogger = exports.ManagerLogger = void 0;
const logger_1 = require("../../utils/logger");
/**
 * Centralized manager logging utility
 * Provides consistent formatting and optional log retention
 */
class ManagerLogger {
    constructor(managerName, emoji = '📋', config = {}) {
        this.managerName = managerName;
        this.emoji = emoji;
        this.config = { ...ManagerLogger.globalConfig, ...config };
    }
    /**
     * Create a logger instance for a specific manager
     * @param managerName Name of the manager (e.g., 'TerminalLifecycleCoordinator')
     * @param emoji Emoji to use for this manager's logs
     * @param config Optional logging configuration
     */
    static createLogger(managerName, emoji = '📋', config = {}) {
        return new ManagerLogger(managerName, emoji, config);
    }
    /**
     * Log an info message
     * @param message The message to log
     * @param data Optional data to include
     */
    info(message, data) {
        this.log('info', message, data);
    }
    /**
     * Log a warning message
     * @param message The message to log
     * @param data Optional data to include
     */
    warn(message, data) {
        this.log('warn', message, data);
    }
    /**
     * Log an error message
     * @param message The message to log
     * @param data Optional data to include
     */
    error(message, data) {
        this.log('error', message, data);
    }
    /**
     * Log a debug message
     * @param message The message to log
     * @param data Optional data to include
     */
    debug(message, data) {
        this.log('debug', message, data);
    }
    /**
     * Log a terminal-specific message with terminal ID
     * @param terminalId Terminal identifier
     * @param message The message to log
     * @param data Optional data to include
     */
    terminal(terminalId, message, data) {
        this.info(`[${terminalId}] ${message}`, data);
    }
    /**
     * Log a performance-related message
     * @param operation Operation being measured
     * @param duration Duration in milliseconds
     * @param data Optional additional data
     */
    performance(operation, duration, data) {
        this.info(`⏱️ ${operation}: ${duration}ms`, data);
    }
    /**
     * Log a lifecycle event (initialization, disposal, etc.)
     * @param event Lifecycle event name
     * @param status Status of the event (starting, completed, failed)
     * @param data Optional additional data
     */
    lifecycle(event, status, data) {
        const statusEmoji = {
            starting: '🔄',
            completed: '✅',
            failed: '❌',
        }[status];
        this.info(`${statusEmoji} ${event} ${status}`, data);
    }
    /**
     * Core logging method
     */
    log(level, message, data) {
        try {
            // Truncate message if too long
            const truncatedMessage = this.config.maxMessageLength && message.length > this.config.maxMessageLength
                ? `${message.substring(0, this.config.maxMessageLength)}...`
                : message;
            // Build formatted message
            const parts = [];
            // Add timestamp if enabled
            if (this.config.enableTimestamp) {
                parts.push(`[${new Date().toISOString()}]`);
            }
            // Add level if enabled
            if (this.config.enableLevel && level !== 'info') {
                parts.push(`[${level.toUpperCase()}]`);
            }
            // Add emoji and manager name
            parts.push(`${this.emoji} [${this.managerName}]`);
            // Add the message
            parts.push(truncatedMessage);
            const formattedMessage = parts.join(' ');
            // Log to base logger
            (0, logger_1.webview)(formattedMessage);
            // Log data if provided
            if (data !== undefined) {
                (0, logger_1.webview)(`🔍 [${this.managerName}] Data:`, data);
            }
            // Store in history
            this.addToHistory(level, truncatedMessage, data);
        }
        catch (error) {
            // Fallback to base logger if formatting fails
            (0, logger_1.webview)(`❌ ManagerLogger error for ${this.managerName}: ${message}`);
            console.error('ManagerLogger error:', error);
        }
    }
    /**
     * Add entry to log history
     */
    addToHistory(level, message, data) {
        const entry = {
            timestamp: Date.now(),
            level,
            manager: this.managerName,
            message,
            data,
        };
        ManagerLogger.logHistory.push(entry);
        // Trim history if too large
        if (ManagerLogger.logHistory.length > ManagerLogger.maxHistorySize) {
            ManagerLogger.logHistory = ManagerLogger.logHistory.slice(-ManagerLogger.maxHistorySize);
        }
    }
    /**
     * Get recent log entries for this manager
     * @param count Number of entries to return
     */
    getRecentLogs(count = 10) {
        return ManagerLogger.logHistory
            .filter((entry) => entry.manager === this.managerName)
            .slice(-count);
    }
    /**
     * Get all log entries for this manager since a timestamp
     * @param since Timestamp to filter from
     */
    getLogsSince(since) {
        return ManagerLogger.logHistory.filter((entry) => entry.manager === this.managerName && entry.timestamp >= since);
    }
    // Static methods for global log management
    /**
     * Configure global logging settings
     * @param config Global configuration to apply
     */
    static configure(config) {
        ManagerLogger.globalConfig = { ...ManagerLogger.globalConfig, ...config };
    }
    /**
     * Get all log entries from all managers
     * @param managerFilter Optional filter by manager name
     * @param levelFilter Optional filter by log level
     */
    static getAllLogs(managerFilter, levelFilter) {
        let logs = ManagerLogger.logHistory;
        if (managerFilter) {
            logs = logs.filter((entry) => entry.manager === managerFilter);
        }
        if (levelFilter) {
            logs = logs.filter((entry) => entry.level === levelFilter);
        }
        return logs;
    }
    /**
     * Clear all log history
     */
    static clearHistory() {
        ManagerLogger.logHistory = [];
        (0, logger_1.webview)('🧹 ManagerLogger: Log history cleared');
    }
    /**
     * Export log history as JSON
     */
    static exportLogs() {
        return JSON.stringify(ManagerLogger.logHistory, null, 2);
    }
    /**
     * Get logging statistics
     */
    static getStats() {
        const managerCounts = {};
        const levelCounts = {
            info: 0,
            warn: 0,
            error: 0,
            debug: 0,
        };
        for (const entry of ManagerLogger.logHistory) {
            managerCounts[entry.manager] = (managerCounts[entry.manager] || 0) + 1;
            levelCounts[entry.level]++;
        }
        return {
            totalEntries: ManagerLogger.logHistory.length,
            managerCounts,
            levelCounts,
            oldestEntry: ManagerLogger.logHistory.length > 0 ? ManagerLogger.logHistory[0]?.timestamp || null : null,
            newestEntry: ManagerLogger.logHistory.length > 0
                ? ManagerLogger.logHistory[ManagerLogger.logHistory.length - 1]?.timestamp || null
                : null,
        };
    }
}
exports.ManagerLogger = ManagerLogger;
ManagerLogger.logHistory = [];
ManagerLogger.maxHistorySize = 1000;
ManagerLogger.globalConfig = {
    enableTimestamp: false,
    enableLevel: true,
    maxMessageLength: 500,
};
// Pre-configured logger instances for common managers
exports.terminalLogger = ManagerLogger.createLogger('TerminalLifecycle', '🔄');
exports.uiLogger = ManagerLogger.createLogger('UI', '🎨');
exports.inputLogger = ManagerLogger.createLogger('Input', '⌨️');
exports.performanceLogger = ManagerLogger.createLogger('Performance', '📊');
exports.splitLogger = ManagerLogger.createLogger('Split', '📱');
exports.messageLogger = ManagerLogger.createLogger('Message', '📨');
exports.notificationLogger = ManagerLogger.createLogger('Notification', '🔔');
exports.configLogger = ManagerLogger.createLogger('Config', '⚙️');
exports.containerLogger = ManagerLogger.createLogger('Container', '📦');
//# sourceMappingURL=ManagerLogger.js.map