'use strict';
/**
 * PanelLocationHandler
 *
 * Panel location detection gating logic extracted from SecondaryTerminalProvider.
 * Manages the request/response lifecycle for panel location detection,
 * including timeout handling and solicitation guards.
 *
 * Delegates actual panel location evaluation to PanelLocationService.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.PanelLocationHandler = void 0;
const vscode = require('vscode');
const logger_1 = require('../../utils/logger');
class PanelLocationHandler {
  constructor(_deps) {
    this._deps = _deps;
    /**
     * Whether panel location has been detected at least once
     */
    this._hasDetectedPanelLocation = false;
    /**
     * Whether a panel location detection request is pending
     */
    this._panelLocationDetectionPending = false;
    /**
     * Timeout for panel location detection response
     */
    this._panelLocationDetectionTimeout = null;
    this._disposables = [];
  }
  /**
   * Handle reportPanelLocation message from WebView.
   *
   * Only accepts reports when a detection request is pending (solicited responses).
   * Unsolicited reports are ignored to prevent setContext calls that cancel
   * VS Code's secondary sidebar maximize state.
   */
  async handleReportPanelLocation(message) {
    if (!this._panelLocationDetectionPending) {
      (0, logger_1.provider)('⏭️ [PROVIDER] Ignoring unsolicited panel location report');
      return;
    }
    const reportedLocation = message.location;
    if (!reportedLocation) {
      (0, logger_1.provider)('⚠️ [PROVIDER] Panel location report missing location');
      return;
    }
    this.clearPanelLocationDetectionPending('panel location report received');
    (0, logger_1.provider)(`📍 [PROVIDER] WebView reports panel location: ${reportedLocation}`);
    await this._deps.panelLocationService.handlePanelLocationReport(reportedLocation);
  }
  /**
   * Request panel location detection from WebView with timeout.
   *
   * In manual mode, skips detection and clears pending state.
   * In auto mode, sets pending flag and starts a timeout timer.
   */
  requestPanelLocationDetection() {
    const manualPanelLocation = vscode.workspace
      .getConfiguration('secondaryTerminal')
      .get('panelLocation', 'auto');
    if (manualPanelLocation !== 'auto') {
      (0, logger_1.provider)(
        `📍 [PROVIDER] Manual panelLocation=${manualPanelLocation}; skipping panel location detection request`
      );
      this.clearPanelLocationDetectionPending('manual panelLocation mode');
      return;
    }
    this._panelLocationDetectionPending = true;
    if (this._panelLocationDetectionTimeout) {
      clearTimeout(this._panelLocationDetectionTimeout);
    }
    this._panelLocationDetectionTimeout = setTimeout(() => {
      this.clearPanelLocationDetectionPending('panel location response timeout');
    }, PanelLocationHandler.PANEL_LOCATION_RESPONSE_TIMEOUT_MS);
    this._deps.panelLocationService.requestPanelLocationDetection();
  }
  /**
   * Clear pending detection state and cancel timeout.
   */
  clearPanelLocationDetectionPending(reason) {
    if (!this._panelLocationDetectionPending && !this._panelLocationDetectionTimeout) {
      return;
    }
    (0, logger_1.provider)(
      `📍 [PROVIDER] Clearing panel location detection pending state (${reason})`
    );
    this._panelLocationDetectionPending = false;
    if (this._panelLocationDetectionTimeout) {
      clearTimeout(this._panelLocationDetectionTimeout);
      this._panelLocationDetectionTimeout = null;
    }
  }
  /**
   * Handle WebView becoming visible.
   *
   * On first visibility, schedules panel location detection after a short delay
   * to allow layout to stabilize. Subsequent visibility events skip detection
   * to prevent unnecessary setContext calls.
   */
  handleWebviewVisible() {
    if (this._hasDetectedPanelLocation) {
      (0, logger_1.provider)(
        '⏭️ [VISIBILITY] Panel location already detected, skipping redundant detection'
      );
      return;
    }
    // Set flag BEFORE setTimeout to prevent race condition:
    // Multiple visibility events within 200ms would otherwise bypass the guard
    // and queue multiple detection timers, each triggering setContext.
    this._hasDetectedPanelLocation = true;
    setTimeout(() => {
      (0, logger_1.provider)('📍 [VISIBILITY] Requesting initial panel location detection');
      this.requestPanelLocationDetection();
    }, PanelLocationHandler.VISIBILITY_DETECTION_DELAY_MS);
  }
  /**
   * Set up configuration change listener for panel location changes.
   *
   * When panelLocation setting changes, reports the new location to PanelLocationService.
   * Returns the disposable for the caller to manage.
   */
  setupPanelLocationChangeListener() {
    (0, logger_1.provider)('🔧 [PROVIDER] Setting up panel location change listener...');
    const disposable = vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('secondaryTerminal.panelLocation')) {
        (0, logger_1.provider)('📍 [PROVIDER] Panel location configuration changed');
        const newLocation = vscode.workspace
          .getConfiguration('secondaryTerminal')
          .get('panelLocation', 'sidebar');
        (0, logger_1.provider)(`📍 [PROVIDER] New panel location: ${newLocation}`);
        this._deps.panelLocationService.handlePanelLocationReport(newLocation).catch((error) => {
          (0, logger_1.provider)(`❌ [PROVIDER] Failed to handle panel location change: ${error}`);
        });
      }
    });
    this._disposables.push(disposable);
    (0, logger_1.provider)('✅ [PROVIDER] Panel location change listener registered');
    return disposable;
  }
  /**
   * Whether a panel location detection request is currently pending.
   */
  get isDetectionPending() {
    return this._panelLocationDetectionPending;
  }
  /**
   * Whether panel location has been detected at least once.
   */
  get hasDetectedPanelLocation() {
    return this._hasDetectedPanelLocation;
  }
  /**
   * Reset detection state (used during dispose).
   */
  resetDetectionState() {
    this._hasDetectedPanelLocation = false;
    this.clearPanelLocationDetectionPending('state reset');
  }
  dispose() {
    this.clearPanelLocationDetectionPending('handler disposed');
    this._disposables.forEach((d) => d.dispose());
    this._disposables.length = 0;
  }
}
exports.PanelLocationHandler = PanelLocationHandler;
/**
 * Timeout for waiting for panel location response from WebView (ms)
 */
PanelLocationHandler.PANEL_LOCATION_RESPONSE_TIMEOUT_MS = 2000;
/**
 * Delay before requesting detection after first visibility (ms)
 */
PanelLocationHandler.VISIBILITY_DETECTION_DELAY_MS = 200;
//# sourceMappingURL=PanelLocationHandler.js.map
