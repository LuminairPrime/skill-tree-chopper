"use strict";
/**
 * SimpleWebViewBridge Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const SimpleWebViewBridge_1 = require("../../../../../providers/services/SimpleWebViewBridge");
// Mock logger
vi.mock('../../../../../utils/logger', () => ({
    provider: vi.fn(),
}));
(0, vitest_1.describe)('SimpleWebViewBridge', () => {
    let bridge;
    let mockWebview;
    let mockCallbacks;
    let mockView;
    beforeEach(() => {
        bridge = new SimpleWebViewBridge_1.SimpleWebViewBridge();
        mockWebview = {
            onDidReceiveMessage: vi.fn().mockReturnValue({ dispose: vi.fn() }),
            postMessage: vi.fn().mockResolvedValue(true),
        };
        mockView = {
            webview: mockWebview,
        };
        mockCallbacks = {
            onWebViewReady: vi.fn(),
            onTerminalReady: vi.fn(),
            onTerminalCreationFailed: vi.fn(),
            onInput: vi.fn(),
            onResize: vi.fn(),
            onDeleteRequest: vi.fn(),
            onTerminalFocused: vi.fn(),
            onTerminalBlurred: vi.fn(),
            onTitleChange: vi.fn(),
        };
    });
    (0, vitest_1.describe)('View Management', () => {
        (0, vitest_1.it)('should set view and register message listener', () => {
            bridge.setView(mockView, mockCallbacks);
            (0, vitest_1.expect)(mockWebview.onDidReceiveMessage).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should reset state on clearView', () => {
            bridge.setView(mockView, mockCallbacks);
            bridge.clearView();
            (0, vitest_1.expect)(bridge.isReady()).toBe(false);
        });
    });
    (0, vitest_1.describe)('Message Handling (Receive)', () => {
        beforeEach(() => {
            bridge.setView(mockView, mockCallbacks);
        });
        (0, vitest_1.it)('should handle webviewReady and notify extension', () => {
            const handler = mockWebview.onDidReceiveMessage.mock.calls[0][0];
            handler({ command: 'webviewReady' });
            (0, vitest_1.expect)(bridge.isReady()).toBe(true);
            (0, vitest_1.expect)(mockCallbacks.onWebViewReady).toHaveBeenCalled();
            (0, vitest_1.expect)(mockWebview.postMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'extensionReady',
            }));
        });
        (0, vitest_1.it)('should dispatch terminalReady to callbacks', () => {
            const handler = mockWebview.onDidReceiveMessage.mock.calls[0][0];
            handler({ command: 'terminalReady', terminalId: 't1', cols: 80, rows: 24 });
            (0, vitest_1.expect)(mockCallbacks.onTerminalReady).toHaveBeenCalledWith({
                terminalId: 't1',
                cols: 80,
                rows: 24,
            });
        });
        (0, vitest_1.it)('should dispatch input to callbacks', () => {
            const handler = mockWebview.onDidReceiveMessage.mock.calls[0][0];
            handler({ command: 'input', terminalId: 't1', data: 'abc' });
            (0, vitest_1.expect)(mockCallbacks.onInput).toHaveBeenCalledWith('t1', 'abc');
        });
        (0, vitest_1.it)('should dispatch terminalFocused to callbacks', () => {
            const handler = mockWebview.onDidReceiveMessage.mock.calls[0][0];
            handler({ command: 'terminalFocused', terminalId: 't1' });
            (0, vitest_1.expect)(mockCallbacks.onTerminalFocused).toHaveBeenCalledWith('t1');
        });
        (0, vitest_1.it)('should dispatch terminalBlurred to callbacks', () => {
            const handler = mockWebview.onDidReceiveMessage.mock.calls[0][0];
            handler({ command: 'terminalBlurred', terminalId: 't1' });
            (0, vitest_1.expect)(mockCallbacks.onTerminalBlurred).toHaveBeenCalledWith('t1');
        });
        (0, vitest_1.it)('should handle unknown commands gracefully', () => {
            const handler = mockWebview.onDidReceiveMessage.mock.calls[0][0];
            // Should not throw
            handler({ command: 'unknown' });
        });
    });
    (0, vitest_1.describe)('Message Sending', () => {
        (0, vitest_1.it)('should queue messages if not ready', () => {
            bridge.setView(mockView, mockCallbacks);
            bridge.sendOutput('t1', 'hello');
            (0, vitest_1.expect)(mockWebview.postMessage).not.toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'output',
            }));
        });
        (0, vitest_1.it)('should flush queued messages when webviewReady is received', () => {
            bridge.setView(mockView, mockCallbacks);
            bridge.sendOutput('t1', 'hello');
            const handler = mockWebview.onDidReceiveMessage.mock.calls[0][0];
            handler({ command: 'webviewReady' });
            (0, vitest_1.expect)(mockWebview.postMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'output',
                data: 'hello',
            }));
        });
        (0, vitest_1.it)('should send immediately if ready', () => {
            bridge.setView(mockView, mockCallbacks);
            const handler = mockWebview.onDidReceiveMessage.mock.calls[0][0];
            handler({ command: 'webviewReady' });
            bridge.sendOutput('t1', 'now');
            (0, vitest_1.expect)(mockWebview.postMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'output',
                data: 'now',
            }));
        });
    });
    (0, vitest_1.describe)('Various Commands', () => {
        beforeEach(() => {
            bridge.setView(mockView, mockCallbacks);
            const handler = mockWebview.onDidReceiveMessage.mock.calls[0][0];
            handler({ command: 'webviewReady' });
        });
        (0, vitest_1.it)('should send createTerminal', () => {
            bridge.createTerminal('t1', 'Term 1', 1, { fontSize: 14 });
            (0, vitest_1.expect)(mockWebview.postMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'createTerminal',
                terminalId: 't1',
            }));
        });
        (0, vitest_1.it)('should send removeTerminal', () => {
            bridge.removeTerminal('t1');
            (0, vitest_1.expect)(mockWebview.postMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'removeTerminal',
            }));
        });
        (0, vitest_1.it)('should send focusTerminal', () => {
            bridge.focusTerminal('t1');
            (0, vitest_1.expect)(mockWebview.postMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'focusTerminal',
            }));
        });
        (0, vitest_1.it)('should send updateTheme', () => {
            bridge.updateTheme({ '--bg': '#000' });
            (0, vitest_1.expect)(mockWebview.postMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'updateTheme',
            }));
        });
    });
});
//# sourceMappingURL=SimpleWebViewBridge.test.js.map