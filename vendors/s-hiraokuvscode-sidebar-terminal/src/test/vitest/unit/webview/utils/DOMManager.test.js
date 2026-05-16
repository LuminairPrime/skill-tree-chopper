"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const DOMManager_1 = require("../../../../../webview/utils/DOMManager");
(0, vitest_1.describe)('DOMManager', () => {
    (0, vitest_1.beforeEach)(() => {
        DOMManager_1.DOMManager.clearPendingCallbacks();
        vitest_1.vi.useFakeTimers();
        // requestAnimationFrame mock is provided by vitest/jsdom but we can control it with fake timers
        vitest_1.vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
            setTimeout(cb, 16);
            return 1;
        });
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.restoreAllMocks();
        vitest_1.vi.useRealTimers();
    });
    (0, vitest_1.describe)('scheduleAtNextAnimationFrame', () => {
        (0, vitest_1.it)('should schedule and execute callback', async () => {
            const callback = vitest_1.vi.fn();
            DOMManager_1.DOMManager.scheduleAtNextAnimationFrame(callback);
            (0, vitest_1.expect)(callback).not.toHaveBeenCalled();
            vitest_1.vi.runAllTimers();
            (0, vitest_1.expect)(callback).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should execute callbacks in priority order', () => {
            const executionOrder = [];
            DOMManager_1.DOMManager.scheduleAtNextAnimationFrame(() => executionOrder.push('low'), -10);
            DOMManager_1.DOMManager.scheduleAtNextAnimationFrame(() => executionOrder.push('high'), 10);
            DOMManager_1.DOMManager.scheduleAtNextAnimationFrame(() => executionOrder.push('normal'), 0);
            vitest_1.vi.runAllTimers();
            (0, vitest_1.expect)(executionOrder).toEqual(['high', 'normal', 'low']);
        });
        (0, vitest_1.it)('should allow cancellation via disposable', () => {
            const callback = vitest_1.vi.fn();
            const disposable = DOMManager_1.DOMManager.scheduleAtNextAnimationFrame(callback);
            disposable.dispose();
            vitest_1.vi.runAllTimers();
            (0, vitest_1.expect)(callback).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('runAtThisOrScheduleAtNextAnimationFrame', () => {
        (0, vitest_1.it)('should run immediately if no pending callbacks', () => {
            const callback = vitest_1.vi.fn();
            DOMManager_1.DOMManager.runAtThisOrScheduleAtNextAnimationFrame(callback);
            (0, vitest_1.expect)(callback).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should schedule if there are pending callbacks', () => {
            const callback1 = vitest_1.vi.fn();
            const callback2 = vitest_1.vi.fn();
            DOMManager_1.DOMManager.scheduleAtNextAnimationFrame(callback1);
            DOMManager_1.DOMManager.runAtThisOrScheduleAtNextAnimationFrame(callback2);
            (0, vitest_1.expect)(callback2).not.toHaveBeenCalled();
            vitest_1.vi.runAllTimers();
            (0, vitest_1.expect)(callback1).toHaveBeenCalled();
            (0, vitest_1.expect)(callback2).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('convenience methods', () => {
        (0, vitest_1.it)('should schedule read with high priority', () => {
            const executionOrder = [];
            DOMManager_1.DOMManager.scheduleWrite(() => executionOrder.push('write'));
            DOMManager_1.DOMManager.scheduleRead(() => executionOrder.push('read'));
            vitest_1.vi.runAllTimers();
            (0, vitest_1.expect)(executionOrder).toEqual(['read', 'write']);
        });
    });
});
//# sourceMappingURL=DOMManager.test.js.map