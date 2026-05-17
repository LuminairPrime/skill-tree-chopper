'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ViewBootstrapper = void 0;
const logger_1 = require('../../utils/logger');
class ViewBootstrapper {
  constructor(messageBridge, panelLocationController, logger = logger_1.provider) {
    this.messageBridge = messageBridge;
    this.panelLocationController = panelLocationController;
    this.logger = logger;
  }
  async bootstrap(webviewView, hooks) {
    this.logger('🚀 [BOOTSTRAP] Starting Secondary Terminal webview setup');
    this.messageBridge.register(webviewView, hooks.validateMessage, hooks.handleMessage);
    await Promise.resolve(hooks.initializeMessageHandlers());
    hooks.configureWebview(webviewView);
    this.panelLocationController.registerVisibilityListener(webviewView);
    await Promise.resolve(hooks.initializeWebviewContent(webviewView));
    await Promise.resolve(hooks.registerCoreListeners());
    await this.panelLocationController.setupPanelLocationChangeListener(webviewView);
    this.logger('✅ [BOOTSTRAP] Webview setup complete');
  }
}
exports.ViewBootstrapper = ViewBootstrapper;
//# sourceMappingURL=ViewBootstrapper.js.map
