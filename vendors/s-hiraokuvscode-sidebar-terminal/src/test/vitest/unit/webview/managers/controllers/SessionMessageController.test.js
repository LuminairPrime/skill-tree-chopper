'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const SessionMessageController_1 = require('../../../../../../webview/managers/controllers/SessionMessageController');
const NotificationUtils = require('../../../../../../webview/utils/NotificationUtils');
vitest_1.vi.mock('../../../../../../webview/utils/NotificationUtils', () => ({
  showSessionRestoreStarted: vitest_1.vi.fn(),
  showSessionRestoreProgress: vitest_1.vi.fn(),
  showSessionRestoreCompleted: vitest_1.vi.fn(),
  showSessionRestoreError: vitest_1.vi.fn(),
  showSessionSaved: vitest_1.vi.fn(),
  showSessionSaveError: vitest_1.vi.fn(),
  showSessionCleared: vitest_1.vi.fn(),
  showSessionRestoreSkipped: vitest_1.vi.fn(),
  showTerminalRestoreError: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('SessionMessageController', () => {
  let controller;
  let mockCoordinator;
  let mockLogger;
  (0, vitest_1.beforeEach)(() => {
    mockLogger = {
      info: vitest_1.vi.fn(),
      warn: vitest_1.vi.fn(),
      error: vitest_1.vi.fn(),
      debug: vitest_1.vi.fn(),
    };
    mockCoordinator = {
      createTerminal: vitest_1.vi.fn().mockResolvedValue(undefined),
    };
    controller = new SessionMessageController_1.SessionMessageController({ logger: mockLogger });
  });
  (0, vitest_1.afterEach)(() => {
    vitest_1.vi.clearAllMocks();
  });
  (0, vitest_1.describe)('handleSessionRestoreMessage', () => {
    (0, vitest_1.it)('should log error if terminalId or terminalName is missing', async () => {
      const msg = { command: 'sessionRestore' }; // missing data
      await controller.handleSessionRestoreMessage(msg, mockCoordinator);
      (0, vitest_1.expect)(mockLogger.error).toHaveBeenCalledWith(
        'Invalid session restore data received',
        vitest_1.expect.anything()
      );
    });
    (0, vitest_1.it)('should use restoreSession if available on coordinator', async () => {
      const msg = {
        command: 'sessionRestore',
        terminalId: 'term-1',
        terminalName: 'Term 1',
        sessionScrollback: ['line 1', 'line 2'],
      };
      const restoreSessionMock = vitest_1.vi.fn().mockResolvedValue(true);
      mockCoordinator.restoreSession = restoreSessionMock;
      await controller.handleSessionRestoreMessage(msg, mockCoordinator);
      (0, vitest_1.expect)(restoreSessionMock).toHaveBeenCalledWith({
        terminalId: 'term-1',
        terminalName: 'Term 1',
        scrollbackData: ['line 1', 'line 2'],
        sessionRestoreMessage: undefined,
      });
      (0, vitest_1.expect)(mockLogger.info).toHaveBeenCalledWith(
        vitest_1.expect.stringContaining('Successfully restored terminal session')
      );
    });
    (0, vitest_1.it)(
      'should fallback to createTerminal if restoreSession returns false',
      async () => {
        const msg = {
          command: 'sessionRestore',
          terminalId: 'term-1',
          terminalName: 'Term 1',
          config: { shell: 'bash' },
        };
        const restoreSessionMock = vitest_1.vi.fn().mockResolvedValue(false);
        mockCoordinator.restoreSession = restoreSessionMock;
        await controller.handleSessionRestoreMessage(msg, mockCoordinator);
        (0, vitest_1.expect)(mockLogger.warn).toHaveBeenCalledWith(
          vitest_1.expect.stringContaining('Session restore failed')
        );
        (0, vitest_1.expect)(mockCoordinator.createTerminal).toHaveBeenCalledWith(
          'term-1',
          'Term 1',
          { shell: 'bash' },
          undefined,
          'extension'
        );
      }
    );
    (0, vitest_1.it)('should use createTerminal if restoreSession is not available', async () => {
      const msg = {
        command: 'sessionRestore',
        terminalId: 'term-1',
        terminalName: 'Term 1',
        config: { shell: 'zsh' },
      };
      // mockCoordinator does not have restoreSession
      await controller.handleSessionRestoreMessage(msg, mockCoordinator);
      (0, vitest_1.expect)(mockCoordinator.createTerminal).toHaveBeenCalledWith(
        'term-1',
        'Term 1',
        { shell: 'zsh' },
        undefined,
        'extension'
      );
    });
    (0, vitest_1.it)(
      'should call restoreTerminalScrollback if message/scrollback exists and createTerminal was used',
      async () => {
        vitest_1.vi.useFakeTimers();
        const msg = {
          command: 'sessionRestore',
          terminalId: 'term-1',
          terminalName: 'Term 1',
          sessionRestoreMessage: 'Restored',
        };
        const restoreTerminalScrollbackMock = vitest_1.vi.fn();
        mockCoordinator.restoreTerminalScrollback = restoreTerminalScrollbackMock;
        await controller.handleSessionRestoreMessage(msg, mockCoordinator);
        vitest_1.vi.runAllTimers();
        (0, vitest_1.expect)(restoreTerminalScrollbackMock).toHaveBeenCalledWith(
          'term-1',
          'Restored',
          []
        );
        vitest_1.vi.useRealTimers();
      }
    );
    (0, vitest_1.it)(
      'should handle errors during creation and try creation again as fallback',
      async () => {
        const msg = {
          command: 'sessionRestore',
          terminalId: 'term-1',
          terminalName: 'Term 1',
        };
        const error = new Error('Creation failed');
        mockCoordinator.createTerminal.mockRejectedValueOnce(error);
        await controller.handleSessionRestoreMessage(msg, mockCoordinator);
        (0, vitest_1.expect)(mockLogger.error).toHaveBeenCalledWith(
          vitest_1.expect.stringContaining('Failed to restore terminal session')
        );
        // Expect fallback creation attempt
        (0, vitest_1.expect)(mockCoordinator.createTerminal).toHaveBeenCalledTimes(2);
      }
    );
  });
  (0, vitest_1.describe)('Notification handlers', () => {
    (0, vitest_1.it)('handleSessionRestoreStartedMessage should call notification util', () => {
      controller.handleSessionRestoreStartedMessage({ command: 'started', terminalCount: 5 });
      (0, vitest_1.expect)(NotificationUtils.showSessionRestoreStarted).toHaveBeenCalledWith(5);
    });
    (0, vitest_1.it)('handleSessionRestoreProgressMessage should call notification util', () => {
      controller.handleSessionRestoreProgressMessage({
        command: 'progress',
        restored: 2,
        total: 5,
      });
      (0, vitest_1.expect)(NotificationUtils.showSessionRestoreProgress).toHaveBeenCalledWith(2, 5);
    });
    (0, vitest_1.it)('handleSessionRestoreCompletedMessage should call notification util', () => {
      controller.handleSessionRestoreCompletedMessage({
        command: 'completed',
        restoredCount: 3,
        skippedCount: 2,
      });
      (0, vitest_1.expect)(NotificationUtils.showSessionRestoreCompleted).toHaveBeenCalledWith(
        3,
        2
      );
    });
    (0, vitest_1.it)('handleSessionRestoreErrorMessage should call notification util', () => {
      controller.handleSessionRestoreErrorMessage({
        command: 'error',
        error: 'Fail',
        partialSuccess: true,
        errorType: 'Timeout',
      });
      (0, vitest_1.expect)(NotificationUtils.showSessionRestoreError).toHaveBeenCalledWith(
        'Fail',
        true,
        'Timeout'
      );
    });
    (0, vitest_1.it)('handleSessionSavedMessage should call notification util', () => {
      controller.handleSessionSavedMessage({ command: 'saved', terminalCount: 10 });
      (0, vitest_1.expect)(NotificationUtils.showSessionSaved).toHaveBeenCalledWith(10);
    });
    (0, vitest_1.it)('handleSessionSaveErrorMessage should call notification util', () => {
      controller.handleSessionSaveErrorMessage({ command: 'saveError', error: 'Disk full' });
      (0, vitest_1.expect)(NotificationUtils.showSessionSaveError).toHaveBeenCalledWith(
        'Disk full'
      );
    });
    (0, vitest_1.it)('handleSessionClearedMessage should call notification util', () => {
      controller.handleSessionClearedMessage();
      (0, vitest_1.expect)(NotificationUtils.showSessionCleared).toHaveBeenCalled();
    });
    (0, vitest_1.it)('handleSessionRestoreSkippedMessage should call notification util', () => {
      controller.handleSessionRestoreSkippedMessage({ command: 'skipped', reason: 'Old' });
      (0, vitest_1.expect)(NotificationUtils.showSessionRestoreSkipped).toHaveBeenCalledWith('Old');
    });
    (0, vitest_1.it)(
      'handleTerminalRestoreErrorMessage should call notification util dynamically imported',
      async () => {
        // Since we mocked the module, dynamic import might return the mocked module in test env usually.
        // However, the implementation does `await import(...)`.
        // Vitest module mocking should handle this if configured correctly, but let's verify.
        await controller.handleTerminalRestoreErrorMessage({
          command: 'termError',
          terminalName: 'T1',
          error: 'Err',
        });
        // The implementation calls showTerminalRestoreError from dynamic import.
        // Assuming vitest mocks the module globally for this file:
        const { showTerminalRestoreError } = await Promise.resolve().then(() =>
          require('../../../../../../webview/utils/NotificationUtils')
        );
        (0, vitest_1.expect)(showTerminalRestoreError).toHaveBeenCalledWith('T1', 'Err');
      }
    );
  });
  (0, vitest_1.describe)('handleSessionRestoredMessage', () => {
    (0, vitest_1.it)('should log success message', () => {
      controller.handleSessionRestoredMessage({
        command: 'restored',
        success: true,
        restoredCount: 5,
        totalCount: 5,
      });
      (0, vitest_1.expect)(mockLogger.info).toHaveBeenCalledWith(
        vitest_1.expect.stringContaining('Session restoration successful')
      );
    });
    (0, vitest_1.it)('should log warning message for partial success', () => {
      controller.handleSessionRestoredMessage({
        command: 'restored',
        success: false,
        restoredCount: 3,
        totalCount: 5,
      });
      (0, vitest_1.expect)(mockLogger.warn).toHaveBeenCalledWith(
        vitest_1.expect.stringContaining('Session restoration partially failed')
      );
    });
  });
});
//# sourceMappingURL=SessionMessageController.test.js.map
