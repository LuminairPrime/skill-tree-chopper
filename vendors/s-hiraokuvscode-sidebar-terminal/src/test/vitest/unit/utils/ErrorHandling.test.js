"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ErrorHandling_1 = require("../../../../utils/ErrorHandling");
// Mock vscode module
vitest_1.vi.mock('vscode', () => ({
    window: {
        showInformationMessage: vitest_1.vi.fn(),
        showWarningMessage: vitest_1.vi.fn(),
        showErrorMessage: vitest_1.vi.fn(),
    },
}));
// Mock logger
vitest_1.vi.mock('../../../../utils/logger', () => ({
    log: vitest_1.vi.fn(),
}));
const vscode = require("vscode");
(0, vitest_1.describe)('ErrorHandling', () => {
    (0, vitest_1.describe)('ErrorSeverity enum', () => {
        (0, vitest_1.it)('should have INFO value', () => {
            (0, vitest_1.expect)(ErrorHandling_1.ErrorSeverity.INFO).toBe('info');
        });
        (0, vitest_1.it)('should have WARNING value', () => {
            (0, vitest_1.expect)(ErrorHandling_1.ErrorSeverity.WARNING).toBe('warning');
        });
        (0, vitest_1.it)('should have ERROR value', () => {
            (0, vitest_1.expect)(ErrorHandling_1.ErrorSeverity.ERROR).toBe('error');
        });
        (0, vitest_1.it)('should have CRITICAL value', () => {
            (0, vitest_1.expect)(ErrorHandling_1.ErrorSeverity.CRITICAL).toBe('critical');
        });
    });
    (0, vitest_1.describe)('ErrorCategory enum', () => {
        (0, vitest_1.it)('should have TERMINAL value', () => {
            (0, vitest_1.expect)(ErrorHandling_1.ErrorCategory.TERMINAL).toBe('terminal');
        });
        (0, vitest_1.it)('should have SESSION value', () => {
            (0, vitest_1.expect)(ErrorHandling_1.ErrorCategory.SESSION).toBe('session');
        });
        (0, vitest_1.it)('should have CONFIGURATION value', () => {
            (0, vitest_1.expect)(ErrorHandling_1.ErrorCategory.CONFIGURATION).toBe('config');
        });
        (0, vitest_1.it)('should have WEBVIEW value', () => {
            (0, vitest_1.expect)(ErrorHandling_1.ErrorCategory.WEBVIEW).toBe('webview');
        });
        (0, vitest_1.it)('should have COMMUNICATION value', () => {
            (0, vitest_1.expect)(ErrorHandling_1.ErrorCategory.COMMUNICATION).toBe('communication');
        });
        (0, vitest_1.it)('should have RESOURCE value', () => {
            (0, vitest_1.expect)(ErrorHandling_1.ErrorCategory.RESOURCE).toBe('resource');
        });
        (0, vitest_1.it)('should have UNKNOWN value', () => {
            (0, vitest_1.expect)(ErrorHandling_1.ErrorCategory.UNKNOWN).toBe('unknown');
        });
    });
    (0, vitest_1.describe)('TerminalError', () => {
        (0, vitest_1.it)('should create error with correct category', () => {
            const error = new ErrorHandling_1.TerminalError('Test message', 'TestComponent');
            (0, vitest_1.expect)(error.message).toBe('Test message');
            (0, vitest_1.expect)(error.context.category).toBe(ErrorHandling_1.ErrorCategory.TERMINAL);
            (0, vitest_1.expect)(error.context.component).toBe('TestComponent');
            (0, vitest_1.expect)(error.context.severity).toBe(ErrorHandling_1.ErrorSeverity.ERROR);
            (0, vitest_1.expect)(error.recoverable).toBe(true);
        });
        (0, vitest_1.it)('should create error with operation', () => {
            const error = new ErrorHandling_1.TerminalError('Test message', 'TestComponent', 'testOperation');
            (0, vitest_1.expect)(error.context.operation).toBe('testOperation');
        });
        (0, vitest_1.it)('should create non-recoverable error', () => {
            const error = new ErrorHandling_1.TerminalError('Test message', 'TestComponent', 'testOp', false);
            (0, vitest_1.expect)(error.recoverable).toBe(false);
        });
        (0, vitest_1.it)('should have correct name', () => {
            const error = new ErrorHandling_1.TerminalError('Test message', 'TestComponent');
            (0, vitest_1.expect)(error.name).toBe('TerminalError');
        });
        (0, vitest_1.it)('should generate error report', () => {
            const error = new ErrorHandling_1.TerminalError('Test message', 'TestComponent', 'testOp');
            const report = error.toReport();
            (0, vitest_1.expect)(report.message).toBe('Test message');
            (0, vitest_1.expect)(report.context.category).toBe(ErrorHandling_1.ErrorCategory.TERMINAL);
            (0, vitest_1.expect)(report.error).toBe(error);
            (0, vitest_1.expect)(report.recoverable).toBe(true);
        });
    });
    (0, vitest_1.describe)('SessionError', () => {
        (0, vitest_1.it)('should create error with correct category', () => {
            const error = new ErrorHandling_1.SessionError('Session failed', 'SessionManager');
            (0, vitest_1.expect)(error.message).toBe('Session failed');
            (0, vitest_1.expect)(error.context.category).toBe(ErrorHandling_1.ErrorCategory.SESSION);
            (0, vitest_1.expect)(error.context.component).toBe('SessionManager');
            (0, vitest_1.expect)(error.recoverable).toBe(true);
        });
        (0, vitest_1.it)('should create non-recoverable session error', () => {
            const error = new ErrorHandling_1.SessionError('Session failed', 'SessionManager', 'save', false);
            (0, vitest_1.expect)(error.recoverable).toBe(false);
            (0, vitest_1.expect)(error.context.operation).toBe('save');
        });
    });
    (0, vitest_1.describe)('ConfigurationError', () => {
        (0, vitest_1.it)('should create error with WARNING severity', () => {
            const error = new ErrorHandling_1.ConfigurationError('Config invalid', 'ConfigManager');
            (0, vitest_1.expect)(error.context.category).toBe(ErrorHandling_1.ErrorCategory.CONFIGURATION);
            (0, vitest_1.expect)(error.context.severity).toBe(ErrorHandling_1.ErrorSeverity.WARNING);
            (0, vitest_1.expect)(error.recoverable).toBe(true);
        });
    });
    (0, vitest_1.describe)('CommunicationError', () => {
        (0, vitest_1.it)('should create error with default non-recoverable', () => {
            const error = new ErrorHandling_1.CommunicationError('Connection failed', 'MessageHandler');
            (0, vitest_1.expect)(error.context.category).toBe(ErrorHandling_1.ErrorCategory.COMMUNICATION);
            (0, vitest_1.expect)(error.recoverable).toBe(false);
        });
        (0, vitest_1.it)('should create recoverable communication error', () => {
            const error = new ErrorHandling_1.CommunicationError('Retry needed', 'MessageHandler', 'send', true);
            (0, vitest_1.expect)(error.recoverable).toBe(true);
        });
    });
    (0, vitest_1.describe)('ResourceError', () => {
        (0, vitest_1.it)('should create error with CRITICAL severity and non-recoverable', () => {
            const error = new ErrorHandling_1.ResourceError('Resource exhausted', 'ResourceManager');
            (0, vitest_1.expect)(error.context.category).toBe(ErrorHandling_1.ErrorCategory.RESOURCE);
            (0, vitest_1.expect)(error.context.severity).toBe(ErrorHandling_1.ErrorSeverity.CRITICAL);
            (0, vitest_1.expect)(error.recoverable).toBe(false);
        });
    });
    (0, vitest_1.describe)('ErrorHandlingManager', () => {
        let manager;
        (0, vitest_1.beforeEach)(() => {
            manager = ErrorHandling_1.ErrorHandlingManager.getInstance();
            manager.clearErrorLog();
            vitest_1.vi.clearAllMocks();
        });
        (0, vitest_1.describe)('getInstance', () => {
            (0, vitest_1.it)('should return singleton instance', () => {
                const instance1 = ErrorHandling_1.ErrorHandlingManager.getInstance();
                const instance2 = ErrorHandling_1.ErrorHandlingManager.getInstance();
                (0, vitest_1.expect)(instance1).toBe(instance2);
            });
        });
        (0, vitest_1.describe)('handleError', () => {
            (0, vitest_1.it)('should handle BaseError correctly', () => {
                const error = new ErrorHandling_1.TerminalError('Terminal error', 'TestComponent');
                vitest_1.vi.spyOn(console, 'error').mockImplementation(() => { });
                const report = manager.handleError(error);
                (0, vitest_1.expect)(report.message).toBe('Terminal error');
                (0, vitest_1.expect)(report.context.category).toBe(ErrorHandling_1.ErrorCategory.TERMINAL);
                (0, vitest_1.expect)(vscode.window.showErrorMessage).toHaveBeenCalledWith('Terminal error');
            });
            (0, vitest_1.it)('should handle standard Error', () => {
                vitest_1.vi.spyOn(console, 'error').mockImplementation(() => { });
                const error = new Error('Standard error');
                const report = manager.handleError(error, {
                    category: ErrorHandling_1.ErrorCategory.UNKNOWN,
                    component: 'TestComponent',
                });
                (0, vitest_1.expect)(report.message).toBe('Standard error');
                (0, vitest_1.expect)(report.error).toBe(error);
            });
            (0, vitest_1.it)('should handle string error', () => {
                vitest_1.vi.spyOn(console, 'error').mockImplementation(() => { });
                const report = manager.handleError('String error', {
                    component: 'TestComponent',
                });
                (0, vitest_1.expect)(report.message).toBe('String error');
            });
            (0, vitest_1.it)('should show information message for INFO severity', () => {
                vitest_1.vi.spyOn(console, 'info').mockImplementation(() => { });
                manager.handleError('Info message', {
                    severity: ErrorHandling_1.ErrorSeverity.INFO,
                    component: 'TestComponent',
                });
                (0, vitest_1.expect)(vscode.window.showInformationMessage).toHaveBeenCalledWith('Info message');
            });
            (0, vitest_1.it)('should show warning message for WARNING severity', () => {
                vitest_1.vi.spyOn(console, 'warn').mockImplementation(() => { });
                manager.handleError('Warning message', {
                    severity: ErrorHandling_1.ErrorSeverity.WARNING,
                    component: 'TestComponent',
                });
                (0, vitest_1.expect)(vscode.window.showWarningMessage).toHaveBeenCalledWith('Warning message');
            });
        });
        (0, vitest_1.describe)('executeWithErrorHandling', () => {
            (0, vitest_1.it)('should return result on success', async () => {
                const result = await manager.executeWithErrorHandling(async () => 'success', {
                    component: 'TestComponent',
                });
                (0, vitest_1.expect)(result).toBe('success');
            });
            (0, vitest_1.it)('should return fallback on recoverable error', async () => {
                vitest_1.vi.spyOn(console, 'error').mockImplementation(() => { });
                const result = await manager.executeWithErrorHandling(async () => {
                    throw new ErrorHandling_1.TerminalError('Failed', 'TestComponent');
                }, { component: 'TestComponent' }, 'fallback');
                (0, vitest_1.expect)(result).toBe('fallback');
            });
            (0, vitest_1.it)('should return null on non-recoverable error without fallback', async () => {
                vitest_1.vi.spyOn(console, 'error').mockImplementation(() => { });
                const result = await manager.executeWithErrorHandling(async () => {
                    throw new ErrorHandling_1.ResourceError('Critical failure', 'TestComponent');
                }, { component: 'TestComponent' });
                (0, vitest_1.expect)(result).toBeNull();
            });
        });
        (0, vitest_1.describe)('error handlers', () => {
            (0, vitest_1.it)('should register and call global handler', () => {
                const handler = vitest_1.vi.fn();
                vitest_1.vi.spyOn(console, 'error').mockImplementation(() => { });
                manager.registerErrorHandler(handler);
                manager.handleError('Test error', {
                    component: 'TestComponent',
                });
                (0, vitest_1.expect)(handler).toHaveBeenCalled();
                manager.unregisterErrorHandler(handler);
            });
            (0, vitest_1.it)('should register and call category handler', () => {
                const handler = vitest_1.vi.fn();
                vitest_1.vi.spyOn(console, 'error').mockImplementation(() => { });
                manager.registerErrorHandler(handler, ErrorHandling_1.ErrorCategory.TERMINAL);
                const error = new ErrorHandling_1.TerminalError('Terminal error', 'TestComponent');
                manager.handleError(error);
                (0, vitest_1.expect)(handler).toHaveBeenCalled();
                manager.unregisterErrorHandler(handler, ErrorHandling_1.ErrorCategory.TERMINAL);
            });
            (0, vitest_1.it)('should not call category handler for different category', () => {
                const handler = vitest_1.vi.fn();
                vitest_1.vi.spyOn(console, 'error').mockImplementation(() => { });
                manager.registerErrorHandler(handler, ErrorHandling_1.ErrorCategory.TERMINAL);
                const error = new ErrorHandling_1.SessionError('Session error', 'TestComponent');
                manager.handleError(error);
                (0, vitest_1.expect)(handler).not.toHaveBeenCalled();
                manager.unregisterErrorHandler(handler, ErrorHandling_1.ErrorCategory.TERMINAL);
            });
            (0, vitest_1.it)('should unregister handler', () => {
                const handler = vitest_1.vi.fn();
                vitest_1.vi.spyOn(console, 'error').mockImplementation(() => { });
                manager.registerErrorHandler(handler);
                manager.unregisterErrorHandler(handler);
                manager.handleError('Test error', { component: 'TestComponent' });
                (0, vitest_1.expect)(handler).not.toHaveBeenCalled();
            });
        });
        (0, vitest_1.describe)('getErrorLog', () => {
            (0, vitest_1.it)('should return empty log initially', () => {
                const log = manager.getErrorLog();
                (0, vitest_1.expect)(log).toEqual([]);
            });
            (0, vitest_1.it)('should return error log', () => {
                vitest_1.vi.spyOn(console, 'error').mockImplementation(() => { });
                manager.handleError('Error 1', { component: 'TestComponent' });
                manager.handleError('Error 2', { component: 'TestComponent' });
                const log = manager.getErrorLog();
                (0, vitest_1.expect)(log).toHaveLength(2);
                // @ts-expect-error - test mock type
                (0, vitest_1.expect)(log[0].message).toBe('Error 1');
                // @ts-expect-error - test mock type
                (0, vitest_1.expect)(log[1].message).toBe('Error 2');
            });
            (0, vitest_1.it)('should filter by category', () => {
                vitest_1.vi.spyOn(console, 'error').mockImplementation(() => { });
                manager.handleError(new ErrorHandling_1.TerminalError('Terminal error', 'TestComponent'));
                manager.handleError(new ErrorHandling_1.SessionError('Session error', 'TestComponent'));
                const terminalLog = manager.getErrorLog(ErrorHandling_1.ErrorCategory.TERMINAL);
                (0, vitest_1.expect)(terminalLog).toHaveLength(1);
                // @ts-expect-error - test mock type
                (0, vitest_1.expect)(terminalLog[0].context.category).toBe(ErrorHandling_1.ErrorCategory.TERMINAL);
            });
            (0, vitest_1.it)('should respect limit', () => {
                vitest_1.vi.spyOn(console, 'error').mockImplementation(() => { });
                for (let i = 0; i < 10; i++) {
                    manager.handleError(`Error ${i}`, { component: 'TestComponent' });
                }
                const log = manager.getErrorLog(undefined, 5);
                (0, vitest_1.expect)(log).toHaveLength(5);
                // @ts-expect-error - test mock type
                (0, vitest_1.expect)(log[0].message).toBe('Error 5');
                // @ts-expect-error - test mock type
                (0, vitest_1.expect)(log[4].message).toBe('Error 9');
            });
        });
        (0, vitest_1.describe)('getErrorStatistics', () => {
            (0, vitest_1.it)('should return empty statistics initially', () => {
                const stats = manager.getErrorStatistics();
                (0, vitest_1.expect)(stats.total).toBe(0);
                (0, vitest_1.expect)(stats.recoverable).toBe(0);
                (0, vitest_1.expect)(stats.unrecoverable).toBe(0);
            });
            (0, vitest_1.it)('should calculate statistics correctly', () => {
                vitest_1.vi.spyOn(console, 'error').mockImplementation(() => { });
                manager.handleError(new ErrorHandling_1.TerminalError('Error 1', 'TestComponent'));
                manager.handleError(new ErrorHandling_1.SessionError('Error 2', 'TestComponent'));
                manager.handleError(new ErrorHandling_1.ResourceError('Error 3', 'TestComponent'));
                const stats = manager.getErrorStatistics();
                (0, vitest_1.expect)(stats.total).toBe(3);
                (0, vitest_1.expect)(stats.byCategory[ErrorHandling_1.ErrorCategory.TERMINAL]).toBe(1);
                (0, vitest_1.expect)(stats.byCategory[ErrorHandling_1.ErrorCategory.SESSION]).toBe(1);
                (0, vitest_1.expect)(stats.byCategory[ErrorHandling_1.ErrorCategory.RESOURCE]).toBe(1);
                (0, vitest_1.expect)(stats.recoverable).toBe(2);
                (0, vitest_1.expect)(stats.unrecoverable).toBe(1);
            });
            (0, vitest_1.it)('should track severity counts', () => {
                vitest_1.vi.spyOn(console, 'error').mockImplementation(() => { });
                vitest_1.vi.spyOn(console, 'warn').mockImplementation(() => { });
                manager.handleError(new ErrorHandling_1.TerminalError('Error 1', 'TestComponent'));
                manager.handleError(new ErrorHandling_1.ConfigurationError('Warning 1', 'TestComponent'));
                manager.handleError(new ErrorHandling_1.ResourceError('Critical 1', 'TestComponent'));
                const stats = manager.getErrorStatistics();
                (0, vitest_1.expect)(stats.bySeverity[ErrorHandling_1.ErrorSeverity.ERROR]).toBe(1);
                (0, vitest_1.expect)(stats.bySeverity[ErrorHandling_1.ErrorSeverity.WARNING]).toBe(1);
                (0, vitest_1.expect)(stats.bySeverity[ErrorHandling_1.ErrorSeverity.CRITICAL]).toBe(1);
            });
        });
        (0, vitest_1.describe)('clearErrorLog', () => {
            (0, vitest_1.it)('should clear error log', () => {
                vitest_1.vi.spyOn(console, 'error').mockImplementation(() => { });
                manager.handleError('Error 1', { component: 'TestComponent' });
                manager.handleError('Error 2', { component: 'TestComponent' });
                manager.clearErrorLog();
                (0, vitest_1.expect)(manager.getErrorLog()).toHaveLength(0);
            });
        });
    });
    (0, vitest_1.describe)('Utility functions', () => {
        (0, vitest_1.describe)('errorToString', () => {
            (0, vitest_1.it)('should convert Error to string', () => {
                const error = new Error('Test message');
                (0, vitest_1.expect)((0, ErrorHandling_1.errorToString)(error)).toBe('Test message');
            });
            (0, vitest_1.it)('should convert string to string', () => {
                (0, vitest_1.expect)((0, ErrorHandling_1.errorToString)('String error')).toBe('String error');
            });
            (0, vitest_1.it)('should convert number to string', () => {
                (0, vitest_1.expect)((0, ErrorHandling_1.errorToString)(42)).toBe('42');
            });
            (0, vitest_1.it)('should convert object to string', () => {
                (0, vitest_1.expect)((0, ErrorHandling_1.errorToString)({ key: 'value' })).toBe('[object Object]');
            });
            (0, vitest_1.it)('should convert null to string', () => {
                (0, vitest_1.expect)((0, ErrorHandling_1.errorToString)(null)).toBe('null');
            });
            (0, vitest_1.it)('should convert undefined to string', () => {
                (0, vitest_1.expect)((0, ErrorHandling_1.errorToString)(undefined)).toBe('undefined');
            });
        });
        (0, vitest_1.describe)('getStackTrace', () => {
            (0, vitest_1.it)('should return stack from Error', () => {
                const error = new Error('Test');
                (0, vitest_1.expect)((0, ErrorHandling_1.getStackTrace)(error)).toBeDefined();
                (0, vitest_1.expect)((0, ErrorHandling_1.getStackTrace)(error)).toContain('Error: Test');
            });
            (0, vitest_1.it)('should return undefined for non-Error', () => {
                (0, vitest_1.expect)((0, ErrorHandling_1.getStackTrace)('string')).toBeUndefined();
                (0, vitest_1.expect)((0, ErrorHandling_1.getStackTrace)(42)).toBeUndefined();
                (0, vitest_1.expect)((0, ErrorHandling_1.getStackTrace)(null)).toBeUndefined();
            });
        });
        (0, vitest_1.describe)('isRecoverableError', () => {
            (0, vitest_1.it)('should return true for recoverable BaseError', () => {
                const error = new ErrorHandling_1.TerminalError('Test', 'Component');
                (0, vitest_1.expect)((0, ErrorHandling_1.isRecoverableError)(error)).toBe(true);
            });
            (0, vitest_1.it)('should return false for non-recoverable BaseError', () => {
                const error = new ErrorHandling_1.ResourceError('Test', 'Component');
                (0, vitest_1.expect)((0, ErrorHandling_1.isRecoverableError)(error)).toBe(false);
            });
            (0, vitest_1.it)('should return false for standard Error', () => {
                const error = new Error('Test');
                (0, vitest_1.expect)((0, ErrorHandling_1.isRecoverableError)(error)).toBe(false);
            });
            (0, vitest_1.it)('should return false for non-error values', () => {
                (0, vitest_1.expect)((0, ErrorHandling_1.isRecoverableError)('string')).toBe(false);
                (0, vitest_1.expect)((0, ErrorHandling_1.isRecoverableError)(42)).toBe(false);
                (0, vitest_1.expect)((0, ErrorHandling_1.isRecoverableError)(null)).toBe(false);
            });
        });
    });
    (0, vitest_1.describe)('withErrorHandling decorator', () => {
        (0, vitest_1.it)('should return a decorator function', () => {
            const decorator = (0, ErrorHandling_1.withErrorHandling)(ErrorHandling_1.ErrorCategory.TERMINAL, 'TestClass');
            (0, vitest_1.expect)(typeof decorator).toBe('function');
        });
        (0, vitest_1.it)('should modify property descriptor', () => {
            const decorator = (0, ErrorHandling_1.withErrorHandling)(ErrorHandling_1.ErrorCategory.TERMINAL, 'TestClass', true);
            const originalMethod = async () => 'original';
            const descriptor = {
                value: originalMethod,
                writable: true,
                enumerable: false,
                configurable: true,
            };
            const result = decorator({}, 'testMethod', descriptor);
            (0, vitest_1.expect)(result.value).not.toBe(originalMethod);
            (0, vitest_1.expect)(typeof result.value).toBe('function');
        });
        (0, vitest_1.it)('should execute wrapped method successfully', async () => {
            const decorator = (0, ErrorHandling_1.withErrorHandling)(ErrorHandling_1.ErrorCategory.TERMINAL, 'TestClass');
            const originalMethod = async () => 'success';
            const descriptor = {
                value: originalMethod,
                writable: true,
                enumerable: false,
                configurable: true,
            };
            const result = decorator({}, 'testMethod', descriptor);
            const wrappedResult = await result.value();
            (0, vitest_1.expect)(wrappedResult).toBe('success');
        });
        (0, vitest_1.it)('should handle errors in wrapped method', async () => {
            vitest_1.vi.spyOn(console, 'error').mockImplementation(() => { });
            const decorator = (0, ErrorHandling_1.withErrorHandling)(ErrorHandling_1.ErrorCategory.TERMINAL, 'TestClass', true);
            const originalMethod = async () => {
                throw new Error('Method failed');
            };
            const descriptor = {
                value: originalMethod,
                writable: true,
                enumerable: false,
                configurable: true,
            };
            const result = decorator({}, 'testMethod', descriptor);
            const wrappedResult = await result.value();
            (0, vitest_1.expect)(wrappedResult).toBeNull();
        });
    });
});
//# sourceMappingURL=ErrorHandling.test.js.map