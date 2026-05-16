"use strict";
/**
 * MessageRoutingFacade Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const MessageRoutingFacade_1 = require("../../../../../providers/services/MessageRoutingFacade");
// Mock logger
vitest_1.vi.mock('../../../../../utils/logger', () => ({
    provider: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('MessageRoutingFacade', () => {
    let facade;
    (0, vitest_1.beforeEach)(() => {
        facade = new MessageRoutingFacade_1.MessageRoutingFacade();
    });
    (0, vitest_1.describe)('Handler Registration', () => {
        (0, vitest_1.it)('should register a single handler', () => {
            const handler = vitest_1.vi.fn();
            facade.registerHandler('test', handler, 'terminal', 'Description');
            (0, vitest_1.expect)(facade.hasHandler('test')).toBe(true);
            (0, vitest_1.expect)(facade.getHandlerCount()).toBe(1);
            (0, vitest_1.expect)(facade.getRegisteredCommands()).toContain('test');
        });
        (0, vitest_1.it)('should register multiple handlers', () => {
            const handlers = [
                { command: 'cmd1', handler: vitest_1.vi.fn(), category: 'ui' },
                { command: 'cmd2', handler: vitest_1.vi.fn(), category: 'settings' },
            ];
            facade.registerHandlers(handlers);
            (0, vitest_1.expect)(facade.getHandlerCount()).toBe(2);
            (0, vitest_1.expect)(facade.getHandlersByCategory('ui')).toHaveLength(1);
            (0, vitest_1.expect)(facade.getHandlersByCategory('settings')).toHaveLength(1);
        });
        (0, vitest_1.it)('should ignore empty command registration', () => {
            facade.registerHandler('', vitest_1.vi.fn());
            (0, vitest_1.expect)(facade.getHandlerCount()).toBe(0);
        });
    });
    (0, vitest_1.describe)('Message Routing', () => {
        (0, vitest_1.it)('should handle and dispatch valid message', async () => {
            const handler = vitest_1.vi.fn().mockResolvedValue(undefined);
            facade.registerHandler('greet', handler);
            const message = { command: 'greet', data: 'hello' };
            const result = await facade.handleMessage(message);
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(handler).toHaveBeenCalledWith(message);
        });
        (0, vitest_1.it)('should return false for invalid message format', async () => {
            const result = await facade.handleMessage({ something: 'else' });
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should return false if no handler found', async () => {
            const result = await facade.handleMessage({ command: 'unknown' });
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should throw error if handler fails', async () => {
            const handler = vitest_1.vi.fn().mockRejectedValue(new Error('Handler fail'));
            facade.registerHandler('fail', handler);
            await (0, vitest_1.expect)(facade.handleMessage({ command: 'fail' })).rejects.toThrow('Handler fail');
        });
    });
    (0, vitest_1.describe)('Validation and Lifecycle', () => {
        (0, vitest_1.it)('should validate required handlers', () => {
            facade.registerHandler('critical', vitest_1.vi.fn());
            // Should not throw and log success/failure
            facade.validateHandlers(['critical']);
            facade.validateHandlers(['missing']);
        });
        (0, vitest_1.it)('should manage initialization state', () => {
            (0, vitest_1.expect)(facade.isInitialized()).toBe(false);
            facade.setInitialized(true);
            (0, vitest_1.expect)(facade.isInitialized()).toBe(true);
        });
        (0, vitest_1.it)('should clear all handlers', () => {
            facade.registerHandler('test', vitest_1.vi.fn());
            facade.clear();
            (0, vitest_1.expect)(facade.getHandlerCount()).toBe(0);
            (0, vitest_1.expect)(facade.hasHandler('test')).toBe(false);
            (0, vitest_1.expect)(facade.isInitialized()).toBe(false);
        });
    });
    (0, vitest_1.describe)('Logging', () => {
        (0, vitest_1.it)('should log registered handlers without throwing', () => {
            facade.registerHandler('t1', vitest_1.vi.fn(), 'terminal');
            facade.registerHandler('u1', vitest_1.vi.fn()); // Uncategorized
            (0, vitest_1.expect)(() => facade.logRegisteredHandlers()).not.toThrow();
        });
    });
});
//# sourceMappingURL=MessageRoutingFacade.test.js.map