"use strict";
/**
 * ShellIntegrationService Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const vscode = require("vscode");
const ShellIntegrationService_1 = require("../../../../services/ShellIntegrationService");
// Mock dependencies
const mockTerminalManager = {
    updateTerminalCwd: vitest_1.vi.fn(),
};
// Mock logger
vitest_1.vi.mock('../../../../src/utils/logger', () => ({
    terminal: vitest_1.vi.fn(),
}));
// Mock common utils
vitest_1.vi.mock('../../../../utils/common', () => ({
    safeProcessCwd: vitest_1.vi.fn().mockReturnValue('/mock/cwd'),
}));
// Mock VS Code API
vitest_1.vi.mock('vscode', () => ({
    commands: {
        executeCommand: vitest_1.vi.fn(),
    },
    workspace: {
        getConfiguration: vitest_1.vi.fn(() => ({
            get: vitest_1.vi.fn((key, def) => def),
        })),
    },
    window: {
        showWarningMessage: vitest_1.vi.fn(),
    },
}));
(0, vitest_1.describe)('ShellIntegrationService', () => {
    let service;
    let mockContext;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.useFakeTimers();
        mockContext = {
            globalState: {
                get: vitest_1.vi.fn(),
                update: vitest_1.vi.fn(),
            },
        };
        service = new ShellIntegrationService_1.ShellIntegrationService(mockTerminalManager, mockContext);
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.useRealTimers();
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('OSC Sequence Processing', () => {
        const termId = 'term-1';
        (0, vitest_1.it)('should detect command start', () => {
            service.processTerminalData(termId, '\x1b]633;A\x07');
            (0, vitest_1.expect)(service.isExecuting(termId)).toBe(true);
            (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith('secondaryTerminal.updateShellStatus', { terminalId: termId, status: 'executing' });
        });
        (0, vitest_1.it)('should detect command execution even with arguments', () => {
            service.processTerminalData(termId, '\x1b]633;B;ls -la\x07');
            // currentCommand is private, but we can verify it by finishing the command
            service.processTerminalData(termId, '\x1b]633;C;0\x07');
            const history = service.getCommandHistory(termId);
            (0, vitest_1.expect)(history[0].command).toBe('ls -la');
        });
        (0, vitest_1.it)('should detect command completion with exit code', () => {
            service.processTerminalData(termId, '\x1b]633;A\x07'); // Start
            service.processTerminalData(termId, '\x1b]633;B;ls\x07'); // Exec
            vitest_1.vi.advanceTimersByTime(100);
            service.processTerminalData(termId, '\x1b]633;C;0\x07'); // Finish success
            const history = service.getCommandHistory(termId);
            (0, vitest_1.expect)(history).toHaveLength(1);
            (0, vitest_1.expect)(history[0].command).toBe('ls');
            (0, vitest_1.expect)(history[0].exitCode).toBe(0);
            (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith('secondaryTerminal.updateShellStatus', { terminalId: termId, status: 'success' });
        });
        (0, vitest_1.it)('should detect CWD change', () => {
            service.processTerminalData(termId, '\x1b]633;P;Cwd=/new/path\x07');
            (0, vitest_1.expect)(service.getCurrentCwd(termId)).toBe('/new/path');
            (0, vitest_1.expect)(mockTerminalManager.updateTerminalCwd).toHaveBeenCalledWith(termId, '/new/path');
            (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith('secondaryTerminal.updateCwd', {
                terminalId: termId,
                cwd: '/new/path',
            });
        });
    });
    (0, vitest_1.describe)('Fallback Detection', () => {
        const termId = 'term-fallback';
        (0, vitest_1.it)('should detect prompt via pattern', () => {
            service.processTerminalData(termId, '\x1b]633;A\x07'); // Set executing true first
            (0, vitest_1.expect)(service.isExecuting(termId)).toBe(true);
            // Send typical prompt
            service.processTerminalData(termId, 'user@host:~$ ');
            (0, vitest_1.expect)(service.isExecuting(termId)).toBe(false);
            (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith('secondaryTerminal.updateShellStatus', { terminalId: termId, status: 'ready' });
        });
        (0, vitest_1.it)('should detect cd command pattern', () => {
            service.processTerminalData(termId, 'cd /tmp/test\n');
            (0, vitest_1.expect)(service.getCurrentCwd(termId)).toBe('/tmp/test');
        });
    });
    (0, vitest_1.describe)('Shell Injection', () => {
        (0, vitest_1.it)('should inject bash/zsh integration', async () => {
            const pty = { write: vitest_1.vi.fn() };
            vscode.window.showWarningMessage.mockResolvedValue('Allow');
            await service.injectShellIntegration('t1', '/bin/bash', pty);
            (0, vitest_1.expect)(pty.write).toHaveBeenCalledWith(vitest_1.expect.stringContaining('__vsc_prompt_cmd'));
        });
        (0, vitest_1.it)('should inject fish integration', async () => {
            const pty = { write: vitest_1.vi.fn() };
            vscode.window.showWarningMessage.mockResolvedValue('Allow');
            await service.injectShellIntegration('t1', '/usr/bin/fish', pty);
            (0, vitest_1.expect)(pty.write).toHaveBeenCalledWith(vitest_1.expect.stringContaining('__vsc_prompt'));
        });
        (0, vitest_1.it)('should inject powershell integration', async () => {
            const pty = { write: vitest_1.vi.fn() };
            vscode.window.showWarningMessage.mockResolvedValue('Allow');
            await service.injectShellIntegration('t1', 'pwsh.exe', pty);
            (0, vitest_1.expect)(pty.write).toHaveBeenCalledWith(vitest_1.expect.stringContaining('__VSCode-Prompt-Start'));
        });
        (0, vitest_1.it)('should respect permission denial', async () => {
            const pty = { write: vitest_1.vi.fn() };
            vscode.window.showWarningMessage.mockResolvedValue('Deny');
            await service.injectShellIntegration('t1', '/bin/bash', pty);
            (0, vitest_1.expect)(pty.write).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should persist permission choice', async () => {
            const pty = { write: vitest_1.vi.fn() };
            vscode.window.showWarningMessage.mockResolvedValue('Always Allow');
            await service.injectShellIntegration('t1', '/bin/bash', pty);
            (0, vitest_1.expect)(mockContext.globalState.update).toHaveBeenCalledWith('shellIntegrationPermission', true);
        });
    });
    (0, vitest_1.describe)('Lifecycle', () => {
        (0, vitest_1.it)('should clear state on dispose terminal', () => {
            service.processTerminalData('t1', '\x1b]633;A\x07');
            (0, vitest_1.expect)(service.isExecuting('t1')).toBe(true);
            service.disposeTerminal('t1');
            (0, vitest_1.expect)(service.isExecuting('t1')).toBe(false); // New state created on access, default false
        });
        (0, vitest_1.it)('should clear all state on dispose', () => {
            service.processTerminalData('t1', '\x1b]633;A\x07');
            service.dispose();
            (0, vitest_1.expect)(service.isExecuting('t1')).toBe(false);
        });
    });
});
//# sourceMappingURL=ShellIntegrationService.test.js.map