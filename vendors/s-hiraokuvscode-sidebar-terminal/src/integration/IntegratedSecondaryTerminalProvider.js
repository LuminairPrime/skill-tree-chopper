'use strict';
/**
 * Integrated SecondaryTerminalProvider
 *
 * This file demonstrates how to integrate the UnifiedTerminalPersistenceService
 * and PersistenceMessageHandler into the existing SecondaryTerminalProvider.
 *
 * Key improvements:
 * - Clean separation of concerns between terminal management and persistence
 * - Proper dependency injection for testability
 * - Standardized error handling patterns
 * - Simplified message routing with proper handler registration
 * - Resource lifecycle management
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.IntegratedSecondaryTerminalProvider = void 0;
const vscode = require('vscode');
const ExtensionPersistenceService_1 = require('../services/persistence/ExtensionPersistenceService');
const PersistenceMessageHandler_1 = require('../handlers/PersistenceMessageHandler');
const logger_1 = require('../utils/logger');
/**
 * Example of integrated SecondaryTerminalProvider using the new architecture
 *
 * Note: This is a demonstration class showing the integration patterns.
 * The actual SecondaryTerminalProvider should be updated following these patterns.
 */
class IntegratedSecondaryTerminalProvider {
  constructor(context, terminalManager) {
    this.context = context;
    // State management
    this.disposables = [];
    this.messageHandlers = new Map();
    this.isInitialized = false;
    // 🔧 FIX: Track pending timeouts for proper cleanup on dispose
    this.pendingTimeouts = new Set();
    this.terminalManager = terminalManager;
    // Initialize persistence service with proper dependency injection
    this.persistenceService = new ExtensionPersistenceService_1.ExtensionPersistenceService(
      this.context,
      this.terminalManager
    );
    // Initialize persistence message handler with clean separation
    this.persistenceMessageHandler = (0,
    PersistenceMessageHandler_1.createPersistenceMessageHandler)(this.persistenceService);
    this.initializeServices();
  }
  /**
   * VS Code WebviewViewProvider implementation
   */
  resolveWebviewView(webviewView, _context, _token) {
    this.view = webviewView;
    try {
      this.configureWebview(webviewView.webview);
      this.setupEventListeners(webviewView);
      this.completeInitialization();
    } catch (error) {
      (0, logger_1.log)(`❌ [PROVIDER] Failed to resolve webview: ${error}`);
      this.handleWebviewSetupError(error);
    }
  }
  /**
   * Initializes core services and sets up message handling
   */
  initializeServices() {
    try {
      // Initialize message handlers with proper separation
      this.initializeMessageHandlers();
      // Register persistence message handlers
      this.persistenceMessageHandler.registerMessageHandlers();
      // Set up configuration change listeners
      this.setupConfigurationListeners();
      (0, logger_1.log)('✅ [PROVIDER] Services initialized successfully');
    } catch (error) {
      (0, logger_1.log)(`❌ [PROVIDER] Failed to initialize services: ${error}`);
      throw error;
    }
  }
  /**
   * Initializes message handlers with clean separation of concerns
   */
  initializeMessageHandlers() {
    // Core terminal operations
    this.messageHandlers.set('webviewReady', (msg) => this.handleWebviewReady(msg));
    this.messageHandlers.set('createTerminal', (msg) => this.handleCreateTerminal(msg));
    this.messageHandlers.set('deleteTerminal', (msg) => this.handleDeleteTerminal(msg));
    this.messageHandlers.set('focusTerminal', (msg) => this.handleFocusTerminal(msg));
    this.messageHandlers.set('killTerminal', (msg) => this.handleKillTerminal(msg));
    // Settings and configuration
    this.messageHandlers.set('getSettings', (msg) => this.handleGetSettings(msg));
    this.messageHandlers.set('updateSettings', (msg) => this.handleUpdateSettings(msg));
    // Terminal I/O
    this.messageHandlers.set('input', (msg) => this.handleTerminalInput(msg));
    this.messageHandlers.set('resize', (msg) => this.handleTerminalResize(msg));
    // State management
    this.messageHandlers.set('stateUpdate', (msg) => this.handleStateUpdate(msg));
    this.messageHandlers.set('reportPanelLocation', (msg) => this.handleReportPanelLocation(msg));
    // Note: Persistence handlers are registered separately by PersistenceMessageHandler
    (0, logger_1.log)('✅ [PROVIDER] Core message handlers initialized');
  }
  /**
   * Handles incoming webview messages with improved error handling
   */
  async handleWebviewMessage(message) {
    (0, logger_1.log)(`📨 [PROVIDER] Handling message: ${message.command}`);
    try {
      // Check if it's a persistence-related message
      if (this.isPersistenceMessage(message)) {
        await this.persistenceMessageHandler.handlePersistenceMessage(message);
        return;
      }
      // Handle other messages through the registered handlers
      const handler = this.messageHandlers.get(message.command);
      if (handler) {
        await handler(message);
        return;
      }
      // Handle legacy or special cases
      await this.handleLegacyMessage(message);
    } catch (error) {
      (0, logger_1.log)(`❌ [PROVIDER] Error handling message ${message.command}: ${error}`);
      await this.sendErrorResponse(message, error);
    }
  }
  /**
   * Checks if a message is persistence-related
   */
  isPersistenceMessage(message) {
    const persistenceCommands = [
      'requestTerminalSerialization',
      'terminalSerializationResponse',
      'restoreTerminalSerialization',
      'terminalSerializationRestoreResponse',
      'requestSessionRestorationData',
      'sessionRestorationData',
      'terminalRestoreInfo',
    ];
    return persistenceCommands.includes(message.command);
  }
  /**
   * Sends messages to webview with proper error handling
   */
  async sendMessageToWebview(message) {
    if (!this.view?.webview) {
      throw new Error('Webview not available for message sending');
    }
    try {
      await this.view.webview.postMessage(message);
      (0, logger_1.log)(`📤 [PROVIDER] Message sent: ${message.command}`);
    } catch (error) {
      (0, logger_1.log)(`❌ [PROVIDER] Failed to send message ${message.command}: ${error}`);
      throw error;
    }
  }
  /**
   * Completes the initialization process after webview is ready
   */
  completeInitialization() {
    if (this.isInitialized) {
      return;
    }
    try {
      // Set up persistence service with webview communication
      this.persistenceService.setSidebarProvider({
        sendMessageToWebview: (message) => this.sendMessageToWebview(message),
      });
      // Set up terminal event listeners
      this.setupTerminalEventListeners();
      // Schedule initial terminal creation
      this.scheduleInitialSetup();
      this.isInitialized = true;
      (0, logger_1.log)('✅ [PROVIDER] Initialization completed');
    } catch (error) {
      (0, logger_1.log)(`❌ [PROVIDER] Failed to complete initialization: ${error}`);
      throw error;
    }
  }
  /**
   * Sets up terminal event listeners with proper cleanup
   */
  setupTerminalEventListeners() {
    // Terminal state changes
    const stateListener = this.terminalManager.onStateUpdate((state) => {
      this.sendMessageToWebview({
        command: 'stateUpdate',
        state,
        timestamp: Date.now(),
      }).catch((error) => {
        (0, logger_1.log)(`❌ [PROVIDER] Failed to send state update: ${error}`);
      });
    });
    // Terminal output
    const outputListener = this.terminalManager.onTerminalOutput((data) => {
      this.sendMessageToWebview({
        command: 'output',
        terminalId: data.terminalId,
        data: data.data,
        timestamp: Date.now(),
      }).catch((error) => {
        (0, logger_1.log)(`❌ [PROVIDER] Failed to send terminal output: ${error}`);
      });
    });
    // Store disposables for cleanup
    this.disposables.push(stateListener, outputListener);
  }
  /**
   * Sets up configuration change listeners
   */
  setupConfigurationListeners() {
    const configListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('secondaryTerminal')) {
        this.handleConfigurationChange().catch((error) => {
          (0, logger_1.log)(`❌ [PROVIDER] Failed to handle configuration change: ${error}`);
        });
      }
    });
    this.disposables.push(configListener);
  }
  /**
   * Helper: Schedule a timeout and track it for cleanup
   */
  scheduleTimeout(callback, delay) {
    const timeoutId = setTimeout(() => {
      this.pendingTimeouts.delete(timeoutId);
      callback();
    }, delay);
    this.pendingTimeouts.add(timeoutId);
    return timeoutId;
  }
  /**
   * Schedules initial setup operations
   */
  scheduleInitialSetup() {
    // 🔧 FIX: Schedule session restoration check with proper timeout tracking
    this.scheduleTimeout(async () => {
      try {
        await this.checkAndRestoreSession();
      } catch (error) {
        (0, logger_1.log)(`❌ [PROVIDER] Failed to restore session: ${error}`);
      }
    }, 1000); // Delay to allow webview to fully initialize
  }
  /**
   * Checks and restores previous session if available
   */
  async checkAndRestoreSession() {
    const sessionInfo = this.persistenceService.getSessionInfo();
    if (sessionInfo && sessionInfo.exists) {
      (0, logger_1.log)(
        `🔄 [PROVIDER] Previous session found: ${sessionInfo.terminals?.length} terminals`
      );
      // Send session info to webview
      // Send session info through the message handler instead
      await this.sendMessageToWebview({
        command: 'sessionRestored',
        data: sessionInfo,
      });
      // Attempt to restore session
      const restoreResult = await this.persistenceService.restoreSession();
      if (restoreResult.success) {
        (0, logger_1.log)(
          `✅ [PROVIDER] Session restored: ${restoreResult.restoredCount} terminals`
        );
      } else {
        (0, logger_1.log)(
          `⚠️ [PROVIDER] Session restore failed: ${restoreResult.error instanceof Error ? restoreResult.error.message : restoreResult.error}`
        );
      }
    } else {
      (0, logger_1.log)('📑 [PROVIDER] No previous session found');
    }
  }
  /**
   * Handles configuration changes
   */
  async handleConfigurationChange() {
    // Get current settings and send to webview
    const settings = await this.getCurrentSettings();
    await this.sendMessageToWebview({
      command: 'settingsResponse',
      settings,
      timestamp: Date.now(),
    });
  }
  /**
   * Disposes of the provider and cleans up resources
   */
  dispose() {
    try {
      // 🔧 FIX: Clear all pending timeouts to prevent memory leaks
      this.pendingTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
      this.pendingTimeouts.clear();
      // Dispose of all event listeners
      this.disposables.forEach((d) => d.dispose());
      this.disposables.length = 0;
      // Dispose of persistence service
      this.persistenceService.dispose();
      // Clear message handlers
      this.messageHandlers.clear();
      // Clear webview reference
      this.view = undefined;
      this.isInitialized = false;
      (0, logger_1.log)('✅ [PROVIDER] Disposed successfully');
    } catch (error) {
      (0, logger_1.log)(`❌ [PROVIDER] Error during disposal: ${error}`);
    }
  }
  // Example handler implementations (simplified for demonstration)
  async handleWebviewReady(_message) {
    (0, logger_1.log)('✅ [PROVIDER] Webview ready');
    await this.sendInitialData();
  }
  async handleCreateTerminal(_message) {
    const terminalId = this.terminalManager.createTerminal();
    if (terminalId) {
      await this.sendMessageToWebview({
        command: 'terminalCreated',
        terminalId,
        timestamp: Date.now(),
      });
    }
  }
  async handleDeleteTerminal(message) {
    if (message.terminalId) {
      const result = await this.terminalManager.deleteTerminal(message.terminalId);
      await this.sendMessageToWebview({
        command: 'deleteTerminalResponse',
        terminalId: message.terminalId,
        success: result.success,
        reason: result.reason,
        timestamp: Date.now(),
      });
    }
  }
  async handleFocusTerminal(message) {
    if (message.terminalId) {
      this.terminalManager.setActiveTerminal(message.terminalId);
    }
  }
  async handleKillTerminal(_message) {
    const activeTerminalId = this.terminalManager.getActiveTerminalId();
    if (activeTerminalId) {
      await this.terminalManager.deleteTerminal(activeTerminalId, { force: true });
    }
  }
  async handleGetSettings(_message) {
    const settings = await this.getCurrentSettings();
    await this.sendMessageToWebview({
      command: 'settingsResponse',
      settings,
      timestamp: Date.now(),
    });
  }
  async handleUpdateSettings(_message) {
    // Handle settings update
    (0, logger_1.log)('🔧 [PROVIDER] Settings updated');
  }
  async handleTerminalInput(message) {
    if (message.terminalId && message.data) {
      this.terminalManager.writeToTerminal(message.terminalId, String(message.data));
    }
  }
  async handleTerminalResize(message) {
    if (message.terminalId && message.cols && message.rows) {
      this.terminalManager.resizeTerminal(message.terminalId, message.cols, message.rows);
    }
  }
  async handleStateUpdate(_message) {
    // Handle state update from webview
    (0, logger_1.log)('🔄 [PROVIDER] State update received');
  }
  async handleReportPanelLocation(message) {
    (0, logger_1.log)(`📍 [PROVIDER] Panel location reported: ${message.location}`);
  }
  async handleLegacyMessage(message) {
    (0, logger_1.log)(`⚠️ [PROVIDER] Unhandled message: ${message.command}`);
  }
  async sendErrorResponse(message, error) {
    await this.sendMessageToWebview({
      command: 'error',
      type: 'handler',
      message: error instanceof Error ? error.message : String(error),
      context: `Command: ${message.command}`,
      terminalId: message.terminalId,
      timestamp: Date.now(),
    });
  }
  async sendInitialData() {
    const settings = await this.getCurrentSettings();
    await this.sendMessageToWebview({
      command: 'settingsResponse',
      settings,
      timestamp: Date.now(),
    });
  }
  async getCurrentSettings() {
    const config = vscode.workspace.getConfiguration('secondaryTerminal');
    return {
      // Return relevant settings
      enablePersistentSessions: config.get('enablePersistentSessions', true),
      fontFamily: config.get('fontFamily', 'Consolas, monospace'),
      fontSize: config.get('fontSize', 14),
    };
  }
  configureWebview(webview) {
    webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };
    webview.html = this.getHtmlForWebview(webview);
  }
  setupEventListeners(webviewView) {
    webviewView.webview.onDidReceiveMessage(
      (message) => this.handleWebviewMessage(message),
      undefined,
      this.disposables
    );
    webviewView.onDidDispose(() => this.dispose(), undefined, this.disposables);
  }
  getHtmlForWebview(_webview) {
    // Return webview HTML content
    return `<!DOCTYPE html><html><body>Terminal Webview</body></html>`;
  }
  handleWebviewSetupError(error) {
    (0, logger_1.log)(`❌ [PROVIDER] Webview setup error: ${error}`);
    // Handle setup errors appropriately
  }
}
exports.IntegratedSecondaryTerminalProvider = IntegratedSecondaryTerminalProvider;
IntegratedSecondaryTerminalProvider.viewType = 'secondaryTerminal';
//# sourceMappingURL=IntegratedSecondaryTerminalProvider.js.map
