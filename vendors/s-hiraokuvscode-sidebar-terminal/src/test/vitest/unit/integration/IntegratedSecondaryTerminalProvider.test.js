'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const IntegratedSecondaryTerminalProvider_1 = require('../../../../integration/IntegratedSecondaryTerminalProvider');
// Mock VS Code
vitest_1.vi.mock('vscode', () => {
  const mockConfig = {
    get: vitest_1.vi.fn((key, def) => def),
    has: vitest_1.vi.fn(() => true),
    inspect: vitest_1.vi.fn(),
    update: vitest_1.vi.fn().mockResolvedValue(undefined),
  };
  return {
    workspace: {
      getConfiguration: vitest_1.vi.fn(() => mockConfig),
      onDidChangeConfiguration: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
      workspaceFolders: [],
    },
    window: {
      activeTextEditor: undefined,
    },
    Uri: {
      file: (p) => ({ fsPath: p, scheme: 'file', toString: () => `file://${p}` }),
      joinPath: (uri, ...parts) => ({
        fsPath: `${uri.fsPath}/${parts.join('/')}`,
        scheme: 'file',
      }),
    },
    EventEmitter: class {
      constructor() {
        this.event = vitest_1.vi.fn();
        this.fire = vitest_1.vi.fn();
      }
    },
    Disposable: class {
      constructor() {
        this.dispose = vitest_1.vi.fn();
      }
      static from(..._args) {
        return { dispose: vitest_1.vi.fn() };
      }
    },
  };
});
// Mock other dependencies
vitest_1.vi.mock('../../../../terminals/TerminalManager');
vitest_1.vi.mock('../../../../services/TerminalPersistenceService');
vitest_1.vi.mock('../../../../handlers/PersistenceMessageHandler', () => ({
  createPersistenceMessageHandler: vitest_1.vi.fn(() => ({
    registerMessageHandlers: vitest_1.vi.fn(),
    handlePersistenceMessage: vitest_1.vi.fn(),
  })),
}));
vitest_1.vi.mock('../../../../utils/logger');
(0, vitest_1.describe)('IntegratedSecondaryTerminalProvider', () => {
  let provider;
  let mockContext;
  let mockTerminalManager;
  let mockWebviewView;
  beforeEach(() => {
    vitest_1.vi.resetAllMocks();
    mockContext = {
      extensionUri: { fsPath: '/test/uri' },
      subscriptions: [],
    };
    mockTerminalManager = {
      onStateUpdate: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
      onTerminalOutput: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
      createTerminal: vitest_1.vi.fn(),
      deleteTerminal: vitest_1.vi.fn().mockResolvedValue({ success: true }),
      setActiveTerminal: vitest_1.vi.fn(),
      getActiveTerminalId: vitest_1.vi.fn(),
      writeToTerminal: vitest_1.vi.fn(),
      resizeTerminal: vitest_1.vi.fn(),
    };
    provider = new IntegratedSecondaryTerminalProvider_1.IntegratedSecondaryTerminalProvider(
      mockContext,
      mockTerminalManager
    );
    mockWebviewView = {
      webview: {
        options: {},
        html: '',
        onDidReceiveMessage: vitest_1.vi.fn(),
        postMessage: vitest_1.vi.fn().mockResolvedValue(true),
      },
      onDidDispose: vitest_1.vi.fn(),
    };
  });
  (0, vitest_1.describe)('resolveWebviewView', () => {
    (0, vitest_1.it)('should configure webview and setup listeners', () => {
      provider.resolveWebviewView(mockWebviewView, {}, {});
      (0, vitest_1.expect)(mockWebviewView.webview.options.enableScripts).toBe(true);
      (0, vitest_1.expect)(mockWebviewView.webview.html).toContain('Terminal Webview');
      (0, vitest_1.expect)(mockWebviewView.webview.onDidReceiveMessage).toHaveBeenCalled();
      (0, vitest_1.expect)(mockWebviewView.onDidDispose).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('message handling', () => {
    let messageCallback;
    beforeEach(() => {
      provider.resolveWebviewView(mockWebviewView, {}, {});
      messageCallback = mockWebviewView.webview.onDidReceiveMessage.mock.calls[0][0];
    });
    (0, vitest_1.it)('should handle webviewReady and send settings', async () => {
      await messageCallback({ command: 'webviewReady' });
      (0, vitest_1.expect)(mockWebviewView.webview.postMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({ command: 'settingsResponse' })
      );
    });
    (0, vitest_1.it)('should handle createTerminal', async () => {
      mockTerminalManager.createTerminal.mockReturnValue('new-id');
      await messageCallback({ command: 'createTerminal' });
      (0, vitest_1.expect)(mockTerminalManager.createTerminal).toHaveBeenCalled();
      (0, vitest_1.expect)(mockWebviewView.webview.postMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({ command: 'terminalCreated', terminalId: 'new-id' })
      );
    });
    (0, vitest_1.it)('should handle terminal input', async () => {
      await messageCallback({ command: 'input', terminalId: 't1', data: 'ls\n' });
      (0, vitest_1.expect)(mockTerminalManager.writeToTerminal).toHaveBeenCalledWith('t1', 'ls\n');
    });
  });
  (0, vitest_1.describe)('event listeners', () => {
    beforeEach(() => {
      provider.resolveWebviewView(mockWebviewView, {}, {});
    });
    (0, vitest_1.it)('should forward state updates to webview', () => {
      const stateUpdateCallback = mockTerminalManager.onStateUpdate.mock.calls[0][0];
      const mockState = { terminals: [] };
      stateUpdateCallback(mockState);
      (0, vitest_1.expect)(mockWebviewView.webview.postMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({ command: 'stateUpdate', state: mockState })
      );
    });
  });
  (0, vitest_1.describe)('dispose', () => {
    (0, vitest_1.it)('should clear resources', () => {
      provider.dispose();
      // Verify internal state if possible, or just ensure it doesn't throw
    });
  });
});
//# sourceMappingURL=IntegratedSecondaryTerminalProvider.test.js.map
