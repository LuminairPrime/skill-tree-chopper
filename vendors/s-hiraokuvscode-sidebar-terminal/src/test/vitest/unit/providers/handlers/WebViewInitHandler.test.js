'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
/**
 * WebViewInitHandler Tests
 *
 * Tests for WebView initialization/handshake lifecycle handler extracted from
 * SecondaryTerminalProvider. Covers: theme resolution, webviewReady handshake,
 * webviewInitialized handshake, panel move reinit, and font settings init.
 */
const vitest_1 = require('vitest');
vitest_1.vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vitest_1.vi.fn().mockReturnValue({
      get: vitest_1.vi.fn().mockReturnValue(false),
    }),
  },
  window: {
    activeColorTheme: { kind: 2 }, // Dark
    onDidChangeActiveColorTheme: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
  },
  ColorThemeKind: {
    Light: 1,
    Dark: 2,
    HighContrast: 3,
    HighContrastLight: 4,
  },
  commands: {
    executeCommand: vitest_1.vi.fn(),
  },
}));
vitest_1.vi.mock('../../../../../utils/logger', () => ({
  provider: vitest_1.vi.fn(),
}));
const WebViewInitHandler_1 = require('../../../../../providers/handlers/WebViewInitHandler');
function createMockDeps(overrides) {
  return {
    sendMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
    sendVersionInfo: vitest_1.vi.fn(),
    getCurrentSettings: vitest_1.vi.fn().mockReturnValue({ theme: 'auto' }),
    getCurrentFontSettings: vitest_1.vi
      .fn()
      .mockReturnValue({ fontSize: 14, fontFamily: 'monospace' }),
    orchestratorInitialize: vitest_1.vi.fn().mockResolvedValue(undefined),
    sendFullCliAgentStateSync: vitest_1.vi.fn(),
    initializeTerminal: vitest_1.vi.fn().mockResolvedValue(undefined),
    startPendingWatchdogs: vitest_1.vi.fn(),
    panelLocationHandlerHandleWebviewVisible: vitest_1.vi.fn(),
    ...overrides,
  };
}
(0, vitest_1.describe)('WebViewInitHandler', () => {
  let handler;
  let deps;
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
    deps = createMockDeps();
    handler = new WebViewInitHandler_1.WebViewInitHandler(deps);
  });
  (0, vitest_1.describe)('resolveInitialTheme', () => {
    (0, vitest_1.it)('should return explicit light theme when settings is light', () => {
      (0, vitest_1.expect)(handler.resolveInitialTheme('light')).toBe('light');
    });
    (0, vitest_1.it)('should return explicit dark theme when settings is dark', () => {
      (0, vitest_1.expect)(handler.resolveInitialTheme('dark')).toBe('dark');
    });
    (0, vitest_1.it)('should resolve auto to dark when VS Code is in dark mode', () => {
      // Default mock has Dark theme kind (2)
      const result = handler.resolveInitialTheme('auto');
      (0, vitest_1.expect)(result).toBe('dark');
    });
    (0, vitest_1.it)('should resolve auto to dark when theme is undefined', () => {
      const result = handler.resolveInitialTheme(undefined);
      (0, vitest_1.expect)(result).toBe('dark');
    });
  });
  (0, vitest_1.describe)('handleWebviewReady', () => {
    (0, vitest_1.it)('should send extensionReady message', () => {
      const message = { command: 'webviewReady' };
      handler.handleWebviewReady(message);
      (0, vitest_1.expect)(deps.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          command: 'extensionReady',
        })
      );
    });
    (0, vitest_1.it)('should mark as initialized after handling', () => {
      const message = { command: 'webviewReady' };
      handler.handleWebviewReady(message);
      (0, vitest_1.expect)(handler.isInitialized).toBe(true);
    });
    (0, vitest_1.it)('should skip duplicate initialization', () => {
      const message = { command: 'webviewReady' };
      handler.handleWebviewReady(message);
      handler.handleWebviewReady(message);
      // extensionReady should be sent only once
      const extensionReadyCalls = deps.sendMessage.mock.calls.filter(
        (call) => call[0].command === 'extensionReady'
      );
      (0, vitest_1.expect)(extensionReadyCalls).toHaveLength(1);
    });
    (0, vitest_1.it)('should flush pending messages after initialization', () => {
      // Queue a message before init
      handler.queueMessage({ command: 'stateUpdate' });
      (0, vitest_1.expect)(deps.sendMessage).not.toHaveBeenCalled();
      handler.handleWebviewReady({ command: 'webviewReady' });
      // extensionReady + flushed message
      (0, vitest_1.expect)(deps.sendMessage).toHaveBeenCalledTimes(2);
    });
    (0, vitest_1.it)('should send version info', () => {
      handler.handleWebviewReady({ command: 'webviewReady' });
      (0, vitest_1.expect)(deps.sendVersionInfo).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should start pending watchdogs', () => {
      handler.handleWebviewReady({ command: 'webviewReady' });
      (0, vitest_1.expect)(deps.startPendingWatchdogs).toHaveBeenCalledWith(true);
    });
  });
  (0, vitest_1.describe)('handleWebviewInitialized', () => {
    (0, vitest_1.it)('should send settings before terminal creation', async () => {
      const message = { command: 'webviewInitialized' };
      await handler.handleWebviewInitialized(message);
      (0, vitest_1.expect)(deps.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({ command: 'settingsResponse' })
      );
      (0, vitest_1.expect)(deps.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({ command: 'fontSettingsUpdate' })
      );
    });
    (0, vitest_1.it)('should call orchestrator initialize after sending settings', async () => {
      const message = { command: 'webviewInitialized' };
      await handler.handleWebviewInitialized(message);
      (0, vitest_1.expect)(deps.orchestratorInitialize).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should reinitialize after panel move when pending', async () => {
      handler.setPendingPanelMoveReinit(true);
      const message = { command: 'webviewInitialized' };
      await handler.handleWebviewInitialized(message);
      // Should send init message for panel move reinit
      (0, vitest_1.expect)(deps.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({ command: 'init' })
      );
      (0, vitest_1.expect)(deps.initializeTerminal).toHaveBeenCalled();
      (0, vitest_1.expect)(deps.sendFullCliAgentStateSync).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should clear pending panel move flag after reinit', async () => {
      handler.setPendingPanelMoveReinit(true);
      const message = { command: 'webviewInitialized' };
      await handler.handleWebviewInitialized(message);
      (0, vitest_1.expect)(handler.isPendingPanelMoveReinit).toBe(false);
    });
  });
  (0, vitest_1.describe)('reinitializeWebviewAfterPanelMove', () => {
    (0, vitest_1.it)('should send init message with timestamp', async () => {
      await handler.reinitializeWebviewAfterPanelMove();
      (0, vitest_1.expect)(deps.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          command: 'init',
          timestamp: vitest_1.expect.any(Number),
        })
      );
    });
    (0, vitest_1.it)('should send font settings', async () => {
      await handler.reinitializeWebviewAfterPanelMove();
      (0, vitest_1.expect)(deps.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({ command: 'fontSettingsUpdate' })
      );
    });
    (0, vitest_1.it)('should call initializeTerminal and sync agent state', async () => {
      await handler.reinitializeWebviewAfterPanelMove();
      (0, vitest_1.expect)(deps.initializeTerminal).toHaveBeenCalled();
      (0, vitest_1.expect)(deps.sendFullCliAgentStateSync).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should still try initializeTerminal on error', async () => {
      deps.sendMessage.mockRejectedValueOnce(new Error('fail'));
      await handler.reinitializeWebviewAfterPanelMove();
      (0, vitest_1.expect)(deps.initializeTerminal).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('initializeWithFontSettings', () => {
    (0, vitest_1.it)('should send init, font settings, then orchestrate', async () => {
      await handler.initializeWithFontSettings();
      const calls = deps.sendMessage.mock.calls;
      const commands = calls.map((c) => c[0].command);
      (0, vitest_1.expect)(commands).toContain('init');
      (0, vitest_1.expect)(commands).toContain('fontSettingsUpdate');
      (0, vitest_1.expect)(deps.orchestratorInitialize).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should still call orchestrator on sendMessage error', async () => {
      deps.sendMessage.mockRejectedValue(new Error('fail'));
      await handler.initializeWithFontSettings();
      (0, vitest_1.expect)(deps.orchestratorInitialize).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('handleWebviewVisible', () => {
    (0, vitest_1.it)('should delegate to panel location handler', () => {
      handler.handleWebviewVisible();
      (0, vitest_1.expect)(deps.panelLocationHandlerHandleWebviewVisible).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('handleWebviewHidden', () => {
    (0, vitest_1.it)('should clear focus context', async () => {
      const vscode = await Promise.resolve().then(() => require('vscode'));
      handler.handleWebviewHidden();
      (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith(
        'setContext',
        'secondaryTerminalFocus',
        false
      );
    });
  });
  (0, vitest_1.describe)('queueMessage / sendMessage', () => {
    (0, vitest_1.it)('should queue messages before initialization', async () => {
      const msg = { command: 'test' };
      await handler.sendMessage(msg);
      // Should not send yet
      (0, vitest_1.expect)(deps.sendMessage).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should send messages after initialization', async () => {
      handler.handleWebviewReady({ command: 'webviewReady' });
      vitest_1.vi.clearAllMocks();
      const msg = { command: 'test' };
      await handler.sendMessage(msg);
      (0, vitest_1.expect)(deps.sendMessage).toHaveBeenCalledWith(msg);
    });
    (0, vitest_1.it)('should always send extensionReady even before init', async () => {
      const msg = { command: 'extensionReady' };
      await handler.sendMessage(msg);
      (0, vitest_1.expect)(deps.sendMessage).toHaveBeenCalledWith(msg);
    });
  });
  (0, vitest_1.describe)('reset', () => {
    (0, vitest_1.it)('should reset initialization state', () => {
      handler.handleWebviewReady({ command: 'webviewReady' });
      (0, vitest_1.expect)(handler.isInitialized).toBe(true);
      handler.reset();
      (0, vitest_1.expect)(handler.isInitialized).toBe(false);
    });
  });
});
//# sourceMappingURL=WebViewInitHandler.test.js.map
