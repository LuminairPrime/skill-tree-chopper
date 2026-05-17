'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
/**
 * WatchdogCoordinator Tests
 */
const vitest_1 = require('vitest');
// Mock vscode
vitest_1.vi.mock('vscode', () => ({
  window: {
    showErrorMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
    showWarningMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
  },
}));
// Mock TerminalInitializationWatchdog
vitest_1.vi.mock('../../../../../providers/services/TerminalInitializationWatchdog', () => {
  const MockWatchdog = vitest_1.vi.fn().mockImplementation(function () {
    this.start = vitest_1.vi.fn();
    this.stop = vitest_1.vi.fn();
    this.dispose = vitest_1.vi.fn();
  });
  return { TerminalInitializationWatchdog: MockWatchdog };
});
const WatchdogCoordinator_1 = require('../../../../../providers/services/WatchdogCoordinator');
const ackOptions = { timeout: 5000, maxAttempts: 3 };
const promptOptions = { timeout: 10000, maxAttempts: 2 };
function createMockDeps() {
  return {
    getTerminal: vitest_1.vi.fn().mockReturnValue({ ptyProcess: {}, name: 'Test' }),
    initializeShellForTerminal: vitest_1.vi.fn(),
    telemetryService: {
      trackPerformance: vitest_1.vi.fn(),
    },
  };
}
(0, vitest_1.describe)('WatchdogCoordinator', () => {
  let coordinator;
  let deps;
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
    deps = createMockDeps();
    // @ts-expect-error - test mock type
    coordinator = new WatchdogCoordinator_1.WatchdogCoordinator(deps, ackOptions, promptOptions);
  });
  afterEach(() => {
    coordinator.dispose();
    coordinator = null;
  });
  (0, vitest_1.describe)('startForTerminal', () => {
    (0, vitest_1.it)('should track the phase for the terminal', () => {
      coordinator.startForTerminal('t1', 'ack', 'test');
      (0, vitest_1.expect)(coordinator.getPhase('t1')).toBe('ack');
    });
  });
  (0, vitest_1.describe)('stopForTerminal', () => {
    (0, vitest_1.it)('should clear the phase', () => {
      coordinator.startForTerminal('t1', 'ack', 'test');
      coordinator.stopForTerminal('t1', 'done');
      (0, vitest_1.expect)(coordinator.getPhase('t1')).toBeUndefined();
    });
  });
  (0, vitest_1.describe)('pending terminals', () => {
    (0, vitest_1.it)('should queue and start pending terminals', () => {
      coordinator.addPendingTerminal('t1');
      coordinator.addPendingTerminal('t2');
      // Should not start when not initialized
      coordinator.startPendingWatchdogs(false);
      (0, vitest_1.expect)(coordinator.getPhase('t1')).toBeUndefined();
      // Should start when initialized
      coordinator.startPendingWatchdogs(true);
      (0, vitest_1.expect)(coordinator.getPhase('t1')).toBe('ack');
      (0, vitest_1.expect)(coordinator.getPhase('t2')).toBe('ack');
    });
  });
  (0, vitest_1.describe)('safe mode', () => {
    (0, vitest_1.it)('should track safe mode state', () => {
      (0, vitest_1.expect)(coordinator.isInSafeMode('t1')).toBe(false);
    });
    (0, vitest_1.it)('should clear safe mode', () => {
      coordinator.clearSafeMode('t1');
      (0, vitest_1.expect)(coordinator.isInSafeMode('t1')).toBe(false);
    });
  });
  (0, vitest_1.describe)('initialization metrics', () => {
    (0, vitest_1.it)('should record init start and mark success', () => {
      coordinator.recordInitStart('t1');
      coordinator.markInitSuccess('t1');
      (0, vitest_1.expect)(deps.telemetryService?.trackPerformance).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          operation: 'terminal.init',
          success: true,
        })
      );
    });
  });
  (0, vitest_1.describe)('dispose', () => {
    (0, vitest_1.it)('should clean up all state', () => {
      coordinator.addPendingTerminal('t1');
      coordinator.startForTerminal('t2', 'ack', 'test');
      coordinator.recordInitStart('t3');
      coordinator.dispose();
      (0, vitest_1.expect)(coordinator.getPhase('t2')).toBeUndefined();
      (0, vitest_1.expect)(coordinator.isInSafeMode('t1')).toBe(false);
    });
  });
});
//# sourceMappingURL=WatchdogCoordinator.test.js.map
