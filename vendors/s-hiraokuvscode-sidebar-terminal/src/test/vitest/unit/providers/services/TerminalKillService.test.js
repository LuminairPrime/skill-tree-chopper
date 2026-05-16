"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * TerminalKillService Tests
 */
const vitest_1 = require("vitest");
// Mock vscode
vitest_1.vi.mock('vscode', () => ({
    workspace: {
        getConfiguration: vitest_1.vi.fn().mockReturnValue({
            get: vitest_1.vi.fn().mockReturnValue(false),
        }),
    },
    window: {
        showWarningMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
    },
}));
const TerminalKillService_1 = require("../../../../../providers/services/TerminalKillService");
const vscode = require("vscode");
function createMockDeps() {
    return {
        getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('terminal-1'),
        getTerminal: vitest_1.vi.fn().mockReturnValue({ name: 'Test Terminal' }),
        killTerminal: vitest_1.vi.fn().mockResolvedValue(undefined),
        getCurrentState: vitest_1.vi.fn().mockReturnValue({ terminals: [] }),
        sendMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
    };
}
(0, vitest_1.describe)('TerminalKillService', () => {
    let service;
    let deps;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        // Reset vscode mock to default (no confirmation)
        vitest_1.vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
            get: vitest_1.vi.fn().mockReturnValue(false),
        });
        deps = createMockDeps();
        service = new TerminalKillService_1.TerminalKillService(deps);
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.useRealTimers();
    });
    (0, vitest_1.describe)('killTerminal', () => {
        (0, vitest_1.it)('should kill active terminal without confirmation', async () => {
            vitest_1.vi.useFakeTimers();
            const killPromise = service.killTerminal();
            await vitest_1.vi.advanceTimersByTimeAsync(50);
            await killPromise;
            (0, vitest_1.expect)(deps.killTerminal).toHaveBeenCalledWith('terminal-1');
            (0, vitest_1.expect)(deps.sendMessage).toHaveBeenNthCalledWith(1, vitest_1.expect.objectContaining({ command: 'terminalRemoved', terminalId: 'terminal-1' }));
            (0, vitest_1.expect)(deps.sendMessage).toHaveBeenNthCalledWith(2, vitest_1.expect.objectContaining({ command: 'stateUpdate' }));
        });
        (0, vitest_1.it)('should short-circuit duplicate kill attempts while in flight', async () => {
            vitest_1.vi.useFakeTimers();
            vitest_1.vi.mocked(deps.killTerminal).mockImplementation(() => new Promise((resolve) => {
                setTimeout(resolve, 10);
            }));
            const first = service.killTerminal();
            const second = service.killTerminal();
            await vitest_1.vi.advanceTimersByTimeAsync(100);
            await Promise.all([first, second]);
            (0, vitest_1.expect)(deps.killTerminal).toHaveBeenCalledWith('terminal-1');
            (0, vitest_1.expect)(deps.killTerminal).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should not kill when no active terminal', async () => {
            vitest_1.vi.mocked(deps.getActiveTerminalId).mockReturnValue(null);
            await service.killTerminal();
            (0, vitest_1.expect)(deps.killTerminal).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should show confirmation when confirmBeforeKill is true', async () => {
            vitest_1.vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
                get: vitest_1.vi.fn().mockReturnValue(true),
            });
            vitest_1.vi.mocked(vscode.window.showWarningMessage).mockResolvedValue('Kill Terminal');
            await service.killTerminal();
            (0, vitest_1.expect)(vscode.window.showWarningMessage).toHaveBeenCalled();
            (0, vitest_1.expect)(deps.killTerminal).toHaveBeenCalledWith('terminal-1');
        });
        (0, vitest_1.it)('should cancel kill when user declines confirmation', async () => {
            vitest_1.vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
                get: vitest_1.vi.fn().mockReturnValue(true),
            });
            vitest_1.vi.mocked(vscode.window.showWarningMessage).mockResolvedValue(undefined);
            await service.killTerminal();
            (0, vitest_1.expect)(deps.killTerminal).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should send failure response when kill throws', async () => {
            vitest_1.vi.mocked(deps.killTerminal).mockRejectedValue(new Error('Kill failed'));
            await service.killTerminal();
            (0, vitest_1.expect)(deps.sendMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'deleteTerminalResponse',
                terminalId: 'terminal-1',
                success: false,
            }));
            // Should NOT send terminalRemoved on failure
            (0, vitest_1.expect)(deps.sendMessage).not.toHaveBeenCalledWith(vitest_1.expect.objectContaining({ command: 'terminalRemoved' }));
        });
    });
    (0, vitest_1.describe)('killSpecificTerminal', () => {
        (0, vitest_1.it)('should kill the specified terminal', async () => {
            vitest_1.vi.useFakeTimers();
            const killPromise = service.killSpecificTerminal('terminal-3');
            await vitest_1.vi.advanceTimersByTimeAsync(50);
            await killPromise;
            (0, vitest_1.expect)(deps.killTerminal).toHaveBeenCalledWith('terminal-3');
            (0, vitest_1.expect)(deps.sendMessage).toHaveBeenNthCalledWith(1, vitest_1.expect.objectContaining({ command: 'terminalRemoved', terminalId: 'terminal-3' }));
            (0, vitest_1.expect)(deps.sendMessage).toHaveBeenNthCalledWith(2, vitest_1.expect.objectContaining({ command: 'stateUpdate' }));
        });
        (0, vitest_1.it)('should short-circuit duplicate killSpecificTerminal requests while in flight', async () => {
            vitest_1.vi.useFakeTimers();
            vitest_1.vi.mocked(deps.killTerminal).mockImplementation(() => new Promise((resolve) => {
                setTimeout(resolve, 10);
            }));
            const first = service.killSpecificTerminal('terminal-3');
            const second = service.killSpecificTerminal('terminal-3');
            await vitest_1.vi.advanceTimersByTimeAsync(100);
            await Promise.all([first, second]);
            (0, vitest_1.expect)(deps.killTerminal).toHaveBeenCalledWith('terminal-3');
            (0, vitest_1.expect)(deps.killTerminal).toHaveBeenCalledTimes(1);
        });
    });
});
//# sourceMappingURL=TerminalKillService.test.js.map