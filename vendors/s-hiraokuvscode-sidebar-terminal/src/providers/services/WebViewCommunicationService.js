"use strict";
/**
 * WebView Communication Service
 *
 * Handles message sending to WebView with error handling
 * Extracted from SecondaryTerminalProvider for better separation of concerns
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebViewCommunicationService = void 0;
const vscode = require("vscode");
const logger_1 = require("../../utils/logger");
const feedback_1 = require("../../utils/feedback");
/**
 * WebView Communication Service
 *
 * Responsibilities:
 * - Message sending to WebView
 * - Error handling for disposed WebViews
 * - Message logging and debugging
 */
class WebViewCommunicationService {
    constructor() {
        // Queue messages until the WebView is ready (prevents lost messages during activation)
        this._pendingMessages = [];
    }
    /**
     * Set the WebView view
     */
    setView(view) {
        this._view = view;
        // Flush any messages queued while the view was unavailable
        if (this._view && this._pendingMessages.length > 0) {
            const toFlush = [...this._pendingMessages];
            this._pendingMessages = [];
            toFlush.forEach((message) => {
                void this._sendMessageDirect(message);
            });
        }
    }
    /**
     * Get the current WebView view
     */
    getView() {
        return this._view;
    }
    /**
     * Check if WebView is available
     */
    isViewAvailable() {
        return this._view !== undefined;
    }
    /**
     * Send message to WebView
     *
     * Public API for external components (e.g., StandardTerminalSessionManager)
     */
    async sendMessageToWebview(message) {
        (0, logger_1.provider)(`📤 [COMMUNICATION] Public sendMessageToWebview called: ${message.command}`);
        await this.sendMessage(message);
    }
    /**
     * Send message to WebView (internal method)
     */
    async sendMessage(message) {
        if (!this._view) {
            (0, logger_1.provider)('⚠️ [COMMUNICATION] No webview available to send message, queueing');
            this._pendingMessages.push(message);
            return;
        }
        await this._sendMessageDirect(message);
    }
    /**
     * Send message directly to WebView
     */
    async _sendMessageDirect(message) {
        if (!this._view) {
            (0, logger_1.provider)('⚠️ [COMMUNICATION] No webview available to send message');
            return;
        }
        try {
            await this._view.webview.postMessage(message);
            (0, logger_1.provider)(`📤 [COMMUNICATION] Sent message: ${message.command}`);
        }
        catch (error) {
            // Handle disposed WebView gracefully
            if (error instanceof Error &&
                (error.message.includes('disposed') || error.message.includes('Webview is disposed'))) {
                (0, logger_1.provider)('⚠️ [COMMUNICATION] Webview disposed during message send');
                return;
            }
            (0, logger_1.provider)('❌ [COMMUNICATION] Failed to send message to webview:', error);
            feedback_1.TerminalErrorHandler.handleWebviewError(error);
        }
    }
    /**
     * Send version information to WebView
     */
    async sendVersionInfo() {
        try {
            const extension = vscode.extensions.getExtension('s-hiraoku.vscode-sidebar-terminal');
            const version = extension?.packageJSON?.version || 'unknown';
            const formattedVersion = version === 'unknown' ? version : `v${version}`;
            if (this._view) {
                await this._view.webview.postMessage({
                    command: 'versionInfo',
                    version: formattedVersion,
                });
                (0, logger_1.provider)(`📤 [COMMUNICATION] Sent version info to WebView: ${formattedVersion}`);
            }
        }
        catch (error) {
            (0, logger_1.provider)('❌ [COMMUNICATION] Error sending version info:', error);
        }
    }
    /**
     * Send settings to WebView
     */
    async sendSettings(settings, fontSettings) {
        if (!this._view) {
            (0, logger_1.provider)('⚠️ [COMMUNICATION] Cannot send settings - no view available');
            return;
        }
        try {
            await this._view.webview.postMessage({
                command: 'updateSettings',
                settings,
                fontSettings,
            });
            (0, logger_1.provider)('📤 [COMMUNICATION] Settings sent to WebView');
        }
        catch (error) {
            (0, logger_1.provider)('❌ [COMMUNICATION] Failed to send settings to WebView:', error);
        }
    }
    /**
     * Send initialization complete message
     */
    async sendInitializationComplete(terminalCount) {
        try {
            await this.sendMessage({
                command: 'initializationComplete',
                terminalCount,
            });
            (0, logger_1.provider)(`📤 [COMMUNICATION] Sent initialization complete (${terminalCount} terminals)`);
        }
        catch (error) {
            (0, logger_1.provider)('❌ [COMMUNICATION] Failed to send initialization complete:', error);
        }
    }
    /**
     * Request panel location detection
     */
    async requestPanelLocationDetection() {
        try {
            await this.sendMessage({
                command: 'requestPanelLocationDetection',
            });
            (0, logger_1.provider)('📤 [COMMUNICATION] Requested panel location detection from WebView');
        }
        catch (error) {
            (0, logger_1.provider)('❌ [COMMUNICATION] Failed to request panel location detection:', error);
        }
    }
    /**
     * Clear the view reference
     */
    clearView() {
        this._view = undefined;
    }
}
exports.WebViewCommunicationService = WebViewCommunicationService;
//# sourceMappingURL=WebViewCommunicationService.js.map