'use strict';
/**
 * Terminal Event Coordinator
 *
 * Manages terminal event listeners and forwards events to WebView
 * Extracted from SecondaryTerminalProvider for better separation of concerns
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.TerminalEventCoordinator = void 0;
const vscode = require('vscode');
const logger_1 = require('../../utils/logger');
const constants_1 = require('../../constants');
const common_1 = require('../../utils/common');
const UnifiedConfigurationService_1 = require('../../config/UnifiedConfigurationService');
const DisposableStore_1 = require('../../utils/DisposableStore');
/**
 * Terminal Event Coordinator
 *
 * Responsibilities:
 * - Setting up terminal event listeners (data, exit, creation, removal, focus)
 * - Forwarding terminal events to WebView
 * - CLI Agent status monitoring
 * - Configuration change monitoring
 * - Cleanup of event listeners
 */
class TerminalEventCoordinator {
  constructor(
    _terminalManager,
    _sendMessage,
    _sendFullCliAgentStateSync,
    _terminalIdMapping,
    _initializationState
  ) {
    this._terminalManager = _terminalManager;
    this._sendMessage = _sendMessage;
    this._sendFullCliAgentStateSync = _sendFullCliAgentStateSync;
    this._terminalIdMapping = _terminalIdMapping;
    this._initializationState = _initializationState;
    this._terminalEventStore = new DisposableStore_1.DisposableStore();
    this._disposables = new DisposableStore_1.DisposableStore();
    this._outputBuffers = new Map();
    // Debounce timer for config change events
    this._configChangeDebounceTimer = null;
    // 🔧 FIX: Track entire settings payload to prevent dropping non-theme setting changes
    this._lastSentSettingsKey = null;
    // 🔧 FIX: Track font settings to prevent duplicate font settings updates
    this._lastFontSettingsKey = null;
    // 🔧 FIX: Persistent flags to accumulate update intent across debounce window
    // This prevents stale closure values when multiple config events fire rapidly
    this._pendingSettingsUpdate = false;
    this._pendingFontSettingsUpdate = false;
  }
  /**
   * Initialize event listeners
   */
  initialize() {
    this.setupTerminalEventListeners();
    this.setupCliAgentStatusListeners();
    this.setupConfigurationChangeListeners();
    (0, logger_1.provider)('✅ [EVENT-COORDINATOR] All event listeners initialized');
  }
  /**
   * Set up terminal event listeners
   */
  setupTerminalEventListeners() {
    // Clear existing listeners to prevent duplicates
    this.clearTerminalEventListeners();
    // Handle terminal output
    const dataDisposable = this._terminalManager.onData((event) => {
      if (!event.data) {
        (0, logger_1.provider)(
          '⚠️ [EVENT-COORDINATOR] Empty data received from terminal:',
          event.terminalId
        );
        return;
      }
      const webviewTerminalId = this._resolveWebviewTerminalId(event.terminalId);
      const outputAllowed =
        !this._initializationState || this._initializationState.isOutputAllowed(event.terminalId);
      (0, logger_1.provider)(
        '🔍 [EVENT-COORDINATOR] Terminal output received:',
        event.data.length,
        'chars, Extension ID:',
        event.terminalId,
        '→ WebView ID:',
        webviewTerminalId,
        'ready:',
        outputAllowed,
        'preview:',
        JSON.stringify(event.data.substring(0, 50))
      );
      if (!outputAllowed) {
        this._bufferOutput(webviewTerminalId, event.data);
        return;
      }
      this._sendOutput(webviewTerminalId, event.data);
    });
    // Handle terminal exit
    const exitDisposable = this._terminalManager.onExit((event) => {
      void this._sendMessage({
        command: constants_1.TERMINAL_CONSTANTS.COMMANDS.EXIT,
        exitCode: event.exitCode,
        terminalId: event.terminalId,
      });
    });
    // Handle terminal creation
    const createdDisposable = this._terminalManager.onTerminalCreated((terminal) => {
      (0, logger_1.provider)(
        '🆕 [EVENT-COORDINATOR] Terminal created:',
        terminal.id,
        terminal.name
      );
      const displayModeOverride =
        'consumeCreationDisplayModeOverride' in this._terminalManager &&
        typeof this._terminalManager.consumeCreationDisplayModeOverride === 'function'
          ? this._terminalManager.consumeCreationDisplayModeOverride(terminal.id)
          : (terminal.creationDisplayModeOverride ?? null);
      const message = {
        command: constants_1.TERMINAL_CONSTANTS.COMMANDS.TERMINAL_CREATED,
        terminalId: terminal.id,
        terminalName: terminal.name,
        terminalNumber: terminal.number,
        config: displayModeOverride
          ? { ...(0, common_1.getTerminalConfig)(), displayModeOverride }
          : (0, common_1.getTerminalConfig)(),
      };
      void this._sendMessage(message);
    });
    // Handle terminal removal
    const removedDisposable = this._terminalManager.onTerminalRemoved((terminalId) => {
      this._outputBuffers.delete(this._resolveWebviewTerminalId(terminalId));
      void this._sendMessage({
        command: constants_1.TERMINAL_CONSTANTS.COMMANDS.TERMINAL_REMOVED,
        terminalId,
      });
    });
    // Handle state updates
    const stateUpdateDisposable = this._terminalManager.onStateUpdate((state) => {
      void this._sendMessage({
        command: 'stateUpdate',
        state,
      });
    });
    // Handle terminal focus
    const focusDisposable = this._terminalManager.onTerminalFocus((terminalId) => {
      void this._sendMessage({
        command: 'focusTerminal',
        terminalId,
      });
    });
    // Store disposables for cleanup
    this._terminalEventStore.add(dataDisposable);
    this._terminalEventStore.add(exitDisposable);
    this._terminalEventStore.add(createdDisposable);
    this._terminalEventStore.add(removedDisposable);
    this._terminalEventStore.add(stateUpdateDisposable);
    this._terminalEventStore.add(focusDisposable);
    (0, logger_1.provider)('✅ [EVENT-COORDINATOR] Terminal event listeners setup complete');
  }
  /**
   * Clear terminal event listeners
   */
  clearTerminalEventListeners() {
    this._terminalEventStore.dispose();
    this._terminalEventStore = new DisposableStore_1.DisposableStore();
    this._outputBuffers.clear();
    (0, logger_1.provider)('🧹 [EVENT-COORDINATOR] Terminal event listeners cleared');
  }
  flushBufferedOutput(extensionTerminalId) {
    const webviewTerminalId = this._resolveWebviewTerminalId(extensionTerminalId);
    const buffer = this._outputBuffers.get(webviewTerminalId);
    if (!buffer || buffer.length === 0) {
      return;
    }
    const combined = buffer.join('');
    this._outputBuffers.delete(webviewTerminalId);
    (0, logger_1.provider)(
      `📤 [EVENT-COORDINATOR] Flushing buffered output for ${webviewTerminalId}: ${combined.length} chars (${buffer.length} chunks)`
    );
    this._sendOutput(webviewTerminalId, combined);
  }
  _bufferOutput(webviewTerminalId, chunk) {
    const existing = this._outputBuffers.get(webviewTerminalId) ?? [];
    existing.push(chunk);
    this._outputBuffers.set(webviewTerminalId, existing);
    (0, logger_1.provider)(
      `⏸️ [EVENT-COORDINATOR] Buffering output for ${webviewTerminalId} (chunks=${existing.length}, length=${chunk.length})`
    );
  }
  _sendOutput(webviewTerminalId, data) {
    void this._sendMessage({
      command: constants_1.TERMINAL_CONSTANTS.COMMANDS.OUTPUT,
      data,
      terminalId: webviewTerminalId,
    });
  }
  _resolveWebviewTerminalId(extensionTerminalId) {
    return this._terminalIdMapping?.get(extensionTerminalId) || extensionTerminalId;
  }
  /**
   * Set up CLI Agent status listeners
   */
  setupCliAgentStatusListeners() {
    (0, logger_1.provider)('🎯 [EVENT-COORDINATOR] Setting up CLI Agent status listeners');
    const claudeStatusDisposable = this._terminalManager.onCliAgentStatusChange((event) => {
      try {
        (0, logger_1.provider)('📡 [EVENT-COORDINATOR] Received CLI Agent status change:', event);
        (0, logger_1.provider)('🔄 [EVENT-COORDINATOR] Triggering full CLI Agent state sync');
        this._sendFullCliAgentStateSync();
      } catch (error) {
        (0, logger_1.provider)(
          '❌ [EVENT-COORDINATOR] CLI Agent status change processing failed:',
          error
        );
      }
    });
    this._disposables.add(claudeStatusDisposable);
    (0, logger_1.provider)('✅ [EVENT-COORDINATOR] CLI Agent status listeners setup complete');
  }
  /**
   * Set up configuration change listeners
   *
   * 🔧 FIX: Uses persistent instance flags (_pendingSettingsUpdate, _pendingFontSettingsUpdate)
   * to accumulate update intent across debounce window. This ensures all config changes
   * within the 100ms debounce window are honored, avoiding stale closure values.
   */
  setupConfigurationChangeListeners() {
    const configChangeDisposable = vscode.workspace.onDidChangeConfiguration((event) => {
      // Check for general settings changes - use OR to accumulate intent
      if (
        event.affectsConfiguration('editor.multiCursorModifier') ||
        event.affectsConfiguration('terminal.integrated.altClickMovesCursor') ||
        event.affectsConfiguration('secondaryTerminal.altClickMovesCursor') ||
        event.affectsConfiguration('secondaryTerminal.theme') ||
        event.affectsConfiguration('secondaryTerminal.cursorBlink') ||
        event.affectsConfiguration('secondaryTerminal.enableTerminalHeaderEnhancements') ||
        event.affectsConfiguration('secondaryTerminal.activeBorderMode')
      ) {
        this._pendingSettingsUpdate = true;
      }
      // Check for font settings changes - use OR to accumulate intent
      if (
        event.affectsConfiguration('terminal.integrated.fontSize') ||
        event.affectsConfiguration('terminal.integrated.fontFamily') ||
        event.affectsConfiguration('terminal.integrated.fontWeight') ||
        event.affectsConfiguration('terminal.integrated.fontWeightBold') ||
        event.affectsConfiguration('terminal.integrated.lineHeight') ||
        event.affectsConfiguration('terminal.integrated.letterSpacing') ||
        event.affectsConfiguration('editor.fontSize') ||
        event.affectsConfiguration('editor.fontFamily') ||
        event.affectsConfiguration('secondaryTerminal.fontWeight') ||
        event.affectsConfiguration('secondaryTerminal.fontWeightBold') ||
        event.affectsConfiguration('secondaryTerminal.lineHeight') ||
        event.affectsConfiguration('secondaryTerminal.letterSpacing')
      ) {
        this._pendingFontSettingsUpdate = true;
      }
      // Send updated settings to WebView when configuration changes
      // Use debounce to prevent rapid-fire updates
      if (this._pendingSettingsUpdate || this._pendingFontSettingsUpdate) {
        // Clear any pending debounce timer
        if (this._configChangeDebounceTimer) {
          clearTimeout(this._configChangeDebounceTimer);
        }
        // Debounce: wait 100ms for config to settle before sending update
        this._configChangeDebounceTimer = setTimeout(() => {
          // Read and reset the flags atomically
          const shouldUpdateSettings = this._pendingSettingsUpdate;
          const shouldUpdateFontSettings = this._pendingFontSettingsUpdate;
          this._pendingSettingsUpdate = false;
          this._pendingFontSettingsUpdate = false;
          (0, logger_1.provider)(
            '⚙️ [EVENT-COORDINATOR] Configuration changed (settings:',
            shouldUpdateSettings,
            ', fonts:',
            shouldUpdateFontSettings,
            ')'
          );
          // Send updated settings to WebView
          if (shouldUpdateSettings) {
            const settings = this._getCurrentSettings();
            // 🔧 FIX: Deduplicate on entire settings payload, not just theme
            // This ensures non-theme settings (cursorBlink, altClickMovesCursor, etc.) are sent
            const settingsKey = JSON.stringify(settings);
            if (settingsKey !== this._lastSentSettingsKey) {
              (0, logger_1.provider)(`📤 [EVENT-COORDINATOR] Sending settings update`);
              this._lastSentSettingsKey = settingsKey;
              this._sendMessage({
                command: 'settingsResponse',
                settings,
              }).catch((err) =>
                (0, logger_1.provider)(
                  '❌ [EVENT-COORDINATOR] Failed to send settings update:',
                  err
                )
              );
              (0, logger_1.provider)('⚙️ [EVENT-COORDINATOR] Sent settings update to WebView');
            } else {
              (0, logger_1.provider)(`⏭️ [EVENT-COORDINATOR] Skipping duplicate settings update`);
            }
          }
          if (shouldUpdateFontSettings) {
            const fontSettings = this._getCurrentFontSettings();
            // 🔧 FIX: Deduplicate font settings to prevent duplicate updates within debounce window
            const fontSettingsKey = JSON.stringify(fontSettings);
            if (fontSettingsKey !== this._lastFontSettingsKey) {
              (0, logger_1.provider)(`📤 [EVENT-COORDINATOR] Sending font settings update`);
              this._lastFontSettingsKey = fontSettingsKey;
              this._sendMessage({
                command: 'fontSettingsUpdate',
                fontSettings,
              }).catch((err) =>
                (0, logger_1.provider)(
                  '❌ [EVENT-COORDINATOR] Failed to send font settings update:',
                  err
                )
              );
              (0, logger_1.provider)('⚙️ [EVENT-COORDINATOR] Sent font settings update to WebView');
            } else {
              (0, logger_1.provider)(
                `⏭️ [EVENT-COORDINATOR] Skipping duplicate font settings update`
              );
            }
          }
          // 🔧 FIX: Nullify timer after callback for clarity
          this._configChangeDebounceTimer = null;
        }, 100); // 100ms debounce
      }
    });
    this._disposables.add(configChangeDisposable);
    (0, logger_1.provider)('✅ [EVENT-COORDINATOR] Configuration change listeners setup complete');
  }
  /**
   * Get terminal ID mapping
   */
  getTerminalIdMapping() {
    return this._terminalIdMapping;
  }
  /**
   * Get current settings from VS Code configuration
   * Uses UnifiedConfigurationService for consistency with other settings sources
   * 🔧 FIX: Returns typed WebViewSettingsPayload instead of Record<string, unknown>
   */
  _getCurrentSettings() {
    const configService = (0, UnifiedConfigurationService_1.getUnifiedConfigurationService)();
    const settings = configService.getCompleteTerminalSettings();
    const altClickSettings = configService.getAltClickSettings();
    return {
      cursorBlink: settings.cursorBlink,
      theme: settings.theme || 'auto',
      altClickMovesCursor: altClickSettings.altClickMovesCursor,
      multiCursorModifier: altClickSettings.multiCursorModifier,
      enableCliAgentIntegration: configService.isFeatureEnabled('cliAgentIntegration'),
      enableTerminalHeaderEnhancements: configService.isFeatureEnabled(
        'terminalHeaderEnhancements'
      ),
      activeBorderMode: configService.get('sidebarTerminal', 'activeBorderMode', 'multipleOnly'),
      dynamicSplitDirection: configService.isFeatureEnabled('dynamicSplitDirection'),
      panelLocation: configService.get('sidebarTerminal', 'panelLocation', 'auto'),
    };
  }
  /**
   * Get current font settings from VS Code configuration
   * Uses UnifiedConfigurationService for consistency with other settings sources
   */
  _getCurrentFontSettings() {
    const configService = (0, UnifiedConfigurationService_1.getUnifiedConfigurationService)();
    return configService.getWebViewFontSettings();
  }
  /**
   * Clean up resources
   */
  dispose() {
    // Clear config change debounce timer to prevent leak
    if (this._configChangeDebounceTimer) {
      clearTimeout(this._configChangeDebounceTimer);
      this._configChangeDebounceTimer = null;
    }
    this.clearTerminalEventListeners();
    this._disposables.dispose();
    (0, logger_1.provider)('🧹 [EVENT-COORDINATOR] Disposed');
  }
}
exports.TerminalEventCoordinator = TerminalEventCoordinator;
//# sourceMappingURL=TerminalEventCoordinator.js.map
