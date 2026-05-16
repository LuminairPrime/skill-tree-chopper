"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const VSCodeCommandDispatcher_1 = require("../../../../../../../webview/managers/input/handlers/VSCodeCommandDispatcher");
// Mock PlatformUtils
vitest_1.vi.mock('../../../../../../../webview/utils/PlatformUtils', () => ({
    isMacPlatform: vitest_1.vi.fn().mockReturnValue(false),
}));
const PlatformUtils_1 = require("../../../../../../../webview/utils/PlatformUtils");
(0, vitest_1.describe)('VSCodeCommandDispatcher', () => {
    let dispatcher;
    let deps;
    let mockManager;
    let mockTerminal;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        PlatformUtils_1.isMacPlatform.mockReturnValue(false);
        deps = {
            logger: vitest_1.vi.fn(),
            emitTerminalInteractionEvent: vitest_1.vi.fn(),
            terminalOperationsService: {
                scrollTerminal: vitest_1.vi.fn(),
                clearTerminal: vitest_1.vi.fn(),
                deleteWordLeft: vitest_1.vi.fn(),
                deleteWordRight: vitest_1.vi.fn(),
                moveToLineStart: vitest_1.vi.fn(),
                moveToLineEnd: vitest_1.vi.fn(),
                sizeToContent: vitest_1.vi.fn(),
            },
            handleTerminalCopy: vitest_1.vi.fn(),
            handleTerminalPaste: vitest_1.vi.fn(),
            handleTerminalSelectAll: vitest_1.vi.fn(),
            handleTerminalFind: vitest_1.vi.fn(),
            handleTerminalFindNext: vitest_1.vi.fn(),
            handleTerminalFindPrevious: vitest_1.vi.fn(),
            handleTerminalHideFind: vitest_1.vi.fn(),
            handleTerminalClear: vitest_1.vi.fn(),
        };
        mockManager = {
            getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('terminal-1'),
            getTerminalInstance: vitest_1.vi.fn().mockReturnValue({
                terminal: { hasSelection: vitest_1.vi.fn().mockReturnValue(false) },
            }),
            postMessageToExtension: vitest_1.vi.fn(),
        };
        mockTerminal = {
            hasSelection: vitest_1.vi.fn().mockReturnValue(false),
            getSelection: vitest_1.vi.fn().mockReturnValue(''),
        };
        dispatcher = new VSCodeCommandDispatcher_1.VSCodeCommandDispatcher(deps);
    });
    (0, vitest_1.describe)('handleVSCodeCommand', () => {
        (0, vitest_1.describe)('Terminal lifecycle commands', () => {
            (0, vitest_1.it)('should emit create-terminal for terminal.new', () => {
                dispatcher.handleVSCodeCommand('workbench.action.terminal.new', mockManager);
                (0, vitest_1.expect)(deps.emitTerminalInteractionEvent).toHaveBeenCalledWith('create-terminal', '', undefined, mockManager);
            });
            (0, vitest_1.it)('should emit split-terminal for terminal.split', () => {
                dispatcher.handleVSCodeCommand('workbench.action.terminal.split', mockManager);
                (0, vitest_1.expect)(deps.emitTerminalInteractionEvent).toHaveBeenCalledWith('split-terminal', 'terminal-1', undefined, mockManager);
            });
            (0, vitest_1.it)('should emit kill-terminal for terminal.kill', () => {
                dispatcher.handleVSCodeCommand('workbench.action.terminal.kill', mockManager);
                (0, vitest_1.expect)(deps.emitTerminalInteractionEvent).toHaveBeenCalledWith('kill-terminal', 'terminal-1', undefined, mockManager);
            });
            (0, vitest_1.it)('should delegate terminal.clear to handleTerminalClear', () => {
                dispatcher.handleVSCodeCommand('workbench.action.terminal.clear', mockManager);
                (0, vitest_1.expect)(deps.handleTerminalClear).toHaveBeenCalledWith(mockManager);
            });
        });
        (0, vitest_1.describe)('Navigation commands', () => {
            (0, vitest_1.it)('should emit switch-next for focusNext', () => {
                dispatcher.handleVSCodeCommand('workbench.action.terminal.focusNext', mockManager);
                (0, vitest_1.expect)(deps.emitTerminalInteractionEvent).toHaveBeenCalledWith('switch-next', 'terminal-1', undefined, mockManager);
            });
            (0, vitest_1.it)('should emit switch-previous for focusPrevious', () => {
                dispatcher.handleVSCodeCommand('workbench.action.terminal.focusPrevious', mockManager);
                (0, vitest_1.expect)(deps.emitTerminalInteractionEvent).toHaveBeenCalledWith('switch-previous', 'terminal-1', undefined, mockManager);
            });
            (0, vitest_1.it)('should emit toggle-terminal for toggleTerminal', () => {
                dispatcher.handleVSCodeCommand('workbench.action.terminal.toggleTerminal', mockManager);
                (0, vitest_1.expect)(deps.emitTerminalInteractionEvent).toHaveBeenCalledWith('toggle-terminal', '', undefined, mockManager);
            });
        });
        (0, vitest_1.describe)('Scroll commands', () => {
            vitest_1.it.each([
                ['scrollUp', 'up'],
                ['scrollDown', 'down'],
                ['scrollToTop', 'top'],
                ['scrollToBottom', 'bottom'],
                ['scrollToPreviousCommand', 'previousCommand'],
                ['scrollToNextCommand', 'nextCommand'],
            ])('should scroll %s', (commandSuffix, direction) => {
                dispatcher.handleVSCodeCommand(`workbench.action.terminal.${commandSuffix}`, mockManager);
                (0, vitest_1.expect)(deps.terminalOperationsService.scrollTerminal).toHaveBeenCalledWith(direction, mockManager);
            });
        });
        (0, vitest_1.describe)('Clipboard commands', () => {
            (0, vitest_1.it)('should delegate copySelection to handleTerminalCopy', () => {
                dispatcher.handleVSCodeCommand('workbench.action.terminal.copySelection', mockManager);
                (0, vitest_1.expect)(deps.handleTerminalCopy).toHaveBeenCalledWith(mockManager);
            });
            (0, vitest_1.it)('should delegate paste to handleTerminalPaste', () => {
                dispatcher.handleVSCodeCommand('workbench.action.terminal.paste', mockManager);
                (0, vitest_1.expect)(deps.handleTerminalPaste).toHaveBeenCalledWith(mockManager);
            });
            (0, vitest_1.it)('should delegate selectAll to handleTerminalSelectAll', () => {
                dispatcher.handleVSCodeCommand('workbench.action.terminal.selectAll', mockManager);
                (0, vitest_1.expect)(deps.handleTerminalSelectAll).toHaveBeenCalledWith(mockManager);
            });
        });
        (0, vitest_1.describe)('Find commands', () => {
            (0, vitest_1.it)('should delegate focusFind to handleTerminalFind', () => {
                dispatcher.handleVSCodeCommand('workbench.action.terminal.focusFind', mockManager);
                (0, vitest_1.expect)(deps.handleTerminalFind).toHaveBeenCalledWith(mockManager);
            });
            (0, vitest_1.it)('should delegate findNext to handleTerminalFindNext', () => {
                dispatcher.handleVSCodeCommand('workbench.action.terminal.findNext', mockManager);
                (0, vitest_1.expect)(deps.handleTerminalFindNext).toHaveBeenCalledWith(mockManager);
            });
            (0, vitest_1.it)('should delegate findPrevious to handleTerminalFindPrevious', () => {
                dispatcher.handleVSCodeCommand('workbench.action.terminal.findPrevious', mockManager);
                (0, vitest_1.expect)(deps.handleTerminalFindPrevious).toHaveBeenCalledWith(mockManager);
            });
            (0, vitest_1.it)('should delegate hideFind to handleTerminalHideFind', () => {
                dispatcher.handleVSCodeCommand('workbench.action.terminal.hideFind', mockManager);
                (0, vitest_1.expect)(deps.handleTerminalHideFind).toHaveBeenCalledWith(mockManager);
            });
        });
        (0, vitest_1.describe)('Word/Line operations', () => {
            (0, vitest_1.it)('should delegate deleteWordLeft', () => {
                dispatcher.handleVSCodeCommand('workbench.action.terminal.deleteWordLeft', mockManager);
                (0, vitest_1.expect)(deps.terminalOperationsService.deleteWordLeft).toHaveBeenCalledWith(mockManager);
            });
            (0, vitest_1.it)('should delegate deleteWordRight', () => {
                dispatcher.handleVSCodeCommand('workbench.action.terminal.deleteWordRight', mockManager);
                (0, vitest_1.expect)(deps.terminalOperationsService.deleteWordRight).toHaveBeenCalledWith(mockManager);
            });
            (0, vitest_1.it)('should delegate moveToLineStart', () => {
                dispatcher.handleVSCodeCommand('workbench.action.terminal.moveToLineStart', mockManager);
                (0, vitest_1.expect)(deps.terminalOperationsService.moveToLineStart).toHaveBeenCalledWith(mockManager);
            });
            (0, vitest_1.it)('should delegate moveToLineEnd', () => {
                dispatcher.handleVSCodeCommand('workbench.action.terminal.moveToLineEnd', mockManager);
                (0, vitest_1.expect)(deps.terminalOperationsService.moveToLineEnd).toHaveBeenCalledWith(mockManager);
            });
        });
        (0, vitest_1.describe)('Size and unavailable commands', () => {
            (0, vitest_1.it)('should delegate sizeToContentWidth', () => {
                dispatcher.handleVSCodeCommand('workbench.action.terminal.sizeToContentWidth', mockManager);
                (0, vitest_1.expect)(deps.terminalOperationsService.sizeToContent).toHaveBeenCalledWith(mockManager);
            });
            (0, vitest_1.it)('should log unavailable commands without errors', () => {
                const unavailableCommands = [
                    'workbench.action.togglePanel',
                    'workbench.action.closePanel',
                    'workbench.action.toggleSidebarVisibility',
                    'workbench.action.toggleDevTools',
                    'workbench.action.reloadWindow',
                    'workbench.action.reloadWindowWithExtensionsDisabled',
                    'workbench.action.zoomIn',
                    'workbench.action.zoomOut',
                    'workbench.action.zoomReset',
                    'workbench.action.quickOpen',
                    'workbench.action.showCommands',
                    'workbench.action.terminal.openNativeConsole',
                ];
                for (const command of unavailableCommands) {
                    dispatcher.handleVSCodeCommand(command, mockManager);
                }
                // All should log, none should throw
                (0, vitest_1.expect)(deps.logger).toHaveBeenCalled();
            });
            (0, vitest_1.it)('should log unhandled commands', () => {
                dispatcher.handleVSCodeCommand('some.unknown.command', mockManager);
                (0, vitest_1.expect)(deps.logger).toHaveBeenCalledWith('Unhandled VS Code command: some.unknown.command');
            });
        });
        (0, vitest_1.describe)('Fallback when no active terminal', () => {
            (0, vitest_1.it)('should use empty string when getActiveTerminalId returns null', () => {
                mockManager.getActiveTerminalId.mockReturnValue(null);
                dispatcher.handleVSCodeCommand('workbench.action.terminal.split', mockManager);
                (0, vitest_1.expect)(deps.emitTerminalInteractionEvent).toHaveBeenCalledWith('split-terminal', '', undefined, mockManager);
            });
        });
    });
    (0, vitest_1.describe)('shouldInterceptKeyForVSCode', () => {
        const createKeyEvent = (init) => {
            return new KeyboardEvent('keydown', { ...init, bubbles: true, cancelable: true });
        };
        (0, vitest_1.describe)('Arrow keys', () => {
            (0, vitest_1.it)('should pass arrow keys to shell', () => {
                for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) {
                    const event = createKeyEvent({ key });
                    (0, vitest_1.expect)(dispatcher.shouldInterceptKeyForVSCode(event, mockTerminal, mockManager)).toBe(false);
                }
            });
            (0, vitest_1.it)('should intercept Ctrl+Shift+ArrowUp for scroll up', () => {
                const event = createKeyEvent({
                    key: 'ArrowUp',
                    ctrlKey: true,
                    shiftKey: true,
                });
                const result = dispatcher.shouldInterceptKeyForVSCode(event, mockTerminal, mockManager);
                (0, vitest_1.expect)(result).toBe(true);
                (0, vitest_1.expect)(deps.terminalOperationsService.scrollTerminal).toHaveBeenCalledWith('up', mockManager);
            });
            (0, vitest_1.it)('should intercept Ctrl+Shift+ArrowDown for scroll down', () => {
                const event = createKeyEvent({
                    key: 'ArrowDown',
                    ctrlKey: true,
                    shiftKey: true,
                });
                const result = dispatcher.shouldInterceptKeyForVSCode(event, mockTerminal, mockManager);
                (0, vitest_1.expect)(result).toBe(true);
                (0, vitest_1.expect)(deps.terminalOperationsService.scrollTerminal).toHaveBeenCalledWith('down', mockManager);
            });
        });
        (0, vitest_1.describe)('Tab key', () => {
            (0, vitest_1.it)('should pass Tab to shell for completion', () => {
                const event = createKeyEvent({ key: 'Tab' });
                (0, vitest_1.expect)(dispatcher.shouldInterceptKeyForVSCode(event, mockTerminal, mockManager)).toBe(false);
            });
        });
        (0, vitest_1.describe)('Copy/Paste with Ctrl/Cmd', () => {
            (0, vitest_1.it)('should intercept Ctrl+C when selection exists (copy)', () => {
                mockTerminal.hasSelection.mockReturnValue(true);
                const event = createKeyEvent({ key: 'c', ctrlKey: true });
                (0, vitest_1.expect)(dispatcher.shouldInterceptKeyForVSCode(event, mockTerminal, mockManager)).toBe(true);
                (0, vitest_1.expect)(deps.handleTerminalCopy).toHaveBeenCalledWith(mockManager);
            });
            (0, vitest_1.it)('should pass Ctrl+C to shell when no selection (SIGINT)', () => {
                mockTerminal.hasSelection.mockReturnValue(false);
                const event = createKeyEvent({ key: 'c', ctrlKey: true });
                (0, vitest_1.expect)(dispatcher.shouldInterceptKeyForVSCode(event, mockTerminal, mockManager)).toBe(false);
            });
            (0, vitest_1.it)('should intercept Ctrl+V for paste', () => {
                const event = createKeyEvent({ key: 'v', ctrlKey: true });
                (0, vitest_1.expect)(dispatcher.shouldInterceptKeyForVSCode(event, mockTerminal, mockManager)).toBe(true);
                (0, vitest_1.expect)(deps.handleTerminalPaste).toHaveBeenCalledWith(mockManager);
            });
            (0, vitest_1.it)('should intercept Ctrl+Shift+C for copy when selection exists', () => {
                mockTerminal.hasSelection.mockReturnValue(true);
                const event = createKeyEvent({ key: 'c', ctrlKey: true, shiftKey: true });
                (0, vitest_1.expect)(dispatcher.shouldInterceptKeyForVSCode(event, mockTerminal, mockManager)).toBe(true);
                (0, vitest_1.expect)(deps.handleTerminalCopy).toHaveBeenCalledWith(mockManager);
            });
            (0, vitest_1.it)('should not intercept Ctrl+Shift+C when no selection', () => {
                mockTerminal.hasSelection.mockReturnValue(false);
                const event = createKeyEvent({ key: 'c', ctrlKey: true, shiftKey: true });
                (0, vitest_1.expect)(dispatcher.shouldInterceptKeyForVSCode(event, mockTerminal, mockManager)).toBe(false);
            });
            (0, vitest_1.it)('should intercept Ctrl+Shift+V for paste', () => {
                const event = createKeyEvent({ key: 'v', ctrlKey: true, shiftKey: true });
                (0, vitest_1.expect)(dispatcher.shouldInterceptKeyForVSCode(event, mockTerminal, mockManager)).toBe(true);
                (0, vitest_1.expect)(deps.handleTerminalPaste).toHaveBeenCalledWith(mockManager);
            });
        });
        (0, vitest_1.describe)('Shell-essential keys', () => {
            (0, vitest_1.it)('should pass Ctrl+D/Z/A/E/U/K/W/R/L to shell', () => {
                const keys = ['d', 'z', 'a', 'e', 'u', 'k', 'w', 'r', 'l'];
                for (const key of keys) {
                    const event = createKeyEvent({ key, ctrlKey: true });
                    (0, vitest_1.expect)(dispatcher.shouldInterceptKeyForVSCode(event, mockTerminal, mockManager)).toBe(false);
                }
            });
        });
        (0, vitest_1.describe)('macOS Cmd+K clear', () => {
            (0, vitest_1.it)('should intercept Cmd+K on macOS for clear', () => {
                PlatformUtils_1.isMacPlatform.mockReturnValue(true);
                const event = createKeyEvent({ key: 'k', metaKey: true });
                (0, vitest_1.expect)(dispatcher.shouldInterceptKeyForVSCode(event, mockTerminal, mockManager)).toBe(true);
                (0, vitest_1.expect)(deps.handleTerminalClear).toHaveBeenCalledWith(mockManager);
            });
            (0, vitest_1.it)('should not intercept Cmd+K on non-Mac', () => {
                PlatformUtils_1.isMacPlatform.mockReturnValue(false);
                const event = createKeyEvent({ key: 'k', metaKey: true });
                // metaKey without ctrlKey on non-Mac falls through to "all other keys"
                (0, vitest_1.expect)(dispatcher.shouldInterceptKeyForVSCode(event, mockTerminal, mockManager)).toBe(false);
            });
        });
        (0, vitest_1.describe)('Insert key shortcuts', () => {
            (0, vitest_1.it)('should intercept Ctrl+Insert for copy when selection exists', () => {
                mockTerminal.hasSelection.mockReturnValue(true);
                const event = createKeyEvent({ key: 'Insert', ctrlKey: true });
                (0, vitest_1.expect)(dispatcher.shouldInterceptKeyForVSCode(event, mockTerminal, mockManager)).toBe(true);
                (0, vitest_1.expect)(deps.handleTerminalCopy).toHaveBeenCalledWith(mockManager);
            });
            (0, vitest_1.it)('should not intercept Ctrl+Insert when no selection', () => {
                mockTerminal.hasSelection.mockReturnValue(false);
                const event = createKeyEvent({ key: 'Insert', ctrlKey: true });
                (0, vitest_1.expect)(dispatcher.shouldInterceptKeyForVSCode(event, mockTerminal, mockManager)).toBe(false);
            });
            (0, vitest_1.it)('should intercept Shift+Insert for paste', () => {
                const event = createKeyEvent({ key: 'Insert', shiftKey: true });
                (0, vitest_1.expect)(dispatcher.shouldInterceptKeyForVSCode(event, mockTerminal, mockManager)).toBe(true);
                (0, vitest_1.expect)(deps.handleTerminalPaste).toHaveBeenCalledWith(mockManager);
            });
        });
        (0, vitest_1.describe)('F12 key', () => {
            (0, vitest_1.it)('should intercept F12 for dev tools', () => {
                const event = createKeyEvent({ key: 'F12' });
                (0, vitest_1.expect)(dispatcher.shouldInterceptKeyForVSCode(event, mockTerminal, mockManager)).toBe(true);
            });
        });
        (0, vitest_1.describe)('Regular keys', () => {
            (0, vitest_1.it)('should pass regular keys to shell', () => {
                for (const key of ['a', 'b', '1', 'Enter', 'Backspace']) {
                    const event = createKeyEvent({ key });
                    (0, vitest_1.expect)(dispatcher.shouldInterceptKeyForVSCode(event, mockTerminal, mockManager)).toBe(false);
                }
            });
        });
    });
});
//# sourceMappingURL=VSCodeCommandDispatcher.test.js.map