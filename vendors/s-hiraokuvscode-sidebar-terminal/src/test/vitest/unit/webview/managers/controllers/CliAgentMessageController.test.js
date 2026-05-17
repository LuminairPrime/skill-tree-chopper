'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const CliAgentMessageController_1 = require('../../../../../../webview/managers/controllers/CliAgentMessageController');
(0, vitest_1.describe)('CliAgentMessageController', () => {
  let controller;
  let mockCoordinator;
  let mockLogger;
  let mockNotificationManager;
  (0, vitest_1.beforeEach)(() => {
    mockLogger = {
      info: vitest_1.vi.fn(),
      warn: vitest_1.vi.fn(),
      error: vitest_1.vi.fn(),
      debug: vitest_1.vi.fn(),
    };
    mockNotificationManager = {
      showNotificationInTerminal: vitest_1.vi.fn(),
    };
    mockCoordinator = {
      updateCliAgentStatus: vitest_1.vi.fn(),
      getAllTerminalInstances: vitest_1.vi.fn().mockReturnValue(new Map([['term-1', {}]])),
      getManagers: vitest_1.vi.fn().mockReturnValue({
        notification: mockNotificationManager,
      }),
    };
    controller = new CliAgentMessageController_1.CliAgentMessageController({ logger: mockLogger });
  });
  (0, vitest_1.describe)('handleStatusUpdateMessage', () => {
    (0, vitest_1.it)('should log warning if no cliAgentStatus is present', () => {
      const msg = { command: 'statusUpdate' };
      controller.handleStatusUpdateMessage(msg, mockCoordinator);
      (0, vitest_1.expect)(mockLogger.warn).toHaveBeenCalledWith(
        'No CLI Agent status data in message'
      );
    });
    (0, vitest_1.it)('should update status using provided terminalId', () => {
      const msg = {
        command: 'statusUpdate',
        // @ts-expect-error - test mock type
        cliAgentStatus: {
          terminalId: 'term-1',
          status: 'connected',
          activeTerminalName: 'Terminal 1',
        },
      };
      controller.handleStatusUpdateMessage(msg, mockCoordinator);
      (0, vitest_1.expect)(mockCoordinator.updateCliAgentStatus).toHaveBeenCalledWith(
        'term-1',
        'connected',
        null
      );
      (0, vitest_1.expect)(mockLogger.info).toHaveBeenCalledWith(
        vitest_1.expect.stringContaining('CLI Agent status updated successfully')
      );
    });
    (0, vitest_1.it)(
      'should extract terminalId from activeTerminalName if terminalId missing',
      () => {
        const msg = {
          command: 'statusUpdate',
          // @ts-expect-error - test mock type
          cliAgentStatus: {
            status: 'connected',
            activeTerminalName: 'Terminal 2',
          },
        };
        controller.handleStatusUpdateMessage(msg, mockCoordinator);
        (0, vitest_1.expect)(mockCoordinator.updateCliAgentStatus).toHaveBeenCalledWith(
          '2',
          'connected',
          null
        );
      }
    );
    (0, vitest_1.it)(
      'should use fallback terminalId if neither ID nor name allows extraction',
      () => {
        // simulate extracted ID being empty or relying on fallback logic
        const msg = {
          command: 'statusUpdate',
          // @ts-expect-error - test mock type
          cliAgentStatus: {
            status: 'connected',
            activeTerminalName: '', // Empty name
          },
        };
        controller.handleStatusUpdateMessage(msg, mockCoordinator);
        (0, vitest_1.expect)(mockCoordinator.updateCliAgentStatus).toHaveBeenCalledWith(
          'term-1', // fallback from mockCoordinator.getAllTerminalInstances().keys()[0]
          'connected',
          null
        );
        (0, vitest_1.expect)(mockLogger.warn).toHaveBeenCalledWith(
          vitest_1.expect.stringContaining('Using fallback terminalId')
        );
      }
    );
    (0, vitest_1.it)('should map legacy status correctly', () => {
      const statuses = [
        { input: 'connected', expected: 'connected' },
        { input: 'disconnected', expected: 'disconnected' },
        { input: 'inactive', expected: 'none' },
        { input: 'terminated', expected: 'none' },
        { input: 'unknown', expected: 'none' },
      ];
      statuses.forEach(({ input, expected }) => {
        const msg = {
          command: 'statusUpdate',
          cliAgentStatus: {
            terminalId: 'term-1',
            // @ts-expect-error - test mock type
            status: input,
          },
        };
        controller.handleStatusUpdateMessage(msg, mockCoordinator);
        (0, vitest_1.expect)(mockCoordinator.updateCliAgentStatus).toHaveBeenCalledWith(
          'term-1',
          expected,
          null
        );
      });
    });
    (0, vitest_1.it)('should handle errors gracefully', () => {
      const msg = {
        command: 'statusUpdate',
        // @ts-expect-error - test mock type
        cliAgentStatus: { terminalId: 'term-1', status: 'connected' },
      };
      const error = new Error('Update failed');
      mockCoordinator.updateCliAgentStatus.mockImplementation(() => {
        throw error;
      });
      controller.handleStatusUpdateMessage(msg, mockCoordinator);
      (0, vitest_1.expect)(mockLogger.error).toHaveBeenCalledWith(
        'Error updating CLI Agent status',
        error
      );
    });
  });
  (0, vitest_1.describe)('handleFullStateSyncMessage', () => {
    (0, vitest_1.it)('should log warning if no terminalStates data', () => {
      const msg = { command: 'fullStateSync' };
      controller.handleFullStateSyncMessage(msg, mockCoordinator);
      (0, vitest_1.expect)(mockLogger.warn).toHaveBeenCalledWith(
        'No terminal states data in full state sync message'
      );
    });
    (0, vitest_1.it)('should update multiple terminals', () => {
      const msg = {
        command: 'fullStateSync',
        terminalStates: {
          'term-1': { status: 'connected', agentType: 'claude' },
          'term-2': { status: 'disconnected', agentType: null },
        },
      };
      controller.handleFullStateSyncMessage(msg, mockCoordinator);
      (0, vitest_1.expect)(mockCoordinator.updateCliAgentStatus).toHaveBeenCalledWith(
        'term-1',
        'connected',
        'claude'
      );
      (0, vitest_1.expect)(mockCoordinator.updateCliAgentStatus).toHaveBeenCalledWith(
        'term-2',
        'disconnected',
        null
      );
      (0, vitest_1.expect)(mockLogger.info).toHaveBeenCalledWith(
        'Full CLI Agent state sync completed successfully'
      );
    });
    (0, vitest_1.it)('should continue processing other terminals if one fails', () => {
      const msg = {
        command: 'fullStateSync',
        terminalStates: {
          'term-1': { status: 'connected', agentType: 'claude' },
          'term-2': { status: 'disconnected', agentType: null },
        },
      };
      const error = new Error('Fail');
      mockCoordinator.updateCliAgentStatus.mockImplementationOnce(() => {
        throw error;
      });
      controller.handleFullStateSyncMessage(msg, mockCoordinator);
      (0, vitest_1.expect)(mockLogger.error).toHaveBeenCalledWith(
        'Error updating terminal term-1',
        error
      );
      (0, vitest_1.expect)(mockCoordinator.updateCliAgentStatus).toHaveBeenCalledWith(
        'term-2',
        'disconnected',
        null
      );
    });
  });
  (0, vitest_1.describe)('handleSwitchResponseMessage', () => {
    (0, vitest_1.it)('should warn if notification manager is missing', () => {
      mockCoordinator.getManagers.mockReturnValue({});
      const msg = { command: 'switchResponse', terminalId: 'term-1' };
      controller.handleSwitchResponseMessage(msg, mockCoordinator);
      (0, vitest_1.expect)(mockLogger.warn).toHaveBeenCalledWith(
        'NotificationManager not available for AI Agent feedback'
      );
    });
    (0, vitest_1.it)('should show success notification on forced reconnect', () => {
      const msg = {
        command: 'switchResponse',
        terminalId: 'term-1',
        success: true,
        newStatus: 'connected',
        isForceReconnect: true,
      };
      controller.handleSwitchResponseMessage(msg, mockCoordinator);
      (0, vitest_1.expect)(mockNotificationManager.showNotificationInTerminal).toHaveBeenCalledWith(
        '📎 AI Agent Connected',
        'success'
      );
      (0, vitest_1.expect)(mockLogger.info).toHaveBeenCalledWith(
        'AI Agent operation succeeded',
        vitest_1.expect.anything()
      );
    });
    (0, vitest_1.it)('should show error notification on failure', () => {
      const msg = {
        command: 'switchResponse',
        terminalId: 'term-1',
        success: false,
        reason: 'Connection refused',
      };
      controller.handleSwitchResponseMessage(msg, mockCoordinator);
      (0, vitest_1.expect)(mockNotificationManager.showNotificationInTerminal).toHaveBeenCalledWith(
        '❌ AI Agent operation failed',
        'error'
      );
      (0, vitest_1.expect)(mockLogger.error).toHaveBeenCalledWith(
        'AI Agent operation failed',
        vitest_1.expect.anything()
      );
    });
  });
});
//# sourceMappingURL=CliAgentMessageController.test.js.map
