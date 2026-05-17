'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.PanelLocationController = void 0;
const vscode = require('vscode');
const logger_1 = require('../../utils/logger');
const PanelLocationService_1 = require('../services/PanelLocationService');
class PanelLocationController {
  constructor(options) {
    this.options = options;
    this.logger = options.logger ?? logger_1.provider;
    this.panelLocationService =
      options.panelLocationService ||
      new PanelLocationService_1.PanelLocationService((message) => options.sendMessage(message));
  }
  async handleReportPanelLocation(message) {
    await this.panelLocationService.handlePanelLocationReport(
      message.location,
      async (_oldLocation, _newLocation) => {
        const terminalCount = this.options.terminalManager.getTerminals().length;
        if (terminalCount < 2) {
          return;
        }
        const splitDirection = this.panelLocationService.determineSplitDirection();
        await this.options.sendMessage({
          command: 'relayoutTerminals',
          direction: splitDirection,
        });
      }
    );
  }
  /**
   * 🎯 DEPRECATED: Visibility listener consolidated in SecondaryTerminalProvider
   * Following VS Code ViewPane pattern for single visibility handler
   * This duplicate listener has been replaced by SecondaryTerminalProvider._registerVisibilityListener()
   *
   * @deprecated Use SecondaryTerminalProvider._registerVisibilityListener() instead
   */
  registerVisibilityListener(webviewView) {
    (0, logger_1.provider)(
      '⚠️ [DEPRECATED] PanelLocationController.registerVisibilityListener is deprecated - visibility handled by SecondaryTerminalProvider'
    );
    // Method kept for backward compatibility but does nothing
    // Visibility listener is now consolidated in SecondaryTerminalProvider
    void webviewView; // Suppress unused parameter warning
  }
  async setupPanelLocationChangeListener(webviewView) {
    await this.panelLocationService.initialize(webviewView);
    const disposable = vscode.workspace.onDidChangeConfiguration((event) => {
      if (
        event.affectsConfiguration('secondaryTerminal.panelLocation') ||
        event.affectsConfiguration('secondaryTerminal.dynamicSplitDirection')
      ) {
        void this.panelLocationService.requestPanelLocationDetection();
      }
    });
    this.options.extensionContext.subscriptions.push(disposable);
  }
  requestPanelLocationDetection() {
    void this.panelLocationService.requestPanelLocationDetection();
  }
  determineSplitDirection() {
    return this.panelLocationService.determineSplitDirection();
  }
  getCurrentPanelLocation() {
    return this.panelLocationService.getCurrentPanelLocation();
  }
  getCachedPanelLocation() {
    return this.panelLocationService.getCachedPanelLocation();
  }
  dispose() {
    this.panelLocationService.dispose();
  }
}
exports.PanelLocationController = PanelLocationController;
//# sourceMappingURL=PanelLocationController.js.map
