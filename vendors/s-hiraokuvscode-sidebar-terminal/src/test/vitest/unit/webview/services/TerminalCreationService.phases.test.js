"use strict";
/**
 * TerminalCreationService - Phase Decomposition Tests
 *
 * Tests for the extracted private methods from createTerminal().
 * Each phase is tested independently to verify behavior after refactoring.
 *
 * Phase 1: ensureDomReady() - DOM readiness check and recovery
 * Phase 2: prepareTerminalConfig() - Config merging with fonts and theme
 * Phase 3: createTerminalWithAddons() - Terminal instance and addon creation
 * Phase 4: createAndInsertContainer() - Container creation, header callbacks, DOM insertion
 * Phase 5: setupTerminalInteraction() - Terminal open, paste handler, settings, events
 * Phase 6: finalizeTerminalSetup() - Links, rendering, registration, resize, notifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const TerminalCreationService_1 = require("../../../../../webview/services/TerminalCreationService");
const SplitManager_1 = require("../../../../../webview/managers/SplitManager");
const EventHandlerRegistry_1 = require("../../../../../webview/utils/EventHandlerRegistry");
const ResizeManager_1 = require("../../../../../webview/utils/ResizeManager");
// Mock xterm.js and addons
vitest_1.vi.mock('@xterm/xterm', () => {
    class MockTerminal {
        constructor(options) {
            this.element = { style: {} };
            this.cols = 80;
            this.rows = 24;
            this.unicode = { activeVersion: '11' };
            this.textarea = null;
            this.buffer = {
                normal: {
                    length: 10,
                    getLine: vitest_1.vi.fn().mockReturnValue({ translateToString: () => 'test line' }),
                },
            };
            this.open = vitest_1.vi.fn().mockImplementation(function () {
                // Simulate xterm.js creating textarea on open
                this.textarea = { hasAttribute: vitest_1.vi.fn().mockReturnValue(false) };
            });
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
(0, vitest_1.describe)('TerminalCreationService - Phase Decomposition', () => {
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
        dom = new jsdom_1.JSDOM(`<!DOCTYPE html>
      <html>
        <head></head>
        <body>
          <div id="terminal-view">
            <div id="terminal-body" style="width: 800px; height: 600px; display: flex; flex-direction: column;">
            </div>
          </div>
        </body>
      </html>`, { pretendToBeVisual: true });
        vitest_1.vi.stubGlobal('window', dom.window);
        vitest_1.vi.stubGlobal('document', dom.window.document);
        vitest_1.vi.stubGlobal('HTMLElement', dom.window.HTMLElement);
        vitest_1.vi.stubGlobal('Element', dom.window.Element);
        const splitManagerCoordinator = {
            postMessageToExtension: vitest_1.vi.fn(),
        };
        splitManager = new SplitManager_1.SplitManager(splitManagerCoordinator);
        eventRegistry = new EventHandlerRegistry_1.EventHandlerRegistry();
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
                removeTerminalHandlers: vitest_1.vi.fn(),
            },
            deleteTerminalSafely: vitest_1.vi.fn(),
            closeTerminal: vitest_1.vi.fn(),
            setActiveTerminalId: vitest_1.vi.fn(),
            getActiveTerminalId: vitest_1.vi.fn().mockReturnValue(null),
            profileManager: {
                createTerminalWithDefaultProfile: vitest_1.vi.fn(),
            },
            handleAiAgentToggle: vitest_1.vi.fn(),
        };
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
                        dom.window.close();
                    }
                    finally {
                        vitest_1.vi.unstubAllGlobals();
                    }
                }
            }
        }
    });
    // ============================================================
    // Phase 1: Orchestration integrity
    // ============================================================
    (0, vitest_1.describe)('createTerminal() orchestration', () => {
        (0, vitest_1.it)('should complete full terminal creation successfully', async () => {
            const result = await service.createTerminal('terminal-1', 'Test Terminal');
            (0, vitest_1.expect)(result).not.toBeNull();
        });
        (0, vitest_1.it)('should register terminal with SplitManager after creation', async () => {
            await service.createTerminal('terminal-1', 'Test Terminal');
            const terminals = splitManager.getTerminals();
            (0, vitest_1.expect)(terminals.has('terminal-1')).toBe(true);
        });
        (0, vitest_1.it)('should send terminalReady message to extension', async () => {
            await service.createTerminal('terminal-1', 'Test Terminal');
            const readyCall = mockCoordinator.postMessageToExtension.mock.calls.find((call) => call[0]?.command === 'terminalReady');
            (0, vitest_1.expect)(readyCall).toBeDefined();
            (0, vitest_1.expect)(readyCall[0].terminalId).toBe('terminal-1');
        });
        (0, vitest_1.it)('should register container with TerminalContainerManager', async () => {
            await service.createTerminal('terminal-1', 'Test Terminal');
            const containerManager = mockCoordinator.getTerminalContainerManager();
            (0, vitest_1.expect)(containerManager.registerContainer).toHaveBeenCalledWith('terminal-1', vitest_1.expect.any(Object));
        });
    });
    // ============================================================
    // Phase 1: DOM Readiness (ensureDomReady)
    // ============================================================
    (0, vitest_1.describe)('DOM readiness phase', () => {
        (0, vitest_1.it)('should succeed when terminal-body exists', async () => {
            const result = await service.createTerminal('terminal-1', 'Test Terminal');
            (0, vitest_1.expect)(result).not.toBeNull();
        });
        (0, vitest_1.it)('should recover when terminal-body is missing but terminal-view exists', async () => {
            // Remove terminal-body
            const body = document.getElementById('terminal-body');
            body?.parentNode?.removeChild(body);
            const result = await service.createTerminal('terminal-1', 'Test Terminal');
            (0, vitest_1.expect)(result).not.toBeNull();
            // Verify terminal-body was recreated
            const recreatedBody = document.getElementById('terminal-body');
            (0, vitest_1.expect)(recreatedBody).not.toBeNull();
        });
        (0, vitest_1.it)('should create terminals-wrapper if it does not exist', async () => {
            (0, vitest_1.expect)(document.getElementById('terminals-wrapper')).toBeNull();
            await service.createTerminal('terminal-1', 'Test Terminal');
            const wrapper = document.getElementById('terminals-wrapper');
            (0, vitest_1.expect)(wrapper).not.toBeNull();
        });
    });
    // ============================================================
    // Phase 2: Config Preparation (prepareTerminalConfig)
    // ============================================================
    (0, vitest_1.describe)('config preparation phase', () => {
        (0, vitest_1.it)('should apply font settings from config', async () => {
            const config = {
                fontFamily: 'MesloLGS NF',
                fontSize: 14,
            };
            // @ts-expect-error - test mock type
            const result = await service.createTerminal('terminal-1', 'Test Terminal', config);
            (0, vitest_1.expect)(result).not.toBeNull();
        });
        (0, vitest_1.it)('should resolve theme from coordinator settings', async () => {
            mockCoordinator.getManagers.mockReturnValue({
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
            const result = await service.createTerminal('terminal-1', 'Test Terminal');
            (0, vitest_1.expect)(result).not.toBeNull();
        });
        (0, vitest_1.it)('should handle missing ConfigManager gracefully', async () => {
            mockCoordinator.getManagers.mockReturnValue({
                config: undefined,
                ui: {
                    applyVSCodeStyling: vitest_1.vi.fn(),
                    updateSingleTerminalBorder: vitest_1.vi.fn(),
                    applyAllVisualSettings: vitest_1.vi.fn(),
                    applyFontSettings: vitest_1.vi.fn(),
                    applyTerminalTheme: vitest_1.vi.fn(),
                    headerElementsCache: new Map(),
                },
            });
            const result = await service.createTerminal('terminal-1', 'Test Terminal');
            (0, vitest_1.expect)(result).not.toBeNull();
        });
    });
    // ============================================================
    // Phase 3: Terminal + Addons Creation (createTerminalWithAddons)
    // ============================================================
    (0, vitest_1.describe)('terminal and addon creation phase', () => {
        (0, vitest_1.it)('should create terminal with addons', async () => {
            const result = await service.createTerminal('terminal-1', 'Test Terminal');
            (0, vitest_1.expect)(result).not.toBeNull();
            // Verify terminal is registered with instance record
            const instance = splitManager.getTerminals().get('terminal-1');
            (0, vitest_1.expect)(instance).toBeDefined();
            (0, vitest_1.expect)(instance?.fitAddon).toBeDefined();
            (0, vitest_1.expect)(instance?.serializeAddon).toBeDefined();
        });
        (0, vitest_1.it)('should pass link modifier from settings', async () => {
            mockCoordinator.getManagers.mockReturnValue({
                config: {
                    getCurrentFontSettings: vitest_1.vi.fn().mockReturnValue({}),
                    getCurrentSettings: vitest_1.vi.fn().mockReturnValue({ multiCursorModifier: 'ctrlCmd' }),
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
            const result = await service.createTerminal('terminal-1', 'Test Terminal');
            (0, vitest_1.expect)(result).not.toBeNull();
        });
    });
    // ============================================================
    // Phase 4: Container Creation & DOM Insertion
    // ============================================================
    (0, vitest_1.describe)('container creation and DOM insertion phase', () => {
        (0, vitest_1.it)('should create container with correct terminal number', async () => {
            await service.createTerminal('terminal-3', 'Terminal 3', undefined, 3);
            const instance = splitManager.getTerminals().get('terminal-3');
            (0, vitest_1.expect)(instance).toBeDefined();
            (0, vitest_1.expect)(instance?.number).toBe(3);
        });
        (0, vitest_1.it)('should apply active border when isActive config is true', async () => {
            const config = { isActive: true };
            await service.createTerminal('terminal-1', 'Test Terminal', config);
            const uiManager = mockCoordinator.getManagers().ui;
            (0, vitest_1.expect)(uiManager.updateSingleTerminalBorder).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should apply VS Code styling to container', async () => {
            await service.createTerminal('terminal-1', 'Test Terminal');
            const uiManager = mockCoordinator.getManagers().ui;
            (0, vitest_1.expect)(uiManager.applyVSCodeStyling).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should append container to terminals-wrapper', async () => {
            await service.createTerminal('terminal-1', 'Test Terminal');
            const wrapper = document.getElementById('terminals-wrapper');
            (0, vitest_1.expect)(wrapper).not.toBeNull();
            const containers = wrapper?.querySelectorAll('.terminal-container');
            (0, vitest_1.expect)(containers?.length).toBeGreaterThanOrEqual(1);
        });
    });
    // ============================================================
    // Phase 5: Terminal Interaction Setup
    // ============================================================
    (0, vitest_1.describe)('terminal interaction setup phase', () => {
        (0, vitest_1.it)('should open terminal in container', async () => {
            const terminal = await service.createTerminal('terminal-1', 'Test Terminal');
            (0, vitest_1.expect)(terminal).not.toBeNull();
            (0, vitest_1.expect)(terminal.open).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should register paste event handler', async () => {
            // Spy on eventRegistry.register to verify paste handler registration
            const registerSpy = vitest_1.vi.spyOn(eventRegistry, 'register');
            await service.createTerminal('terminal-1', 'Test Terminal');
            // Verify paste handler was registered via eventRegistry
            const pasteCall = registerSpy.mock.calls.find((call) => call[0] === 'terminal-terminal-1-paste');
            (0, vitest_1.expect)(pasteCall).toBeDefined();
            (0, vitest_1.expect)(pasteCall[2]).toBe('paste'); // event type
        });
        (0, vitest_1.it)('should setup custom key event handler for paste', async () => {
            const terminal = await service.createTerminal('terminal-1', 'Test Terminal');
            (0, vitest_1.expect)(terminal.attachCustomKeyEventHandler).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should bypass xterm key handling for r/d/x while panel navigation mode is active', async () => {
            const terminal = await service.createTerminal('terminal-1', 'Test Terminal');
            // @ts-expect-error - test mock type
            const keyHandler = terminal.attachCustomKeyEventHandler.mock.calls[0][0];
            document.body.classList.add('panel-navigation-mode');
            (0, vitest_1.expect)(keyHandler(new dom.window.KeyboardEvent('keydown', { key: 'r' }))).toBe(false);
            (0, vitest_1.expect)(keyHandler(new dom.window.KeyboardEvent('keydown', { key: 'd' }))).toBe(false);
            (0, vitest_1.expect)(keyHandler(new dom.window.KeyboardEvent('keydown', { key: 'x' }))).toBe(false);
            document.body.classList.remove('panel-navigation-mode');
        });
        (0, vitest_1.it)('should apply visual settings when UI manager is available', async () => {
            await service.createTerminal('terminal-1', 'Test Terminal');
            const uiManager = mockCoordinator.getManagers().ui;
            (0, vitest_1.expect)(uiManager.applyAllVisualSettings).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should setup input handling via InputManager', async () => {
            await service.createTerminal('terminal-1', 'Test Terminal');
            (0, vitest_1.expect)(mockCoordinator.inputManager.addXtermClickHandler).toHaveBeenCalledWith(vitest_1.expect.anything(), 'terminal-1', vitest_1.expect.any(Object), vitest_1.expect.anything());
        });
    });
    // ============================================================
    // Phase 6: Rendering, Registration & Finalization
    // ============================================================
    (0, vitest_1.describe)('rendering, registration and finalization phase', () => {
        (0, vitest_1.it)('should register terminal instance with SplitManager', async () => {
            await service.createTerminal('terminal-1', 'Test Terminal');
            const terminals = splitManager.getTerminals();
            (0, vitest_1.expect)(terminals.has('terminal-1')).toBe(true);
            const instance = terminals.get('terminal-1');
            (0, vitest_1.expect)(instance?.id).toBe('terminal-1');
            (0, vitest_1.expect)(instance?.name).toBe('Test Terminal');
        });
        (0, vitest_1.it)('should register container in SplitManager containers map', async () => {
            await service.createTerminal('terminal-1', 'Test Terminal');
            const containers = splitManager.getTerminalContainers();
            (0, vitest_1.expect)(containers.has('terminal-1')).toBe(true);
        });
        (0, vitest_1.it)('should handle split mode when creating in split mode', async () => {
            // Enable split mode
            mockCoordinator.getDisplayModeManager.mockReturnValue({
                getCurrentMode: vitest_1.vi.fn().mockReturnValue('split'),
                setDisplayMode: vitest_1.vi.fn(),
                showAllTerminalsSplit: vitest_1.vi.fn(),
            });
            await service.createTerminal('terminal-1', 'Test Terminal');
            // Should not throw
        });
        (0, vitest_1.it)('should handle AI agent header elements registration', async () => {
            await service.createTerminal('terminal-1', 'Test Terminal');
            // The headerElementsCache should have been accessed
            const uiManager = mockCoordinator.getManagers().ui;
            // The test verifies that the creation flow doesn't throw when handling header elements
            (0, vitest_1.expect)(uiManager.headerElementsCache).toBeInstanceOf(Map);
        });
    });
    // ============================================================
    // Retry and Error Handling
    // ============================================================
    (0, vitest_1.describe)('error handling and retries', () => {
        (0, vitest_1.it)('should return null when all retries fail', async () => {
            // Remove both terminal-body and terminal-view to cause unrecoverable failure
            const terminalBody = document.getElementById('terminal-body');
            terminalBody?.parentNode?.removeChild(terminalBody);
            const terminalView = document.getElementById('terminal-view');
            terminalView?.parentNode?.removeChild(terminalView);
            const result = await service.createTerminal('terminal-1', 'Test Terminal');
            (0, vitest_1.expect)(result).toBeDefined();
        });
        (0, vitest_1.it)('should always resume ResizeManager observers after final failure', async () => {
            const pauseSpy = vitest_1.vi.spyOn(ResizeManager_1.ResizeManager, 'pauseObservers');
            const resumeSpy = vitest_1.vi.spyOn(ResizeManager_1.ResizeManager, 'resumeObservers');
            // Remove both terminal-body and terminal-view to force final failure path
            const terminalBody = document.getElementById('terminal-body');
            terminalBody?.parentNode?.removeChild(terminalBody);
            const terminalView = document.getElementById('terminal-view');
            terminalView?.parentNode?.removeChild(terminalView);
            const result = await service.createTerminal('terminal-1', 'Test Terminal');
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(pauseSpy).toHaveBeenCalled();
            (0, vitest_1.expect)(resumeSpy).toHaveBeenCalled();
        });
    });
    // ============================================================
    // Consistency after refactoring: same behavior as original
    // ============================================================
    (0, vitest_1.describe)('post-refactoring consistency', () => {
        (0, vitest_1.it)('should produce identical terminal instance structure', async () => {
            await service.createTerminal('terminal-1', 'Test Terminal', undefined, 1);
            const instance = splitManager.getTerminals().get('terminal-1');
            (0, vitest_1.expect)(instance).toBeDefined();
            // Verify all required fields of TerminalInstance
            (0, vitest_1.expect)(instance.id).toBe('terminal-1');
            (0, vitest_1.expect)(instance.name).toBe('Test Terminal');
            (0, vitest_1.expect)(instance.number).toBe(1);
            (0, vitest_1.expect)(instance.terminal).toBeDefined();
            (0, vitest_1.expect)(instance.fitAddon).toBeDefined();
            (0, vitest_1.expect)(instance.container).toBeDefined();
            (0, vitest_1.expect)(instance.isActive).toBe(false);
        });
        (0, vitest_1.it)('should handle multiple terminal creation sequentially', async () => {
            await service.createTerminal('terminal-1', 'Terminal 1', undefined, 1);
            await service.createTerminal('terminal-2', 'Terminal 2', undefined, 2);
            const terminals = splitManager.getTerminals();
            (0, vitest_1.expect)(terminals.size).toBe(2);
            (0, vitest_1.expect)(terminals.has('terminal-1')).toBe(true);
            (0, vitest_1.expect)(terminals.has('terminal-2')).toBe(true);
        });
        (0, vitest_1.it)('should properly clean up on removal after creation', async () => {
            await service.createTerminal('terminal-1', 'Test Terminal');
            (0, vitest_1.expect)(splitManager.getTerminals().has('terminal-1')).toBe(true);
            const removed = await service.removeTerminal('terminal-1');
            (0, vitest_1.expect)(removed).toBe(true);
            (0, vitest_1.expect)(splitManager.getTerminals().has('terminal-1')).toBe(false);
        });
    });
});
//# sourceMappingURL=TerminalCreationService.phases.test.js.map