"use strict";
/**
 * TerminalScrollbarService Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TerminalScrollbarService_1 = require("../../../../../../webview/services/terminal/TerminalScrollbarService");
const ManagerLogger_1 = require("../../../../../../webview/utils/ManagerLogger");
// Mock logger
vi.mock('../../../../../../webview/utils/ManagerLogger', () => ({
    terminalLogger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));
(0, vitest_1.describe)('TerminalScrollbarService', () => {
    let service;
    beforeEach(() => {
        service = new TerminalScrollbarService_1.TerminalScrollbarService();
        // Reset singleton state
        TerminalScrollbarService_1.TerminalScrollbarService.stylesInjected = false;
        document.head.innerHTML = '';
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });
    (0, vitest_1.describe)('enableScrollbarDisplay', () => {
        (0, vitest_1.it)('should apply styles to viewport and screen', () => {
            const container = document.createElement('div');
            const viewport = document.createElement('div');
            viewport.className = 'xterm-viewport';
            const screen = document.createElement('div');
            screen.className = 'xterm-screen';
            container.appendChild(viewport);
            container.appendChild(screen);
            service.enableScrollbarDisplay(container, 't1');
            (0, vitest_1.expect)(viewport.style.position).toBe('absolute');
            (0, vitest_1.expect)(viewport.style.overflow).toBe('auto');
            (0, vitest_1.expect)(screen.style.position).toBe('relative');
            (0, vitest_1.expect)(screen.style.width).toBe('100%');
        });
        (0, vitest_1.it)('should inject styles into head only once', () => {
            const container = document.createElement('div');
            const viewport = document.createElement('div');
            viewport.className = 'xterm-viewport';
            container.appendChild(viewport);
            service.enableScrollbarDisplay(container, 't1');
            service.enableScrollbarDisplay(container, 't2');
            const styleElements = document.head.querySelectorAll('style#terminal-scrollbar-styles');
            (0, vitest_1.expect)(styleElements.length).toBe(1);
        });
        (0, vitest_1.it)('should warn if viewport is missing', () => {
            const container = document.createElement('div');
            service.enableScrollbarDisplay(container, 't1');
            (0, vitest_1.expect)(ManagerLogger_1.terminalLogger.warn).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Viewport not found'));
        });
    });
});
//# sourceMappingURL=TerminalScrollbarService.test.js.map