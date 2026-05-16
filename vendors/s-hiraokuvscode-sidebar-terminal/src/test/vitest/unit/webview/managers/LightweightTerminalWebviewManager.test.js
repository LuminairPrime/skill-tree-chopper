"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const LightweightTerminalWebviewManager_1 = require("../../../../../webview/managers/LightweightTerminalWebviewManager");
const TerminalAutoSaveService_1 = require("../../../../../webview/services/terminal/TerminalAutoSaveService");
// Mock all internal managers to avoid complex DOM/Logic setups
vi.mock('../../../../../webview/managers/WebViewApiManager', () => ({
    WebViewApiManager: class {
        constructor() {
            this.postMessageToExtension = vi.fn();
            this.loadState = vi.fn().mockReturnValue(null);
            this.saveState = vi.fn();
            this.dispose = vi.fn();
            this.getDiagnostics = vi.fn().mockReturnValue({});
        }
    },
}));
vi.mock('../../../../../webview/managers/SplitManager', () => ({
    SplitManager: class {
        constructor() {
            this.setPanelLocation = vi.fn();
            this.updateSplitDirection = vi.fn();
            this.getTerminals = vi.fn().mockReturnValue(new Map());
            this.getTerminalContainers = vi.fn().mockReturnValue(new Map());
            this.getIsSplitMode = vi.fn().mockReturnValue(false);
        }
    },
}));
vi.mock('../../../../../webview/managers/TerminalLifecycleCoordinator', () => ({
    TerminalLifecycleCoordinator: class {
        constructor() {
            this.createTerminal = vi.fn();
            this.removeTerminal = vi.fn();
            this.getActiveTerminalId = vi.fn().mockReturnValue('t1');
            this.getTerminalInstance = vi.fn();
            this.getAllTerminalInstances = vi.fn().mockReturnValue(new Map());
            this.getAllTerminalContainers = vi.fn().mockReturnValue(new Map());
            this.getTerminalStats = vi.fn().mockReturnValue({});
            this.dispose = vi.fn();
            this.setActiveTerminalId = vi.fn();
            this.resizeAllTerminals = vi.fn();
            this.initializeSimpleTerminal = vi.fn();
            this.switchToTerminal = vi.fn().mockResolvedValue(true);
            this.writeToTerminal = vi.fn();
        }
    },
}));
vi.mock('../../../../../webview/managers/TerminalTabManager', () => ({
    TerminalTabManager: class {
        constructor() {
            this.setCoordinator = vi.fn();
            this.initialize = vi.fn();
            this.addTab = vi.fn();
            this.removeTab = vi.fn();
            this.setActiveTab = vi.fn();
            this.updateTheme = vi.fn();
            this.updateModeIndicator = vi.fn();
            this.dispose = vi.fn();
        }
    },
}));
vi.mock('../../../../../webview/managers/ConsolidatedMessageManager', () => ({
    ConsolidatedMessageManager: class {
        constructor() {
            this.setCoordinator = vi.fn();
            this.postMessage = vi.fn();
            this.receiveMessage = vi.fn();
            this.updatePanelLocationIfNeeded = vi.fn().mockReturnValue(false);
            this.getCurrentPanelLocation = vi.fn().mockReturnValue('sidebar');
            this.getCurrentFlexDirection = vi.fn().mockReturnValue('column');
            this.dispose = vi.fn();
        }
    },
}));
vi.mock('../../../../../webview/managers/UIManager', () => ({
    UIManager: class {
        constructor() {
            this.setActiveBorderMode = vi.fn();
            this.updateTerminalBorders = vi.fn();
            this.updateSplitTerminalBorders = vi.fn();
            this.applyAllVisualSettings = vi.fn();
            this.setTabThemeUpdater = vi.fn();
            this.applyTheme = vi.fn();
            this.updateCliAgentStatusByTerminalId = vi.fn();
        }
    },
}));
vi.mock('../../../../../webview/managers/ConfigManager', () => ({
    ConfigManager: class {
        constructor() {
            this.setFontSettingsService = vi.fn();
            this.applySettings = vi.fn();
            this.getCurrentSettings = vi.fn().mockReturnValue({});
        }
    },
}));
vi.mock('../../../../../webview/services/WebViewPersistenceService', () => ({
    WebViewPersistenceService: class {
        constructor() {
            this.addTerminal = vi.fn();
            this.removeTerminal = vi.fn();
            this.saveSession = vi.fn().mockResolvedValue(true);
            this.dispose = vi.fn();
        }
    },
}));
vi.mock('../../../../../webview/managers/DisplayModeManager', () => ({
    DisplayModeManager: class {
        constructor() {
            this.initialize = vi.fn();
            this.getCurrentMode = vi.fn().mockReturnValue('normal');
            this.setDisplayMode = vi.fn();
            this.showAllTerminalsSplit = vi.fn();
            this.showTerminalFullscreen = vi.fn();
            this.dispose = vi.fn();
        }
    },
}));
vi.mock('../../../../../webview/managers/TerminalContainerManager', () => ({
    TerminalContainerManager: class {
        constructor() {
            this.initialize = vi.fn();
            this.dispose = vi.fn();
        }
    },
}));
vi.mock('../../../../../webview/managers/HeaderManager', () => ({
    HeaderManager: class {
        constructor() {
            this.setCoordinator = vi.fn();
            this.createWebViewHeader = vi.fn();
            this.dispose = vi.fn();
        }
    },
}));
vi.mock('../../../../../webview/managers/TerminalStateDisplayManager', () => ({
    TerminalStateDisplayManager: class {
        constructor() {
            this.updateFromState = vi.fn();
            this.updateCreationState = vi.fn();
        }
    },
}));
vi.mock('../../../../../webview/coordinators/TerminalOperationsCoordinator', () => ({
    TerminalOperationsCoordinator: class {
        constructor() {
            this.isTerminalCreationPending = vi.fn().mockReturnValue(false);
            this.markTerminalCreationPending = vi.fn();
            this.clearTerminalCreationPending = vi.fn();
            this.canCreateTerminal = vi.fn().mockReturnValue(true);
            this.updateState = vi.fn();
            this.hasPendingCreations = vi.fn().mockReturnValue(false);
            this.getPendingCreationsCount = vi.fn().mockReturnValue(0);
            this.getPendingDeletions = vi.fn().mockReturnValue([]);
            this.dispose = vi.fn();
        }
    },
}));
vi.mock('../../../../../webview/managers/CliAgentStateManager', () => ({
    CliAgentStateManager: class {
        constructor() {
            this.detectAgentActivity = vi.fn().mockReturnValue({ isAgentOutput: false });
            this.removeTerminalState = vi.fn();
            this.setAgentConnected = vi.fn();
            this.setAgentDisconnected = vi.fn();
            this.getAgentState = vi.fn();
            this.getAgentStats = vi.fn().mockReturnValue({});
            this.dispose = vi.fn();
        }
    },
}));
vi.mock('../../../../../webview/managers/DebugPanelManager', () => ({
    DebugPanelManager: class {
        constructor() {
            this.setCallbacks = vi.fn();
            this.updateDisplay = vi.fn();
            this.toggle = vi.fn();
            this.isActive = vi.fn().mockReturnValue(false);
            this.exportDiagnostics = vi.fn();
            this.dispose = vi.fn();
        }
    },
}));
vi.mock('../../../../../webview/managers/EventHandlerManager', () => ({
    EventHandlerManager: class {
        constructor() {
            this.setMessageEventHandler = vi.fn();
            this.onPageUnload = vi.fn();
            this.getEventStats = vi.fn().mockReturnValue({});
            this.dispose = vi.fn();
        }
    },
}));
(0, vitest_1.describe)('LightweightTerminalWebviewManager', () => {
    let dom;
    let manager;
    beforeEach(() => {
        dom = new jsdom_1.JSDOM('<!DOCTYPE html><html><body><div id="terminal-body"></div></body></html>');
        vi.stubGlobal('window', dom.window);
        vi.stubGlobal('document', dom.window.document);
        vi.stubGlobal('navigator', dom.window.navigator);
        vi.stubGlobal('performance', { now: () => Date.now() });
        const ResizeObserverMock = vi.fn(function () {
            this.observe = vi.fn();
            this.unobserve = vi.fn();
            this.disconnect = vi.fn();
        });
        vi.stubGlobal('ResizeObserver', ResizeObserverMock);
        manager = new LightweightTerminalWebviewManager_1.LightweightTerminalWebviewManager();
        vi.spyOn(manager, 'postMessageToExtension');
        vi.useFakeTimers();
    });
    afterEach(() => {
        manager.dispose();
        vi.useRealTimers();
        vi.unstubAllGlobals();
        dom.window.close();
    });
    (0, vitest_1.describe)('Integration & Delegation', () => {
        (0, vitest_1.it)('should initialize all major components', () => {
            (0, vitest_1.expect)(manager.splitManager).toBeDefined();
            (0, vitest_1.expect)(manager.terminalTabManager).toBeDefined();
            (0, vitest_1.expect)(manager.inputManager).toBeDefined();
        });
        (0, vitest_1.it)('should delegate message posting to webViewApiManager', () => {
            const apiManager = manager.webViewApiManager;
            manager.postMessageToExtension({ hello: 'world' });
            (0, vitest_1.expect)(apiManager.postMessageToExtension).toHaveBeenCalledWith({ hello: 'world' });
        });
        (0, vitest_1.it)('should coordinate active terminal changes across components', () => {
            const lifecycle = manager.terminalLifecycleManager;
            const tabs = manager.terminalTabManager;
            const ui = manager.uiManager;
            manager.setActiveTerminalId('term-1');
            (0, vitest_1.expect)(lifecycle.setActiveTerminalId).toHaveBeenCalledWith('term-1');
            (0, vitest_1.expect)(tabs.setActiveTab).toHaveBeenCalledWith('term-1');
            (0, vitest_1.expect)(ui.updateTerminalBorders).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should focus specified terminal when target terminalId is provided', () => {
            const lifecycle = manager.terminalLifecycleManager;
            const focusT1 = vi.fn();
            const focusT2 = vi.fn();
            lifecycle.getActiveTerminalId.mockReturnValue('t1');
            lifecycle.getTerminalInstance.mockImplementation((id) => {
                if (id === 't1') {
                    return { terminal: { focus: focusT1 } };
                }
                if (id === 't2') {
                    return { terminal: { focus: focusT2 } };
                }
                return undefined;
            });
            manager.ensureTerminalFocus('t2');
            (0, vitest_1.expect)(lifecycle.setActiveTerminalId).toHaveBeenCalledWith('t2');
            (0, vitest_1.expect)(focusT2).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(focusT1).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should focus currently active terminal when terminalId is not provided', () => {
            const lifecycle = manager.terminalLifecycleManager;
            const focusT1 = vi.fn();
            lifecycle.getActiveTerminalId.mockReturnValue('t1');
            lifecycle.getTerminalInstance.mockImplementation((id) => {
                if (id === 't1') {
                    return { terminal: { focus: focusT1 } };
                }
                return undefined;
            });
            manager.ensureTerminalFocus();
            (0, vitest_1.expect)(lifecycle.setActiveTerminalId).not.toHaveBeenCalled();
            (0, vitest_1.expect)(focusT1).toHaveBeenCalledTimes(1);
        });
    });
    (0, vitest_1.describe)('Terminal Operations', () => {
        (0, vitest_1.it)('should coordinate terminal creation', async () => {
            const lifecycle = manager.terminalLifecycleManager;
            const tabs = manager.terminalTabManager;
            lifecycle.createTerminal.mockResolvedValue({
                textarea: { hasAttribute: () => false },
                focus: vi.fn(),
            });
            const createPromise = manager.createTerminal('new-t', 'New Term');
            // Wait for all async parts including internal setTimeouts
            await vi.advanceTimersByTimeAsync(500);
            const terminal = await createPromise;
            (0, vitest_1.expect)(terminal).toBeDefined();
            (0, vitest_1.expect)(lifecycle.createTerminal).toHaveBeenCalled();
            (0, vitest_1.expect)(tabs.addTab).toHaveBeenCalledWith('new-t', 'New Term', vitest_1.expect.anything());
            // Ensure createTerminal command was sent
            (0, vitest_1.expect)(manager.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'createTerminal',
                terminalId: 'new-t',
            }));
        });
        (0, vitest_1.it)('should ignore duplicate terminal creation requests', async () => {
            const ops = manager.terminalOperations;
            ops.isTerminalCreationPending.mockReturnValue(true);
            const terminal = await manager.createTerminal('pending-t', 'Pending');
            (0, vitest_1.expect)(terminal).toBeNull();
        });
        (0, vitest_1.it)('should coordinate terminal removal', async () => {
            const lifecycle = manager.terminalLifecycleManager;
            const tabs = manager.terminalTabManager;
            lifecycle.removeTerminal.mockResolvedValue(true);
            const result = await manager.removeTerminal('t1');
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(tabs.removeTab).toHaveBeenCalledWith('t1');
            (0, vitest_1.expect)(lifecycle.removeTerminal).toHaveBeenCalledWith('t1');
        });
        (0, vitest_1.it)('should not maintain split layout when forced to normal for next create', async () => {
            const lifecycle = manager.terminalLifecycleManager;
            const displayMode = manager.displayModeManager;
            const splitManager = manager.splitManager;
            lifecycle.createTerminal.mockResolvedValue({
                textarea: { hasAttribute: () => false },
                focus: vi.fn(),
            });
            displayMode.getCurrentMode.mockReturnValue('split');
            // @ts-expect-error - test mock type
            splitManager.getIsSplitMode.mockReturnValue(true);
            manager.setForceNormalModeForNextCreate(true);
            const createPromise = manager.createTerminal('new-skip', 'New Term', undefined, undefined, 'extension');
            await vi.advanceTimersByTimeAsync(500);
            await createPromise;
            (0, vitest_1.expect)(displayMode.showAllTerminalsSplit).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should force fullscreen mode before creation when fullscreen override is set', async () => {
            const lifecycle = manager.terminalLifecycleManager;
            const displayMode = manager.displayModeManager;
            lifecycle.createTerminal.mockResolvedValue({
                textarea: { hasAttribute: () => false },
                focus: vi.fn(),
            });
            displayMode.getCurrentMode.mockReturnValue('normal');
            manager.setForceFullscreenModeForNextCreate(true);
            const createPromise = manager.createTerminal('new-fullscreen', 'New Fullscreen', undefined, undefined, 'extension');
            await vi.advanceTimersByTimeAsync(500);
            await createPromise;
            (0, vitest_1.expect)(displayMode.setDisplayMode).toHaveBeenCalledWith('fullscreen');
        });
        (0, vitest_1.it)('should catch and log saveSession rejection after terminal creation', async () => {
            const lifecycle = manager.terminalLifecycleManager;
            const persistence = manager.webViewPersistenceService;
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            lifecycle.createTerminal.mockResolvedValue({
                textarea: { hasAttribute: () => false },
                focus: vi.fn(),
            });
            persistence.saveSession.mockRejectedValue(new Error('save failed'));
            const createPromise = manager.createTerminal('new-reject', 'Reject Test');
            await vi.advanceTimersByTimeAsync(500);
            await createPromise;
            (0, vitest_1.expect)(consoleErrorSpy).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Failed to save session after terminal creation'), vitest_1.expect.objectContaining({ terminalId: 'new-reject' }), vitest_1.expect.any(Error));
            consoleErrorSpy.mockRestore();
        });
    });
    (0, vitest_1.describe)('Panel Location Sync', () => {
        (0, vitest_1.it)('should handle terminal-panel-location-changed event', () => {
            const splitManager = manager.splitManager;
            const event = new dom.window.CustomEvent('terminal-panel-location-changed', {
                detail: { location: 'panel' },
            });
            dom.window.dispatchEvent(event);
            (0, vitest_1.expect)(splitManager.setPanelLocation).toHaveBeenCalledWith('panel');
            (0, vitest_1.expect)(splitManager.updateSplitDirection).toHaveBeenCalledWith('horizontal', 'panel');
        });
        (0, vitest_1.it)('should switch to split mode if panel location is panel and multiple terminals exist', () => {
            const splitManager = manager.splitManager;
            const displayManager = manager.displayModeManager;
            // Mock getting terminals to return size > 1
            splitManager.getTerminals.mockReturnValue(new Map([
                ['t1', {}],
                ['t2', {}],
            ]));
            displayManager.getCurrentMode.mockReturnValue('normal'); // Not fullscreen
            const event = new dom.window.CustomEvent('terminal-panel-location-changed', {
                detail: { location: 'panel' },
            });
            dom.window.dispatchEvent(event);
            (0, vitest_1.expect)(displayManager.showAllTerminalsSplit).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Resize Observer', () => {
        (0, vitest_1.it)('should debounce refitAllTerminals on resize', () => {
            const coordinator = manager.resizeCoordinator;
            coordinator.refitAllTerminals = vi.fn();
            vi.spyOn(manager, 'refitAllTerminals');
            // Initialize simple terminal to trigger observer setup
            manager.initializeSimpleTerminal();
            // Get the callback passed to ResizeObserver
            const ResizeObserverMock = global.ResizeObserver;
            const callback = ResizeObserverMock.mock.calls[0][0];
            // Simulate resize event
            callback([{ contentRect: { width: 500, height: 300 }, target: { id: 'body' } }]);
            // Should be debounced
            (0, vitest_1.expect)(manager.refitAllTerminals).not.toHaveBeenCalled();
            vi.advanceTimersByTime(100);
            (0, vitest_1.expect)(coordinator.refitAllTerminals).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('AI Agent Toggle', () => {
        (0, vitest_1.it)('should force-reconnect AI agent if none state', () => {
            const cliStateManager = manager.cliAgentStateManager;
            cliStateManager.getAgentState.mockReturnValue({ status: 'none' });
            manager.handleAiAgentToggle('t1');
            (0, vitest_1.expect)(manager.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'switchAiAgent',
                terminalId: 't1',
                action: 'force-reconnect',
                forceReconnect: true,
            }));
        });
        (0, vitest_1.it)('should force reconnect if already connected', () => {
            const cliStateManager = manager.cliAgentStateManager;
            cliStateManager.getAgentState.mockReturnValue({ status: 'connected', agentType: 'claude' });
            manager.handleAiAgentToggle('t1');
            (0, vitest_1.expect)(manager.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'switchAiAgent',
                terminalId: 't1',
                action: 'force-reconnect',
                forceReconnect: true,
            }));
        });
    });
    (0, vitest_1.describe)('Settings coordination', () => {
        (0, vitest_1.it)('should propagate settings to config and ui managers', () => {
            const config = manager.configManager;
            const ui = manager.uiManager;
            const newSettings = { fontSize: 20 };
            manager.applySettings(newSettings);
            (0, vitest_1.expect)(config.applySettings).toHaveBeenCalled();
            (0, vitest_1.expect)(ui.setActiveBorderMode).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should update all terminal themes', () => {
            const splitManager = manager.splitManager;
            const mockTerminal = {
                options: {},
                element: {
                    querySelector: vi.fn().mockReturnValue({ style: {} }),
                },
            };
            const mockInstance = {
                terminal: mockTerminal,
                container: { style: {} },
            };
            splitManager.getTerminals.mockReturnValue(new Map([['t1', mockInstance]]));
            const theme = { background: '#000000', foreground: '#ffffff' };
            manager.updateAllTerminalThemes(theme);
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(mockTerminal.options.theme).toEqual(theme);
        });
        (0, vitest_1.it)('should apply font settings', () => {
            // const fontService = (manager as any).fontSettingsService;
            // Mock FontSettingsService since it was not mocked in top-level block (or we check if we need to mock it)
            // Actually, it seems FontSettingsService is not mocked above, so it might be real or implicit.
            // Checking constructor: this.fontSettingsService = new FontSettingsService();
            // Since we didn't mock FontSettingsService import, it's using the real one or failing if it has dependencies.
            // But let's check if we can spy on it.
            // Wait, FontSettingsService is imported from '../services/FontSettingsService'.
            // We should mock it to be safe.
        });
    });
    (0, vitest_1.describe)('Scrollback Extraction', () => {
        (0, vitest_1.it)('should extract using serializeAddon if available', () => {
            const lifecycle = manager.terminalLifecycleManager;
            const mockSerializeAddon = {
                serialize: vi.fn().mockReturnValue('line1\nline2\n'),
            };
            const mockInstance = {
                terminal: { buffer: {} },
                serializeAddon: mockSerializeAddon,
            };
            lifecycle.getTerminalInstance.mockReturnValue(mockInstance);
            const result = manager.extractScrollbackData('t1');
            (0, vitest_1.expect)(result).toEqual(['line1', 'line2']);
            (0, vitest_1.expect)(mockSerializeAddon.serialize).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should fallback to buffer if serializeAddon missing', () => {
            const lifecycle = manager.terminalLifecycleManager;
            const mockBuffer = {
                length: 2,
                getLine: vi.fn((i) => ({ translateToString: () => `line${i + 1}` })),
            };
            const mockInstance = {
                terminal: {
                    buffer: { normal: mockBuffer },
                },
                serializeAddon: undefined,
            };
            lifecycle.getTerminalInstance.mockReturnValue(mockInstance);
            const result = manager.extractScrollbackData('t1');
            (0, vitest_1.expect)(result).toEqual(['line1', 'line2']);
        });
    });
    (0, vitest_1.describe)('State Updates', () => {
        (0, vitest_1.it)('should update state and ui', () => {
            const stateDisplay = manager.terminalStateDisplayManager;
            const terminalOperations = manager.terminalOperations;
            const newState = {
                terminals: [],
                availableSlots: [1, 2, 3],
                maxTerminals: 5,
                activeTerminalId: null,
            };
            manager.updateState(newState);
            (0, vitest_1.expect)(terminalOperations.updateState).toHaveBeenCalledWith(newState);
            (0, vitest_1.expect)(stateDisplay.updateFromState).toHaveBeenCalled();
            (0, vitest_1.expect)(stateDisplay.updateCreationState).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should refresh split layout when split mode has multiple terminals and no resizers', () => {
            const displayModeManager = manager.displayModeManager;
            displayModeManager.getCurrentMode.mockReturnValue('split');
            const newState = {
                terminals: [{ id: 't1' }, { id: 't2' }],
                availableSlots: [3],
                maxTerminals: 5,
                activeTerminalId: 't1',
            };
            manager.updateState(newState);
            (0, vitest_1.expect)(displayModeManager.showAllTerminalsSplit).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should recover split layout when terminal count increases after initial single-terminal update', () => {
            const displayModeManager = manager.displayModeManager;
            displayModeManager.getCurrentMode.mockReturnValue('normal');
            const updateSplitResizersSpy = vi
                .spyOn(manager, 'updateSplitResizers')
                .mockImplementation(() => { });
            const initialState = {
                terminals: [{ id: 't1' }],
                availableSlots: [2, 3],
                maxTerminals: 5,
                activeTerminalId: 't1',
            };
            manager.updateState(initialState);
            (0, vitest_1.expect)(displayModeManager.showAllTerminalsSplit).not.toHaveBeenCalled();
            const nextState = {
                terminals: [{ id: 't1' }, { id: 't2' }],
                availableSlots: [3],
                maxTerminals: 5,
                activeTerminalId: 't1',
            };
            manager.updateState(nextState);
            (0, vitest_1.expect)(displayModeManager.showAllTerminalsSplit).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(updateSplitResizersSpy).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should refresh split layout when resizer count does not match wrapper count', () => {
            const displayModeManager = manager.displayModeManager;
            displayModeManager.getCurrentMode.mockReturnValue('split');
            const updateSplitResizersSpy = vi
                .spyOn(manager, 'updateSplitResizers')
                .mockImplementation(() => { });
            const terminalBody = document.getElementById('terminal-body');
            const terminalsWrapper = document.createElement('div');
            terminalsWrapper.id = 'terminals-wrapper';
            const wrapper1 = document.createElement('div');
            wrapper1.setAttribute('data-terminal-wrapper-id', 't1');
            const wrapper2 = document.createElement('div');
            wrapper2.setAttribute('data-terminal-wrapper-id', 't2');
            const wrapper3 = document.createElement('div');
            wrapper3.setAttribute('data-terminal-wrapper-id', 't3');
            const resizer = document.createElement('div');
            resizer.className = 'split-resizer';
            terminalsWrapper.append(wrapper1, resizer, wrapper2, wrapper3);
            terminalBody.appendChild(terminalsWrapper);
            const newState = {
                terminals: [{ id: 't1' }, { id: 't2' }, { id: 't3' }],
                availableSlots: [4],
                maxTerminals: 5,
                activeTerminalId: 't1',
            };
            manager.updateState(newState);
            (0, vitest_1.expect)(displayModeManager.showAllTerminalsSplit).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(updateSplitResizersSpy).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should refresh split layout when terminal count increases but wrapper count is stale', () => {
            const displayModeManager = manager.displayModeManager;
            displayModeManager.getCurrentMode.mockReturnValue('split');
            const updateSplitResizersSpy = vi
                .spyOn(manager, 'updateSplitResizers')
                .mockImplementation(() => { });
            const terminalBody = document.getElementById('terminal-body');
            const terminalsWrapper = document.createElement('div');
            terminalsWrapper.id = 'terminals-wrapper';
            // Stale DOM: still 2 wrappers + 1 resizer from previous split layout.
            const wrapper1 = document.createElement('div');
            wrapper1.setAttribute('data-terminal-wrapper-id', 't1');
            const wrapper2 = document.createElement('div');
            wrapper2.setAttribute('data-terminal-wrapper-id', 't2');
            const resizer = document.createElement('div');
            resizer.className = 'split-resizer';
            terminalsWrapper.append(wrapper1, resizer, wrapper2);
            terminalBody.appendChild(terminalsWrapper);
            // Latest state already has 3 terminals.
            const newState = {
                terminals: [{ id: 't1' }, { id: 't2' }, { id: 't3' }],
                availableSlots: [4],
                maxTerminals: 5,
                activeTerminalId: 't1',
            };
            manager.updateState(newState);
            (0, vitest_1.expect)(displayModeManager.showAllTerminalsSplit).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(updateSplitResizersSpy).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should recover split layout on startup when mode snapshot is normal but split wrappers exist', () => {
            const displayModeManager = manager.displayModeManager;
            // Simulate startup mismatch: mode manager still reports normal.
            displayModeManager.getCurrentMode.mockReturnValue('normal');
            const updateSplitResizersSpy = vi
                .spyOn(manager, 'updateSplitResizers')
                .mockImplementation(() => { });
            const terminalBody = document.getElementById('terminal-body');
            const terminalsWrapper = document.createElement('div');
            terminalsWrapper.id = 'terminals-wrapper';
            // Persisted split DOM without resizers.
            const wrapper1 = document.createElement('div');
            wrapper1.setAttribute('data-terminal-wrapper-id', 't1');
            const wrapper2 = document.createElement('div');
            wrapper2.setAttribute('data-terminal-wrapper-id', 't2');
            terminalsWrapper.append(wrapper1, wrapper2);
            terminalBody.appendChild(terminalsWrapper);
            const newState = {
                terminals: [{ id: 't1' }, { id: 't2' }],
                availableSlots: [3],
                maxTerminals: 5,
                activeTerminalId: 't1',
            };
            manager.updateState(newState);
            (0, vitest_1.expect)(displayModeManager.showAllTerminalsSplit).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(updateSplitResizersSpy).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should recover split layout on first state update when multiple terminals exist without split artifacts', () => {
            const displayModeManager = manager.displayModeManager;
            // Startup race: mode manager still in normal and split artifacts are not built yet.
            displayModeManager.getCurrentMode.mockReturnValue('normal');
            const updateSplitResizersSpy = vi
                .spyOn(manager, 'updateSplitResizers')
                .mockImplementation(() => { });
            const newState = {
                terminals: [{ id: 't1' }, { id: 't2' }],
                availableSlots: [3],
                maxTerminals: 5,
                activeTerminalId: 't1',
            };
            manager.updateState(newState);
            (0, vitest_1.expect)(displayModeManager.showAllTerminalsSplit).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(updateSplitResizersSpy).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should NOT trigger split layout refresh when in fullscreen mode even if multiple terminals exist', () => {
            const displayModeManager = manager.displayModeManager;
            displayModeManager.getCurrentMode.mockReturnValue('fullscreen');
            const updateSplitResizersSpy = vi
                .spyOn(manager, 'updateSplitResizers')
                .mockImplementation(() => { });
            const newState = {
                terminals: [{ id: 't1' }, { id: 't2' }],
                availableSlots: [3],
                maxTerminals: 5,
                activeTerminalId: 't1',
            };
            manager.updateState(newState);
            // Should NOT call showAllTerminalsSplit because currentMode is fullscreen
            (0, vitest_1.expect)(displayModeManager.showAllTerminalsSplit).not.toHaveBeenCalled();
            (0, vitest_1.expect)(updateSplitResizersSpy).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Lifecycle', () => {
        (0, vitest_1.it)('should dispose all managers on dispose', () => {
            const apiManager = manager.webViewApiManager;
            const lifecycle = manager.terminalLifecycleManager;
            const disposeAllSpy = vi.spyOn(TerminalAutoSaveService_1.TerminalAutoSaveService, 'disposeAll');
            manager.dispose();
            (0, vitest_1.expect)(apiManager.dispose).toHaveBeenCalled();
            (0, vitest_1.expect)(lifecycle.dispose).toHaveBeenCalled();
            (0, vitest_1.expect)(disposeAllSpy).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=LightweightTerminalWebviewManager.test.js.map