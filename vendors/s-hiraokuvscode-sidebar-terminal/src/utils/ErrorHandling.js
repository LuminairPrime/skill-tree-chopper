"use strict";
/** Unified error handling system for consistent error processing. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorManager = exports.ErrorHandlingManager = exports.ResourceError = exports.CommunicationError = exports.ConfigurationError = exports.SessionError = exports.TerminalError = exports.BaseError = exports.ErrorCategory = exports.ErrorSeverity = void 0;
exports.errorToString = errorToString;
exports.getStackTrace = getStackTrace;
exports.isRecoverableError = isRecoverableError;
exports.withErrorHandling = withErrorHandling;
const vscode = require("vscode");
const logger_1 = require("./logger");
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["INFO"] = "info";
    ErrorSeverity["WARNING"] = "warning";
    ErrorSeverity["ERROR"] = "error";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["TERMINAL"] = "terminal";
    ErrorCategory["SESSION"] = "session";
    ErrorCategory["CONFIGURATION"] = "config";
    ErrorCategory["WEBVIEW"] = "webview";
    ErrorCategory["COMMUNICATION"] = "communication";
    ErrorCategory["RESOURCE"] = "resource";
    ErrorCategory["UNKNOWN"] = "unknown";
})(ErrorCategory || (exports.ErrorCategory = ErrorCategory = {}));
class BaseError extends Error {
    constructor(message, context, recoverable = true) {
        super(message);
        this.name = this.constructor.name;
        this.context = {
            category: ErrorCategory.UNKNOWN,
            severity: ErrorSeverity.ERROR,
            component: 'Unknown',
            timestamp: Date.now(),
            ...context,
        };
        this.recoverable = recoverable;
        Object.setPrototypeOf(this, new.target.prototype);
    }
    toReport() {
        return {
            message: this.message,
            context: this.context,
            error: this,
            stack: this.stack,
            recoverable: this.recoverable,
        };
    }
}
exports.BaseError = BaseError;
class TerminalError extends BaseError {
    constructor(message, component, operation, recoverable = true) {
        super(message, {
            category: ErrorCategory.TERMINAL,
            severity: ErrorSeverity.ERROR,
            component,
            operation,
        }, recoverable);
    }
}
exports.TerminalError = TerminalError;
class SessionError extends BaseError {
    constructor(message, component, operation, recoverable = true) {
        super(message, {
            category: ErrorCategory.SESSION,
            severity: ErrorSeverity.ERROR,
            component,
            operation,
        }, recoverable);
    }
}
exports.SessionError = SessionError;
class ConfigurationError extends BaseError {
    constructor(message, component, operation) {
        super(message, {
            category: ErrorCategory.CONFIGURATION,
            severity: ErrorSeverity.WARNING,
            component,
            operation,
        }, true);
    }
}
exports.ConfigurationError = ConfigurationError;
class CommunicationError extends BaseError {
    constructor(message, component, operation, recoverable = false) {
        super(message, {
            category: ErrorCategory.COMMUNICATION,
            severity: ErrorSeverity.ERROR,
            component,
            operation,
        }, recoverable);
    }
}
exports.CommunicationError = CommunicationError;
class ResourceError extends BaseError {
    constructor(message, component, operation) {
        super(message, {
            category: ErrorCategory.RESOURCE,
            severity: ErrorSeverity.CRITICAL,
            component,
            operation,
        }, false);
    }
}
exports.ResourceError = ResourceError;
class ErrorHandlingManager {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 1000;
        this.errorHandlers = new Map();
        this.globalHandlers = new Set();
    }
    static getInstance() {
        if (!ErrorHandlingManager.instance) {
            ErrorHandlingManager.instance = new ErrorHandlingManager();
        }
        return ErrorHandlingManager.instance;
    }
    handleError(error, context) {
        const report = this.createErrorReport(error, context);
        this.logError(report);
        this.notifyHandlers(report);
        this.showUserNotification(report);
        return report;
    }
    async executeWithErrorHandling(operation, context, fallback) {
        try {
            return await operation();
        }
        catch (error) {
            const report = this.handleError(error, context);
            if (report.recoverable && fallback !== undefined) {
                (0, logger_1.log)(`🔄 Recovering with fallback value for ${context.operation}`);
                return fallback;
            }
            return null;
        }
    }
    createErrorReport(error, context) {
        if (error instanceof BaseError) {
            return error.toReport();
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        return {
            message: errorMessage,
            context: {
                category: context?.category || ErrorCategory.UNKNOWN,
                severity: context?.severity || ErrorSeverity.ERROR,
                component: context?.component || 'Unknown',
                operation: context?.operation,
                metadata: context?.metadata,
                timestamp: Date.now(),
            },
            error: error instanceof Error ? error : undefined,
            stack: errorStack,
            recoverable: context?.severity !== ErrorSeverity.CRITICAL,
        };
    }
    logError(report) {
        this.errorLog.push(report);
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(-this.maxLogSize);
        }
        const prefix = `[${report.context.category.toUpperCase()}]`;
        switch (report.context.severity) {
            case ErrorSeverity.INFO:
                (0, logger_1.log)(prefix, report.message);
                break;
            case ErrorSeverity.WARNING:
                console.warn(prefix, report.message);
                break;
            case ErrorSeverity.ERROR:
            case ErrorSeverity.CRITICAL:
                console.error(prefix, report.message, report.stack || '');
                break;
        }
    }
    notifyHandlers(report) {
        const categoryHandlers = this.errorHandlers.get(report.context.category);
        categoryHandlers?.forEach((handler) => handler(report));
        this.globalHandlers.forEach((handler) => handler(report));
    }
    showUserNotification(report) {
        const { message, context } = report;
        switch (context.severity) {
            case ErrorSeverity.INFO:
                vscode.window.showInformationMessage(message);
                break;
            case ErrorSeverity.WARNING:
                vscode.window.showWarningMessage(message);
                break;
            case ErrorSeverity.ERROR:
            case ErrorSeverity.CRITICAL:
                vscode.window.showErrorMessage(message);
                break;
        }
    }
    registerErrorHandler(handler, category) {
        if (category) {
            if (!this.errorHandlers.has(category)) {
                this.errorHandlers.set(category, new Set());
            }
            this.errorHandlers.get(category).add(handler);
        }
        else {
            this.globalHandlers.add(handler);
        }
    }
    unregisterErrorHandler(handler, category) {
        if (category) {
            this.errorHandlers.get(category)?.delete(handler);
        }
        else {
            this.globalHandlers.delete(handler);
        }
    }
    getErrorLog(category, limit = 100) {
        let log = this.errorLog;
        if (category) {
            log = log.filter((report) => report.context.category === category);
        }
        return log.slice(-limit);
    }
    getErrorStatistics() {
        const stats = {
            total: this.errorLog.length,
            byCategory: {},
            bySeverity: {},
            recoverable: 0,
            unrecoverable: 0,
        };
        this.errorLog.forEach((report) => {
            stats.byCategory[report.context.category] =
                (stats.byCategory[report.context.category] || 0) + 1;
            stats.bySeverity[report.context.severity] =
                (stats.bySeverity[report.context.severity] || 0) + 1;
            report.recoverable ? stats.recoverable++ : stats.unrecoverable++;
        });
        return stats;
    }
    clearErrorLog() {
        this.errorLog = [];
    }
}
exports.ErrorHandlingManager = ErrorHandlingManager;
function errorToString(error) {
    return error instanceof Error ? error.message : String(error);
}
function getStackTrace(error) {
    return error instanceof Error ? error.stack : undefined;
}
function isRecoverableError(error) {
    return error instanceof BaseError ? error.recoverable : false;
}
function withErrorHandling(category, component, recoverable = true) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const manager = ErrorHandlingManager.getInstance();
            return manager.executeWithErrorHandling(() => originalMethod.apply(this, args), {
                category,
                component,
                operation: propertyKey,
                severity: recoverable ? ErrorSeverity.ERROR : ErrorSeverity.CRITICAL,
            });
        };
        return descriptor;
    };
}
exports.errorManager = ErrorHandlingManager.getInstance();
//# sourceMappingURL=ErrorHandling.js.map