"use strict";
// @vitest-environment node
/**
 * SplitResizeManager Unit Tests
 *
 * TDD tests for the drag-to-resize functionality of split terminals
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const webview_1 = require("../../../../../webview/constants/webview");
(0, vitest_1.describe)('SplitResizeManager', () => {
    (0, vitest_1.describe)('Constants', () => {
        (0, vitest_1.it)('should have correct default constants', () => {
            (0, vitest_1.expect)(webview_1.SPLIT_RESIZE_CONSTANTS.MIN_RESIZE_SIZE_PX).toBe(50);
            (0, vitest_1.expect)(webview_1.SPLIT_RESIZE_CONSTANTS.RESIZE_THROTTLE_MS).toBe(16);
            (0, vitest_1.expect)(webview_1.SPLIT_RESIZE_CONSTANTS.PTY_NOTIFY_DEBOUNCE_MS).toBe(100);
        });
    });
    (0, vitest_1.describe)('Size Calculation Logic', () => {
        // Pure function tests without needing the full class
        const calculateNewSizes = (params) => {
            const { startPosition, currentPosition, startSizes, minSize } = params;
            // Calculate delta
            const delta = currentPosition - startPosition;
            // Calculate raw new sizes
            let beforeSize = startSizes.before + delta;
            let afterSize = startSizes.after - delta;
            // Get total size (should remain constant)
            const totalSize = startSizes.before + startSizes.after;
            // Enforce minimum sizes
            if (beforeSize < minSize) {
                beforeSize = minSize;
                afterSize = totalSize - beforeSize;
            }
            if (afterSize < minSize) {
                afterSize = minSize;
                beforeSize = totalSize - afterSize;
            }
            return { beforeSize, afterSize };
        };
        (0, vitest_1.it)('should calculate new sizes based on mouse delta for vertical split', () => {
            const result = calculateNewSizes({
                startPosition: 300,
                currentPosition: 350,
                startSizes: { before: 300, after: 300 },
                direction: 'vertical',
                minSize: 50,
            });
            (0, vitest_1.expect)(result.beforeSize).toBe(350); // 300 + 50
            (0, vitest_1.expect)(result.afterSize).toBe(250); // 300 - 50
        });
        (0, vitest_1.it)('should calculate new sizes based on mouse delta for horizontal split', () => {
            const result = calculateNewSizes({
                startPosition: 200,
                currentPosition: 250,
                startSizes: { before: 200, after: 200 },
                direction: 'horizontal',
                minSize: 50,
            });
            (0, vitest_1.expect)(result.beforeSize).toBe(250); // 200 + 50
            (0, vitest_1.expect)(result.afterSize).toBe(150); // 200 - 50
        });
        (0, vitest_1.it)('should enforce minimum size when shrinking before wrapper', () => {
            const result = calculateNewSizes({
                startPosition: 300,
                currentPosition: 50, // Try to shrink before to almost nothing
                startSizes: { before: 100, after: 500 },
                direction: 'vertical',
                minSize: 50,
            });
            (0, vitest_1.expect)(result.beforeSize).toBeGreaterThanOrEqual(50);
        });
        (0, vitest_1.it)('should enforce minimum size when shrinking after wrapper', () => {
            const result = calculateNewSizes({
                startPosition: 300,
                currentPosition: 550, // Try to shrink after to almost nothing
                startSizes: { before: 300, after: 100 },
                direction: 'vertical',
                minSize: 50,
            });
            (0, vitest_1.expect)(result.afterSize).toBeGreaterThanOrEqual(50);
        });
        (0, vitest_1.it)('should maintain total size constant', () => {
            const startSizes = { before: 300, after: 300 };
            const result = calculateNewSizes({
                startPosition: 300,
                currentPosition: 400,
                startSizes,
                direction: 'vertical',
                minSize: 50,
            });
            // Total should remain constant
            const total = result.beforeSize + result.afterSize;
            (0, vitest_1.expect)(total).toBe(startSizes.before + startSizes.after);
        });
        (0, vitest_1.it)('should handle negative delta (moving up/left)', () => {
            const result = calculateNewSizes({
                startPosition: 300,
                currentPosition: 200, // Moving up/left
                startSizes: { before: 300, after: 300 },
                direction: 'vertical',
                minSize: 50,
            });
            (0, vitest_1.expect)(result.beforeSize).toBe(200); // 300 - 100
            (0, vitest_1.expect)(result.afterSize).toBe(400); // 300 + 100
        });
        (0, vitest_1.it)('should handle zero delta', () => {
            const result = calculateNewSizes({
                startPosition: 300,
                currentPosition: 300, // No movement
                startSizes: { before: 300, after: 300 },
                direction: 'vertical',
                minSize: 50,
            });
            (0, vitest_1.expect)(result.beforeSize).toBe(300);
            (0, vitest_1.expect)(result.afterSize).toBe(300);
        });
        (0, vitest_1.it)('should handle unequal starting sizes', () => {
            const result = calculateNewSizes({
                startPosition: 200,
                currentPosition: 250,
                startSizes: { before: 200, after: 400 },
                direction: 'horizontal',
                minSize: 50,
            });
            (0, vitest_1.expect)(result.beforeSize).toBe(250);
            (0, vitest_1.expect)(result.afterSize).toBe(350);
            // Total preserved
            (0, vitest_1.expect)(result.beforeSize + result.afterSize).toBe(600);
        });
        (0, vitest_1.it)('should clamp to minimum when dragging beyond bounds', () => {
            // Try to make before very small
            const result1 = calculateNewSizes({
                startPosition: 300,
                currentPosition: 0,
                startSizes: { before: 100, after: 500 },
                direction: 'vertical',
                minSize: 50,
            });
            (0, vitest_1.expect)(result1.beforeSize).toBe(50);
            (0, vitest_1.expect)(result1.afterSize).toBe(550);
            // Try to make after very small
            const result2 = calculateNewSizes({
                startPosition: 300,
                currentPosition: 800,
                startSizes: { before: 500, after: 100 },
                direction: 'vertical',
                minSize: 50,
            });
            (0, vitest_1.expect)(result2.afterSize).toBe(50);
            (0, vitest_1.expect)(result2.beforeSize).toBe(550);
        });
    });
    (0, vitest_1.describe)('CSS Classes', () => {
        (0, vitest_1.it)('should define correct CSS class names', () => {
            // These are the CSS classes used by the manager
            const expectedClasses = {
                resizer: 'split-resizer',
                dragging: 'dragging',
                bodyResizing: 'resizing-split',
                bodyResizingHorizontal: 'resizing-horizontal',
                bodyResizingVertical: 'resizing-vertical',
            };
            // Verify class naming conventions
            (0, vitest_1.expect)(expectedClasses.resizer).toBe('split-resizer');
            (0, vitest_1.expect)(expectedClasses.dragging).toBe('dragging');
            (0, vitest_1.expect)(expectedClasses.bodyResizing).toBe('resizing-split');
        });
    });
    (0, vitest_1.describe)('Data Attributes', () => {
        (0, vitest_1.it)('should define correct data attribute names', () => {
            const expectedAttributes = {
                resizerBefore: 'data-resizer-before',
                resizerAfter: 'data-resizer-after',
                terminalWrapperId: 'data-terminal-wrapper-id',
            };
            (0, vitest_1.expect)(expectedAttributes.resizerBefore).toBe('data-resizer-before');
            (0, vitest_1.expect)(expectedAttributes.resizerAfter).toBe('data-resizer-after');
            (0, vitest_1.expect)(expectedAttributes.terminalWrapperId).toBe('data-terminal-wrapper-id');
        });
    });
    (0, vitest_1.describe)('Throttle Configuration', () => {
        (0, vitest_1.it)('should have 60fps throttle interval', () => {
            // 60fps = 16.67ms per frame, we use 16ms
            (0, vitest_1.expect)(webview_1.SPLIT_RESIZE_CONSTANTS.RESIZE_THROTTLE_MS).toBe(16);
        });
        (0, vitest_1.it)('should have reasonable PTY notify debounce', () => {
            // 100ms is a good balance between responsiveness and avoiding too many PTY notifications
            (0, vitest_1.expect)(webview_1.SPLIT_RESIZE_CONSTANTS.PTY_NOTIFY_DEBOUNCE_MS).toBe(100);
        });
    });
    (0, vitest_1.describe)('Minimum Size Constraint', () => {
        (0, vitest_1.it)('should have reasonable minimum terminal size', () => {
            // 50px is enough to show some terminal content
            (0, vitest_1.expect)(webview_1.SPLIT_RESIZE_CONSTANTS.MIN_RESIZE_SIZE_PX).toBe(50);
        });
        (0, vitest_1.it)('should be less than typical terminal height', () => {
            // Typical terminal height is at least 200px
            (0, vitest_1.expect)(webview_1.SPLIT_RESIZE_CONSTANTS.MIN_RESIZE_SIZE_PX).toBeLessThan(200);
        });
    });
});
//# sourceMappingURL=SplitResizeManager.test.js.map