"use strict";
/**
 * TabEventCoordinator Unit Tests
 *
 * Tests for the extracted event coordination logic from TerminalTabManager.
 * Covers: tab click, close, rename, reorder, new tab, mode toggle,
 * and display mode transition handling.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TabEventCoordinator_1 = require("../../../../../webview/managers/TabEventCoordinator");
vitest_1.vi.mock('../../../../../utils/logger', () => ({
    webview: vitest_1.vi.fn(),
}));
function createMockDeps(overrides = {}) {
    return {
        getCoordinator: vitest_1.vi.fn().mockReturnValue({
            setActiveTerminalId: vitest_1.vi.fn(),
            postMessageToExtension: vitest_1.vi.fn(),
            getManagers: vitest_1.vi.fn().mockReturnValue({
                terminalContainer: { reorderContainers: vitest_1.vi.fn() },
                notification: { showWarning: vitest_1.vi.fn() },
            }),
            createTerminal: vitest_1.vi.fn(),
            closeTerminal: vitest_1.vi.fn(),
            getDisplayModeManager: vitest_1.vi.fn().mockReturnValue({
                getCurrentMode: vitest_1.vi.fn().mockReturnValue('normal'),
                setDisplayMode: vitest_1.vi.fn(),
                showTerminalFullscreen: vitest_1.vi.fn(),
                showAllTerminalsSplit: vitest_1.vi.fn(),
                toggleSplitMode: vitest_1.vi.fn(),
            }),
        }),
        getTabCount: vitest_1.vi.fn().mockReturnValue(2),
        getTabOrder: vitest_1.vi.fn().mockReturnValue(['t1', 't2']),
        hasTab: vitest_1.vi.fn().mockReturnValue(true),
        setActiveTab: vitest_1.vi.fn(),
        setTabOrder: vitest_1.vi.fn(),
        rebuildTabsInOrder: vitest_1.vi.fn(),
        hasPendingDeletion: vitest_1.vi.fn().mockReturnValue(false),
        addPendingDeletion: vitest_1.vi.fn(),
        ...overrides,
    };
}
(0, vitest_1.describe)('TabEventCoordinator', () => {
    let coordinator;
    let deps;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.useFakeTimers();
        deps = createMockDeps();
        coordinator = new TabEventCoordinator_1.TabEventCoordinator(deps);
    });
    (0, vitest_1.afterEach)(() => {
        coordinator.dispose();
        vitest_1.vi.useRealTimers();
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('onTabClick', () => {
        (0, vitest_1.it)('should set active terminal and tab on click', () => {
            const mockCoord = deps.getCoordinator();
            coordinator.onTabClick('t1');
            (0, vitest_1.expect)(mockCoord.setActiveTerminalId).toHaveBeenCalledWith('t1');
            (0, vitest_1.expect)(deps.setActiveTab).toHaveBeenCalledWith('t1');
        });
        (0, vitest_1.it)('should switch fullscreen terminal when in fullscreen mode', () => {
            const displayManager = {
                getCurrentMode: vitest_1.vi.fn().mockReturnValue('fullscreen'),
                setDisplayMode: vitest_1.vi.fn(),
                showTerminalFullscreen: vitest_1.vi.fn(),
                showAllTerminalsSplit: vitest_1.vi.fn(),
                toggleSplitMode: vitest_1.vi.fn(),
            };
            const mockCoord = deps.getCoordinator();
            mockCoord.getDisplayModeManager.mockReturnValue(displayManager);
            coordinator.onTabClick('t1');
            (0, vitest_1.expect)(displayManager.showTerminalFullscreen).toHaveBeenCalledWith('t1');
        });
        (0, vitest_1.it)('should do nothing when coordinator is null', () => {
            deps = createMockDeps({ getCoordinator: vitest_1.vi.fn().mockReturnValue(null) });
            coordinator = new TabEventCoordinator_1.TabEventCoordinator(deps);
            coordinator.onTabClick('t1');
            (0, vitest_1.expect)(deps.setActiveTab).toHaveBeenCalledWith('t1');
        });
    });
    (0, vitest_1.describe)('onTabClose', () => {
        (0, vitest_1.it)('should prevent closing the last tab', () => {
            deps = createMockDeps({ getTabCount: vitest_1.vi.fn().mockReturnValue(1) });
            coordinator = new TabEventCoordinator_1.TabEventCoordinator(deps);
            const mockCoord = deps.getCoordinator();
            coordinator.onTabClose('t1');
            const notifManager = mockCoord.getManagers().notification;
            (0, vitest_1.expect)(notifManager.showWarning).toHaveBeenCalled();
            (0, vitest_1.expect)(mockCoord.closeTerminal).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should skip if deletion is already pending', () => {
            deps = createMockDeps({ hasPendingDeletion: vitest_1.vi.fn().mockReturnValue(true) });
            coordinator = new TabEventCoordinator_1.TabEventCoordinator(deps);
            const mockCoord = deps.getCoordinator();
            coordinator.onTabClose('t1');
            (0, vitest_1.expect)(mockCoord.closeTerminal).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should mark as pending deletion and close terminal', () => {
            coordinator.onTabClose('t1');
            (0, vitest_1.expect)(deps.addPendingDeletion).toHaveBeenCalledWith('t1');
            const mockCoord = deps.getCoordinator();
            (0, vitest_1.expect)(mockCoord.closeTerminal).toHaveBeenCalledWith('t1');
        });
        (0, vitest_1.it)('should handle fullscreen mode after close', () => {
            const displayManager = {
                getCurrentMode: vitest_1.vi.fn().mockReturnValue('fullscreen'),
                setDisplayMode: vitest_1.vi.fn(),
                showTerminalFullscreen: vitest_1.vi.fn(),
                showAllTerminalsSplit: vitest_1.vi.fn(),
                toggleSplitMode: vitest_1.vi.fn(),
            };
            const mockCoord = deps.getCoordinator();
            mockCoord.getDisplayModeManager.mockReturnValue(displayManager);
            deps = createMockDeps({
                getCoordinator: vitest_1.vi.fn().mockReturnValue(mockCoord),
                getTabCount: vitest_1.vi.fn().mockReturnValue(3),
                getTabOrder: vitest_1.vi.fn().mockReturnValue(['t1', 't2', 't3']),
            });
            coordinator = new TabEventCoordinator_1.TabEventCoordinator(deps);
            coordinator.onTabClose('t1');
            vitest_1.vi.advanceTimersByTime(60);
            (0, vitest_1.expect)(displayManager.showTerminalFullscreen).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should switch to normal mode when only one remains after split close', () => {
            const displayManager = {
                getCurrentMode: vitest_1.vi.fn().mockReturnValue('split'),
                setDisplayMode: vitest_1.vi.fn(),
                showTerminalFullscreen: vitest_1.vi.fn(),
                showAllTerminalsSplit: vitest_1.vi.fn(),
                toggleSplitMode: vitest_1.vi.fn(),
            };
            const mockCoord = deps.getCoordinator();
            mockCoord.getDisplayModeManager.mockReturnValue(displayManager);
            // 2 tabs, closing one leaves 1
            deps = createMockDeps({
                getCoordinator: vitest_1.vi.fn().mockReturnValue(mockCoord),
                getTabCount: vitest_1.vi.fn().mockReturnValue(2),
                getTabOrder: vitest_1.vi.fn().mockReturnValue(['t1', 't2']),
            });
            coordinator = new TabEventCoordinator_1.TabEventCoordinator(deps);
            coordinator.onTabClose('t1');
            vitest_1.vi.advanceTimersByTime(60);
            (0, vitest_1.expect)(displayManager.setDisplayMode).toHaveBeenCalledWith('normal');
        });
    });
    (0, vitest_1.describe)('onTabRename', () => {
        (0, vitest_1.it)('should notify coordinator about name change', () => {
            const mockCoord = deps.getCoordinator();
            coordinator.onTabRename('t1', 'New Name');
            (0, vitest_1.expect)(mockCoord.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'renameTerminal',
                terminalId: 't1',
                newName: 'New Name',
            }));
        });
    });
    (0, vitest_1.describe)('onTabReorder', () => {
        (0, vitest_1.it)('should update tab order and notify coordinator', () => {
            coordinator.onTabReorder(0, 1, ['t2', 't1']);
            (0, vitest_1.expect)(deps.setTabOrder).toHaveBeenCalledWith(['t2', 't1']);
            (0, vitest_1.expect)(deps.rebuildTabsInOrder).toHaveBeenCalled();
            const mockCoord = deps.getCoordinator();
            (0, vitest_1.expect)(mockCoord.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'reorderTerminals',
                order: ['t2', 't1'],
            }));
        });
        (0, vitest_1.it)('should skip reorder if order is unchanged', () => {
            deps = createMockDeps({ getTabOrder: vitest_1.vi.fn().mockReturnValue(['t1', 't2']) });
            coordinator = new TabEventCoordinator_1.TabEventCoordinator(deps);
            coordinator.onTabReorder(0, 0, ['t1', 't2']);
            (0, vitest_1.expect)(deps.setTabOrder).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should skip reorder if nextOrder is empty', () => {
            coordinator.onTabReorder(0, 1, []);
            (0, vitest_1.expect)(deps.setTabOrder).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should filter out unknown tab IDs and append remaining', () => {
            deps = createMockDeps({
                getTabOrder: vitest_1.vi.fn().mockReturnValue(['t1', 't2', 't3']),
                hasTab: vitest_1.vi.fn().mockImplementation((id) => ['t1', 't2', 't3'].includes(id)),
            });
            coordinator = new TabEventCoordinator_1.TabEventCoordinator(deps);
            // nextOrder includes only t2, t1 (valid) - t3 should be appended
            coordinator.onTabReorder(0, 1, ['t2', 't1']);
            (0, vitest_1.expect)(deps.setTabOrder).toHaveBeenCalledWith(['t2', 't1', 't3']);
        });
    });
    (0, vitest_1.describe)('onNewTab', () => {
        (0, vitest_1.it)('should create a new terminal via coordinator', () => {
            const mockCoord = deps.getCoordinator();
            coordinator.onNewTab();
            (0, vitest_1.expect)(mockCoord.createTerminal).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should do nothing when coordinator is null', () => {
            deps = createMockDeps({ getCoordinator: vitest_1.vi.fn().mockReturnValue(null) });
            coordinator = new TabEventCoordinator_1.TabEventCoordinator(deps);
            coordinator.onNewTab();
            // No error thrown
        });
        (0, vitest_1.it)('should switch to split mode before creating terminal in fullscreen', () => {
            const displayManager = {
                getCurrentMode: vitest_1.vi.fn().mockReturnValue('fullscreen'),
                setDisplayMode: vitest_1.vi.fn(),
                showTerminalFullscreen: vitest_1.vi.fn(),
                showAllTerminalsSplit: vitest_1.vi.fn(),
                toggleSplitMode: vitest_1.vi.fn(),
            };
            const mockCoord = deps.getCoordinator();
            mockCoord.getDisplayModeManager.mockReturnValue(displayManager);
            deps = createMockDeps({
                getCoordinator: vitest_1.vi.fn().mockReturnValue(mockCoord),
                getTabCount: vitest_1.vi.fn().mockReturnValue(1),
            });
            coordinator = new TabEventCoordinator_1.TabEventCoordinator(deps);
            coordinator.onNewTab();
            (0, vitest_1.expect)(displayManager.showAllTerminalsSplit).toHaveBeenCalled();
            vitest_1.vi.advanceTimersByTime(300);
            (0, vitest_1.expect)(mockCoord.createTerminal).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('onModeToggle', () => {
        (0, vitest_1.it)('should toggle from fullscreen to split when multiple tabs', () => {
            const displayManager = {
                getCurrentMode: vitest_1.vi.fn().mockReturnValue('fullscreen'),
                setDisplayMode: vitest_1.vi.fn(),
                showTerminalFullscreen: vitest_1.vi.fn(),
                showAllTerminalsSplit: vitest_1.vi.fn(),
                toggleSplitMode: vitest_1.vi.fn(),
            };
            const mockCoord = deps.getCoordinator();
            mockCoord.getDisplayModeManager.mockReturnValue(displayManager);
            deps = createMockDeps({
                getCoordinator: vitest_1.vi.fn().mockReturnValue(mockCoord),
                getTabCount: vitest_1.vi.fn().mockReturnValue(2),
            });
            coordinator = new TabEventCoordinator_1.TabEventCoordinator(deps);
            coordinator.onModeToggle();
            (0, vitest_1.expect)(displayManager.toggleSplitMode).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should switch to fullscreen when active tab exists and not in fullscreen', () => {
            const displayManager = {
                getCurrentMode: vitest_1.vi.fn().mockReturnValue('normal'),
                setDisplayMode: vitest_1.vi.fn(),
                showTerminalFullscreen: vitest_1.vi.fn(),
                showAllTerminalsSplit: vitest_1.vi.fn(),
                toggleSplitMode: vitest_1.vi.fn(),
            };
            const mockCoord = deps.getCoordinator();
            mockCoord.getDisplayModeManager.mockReturnValue(displayManager);
            deps = createMockDeps({
                getCoordinator: vitest_1.vi.fn().mockReturnValue(mockCoord),
                getTabCount: vitest_1.vi.fn().mockReturnValue(1),
            });
            coordinator = new TabEventCoordinator_1.TabEventCoordinator(deps);
            // Need getActiveTabId
            coordinator.setActiveTabIdGetter(() => 't1');
            coordinator.onModeToggle();
            (0, vitest_1.expect)(displayManager.showTerminalFullscreen).toHaveBeenCalledWith('t1');
        });
    });
    (0, vitest_1.describe)('handleTerminalCreated', () => {
        (0, vitest_1.it)('should refresh split mode after terminal creation', () => {
            const displayManager = {
                getCurrentMode: vitest_1.vi.fn().mockReturnValue('split'),
                setDisplayMode: vitest_1.vi.fn(),
                showTerminalFullscreen: vitest_1.vi.fn(),
                showAllTerminalsSplit: vitest_1.vi.fn(),
                toggleSplitMode: vitest_1.vi.fn(),
            };
            const mockCoord = deps.getCoordinator();
            mockCoord.getDisplayModeManager.mockReturnValue(displayManager);
            coordinator.handleTerminalCreated('t3');
            vitest_1.vi.advanceTimersByTime(200);
            (0, vitest_1.expect)(deps.setActiveTab).toHaveBeenCalledWith('t3');
        });
    });
    (0, vitest_1.describe)('dispose', () => {
        (0, vitest_1.it)('should clear all pending timeouts', () => {
            // Schedule some timeouts
            coordinator.onNewTab();
            coordinator.dispose();
            // Advancing timers should not cause errors
            vitest_1.vi.advanceTimersByTime(500);
        });
    });
});
//# sourceMappingURL=TabEventCoordinator.test.js.map