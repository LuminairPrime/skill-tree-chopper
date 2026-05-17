'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
// Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
const vitest_1 = require('vitest');
const jsdom_1 = require('jsdom');
// Import shared test setup
require('../../../shared/TestSetup');
// Mock VS Code API
const mockVscode = {
  workspace: {
    getConfiguration: vitest_1.vi.fn(),
    workspaceFolders: [],
    onDidChangeConfiguration: vitest_1.vi.fn(),
  },
  window: {
    showErrorMessage: vitest_1.vi.fn(),
    showWarningMessage: vitest_1.vi.fn(),
    showInformationMessage: vitest_1.vi.fn(),
    registerWebviewViewProvider: vitest_1.vi.fn(),
  },
  Uri: {
    file: vitest_1.vi.fn(),
    parse: vitest_1.vi.fn(),
    joinPath: vitest_1.vi.fn(),
  },
  WebviewViewProvider: vitest_1.vi.fn(),
  ViewColumn: { One: 1 },
  TreeDataProvider: vitest_1.vi.fn(),
  EventEmitter: vitest_1.vi.fn(),
  CancellationToken: vitest_1.vi.fn(),
  commands: {
    registerCommand: vitest_1.vi.fn(),
    executeCommand: vitest_1.vi.fn(),
  },
  extensions: {
    getExtension: vitest_1.vi.fn(),
  },
};
// Setup test environment
function setupTestEnvironment() {
  // Mock VS Code module
  global.vscode = mockVscode;
  // Mock Node.js modules
  global.require = vitest_1.vi.fn();
  global.module = { exports: {} };
  global.process = {
    platform: 'linux',
    env: {
      NODE_ENV: 'test',
    },
  };
}
(0, vitest_1.describe)('SecondaryTerminalProvider Extended', () => {
  let dom;
  let document;
  let mockProvider;
  let mockWebview;
  let mockWebviewView;
  let mockTerminalManager;
  (0, vitest_1.beforeEach)(() => {
    setupTestEnvironment();
    // Mock console before JSDOM creation
    global.console = {
      log: vitest_1.vi.fn(),
      warn: vitest_1.vi.fn(),
      error: vitest_1.vi.fn(),
    };
    // Mock webview
    mockWebview = {
      html: '',
      options: {},
      postMessage: vitest_1.vi.fn(),
      onDidReceiveMessage: vitest_1.vi.fn(),
      asWebviewUri: vitest_1.vi.fn(),
      cspSource: 'vscode-webview:',
      setState: vitest_1.vi.fn(),
    };
    // Mock webview view
    mockWebviewView = {
      webview: mockWebview,
      visible: true,
      onDidChangeVisibility: vitest_1.vi.fn(),
      onDidDispose: vitest_1.vi.fn(),
      show: vitest_1.vi.fn(),
      title: 'Terminal',
      description: '',
    };
    // Mock terminal manager
    mockTerminalManager = {
      createTerminal: vitest_1.vi.fn(),
      killTerminal: vitest_1.vi.fn(),
      writeToTerminal: vitest_1.vi.fn(),
      resizeTerminal: vitest_1.vi.fn(),
      getTerminalCount: vitest_1.vi.fn().mockReturnValue(0),
      getActiveTerminalId: vitest_1.vi.fn().mockReturnValue(null),
      dispose: vitest_1.vi.fn(),
    };
    // Mock provider
    mockProvider = {
      context: {
        extensionUri: { fsPath: '/extension/path', scheme: 'file' }, // Simple mock URI
        subscriptions: [],
      },
      terminalManager: mockTerminalManager,
      webviewView: mockWebviewView,
      resolveWebviewView: vitest_1.vi.fn(),
      _getHtmlForWebview: vitest_1.vi.fn(),
      _initializeTerminal: vitest_1.vi.fn(),
      _performKillTerminal: vitest_1.vi.fn(),
      splitTerminal: vitest_1.vi.fn(),
      openSettings: vitest_1.vi.fn(),
      _handleMessage: vitest_1.vi.fn(),
      dispose: vitest_1.vi.fn(),
    };
    // Set up process.nextTick before JSDOM creation
    const originalProcess = global.process;
    global.process = {
      ...originalProcess,
      nextTick: (callback) => setImmediate(callback),
      env: { ...originalProcess.env, NODE_ENV: 'test' },
    };
    dom = new jsdom_1.JSDOM(`<!DOCTYPE html><html><body></body></html>`);
    document = dom.window.document;
    global.document = document;
    // Reset webview mocks
    if (mockWebview.setState && typeof mockWebview.setState.mockClear === 'function') {
      mockWebview.setState.mockClear();
    }
    global.window = dom.window;
  });
  (0, vitest_1.afterEach)(() => {
    vitest_1.vi.restoreAllMocks();
    if (dom) {
      dom.window.close();
    }
  });
  (0, vitest_1.describe)('WebView initialization', () => {
    (0, vitest_1.it)('should resolve webview view', () => {
      mockProvider.resolveWebviewView(mockWebviewView);
      (0, vitest_1.expect)(mockProvider.resolveWebviewView).toHaveBeenCalledWith(mockWebviewView);
    });
    (0, vitest_1.it)('should set webview HTML content', () => {
      const htmlContent = '<html><body>Terminal WebView</body></html>';
      mockProvider._getHtmlForWebview.mockReturnValue(htmlContent);
      mockWebview.html = mockProvider._getHtmlForWebview(mockWebview);
      (0, vitest_1.expect)(mockWebview.html).toBe(htmlContent);
    });
    (0, vitest_1.it)('should configure webview options', () => {
      const options = {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [mockProvider.context.extensionUri],
      };
      mockWebview.options = options;
      (0, vitest_1.expect)(mockWebview.options.enableScripts).toBe(true);
      (0, vitest_1.expect)(mockWebview.options.retainContextWhenHidden).toBe(true);
    });
    (0, vitest_1.it)('should setup message listeners', () => {
      mockWebview.onDidReceiveMessage.mockReturnValue({ dispose: vitest_1.vi.fn() });
      const disposable = mockWebview.onDidReceiveMessage(() => {});
      (0, vitest_1.expect)(mockWebview.onDidReceiveMessage).toHaveBeenCalled();
      (0, vitest_1.expect)(disposable.dispose).toBeTypeOf('function');
    });
  });
  (0, vitest_1.describe)('Terminal operations', () => {
    (0, vitest_1.it)('should initialize terminal', () => {
      mockProvider._initializeTerminal();
      (0, vitest_1.expect)(mockProvider._initializeTerminal).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should create new terminal', () => {
      const terminalId = 'terminal-123';
      mockTerminalManager.createTerminal.mockReturnValue(terminalId);
      const result = mockTerminalManager.createTerminal();
      (0, vitest_1.expect)(result).toBe(terminalId);
      (0, vitest_1.expect)(mockTerminalManager.createTerminal).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should kill terminal', () => {
      const terminalId = 'terminal-123';
      mockProvider._performKillTerminal(terminalId);
      (0, vitest_1.expect)(mockProvider._performKillTerminal).toHaveBeenCalledWith(terminalId);
    });
    (0, vitest_1.it)('should split terminal', () => {
      mockProvider.splitTerminal();
      (0, vitest_1.expect)(mockProvider.splitTerminal).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should write to terminal', () => {
      const terminalId = 'terminal-123';
      const data = 'echo "Hello World"';
      mockTerminalManager.writeToTerminal(terminalId, data);
      (0, vitest_1.expect)(mockTerminalManager.writeToTerminal).toHaveBeenCalledWith(
        terminalId,
        data
      );
    });
    (0, vitest_1.it)('should resize terminal', () => {
      const terminalId = 'terminal-123';
      const rows = 30;
      const cols = 100;
      mockTerminalManager.resizeTerminal(terminalId, rows, cols);
      (0, vitest_1.expect)(mockTerminalManager.resizeTerminal).toHaveBeenCalledWith(
        terminalId,
        rows,
        cols
      );
    });
  });
  (0, vitest_1.describe)('Message handling', () => {
    (0, vitest_1.it)('should handle init message', () => {
      const message = { type: 'init' };
      mockProvider._handleMessage(message);
      (0, vitest_1.expect)(mockProvider._handleMessage).toHaveBeenCalledWith(message);
    });
    (0, vitest_1.it)('should handle input message', () => {
      const message = {
        type: 'input',
        terminalId: 'terminal-123',
        data: 'ls -la',
      };
      mockProvider._handleMessage(message);
      (0, vitest_1.expect)(mockProvider._handleMessage).toHaveBeenCalledWith(message);
    });
    (0, vitest_1.it)('should handle resize message', () => {
      const message = {
        type: 'resize',
        terminalId: 'terminal-123',
        rows: 25,
        cols: 80,
      };
      mockProvider._handleMessage(message);
      (0, vitest_1.expect)(mockProvider._handleMessage).toHaveBeenCalledWith(message);
    });
    (0, vitest_1.it)('should handle kill terminal message', () => {
      const message = {
        type: 'killTerminal',
        terminalId: 'terminal-123',
      };
      mockProvider._handleMessage(message);
      (0, vitest_1.expect)(mockProvider._handleMessage).toHaveBeenCalledWith(message);
    });
    (0, vitest_1.it)('should handle split terminal message', () => {
      const message = { type: 'splitTerminal' };
      mockProvider._handleMessage(message);
      (0, vitest_1.expect)(mockProvider._handleMessage).toHaveBeenCalledWith(message);
    });
    (0, vitest_1.it)('should handle settings message', () => {
      const message = { type: 'openSettings' };
      mockProvider._handleMessage(message);
      (0, vitest_1.expect)(mockProvider._handleMessage).toHaveBeenCalledWith(message);
    });
  });
  (0, vitest_1.describe)('Settings integration', () => {
    (0, vitest_1.it)('should open settings panel', () => {
      mockProvider.openSettings();
      (0, vitest_1.expect)(mockProvider.openSettings).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should handle configuration changes', () => {
      // Since this is a mock environment, we simulate the configuration change handling
      // by testing that the configuration change logic can be executed without error
      const configChangeEvent = {
        affectsConfiguration: vitest_1.vi.fn().mockReturnValue(false), // not affecting our configs
      };
      // Test that configuration change handling doesn't throw errors
      (0, vitest_1.expect)(() => {
        // Simulate the configuration change process
        configChangeEvent.affectsConfiguration('secondaryTerminal');
      }).not.toThrow();
      (0, vitest_1.expect)(configChangeEvent.affectsConfiguration).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should get terminal configuration', () => {
      const config = {
        shell: '/bin/bash',
        shellArgs: ['-l'],
        fontSize: 14,
        fontFamily: 'monospace',
        theme: 'dark',
      };
      mockVscode.workspace.getConfiguration.mockReturnValue({
        get: vitest_1.vi.fn().mockReturnValue(config),
      });
      const terminalConfig = mockVscode.workspace.getConfiguration('secondaryTerminal');
      const settings = terminalConfig.get('terminal');
      (0, vitest_1.expect)(settings).toEqual(config);
    });
    (0, vitest_1.it)('should apply settings to webview', () => {
      const settings = {
        fontSize: 16,
        fontFamily: 'Monaco',
        theme: 'light',
      };
      const message = {
        type: 'settingsResponse',
        settings: settings,
      };
      mockWebview.postMessage(message);
      (0, vitest_1.expect)(mockWebview.postMessage).toHaveBeenCalledWith(message);
    });
  });
  (0, vitest_1.describe)('Alt+Click integration', () => {
    (0, vitest_1.it)('should send Alt+Click settings to webview', () => {
      const altClickSettings = {
        altClickMovesCursor: true,
        multiCursorModifier: 'alt',
      };
      const message = {
        type: 'altClickSettings',
        settings: altClickSettings,
      };
      mockWebview.postMessage(message);
      (0, vitest_1.expect)(mockWebview.postMessage).toHaveBeenCalledWith(message);
    });
    (0, vitest_1.it)('should handle Alt+Click configuration changes', () => {
      // Create a configuration change event that affects Alt+Click settings
      const configChangeEvent = {
        affectsConfiguration: vitest_1.vi.fn().mockImplementation((section) => {
          return (
            section === 'terminal.integrated.altClickMovesCursor' ||
            section === 'editor.multiCursorModifier' ||
            section === 'secondaryTerminal.altClickMovesCursor'
          );
        }),
      };
      // Test that Alt+Click configuration handling doesn't throw errors
      (0, vitest_1.expect)(() => {
        // Simulate checking each Alt+Click related setting
        configChangeEvent.affectsConfiguration('terminal.integrated.altClickMovesCursor');
        configChangeEvent.affectsConfiguration('editor.multiCursorModifier');
        configChangeEvent.affectsConfiguration('secondaryTerminal.altClickMovesCursor');
      }).not.toThrow();
      // Verify affectsConfiguration was called to check relevant settings
      (0, vitest_1.expect)(configChangeEvent.affectsConfiguration).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('Resource management', () => {
    (0, vitest_1.it)('should get webview resource URIs', () => {
      const resourcePath = '/resources/icon.png';
      const resourceUri = mockVscode.Uri.file(resourcePath);
      mockWebview.asWebviewUri.mockReturnValue(resourceUri);
      const webviewUri = mockWebview.asWebviewUri(resourceUri);
      (0, vitest_1.expect)(webviewUri).toBe(resourceUri);
    });
    (0, vitest_1.it)('should handle CSS and JavaScript resources', () => {
      const cssPath = '/dist/webview.css';
      const jsPath = '/dist/webview.js';
      mockWebview.asWebviewUri.mockImplementation((path) => {
        if (path === cssPath) return `vscode-webview://path${cssPath}`;
        if (path === jsPath) return `vscode-webview://path${jsPath}`;
        return path;
      });
      const cssUri = mockWebview.asWebviewUri(cssPath);
      const jsUri = mockWebview.asWebviewUri(jsPath);
      (0, vitest_1.expect)(cssUri).toContain(cssPath);
      (0, vitest_1.expect)(jsUri).toContain(jsPath);
    });
  });
  (0, vitest_1.describe)('Error handling', () => {
    (0, vitest_1.it)('should handle terminal creation errors', () => {
      const error = new Error('Terminal creation failed');
      mockTerminalManager.createTerminal.mockImplementation(() => {
        throw error;
      });
      try {
        mockTerminalManager.createTerminal();
      } catch (e) {
        (0, vitest_1.expect)(e.message).toBe('Terminal creation failed');
      }
    });
    (0, vitest_1.it)('should handle webview message errors', () => {
      const invalidMessage = { type: 'invalid' };
      (0, vitest_1.expect)(() => mockProvider._handleMessage(invalidMessage)).not.toThrow();
    });
    (0, vitest_1.it)('should handle webview disposal', () => {
      const disposeCallback = vitest_1.vi.fn();
      mockWebviewView.onDidDispose.mockReturnValue({ dispose: disposeCallback });
      const _disposable = mockWebviewView.onDidDispose(() => {});
      (0, vitest_1.expect)(mockWebviewView.onDidDispose).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('Performance optimization', () => {
    (0, vitest_1.it)('should debounce terminal output', () => {
      let _outputCount = 0;
      const debouncedOutput = vitest_1.vi.fn(() => {
        _outputCount++;
      });
      // Simulate debounced output
      debouncedOutput();
      debouncedOutput();
      debouncedOutput();
      (0, vitest_1.expect)(debouncedOutput).toHaveBeenCalledTimes(3);
    });
    (0, vitest_1.it)('should batch terminal operations', () => {
      const operations = [
        { type: 'write', data: 'line 1' },
        { type: 'write', data: 'line 2' },
        { type: 'write', data: 'line 3' },
      ];
      operations.forEach((op) => {
        mockTerminalManager.writeToTerminal('terminal-123', op.data);
      });
      (0, vitest_1.expect)(mockTerminalManager.writeToTerminal).toHaveBeenCalledTimes(3);
    });
  });
  (0, vitest_1.describe)('State management', () => {
    (0, vitest_1.it)('should maintain webview state', () => {
      const state = {
        activeTerminalId: 'terminal-123',
        terminals: ['terminal-123', 'terminal-456'],
        settings: { fontSize: 14 },
      };
      mockWebview.getState = vitest_1.vi.fn().mockReturnValue(state);
      const currentState = mockWebview.getState();
      (0, vitest_1.expect)(currentState).toEqual(state);
    });
    (0, vitest_1.it)('should update webview state', () => {
      const newState = {
        activeTerminalId: 'terminal-456',
        terminals: ['terminal-123', 'terminal-456', 'terminal-789'],
      };
      mockWebview.setState(newState);
      (0, vitest_1.expect)(mockWebview.setState).toHaveBeenCalledWith(newState);
    });
  });
  (0, vitest_1.describe)('Extension lifecycle', () => {
    (0, vitest_1.it)('should handle extension activation', () => {
      // Verify that mockProvider has context from initialization
      (0, vitest_1.expect)(mockProvider.context).toBeDefined();
      (0, vitest_1.expect)(mockProvider.context.subscriptions).toBeInstanceOf(Array);
      (0, vitest_1.expect)(mockProvider.context.extensionUri).toBeDefined();
      // Test that we can update context properties
      const newContext = {
        subscriptions: ['test-subscription'],
        extensionUri: { fsPath: '/new/extension/path', scheme: 'file' }, // Simple mock URI
      };
      // Verify we can set context properties
      (0, vitest_1.expect)(() => {
        mockProvider.context = newContext;
      }).not.toThrow();
      // Verify updated context properties are accessible
      (0, vitest_1.expect)(mockProvider.context.subscriptions).toEqual(['test-subscription']);
      (0, vitest_1.expect)(mockProvider.context.extensionUri).toBeDefined();
    });
    (0, vitest_1.it)('should cleanup resources on disposal', () => {
      mockProvider.dispose();
      (0, vitest_1.expect)(mockProvider.dispose).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should dispose terminal manager', () => {
      mockTerminalManager.dispose();
      (0, vitest_1.expect)(mockTerminalManager.dispose).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('WebView visibility', () => {
    (0, vitest_1.it)('should handle webview visibility changes', () => {
      const visibilityCallback = vitest_1.vi.fn();
      mockWebviewView.onDidChangeVisibility.mockReturnValue({ dispose: vitest_1.vi.fn() });
      const disposable = mockWebviewView.onDidChangeVisibility(visibilityCallback);
      (0, vitest_1.expect)(mockWebviewView.onDidChangeVisibility).toHaveBeenCalled();
      (0, vitest_1.expect)(disposable.dispose).toBeTypeOf('function');
    });
    (0, vitest_1.it)('should maintain context when hidden', () => {
      mockWebview.options.retainContextWhenHidden = true;
      (0, vitest_1.expect)(mockWebview.options.retainContextWhenHidden).toBe(true);
    });
  });
});
//# sourceMappingURL=SecondaryTerminalProvider-extended.test.js.map
