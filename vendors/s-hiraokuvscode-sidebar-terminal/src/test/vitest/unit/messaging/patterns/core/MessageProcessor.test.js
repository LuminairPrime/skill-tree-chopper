"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const MessageProcessor_1 = require("../../../../../../messaging/patterns/core/MessageProcessor");
const MessageLogger_1 = require("../../../../../../messaging/patterns/core/MessageLogger");
(0, vitest_1.describe)('MessageProcessor', () => {
    let processor;
    let mockCoordinator;
    (0, vitest_1.beforeEach)(() => {
        mockCoordinator = {
            postMessageToExtension: vitest_1.vi.fn(),
        };
        processor = new MessageProcessor_1.MessageProcessor({
            logLevel: MessageLogger_1.LogLevel.NONE, // Silence logs for tests
            enableValidation: false, // Simplify basic tests
        });
    });
    (0, vitest_1.afterEach)(() => {
        processor.dispose();
    });
    (0, vitest_1.it)('should not process messages before initialization', async () => {
        const result = await processor.processMessage({
            command: 'test',
            id: '1',
            timestamp: 123,
        });
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(result.error).toBe('Processor not initialized');
    });
    (0, vitest_1.describe)('Initialized', () => {
        (0, vitest_1.beforeEach)(async () => {
            await processor.initialize(mockCoordinator);
        });
        (0, vitest_1.it)('should return error if no handler found', async () => {
            const result = await processor.processMessage({
                command: 'unknown',
                id: '1',
                timestamp: 123,
            });
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('No handler found');
        });
        (0, vitest_1.it)('should register and execute a handler', async () => {
            const handler = {
                getName: () => 'TestHandler',
                getPriority: () => 100,
                getSupportedCommands: () => ['testCommand'],
                canHandle: () => true,
                handle: vitest_1.vi.fn().mockResolvedValue(undefined),
            };
            processor.registerHandler(handler);
            (0, vitest_1.expect)(processor.hasHandler('testCommand')).toBe(true);
            const result = await processor.processMessage({
                command: 'testCommand',
                id: '1',
                timestamp: 123,
            });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.handledBy).toBe('TestHandler');
            (0, vitest_1.expect)(handler.handle).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should respect handler priority', async () => {
            const log = [];
            const lowPriorityHandler = {
                getName: () => 'Low',
                getPriority: () => 1,
                getSupportedCommands: () => ['cmd'],
                canHandle: () => true,
                handle: async () => {
                    log.push('low');
                },
            };
            const highPriorityHandler = {
                getName: () => 'High',
                getPriority: () => 10,
                getSupportedCommands: () => ['cmd'],
                canHandle: () => true,
                handle: async () => {
                    log.push('high');
                },
            };
            processor.registerHandler(lowPriorityHandler);
            processor.registerHandler(highPriorityHandler);
            await processor.processMessage({ command: 'cmd', id: '1', timestamp: 123 });
            (0, vitest_1.expect)(log).toEqual(['high']); // Highest priority handles first and stops chain if successful
        });
        (0, vitest_1.it)('should fall back to next handler if first one fails', async () => {
            const failingHandler = {
                getName: () => 'Failing',
                getPriority: () => 10,
                getSupportedCommands: () => ['cmd'],
                canHandle: () => true,
                handle: async () => {
                    throw new Error('First failed');
                },
            };
            const fallbackHandler = {
                getName: () => 'Fallback',
                getPriority: () => 1,
                getSupportedCommands: () => ['cmd'],
                canHandle: () => true,
                handle: vitest_1.vi.fn().mockResolvedValue(undefined),
            };
            processor.registerHandler(failingHandler);
            processor.registerHandler(fallbackHandler);
            const result = await processor.processMessage({
                command: 'cmd',
                id: '1',
                timestamp: 123,
            });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.handledBy).toBe('Fallback');
            (0, vitest_1.expect)(fallbackHandler.handle).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle timeouts', async () => {
            vitest_1.vi.useFakeTimers();
            // Re-create processor with short timeout
            const timeoutProcessor = new MessageProcessor_1.MessageProcessor({
                handlerTimeout: 100,
                logLevel: MessageLogger_1.LogLevel.DEBUG,
                enableValidation: false,
            });
            await timeoutProcessor.initialize(mockCoordinator);
            const slowHandler = {
                getName: () => 'Slow',
                getPriority: () => 1,
                getSupportedCommands: () => ['slowCmd'],
                canHandle: () => {
                    return true;
                },
                handle: () => {
                    return new Promise((resolve) => setTimeout(resolve, 1000));
                },
            };
            timeoutProcessor.registerHandler(slowHandler);
            const processPromise = timeoutProcessor.processMessage({
                command: 'slowCmd',
                id: '1',
                timestamp: 123,
            });
            await vitest_1.vi.advanceTimersByTimeAsync(200);
            const result = await processPromise;
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('No suitable handler found');
            vitest_1.vi.useRealTimers();
        });
    });
    (0, vitest_1.describe)('Validation', () => {
        (0, vitest_1.it)('should validate messages if enabled', async () => {
            const validator = {
                validate: vitest_1.vi.fn().mockImplementation(() => {
                    throw new Error('Invalid');
                }),
            };
            const validationProcessor = new MessageProcessor_1.MessageProcessor({
                enableValidation: true,
                validator: validator,
                logLevel: MessageLogger_1.LogLevel.NONE,
            });
            await validationProcessor.initialize(mockCoordinator);
            const result = await validationProcessor.processMessage({
                command: 'any',
                id: '1',
                timestamp: 123,
            });
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('Validation failed: Invalid');
            (0, vitest_1.expect)(validator.validate).toHaveBeenCalled();
        });
    });
    (0, vitest_1.it)('should provide stats', async () => {
        await processor.initialize(mockCoordinator);
        processor.registerHandler({
            getName: () => 'H1',
            getPriority: () => 1,
            getSupportedCommands: () => ['c1', 'c2'],
            canHandle: () => true,
            handle: async () => { },
        });
        const stats = processor.getStats();
        (0, vitest_1.expect)(stats.totalHandlers).toBe(1);
        (0, vitest_1.expect)(stats.totalCommands).toBe(2);
        (0, vitest_1.expect)(stats.isInitialized).toBe(true);
        (0, vitest_1.expect)(stats.registeredCommands).toEqual(['c1', 'c2']);
    });
});
//# sourceMappingURL=MessageProcessor.test.js.map