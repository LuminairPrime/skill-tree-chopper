'use strict';
/**
 * MessageHandlerRegistrar
 *
 * Builds and registers all WebView message handler definitions for the
 * MessageRoutingFacade. Extracted from SecondaryTerminalProvider._initializeMessageHandlers().
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.MessageHandlerRegistrar = void 0;
const vscode = require('vscode');
const constants_1 = require('../../constants');
const logger_1 = require('../../utils/logger');
/**
 * Critical handler commands that must be validated after registration
 */
const CRITICAL_HANDLERS = [
  'terminalInitializationComplete',
  'terminalReady',
  constants_1.TERMINAL_CONSTANTS?.COMMANDS?.READY,
  constants_1.TERMINAL_CONSTANTS?.COMMANDS?.RESIZE,
  constants_1.TERMINAL_CONSTANTS?.COMMANDS?.FOCUS_TERMINAL,
];
class MessageHandlerRegistrar {
  constructor(deps) {
    this.deps = deps;
  }
  /**
   * Build all handler definitions, register them on the router, and validate critical handlers.
   */
  registerAll(router) {
    router.reset();
    const handlers = this._buildHandlerDefinitions();
    router.registerHandlers(handlers);
    router.validateHandlers(CRITICAL_HANDLERS);
    router.logRegisteredHandlers();
    (0, logger_1.provider)('✅ [PROVIDER] Message handlers initialized via MessageRoutingFacade');
  }
  /**
   * Build the complete list of handler definitions.
   */
  _buildHandlerDefinitions() {
    return [
      ...this._buildUiHandlers(),
      ...this._buildSettingsHandlers(),
      ...this._buildTerminalHandlers(),
      ...this._buildPersistenceHandlers(),
      ...this._buildDebugHandlers(),
    ];
  }
  _buildUiHandlers() {
    return [
      {
        command: 'webviewReady',
        handler: (msg) => this.deps.handleWebviewReady(msg),
        category: 'ui',
      },
      {
        command: constants_1.TERMINAL_CONSTANTS?.COMMANDS?.READY,
        handler: (msg) => this.deps.handleWebviewReady(msg),
        category: 'ui',
      },
      {
        command: 'webviewInitialized',
        handler: (msg) => this.deps.handleWebviewInitialized(msg),
        category: 'ui',
      },
      {
        command: 'reportPanelLocation',
        handler: async (msg) => await this.deps.handleReportPanelLocation(msg),
        category: 'ui',
      },
    ];
  }
  _buildSettingsHandlers() {
    return [
      {
        command: 'getSettings',
        handler: async () => await this.deps.settingsMessageHandler.handleGetSettings(),
        category: 'settings',
      },
      {
        command: 'updateSettings',
        handler: async (msg) => await this.deps.settingsMessageHandler.handleUpdateSettings(msg),
        category: 'settings',
      },
    ];
  }
  _buildTerminalHandlers() {
    const tch = this.deps.terminalCommandHandlers;
    return [
      {
        command: 'focusTerminal',
        handler: async (msg) => await tch.handleFocusTerminal(msg),
        category: 'terminal',
      },
      {
        command: constants_1.TERMINAL_CONSTANTS?.COMMANDS?.FOCUS_TERMINAL,
        handler: async (msg) => await tch.handleFocusTerminal(msg),
        category: 'terminal',
      },
      {
        command: 'splitTerminal',
        handler: (msg) => tch.handleSplitTerminal(msg),
        category: 'terminal',
      },
      {
        command: 'createTerminal',
        handler: async (msg) => await tch.handleCreateTerminal(msg),
        category: 'terminal',
      },
      {
        command: constants_1.TERMINAL_CONSTANTS?.COMMANDS?.CREATE_TERMINAL,
        handler: async (msg) => await tch.handleCreateTerminal(msg),
        category: 'terminal',
      },
      {
        command: constants_1.TERMINAL_CONSTANTS?.COMMANDS?.INPUT,
        handler: (msg) => tch.handleTerminalInput(msg),
        category: 'terminal',
      },
      {
        command: constants_1.TERMINAL_CONSTANTS?.COMMANDS?.RESIZE,
        handler: (msg) => tch.handleTerminalResize(msg),
        category: 'terminal',
      },
      {
        command: 'getTerminalProfiles',
        handler: async () => await tch.handleGetTerminalProfiles(),
        category: 'terminal',
      },
      {
        command: 'killTerminal',
        handler: async (msg) => await tch.handleKillTerminal(msg),
        category: 'terminal',
      },
      {
        command: 'deleteTerminal',
        handler: async (msg) => await tch.handleDeleteTerminal(msg),
        category: 'terminal',
      },
      {
        command: 'terminalClosed',
        handler: async (msg) => await tch.handleTerminalClosed(msg),
        category: 'terminal',
      },
      {
        command: 'openTerminalLink',
        handler: async (msg) => await tch.handleOpenTerminalLink(msg),
        category: 'terminal',
      },
      {
        command: 'reorderTerminals',
        handler: async (msg) => await tch.handleReorderTerminals(msg),
        category: 'terminal',
      },
      {
        command: 'renameTerminal',
        handler: async (msg) => await tch.handleRenameTerminal(msg),
        category: 'terminal',
      },
      {
        command: 'updateTerminalHeader',
        handler: async (msg) => await tch.handleUpdateTerminalHeader(msg),
        category: 'terminal',
      },
      {
        command: 'requestInitialTerminal',
        handler: async (msg) => await tch.handleRequestInitialTerminal(msg),
        category: 'terminal',
      },
      {
        command: 'terminalInteraction',
        handler: async (msg) => await tch.handleTerminalInteraction(msg),
        category: 'terminal',
      },
      {
        command: 'terminalFocused',
        handler: async (msg) => {
          (0, logger_1.provider)(`🎯 [PROVIDER] Terminal focused: ${msg.terminalId}`);
          await vscode.commands.executeCommand('setContext', 'secondaryTerminalFocus', true);
          this.deps.onTerminalFocusChanged?.(true);
        },
        category: 'terminal',
      },
      {
        command: 'terminalBlurred',
        handler: async (msg) => {
          (0, logger_1.provider)(`🎯 [PROVIDER] Terminal blurred: ${msg.terminalId}`);
          await vscode.commands.executeCommand('setContext', 'secondaryTerminalFocus', false);
          this.deps.onTerminalFocusChanged?.(false);
        },
        category: 'terminal',
      },
      {
        command: 'terminalInitializationComplete',
        handler: async (msg) => await this.deps.handleTerminalInitializationComplete(msg),
        category: 'terminal',
      },
      {
        command: 'terminalReady',
        handler: async (msg) => await this.deps.handleTerminalReady(msg),
        category: 'terminal',
      },
      {
        command: 'requestClipboardContent',
        handler: async (msg) => await tch.handleClipboardRequest(msg),
        category: 'terminal',
      },
      {
        command: 'copyToClipboard',
        handler: async (msg) => await tch.handleCopyToClipboard(msg),
        category: 'terminal',
      },
      {
        command: 'pasteImage',
        handler: async (msg) => await tch.handlePasteImage(msg),
        category: 'terminal',
      },
      {
        command: 'pasteText',
        handler: async (msg) => await tch.handlePasteText(msg),
        category: 'terminal',
      },
      {
        command: 'switchAiAgent',
        handler: async (msg) => await tch.handleSwitchAiAgent(msg),
        category: 'terminal',
      },
    ];
  }
  _buildPersistenceHandlers() {
    const sbh = this.deps.scrollbackMessageHandler;
    return [
      {
        command: 'persistenceSaveSession',
        handler: async (msg) => await this.deps.handlePersistenceMessage(msg),
        category: 'persistence',
      },
      {
        command: 'persistenceRestoreSession',
        handler: async (msg) => await this.deps.handlePersistenceMessage(msg),
        category: 'persistence',
      },
      {
        command: 'persistenceClearSession',
        handler: async (msg) => await this.deps.handlePersistenceMessage(msg),
        category: 'persistence',
      },
      {
        command: 'terminalSerializationRequest',
        handler: async (msg) => await this.deps.handleLegacyPersistenceMessage(msg),
        category: 'persistence',
      },
      {
        command: 'terminalSerializationRestoreRequest',
        handler: async (msg) => await this.deps.handleLegacyPersistenceMessage(msg),
        category: 'persistence',
      },
      {
        command: 'pushScrollbackData',
        handler: async (msg) => await sbh.handlePushScrollbackData(msg),
        category: 'persistence',
      },
      {
        command: 'scrollbackDataCollected',
        handler: async (msg) => await sbh.handleScrollbackDataCollected(msg),
        category: 'persistence',
      },
      {
        command: 'scrollbackExtracted',
        handler: async (msg) => await sbh.handleScrollbackDataCollected(msg),
        category: 'persistence',
      },
      {
        command: 'requestScrollbackRefresh',
        handler: async (msg) => await sbh.handleScrollbackRefreshRequest(msg),
        category: 'persistence',
      },
    ];
  }
  _buildDebugHandlers() {
    const dbg = this.deps.debugMessageHandler;
    return [
      {
        command: 'htmlScriptTest',
        handler: (msg) => dbg.handleHtmlScriptTest(msg),
        category: 'debug',
      },
      {
        command: 'timeoutTest',
        handler: (msg) => dbg.handleTimeoutTest(msg),
        category: 'debug',
      },
      {
        command: 'test',
        handler: (msg) => dbg.handleDebugTest(msg),
        category: 'debug',
      },
    ];
  }
}
exports.MessageHandlerRegistrar = MessageHandlerRegistrar;
//# sourceMappingURL=MessageHandlerRegistrar.js.map
