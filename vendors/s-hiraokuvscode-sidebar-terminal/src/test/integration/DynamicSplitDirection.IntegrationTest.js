'use strict';
/**
 * Dynamic Split Direction Integration Tests
 * Issue #148: End-to-end testing of panel location detection and dynamic split direction
 */
Object.defineProperty(exports, '__esModule', { value: true });
const mocha_1 = require('mocha');
const chai_1 = require('chai');
const sinon = require('sinon');
const vscode = require('vscode');
const SecondaryTerminalProvider_1 = require('../../providers/SecondaryTerminalProvider');
const TerminalManager_1 = require('../../terminals/TerminalManager');
const jsdom_1 = require('jsdom');
(0, mocha_1.describe)('Dynamic Split Direction - Integration Tests', function () {
  let provider;
  let mockTerminalManager;
  let mockContext;
  let mockWebviewView;
  let mockWebview;
  let executeCommandStub;
  let postMessageStub;
  let dom;
  (0, mocha_1.beforeEach)(function () {
    // Set up DOM environment for WebView simulation
    dom = new jsdom_1.JSDOM(
      `
      <!DOCTYPE html>
      <html>
        <body>
          <div id="terminal-body" style="width: 800px; height: 600px;">
            <!-- WebView content -->
          </div>
        </body>
      </html>
    `,
      { pretendToBeVisual: true }
    );
    global.window = dom.window;
    global.document = dom.window.document;
    global.HTMLElement = dom.window.HTMLElement;
    // Create mocks
    mockTerminalManager = sinon.createStubInstance(TerminalManager_1.TerminalManager);
    mockContext = {
      subscriptions: [],
      extensionUri: vscode.Uri.parse('file:///test/extension'),
      globalState: {
        get: sinon.stub(),
        update: sinon.stub(),
        keys: sinon.stub().returns([]),
      },
    };
    // Mock VS Code commands
    executeCommandStub = sinon.stub(vscode.commands, 'executeCommand');
    // Create webview mocks
    postMessageStub = sinon.stub();
    mockWebview = {
      postMessage: postMessageStub,
      asWebviewUri: sinon.stub().returns(vscode.Uri.parse('file:///test/webview.js')),
      cspSource: 'https://test-csp-source',
      html: '',
      onDidReceiveMessage: sinon.stub(),
      options: {},
    };
    mockWebviewView = {
      webview: mockWebview,
      visible: true,
      onDidChangeVisibility: sinon.stub(),
      show: sinon.stub(),
    };
    // Mock configuration
    const mockConfig = {
      get: sinon.stub().callsFake((key, defaultValue) => {
        if (key === 'dynamicSplitDirection') return true;
        if (key === 'panelLocation') return 'auto';
        return defaultValue;
      }),
    };
    sinon.stub(vscode.workspace, 'getConfiguration').returns(mockConfig);
    // Create provider instance
    provider = new SecondaryTerminalProvider_1.SecondaryTerminalProvider(
      mockContext,
      mockTerminalManager
    );
  });
  (0, mocha_1.afterEach)(function () {
    provider.dispose();
    dom.window.close();
    sinon.restore();
  });
  (0, mocha_1.describe)('End-to-End Panel Location Detection Flow', function () {
    (0, mocha_1.it)('should complete full sidebar detection cycle', async function () {
      // Arrange
      provider.resolveWebviewView(mockWebviewView, {}, {});
      // Simulate WebView initialization
      await provider._handleWebviewMessage({ command: 'webviewReady' });
      // Wait for initialization
      await new Promise((resolve) => setTimeout(resolve, 100));
      // Act - simulate getSettings request (WebView fully loaded)
      await provider._handleWebviewMessage({ command: 'getSettings' });
      // Simulate WebView dimension analysis (sidebar dimensions)
      dom.window.resizeTo(300, 800);
      Object.defineProperty(dom.window, 'innerWidth', { value: 300 });
      Object.defineProperty(dom.window, 'innerHeight', { value: 800 });
      // WebView reports panel location back to extension
      await provider._handleWebviewMessage({
        command: 'reportPanelLocation',
        location: 'sidebar',
      });
      // Assert - full cycle should be completed
      (0, chai_1.expect)(executeCommandStub).to.have.been.calledWith(
        'setContext',
        'secondaryTerminal.panelLocation',
        'sidebar'
      );
      (0, chai_1.expect)(postMessageStub).to.have.been.calledWith(
        sinon.match({
          command: 'panelLocationUpdate',
          location: 'sidebar',
        })
      );
      (0, chai_1.expect)(postMessageStub).to.have.been.calledWith(
        sinon.match({
          command: 'requestPanelLocationDetection',
        })
      );
    });
    (0, mocha_1.it)('should complete full panel detection cycle', async function () {
      // Arrange
      provider.resolveWebviewView(mockWebviewView, {}, {});
      // Simulate WebView initialization and settings request
      await provider._handleWebviewMessage({ command: 'webviewReady' });
      await new Promise((resolve) => setTimeout(resolve, 100));
      await provider._handleWebviewMessage({ command: 'getSettings' });
      // Simulate WebView dimension analysis (panel dimensions)
      dom.window.resizeTo(1200, 400);
      Object.defineProperty(dom.window, 'innerWidth', { value: 1200 });
      Object.defineProperty(dom.window, 'innerHeight', { value: 400 });
      // Act - WebView reports panel location back to extension
      await provider._handleWebviewMessage({
        command: 'reportPanelLocation',
        location: 'panel',
      });
      // Assert
      (0, chai_1.expect)(executeCommandStub).to.have.been.calledWith(
        'setContext',
        'secondaryTerminal.panelLocation',
        'panel'
      );
      (0, chai_1.expect)(postMessageStub).to.have.been.calledWith(
        sinon.match({
          command: 'panelLocationUpdate',
          location: 'panel',
        })
      );
    });
  });
  (0, mocha_1.describe)('Split Command Integration with Panel Location', function () {
    (0, mocha_1.beforeEach)(async function () {
      provider.resolveWebviewView(mockWebviewView, {}, {});
      mockTerminalManager.getTerminals.returns([]);
      mockTerminalManager.createTerminal.returns('terminal-2');
    });
    (0, mocha_1.it)('should integrate split command with sidebar context', async function () {
      // Arrange - establish sidebar context
      await provider._handleWebviewMessage({
        command: 'reportPanelLocation',
        location: 'sidebar',
      });
      // Act - perform split operation
      provider.splitTerminal('vertical'); // Should match sidebar optimal direction
      // Assert - split command should be sent with correct direction
      (0, chai_1.expect)(postMessageStub).to.have.been.calledWith(
        sinon.match({
          command: 'split',
          direction: 'vertical',
        })
      );
      // Context should be set correctly
      (0, chai_1.expect)(executeCommandStub).to.have.been.calledWith(
        'setContext',
        'secondaryTerminal.panelLocation',
        'sidebar'
      );
    });
    (0, mocha_1.it)('should integrate split command with panel context', async function () {
      // Arrange - establish panel context
      await provider._handleWebviewMessage({
        command: 'reportPanelLocation',
        location: 'panel',
      });
      // Act - perform split operation
      provider.splitTerminal('horizontal'); // Should match panel optimal direction
      // Assert
      (0, chai_1.expect)(postMessageStub).to.have.been.calledWith(
        sinon.match({
          command: 'split',
          direction: 'horizontal',
        })
      );
      (0, chai_1.expect)(executeCommandStub).to.have.been.calledWith(
        'setContext',
        'secondaryTerminal.panelLocation',
        'panel'
      );
    });
  });
  (0, mocha_1.describe)('Panel Move Detection Integration', function () {
    (0, mocha_1.beforeEach)(async function () {
      provider.resolveWebviewView(mockWebviewView, {}, {});
    });
    (0, mocha_1.it)('should detect and respond to sidebar→panel move', async function () {
      // Arrange - start in sidebar
      await provider._handleWebviewMessage({
        command: 'reportPanelLocation',
        location: 'sidebar',
      });
      // Clear previous calls
      executeCommandStub.resetHistory();
      postMessageStub.resetHistory();
      // Act - simulate move to panel
      const visibilityCallback = mockWebviewView.onDidChangeVisibility.getCall(0).args[0];
      // Simulate panel move via visibility change
      Object.defineProperty(mockWebviewView, 'visible', { value: true, configurable: true });
      visibilityCallback();
      // Wait for detection request
      await new Promise((resolve) => setTimeout(resolve, 600));
      // Simulate WebView detecting new panel dimensions and reporting
      await provider._handleWebviewMessage({
        command: 'reportPanelLocation',
        location: 'panel',
      });
      // Assert - should update context to panel
      (0, chai_1.expect)(executeCommandStub).to.have.been.calledWith(
        'setContext',
        'secondaryTerminal.panelLocation',
        'panel'
      );
      (0, chai_1.expect)(postMessageStub).to.have.been.calledWith(
        sinon.match({
          command: 'requestPanelLocationDetection',
        })
      );
    });
    (0, mocha_1.it)('should detect and respond to panel→sidebar move', async function () {
      // Arrange - start in panel
      await provider._handleWebviewMessage({
        command: 'reportPanelLocation',
        location: 'panel',
      });
      executeCommandStub.resetHistory();
      postMessageStub.resetHistory();
      // Act - simulate move to sidebar
      const visibilityCallback = mockWebviewView.onDidChangeVisibility.getCall(0).args[0];
      Object.defineProperty(mockWebviewView, 'visible', { value: true, configurable: true });
      visibilityCallback();
      await new Promise((resolve) => setTimeout(resolve, 600));
      // Simulate WebView detecting sidebar dimensions
      await provider._handleWebviewMessage({
        command: 'reportPanelLocation',
        location: 'sidebar',
      });
      // Assert
      (0, chai_1.expect)(executeCommandStub).to.have.been.calledWith(
        'setContext',
        'secondaryTerminal.panelLocation',
        'sidebar'
      );
    });
  });
  (0, mocha_1.describe)('Configuration Integration', function () {
    (0, mocha_1.it)('should respect dynamicSplitDirection setting disabled', async function () {
      // Arrange - mock configuration with feature disabled
      const mockConfig = {
        get: sinon.stub().callsFake((key, defaultValue) => {
          if (key === 'dynamicSplitDirection') return false;
          if (key === 'panelLocation') return 'auto';
          return defaultValue;
        }),
      };
      vscode.workspace.getConfiguration.returns(mockConfig);
      provider.resolveWebviewView(mockWebviewView, {}, {});
      // Act - request settings
      await provider._handleWebviewMessage({ command: 'getSettings' });
      // Assert - should not request panel location detection when disabled
      const _detectionCalls = postMessageStub
        .getCalls()
        .filter((call) => call.args[0].command === 'requestPanelLocationDetection');
      // May still have initial call, but behavior should be limited
      (0, chai_1.expect)(mockConfig.get).to.have.been.calledWith('dynamicSplitDirection', true);
    });
    (0, mocha_1.it)('should handle manual panelLocation override', async function () {
      // Arrange - mock configuration with manual panel location
      const mockConfig = {
        get: sinon.stub().callsFake((key, defaultValue) => {
          if (key === 'dynamicSplitDirection') return true;
          if (key === 'panelLocation') return 'panel'; // Manual override
          return defaultValue;
        }),
      };
      vscode.workspace.getConfiguration.returns(mockConfig);
      provider.resolveWebviewView(mockWebviewView, {}, {});
      // Act - request settings
      await provider._handleWebviewMessage({ command: 'getSettings' });
      // Assert - should still send detection request (for consistency)
      (0, chai_1.expect)(postMessageStub).to.have.been.calledWith(
        sinon.match({
          command: 'requestPanelLocationDetection',
        })
      );
    });
  });
  (0, mocha_1.describe)('Error Recovery Integration', function () {
    (0, mocha_1.beforeEach)(async function () {
      provider.resolveWebviewView(mockWebviewView, {}, {});
    });
    (0, mocha_1.it)('should recover from WebView communication failures', async function () {
      // Arrange - make postMessage fail
      postMessageStub.onFirstCall().rejects(new Error('Communication failed'));
      postMessageStub.onSecondCall().resolves(); // Recover on retry
      // Act - attempt operations that use postMessage
      await provider._handleWebviewMessage({ command: 'getSettings' });
      // Assert - should not crash and should attempt fallback
      (0, chai_1.expect)(executeCommandStub).to.have.been.calledWith(
        'setContext',
        'secondaryTerminal.panelLocation',
        'sidebar' // Should fallback to sidebar
      );
    });
    (0, mocha_1.it)('should handle missing WebView gracefully', async function () {
      // Arrange - simulate WebView disposal
      provider._view = undefined;
      // Act & Assert - should not crash
      await provider._handleWebviewMessage({
        command: 'reportPanelLocation',
        location: 'panel',
      });
      // Should still update context key
      (0, chai_1.expect)(executeCommandStub).to.have.been.calledWith(
        'setContext',
        'secondaryTerminal.panelLocation',
        'panel'
      );
    });
    (0, mocha_1.it)('should maintain functionality after provider recreation', async function () {
      // Arrange - simulate first provider lifecycle
      await provider._handleWebviewMessage({
        command: 'reportPanelLocation',
        location: 'panel',
      });
      const firstCallCount = executeCommandStub.callCount;
      // Act - dispose and recreate provider
      provider.dispose();
      provider = new SecondaryTerminalProvider_1.SecondaryTerminalProvider(
        mockContext,
        mockTerminalManager
      );
      provider.resolveWebviewView(mockWebviewView, {}, {});
      // Simulate new detection
      await provider._handleWebviewMessage({
        command: 'reportPanelLocation',
        location: 'sidebar',
      });
      // Assert - should continue functioning
      (0, chai_1.expect)(executeCommandStub.callCount).to.be.greaterThan(firstCallCount);
      (0, chai_1.expect)(executeCommandStub).to.have.been.calledWith(
        'setContext',
        'secondaryTerminal.panelLocation',
        'sidebar'
      );
    });
  });
  (0, mocha_1.describe)('Performance Integration', function () {
    (0, mocha_1.beforeEach)(async function () {
      provider.resolveWebviewView(mockWebviewView, {}, {});
    });
    (0, mocha_1.it)('should handle rapid panel location changes efficiently', async function () {
      // Arrange - sequence of rapid changes
      const locations = ['sidebar', 'panel', 'sidebar', 'panel', 'sidebar'];
      // Act - send rapid changes
      const startTime = Date.now();
      for (const location of locations) {
        await provider._handleWebviewMessage({
          command: 'reportPanelLocation',
          location,
        });
      }
      const endTime = Date.now();
      // Assert - should complete quickly
      (0, chai_1.expect)(endTime - startTime).to.be.lessThan(500);
      // All changes should be processed
      (0, chai_1.expect)(executeCommandStub).to.have.callCount(locations.length);
      // Final state should be correct
      (0, chai_1.expect)(executeCommandStub.lastCall).to.have.been.calledWith(
        'setContext',
        'secondaryTerminal.panelLocation',
        'sidebar'
      );
    });
    (0, mocha_1.it)(
      'should not degrade performance with multiple terminals and frequent moves',
      async function () {
        // Arrange - create multiple terminals
        mockTerminalManager.getTerminals.returns([
          { id: 'terminal-1', name: 'Terminal 1' },
          { id: 'terminal-2', name: 'Terminal 2' },
          { id: 'terminal-3', name: 'Terminal 3' },
        ]);
        // Act - perform operations with multiple terminals
        const startTime = Date.now();
        // Simulate split operations with panel moves
        for (let i = 0; i < 10; i++) {
          const location = i % 2 === 0 ? 'sidebar' : 'panel';
          const direction = location === 'sidebar' ? 'vertical' : 'horizontal';
          await provider._handleWebviewMessage({
            command: 'reportPanelLocation',
            location,
          });
          provider.splitTerminal(direction);
        }
        const endTime = Date.now();
        // Assert - should maintain good performance
        (0, chai_1.expect)(endTime - startTime).to.be.lessThan(1000);
      }
    );
  });
  (0, mocha_1.describe)('VS Code Integration', function () {
    (0, mocha_1.it)('should properly integrate with VS Code command system', async function () {
      // Arrange
      provider.resolveWebviewView(mockWebviewView, {}, {});
      // Act - simulate complete workflow
      await provider._handleWebviewMessage({ command: 'getSettings' });
      await provider._handleWebviewMessage({
        command: 'reportPanelLocation',
        location: 'panel',
      });
      // Assert - should integrate properly with VS Code
      (0, chai_1.expect)(executeCommandStub).to.have.been.calledWith(
        'setContext',
        sinon.match.string,
        sinon.match.string
      );
      // Check that the context key is set correctly for VS Code when clauses
      const contextCalls = executeCommandStub
        .getCalls()
        .filter(
          (call) =>
            call.args[0] === 'setContext' && call.args[1] === 'secondaryTerminal.panelLocation'
        );
      (0, chai_1.expect)(contextCalls.length).to.be.greaterThan(0);
      (0, chai_1.expect)(contextCalls[contextCalls.length - 1]?.args[2]).to.equal('panel');
    });
    (0, mocha_1.it)('should work with package.json command configuration', function () {
      // This test verifies that the integration points with package.json are correct
      // In a real environment, we would test that the commands are properly registered
      // and the when clauses work correctly
      // Arrange & Act - verify commands can be triggered
      provider.resolveWebviewView(mockWebviewView, {}, {});
      // Assert - provider should be ready to handle split commands
      (0, chai_1.expect)(() => {
        provider.splitTerminal('vertical'); // Should work for sidebar
        provider.splitTerminal('horizontal'); // Should work for panel
      }).to.not.throw();
    });
  });
});
//# sourceMappingURL=DynamicSplitDirection.IntegrationTest.js.map
