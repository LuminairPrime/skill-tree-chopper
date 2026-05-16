"use strict";
/**
 * ResizeManager Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ResizeManager_1 = require("../../../../../webview/utils/ResizeManager");
// Mock logger
vitest_1.vi.mock('../../../../../utils/logger', () => ({
    webview: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('ResizeManager', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.useFakeTimers();
        ResizeManager_1.ResizeManager.dispose();
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.useRealTimers();
        ResizeManager_1.ResizeManager.dispose();
    });
    (0, vitest_1.describe)('debounceResize', () => {
        (0, vitest_1.it)('should debounce consecutive calls', () => {
            const callback = vitest_1.vi.fn();
            ResizeManager_1.ResizeManager.debounceResize('test-key', callback, { delay: 100 });
            ResizeManager_1.ResizeManager.debounceResize('test-key', callback, { delay: 100 });
            vitest_1.vi.advanceTimersByTime(50);
            (0, vitest_1.expect)(callback).not.toHaveBeenCalled();
            vitest_1.vi.advanceTimersByTime(50);
            (0, vitest_1.expect)(callback).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should execute immediately if requested', () => {
            const callback = vitest_1.vi.fn();
            ResizeManager_1.ResizeManager.debounceResize('test-key', callback, { immediate: true });
            (0, vitest_1.expect)(callback).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should call onStart and onComplete', async () => {
            const start = vitest_1.vi.fn();
            const complete = vitest_1.vi.fn();
            const callback = vitest_1.vi.fn().mockResolvedValue(undefined);
            ResizeManager_1.ResizeManager.debounceResize('test-key', callback, {
                delay: 100,
                onStart: start,
                onComplete: complete,
            });
            (0, vitest_1.expect)(start).toHaveBeenCalled();
            (0, vitest_1.expect)(complete).not.toHaveBeenCalled();
            vitest_1.vi.advanceTimersByTime(100);
            // Wait for promise resolution in executeResize
            await vitest_1.vi.runAllTicks();
            (0, vitest_1.expect)(callback).toHaveBeenCalled();
            (0, vitest_1.expect)(complete).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('ResizeObserver', () => {
        let resizeCallback;
        class MockResizeObserver {
            constructor(callback) {
                this.observe = vitest_1.vi.fn();
                this.disconnect = vitest_1.vi.fn();
                this.unobserve = vitest_1.vi.fn();
                resizeCallback = callback;
            }
        }
        (0, vitest_1.beforeEach)(() => {
            vitest_1.vi.stubGlobal('ResizeObserver', MockResizeObserver);
        });
        (0, vitest_1.it)('should setup observer and handle resize', () => {
            const element = document.createElement('div');
            const callback = vitest_1.vi.fn();
            ResizeManager_1.ResizeManager.observeResize('obs-key', element, callback, {
                delay: 100,
                skipFirstCallback: false,
            });
            const mockEntry = { contentRect: { width: 100, height: 100 } };
            resizeCallback([mockEntry]);
            vitest_1.vi.advanceTimersByTime(100);
            (0, vitest_1.expect)(callback).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should skip first callback by default', () => {
            const element = document.createElement('div');
            const callback = vitest_1.vi.fn();
            ResizeManager_1.ResizeManager.observeResize('obs-key', element, callback);
            const mockEntry = { contentRect: { width: 100, height: 100 } };
            resizeCallback([mockEntry]); // 1st call
            vitest_1.vi.advanceTimersByTime(1000);
            (0, vitest_1.expect)(callback).not.toHaveBeenCalled();
            resizeCallback([mockEntry]); // 2nd call
            vitest_1.vi.advanceTimersByTime(100);
            (0, vitest_1.expect)(callback).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should honor global pause', () => {
            const element = document.createElement('div');
            const callback = vitest_1.vi.fn();
            ResizeManager_1.ResizeManager.observeResize('obs-key', element, callback, { skipFirstCallback: false });
            ResizeManager_1.ResizeManager.pauseObservers();
            (0, vitest_1.expect)(ResizeManager_1.ResizeManager.isPaused()).toBe(true);
            resizeCallback([{ contentRect: { width: 100, height: 100 } }]);
            vitest_1.vi.advanceTimersByTime(1000);
            (0, vitest_1.expect)(callback).not.toHaveBeenCalled();
            ResizeManager_1.ResizeManager.resumeObservers();
            (0, vitest_1.expect)(ResizeManager_1.ResizeManager.isPaused()).toBe(false);
        });
    });
    (0, vitest_1.describe)('Management and Cleanup', () => {
        (0, vitest_1.it)('should check pending state', () => {
            ResizeManager_1.ResizeManager.debounceResize('key1', () => { });
            (0, vitest_1.expect)(ResizeManager_1.ResizeManager.isPending('key1')).toBe(true);
            (0, vitest_1.expect)(ResizeManager_1.ResizeManager.getPendingKeys()).toContain('key1');
            ResizeManager_1.ResizeManager.clearResize('key1');
            (0, vitest_1.expect)(ResizeManager_1.ResizeManager.isPending('key1')).toBe(false);
        });
        (0, vitest_1.it)('should flush all pending operations', () => {
            const c1 = vitest_1.vi.fn();
            ResizeManager_1.ResizeManager.debounceResize('k1', c1);
            ResizeManager_1.ResizeManager.flushAll();
            (0, vitest_1.expect)(ResizeManager_1.ResizeManager.getPendingKeys().length).toBe(0);
            // flushAll currently clears timers but doesn't execute them (as per implementation)
            (0, vitest_1.expect)(c1).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should provide status', () => {
            ResizeManager_1.ResizeManager.debounceResize('k1', () => { });
            const status = ResizeManager_1.ResizeManager.getStatus();
            (0, vitest_1.expect)(status.pendingTimers).toBe(1);
        });
    });
});
//# sourceMappingURL=ResizeManager.test.js.map