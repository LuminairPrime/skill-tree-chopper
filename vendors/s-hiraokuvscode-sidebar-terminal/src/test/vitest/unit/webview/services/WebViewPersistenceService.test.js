"use strict";
/**
 * WebViewPersistenceService Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const WebViewPersistenceService_1 = require("../../../../../webview/services/WebViewPersistenceService");
const xterm_1 = require("@xterm/xterm");
// Mock dependencies
vitest_1.vi.mock('@xterm/xterm', () => {
    class MockTerminal {
        constructor() {
            this.loadAddon = vitest_1.vi.fn();
            this.onData = vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() });
            this.onLineFeed = vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() });
            this.hasSelection = vitest_1.vi.fn().mockReturnValue(false);
            this.textarea = {};
            this.cols = 80;
            this.rows = 24;
            this.buffer = { active: { cursorX: 0, cursorY: 0, viewportY: 0 } };
            this.write = vitest_1.vi.fn((data, cb) => cb?.());
            this.scrollToBottom = vitest_1.vi.fn();
        }
    }
    return { Terminal: MockTerminal };
});
vitest_1.vi.mock('@xterm/addon-serialize', () => {
    class MockSerializeAddon {
        constructor() {
            this.serialize = vitest_1.vi.fn().mockReturnValue('mocked-serialized-content');
        }
    }
    return { SerializeAddon: MockSerializeAddon };
});
// Mock logger
vitest_1.vi.mock('../../../../../webview/utils/logger', () => ({
    webview: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('WebViewPersistenceService', () => {
    let service;
    let mockTerminal;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.useFakeTimers();
        // Setup window.vscodeApi
        window.vscodeApi = {
            postMessage: vitest_1.vi.fn(),
            getState: vitest_1.vi.fn(),
            setState: vitest_1.vi.fn(),
        };
        service = new WebViewPersistenceService_1.WebViewPersistenceService();
        mockTerminal = new xterm_1.Terminal();
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.useRealTimers();
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('addTerminal', () => {
        (0, vitest_1.it)('should register terminal and setup auto-save', () => {
            service.addTerminal('t1', mockTerminal);
            (0, vitest_1.expect)(service.hasTerminal('t1')).toBe(true);
            (0, vitest_1.expect)(mockTerminal.loadAddon).toHaveBeenCalled();
            (0, vitest_1.expect)(mockTerminal.onData).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('serializeTerminal', () => {
        (0, vitest_1.it)('should return serialized data with metadata', () => {
            service.addTerminal('t1', mockTerminal);
            const data = service.serializeTerminal('t1');
            (0, vitest_1.expect)(data).toBeTruthy();
            (0, vitest_1.expect)(data?.content).toBe('mocked-serialized-content');
            (0, vitest_1.expect)(data?.metadata.dimensions.cols).toBe(80);
        });
    });
    (0, vitest_1.describe)('restoreTerminalContent', () => {
        (0, vitest_1.it)('should write content back to terminal', () => {
            service.addTerminal('t1', mockTerminal);
            const success = service.restoreTerminalContent('t1', 'line1\nline2');
            (0, vitest_1.expect)(success).toBe(true);
            (0, vitest_1.expect)(mockTerminal.write).toHaveBeenCalledWith(vitest_1.expect.stringContaining('line1'), vitest_1.expect.any(Function));
        });
    });
    (0, vitest_1.describe)('saveSession', () => {
        (0, vitest_1.it)('should push message to extension', async () => {
            service.addTerminal('t1', mockTerminal);
            await service.saveSession();
            (0, vitest_1.expect)(window.vscodeApi.postMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'pushScrollbackData',
                terminalId: 't1',
            }));
        });
    });
    (0, vitest_1.describe)('Auto-Save', () => {
        (0, vitest_1.it)('should trigger save after data event and debounce delay', () => {
            service.addTerminal('t1', mockTerminal);
            const onDataHandler = mockTerminal.onData.mock.calls[0][0];
            onDataHandler('input');
            // Debounce delay is 3000ms
            vitest_1.vi.advanceTimersByTime(3000);
            (0, vitest_1.expect)(window.vscodeApi.postMessage).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Cleanup', () => {
        (0, vitest_1.it)('should stop timers and clear references', () => {
            service.addTerminal('t1', mockTerminal);
            service.dispose();
            (0, vitest_1.expect)(service.getAvailableTerminals().length).toBe(0);
        });
    });
});
//# sourceMappingURL=WebViewPersistenceService.test.js.map