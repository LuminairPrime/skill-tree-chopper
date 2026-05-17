'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const SecondaryTerminalMessageRouter_1 = require('../../../../providers/SecondaryTerminalMessageRouter');
(0, vitest_1.describe)('SecondaryTerminalMessageRouter', () => {
  let router;
  (0, vitest_1.beforeEach)(() => {
    router = new SecondaryTerminalMessageRouter_1.SecondaryTerminalMessageRouter();
  });
  (0, vitest_1.it)('should register and dispatch messages', async () => {
    const handler = vitest_1.vi.fn().mockResolvedValue(undefined);
    router.register('testCommand', handler);
    (0, vitest_1.expect)(router.has('testCommand')).toBe(true);
    const result = await router.dispatch({ command: 'testCommand' });
    (0, vitest_1.expect)(result).toBe(true);
    (0, vitest_1.expect)(handler).toHaveBeenCalled();
  });
  (0, vitest_1.it)('should return false for unknown commands', async () => {
    const result = await router.dispatch({ command: 'unknown' });
    (0, vitest_1.expect)(result).toBe(false);
  });
  (0, vitest_1.it)('should handle undefined commands during registration', () => {
    router.register(undefined, vitest_1.vi.fn());
    (0, vitest_1.expect)(router.getRegisteredCommands().length).toBe(0);
  });
  (0, vitest_1.it)('should clear handlers', () => {
    router.register('c1', vitest_1.vi.fn());
    router.clear();
    (0, vitest_1.expect)(router.has('c1')).toBe(false);
  });
  (0, vitest_1.it)('should reset handlers', () => {
    router.register('c1', vitest_1.vi.fn());
    router.reset();
    (0, vitest_1.expect)(router.has('c1')).toBe(false);
  });
});
//# sourceMappingURL=SecondaryTerminalMessageRouter.test.js.map
