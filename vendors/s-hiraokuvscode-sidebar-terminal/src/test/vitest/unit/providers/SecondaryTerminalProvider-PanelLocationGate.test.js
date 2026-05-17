'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const SecondaryTerminalProvider_1 = require('../../../../providers/SecondaryTerminalProvider');
const vscode = require('vscode');
const mocks = vitest_1.vi.hoisted(() => ({
  mockDisposable: { dispose: vitest_1.vi.fn() },
  mockExecuteCommand: vitest_1.vi.fn().mockResolvedValue(undefined),
}));
const mockWebview = {
  html: '',
  options: {},
  onDidReceiveMessage: vitest_1.vi.fn().mockReturnValue(mocks.mockDisposable),
  postMessage: vitest_1.vi.fn().mockResolvedValue(true),
  asWebviewUri: vitest_1.vi.fn((uri) => uri),
  cspSource: 'mock-csp-source',
};
const mockWebviewView = {
  webview: mockWebview,
  visible: true,
  onDidDispose: vitest_1.vi.fn().mockReturnValue(mocks.mockDisposable),
  onDidChangeVisibility: vitest_1.vi.fn().mockReturnValue(mocks.mockDisposable),
  show: vitest_1.vi.fn(),
};
const mockUri = {
  fsPath: '/mock/extension/path',
  scheme: 'file',
  path: '/mock/extension/path',
  with: vitest_1.vi.fn().mockReturnThis(),
  toString: vitest_1.vi.fn().mockReturnValue('file:///mock/extension/path'),
};
const mockContext = {
  extensionUri: mockUri,
  subscriptions: [],
};
const mockTerminalInfo = {
  id: 'terminal-1',
  name: 'Terminal 1',
  isActive: true,
  pid: 12345,
  cwd: '/tmp',
};
const mockTerminalManager = {
  getTerminals: vitest_1.vi.fn().mockReturnValue([mockTerminalInfo]),
  getTerminal: vitest_1.vi.fn().mockReturnValue(mockTerminalInfo),
  createTerminal: vitest_1.vi.fn().mockReturnValue('terminal-1'),
  killTerminal: vitest_1.vi.fn().mockResolvedValue(undefined),
  setActiveTerminal: vitest_1.vi.fn(),
  renameTerminal: vitest_1.vi.fn().mockReturnValue(true),
  updateTerminalHeader: vitest_1.vi.fn().mockReturnValue(true),
  getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('terminal-1'),
  onData: vitest_1.vi.fn().mockReturnValue(mocks.mockDisposable),
  onExit: vitest_1.vi.fn().mockReturnValue(mocks.mockDisposable),
  onTerminalCreated: vitest_1.vi.fn().mockReturnValue(mocks.mockDisposable),
  onTerminalRemoved: vitest_1.vi.fn().mockReturnValue(mocks.mockDisposable),
  onStateUpdate: vitest_1.vi.fn().mockReturnValue(mocks.mockDisposable),
  onTerminalFocus: vitest_1.vi.fn().mockReturnValue(mocks.mockDisposable),
  onCliAgentStatusChange: vitest_1.vi.fn().mockReturnValue(mocks.mockDisposable),
  getCurrentState: vitest_1.vi
    .fn()
    .mockReturnValue({ terminals: [mockTerminalInfo], activeTerminalId: 'terminal-1' }),
  getConnectedAgentTerminalId: vitest_1.vi.fn().mockReturnValue('terminal-1'),
  getConnectedAgentType: vitest_1.vi.fn().mockReturnValue('claude'),
  getDisconnectedAgents: vitest_1.vi.fn().mockReturnValue(new Map()),
  initializeShellForTerminal: vitest_1.vi.fn().mockResolvedValue(undefined),
};
vitest_1.vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vitest_1.vi.fn().mockReturnValue({
      get: vitest_1.vi.fn().mockImplementation((key, defaultValue) => {
        if (key === 'dynamicSplitDirection') return true;
        if (key === 'panelLocation') return 'auto';
        return defaultValue;
      }),
      update: vitest_1.vi.fn().mockResolvedValue(undefined),
      has: vitest_1.vi.fn().mockReturnValue(true),
      inspect: vitest_1.vi
        .fn()
        .mockReturnValue({ globalValue: undefined, workspaceValue: undefined }),
    }),
    onDidChangeConfiguration: vitest_1.vi.fn().mockReturnValue(mocks.mockDisposable),
  },
  window: {
    onDidChangeActiveColorTheme: vitest_1.vi.fn().mockReturnValue(mocks.mockDisposable),
    activeColorTheme: { kind: 2 },
    showErrorMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
    showInformationMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
    showWarningMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
  },
  commands: {
    executeCommand: mocks.mockExecuteCommand,
  },
  Uri: {
    file: vitest_1.vi.fn((p) => ({ ...mockUri, fsPath: p, path: p })),
    joinPath: vitest_1.vi.fn((base, ...paths) => ({
      ...mockUri,
      fsPath: `${base.fsPath}/${paths.join('/')}`,
      path: `${base.path}/${paths.join('/')}`,
    })),
  },
  ColorThemeKind: { Light: 1, Dark: 2, HighContrast: 3, HighContrastLight: 4 },
  EventEmitter: vitest_1.vi.fn().mockImplementation(() => ({
    event: vitest_1.vi.fn(),
    fire: vitest_1.vi.fn(),
    dispose: vitest_1.vi.fn(),
  })),
  Disposable: {
    from: vitest_1.vi.fn((...disposables) => ({
      dispose: () => disposables.forEach((d) => d?.dispose?.()),
    })),
  },
}));
(0, vitest_1.describe)('SecondaryTerminalProvider - Panel Location Response Gate', () => {
  let provider;
  let messageHandler;
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.useFakeTimers();
    vitest_1.vi.clearAllMocks();
    vscode.workspace.getConfiguration.mockReturnValue({
      get: vitest_1.vi.fn().mockImplementation((key, defaultValue) => {
        if (key === 'dynamicSplitDirection') return true;
        if (key === 'panelLocation') return 'auto';
        return defaultValue;
      }),
      update: vitest_1.vi.fn().mockResolvedValue(undefined),
      has: vitest_1.vi.fn().mockReturnValue(true),
      inspect: vitest_1.vi
        .fn()
        .mockReturnValue({ globalValue: undefined, workspaceValue: undefined }),
    });
    mockWebview.onDidReceiveMessage = vitest_1.vi.fn().mockImplementation((handler) => {
      messageHandler = handler;
      return mocks.mockDisposable;
    });
    provider = new SecondaryTerminalProvider_1.SecondaryTerminalProvider(
      mockContext,
      mockTerminalManager
    );
    provider.resolveWebviewView(mockWebviewView, {}, {});
  });
  (0, vitest_1.afterEach)(() => {
    provider.dispose();
    vitest_1.vi.useRealTimers();
  });
  (0, vitest_1.it)(
    'should ignore reportPanelLocation when no detection was requested',
    async () => {
      const handleReportSpy = vitest_1.vi.spyOn(
        provider._panelLocationService,
        'handlePanelLocationReport'
      );
      await messageHandler?.({ command: 'reportPanelLocation', location: 'panel' });
      (0, vitest_1.expect)(handleReportSpy).not.toHaveBeenCalled();
    }
  );
  (0, vitest_1.it)(
    'should accept reportPanelLocation after explicit detection request',
    async () => {
      const handleReportSpy = vitest_1.vi.spyOn(
        provider._panelLocationService,
        'handlePanelLocationReport'
      );
      provider._requestPanelLocationDetection();
      await messageHandler?.({ command: 'reportPanelLocation', location: 'panel' });
      (0, vitest_1.expect)(handleReportSpy).toHaveBeenCalledTimes(1);
      (0, vitest_1.expect)(handleReportSpy).toHaveBeenCalledWith('panel');
    }
  );
  (0, vitest_1.it)('should ignore late reportPanelLocation after request timeout', async () => {
    const handleReportSpy = vitest_1.vi.spyOn(
      provider._panelLocationService,
      'handlePanelLocationReport'
    );
    provider._requestPanelLocationDetection();
    vitest_1.vi.advanceTimersByTime(3000);
    await messageHandler?.({ command: 'reportPanelLocation', location: 'panel' });
    (0, vitest_1.expect)(handleReportSpy).not.toHaveBeenCalled();
  });
  (0, vitest_1.it)('should not start detection request in manual panelLocation mode', async () => {
    vscode.workspace.getConfiguration.mockReturnValue({
      get: vitest_1.vi.fn().mockImplementation((key, defaultValue) => {
        if (key === 'dynamicSplitDirection') return true;
        if (key === 'panelLocation') return 'sidebar';
        return defaultValue;
      }),
      update: vitest_1.vi.fn().mockResolvedValue(undefined),
      has: vitest_1.vi.fn().mockReturnValue(true),
      inspect: vitest_1.vi
        .fn()
        .mockReturnValue({ globalValue: undefined, workspaceValue: undefined }),
    });
    const handleReportSpy = vitest_1.vi.spyOn(
      provider._panelLocationService,
      'handlePanelLocationReport'
    );
    provider._requestPanelLocationDetection();
    await messageHandler?.({ command: 'reportPanelLocation', location: 'panel' });
    (0, vitest_1.expect)(handleReportSpy).not.toHaveBeenCalled();
  });
});
//# sourceMappingURL=SecondaryTerminalProvider-PanelLocationGate.test.js.map
