"use strict";
/**
 * Tests for CLI Agent status display fix
 *
 * Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
 *
 * Issue: ステータスが表示されない問題の修正
 * Fix: terminalId-based status updates instead of terminalName-based
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const UIManager_1 = require("../../../../webview/managers/UIManager");
const HeaderFactoryModule = require("../../../../webview/factories/HeaderFactory");
// Mock the HeaderFactory module
vitest_1.vi.mock('../../../../webview/factories/HeaderFactory', async () => {
    const actual = await vitest_1.vi.importActual('../../../../webview/factories/HeaderFactory');
    return {
        ...actual,
        HeaderFactory: {
            ...actual.HeaderFactory,
            removeCliAgentStatus: vitest_1.vi.fn(),
            insertCliAgentStatus: vitest_1.vi.fn(),
            setAiAgentToggleButtonVisibility: vitest_1.vi.fn(),
        },
    };
});
(0, vitest_1.describe)('CLI Agent Status Display Fix', () => {
    let uiManager;
    let mockHeaderElements;
    (0, vitest_1.beforeEach)(() => {
        // Reset mocks
        vitest_1.vi.clearAllMocks();
        uiManager = new UIManager_1.UIManager();
        // Mock DOM elements
        const mockContainer = {
            querySelector: vitest_1.vi.fn(),
            querySelectorAll: vitest_1.vi.fn().mockReturnValue([]),
        };
        const mockStatusSection = {
            appendChild: vitest_1.vi.fn(),
            removeChild: vitest_1.vi.fn(),
            querySelectorAll: vitest_1.vi.fn().mockReturnValue([]),
        };
        const mockNameSpan = {
            textContent: 'Terminal 1',
        };
        mockHeaderElements = {
            container: mockContainer,
            titleSection: {},
            nameSpan: mockNameSpan,
            idSpan: {},
            headerEnhancementsEnabled: true,
            processingIndicator: null,
            statusSection: mockStatusSection,
            statusSpan: null,
            indicator: null,
            controlsSection: {},
            aiAgentToggleButton: {},
            splitButton: {},
            closeButton: {},
        };
        // Set up header elements cache
        uiManager.headerElementsCache.set('terminal-1', mockHeaderElements);
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('updateCliAgentStatusByTerminalId', () => {
        (0, vitest_1.it)('should update status for connected agent', () => {
            const { HeaderFactory } = HeaderFactoryModule;
            // Act
            uiManager.updateCliAgentStatusByTerminalId('terminal-1', 'connected', 'claude');
            // Assert
            (0, vitest_1.expect)(HeaderFactory.insertCliAgentStatus).toHaveBeenCalledWith(mockHeaderElements, 'connected', 'claude');
            // Connected状態でも切り替えボタンは表示 (always visible)
            (0, vitest_1.expect)(HeaderFactory.setAiAgentToggleButtonVisibility).toHaveBeenCalledWith(mockHeaderElements, true, 'connected');
            (0, vitest_1.expect)(HeaderFactory.removeCliAgentStatus).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should update status for disconnected agent', () => {
            const { HeaderFactory } = HeaderFactoryModule;
            // Act
            uiManager.updateCliAgentStatusByTerminalId('terminal-1', 'disconnected', 'gemini');
            // Assert
            (0, vitest_1.expect)(HeaderFactory.insertCliAgentStatus).toHaveBeenCalledWith(mockHeaderElements, 'disconnected', 'gemini');
            (0, vitest_1.expect)(HeaderFactory.setAiAgentToggleButtonVisibility).toHaveBeenCalledWith(mockHeaderElements, true, 'disconnected');
            (0, vitest_1.expect)(HeaderFactory.removeCliAgentStatus).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should remove status for none state', () => {
            const { HeaderFactory } = HeaderFactoryModule;
            // Act
            uiManager.updateCliAgentStatusByTerminalId('terminal-1', 'none', null);
            // Assert
            (0, vitest_1.expect)(HeaderFactory.removeCliAgentStatus).toHaveBeenCalledWith(mockHeaderElements);
            (0, vitest_1.expect)(HeaderFactory.setAiAgentToggleButtonVisibility).toHaveBeenCalledWith(mockHeaderElements, true);
            (0, vitest_1.expect)(HeaderFactory.insertCliAgentStatus).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle non-existent terminal gracefully', () => {
            const { HeaderFactory } = HeaderFactoryModule;
            // Act
            uiManager.updateCliAgentStatusByTerminalId('non-existent-terminal', 'connected', 'claude');
            // Assert - should not call any HeaderFactory methods
            (0, vitest_1.expect)(HeaderFactory.insertCliAgentStatus).not.toHaveBeenCalled();
            (0, vitest_1.expect)(HeaderFactory.removeCliAgentStatus).not.toHaveBeenCalled();
            (0, vitest_1.expect)(HeaderFactory.setAiAgentToggleButtonVisibility).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Full State Sync Integration', () => {
        (0, vitest_1.it)('should handle multiple terminal status updates correctly', () => {
            const { HeaderFactory } = HeaderFactoryModule;
            // Setup multiple terminals
            const mockHeaderElements2 = {
                ...mockHeaderElements,
                nameSpan: { textContent: 'Terminal 2' },
            };
            const mockHeaderElements3 = {
                ...mockHeaderElements,
                nameSpan: { textContent: 'Terminal 3' },
            };
            uiManager.headerElementsCache.set('terminal-2', mockHeaderElements2);
            uiManager.headerElementsCache.set('terminal-3', mockHeaderElements3);
            // Act - simulate full state sync
            uiManager.updateCliAgentStatusByTerminalId('terminal-1', 'connected', 'claude');
            uiManager.updateCliAgentStatusByTerminalId('terminal-2', 'disconnected', 'gemini');
            uiManager.updateCliAgentStatusByTerminalId('terminal-3', 'none', null);
            // Assert
            (0, vitest_1.expect)(HeaderFactory.insertCliAgentStatus).toHaveBeenCalledTimes(2); // connected + disconnected
            (0, vitest_1.expect)(HeaderFactory.removeCliAgentStatus).toHaveBeenCalledTimes(1); // none
            (0, vitest_1.expect)(HeaderFactory.setAiAgentToggleButtonVisibility).toHaveBeenCalledTimes(3); // all terminals
        });
    });
    (0, vitest_1.describe)('Status Transition Scenarios', () => {
        (0, vitest_1.it)('should handle connected -> none transition correctly', () => {
            const { HeaderFactory } = HeaderFactoryModule;
            // Setup initial connected state
            uiManager.updateCliAgentStatusByTerminalId('terminal-1', 'connected', 'claude');
            // Reset spies
            vitest_1.vi.clearAllMocks();
            // Act - transition to none
            uiManager.updateCliAgentStatusByTerminalId('terminal-1', 'none', null);
            // Assert
            (0, vitest_1.expect)(HeaderFactory.removeCliAgentStatus).toHaveBeenCalledWith(mockHeaderElements);
            (0, vitest_1.expect)(HeaderFactory.setAiAgentToggleButtonVisibility).toHaveBeenCalledWith(mockHeaderElements, true);
        });
        (0, vitest_1.it)('should handle disconnected -> connected transition correctly', () => {
            const { HeaderFactory } = HeaderFactoryModule;
            // Setup initial disconnected state
            uiManager.updateCliAgentStatusByTerminalId('terminal-1', 'disconnected', 'claude');
            // Reset spies
            vitest_1.vi.clearAllMocks();
            // Act - transition to connected
            uiManager.updateCliAgentStatusByTerminalId('terminal-1', 'connected', 'claude');
            // Assert
            (0, vitest_1.expect)(HeaderFactory.insertCliAgentStatus).toHaveBeenCalledWith(mockHeaderElements, 'connected', 'claude');
            // Connected状態でも切り替えボタンは表示 (always visible)
            (0, vitest_1.expect)(HeaderFactory.setAiAgentToggleButtonVisibility).toHaveBeenCalledWith(mockHeaderElements, true, 'connected');
        });
        (0, vitest_1.it)('should handle none -> connected transition correctly', () => {
            const { HeaderFactory } = HeaderFactoryModule;
            // Start with none state (no initial setup needed)
            // Act - transition to connected
            uiManager.updateCliAgentStatusByTerminalId('terminal-1', 'connected', 'gemini');
            // Assert
            (0, vitest_1.expect)(HeaderFactory.insertCliAgentStatus).toHaveBeenCalledWith(mockHeaderElements, 'connected', 'gemini');
            // Connected状態でも切り替えボタンは表示 (always visible)
            (0, vitest_1.expect)(HeaderFactory.setAiAgentToggleButtonVisibility).toHaveBeenCalledWith(mockHeaderElements, true, 'connected');
            (0, vitest_1.expect)(HeaderFactory.removeCliAgentStatus).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Agent Type Handling', () => {
        (0, vitest_1.it)('should pass correct agent type for Claude', () => {
            const { HeaderFactory } = HeaderFactoryModule;
            // Act
            uiManager.updateCliAgentStatusByTerminalId('terminal-1', 'connected', 'claude');
            // Assert
            (0, vitest_1.expect)(HeaderFactory.insertCliAgentStatus).toHaveBeenCalledWith(mockHeaderElements, 'connected', 'claude');
        });
        (0, vitest_1.it)('should pass correct agent type for Gemini', () => {
            const { HeaderFactory } = HeaderFactoryModule;
            // Act
            uiManager.updateCliAgentStatusByTerminalId('terminal-1', 'connected', 'gemini');
            // Assert
            (0, vitest_1.expect)(HeaderFactory.insertCliAgentStatus).toHaveBeenCalledWith(mockHeaderElements, 'connected', 'gemini');
        });
        (0, vitest_1.it)('should handle null agent type for none status', () => {
            const { HeaderFactory } = HeaderFactoryModule;
            // Act
            uiManager.updateCliAgentStatusByTerminalId('terminal-1', 'none', null);
            // Assert - removeCliAgentStatus should be called, agentType is irrelevant
            (0, vitest_1.expect)(HeaderFactory.removeCliAgentStatus).toHaveBeenCalledWith(mockHeaderElements);
        });
    });
    (0, vitest_1.describe)('AI Agent Toggle Button Visibility Rules', () => {
        (0, vitest_1.it)('should show toggle button for connected status (always visible)', () => {
            const { HeaderFactory } = HeaderFactoryModule;
            // Act
            uiManager.updateCliAgentStatusByTerminalId('terminal-1', 'connected', 'claude');
            // Assert
            (0, vitest_1.expect)(HeaderFactory.setAiAgentToggleButtonVisibility).toHaveBeenCalledWith(mockHeaderElements, true, 'connected');
        });
        (0, vitest_1.it)('should show toggle button for disconnected status', () => {
            const { HeaderFactory } = HeaderFactoryModule;
            // Act
            uiManager.updateCliAgentStatusByTerminalId('terminal-1', 'disconnected', 'gemini');
            // Assert
            (0, vitest_1.expect)(HeaderFactory.setAiAgentToggleButtonVisibility).toHaveBeenCalledWith(mockHeaderElements, true, 'disconnected');
        });
        (0, vitest_1.it)('should show toggle button for none status (always visible)', () => {
            const { HeaderFactory } = HeaderFactoryModule;
            // Act
            uiManager.updateCliAgentStatusByTerminalId('terminal-1', 'none', null);
            // Assert
            (0, vitest_1.expect)(HeaderFactory.setAiAgentToggleButtonVisibility).toHaveBeenCalledWith(mockHeaderElements, true);
        });
        (0, vitest_1.it)('should correctly handle connected -> disconnected -> connected transitions (always visible)', () => {
            const { HeaderFactory } = HeaderFactoryModule;
            // Initial: connected (button visible)
            uiManager.updateCliAgentStatusByTerminalId('terminal-1', 'connected', 'claude');
            vitest_1.vi.clearAllMocks();
            // Transition to disconnected (button still visible)
            uiManager.updateCliAgentStatusByTerminalId('terminal-1', 'disconnected', 'claude');
            (0, vitest_1.expect)(HeaderFactory.setAiAgentToggleButtonVisibility).toHaveBeenCalledWith(mockHeaderElements, true, 'disconnected');
            vitest_1.vi.clearAllMocks();
            // Transition back to connected (button still visible)
            uiManager.updateCliAgentStatusByTerminalId('terminal-1', 'connected', 'claude');
            (0, vitest_1.expect)(HeaderFactory.setAiAgentToggleButtonVisibility).toHaveBeenCalledWith(mockHeaderElements, true, 'connected');
        });
    });
    (0, vitest_1.describe)('Performance and Caching', () => {
        (0, vitest_1.it)('should use cached header elements efficiently', () => {
            // Setup spy on cache get
            const cacheGetSpy = vitest_1.vi.spyOn(uiManager.headerElementsCache, 'get');
            // Act
            uiManager.updateCliAgentStatusByTerminalId('terminal-1', 'connected', 'claude');
            // Assert
            (0, vitest_1.expect)(cacheGetSpy).toHaveBeenCalledWith('terminal-1');
        });
        (0, vitest_1.it)('should not perform unnecessary DOM operations when terminal not found', () => {
            const { HeaderFactory } = HeaderFactoryModule;
            // Act - try to update non-existent terminal
            uiManager.updateCliAgentStatusByTerminalId('non-existent', 'connected', 'claude');
            // Assert - no DOM operations should be performed
            (0, vitest_1.expect)(HeaderFactory.insertCliAgentStatus).not.toHaveBeenCalled();
            (0, vitest_1.expect)(HeaderFactory.removeCliAgentStatus).not.toHaveBeenCalled();
            (0, vitest_1.expect)(HeaderFactory.setAiAgentToggleButtonVisibility).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=StatusDisplayFix.test.js.map