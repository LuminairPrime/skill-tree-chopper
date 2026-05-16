"use strict";
/**
 * TerminalFocusService Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TerminalFocusService_1 = require("../../../../../../webview/services/terminal/TerminalFocusService");
const TestSetup_1 = require("../../../../../shared/TestSetup");
// Mock logger
vitest_1.vi.mock('../../../../../../webview/utils/ManagerLogger', () => ({
    terminalLogger: {
        info: vitest_1.vi.fn(),
        warn: vitest_1.vi.fn(),
        error: vitest_1.vi.fn(),
        debug: vitest_1.vi.fn(),
    },
}));
(0, vitest_1.describe)('TerminalFocusService', () => {
    let service;
    let mockTerminal;
    let mockContainer;
    let mockTextarea;
    (0, vitest_1.beforeEach)(() => {
        (0, TestSetup_1.setupCompleteTestEnvironment)();
        vitest_1.vi.useFakeTimers();
        service = new TerminalFocusService_1.TerminalFocusService();
        mockTerminal = {
            focus: vitest_1.vi.fn(),
        };
        mockContainer = document.createElement('div');
        mockTextarea = document.createElement('textarea');
        mockTextarea.className = 'xterm-helper-textarea';
        mockContainer.appendChild(mockTextarea);
        // Stub requestAnimationFrame
        vitest_1.vi.stubGlobal('requestAnimationFrame', (cb) => cb());
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.useRealTimers();
        vitest_1.vi.unstubAllGlobals();
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('ensureTerminalFocus', () => {
        (0, vitest_1.it)('should focus terminal and textarea immediately if available', () => {
            service.ensureTerminalFocus(mockTerminal, 't1', mockContainer);
            (0, vitest_1.expect)(mockTerminal.focus).toHaveBeenCalled();
            // focusTerminalTextarea has a 10ms verification timeout
            vitest_1.vi.advanceTimersByTime(10);
        });
        (0, vitest_1.it)('should retry if textarea is missing', () => {
            const emptyContainer = document.createElement('div');
            service.ensureTerminalFocus(mockTerminal, 't1', emptyContainer);
            (0, vitest_1.expect)(mockTerminal.focus).not.toHaveBeenCalled();
            // Add textarea after call
            emptyContainer.appendChild(mockTextarea);
            // Advance by retry delay (50ms)
            vitest_1.vi.advanceTimersByTime(50);
            (0, vitest_1.expect)(mockTerminal.focus).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('setupContainerFocusHandler', () => {
        (0, vitest_1.it)('should register click listener on container', () => {
            const spy = vitest_1.vi.spyOn(mockContainer, 'addEventListener');
            service.setupContainerFocusHandler(mockTerminal, 't1', mockContainer, mockContainer);
            (0, vitest_1.expect)(spy).toHaveBeenCalledWith('click', vitest_1.expect.any(Function));
            // Trigger click
            mockContainer.click();
            (0, vitest_1.expect)(mockTerminal.focus).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should ignore clicks on buttons', () => {
            service.setupContainerFocusHandler(mockTerminal, 't1', mockContainer, mockContainer);
            const btn = document.createElement('button');
            btn.className = 'terminal-control';
            mockContainer.appendChild(btn);
            btn.click();
            (0, vitest_1.expect)(mockTerminal.focus).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should ignore clicks inside terminal header area', () => {
            service.setupContainerFocusHandler(mockTerminal, 't1', mockContainer, mockContainer);
            const header = document.createElement('div');
            header.className = 'terminal-header';
            const name = document.createElement('span');
            name.className = 'terminal-name';
            header.appendChild(name);
            mockContainer.appendChild(header);
            name.click();
            (0, vitest_1.expect)(mockTerminal.focus).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=TerminalFocusService.test.js.map