"use strict";
// @vitest-environment jsdom
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TestSetup_1 = require("../../../../shared/TestSetup");
const SplitResizeManager_1 = require("../../../../../webview/managers/SplitResizeManager");
// Test environment setup
let testEnv;
(0, vitest_1.describe)('SplitResizeManager (DOM)', () => {
    (0, vitest_1.beforeEach)(() => {
        testEnv = (0, TestSetup_1.setupCompleteTestEnvironment)();
    });
    (0, vitest_1.afterEach)(() => {
        // Clean up test environment
        if (testEnv?.dom) {
            testEnv.dom.window.close();
        }
    });
    (0, vitest_1.it)('should calculate correct resize ratios for the resized pair', () => {
        const manager = new SplitResizeManager_1.SplitResizeManager({
            onResizeComplete: () => { },
            getSplitDirection: () => 'vertical',
        });
        const wrapperBefore = document.createElement('div');
        const wrapperAfter = document.createElement('div');
        // Set initial flex values using individual properties (JSDOM limitation workaround)
        wrapperBefore.style.flexGrow = '1';
        wrapperBefore.style.flexShrink = '1';
        wrapperBefore.style.flexBasis = '0';
        wrapperAfter.style.flexGrow = '1';
        wrapperAfter.style.flexShrink = '1';
        wrapperAfter.style.flexBasis = '0';
        manager.dragState = {
            isActive: true,
            resizerElement: null,
            startPosition: 0,
            startSizes: { before: 300, after: 300 },
            wrapperBefore,
            wrapperAfter,
            direction: 'vertical',
            combinedFlexGrow: 2,
        };
        // Spy on the calculateNewSizes method to verify ratio calculation
        const calculateNewSizesSpy = manager.calculateNewSizes.bind(manager);
        const result = calculateNewSizesSpy({
            startPosition: 0,
            currentPosition: 60,
            startSizes: { before: 300, after: 300 },
            direction: 'vertical',
            minSize: 50,
        });
        // Verify the calculation logic: 60px movement from start
        // beforeSize = 300 + 60 = 360, afterSize = 300 - 60 = 240
        (0, vitest_1.expect)(result.beforeSize).toBe(360);
        (0, vitest_1.expect)(result.afterSize).toBe(240);
        // Verify the ratios sum to 1.0
        const totalSize = 600;
        const beforeRatio = result.beforeSize / totalSize;
        const afterRatio = result.afterSize / totalSize;
        (0, vitest_1.expect)(beforeRatio + afterRatio).toBeCloseTo(1);
        // Verify individual ratios
        (0, vitest_1.expect)(beforeRatio).toBeCloseTo(0.6);
        (0, vitest_1.expect)(afterRatio).toBeCloseTo(0.4);
    });
});
//# sourceMappingURL=SplitResizeManager.dom.test.js.map