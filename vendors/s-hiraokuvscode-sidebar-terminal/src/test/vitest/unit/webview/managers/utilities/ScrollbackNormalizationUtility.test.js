"use strict";
/**
 * ScrollbackNormalizationUtility Tests
 *
 * Tests for scrollback data normalization and transformation
 *
 * Vitest Migration: Converted from Mocha/Chai to Vitest
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ScrollbackNormalizationUtility_1 = require("../../../../../../webview/managers/utilities/ScrollbackNormalizationUtility");
(0, vitest_1.describe)('ScrollbackNormalizationUtility', () => {
    (0, vitest_1.describe)('normalizeScrollbackContent', () => {
        (0, vitest_1.it)('should normalize string array to ScrollbackLine array', () => {
            const input = ['line 1', 'line 2', 'line 3'];
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.normalizeScrollbackContent(input);
            (0, vitest_1.expect)(result).toHaveLength(3);
            (0, vitest_1.expect)(result[0]).toEqual({ content: 'line 1', type: 'output' });
            (0, vitest_1.expect)(result[1]).toEqual({ content: 'line 2', type: 'output' });
            (0, vitest_1.expect)(result[2]).toEqual({ content: 'line 3', type: 'output' });
        });
        (0, vitest_1.it)('should normalize object array with type fields', () => {
            const input = [
                { content: 'output line', type: 'output' },
                { content: 'input line', type: 'input' },
                { content: 'error line', type: 'error' },
            ];
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.normalizeScrollbackContent(input);
            (0, vitest_1.expect)(result).toHaveLength(3);
            (0, vitest_1.expect)(result[0].type).toBe('output');
            (0, vitest_1.expect)(result[1].type).toBe('input');
            (0, vitest_1.expect)(result[2].type).toBe('error');
        });
        (0, vitest_1.it)('should normalize object array with timestamps', () => {
            const timestamp = Date.now();
            const input = [{ content: 'line 1', type: 'output', timestamp }];
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.normalizeScrollbackContent(input);
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].timestamp).toBe(timestamp);
        });
        (0, vitest_1.it)('should normalize invalid type to output', () => {
            const input = [{ content: 'line 1', type: 'invalid-type' }];
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.normalizeScrollbackContent(input);
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].type).toBe('output');
        });
        (0, vitest_1.it)('should handle empty array', () => {
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.normalizeScrollbackContent([]);
            (0, vitest_1.expect)(result).toBeInstanceOf(Array);
            (0, vitest_1.expect)(result).toHaveLength(0);
        });
        (0, vitest_1.it)('should handle null/undefined input', () => {
            (0, vitest_1.expect)(ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.normalizeScrollbackContent(null)).toHaveLength(0);
            (0, vitest_1.expect)(ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.normalizeScrollbackContent(undefined)).toHaveLength(0);
        });
        (0, vitest_1.it)('should filter out objects without content field', () => {
            const input = [
                { content: 'valid line' },
                { noContent: 'invalid' },
                { content: 'another valid line' },
            ];
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.normalizeScrollbackContent(input);
            (0, vitest_1.expect)(result).toHaveLength(2);
            (0, vitest_1.expect)(result[0].content).toBe('valid line');
            (0, vitest_1.expect)(result[1].content).toBe('another valid line');
        });
        (0, vitest_1.it)('should filter out objects with non-string content', () => {
            const input = [{ content: 'valid line' }, { content: 123 }, { content: null }];
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.normalizeScrollbackContent(input);
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].content).toBe('valid line');
        });
    });
    (0, vitest_1.describe)('formatScrollbackForTransfer', () => {
        (0, vitest_1.it)('should format lines for transfer', () => {
            const input = [
                { content: 'line 1', type: 'output' },
                { content: 'line 2', type: 'input' },
            ];
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.formatScrollbackForTransfer(input);
            (0, vitest_1.expect)(result).toHaveLength(2);
            (0, vitest_1.expect)(result[0]).toHaveProperty('content');
            (0, vitest_1.expect)(result[0]).toHaveProperty('type');
        });
        (0, vitest_1.it)('should include timestamp if present', () => {
            const timestamp = Date.now();
            const input = [{ content: 'line 1', type: 'output', timestamp }];
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.formatScrollbackForTransfer(input);
            (0, vitest_1.expect)(result[0].timestamp).toBe(timestamp);
        });
        (0, vitest_1.it)('should default type to output if not specified', () => {
            const input = [{ content: 'line 1' }];
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.formatScrollbackForTransfer(input);
            (0, vitest_1.expect)(result[0].type).toBe('output');
        });
    });
    (0, vitest_1.describe)('toStringArray', () => {
        (0, vitest_1.it)('should convert to string array', () => {
            const input = [
                { content: 'line 1', type: 'output' },
                { content: 'line 2', type: 'input' },
            ];
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.toStringArray(input);
            (0, vitest_1.expect)(result).toEqual(['line 1', 'line 2']);
        });
        (0, vitest_1.it)('should handle empty array', () => {
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.toStringArray([]);
            (0, vitest_1.expect)(result).toBeInstanceOf(Array);
            (0, vitest_1.expect)(result).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)('filterEmptyLines', () => {
        (0, vitest_1.it)('should filter all empty lines by default', () => {
            const input = [
                { content: 'line 1', type: 'output' },
                { content: '', type: 'output' },
                { content: 'line 2', type: 'output' },
                { content: '  ', type: 'output' },
            ];
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.filterEmptyLines(input);
            (0, vitest_1.expect)(result).toHaveLength(2);
            (0, vitest_1.expect)(result[0].content).toBe('line 1');
            (0, vitest_1.expect)(result[1].content).toBe('line 2');
        });
        (0, vitest_1.it)('should keep structural empty lines when specified', () => {
            const input = [
                { content: 'line 1', type: 'output' },
                { content: '', type: 'output' },
                { content: 'line 2', type: 'output' },
            ];
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.filterEmptyLines(input, true);
            (0, vitest_1.expect)(result).toHaveLength(3);
        });
        (0, vitest_1.it)('should remove leading empty lines when keeping structural', () => {
            const input = [
                { content: '', type: 'output' },
                { content: 'line 1', type: 'output' },
                { content: '', type: 'output' },
                { content: 'line 2', type: 'output' },
            ];
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.filterEmptyLines(input, true);
            (0, vitest_1.expect)(result).toHaveLength(3);
            (0, vitest_1.expect)(result[0].content).toBe('line 1');
        });
        (0, vitest_1.it)('should remove trailing empty lines when keeping structural', () => {
            const input = [
                { content: 'line 1', type: 'output' },
                { content: '', type: 'output' },
                { content: 'line 2', type: 'output' },
                { content: '', type: 'output' },
                { content: '  ', type: 'output' },
            ];
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.filterEmptyLines(input, true);
            (0, vitest_1.expect)(result).toHaveLength(3);
            (0, vitest_1.expect)(result[2].content).toBe('line 2');
        });
    });
    (0, vitest_1.describe)('truncate', () => {
        (0, vitest_1.it)('should truncate from end by default', () => {
            const input = [
                { content: 'line 1', type: 'output' },
                { content: 'line 2', type: 'output' },
                { content: 'line 3', type: 'output' },
                { content: 'line 4', type: 'output' },
            ];
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.truncate(input, 2);
            (0, vitest_1.expect)(result).toHaveLength(2);
            (0, vitest_1.expect)(result[0].content).toBe('line 3');
            (0, vitest_1.expect)(result[1].content).toBe('line 4');
        });
        (0, vitest_1.it)('should truncate from start when specified', () => {
            const input = [
                { content: 'line 1', type: 'output' },
                { content: 'line 2', type: 'output' },
                { content: 'line 3', type: 'output' },
                { content: 'line 4', type: 'output' },
            ];
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.truncate(input, 2, false);
            (0, vitest_1.expect)(result).toHaveLength(2);
            (0, vitest_1.expect)(result[0].content).toBe('line 1');
            (0, vitest_1.expect)(result[1].content).toBe('line 2');
        });
        (0, vitest_1.it)('should return all lines if count is larger than array', () => {
            const input = [
                { content: 'line 1', type: 'output' },
                { content: 'line 2', type: 'output' },
            ];
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.truncate(input, 10);
            (0, vitest_1.expect)(result).toHaveLength(2);
        });
        (0, vitest_1.it)('should handle empty array', () => {
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.truncate([], 5);
            (0, vitest_1.expect)(result).toBeInstanceOf(Array);
            (0, vitest_1.expect)(result).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)('merge', () => {
        (0, vitest_1.it)('should merge multiple arrays', () => {
            const array1 = [{ content: 'line 1', type: 'output' }];
            const array2 = [{ content: 'line 2', type: 'output' }];
            const array3 = [{ content: 'line 3', type: 'output' }];
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.merge(array1, array2, array3);
            (0, vitest_1.expect)(result).toHaveLength(3);
            (0, vitest_1.expect)(result[0].content).toBe('line 1');
            (0, vitest_1.expect)(result[1].content).toBe('line 2');
            (0, vitest_1.expect)(result[2].content).toBe('line 3');
        });
        (0, vitest_1.it)('should handle empty arrays', () => {
            const array1 = [];
            const array2 = [{ content: 'line 1', type: 'output' }];
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.merge(array1, array2);
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].content).toBe('line 1');
        });
        (0, vitest_1.it)('should handle no arguments', () => {
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.merge();
            (0, vitest_1.expect)(result).toBeInstanceOf(Array);
            (0, vitest_1.expect)(result).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)('isValidLine', () => {
        (0, vitest_1.it)('should validate valid line', () => {
            const line = {
                content: 'test',
                type: 'output',
            };
            (0, vitest_1.expect)(ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.isValidLine(line)).toBe(true);
        });
        (0, vitest_1.it)('should validate line with timestamp', () => {
            const line = {
                content: 'test',
                type: 'output',
                timestamp: Date.now(),
            };
            (0, vitest_1.expect)(ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.isValidLine(line)).toBe(true);
        });
        (0, vitest_1.it)('should validate line without type', () => {
            const line = {
                content: 'test',
            };
            (0, vitest_1.expect)(ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.isValidLine(line)).toBe(true);
        });
        (0, vitest_1.it)('should reject line without content', () => {
            const line = {
                type: 'output',
            };
            (0, vitest_1.expect)(ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.isValidLine(line)).toBe(false);
        });
        (0, vitest_1.it)('should reject line with non-string content', () => {
            const line = {
                content: 123,
                type: 'output',
            };
            (0, vitest_1.expect)(ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.isValidLine(line)).toBe(false);
        });
        (0, vitest_1.it)('should reject line with invalid type', () => {
            const line = {
                content: 'test',
                type: 'invalid',
            };
            (0, vitest_1.expect)(ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.isValidLine(line)).toBe(false);
        });
        (0, vitest_1.it)('should reject line with non-number timestamp', () => {
            const line = {
                content: 'test',
                type: 'output',
                timestamp: 'not-a-number',
            };
            (0, vitest_1.expect)(ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.isValidLine(line)).toBe(false);
        });
        (0, vitest_1.it)('should reject null', () => {
            (0, vitest_1.expect)(ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.isValidLine(null)).toBe(false);
        });
        (0, vitest_1.it)('should reject undefined', () => {
            (0, vitest_1.expect)(ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.isValidLine(undefined)).toBe(false);
        });
        (0, vitest_1.it)('should reject non-object', () => {
            (0, vitest_1.expect)(ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.isValidLine('string')).toBe(false);
            (0, vitest_1.expect)(ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.isValidLine(123)).toBe(false);
        });
    });
    (0, vitest_1.describe)('sanitize', () => {
        (0, vitest_1.it)('should sanitize array of lines', () => {
            const input = [
                { content: 'valid', type: 'output' },
                { noContent: 'invalid' },
                { content: 'also valid' },
                { content: 123 },
            ];
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.sanitize(input);
            (0, vitest_1.expect)(result).toHaveLength(2);
            (0, vitest_1.expect)(result[0].content).toBe('valid');
            (0, vitest_1.expect)(result[1].content).toBe('also valid');
        });
        (0, vitest_1.it)('should default missing type to output', () => {
            const input = [{ content: 'line 1' }];
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.sanitize(input);
            (0, vitest_1.expect)(result[0].type).toBe('output');
        });
        (0, vitest_1.it)('should preserve valid types', () => {
            const input = [
                { content: 'out', type: 'output' },
                { content: 'in', type: 'input' },
                { content: 'err', type: 'error' },
            ];
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.sanitize(input);
            (0, vitest_1.expect)(result[0].type).toBe('output');
            (0, vitest_1.expect)(result[1].type).toBe('input');
            (0, vitest_1.expect)(result[2].type).toBe('error');
        });
        (0, vitest_1.it)('should preserve timestamps', () => {
            const timestamp = Date.now();
            const input = [{ content: 'test', timestamp }];
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.sanitize(input);
            (0, vitest_1.expect)(result[0].timestamp).toBe(timestamp);
        });
        (0, vitest_1.it)('should handle empty array', () => {
            const result = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.sanitize([]);
            (0, vitest_1.expect)(result).toBeInstanceOf(Array);
            (0, vitest_1.expect)(result).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)('Integration Tests', () => {
        (0, vitest_1.it)('should normalize, filter, and truncate in sequence', () => {
            const input = ['line 1', 'line 2', '', 'line 3', 'line 4', ''];
            const normalized = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.normalizeScrollbackContent(input);
            const filtered = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.filterEmptyLines(normalized);
            const truncated = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.truncate(filtered, 2);
            (0, vitest_1.expect)(truncated).toHaveLength(2);
            (0, vitest_1.expect)(truncated[0].content).toBe('line 3');
            (0, vitest_1.expect)(truncated[1].content).toBe('line 4');
        });
        (0, vitest_1.it)('should merge, sanitize, and format in sequence', () => {
            const array1 = [{ content: 'line 1', type: 'output' }];
            const array2 = [{ content: 'line 2' }];
            const merged = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.merge(array1, array2);
            const sanitized = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.sanitize(merged);
            const formatted = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.formatScrollbackForTransfer(sanitized);
            (0, vitest_1.expect)(formatted).toHaveLength(2);
            (0, vitest_1.expect)(formatted[0].type).toBe('output');
            (0, vitest_1.expect)(formatted[1].type).toBe('output');
        });
        (0, vitest_1.it)('should convert to string array after processing', () => {
            const input = ['  line 1  ', '', 'line 2', '  '];
            const normalized = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.normalizeScrollbackContent(input);
            const filtered = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.filterEmptyLines(normalized);
            const strings = ScrollbackNormalizationUtility_1.ScrollbackNormalizationUtility.toStringArray(filtered);
            (0, vitest_1.expect)(strings).toEqual(['  line 1  ', 'line 2']);
        });
    });
});
//# sourceMappingURL=ScrollbackNormalizationUtility.test.js.map