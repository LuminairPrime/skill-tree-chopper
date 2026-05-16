"use strict";
/**
 * CommandRegistry Unit Tests
 *
 * Tests for command registry functionality including:
 * - Handler registration (single and bulk)
 * - Priority-based handler execution
 * - Category grouping
 * - Middleware support
 * - Message dispatch
 * - Registry statistics and cleanup
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const CommandRegistry_1 = require("../../../../../webview/core/CommandRegistry");
// Mock logger
vitest_1.vi.mock('../../../../../utils/logger', () => ({
    webview: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('CommandRegistry', () => {
    let registry;
    (0, vitest_1.beforeEach)(() => {
        registry = new CommandRegistry_1.CommandRegistry();
    });
    (0, vitest_1.afterEach)(() => {
        registry.clear();
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('constructor', () => {
        (0, vitest_1.it)('should create a new empty registry', () => {
            const stats = registry.getStats();
            (0, vitest_1.expect)(stats.totalCommands).toBe(0);
            (0, vitest_1.expect)(stats.totalHandlers).toBe(0);
            (0, vitest_1.expect)(stats.categories).toHaveLength(0);
            (0, vitest_1.expect)(stats.middlewareCount).toBe(0);
        });
    });
    (0, vitest_1.describe)('register', () => {
        (0, vitest_1.it)('should register a command handler', () => {
            const handler = vitest_1.vi.fn();
            registry.register('testCommand', handler);
            (0, vitest_1.expect)(registry.has('testCommand')).toBe(true);
            (0, vitest_1.expect)(registry.getCommands()).toContain('testCommand');
        });
        (0, vitest_1.it)('should register handler with priority', () => {
            const handler = vitest_1.vi.fn();
            registry.register('testCommand', handler, { priority: 'high' });
            (0, vitest_1.expect)(registry.has('testCommand')).toBe(true);
        });
        (0, vitest_1.it)('should register handler with category', () => {
            const handler = vitest_1.vi.fn();
            registry.register('testCommand', handler, { category: 'lifecycle' });
            (0, vitest_1.expect)(registry.getByCategory('lifecycle')).toContain('testCommand');
        });
        (0, vitest_1.it)('should register handler with description', () => {
            const handler = vitest_1.vi.fn();
            registry.register('testCommand', handler, { description: 'Test description' });
            (0, vitest_1.expect)(registry.has('testCommand')).toBe(true);
        });
        (0, vitest_1.it)('should register multiple handlers for same command', () => {
            const handler1 = vitest_1.vi.fn();
            const handler2 = vitest_1.vi.fn();
            registry.register('testCommand', handler1);
            registry.register('testCommand', handler2);
            const stats = registry.getStats();
            (0, vitest_1.expect)(stats.totalCommands).toBe(1);
            (0, vitest_1.expect)(stats.totalHandlers).toBe(2);
        });
        (0, vitest_1.it)('should order handlers by priority', async () => {
            const executionOrder = [];
            registry.register('testCommand', () => {
                executionOrder.push('low');
            }, { priority: 'low' });
            registry.register('testCommand', () => {
                executionOrder.push('high');
            }, { priority: 'high' });
            registry.register('testCommand', () => {
                executionOrder.push('normal');
            }, { priority: 'normal' });
            await registry.dispatch({ command: 'testCommand' });
            (0, vitest_1.expect)(executionOrder).toEqual(['high', 'normal', 'low']);
        });
    });
    (0, vitest_1.describe)('registerBulk', () => {
        (0, vitest_1.it)('should register multiple handlers at once', () => {
            const handlers = {
                command1: vitest_1.vi.fn(),
                command2: vitest_1.vi.fn(),
                command3: vitest_1.vi.fn(),
            };
            registry.registerBulk(handlers);
            (0, vitest_1.expect)(registry.has('command1')).toBe(true);
            (0, vitest_1.expect)(registry.has('command2')).toBe(true);
            (0, vitest_1.expect)(registry.has('command3')).toBe(true);
        });
        (0, vitest_1.it)('should apply common options to all handlers', () => {
            const handlers = {
                command1: vitest_1.vi.fn(),
                command2: vitest_1.vi.fn(),
            };
            registry.registerBulk(handlers, { category: 'bulk-category', priority: 'high' });
            (0, vitest_1.expect)(registry.getByCategory('bulk-category')).toContain('command1');
            (0, vitest_1.expect)(registry.getByCategory('bulk-category')).toContain('command2');
        });
        (0, vitest_1.it)('should return correct stats after bulk registration', () => {
            const handlers = {
                cmd1: vitest_1.vi.fn(),
                cmd2: vitest_1.vi.fn(),
                cmd3: vitest_1.vi.fn(),
                cmd4: vitest_1.vi.fn(),
            };
            registry.registerBulk(handlers);
            const stats = registry.getStats();
            (0, vitest_1.expect)(stats.totalCommands).toBe(4);
            (0, vitest_1.expect)(stats.totalHandlers).toBe(4);
        });
    });
    (0, vitest_1.describe)('unregister', () => {
        (0, vitest_1.it)('should unregister an existing command', () => {
            registry.register('testCommand', vitest_1.vi.fn());
            (0, vitest_1.expect)(registry.has('testCommand')).toBe(true);
            const result = registry.unregister('testCommand');
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(registry.has('testCommand')).toBe(false);
        });
        (0, vitest_1.it)('should return false for non-existent command', () => {
            const result = registry.unregister('nonExistent');
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should remove command from category', () => {
            registry.register('testCommand', vitest_1.vi.fn(), { category: 'testCategory' });
            (0, vitest_1.expect)(registry.getByCategory('testCategory')).toContain('testCommand');
            registry.unregister('testCommand');
            (0, vitest_1.expect)(registry.getByCategory('testCategory')).not.toContain('testCommand');
        });
    });
    (0, vitest_1.describe)('use (middleware)', () => {
        (0, vitest_1.it)('should add middleware', () => {
            const middleware = async (_msg, _ctx, next) => {
                await next();
            };
            registry.use(middleware);
            const stats = registry.getStats();
            (0, vitest_1.expect)(stats.middlewareCount).toBe(1);
        });
        (0, vitest_1.it)('should add multiple middlewares', () => {
            const middleware1 = async (_msg, _ctx, next) => {
                await next();
            };
            const middleware2 = async (_msg, _ctx, next) => {
                await next();
            };
            registry.use(middleware1);
            registry.use(middleware2);
            const stats = registry.getStats();
            (0, vitest_1.expect)(stats.middlewareCount).toBe(2);
        });
    });
    (0, vitest_1.describe)('dispatch', () => {
        (0, vitest_1.it)('should dispatch message to registered handler', async () => {
            const handler = vitest_1.vi.fn();
            registry.register('testCommand', handler);
            const message = { command: 'testCommand', data: 'test' };
            const result = await registry.dispatch(message);
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(handler).toHaveBeenCalledWith(message, vitest_1.expect.any(Object));
        });
        (0, vitest_1.it)('should return false for unregistered command', async () => {
            const message = { command: 'unknownCommand' };
            const result = await registry.dispatch(message);
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should execute all handlers for a command', async () => {
            const handler1 = vitest_1.vi.fn();
            const handler2 = vitest_1.vi.fn();
            registry.register('testCommand', handler1);
            registry.register('testCommand', handler2);
            await registry.dispatch({ command: 'testCommand' });
            (0, vitest_1.expect)(handler1).toHaveBeenCalled();
            (0, vitest_1.expect)(handler2).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should execute middleware before handlers', async () => {
            const executionOrder = [];
            const middleware = async (_msg, _ctx, next) => {
                executionOrder.push('middleware-before');
                await next();
                executionOrder.push('middleware-after');
            };
            registry.use(middleware);
            registry.register('testCommand', () => {
                executionOrder.push('handler');
            });
            await registry.dispatch({ command: 'testCommand' });
            (0, vitest_1.expect)(executionOrder).toEqual(['middleware-before', 'handler', 'middleware-after']);
        });
        (0, vitest_1.it)('should chain multiple middlewares', async () => {
            const executionOrder = [];
            const middleware1 = async (_msg, _ctx, next) => {
                executionOrder.push('m1-before');
                await next();
                executionOrder.push('m1-after');
            };
            const middleware2 = async (_msg, _ctx, next) => {
                executionOrder.push('m2-before');
                await next();
                executionOrder.push('m2-after');
            };
            registry.use(middleware1);
            registry.use(middleware2);
            registry.register('testCommand', () => {
                executionOrder.push('handler');
            });
            await registry.dispatch({ command: 'testCommand' });
            (0, vitest_1.expect)(executionOrder).toEqual(['m1-before', 'm2-before', 'handler', 'm2-after', 'm1-after']);
        });
        (0, vitest_1.it)('should provide context to handlers', async () => {
            let receivedContext = null;
            registry.register('testCommand', (_msg, ctx) => {
                receivedContext = ctx;
            });
            await registry.dispatch({ command: 'testCommand' });
            (0, vitest_1.expect)(receivedContext).toBeDefined();
            (0, vitest_1.expect)(receivedContext.registry).toBe(registry);
            (0, vitest_1.expect)(receivedContext.data).toBeDefined();
        });
        (0, vitest_1.it)('should throw error when handler fails without continueOnError', async () => {
            const error = new Error('Handler failed');
            registry.register('testCommand', () => {
                throw error;
            });
            await (0, vitest_1.expect)(registry.dispatch({ command: 'testCommand' })).rejects.toThrow('Handler failed');
        });
        (0, vitest_1.it)('should continue execution when handler fails with continueOnError', async () => {
            const handler1 = vitest_1.vi.fn().mockImplementation(() => {
                throw new Error('Handler 1 failed');
            });
            const handler2 = vitest_1.vi.fn();
            registry.register('testCommand', handler1, { continueOnError: true });
            registry.register('testCommand', handler2, { continueOnError: true });
            await registry.dispatch({ command: 'testCommand' });
            (0, vitest_1.expect)(handler1).toHaveBeenCalled();
            (0, vitest_1.expect)(handler2).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle async handlers', async () => {
            const asyncHandler = vitest_1.vi.fn().mockImplementation(async () => {
                await new Promise((resolve) => setTimeout(resolve, 10));
            });
            registry.register('testCommand', asyncHandler);
            await registry.dispatch({ command: 'testCommand' });
            (0, vitest_1.expect)(asyncHandler).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('has', () => {
        (0, vitest_1.it)('should return true for registered command', () => {
            registry.register('testCommand', vitest_1.vi.fn());
            (0, vitest_1.expect)(registry.has('testCommand')).toBe(true);
        });
        (0, vitest_1.it)('should return false for unregistered command', () => {
            (0, vitest_1.expect)(registry.has('nonExistent')).toBe(false);
        });
        (0, vitest_1.it)('should return false after unregistration', () => {
            registry.register('testCommand', vitest_1.vi.fn());
            registry.unregister('testCommand');
            (0, vitest_1.expect)(registry.has('testCommand')).toBe(false);
        });
    });
    (0, vitest_1.describe)('getByCategory', () => {
        (0, vitest_1.it)('should return commands in category', () => {
            registry.register('cmd1', vitest_1.vi.fn(), { category: 'cat1' });
            registry.register('cmd2', vitest_1.vi.fn(), { category: 'cat1' });
            registry.register('cmd3', vitest_1.vi.fn(), { category: 'cat2' });
            const cat1Commands = registry.getByCategory('cat1');
            (0, vitest_1.expect)(cat1Commands).toContain('cmd1');
            (0, vitest_1.expect)(cat1Commands).toContain('cmd2');
            (0, vitest_1.expect)(cat1Commands).not.toContain('cmd3');
        });
        (0, vitest_1.it)('should return empty array for non-existent category', () => {
            const commands = registry.getByCategory('nonExistent');
            (0, vitest_1.expect)(commands).toEqual([]);
        });
    });
    (0, vitest_1.describe)('getCommands', () => {
        (0, vitest_1.it)('should return all registered commands', () => {
            registry.register('cmd1', vitest_1.vi.fn());
            registry.register('cmd2', vitest_1.vi.fn());
            registry.register('cmd3', vitest_1.vi.fn());
            const commands = registry.getCommands();
            (0, vitest_1.expect)(commands).toHaveLength(3);
            (0, vitest_1.expect)(commands).toContain('cmd1');
            (0, vitest_1.expect)(commands).toContain('cmd2');
            (0, vitest_1.expect)(commands).toContain('cmd3');
        });
        (0, vitest_1.it)('should return empty array when no commands registered', () => {
            (0, vitest_1.expect)(registry.getCommands()).toEqual([]);
        });
    });
    (0, vitest_1.describe)('getStats', () => {
        (0, vitest_1.it)('should return correct statistics', () => {
            registry.register('cmd1', vitest_1.vi.fn(), { category: 'cat1' });
            registry.register('cmd2', vitest_1.vi.fn(), { category: 'cat2' });
            registry.register('cmd1', vitest_1.vi.fn()); // Second handler for cmd1
            registry.use(async (_m, _c, next) => {
                await next();
            });
            const stats = registry.getStats();
            (0, vitest_1.expect)(stats.totalCommands).toBe(2);
            (0, vitest_1.expect)(stats.totalHandlers).toBe(3);
            (0, vitest_1.expect)(stats.categories).toContain('cat1');
            (0, vitest_1.expect)(stats.categories).toContain('cat2');
            (0, vitest_1.expect)(stats.middlewareCount).toBe(1);
        });
    });
    (0, vitest_1.describe)('clear', () => {
        (0, vitest_1.it)('should remove all handlers', () => {
            registry.register('cmd1', vitest_1.vi.fn());
            registry.register('cmd2', vitest_1.vi.fn());
            registry.use(async (_m, _c, next) => {
                await next();
            });
            registry.clear();
            const stats = registry.getStats();
            (0, vitest_1.expect)(stats.totalCommands).toBe(0);
            (0, vitest_1.expect)(stats.totalHandlers).toBe(0);
            (0, vitest_1.expect)(stats.middlewareCount).toBe(0);
        });
        (0, vitest_1.it)('should clear categories', () => {
            registry.register('cmd1', vitest_1.vi.fn(), { category: 'cat1' });
            registry.clear();
            (0, vitest_1.expect)(registry.getByCategory('cat1')).toEqual([]);
        });
    });
});
(0, vitest_1.describe)('createLoggingMiddleware', () => {
    let registry;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.useFakeTimers();
        registry = new CommandRegistry_1.CommandRegistry();
    });
    (0, vitest_1.afterEach)(() => {
        registry.clear();
        vitest_1.vi.useRealTimers();
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('should log command execution', async () => {
        const mockLogger = vitest_1.vi.fn();
        const loggingMiddleware = (0, CommandRegistry_1.createLoggingMiddleware)(mockLogger);
        registry.use(loggingMiddleware);
        registry.register('testCommand', vitest_1.vi.fn());
        await registry.dispatch({ command: 'testCommand' });
        (0, vitest_1.expect)(mockLogger).toHaveBeenCalledWith(vitest_1.expect.stringContaining('→ testCommand'));
        (0, vitest_1.expect)(mockLogger).toHaveBeenCalledWith(vitest_1.expect.stringContaining('✅ testCommand'));
    });
    (0, vitest_1.it)('should log command failure', async () => {
        const mockLogger = vitest_1.vi.fn();
        const loggingMiddleware = (0, CommandRegistry_1.createLoggingMiddleware)(mockLogger);
        registry.use(loggingMiddleware);
        registry.register('testCommand', () => {
            throw new Error('Test error');
        });
        await (0, vitest_1.expect)(registry.dispatch({ command: 'testCommand' })).rejects.toThrow();
        (0, vitest_1.expect)(mockLogger).toHaveBeenCalledWith(vitest_1.expect.stringContaining('→ testCommand'));
        (0, vitest_1.expect)(mockLogger).toHaveBeenCalledWith(vitest_1.expect.stringContaining('❌ testCommand'), vitest_1.expect.any(Error));
    });
    (0, vitest_1.it)('should include execution time in log', async () => {
        const mockLogger = vitest_1.vi.fn();
        const loggingMiddleware = (0, CommandRegistry_1.createLoggingMiddleware)(mockLogger);
        registry.use(loggingMiddleware);
        registry.register('testCommand', vitest_1.vi.fn());
        await registry.dispatch({ command: 'testCommand' });
        // Check that the log contains time in milliseconds
        const successCall = mockLogger.mock.calls.find((call) => call[0].includes('✅ testCommand'));
        (0, vitest_1.expect)(successCall?.[0]).toMatch(/\d+\.\d+ms/);
    });
    (0, vitest_1.it)('should use default logger when none provided', async () => {
        const loggingMiddleware = (0, CommandRegistry_1.createLoggingMiddleware)();
        registry.use(loggingMiddleware);
        registry.register('testCommand', vitest_1.vi.fn());
        // Should not throw
        await (0, vitest_1.expect)(registry.dispatch({ command: 'testCommand' })).resolves.toBe(true);
    });
});
(0, vitest_1.describe)('createPerformanceMiddleware', () => {
    let registry;
    let originalPerformanceNow;
    (0, vitest_1.beforeEach)(() => {
        registry = new CommandRegistry_1.CommandRegistry();
        originalPerformanceNow = performance.now;
    });
    (0, vitest_1.afterEach)(() => {
        registry.clear();
        performance.now = originalPerformanceNow;
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('should not log for fast commands (under threshold)', async () => {
        const { webview: mockLog } = await Promise.resolve().then(() => require('../../../../../utils/logger'));
        // Mock performance.now to simulate fast execution
        let callCount = 0;
        performance.now = vitest_1.vi.fn(() => {
            return callCount++ * 50; // 50ms execution
        });
        const perfMiddleware = (0, CommandRegistry_1.createPerformanceMiddleware)(100);
        registry.use(perfMiddleware);
        registry.register('fastCommand', vitest_1.vi.fn());
        await registry.dispatch({ command: 'fastCommand' });
        // Should not log slow command warning for fast execution
        const slowWarningCalls = mockLog.mock.calls.filter((call) => call[0]?.includes?.('⚠️ Slow command'));
        (0, vitest_1.expect)(slowWarningCalls).toHaveLength(0);
    });
    (0, vitest_1.it)('should log warning for slow commands (over threshold)', async () => {
        const { webview: mockLog } = await Promise.resolve().then(() => require('../../../../../utils/logger'));
        // Mock performance.now to simulate slow execution (150ms)
        let callCount = 0;
        performance.now = vitest_1.vi.fn(() => {
            return callCount++ * 150;
        });
        const perfMiddleware = (0, CommandRegistry_1.createPerformanceMiddleware)(100);
        registry.use(perfMiddleware);
        registry.register('slowCommand', vitest_1.vi.fn());
        await registry.dispatch({ command: 'slowCommand' });
        (0, vitest_1.expect)(mockLog).toHaveBeenCalledWith(vitest_1.expect.stringContaining('⚠️ Slow command: slowCommand'));
    });
    (0, vitest_1.it)('should use custom threshold', async () => {
        const { webview: mockLog } = await Promise.resolve().then(() => require('../../../../../utils/logger'));
        // Mock performance.now to simulate 75ms execution
        let callCount = 0;
        performance.now = vitest_1.vi.fn(() => {
            return callCount++ * 75;
        });
        // Use 50ms threshold, so 75ms execution should trigger warning
        const perfMiddleware = (0, CommandRegistry_1.createPerformanceMiddleware)(50);
        registry.use(perfMiddleware);
        registry.register('mediumCommand', vitest_1.vi.fn());
        await registry.dispatch({ command: 'mediumCommand' });
        (0, vitest_1.expect)(mockLog).toHaveBeenCalledWith(vitest_1.expect.stringContaining('⚠️ Slow command: mediumCommand'));
    });
    (0, vitest_1.it)('should use default threshold of 100ms when not specified', async () => {
        const { webview: mockLog } = await Promise.resolve().then(() => require('../../../../../utils/logger'));
        // Mock performance.now to simulate 50ms execution (under default 100ms)
        let callCount = 0;
        performance.now = vitest_1.vi.fn(() => {
            return callCount++ * 50;
        });
        const perfMiddleware = (0, CommandRegistry_1.createPerformanceMiddleware)(); // Default threshold
        registry.use(perfMiddleware);
        registry.register('testCommand', vitest_1.vi.fn());
        await registry.dispatch({ command: 'testCommand' });
        // Should not log slow command warning
        const slowWarningCalls = mockLog.mock.calls.filter((call) => call[0]?.includes?.('⚠️ Slow command'));
        (0, vitest_1.expect)(slowWarningCalls).toHaveLength(0);
    });
});
(0, vitest_1.describe)('priority ordering', () => {
    let registry;
    (0, vitest_1.beforeEach)(() => {
        registry = new CommandRegistry_1.CommandRegistry();
    });
    (0, vitest_1.afterEach)(() => {
        registry.clear();
    });
    (0, vitest_1.it)('should execute high priority before normal', async () => {
        const order = [];
        registry.register('cmd', () => {
            order.push('normal');
        }, { priority: 'normal' });
        registry.register('cmd', () => {
            order.push('high');
        }, { priority: 'high' });
        await registry.dispatch({ command: 'cmd' });
        (0, vitest_1.expect)(order[0]).toBe('high');
        (0, vitest_1.expect)(order[1]).toBe('normal');
    });
    (0, vitest_1.it)('should execute normal priority before low', async () => {
        const order = [];
        registry.register('cmd', () => {
            order.push('low');
        }, { priority: 'low' });
        registry.register('cmd', () => {
            order.push('normal');
        }, { priority: 'normal' });
        await registry.dispatch({ command: 'cmd' });
        (0, vitest_1.expect)(order[0]).toBe('normal');
        (0, vitest_1.expect)(order[1]).toBe('low');
    });
    (0, vitest_1.it)('should maintain insertion order for same priority', async () => {
        const order = [];
        registry.register('cmd', () => {
            order.push('first');
        }, { priority: 'normal' });
        registry.register('cmd', () => {
            order.push('second');
        }, { priority: 'normal' });
        registry.register('cmd', () => {
            order.push('third');
        }, { priority: 'normal' });
        await registry.dispatch({ command: 'cmd' });
        (0, vitest_1.expect)(order).toEqual(['first', 'second', 'third']);
    });
});
(0, vitest_1.describe)('edge cases', () => {
    let registry;
    (0, vitest_1.beforeEach)(() => {
        registry = new CommandRegistry_1.CommandRegistry();
    });
    (0, vitest_1.afterEach)(() => {
        registry.clear();
    });
    (0, vitest_1.it)('should handle command with empty string', () => {
        registry.register('', vitest_1.vi.fn());
        (0, vitest_1.expect)(registry.has('')).toBe(true);
    });
    (0, vitest_1.it)('should handle command with special characters', () => {
        registry.register('cmd:with:colons', vitest_1.vi.fn());
        registry.register('cmd.with.dots', vitest_1.vi.fn());
        registry.register('cmd-with-dashes', vitest_1.vi.fn());
        (0, vitest_1.expect)(registry.has('cmd:with:colons')).toBe(true);
        (0, vitest_1.expect)(registry.has('cmd.with.dots')).toBe(true);
        (0, vitest_1.expect)(registry.has('cmd-with-dashes')).toBe(true);
    });
    (0, vitest_1.it)('should handle dispatch with additional message properties', async () => {
        let receivedMessage = null;
        registry.register('testCommand', (msg) => {
            receivedMessage = msg;
        });
        const message = {
            command: 'testCommand',
            terminalId: 'term-1',
            data: { nested: { value: 123 } },
            timestamp: Date.now(),
        };
        await registry.dispatch(message);
        (0, vitest_1.expect)(receivedMessage).toEqual(message);
    });
    (0, vitest_1.it)('should handle middleware that does not call next', async () => {
        const handler = vitest_1.vi.fn();
        const blockingMiddleware = async () => {
            // Intentionally not calling next()
        };
        registry.use(blockingMiddleware);
        registry.register('testCommand', handler);
        await registry.dispatch({ command: 'testCommand' });
        // Handler should not be called because middleware didn't call next()
        (0, vitest_1.expect)(handler).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should handle multiple categories for different commands', () => {
        registry.register('cmd1', vitest_1.vi.fn(), { category: 'cat1' });
        registry.register('cmd2', vitest_1.vi.fn(), { category: 'cat1' });
        registry.register('cmd3', vitest_1.vi.fn(), { category: 'cat2' });
        registry.register('cmd4', vitest_1.vi.fn(), { category: 'cat2' });
        (0, vitest_1.expect)(registry.getByCategory('cat1')).toHaveLength(2);
        (0, vitest_1.expect)(registry.getByCategory('cat2')).toHaveLength(2);
        (0, vitest_1.expect)(registry.getStats().categories).toHaveLength(2);
    });
    (0, vitest_1.it)('should handle rapid successive dispatches', async () => {
        let callCount = 0;
        registry.register('testCommand', () => {
            callCount++;
        });
        // Dispatch 10 times rapidly
        await Promise.all(Array.from({ length: 10 }, () => registry.dispatch({ command: 'testCommand' })));
        (0, vitest_1.expect)(callCount).toBe(10);
    });
});
//# sourceMappingURL=CommandRegistry.test.js.map