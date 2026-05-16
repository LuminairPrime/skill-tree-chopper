"use strict";
/**
 * Result Pattern - Type-safe error handling
 *
 * This module provides a standardized way to handle errors throughout the codebase.
 * It replaces inconsistent error handling patterns (try-catch with void/boolean returns,
 * silent error swallowing) with explicit, type-safe Result objects.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultError = exports.ErrorCode = void 0;
exports.success = success;
exports.failure = failure;
exports.failureFromDetails = failureFromDetails;
exports.failureFromError = failureFromError;
exports.isSuccess = isSuccess;
exports.isFailure = isFailure;
exports.unwrap = unwrap;
exports.unwrapOr = unwrapOr;
exports.map = map;
exports.chain = chain;
exports.mapError = mapError;
exports.onFailure = onFailure;
exports.onSuccess = onSuccess;
exports.fromPromise = fromPromise;
exports.tryCatch = tryCatch;
exports.all = all;
/**
 * Standardized error codes for consistent error classification
 */
var ErrorCode;
(function (ErrorCode) {
    // Terminal operation errors
    ErrorCode["TERMINAL_NOT_FOUND"] = "TERMINAL_NOT_FOUND";
    ErrorCode["TERMINAL_CREATION_FAILED"] = "TERMINAL_CREATION_FAILED";
    ErrorCode["TERMINAL_PROCESS_FAILED"] = "TERMINAL_PROCESS_FAILED";
    ErrorCode["TERMINAL_ALREADY_EXISTS"] = "TERMINAL_ALREADY_EXISTS";
    // Configuration errors
    ErrorCode["CONFIG_NOT_FOUND"] = "CONFIG_NOT_FOUND";
    ErrorCode["CONFIG_INVALID"] = "CONFIG_INVALID";
    ErrorCode["CONFIG_LOAD_FAILED"] = "CONFIG_LOAD_FAILED";
    // File system errors
    ErrorCode["FILE_NOT_FOUND"] = "FILE_NOT_FOUND";
    ErrorCode["FILE_READ_FAILED"] = "FILE_READ_FAILED";
    ErrorCode["FILE_WRITE_FAILED"] = "FILE_WRITE_FAILED";
    ErrorCode["FILE_PERMISSION_DENIED"] = "FILE_PERMISSION_DENIED";
    // Network/IPC errors
    ErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
    ErrorCode["IPC_COMMUNICATION_FAILED"] = "IPC_COMMUNICATION_FAILED";
    // State management errors
    ErrorCode["INVALID_STATE"] = "INVALID_STATE";
    ErrorCode["STATE_TRANSITION_FAILED"] = "STATE_TRANSITION_FAILED";
    // Validation errors
    ErrorCode["INVALID_INPUT"] = "INVALID_INPUT";
    ErrorCode["VALIDATION_FAILED"] = "VALIDATION_FAILED";
    // Resource errors
    ErrorCode["RESOURCE_EXHAUSTED"] = "RESOURCE_EXHAUSTED";
    ErrorCode["RESOURCE_LOCKED"] = "RESOURCE_LOCKED";
    // Persistence errors
    ErrorCode["PERSISTENCE_LOAD_FAILED"] = "PERSISTENCE_LOAD_FAILED";
    ErrorCode["PERSISTENCE_SAVE_FAILED"] = "PERSISTENCE_SAVE_FAILED";
    ErrorCode["SERIALIZATION_FAILED"] = "SERIALIZATION_FAILED";
    ErrorCode["DESERIALIZATION_FAILED"] = "DESERIALIZATION_FAILED";
    // Session errors
    ErrorCode["SESSION_NOT_FOUND"] = "SESSION_NOT_FOUND";
    ErrorCode["SESSION_RESTORE_FAILED"] = "SESSION_RESTORE_FAILED";
    ErrorCode["SESSION_CORRUPTED"] = "SESSION_CORRUPTED";
    // CLI Agent errors
    ErrorCode["CLI_AGENT_NOT_DETECTED"] = "CLI_AGENT_NOT_DETECTED";
    ErrorCode["CLI_AGENT_CONNECTION_FAILED"] = "CLI_AGENT_CONNECTION_FAILED";
    ErrorCode["CLI_AGENT_DISCONNECTED"] = "CLI_AGENT_DISCONNECTED";
    // Generic errors
    ErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
    ErrorCode["OPERATION_FAILED"] = "OPERATION_FAILED";
    ErrorCode["NOT_IMPLEMENTED"] = "NOT_IMPLEMENTED";
    ErrorCode["TIMEOUT"] = "TIMEOUT";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
/**
 * Custom error class that includes structured error details
 */
class ResultError extends Error {
    constructor(details) {
        super(details.message);
        this.name = 'ResultError';
        this.code = details.code;
        this.context = details.context;
        this.cause = details.cause;
        // Preserve stack trace
        if (details.stack) {
            this.stack = details.stack;
        }
        else if (details.cause?.stack) {
            this.stack = details.cause.stack;
        }
        else if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ResultError);
        }
    }
    /**
     * Convert to a plain object for serialization
     */
    toJSON() {
        return {
            code: this.code,
            message: this.message,
            context: this.context,
            stack: this.stack,
        };
    }
}
exports.ResultError = ResultError;
/**
 * Helper function to create a successful Result
 * @param value - The success value
 * @returns Result with success: true
 */
function success(value) {
    return { success: true, value };
}
/**
 * Helper function to create a failed Result
 * @param error - The error value
 * @returns Result with success: false
 */
function failure(error) {
    return { success: false, error };
}
/**
 * Helper function to create a failed Result from ErrorDetails
 * @param details - Structured error details
 * @returns Result with ResultError
 */
function failureFromDetails(details) {
    return failure(new ResultError(details));
}
/**
 * Helper function to wrap a native Error into a Result
 * @param error - Native Error object
 * @param code - Error code to classify the error
 * @param context - Additional context
 * @returns Result with ResultError
 */
function failureFromError(error, code = ErrorCode.UNKNOWN_ERROR, context) {
    return failure(new ResultError({
        code,
        message: error.message,
        context,
        cause: error,
        stack: error.stack,
    }));
}
/**
 * Type guard to check if a Result is successful
 * @param result - Result to check
 * @returns true if result is successful
 */
function isSuccess(result) {
    return result.success === true;
}
/**
 * Type guard to check if a Result is a failure
 * @param result - Result to check
 * @returns true if result is a failure
 */
function isFailure(result) {
    return result.success === false;
}
/**
 * Unwrap a Result, throwing an error if it's a failure
 * @param result - Result to unwrap
 * @returns The success value
 * @throws The error if result is a failure
 */
function unwrap(result) {
    if (isSuccess(result)) {
        return result.value;
    }
    throw result.error;
}
/**
 * Unwrap a Result, returning a default value if it's a failure
 * @param result - Result to unwrap
 * @param defaultValue - Default value to return on failure
 * @returns The success value or default value
 */
function unwrapOr(result, defaultValue) {
    return isSuccess(result) ? result.value : defaultValue;
}
/**
 * Map a successful Result value to a new value
 * @param result - Result to map
 * @param fn - Mapping function
 * @returns New Result with mapped value
 */
function map(result, fn) {
    return isSuccess(result) ? success(fn(result.value)) : result;
}
/**
 * Chain Result operations (flatMap)
 * @param result - Result to chain from
 * @param fn - Function that returns a new Result
 * @returns New Result
 */
function chain(result, fn) {
    return isSuccess(result) ? fn(result.value) : result;
}
/**
 * Map error in a Result
 * @param result - Result to map error
 * @param fn - Error mapping function
 * @returns New Result with mapped error
 */
function mapError(result, fn) {
    return isFailure(result) ? failure(fn(result.error)) : result;
}
/**
 * Execute a function on the error if Result is a failure
 * @param result - Result to check
 * @param fn - Function to execute on error
 * @returns Original result
 */
function onFailure(result, fn) {
    if (isFailure(result)) {
        fn(result.error);
    }
    return result;
}
/**
 * Execute a function on the value if Result is successful
 * @param result - Result to check
 * @param fn - Function to execute on value
 * @returns Original result
 */
function onSuccess(result, fn) {
    if (isSuccess(result)) {
        fn(result.value);
    }
    return result;
}
/**
 * Convert a Promise to a Result
 * Useful for wrapping async operations
 * @param promise - Promise to convert
 * @param errorHandler - Optional function to convert error to ErrorDetails
 * @returns Promise that resolves to Result
 */
async function fromPromise(promise, errorHandler) {
    try {
        const value = await promise;
        return success(value);
    }
    catch (error) {
        if (errorHandler) {
            return failureFromDetails(errorHandler(error));
        }
        if (error instanceof Error) {
            return failureFromError(error);
        }
        return failureFromDetails({
            code: ErrorCode.UNKNOWN_ERROR,
            message: String(error),
        });
    }
}
/**
 * Execute a function and wrap the result in a Result
 * Catches any thrown errors
 * @param fn - Function to execute
 * @param errorHandler - Optional function to convert error to ErrorDetails
 * @returns Result
 */
function tryCatch(fn, errorHandler) {
    try {
        return success(fn());
    }
    catch (error) {
        if (errorHandler) {
            return failureFromDetails(errorHandler(error));
        }
        if (error instanceof Error) {
            return failureFromError(error);
        }
        return failureFromDetails({
            code: ErrorCode.UNKNOWN_ERROR,
            message: String(error),
        });
    }
}
/**
 * Combine multiple Results into a single Result
 * Returns success only if all Results are successful
 * @param results - Array of Results to combine
 * @returns Result with array of values or first error
 */
function all(results) {
    const values = [];
    for (const result of results) {
        if (isFailure(result)) {
            return result;
        }
        values.push(result.value);
    }
    return success(values);
}
//# sourceMappingURL=result.js.map