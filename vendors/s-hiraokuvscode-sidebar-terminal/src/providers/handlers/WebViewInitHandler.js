'use strict';
/**
 * WebViewInitHandler
 *
 * WebView initialization/handshake lifecycle handler extracted from SecondaryTerminalProvider.
 * Manages: theme resolution, webviewReady/webviewInitialized handshake, panel move reinit,
 * font settings initialization, visibility handling, and message queuing before init.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.WebViewInitHandler = void 0;
const vscode = require('vscode');
const logger_1 = require('../../utils/logger');
class WebViewInitHandler {
  constructor(deps) {
    this.deps = deps;
    this._isInitialized = false;
    this._pendingPanelMoveReinit = false;
    this._pendingMessages = [];
  }
  /**
   * Whether the WebView handshake is complete and messages can be sent
   */
  get isInitialized() {
    return this._isInitialized;
  }
  /**
   * Whether a panel move reinit is pending
   */
  get isPendingPanelMoveReinit() {
    return this._pendingPanelMoveReinit;
  }
  /**
   * Set pending panel move reinit flag (used by resolveWebviewView on re-entry)
   */
  setPendingPanelMoveReinit(value) {
    this._pendingPanelMoveReinit = value;
  }
  /**
   * Resolve the initial theme for WebView HTML generation.
   * When 'auto', maps VS Code's active color theme to 'light' or 'dark'.
   */
  resolveInitialTheme(settingsTheme) {
    const normalizedTheme = settingsTheme ?? 'auto';
    if (normalizedTheme !== 'auto') {
      return normalizedTheme;
    }
    const activeThemeKind = vscode.window?.activeColorTheme?.kind;
    const hasThemeKind =
      typeof vscode.ColorThemeKind !== 'undefined' && typeof activeThemeKind === 'number';
    if (!hasThemeKind) {
      return normalizedTheme;
    }
    if (
      activeThemeKind === vscode.ColorThemeKind.Light ||
      activeThemeKind === vscode.ColorThemeKind.HighContrastLight
    ) {
      return 'light';
    }
    if (
      activeThemeKind === vscode.ColorThemeKind.Dark ||
      activeThemeKind === vscode.ColorThemeKind.HighContrast
    ) {
      return 'dark';
    }
    return normalizedTheme;
  }
  /**
   * Handle 'webviewReady' message - Extension side of the handshake.
   * Sends extensionReady, marks initialized, flushes queued messages.
   */
  handleWebviewReady(_message) {
    (0, logger_1.provider)('🔥 [TERMINAL-INIT] === _handleWebviewReady CALLED ===');
    if (this._isInitialized) {
      (0, logger_1.provider)(
        '🔄 [TERMINAL-INIT] WebView already initialized, skipping duplicate initialization'
      );
      return;
    }
    (0, logger_1.provider)(
      '🎯 [TERMINAL-INIT] WebView ready - sending extensionReady confirmation'
    );
    // Send extensionReady
    (0, logger_1.provider)('🤝 [HANDSHAKE] Sending extensionReady in response to webviewReady');
    void this.deps.sendMessage({
      command: 'extensionReady',
      timestamp: Date.now(),
    });
    (0, logger_1.provider)('✅ [HANDSHAKE] extensionReady sent to WebView');
    // Mark as initialized (allows messages to be sent)
    this._isInitialized = true;
    // Flush any messages queued before the webview was ready
    if (this._pendingMessages.length > 0) {
      const queued = [...this._pendingMessages];
      this._pendingMessages = [];
      queued.forEach((message) => {
        void this.deps.sendMessage(message);
      });
    }
    this.deps.startPendingWatchdogs(this._isInitialized);
    // Send version information
    this.deps.sendVersionInfo();
    // HANDSHAKE: Do NOT start terminal initialization here!
    // We must wait for webviewInitialized message to ensure WebView's
    // message handlers are fully set up before sending terminalCreated messages.
    (0, logger_1.provider)(
      '⏳ [HANDSHAKE] Waiting for webviewInitialized before starting terminal initialization'
    );
  }
  /**
   * Handle 'webviewInitialized' message - WebView's message handlers are fully set up.
   * Sends settings then starts terminal initialization.
   */
  async handleWebviewInitialized(_message) {
    (0, logger_1.provider)('🎯 [TERMINAL-INIT] === _handleWebviewInitialized CALLED ===');
    (0, logger_1.provider)(
      '🎯 [TERMINAL-INIT] WebView fully initialized - starting terminal initialization'
    );
    (0, logger_1.provider)(
      `🔍 [TERMINAL-INIT] _pendingPanelMoveReinit: ${this._pendingPanelMoveReinit}`
    );
    // Handle panel move reinit first
    if (this._pendingPanelMoveReinit) {
      this._pendingPanelMoveReinit = false;
      await this.reinitializeWebviewAfterPanelMove();
      return;
    }
    // CRITICAL FIX: Send settings BEFORE creating terminals
    const settings = this.deps.getCurrentSettings();
    const fontSettings = this.deps.getCurrentFontSettings();
    (0, logger_1.provider)(
      `📤 [TERMINAL-INIT] Sending settings to WebView FIRST (theme: ${settings.theme})`
    );
    await this.deps.sendMessage({
      command: 'settingsResponse',
      settings,
    });
    await this.deps.sendMessage({
      command: 'fontSettingsUpdate',
      fontSettings,
    });
    (0, logger_1.provider)('✅ [TERMINAL-INIT] Settings sent to WebView before terminal creation');
    // Send init message and font settings BEFORE creating terminals
    await this.initializeWithFontSettings();
  }
  /**
   * Reinitialize WebView after a panel move (sidebar <-> auxiliary bar).
   */
  async reinitializeWebviewAfterPanelMove() {
    try {
      (0, logger_1.provider)('🔄 [PANEL-MOVE] Reinitializing WebView after panel move');
      await this.deps.sendMessage({
        command: 'init',
        timestamp: Date.now(),
      });
      const fontSettings = this.deps.getCurrentFontSettings();
      await this.deps.sendMessage({
        command: 'fontSettingsUpdate',
        fontSettings,
      });
      await this.deps.initializeTerminal();
      this.deps.sendFullCliAgentStateSync();
      (0, logger_1.provider)('✅ [PANEL-MOVE] WebView reinitialization complete');
    } catch (error) {
      (0, logger_1.provider)(
        '❌ [PANEL-MOVE] Failed to reinitialize WebView after panel move:',
        error
      );
      try {
        await this.deps.initializeTerminal();
      } catch {
        // ignore
      }
    }
  }
  /**
   * Initialize WebView with font settings before creating terminals.
   * Sends init -> font settings -> orchestrator.initialize() in sequence.
   */
  async initializeWithFontSettings() {
    try {
      // Step 1: Send init message
      (0, logger_1.provider)('📤 [TERMINAL-INIT] Step 1: Sending init message to WebView...');
      await this.deps.sendMessage({
        command: 'init',
        timestamp: Date.now(),
      });
      (0, logger_1.provider)('✅ [TERMINAL-INIT] init message sent');
      // Step 2: Send font settings BEFORE terminal creation
      const fontSettings = this.deps.getCurrentFontSettings();
      (0, logger_1.provider)(
        '📤 [TERMINAL-INIT] Step 2: Sending font settings BEFORE terminal creation'
      );
      await this.deps.sendMessage({
        command: 'fontSettingsUpdate',
        fontSettings,
      });
      (0, logger_1.provider)('✅ [TERMINAL-INIT] Font settings sent');
      // Step 3: Now create terminals - they will use the font settings we just sent
      (0, logger_1.provider)(
        '📤 [TERMINAL-INIT] Step 3: Starting terminal initialization with font settings ready'
      );
      await this.deps.orchestratorInitialize();
      (0, logger_1.provider)('✅ [TERMINAL-INIT] Terminal initialization complete');
    } catch (error) {
      (0, logger_1.provider)('❌ [TERMINAL-INIT] Error during initialization:', error);
      // Still try to initialize terminals even if font settings failed
      void this.deps.orchestratorInitialize();
    }
  }
  /**
   * Handle WebView becoming visible
   */
  handleWebviewVisible() {
    (0, logger_1.provider)('🔄 [VISIBILITY] Handling WebView visible event');
    // Note: secondaryTerminalFocus context is NOT set here. Visibility does not imply DOM focus.
    this.deps.panelLocationHandlerHandleWebviewVisible();
  }
  /**
   * Handle WebView becoming hidden
   */
  handleWebviewHidden() {
    (0, logger_1.provider)('🔄 [VISIBILITY] Handling WebView hidden event');
    // Clear focus context when WebView is hidden
    void vscode.commands.executeCommand('setContext', 'secondaryTerminalFocus', false);
  }
  /**
   * Send a message, queuing it if the WebView handshake is not yet complete.
   * extensionReady messages bypass the queue.
   */
  async sendMessage(message) {
    if (!this._isInitialized && message.command !== 'extensionReady') {
      this._pendingMessages.push(message);
      (0, logger_1.provider)(
        `⏳ [PROVIDER] Queuing message until webviewReady: ${message.command}`
      );
      return;
    }
    await this.deps.sendMessage(message);
  }
  /**
   * Queue a message for later flushing (used before init completes)
   */
  queueMessage(message) {
    this._pendingMessages.push(message);
  }
  /**
   * Reset initialization state (e.g., on panel move or dispose)
   */
  reset() {
    this._isInitialized = false;
    this._pendingPanelMoveReinit = false;
    this._pendingMessages = [];
  }
}
exports.WebViewInitHandler = WebViewInitHandler;
//# sourceMappingURL=WebViewInitHandler.js.map
