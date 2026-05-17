'use strict';
/**
 * WebViewLifecycleManager Unit Tests
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const WebViewLifecycleManager_1 = require('../../../../../providers/services/WebViewLifecycleManager');
// Mock logger
vi.mock('../../../../../utils/logger', () => ({
  provider: vi.fn(),
}));
// Mock error handler
vi.mock('../../../../../utils/feedback', () => ({
  TerminalErrorHandler: {
    handleWebviewError: vi.fn(),
  },
}));
(0, vitest_1.describe)('WebViewLifecycleManager', () => {
  let manager;
  let mockContext;
  let mockHtmlService;
  let mockWebviewView;
  beforeEach(() => {
    mockContext = {
      extensionUri: { fsPath: '/test/path' },
    };
    mockHtmlService = {
      generateFallbackHtml: vi.fn().mockReturnValue('<html>fallback</html>'),
      generateErrorHtml: vi.fn().mockReturnValue('<html>error</html>'),
    };
    mockWebviewView = {
      webview: {
        options: {},
        html: '',
      },
      visible: true,
      onDidChangeVisibility: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    };
    manager = new WebViewLifecycleManager_1.WebViewLifecycleManager(mockContext, mockHtmlService);
  });
  (0, vitest_1.describe)('Initialization and State', () => {
    (0, vitest_1.it)('should set and get the view', () => {
      manager.setView(mockWebviewView);
      (0, vitest_1.expect)(manager.getView()).toBe(mockWebviewView);
      (0, vitest_1.expect)(manager.isWebviewAvailable()).toBe(true);
    });
    (0, vitest_1.it)('should manage body rendered state', () => {
      (0, vitest_1.expect)(manager.isBodyRendered()).toBe(false);
      manager.setBodyRendered(true);
      (0, vitest_1.expect)(manager.isBodyRendered()).toBe(true);
    });
    (0, vitest_1.it)('should manage message listener flag', () => {
      (0, vitest_1.expect)(manager.isMessageListenerRegistered()).toBe(false);
      manager.setMessageListenerRegistered(true);
      (0, vitest_1.expect)(manager.isMessageListenerRegistered()).toBe(true);
    });
  });
  (0, vitest_1.describe)('Configuration', () => {
    (0, vitest_1.it)('should configure webview options', () => {
      manager.configureWebview(mockWebviewView);
      (0, vitest_1.expect)(mockWebviewView.webview.options.enableScripts).toBe(true);
      (0, vitest_1.expect)(mockWebviewView.webview.options.localResourceRoots).toContain(
        mockContext.extensionUri
      );
    });
  });
  (0, vitest_1.describe)('HTML Setting', () => {
    (0, vitest_1.it)('should set HTML successfully', () => {
      const content = '<html>test</html>';
      manager.setWebviewHtml(mockWebviewView, content);
      (0, vitest_1.expect)(mockWebviewView.webview.html).toBe(content);
      (0, vitest_1.expect)(manager.getPerformanceMetrics().htmlSetOperations).toBe(1);
    });
    (0, vitest_1.it)('should use fallback HTML if content is empty', () => {
      (0, vitest_1.expect)(() => manager.setWebviewHtml(mockWebviewView, '')).toThrow();
      (0, vitest_1.expect)(mockWebviewView.webview.html).toBe('<html>fallback</html>');
    });
    (0, vitest_1.it)('should handle setup error gracefully', () => {
      const error = new Error('Setup failed');
      manager.handleSetupError(mockWebviewView, error);
      (0, vitest_1.expect)(mockWebviewView.webview.html).toBe('<html>error</html>');
      (0, vitest_1.expect)(mockHtmlService.generateErrorHtml).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({ error })
      );
    });
  });
  (0, vitest_1.describe)('Visibility Handling', () => {
    (0, vitest_1.it)('should register visibility listener and trigger callbacks', () => {
      const onVisible = vi.fn();
      const onHidden = vi.fn();
      manager.registerVisibilityListener(mockWebviewView, onVisible, onHidden);
      const callback = mockWebviewView.onDidChangeVisibility.mock.calls[0][0];
      // Trigger visible
      mockWebviewView.visible = true;
      callback();
      (0, vitest_1.expect)(onVisible).toHaveBeenCalled();
      // Trigger hidden
      mockWebviewView.visible = false;
      callback();
      (0, vitest_1.expect)(onHidden).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('Performance Tracking', () => {
    (0, vitest_1.it)('should track resolve start', () => {
      manager.trackResolveStart();
      (0, vitest_1.expect)(manager.getPerformanceMetrics().resolveWebviewViewCallCount).toBe(1);
    });
    (0, vitest_1.it)('should track various timings', () => {
      vi.useFakeTimers();
      const start = manager.trackResolveStart();
      vi.advanceTimersByTime(150);
      manager.trackPanelMovement(start);
      (0, vitest_1.expect)(manager.getPerformanceMetrics().lastPanelMovementTime).toBe(150);
      vi.advanceTimersByTime(50);
      manager.trackInitializationComplete(start);
      (0, vitest_1.expect)(manager.getPerformanceMetrics().totalInitializationTime).toBe(200);
      vi.useRealTimers();
    });
    (0, vitest_1.it)('should track listener registrations', () => {
      manager.trackListenerRegistration();
      (0, vitest_1.expect)(manager.getPerformanceMetrics().listenerRegistrations).toBe(1);
    });
    (0, vitest_1.it)('should log performance metrics without throwing', () => {
      (0, vitest_1.expect)(() => manager.logPerformanceMetrics()).not.toThrow();
    });
  });
  (0, vitest_1.describe)('Cleanup', () => {
    (0, vitest_1.it)('should reset for new view', () => {
      manager.setBodyRendered(true);
      manager.resetForNewView();
      // htmlSet should be reset, but bodyRendered should remain (as per impl)
      (0, vitest_1.expect)(manager.isBodyRendered()).toBe(true);
    });
    (0, vitest_1.it)('should clear state on dispose', () => {
      manager.setBodyRendered(true);
      manager.dispose();
      (0, vitest_1.expect)(manager.isBodyRendered()).toBe(false);
      (0, vitest_1.expect)(manager.getView()).toBeUndefined();
    });
  });
});
//# sourceMappingURL=WebViewLifecycleManager.test.js.map
