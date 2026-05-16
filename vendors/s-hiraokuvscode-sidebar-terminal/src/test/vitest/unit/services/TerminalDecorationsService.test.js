"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TerminalDecorationsService_1 = require("../../../../services/TerminalDecorationsService");
// Mock VS Code API
const mockEventEmitter = {
    event: vitest_1.vi.fn(),
    fire: vitest_1.vi.fn(),
    dispose: vitest_1.vi.fn(),
};
const mockConfiguration = {
    get: vitest_1.vi.fn((key, defaultValue) => {
        if (key === 'terminal.integrated.shellIntegration.decorationsEnabled')
            return true;
        if (key === 'secondaryTerminal.decorations')
            return {};
        return defaultValue;
    }),
};
vitest_1.vi.mock('vscode', () => {
    return {
        EventEmitter: vitest_1.vi.fn(function () {
            return mockEventEmitter;
        }),
        workspace: {
            getConfiguration: vitest_1.vi.fn(() => mockConfiguration),
            onDidChangeConfiguration: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
        },
    };
});
// Mock logger
vitest_1.vi.mock('../../../../utils/logger', () => ({
    terminal: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('TerminalDecorationsService', () => {
    let service;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.useFakeTimers();
        mockEventEmitter.fire.mockClear();
        service = new TerminalDecorationsService_1.TerminalDecorationsService();
    });
    (0, vitest_1.afterEach)(() => {
        service.dispose();
        vitest_1.vi.clearAllMocks();
        vitest_1.vi.useRealTimers();
    });
    (0, vitest_1.describe)('addDecoration', () => {
        (0, vitest_1.it)('should add decoration and fire event', () => {
            const decoration = {
                terminalId: 't1',
                commandId: 'cmd1',
                line: 1,
                status: 'running',
            };
            service.addDecoration(decoration);
            (0, vitest_1.expect)(service.getDecorations('t1')).toHaveLength(1);
            (0, vitest_1.expect)(mockEventEmitter.fire).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                terminalId: 't1',
                decorations: vitest_1.expect.arrayContaining([vitest_1.expect.objectContaining({ commandId: 'cmd1' })]),
            }));
        });
        (0, vitest_1.it)('should respect max decoration limit', () => {
            for (let i = 0; i < 110; i++) {
                service.addDecoration({
                    terminalId: 't1',
                    commandId: `cmd${i}`,
                    line: i,
                    status: 'success',
                });
            }
            (0, vitest_1.expect)(service.getDecorations('t1')).toHaveLength(100);
        });
    });
    (0, vitest_1.describe)('completeCommand', () => {
        (0, vitest_1.it)('should update running command status', () => {
            service.addDecoration({
                terminalId: 't1',
                commandId: 'cmd1',
                line: 1,
                status: 'running',
            });
            service.completeCommand('t1', 'cmd1', 0);
            const decorations = service.getDecorations('t1');
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(decorations[0].status).toBe('success');
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(decorations[0].exitCode).toBe(0);
            (0, vitest_1.expect)(mockEventEmitter.fire).toHaveBeenCalledTimes(2); // add + complete
        });
        (0, vitest_1.it)('should set error status for non-zero exit code', () => {
            service.addDecoration({
                terminalId: 't1',
                commandId: 'cmd1',
                line: 1,
                status: 'running',
            });
            service.completeCommand('t1', 'cmd1', 1);
            const decorations = service.getDecorations('t1');
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(decorations[0].status).toBe('error');
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(decorations[0].exitCode).toBe(1);
        });
    });
    (0, vitest_1.describe)('processShellIntegrationData', () => {
        (0, vitest_1.it)('should detect command start', () => {
            service.processShellIntegrationData('t1', '\x1b]633;A;ls\x07');
            const decorations = service.getDecorations('t1');
            (0, vitest_1.expect)(decorations).toHaveLength(1);
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(decorations[0].status).toBe('running');
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(decorations[0].command).toBe('ls');
        });
        (0, vitest_1.it)('should detect command end and complete latest running command', () => {
            // Start command
            service.processShellIntegrationData('t1', '\x1b]633;A;ls\x07');
            // End command (exit code 0)
            service.processShellIntegrationData('t1', '\x1b]633;D;0\x07');
            const decorations = service.getDecorations('t1');
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(decorations[0].status).toBe('success');
        });
    });
    (0, vitest_1.describe)('clearDecorations', () => {
        (0, vitest_1.it)('should clear decorations for terminal', () => {
            service.addDecoration({
                terminalId: 't1',
                commandId: 'cmd1',
                line: 1,
                status: 'running',
            });
            service.clearDecorations('t1');
            (0, vitest_1.expect)(service.getDecorations('t1')).toHaveLength(0);
            (0, vitest_1.expect)(mockEventEmitter.fire).toHaveBeenCalledTimes(2);
        });
    });
    (0, vitest_1.describe)('generateDecorationCSS', () => {
        (0, vitest_1.it)('should return CSS string', () => {
            const css = service.generateDecorationCSS();
            (0, vitest_1.expect)(css).toContain('.terminal-command-decoration');
            (0, vitest_1.expect)(css).toContain('background-color:');
        });
    });
});
//# sourceMappingURL=TerminalDecorationsService.test.js.map