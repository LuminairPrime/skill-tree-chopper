"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const result_1 = require("../../../../types/result");
(0, vitest_1.describe)('ResultError', () => {
    (0, vitest_1.describe)('constructor', () => {
        (0, vitest_1.it)('should create error with basic details', () => {
            const error = new result_1.ResultError({
                code: result_1.ErrorCode.TERMINAL_NOT_FOUND,
                message: 'Terminal not found',
            });
            (0, vitest_1.expect)(error.code).toBe(result_1.ErrorCode.TERMINAL_NOT_FOUND);
            (0, vitest_1.expect)(error.message).toBe('Terminal not found');
            (0, vitest_1.expect)(error.name).toBe('ResultError');
        });
        (0, vitest_1.it)('should include context when provided', () => {
            const context = { terminalId: 'term-1' };
            const error = new result_1.ResultError({
                code: result_1.ErrorCode.TERMINAL_NOT_FOUND,
                message: 'Terminal not found',
                context,
            });
            (0, vitest_1.expect)(error.context).toEqual(context);
        });
        (0, vitest_1.it)('should include cause when provided', () => {
            const originalError = new Error('Original error');
            const error = new result_1.ResultError({
                code: result_1.ErrorCode.UNKNOWN_ERROR,
                message: 'Wrapped error',
                cause: originalError,
            });
            (0, vitest_1.expect)(error.cause).toBe(originalError);
        });
        (0, vitest_1.it)('should preserve stack from details', () => {
            const customStack = 'Custom stack trace';
            const error = new result_1.ResultError({
                code: result_1.ErrorCode.UNKNOWN_ERROR,
                message: 'Error with custom stack',
                stack: customStack,
            });
            (0, vitest_1.expect)(error.stack).toBe(customStack);
        });
        (0, vitest_1.it)('should use cause stack when no stack provided', () => {
            const originalError = new Error('Original error');
            const error = new result_1.ResultError({
                code: result_1.ErrorCode.UNKNOWN_ERROR,
                message: 'Wrapped error',
                cause: originalError,
            });
            (0, vitest_1.expect)(error.stack).toBe(originalError.stack);
        });
    });
    (0, vitest_1.describe)('toJSON', () => {
        (0, vitest_1.it)('should convert to plain object', () => {
            const error = new result_1.ResultError({
                code: result_1.ErrorCode.TERMINAL_NOT_FOUND,
                message: 'Terminal not found',
                context: { id: 1 },
            });
            const json = error.toJSON();
            (0, vitest_1.expect)(json).toEqual({
                code: result_1.ErrorCode.TERMINAL_NOT_FOUND,
                message: 'Terminal not found',
                context: { id: 1 },
                stack: error.stack,
            });
        });
    });
});
(0, vitest_1.describe)('success', () => {
    (0, vitest_1.it)('should create successful result with value', () => {
        const result = (0, result_1.success)(42);
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result).toHaveProperty('value', 42);
    });
    (0, vitest_1.it)('should handle various value types', () => {
        (0, vitest_1.expect)((0, result_1.success)('string')).toEqual({ success: true, value: 'string' });
        (0, vitest_1.expect)((0, result_1.success)({ a: 1 })).toEqual({ success: true, value: { a: 1 } });
        (0, vitest_1.expect)((0, result_1.success)([1, 2, 3])).toEqual({ success: true, value: [1, 2, 3] });
        (0, vitest_1.expect)((0, result_1.success)(null)).toEqual({ success: true, value: null });
        (0, vitest_1.expect)((0, result_1.success)(undefined)).toEqual({ success: true, value: undefined });
    });
});
(0, vitest_1.describe)('failure', () => {
    (0, vitest_1.it)('should create failed result with error', () => {
        const error = new Error('Test error');
        const result = (0, result_1.failure)(error);
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(result).toHaveProperty('error', error);
    });
    (0, vitest_1.it)('should handle various error types', () => {
        const stringError = (0, result_1.failure)('string error');
        (0, vitest_1.expect)(stringError).toEqual({ success: false, error: 'string error' });
        const numberError = (0, result_1.failure)(404);
        (0, vitest_1.expect)(numberError).toEqual({ success: false, error: 404 });
    });
});
(0, vitest_1.describe)('failureFromDetails', () => {
    (0, vitest_1.it)('should create failure with ResultError from details', () => {
        const result = (0, result_1.failureFromDetails)({
            code: result_1.ErrorCode.TERMINAL_CREATION_FAILED,
            message: 'Failed to create terminal',
        });
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(result.error).toBeInstanceOf(result_1.ResultError);
        (0, vitest_1.expect)(result.error.code).toBe(result_1.ErrorCode.TERMINAL_CREATION_FAILED);
    });
});
(0, vitest_1.describe)('failureFromError', () => {
    (0, vitest_1.it)('should wrap native Error into ResultError', () => {
        const originalError = new Error('Original error');
        const result = (0, result_1.failureFromError)(originalError);
        (0, vitest_1.expect)(result.success).toBe(false);
        const error = result.error;
        (0, vitest_1.expect)(error).toBeInstanceOf(result_1.ResultError);
        (0, vitest_1.expect)(error.message).toBe('Original error');
        (0, vitest_1.expect)(error.code).toBe(result_1.ErrorCode.UNKNOWN_ERROR);
        (0, vitest_1.expect)(error.cause).toBe(originalError);
    });
    (0, vitest_1.it)('should use custom error code', () => {
        const originalError = new Error('Network error');
        const result = (0, result_1.failureFromError)(originalError, result_1.ErrorCode.NETWORK_ERROR);
        const error = result.error;
        (0, vitest_1.expect)(error.code).toBe(result_1.ErrorCode.NETWORK_ERROR);
    });
    (0, vitest_1.it)('should include context', () => {
        const originalError = new Error('Error');
        const context = { url: 'http://example.com' };
        const result = (0, result_1.failureFromError)(originalError, result_1.ErrorCode.NETWORK_ERROR, context);
        const error = result.error;
        (0, vitest_1.expect)(error.context).toEqual(context);
    });
});
(0, vitest_1.describe)('isSuccess', () => {
    (0, vitest_1.it)('should return true for successful result', () => {
        const result = (0, result_1.success)(42);
        (0, vitest_1.expect)((0, result_1.isSuccess)(result)).toBe(true);
    });
    (0, vitest_1.it)('should return false for failed result', () => {
        const result = (0, result_1.failure)(new Error('Error'));
        (0, vitest_1.expect)((0, result_1.isSuccess)(result)).toBe(false);
    });
    (0, vitest_1.it)('should narrow type correctly', () => {
        const result = (0, result_1.success)(42);
        if ((0, result_1.isSuccess)(result)) {
            // TypeScript should know result.value exists
            (0, vitest_1.expect)(result.value).toBe(42);
        }
    });
});
(0, vitest_1.describe)('isFailure', () => {
    (0, vitest_1.it)('should return false for successful result', () => {
        const result = (0, result_1.success)(42);
        (0, vitest_1.expect)((0, result_1.isFailure)(result)).toBe(false);
    });
    (0, vitest_1.it)('should return true for failed result', () => {
        const result = (0, result_1.failure)(new Error('Error'));
        (0, vitest_1.expect)((0, result_1.isFailure)(result)).toBe(true);
    });
    (0, vitest_1.it)('should narrow type correctly', () => {
        const result = (0, result_1.failure)(new Error('Error'));
        if ((0, result_1.isFailure)(result)) {
            // TypeScript should know result.error exists
            (0, vitest_1.expect)(result.error).toBeInstanceOf(Error);
        }
    });
});
(0, vitest_1.describe)('unwrap', () => {
    (0, vitest_1.it)('should return value for successful result', () => {
        const result = (0, result_1.success)(42);
        (0, vitest_1.expect)((0, result_1.unwrap)(result)).toBe(42);
    });
    (0, vitest_1.it)('should throw error for failed result', () => {
        const error = new Error('Test error');
        const result = (0, result_1.failure)(error);
        (0, vitest_1.expect)(() => (0, result_1.unwrap)(result)).toThrow(error);
    });
});
(0, vitest_1.describe)('unwrapOr', () => {
    (0, vitest_1.it)('should return value for successful result', () => {
        const result = (0, result_1.success)(42);
        (0, vitest_1.expect)((0, result_1.unwrapOr)(result, 0)).toBe(42);
    });
    (0, vitest_1.it)('should return default value for failed result', () => {
        const result = (0, result_1.failure)(new Error('Error'));
        (0, vitest_1.expect)((0, result_1.unwrapOr)(result, 0)).toBe(0);
    });
});
(0, vitest_1.describe)('map', () => {
    (0, vitest_1.it)('should transform successful result value', () => {
        const result = (0, result_1.success)(42);
        const mapped = (0, result_1.map)(result, (x) => x * 2);
        (0, vitest_1.expect)((0, result_1.isSuccess)(mapped)).toBe(true);
        (0, vitest_1.expect)(mapped.value).toBe(84);
    });
    (0, vitest_1.it)('should pass through failed result unchanged', () => {
        const error = new Error('Error');
        const result = (0, result_1.failure)(error);
        const mapped = (0, result_1.map)(result, (x) => x * 2);
        (0, vitest_1.expect)((0, result_1.isFailure)(mapped)).toBe(true);
        (0, vitest_1.expect)(mapped.error).toBe(error);
    });
});
(0, vitest_1.describe)('chain', () => {
    (0, vitest_1.it)('should chain successful operations', () => {
        const result = (0, result_1.success)(42);
        const chained = (0, result_1.chain)(result, (x) => (0, result_1.success)(x * 2));
        (0, vitest_1.expect)((0, result_1.isSuccess)(chained)).toBe(true);
        (0, vitest_1.expect)(chained.value).toBe(84);
    });
    (0, vitest_1.it)('should pass through failure from original result', () => {
        const error = new Error('Error');
        const result = (0, result_1.failure)(error);
        const chained = (0, result_1.chain)(result, (x) => (0, result_1.success)(x * 2));
        (0, vitest_1.expect)((0, result_1.isFailure)(chained)).toBe(true);
        (0, vitest_1.expect)(chained.error).toBe(error);
    });
    (0, vitest_1.it)('should return failure from chained function', () => {
        const result = (0, result_1.success)(42);
        const chained = (0, result_1.chain)(result, () => (0, result_1.failure)(new Error('Chain error')));
        (0, vitest_1.expect)((0, result_1.isFailure)(chained)).toBe(true);
    });
});
(0, vitest_1.describe)('mapError', () => {
    (0, vitest_1.it)('should transform error in failed result', () => {
        const result = (0, result_1.failure)('string error');
        const mapped = (0, result_1.mapError)(result, (e) => new Error(e));
        (0, vitest_1.expect)((0, result_1.isFailure)(mapped)).toBe(true);
        (0, vitest_1.expect)(mapped.error).toBeInstanceOf(Error);
        (0, vitest_1.expect)(mapped.error.message).toBe('string error');
    });
    (0, vitest_1.it)('should pass through successful result unchanged', () => {
        const result = (0, result_1.success)(42);
        const mapped = (0, result_1.mapError)(result, (e) => new Error(e));
        (0, vitest_1.expect)((0, result_1.isSuccess)(mapped)).toBe(true);
        (0, vitest_1.expect)(mapped.value).toBe(42);
    });
});
(0, vitest_1.describe)('onFailure', () => {
    (0, vitest_1.it)('should execute function on failure', () => {
        const error = new Error('Error');
        const result = (0, result_1.failure)(error);
        const callback = vitest_1.vi.fn();
        const returned = (0, result_1.onFailure)(result, callback);
        (0, vitest_1.expect)(callback).toHaveBeenCalledWith(error);
        (0, vitest_1.expect)(returned).toBe(result);
    });
    (0, vitest_1.it)('should not execute function on success', () => {
        const result = (0, result_1.success)(42);
        const callback = vitest_1.vi.fn();
        const returned = (0, result_1.onFailure)(result, callback);
        (0, vitest_1.expect)(callback).not.toHaveBeenCalled();
        (0, vitest_1.expect)(returned).toBe(result);
    });
});
(0, vitest_1.describe)('onSuccess', () => {
    (0, vitest_1.it)('should execute function on success', () => {
        const result = (0, result_1.success)(42);
        const callback = vitest_1.vi.fn();
        const returned = (0, result_1.onSuccess)(result, callback);
        (0, vitest_1.expect)(callback).toHaveBeenCalledWith(42);
        (0, vitest_1.expect)(returned).toBe(result);
    });
    (0, vitest_1.it)('should not execute function on failure', () => {
        const result = (0, result_1.failure)(new Error('Error'));
        const callback = vitest_1.vi.fn();
        const returned = (0, result_1.onSuccess)(result, callback);
        (0, vitest_1.expect)(callback).not.toHaveBeenCalled();
        (0, vitest_1.expect)(returned).toBe(result);
    });
});
(0, vitest_1.describe)('fromPromise', () => {
    (0, vitest_1.it)('should convert resolved promise to success', async () => {
        const promise = Promise.resolve(42);
        const result = await (0, result_1.fromPromise)(promise);
        (0, vitest_1.expect)((0, result_1.isSuccess)(result)).toBe(true);
        (0, vitest_1.expect)(result.value).toBe(42);
    });
    (0, vitest_1.it)('should convert rejected promise with Error to failure', async () => {
        const error = new Error('Async error');
        const promise = Promise.reject(error);
        const result = await (0, result_1.fromPromise)(promise);
        (0, vitest_1.expect)((0, result_1.isFailure)(result)).toBe(true);
        const resultError = result.error;
        (0, vitest_1.expect)(resultError).toBeInstanceOf(result_1.ResultError);
        (0, vitest_1.expect)(resultError.message).toBe('Async error');
    });
    (0, vitest_1.it)('should convert rejected promise with non-Error to failure', async () => {
        const promise = Promise.reject('string error');
        const result = await (0, result_1.fromPromise)(promise);
        (0, vitest_1.expect)((0, result_1.isFailure)(result)).toBe(true);
        const resultError = result.error;
        (0, vitest_1.expect)(resultError.message).toBe('string error');
        (0, vitest_1.expect)(resultError.code).toBe(result_1.ErrorCode.UNKNOWN_ERROR);
    });
    (0, vitest_1.it)('should use custom error handler', async () => {
        const promise = Promise.reject(new Error('Original'));
        const errorHandler = () => ({
            code: result_1.ErrorCode.NETWORK_ERROR,
            message: 'Custom error message',
        });
        const result = await (0, result_1.fromPromise)(promise, errorHandler);
        (0, vitest_1.expect)((0, result_1.isFailure)(result)).toBe(true);
        const resultError = result.error;
        (0, vitest_1.expect)(resultError.code).toBe(result_1.ErrorCode.NETWORK_ERROR);
        (0, vitest_1.expect)(resultError.message).toBe('Custom error message');
    });
});
(0, vitest_1.describe)('tryCatch', () => {
    (0, vitest_1.it)('should return success for non-throwing function', () => {
        const result = (0, result_1.tryCatch)(() => 42);
        (0, vitest_1.expect)((0, result_1.isSuccess)(result)).toBe(true);
        (0, vitest_1.expect)(result.value).toBe(42);
    });
    (0, vitest_1.it)('should return failure for throwing function with Error', () => {
        const error = new Error('Sync error');
        const result = (0, result_1.tryCatch)(() => {
            throw error;
        });
        (0, vitest_1.expect)((0, result_1.isFailure)(result)).toBe(true);
        const resultError = result.error;
        (0, vitest_1.expect)(resultError).toBeInstanceOf(result_1.ResultError);
        (0, vitest_1.expect)(resultError.message).toBe('Sync error');
    });
    (0, vitest_1.it)('should return failure for throwing function with non-Error', () => {
        const result = (0, result_1.tryCatch)(() => {
            throw 'string error';
        });
        (0, vitest_1.expect)((0, result_1.isFailure)(result)).toBe(true);
        const resultError = result.error;
        (0, vitest_1.expect)(resultError.message).toBe('string error');
        (0, vitest_1.expect)(resultError.code).toBe(result_1.ErrorCode.UNKNOWN_ERROR);
    });
    (0, vitest_1.it)('should use custom error handler', () => {
        const errorHandler = () => ({
            code: result_1.ErrorCode.VALIDATION_FAILED,
            message: 'Custom validation error',
        });
        const result = (0, result_1.tryCatch)(() => {
            throw new Error('Original');
        }, errorHandler);
        (0, vitest_1.expect)((0, result_1.isFailure)(result)).toBe(true);
        const resultError = result.error;
        (0, vitest_1.expect)(resultError.code).toBe(result_1.ErrorCode.VALIDATION_FAILED);
        (0, vitest_1.expect)(resultError.message).toBe('Custom validation error');
    });
});
(0, vitest_1.describe)('all', () => {
    (0, vitest_1.it)('should return success with array of values for all successful results', () => {
        const results = [(0, result_1.success)(1), (0, result_1.success)(2), (0, result_1.success)(3)];
        const combined = (0, result_1.all)(results);
        (0, vitest_1.expect)((0, result_1.isSuccess)(combined)).toBe(true);
        (0, vitest_1.expect)(combined.value).toEqual([1, 2, 3]);
    });
    (0, vitest_1.it)('should return first failure when any result fails', () => {
        const error = new Error('Error');
        const results = [(0, result_1.success)(1), (0, result_1.failure)(error), (0, result_1.success)(3)];
        const combined = (0, result_1.all)(results);
        (0, vitest_1.expect)((0, result_1.isFailure)(combined)).toBe(true);
        (0, vitest_1.expect)(combined.error).toBe(error);
    });
    (0, vitest_1.it)('should handle empty array', () => {
        const combined = (0, result_1.all)([]);
        (0, vitest_1.expect)((0, result_1.isSuccess)(combined)).toBe(true);
        // @ts-expect-error - test mock type
        (0, vitest_1.expect)(combined.value).toEqual([]);
    });
    (0, vitest_1.it)('should return first error only', () => {
        const error1 = new Error('Error 1');
        const error2 = new Error('Error 2');
        const results = [(0, result_1.failure)(error1), (0, result_1.failure)(error2)];
        const combined = (0, result_1.all)(results);
        (0, vitest_1.expect)((0, result_1.isFailure)(combined)).toBe(true);
        (0, vitest_1.expect)(combined.error).toBe(error1);
    });
});
(0, vitest_1.describe)('ErrorCode', () => {
    (0, vitest_1.it)('should have all expected error codes', () => {
        (0, vitest_1.expect)(result_1.ErrorCode.TERMINAL_NOT_FOUND).toBe('TERMINAL_NOT_FOUND');
        (0, vitest_1.expect)(result_1.ErrorCode.TERMINAL_CREATION_FAILED).toBe('TERMINAL_CREATION_FAILED');
        (0, vitest_1.expect)(result_1.ErrorCode.TERMINAL_PROCESS_FAILED).toBe('TERMINAL_PROCESS_FAILED');
        (0, vitest_1.expect)(result_1.ErrorCode.TERMINAL_ALREADY_EXISTS).toBe('TERMINAL_ALREADY_EXISTS');
        (0, vitest_1.expect)(result_1.ErrorCode.CONFIG_NOT_FOUND).toBe('CONFIG_NOT_FOUND');
        (0, vitest_1.expect)(result_1.ErrorCode.CONFIG_INVALID).toBe('CONFIG_INVALID');
        (0, vitest_1.expect)(result_1.ErrorCode.CONFIG_LOAD_FAILED).toBe('CONFIG_LOAD_FAILED');
        (0, vitest_1.expect)(result_1.ErrorCode.FILE_NOT_FOUND).toBe('FILE_NOT_FOUND');
        (0, vitest_1.expect)(result_1.ErrorCode.FILE_READ_FAILED).toBe('FILE_READ_FAILED');
        (0, vitest_1.expect)(result_1.ErrorCode.FILE_WRITE_FAILED).toBe('FILE_WRITE_FAILED');
        (0, vitest_1.expect)(result_1.ErrorCode.FILE_PERMISSION_DENIED).toBe('FILE_PERMISSION_DENIED');
        (0, vitest_1.expect)(result_1.ErrorCode.NETWORK_ERROR).toBe('NETWORK_ERROR');
        (0, vitest_1.expect)(result_1.ErrorCode.IPC_COMMUNICATION_FAILED).toBe('IPC_COMMUNICATION_FAILED');
        (0, vitest_1.expect)(result_1.ErrorCode.INVALID_STATE).toBe('INVALID_STATE');
        (0, vitest_1.expect)(result_1.ErrorCode.STATE_TRANSITION_FAILED).toBe('STATE_TRANSITION_FAILED');
        (0, vitest_1.expect)(result_1.ErrorCode.INVALID_INPUT).toBe('INVALID_INPUT');
        (0, vitest_1.expect)(result_1.ErrorCode.VALIDATION_FAILED).toBe('VALIDATION_FAILED');
        (0, vitest_1.expect)(result_1.ErrorCode.RESOURCE_EXHAUSTED).toBe('RESOURCE_EXHAUSTED');
        (0, vitest_1.expect)(result_1.ErrorCode.RESOURCE_LOCKED).toBe('RESOURCE_LOCKED');
        (0, vitest_1.expect)(result_1.ErrorCode.PERSISTENCE_LOAD_FAILED).toBe('PERSISTENCE_LOAD_FAILED');
        (0, vitest_1.expect)(result_1.ErrorCode.PERSISTENCE_SAVE_FAILED).toBe('PERSISTENCE_SAVE_FAILED');
        (0, vitest_1.expect)(result_1.ErrorCode.SERIALIZATION_FAILED).toBe('SERIALIZATION_FAILED');
        (0, vitest_1.expect)(result_1.ErrorCode.DESERIALIZATION_FAILED).toBe('DESERIALIZATION_FAILED');
        (0, vitest_1.expect)(result_1.ErrorCode.SESSION_NOT_FOUND).toBe('SESSION_NOT_FOUND');
        (0, vitest_1.expect)(result_1.ErrorCode.SESSION_RESTORE_FAILED).toBe('SESSION_RESTORE_FAILED');
        (0, vitest_1.expect)(result_1.ErrorCode.SESSION_CORRUPTED).toBe('SESSION_CORRUPTED');
        (0, vitest_1.expect)(result_1.ErrorCode.CLI_AGENT_NOT_DETECTED).toBe('CLI_AGENT_NOT_DETECTED');
        (0, vitest_1.expect)(result_1.ErrorCode.CLI_AGENT_CONNECTION_FAILED).toBe('CLI_AGENT_CONNECTION_FAILED');
        (0, vitest_1.expect)(result_1.ErrorCode.CLI_AGENT_DISCONNECTED).toBe('CLI_AGENT_DISCONNECTED');
        (0, vitest_1.expect)(result_1.ErrorCode.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
        (0, vitest_1.expect)(result_1.ErrorCode.OPERATION_FAILED).toBe('OPERATION_FAILED');
        (0, vitest_1.expect)(result_1.ErrorCode.NOT_IMPLEMENTED).toBe('NOT_IMPLEMENTED');
        (0, vitest_1.expect)(result_1.ErrorCode.TIMEOUT).toBe('TIMEOUT');
    });
});
//# sourceMappingURL=result.test.js.map