'use strict';
/**
 * TestSetupFactory - Centralized test setup to eliminate 95% test duplication
 * Factory pattern for creating consistent test environments and mocks
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.TestSetupFactory = void 0;
const sinon = require('sinon');
/**
 * Centralized factory for creating consistent test environments
 */
class TestSetupFactory {
  /**
   * Create standard mock VS Code API
   */
  static createMockVscode() {
    return {
      workspace: {
        getConfiguration: sinon.stub().returns({
          get: sinon.stub().callsFake((key) => {
            const defaults = {
              'sidebarTerminal.shell': '/bin/bash',
              'sidebarTerminal.maxTerminals': 5,
              'sidebarTerminal.cursorBlink': true,
              'sidebarTerminal.theme': 'auto',
              'sidebarTerminal.enableValidation': true,
              'terminal.integrated.altClickMovesCursor': true,
              'editor.multiCursorModifier': 'alt',
            };
            return defaults[key] || null;
          }),
          update: sinon.stub().resolves(),
          has: sinon.stub().returns(true),
          inspect: sinon.stub().returns({
            globalValue: undefined,
            workspaceValue: undefined,
            workspaceFolderValue: undefined,
            defaultValue: null,
          }),
        }),
        workspaceFolders: [
          {
            uri: { fsPath: '/test/workspace' },
            name: 'test-workspace',
            index: 0,
          },
        ],
        onDidChangeConfiguration: sinon.stub(),
        rootPath: '/test/workspace',
      },
      window: {
        showErrorMessage: sinon.stub().resolves(),
        showWarningMessage: sinon.stub().resolves(),
        showInformationMessage: sinon.stub().resolves(),
        showQuickPick: sinon.stub().resolves(),
        showInputBox: sinon.stub().resolves(),
        activeTextEditor: null,
        createStatusBarItem: sinon.stub().returns({
          show: sinon.stub(),
          hide: sinon.stub(),
          dispose: sinon.stub(),
          text: '',
          tooltip: '',
        }),
        withProgress: sinon.stub().callsFake((_options, task) => task()),
      },
      commands: {
        registerCommand: sinon.stub(),
        executeCommand: sinon.stub().resolves(),
        getCommands: sinon.stub().resolves([]),
      },
      Uri: {
        file: sinon.stub().callsFake((path) => ({ fsPath: path })),
        parse: sinon.stub().callsFake((uri) => ({ fsPath: uri })),
      },
      ViewColumn: {
        One: 1,
        Two: 2,
        Three: 3,
      },
      StatusBarAlignment: {
        Left: 1,
        Right: 2,
      },
      env: {
        clipboard: {
          writeText: sinon.stub().resolves(),
          readText: sinon.stub().resolves(''),
        },
        openExternal: sinon.stub().resolves(),
      },
    };
  }
  /**
   * Create standard mock coordinator
   */
  static createMockCoordinator(options = {}) {
    return {
      getActiveTerminalId: sinon.stub().returns('terminal-1'),
      setActiveTerminalId: sinon.stub(),
      getTerminalInstance: sinon.stub().returns({
        terminal: {
          write: sinon.stub(),
          resize: sinon.stub(),
          dispose: sinon.stub(),
          onData: sinon.stub(),
          onResize: sinon.stub(),
          buffer: {
            active: {
              baseY: 0,
              cursorY: 0,
              cursorX: 0,
              viewportY: 0,
              length: 24,
            },
          },
          rows: 24,
          cols: 80,
        },
        fitAddon: {
          fit: sinon.stub(),
          dispose: sinon.stub(),
        },
        container: document.createElement('div'),
        id: 'terminal-1',
        name: 'Terminal 1',
      }),
      getAllTerminalInstances: sinon.stub().returns(new Map()),
      getAllTerminalContainers: sinon.stub().returns(new Map()),
      getTerminalElement: sinon.stub().returns(document.createElement('div')),
      postMessageToExtension: sinon.stub(),
      log: options.enableLogging !== false ? sinon.stub() : sinon.stub(),
      createTerminal: sinon.stub().returns('terminal-new'),
      openSettings: sinon.stub(),
      setVersionInfo: sinon.stub(),
      applyFontSettings: sinon.stub(),
      closeTerminal: sinon.stub(),
      getManagers: sinon.stub().returns({
        message: { postMessage: sinon.stub() },
        ui: { updateTerminalBorders: sinon.stub() },
        input: { setAltClickEnabled: sinon.stub() },
        performance: { bufferedWrite: sinon.stub() },
        notification: { showNotification: sinon.stub() },
        split: { updateSplitLayout: sinon.stub() },
        config: { getConfiguration: sinon.stub() },
      }),
      updateState: sinon.stub(),
      handleTerminalRemovedFromExtension: sinon.stub(),
      updateClaudeStatus: sinon.stub(),
      updateCliAgentStatus: sinon.stub(),
      ensureTerminalFocus: sinon.stub(),
      createTerminalFromSession: sinon.stub(),
      getSerializeAddon: sinon.stub().returns(undefined),
      getMessageManager: sinon.stub().returns({
        postMessage: sinon.stub(),
        handleMessage: sinon.stub(),
        registerHandler: sinon.stub(),
        dispose: sinon.stub(),
      }),
    };
  }
  /**
   * Create test terminal data
   */
  static createTerminalTestData(count = 3) {
    const terminals = Array.from({ length: count }, (_, i) => ({
      id: String(i + 1),
      name: `Terminal ${i + 1}`,
      scrollback: [`Line ${i + 1}-1`, `Line ${i + 1}-2`, `Line ${i + 1}-3`],
      isActive: i === 0,
    }));
    return {
      terminals,
      activeTerminalId: '1',
      scrollback: ['Line 1', 'Line 2', 'Line 3'],
    };
  }
  /**
   * Create complete test environment
   */
  static createTestEnvironment(options = {}) {
    const sandbox = sinon.createSandbox();
    // Mock global objects if needed
    if (options.mockWorkspace) {
      global.vscode = this.createMockVscode();
    }
    const coordinator = this.createMockCoordinator(options);
    const cleanup = () => {
      sandbox.restore();
      if (options.mockWorkspace) {
        delete global.vscode;
      }
    };
    return {
      coordinator,
      sandbox,
      mockVscode: global.vscode,
      cleanup,
    };
  }
  /**
   * Create mock DOM environment
   */
  static createMockDOM() {
    // This is a simplified mock - in a real implementation you might use JSDOM
    const mockDocument = {
      createElement: sinon.stub().callsFake((tagName) => ({
        tagName,
        style: {},
        classList: {
          add: sinon.stub(),
          remove: sinon.stub(),
          contains: sinon.stub().returns(false),
          toggle: sinon.stub(),
        },
        setAttribute: sinon.stub(),
        getAttribute: sinon.stub().returns(null),
        appendChild: sinon.stub(),
        removeChild: sinon.stub(),
        querySelector: sinon.stub().returns(null),
        querySelectorAll: sinon.stub().returns([]),
        addEventListener: sinon.stub(),
        removeEventListener: sinon.stub(),
        textContent: '',
        innerHTML: '',
        id: '',
        className: '',
        dataset: {},
      })),
      getElementById: sinon.stub().returns(null),
      querySelector: sinon.stub().returns(null),
      querySelectorAll: sinon.stub().returns([]),
      addEventListener: sinon.stub(),
      removeEventListener: sinon.stub(),
      body: {
        appendChild: sinon.stub(),
        removeChild: sinon.stub(),
      },
      head: {
        appendChild: sinon.stub(),
        removeChild: sinon.stub(),
      },
    };
    const mockWindow = {
      document: mockDocument,
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      setInterval: setInterval,
      clearInterval: clearInterval,
      addEventListener: sinon.stub(),
      removeEventListener: sinon.stub(),
      location: {
        href: 'http://localhost',
        origin: 'http://localhost',
      },
      console: console,
    };
    const cleanup = () => {
      // Cleanup function for DOM mocks
    };
    return {
      document: mockDocument,
      window: mockWindow,
      cleanup,
    };
  }
  /**
   * Create mock terminal for testing
   */
  static createMockTerminal(_id = 'test-terminal', options = {}) {
    return {
      write: sinon.stub(),
      writeln: sinon.stub(),
      resize: sinon.stub(),
      clear: sinon.stub(),
      dispose: sinon.stub(),
      focus: sinon.stub(),
      blur: sinon.stub(),
      selectAll: sinon.stub(),
      onData: sinon.stub(),
      onResize: sinon.stub(),
      onRender: sinon.stub(),
      onLineFeed: sinon.stub(),
      buffer: {
        active: {
          baseY: 0,
          cursorY: 0,
          cursorX: 0,
          viewportY: 0,
          length: 24,
          getLine: sinon.stub().returns({
            translateToString: sinon.stub().returns('test line'),
          }),
        },
      },
      rows: options.rows || 24,
      cols: options.cols || 80,
      options: {
        theme: options.theme || {},
        fontSize: options.fontSize || 14,
        fontFamily: options.fontFamily || 'monospace',
        cursorBlink: options.cursorBlink || true,
        scrollback: options.scrollback || 1000,
      },
      // Mock xterm.js specific properties
      _core: {
        _bufferService: {
          buffer: {
            ydisp: 0,
            ybase: 0,
            isUserScrolling: false,
          },
        },
      },
    };
  }
  /**
   * Create performance test helpers
   */
  static createPerformanceHelpers() {
    const startTime = Date.now();
    const memory = process.memoryUsage();
    return {
      measureTime: () => Date.now() - startTime,
      measureMemory: () => {
        const current = process.memoryUsage();
        return {
          heapUsed: current.heapUsed - memory.heapUsed,
          heapTotal: current.heapTotal - memory.heapTotal,
          external: current.external - memory.external,
        };
      },
      createLargeData: (size) => 'x'.repeat(size),
      createMockHighFrequencyData: (count = 100) =>
        Array.from({ length: count }, (_, i) => `Output ${i}\n`),
    };
  }
  /**
   * Create TDD test patterns
   */
  static createTDDHelpers() {
    return {
      // Red phase - create failing test expectations
      expectToFail: (testFn, expectedError) => {
        try {
          testFn();
          throw new Error('Expected test to fail but it passed');
        } catch (error) {
          if (expectedError && !String(error).includes(expectedError)) {
            throw new Error(`Expected error containing '${expectedError}' but got: ${error}`);
          }
        }
      },
      // Green phase - minimal implementation helpers
      createMinimalImplementation: (returnValue) => sinon.stub().returns(returnValue),
      // Refactor phase - improvement verification
      verifyImprovement: (before, after) => {
        const beforeValue = before();
        const afterValue = after();
        if (afterValue >= beforeValue) {
          throw new Error(
            `Expected improvement but got: before=${beforeValue}, after=${afterValue}`
          );
        }
      },
    };
  }
  /**
   * Create standardized test cleanup function
   */
  static createCleanupFunction(...cleanups) {
    return () => {
      for (const cleanup of cleanups) {
        try {
          cleanup();
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      }
    };
  }
}
exports.TestSetupFactory = TestSetupFactory;
//# sourceMappingURL=TestSetupFactory.js.map
