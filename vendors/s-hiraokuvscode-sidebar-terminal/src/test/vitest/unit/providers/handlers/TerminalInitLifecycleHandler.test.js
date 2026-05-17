'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
/**
 * TerminalInitLifecycleHandler Tests
 *
 * Tests for the terminal initialization lifecycle handler extracted from
 * SecondaryTerminalProvider. Covers terminal ready, init complete, watchdog
 * registration, and terminal ensure logic.
 */
const vitest_1 = require('vitest');
vitest_1.vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vitest_1.vi.fn().mockReturnValue({
      get: vitest_1.vi.fn().mockReturnValue(false),
    }),
  },
}));
vitest_1.vi.mock('../../../../../shared/constants', () => ({
  SHARED_TERMINAL_COMMANDS: {
    START_OUTPUT: 'startOutput',
  },
}));
vitest_1.vi.mock('../../../../../constants', () => ({
  TERMINAL_CONSTANTS: {
    COMMANDS: {
      START_OUTPUT: 'startOutput',
    },
  },
}));
const TerminalInitLifecycleHandler_1 = require('../../../../../providers/handlers/TerminalInitLifecycleHandler');
function createMockDeps(overrides = {}) {
  return {
    getTerminal: vitest_1.vi.fn().mockReturnValue({ id: 'term-1', ptyProcess: {} }),
    getTerminals: vitest_1.vi.fn().mockReturnValue([]),
    getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('term-1'),
    createTerminal: vitest_1.vi.fn().mockReturnValue('term-2'),
    setActiveTerminal: vitest_1.vi.fn(),
    initializeShellForTerminal: vitest_1.vi.fn(),
    startPtyOutput: vitest_1.vi.fn(),
    consumeCreationDisplayModeOverride: vitest_1.vi.fn().mockReturnValue(undefined),
    getCurrentState: vitest_1.vi
      .fn()
      .mockReturnValue({ terminals: [], activeTerminalId: 'term-1' }),
    onTerminalCreated: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    onTerminalRemoved: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    sendMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
    getCurrentFontSettings: vitest_1.vi
      .fn()
      .mockReturnValue({ fontSize: 14, fontFamily: 'monospace' }),
    sendFullCliAgentStateSync: vitest_1.vi.fn(),
    addDisposable: vitest_1.vi.fn(),
    isWebViewInitialized: vitest_1.vi.fn().mockReturnValue(true),
    watchdogCoordinator: {
      recordInitStart: vitest_1.vi.fn(),
      startForTerminal: vitest_1.vi.fn(),
      stopForTerminal: vitest_1.vi.fn(),
      addPendingTerminal: vitest_1.vi.fn(),
      getPhase: vitest_1.vi.fn().mockReturnValue('ack'),
      isInSafeMode: vitest_1.vi.fn().mockReturnValue(false),
      clearSafeMode: vitest_1.vi.fn(),
      markInitSuccess: vitest_1.vi.fn(),
      startPendingWatchdogs: vitest_1.vi.fn(),
    },
    terminalInitStateMachine: {
      getState: vitest_1.vi.fn().mockReturnValue(0),
      markViewPending: vitest_1.vi.fn(),
      markPtySpawned: vitest_1.vi.fn(),
      markViewReady: vitest_1.vi.fn(),
      markShellInitializing: vitest_1.vi.fn(),
      markShellInitialized: vitest_1.vi.fn(),
      markOutputStreaming: vitest_1.vi.fn(),
      markPromptReady: vitest_1.vi.fn(),
      markFailed: vitest_1.vi.fn(),
      reset: vitest_1.vi.fn(),
    },
    eventCoordinator: {
      flushBufferedOutput: vitest_1.vi.fn(),
    },
    safeProcessCwd: vitest_1.vi.fn().mockReturnValue('/home/user'),
    ...overrides,
  };
}
(0, vitest_1.describe)('TerminalInitLifecycleHandler', () => {
  let handler;
  let deps;
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
    deps = createMockDeps();
    handler = new TerminalInitLifecycleHandler_1.TerminalInitLifecycleHandler(deps);
  });
  (0, vitest_1.describe)('handleTerminalReady', () => {
    (0, vitest_1.it)('should return early when terminalId is missing', async () => {
      const msg = { command: 'terminalReady' };
      await handler.handleTerminalReady(msg);
      (0, vitest_1.expect)(deps.watchdogCoordinator.startForTerminal).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)(
      'should advance state to ViewReady when state is below ViewReady',
      async () => {
        deps.terminalInitStateMachine.getState.mockReturnValue(0);
        const msg = {
          command: 'terminalReady',
          terminalId: 'term-1',
        };
        await handler.handleTerminalReady(msg);
        (0, vitest_1.expect)(deps.terminalInitStateMachine.markViewReady).toHaveBeenCalledWith(
          'term-1',
          'terminalReady'
        );
        (0, vitest_1.expect)(deps.watchdogCoordinator.startForTerminal).toHaveBeenCalledWith(
          'term-1',
          'prompt',
          'terminalReady'
        );
      }
    );
    (0, vitest_1.it)('should not advance state when already at or above ViewReady', async () => {
      deps.terminalInitStateMachine.getState.mockReturnValue(3);
      const msg = {
        command: 'terminalReady',
        terminalId: 'term-1',
      };
      await handler.handleTerminalReady(msg);
      (0, vitest_1.expect)(deps.terminalInitStateMachine.markViewReady).not.toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('handleTerminalInitializationComplete', () => {
    (0, vitest_1.it)('should return early when terminalId is missing', async () => {
      const msg = { command: 'terminalInitializationComplete' };
      await handler.handleTerminalInitializationComplete(msg);
      (0, vitest_1.expect)(deps.watchdogCoordinator.stopForTerminal).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)(
      'should ignore duplicate when prompt phase already active and past ViewReady',
      async () => {
        deps.watchdogCoordinator.getPhase.mockReturnValue('prompt');
        deps.terminalInitStateMachine.getState.mockReturnValue(2); // ViewReady
        const msg = {
          command: 'terminalInitializationComplete',
          terminalId: 'term-1',
        };
        await handler.handleTerminalInitializationComplete(msg);
        (0, vitest_1.expect)(deps.initializeShellForTerminal).not.toHaveBeenCalled();
      }
    );
    (0, vitest_1.it)('should retry when terminal pty is not ready', async () => {
      vitest_1.vi.useFakeTimers();
      deps.getTerminal.mockReturnValue({ id: 'term-1' }); // no ptyProcess
      deps.watchdogCoordinator.getPhase.mockReturnValue('ack');
      const msg = {
        command: 'terminalInitializationComplete',
        terminalId: 'term-1',
      };
      await handler.handleTerminalInitializationComplete(msg);
      // Should schedule a retry
      (0, vitest_1.expect)(deps.initializeShellForTerminal).not.toHaveBeenCalled();
      vitest_1.vi.useRealTimers();
    });
    (0, vitest_1.it)('should give up after max retries', async () => {
      vitest_1.vi.useFakeTimers();
      deps.getTerminal.mockReturnValue(null);
      deps.watchdogCoordinator.getPhase.mockReturnValue('ack');
      const msg = {
        command: 'terminalInitializationComplete',
        terminalId: 'term-1',
      };
      // Call 6 times to exceed max retries of 5
      for (let i = 0; i < 6; i++) {
        await handler.handleTerminalInitializationComplete(msg);
      }
      (0, vitest_1.expect)(deps.initializeShellForTerminal).not.toHaveBeenCalled();
      vitest_1.vi.useRealTimers();
    });
    (0, vitest_1.it)('should initialize shell and start pty output on success', async () => {
      deps.watchdogCoordinator.getPhase.mockReturnValue('ack');
      deps.terminalInitStateMachine.getState.mockReturnValue(1);
      const msg = {
        command: 'terminalInitializationComplete',
        terminalId: 'term-1',
      };
      await handler.handleTerminalInitializationComplete(msg);
      (0, vitest_1.expect)(deps.watchdogCoordinator.stopForTerminal).toHaveBeenCalledWith(
        'term-1',
        'webviewAck'
      );
      (0, vitest_1.expect)(deps.terminalInitStateMachine.markViewReady).toHaveBeenCalledWith(
        'term-1',
        'webviewAck'
      );
      (0, vitest_1.expect)(deps.initializeShellForTerminal).toHaveBeenCalledWith(
        'term-1',
        {},
        false
      );
      (0, vitest_1.expect)(deps.startPtyOutput).toHaveBeenCalledWith('term-1');
      (0, vitest_1.expect)(deps.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          command: 'startOutput',
          terminalId: 'term-1',
        })
      );
      (0, vitest_1.expect)(deps.terminalInitStateMachine.markPromptReady).toHaveBeenCalledWith(
        'term-1',
        'startOutput'
      );
      (0, vitest_1.expect)(deps.watchdogCoordinator.markInitSuccess).toHaveBeenCalledWith('term-1');
    });
    (0, vitest_1.it)('should handle shell initialization failure gracefully', async () => {
      deps.watchdogCoordinator.getPhase.mockReturnValue('ack');
      deps.terminalInitStateMachine.getState.mockReturnValue(1);
      deps.initializeShellForTerminal.mockImplementation(() => {
        throw new Error('shell init failed');
      });
      const msg = {
        command: 'terminalInitializationComplete',
        terminalId: 'term-1',
      };
      await handler.handleTerminalInitializationComplete(msg);
      (0, vitest_1.expect)(deps.terminalInitStateMachine.markFailed).toHaveBeenCalledWith(
        'term-1',
        'initializeShell'
      );
      (0, vitest_1.expect)(deps.startPtyOutput).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should handle pty output start failure gracefully', async () => {
      deps.watchdogCoordinator.getPhase.mockReturnValue('ack');
      deps.terminalInitStateMachine.getState.mockReturnValue(1);
      deps.startPtyOutput.mockImplementation(() => {
        throw new Error('pty output failed');
      });
      const msg = {
        command: 'terminalInitializationComplete',
        terminalId: 'term-1',
      };
      await handler.handleTerminalInitializationComplete(msg);
      (0, vitest_1.expect)(deps.terminalInitStateMachine.markFailed).toHaveBeenCalledWith(
        'term-1',
        'startPtyOutput'
      );
    });
  });
  (0, vitest_1.describe)('sendInitializationComplete', () => {
    (0, vitest_1.it)('should send initializationComplete message with terminal count', async () => {
      await handler.sendInitializationComplete(3);
      (0, vitest_1.expect)(deps.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          command: 'initializationComplete',
          terminalCount: 3,
        })
      );
    });
  });
  (0, vitest_1.describe)('initializeTerminal', () => {
    (0, vitest_1.it)('should send terminalCreated for each existing terminal', async () => {
      deps.getTerminals.mockReturnValue([
        { id: 'term-1', name: 'Terminal 1', cwd: '/home' },
        { id: 'term-2', name: 'Terminal 2', cwd: '/tmp' },
      ]);
      deps.getActiveTerminalId.mockReturnValue('term-1');
      await handler.initializeTerminal();
      (0, vitest_1.expect)(deps.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          command: 'terminalCreated',
          terminal: vitest_1.expect.objectContaining({ id: 'term-1', isActive: true }),
        })
      );
      (0, vitest_1.expect)(deps.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          command: 'terminalCreated',
          terminal: vitest_1.expect.objectContaining({ id: 'term-2', isActive: false }),
        })
      );
    });
    (0, vitest_1.it)('should send stateUpdate after terminal creation messages', async () => {
      deps.getTerminals.mockReturnValue([]);
      await handler.initializeTerminal();
      (0, vitest_1.expect)(deps.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({ command: 'stateUpdate' })
      );
    });
    (0, vitest_1.it)('should include font settings in config', async () => {
      deps.getTerminals.mockReturnValue([{ id: 'term-1', name: 'T1' }]);
      await handler.initializeTerminal();
      (0, vitest_1.expect)(deps.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          config: vitest_1.expect.objectContaining({
            fontSettings: { fontSize: 14, fontFamily: 'monospace' },
          }),
        })
      );
    });
    (0, vitest_1.it)('should include displayModeOverride when present', async () => {
      deps.getTerminals.mockReturnValue([{ id: 'term-1', name: 'T1' }]);
      deps.consumeCreationDisplayModeOverride.mockReturnValue('tab');
      await handler.initializeTerminal();
      (0, vitest_1.expect)(deps.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          config: vitest_1.expect.objectContaining({ displayModeOverride: 'tab' }),
        })
      );
    });
  });
  (0, vitest_1.describe)('ensureMultipleTerminals', () => {
    (0, vitest_1.it)('should create a terminal when none exist', () => {
      deps.getTerminals.mockReturnValue([]);
      handler.ensureMultipleTerminals();
      (0, vitest_1.expect)(deps.createTerminal).toHaveBeenCalled();
      (0, vitest_1.expect)(deps.setActiveTerminal).toHaveBeenCalledWith('term-2');
    });
    (0, vitest_1.it)('should not create a terminal when one already exists', () => {
      deps.getTerminals.mockReturnValue([{ id: 'term-1' }]);
      handler.ensureMultipleTerminals();
      (0, vitest_1.expect)(deps.createTerminal).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should handle createTerminal returning null gracefully', () => {
      deps.getTerminals.mockReturnValue([]);
      deps.createTerminal.mockReturnValue(null);
      handler.ensureMultipleTerminals();
      (0, vitest_1.expect)(deps.setActiveTerminal).not.toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('syncTerminalStateToWebView', () => {
    (0, vitest_1.it)('should re-initialize terminals and sync CLI agent state', async () => {
      deps.getTerminals.mockReturnValue([]);
      handler.syncTerminalStateToWebView();
      (0, vitest_1.expect)(deps.sendFullCliAgentStateSync).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('registerInitializationWatchdogs', () => {
    (0, vitest_1.it)('should register onTerminalCreated and onTerminalRemoved listeners', () => {
      handler.registerInitializationWatchdogs();
      (0, vitest_1.expect)(deps.onTerminalCreated).toHaveBeenCalled();
      (0, vitest_1.expect)(deps.onTerminalRemoved).toHaveBeenCalled();
      (0, vitest_1.expect)(deps.addDisposable).toHaveBeenCalledTimes(2);
    });
    (0, vitest_1.it)(
      'should start watchdog for existing terminals when webview is initialized',
      () => {
        deps.getTerminals.mockReturnValue([{ id: 'term-1' }]);
        deps.isWebViewInitialized.mockReturnValue(true);
        handler.registerInitializationWatchdogs();
        (0, vitest_1.expect)(deps.watchdogCoordinator.recordInitStart).toHaveBeenCalledWith(
          'term-1'
        );
        (0, vitest_1.expect)(deps.watchdogCoordinator.startForTerminal).toHaveBeenCalledWith(
          'term-1',
          'ack',
          'existingTerminal'
        );
      }
    );
    (0, vitest_1.it)('should add pending terminal when webview is not initialized', () => {
      deps.getTerminals.mockReturnValue([{ id: 'term-1' }]);
      deps.isWebViewInitialized.mockReturnValue(false);
      handler.registerInitializationWatchdogs();
      (0, vitest_1.expect)(deps.watchdogCoordinator.addPendingTerminal).toHaveBeenCalledWith(
        'term-1'
      );
    });
    (0, vitest_1.it)('should handle errors gracefully', () => {
      deps.onTerminalCreated.mockImplementation(() => {
        throw new Error('event error');
      });
      // Should not throw
      handler.registerInitializationWatchdogs();
    });
    (0, vitest_1.it)(
      'should call callback for terminal created event that records init and starts watchdog',
      () => {
        let createdCallback;
        deps.onTerminalCreated.mockImplementation((cb) => {
          createdCallback = cb;
          return { dispose: vitest_1.vi.fn() };
        });
        handler.registerInitializationWatchdogs();
        (0, vitest_1.expect)(createdCallback).toBeDefined();
        // Simulate terminal creation
        createdCallback({ id: 'new-term' });
        (0, vitest_1.expect)(deps.watchdogCoordinator.recordInitStart).toHaveBeenCalledWith(
          'new-term'
        );
        (0, vitest_1.expect)(deps.terminalInitStateMachine.markViewPending).toHaveBeenCalledWith(
          'new-term',
          'terminalCreated'
        );
        (0, vitest_1.expect)(deps.terminalInitStateMachine.markPtySpawned).toHaveBeenCalledWith(
          'new-term',
          'terminalCreated'
        );
      }
    );
    (0, vitest_1.it)(
      'should call callback for terminal removed event that stops watchdog and resets state',
      () => {
        let removedCallback;
        deps.onTerminalRemoved.mockImplementation((cb) => {
          removedCallback = cb;
          return { dispose: vitest_1.vi.fn() };
        });
        handler.registerInitializationWatchdogs();
        (0, vitest_1.expect)(removedCallback).toBeDefined();
        removedCallback('term-1');
        (0, vitest_1.expect)(deps.watchdogCoordinator.stopForTerminal).toHaveBeenCalledWith(
          'term-1',
          'terminalRemoved'
        );
        (0, vitest_1.expect)(deps.terminalInitStateMachine.reset).toHaveBeenCalledWith('term-1');
      }
    );
  });
});
//# sourceMappingURL=TerminalInitLifecycleHandler.test.js.map
