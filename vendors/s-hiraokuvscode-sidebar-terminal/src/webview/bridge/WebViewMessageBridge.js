"use strict";
/**
 * WebView Message Bridge
 *
 * Handles message communication on the WebView side.
 * Implements IWebViewCommunicationBridge for WebView-to-Extension communication.
 *
 * @see Issue #223 - Phase 3: Message Handling Separation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebViewMessageBridge = void 0;
/**
 * WebView-side message bridge
 * Manages communication between WebView and Extension
 */
class WebViewMessageBridge {
    constructor() {
        this.handlers = new Map();
        this._isReady = false;
        this._boundMessageHandler = null;
        this._vscodeApi = acquireVsCodeApi();
    }
    /**
     * Send a message to Extension
     */
    sendMessage(message) {
        this.sendToExtension(message);
    }
    /**
     * Send message to Extension
     */
    sendToExtension(message) {
        try {
            this._vscodeApi.postMessage(message);
        }
        catch (error) {
            console.error('Failed to send message to Extension:', error);
        }
    }
    /**
     * Handle message from Extension
     */
    async handleFromExtension(message) {
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
        }
        catch (error) {
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
            console.warn(`Handler for command '${command}' already registered, overwriting`);
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
        return this._isReady;
    }
    /**
     * Initialize the bridge
     */
    async initialize() {
        this._isReady = true;
        this.setupMessageListener();
    }
    /**
     * Dispose of the bridge
     */
    dispose() {
        if (this._boundMessageHandler) {
            window.removeEventListener('message', this._boundMessageHandler);
            this._boundMessageHandler = null;
        }
        this.handlers.clear();
        this._isReady = false;
    }
    /**
     * Setup message listener for incoming messages
     */
    setupMessageListener() {
        this._boundMessageHandler = async (event) => {
            const message = event.data;
            await this.handleFromExtension(message);
        };
        window.addEventListener('message', this._boundMessageHandler);
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
exports.WebViewMessageBridge = WebViewMessageBridge;
//# sourceMappingURL=WebViewMessageBridge.js.map