"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TerminalOperationsService_1 = require("../../../../../../../webview/managers/input/services/TerminalOperationsService");
(0, vitest_1.describe)('TerminalOperationsService', () => {
    let service;
    let mockLogger;
    let mockEmit;
    let mockManager;
    let mockTerminal;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
        mockLogger = vitest_1.vi.fn();
        mockEmit = vitest_1.vi.fn();
        service = new TerminalOperationsService_1.TerminalOperationsService(mockLogger, mockEmit);
        mockTerminal = {
            scrollLines: vitest_1.vi.fn(),
            scrollToTop: vitest_1.vi.fn(),
            scrollToBottom: vitest_1.vi.fn(),
            clear: vitest_1.vi.fn(),
            getSelection: vitest_1.vi.fn().mockReturnValue('selected text'),
            selectAll: vitest_1.vi.fn(),
            rows: 24,
        };
        mockManager = {
            getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('term-1'),
            getTerminalInstance: vitest_1.vi.fn().mockReturnValue({
                terminal: mockTerminal,
            }),
        };
    });
    (0, vitest_1.describe)('scrollTerminal', () => {
        (0, vitest_1.it)('should scroll up', () => {
            service.scrollTerminal('up', mockManager);
            (0, vitest_1.expect)(mockTerminal.scrollLines).toHaveBeenCalledWith(-1);
        });
        (0, vitest_1.it)('should scroll down', () => {
            service.scrollTerminal('down', mockManager);
            (0, vitest_1.expect)(mockTerminal.scrollLines).toHaveBeenCalledWith(1);
        });
        (0, vitest_1.it)('should scroll to top', () => {
            service.scrollTerminal('top', mockManager);
            (0, vitest_1.expect)(mockTerminal.scrollToTop).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should scroll to bottom', () => {
            service.scrollTerminal('bottom', mockManager);
            (0, vitest_1.expect)(mockTerminal.scrollToBottom).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle missing active terminal', () => {
            mockManager.getActiveTerminalId.mockReturnValue(null);
            service.scrollTerminal('up', mockManager);
            (0, vitest_1.expect)(mockLogger).toHaveBeenCalledWith(vitest_1.expect.stringContaining('No active terminal'));
        });
    });
    (0, vitest_1.describe)('clearTerminal', () => {
        (0, vitest_1.it)('should call terminal.clear', () => {
            service.clearTerminal(mockManager);
            (0, vitest_1.expect)(mockTerminal.clear).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('copySelection', () => {
        (0, vitest_1.it)('should emit copy-selection event if text is selected', () => {
            service.copySelection(mockManager);
            (0, vitest_1.expect)(mockEmit).toHaveBeenCalledWith('copy-selection', 'term-1', { text: 'selected text' }, mockManager);
        });
        (0, vitest_1.it)('should log if no selection', () => {
            mockTerminal.getSelection.mockReturnValue('');
            service.copySelection(mockManager);
            (0, vitest_1.expect)(mockLogger).toHaveBeenCalledWith('No selection to copy');
        });
    });
    (0, vitest_1.describe)('paste', () => {
        (0, vitest_1.it)('should emit paste-request event', () => {
            service.paste(mockManager);
            (0, vitest_1.expect)(mockEmit).toHaveBeenCalledWith('paste-request', 'term-1', {}, mockManager);
        });
    });
    (0, vitest_1.describe)('selectAll', () => {
        (0, vitest_1.it)('should call terminal.selectAll', () => {
            service.selectAll(mockManager);
            (0, vitest_1.expect)(mockTerminal.selectAll).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Find operations', () => {
        (0, vitest_1.it)('focusFind should emit event', () => {
            service.focusFind(mockManager);
            (0, vitest_1.expect)(mockEmit).toHaveBeenCalledWith('focus-find', 'term-1', {}, mockManager);
        });
        (0, vitest_1.it)('findNext should emit event', () => {
            service.findNext(mockManager);
            (0, vitest_1.expect)(mockEmit).toHaveBeenCalledWith('find-next', 'term-1', {}, mockManager);
        });
        (0, vitest_1.it)('findPrevious should emit event', () => {
            service.findPrevious(mockManager);
            (0, vitest_1.expect)(mockEmit).toHaveBeenCalledWith('find-previous', 'term-1', {}, mockManager);
        });
        (0, vitest_1.it)('hideFind should emit event', () => {
            service.hideFind(mockManager);
            (0, vitest_1.expect)(mockEmit).toHaveBeenCalledWith('hide-find', 'term-1', {}, mockManager);
        });
    });
    (0, vitest_1.describe)('Navigation/Deletion operations', () => {
        (0, vitest_1.it)('deleteWordLeft should emit input event with Ctrl+W', () => {
            service.deleteWordLeft(mockManager);
            (0, vitest_1.expect)(mockEmit).toHaveBeenCalledWith('input', 'term-1', { data: '\x17' }, mockManager);
        });
        (0, vitest_1.it)('moveToLineStart should emit input event with Ctrl+A', () => {
            service.moveToLineStart(mockManager);
            (0, vitest_1.expect)(mockEmit).toHaveBeenCalledWith('input', 'term-1', { data: '\x01' }, mockManager);
        });
    });
});
//# sourceMappingURL=TerminalOperationsService.test.js.map