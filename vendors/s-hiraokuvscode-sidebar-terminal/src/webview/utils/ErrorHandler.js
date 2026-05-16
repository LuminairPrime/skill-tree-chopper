"use strict";
/**
 * ErrorHandler Utility
 *
 * Generic utility for standardized error handling across all WebView operations.
 *
 * Eliminates code duplication by providing a consistent error handling pattern
 * with logging, notifications, recovery, and rethrow capabilities.
 *
 * @see openspec/changes/refactor-terminal-foundation/specs/standardize-error-handling/spec.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = void 0;
const ManagerLogger_1 = require("./ManagerLogger");
/**
 * Generic error handler with consistent pattern across all operations
 */
class ErrorHandler {
    /**
     * Handle operation error with consistent logging and optional recovery
     *
     * @param operation - Name of the operation that failed (e.g., "Terminal creation", "Addon loading")
     * @param error - The error that occurred
     * @param options - Error handling options (severity, notify, rethrow, recovery)
     * @returns Error handling result for testing/debugging
     *
     * @example
     * // Basic error handling
     * try {
     *   await dangerousOperation();
     * } catch (error) {
     *   ErrorHandler.handleOperationError('Terminal creation', error);
     * }
     *
     * @example
     * // With notification and recovery
     * try {
     *   await criticalOperation();
     * } catch (error) {
     *   ErrorHandler.handleOperationError('Critical operation', error, {
     *     severity: 'error',
     *     notify: true,
     *     recovery: () => fallbackOperation()
     *   });
     * }
     *
     * @example
     * // Warning level with rethrow
     * try {
     *   await optionalOperation();
     * } catch (error) {
     *   ErrorHandler.handleOperationError('Optional operation', error, {
     *     severity: 'warn',
     *     rethrow: false
     *   });
     * }
     */
    static handleOperationError(operation, error, options = {}) {
        const severity = options.severity || 'error';
        const emoji = this.getSeverityEmoji(severity);
        const message = `${emoji} ${operation} failed`;
        // Log error with appropriate severity
        this.logError(severity, message, error, options.context);
        // Execute recovery callback if provided
        if (options.recovery) {
            try {
                const recoveryResult = options.recovery();
                if (recoveryResult instanceof Promise) {
                    recoveryResult.catch((recoveryError) => {
                        ManagerLogger_1.terminalLogger.error('❌ Recovery callback failed:', recoveryError);
                    });
                }
            }
            catch (recoveryError) {
                ManagerLogger_1.terminalLogger.error('❌ Recovery callback failed:', recoveryError);
            }
        }
        // Notify user if requested
        if (options.notify) {
            this.notifyUser(message, severity);
        }
        // Rethrow if requested
        if (options.rethrow) {
            throw error;
        }
        return {
            handled: true,
            severity,
            message,
            error,
        };
    }
    /**
     * Get emoji for severity level
     */
    static getSeverityEmoji(severity) {
        switch (severity) {
            case 'error':
                return '❌';
            case 'warn':
                return '⚠️';
            case 'info':
                return 'ℹ️';
            default:
                return '❌';
        }
    }
    /**
     * Log error with appropriate severity level
     */
    static logError(severity, message, error, context) {
        const contextStr = context ? JSON.stringify(context) : '';
        const contextInfo = contextStr ? ` [Context: ${contextStr}]` : '';
        const fullMessage = `${message}${contextInfo}`;
        switch (severity) {
            case 'error':
                ManagerLogger_1.terminalLogger.error(fullMessage, error);
                break;
            case 'warn':
                ManagerLogger_1.terminalLogger.warn(fullMessage, error);
                break;
            case 'info':
                ManagerLogger_1.terminalLogger.info(fullMessage, error);
                break;
        }
    }
    /**
     * Notify user via UI (placeholder for actual notification system)
     * This should be integrated with the actual NotificationManager
     */
    static notifyUser(message, severity) {
        // Log notification intent (actual notification would go through NotificationManager)
        ManagerLogger_1.terminalLogger.debug(`[User Notification] ${severity.toUpperCase()}: ${message}`);
        // TODO: Integrate with NotificationManager when available
        // coordinator.notificationManager?.showNotification(message, severity);
    }
    /**
     * Create formatted error message with operation context
     */
    static formatErrorMessage(operation, details) {
        return details ? `${operation}: ${details}` : operation;
    }
    /**
     * Extract error message from unknown error type
     */
    static extractErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === 'string') {
            return error;
        }
        return String(error);
    }
    /**
     * Check if error is a specific type
     */
    static isErrorType(error, errorType) {
        return error instanceof errorType;
    }
}
exports.ErrorHandler = ErrorHandler;
//# sourceMappingURL=ErrorHandler.js.map