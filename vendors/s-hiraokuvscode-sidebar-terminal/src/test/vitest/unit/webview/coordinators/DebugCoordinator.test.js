'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
/**
 * DebugCoordinator Tests
 *
 * Tests for Debug/Diagnostics methods extracted from LightweightTerminalWebviewManager.
 * Covers: updateDebugDisplay, toggleDebugPanel, exportSystemDiagnostics, getManagerStats
 */
const vitest_1 = require('vitest');
const DebugCoordinator_1 = require('../../../../../webview/coordinators/DebugCoordinator');
function createMockDeps() {
  return {
    debugPanelManager: {
      updateDisplay: vitest_1.vi.fn(),
      toggle: vitest_1.vi.fn(),
      isActive: vitest_1.vi.fn().mockReturnValue(false),
      exportDiagnostics: vitest_1.vi.fn().mockReturnValue({ status: 'ok' }),
      dispose: vitest_1.vi.fn(),
    },
    getSystemStatus: vitest_1.vi.fn().mockReturnValue({
      ready: true,
      state: null,
      pendingOperations: { deletions: [], creations: 0 },
    }),
    requestLatestState: vitest_1.vi.fn(),
    getTerminalStats: vitest_1.vi.fn().mockReturnValue({
      totalTerminals: 2,
      activeTerminalId: 'terminal-1',
      terminalIds: ['terminal-1', 'terminal-2'],
    }),
    getAgentStats: vitest_1.vi.fn().mockReturnValue({ connected: 1 }),
    getEventStats: vitest_1.vi.fn().mockReturnValue({ handlers: 5 }),
    getApiDiagnostics: vitest_1.vi.fn().mockReturnValue({ messages: 10 }),
    showWarning: vitest_1.vi.fn(),
    notificationManager: {
      showWarning: vitest_1.vi.fn(),
    },
  };
}
(0, vitest_1.describe)('DebugCoordinator', () => {
  let coordinator;
  let deps;
  (0, vitest_1.beforeEach)(() => {
    deps = createMockDeps();
    coordinator = new DebugCoordinator_1.DebugCoordinator(deps);
  });
  (0, vitest_1.describe)('updateDebugDisplay', () => {
    (0, vitest_1.it)('should delegate to debugPanelManager.updateDisplay', () => {
      const state = {
        terminals: [],
        activeTerminalId: null,
        maxTerminals: 5,
        availableSlots: [1, 2, 3, 4, 5],
      };
      coordinator.updateDebugDisplay(state, 'test-operation');
      (0, vitest_1.expect)(deps.debugPanelManager.updateDisplay).toHaveBeenCalledWith(
        state,
        'test-operation'
      );
    });
    (0, vitest_1.it)('should pass operation name for logging', () => {
      const state = {
        terminals: [],
        activeTerminalId: null,
        maxTerminals: 5,
        availableSlots: [],
      };
      coordinator.updateDebugDisplay(state, 'state-update');
      (0, vitest_1.expect)(deps.debugPanelManager.updateDisplay).toHaveBeenCalledWith(
        state,
        'state-update'
      );
    });
  });
  (0, vitest_1.describe)('toggleDebugPanel', () => {
    (0, vitest_1.it)('should delegate to debugPanelManager.toggle', () => {
      const state = {
        terminals: [],
        activeTerminalId: null,
        maxTerminals: 5,
        availableSlots: [],
      };
      coordinator.toggleDebugPanel(state);
      (0, vitest_1.expect)(deps.debugPanelManager.toggle).toHaveBeenCalledWith(state);
    });
    (0, vitest_1.it)(
      'should request latest state if panel becomes active and no state provided',
      () => {
        vitest_1.vi.mocked(deps.debugPanelManager.isActive).mockReturnValue(true);
        coordinator.toggleDebugPanel(undefined);
        (0, vitest_1.expect)(deps.requestLatestState).toHaveBeenCalled();
      }
    );
    (0, vitest_1.it)('should not request state if panel is not active', () => {
      vitest_1.vi.mocked(deps.debugPanelManager.isActive).mockReturnValue(false);
      coordinator.toggleDebugPanel(undefined);
      (0, vitest_1.expect)(deps.requestLatestState).not.toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('exportSystemDiagnostics', () => {
    (0, vitest_1.it)('should export diagnostics with system status', () => {
      coordinator.exportSystemDiagnostics(5);
      (0, vitest_1.expect)(deps.debugPanelManager.exportDiagnostics).toHaveBeenCalledWith(
        deps.getSystemStatus(),
        5
      );
    });
  });
  (0, vitest_1.describe)('getManagerStats', () => {
    (0, vitest_1.it)('should aggregate stats from all sources', () => {
      const stats = coordinator.getManagerStats();
      (0, vitest_1.expect)(stats).toEqual({
        terminals: deps.getTerminalStats(),
        cliAgents: deps.getAgentStats(),
        events: deps.getEventStats(),
        api: deps.getApiDiagnostics(),
      });
    });
  });
  (0, vitest_1.describe)('showTerminalLimitMessage', () => {
    (0, vitest_1.it)('should show warning via notification manager', () => {
      coordinator.showTerminalLimitMessage(5, 5);
      (0, vitest_1.expect)(deps.showWarning).toHaveBeenCalled();
    });
  });
});
//# sourceMappingURL=DebugCoordinator.test.js.map
