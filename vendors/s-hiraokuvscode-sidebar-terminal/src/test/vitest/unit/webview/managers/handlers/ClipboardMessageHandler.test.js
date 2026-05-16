"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ClipboardMessageHandler_1 = require("../../../../../../webview/managers/handlers/ClipboardMessageHandler");
(0, vitest_1.describe)('ClipboardMessageHandler', () => {
    let handler;
    let mockCoordinator;
    let mockLogger;
    let mockTerminal;
    let mockTerminalInstance;
    (0, vitest_1.beforeEach)(() => {
        mockLogger = {
            info: vitest_1.vi.fn(),
            warn: vitest_1.vi.fn(),
            debug: vitest_1.vi.fn(),
        };
        mockTerminal = {
            paste: vitest_1.vi.fn(),
        };
        mockTerminalInstance = {
            terminal: mockTerminal,
        };
        mockCoordinator = {
            getTerminalInstance: vitest_1.vi.fn(),
            getActiveTerminalId: vitest_1.vi.fn(),
        };
        // Spy on console.log to suppress noise or verify debugging output
        vitest_1.vi.spyOn(console, 'log').mockImplementation(() => { });
        handler = new ClipboardMessageHandler_1.ClipboardMessageHandler(mockLogger);
    });
    (0, vitest_1.describe)('handleMessage', () => {
        (0, vitest_1.it)('should handle clipboardContent command', () => {
            const msg = {
                command: 'clipboardContent',
                terminalId: 'term-1',
                text: 'paste me',
            };
            mockCoordinator.getTerminalInstance.mockReturnValue(mockTerminalInstance);
            handler.handleMessage(msg, mockCoordinator);
            (0, vitest_1.expect)(mockCoordinator.getTerminalInstance).toHaveBeenCalledWith('term-1');
            (0, vitest_1.expect)(mockTerminal.paste).toHaveBeenCalledWith('paste me');
            (0, vitest_1.expect)(mockLogger.info).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Pasting'));
        });
        (0, vitest_1.it)('should warn on unknown command', () => {
            const msg = { command: 'unknown' };
            handler.handleMessage(msg, mockCoordinator);
            (0, vitest_1.expect)(mockLogger.warn).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Unknown clipboard command'));
        });
    });
    (0, vitest_1.describe)('handleClipboardContent', () => {
        (0, vitest_1.it)('should ignore message with missing terminalId', () => {
            const msg = {
                command: 'clipboardContent',
                text: 'paste me',
            };
            handler.handleMessage(msg, mockCoordinator);
            (0, vitest_1.expect)(mockCoordinator.getTerminalInstance).not.toHaveBeenCalled();
            (0, vitest_1.expect)(mockTerminal.paste).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should ignore message with missing text', () => {
            const msg = {
                command: 'clipboardContent',
                terminalId: 'term-1',
            };
            handler.handleMessage(msg, mockCoordinator);
            (0, vitest_1.expect)(mockCoordinator.getTerminalInstance).not.toHaveBeenCalled();
            (0, vitest_1.expect)(mockTerminal.paste).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should warn if terminal instance not found', () => {
            const msg = {
                command: 'clipboardContent',
                terminalId: 'term-1',
                text: 'paste me',
            };
            mockCoordinator.getTerminalInstance.mockReturnValue(undefined);
            mockCoordinator.getActiveTerminalId.mockReturnValue('term-2');
            handler.handleMessage(msg, mockCoordinator);
            (0, vitest_1.expect)(mockLogger.warn).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Terminal term-1 not found'));
            (0, vitest_1.expect)(mockTerminal.paste).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=ClipboardMessageHandler.test.js.map