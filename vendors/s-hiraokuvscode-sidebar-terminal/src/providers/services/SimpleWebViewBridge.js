'use strict';
/**
 * Simple WebView Bridge
 *
 * Simplified communication bridge between Extension and WebView.
 * Based on VS Code standard terminal patterns.
 *
 * Replaces complex handshake protocols with simple, reliable message flow:
 * 1. Extension waits for 'webviewReady'
 * 2. Extension sends 'extensionReady'
 * 3. Extension sends 'createTerminal' for each terminal
 * 4. WebView sends 'terminalReady' when terminal is created
 * 5. Extension sends 'output' messages
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.SimpleWebViewBridge = void 0;
const logger_1 = require('../../utils/logger');
/**
 * Simple WebView Bridge
 *
 * Responsibilities:
 * - Send messages to WebView
 * - Handle messages from WebView
 * - Track ready state
 * - No complex queuing or retry logic
 */
class SimpleWebViewBridge {
  constructor() {
    this._isWebViewReady = false;
    // Pending messages when WebView not ready (simple queue)
    this._pendingMessages = [];
    this.MAX_PENDING = 100;
    (0, logger_1.provider)('[SimpleWebViewBridge] Created');
  }
  /**
   * Set the WebView view and setup message handling
   */
  setView(view, callbacks) {
    (0, logger_1.provider)('[SimpleWebViewBridge] Setting view');
    this._view = view;
    this._callbacks = callbacks;
    this._isWebViewReady = false;
    // Dispose previous listener
    this._messageListener?.dispose();
    // Setup message listener
    this._messageListener = view.webview.onDidReceiveMessage((message) => {
      this.handleMessage(message);
    });
  }
  /**
   * Clear the view reference
   */
  clearView() {
    (0, logger_1.provider)('[SimpleWebViewBridge] Clearing view');
    this._messageListener?.dispose();
    this._messageListener = undefined;
    this._view = undefined;
    this._isWebViewReady = false;
    this._pendingMessages = [];
  }
  /**
   * Check if WebView is ready
   */
  isReady() {
    return this._isWebViewReady && this._view !== undefined;
  }
  // ============================================================================
  // Message Handlers
  // ============================================================================
  /**
   * Handle incoming messages from WebView
   */
  handleMessage(message) {
    if (!message || typeof message.command !== 'string') {
      (0, logger_1.provider)('[SimpleWebViewBridge] Invalid message received');
      return;
    }
    (0, logger_1.provider)(`[SimpleWebViewBridge] Received: ${message.command}`);
    switch (message.command) {
      case 'webviewReady':
        this.handleWebViewReady();
        break;
      case 'terminalReady':
        this._callbacks?.onTerminalReady({
          terminalId: message.terminalId,
          cols: message.cols,
          rows: message.rows,
        });
        break;
      case 'terminalCreationFailed':
        this._callbacks?.onTerminalCreationFailed(message.terminalId, message.error);
        break;
      case 'input':
        this._callbacks?.onInput(message.terminalId, message.data);
        break;
      case 'resize':
        this._callbacks?.onResize(message.terminalId, message.cols, message.rows);
        break;
      case 'deleteTerminal':
        this._callbacks?.onDeleteRequest(message.terminalId, message.source);
        break;
      case 'terminalFocused':
        this._callbacks?.onTerminalFocused(message.terminalId);
        break;
      case 'terminalBlurred':
        this._callbacks?.onTerminalBlurred(message.terminalId);
        break;
      case 'titleChange':
        this._callbacks?.onTitleChange?.(message.terminalId, message.title);
        break;
      default:
        (0, logger_1.provider)(`[SimpleWebViewBridge] Unknown command: ${message.command}`);
    }
  }
  /**
   * Handle WebView ready message
   */
  handleWebViewReady() {
    (0, logger_1.provider)('[SimpleWebViewBridge] WebView is ready');
    this._isWebViewReady = true;
    this._callbacks?.onWebViewReady();
    // Send extension ready
    this.sendExtensionReady();
    // Flush pending messages
    this.flushPendingMessages();
  }
  // ============================================================================
  // Send Methods
  // ============================================================================
  /**
   * Send extension ready message
   */
  sendExtensionReady() {
    this.sendMessage({
      command: 'extensionReady',
      timestamp: Date.now(),
    });
  }
  /**
   * Create terminal in WebView
   */
  createTerminal(terminalId, terminalName, terminalNumber, config, isActive = false) {
    this.sendMessage({
      command: 'createTerminal',
      terminalId,
      terminalName,
      terminalNumber,
      config,
      isActive,
      timestamp: Date.now(),
    });
  }
  /**
   * Remove terminal from WebView
   */
  removeTerminal(terminalId) {
    this.sendMessage({
      command: 'removeTerminal',
      terminalId,
      timestamp: Date.now(),
    });
  }
  /**
   * Send output to terminal
   */
  sendOutput(terminalId, data) {
    this.sendMessage({
      command: 'output',
      terminalId,
      data,
      timestamp: Date.now(),
    });
  }
  /**
   * Focus terminal
   */
  focusTerminal(terminalId) {
    this.sendMessage({
      command: 'focusTerminal',
      terminalId,
      timestamp: Date.now(),
    });
  }
  /**
   * Clear terminal
   */
  clearTerminal(terminalId) {
    this.sendMessage({
      command: 'clearTerminal',
      terminalId,
      timestamp: Date.now(),
    });
  }
  /**
   * Set active terminal
   */
  setActiveTerminal(terminalId) {
    this.sendMessage({
      command: 'setActiveTerminal',
      terminalId,
      timestamp: Date.now(),
    });
  }
  /**
   * Update theme
   */
  updateTheme(theme) {
    this.sendMessage({
      command: 'updateTheme',
      theme,
      timestamp: Date.now(),
    });
  }
  /**
   * Update font settings
   */
  updateFont(fontFamily, fontSize, lineHeight) {
    this.sendMessage({
      command: 'updateFont',
      fontFamily,
      fontSize,
      lineHeight,
      timestamp: Date.now(),
    });
  }
  // ============================================================================
  // Internal Methods
  // ============================================================================
  /**
   * Send message to WebView
   */
  sendMessage(message) {
    if (!this._view) {
      (0, logger_1.provider)('[SimpleWebViewBridge] No view available, queueing message');
      this.queueMessage(message);
      return;
    }
    if (!this._isWebViewReady && message.command !== 'extensionReady') {
      (0, logger_1.provider)('[SimpleWebViewBridge] WebView not ready, queueing message');
      this.queueMessage(message);
      return;
    }
    this.sendMessageDirect(message);
  }
  /**
   * Send message directly to WebView
   */
  async sendMessageDirect(message) {
    if (!this._view) return;
    try {
      await this._view.webview.postMessage(message);
      (0, logger_1.provider)(`[SimpleWebViewBridge] Sent: ${message.command}`);
    } catch (error) {
      // Handle disposed WebView gracefully
      if (error instanceof Error && error.message.includes('disposed')) {
        (0, logger_1.provider)('[SimpleWebViewBridge] WebView disposed');
        this._isWebViewReady = false;
        return;
      }
      (0, logger_1.provider)('[SimpleWebViewBridge] Failed to send message:', error);
    }
  }
  /**
   * Queue message for later sending
   */
  queueMessage(message) {
    if (this._pendingMessages.length >= this.MAX_PENDING) {
      // Drop oldest message
      this._pendingMessages.shift();
      (0, logger_1.provider)('[SimpleWebViewBridge] Queue full, dropping oldest message');
    }
    this._pendingMessages.push(message);
  }
  /**
   * Flush pending messages
   */
  flushPendingMessages() {
    if (this._pendingMessages.length === 0) return;
    (0, logger_1.provider)(
      `[SimpleWebViewBridge] Flushing ${this._pendingMessages.length} pending messages`
    );
    const messages = [...this._pendingMessages];
    this._pendingMessages = [];
    for (const message of messages) {
      this.sendMessageDirect(message);
    }
  }
  /**
   * Dispose resources
   */
  dispose() {
    (0, logger_1.provider)('[SimpleWebViewBridge] Disposing');
    this._messageListener?.dispose();
    this._messageListener = undefined;
    this._view = undefined;
    this._callbacks = undefined;
    this._isWebViewReady = false;
    this._pendingMessages = [];
  }
}
exports.SimpleWebViewBridge = SimpleWebViewBridge;
//# sourceMappingURL=SimpleWebViewBridge.js.map
