'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const MessageRouter_1 = require('../../../../services/MessageRouter');
(0, vitest_1.describe)('MessageRouter', () => {
  let router;
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.useFakeTimers();
    // Default config
    router = MessageRouter_1.MessageRouterFactory.create({
      enableLogging: false,
      enableValidation: true,
      timeoutMs: 1000,
      maxConcurrentHandlers: 5,
    });
  });
  (0, vitest_1.afterEach)(() => {
    router.dispose();
    vitest_1.vi.restoreAllMocks();
    vitest_1.vi.useRealTimers();
  });
  (0, vitest_1.describe)('Handler Registration', () => {
    (0, vitest_1.it)('should register a handler', () => {
      const handler = { handle: vitest_1.vi.fn() };
      router.registerHandler('test', handler);
      (0, vitest_1.expect)(router.hasHandler('test')).toBe(true);
    });
    (0, vitest_1.it)('should throw when registering duplicate handler', () => {
      const handler = { handle: vitest_1.vi.fn() };
      router.registerHandler('test', handler);
      (0, vitest_1.expect)(() => router.registerHandler('test', handler)).toThrow(
        /already registered/
      );
    });
    (0, vitest_1.it)('should unregister a handler', () => {
      const handler = { handle: vitest_1.vi.fn() };
      router.registerHandler('test', handler);
      (0, vitest_1.expect)(router.unregisterHandler('test')).toBe(true);
      (0, vitest_1.expect)(router.hasHandler('test')).toBe(false);
    });
    (0, vitest_1.it)('should return false when unregistering non-existent handler', () => {
      (0, vitest_1.expect)(router.unregisterHandler('non-existent')).toBe(false);
    });
    (0, vitest_1.it)('should list registered commands', () => {
      router.registerHandler('cmd1', { handle: vitest_1.vi.fn() });
      router.registerHandler('cmd2', { handle: vitest_1.vi.fn() });
      (0, vitest_1.expect)(router.getRegisteredCommands()).toEqual(
        vitest_1.expect.arrayContaining(['cmd1', 'cmd2'])
      );
    });
    (0, vitest_1.it)('should clear all handlers', () => {
      router.registerHandler('cmd1', { handle: vitest_1.vi.fn() });
      router.registerHandler('cmd2', { handle: vitest_1.vi.fn() });
      router.clearHandlers();
      (0, vitest_1.expect)(router.getRegisteredCommands()).toHaveLength(0);
    });
  });
  (0, vitest_1.describe)('Message Routing', () => {
    (0, vitest_1.it)('should route message to handler', async () => {
      const handler = { handle: vitest_1.vi.fn().mockReturnValue('result') };
      router.registerHandler('test', handler);
      const result = await router.routeMessage('test', { key: 'value' });
      (0, vitest_1.expect)(result.success).toBe(true);
      (0, vitest_1.expect)(result.data).toBe('result');
      (0, vitest_1.expect)(handler.handle).toHaveBeenCalledWith({ key: 'value' });
    });
    (0, vitest_1.it)('should return error when no handler registered', async () => {
      const result = await router.routeMessage('unknown');
      (0, vitest_1.expect)(result.success).toBe(false);
      (0, vitest_1.expect)(result.error).toContain('No handler registered');
    });
    (0, vitest_1.it)('should return error when handler fails', async () => {
      const handler = {
        handle: vitest_1.vi.fn().mockRejectedValue(new Error('Handler failed')),
      };
      router.registerHandler('test', handler);
      const result = await router.routeMessage('test');
      (0, vitest_1.expect)(result.success).toBe(false);
      (0, vitest_1.expect)(result.error).toBe('Handler failed');
    });
    (0, vitest_1.it)('should handle timeout', async () => {
      const handler = {
        handle: () => new Promise((resolve) => setTimeout(resolve, 2000)),
      };
      router.registerHandler('slow', handler);
      const promise = router.routeMessage('slow');
      vitest_1.vi.advanceTimersByTime(1100); // Exceeds 1000ms timeout
      const result = await promise;
      (0, vitest_1.expect)(result.success).toBe(false);
      (0, vitest_1.expect)(result.error).toContain('timeout');
    });
  });
  (0, vitest_1.describe)('Concurrency & State', () => {
    (0, vitest_1.it)('should enforce concurrency limit', async () => {
      // Create a router with limit 1
      const limitedRouter = MessageRouter_1.MessageRouterFactory.create({
        maxConcurrentHandlers: 1,
        timeoutMs: 1000,
      });
      const slowHandler = {
        handle: () => new Promise((resolve) => setTimeout(resolve, 100)),
      };
      limitedRouter.registerHandler('slow', slowHandler);
      // Start one request
      const p1 = limitedRouter.routeMessage('slow');
      // Start second request immediately (should fail)
      const result2 = await limitedRouter.routeMessage('slow');
      (0, vitest_1.expect)(result2.success).toBe(false);
      (0, vitest_1.expect)(result2.error).toContain('Maximum concurrent handlers reached');
      vitest_1.vi.advanceTimersByTime(100);
      await p1;
    });
    (0, vitest_1.it)('should track active handler count', async () => {
      const handler = {
        handle: () => new Promise((resolve) => setTimeout(resolve, 100)),
      };
      router.registerHandler('test', handler);
      const p1 = router.routeMessage('test');
      (0, vitest_1.expect)(router.getActiveHandlerCount()).toBe(1);
      vitest_1.vi.advanceTimersByTime(100);
      await p1;
      (0, vitest_1.expect)(router.getActiveHandlerCount()).toBe(0);
    });
  });
  (0, vitest_1.describe)('Validation', () => {
    (0, vitest_1.it)('should validate terminal input', async () => {
      const handler = { handle: vitest_1.vi.fn() };
      router.registerHandler('terminalInput', handler);
      // Invalid data
      const result1 = await router.routeMessage('terminalInput', {});
      (0, vitest_1.expect)(result1.success).toBe(false);
      (0, vitest_1.expect)(result1.error).toContain('Invalid data');
      // Valid data
      const result2 = await router.routeMessage('terminalInput', { terminalId: 't1', input: 'ls' });
      (0, vitest_1.expect)(result2.success).toBe(true);
    });
  });
  (0, vitest_1.describe)('Disposal', () => {
    (0, vitest_1.it)('should reject requests after disposal', async () => {
      router.dispose();
      const result = await router.routeMessage('test');
      (0, vitest_1.expect)(result.success).toBe(false);
      (0, vitest_1.expect)(result.error).toContain('disposed');
    });
    (0, vitest_1.it)('should clear handlers on disposal', () => {
      router.registerHandler('test', { handle: vitest_1.vi.fn() });
      router.dispose();
      (0, vitest_1.expect)(router.hasHandler('test')).toBe(false);
    });
  });
});
//# sourceMappingURL=MessageRouter.test.js.map
