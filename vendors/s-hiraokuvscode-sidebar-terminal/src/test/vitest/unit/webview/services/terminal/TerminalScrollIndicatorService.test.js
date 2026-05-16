"use strict";
/**
 * TerminalScrollIndicatorService Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TerminalScrollIndicatorService_1 = require("../../../../../../webview/services/terminal/TerminalScrollIndicatorService");
// Mock logger
vi.mock('../../../../../../webview/utils/ManagerLogger', () => ({
    terminalLogger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));
(0, vitest_1.describe)('TerminalScrollIndicatorService', () => {
    let service;
    let mockTerminal;
    let mockContainer;
    let mockViewport;
    beforeEach(() => {
        service = new TerminalScrollIndicatorService_1.TerminalScrollIndicatorService();
        TerminalScrollIndicatorService_1.TerminalScrollIndicatorService.stylesInjected = false;
        document.head.innerHTML = '';
        mockTerminal = {
            onScroll: vi.fn().mockReturnValue({ dispose: vi.fn() }),
            scrollToBottom: vi.fn(),
        };
        mockContainer = document.createElement('div');
        mockViewport = document.createElement('div');
        mockViewport.className = 'xterm-viewport';
        mockContainer.appendChild(mockViewport);
    });
    (0, vitest_1.describe)('attach', () => {
        (0, vitest_1.it)('should create indicator element and append to container', () => {
            service.attach(mockTerminal, mockContainer, 't1');
            const indicator = mockContainer.querySelector('.terminal-scroll-indicator');
            (0, vitest_1.expect)(indicator).toBeTruthy();
            (0, vitest_1.expect)(indicator?.textContent).toContain('Scroll');
        });
        (0, vitest_1.it)('should toggle visible class based on scroll position', () => {
            service.attach(mockTerminal, mockContainer, 't1');
            const indicator = mockContainer.querySelector('.terminal-scroll-indicator');
            // Mock "at bottom" (scrollTop + clientHeight >= scrollHeight - 2)
            Object.defineProperty(mockViewport, 'scrollTop', { value: 100, configurable: true });
            Object.defineProperty(mockViewport, 'clientHeight', { value: 100, configurable: true });
            Object.defineProperty(mockViewport, 'scrollHeight', { value: 200, configurable: true });
            // Trigger scroll
            mockViewport.dispatchEvent(new Event('scroll'));
            (0, vitest_1.expect)(indicator.classList.contains('visible')).toBe(false);
            // Mock "not at bottom"
            Object.defineProperty(mockViewport, 'scrollTop', { value: 50, configurable: true });
            mockViewport.dispatchEvent(new Event('scroll'));
            (0, vitest_1.expect)(indicator.classList.contains('visible')).toBe(true);
        });
        (0, vitest_1.it)('should scroll to bottom when clicked', () => {
            service.attach(mockTerminal, mockContainer, 't1');
            const indicator = mockContainer.querySelector('.terminal-scroll-indicator');
            indicator.click();
            (0, vitest_1.expect)(mockTerminal.scrollToBottom).toHaveBeenCalled();
            (0, vitest_1.expect)(mockViewport.scrollTop).toBe(mockViewport.scrollHeight);
        });
        (0, vitest_1.it)('should cleanup on dispose', () => {
            const cleanup = service.attach(mockTerminal, mockContainer, 't1');
            cleanup();
            (0, vitest_1.expect)(mockContainer.querySelector('.terminal-scroll-indicator')).toBeFalsy();
        });
    });
});
//# sourceMappingURL=TerminalScrollIndicatorService.test.js.map