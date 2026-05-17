'use strict';
/**
 * TerminalInitializationCoordinator Unit Tests
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const TerminalInitializationCoordinator_1 = require('../../../../providers/TerminalInitializationCoordinator');
// Mock logger
vitest_1.vi.mock('../../../../utils/logger', () => ({
  terminal: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('TerminalInitializationCoordinator', () => {
  let coordinator;
  let mockTerminalManager;
  let mockActions;
  let mockPersistenceService;
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.useFakeTimers();
    mockTerminalManager = {
      getTerminals: vitest_1.vi.fn().mockReturnValue([]),
    };
    mockActions = {
      initializeTerminal: vitest_1.vi.fn().mockResolvedValue(undefined),
      ensureMinimumTerminals: vitest_1.vi.fn(),
      sendInitializationComplete: vitest_1.vi.fn().mockResolvedValue(undefined),
      restoreLastSession: vitest_1.vi.fn().mockResolvedValue(false),
    };
    mockPersistenceService = {
      restoreSession: vitest_1.vi.fn().mockResolvedValue({ success: false }),
    };
    coordinator = new TerminalInitializationCoordinator_1.TerminalInitializationCoordinator(
      mockTerminalManager,
      mockActions,
      mockPersistenceService
    );
  });
  (0, vitest_1.afterEach)(() => {
    vitest_1.vi.useRealTimers();
    vitest_1.vi.clearAllMocks();
  });
  (0, vitest_1.describe)('initialize', () => {
    (0, vitest_1.it)('should create default terminals if no session exists', async () => {
      await coordinator.initialize();
      (0, vitest_1.expect)(mockActions.initializeTerminal).toHaveBeenCalled();
      (0, vitest_1.expect)(mockPersistenceService.restoreSession).toHaveBeenCalled();
      (0, vitest_1.expect)(mockActions.restoreLastSession).toHaveBeenCalled();
      (0, vitest_1.expect)(mockActions.ensureMinimumTerminals).toHaveBeenCalled();
      // Check completion message after timeout
      await vitest_1.vi.advanceTimersByTimeAsync(100);
      await vitest_1.vi.waitFor(() => {
        (0, vitest_1.expect)(mockActions.sendInitializationComplete).toHaveBeenCalled();
      });
    });
    (0, vitest_1.it)('should restore from extension persistence if available', async () => {
      mockPersistenceService.restoreSession.mockResolvedValue({ success: true, restoredCount: 2 });
      await coordinator.initialize();
      (0, vitest_1.expect)(mockPersistenceService.restoreSession).toHaveBeenCalled();
      (0, vitest_1.expect)(mockActions.restoreLastSession).not.toHaveBeenCalled();
      (0, vitest_1.expect)(mockActions.ensureMinimumTerminals).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should restore from webview if extension persistence fails', async () => {
      mockPersistenceService.restoreSession.mockResolvedValue({ success: false });
      mockActions.restoreLastSession.mockResolvedValue(true);
      await coordinator.initialize();
      (0, vitest_1.expect)(mockPersistenceService.restoreSession).toHaveBeenCalled();
      (0, vitest_1.expect)(mockActions.restoreLastSession).toHaveBeenCalled();
      (0, vitest_1.expect)(mockActions.ensureMinimumTerminals).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should skip restoration if terminals already exist', async () => {
      mockTerminalManager.getTerminals.mockReturnValue([{ id: 't1' }]);
      await coordinator.initialize();
      (0, vitest_1.expect)(mockPersistenceService.restoreSession).not.toHaveBeenCalled();
      (0, vitest_1.expect)(mockActions.ensureMinimumTerminals).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should handle critical errors with emergency creation', async () => {
      mockActions.initializeTerminal.mockRejectedValue(new Error('Fatal'));
      await coordinator.initialize();
      (0, vitest_1.expect)(mockActions.ensureMinimumTerminals).toHaveBeenCalled();
    });
  });
});
//# sourceMappingURL=TerminalInitializationCoordinator.test.js.map
