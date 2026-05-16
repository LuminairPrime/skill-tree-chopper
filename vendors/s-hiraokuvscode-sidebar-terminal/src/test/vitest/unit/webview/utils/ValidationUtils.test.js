"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const ValidationUtils_1 = require("../../../../../webview/utils/ValidationUtils");
(0, vitest_1.describe)('ValidationUtils', () => {
    let dom;
    (0, vitest_1.beforeEach)(() => {
        dom = new jsdom_1.JSDOM('<!DOCTYPE html><html><body><div id="test"></div></body></html>');
        vitest_1.vi.stubGlobal('HTMLElement', dom.window.HTMLElement);
    });
    (0, vitest_1.describe)('validateString', () => {
        (0, vitest_1.it)('should validate normal strings', () => {
            const result = ValidationUtils_1.ValidationUtils.validateString('hello', 'Field');
            (0, vitest_1.expect)(result.isValid).toBe(true);
            (0, vitest_1.expect)(result.value).toBe('hello');
        });
        (0, vitest_1.it)('should fail for empty strings when not allowed', () => {
            const result = ValidationUtils_1.ValidationUtils.validateString('  ', 'Field', { allowEmpty: false });
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('cannot be empty');
        });
        (0, vitest_1.it)('should enforce min and max length', () => {
            const minRes = ValidationUtils_1.ValidationUtils.validateString('a', 'Field', { minLength: 3 });
            (0, vitest_1.expect)(minRes.isValid).toBe(false);
            const maxRes = ValidationUtils_1.ValidationUtils.validateString('abcd', 'Field', { maxLength: 2 });
            (0, vitest_1.expect)(maxRes.isValid).toBe(false);
        });
    });
    (0, vitest_1.describe)('validateTerminalId', () => {
        (0, vitest_1.it)('should allow alphanumeric with hyphens and underscores', () => {
            (0, vitest_1.expect)(ValidationUtils_1.ValidationUtils.validateTerminalId('term-123_abc').isValid).toBe(true);
        });
        (0, vitest_1.it)('should reject invalid characters', () => {
            const result = ValidationUtils_1.ValidationUtils.validateTerminalId('term $123');
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('only contain alphanumeric');
        });
    });
    (0, vitest_1.describe)('validateNumber', () => {
        (0, vitest_1.it)('should validate valid numbers in range', () => {
            const result = ValidationUtils_1.ValidationUtils.validateNumber(10, 'Count', { min: 5, max: 15 });
            (0, vitest_1.expect)(result.isValid).toBe(true);
            (0, vitest_1.expect)(result.value).toBe(10);
        });
        (0, vitest_1.it)('should reject non-numbers', () => {
            (0, vitest_1.expect)(ValidationUtils_1.ValidationUtils.validateNumber('abc', 'Count').isValid).toBe(false);
        });
        (0, vitest_1.it)('should enforce integer requirement', () => {
            const result = ValidationUtils_1.ValidationUtils.validateNumber(10.5, 'Count', { integer: true });
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('must be an integer');
        });
    });
    (0, vitest_1.describe)('validateElement', () => {
        (0, vitest_1.it)('should validate real HTMLElements', () => {
            const el = dom.window.document.createElement('div');
            (0, vitest_1.expect)(ValidationUtils_1.ValidationUtils.validateElement(el).isValid).toBe(true);
        });
        (0, vitest_1.it)('should fail for objects that are not elements', () => {
            (0, vitest_1.expect)(ValidationUtils_1.ValidationUtils.validateElement({}).isValid).toBe(false);
        });
    });
    (0, vitest_1.describe)('sanitizeData', () => {
        (0, vitest_1.it)('should deep copy data via serialization', () => {
            const original = { a: 1, b: [2] };
            const result = ValidationUtils_1.ValidationUtils.sanitizeData(original);
            (0, vitest_1.expect)(result.isValid).toBe(true);
            (0, vitest_1.expect)(result.value).toEqual(original);
            (0, vitest_1.expect)(result.value).not.toBe(original); // Should be a copy
        });
        (0, vitest_1.it)('should reject overly large data', () => {
            const large = 'a'.repeat(100);
            const result = ValidationUtils_1.ValidationUtils.sanitizeData(large, 50); // limit 50 bytes
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('exceeds maximum allowed size');
        });
    });
    (0, vitest_1.describe)('Batch Validation', () => {
        (0, vitest_1.it)('should aggregate multiple errors', () => {
            const result = ValidationUtils_1.ValidationUtils.validateBatch([
                () => ValidationUtils_1.ValidationUtils.validateString('', 'F1'),
                () => ValidationUtils_1.ValidationUtils.validateNumber('nan', 'F2'),
            ]);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('F1');
            (0, vitest_1.expect)(result.error).toContain('F2');
        });
    });
});
//# sourceMappingURL=ValidationUtils.test.js.map