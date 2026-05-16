"use strict";
/**
 * TerminalTabManager Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const TerminalTabManager_1 = require("../../../../../webview/managers/TerminalTabManager");
// Mock dependencies
vi.mock('../../../../../webview/components/TerminalTabList', () => ({
    TerminalTabList: class {
        constructor(_container, _events) {
            this.setModeIndicator = vi.fn();
            this.updateTab = vi.fn();
            this.addTab = vi.fn();
            this.removeTab = vi.fn();
            this.setActiveTab = vi.fn();
            this.reorderTabs = vi.fn();
            this.updateTheme = vi.fn();
            this.dispose = vi.fn();
        }
    },
}));
vi.mock('../../../../../utils/logger', () => ({
    webview: vi.fn(),
}));
vi.mock('../../../../../utils/arrayUtils', () => ({
    arraysEqual: (a, b) => JSON.stringify(a) === JSON.stringify(b),
}));
(0, vitest_1.describe)('TerminalTabManager', () => {
    let manager;
    let mockCoordinator;
    let dom;
    beforeEach(() => {
        vi.useFakeTimers();
        dom = new jsdom_1.JSDOM('<!DOCTYPE html><div id="terminal-body"></div>');
        global.document = dom.window.document;
        global.window = dom.window;
        global.HTMLElement = dom.window.HTMLElement;
        mockCoordinator = {
            setActiveTerminalId: vi.fn(),
            postMessageToExtension: vi.fn(),
            getManagers: vi.fn().mockReturnValue({
                terminalContainer: { reorderContainers: vi.fn() },
                notification: { showWarning: vi.fn() },
            }),
            createTerminal: vi.fn(),
            closeTerminal: vi.fn(),
            getDisplayModeManager: vi.fn().mockReturnValue({
                getCurrentMode: vi.fn().mockReturnValue('normal'),
                setDisplayMode: vi.fn(),
                showTerminalFullscreen: vi.fn(),
                showAllTerminalsSplit: vi.fn(),
                toggleSplitMode: vi.fn(),
            }),
        };
        manager = new TerminalTabManager_1.TerminalTabManager();
        manager.setCoordinator(mockCoordinator);
    });
    afterEach(() => {
        manager.dispose();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('Initialization', () => {
        (0, vitest_1.it)('should initialize and create tab container', () => {
            manager.initialize();
            const container = document.getElementById('terminal-tabs-container');
            (0, vitest_1.expect)(container).toBeDefined();
            (0, vitest_1.expect)(container?.classList.contains('terminal-tabs-root')).toBe(true);
        });
        (0, vitest_1.it)('should reuse existing container if marked', () => {
            const existing = document.createElement('div');
            existing.id = 'terminal-tabs-container';
            existing.setAttribute('data-tab-manager-initialized', 'true');
            document.getElementById('terminal-body')?.appendChild(existing);
            manager.initialize();
            (0, vitest_1.expect)(document.getElementById('terminal-tabs-container')).toBe(existing);
        });
    });
    (0, vitest_1.describe)('Tab Management', () => {
        (0, vitest_1.it)('should add a tab', () => {
            manager.addTab('t1', 'Term 1');
            (0, vitest_1.expect)(manager.getTabCount()).toBe(1);
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(manager.getAllTabs()[0].id).toBe('t1');
        });
        (0, vitest_1.it)('should update existing tab on add', () => {
            manager.addTab('t1', 'Term 1');
            manager.addTab('t1', 'Updated Name');
            (0, vitest_1.expect)(manager.getTabCount()).toBe(1);
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(manager.getAllTabs()[0].name).toBe('Updated Name');
        });
        (0, vitest_1.it)('should remove a tab', () => {
            manager.addTab('t1', 'Term 1');
            manager.removeTab('t1');
            (0, vitest_1.expect)(manager.getTabCount()).toBe(0);
        });
        (0, vitest_1.it)('should prevent removing last tab via close event', () => {
            manager.addTab('t1', 'Term 1');
            manager.onTabClose('t1');
            // Should show warning and NOT call remove/close logic
            const notifManager = mockCoordinator.getManagers().notification;
            (0, vitest_1.expect)(notifManager.showWarning).toHaveBeenCalled();
            (0, vitest_1.expect)(mockCoordinator.closeTerminal).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should activate tab', () => {
            manager.addTab('t1', 'Term 1');
            manager.addTab('t2', 'Term 2');
            manager.setActiveTab('t2');
            (0, vitest_1.expect)(manager.getActiveTabId()).toBe('t2');
        });
    });
    (0, vitest_1.describe)('Tab Events', () => {
        (0, vitest_1.it)('should handle tab click', () => {
            manager.addTab('t1', 'Term 1');
            manager.onTabClick('t1');
            (0, vitest_1.expect)(mockCoordinator.setActiveTerminalId).toHaveBeenCalledWith('t1');
        });
        (0, vitest_1.it)('should handle tab rename', () => {
            manager.addTab('t1', 'Old Name');
            manager.onTabRename('t1', 'New Name');
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(manager.getAllTabs()[0].name).toBe('New Name');
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'renameTerminal',
                newName: 'New Name',
            }));
        });
        (0, vitest_1.it)('should handle tab reorder', () => {
            manager.addTab('t1', '1');
            manager.addTab('t2', '2');
            manager.onTabReorder(0, 1, ['t2', 't1']);
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(manager.getAllTabs()[0].id).toBe('t2');
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'reorderTerminals',
                order: ['t2', 't1'],
            }));
        });
        (0, vitest_1.it)('should handle new tab request', () => {
            manager.onNewTab();
            (0, vitest_1.expect)(mockCoordinator.createTerminal).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should keep fullscreen mode after closing when multiple terminals remain', () => {
            const displayManager = {
                getCurrentMode: vi.fn().mockReturnValue('fullscreen'),
                setDisplayMode: vi.fn(),
                showTerminalFullscreen: vi.fn(),
                showAllTerminalsSplit: vi.fn(),
                toggleSplitMode: vi.fn(),
            };
            mockCoordinator.getDisplayModeManager = vi.fn().mockReturnValue(displayManager);
            manager.addTab('t1', 'Term 1');
            manager.addTab('t2', 'Term 2');
            manager.addTab('t3', 'Term 3');
            manager.onTabClose('t1');
            vi.advanceTimersByTime(60);
            (0, vitest_1.expect)(displayManager.showTerminalFullscreen).toHaveBeenCalled();
            (0, vitest_1.expect)(displayManager.setDisplayMode).not.toHaveBeenCalledWith('split');
        });
    });
    (0, vitest_1.describe)('Sync Tabs', () => {
        (0, vitest_1.it)('should sync tabs from extension state', () => {
            const tabs = [
                { id: 't1', name: 'Sync 1', isActive: true },
                { id: 't2', name: 'Sync 2', isActive: false },
            ];
            manager.syncTabs(tabs);
            (0, vitest_1.expect)(manager.getTabCount()).toBe(2);
            (0, vitest_1.expect)(manager.getActiveTabId()).toBe('t1');
        });
        (0, vitest_1.it)('should remove tabs not in sync state', () => {
            manager.addTab('old', 'Old');
            const tabs = [{ id: 'new', name: 'New', isActive: true }];
            manager.syncTabs(tabs);
            (0, vitest_1.expect)(manager.getTabCount()).toBe(1);
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(manager.getAllTabs()[0].id).toBe('new');
        });
    });
});
//# sourceMappingURL=TerminalTabManager.test.js.map