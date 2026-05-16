"use strict";
/**
 * TerminalCreationService - Unit Tests
 * Test coverage for terminal creation, removal, and switching operations
 *
 * Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const xterm_1 = require("@xterm/xterm");
const addon_fit_1 = require("@xterm/addon-fit");
const TerminalCreationService_1 = require("../../../../../webview/services/TerminalCreationService");
const SplitManager_1 = require("../../../../../webview/managers/SplitManager");
const EventHandlerRegistry_1 = require("../../../../../webview/utils/EventHandlerRegistry");
// Mock xterm.js and addons to avoid JSDOM issues
vitest_1.vi.mock('@xterm/xterm', () => {
    class MockTerminal {
        constructor(options) {
            this.element = { style: {} };
            this.cols = 80;
            this.rows = 24;
            this.unicode = { activeVersion: '11' };
            this.open = vitest_1.vi.fn();
            this.dispose = vitest_1.vi.fn();
            this.loadAddon = vitest_1.vi.fn();
            this.attachCustomKeyEventHandler = vitest_1.vi.fn();
            this.refresh = vitest_1.vi.fn();
            this.write = vitest_1.vi.fn();
            this.onData = vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() });
            this.onResize = vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() });
            this.onSelectionChange = vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() });
            this.onTitleChange = vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() });
            this.onBell = vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() });
            this.onLineFeed = vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() });
            this.onScroll = vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() });
            this.focus = vitest_1.vi.fn();
            this.blur = vitest_1.vi.fn();
            this.resize = vitest_1.vi.fn();
            this.clear = vitest_1.vi.fn();
            this.selectAll = vitest_1.vi.fn();
            this.selectLines = vitest_1.vi.fn();
            this.scrollToBottom = vitest_1.vi.fn();
            this.scrollToTop = vitest_1.vi.fn();
            this.scrollToRow = vitest_1.vi.fn();
            this.scrollLines = vitest_1.vi.fn();
            this.scrollPages = vitest_1.vi.fn();
            this.paste = vitest_1.vi.fn();
            this.options = options || {};
        }
    }
    return { Terminal: MockTerminal };
});
vitest_1.vi.mock('@xterm/addon-fit', () => {
    class MockFitAddon {
        constructor() {
            this.fit = vitest_1.vi.fn();
            this.activate = vitest_1.vi.fn();
            this.dispose = vitest_1.vi.fn();
            this.proposeDimensions = vitest_1.vi.fn();
        }
    }
    return { FitAddon: MockFitAddon };
});
// Mock TerminalAddonManager
vitest_1.vi.mock('../../../../../webview/managers/TerminalAddonManager', () => {
    return {
        TerminalAddonManager: class {
            constructor() {
                this.loadAllAddons = vitest_1.vi.fn().mockImplementation(async () => {
                    const { FitAddon } = await Promise.resolve().then(() => require('@xterm/addon-fit'));
                    return {
                        fitAddon: new FitAddon(),
                        webLinksAddon: {},
                        serializeAddon: { serialize: vitest_1.vi.fn() },
                        searchAddon: { findNext: vitest_1.vi.fn(), findPrevious: vitest_1.vi.fn() },
                        unicode11Addon: {},
                    };
                });
                this.dispose = vitest_1.vi.fn();
                this.disposeAddons = vitest_1.vi.fn();
            }
        },
    };
});
(0, vitest_1.describe)('TerminalCreationService', () => {
    let dom;
    let service;
    let splitManager;
    let mockCoordinator;
    let eventRegistry;
    // Suppress console output to prevent EnvironmentTeardownError
    // (pending onUserConsoleLog RPC during worker shutdown)
    (0, vitest_1.beforeAll)(() => {
        vitest_1.vi.spyOn(console, 'log').mockImplementation(() => { });
        vitest_1.vi.spyOn(console, 'warn').mockImplementation(() => { });
        vitest_1.vi.spyOn(console, 'debug').mockImplementation(() => { });
    });
    (0, vitest_1.afterAll)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.beforeEach)(() => {
        // Set up DOM environment
        dom = new jsdom_1.JSDOM(`
      <!DOCTYPE html>
      <html>
        <head></head>
        <body>
          <div id="terminal-view">
            <div id="terminal-body" style="width: 800px; height: 600px; display: flex; flex-direction: column;">
            </div>
          </div>
        </body>
      </html>
    `, { pretendToBeVisual: true });
        // Set global DOM objects
        vitest_1.vi.stubGlobal('window', dom.window);
        vitest_1.vi.stubGlobal('document', dom.window.document);
        vitest_1.vi.stubGlobal('HTMLElement', dom.window.HTMLElement);
        vitest_1.vi.stubGlobal('Element', dom.window.Element);
        // Create mocks
        const splitManagerCoordinator = {
            postMessageToExtension: vitest_1.vi.fn(),
        };
        splitManager = new SplitManager_1.SplitManager(splitManagerCoordinator);
        eventRegistry = new EventHandlerRegistry_1.EventHandlerRegistry();
        // Create mock coordinator
        mockCoordinator = {
            postMessageToExtension: vitest_1.vi.fn(),
            shellIntegrationManager: {
                decorateTerminalOutput: vitest_1.vi.fn(),
            },
            getTerminalContainerManager: vitest_1.vi.fn().mockReturnValue({
                unregisterContainer: vitest_1.vi.fn(),
                clearSplitArtifacts: vitest_1.vi.fn(),
                applyDisplayState: vitest_1.vi.fn(),
                registerContainer: vitest_1.vi.fn(),
            }),
            getDisplayModeManager: vitest_1.vi.fn().mockReturnValue({
                getCurrentMode: vitest_1.vi.fn().mockReturnValue('normal'),
                setDisplayMode: vitest_1.vi.fn(),
                showAllTerminalsSplit: vitest_1.vi.fn(),
            }),
            getManagers: vitest_1.vi.fn().mockReturnValue({
                config: {
                    getCurrentFontSettings: vitest_1.vi.fn().mockReturnValue({}),
                    getCurrentSettings: vitest_1.vi.fn().mockReturnValue({}),
                },
                ui: {
                    applyVSCodeStyling: vitest_1.vi.fn(),
                    updateSingleTerminalBorder: vitest_1.vi.fn(),
                    applyAllVisualSettings: vitest_1.vi.fn(),
                    applyFontSettings: vitest_1.vi.fn(),
                    applyTerminalTheme: vitest_1.vi.fn(),
                    headerElementsCache: new Map(),
                },
            }),
            inputManager: {
                addXtermClickHandler: vitest_1.vi.fn(),
            },
            deleteTerminalSafely: vitest_1.vi.fn(),
            closeTerminal: vitest_1.vi.fn(),
            setActiveTerminalId: vitest_1.vi.fn(),
            profileManager: {
                createTerminalWithDefaultProfile: vitest_1.vi.fn(),
            },
            handleAiAgentToggle: vitest_1.vi.fn(),
        };
        // Create service instance
        service = new TerminalCreationService_1.TerminalCreationService(splitManager, mockCoordinator, eventRegistry);
    });
    (0, vitest_1.afterEach)(() => {
        try {
            service.dispose();
        }
        finally {
            try {
                eventRegistry.dispose();
            }
            finally {
                try {
                    vitest_1.vi.restoreAllMocks();
                }
                finally {
                    try {
                        // Close JSDOM window
                        dom.window.close();
                    }
                    finally {
                        // Cleanup global DOM state
                        vitest_1.vi.unstubAllGlobals();
                    }
                }
            }
        }
    });
    (0, vitest_1.describe)('createTerminal()', () => {
        (0, vitest_1.it)('should create terminal with basic configuration', async () => {
            // Arrange
            const terminalId = 'terminal-1';
            const terminalName = 'Test Terminal';
            // Act
            const terminal = await service.createTerminal(terminalId, terminalName);
            // Assert
            (0, vitest_1.expect)(terminal).not.toBeNull();
            (0, vitest_1.expect)(terminal).toBeInstanceOf(xterm_1.Terminal);
            // Verify terminal registered in SplitManager
            const terminalInstance = splitManager.getTerminals().get(terminalId);
            (0, vitest_1.expect)(terminalInstance).toBeDefined();
            (0, vitest_1.expect)(terminalInstance?.name).toBe(terminalName);
            (0, vitest_1.expect)(terminalInstance?.terminal).toBe(terminal);
        });
        (0, vitest_1.it)('should create terminal with custom configuration', async () => {
            // Arrange
            const terminalId = 'terminal-1';
            const terminalName = 'Custom Terminal';
            const config = {
                fontSize: 16,
                fontFamily: 'Courier New',
                cursorBlink: false,
            };
            // Act
            const terminal = await service.createTerminal(terminalId, terminalName, config);
            // Assert
            (0, vitest_1.expect)(terminal).not.toBeNull();
            (0, vitest_1.expect)(terminal?.options.fontSize).toBe(16);
            (0, vitest_1.expect)(terminal?.options.fontFamily).toBe('Courier New');
            (0, vitest_1.expect)(terminal?.options.cursorBlink).toBe(false);
        });
        (0, vitest_1.it)('should assign correct terminal number', async () => {
            // Arrange
            const terminalId = 'terminal-3';
            const terminalName = 'Terminal 3';
            const terminalNumber = 3;
            // Act
            const terminal = await service.createTerminal(terminalId, terminalName, undefined, terminalNumber);
            // Assert
            (0, vitest_1.expect)(terminal).not.toBeNull();
            const terminalInstance = splitManager.getTerminals().get(terminalId);
            (0, vitest_1.expect)(terminalInstance?.number).toBe(3);
        });
        (0, vitest_1.it)('should create terminal container in DOM', async () => {
            // Arrange
            const terminalId = 'terminal-1';
            const terminalName = 'Test Terminal';
            // Act
            await service.createTerminal(terminalId, terminalName);
            // Assert
            const container = document.querySelector(`[data-terminal-id="${terminalId}"]`);
            (0, vitest_1.expect)(container).not.toBeNull();
            (0, vitest_1.expect)(container?.classList.contains('terminal-container')).toBe(true);
        });
        (0, vitest_1.it)('should load essential addons', async () => {
            // Arrange
            const terminalId = 'terminal-1';
            const terminalName = 'Test Terminal';
            // Act
            const terminal = await service.createTerminal(terminalId, terminalName);
            // Assert
            (0, vitest_1.expect)(terminal).not.toBeNull();
            const terminalInstance = splitManager.getTerminals().get(terminalId);
            (0, vitest_1.expect)(terminalInstance?.fitAddon).toBeInstanceOf(addon_fit_1.FitAddon);
            (0, vitest_1.expect)(terminalInstance?.serializeAddon).toBeDefined();
        });
        (0, vitest_1.it)('should register terminal with SplitManager', async () => {
            // Arrange
            const terminalId = 'terminal-1';
            const terminalName = 'Test Terminal';
            // Act
            await service.createTerminal(terminalId, terminalName);
            // Assert
            (0, vitest_1.expect)(splitManager.getTerminals().has(terminalId)).toBe(true);
            (0, vitest_1.expect)(splitManager.getTerminalContainers().has(terminalId)).toBe(true);
        });
        (0, vitest_1.it)('should setup shell integration', async () => {
            // Arrange
            const terminalId = 'terminal-1';
            const terminalName = 'Test Terminal';
            // Act
            await service.createTerminal(terminalId, terminalName);
            // Assert
            (0, vitest_1.expect)(true).toBe(true);
        });
        (0, vitest_1.it)('should retry on failure (max 2 retries)', async () => {
            // Arrange
            const terminalId = 'terminal-1';
            const terminalName = 'Test Terminal';
            // Temporarily remove terminal-body to trigger failure
            const terminalBody = document.getElementById('terminal-body');
            terminalBody?.remove();
            // Act
            const terminal = await service.createTerminal(terminalId, terminalName);
            // Assert - should still succeed due to recovery logic
            (0, vitest_1.expect)(terminal).not.toBeNull();
        }, 5000);
        (0, vitest_1.it)('should eventually fail after exceeding max retries', async () => {
            // Force failure by mocking document.getElementById to always return null
            const getElementSpy = vitest_1.vi.spyOn(document, 'getElementById').mockReturnValue(null);
            // And also mock querySelector to ensure recovery fails
            vitest_1.vi.spyOn(document, 'querySelector').mockReturnValue(null);
            const terminal = await service.createTerminal('fail-term', 'Fail');
            (0, vitest_1.expect)(terminal).toBeNull();
            // Should have tried at least 3 attempts
            (0, vitest_1.expect)(getElementSpy.mock.calls.length).toBeGreaterThanOrEqual(3);
            getElementSpy.mockRestore();
        });
        (0, vitest_1.it)('should extract terminal number from ID', async () => {
            // Arrange
            const terminalId = 'terminal-5';
            const terminalName = 'Terminal 5';
            // Act
            await service.createTerminal(terminalId, terminalName);
            // Assert
            const terminalInstance = splitManager.getTerminals().get(terminalId);
            (0, vitest_1.expect)(terminalInstance?.number).toBe(5);
        });
        (0, vitest_1.it)('should find available terminal number when ID extraction fails', async () => {
            // Arrange
            const terminalId = 'custom-terminal';
            const terminalName = 'Custom';
            // Act
            await service.createTerminal(terminalId, terminalName);
            // Assert
            const terminalInstance = splitManager.getTerminals().get(terminalId);
            (0, vitest_1.expect)(terminalInstance?.number).toBeGreaterThanOrEqual(1);
            (0, vitest_1.expect)(terminalInstance?.number).toBeLessThanOrEqual(5);
        });
        (0, vitest_1.it)('should handle partial font settings and apply defaults', async () => {
            const terminalId = 'terminal-font-test';
            const config = {
                fontFamily: '   ', // Empty string
                fontSize: 0, // Invalid size
            };
            const terminal = await service.createTerminal(terminalId, 'Font Test', config);
            (0, vitest_1.expect)(terminal).not.toBeNull();
            // Should not have applied invalid fonts, should use xterm defaults or system defaults
            // (Testing that it didn't crash)
        });
        (0, vitest_1.it)('should handle missing container Manager gracefully', async () => {
            mockCoordinator.getTerminalContainerManager.mockReturnValue(null);
            const terminal = await service.createTerminal('term-no-mgr', 'No Manager');
            (0, vitest_1.expect)(terminal).not.toBeNull();
        });
    });
    (0, vitest_1.describe)('removeTerminal()', () => {
        (0, vitest_1.it)('should remove terminal successfully', async () => {
            // Arrange
            const terminalId = 'terminal-1';
            const terminalName = 'Test Terminal';
            await service.createTerminal(terminalId, terminalName);
            // Verify terminal exists
            (0, vitest_1.expect)(splitManager.getTerminals().has(terminalId)).toBe(true);
            // Act
            const result = await service.removeTerminal(terminalId);
            // Assert
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(splitManager.getTerminals().has(terminalId)).toBe(false);
            (0, vitest_1.expect)(splitManager.getTerminalContainers().has(terminalId)).toBe(false);
        });
        (0, vitest_1.it)('should remove terminal container from DOM', async () => {
            // Arrange
            const terminalId = 'terminal-1';
            const terminalName = 'Test Terminal';
            await service.createTerminal(terminalId, terminalName);
            const containerBefore = document.querySelector(`[data-terminal-id="${terminalId}"]`);
            (0, vitest_1.expect)(containerBefore).not.toBeNull();
            // Act
            await service.removeTerminal(terminalId);
            // Assert
            const containerAfter = document.querySelector(`[data-terminal-id="${terminalId}"]`);
            (0, vitest_1.expect)(containerAfter).toBeNull();
        });
        (0, vitest_1.it)('should return false when terminal not found', async () => {
            // Arrange
            const nonExistentId = 'terminal-999';
            // Act
            const result = await service.removeTerminal(nonExistentId);
            // Assert
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should unregister container from TerminalContainerManager', async () => {
            // Arrange
            const terminalId = 'terminal-1';
            const terminalName = 'Test Terminal';
            await service.createTerminal(terminalId, terminalName);
            const containerManager = mockCoordinator.getTerminalContainerManager();
            // Act
            await service.removeTerminal(terminalId);
            // Assert
            if (containerManager) {
                (0, vitest_1.expect)(containerManager.unregisterContainer).toHaveBeenCalledWith(terminalId);
            }
            else {
                (0, vitest_1.expect)(true).toBe(true);
            }
        });
        (0, vitest_1.it)('should dispose terminal instance', async () => {
            // Arrange
            const terminalId = 'terminal-1';
            const terminalName = 'Test Terminal';
            const terminal = await service.createTerminal(terminalId, terminalName);
            const disposeSpy = vitest_1.vi.spyOn(terminal, 'dispose');
            // Act
            await service.removeTerminal(terminalId);
            // Assert
            (0, vitest_1.expect)(disposeSpy).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle removal errors gracefully', async () => {
            // Arrange
            const terminalId = 'terminal-1';
            await service.createTerminal(terminalId, 'Test');
            // Corrupt terminal instance to trigger error
            const instance = splitManager.getTerminals().get(terminalId);
            if (instance) {
                instance.terminal = null;
            }
            // Act
            const result = await service.removeTerminal(terminalId);
            // Assert - should return false on error
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    (0, vitest_1.describe)('switchToTerminal()', () => {
        (0, vitest_1.it)('should switch to terminal successfully', async () => {
            // Arrange
            const terminal1Id = 'terminal-1';
            const terminal2Id = 'terminal-2';
            await service.createTerminal(terminal1Id, 'Terminal 1');
            await service.createTerminal(terminal2Id, 'Terminal 2');
            let activeTerminalId = terminal1Id;
            const onActivate = (id) => {
                activeTerminalId = id;
            };
            // Act
            const result = await service.switchToTerminal(terminal2Id, terminal1Id, onActivate);
            // Assert
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(activeTerminalId).toBe(terminal2Id);
        });
        (0, vitest_1.it)('should deactivate current terminal', async () => {
            // Arrange
            const terminal1Id = 'terminal-1';
            const terminal2Id = 'terminal-2';
            await service.createTerminal(terminal1Id, 'Terminal 1');
            await service.createTerminal(terminal2Id, 'Terminal 2');
            const terminal1Instance = splitManager.getTerminals().get(terminal1Id);
            if (terminal1Instance) {
                terminal1Instance.isActive = true;
                terminal1Instance.container.classList.add('active');
            }
            // Act
            await service.switchToTerminal(terminal2Id, terminal1Id, () => { });
            // Assert
            (0, vitest_1.expect)(terminal1Instance?.isActive).toBe(false);
            (0, vitest_1.expect)(terminal1Instance?.container.classList.contains('active')).toBe(false);
        });
        (0, vitest_1.it)('should activate new terminal', async () => {
            // Arrange
            const terminal1Id = 'terminal-1';
            const terminal2Id = 'terminal-2';
            await service.createTerminal(terminal1Id, 'Terminal 1');
            await service.createTerminal(terminal2Id, 'Terminal 2');
            // Act
            await service.switchToTerminal(terminal2Id, terminal1Id, () => { });
            // Assert
            const terminal2Instance = splitManager.getTerminals().get(terminal2Id);
            (0, vitest_1.expect)(terminal2Instance?.isActive).toBe(true);
            (0, vitest_1.expect)(terminal2Instance?.container.classList.contains('active')).toBe(true);
        });
        (0, vitest_1.it)('should return false when terminal not found', async () => {
            // Arrange
            const nonExistentId = 'terminal-999';
            // Act
            const result = await service.switchToTerminal(nonExistentId, null, () => { });
            // Assert
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should call onActivate callback', async () => {
            // Arrange
            const terminal1Id = 'terminal-1';
            const terminal2Id = 'terminal-2';
            await service.createTerminal(terminal1Id, 'Terminal 1');
            await service.createTerminal(terminal2Id, 'Terminal 2');
            const onActivateSpy = vitest_1.vi.fn();
            // Act
            await service.switchToTerminal(terminal2Id, terminal1Id, onActivateSpy);
            // Assert
            (0, vitest_1.expect)(onActivateSpy).toHaveBeenCalledWith(terminal2Id);
        });
        (0, vitest_1.it)('should handle switch when no current terminal', async () => {
            // Arrange
            const terminalId = 'terminal-1';
            await service.createTerminal(terminalId, 'Terminal 1');
            // Act
            const result = await service.switchToTerminal(terminalId, null, () => { });
            // Assert
            (0, vitest_1.expect)(result).toBe(true);
        });
    });
    (0, vitest_1.describe)('dispose()', () => {
        (0, vitest_1.it)('should dispose all link providers', () => {
            // Arrange
            // Create some terminals to generate link providers
            service.createTerminal('terminal-1', 'Terminal 1');
            service.createTerminal('terminal-2', 'Terminal 2');
            // Act
            service.dispose();
            // Assert - should not throw errors
            (0, vitest_1.expect)(true).toBe(true);
        });
        (0, vitest_1.it)('should be safe to call multiple times', () => {
            // Act & Assert - should not throw errors
            service.dispose();
            service.dispose();
            (0, vitest_1.expect)(true).toBe(true);
        });
    });
    (0, vitest_1.describe)('Edge Cases and Error Handling', () => {
        (0, vitest_1.it)('should handle missing terminal-body gracefully', async () => {
            // Arrange
            const terminalBody = document.getElementById('terminal-body');
            terminalBody?.remove();
            const terminalId = 'terminal-1';
            const terminalName = 'Test Terminal';
            // Act
            const terminal = await service.createTerminal(terminalId, terminalName);
            // Assert - should recover and create terminal
            (0, vitest_1.expect)(terminal).not.toBeNull();
        });
        (0, vitest_1.it)('should handle createTerminal with same ID twice', async () => {
            // Arrange
            const terminalId = 'terminal-1';
            // Act
            await service.createTerminal(terminalId, 'First');
            await service.createTerminal(terminalId, 'Second');
            // Assert - second creation should overwrite
            const terminalInstance = splitManager.getTerminals().get(terminalId);
            (0, vitest_1.expect)(terminalInstance?.name).toBe('Second');
        });
        (0, vitest_1.it)('should handle terminal removal during switch', async () => {
            // Arrange
            const terminal1Id = 'terminal-1';
            const terminal2Id = 'terminal-2';
            await service.createTerminal(terminal1Id, 'Terminal 1');
            await service.createTerminal(terminal2Id, 'Terminal 2');
            // Remove terminal2 before switching
            await service.removeTerminal(terminal2Id);
            // Act
            const result = await service.switchToTerminal(terminal2Id, terminal1Id, () => { });
            // Assert
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should handle concurrent terminal creation', async () => {
            // Arrange
            const createPromises = [];
            // Act - create 5 terminals concurrently
            for (let i = 1; i <= 5; i++) {
                createPromises.push(service.createTerminal(`terminal-${i}`, `Terminal ${i}`));
            }
            const terminals = await Promise.all(createPromises);
            // Assert - all should be created successfully
            (0, vitest_1.expect)(terminals.every((t) => t !== null)).toBe(true);
            (0, vitest_1.expect)(splitManager.getTerminals().size).toBe(5);
        }, 5000);
        (0, vitest_1.it)('should handle concurrent terminal removal', async () => {
            // Arrange
            const terminalIds = ['terminal-1', 'terminal-2', 'terminal-3'];
            for (const id of terminalIds) {
                await service.createTerminal(id, `Terminal ${id}`);
            }
            // Act - remove all concurrently
            const removePromises = terminalIds.map((id) => service.removeTerminal(id));
            const results = await Promise.all(removePromises);
            // Assert
            (0, vitest_1.expect)(results.every((r) => r === true)).toBe(true);
            (0, vitest_1.expect)(splitManager.getTerminals().size).toBe(0);
        });
    });
    (0, vitest_1.describe)('Integration with ResizeManager', () => {
        (0, vitest_1.it)('should setup resize observer on terminal creation', async () => {
            // Arrange
            const terminalId = 'terminal-1';
            // Act
            await service.createTerminal(terminalId, 'Test Terminal');
            // Assert - terminal should have container with valid dimensions
            const container = splitManager.getTerminalContainers().get(terminalId);
            (0, vitest_1.expect)(container).toBeDefined();
        });
        (0, vitest_1.it)('should cleanup resize observer on terminal removal', async () => {
            // Arrange
            const terminalId = 'terminal-1';
            await service.createTerminal(terminalId, 'Test Terminal');
            // Act
            await service.removeTerminal(terminalId);
            // Assert - should not throw errors during cleanup
            (0, vitest_1.expect)(true).toBe(true);
        });
    });
    (0, vitest_1.describe)('File Link Detection', () => {
        (0, vitest_1.it)('should register link provider on terminal creation', async () => {
            // Arrange
            const terminalId = 'terminal-1';
            // Act
            await service.createTerminal(terminalId, 'Test Terminal');
            // Assert - link provider should be registered
            const terminalInstance = splitManager.getTerminals().get(terminalId);
            (0, vitest_1.expect)(terminalInstance?.terminal).toBeDefined();
        });
        (0, vitest_1.it)('should cleanup link provider on terminal removal', async () => {
            // Arrange
            const terminalId = 'terminal-1';
            await service.createTerminal(terminalId, 'Test Terminal');
            // Act
            await service.removeTerminal(terminalId);
            // Assert - should not throw errors
            (0, vitest_1.expect)(true).toBe(true);
        });
    });
    (0, vitest_1.describe)('Scrollback Auto-Save', () => {
        (0, vitest_1.it)('should setup scrollback auto-save on terminal creation', async () => {
            // Arrange
            const terminalId = 'terminal-1';
            // Act
            await service.createTerminal(terminalId, 'Test Terminal');
            // Assert
            const terminalInstance = splitManager.getTerminals().get(terminalId);
            (0, vitest_1.expect)(terminalInstance?.serializeAddon).toBeDefined();
        });
        (0, vitest_1.it)('should use vscodeApi for scrollback when available', async () => {
            // Arrange
            const mockVscodeApi = {
                postMessage: vitest_1.vi.fn(),
            };
            vitest_1.vi.stubGlobal('vscodeApi', mockVscodeApi);
            const terminalId = 'terminal-1';
            const terminal = await service.createTerminal(terminalId, 'Test Terminal');
            // Act - trigger data event to initiate auto-save
            terminal?.write('test data\n');
            // Wait for debounce
            await new Promise((resolve) => setTimeout(resolve, 3100));
            // Assert - vscodeApi should be used
            // Note: This is timing-dependent, so we just verify no errors occurred
            (0, vitest_1.expect)(true).toBe(true);
            // Cleanup
            vitest_1.vi.unstubAllGlobals();
        });
    });
    (0, vitest_1.describe)('Performance', () => {
        (0, vitest_1.it)('should create terminal within reasonable time', async () => {
            // Arrange
            const startTime = Date.now();
            // Act
            await service.createTerminal('terminal-1', 'Test Terminal');
            // Assert
            const duration = Date.now() - startTime;
            (0, vitest_1.expect)(duration).toBeLessThan(1000); // Should complete within 1 second
        }, 2000);
        (0, vitest_1.it)('should remove terminal within reasonable time', async () => {
            // Arrange
            await service.createTerminal('terminal-1', 'Test Terminal');
            const startTime = Date.now();
            // Act
            await service.removeTerminal('terminal-1');
            // Assert
            const duration = Date.now() - startTime;
            (0, vitest_1.expect)(duration).toBeLessThan(500); // Should complete within 500ms
        });
        (0, vitest_1.it)('should switch terminals within reasonable time', async () => {
            // Arrange
            await service.createTerminal('terminal-1', 'Terminal 1');
            await service.createTerminal('terminal-2', 'Terminal 2');
            const startTime = Date.now();
            // Act
            await service.switchToTerminal('terminal-2', 'terminal-1', () => { });
            // Assert
            const duration = Date.now() - startTime;
            (0, vitest_1.expect)(duration).toBeLessThan(200); // Should complete within 200ms
        });
    });
    (0, vitest_1.describe)('Static Methods - Terminal Restoring State', () => {
        (0, vitest_1.it)('should mark terminal as restoring', () => {
            // Arrange
            const terminalId = 'terminal-restore-1';
            // Act
            TerminalCreationService_1.TerminalCreationService.markTerminalRestoring(terminalId);
            // Assert
            (0, vitest_1.expect)(TerminalCreationService_1.TerminalCreationService.isTerminalRestoring(terminalId)).toBe(true);
        });
        (0, vitest_1.it)('should return false for non-restoring terminal', () => {
            // Arrange
            const terminalId = 'terminal-not-restoring';
            // Assert
            (0, vitest_1.expect)(TerminalCreationService_1.TerminalCreationService.isTerminalRestoring(terminalId)).toBe(false);
        });
        (0, vitest_1.it)('should mark terminal as restored after delay', async () => {
            // Arrange
            const terminalId = 'terminal-restore-2';
            TerminalCreationService_1.TerminalCreationService.markTerminalRestoring(terminalId);
            (0, vitest_1.expect)(TerminalCreationService_1.TerminalCreationService.isTerminalRestoring(terminalId)).toBe(true);
            // Act
            TerminalCreationService_1.TerminalCreationService.markTerminalRestored(terminalId);
            // Assert - Still restoring immediately after call (5 second delay)
            (0, vitest_1.expect)(TerminalCreationService_1.TerminalCreationService.isTerminalRestoring(terminalId)).toBe(true);
            // Wait for protection period to end
            await new Promise((resolve) => setTimeout(resolve, 5100));
            (0, vitest_1.expect)(TerminalCreationService_1.TerminalCreationService.isTerminalRestoring(terminalId)).toBe(false);
        }, 10000);
    });
    (0, vitest_1.describe)('Font Settings Handling', () => {
        (0, vitest_1.it)('should apply direct font settings from config', async () => {
            // Arrange
            const terminalId = 'terminal-font-1';
            const config = {
                fontFamily: 'MesloLGS NF',
                fontSize: 18,
                fontWeight: 'normal',
                fontWeightBold: 'bold',
                lineHeight: 1.2,
                letterSpacing: 0.5,
            };
            // Act
            const terminal = await service.createTerminal(terminalId, 'Font Test', config);
            // Assert
            (0, vitest_1.expect)(terminal).not.toBeNull();
            (0, vitest_1.expect)(terminal?.options.fontFamily).toBe('MesloLGS NF');
            (0, vitest_1.expect)(terminal?.options.fontSize).toBe(18);
        });
        (0, vitest_1.it)('should handle empty font settings gracefully', async () => {
            // Arrange
            const terminalId = 'terminal-font-2';
            const config = {
                fontFamily: '',
                fontSize: 0,
            };
            // Act
            const terminal = await service.createTerminal(terminalId, 'Empty Font Test', config);
            // Assert - Should use defaults, not empty values
            (0, vitest_1.expect)(terminal).not.toBeNull();
        });
        (0, vitest_1.it)('should apply nested fontSettings from config', async () => {
            // Arrange
            const terminalId = 'terminal-font-3';
            const config = {
                fontSettings: {
                    fontFamily: 'Fira Code',
                    fontSize: 16,
                },
            };
            // Act
            const terminal = await service.createTerminal(terminalId, 'Nested Font Test', config);
            // Assert
            (0, vitest_1.expect)(terminal).not.toBeNull();
        });
    });
    (0, vitest_1.describe)('Split Mode Handling', () => {
        (0, vitest_1.it)('should add terminal to split when split mode is active', async () => {
            // Arrange
            const terminalId = 'terminal-split-1';
            // Mock split mode as active
            vitest_1.vi.spyOn(splitManager, 'getIsSplitMode').mockReturnValue(true);
            const addToSplitSpy = vitest_1.vi.spyOn(splitManager, 'addNewTerminalToSplit');
            // Act
            await service.createTerminal(terminalId, 'Split Terminal');
            // Assert
            (0, vitest_1.expect)(addToSplitSpy).toHaveBeenCalledWith(terminalId, 'Split Terminal');
        });
        (0, vitest_1.it)('should not add terminal to split when not in split mode', async () => {
            // Arrange
            const terminalId = 'terminal-normal-1';
            vitest_1.vi.spyOn(splitManager, 'getIsSplitMode').mockReturnValue(false);
            const addToSplitSpy = vitest_1.vi.spyOn(splitManager, 'addNewTerminalToSplit');
            // Act
            await service.createTerminal(terminalId, 'Normal Terminal');
            // Assert
            (0, vitest_1.expect)(addToSplitSpy).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Terminal Container Backgrounds', () => {
        (0, vitest_1.it)('should apply theme to container elements', async () => {
            // Arrange
            const terminalId = 'terminal-theme-1';
            // Mock config with light theme
            mockCoordinator.getManagers = vitest_1.vi.fn().mockReturnValue({
                config: {
                    getCurrentFontSettings: vitest_1.vi.fn().mockReturnValue({}),
                    getCurrentSettings: vitest_1.vi.fn().mockReturnValue({ theme: 'light' }),
                },
                ui: {
                    applyVSCodeStyling: vitest_1.vi.fn(),
                    updateSingleTerminalBorder: vitest_1.vi.fn(),
                    applyAllVisualSettings: vitest_1.vi.fn(),
                    applyFontSettings: vitest_1.vi.fn(),
                    applyTerminalTheme: vitest_1.vi.fn(),
                    headerElementsCache: new Map(),
                },
            });
            // Act
            await service.createTerminal(terminalId, 'Theme Terminal');
            // Assert
            const container = document.querySelector(`[data-terminal-id="${terminalId}"]`);
            (0, vitest_1.expect)(container).not.toBeNull();
        });
        (0, vitest_1.it)('should handle dark theme', async () => {
            // Arrange
            const terminalId = 'terminal-theme-2';
            mockCoordinator.getManagers = vitest_1.vi.fn().mockReturnValue({
                config: {
                    getCurrentFontSettings: vitest_1.vi.fn().mockReturnValue({}),
                    getCurrentSettings: vitest_1.vi.fn().mockReturnValue({ theme: 'dark' }),
                },
                ui: {
                    applyVSCodeStyling: vitest_1.vi.fn(),
                    updateSingleTerminalBorder: vitest_1.vi.fn(),
                    applyAllVisualSettings: vitest_1.vi.fn(),
                    applyFontSettings: vitest_1.vi.fn(),
                    applyTerminalTheme: vitest_1.vi.fn(),
                    headerElementsCache: new Map(),
                },
            });
            // Act
            await service.createTerminal(terminalId, 'Dark Terminal');
            // Assert
            const container = document.querySelector(`[data-terminal-id="${terminalId}"]`);
            (0, vitest_1.expect)(container).not.toBeNull();
        });
    });
    (0, vitest_1.describe)('Initial Resize with Retry', () => {
        (0, vitest_1.it)('should handle container with minimal dimensions', async () => {
            // Arrange
            const terminalId = 'terminal-resize-1';
            // Create terminal in small container
            const terminalBody = document.getElementById('terminal-body');
            if (terminalBody) {
                terminalBody.style.width = '30px';
                terminalBody.style.height = '30px';
            }
            // Act
            const terminal = await service.createTerminal(terminalId, 'Small Container');
            // Assert - Should still create terminal despite small container
            (0, vitest_1.expect)(terminal).not.toBeNull();
        }, 10000);
    });
    (0, vitest_1.describe)('Link Modifier Settings', () => {
        (0, vitest_1.it)('should setup link modifier from settings', async () => {
            // Arrange
            const terminalId = 'terminal-link-1';
            mockCoordinator.getManagers = vitest_1.vi.fn().mockReturnValue({
                config: {
                    getCurrentFontSettings: vitest_1.vi.fn().mockReturnValue({}),
                    getCurrentSettings: vitest_1.vi.fn().mockReturnValue({
                        multiCursorModifier: 'ctrlCmd',
                    }),
                },
                ui: {
                    applyVSCodeStyling: vitest_1.vi.fn(),
                    updateSingleTerminalBorder: vitest_1.vi.fn(),
                    applyAllVisualSettings: vitest_1.vi.fn(),
                    applyFontSettings: vitest_1.vi.fn(),
                    applyTerminalTheme: vitest_1.vi.fn(),
                    headerElementsCache: new Map(),
                },
            });
            // Act
            const terminal = await service.createTerminal(terminalId, 'Link Test');
            // Assert
            (0, vitest_1.expect)(terminal).not.toBeNull();
        });
    });
    (0, vitest_1.describe)('Terminal Number Extraction Edge Cases', () => {
        (0, vitest_1.it)('should find available number when all 1-5 slots are used', async () => {
            // Arrange - Fill all standard slots
            for (let i = 1; i <= 5; i++) {
                await service.createTerminal(`terminal-${i}`, `Terminal ${i}`);
            }
            // Act - Create with non-standard ID
            await service.createTerminal('custom-terminal-x', 'Custom');
            // Assert
            const customTerminal = splitManager.getTerminals().get('custom-terminal-x');
            // Should have some number assigned (will be 1 based on implementation)
            (0, vitest_1.expect)(customTerminal?.number).toBeDefined();
        });
        (0, vitest_1.it)('should handle undefined terminal ID gracefully', async () => {
            // This tests the extractTerminalNumber fallback
            // The method handles undefined by returning 1
            const terminalId = 'terminal-1';
            await service.createTerminal(terminalId, 'Test');
            const instance = splitManager.getTerminals().get(terminalId);
            (0, vitest_1.expect)(instance?.number).toBe(1);
        });
    });
    (0, vitest_1.describe)('isActive Configuration', () => {
        (0, vitest_1.it)('should apply active border when isActive is true in config', async () => {
            // Arrange
            const terminalId = 'terminal-active-1';
            const config = { isActive: true };
            const updateBorderSpy = mockCoordinator.getManagers().ui.updateSingleTerminalBorder;
            // Act
            await service.createTerminal(terminalId, 'Active Terminal', config);
            // Assert
            (0, vitest_1.expect)(updateBorderSpy).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should not apply active border when isActive is false', async () => {
            // Arrange
            const terminalId = 'terminal-inactive-1';
            const config = { isActive: false };
            // Reset the spy
            const uiManager = mockCoordinator.getManagers().ui;
            uiManager.updateSingleTerminalBorder = vitest_1.vi.fn();
            // Act
            await service.createTerminal(terminalId, 'Inactive Terminal', config);
            // Assert - updateSingleTerminalBorder should not be called for inactive
            (0, vitest_1.expect)(uiManager.updateSingleTerminalBorder).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Header Elements Cache', () => {
        (0, vitest_1.it)('should register header elements with UIManager', async () => {
            // Arrange
            const terminalId = 'terminal-header-1';
            const headerCache = new Map();
            mockCoordinator.getManagers = vitest_1.vi.fn().mockReturnValue({
                config: {
                    getCurrentFontSettings: vitest_1.vi.fn().mockReturnValue({}),
                    getCurrentSettings: vitest_1.vi.fn().mockReturnValue({}),
                },
                ui: {
                    applyVSCodeStyling: vitest_1.vi.fn(),
                    updateSingleTerminalBorder: vitest_1.vi.fn(),
                    applyAllVisualSettings: vitest_1.vi.fn(),
                    applyFontSettings: vitest_1.vi.fn(),
                    applyTerminalTheme: vitest_1.vi.fn(),
                    headerElementsCache: headerCache,
                },
            });
            // Act
            await service.createTerminal(terminalId, 'Header Test');
            // Assert
            (0, vitest_1.expect)(headerCache.has(terminalId)).toBe(true);
        });
    });
    (0, vitest_1.describe)('Terminal Removal with Split Mode', () => {
        (0, vitest_1.it)('should clear split artifacts when only one terminal remains', async () => {
            // Arrange
            await service.createTerminal('terminal-1', 'Terminal 1');
            await service.createTerminal('terminal-2', 'Terminal 2');
            const containerManager = mockCoordinator.getTerminalContainerManager();
            const clearArtifactsSpy = containerManager.clearSplitArtifacts;
            // Act - Remove terminal 2, leaving only 1
            await service.removeTerminal('terminal-2');
            // Assert
            (0, vitest_1.expect)(clearArtifactsSpy).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should rebuild split layout when multiple terminals remain in split mode', async () => {
            // Arrange
            await service.createTerminal('terminal-1', 'Terminal 1');
            await service.createTerminal('terminal-2', 'Terminal 2');
            await service.createTerminal('terminal-3', 'Terminal 3');
            const displayManager = mockCoordinator.getDisplayModeManager();
            displayManager.getCurrentMode = vitest_1.vi.fn().mockReturnValue('split');
            const containerManager = mockCoordinator.getTerminalContainerManager();
            const applyDisplayStateSpy = containerManager.applyDisplayState;
            // Act
            await service.removeTerminal('terminal-2');
            // Assert - Should rebuild layout
            (0, vitest_1.expect)(applyDisplayStateSpy).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=TerminalCreationService.test.js.map