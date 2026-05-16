"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TerminalCommandHandler_1 = require("../../../../../../messaging/patterns/handlers/TerminalCommandHandler");
(0, vitest_1.describe)('TerminalCommandHandler', () => {
    let handler;
    let mockCoordinator;
    let mockContext;
    (0, vitest_1.beforeEach)(() => {
        handler = new TerminalCommandHandler_1.TerminalCommandHandler();
        mockCoordinator = {
            initializeTerminal: vitest_1.vi.fn(),
            getTerminalInstance: vitest_1.vi.fn(),
            createTerminal: vitest_1.vi.fn(),
            setActiveTerminal: vitest_1.vi.fn(),
            removeTerminal: vitest_1.vi.fn(),
            getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('active-term'),
        };
        mockContext = {
            coordinator: mockCoordinator,
            log: vitest_1.vi.fn(),
            postMessage: vitest_1.vi.fn(),
            metadata: {},
        };
    });
    (0, vitest_1.it)('should have the correct name and priority', () => {
        (0, vitest_1.expect)(handler.getName()).toBe('TerminalCommandHandler');
        (0, vitest_1.expect)(handler.getPriority()).toBe(75);
    });
    (0, vitest_1.it)('should support all specified terminal commands', () => {
        const commands = handler.getSupportedCommands();
        (0, vitest_1.expect)(commands).toContain('init');
        (0, vitest_1.expect)(commands).toContain('output');
        (0, vitest_1.expect)(commands).toContain('terminalCreated');
        (0, vitest_1.expect)(commands).toContain('clear');
    });
    (0, vitest_1.it)('should handle init command', async () => {
        const msg = { command: 'init' };
        await handler.handle(msg, mockContext);
        (0, vitest_1.expect)(mockCoordinator.initializeTerminal).toHaveBeenCalledWith(msg);
    });
    (0, vitest_1.it)('should handle output command', async () => {
        const mockTerminal = { write: vitest_1.vi.fn() };
        mockCoordinator.getTerminalInstance.mockReturnValue({ terminal: mockTerminal });
        const msg = { command: 'output', terminalId: 't1', data: 'hello' };
        await handler.handle(msg, mockContext);
        (0, vitest_1.expect)(mockCoordinator.getTerminalInstance).toHaveBeenCalledWith('t1');
        (0, vitest_1.expect)(mockTerminal.write).toHaveBeenCalledWith('hello');
    });
    (0, vitest_1.it)('should handle terminalCreated command', async () => {
        const msg = { command: 'terminalCreated', terminalId: 't1' };
        await handler.handle(msg, mockContext);
        (0, vitest_1.expect)(mockCoordinator.createTerminal).toHaveBeenCalledWith(msg);
    });
    (0, vitest_1.it)('should handle focusTerminal command', async () => {
        const msg = { command: 'focusTerminal', terminalId: 't1' };
        await handler.handle(msg, mockContext);
        (0, vitest_1.expect)(mockCoordinator.setActiveTerminal).toHaveBeenCalledWith('t1');
    });
    (0, vitest_1.it)('should handle terminalRemoved command', async () => {
        const msg = { command: 'terminalRemoved', terminalId: 't1' };
        await handler.handle(msg, mockContext);
        (0, vitest_1.expect)(mockCoordinator.removeTerminal).toHaveBeenCalledWith('t1');
    });
    (0, vitest_1.it)('should handle clear command', async () => {
        const mockTerminal = { clear: vitest_1.vi.fn() };
        mockCoordinator.getTerminalInstance.mockReturnValue({ terminal: mockTerminal });
        const msg = { command: 'clear', terminalId: 't1' };
        await handler.handle(msg, mockContext);
        (0, vitest_1.expect)(mockTerminal.clear).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should handle clear command without ID (use active)', async () => {
        const mockTerminal = { clear: vitest_1.vi.fn() };
        mockCoordinator.getTerminalInstance.mockReturnValue({ terminal: mockTerminal });
        const msg = { command: 'clear' };
        await handler.handle(msg, mockContext);
        (0, vitest_1.expect)(mockCoordinator.getActiveTerminalId).toHaveBeenCalled();
        (0, vitest_1.expect)(mockCoordinator.getTerminalInstance).toHaveBeenCalledWith('active-term');
        (0, vitest_1.expect)(mockTerminal.clear).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should throw error if coordinator is missing', async () => {
        mockContext.coordinator = undefined;
        await (0, vitest_1.expect)(handler.handle({ command: 'init' }, mockContext)).rejects.toThrow('Coordinator not available');
    });
});
//# sourceMappingURL=TerminalCommandHandler.test.js.map