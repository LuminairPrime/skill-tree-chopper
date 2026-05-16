"use strict";
/**
 * Grid Layout Calculator
 *
 * Calculates fixed 2x5 grid distribution for 6-10 terminals in split mode.
 *
 * Distribution examples:
 *   6 → 5+1, 7 → 5+2, 8 → 5+3, 9 → 5+4, 10 → 5+5
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDistribution = calculateDistribution;
exports.shouldUseGrid = shouldUseGrid;
exports.getGridTemplateColumns = getGridTemplateColumns;
const webview_1 = require("../constants/webview");
const GRID_MAX_COLUMNS = 5;
const GRID_MAX_TERMINALS = 10;
/**
 * Calculate how terminals should be distributed across fixed 2x5 rows.
 * Row 1 is filled first up to 5, row 2 receives the remainder.
 */
function calculateDistribution(count) {
    if (count <= 0) {
        return { row1: 0, row2: 0 };
    }
    const row1 = Math.min(count, GRID_MAX_COLUMNS);
    const row2 = Math.max(0, count - row1);
    return { row1, row2 };
}
/**
 * Determine whether grid layout should be used.
 * Grid is activated when: split mode + 6-10 terminals.
 */
function shouldUseGrid(terminalCount, panelLocation, isSplitMode) {
    return (panelLocation === 'panel' &&
        terminalCount >= webview_1.GRID_LAYOUT_CONSTANTS.MIN_TERMINALS_FOR_GRID &&
        terminalCount <= GRID_MAX_TERMINALS &&
        isSplitMode);
}
/**
 * Generate CSS grid-template-columns value for a given column count.
 */
function getGridTemplateColumns(columnCount) {
    return `repeat(${columnCount}, 1fr)`;
}
//# sourceMappingURL=GridLayoutCalculator.js.map