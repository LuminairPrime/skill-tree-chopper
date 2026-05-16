"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const LightweightTerminalLifecycleCoordinator_1 = require("../../../../../webview/coordinators/LightweightTerminalLifecycleCoordinator");
(0, vitest_1.describe)('LightweightTerminalLifecycleCoordinator', () => {
    let coordinator;
    let dependencies;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.useFakeTimers();
        dependencies = {
            terminalOperations: {
                isTerminalCreationPending: vitest_1.vi.fn().mockReturnValue(false),
                markTerminalCreationPending: vitest_1.vi.fn(),
                clearTerminalCreationPending: vitest_1.vi.fn(),
            },
            terminalLifecycleManager: {
                createTerminal: vitest_1.vi.fn().mockResolvedValue({
                    textarea: { hasAttribute: () => false },
                    focus: vitest_1.vi.fn(),
                }),
                removeTerminal: vitest_1.vi.fn().mockResolvedValue(true),
                switchToTerminal: vitest_1.vi.fn().mockResolvedValue(true),
                resizeAllTerminals: vitest_1.vi.fn(),
            },
            terminalTabManager: {
                addTab: vitest_1.vi.fn(),
                setActiveTab: vitest_1.vi.fn(),
                removeTab: vitest_1.vi.fn(),
            },
            webViewPersistenceService: {
                addTerminal: vitest_1.vi.fn(),
                removeTerminal: vitest_1.vi.fn(),
                saveSession: vitest_1.vi.fn().mockResolvedValue(true),
            },
            splitManager: {
                getTerminals: vitest_1.vi.fn().mockReturnValue(new Map()),
                getTerminalContainers: vitest_1.vi.fn().mockReturnValue(new Map()),
                getIsSplitMode: vitest_1.vi.fn().mockReturnValue(false),
            },
            displayModeManager: {
                getCurrentMode: vitest_1.vi.fn().mockReturnValue('normal'),
                setDisplayMode: vitest_1.vi.fn(),
                showAllTerminalsSplit: vitest_1.vi.fn(),
            },
            uiManager: {
                updateTerminalBorders: vitest_1.vi.fn(),
            },
            cliAgentStateManager: {
                removeTerminalState: vitest_1.vi.fn(),
            },
            performanceManager: {
                removeTerminal: vitest_1.vi.fn(),
            },
            getTerminalInstance: vitest_1.vi.fn().mockReturnValue(undefined),
            getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('active-1'),
            setActiveTerminalId: vitest_1.vi.fn(),
            canCreateTerminal: vitest_1.vi.fn().mockReturnValue(true),
            getCurrentTerminalState: vitest_1.vi.fn().mockReturnValue(null),
            getForceNormalModeForNextCreate: vitest_1.vi.fn().mockReturnValue(false),
            setForceNormalModeForNextCreate: vitest_1.vi.fn(),
            getForceFullscreenModeForNextCreate: vitest_1.vi.fn().mockReturnValue(false),
            setForceFullscreenModeForNextCreate: vitest_1.vi.fn(),
            requestLatestState: vitest_1.vi.fn(),
            showTerminalLimitMessage: vitest_1.vi.fn(),
            postMessageToExtension: vitest_1.vi.fn(),
        };
        coordinator = new LightweightTerminalLifecycleCoordinator_1.LightweightTerminalLifecycleCoordinator(dependencies);
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.useRealTimers();
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)('skips duplicate terminal creation requests that are already pending', async () => {
        const existingTerminal = { focus: vitest_1.vi.fn() };
        dependencies.terminalOperations.isTerminalCreationPending.mockReturnValue(true);
        dependencies.getTerminalInstance.mockReturnValue({ terminal: existingTerminal });
        const terminal = await coordinator.createTerminal({
            terminalId: 'terminal-1',
            terminalName: 'Terminal 1',
            config: undefined,
            terminalNumber: undefined,
            requestSource: 'webview',
        });
        (0, vitest_1.expect)(terminal).toBe(existingTerminal);
        (0, vitest_1.expect)(dependencies.terminalLifecycleManager.createTerminal).not.toHaveBeenCalled();
        (0, vitest_1.expect)(dependencies.terminalOperations.markTerminalCreationPending).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('creates a terminal and performs tab, persistence, and extension post-processing', async () => {
        const terminal = await coordinator.createTerminal({
            terminalId: 'terminal-2',
            terminalName: 'Terminal 2',
            config: undefined,
            terminalNumber: undefined,
            requestSource: 'webview',
        });
        await vitest_1.vi.advanceTimersByTimeAsync(200);
        (0, vitest_1.expect)(terminal).toBeDefined();
        (0, vitest_1.expect)(dependencies.terminalOperations.markTerminalCreationPending).toHaveBeenCalledWith('terminal-2');
        (0, vitest_1.expect)(dependencies.terminalLifecycleManager.createTerminal).toHaveBeenCalledWith('terminal-2', 'Terminal 2', undefined, undefined);
        (0, vitest_1.expect)(dependencies.terminalTabManager.addTab).toHaveBeenCalledWith('terminal-2', 'Terminal 2', vitest_1.expect.anything());
        (0, vitest_1.expect)(dependencies.webViewPersistenceService.addTerminal).toHaveBeenCalledWith('terminal-2', vitest_1.expect.anything(), { autoSave: true });
        (0, vitest_1.expect)(dependencies.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ command: 'createTerminal', terminalId: 'terminal-2' }));
        (0, vitest_1.expect)(dependencies.terminalOperations.clearTerminalCreationPending).toHaveBeenCalledWith('terminal-2');
    });
    (0, vitest_1.it)('removes a terminal and schedules session persistence refresh', async () => {
        const result = await coordinator.removeTerminal('terminal-3');
        (0, vitest_1.expect)(result).toBe(true);
        (0, vitest_1.expect)(dependencies.cliAgentStateManager.removeTerminalState).toHaveBeenCalledWith('terminal-3');
        (0, vitest_1.expect)(dependencies.webViewPersistenceService.removeTerminal).toHaveBeenCalledWith('terminal-3');
        (0, vitest_1.expect)(dependencies.terminalTabManager.removeTab).toHaveBeenCalledWith('terminal-3');
        (0, vitest_1.expect)(dependencies.terminalLifecycleManager.removeTerminal).toHaveBeenCalledWith('terminal-3');
        await vitest_1.vi.advanceTimersByTimeAsync(100);
        (0, vitest_1.expect)(dependencies.webViewPersistenceService.saveSession).toHaveBeenCalled();
    });
    (0, vitest_1.it)('removes terminal performance buffers before lifecycle removal when an instance exists', async () => {
        const terminal = { write: vitest_1.vi.fn() };
        dependencies.getTerminalInstance.mockReturnValue({ terminal });
        const result = await coordinator.removeTerminal('terminal-3');
        (0, vitest_1.expect)(result).toBe(true);
        (0, vitest_1.expect)(dependencies.performanceManager.removeTerminal).toHaveBeenCalledWith(terminal);
        (0, vitest_1.expect)(dependencies.terminalLifecycleManager.removeTerminal).toHaveBeenCalledWith('terminal-3');
    });
    (0, vitest_1.it)('updates borders after a successful terminal switch', async () => {
        const result = await coordinator.switchToTerminal('terminal-4');
        (0, vitest_1.expect)(result).toBe(true);
        (0, vitest_1.expect)(dependencies.terminalLifecycleManager.switchToTerminal).toHaveBeenCalledWith('terminal-4');
        (0, vitest_1.expect)(dependencies.uiManager.updateTerminalBorders).toHaveBeenCalledWith('terminal-4', vitest_1.expect.any(Map));
    });
    (0, vitest_1.it)('prepares display for deletion by exiting fullscreen when multiple terminals exist', () => {
        dependencies.displayModeManager.getCurrentMode.mockReturnValue('fullscreen');
        coordinator.prepareDisplayForTerminalDeletion('terminal-5', {
            totalTerminals: 2,
            activeTerminalId: 'terminal-5',
            terminalIds: ['terminal-5', 'terminal-6'],
        });
        (0, vitest_1.expect)(dependencies.displayModeManager.setDisplayMode).toHaveBeenCalledWith('split');
    });
});
//# sourceMappingURL=LightweightTerminalLifecycleCoordinator.test.js.map