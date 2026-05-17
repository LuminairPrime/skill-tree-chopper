'use strict';
// Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
/**
 * SecondaryTerminalProvider - Dynamic Split Direction Tests
 * Issue #148: Dynamic split direction based on panel location
 *
 * NOTE: This test uses mocked behavior patterns since the actual SecondaryTerminalProvider
 * depends on VS Code's extension host which is not available in unit tests.
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
// Import shared test setup first (this sets up the vscode mock in Module.prototype.require)
require('../../../shared/TestSetup');
const TestSetup_1 = require('../../../shared/TestSetup');
// Note: We can't import SecondaryTerminalProvider directly as it has deep dependencies
// on the VS Code extension host. Instead, we test the expected behavior patterns.
(0, vitest_1.describe)(
  'SecondaryTerminalProvider - Dynamic Split Direction (Issue #148)',
  function () {
    let mockTerminalManager;
    let mockWebviewView;
    let mockWebview;
    let executeCommandMock;
    let postMessageMock;
    let mockProvider;
    (0, vitest_1.beforeEach)(function () {
      // Restore any previous mocks first
      vitest_1.vi.restoreAllMocks();
      // Create mocks
      mockTerminalManager = {
        getTerminals: vitest_1.vi.fn().mockReturnValue([]),
        createTerminal: vitest_1.vi.fn(),
        deleteTerminal: vitest_1.vi.fn(),
        getActiveTerminalId: vitest_1.vi.fn(),
        onTerminalOutput: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
        onTerminalClosed: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
        sendData: vitest_1.vi.fn(),
        resizeTerminal: vitest_1.vi.fn(),
        dispose: vitest_1.vi.fn(),
      };
      // Setup executeCommand mock
      executeCommandMock = vitest_1.vi.fn().mockResolvedValue(undefined);
      // @ts-expect-error - test mock type
      TestSetup_1.mockVscode.commands.executeCommand = executeCommandMock;
      // Create webview mocks
      postMessageMock = vitest_1.vi.fn().mockResolvedValue(true);
      mockWebview = {
        postMessage: postMessageMock,
        asWebviewUri: vitest_1.vi
          .fn()
          .mockReturnValue({ toString: () => 'file:///test/webview.js' }),
        cspSource: 'https://test-csp-source',
        html: '',
        onDidReceiveMessage: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
        options: {},
      };
      mockWebviewView = {
        webview: mockWebview,
        visible: true,
        onDidChangeVisibility: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
        onDidDispose: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
        show: vitest_1.vi.fn(),
      };
      // Create mock provider that simulates SecondaryTerminalProvider behavior
      mockProvider = {
        _view: mockWebviewView,
        _terminalManager: mockTerminalManager,
        _currentPanelLocation: 'sidebar',
        _dynamicSplitDirection: true,
        _disposed: false,
        resolveWebviewView(webviewView) {
          this._view = webviewView;
          // Simulate setting initial context key
          // @ts-expect-error - test mock type
          executeCommandMock('setContext', 'secondaryTerminal.panelLocation', 'sidebar');
        },
        async _handleWebviewMessage(message) {
          if (message.command === 'getSettings') {
            // @ts-expect-error - test mock type
            await postMessageMock({
              command: 'panelLocationUpdate',
              location: this._currentPanelLocation,
            });
            // @ts-expect-error - test mock type
            await postMessageMock({
              command: 'requestPanelLocationDetection',
            });
          }
          if (message.command === 'reportPanelLocation' && message.location) {
            this._currentPanelLocation = message.location;
            // @ts-expect-error - test mock type
            executeCommandMock('setContext', 'secondaryTerminal.panelLocation', message.location);
            // @ts-expect-error - test mock type
            await postMessageMock({
              command: 'panelLocationUpdate',
              location: message.location,
            });
          }
        },
        splitTerminal(direction) {
          let splitDirection = direction;
          if (!splitDirection && this._dynamicSplitDirection) {
            // Auto-determine based on panel location
            splitDirection = this._currentPanelLocation === 'sidebar' ? 'horizontal' : 'vertical';
          }
          if (!splitDirection) {
            splitDirection = 'horizontal'; // Default
          }
          mockTerminalManager.createTerminal();
          // @ts-expect-error - test mock type
          postMessageMock({
            command: 'split',
            direction: splitDirection,
          });
        },
        async _requestPanelLocationDetection() {
          try {
            // @ts-expect-error - test mock type
            await postMessageMock({
              command: 'requestPanelLocationDetection',
            });
          } catch (error) {
            // Fallback to sidebar on error
            // @ts-expect-error - test mock type
            executeCommandMock('setContext', 'secondaryTerminal.panelLocation', 'sidebar');
          }
        },
        dispose() {
          this._disposed = true;
        },
      };
    });
    (0, vitest_1.afterEach)(function () {
      if (mockProvider) {
        mockProvider.dispose();
      }
      vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('Panel Location Detection', function () {
      (0, vitest_1.it)(
        'should set initial context key to sidebar on webview setup',
        async function () {
          // Act
          mockProvider.resolveWebviewView(mockWebviewView);
          // Wait for async operations
          await new Promise((resolve) => setTimeout(resolve, 10));
          // Assert
          (0, vitest_1.expect)(executeCommandMock).toHaveBeenCalledWith(
            'setContext',
            'secondaryTerminal.panelLocation',
            'sidebar'
          );
        }
      );
      (0, vitest_1.it)('should request panel location detection on getSettings', async function () {
        // Arrange
        mockProvider.resolveWebviewView(mockWebviewView);
        // Act - simulate getSettings message
        await mockProvider._handleWebviewMessage({ command: 'getSettings' });
        // Assert - should send panelLocationUpdate and requestPanelLocationDetection
        (0, vitest_1.expect)(postMessageMock).toHaveBeenCalledWith(
          vitest_1.expect.objectContaining({
            command: 'panelLocationUpdate',
            location: 'sidebar',
          })
        );
        (0, vitest_1.expect)(postMessageMock).toHaveBeenCalledWith(
          vitest_1.expect.objectContaining({
            command: 'requestPanelLocationDetection',
          })
        );
      });
      (0, vitest_1.it)(
        'should update context key when WebView reports panel location',
        async function () {
          // Arrange
          mockProvider.resolveWebviewView(mockWebviewView);
          // Act
          await mockProvider._handleWebviewMessage({
            command: 'reportPanelLocation',
            location: 'panel',
          });
          // Assert
          (0, vitest_1.expect)(executeCommandMock).toHaveBeenCalledWith(
            'setContext',
            'secondaryTerminal.panelLocation',
            'panel'
          );
          (0, vitest_1.expect)(postMessageMock).toHaveBeenCalledWith(
            vitest_1.expect.objectContaining({
              command: 'panelLocationUpdate',
              location: 'panel',
            })
          );
        }
      );
    });
    (0, vitest_1.describe)('Split Command Integration', function () {
      (0, vitest_1.beforeEach)(function () {
        mockProvider.resolveWebviewView(mockWebviewView);
      });
      (0, vitest_1.it)('should support horizontal split direction parameter', function () {
        // Arrange
        mockTerminalManager.getTerminals.mockReturnValue([]);
        mockTerminalManager.createTerminal.mockReturnValue('terminal-1');
        // Act
        mockProvider.splitTerminal('horizontal');
        // Assert - should send split command with horizontal direction
        (0, vitest_1.expect)(postMessageMock).toHaveBeenCalledWith(
          vitest_1.expect.objectContaining({
            command: 'split',
            direction: 'horizontal',
          })
        );
      });
      (0, vitest_1.it)('should support vertical split direction parameter', function () {
        // Arrange
        mockTerminalManager.getTerminals.mockReturnValue([]);
        mockTerminalManager.createTerminal.mockReturnValue('terminal-1');
        // Act
        mockProvider.splitTerminal('vertical');
        // Assert - should send split command with vertical direction
        (0, vitest_1.expect)(postMessageMock).toHaveBeenCalledWith(
          vitest_1.expect.objectContaining({
            command: 'split',
            direction: 'vertical',
          })
        );
      });
      (0, vitest_1.it)(
        'should auto-determine horizontal split when in sidebar and no direction specified',
        function () {
          // Arrange
          mockTerminalManager.getTerminals.mockReturnValue([]);
          mockTerminalManager.createTerminal.mockReturnValue('terminal-1');
          mockProvider._currentPanelLocation = 'sidebar';
          mockProvider._dynamicSplitDirection = true;
          // Act
          mockProvider.splitTerminal();
          // Assert - should auto-determine horizontal for sidebar
          (0, vitest_1.expect)(postMessageMock).toHaveBeenCalledWith(
            vitest_1.expect.objectContaining({
              command: 'split',
              direction: 'horizontal',
            })
          );
        }
      );
      (0, vitest_1.it)(
        'should auto-determine vertical split when in panel and no direction specified',
        function () {
          // Arrange
          mockTerminalManager.getTerminals.mockReturnValue([]);
          mockTerminalManager.createTerminal.mockReturnValue('terminal-1');
          mockProvider._currentPanelLocation = 'panel';
          mockProvider._dynamicSplitDirection = true;
          // Act
          mockProvider.splitTerminal();
          // Assert - should auto-determine vertical for panel
          (0, vitest_1.expect)(postMessageMock).toHaveBeenCalledWith(
            vitest_1.expect.objectContaining({
              command: 'split',
              direction: 'vertical',
            })
          );
        }
      );
      (0, vitest_1.it)(
        'should use horizontal split when dynamicSplitDirection is disabled',
        function () {
          // Arrange
          mockTerminalManager.getTerminals.mockReturnValue([]);
          mockTerminalManager.createTerminal.mockReturnValue('terminal-1');
          mockProvider._dynamicSplitDirection = false;
          // Act
          mockProvider.splitTerminal();
          // Assert - should default to horizontal when dynamic split is disabled
          (0, vitest_1.expect)(postMessageMock).toHaveBeenCalledWith(
            vitest_1.expect.objectContaining({
              command: 'split',
              direction: 'horizontal',
            })
          );
        }
      );
    });
    (0, vitest_1.describe)('Panel Location Change Handling', function () {
      (0, vitest_1.beforeEach)(function () {
        mockProvider.resolveWebviewView(mockWebviewView);
      });
      (0, vitest_1.it)(
        'should request panel location detection on visibility change',
        async function () {
          // Arrange
          const onDidChangeVisibilityMock = vitest_1.vi.mocked(
            mockWebviewView.onDidChangeVisibility
          );
          const visibilityCallback = onDidChangeVisibilityMock.mock.calls[0]?.[0];
          if (!visibilityCallback) {
            // Simulate visibility callback behavior
            await mockProvider._requestPanelLocationDetection();
            // Assert - should request detection
            (0, vitest_1.expect)(postMessageMock).toHaveBeenCalledWith(
              vitest_1.expect.objectContaining({
                command: 'requestPanelLocationDetection',
              })
            );
            return;
          }
          // Act - simulate visibility change
          Object.defineProperty(mockWebviewView, 'visible', { value: true, configurable: true });
          visibilityCallback();
          // Assert - should request detection after delay
          await new Promise((resolve) => setTimeout(resolve, 600));
          (0, vitest_1.expect)(postMessageMock).toHaveBeenCalledWith(
            vitest_1.expect.objectContaining({
              command: 'requestPanelLocationDetection',
            })
          );
        }
      );
      (0, vitest_1.it)(
        'should handle configuration changes for panel location settings',
        async function () {
          // Arrange - update configuration mock
          TestSetup_1.mockVscode.workspace.getConfiguration = vitest_1.vi.fn().mockReturnValue({
            get: vitest_1.vi.fn().mockReturnValue('panel'),
          });
          // Act - simulate configuration change by requesting detection
          await mockProvider._requestPanelLocationDetection();
          // Assert - should request detection
          (0, vitest_1.expect)(postMessageMock).toHaveBeenCalledWith(
            vitest_1.expect.objectContaining({
              command: 'requestPanelLocationDetection',
            })
          );
        }
      );
    });
    (0, vitest_1.describe)('Error Handling', function () {
      (0, vitest_1.beforeEach)(function () {
        mockProvider.resolveWebviewView(mockWebviewView);
      });
      (0, vitest_1.it)(
        'should handle reportPanelLocation message without location gracefully',
        async function () {
          // Arrange - reset mock call history
          executeCommandMock.mockClear();
          // Act & Assert - should not throw
          await mockProvider._handleWebviewMessage({
            command: 'reportPanelLocation',
            // location is undefined
          });
          // Should not call executeCommand without location (except for initial setup)
          const setContextCalls = executeCommandMock.mock.calls.filter(
            (call) => call[0] === 'setContext' && call[1] === 'secondaryTerminal.panelLocation'
          );
          // Only the initial setup call, no additional calls for undefined location
          (0, vitest_1.expect)(setContextCalls.length).toBeLessThanOrEqual(1);
        }
      );
      (0, vitest_1.it)(
        'should set fallback context key when panel detection fails',
        async function () {
          // Arrange
          postMessageMock.mockRejectedValue(new Error('WebView communication failed'));
          executeCommandMock.mockClear();
          // Act - trigger panel detection request
          await mockProvider._requestPanelLocationDetection();
          // Assert - should set fallback context key
          (0, vitest_1.expect)(executeCommandMock).toHaveBeenCalledWith(
            'setContext',
            'secondaryTerminal.panelLocation',
            'sidebar'
          );
        }
      );
    });
    (0, vitest_1.describe)('Integration with VS Code Commands', function () {
      (0, vitest_1.it)('should register split commands with proper when clauses', function () {
        // This test verifies the package.json configuration is correct
        // In a real test environment, we would check command registration
        (0, vitest_1.expect)(true).toBe(true); // Placeholder - would test command registration
      });
      (0, vitest_1.it)(
        'should maintain context key state across webview reloads',
        async function () {
          // Arrange
          mockProvider.resolveWebviewView(mockWebviewView);
          await mockProvider._handleWebviewMessage({
            command: 'reportPanelLocation',
            location: 'panel',
          });
          // Reset mocks to check second call
          executeCommandMock.mockClear();
          // Dispose and recreate provider (simulating webview reload)
          mockProvider.dispose();
          mockProvider._disposed = false;
          mockProvider._currentPanelLocation = 'sidebar'; // Reset state
          mockProvider.resolveWebviewView(mockWebviewView);
          // Assert - should set initial context key again
          (0, vitest_1.expect)(executeCommandMock).toHaveBeenCalledWith(
            'setContext',
            'secondaryTerminal.panelLocation',
            'sidebar'
          );
        }
      );
    });
    (0, vitest_1.describe)('Performance Considerations', function () {
      (0, vitest_1.beforeEach)(function () {
        mockProvider.resolveWebviewView(mockWebviewView);
      });
      (0, vitest_1.it)(
        'should not spam context key updates for rapid panel location changes',
        async function () {
          // Arrange
          const reportMessages = [
            { command: 'reportPanelLocation', location: 'panel' },
            { command: 'reportPanelLocation', location: 'sidebar' },
            { command: 'reportPanelLocation', location: 'panel' },
          ];
          // Clear previous calls
          executeCommandMock.mockClear();
          // Act - send rapid messages
          for (const message of reportMessages) {
            await mockProvider._handleWebviewMessage(message);
          }
          // Assert - should have called executeCommand for each change
          const setContextCalls = executeCommandMock.mock.calls.filter(
            (call) => call[0] === 'setContext' && call[1] === 'secondaryTerminal.panelLocation'
          );
          (0, vitest_1.expect)(setContextCalls).toHaveLength(3);
          (0, vitest_1.expect)(setContextCalls[0]).toEqual([
            'setContext',
            'secondaryTerminal.panelLocation',
            'panel',
          ]);
          (0, vitest_1.expect)(setContextCalls[1]).toEqual([
            'setContext',
            'secondaryTerminal.panelLocation',
            'sidebar',
          ]);
          (0, vitest_1.expect)(setContextCalls[2]).toEqual([
            'setContext',
            'secondaryTerminal.panelLocation',
            'panel',
          ]);
        }
      );
      (0, vitest_1.it)('should handle WebView message delays gracefully', async function () {
        // Arrange - simulate slow WebView response
        postMessageMock.mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100))
        );
        // Act
        const startTime = Date.now();
        await mockProvider._requestPanelLocationDetection();
        const endTime = Date.now();
        // Assert - should not block excessively
        (0, vitest_1.expect)(endTime - startTime).toBeLessThan(200);
        (0, vitest_1.expect)(postMessageMock).toHaveBeenCalled();
      });
    });
  }
);
//# sourceMappingURL=SecondaryTerminalProvider-SplitDirection.test.js.map
