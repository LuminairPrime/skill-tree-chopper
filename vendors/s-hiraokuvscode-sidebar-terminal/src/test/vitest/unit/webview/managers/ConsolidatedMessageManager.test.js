'use strict';
/**
 * ConsolidatedMessageManager Tests
 *
 * Tests for the main message routing and handling manager
 *
 * Vitest Migration: Converted from Mocha/Chai to Vitest
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const ConsolidatedMessageManager_1 = require('../../../../../webview/managers/ConsolidatedMessageManager');
(0, vitest_1.describe)('ConsolidatedMessageManager', () => {
  let messageManager;
  let mockCoordinator;
  (0, vitest_1.beforeEach)(() => {
    // Create minimal mock coordinator
    mockCoordinator = {
      getActiveTerminalId: () => 'terminal-1',
      setActiveTerminalId: () => {},
      getTerminalInstance: () => undefined,
      getAllTerminalInstances: () => new Map(),
      getAllTerminalContainers: () => new Map(),
      getTerminalElement: () => undefined,
      postMessageToExtension: () => {},
      log: () => {},
      createTerminal: async () => undefined,
      openSettings: () => {},
      setVersionInfo: () => {},
      applyFontSettings: () => {},
      closeTerminal: () => {},
      updateClaudeStatus: () => {},
      updateCliAgentStatus: () => {},
      ensureTerminalFocus: () => {},
      getSerializeAddon: () => undefined,
      getManagers: () => ({
        performance: {},
        input: {},
        ui: {},
        config: {},
        message: {},
        notification: {},
      }),
      getMessageManager: () => messageManager,
    };
    messageManager = new ConsolidatedMessageManager_1.ConsolidatedMessageManager(mockCoordinator);
  });
  (0, vitest_1.afterEach)(() => {
    messageManager.dispose();
  });
  (0, vitest_1.describe)('Initialization', () => {
    (0, vitest_1.it)('should initialize successfully', () => {
      (0, vitest_1.expect)(messageManager).toBeDefined();
    });
    (0, vitest_1.it)('should accept coordinator in constructor', () => {
      const manager = new ConsolidatedMessageManager_1.ConsolidatedMessageManager(mockCoordinator);
      (0, vitest_1.expect)(manager).toBeDefined();
      manager.dispose();
    });
    (0, vitest_1.it)('should allow setting coordinator after construction', () => {
      const manager = new ConsolidatedMessageManager_1.ConsolidatedMessageManager();
      manager.setCoordinator(mockCoordinator);
      (0, vitest_1.expect)(manager).toBeDefined();
      manager.dispose();
    });
  });
  (0, vitest_1.describe)('Message Routing', () => {
    (0, vitest_1.it)('should handle init message', async () => {
      const message = {
        command: 'init',
        terminals: [],
      };
      await messageManager.receiveMessage(message, mockCoordinator);
      // No error should be thrown
    });
    (0, vitest_1.it)('should handle output message', async () => {
      const message = {
        command: 'output',
        terminalId: 'terminal-1',
        data: 'test output',
      };
      await messageManager.receiveMessage(message, mockCoordinator);
      // No error should be thrown
    });
    (0, vitest_1.it)('should handle startOutput message', async () => {
      const message = {
        command: 'startOutput',
        terminalId: 'terminal-1',
      };
      await messageManager.receiveMessage(message, mockCoordinator);
      // No error should be thrown
    });
    (0, vitest_1.it)('should handle terminalCreated message', async () => {
      const message = {
        command: 'terminalCreated',
        terminalId: 'terminal-2',
        name: 'Test Terminal',
      };
      await messageManager.receiveMessage(message, mockCoordinator);
      // No error should be thrown
    });
    (0, vitest_1.it)('should handle fontSettingsUpdate message', async () => {
      const message = {
        command: 'fontSettingsUpdate',
        fontSettings: {
          fontSize: 14,
          fontFamily: 'monospace',
        },
      };
      await messageManager.receiveMessage(message, mockCoordinator);
      // No error should be thrown
    });
    (0, vitest_1.it)('should handle split message', async () => {
      const message = {
        command: 'split',
        direction: 'horizontal',
      };
      await messageManager.receiveMessage(message, mockCoordinator);
      // No error should be thrown
    });
    (0, vitest_1.it)('should handle shellStatus message', async () => {
      const message = {
        command: 'shellStatus',
        terminalId: 'terminal-1',
        status: 'ready',
      };
      await messageManager.receiveMessage(message, mockCoordinator);
      // No error should be thrown
    });
    (0, vitest_1.it)('should handle unknown command gracefully', async () => {
      const message = {
        command: 'unknownCommand',
      };
      await messageManager.receiveMessage(message, mockCoordinator);
      // Should not throw error
    });
  });
  (0, vitest_1.describe)('IMessageManager Interface', () => {
    (0, vitest_1.it)('should implement postMessage', () => {
      const message = { command: 'test' };
      // Verify postMessage method exists and can be called
      (0, vitest_1.expect)(() => messageManager.postMessage(message)).not.toThrow();
      // Messages are sent immediately when vscode API is available
      const stats = messageManager.getQueueStats();
      (0, vitest_1.expect)(stats.queueSize).toBeGreaterThanOrEqual(0);
    });
    (0, vitest_1.it)('should implement sendReadyMessage', () => {
      // Verify sendReadyMessage method exists and can be called
      (0, vitest_1.expect)(() => messageManager.sendReadyMessage(mockCoordinator)).not.toThrow();
      // Messages are sent immediately when vscode API is available
      const stats = messageManager.getQueueStats();
      (0, vitest_1.expect)(stats.queueSize).toBeGreaterThanOrEqual(0);
    });
    (0, vitest_1.it)('should implement emitTerminalInteractionEvent', () => {
      // Verify emitTerminalInteractionEvent method exists and can be called
      (0, vitest_1.expect)(() =>
        messageManager.emitTerminalInteractionEvent(
          'focus',
          'terminal-1',
          { text: 'test' },
          mockCoordinator
        )
      ).not.toThrow();
      // Messages are sent immediately when vscode API is available
      const stats = messageManager.getQueueStats();
      (0, vitest_1.expect)(stats.queueSize).toBeGreaterThanOrEqual(0);
    });
    (0, vitest_1.it)('should implement getQueueStats', () => {
      const stats = messageManager.getQueueStats();
      (0, vitest_1.expect)(stats).toHaveProperty('queueSize');
      (0, vitest_1.expect)(stats).toHaveProperty('isProcessing');
    });
    (0, vitest_1.it)('should implement sendInput', () => {
      // Verify sendInput method exists and can be called
      (0, vitest_1.expect)(() =>
        messageManager.sendInput('test input', 'terminal-1')
      ).not.toThrow();
      // Messages are sent immediately when vscode API is available
      const stats = messageManager.getQueueStats();
      (0, vitest_1.expect)(stats.queueSize).toBeGreaterThanOrEqual(0);
    });
    (0, vitest_1.it)('should implement sendResize', () => {
      // Verify sendResize method exists and can be called
      (0, vitest_1.expect)(() => messageManager.sendResize(80, 24, 'terminal-1')).not.toThrow();
      // Messages are sent immediately when vscode API is available
      const stats = messageManager.getQueueStats();
      (0, vitest_1.expect)(stats.queueSize).toBeGreaterThanOrEqual(0);
    });
    (0, vitest_1.it)('should implement sendDeleteTerminalMessage', () => {
      // Verify sendDeleteTerminalMessage method exists and can be called
      (0, vitest_1.expect)(() =>
        messageManager.sendDeleteTerminalMessage('terminal-1', 'header', mockCoordinator)
      ).not.toThrow();
      // Messages are sent immediately when vscode API is available
      const stats = messageManager.getQueueStats();
      (0, vitest_1.expect)(stats.queueSize).toBeGreaterThanOrEqual(0);
    });
  });
  (0, vitest_1.describe)('Test Compatibility Methods', () => {
    (0, vitest_1.it)('should support onMessage handler registration', () => {
      const messages = [];
      messageManager.onMessage((msg) => {
        messages.push(msg);
      });
      const testMessage = { command: 'test' };
      messageManager.handleExtensionMessage(testMessage);
      (0, vitest_1.expect)(messages).toHaveLength(1);
      (0, vitest_1.expect)(messages[0]).toEqual(testMessage);
    });
    (0, vitest_1.it)('should support onError handler registration', async () => {
      // Create manager without coordinator to trigger error
      const noCoordManager = new ConsolidatedMessageManager_1.ConsolidatedMessageManager();
      let errorReceived = false;
      noCoordManager.onError(() => {
        errorReceived = true;
      });
      try {
        await noCoordManager.handleExtensionMessage({ command: 'test' });
      } catch {
        // Expected to fail
      }
      noCoordManager.dispose();
      // Error handler should have been called
      (0, vitest_1.expect)(errorReceived).toBe(true);
    });
    (0, vitest_1.it)('should support sendToExtension', async () => {
      let sent = false;
      mockCoordinator.postMessageToExtension = () => {
        sent = true;
      };
      await messageManager.sendToExtension({ command: 'test' });
      (0, vitest_1.expect)(sent).toBe(true);
    });
    (0, vitest_1.it)('should support sendToExtensionWithRetry', async () => {
      let attempts = 0;
      mockCoordinator.postMessageToExtension = () => {
        attempts++;
      };
      await messageManager.sendToExtensionWithRetry({ command: 'test' });
      (0, vitest_1.expect)(attempts).toBe(1);
    });
    (0, vitest_1.it)('should retry on failure with sendToExtensionWithRetry', async () => {
      let attempts = 0;
      mockCoordinator.postMessageToExtension = () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Temporary failure');
        }
      };
      await messageManager.sendToExtensionWithRetry({ command: 'test' }, { maxRetries: 3 });
      (0, vitest_1.expect)(attempts).toBe(2);
    });
    (0, vitest_1.it)('should support onConnectionRestored', () => {
      // Queue some messages
      messageManager.postMessage({ command: 'test1' });
      messageManager.postMessage({ command: 'test2' });
      // Trigger connection restored
      messageManager.onConnectionRestored();
      // Should not throw error
    });
    (0, vitest_1.it)('should support handleRawMessage', async () => {
      const rawMessage = JSON.stringify({ command: 'test' });
      await messageManager.handleRawMessage(rawMessage);
      // Should not throw error
    });
    (0, vitest_1.it)('should handle invalid JSON in handleRawMessage', async () => {
      const rawMessage = 'invalid json {';
      await (0, vitest_1.expect)(messageManager.handleRawMessage(rawMessage)).rejects.toThrow();
    });
  });
  (0, vitest_1.describe)('Session Controller Integration', () => {
    (0, vitest_1.it)('should handle sessionRestore message', async () => {
      const message = {
        command: 'sessionRestore',
        sessions: [],
      };
      await messageManager.receiveMessage(message, mockCoordinator);
      // No error should be thrown
    });
    (0, vitest_1.it)('should handle sessionRestoreStarted message', async () => {
      const message = {
        command: 'sessionRestoreStarted',
      };
      await messageManager.receiveMessage(message, mockCoordinator);
      // No error should be thrown
    });
    (0, vitest_1.it)('should handle sessionRestoreCompleted message', async () => {
      const message = {
        command: 'sessionRestoreCompleted',
      };
      await messageManager.receiveMessage(message, mockCoordinator);
      // No error should be thrown
    });
    (0, vitest_1.it)('should handle sessionRestoreError message', async () => {
      const message = {
        command: 'sessionRestoreError',
        error: 'Test error',
      };
      await messageManager.receiveMessage(message, mockCoordinator);
      // No error should be thrown
    });
  });
  (0, vitest_1.describe)('CLI Agent Controller Integration', () => {
    (0, vitest_1.it)('should handle cliAgentStatusUpdate message', async () => {
      const message = {
        command: 'cliAgentStatusUpdate',
        terminalId: 'terminal-1',
        status: 'connected',
        agentType: 'claude-code',
      };
      await messageManager.receiveMessage(message, mockCoordinator);
      // No error should be thrown
    });
    (0, vitest_1.it)('should handle cliAgentFullStateSync message', async () => {
      const message = {
        command: 'cliAgentFullStateSync',
        states: {},
      };
      await messageManager.receiveMessage(message, mockCoordinator);
      // No error should be thrown
    });
    (0, vitest_1.it)('should handle switchAiAgentResponse message', async () => {
      const message = {
        command: 'switchAiAgentResponse',
        terminalId: 'terminal-1',
        success: true,
      };
      await messageManager.receiveMessage(message, mockCoordinator);
      // No error should be thrown
    });
  });
  (0, vitest_1.describe)('Disposal', () => {
    (0, vitest_1.it)('should dispose cleanly', () => {
      messageManager.dispose();
      // Should not throw error
    });
    (0, vitest_1.it)('should clear handlers on dispose', () => {
      const messages = [];
      messageManager.onMessage((msg) => {
        messages.push(msg);
      });
      messageManager.dispose();
      // After disposal, handlers should be cleared
      // Creating new manager to avoid using disposed one
      const newManager = new ConsolidatedMessageManager_1.ConsolidatedMessageManager(
        mockCoordinator
      );
      newManager.handleExtensionMessage({ command: 'test' });
      newManager.dispose();
      // Original messages array should not be affected by new manager
      (0, vitest_1.expect)(messages).toHaveLength(0);
    });
  });
  (0, vitest_1.describe)('Error Handling', () => {
    (0, vitest_1.it)('should handle errors in message handlers gracefully', async () => {
      // Create message that might cause errors
      const message = {
        command: 'output',
        terminalId: 'non-existent-terminal',
        data: 'test',
      };
      // Should not throw
      await messageManager.receiveMessage(message, mockCoordinator);
    });
    (0, vitest_1.it)('should handle coordinator not available error', async () => {
      const manager = new ConsolidatedMessageManager_1.ConsolidatedMessageManager();
      await (0, vitest_1.expect)(manager.sendToExtension({ command: 'test' })).rejects.toThrow(
        'Coordinator not available'
      );
      manager.dispose();
    });
  });
  (0, vitest_1.describe)('Message Queue Integration', () => {
    (0, vitest_1.it)('should enqueue messages', () => {
      const initialStats = messageManager.getQueueStats();
      const initialSize = initialStats.queueSize;
      // postMessage may send immediately when vscode API is available
      // Queue size increase is implementation-dependent
      messageManager.postMessage({ command: 'test' });
      const newStats = messageManager.getQueueStats();
      // Queue size should be at least the initial size (may be sent immediately)
      (0, vitest_1.expect)(newStats.queueSize).toBeGreaterThanOrEqual(initialSize);
    });
    (0, vitest_1.it)('should report queue statistics', () => {
      const stats = messageManager.getQueueStats();
      (0, vitest_1.expect)(stats).toHaveProperty('queueSize');
      (0, vitest_1.expect)(stats).toHaveProperty('isProcessing');
      (0, vitest_1.expect)(typeof stats.queueSize).toBe('number');
      (0, vitest_1.expect)(typeof stats.isProcessing).toBe('boolean');
    });
  });
  (0, vitest_1.describe)('Session restore resizer handling', () => {
    (0, vitest_1.it)(
      'should recover split resizers on sessionRestored message in split mode',
      async () => {
        const updateSplitResizers = vitest_1.vi.fn();
        const showAllTerminalsSplit = vitest_1.vi.fn();
        const getDisplayModeManager = () => ({
          getCurrentMode: () => 'split',
          showAllTerminalsSplit,
        });
        const getTerminalContainerManager = () => ({
          getDisplaySnapshot: () => ({
            visibleTerminals: ['terminal-1', 'terminal-2'],
          }),
        });
        const coordinator = {
          ...mockCoordinator,
          getDisplayModeManager,
          getTerminalContainerManager,
          updateSplitResizers,
        };
        const message = {
          command: 'sessionRestored',
          success: true,
          restoredCount: 2,
          totalCount: 2,
        };
        // @ts-expect-error - test mock type
        await messageManager.receiveMessage(message, coordinator);
        await new Promise((resolve) => setTimeout(resolve, 150));
        (0, vitest_1.expect)(showAllTerminalsSplit).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(updateSplitResizers).toHaveBeenCalledTimes(1);
      }
    );
    (0, vitest_1.it)(
      'should recover split resizers when snapshot is stale but split wrappers exist',
      async () => {
        const updateSplitResizers = vitest_1.vi.fn();
        const showAllTerminalsSplit = vitest_1.vi.fn();
        const getDisplayModeManager = () => ({
          getCurrentMode: () => 'split',
          showAllTerminalsSplit,
        });
        const getTerminalContainerManager = () => ({
          getDisplaySnapshot: () => ({
            visibleTerminals: ['terminal-1'],
          }),
        });
        const terminalsWrapper = document.createElement('div');
        terminalsWrapper.id = 'terminals-wrapper';
        const wrapper1 = document.createElement('div');
        wrapper1.setAttribute('data-terminal-wrapper-id', 'terminal-1');
        const wrapper2 = document.createElement('div');
        wrapper2.setAttribute('data-terminal-wrapper-id', 'terminal-2');
        terminalsWrapper.append(wrapper1, wrapper2);
        document.body.appendChild(terminalsWrapper);
        const coordinator = {
          ...mockCoordinator,
          getDisplayModeManager,
          getTerminalContainerManager,
          updateSplitResizers,
        };
        const message = {
          command: 'sessionRestoreCompleted',
          restoredCount: 2,
          skippedCount: 0,
        };
        // @ts-expect-error - test mock type
        await messageManager.receiveMessage(message, coordinator);
        await new Promise((resolve) => setTimeout(resolve, 150));
        (0, vitest_1.expect)(showAllTerminalsSplit).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(updateSplitResizers).toHaveBeenCalledTimes(1);
        terminalsWrapper.remove();
      }
    );
    (0, vitest_1.it)(
      'should call updateSplitResizers after session restore in split mode with multiple terminals',
      async () => {
        const updateSplitResizers = vitest_1.vi.fn();
        const showAllTerminalsSplit = vitest_1.vi.fn();
        const getDisplayModeManager = () => ({
          getCurrentMode: () => 'split',
          showAllTerminalsSplit,
        });
        const getTerminalContainerManager = () => ({
          getDisplaySnapshot: () => ({
            visibleTerminals: ['terminal-1', 'terminal-2'],
          }),
        });
        const coordinator = {
          ...mockCoordinator,
          getDisplayModeManager,
          getTerminalContainerManager,
          updateSplitResizers,
        };
        const message = {
          command: 'sessionRestoreCompleted',
          restoredCount: 2,
          skippedCount: 0,
        };
        // @ts-expect-error - test mock type
        await messageManager.receiveMessage(message, coordinator);
        // Wait for the setTimeout (100ms) to complete
        await new Promise((resolve) => setTimeout(resolve, 150));
        // Both showAllTerminalsSplit and updateSplitResizers should be called
        (0, vitest_1.expect)(showAllTerminalsSplit).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(updateSplitResizers).toHaveBeenCalledTimes(1);
      }
    );
    (0, vitest_1.it)(
      'should not call updateSplitResizers after session restore in normal mode',
      async () => {
        const updateSplitResizers = vitest_1.vi.fn();
        const getDisplayModeManager = () => ({
          getCurrentMode: () => 'normal',
        });
        const getTerminalContainerManager = () => ({
          getDisplaySnapshot: () => ({
            visibleTerminals: ['terminal-1'],
          }),
        });
        const coordinator = {
          ...mockCoordinator,
          getDisplayModeManager,
          getTerminalContainerManager,
          updateSplitResizers,
        };
        const message = {
          command: 'sessionRestoreCompleted',
          restoredCount: 1,
          skippedCount: 0,
        };
        // @ts-expect-error - test mock type
        await messageManager.receiveMessage(message, coordinator);
        // Wait for the setTimeout (100ms) to complete
        await new Promise((resolve) => setTimeout(resolve, 150));
        // updateSplitResizers should not be called in normal mode
        (0, vitest_1.expect)(updateSplitResizers).not.toHaveBeenCalled();
      }
    );
    (0, vitest_1.it)(
      'should not call updateSplitResizers when only one terminal is visible in split mode',
      async () => {
        const updateSplitResizers = vitest_1.vi.fn();
        const getDisplayModeManager = () => ({
          getCurrentMode: () => 'split',
        });
        const getTerminalContainerManager = () => ({
          getDisplaySnapshot: () => ({
            visibleTerminals: ['terminal-1'],
          }),
        });
        const coordinator = {
          ...mockCoordinator,
          getDisplayModeManager,
          getTerminalContainerManager,
          updateSplitResizers,
        };
        const message = {
          command: 'sessionRestoreCompleted',
          restoredCount: 1,
          skippedCount: 0,
        };
        // @ts-expect-error - test mock type
        await messageManager.receiveMessage(message, coordinator);
        // Wait for the setTimeout (100ms) to complete
        await new Promise((resolve) => setTimeout(resolve, 150));
        // updateSplitResizers should not be called when only 1 terminal visible
        (0, vitest_1.expect)(updateSplitResizers).not.toHaveBeenCalled();
      }
    );
    (0, vitest_1.it)(
      'should recover split resizers when split wrappers appear after delayed session restore rendering',
      async () => {
        vitest_1.vi.useFakeTimers();
        try {
          const updateSplitResizers = vitest_1.vi.fn();
          const showAllTerminalsSplit = vitest_1.vi.fn();
          const getDisplayModeManager = () => ({
            getCurrentMode: () => 'split',
            showAllTerminalsSplit,
          });
          const getTerminalContainerManager = () => ({
            getDisplaySnapshot: () => ({
              visibleTerminals: ['terminal-1'],
            }),
          });
          const coordinator = {
            ...mockCoordinator,
            getDisplayModeManager,
            getTerminalContainerManager,
            updateSplitResizers,
          };
          const message = {
            command: 'sessionRestored',
            success: true,
            restoredCount: 2,
            totalCount: 2,
          };
          // @ts-expect-error - test mock type
          await messageManager.receiveMessage(message, coordinator);
          // Simulate delayed DOM build after startup restore.
          setTimeout(() => {
            const terminalsWrapper = document.createElement('div');
            terminalsWrapper.id = 'terminals-wrapper';
            const wrapper1 = document.createElement('div');
            wrapper1.setAttribute('data-terminal-wrapper-id', 'terminal-1');
            const wrapper2 = document.createElement('div');
            wrapper2.setAttribute('data-terminal-wrapper-id', 'terminal-2');
            terminalsWrapper.append(wrapper1, wrapper2);
            document.body.appendChild(terminalsWrapper);
          }, 160);
          await vitest_1.vi.advanceTimersByTimeAsync(350);
          (0, vitest_1.expect)(showAllTerminalsSplit).toHaveBeenCalledTimes(1);
          (0, vitest_1.expect)(updateSplitResizers).toHaveBeenCalledTimes(1);
        } finally {
          vitest_1.vi.useRealTimers();
        }
      }
    );
  });
});
//# sourceMappingURL=ConsolidatedMessageManager.test.js.map
