"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ErrorHandler_1 = require("../../../../../webview/utils/ErrorHandler");
const ManagerLogger_1 = require("../../../../../webview/utils/ManagerLogger");
// Mock logger
vitest_1.vi.mock('../../../../../webview/utils/ManagerLogger', () => ({
    terminalLogger: {
        info: vitest_1.vi.fn(),
        warn: vitest_1.vi.fn(),
        error: vitest_1.vi.fn(),
        debug: vitest_1.vi.fn(),
    },
}));
(0, vitest_1.describe)('ErrorHandler', () => {
    const op = 'Test Operation';
    const err = new Error('Test Error');
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('handleOperationError', () => {
        (0, vitest_1.it)('should log error and return result', () => {
            const result = ErrorHandler_1.ErrorHandler.handleOperationError(op, err);
            (0, vitest_1.expect)(result.handled).toBe(true);
            (0, vitest_1.expect)(result.severity).toBe('error');
            (0, vitest_1.expect)(result.message).toContain('❌');
            (0, vitest_1.expect)(ManagerLogger_1.terminalLogger.error).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should rethrow error if requested', () => {
            (0, vitest_1.expect)(() => {
                ErrorHandler_1.ErrorHandler.handleOperationError(op, err, { rethrow: true });
            }).toThrow('Test Error');
        });
        (0, vitest_1.it)('should execute recovery callback', () => {
            const recovery = vitest_1.vi.fn();
            ErrorHandler_1.ErrorHandler.handleOperationError(op, err, { recovery });
            (0, vitest_1.expect)(recovery).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle async recovery callback', async () => {
            const recovery = vitest_1.vi.fn().mockResolvedValue(undefined);
            ErrorHandler_1.ErrorHandler.handleOperationError(op, err, { recovery });
            (0, vitest_1.expect)(recovery).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should include context in logs', () => {
            const context = { id: 123 };
            ErrorHandler_1.ErrorHandler.handleOperationError(op, err, { context });
            (0, vitest_1.expect)(ManagerLogger_1.terminalLogger.error).toHaveBeenCalledWith(vitest_1.expect.stringContaining('"id":123'), err);
        });
    });
    (0, vitest_1.describe)('Utility methods', () => {
        (0, vitest_1.it)('should extract error message correctly', () => {
            (0, vitest_1.expect)(ErrorHandler_1.ErrorHandler.extractErrorMessage(new Error('msg'))).toBe('msg');
            (0, vitest_1.expect)(ErrorHandler_1.ErrorHandler.extractErrorMessage('string err')).toBe('string err');
            (0, vitest_1.expect)(ErrorHandler_1.ErrorHandler.extractErrorMessage(123)).toBe('123');
        });
        (0, vitest_1.it)('should format error message', () => {
            (0, vitest_1.expect)(ErrorHandler_1.ErrorHandler.formatErrorMessage('Op', 'detail')).toBe('Op: detail');
            (0, vitest_1.expect)(ErrorHandler_1.ErrorHandler.formatErrorMessage('Op')).toBe('Op');
        });
        (0, vitest_1.it)('should check error type', () => {
            (0, vitest_1.expect)(ErrorHandler_1.ErrorHandler.isErrorType(new TypeError(), TypeError)).toBe(true);
            (0, vitest_1.expect)(ErrorHandler_1.ErrorHandler.isErrorType(new Error(), TypeError)).toBe(false);
        });
    });
});
//# sourceMappingURL=ErrorHandler.test.js.map