'use strict';
/**
 * WebViewCommunicationService Unit Tests
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const WebViewCommunicationService_1 = require('../../../../../providers/services/WebViewCommunicationService');
// Mock VS Code API
vi.mock('vscode', () => ({
  extensions: {
    getExtension: vi.fn().mockReturnValue({
      packageJSON: { version: '1.2.3' },
    }),
  },
}));
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
(0, vitest_1.describe)('WebViewCommunicationService', () => {
  let service;
  let mockWebviewView;
  beforeEach(() => {
    service = new WebViewCommunicationService_1.WebViewCommunicationService();
    mockWebviewView = {
      webview: {
        postMessage: vi.fn().mockResolvedValue(true),
      },
    };
  });
  (0, vitest_1.describe)('View Management', () => {
    (0, vitest_1.it)('should set and get the view', () => {
      service.setView(mockWebviewView);
      (0, vitest_1.expect)(service.getView()).toBe(mockWebviewView);
      (0, vitest_1.expect)(service.isViewAvailable()).toBe(true);
    });
    (0, vitest_1.it)('should clear the view', () => {
      service.setView(mockWebviewView);
      service.clearView();
      (0, vitest_1.expect)(service.getView()).toBeUndefined();
      (0, vitest_1.expect)(service.isViewAvailable()).toBe(false);
    });
  });
  (0, vitest_1.describe)('Message Sending', () => {
    (0, vitest_1.it)('should send message directly if view is available', async () => {
      service.setView(mockWebviewView);
      const message = { command: 'test' };
      // @ts-expect-error - test mock type
      await service.sendMessage(message);
      (0, vitest_1.expect)(mockWebviewView.webview.postMessage).toHaveBeenCalledWith(message);
    });
    (0, vitest_1.it)(
      'should queue messages if view is not available and flush when set',
      async () => {
        const message = { command: 'queued' };
        // @ts-expect-error - test mock type
        await service.sendMessage(message);
        (0, vitest_1.expect)(mockWebviewView.webview.postMessage).not.toHaveBeenCalled();
        service.setView(mockWebviewView);
        (0, vitest_1.expect)(mockWebviewView.webview.postMessage).toHaveBeenCalledWith(message);
      }
    );
    (0, vitest_1.it)('should handle disposed webview error gracefully', async () => {
      service.setView(mockWebviewView);
      mockWebviewView.webview.postMessage.mockRejectedValue(new Error('Webview is disposed'));
      await service.sendMessage({ command: 'test' });
      // Should log warning but not re-throw or call error handler for 'disposed' error
      const { TerminalErrorHandler } = await Promise.resolve().then(() =>
        require('../../../../../utils/feedback')
      );
      (0, vitest_1.expect)(TerminalErrorHandler.handleWebviewError).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should call error handler for other message errors', async () => {
      service.setView(mockWebviewView);
      const error = new Error('Generic failure');
      mockWebviewView.webview.postMessage.mockRejectedValue(error);
      await service.sendMessage({ command: 'test' });
      const { TerminalErrorHandler } = await Promise.resolve().then(() =>
        require('../../../../../utils/feedback')
      );
      (0, vitest_1.expect)(TerminalErrorHandler.handleWebviewError).toHaveBeenCalledWith(error);
    });
  });
  (0, vitest_1.describe)('Specific Message Helpers', () => {
    beforeEach(() => {
      service.setView(mockWebviewView);
    });
    (0, vitest_1.it)('should send version info', async () => {
      await service.sendVersionInfo();
      (0, vitest_1.expect)(mockWebviewView.webview.postMessage).toHaveBeenCalledWith({
        command: 'versionInfo',
        version: 'v1.2.3',
      });
    });
    (0, vitest_1.it)('should send settings', async () => {
      const settings = { theme: 'dark' };
      const fontSettings = { fontSize: 14 };
      await service.sendSettings(settings, fontSettings);
      (0, vitest_1.expect)(mockWebviewView.webview.postMessage).toHaveBeenCalledWith({
        command: 'updateSettings',
        settings,
        fontSettings,
      });
    });
    (0, vitest_1.it)('should send initialization complete', async () => {
      await service.sendInitializationComplete(2);
      (0, vitest_1.expect)(mockWebviewView.webview.postMessage).toHaveBeenCalledWith({
        command: 'initializationComplete',
        terminalCount: 2,
      });
    });
    (0, vitest_1.it)('should request panel location detection', async () => {
      await service.requestPanelLocationDetection();
      (0, vitest_1.expect)(mockWebviewView.webview.postMessage).toHaveBeenCalledWith({
        command: 'requestPanelLocationDetection',
      });
    });
  });
});
//# sourceMappingURL=WebViewCommunicationService.test.js.map
