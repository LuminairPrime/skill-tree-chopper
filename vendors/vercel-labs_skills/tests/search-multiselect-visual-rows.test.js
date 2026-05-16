"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const picocolors_1 = require("picocolors");
const search_multiselect_ts_1 = require("../src/prompts/search-multiselect.ts");
(0, vitest_1.describe)('searchMultiselect visual row counting', () => {
    (0, vitest_1.it)('counts ASCII width as one column per character', () => {
        (0, vitest_1.expect)((0, search_multiselect_ts_1.approxStringWidth)('abc')).toBe(3);
        (0, vitest_1.expect)((0, search_multiselect_ts_1.approxStringWidth)('a'.repeat(160))).toBe(160);
    });
    (0, vitest_1.it)('treats common CJK as double-width', () => {
        (0, vitest_1.expect)((0, search_multiselect_ts_1.approxStringWidth)('中')).toBe(2);
        (0, vitest_1.expect)((0, search_multiselect_ts_1.approxStringWidth)('中文')).toBe(4);
    });
    (0, vitest_1.it)('computes wrap rows for long ASCII lines', () => {
        const line = 'x'.repeat(160);
        (0, vitest_1.expect)((0, search_multiselect_ts_1.visualRowsForLine)(line, 80)).toBe(2);
        (0, vitest_1.expect)((0, search_multiselect_ts_1.visualRowsForLine)(line, 40)).toBe(4);
    });
    (0, vitest_1.it)('strips ANSI before measuring so colors do not affect wrap', () => {
        const line = picocolors_1.default.bold('z'.repeat(100));
        (0, vitest_1.expect)((0, search_multiselect_ts_1.visualRowsForLine)(line, 80)).toBe(2);
    });
    (0, vitest_1.it)('sums logical lines using explicit column width', () => {
        const lines = ['short', 'x'.repeat(160)];
        (0, vitest_1.expect)((0, search_multiselect_ts_1.countVisualRowsForLines)(lines, 80)).toBe(1 + 2);
    });
    (0, vitest_1.it)('matches prior behavior when each line fits in one row', () => {
        const lines = ['a', 'b', 'c'];
        (0, vitest_1.expect)((0, search_multiselect_ts_1.countVisualRowsForLines)(lines, 120)).toBe(3);
    });
});
//# sourceMappingURL=search-multiselect-visual-rows.test.js.map