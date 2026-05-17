'use strict';
/**
 * Extension Message Bridge
 *
 * Handles message communication on the Extension side.
 * Implements IExtensionCommunicationBridge for Extension-to-WebView communication.
 *
 * @see Issue #223 - Phase 3: Message Handling Separation
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.ExtensionMessageBridge = void 0;
/**
 * Extension-side message bridge
 * Manages communication between Extension and WebView
 */
class ExtensionMessageBridge {
  constructor(context) {
    this.context = context;
    this.handlers = new Map();
    this._isReady = false;
  }
  /**
   * Set the WebView for communication
   */
  setWebView(webviewView) {
    this._webviewView = webviewView;
    this._isReady = true;
  }
  /**
   * Send a message to WebView
   */
  sendMessage(message) {
    this.sendToWebView(message);
  }
  /**
   * Send message to WebView
   */
  sendToWebView(message) {
    if (!this._webviewView || !this._isReady) {
      console.warn('WebView not ready, message not sent:', message.command);
      return;
    }
    try {
      this._webviewView.webview.postMessage(message);
    } catch (error) {
      console.error('Failed to send message to WebView:', error);
    }
  }
  /**
   * Handle message from WebView
   */
  async handleFromWebView(message) {
    return await this.processMessage(message);
  }
  /**
   * Process an incoming message
   */
  async processMessage(message) {
    const startTime = Date.now();
    try {
      const handler = this.handlers.get(message.command);
      if (!handler) {
        return {
          success: false,
          error: `No handler registered for command: ${message.command}`,
          processingTime: Date.now() - startTime,
        };
      }
      const result = await handler(message);
      return {
        ...result,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      };
    }
  }
  /**
   * Register a message handler
   */
  registerHandler(command, handler) {
    if (this.handlers.has(command)) {
      // Only warn in development mode
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Handler for command '${command}' already registered, overwriting`);
      }
    }
    this.handlers.set(command, handler);
  }
  /**
   * Unregister a message handler
   */
  unregisterHandler(command) {
    this.handlers.delete(command);
  }
  /**
   * Check if the bridge is ready
   */
  isReady() {
    return this._isReady && this._webviewView !== undefined;
  }
  /**
   * Initialize the bridge
   */
  async initialize() {
    this._isReady = false;
    // Initialization logic
  }
  /**
   * Dispose of the bridge
   */
  dispose() {
    this.handlers.clear();
    this._webviewView = undefined;
    this._isReady = false;
  }
  /**
   * Get registered handlers count
   */
  getHandlerCount() {
    return this.handlers.size;
  }
  /**
   * Get registered commands
   */
  getRegisteredCommands() {
    return Array.from(this.handlers.keys());
  }
}
exports.ExtensionMessageBridge = ExtensionMessageBridge;
//# sourceMappingURL=ExtensionMessageBridge.js.map
