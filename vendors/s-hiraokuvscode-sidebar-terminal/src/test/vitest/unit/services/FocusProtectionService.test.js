'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
vitest_1.vi.mock('vscode', () => {
  const onDidChangeActiveTerminalListeners = [];
  const onDidOpenTerminalListeners = [];
  const onDidChangeConfigurationListeners = [];
  class ThemeIcon {
    constructor(id) {
      this.id = id;
    }
  }
  return {
    window: {
      onDidChangeActiveTerminal: vitest_1.vi.fn((listener) => {
        onDidChangeActiveTerminalListeners.push(listener);
        return {
          dispose: vitest_1.vi.fn(() => {
            const idx = onDidChangeActiveTerminalListeners.indexOf(listener);
            if (idx >= 0) onDidChangeActiveTerminalListeners.splice(idx, 1);
          }),
        };
      }),
      onDidOpenTerminal: vitest_1.vi.fn((listener) => {
        onDidOpenTerminalListeners.push(listener);
        return {
          dispose: vitest_1.vi.fn(() => {
            const idx = onDidOpenTerminalListeners.indexOf(listener);
            if (idx >= 0) onDidOpenTerminalListeners.splice(idx, 1);
          }),
        };
      }),
      _onDidChangeActiveTerminalListeners: onDidChangeActiveTerminalListeners,
      _onDidOpenTerminalListeners: onDidOpenTerminalListeners,
    },
    workspace: {
      getConfiguration: vitest_1.vi.fn().mockReturnValue({
        get: vitest_1.vi.fn().mockReturnValue(true),
      }),
      onDidChangeConfiguration: vitest_1.vi.fn((listener) => {
        onDidChangeConfigurationListeners.push(listener);
        return {
          dispose: vitest_1.vi.fn(() => {
            const idx = onDidChangeConfigurationListeners.indexOf(listener);
            if (idx >= 0) onDidChangeConfigurationListeners.splice(idx, 1);
          }),
        };
      }),
      _onDidChangeConfigurationListeners: onDidChangeConfigurationListeners,
    },
    commands: {
      executeCommand: vitest_1.vi.fn().mockResolvedValue(undefined),
    },
    ThemeIcon,
  };
});
const vscode = require('vscode');
const FocusProtectionService_1 = require('../../../../services/FocusProtectionService');
function fireActiveTerminalChanged(terminal) {
  const listeners = vscode.window._onDidChangeActiveTerminalListeners;
  for (const listener of listeners) {
    listener(terminal);
  }
}
function fireOpenTerminal(terminal) {
  const listeners = vscode.window._onDidOpenTerminalListeners;
  for (const listener of listeners) {
    listener(terminal);
  }
}
function fireConfigurationChanged(affectsConfiguration) {
  const listeners = vscode.workspace._onDidChangeConfigurationListeners;
  for (const listener of listeners) {
    listener({ affectsConfiguration });
  }
}
(0, vitest_1.describe)('FocusProtectionService', () => {
  let service;
  let mockIsTerminalFocused;
  let mockIsWebViewVisible;
  let mockSendWebviewFocus;
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.useFakeTimers();
    vitest_1.vi.clearAllMocks();
    vscode.window._onDidChangeActiveTerminalListeners.length = 0;
    vscode.workspace._onDidChangeConfigurationListeners.length = 0;
    vitest_1.vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: vitest_1.vi.fn((key) => {
        if (key === 'focusProtection') return true;
        return undefined;
      }),
    });
    mockIsTerminalFocused = vitest_1.vi.fn().mockReturnValue(false);
    mockIsWebViewVisible = vitest_1.vi.fn().mockReturnValue(true);
    mockSendWebviewFocus = vitest_1.vi.fn();
    service = new FocusProtectionService_1.FocusProtectionService({
      isTerminalFocused: mockIsTerminalFocused,
      isWebViewVisible: mockIsWebViewVisible,
      sendWebviewFocus: mockSendWebviewFocus,
    });
  });
  (0, vitest_1.afterEach)(() => {
    service.dispose();
    vitest_1.vi.useRealTimers();
  });
  (0, vitest_1.describe)('initialization', () => {
    (0, vitest_1.it)('should register onDidChangeActiveTerminal listener', () => {
      (0, vitest_1.expect)(vscode.window.onDidChangeActiveTerminal).toHaveBeenCalledOnce();
    });
    (0, vitest_1.it)('should register onDidChangeConfiguration listener', () => {
      (0, vitest_1.expect)(vscode.workspace.onDidChangeConfiguration).toHaveBeenCalledOnce();
    });
    (0, vitest_1.it)('should read initial focusProtection setting', () => {
      (0, vitest_1.expect)(vscode.workspace.getConfiguration).toHaveBeenCalledWith(
        'secondaryTerminal'
      );
    });
  });
  (0, vitest_1.describe)('focus restoration with recent focus tracking', () => {
    (0, vitest_1.it)('should restore focus when terminal is currently focused', () => {
      mockIsTerminalFocused.mockReturnValue(true);
      mockIsWebViewVisible.mockReturnValue(true);
      fireActiveTerminalChanged({ name: 'bash' });
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith(
        'secondaryTerminal.focus'
      );
    });
    (0, vitest_1.it)(
      'should restore focus when terminal was recently focused (blur arrived first)',
      () => {
        // Simulate: terminal was focused, then blur arrived before onDidChangeActiveTerminal
        mockIsTerminalFocused.mockReturnValue(false);
        mockIsWebViewVisible.mockReturnValue(true);
        // Notify focus was gained 50ms ago
        service.notifyFocusChanged(true);
        vitest_1.vi.advanceTimersByTime(50);
        // Now blur has arrived (isTerminalFocused=false) but recent focus window still open
        fireActiveTerminalChanged({ name: 'bash' });
        vitest_1.vi.advanceTimersByTime(200);
        (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith(
          'secondaryTerminal.focus'
        );
      }
    );
    (0, vitest_1.it)('should NOT restore focus when terminal was NOT recently focused', () => {
      mockIsTerminalFocused.mockReturnValue(false);
      mockIsWebViewVisible.mockReturnValue(true);
      // No notifyFocusChanged called, and isTerminalFocused is false
      fireActiveTerminalChanged({ name: 'bash' });
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(vscode.commands.executeCommand).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should NOT restore focus after recent focus window expires', () => {
      mockIsTerminalFocused.mockReturnValue(false);
      mockIsWebViewVisible.mockReturnValue(true);
      service.notifyFocusChanged(true);
      // Wait longer than RECENT_FOCUS_WINDOW_MS (600ms)
      vitest_1.vi.advanceTimersByTime(700);
      fireActiveTerminalChanged({ name: 'bash' });
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(vscode.commands.executeCommand).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)(
      'should restore focus when recent focus was within 500ms (within 600ms window)',
      () => {
        mockIsTerminalFocused.mockReturnValue(false);
        mockIsWebViewVisible.mockReturnValue(true);
        service.notifyFocusChanged(true);
        // 500ms is within the 600ms window — still protected
        vitest_1.vi.advanceTimersByTime(500);
        fireActiveTerminalChanged({ name: 'bash' });
        vitest_1.vi.advanceTimersByTime(200);
        (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith(
          'secondaryTerminal.focus'
        );
      }
    );
    (0, vitest_1.it)('should NOT restore focus when WebView is not visible', () => {
      mockIsTerminalFocused.mockReturnValue(true);
      mockIsWebViewVisible.mockReturnValue(false);
      fireActiveTerminalChanged({ name: 'bash' });
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(vscode.commands.executeCommand).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should NOT restore focus when active terminal becomes undefined', () => {
      mockIsTerminalFocused.mockReturnValue(true);
      mockIsWebViewVisible.mockReturnValue(true);
      fireActiveTerminalChanged(undefined);
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(vscode.commands.executeCommand).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should debounce rapid terminal changes', () => {
      mockIsTerminalFocused.mockReturnValue(true);
      mockIsWebViewVisible.mockReturnValue(true);
      fireActiveTerminalChanged({ name: 'bash' });
      fireActiveTerminalChanged({ name: 'zsh' });
      fireActiveTerminalChanged({ name: 'fish' });
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledTimes(1);
    });
  });
  (0, vitest_1.describe)('cooldown', () => {
    (0, vitest_1.it)('should skip restoration during cooldown period', () => {
      mockIsTerminalFocused.mockReturnValue(true);
      mockIsWebViewVisible.mockReturnValue(true);
      fireActiveTerminalChanged({ name: 'bash' });
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledTimes(1);
      fireActiveTerminalChanged({ name: 'bash' });
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)('should allow restoration after cooldown expires', () => {
      mockIsTerminalFocused.mockReturnValue(true);
      mockIsWebViewVisible.mockReturnValue(true);
      fireActiveTerminalChanged({ name: 'bash' });
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledTimes(1);
      vitest_1.vi.advanceTimersByTime(500);
      fireActiveTerminalChanged({ name: 'bash' });
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledTimes(2);
    });
  });
  (0, vitest_1.describe)('setting: focusProtection disabled', () => {
    (0, vitest_1.it)('should NOT restore focus when disabled', () => {
      vitest_1.vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
        get: vitest_1.vi.fn((key) => {
          if (key === 'focusProtection') return false;
          return undefined;
        }),
      });
      service.dispose();
      vscode.window._onDidChangeActiveTerminalListeners.length = 0;
      service = new FocusProtectionService_1.FocusProtectionService({
        isTerminalFocused: mockIsTerminalFocused,
        isWebViewVisible: mockIsWebViewVisible,
      });
      mockIsTerminalFocused.mockReturnValue(true);
      mockIsWebViewVisible.mockReturnValue(true);
      fireActiveTerminalChanged({ name: 'bash' });
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(vscode.commands.executeCommand).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should respond to runtime configuration changes', () => {
      mockIsTerminalFocused.mockReturnValue(true);
      mockIsWebViewVisible.mockReturnValue(true);
      vitest_1.vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
        get: vitest_1.vi.fn((key) => {
          if (key === 'focusProtection') return false;
          return undefined;
        }),
      });
      fireConfigurationChanged((section) => section === 'secondaryTerminal.focusProtection');
      fireActiveTerminalChanged({ name: 'bash' });
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(vscode.commands.executeCommand).not.toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('notifyInteraction (typing keeps focus window fresh)', () => {
    (0, vitest_1.it)('should refresh recent-focus window when user interacts', () => {
      mockIsTerminalFocused.mockReturnValue(false);
      mockIsWebViewVisible.mockReturnValue(true);
      // Initial focus 400ms ago
      service.notifyFocusChanged(true);
      vitest_1.vi.advanceTimersByTime(400);
      // User is actively typing → interaction refreshes the window
      service.notifyInteraction();
      vitest_1.vi.advanceTimersByTime(400);
      // 800ms since initial focus, but only 400ms since last interaction → still protected
      fireActiveTerminalChanged({ name: 'bash' });
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith(
        'secondaryTerminal.focus'
      );
    });
    (0, vitest_1.it)(
      'should NOT refresh window when terminal is not visible (avoid false positives)',
      () => {
        mockIsTerminalFocused.mockReturnValue(false);
        mockIsWebViewVisible.mockReturnValue(false);
        // WebView hidden — interaction should not update the window
        service.notifyInteraction();
        vitest_1.vi.advanceTimersByTime(100);
        mockIsWebViewVisible.mockReturnValue(true);
        fireActiveTerminalChanged({ name: 'bash' });
        vitest_1.vi.advanceTimersByTime(200);
        (0, vitest_1.expect)(vscode.commands.executeCommand).not.toHaveBeenCalled();
      }
    );
    (0, vitest_1.it)(
      'should restore focus when blur happens immediately after recent interaction without active terminal change',
      () => {
        mockIsTerminalFocused.mockReturnValue(true);
        mockIsWebViewVisible.mockReturnValue(true);
        service.notifyFocusChanged(true);
        service.notifyInteraction();
        mockIsTerminalFocused.mockReturnValue(false);
        service.notifyFocusChanged(false);
        vitest_1.vi.advanceTimersByTime(200);
        (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith(
          'secondaryTerminal.focus'
        );
        (0, vitest_1.expect)(mockSendWebviewFocus).toHaveBeenCalledTimes(1);
      }
    );
    (0, vitest_1.it)(
      'should NOT restore focus on blur without recent interaction when active terminal does not change',
      () => {
        mockIsTerminalFocused.mockReturnValue(true);
        mockIsWebViewVisible.mockReturnValue(true);
        service.notifyFocusChanged(true);
        vitest_1.vi.advanceTimersByTime(250);
        mockIsTerminalFocused.mockReturnValue(false);
        service.notifyFocusChanged(false);
        vitest_1.vi.advanceTimersByTime(200);
        (0, vitest_1.expect)(vscode.commands.executeCommand).not.toHaveBeenCalled();
        (0, vitest_1.expect)(mockSendWebviewFocus).not.toHaveBeenCalled();
      }
    );
  });
  (0, vitest_1.describe)('sendWebviewFocus dependency', () => {
    (0, vitest_1.it)('should invoke sendWebviewFocus after executing the focus command', () => {
      mockIsTerminalFocused.mockReturnValue(true);
      mockIsWebViewVisible.mockReturnValue(true);
      fireActiveTerminalChanged({ name: 'bash' });
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith(
        'secondaryTerminal.focus'
      );
      (0, vitest_1.expect)(mockSendWebviewFocus).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)('should work without sendWebviewFocus dep (backward compatible)', () => {
      service.dispose();
      vscode.window._onDidChangeActiveTerminalListeners.length = 0;
      service = new FocusProtectionService_1.FocusProtectionService({
        isTerminalFocused: mockIsTerminalFocused,
        isWebViewVisible: mockIsWebViewVisible,
        // sendWebviewFocus omitted
      });
      mockIsTerminalFocused.mockReturnValue(true);
      mockIsWebViewVisible.mockReturnValue(true);
      fireActiveTerminalChanged({ name: 'bash' });
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith(
        'secondaryTerminal.focus'
      );
      // No error, no sendWebviewFocus call required
    });
  });
  (0, vitest_1.describe)('terminal ID tracking (restore focus to the correct terminal)', () => {
    (0, vitest_1.it)('should pass the last interacted terminal ID to sendWebviewFocus', () => {
      mockIsTerminalFocused.mockReturnValue(true);
      mockIsWebViewVisible.mockReturnValue(true);
      // User interacts with terminal "3"
      service.notifyInteraction('3');
      fireActiveTerminalChanged({ name: 'Claude Code' });
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(mockSendWebviewFocus).toHaveBeenCalledWith('3');
    });
    (0, vitest_1.it)('should pass undefined when no terminal ID was tracked', () => {
      mockIsTerminalFocused.mockReturnValue(true);
      mockIsWebViewVisible.mockReturnValue(true);
      // No notifyInteraction with ID — legacy call without ID
      service.notifyInteraction();
      fireActiveTerminalChanged({ name: 'bash' });
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(mockSendWebviewFocus).toHaveBeenCalledWith(undefined);
    });
    (0, vitest_1.it)(
      'should track the most recent terminal ID across multiple interactions',
      () => {
        mockIsTerminalFocused.mockReturnValue(true);
        mockIsWebViewVisible.mockReturnValue(true);
        service.notifyInteraction('1');
        service.notifyInteraction('2');
        service.notifyInteraction('5');
        fireActiveTerminalChanged({ name: 'Claude Code' });
        vitest_1.vi.advanceTimersByTime(200);
        (0, vitest_1.expect)(mockSendWebviewFocus).toHaveBeenCalledWith('5');
      }
    );
    (0, vitest_1.it)('should restore focus to correct terminal in CLI agent mode', () => {
      mockIsTerminalFocused.mockReturnValue(false);
      mockIsWebViewVisible.mockReturnValue(true);
      service.notifyCliAgentConnected(true);
      // User submits prompt in terminal "2", then focus is gained
      service.notifyInteraction('2');
      service.notifyFocusChanged(true);
      vitest_1.vi.advanceTimersByTime(100);
      // Claude Code steals focus
      fireActiveTerminalChanged({ name: 'Claude Code' });
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith(
        'secondaryTerminal.focus'
      );
      (0, vitest_1.expect)(mockSendWebviewFocus).toHaveBeenCalledWith('2');
    });
  });
  (0, vitest_1.describe)('diagnostic logging (onDidOpenTerminal / describeTerminal)', () => {
    (0, vitest_1.it)('should register an onDidOpenTerminal listener', () => {
      (0, vitest_1.expect)(vscode.window.onDidOpenTerminal).toHaveBeenCalledOnce();
    });
    (0, vitest_1.it)('should handle opening a terminal without creationOptions gracefully', () => {
      (0, vitest_1.expect)(() => {
        fireOpenTerminal({ name: 'bash' });
      }).not.toThrow();
    });
    (0, vitest_1.it)(
      'should handle active-terminal change with rich creationOptions gracefully',
      () => {
        mockIsTerminalFocused.mockReturnValue(true);
        mockIsWebViewVisible.mockReturnValue(true);
        const richTerminal = {
          name: 'GitLens',
          processId: Promise.resolve(12345),
          state: { isInteractedWith: false },
          creationOptions: {
            name: 'GitLens',
            shellPath: '/bin/zsh',
            shellArgs: ['-l'],
            cwd: '/tmp/project',
            env: { FOO: 'bar' },
            iconPath: new vscode.ThemeIcon('git'),
            isTransient: true,
            hideFromUser: false,
          },
        };
        (0, vitest_1.expect)(() => {
          fireActiveTerminalChanged(richTerminal);
          vitest_1.vi.advanceTimersByTime(200);
        }).not.toThrow();
        (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith(
          'secondaryTerminal.focus'
        );
      }
    );
  });
  (0, vitest_1.describe)('CLI agent connected mode (aggressive focus protection)', () => {
    (0, vitest_1.it)(
      'should restore focus without recent interaction when CLI agent is connected',
      () => {
        mockIsTerminalFocused.mockReturnValue(false);
        mockIsWebViewVisible.mockReturnValue(true);
        // Focus was gained recently
        service.notifyFocusChanged(true);
        vitest_1.vi.advanceTimersByTime(100);
        // CLI agent connected — no interaction required
        service.notifyCliAgentConnected(true);
        fireActiveTerminalChanged({ name: 'Claude Code' });
        vitest_1.vi.advanceTimersByTime(200);
        (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith(
          'secondaryTerminal.focus'
        );
      }
    );
    (0, vitest_1.it)('should use shorter cooldown when CLI agent is connected', () => {
      mockIsTerminalFocused.mockReturnValue(true);
      mockIsWebViewVisible.mockReturnValue(true);
      service.notifyCliAgentConnected(true);
      // First restore
      fireActiveTerminalChanged({ name: 'Claude Code' });
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledTimes(1);
      // After 200ms (less than normal 500ms cooldown, but enough for CLI agent mode)
      vitest_1.vi.advanceTimersByTime(200);
      // Second restore should work with shorter cooldown
      fireActiveTerminalChanged({ name: 'Claude Code' });
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledTimes(2);
    });
    (0, vitest_1.it)('should extend recent focus window when CLI agent is connected', () => {
      mockIsTerminalFocused.mockReturnValue(false);
      mockIsWebViewVisible.mockReturnValue(true);
      service.notifyCliAgentConnected(true);
      // Focus gained, then long time passes (beyond normal 600ms window)
      service.notifyFocusChanged(true);
      vitest_1.vi.advanceTimersByTime(30000); // 30 seconds — well beyond normal window
      // With CLI agent connected, the extended window (10 min) still covers this
      fireActiveTerminalChanged({ name: 'Claude Code' });
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith(
        'secondaryTerminal.focus'
      );
    });
    (0, vitest_1.it)('should protect during long CLI agent processing sessions', () => {
      mockIsTerminalFocused.mockReturnValue(false);
      mockIsWebViewVisible.mockReturnValue(true);
      service.notifyCliAgentConnected(true);
      // User submitted a prompt, then CLI agent processes for 5 minutes
      service.notifyFocusChanged(true);
      vitest_1.vi.advanceTimersByTime(300000); // 5 minutes
      // Claude Code steals focus during processing
      fireActiveTerminalChanged({ name: 'Claude Code' });
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith(
        'secondaryTerminal.focus'
      );
    });
    (0, vitest_1.it)('should NOT extend recent focus window beyond CLI agent window', () => {
      mockIsTerminalFocused.mockReturnValue(false);
      mockIsWebViewVisible.mockReturnValue(true);
      service.notifyCliAgentConnected(true);
      service.notifyFocusChanged(true);
      // Wait beyond CLI agent extended window (10 min = 600_000ms)
      vitest_1.vi.advanceTimersByTime(700000);
      fireActiveTerminalChanged({ name: 'bash' });
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(vscode.commands.executeCommand).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should revert to normal behavior when CLI agent disconnects', () => {
      mockIsTerminalFocused.mockReturnValue(false);
      mockIsWebViewVisible.mockReturnValue(true);
      service.notifyCliAgentConnected(true);
      service.notifyFocusChanged(true);
      // Disconnect CLI agent
      service.notifyCliAgentConnected(false);
      // Wait beyond normal RECENT_FOCUS_WINDOW_MS (600ms)
      // After disconnect, the normal window applies → focus should NOT be restored
      vitest_1.vi.advanceTimersByTime(800);
      fireActiveTerminalChanged({ name: 'bash' });
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(vscode.commands.executeCommand).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should still respect disabled setting even with CLI agent connected', () => {
      vitest_1.vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
        get: vitest_1.vi.fn((key) => {
          if (key === 'focusProtection') return false;
          return undefined;
        }),
      });
      service.dispose();
      vscode.window._onDidChangeActiveTerminalListeners.length = 0;
      service = new FocusProtectionService_1.FocusProtectionService({
        isTerminalFocused: mockIsTerminalFocused,
        isWebViewVisible: mockIsWebViewVisible,
      });
      service.notifyCliAgentConnected(true);
      mockIsTerminalFocused.mockReturnValue(true);
      mockIsWebViewVisible.mockReturnValue(true);
      fireActiveTerminalChanged({ name: 'Claude Code' });
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(vscode.commands.executeCommand).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should still require WebView visible even with CLI agent connected', () => {
      mockIsTerminalFocused.mockReturnValue(true);
      mockIsWebViewVisible.mockReturnValue(false);
      service.notifyCliAgentConnected(true);
      fireActiveTerminalChanged({ name: 'Claude Code' });
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(vscode.commands.executeCommand).not.toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('dispose', () => {
    (0, vitest_1.it)('should clean up all listeners on dispose', () => {
      service.dispose();
      (0, vitest_1.expect)(vscode.window._onDidChangeActiveTerminalListeners).toHaveLength(0);
    });
    (0, vitest_1.it)('should cancel pending timer on dispose', () => {
      mockIsTerminalFocused.mockReturnValue(true);
      mockIsWebViewVisible.mockReturnValue(true);
      fireActiveTerminalChanged({ name: 'bash' });
      service.dispose();
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(vscode.commands.executeCommand).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should not restore focus after dispose', () => {
      mockIsTerminalFocused.mockReturnValue(true);
      mockIsWebViewVisible.mockReturnValue(true);
      service.dispose();
      fireActiveTerminalChanged({ name: 'bash' });
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(vscode.commands.executeCommand).not.toHaveBeenCalled();
    });
  });
});
//# sourceMappingURL=FocusProtectionService.test.js.map
