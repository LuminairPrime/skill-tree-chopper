"use strict";
/**
 * ValidationUtils - Centralized validation logic to eliminate duplication
 * Consolidates validation patterns found across multiple components
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationUtils = void 0;
const logger_1 = require("../../utils/logger");
/**
 * Centralized validation utilities class
 */
function checkNumberRange(value, fieldName, min, max) {
    if (value < min) {
        return { isValid: false, error: `${fieldName} must be at least ${min}` };
    }
    if (value > max) {
        return { isValid: false, error: `${fieldName} must be no more than ${max}` };
    }
    return undefined;
}
function checkStringLength(value, fieldName, minLength, maxLength) {
    if (value.length < minLength) {
        return {
            isValid: false,
            error: `${fieldName} must be at least ${minLength} characters long`,
        };
    }
    if (value.length > maxLength) {
        return {
            isValid: false,
            error: `${fieldName} must be no more than ${maxLength} characters long`,
        };
    }
    return undefined;
}
class ValidationUtils {
    /**
     * Validate string input
     */
    static validateString(value, fieldName, options = {}) {
        const { required = true, allowEmpty = false, minLength = 0, maxLength = Infinity } = options;
        if (value === null || value === undefined) {
            return required
                ? { isValid: false, error: `${fieldName} is required` }
                : { isValid: true, value: '' };
        }
        const stringValue = String(value);
        if (!allowEmpty && stringValue.trim().length === 0) {
            return required
                ? { isValid: false, error: `${fieldName} cannot be empty` }
                : { isValid: true, value: '' };
        }
        const lengthError = checkStringLength(stringValue, fieldName, minLength, maxLength);
        if (lengthError)
            return lengthError;
        return { isValid: true, value: stringValue };
    }
    /**
     * Validate terminal ID
     */
    static validateTerminalId(terminalId) {
        const result = this.validateString(terminalId, 'Terminal ID', {
            required: true,
            allowEmpty: false,
            minLength: 1,
            maxLength: 100,
        });
        if (!result.isValid) {
            return result;
        }
        // Additional terminal ID specific validation
        const id = result.value;
        if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
            return {
                isValid: false,
                error: 'Terminal ID can only contain alphanumeric characters, hyphens, and underscores',
            };
        }
        return { isValid: true, value: id };
    }
    /**
     * Validate DOM element
     */
    static validateElement(element, elementType = 'Element') {
        if (!element) {
            return { isValid: false, error: `${elementType} is required` };
        }
        if (!(element instanceof HTMLElement)) {
            return { isValid: false, error: `${elementType} must be a valid HTML element` };
        }
        return { isValid: true, value: element };
    }
    /**
     * Validate number input
     */
    static validateNumber(value, fieldName, options = {}) {
        const { min = -Infinity, max = Infinity, integer = false } = options;
        if (value === null || value === undefined) {
            return { isValid: false, error: `${fieldName} is required` };
        }
        const numValue = Number(value);
        if (isNaN(numValue)) {
            return { isValid: false, error: `${fieldName} must be a valid number` };
        }
        if (integer && !Number.isInteger(numValue)) {
            return { isValid: false, error: `${fieldName} must be an integer` };
        }
        const rangeError = checkNumberRange(numValue, fieldName, min, max);
        if (rangeError)
            return rangeError;
        return { isValid: true, value: numValue };
    }
    /**
     * Validate terminal settings
     */
    static validateTerminalSettings(settings) {
        if (!settings || typeof settings !== 'object') {
            return { isValid: false, error: 'Terminal settings must be an object' };
        }
        // Add specific terminal settings validation as needed
        return { isValid: true, value: settings };
    }
    /**
     * Validate message command
     */
    static validateMessageCommand(command) {
        // Allow any string command for flexibility in validation
        // Actual command validation is handled by the message handlers
        const result = this.validateString(command, 'Command', { required: true });
        return result;
    }
    /**
     * Validate and sanitize data for safe processing
     */
    static sanitizeData(data, maxSize = 1024 * 1024) {
        if (data === null || data === undefined) {
            return { isValid: true, value: '' };
        }
        try {
            const serialized = JSON.stringify(data);
            if (serialized.length > maxSize) {
                return {
                    isValid: false,
                    error: `Data size exceeds maximum allowed size (${maxSize} bytes)`,
                };
            }
            return { isValid: true, value: JSON.parse(serialized) };
        }
        catch (error) {
            return { isValid: false, error: `Data serialization failed: ${String(error)}` };
        }
    }
    /**
     * Validate coordinator instance
     */
    static validateCoordinator(coordinator) {
        if (!coordinator) {
            return { isValid: false, error: 'Coordinator is required' };
        }
        if (typeof coordinator !== 'object') {
            return { isValid: false, error: 'Coordinator must be an object' };
        }
        // Check for required coordinator methods
        const requiredMethods = ['getActiveTerminalId', 'postMessageToExtension', 'log'];
        for (const method of requiredMethods) {
            if (typeof coordinator[method] !== 'function') {
                return { isValid: false, error: `Coordinator missing required method: ${method}` };
            }
        }
        return { isValid: true, value: coordinator };
    }
    /**
     * Batch validate multiple values
     */
    static validateBatch(validations) {
        const errors = [];
        for (const validation of validations) {
            const result = validation();
            if (!result.isValid && result.error) {
                errors.push(result.error);
            }
        }
        if (errors.length > 0) {
            return { isValid: false, error: errors.join('; ') };
        }
        return { isValid: true };
    }
    /**
     * Create validation wrapper with logging
     */
    static createValidationWrapper(func, validations, logPrefix = '[VALIDATION]') {
        return ((...args) => {
            try {
                // Run all validations
                const batchResult = this.validateBatch(validations.map((v) => () => v(args)));
                if (!batchResult.isValid) {
                    (0, logger_1.webview)(`${logPrefix} Validation failed: ${batchResult.error}`);
                    throw new Error(batchResult.error);
                }
                return func.apply(this, args);
            }
            catch (error) {
                (0, logger_1.webview)(`${logPrefix} Operation failed: ${String(error)}`);
                throw error;
            }
        });
    }
}
exports.ValidationUtils = ValidationUtils;
//# sourceMappingURL=ValidationUtils.js.map