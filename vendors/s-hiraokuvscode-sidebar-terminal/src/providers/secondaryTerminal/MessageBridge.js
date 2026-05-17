'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.MessageBridge = void 0;
const logger_1 = require('../../utils/logger');
/**
 * MessageBridge ensures we always register WebView listeners before injecting HTML.
 * It centralizes validation, logging, and error isolation so the provider no longer
 * contains the onDidReceiveMessage boilerplate.
 */
class MessageBridge {
  constructor(extensionContext, logger = logger_1.provider) {
    this.extensionContext = extensionContext;
    this.logger = logger;
  }
  register(webviewView, validator, handler) {
    this.logger('🔧 [BRIDGE] Registering webview message listener');
    const disposable = webviewView.webview.onDidReceiveMessage(async (message) => {
      this.logger('📨 [BRIDGE] Message received from WebView');
      if (!validator(message)) {
        this.logger('⚠️ [BRIDGE] Invalid WebView message received, ignoring');
        return;
      }
      try {
        await handler(message);
      } catch (error) {
        this.logger('❌ [BRIDGE] Error while handling WebView message:', error);
      }
    });
    this.extensionContext.subscriptions.push(disposable);
    this.logger('✅ [BRIDGE] Message listener registered');
  }
}
exports.MessageBridge = MessageBridge;
//# sourceMappingURL=MessageBridge.js.map
