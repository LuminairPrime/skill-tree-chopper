"use strict";
/**
 * TerminalAutoSaveService Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TerminalAutoSaveService_1 = require("../../../../../../webview/services/terminal/TerminalAutoSaveService");
// Mock dependencies
vi.mock('../../../../../../webview/utils/ManagerLogger', () => ({
    terminalLogger: {
        info: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
    },
}));
(0, vitest_1.describe)('TerminalAutoSaveService', () => {
    let service;
    let mockCoordinator;
    let mockTerminal;
    let mockSerializeAddon;
    beforeEach(() => {
        vi.useFakeTimers();
        mockCoordinator = {
            postMessageToExtension: vi.fn(),
        };
        mockTerminal = {
            onData: vi.fn().mockReturnValue({ dispose: vi.fn() }),
            onLineFeed: vi.fn().mockReturnValue({ dispose: vi.fn() }),
            rows: 24,
        };
        mockSerializeAddon = {
            serialize: vi.fn().mockReturnValue('mock\nscrollback\ndata'),
        };
        service = new TerminalAutoSaveService_1.TerminalAutoSaveService(mockCoordinator);
        // Reset static state
        TerminalAutoSaveService_1.TerminalAutoSaveService.restoringTerminals.clear();
        TerminalAutoSaveService_1.TerminalAutoSaveService.periodicSaveTimers.forEach((t) => clearInterval(t));
        TerminalAutoSaveService_1.TerminalAutoSaveService.periodicSaveTimers.clear();
        TerminalAutoSaveService_1.TerminalAutoSaveService.registeredTerminals.clear();
        TerminalAutoSaveService_1.TerminalAutoSaveService.visibilityHandlerSetup = false;
        // Mock vscodeApi
        window.vscodeApi = {
            postMessage: vi.fn(),
        };
    });
    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });
    (0, vitest_1.describe)('setupScrollbackAutoSave', () => {
        (0, vitest_1.it)('should setup event listeners and periodic timer', () => {
            service.setupScrollbackAutoSave(mockTerminal, 't1', mockSerializeAddon);
            (0, vitest_1.expect)(mockTerminal.onData).toHaveBeenCalled();
            (0, vitest_1.expect)(mockTerminal.onLineFeed).toHaveBeenCalled();
            (0, vitest_1.expect)(TerminalAutoSaveService_1.TerminalAutoSaveService.periodicSaveTimers.has('t1')).toBe(true);
        });
        (0, vitest_1.it)('should trigger save after data event and delay', async () => {
            service.setupScrollbackAutoSave(mockTerminal, 't1', mockSerializeAddon);
            const onDataCallback = mockTerminal.onData.mock.calls[0][0];
            onDataCallback('some input');
            // Delay is 3000ms inside pushScrollbackToExtension, but there might be other timers
            await vi.advanceTimersByTimeAsync(5000);
            (0, vitest_1.expect)(window.vscodeApi.postMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'pushScrollbackData',
                terminalId: 't1',
                scrollbackData: ['mock', 'scrollback', 'data'],
            }));
        });
        (0, vitest_1.it)('should skip save if terminal is restoring', () => {
            TerminalAutoSaveService_1.TerminalAutoSaveService.markTerminalRestoring('t1');
            service.setupScrollbackAutoSave(mockTerminal, 't1', mockSerializeAddon);
            const onDataCallback = mockTerminal.onData.mock.calls[0][0];
            onDataCallback('data');
            vi.advanceTimersByTime(3000);
            (0, vitest_1.expect)(window.vscodeApi.postMessage).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Restoration State', () => {
        (0, vitest_1.it)('should manage restoring state with delay', () => {
            TerminalAutoSaveService_1.TerminalAutoSaveService.markTerminalRestoring('t1');
            (0, vitest_1.expect)(TerminalAutoSaveService_1.TerminalAutoSaveService.isTerminalRestoring('t1')).toBe(true);
            TerminalAutoSaveService_1.TerminalAutoSaveService.markTerminalRestored('t1');
            (0, vitest_1.expect)(TerminalAutoSaveService_1.TerminalAutoSaveService.isTerminalRestoring('t1')).toBe(true); // Still true due to 5s delay
            vi.advanceTimersByTime(5000);
            (0, vitest_1.expect)(TerminalAutoSaveService_1.TerminalAutoSaveService.isTerminalRestoring('t1')).toBe(false);
        });
    });
    (0, vitest_1.describe)('Visibility Changes', () => {
        (0, vitest_1.it)('should save all scrollback when page hidden', () => {
            service.setupScrollbackAutoSave(mockTerminal, 't1', mockSerializeAddon);
            // Mock visibilityState
            Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
            // Trigger event
            document.dispatchEvent(new Event('visibilitychange'));
            (0, vitest_1.expect)(window.vscodeApi.postMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                beforeSleep: true,
            }));
        });
        (0, vitest_1.it)('should request refresh when page visible after long delay', () => {
            service.setupScrollbackAutoSave(mockTerminal, 't1', mockSerializeAddon);
            // Hide
            Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
            TerminalAutoSaveService_1.TerminalAutoSaveService.lastHiddenAt = Date.now();
            document.dispatchEvent(new Event('visibilitychange'));
            // Wait > 60s
            vi.advanceTimersByTime(61000);
            // Show
            Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
            document.dispatchEvent(new Event('visibilitychange'));
            (0, vitest_1.expect)(window.vscodeApi.postMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'requestScrollbackRefresh',
            }));
        });
    });
    (0, vitest_1.describe)('Cleanup', () => {
        (0, vitest_1.it)('should clear periodic timer on terminal removal', () => {
            service.setupScrollbackAutoSave(mockTerminal, 't1', mockSerializeAddon);
            const _timer = TerminalAutoSaveService_1.TerminalAutoSaveService.periodicSaveTimers.get('t1');
            TerminalAutoSaveService_1.TerminalAutoSaveService.clearPeriodicSaveTimer('t1');
            (0, vitest_1.expect)(TerminalAutoSaveService_1.TerminalAutoSaveService.periodicSaveTimers.has('t1')).toBe(false);
        });
        (0, vitest_1.it)('should also remove from registeredTerminals when clearing periodic timer', () => {
            service.setupScrollbackAutoSave(mockTerminal, 't1', mockSerializeAddon);
            // Verify registered
            (0, vitest_1.expect)(TerminalAutoSaveService_1.TerminalAutoSaveService.registeredTerminals.has('t1')).toBe(true);
            TerminalAutoSaveService_1.TerminalAutoSaveService.clearPeriodicSaveTimer('t1');
            // Should be removed from registeredTerminals too
            (0, vitest_1.expect)(TerminalAutoSaveService_1.TerminalAutoSaveService.registeredTerminals.has('t1')).toBe(false);
        });
    });
    (0, vitest_1.describe)('Bug #5: disposeAll clears all static Maps', () => {
        (0, vitest_1.it)('should provide a disposeAll method that clears all static state', () => {
            // Setup multiple terminals
            service.setupScrollbackAutoSave(mockTerminal, 't1', mockSerializeAddon);
            service.setupScrollbackAutoSave(mockTerminal, 't2', mockSerializeAddon);
            TerminalAutoSaveService_1.TerminalAutoSaveService.markTerminalRestoring('t3');
            // Verify state exists
            (0, vitest_1.expect)(TerminalAutoSaveService_1.TerminalAutoSaveService.periodicSaveTimers.size).toBeGreaterThan(0);
            (0, vitest_1.expect)(TerminalAutoSaveService_1.TerminalAutoSaveService.registeredTerminals.size).toBeGreaterThan(0);
            (0, vitest_1.expect)(TerminalAutoSaveService_1.TerminalAutoSaveService.restoringTerminals.size).toBeGreaterThan(0);
            // Call disposeAll
            TerminalAutoSaveService_1.TerminalAutoSaveService.disposeAll();
            // All static Maps should be cleared
            (0, vitest_1.expect)(TerminalAutoSaveService_1.TerminalAutoSaveService.periodicSaveTimers.size).toBe(0);
            (0, vitest_1.expect)(TerminalAutoSaveService_1.TerminalAutoSaveService.registeredTerminals.size).toBe(0);
            (0, vitest_1.expect)(TerminalAutoSaveService_1.TerminalAutoSaveService.restoringTerminals.size).toBe(0);
        });
    });
});
//# sourceMappingURL=TerminalAutoSaveService.test.js.map