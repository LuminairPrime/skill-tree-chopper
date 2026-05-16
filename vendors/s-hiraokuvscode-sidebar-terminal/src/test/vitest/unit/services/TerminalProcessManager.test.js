"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TerminalProcessManager_1 = require("../../../../services/TerminalProcessManager");
// Mock TerminalInstance
const createMockTerminal = (id, ptyMock) => ({
    id,
    name: `Terminal ${id}`,
    number: 1,
    pty: ptyMock,
    ptyProcess: ptyMock,
    createdAt: new Date(),
    cwd: '/tmp',
    isActive: true,
    // @ts-expect-error - test mock type
    xtermReady: true,
    processState: 0,
});
// Mock logger
vitest_1.vi.mock('../../../../utils/logger', () => ({
    terminal: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('TerminalProcessManager', () => {
    let manager;
    let mockPty;
    let terminal;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        manager = new TerminalProcessManager_1.TerminalProcessManager();
        mockPty = {
            write: vitest_1.vi.fn(),
            resize: vitest_1.vi.fn(),
            kill: vitest_1.vi.fn(),
            pid: 12345,
        };
        terminal = createMockTerminal('term-1', mockPty);
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('writeToPty', () => {
        (0, vitest_1.it)('should write data to pty successfully', () => {
            const result = manager.writeToPty(terminal, 'test data');
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(mockPty.write).toHaveBeenCalledWith('test data');
        });
        (0, vitest_1.it)('should fail if pty is not ready', () => {
            terminal.ptyProcess = undefined;
            terminal.pty = undefined;
            const result = manager.writeToPty(terminal, 'test');
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.reason).toContain('PTY not ready');
        });
        (0, vitest_1.it)('should fail if pty write throws', () => {
            mockPty.write.mockImplementation(() => {
                throw new Error('Write error');
            });
            const result = manager.writeToPty(terminal, 'test');
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.reason).toContain('Write error');
        });
        (0, vitest_1.it)('should fail if pty process is killed', () => {
            mockPty.killed = true;
            const result = manager.writeToPty(terminal, 'test');
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.reason).toContain('PTY instance missing write method or process killed');
        });
    });
    (0, vitest_1.describe)('resizePty', () => {
        (0, vitest_1.it)('should resize pty successfully', () => {
            const result = manager.resizePty(terminal, 80, 24);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(mockPty.resize).toHaveBeenCalledWith(80, 24);
        });
        (0, vitest_1.it)('should validate dimensions (too small)', () => {
            const result = manager.resizePty(terminal, 0, 24);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.reason).toContain('Invalid dimensions');
        });
        (0, vitest_1.it)('should validate dimensions (too large)', () => {
            const result = manager.resizePty(terminal, 600, 24);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.reason).toContain('Dimensions too large');
        });
        (0, vitest_1.it)('should fail if pty missing resize method', () => {
            mockPty.resize = undefined;
            const result = manager.resizePty(terminal, 80, 24);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.reason).toContain('missing resize method');
        });
        (0, vitest_1.it)('should fail if pty throws during resize', () => {
            mockPty.resize.mockImplementation(() => {
                throw new Error('Resize error');
            });
            const result = manager.resizePty(terminal, 80, 24);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.reason).toContain('Resize error');
        });
    });
    (0, vitest_1.describe)('killPty', () => {
        (0, vitest_1.it)('should kill pty successfully', () => {
            const result = manager.killPty(terminal);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(mockPty.kill).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should fail if no pty instance', () => {
            terminal.ptyProcess = undefined;
            terminal.pty = undefined;
            const result = manager.killPty(terminal);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.reason).toContain('No PTY instance');
        });
        (0, vitest_1.it)('should fail if pty missing kill method', () => {
            mockPty.kill = undefined;
            const result = manager.killPty(terminal);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.reason).toContain('missing kill method');
        });
        (0, vitest_1.it)('should fail if kill throws', () => {
            mockPty.kill.mockImplementation(() => {
                throw new Error('Kill error');
            });
            const result = manager.killPty(terminal);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.reason).toContain('Kill error');
        });
    });
    (0, vitest_1.describe)('isPtyAlive', () => {
        (0, vitest_1.it)('should return true for active pty', () => {
            (0, vitest_1.expect)(manager.isPtyAlive(terminal)).toBe(true);
        });
        (0, vitest_1.it)('should return false if pty missing', () => {
            terminal.ptyProcess = undefined;
            terminal.pty = undefined;
            (0, vitest_1.expect)(manager.isPtyAlive(terminal)).toBe(false);
        });
        (0, vitest_1.it)('should return false if killed property is true', () => {
            mockPty.killed = true;
            (0, vitest_1.expect)(manager.isPtyAlive(terminal)).toBe(false);
        });
        (0, vitest_1.it)('should return false if pid is invalid', () => {
            mockPty.pid = 0;
            (0, vitest_1.expect)(manager.isPtyAlive(terminal)).toBe(false);
        });
    });
    (0, vitest_1.describe)('retryWrite', () => {
        (0, vitest_1.it)('should succeed immediately if first write works', async () => {
            const result = await manager.retryWrite(terminal, 'test');
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(mockPty.write).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should retry and succeed', async () => {
            vitest_1.vi.useFakeTimers();
            mockPty.write
                .mockImplementationOnce(() => {
                throw new Error('Fail 1');
            })
                .mockImplementationOnce(() => { }); // Success
            const promise = manager.retryWrite(terminal, 'test');
            // Advance timers to trigger retry
            await vitest_1.vi.advanceTimersByTimeAsync(1000);
            const result = await promise;
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(mockPty.write).toHaveBeenCalledTimes(2);
        });
        (0, vitest_1.it)('should fail after max retries', async () => {
            vitest_1.vi.useFakeTimers();
            mockPty.write.mockImplementation(() => {
                throw new Error('Fail');
            });
            const promise = manager.retryWrite(terminal, 'test', 2);
            await vitest_1.vi.advanceTimersByTimeAsync(2000);
            const result = await promise;
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.reason).toContain('after 2 attempts');
            (0, vitest_1.expect)(mockPty.write).toHaveBeenCalledTimes(2);
        });
    });
    (0, vitest_1.describe)('attemptRecovery', () => {
        (0, vitest_1.it)('should recover using alternative pty reference', () => {
            // Simulate ptyProcess broken but pty works
            const brokenPty = {
                write: () => {
                    throw new Error('Broken');
                },
            };
            const workingPty = { write: vitest_1.vi.fn(), pid: 123 };
            // @ts-expect-error - test mock type
            terminal.ptyProcess = brokenPty;
            // @ts-expect-error - test mock type
            terminal.pty = workingPty;
            const result = manager.attemptRecovery(terminal);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(workingPty.write).toHaveBeenCalledWith('');
            // Should fix reference
            (0, vitest_1.expect)(terminal.ptyProcess).toBeUndefined();
        });
        (0, vitest_1.it)('should fail if all alternatives fail', () => {
            // @ts-expect-error - test mock type
            terminal.ptyProcess = {
                write: () => {
                    throw new Error('Fail 1');
                },
            };
            // @ts-expect-error - test mock type
            terminal.pty = {
                write: () => {
                    throw new Error('Fail 2');
                },
            };
            const result = manager.attemptRecovery(terminal);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.reason).toContain('All recovery attempts failed');
        });
    });
});
//# sourceMappingURL=TerminalProcessManager.test.js.map