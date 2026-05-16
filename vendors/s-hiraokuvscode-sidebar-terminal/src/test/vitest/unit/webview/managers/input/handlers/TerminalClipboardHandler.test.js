"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TerminalClipboardHandler_1 = require("../../../../../../../webview/managers/input/handlers/TerminalClipboardHandler");
(0, vitest_1.describe)('TerminalClipboardHandler', () => {
    let handler;
    let mockDeps;
    let mockManager;
    let mockTerminal;
    (0, vitest_1.beforeEach)(() => {
        mockTerminal = {
            hasSelection: vitest_1.vi.fn().mockReturnValue(false),
            getSelection: vitest_1.vi.fn().mockReturnValue(''),
            clearSelection: vitest_1.vi.fn(),
            selectAll: vitest_1.vi.fn(),
        };
        mockManager = {
            getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('terminal-1'),
            getTerminalInstance: vitest_1.vi.fn().mockReturnValue({
                terminal: mockTerminal,
                id: 'terminal-1',
                searchAddon: { findNext: vitest_1.vi.fn(), findPrevious: vitest_1.vi.fn() },
            }),
            postMessageToExtension: vitest_1.vi.fn(),
        };
        mockDeps = {
            logger: vitest_1.vi.fn(),
            terminalOperationsService: {
                clearTerminal: vitest_1.vi.fn(),
                deleteWordLeft: vitest_1.vi.fn(),
                deleteWordRight: vitest_1.vi.fn(),
                moveToLineStart: vitest_1.vi.fn(),
                moveToLineEnd: vitest_1.vi.fn(),
                sizeToContent: vitest_1.vi.fn(),
            },
        };
        handler = new TerminalClipboardHandler_1.TerminalClipboardHandler(mockDeps);
    });
    (0, vitest_1.describe)('handleTerminalCopy', () => {
        (0, vitest_1.it)('should do nothing when no active terminal', () => {
            mockManager.getActiveTerminalId.mockReturnValue(null);
            handler.handleTerminalCopy(mockManager);
            (0, vitest_1.expect)(mockManager.postMessageToExtension).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should do nothing when no terminal instance', () => {
            mockManager.getTerminalInstance.mockReturnValue(null);
            handler.handleTerminalCopy(mockManager);
            (0, vitest_1.expect)(mockManager.postMessageToExtension).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should do nothing when no selection', () => {
            mockTerminal.hasSelection.mockReturnValue(false);
            handler.handleTerminalCopy(mockManager);
            (0, vitest_1.expect)(mockManager.postMessageToExtension).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should copy selection and send to extension', () => {
            mockTerminal.hasSelection.mockReturnValue(true);
            mockTerminal.getSelection.mockReturnValue('selected text');
            handler.handleTerminalCopy(mockManager);
            (0, vitest_1.expect)(mockManager.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'copyToClipboard',
                terminalId: 'terminal-1',
                text: 'selected text',
            }));
            (0, vitest_1.expect)(mockTerminal.clearSelection).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('handleTerminalPaste', () => {
        (0, vitest_1.it)('should do nothing when no active terminal', () => {
            mockManager.getActiveTerminalId.mockReturnValue(null);
            handler.handleTerminalPaste(mockManager);
            (0, vitest_1.expect)(mockManager.postMessageToExtension).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should request clipboard content from extension', () => {
            handler.handleTerminalPaste(mockManager);
            (0, vitest_1.expect)(mockManager.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'requestClipboardContent',
                terminalId: 'terminal-1',
            }));
        });
    });
    (0, vitest_1.describe)('handleTerminalSelectAll', () => {
        (0, vitest_1.it)('should do nothing when no active terminal', () => {
            mockManager.getActiveTerminalId.mockReturnValue(null);
            handler.handleTerminalSelectAll(mockManager);
            (0, vitest_1.expect)(mockTerminal.selectAll).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should select all text in terminal', () => {
            handler.handleTerminalSelectAll(mockManager);
            (0, vitest_1.expect)(mockTerminal.selectAll).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('handleTerminalFind', () => {
        (0, vitest_1.it)('should do nothing when no active terminal', () => {
            mockManager.getActiveTerminalId.mockReturnValue(null);
            handler.handleTerminalFind(mockManager);
            // No error thrown
        });
        (0, vitest_1.it)('should do nothing when no search addon', () => {
            mockManager.getTerminalInstance.mockReturnValue({
                terminal: mockTerminal,
                searchAddon: null,
            });
            handler.handleTerminalFind(mockManager);
            // No error thrown
        });
    });
    (0, vitest_1.describe)('handleTerminalFindNext', () => {
        (0, vitest_1.it)('should call findNext on search addon', () => {
            const mockSearchAddon = { findNext: vitest_1.vi.fn(), findPrevious: vitest_1.vi.fn() };
            mockManager.getTerminalInstance.mockReturnValue({
                terminal: mockTerminal,
                searchAddon: mockSearchAddon,
            });
            handler.handleTerminalFindNext(mockManager);
            (0, vitest_1.expect)(mockSearchAddon.findNext).toHaveBeenCalledWith('', { incremental: false });
        });
        (0, vitest_1.it)('should do nothing when no active terminal', () => {
            mockManager.getActiveTerminalId.mockReturnValue(null);
            handler.handleTerminalFindNext(mockManager);
            // No error
        });
    });
    (0, vitest_1.describe)('handleTerminalFindPrevious', () => {
        (0, vitest_1.it)('should call findPrevious on search addon', () => {
            const mockSearchAddon = { findNext: vitest_1.vi.fn(), findPrevious: vitest_1.vi.fn() };
            mockManager.getTerminalInstance.mockReturnValue({
                terminal: mockTerminal,
                searchAddon: mockSearchAddon,
            });
            handler.handleTerminalFindPrevious(mockManager);
            (0, vitest_1.expect)(mockSearchAddon.findPrevious).toHaveBeenCalledWith('', { incremental: false });
        });
    });
    (0, vitest_1.describe)('handleTerminalHideFind', () => {
        (0, vitest_1.it)('should log and not throw', () => {
            handler.handleTerminalHideFind(mockManager);
            (0, vitest_1.expect)(mockDeps.logger).toHaveBeenCalledWith('Hide terminal find requested');
        });
    });
    (0, vitest_1.describe)('handleTerminalClear', () => {
        (0, vitest_1.it)('should delegate to terminal operations service', () => {
            handler.handleTerminalClear(mockManager);
            (0, vitest_1.expect)(mockDeps.terminalOperationsService.clearTerminal).toHaveBeenCalledWith(mockManager);
        });
    });
    (0, vitest_1.describe)('Word deletion operations', () => {
        (0, vitest_1.it)('should delegate deleteWordLeft', () => {
            handler.handleTerminalDeleteWordLeft(mockManager);
            (0, vitest_1.expect)(mockDeps.terminalOperationsService.deleteWordLeft).toHaveBeenCalledWith(mockManager);
        });
        (0, vitest_1.it)('should delegate deleteWordRight', () => {
            handler.handleTerminalDeleteWordRight(mockManager);
            (0, vitest_1.expect)(mockDeps.terminalOperationsService.deleteWordRight).toHaveBeenCalledWith(mockManager);
        });
    });
    (0, vitest_1.describe)('Line movement operations', () => {
        (0, vitest_1.it)('should delegate moveToLineStart', () => {
            handler.handleTerminalMoveToLineStart(mockManager);
            (0, vitest_1.expect)(mockDeps.terminalOperationsService.moveToLineStart).toHaveBeenCalledWith(mockManager);
        });
        (0, vitest_1.it)('should delegate moveToLineEnd', () => {
            handler.handleTerminalMoveToLineEnd(mockManager);
            (0, vitest_1.expect)(mockDeps.terminalOperationsService.moveToLineEnd).toHaveBeenCalledWith(mockManager);
        });
    });
    (0, vitest_1.describe)('Size to content', () => {
        (0, vitest_1.it)('should delegate sizeToContent', () => {
            handler.handleTerminalSizeToContent(mockManager);
            (0, vitest_1.expect)(mockDeps.terminalOperationsService.sizeToContent).toHaveBeenCalledWith(mockManager);
        });
    });
});
//# sourceMappingURL=TerminalClipboardHandler.test.js.map