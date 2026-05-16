"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const VSCodeCommandHandler_1 = require("../../../../../../../webview/managers/input/handlers/VSCodeCommandHandler");
(0, vitest_1.describe)('VSCodeCommandHandler', () => {
    let handler;
    let mockTerminalOperations;
    let mockManager;
    let mockEmitEvent;
    let mockLogger;
    (0, vitest_1.beforeEach)(() => {
        mockTerminalOperations = {
            clearTerminal: vitest_1.vi.fn(),
            scrollTerminal: vitest_1.vi.fn(),
        };
        mockManager = {
            getActiveTerminalId: vitest_1.vi.fn(),
            getTerminalInstance: vitest_1.vi.fn(),
            postMessageToExtension: vitest_1.vi.fn(),
            getManagers: vitest_1.vi.fn().mockReturnValue({}),
        };
        mockEmitEvent = vitest_1.vi.fn();
        mockLogger = vitest_1.vi.fn();
        handler = new VSCodeCommandHandler_1.VSCodeCommandHandler(mockTerminalOperations, mockEmitEvent, mockLogger);
    });
    (0, vitest_1.describe)('handleCommand', () => {
        (0, vitest_1.it)('should return true for registered commands', async () => {
            const result = await handler.handleCommand('workbench.action.terminal.new', mockManager);
            (0, vitest_1.expect)(result).toBe(true);
        });
        (0, vitest_1.it)('should return false for unregistered commands', async () => {
            const result = await handler.handleCommand('unknown.command', mockManager);
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should log error and return false if handling fails', async () => {
            // Force an error by mocking a dependency to throw
            mockManager.getActiveTerminalId.mockImplementation(() => {
                throw new Error('Test error');
            });
            // Using a command that calls getActiveTerminalId, e.g., split
            const result = await handler.handleCommand('workbench.action.terminal.split', mockManager);
            (0, vitest_1.expect)(result).toBe(false);
            (0, vitest_1.expect)(mockLogger).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Error handling command'), vitest_1.expect.any(Error));
        });
    });
    (0, vitest_1.describe)('Lifecycle Commands', () => {
        (0, vitest_1.it)('should handle new terminal', async () => {
            await handler.handleCommand('workbench.action.terminal.new', mockManager);
            (0, vitest_1.expect)(mockEmitEvent).toHaveBeenCalledWith('create-terminal', '', undefined, mockManager);
        });
        (0, vitest_1.it)('should handle split terminal', async () => {
            mockManager.getActiveTerminalId.mockReturnValue('term-1');
            await handler.handleCommand('workbench.action.terminal.split', mockManager);
            (0, vitest_1.expect)(mockEmitEvent).toHaveBeenCalledWith('split-terminal', 'term-1', undefined, mockManager);
        });
        (0, vitest_1.it)('should handle kill terminal', async () => {
            mockManager.getActiveTerminalId.mockReturnValue('term-1');
            await handler.handleCommand('workbench.action.terminal.kill', mockManager);
            (0, vitest_1.expect)(mockEmitEvent).toHaveBeenCalledWith('kill-terminal', 'term-1', undefined, mockManager);
        });
        (0, vitest_1.it)('should handle clear terminal', async () => {
            await handler.handleCommand('workbench.action.terminal.clear', mockManager);
            (0, vitest_1.expect)(mockTerminalOperations.clearTerminal).toHaveBeenCalledWith(mockManager);
        });
        (0, vitest_1.it)('should handle sizeToContentWidth', async () => {
            const mockFit = vitest_1.vi.fn();
            mockManager.getActiveTerminalId.mockReturnValue('term-1');
            mockManager.getTerminalInstance.mockReturnValue({
                fitAddon: { fit: mockFit },
            });
            await handler.handleCommand('workbench.action.terminal.sizeToContentWidth', mockManager);
            (0, vitest_1.expect)(mockFit).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Navigation Commands', () => {
        (0, vitest_1.it)('should handle focus next', async () => {
            mockManager.getActiveTerminalId.mockReturnValue('term-1');
            await handler.handleCommand('workbench.action.terminal.focusNext', mockManager);
            (0, vitest_1.expect)(mockEmitEvent).toHaveBeenCalledWith('switch-next', 'term-1', undefined, mockManager);
        });
        (0, vitest_1.it)('should handle focus previous', async () => {
            mockManager.getActiveTerminalId.mockReturnValue('term-1');
            await handler.handleCommand('workbench.action.terminal.focusPrevious', mockManager);
            (0, vitest_1.expect)(mockEmitEvent).toHaveBeenCalledWith('switch-previous', 'term-1', undefined, mockManager);
        });
        (0, vitest_1.it)('should handle toggle terminal', async () => {
            await handler.handleCommand('workbench.action.terminal.toggleTerminal', mockManager);
            (0, vitest_1.expect)(mockEmitEvent).toHaveBeenCalledWith('toggle-terminal', '', undefined, mockManager);
        });
    });
    (0, vitest_1.describe)('Scroll Commands', () => {
        (0, vitest_1.it)('should delegate scroll commands to TerminalOperationsService', async () => {
            await handler.handleCommand('workbench.action.terminal.scrollUp', mockManager);
            (0, vitest_1.expect)(mockTerminalOperations.scrollTerminal).toHaveBeenCalledWith('up', mockManager);
            await handler.handleCommand('workbench.action.terminal.scrollToBottom', mockManager);
            (0, vitest_1.expect)(mockTerminalOperations.scrollTerminal).toHaveBeenCalledWith('bottom', mockManager);
        });
    });
    (0, vitest_1.describe)('Clipboard Commands', () => {
        (0, vitest_1.it)('should handle copy selection', async () => {
            mockManager.getActiveTerminalId.mockReturnValue('term-1');
            mockManager.getTerminalInstance.mockReturnValue({
                terminal: {
                    hasSelection: () => true,
                    getSelection: () => 'selected text',
                },
            });
            await handler.handleCommand('workbench.action.terminal.copySelection', mockManager);
            (0, vitest_1.expect)(mockManager.postMessageToExtension).toHaveBeenCalledWith({
                command: 'copyToClipboard',
                text: 'selected text',
            });
        });
        (0, vitest_1.it)('should handle paste', async () => {
            await handler.handleCommand('workbench.action.terminal.paste', mockManager);
            (0, vitest_1.expect)(mockManager.postMessageToExtension).toHaveBeenCalledWith({
                command: 'requestPaste',
            });
        });
        (0, vitest_1.it)('should handle select all', async () => {
            const mockSelectAll = vitest_1.vi.fn();
            mockManager.getActiveTerminalId.mockReturnValue('term-1');
            mockManager.getTerminalInstance.mockReturnValue({
                terminal: { selectAll: mockSelectAll },
            });
            await handler.handleCommand('workbench.action.terminal.selectAll', mockManager);
            (0, vitest_1.expect)(mockSelectAll).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Find Commands', () => {
        let mockFindInTerminal;
        (0, vitest_1.beforeEach)(() => {
            mockFindInTerminal = {
                show: vitest_1.vi.fn(),
                findNext: vitest_1.vi.fn(),
                findPrevious: vitest_1.vi.fn(),
                hide: vitest_1.vi.fn(),
            };
            mockManager.getManagers.mockReturnValue({
                findInTerminal: mockFindInTerminal,
            });
        });
        (0, vitest_1.it)('should handle focus find', async () => {
            await handler.handleCommand('workbench.action.terminal.focusFind', mockManager);
            (0, vitest_1.expect)(mockFindInTerminal.show).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle find next', async () => {
            await handler.handleCommand('workbench.action.terminal.findNext', mockManager);
            (0, vitest_1.expect)(mockFindInTerminal.findNext).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle find previous', async () => {
            await handler.handleCommand('workbench.action.terminal.findPrevious', mockManager);
            (0, vitest_1.expect)(mockFindInTerminal.findPrevious).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle hide find', async () => {
            await handler.handleCommand('workbench.action.terminal.hideFind', mockManager);
            (0, vitest_1.expect)(mockFindInTerminal.hide).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Editing Commands', () => {
        let mockInput;
        (0, vitest_1.beforeEach)(() => {
            mockInput = vitest_1.vi.fn();
            mockManager.getActiveTerminalId.mockReturnValue('term-1');
            mockManager.getTerminalInstance.mockReturnValue({
                terminal: { input: mockInput },
            });
        });
        (0, vitest_1.it)('should handle delete word left', async () => {
            await handler.handleCommand('workbench.action.terminal.deleteWordLeft', mockManager);
            (0, vitest_1.expect)(mockInput).toHaveBeenCalledWith('\x17');
        });
        (0, vitest_1.it)('should handle delete word right', async () => {
            await handler.handleCommand('workbench.action.terminal.deleteWordRight', mockManager);
            (0, vitest_1.expect)(mockInput).toHaveBeenCalledWith('\x1bd');
        });
        (0, vitest_1.it)('should handle move to line start', async () => {
            await handler.handleCommand('workbench.action.terminal.moveToLineStart', mockManager);
            (0, vitest_1.expect)(mockInput).toHaveBeenCalledWith('\x01');
        });
        (0, vitest_1.it)('should handle move to line end', async () => {
            await handler.handleCommand('workbench.action.terminal.moveToLineEnd', mockManager);
            (0, vitest_1.expect)(mockInput).toHaveBeenCalledWith('\x05');
        });
    });
    (0, vitest_1.describe)('Unavailable Commands', () => {
        (0, vitest_1.it)('should log unavailable commands without error', async () => {
            await handler.handleCommand('workbench.action.reloadWindow', mockManager);
            (0, vitest_1.expect)(mockLogger).toHaveBeenCalledWith(vitest_1.expect.stringContaining('not available'));
        });
    });
    (0, vitest_1.describe)('Stats and Checks', () => {
        (0, vitest_1.it)('should return registry stats', () => {
            const stats = handler.getStats();
            (0, vitest_1.expect)(stats.totalCommands).toBeGreaterThan(0);
            (0, vitest_1.expect)(stats.categories).toBeDefined();
        });
        (0, vitest_1.it)('should check if command is registered', () => {
            (0, vitest_1.expect)(handler.hasCommand('workbench.action.terminal.new')).toBe(true);
            (0, vitest_1.expect)(handler.hasCommand('unknown')).toBe(false);
        });
    });
});
//# sourceMappingURL=VSCodeCommandHandler.test.js.map