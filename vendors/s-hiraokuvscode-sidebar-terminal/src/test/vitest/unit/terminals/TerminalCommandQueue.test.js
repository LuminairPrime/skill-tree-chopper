"use strict";
/**
 * TerminalCommandQueue Tests
 *
 * Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TerminalCommandQueue_1 = require("../../../../terminals/core/TerminalCommandQueue");
(0, vitest_1.describe)('TerminalCommandQueue', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.useFakeTimers();
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.useRealTimers();
    });
    (0, vitest_1.it)('processes operations sequentially even when enqueued at once', async () => {
        const queue = new TerminalCommandQueue_1.TerminalCommandQueue();
        const order = [];
        const op = (id, delay) => queue.enqueue(async () => {
            order.push(id);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return id;
        });
        const p1 = op(1, 20);
        const p2 = op(2, 0);
        const p3 = op(3, 5);
        await vitest_1.vi.advanceTimersByTimeAsync(30);
        await Promise.all([p1, p2, p3]);
        (0, vitest_1.expect)(order).toEqual([1, 2, 3]);
    });
    (0, vitest_1.it)('continues processing after a rejection', async () => {
        const queue = new TerminalCommandQueue_1.TerminalCommandQueue();
        const order = [];
        const failing = queue.enqueue(async () => {
            order.push('fail');
            throw new Error('boom');
        });
        const succeeding = queue.enqueue(async () => {
            order.push('success');
            return 'ok';
        });
        await (0, vitest_1.expect)(failing).rejects.toThrow('boom');
        await (0, vitest_1.expect)(succeeding).resolves.toBe('ok');
        (0, vitest_1.expect)(order).toEqual(['fail', 'success']);
    });
});
//# sourceMappingURL=TerminalCommandQueue.test.js.map