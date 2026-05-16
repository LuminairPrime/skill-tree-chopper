"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const HeaderService_1 = require("../../../../../../webview/managers/ui/HeaderService");
const HeaderFactory_1 = require("../../../../../../webview/factories/HeaderFactory");
// Mock dependencies
vitest_1.vi.mock('../../../../../../webview/factories/HeaderFactory');
vitest_1.vi.mock('../../../../../../webview/utils/ManagerLogger');
vitest_1.vi.mock('../../../../../../utils/logger');
(0, vitest_1.describe)('HeaderService', () => {
    let service;
    let mockHeaderElements;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
        service = new HeaderService_1.HeaderService();
        // Create mock DOM elements
        const container = document.createElement('div');
        container.classList.add('terminal-header');
        mockHeaderElements = {
            container,
            nameSpan: document.createElement('span'),
            titleSection: document.createElement('div'),
            closeButton: document.createElement('button'),
            aiAgentToggleButton: document.createElement('button'),
            splitButton: document.createElement('button'),
        };
        // Mock HeaderFactory
        vitest_1.vi.mocked(HeaderFactory_1.HeaderFactory.createTerminalHeader).mockReturnValue(mockHeaderElements);
    });
    (0, vitest_1.describe)('createTerminalHeader', () => {
        (0, vitest_1.it)('should create and cache header elements', () => {
            const terminalId = 't1';
            const name = 'Terminal 1';
            const result = service.createTerminalHeader(terminalId, name);
            (0, vitest_1.expect)(HeaderFactory_1.HeaderFactory.createTerminalHeader).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                terminalId,
                terminalName: name,
            }));
            (0, vitest_1.expect)(result).toBe(mockHeaderElements.container);
            (0, vitest_1.expect)(service.hasHeaderElements(terminalId)).toBe(true);
        });
        (0, vitest_1.it)('should set element styles for visibility', () => {
            const result = service.createTerminalHeader('t1', 'Term');
            (0, vitest_1.expect)(result.style.display).toBe('flex');
            (0, vitest_1.expect)(result.style.visibility).toBe('visible');
        });
        (0, vitest_1.it)('should calculate theme colors correctly', () => {
            service.createTerminalHeader('t1', 'Term', { currentTheme: '#ffffff' });
            (0, vitest_1.expect)(HeaderFactory_1.HeaderFactory.createTerminalHeader).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                backgroundColor: '#ffffff',
                foregroundColor: '#000000', // Light theme foreground
            }));
        });
    });
    (0, vitest_1.describe)('updateTerminalHeader', () => {
        (0, vitest_1.it)('should update name using factory if cached', () => {
            const terminalId = 't1';
            service.createTerminalHeader(terminalId, 'Old Name');
            service.updateTerminalHeader(terminalId, 'New Name');
            (0, vitest_1.expect)(HeaderFactory_1.HeaderFactory.updateTerminalName).toHaveBeenCalledWith(mockHeaderElements, 'New Name');
        });
        (0, vitest_1.it)('should update indicator color using factory if cached', () => {
            const terminalId = 't1';
            service.createTerminalHeader(terminalId, 'Old Name');
            service.updateTerminalHeader(terminalId, undefined, '#FF69B4');
            (0, vitest_1.expect)(HeaderFactory_1.HeaderFactory.setIndicatorColor).toHaveBeenCalledWith(mockHeaderElements, '#FF69B4');
        });
        (0, vitest_1.it)('should try fallback DOM update if not cached', () => {
            const terminalId = 't2';
            // Create element in DOM manually
            const container = document.createElement('div');
            container.setAttribute('data-terminal-id', terminalId);
            const nameSpan = document.createElement('span');
            nameSpan.className = 'terminal-name';
            container.appendChild(nameSpan);
            document.body.appendChild(container);
            service.updateTerminalHeader(terminalId, 'Fallback Name');
            (0, vitest_1.expect)(nameSpan.textContent).toBe('Fallback Name');
            // Cleanup
            document.body.removeChild(container);
        });
    });
    (0, vitest_1.describe)('removeTerminalHeader', () => {
        (0, vitest_1.it)('should remove from cache', () => {
            const terminalId = 't1';
            service.createTerminalHeader(terminalId, 'Name');
            (0, vitest_1.expect)(service.hasHeaderElements(terminalId)).toBe(true);
            service.removeTerminalHeader(terminalId);
            (0, vitest_1.expect)(service.hasHeaderElements(terminalId)).toBe(false);
        });
    });
    (0, vitest_1.describe)('updateHeaderThemeColors', () => {
        (0, vitest_1.it)('should update styles of cached elements', () => {
            const terminalId = 't1';
            service.createTerminalHeader(terminalId, 'Name');
            service.updateHeaderThemeColors(terminalId, '#000000', '#ffffff');
            (0, vitest_1.expect)(mockHeaderElements.container.style.backgroundColor).toBe('#000000');
            (0, vitest_1.expect)(mockHeaderElements.container.style.color).toBe('#ffffff');
            (0, vitest_1.expect)(mockHeaderElements.nameSpan.style.color).toBe('#ffffff');
        });
        (0, vitest_1.it)('should ignore if not cached', () => {
            service.updateHeaderThemeColors('non-existent', '#000', '#fff');
            // Should not throw
        });
    });
    (0, vitest_1.describe)('cache management', () => {
        (0, vitest_1.it)('should clear all cache', () => {
            service.createTerminalHeader('t1', '1');
            service.createTerminalHeader('t2', '2');
            (0, vitest_1.expect)(service.getCacheSize()).toBe(2);
            service.clearHeaderCache();
            (0, vitest_1.expect)(service.getCacheSize()).toBe(0);
        });
        (0, vitest_1.it)('should find headers in DOM', () => {
            // Clear previous DOM state
            document.body.innerHTML = '';
            const header1 = document.createElement('div');
            header1.className = 'terminal-header';
            document.body.appendChild(header1);
            const headers = service.findTerminalHeaders();
            (0, vitest_1.expect)(headers.length).toBe(1);
        });
    });
});
//# sourceMappingURL=HeaderService.test.js.map