"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const SessionCommandHandler_1 = require("../../../../../../messaging/patterns/handlers/SessionCommandHandler");
(0, vitest_1.describe)('SessionCommandHandler', () => {
    let handler;
    let mockCoordinator;
    let mockContext;
    (0, vitest_1.beforeEach)(() => {
        handler = new SessionCommandHandler_1.SessionCommandHandler();
        mockCoordinator = {
            restoreSession: vitest_1.vi.fn().mockResolvedValue(undefined),
        };
        mockContext = {
            coordinator: mockCoordinator,
            log: vitest_1.vi.fn(),
            postMessage: vitest_1.vi.fn(),
            metadata: {},
        };
    });
    (0, vitest_1.it)('should have the correct name and priority', () => {
        (0, vitest_1.expect)(handler.getName()).toBe('SessionCommandHandler');
        (0, vitest_1.expect)(handler.getPriority()).toBe(60);
    });
    (0, vitest_1.it)('should handle sessionRestore command', async () => {
        const terminals = [{ id: 't1' }];
        const msg = { command: 'sessionRestore', terminals, activeTerminalId: 't1' };
        await handler.handle(msg, mockContext);
        (0, vitest_1.expect)(mockCoordinator.restoreSession).toHaveBeenCalledWith({
            terminals,
            activeTerminalId: 't1',
            config: undefined,
        });
    });
    (0, vitest_1.it)('should handle sessionRestoreStarted command', async () => {
        await handler.handle({ command: 'sessionRestoreStarted' }, mockContext);
        (0, vitest_1.expect)(mockContext.log).toHaveBeenCalledWith('info', vitest_1.expect.stringContaining('Session restore started'));
    });
    (0, vitest_1.it)('should handle sessionRestoreProgress command', async () => {
        await handler.handle({ command: 'sessionRestoreProgress', progress: 1, total: 2 }, mockContext);
        // BaseCommandHandler.log calls ctx.log(level, msg, ...args)
        // When no args are passed to this.log, args is an empty array in this.log(level, msg, ...args)
        // but context.log receives it as spread.
        (0, vitest_1.expect)(mockContext.log).toHaveBeenCalledWith('debug', vitest_1.expect.stringContaining('1/2'));
    });
    (0, vitest_1.it)('should handle sessionRestoreCompleted command', async () => {
        await handler.handle({ command: 'sessionRestoreCompleted', restoredCount: 5 }, mockContext);
        (0, vitest_1.expect)(mockContext.log).toHaveBeenCalledWith('info', vitest_1.expect.stringContaining('5 terminals restored'));
    });
    (0, vitest_1.it)('should handle sessionRestoreError command', async () => {
        await handler.handle({ command: 'sessionRestoreError', error: 'fail' }, mockContext);
        (0, vitest_1.expect)(mockContext.log).toHaveBeenCalledWith('error', vitest_1.expect.stringContaining('Session restore failed'), 'fail');
    });
    (0, vitest_1.it)('should handle sessionSaved command', async () => {
        await handler.handle({ command: 'sessionSaved', terminalCount: 3 }, mockContext);
        (0, vitest_1.expect)(mockContext.log).toHaveBeenCalledWith('info', vitest_1.expect.stringContaining('Session saved: 3 terminals'));
    });
    (0, vitest_1.it)('should handle sessionCleared command', async () => {
        await handler.handle({ command: 'sessionCleared' }, mockContext);
        (0, vitest_1.expect)(mockContext.log).toHaveBeenCalledWith('info', vitest_1.expect.stringContaining('Session cleared'));
    });
    (0, vitest_1.it)('should handle terminalRestoreError command', async () => {
        await handler.handle({ command: 'terminalRestoreError', terminalId: 't1', error: 'dead' }, mockContext);
        (0, vitest_1.expect)(mockContext.log).toHaveBeenCalledWith('error', vitest_1.expect.stringContaining('Terminal restore error for t1'), 'dead');
    });
    (0, vitest_1.it)('should continue if terminals missing in sessionRestore (validateRequired is guard only)', async () => {
        await handler.handle({ command: 'sessionRestore' }, mockContext);
        (0, vitest_1.expect)(mockCoordinator.restoreSession).toHaveBeenCalled();
    });
});
//# sourceMappingURL=SessionCommandHandler.test.js.map