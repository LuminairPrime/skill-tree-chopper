"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const SplitManager_1 = require("../../../../../../webview/managers/SplitManager");
const TerminalLifecycleService_1 = require("../../../../../../webview/services/terminal/TerminalLifecycleService");
vitest_1.vi.mock('../../../../../../webview/optimizers/RenderingOptimizer', () => ({
    RenderingOptimizer: class {
        constructor() {
            this.setupOptimizedResize = vitest_1.vi.fn();
            this.enableWebGL = vitest_1.vi.fn();
            this.setupSmoothScrolling = vitest_1.vi.fn();
            this.dispose = vitest_1.vi.fn();
        }
    },
}));
(0, vitest_1.describe)('TerminalLifecycleService', () => {
    let dom;
    let splitManager;
    let service;
    let coordinator;
    let terminal;
    let fitAddon;
    let container;
    let terminalContent;
    let containerManager;
    let displayModeManager;
    let scrollIndicatorDisposables;
    (0, vitest_1.beforeEach)(() => {
        dom = new jsdom_1.JSDOM('<!DOCTYPE html><body></body>');
        vitest_1.vi.useFakeTimers();
        vitest_1.vi.stubGlobal('window', dom.window);
        vitest_1.vi.stubGlobal('document', dom.window.document);
        vitest_1.vi.stubGlobal('HTMLElement', dom.window.HTMLElement);
        vitest_1.vi.stubGlobal('Element', dom.window.Element);
        vitest_1.vi.stubGlobal('requestAnimationFrame', (callback) => {
            callback(0);
            return 1;
        });
        splitManager = new SplitManager_1.SplitManager({ postMessageToExtension: vitest_1.vi.fn() });
        containerManager = {
            registerContainer: vitest_1.vi.fn(),
            unregisterContainer: vitest_1.vi.fn(),
            clearSplitArtifacts: vitest_1.vi.fn(),
            applyDisplayState: vitest_1.vi.fn(),
        };
        displayModeManager = {
            getCurrentMode: vitest_1.vi.fn().mockReturnValue('normal'),
            setDisplayMode: vitest_1.vi.fn(),
            showAllTerminalsSplit: vitest_1.vi.fn(),
        };
        coordinator = {
            postMessageToExtension: vitest_1.vi.fn(),
            getTerminalContainerManager: vitest_1.vi.fn().mockReturnValue(containerManager),
            getDisplayModeManager: vitest_1.vi.fn().mockReturnValue(displayModeManager),
            getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('terminal-1'),
            inputManager: {
                addXtermClickHandler: vitest_1.vi.fn(),
                removeTerminalHandlers: vitest_1.vi.fn(),
            },
        };
        terminal = {
            cols: 80,
            rows: 24,
            dispose: vitest_1.vi.fn(),
            refresh: vitest_1.vi.fn(),
        };
        fitAddon = {
            fit: vitest_1.vi.fn(),
        };
        container = document.createElement('div');
        container.getBoundingClientRect = () => ({
            width: 800,
            height: 600,
        });
        terminalContent = document.createElement('div');
        const xterm = document.createElement('div');
        xterm.className = 'xterm';
        const viewport = document.createElement('div');
        viewport.className = 'xterm-viewport';
        container.appendChild(xterm);
        container.appendChild(viewport);
        scrollIndicatorDisposables = new Map();
        service = new TerminalLifecycleService_1.TerminalLifecycleService({
            splitManager,
            coordinator,
            linkManager: {
                setLinkModifier: vitest_1.vi.fn(),
                registerTerminalLinkHandlers: vitest_1.vi.fn(),
                unregisterTerminalLinkProvider: vitest_1.vi.fn(),
            },
            scrollbarService: {
                enableScrollbarDisplay: vitest_1.vi.fn(),
            },
            mouseTrackingService: {
                setup: vitest_1.vi.fn(),
                cleanup: vitest_1.vi.fn(),
            },
            scrollIndicatorService: {
                attach: vitest_1.vi.fn().mockReturnValue(vitest_1.vi.fn()),
            },
            autoSaveService: {
                setupScrollbackAutoSave: vitest_1.vi.fn(),
            },
            lifecycleController: {
                disposeTerminal: vitest_1.vi.fn(),
            },
            eventManager: {
                removeTerminalEvents: vitest_1.vi.fn(),
            },
            scrollIndicatorDisposables,
        });
    });
    (0, vitest_1.afterEach)(() => {
        dom.window.close();
        vitest_1.vi.useRealTimers();
        vitest_1.vi.restoreAllMocks();
        vitest_1.vi.unstubAllGlobals();
    });
    (0, vitest_1.it)('registers the terminal instance, container, and input handlers during finalization', async () => {
        const terminalInstance = await service.finalizeTerminalSetup({
            terminalId: 'terminal-1',
            terminalName: 'Terminal 1',
            terminal,
            fitAddon,
            // @ts-expect-error - test mock type
            serializeAddon: { serialize: vitest_1.vi.fn() },
            searchAddon: undefined,
            container,
            terminalContent,
            containerElements: { container, body: terminalContent },
            terminalNumberToUse: 1,
            terminalConfig: { enableGpuAcceleration: false },
            linkModifier: 'alt',
            config: undefined,
            uiManager: { headerElementsCache: new Map() },
        });
        vitest_1.vi.runAllTimers();
        (0, vitest_1.expect)(splitManager.getTerminals().get('terminal-1')).toBe(terminalInstance);
        (0, vitest_1.expect)(splitManager.getTerminalContainers().get('terminal-1')).toBe(container);
        (0, vitest_1.expect)(containerManager.registerContainer).toHaveBeenCalledWith('terminal-1', container);
        (0, vitest_1.expect)(coordinator.inputManager.addXtermClickHandler).toHaveBeenCalledWith(terminal, 'terminal-1', container, coordinator);
        (0, vitest_1.expect)(coordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ command: 'terminalReady', terminalId: 'terminal-1' }));
    });
    (0, vitest_1.it)('removes the terminal, unregisters the container, and clears split artifacts when one remains', async () => {
        splitManager.getTerminals().set('terminal-1', {
            id: 'terminal-1',
            terminal,
            fitAddon,
            container,
            name: 'Terminal 1',
            isActive: false,
            number: 1,
            renderingOptimizer: {
                dispose: vitest_1.vi.fn(),
            },
        });
        splitManager.getTerminalContainers().set('terminal-1', container);
        const result = await service.removeTerminal('terminal-1');
        (0, vitest_1.expect)(result).toBe(true);
        (0, vitest_1.expect)(splitManager.getTerminals().has('terminal-1')).toBe(false);
        (0, vitest_1.expect)(splitManager.getTerminalContainers().has('terminal-1')).toBe(false);
        (0, vitest_1.expect)(containerManager.unregisterContainer).toHaveBeenCalledWith('terminal-1');
        (0, vitest_1.expect)(containerManager.clearSplitArtifacts).toHaveBeenCalled();
        (0, vitest_1.expect)(terminal.dispose).toHaveBeenCalled();
    });
});
//# sourceMappingURL=TerminalLifecycleService.test.js.map