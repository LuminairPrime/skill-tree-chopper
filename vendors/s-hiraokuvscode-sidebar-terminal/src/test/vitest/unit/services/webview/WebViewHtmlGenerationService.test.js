'use strict';
/**
 * WebViewHtmlGenerationService Unit Tests
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const WebViewHtmlGenerationService_1 = require('../../../../../services/webview/WebViewHtmlGenerationService');
// Mock VS Code API
vi.mock('vscode', () => ({
  Uri: {
    joinPath: vi.fn((uri, ...parts) => ({
      fsPath: `${uri.fsPath}/${parts.join('/')}`,
      toString: () => `vscode-resource://${uri.fsPath}/${parts.join('/')}`,
    })),
    parse: vi.fn((url) => ({ toString: () => url })),
  },
}));
// Mock logger
vi.mock('../../../../../utils/logger', () => ({
  provider: vi.fn(),
}));
// Mock common utils
vi.mock('../../../../../utils/common', () => ({
  generateNonce: vi.fn().mockReturnValue('mock-nonce'),
}));
(0, vitest_1.describe)('WebViewHtmlGenerationService', () => {
  let service;
  let mockWebview;
  let mockExtensionUri;
  beforeEach(() => {
    service = new WebViewHtmlGenerationService_1.WebViewHtmlGenerationService();
    mockWebview = {
      asWebviewUri: vi.fn((uri) => uri),
      cspSource: 'vscode-resource:',
    };
    mockExtensionUri = { fsPath: '/test/path' };
  });
  (0, vitest_1.describe)('generateMainHtml', () => {
    (0, vitest_1.it)('should generate valid HTML with CSP and scripts', () => {
      const html = service.generateMainHtml({
        webview: mockWebview,
        extensionUri: mockExtensionUri,
      });
      (0, vitest_1.expect)(html).toContain('<!DOCTYPE html>');
      (0, vitest_1.expect)(html).toContain('Content-Security-Policy');
      (0, vitest_1.expect)(html).toContain('nonce="mock-nonce"');
      (0, vitest_1.expect)(html).toContain('id="terminal-body"');
      (0, vitest_1.expect)(html).toContain('webview.js');
    });
    (0, vitest_1.it)('should include optional styles when requested', () => {
      const html = service.generateMainHtml({
        webview: mockWebview,
        extensionUri: mockExtensionUri,
        includeSplitStyles: true,
        includeCliAgentStyles: true,
      });
      (0, vitest_1.expect)(html).toContain('.claude-indicator');
    });
    (0, vitest_1.it)('should validate generated HTML', () => {
      const html = service.generateMainHtml({
        webview: mockWebview,
        extensionUri: mockExtensionUri,
      });
      const validation = service.validateHtml(html);
      (0, vitest_1.expect)(validation.isValid).toBe(true);
    });
  });
  (0, vitest_1.describe)('generateFallbackHtml', () => {
    (0, vitest_1.it)('should generate loading HTML by default', () => {
      const html = service.generateFallbackHtml();
      (0, vitest_1.expect)(html).toContain('Terminal Loading...');
      (0, vitest_1.expect)(html).toContain('spinner');
    });
    (0, vitest_1.it)('should allow custom title and message', () => {
      const html = service.generateFallbackHtml({
        title: 'Custom Title',
        message: 'Custom Message',
        isLoading: false,
      });
      (0, vitest_1.expect)(html).toContain('Custom Title');
      (0, vitest_1.expect)(html).toContain('Custom Message');
      (0, vitest_1.expect)(html).not.toContain('<div class="spinner"></div>');
    });
  });
  (0, vitest_1.describe)('generateErrorHtml', () => {
    (0, vitest_1.it)('should generate error page with details', () => {
      const error = new Error('Epic fail');
      const html = service.generateErrorHtml({ error, allowRetry: true });
      (0, vitest_1.expect)(html).toContain('❌ Terminal Error');
      (0, vitest_1.expect)(html).toContain('Epic fail');
      (0, vitest_1.expect)(html).toContain('retry-btn');
    });
  });
  (0, vitest_1.describe)('Validation', () => {
    (0, vitest_1.it)('should fail validation for empty HTML', () => {
      const result = service.validateHtml('');
      (0, vitest_1.expect)(result.isValid).toBe(false);
      (0, vitest_1.expect)(result.errors).toContain('HTML content is empty');
    });
    (0, vitest_1.it)('should fail if critical elements are missing', () => {
      const result = service.validateHtml('<html><body>No CSP</body></html>');
      (0, vitest_1.expect)(result.isValid).toBe(false);
      (0, vitest_1.expect)(result.errors).toContain('Missing Content Security Policy');
      (0, vitest_1.expect)(result.errors).toContain('Missing nonce for CSP');
    });
  });
});
//# sourceMappingURL=WebViewHtmlGenerationService.test.js.map
