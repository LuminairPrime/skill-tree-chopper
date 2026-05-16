"use strict";
/**
 * TerminalStateDisplayManager Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const TerminalStateDisplayManager_1 = require("../../../../../webview/managers/TerminalStateDisplayManager");
// Mock generic logger
vitest_1.vi.mock('../../../../../utils/logger', () => ({
    webview: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('TerminalStateDisplayManager', () => {
    let manager;
    let mockUIManager;
    let mockNotificationManager;
    let mockTabManager;
    let mockContainerManager;
    let dom;
    (0, vitest_1.beforeEach)(() => {
        // Setup DOM
        dom = new jsdom_1.JSDOM(`
      <!DOCTYPE html>
      <body>
        <div data-terminal-count></div>
        <div data-available-slots></div>
        <div data-terminal-status></div>
        <button data-action="create-terminal"></button>
        <div class="terminal-container" data-terminal-id="t1"></div>
        <div class="terminal-container" data-terminal-id="t2"></div>
      </body>
    `);
        global.document = dom.window.document;
        global.window = dom.window;
        global.HTMLElement = dom.window.HTMLElement;
        global.Element = dom.window.Element;
        global.HTMLButtonElement = dom.window.HTMLButtonElement;
        mockUIManager = {
            updateSplitTerminalBorders: vitest_1.vi.fn(),
        };
        mockNotificationManager = {
            showWarning: vitest_1.vi.fn(),
            clearWarnings: vitest_1.vi.fn(),
        };
        mockTabManager = {
            hasPendingDeletion: vitest_1.vi.fn().mockReturnValue(false),
            getPendingDeletions: vitest_1.vi.fn().mockReturnValue(new Set()),
            syncTabs: vitest_1.vi.fn(),
        };
        mockContainerManager = {
            reorderContainers: vitest_1.vi.fn(),
        };
        manager = new TerminalStateDisplayManager_1.TerminalStateDisplayManager(mockUIManager, mockNotificationManager, mockTabManager, mockContainerManager);
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('State Updates', () => {
        const mockState = {
            terminals: [
                { id: 't1', name: 'Terminal 1', isActive: true },
                { id: 't2', name: 'Terminal 2', isActive: false },
            ],
            activeTerminalId: 't1',
            maxTerminals: 5,
            availableSlots: [3, 4, 5],
            // @ts-expect-error - test mock type
            config: {},
        };
        (0, vitest_1.it)('should update all UI elements from state', () => {
            manager.updateFromState(mockState);
            (0, vitest_1.expect)(mockContainerManager.reorderContainers).toHaveBeenCalledWith(['t1', 't2']);
            (0, vitest_1.expect)(mockTabManager.syncTabs).toHaveBeenCalled();
            (0, vitest_1.expect)(mockUIManager.updateSplitTerminalBorders).toHaveBeenCalledWith('t1');
            const countEl = document.querySelector('[data-terminal-count]');
            (0, vitest_1.expect)(countEl?.textContent).toBe('2/5');
            const slotsEl = document.querySelector('[data-available-slots]');
            (0, vitest_1.expect)(slotsEl?.textContent).toContain('Available: 3, 4, 5');
        });
        (0, vitest_1.it)('should highlight active terminal', () => {
            manager.updateFromState(mockState);
            const activeContainer = document.querySelector('[data-terminal-id="t1"]');
            (0, vitest_1.expect)(activeContainer?.classList.contains('active')).toBe(true);
            const inactiveContainer = document.querySelector('[data-terminal-id="t2"]');
            (0, vitest_1.expect)(inactiveContainer?.classList.contains('active')).toBe(false);
        });
        (0, vitest_1.it)('should handle errors gracefully', () => {
            // Force error by passing null state
            manager.updateFromState(null);
            // Should not throw, logs error internally
        });
    });
    (0, vitest_1.describe)('Creation State', () => {
        (0, vitest_1.it)('should enable creation button when slots available', () => {
            const state = {
                terminals: [],
                activeTerminalId: null,
                maxTerminals: 5,
                availableSlots: [1],
                // @ts-expect-error - test mock type
                config: {},
            };
            manager.updateCreationState(state);
            const button = document.querySelector('[data-action="create-terminal"]');
            (0, vitest_1.expect)(button.disabled).toBe(false);
            (0, vitest_1.expect)(button.title).toBe('Create new terminal');
            (0, vitest_1.expect)(mockNotificationManager.clearWarnings).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should disable creation button when no slots available', () => {
            const state = {
                terminals: [{}],
                activeTerminalId: null,
                maxTerminals: 1,
                availableSlots: [],
                // @ts-expect-error - test mock type
                config: {},
            };
            manager.updateCreationState(state);
            const button = document.querySelector('[data-action="create-terminal"]');
            (0, vitest_1.expect)(button.disabled).toBe(true);
            (0, vitest_1.expect)(button.title).toBe('Maximum terminals reached');
            (0, vitest_1.expect)(mockNotificationManager.showWarning).toHaveBeenCalled();
            const statusEl = document.querySelector('[data-terminal-status]');
            (0, vitest_1.expect)(statusEl?.textContent).toContain('Terminal limit reached');
            (0, vitest_1.expect)(statusEl?.className).toContain('warning');
        });
    });
    (0, vitest_1.describe)('Tab Syncing', () => {
        (0, vitest_1.it)('should filter pending deletions during sync', () => {
            const state = {
                terminals: [
                    { id: 't1', name: 'T1', isActive: true },
                    { id: 't2', name: 'T2', isActive: false },
                ],
                activeTerminalId: 't1',
                maxTerminals: 5,
                availableSlots: [],
                // @ts-expect-error - test mock type
                config: {},
            };
            mockTabManager.hasPendingDeletion.mockImplementation((id) => id === 't2');
            mockTabManager.getPendingDeletions.mockReturnValue(new Set(['t2']));
            manager.updateFromState(state);
            (0, vitest_1.expect)(mockTabManager.syncTabs).toHaveBeenCalledWith([vitest_1.expect.objectContaining({ id: 't1' })]);
            // t2 should be filtered out
            (0, vitest_1.expect)(mockTabManager.syncTabs).not.toHaveBeenCalledWith(vitest_1.expect.arrayContaining([vitest_1.expect.objectContaining({ id: 't2' })]));
        });
    });
    (0, vitest_1.describe)('Header Metadata Sync', () => {
        (0, vitest_1.it)('should sync terminal name to header during state update', () => {
            mockUIManager.updateTerminalHeader = vitest_1.vi.fn();
            const state = {
                terminals: [
                    { id: 't1', name: 'My Custom Name', isActive: true },
                    { id: 't2', name: 'Terminal 2', isActive: false },
                ],
                activeTerminalId: 't1',
                maxTerminals: 5,
                availableSlots: [3, 4, 5],
                // @ts-expect-error - test mock type
                config: {},
            };
            manager.updateFromState(state);
            (0, vitest_1.expect)(mockUIManager.updateTerminalHeader).toHaveBeenCalledWith('t1', 'My Custom Name', undefined);
            (0, vitest_1.expect)(mockUIManager.updateTerminalHeader).toHaveBeenCalledWith('t2', 'Terminal 2', undefined);
        });
        (0, vitest_1.it)('should sync both name and indicatorColor to header', () => {
            mockUIManager.updateTerminalHeader = vitest_1.vi.fn();
            const state = {
                terminals: [{ id: 't1', name: 'My Terminal', isActive: true, indicatorColor: '#FF0000' }],
                activeTerminalId: 't1',
                maxTerminals: 5,
                availableSlots: [3, 4, 5],
                // @ts-expect-error - test mock type
                config: {},
            };
            manager.updateFromState(state);
            (0, vitest_1.expect)(mockUIManager.updateTerminalHeader).toHaveBeenCalledWith('t1', 'My Terminal', '#FF0000');
        });
        (0, vitest_1.it)('should sync name without indicatorColor when color is not set', () => {
            mockUIManager.updateTerminalHeader = vitest_1.vi.fn();
            const state = {
                terminals: [{ id: 't1', name: 'Renamed Terminal', isActive: true }],
                activeTerminalId: 't1',
                maxTerminals: 5,
                availableSlots: [],
                // @ts-expect-error - test mock type
                config: {},
            };
            manager.updateFromState(state);
            (0, vitest_1.expect)(mockUIManager.updateTerminalHeader).toHaveBeenCalledWith('t1', 'Renamed Terminal', undefined);
        });
    });
    (0, vitest_1.describe)('Optional Managers', () => {
        (0, vitest_1.it)('should handle missing managers gracefully', () => {
            const minimalManager = new TerminalStateDisplayManager_1.TerminalStateDisplayManager(mockUIManager, mockNotificationManager, null, // No tab manager
            null // No container manager
            );
            const state = {
                terminals: [{ id: 't1', name: 'T1', isActive: true }],
                activeTerminalId: 't1',
                maxTerminals: 5,
                availableSlots: [],
                // @ts-expect-error - test mock type
                config: {},
            };
            // Should not throw
            minimalManager.updateFromState(state);
        });
    });
});
//# sourceMappingURL=TerminalStateDisplayManager.test.js.map