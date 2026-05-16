"use strict";
/**
 * CliAgentStatusService Test Suite - CLI Agent status display management
 *
 * TDD Pattern: Covers status updates, debouncing, and header integration
 *
 * Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const CliAgentStatusService_1 = require("../../../../../../webview/managers/ui/CliAgentStatusService");
const HeaderFactory_1 = require("../../../../../../webview/factories/HeaderFactory");
(0, vitest_1.describe)('CliAgentStatusService', () => {
    let cliAgentStatusService;
    let mockHeaderElementsCache;
    let mockHeaderElements1;
    let mockHeaderElements2;
    let insertCliAgentStatusSpy;
    let removeCliAgentStatusSpy;
    let setAiAgentToggleButtonVisibilitySpy;
    let dom;
    (0, vitest_1.beforeEach)(() => {
        // CRITICAL: Create JSDOM in beforeEach to prevent test pollution
        dom = new jsdom_1.JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url: 'http://localhost',
        });
        // Set up global DOM
        global.document = dom.window.document;
        global.window = dom.window;
        global.HTMLElement = dom.window.HTMLElement;
        // Create mock header elements
        const createMockHeaderElements = (terminalName) => {
            const container = document.createElement('div');
            container.className = 'terminal-header';
            const nameSpan = document.createElement('span');
            nameSpan.className = 'terminal-name';
            nameSpan.textContent = terminalName;
            // @ts-expect-error - test mock type
            return {
                container,
                nameSpan,
                idSpan: document.createElement('span'),
                processingIndicator: null,
                titleSection: document.createElement('div'),
                statusSection: document.createElement('div'),
                statusSpan: null,
                indicator: null,
                controlsSection: document.createElement('div'),
                closeButton: document.createElement('button'),
                aiAgentToggleButton: document.createElement('button'),
                splitButton: document.createElement('button'),
            };
        };
        mockHeaderElements1 = createMockHeaderElements('Terminal 1');
        mockHeaderElements2 = createMockHeaderElements('Terminal 2');
        mockHeaderElementsCache = new Map([
            ['terminal-1', mockHeaderElements1],
            ['terminal-2', mockHeaderElements2],
        ]);
        // Spy on HeaderFactory methods
        insertCliAgentStatusSpy = vitest_1.vi
            .spyOn(HeaderFactory_1.HeaderFactory, 'insertCliAgentStatus')
            .mockImplementation(() => { });
        removeCliAgentStatusSpy = vitest_1.vi
            .spyOn(HeaderFactory_1.HeaderFactory, 'removeCliAgentStatus')
            .mockImplementation(() => { });
        setAiAgentToggleButtonVisibilitySpy = vitest_1.vi
            .spyOn(HeaderFactory_1.HeaderFactory, 'setAiAgentToggleButtonVisibility')
            .mockImplementation(() => { });
        cliAgentStatusService = new CliAgentStatusService_1.CliAgentStatusService();
    });
    (0, vitest_1.afterEach)(() => {
        // CRITICAL: Use try-finally to ensure all cleanup happens
        try {
            vitest_1.vi.restoreAllMocks();
        }
        finally {
            try {
                // CRITICAL: Close JSDOM window to prevent memory leaks
                dom.window.close();
            }
            finally {
                // CRITICAL: Clean up global DOM state to prevent test pollution
                delete global.document;
                delete global.window;
                delete global.HTMLElement;
            }
        }
    });
    (0, vitest_1.describe)('Initialization', () => {
        (0, vitest_1.it)('should create instance correctly', () => {
            (0, vitest_1.expect)(cliAgentStatusService).toBeInstanceOf(CliAgentStatusService_1.CliAgentStatusService);
        });
    });
    (0, vitest_1.describe)('Update CLI Agent Status Display', () => {
        (0, vitest_1.it)('should update status for matching terminal name', () => {
            cliAgentStatusService.updateCliAgentStatusDisplay('Terminal 1', 'connected', mockHeaderElementsCache, 'Claude Code');
            (0, vitest_1.expect)(insertCliAgentStatusSpy).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(insertCliAgentStatusSpy).toHaveBeenCalledWith(mockHeaderElements1, 'connected', 'Claude Code');
        });
        (0, vitest_1.it)('should not insert status for non-matching terminal', () => {
            cliAgentStatusService.updateCliAgentStatusDisplay('Terminal 1', 'connected', mockHeaderElementsCache, 'Claude Code');
            // Should not insert for Terminal 2
            const callsForTerminal2 = insertCliAgentStatusSpy.mock.calls.filter((call) => call[0] === mockHeaderElements2);
            (0, vitest_1.expect)(callsForTerminal2.length).toBe(0);
        });
        (0, vitest_1.it)('should remove status from all terminals when status is none', () => {
            cliAgentStatusService.updateCliAgentStatusDisplay('Terminal 1', 'none', mockHeaderElementsCache, null);
            (0, vitest_1.expect)(removeCliAgentStatusSpy).toHaveBeenCalledTimes(2);
        });
        (0, vitest_1.it)('should set AI Agent toggle button visibility for all terminals', () => {
            cliAgentStatusService.updateCliAgentStatusDisplay('Terminal 1', 'connected', mockHeaderElementsCache, 'Claude Code');
            (0, vitest_1.expect)(setAiAgentToggleButtonVisibilitySpy).toHaveBeenCalledTimes(2);
        });
        (0, vitest_1.it)('should handle disconnected status', () => {
            cliAgentStatusService.updateCliAgentStatusDisplay('Terminal 1', 'disconnected', mockHeaderElementsCache, 'Claude Code');
            (0, vitest_1.expect)(insertCliAgentStatusSpy).toHaveBeenCalledWith(mockHeaderElements1, 'disconnected', 'Claude Code');
        });
        (0, vitest_1.it)('should handle null agent type', () => {
            cliAgentStatusService.updateCliAgentStatusDisplay('Terminal 1', 'connected', mockHeaderElementsCache, null);
            (0, vitest_1.expect)(insertCliAgentStatusSpy).toHaveBeenCalledWith(mockHeaderElements1, 'connected', null);
        });
        (0, vitest_1.it)('should handle empty cache gracefully', () => {
            const emptyCache = new Map();
            (0, vitest_1.expect)(() => {
                cliAgentStatusService.updateCliAgentStatusDisplay('Terminal 1', 'connected', emptyCache, 'Claude Code');
            }).not.toThrow();
            (0, vitest_1.expect)(insertCliAgentStatusSpy).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Update CLI Agent Status By Terminal ID', () => {
        (0, vitest_1.it)('should update status for specific terminal ID', () => {
            cliAgentStatusService.updateCliAgentStatusByTerminalId('terminal-1', 'connected', mockHeaderElementsCache, 'Claude Code');
            (0, vitest_1.expect)(insertCliAgentStatusSpy).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(insertCliAgentStatusSpy).toHaveBeenCalledWith(mockHeaderElements1, 'connected', 'Claude Code');
        });
        (0, vitest_1.it)('should handle disconnected status by terminal ID', () => {
            cliAgentStatusService.updateCliAgentStatusByTerminalId('terminal-1', 'disconnected', mockHeaderElementsCache, 'Claude Code');
            (0, vitest_1.expect)(insertCliAgentStatusSpy).toHaveBeenCalledWith(mockHeaderElements1, 'disconnected', 'Claude Code');
        });
        (0, vitest_1.it)('should handle none status by terminal ID', () => {
            cliAgentStatusService.updateCliAgentStatusByTerminalId('terminal-1', 'none', mockHeaderElementsCache, null);
            (0, vitest_1.expect)(removeCliAgentStatusSpy).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(removeCliAgentStatusSpy).toHaveBeenCalledWith(mockHeaderElements1);
        });
        (0, vitest_1.it)('should handle missing terminal ID gracefully', () => {
            (0, vitest_1.expect)(() => {
                cliAgentStatusService.updateCliAgentStatusByTerminalId('nonexistent-terminal', 'connected', mockHeaderElementsCache, 'Claude Code');
            }).not.toThrow();
            (0, vitest_1.expect)(insertCliAgentStatusSpy).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should set AI Agent toggle button visibility', () => {
            cliAgentStatusService.updateCliAgentStatusByTerminalId('terminal-1', 'connected', mockHeaderElementsCache, 'Claude Code');
            (0, vitest_1.expect)(setAiAgentToggleButtonVisibilitySpy).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(setAiAgentToggleButtonVisibilitySpy).toHaveBeenCalledWith(mockHeaderElements1, true, 'connected');
        });
    });
    (0, vitest_1.describe)('Debouncing', () => {
        (0, vitest_1.it)('should allow first update', () => {
            (0, vitest_1.expect)(cliAgentStatusService.shouldProcessCliAgentUpdate()).toBe(true);
        });
        (0, vitest_1.it)('should block rapid successive updates', () => {
            (0, vitest_1.expect)(cliAgentStatusService.shouldProcessCliAgentUpdate()).toBe(true);
            (0, vitest_1.expect)(cliAgentStatusService.shouldProcessCliAgentUpdate()).toBe(false);
            (0, vitest_1.expect)(cliAgentStatusService.shouldProcessCliAgentUpdate()).toBe(false);
        });
        (0, vitest_1.it)('should allow update after debounce period', async () => {
            (0, vitest_1.expect)(cliAgentStatusService.shouldProcessCliAgentUpdate()).toBe(true);
            // Wait for debounce period (100ms) - using real setTimeout
            await new Promise((resolve) => setTimeout(resolve, 110));
            (0, vitest_1.expect)(cliAgentStatusService.shouldProcessCliAgentUpdate()).toBe(true);
        });
    });
    (0, vitest_1.describe)('Agent Type Handling', () => {
        (0, vitest_1.it)('should pass Claude Code agent type', () => {
            cliAgentStatusService.updateCliAgentStatusByTerminalId('terminal-1', 'connected', mockHeaderElementsCache, 'Claude Code');
            (0, vitest_1.expect)(insertCliAgentStatusSpy).toHaveBeenCalled();
            (0, vitest_1.expect)(insertCliAgentStatusSpy.mock.calls[0][2]).toBe('Claude Code');
        });
        (0, vitest_1.it)('should pass GitHub Copilot agent type', () => {
            cliAgentStatusService.updateCliAgentStatusByTerminalId('terminal-1', 'connected', mockHeaderElementsCache, 'GitHub Copilot');
            (0, vitest_1.expect)(insertCliAgentStatusSpy).toHaveBeenCalled();
            (0, vitest_1.expect)(insertCliAgentStatusSpy.mock.calls[0][2]).toBe('GitHub Copilot');
        });
        (0, vitest_1.it)('should pass Gemini CLI agent type', () => {
            cliAgentStatusService.updateCliAgentStatusByTerminalId('terminal-1', 'connected', mockHeaderElementsCache, 'Gemini CLI');
            (0, vitest_1.expect)(insertCliAgentStatusSpy).toHaveBeenCalled();
            (0, vitest_1.expect)(insertCliAgentStatusSpy.mock.calls[0][2]).toBe('Gemini CLI');
        });
    });
    (0, vitest_1.describe)('Status Values', () => {
        (0, vitest_1.it)('should handle connected status correctly', () => {
            cliAgentStatusService.updateCliAgentStatusByTerminalId('terminal-1', 'connected', mockHeaderElementsCache, 'Test Agent');
            (0, vitest_1.expect)(insertCliAgentStatusSpy).toHaveBeenCalledWith(mockHeaderElements1, 'connected', 'Test Agent');
        });
        (0, vitest_1.it)('should handle disconnected status correctly', () => {
            cliAgentStatusService.updateCliAgentStatusByTerminalId('terminal-1', 'disconnected', mockHeaderElementsCache, 'Test Agent');
            (0, vitest_1.expect)(insertCliAgentStatusSpy).toHaveBeenCalledWith(mockHeaderElements1, 'disconnected', 'Test Agent');
        });
        (0, vitest_1.it)('should handle none status correctly', () => {
            cliAgentStatusService.updateCliAgentStatusByTerminalId('terminal-1', 'none', mockHeaderElementsCache, null);
            (0, vitest_1.expect)(removeCliAgentStatusSpy).toHaveBeenCalledWith(mockHeaderElements1);
        });
    });
});
//# sourceMappingURL=CliAgentStatusService.test.js.map