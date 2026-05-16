"use strict";
/**
 * GridLayoutCalculator Unit Tests
 *
 * Tests for the fixed 2x5 grid layout calculation logic used when 6-10 terminals
 * are displayed in split mode.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const GridLayoutCalculator_1 = require("../../../../../webview/utils/GridLayoutCalculator");
(0, vitest_1.describe)('GridLayoutCalculator', () => {
    (0, vitest_1.describe)('calculateDistribution', () => {
        (0, vitest_1.it)('should return { row1: 0, row2: 0 } for 0 terminals', () => {
            const result = (0, GridLayoutCalculator_1.calculateDistribution)(0);
            (0, vitest_1.expect)(result).toEqual({ row1: 0, row2: 0 });
        });
        (0, vitest_1.it)('should return { row1: 1, row2: 0 } for 1 terminal', () => {
            const result = (0, GridLayoutCalculator_1.calculateDistribution)(1);
            (0, vitest_1.expect)(result).toEqual({ row1: 1, row2: 0 });
        });
        (0, vitest_1.it)('should return { row1: 5, row2: 0 } for 5 terminals', () => {
            const result = (0, GridLayoutCalculator_1.calculateDistribution)(5);
            (0, vitest_1.expect)(result).toEqual({ row1: 5, row2: 0 });
        });
        (0, vitest_1.it)('should return { row1: 5, row2: 1 } for 6 terminals', () => {
            const result = (0, GridLayoutCalculator_1.calculateDistribution)(6);
            (0, vitest_1.expect)(result).toEqual({ row1: 5, row2: 1 });
        });
        (0, vitest_1.it)('should return { row1: 5, row2: 2 } for 7 terminals', () => {
            const result = (0, GridLayoutCalculator_1.calculateDistribution)(7);
            (0, vitest_1.expect)(result).toEqual({ row1: 5, row2: 2 });
        });
        (0, vitest_1.it)('should return { row1: 5, row2: 3 } for 8 terminals', () => {
            const result = (0, GridLayoutCalculator_1.calculateDistribution)(8);
            (0, vitest_1.expect)(result).toEqual({ row1: 5, row2: 3 });
        });
        (0, vitest_1.it)('should return { row1: 5, row2: 4 } for 9 terminals', () => {
            const result = (0, GridLayoutCalculator_1.calculateDistribution)(9);
            (0, vitest_1.expect)(result).toEqual({ row1: 5, row2: 4 });
        });
        (0, vitest_1.it)('should return { row1: 5, row2: 5 } for 10 terminals', () => {
            const result = (0, GridLayoutCalculator_1.calculateDistribution)(10);
            (0, vitest_1.expect)(result).toEqual({ row1: 5, row2: 5 });
        });
        (0, vitest_1.it)('should handle 11 terminals (beyond 2x5 capacity)', () => {
            const result = (0, GridLayoutCalculator_1.calculateDistribution)(11);
            (0, vitest_1.expect)(result).toEqual({ row1: 5, row2: 6 });
        });
    });
    (0, vitest_1.describe)('shouldUseGrid', () => {
        (0, vitest_1.it)('should return false for fewer than 6 terminals', () => {
            (0, vitest_1.expect)((0, GridLayoutCalculator_1.shouldUseGrid)(5, 'panel', true)).toBe(false);
            (0, vitest_1.expect)((0, GridLayoutCalculator_1.shouldUseGrid)(1, 'panel', true)).toBe(false);
            (0, vitest_1.expect)((0, GridLayoutCalculator_1.shouldUseGrid)(0, 'panel', true)).toBe(false);
        });
        (0, vitest_1.it)('should return true for 6 terminals in panel mode with split', () => {
            (0, vitest_1.expect)((0, GridLayoutCalculator_1.shouldUseGrid)(6, 'panel', true)).toBe(true);
        });
        (0, vitest_1.it)('should return true for 10 terminals in panel mode with split', () => {
            (0, vitest_1.expect)((0, GridLayoutCalculator_1.shouldUseGrid)(10, 'panel', true)).toBe(true);
        });
        (0, vitest_1.it)('should return false for more than 10 terminals', () => {
            (0, vitest_1.expect)((0, GridLayoutCalculator_1.shouldUseGrid)(11, 'panel', true)).toBe(false);
        });
        (0, vitest_1.it)('should return false when not in split mode', () => {
            (0, vitest_1.expect)((0, GridLayoutCalculator_1.shouldUseGrid)(6, 'panel', false)).toBe(false);
            (0, vitest_1.expect)((0, GridLayoutCalculator_1.shouldUseGrid)(10, 'panel', false)).toBe(false);
        });
        (0, vitest_1.it)('should return false for sidebar location even when split mode and 6+ terminals', () => {
            (0, vitest_1.expect)((0, GridLayoutCalculator_1.shouldUseGrid)(6, 'sidebar', true)).toBe(false);
            (0, vitest_1.expect)((0, GridLayoutCalculator_1.shouldUseGrid)(10, 'sidebar', true)).toBe(false);
        });
        (0, vitest_1.it)('should return true for 7, 8, 9 terminals in panel split mode', () => {
            (0, vitest_1.expect)((0, GridLayoutCalculator_1.shouldUseGrid)(7, 'panel', true)).toBe(true);
            (0, vitest_1.expect)((0, GridLayoutCalculator_1.shouldUseGrid)(8, 'panel', true)).toBe(true);
            (0, vitest_1.expect)((0, GridLayoutCalculator_1.shouldUseGrid)(9, 'panel', true)).toBe(true);
        });
    });
    (0, vitest_1.describe)('getGridTemplateColumns', () => {
        (0, vitest_1.it)('should return repeat(1, 1fr) for 1 column', () => {
            (0, vitest_1.expect)((0, GridLayoutCalculator_1.getGridTemplateColumns)(1)).toBe('repeat(1, 1fr)');
        });
        (0, vitest_1.it)('should return repeat(3, 1fr) for 3 columns', () => {
            (0, vitest_1.expect)((0, GridLayoutCalculator_1.getGridTemplateColumns)(3)).toBe('repeat(3, 1fr)');
        });
        (0, vitest_1.it)('should return repeat(4, 1fr) for 4 columns', () => {
            (0, vitest_1.expect)((0, GridLayoutCalculator_1.getGridTemplateColumns)(4)).toBe('repeat(4, 1fr)');
        });
        (0, vitest_1.it)('should return repeat(5, 1fr) for 5 columns', () => {
            (0, vitest_1.expect)((0, GridLayoutCalculator_1.getGridTemplateColumns)(5)).toBe('repeat(5, 1fr)');
        });
    });
});
//# sourceMappingURL=GridLayoutCalculator.test.js.map