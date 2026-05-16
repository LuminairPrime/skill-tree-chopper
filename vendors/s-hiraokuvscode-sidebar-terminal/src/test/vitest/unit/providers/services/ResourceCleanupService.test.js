"use strict";
/**
 * ResourceCleanupService Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ResourceCleanupService_1 = require("../../../../../providers/services/ResourceCleanupService");
// Mock logger
vitest_1.vi.mock('../../../../../utils/logger', () => ({
    provider: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('ResourceCleanupService', () => {
    let service;
    (0, vitest_1.beforeEach)(() => {
        service = new ResourceCleanupService_1.ResourceCleanupService();
    });
    (0, vitest_1.describe)('Disposable Tracking', () => {
        (0, vitest_1.it)('should track disposables', () => {
            const mockDisposable = { dispose: vitest_1.vi.fn() };
            service.addDisposable(mockDisposable);
            (0, vitest_1.expect)(service.getDisposableCount()).toBe(1);
        });
        (0, vitest_1.it)('should add multiple disposables', () => {
            const d1 = { dispose: vitest_1.vi.fn() };
            const d2 = { dispose: vitest_1.vi.fn() };
            service.addDisposables(d1, d2);
            (0, vitest_1.expect)(service.getDisposableCount()).toBe(2);
        });
        (0, vitest_1.it)('should dispose added resource immediately if service is already disposed', () => {
            service.dispose();
            const mockDisposable = { dispose: vitest_1.vi.fn() };
            service.addDisposable(mockDisposable);
            (0, vitest_1.expect)(mockDisposable.dispose).toHaveBeenCalled();
            (0, vitest_1.expect)(service.getDisposableCount()).toBe(0);
        });
    });
    (0, vitest_1.describe)('Cleanup Callbacks', () => {
        (0, vitest_1.it)('should execute callbacks in LIFO order', async () => {
            const executionOrder = [];
            service.registerCleanupCallback(() => {
                executionOrder.push(1);
            });
            service.registerCleanupCallback(() => {
                executionOrder.push(2);
            });
            service.dispose();
            (0, vitest_1.expect)(executionOrder).toEqual([2, 1]);
        });
        (0, vitest_1.it)('should handle async callbacks', async () => {
            let executed = false;
            service.registerCleanupCallback(async () => {
                executed = true;
            });
            service.dispose();
            // Wait for microtask queue to flush so async callback completes
            await Promise.resolve();
            (0, vitest_1.expect)(executed).toBe(true);
        });
        (0, vitest_1.it)('should handle errors in callbacks gracefully', () => {
            service.registerCleanupCallback(() => {
                throw new Error('Fail');
            });
            const secondCallback = vitest_1.vi.fn();
            service.registerCleanupCallback(secondCallback);
            (0, vitest_1.expect)(() => service.dispose()).not.toThrow();
            (0, vitest_1.expect)(secondCallback).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Dispose', () => {
        (0, vitest_1.it)('should dispose all tracked resources', () => {
            const d1 = { dispose: vitest_1.vi.fn() };
            const d2 = { dispose: vitest_1.vi.fn() };
            service.addDisposables(d1, d2);
            service.dispose();
            (0, vitest_1.expect)(d1.dispose).toHaveBeenCalled();
            (0, vitest_1.expect)(d2.dispose).toHaveBeenCalled();
            (0, vitest_1.expect)(service.isDisposed()).toBe(true);
            (0, vitest_1.expect)(service.getDisposableCount()).toBe(0);
        });
        (0, vitest_1.it)('should skip if already disposed', () => {
            service.dispose();
            // Should not log disposal messages again (implicitly tested by logic)
            service.dispose();
            (0, vitest_1.expect)(service.isDisposed()).toBe(true);
        });
    });
    (0, vitest_1.describe)('WebView Messages', () => {
        (0, vitest_1.it)('should create cleanup message', () => {
            const msg = service.createWebViewCleanupMessage();
            (0, vitest_1.expect)(msg.command).toBe('saveAllTerminalSessions');
            (0, vitest_1.expect)(msg.timestamp).toBeDefined();
        });
    });
});
//# sourceMappingURL=ResourceCleanupService.test.js.map