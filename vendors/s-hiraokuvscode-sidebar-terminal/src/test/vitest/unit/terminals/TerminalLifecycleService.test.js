"use strict";
/**
 * TerminalLifecycleService Tests
 *
 * Vitest Migration: Converted from Mocha/Chai to Vitest
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TerminalLifecycleService_1 = require("../../../../terminals/core/TerminalLifecycleService");
(0, vitest_1.describe)('TerminalLifecycleService', () => {
    (0, vitest_1.it)('serializes delete operations through the shared queue', async () => {
        const service = new TerminalLifecycleService_1.TerminalLifecycleService();
        const order = [];
        const enqueueOp = (id, delayMs) => service.enqueue(async () => {
            order.push(id);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            return id;
        });
        const p1 = enqueueOp(1, 10);
        const p2 = enqueueOp(2, 0);
        await Promise.all([p1, p2]);
        (0, vitest_1.expect)(order).toEqual([1, 2]);
    });
    (0, vitest_1.it)('tracks terminals currently being killed', () => {
        const service = new TerminalLifecycleService_1.TerminalLifecycleService();
        service.markBeingKilled('t1');
        (0, vitest_1.expect)(service.isBeingKilled('t1')).toBe(true);
        service.unmarkBeingKilled('t1');
        (0, vitest_1.expect)(service.isBeingKilled('t1')).toBe(false);
        service.markBeingKilled('t2');
        service.clear();
        (0, vitest_1.expect)(service.isBeingKilled('t2')).toBe(false);
    });
});
//# sourceMappingURL=TerminalLifecycleService.test.js.map