"use strict";
/**
 * SplitManager Grid Transition Tests
 *
 * Tests for layout mode detection and grid/flex transitions
 * when terminal count crosses the grid threshold (6).
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const SplitManager_1 = require("../../../../../webview/managers/SplitManager");
// Mock dependencies
vitest_1.vi.mock('../../../../../webview/utils/ManagerLogger');
vitest_1.vi.mock('../../../../../webview/utils/NotificationUtils');
function createMockCoordinator() {
    return {
        getActiveTerminalId: vitest_1.vi.fn().mockReturnValue(null),
        getTerminalContainerManager: vitest_1.vi.fn().mockReturnValue({
            getContainerOrder: vitest_1.vi.fn().mockReturnValue([]),
            applyDisplayState: vitest_1.vi.fn(),
            clearSplitArtifacts: vitest_1.vi.fn(),
        }),
        getManagers: vitest_1.vi.fn().mockReturnValue({ tabs: null }),
        refitAllTerminals: vitest_1.vi.fn(),
    };
}
function createMockTerminal() {
    return {
        terminal: {
            dispose: vitest_1.vi.fn(),
            refresh: vitest_1.vi.fn(),
            rows: 24,
        },
        fitAddon: {
            fit: vitest_1.vi.fn(),
        },
    };
}
(0, vitest_1.describe)('SplitManager - Grid Transition', () => {
    let splitManager;
    let mockCoordinator;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
        document.body.innerHTML = '<div id="terminal-body"></div>';
        mockCoordinator = createMockCoordinator();
        splitManager = new SplitManager_1.SplitManager(mockCoordinator);
        splitManager.initialize();
    });
    (0, vitest_1.afterEach)(() => {
        splitManager.dispose();
        splitManager = null;
        document.body.innerHTML = '';
    });
    (0, vitest_1.describe)('getLayoutMode', () => {
        (0, vitest_1.it)('should return single-row when not in split mode', () => {
            (0, vitest_1.expect)(splitManager.getLayoutMode()).toBe('single-row');
        });
        (0, vitest_1.it)('should return single-row for 5 terminals in panel split mode', () => {
            // Given: split mode enabled with panel location
            splitManager.isSplitMode = true;
            splitManager.setPanelLocation('panel');
            // When: 5 terminals are added
            for (let i = 1; i <= 5; i++) {
                const { terminal, fitAddon } = createMockTerminal();
                // @ts-expect-error - test mock type
                splitManager.setTerminal(`t${i}`, { terminal, fitAddon, id: `t${i}` });
            }
            // Then: layout mode should be single-row (below grid threshold)
            (0, vitest_1.expect)(splitManager.getLayoutMode()).toBe('single-row');
        });
        (0, vitest_1.it)('should return grid-2-row for 6 terminals in panel split mode', () => {
            splitManager.isSplitMode = true;
            splitManager.setPanelLocation('panel');
            for (let i = 1; i <= 6; i++) {
                const { terminal, fitAddon } = createMockTerminal();
                // @ts-expect-error - test mock type
                splitManager.setTerminal(`t${i}`, { terminal, fitAddon, id: `t${i}` });
            }
            (0, vitest_1.expect)(splitManager.getLayoutMode()).toBe('grid-2-row');
        });
        (0, vitest_1.it)('should return grid-2-row for 10 terminals in panel split mode', () => {
            splitManager.isSplitMode = true;
            splitManager.setPanelLocation('panel');
            for (let i = 1; i <= 10; i++) {
                const { terminal, fitAddon } = createMockTerminal();
                // @ts-expect-error - test mock type
                splitManager.setTerminal(`t${i}`, { terminal, fitAddon, id: `t${i}` });
            }
            (0, vitest_1.expect)(splitManager.getLayoutMode()).toBe('grid-2-row');
        });
        (0, vitest_1.it)('should return single-row for 6 terminals in sidebar split mode', () => {
            splitManager.isSplitMode = true;
            splitManager.setPanelLocation('sidebar');
            for (let i = 1; i <= 6; i++) {
                const { terminal, fitAddon } = createMockTerminal();
                // @ts-expect-error - test mock type
                splitManager.setTerminal(`t${i}`, { terminal, fitAddon, id: `t${i}` });
            }
            (0, vitest_1.expect)(splitManager.getLayoutMode()).toBe('single-row');
        });
        (0, vitest_1.it)('should return single-row for 6 terminals not in split mode', () => {
            splitManager.isSplitMode = false;
            splitManager.setPanelLocation('panel');
            for (let i = 1; i <= 6; i++) {
                const { terminal, fitAddon } = createMockTerminal();
                // @ts-expect-error - test mock type
                splitManager.setTerminal(`t${i}`, { terminal, fitAddon, id: `t${i}` });
            }
            (0, vitest_1.expect)(splitManager.getLayoutMode()).toBe('single-row');
        });
    });
    (0, vitest_1.describe)('5→6 transition', () => {
        (0, vitest_1.it)('should transition from single-row to grid-2-row when adding 6th terminal', () => {
            splitManager.isSplitMode = true;
            splitManager.setPanelLocation('panel');
            for (let i = 1; i <= 5; i++) {
                const { terminal, fitAddon } = createMockTerminal();
                // @ts-expect-error - test mock type
                splitManager.setTerminal(`t${i}`, { terminal, fitAddon, id: `t${i}` });
            }
            (0, vitest_1.expect)(splitManager.getLayoutMode()).toBe('single-row');
            // Add 6th terminal
            const { terminal, fitAddon } = createMockTerminal();
            // @ts-expect-error - test mock type
            splitManager.setTerminal('t6', { terminal, fitAddon, id: 't6' });
            (0, vitest_1.expect)(splitManager.getLayoutMode()).toBe('grid-2-row');
        });
    });
    (0, vitest_1.describe)('6→5 transition', () => {
        (0, vitest_1.it)('should transition from grid-2-row to single-row when removing to 5 terminals', () => {
            splitManager.isSplitMode = true;
            splitManager.setPanelLocation('panel');
            for (let i = 1; i <= 6; i++) {
                const { terminal, fitAddon } = createMockTerminal();
                // @ts-expect-error - test mock type
                splitManager.setTerminal(`t${i}`, { terminal, fitAddon, id: `t${i}` });
                splitManager.setTerminalContainer(`t${i}`, document.createElement('div'));
            }
            (0, vitest_1.expect)(splitManager.getLayoutMode()).toBe('grid-2-row');
            // Remove 6th terminal (which also removes from terminals map)
            splitManager.removeTerminal('t6');
            // After removal, should be back to single-row
            (0, vitest_1.expect)(splitManager.getLayoutMode()).toBe('single-row');
        });
    });
});
//# sourceMappingURL=SplitManager-GridTransition.test.js.map