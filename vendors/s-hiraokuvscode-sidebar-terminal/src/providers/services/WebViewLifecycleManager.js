"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebViewLifecycleManager = void 0;
const logger_1 = require("../../utils/logger");
const feedback_1 = require("../../utils/feedback");
/**
 * WebViewLifecycleManager
 *
 * Manages the complete lifecycle of the WebView including initialization,
 * configuration, HTML generation, visibility handling, and performance tracking.
 *
 * Responsibilities:
 * - Configure WebView options and permissions
 * - Generate and set WebView HTML content
 * - Track WebView visibility state
 * - Monitor performance metrics
 * - Handle errors gracefully with fallback HTML
 * - Manage view reference and state flags
 *
 * Part of Issue #214 refactoring to apply Facade pattern
 */
class WebViewLifecycleManager {
    constructor(_extensionContext, _htmlGenerationService) {
        this._extensionContext = _extensionContext;
        this._htmlGenerationService = _htmlGenerationService;
        this._htmlSet = false;
        this._bodyRendered = false;
        this._messageListenerRegistered = false;
        /**
         * Performance metrics tracking
         */
        this._performanceMetrics = {
            resolveWebviewViewCallCount: 0,
            htmlSetOperations: 0,
            listenerRegistrations: 0,
            lastPanelMovementTime: 0,
            totalInitializationTime: 0,
        };
    }
    /**
     * Get the current WebView instance
     */
    getView() {
        return this._view;
    }
    /**
     * Set the WebView instance
     */
    setView(view) {
        this._view = view;
    }
    /**
     * Check if body has been rendered (VS Code ViewPane pattern)
     */
    isBodyRendered() {
        return this._bodyRendered;
    }
    /**
     * Set body rendered flag
     */
    setBodyRendered(rendered) {
        this._bodyRendered = rendered;
    }
    /**
     * Check if WebView is available
     */
    isWebviewAvailable() {
        return !!(this._view && this._view.webview);
    }
    /**
     * Check if message listener is registered
     */
    isMessageListenerRegistered() {
        return this._messageListenerRegistered;
    }
    /**
     * Mark message listener as registered
     */
    setMessageListenerRegistered(registered) {
        this._messageListenerRegistered = registered;
    }
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return { ...this._performanceMetrics };
    }
    /**
     * Increment resolve call count and return start time for performance tracking
     */
    trackResolveStart() {
        this._performanceMetrics.resolveWebviewViewCallCount++;
        return Date.now();
    }
    /**
     * Track panel movement time
     */
    trackPanelMovement(startTime) {
        this._performanceMetrics.lastPanelMovementTime = Date.now() - startTime;
        (0, logger_1.provider)(`📊 [METRICS] Panel movement time: ${this._performanceMetrics.lastPanelMovementTime}ms (target: <200ms)`);
    }
    /**
     * Track total initialization time
     */
    trackInitializationComplete(startTime) {
        this._performanceMetrics.totalInitializationTime = Date.now() - startTime;
        (0, logger_1.provider)(`📊 [METRICS] Total initialization time: ${this._performanceMetrics.totalInitializationTime}ms (target: <100ms)`);
    }
    /**
     * Increment listener registration count
     */
    trackListenerRegistration() {
        this._performanceMetrics.listenerRegistrations++;
        (0, logger_1.provider)(`📊 [METRICS] Listener registration #${this._performanceMetrics.listenerRegistrations} (target: 1)`);
    }
    /**
     * Configure WebView options (enable scripts, set resource roots)
     */
    configureWebview(webviewView) {
        try {
            (0, logger_1.provider)('🔧 [LIFECYCLE] Configuring WebView options...');
            webviewView.webview.options = {
                enableScripts: true,
                localResourceRoots: [this._extensionContext.extensionUri],
            };
            (0, logger_1.provider)('✅ [LIFECYCLE] WebView options configured successfully');
        }
        catch (error) {
            (0, logger_1.provider)('❌ [LIFECYCLE] Failed to configure WebView options:', error);
            throw error;
        }
    }
    /**
     * Set WebView HTML content
     *
     * @param webviewView The WebView to set HTML for
     * @param htmlContent The HTML content to set
     * @param isPanelMove Whether this is a panel movement operation
     */
    setWebviewHtml(webviewView, htmlContent, isPanelMove = false) {
        try {
            (0, logger_1.provider)('🎆 [LIFECYCLE] Setting WebView HTML...');
            (0, logger_1.provider)('🎆 [LIFECYCLE] isPanelMove:', isPanelMove);
            (0, logger_1.provider)('🎆 [LIFECYCLE] HTML length:', htmlContent.length);
            if (!htmlContent || htmlContent.length === 0) {
                throw new Error('Generated HTML is empty');
            }
            // Use actual HTML content
            webviewView.webview.html = htmlContent;
            this._htmlSet = true;
            this._performanceMetrics.htmlSetOperations++;
            (0, logger_1.provider)('✅ [LIFECYCLE] HTML set successfully');
            (0, logger_1.provider)('🎆 [LIFECYCLE] WebView HTML length after setting:', webviewView.webview.html.length);
        }
        catch (error) {
            (0, logger_1.provider)('❌ [LIFECYCLE] Failed to set WebView HTML:', error);
            // Set fallback HTML to prevent complete failure
            const fallbackHtml = this.generateFallbackHtml();
            webviewView.webview.html = fallbackHtml;
            (0, logger_1.provider)('🔄 [LIFECYCLE] Fallback HTML set');
            throw error;
        }
    }
    /**
     * Register visibility listener for WebView
     *
     * @param webviewView The WebView to monitor
     * @param onVisible Callback when WebView becomes visible
     * @param onHidden Callback when WebView becomes hidden
     */
    registerVisibilityListener(webviewView, onVisible, onHidden) {
        (0, logger_1.provider)('🔧 [LIFECYCLE] Setting up visibility listener...');
        this._onVisibleCallback = onVisible;
        this._onHiddenCallback = onHidden;
        const disposable = webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                (0, logger_1.provider)('👁️ [LIFECYCLE] WebView became visible');
                this._onVisibleCallback?.();
            }
            else {
                (0, logger_1.provider)('🙈 [LIFECYCLE] WebView became hidden');
                this._onHiddenCallback?.();
            }
        });
        (0, logger_1.provider)('✅ [LIFECYCLE] Visibility listener registered');
        return disposable;
    }
    /**
     * Handle WebView setup error gracefully
     */
    handleSetupError(webviewView, error) {
        try {
            (0, logger_1.provider)('🚨 [LIFECYCLE] Handling WebView setup error...');
            // Ensure we have some HTML set, even if it's just an error message
            const errorHtml = this.generateErrorHtml(error);
            webviewView.webview.html = errorHtml;
            // Report error through standard channels
            feedback_1.TerminalErrorHandler.handleWebviewError(error);
            (0, logger_1.provider)('🔄 [LIFECYCLE] Error HTML set as fallback');
        }
        catch (fallbackError) {
            (0, logger_1.provider)('💥 [LIFECYCLE] Failed to handle WebView setup error:', fallbackError);
            // Last resort: set minimal HTML
            webviewView.webview.html =
                '<html><body><h3>Terminal initialization failed</h3></body></html>';
        }
    }
    /**
     * Generate fallback HTML when main HTML generation fails
     */
    generateFallbackHtml() {
        return this._htmlGenerationService.generateFallbackHtml({
            title: 'Terminal Loading...',
            message: 'Please wait while the terminal initializes.',
            isLoading: true,
        });
    }
    /**
     * Generate error HTML when setup fails
     */
    generateErrorHtml(error) {
        return this._htmlGenerationService.generateErrorHtml({
            error,
            allowRetry: true,
            customMessage: 'Terminal initialization failed. Please try reloading the terminal view or restarting VS Code.',
        });
    }
    /**
     * Reset state for new view (panel movement or recreation)
     */
    resetForNewView() {
        this._htmlSet = false;
        // Note: _bodyRendered and _messageListenerRegistered are intentionally NOT reset
        // to prevent duplicate initialization during panel movements
    }
    /**
     * Log performance metrics
     */
    logPerformanceMetrics() {
        (0, logger_1.provider)('📊 [METRICS] === WebView Lifecycle Performance Metrics ===');
        (0, logger_1.provider)(`📊 [METRICS] resolveWebviewView calls: ${this._performanceMetrics.resolveWebviewViewCallCount}`);
        (0, logger_1.provider)(`📊 [METRICS] HTML set operations: ${this._performanceMetrics.htmlSetOperations} (target: 1)`);
        (0, logger_1.provider)(`📊 [METRICS] Listener registrations: ${this._performanceMetrics.listenerRegistrations} (target: 1)`);
        (0, logger_1.provider)(`📊 [METRICS] Last panel movement time: ${this._performanceMetrics.lastPanelMovementTime}ms (target: <200ms)`);
        (0, logger_1.provider)(`📊 [METRICS] Total initialization time: ${this._performanceMetrics.totalInitializationTime}ms (target: <100ms)`);
        // Check if targets are met
        const meetsHtmlSetTarget = this._performanceMetrics.htmlSetOperations === 1;
        const meetsListenerTarget = this._performanceMetrics.listenerRegistrations === 1;
        const meetsPanelMovementTarget = this._performanceMetrics.lastPanelMovementTime < 200;
        const meetsInitializationTarget = this._performanceMetrics.totalInitializationTime < 100;
        (0, logger_1.provider)(`📊 [METRICS] HTML set target met: ${meetsHtmlSetTarget ? '✅' : '❌'}`);
        (0, logger_1.provider)(`📊 [METRICS] Listener target met: ${meetsListenerTarget ? '✅' : '❌'}`);
        (0, logger_1.provider)(`📊 [METRICS] Panel movement target met: ${meetsPanelMovementTarget ? '✅' : '❌'}`);
        (0, logger_1.provider)(`📊 [METRICS] Initialization target met: ${meetsInitializationTarget ? '✅' : '❌'}`);
    }
    /**
     * Dispose of resources
     */
    dispose() {
        (0, logger_1.provider)('🔧 [LIFECYCLE] WebViewLifecycleManager disposing...');
        // Clear callbacks
        this._onVisibleCallback = undefined;
        this._onHiddenCallback = undefined;
        // Clear view reference
        this._view = undefined;
        // Reset flags
        this._htmlSet = false;
        this._bodyRendered = false;
        this._messageListenerRegistered = false;
        (0, logger_1.provider)('✅ [LIFECYCLE] WebViewLifecycleManager disposed');
    }
}
exports.WebViewLifecycleManager = WebViewLifecycleManager;
//# sourceMappingURL=WebViewLifecycleManager.js.map