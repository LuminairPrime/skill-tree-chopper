'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
/**
 * TerminalStateCoordinator Tests
 *
 * Tests for terminal state management methods extracted from LightweightTerminalWebviewManager.
 * Covers: updateState, updateUIFromState, updateTerminalCreationState, updateDebugDisplay,
 *         showTerminalLimitMessage, requestLatestState, getCurrentCachedState,
 *         getSystemStatus, isSystemReady
 */
const vitest_1 = require('vitest');
const TerminalStateCoordinator_1 = require('../../../../../webview/coordinators/TerminalStateCoordinator');
function createMockDeps() {
  return {
    getCurrentTerminalState: vitest_1.vi.fn().mockReturnValue(null),
    setCurrentTerminalState: vitest_1.vi.fn(),
    getHasProcessedInitialState: vitest_1.vi.fn().mockReturnValue(false),
    setHasProcessedInitialState: vitest_1.vi.fn(),
    terminalOperationsUpdateState: vitest_1.vi.fn(),
    hasPendingCreations: vitest_1.vi.fn().mockReturnValue(false),
    getPendingCreationsCount: vitest_1.vi.fn().mockReturnValue(0),
    processPendingCreationRequests: vitest_1.vi.fn(),
    hasPendingDeletions: vitest_1.vi.fn().mockReturnValue(false),
    getPendingDeletions: vitest_1.vi.fn().mockReturnValue([]),
    updateFromState: vitest_1.vi.fn(),
    updateCreationState: vitest_1.vi.fn(),
    debugUpdateDisplay: vitest_1.vi.fn(),
    debugShowTerminalLimitMessage: vitest_1.vi.fn(),
    ensureSplitResizersOnInitialDisplay: vitest_1.vi.fn(),
    postMessageToExtension: vitest_1.vi.fn(),
  };
}
function createTestState(overrides = {}) {
  return {
    terminals: [{ id: '1', name: 'Terminal 1' }],
    activeTerminalId: '1',
    maxTerminals: 5,
    availableSlots: [2, 3, 4, 5],
    ...overrides,
  };
}
(0, vitest_1.describe)('TerminalStateCoordinator', () => {
  let coordinator;
  let deps;
  (0, vitest_1.beforeEach)(() => {
    deps = createMockDeps();
    coordinator = new TerminalStateCoordinator_1.TerminalStateCoordinator(deps);
  });
  (0, vitest_1.describe)('updateState', () => {
    (0, vitest_1.it)('should reject null state', () => {
      coordinator.updateState(null);
      (0, vitest_1.expect)(deps.terminalOperationsUpdateState).not.toHaveBeenCalled();
      (0, vitest_1.expect)(deps.setCurrentTerminalState).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should reject non-object state', () => {
      coordinator.updateState('invalid');
      (0, vitest_1.expect)(deps.terminalOperationsUpdateState).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should reject state with missing terminals array', () => {
      coordinator.updateState({ availableSlots: [], maxTerminals: 5 });
      (0, vitest_1.expect)(deps.terminalOperationsUpdateState).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should reject state with missing availableSlots array', () => {
      coordinator.updateState({ terminals: [], maxTerminals: 5 });
      (0, vitest_1.expect)(deps.terminalOperationsUpdateState).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should reject state with non-number maxTerminals', () => {
      coordinator.updateState({ terminals: [], availableSlots: [], maxTerminals: 'five' });
      (0, vitest_1.expect)(deps.terminalOperationsUpdateState).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should process valid state and update cache', () => {
      const state = createTestState();
      // After setCurrentTerminalState is called, getCurrentTerminalState returns the new state
      vitest_1.vi.mocked(deps.getCurrentTerminalState).mockReturnValue(state);
      coordinator.updateState(state);
      (0, vitest_1.expect)(deps.terminalOperationsUpdateState).toHaveBeenCalledWith(state);
      (0, vitest_1.expect)(deps.setCurrentTerminalState).toHaveBeenCalledWith({
        terminals: state.terminals,
        activeTerminalId: state.activeTerminalId,
        maxTerminals: state.maxTerminals,
        availableSlots: state.availableSlots,
      });
    });
    (0, vitest_1.it)('should update UI from state', () => {
      const state = createTestState();
      vitest_1.vi.mocked(deps.getCurrentTerminalState).mockReturnValue(state);
      coordinator.updateState(state);
      (0, vitest_1.expect)(deps.updateFromState).toHaveBeenCalledWith(state);
    });
    (0, vitest_1.it)('should ensure split resizers on initial display', () => {
      const state = createTestState();
      vitest_1.vi.mocked(deps.getCurrentTerminalState).mockReturnValue(state);
      vitest_1.vi.mocked(deps.getHasProcessedInitialState).mockReturnValue(false);
      coordinator.updateState(state);
      (0, vitest_1.expect)(deps.ensureSplitResizersOnInitialDisplay).toHaveBeenCalledWith(
        state,
        true
      );
    });
    (0, vitest_1.it)(
      'should pass isInitialStateSync=false when state was already processed',
      () => {
        const state = createTestState();
        vitest_1.vi.mocked(deps.getCurrentTerminalState).mockReturnValue(state);
        vitest_1.vi.mocked(deps.getHasProcessedInitialState).mockReturnValue(true);
        coordinator.updateState(state);
        (0, vitest_1.expect)(deps.ensureSplitResizersOnInitialDisplay).toHaveBeenCalledWith(
          state,
          false
        );
      }
    );
    (0, vitest_1.it)('should update terminal creation state', () => {
      const state = createTestState();
      vitest_1.vi.mocked(deps.getCurrentTerminalState).mockReturnValue(state);
      coordinator.updateState(state);
      (0, vitest_1.expect)(deps.updateCreationState).toHaveBeenCalledWith(state);
    });
    (0, vitest_1.it)('should update debug display', () => {
      const state = createTestState();
      vitest_1.vi.mocked(deps.getCurrentTerminalState).mockReturnValue(state);
      coordinator.updateState(state);
      (0, vitest_1.expect)(deps.debugUpdateDisplay).toHaveBeenCalledWith(state, 'state-update');
    });
    (0, vitest_1.it)('should process pending creation requests when present', () => {
      vitest_1.vi.useFakeTimers();
      const state = createTestState();
      vitest_1.vi.mocked(deps.getCurrentTerminalState).mockReturnValue(state);
      vitest_1.vi.mocked(deps.hasPendingCreations).mockReturnValue(true);
      vitest_1.vi.mocked(deps.getPendingCreationsCount).mockReturnValue(2);
      coordinator.updateState(state);
      vitest_1.vi.advanceTimersByTime(50);
      (0, vitest_1.expect)(deps.processPendingCreationRequests).toHaveBeenCalled();
      vitest_1.vi.useRealTimers();
    });
    (0, vitest_1.it)('should not process pending creation requests when none pending', () => {
      vitest_1.vi.useFakeTimers();
      const state = createTestState();
      vitest_1.vi.mocked(deps.getCurrentTerminalState).mockReturnValue(state);
      vitest_1.vi.mocked(deps.hasPendingCreations).mockReturnValue(false);
      coordinator.updateState(state);
      vitest_1.vi.advanceTimersByTime(50);
      (0, vitest_1.expect)(deps.processPendingCreationRequests).not.toHaveBeenCalled();
      vitest_1.vi.useRealTimers();
    });
    (0, vitest_1.it)('should mark initial state as processed', () => {
      const state = createTestState();
      vitest_1.vi.mocked(deps.getCurrentTerminalState).mockReturnValue(state);
      coordinator.updateState(state);
      (0, vitest_1.expect)(deps.setHasProcessedInitialState).toHaveBeenCalledWith(true);
    });
  });
  (0, vitest_1.describe)('updateUIFromState', () => {
    (0, vitest_1.it)('should delegate to updateFromState', () => {
      const state = createTestState();
      coordinator.updateUIFromState(state);
      (0, vitest_1.expect)(deps.updateFromState).toHaveBeenCalledWith(state);
    });
  });
  (0, vitest_1.describe)('updateTerminalCreationState', () => {
    (0, vitest_1.it)('should delegate to updateCreationState when state exists', () => {
      const state = createTestState();
      vitest_1.vi.mocked(deps.getCurrentTerminalState).mockReturnValue(state);
      coordinator.updateTerminalCreationState();
      (0, vitest_1.expect)(deps.updateCreationState).toHaveBeenCalledWith(state);
    });
    (0, vitest_1.it)('should not call updateCreationState when no state', () => {
      vitest_1.vi.mocked(deps.getCurrentTerminalState).mockReturnValue(null);
      coordinator.updateTerminalCreationState();
      (0, vitest_1.expect)(deps.updateCreationState).not.toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('updateDebugDisplay', () => {
    (0, vitest_1.it)('should delegate to debugUpdateDisplay with state-update source', () => {
      const state = createTestState();
      coordinator.updateDebugDisplay(state);
      (0, vitest_1.expect)(deps.debugUpdateDisplay).toHaveBeenCalledWith(state, 'state-update');
    });
  });
  (0, vitest_1.describe)('showTerminalLimitMessage', () => {
    (0, vitest_1.it)('should delegate to updateCreationState when currentState exists', () => {
      const state = createTestState();
      vitest_1.vi.mocked(deps.getCurrentTerminalState).mockReturnValue(state);
      coordinator.showTerminalLimitMessage(5, 5);
      (0, vitest_1.expect)(deps.updateCreationState).toHaveBeenCalledWith(state);
      (0, vitest_1.expect)(deps.debugShowTerminalLimitMessage).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)(
      'should delegate to debugShowTerminalLimitMessage when no currentState',
      () => {
        vitest_1.vi.mocked(deps.getCurrentTerminalState).mockReturnValue(null);
        coordinator.showTerminalLimitMessage(5, 5);
        (0, vitest_1.expect)(deps.debugShowTerminalLimitMessage).toHaveBeenCalledWith(5, 5);
        (0, vitest_1.expect)(deps.updateCreationState).not.toHaveBeenCalled();
      }
    );
  });
  (0, vitest_1.describe)('requestLatestState', () => {
    (0, vitest_1.it)('should post requestState message to extension', () => {
      coordinator.requestLatestState();
      (0, vitest_1.expect)(deps.postMessageToExtension).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          command: 'requestState',
          timestamp: vitest_1.expect.any(Number),
        })
      );
    });
  });
  (0, vitest_1.describe)('getCurrentCachedState', () => {
    (0, vitest_1.it)('should return null when no state cached', () => {
      vitest_1.vi.mocked(deps.getCurrentTerminalState).mockReturnValue(null);
      (0, vitest_1.expect)(coordinator.getCurrentCachedState()).toBeNull();
    });
    (0, vitest_1.it)('should return cached state', () => {
      const state = createTestState();
      vitest_1.vi.mocked(deps.getCurrentTerminalState).mockReturnValue(state);
      (0, vitest_1.expect)(coordinator.getCurrentCachedState()).toBe(state);
    });
  });
  (0, vitest_1.describe)('isSystemReady', () => {
    (0, vitest_1.it)('should return false when no cached state', () => {
      vitest_1.vi.mocked(deps.getCurrentTerminalState).mockReturnValue(null);
      vitest_1.vi.mocked(deps.hasPendingDeletions).mockReturnValue(false);
      vitest_1.vi.mocked(deps.hasPendingCreations).mockReturnValue(false);
      (0, vitest_1.expect)(coordinator.isSystemReady()).toBe(false);
    });
    (0, vitest_1.it)('should return false when pending deletions exist', () => {
      vitest_1.vi.mocked(deps.getCurrentTerminalState).mockReturnValue(createTestState());
      vitest_1.vi.mocked(deps.hasPendingDeletions).mockReturnValue(true);
      vitest_1.vi.mocked(deps.hasPendingCreations).mockReturnValue(false);
      (0, vitest_1.expect)(coordinator.isSystemReady()).toBe(false);
    });
    (0, vitest_1.it)('should return false when pending creations exist', () => {
      vitest_1.vi.mocked(deps.getCurrentTerminalState).mockReturnValue(createTestState());
      vitest_1.vi.mocked(deps.hasPendingDeletions).mockReturnValue(false);
      vitest_1.vi.mocked(deps.hasPendingCreations).mockReturnValue(true);
      (0, vitest_1.expect)(coordinator.isSystemReady()).toBe(false);
    });
    (0, vitest_1.it)('should return true when state exists and no pending operations', () => {
      vitest_1.vi.mocked(deps.getCurrentTerminalState).mockReturnValue(createTestState());
      vitest_1.vi.mocked(deps.hasPendingDeletions).mockReturnValue(false);
      vitest_1.vi.mocked(deps.hasPendingCreations).mockReturnValue(false);
      (0, vitest_1.expect)(coordinator.isSystemReady()).toBe(true);
    });
  });
  (0, vitest_1.describe)('getSystemStatus', () => {
    (0, vitest_1.it)('should return complete system status snapshot', () => {
      const state = createTestState();
      vitest_1.vi.mocked(deps.getCurrentTerminalState).mockReturnValue(state);
      vitest_1.vi.mocked(deps.hasPendingDeletions).mockReturnValue(false);
      vitest_1.vi.mocked(deps.hasPendingCreations).mockReturnValue(false);
      vitest_1.vi.mocked(deps.getPendingDeletions).mockReturnValue([]);
      vitest_1.vi.mocked(deps.getPendingCreationsCount).mockReturnValue(0);
      const status = coordinator.getSystemStatus();
      (0, vitest_1.expect)(status).toEqual({
        ready: true,
        state: state,
        pendingOperations: {
          deletions: [],
          creations: 0,
        },
      });
    });
    (0, vitest_1.it)('should reflect pending operations in status', () => {
      vitest_1.vi.mocked(deps.getCurrentTerminalState).mockReturnValue(createTestState());
      vitest_1.vi.mocked(deps.hasPendingDeletions).mockReturnValue(true);
      vitest_1.vi.mocked(deps.hasPendingCreations).mockReturnValue(true);
      vitest_1.vi.mocked(deps.getPendingDeletions).mockReturnValue(['terminal-1']);
      vitest_1.vi.mocked(deps.getPendingCreationsCount).mockReturnValue(3);
      const status = coordinator.getSystemStatus();
      (0, vitest_1.expect)(status.ready).toBe(false);
      (0, vitest_1.expect)(status.pendingOperations.deletions).toEqual(['terminal-1']);
      (0, vitest_1.expect)(status.pendingOperations.creations).toBe(3);
    });
  });
});
//# sourceMappingURL=TerminalStateCoordinator.test.js.map
