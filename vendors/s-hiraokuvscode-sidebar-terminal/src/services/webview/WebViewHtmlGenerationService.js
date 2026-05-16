"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebViewHtmlGenerationService = void 0;
const vscode = require("vscode");
const logger_1 = require("../../utils/logger");
const common_1 = require("../../utils/common");
/**
 * Service responsible for generating WebView HTML content
 *
 * This service extracts HTML generation logic from SecondaryTerminalProvider to improve:
 * - Single Responsibility: Focus only on HTML generation and CSP management
 * - Testability: Isolated HTML generation logic with configurable options
 * - Reusability: Can be used by multiple providers or components
 * - Security: Centralized CSP management and nonce generation
 * - Maintainability: All HTML/CSS logic in one place for easy updates
 */
class WebViewHtmlGenerationService {
    /**
     * Generate the main WebView HTML content
     */
    generateMainHtml(options) {
        try {
            (0, logger_1.provider)('🎨 [HtmlGeneration] Generating main WebView HTML');
            const { webview, extensionUri } = options;
            // Generate script URIs
            const scriptUris = this._generateScriptUris(webview, extensionUri);
            // Generate nonce for CSP
            const nonce = (0, common_1.generateNonce)();
            // Generate CSP header
            const csp = this._generateCSPHeader(webview, nonce);
            // Generate styles
            const styles = this._generateMainStyles(options);
            // Generate body content
            const bodyContent = this._generateBodyContent();
            // Generate inline scripts
            const inlineScripts = this._generateInlineScripts(nonce);
            // Generate main script tags
            const scriptTags = this._generateScriptTags(nonce, scriptUris);
            const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${csp}
    <!-- XTerm CSS is now bundled in webview.js -->
    <style>
        ${styles}
    </style>
</head>
<body>
    ${bodyContent}
    ${inlineScripts}
    ${scriptTags}
</body>
</html>`;
            (0, logger_1.provider)(`✅ [HtmlGeneration] Main HTML generated successfully (${html.length} chars)`);
            return html;
        }
        catch (error) {
            (0, logger_1.provider)('❌ [HtmlGeneration] Failed to generate main HTML:', error);
            throw new Error(`HTML generation failed: ${String(error)}`);
        }
    }
    /**
     * Generate fallback HTML for loading states or initialization failures
     */
    generateFallbackHtml(options = {}) {
        const { title = 'Terminal Loading...', message = 'Please wait while the terminal initializes.', isLoading = true, } = options;
        const loadingIndicator = isLoading ? '🔄' : '⚠️';
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        ${this._generateFallbackStyles()}
    </style>
</head>
<body>
    <div class="fallback-container">
        <h3>${loadingIndicator} ${title}</h3>
        <p>${message}</p>
        ${isLoading ? '<div class="spinner"></div>' : ''}
    </div>
</body>
</html>`;
    }
    /**
     * Generate error HTML for critical failures
     */
    generateErrorHtml(options) {
        const { error, allowRetry = false, customMessage } = options;
        const errorMessage = error instanceof Error ? error.message : String(error);
        const displayMessage = customMessage || `Terminal initialization failed: ${errorMessage}`;
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terminal Error</title>
    <style>
        ${this._generateErrorStyles()}
    </style>
</head>
<body>
    <div class="error-container">
        <h3>❌ Terminal Error</h3>
        <p class="error-message">${displayMessage}</p>
        ${allowRetry ? '<button onclick="window.location.reload()" class="retry-btn">Try Again</button>' : ''}
        <details class="error-details">
            <summary>Error Details</summary>
            <pre>${errorMessage}</pre>
        </details>
    </div>
</body>
</html>`;
    }
    /**
     * Validate HTML content before setting on WebView
     */
    validateHtml(html) {
        const errors = [];
        if (!html || html.trim().length === 0) {
            errors.push('HTML content is empty');
        }
        if (!html.includes('<!DOCTYPE html>')) {
            errors.push('Missing DOCTYPE declaration');
        }
        if (!html.includes('<meta charset="UTF-8">')) {
            errors.push('Missing charset declaration');
        }
        if (!html.includes('Content-Security-Policy')) {
            errors.push('Missing Content Security Policy');
        }
        if (!html.includes('nonce=')) {
            errors.push('Missing nonce for CSP');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    /**
     * Generate script URI with error handling
     */
    _generateScriptUris(webview, extensionUri) {
        try {
            return [
                'vendors.js',
                'xterm-vendor.js',
                'webview-services.js',
                'webview-managers.js',
                'webview.js',
            ].map((fileName) => webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', fileName)));
        }
        catch (error) {
            (0, logger_1.provider)('❌ [HtmlGeneration] Failed to generate script URIs:', error);
            throw new Error(`Script URI generation failed: ${String(error)}`);
        }
    }
    /**
     * Generate Content Security Policy header
     */
    _generateCSPHeader(webview, nonce) {
        return `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' ${webview.cspSource}; font-src ${webview.cspSource};">`;
    }
    /**
     * Generate main CSS styles
     */
    _generateMainStyles(options) {
        const baseStyles = this._getBaseStyles();
        const terminalStyles = this._getTerminalStyles();
        const splitStyles = options.includeSplitStyles !== false ? this._getSplitStyles() : '';
        const cliAgentStyles = options.includeCliAgentStyles !== false ? this._getCliAgentStyles() : '';
        const customStyles = options.customStyles || '';
        const initialThemeStyles = this._getInitialThemeStyles(options.initialTheme);
        return `
        ${baseStyles}
        ${terminalStyles}
        ${splitStyles}
        ${cliAgentStyles}
        ${initialThemeStyles}
        ${customStyles}
    `;
    }
    /**
     * Generate initial theme CSS to prevent flash of wrong theme
     */
    _getInitialThemeStyles(theme) {
        if (theme === 'light') {
            return `
        /* Initial light theme - prevents flash of dark theme */
        body, html {
          background-color: #ffffff !important;
          color: #333333 !important;
        }
        #terminal-body {
          background: #ffffff !important;
        }
      `;
        }
        // For 'dark' or 'auto', use default (VS Code CSS variables handle this)
        return '';
    }
    /**
     * Generate base CSS styles
     */
    _getBaseStyles() {
        return `
        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        html, body {
            width: 100% !important;
            height: 100% !important;
            max-width: none !important; /* 🔧 CRITICAL FIX: No width limit */
            margin: 0 !important;
            padding: 0 !important;
        }

        body {
            width: 100% !important;
            max-width: none !important; /* 🔧 CRITICAL FIX: No width limit */
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: var(--vscode-editor-background, #1e1e1e);
            color: var(--vscode-foreground, #cccccc);
            font-family: var(--vscode-font-family, monospace);
            height: 100%;
            display: flex;
            flex-direction: column;
            gap: 0;
        }

        /* Screen reader only content */
        .sr-only {
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
        }

        /* Focus visible styles for keyboard navigation */
        *:focus-visible {
            outline: 2px solid var(--vscode-focusBorder, #007acc);
            outline-offset: 2px;
        }

        /* Skip to main content link */
        .skip-link {
            position: absolute;
            top: -40px;
            left: 0;
            background: var(--vscode-button-background, #0e639c);
            color: var(--vscode-button-foreground, #fff);
            padding: 8px;
            text-decoration: none;
            z-index: 10000;
        }

        .skip-link:focus {
            top: 0;
        }
    `;
    }
    /**
     * Generate terminal-specific CSS styles
     *
     * 🎯 SIMPLE DESIGN: Minimal base styles only.
     * All terminal container styles are in display-modes.css
     */
    _getTerminalStyles() {
        return `
        /* Terminal background color */
        #terminal-body {
            background: var(--vscode-terminal-background, #000);
        }

        /* Terminal scrollbar styling */
        .xterm-viewport::-webkit-scrollbar {
            width: 10px;
        }

        .xterm-viewport::-webkit-scrollbar-track {
            background: transparent;
        }

        .xterm-viewport::-webkit-scrollbar-thumb {
            background: var(--vscode-scrollbarSlider-background, rgba(121, 121, 121, 0.4));
            border-radius: 5px;
        }

        .xterm-viewport::-webkit-scrollbar-thumb:hover {
            background: var(--vscode-scrollbarSlider-hoverBackground, rgba(100, 100, 100, 0.7));
        }

        .xterm-viewport::-webkit-scrollbar-thumb:active {
            background: var(--vscode-scrollbarSlider-activeBackground, rgba(191, 191, 191, 0.4));
        }
    `;
    }
    /**
     * Generate split layout CSS styles
     *
     * 🎯 SIMPLE DESIGN: All split styles are in display-modes.css
     */
    _getSplitStyles() {
        return `/* Split styles defined in display-modes.css */`;
    }
    /**
     * Generate CLI Agent specific CSS styles
     */
    _getCliAgentStyles() {
        return `
        /* CLI Agent status indicators */
        .terminal-name {
            /* Color is set by inline style from UIManager/HeaderFactory */
            font-weight: normal;
        }

        /* CLI Agent indicator styles */
        .claude-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            line-height: 1;
        }

        .claude-indicator.claude-connected {
            color: #4CAF50;
            animation: blink 1.5s infinite;
        }

        .claude-indicator.claude-disconnected {
            color: #F44336;
        }

        @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0.3; }
            100% { opacity: 1; }
        }
    `;
    }
    /**
     * Generate fallback page styles
     */
    _generateFallbackStyles() {
        return `
        body {
            font-family: var(--vscode-font-family, monospace);
            background-color: var(--vscode-editor-background, #1e1e1e);
            color: var(--vscode-foreground, #cccccc);
            margin: 0;
            padding: 0;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .fallback-container {
            text-align: center;
            padding: 20px;
        }

        .fallback-container h3 {
            margin-bottom: 10px;
            color: var(--vscode-foreground, #cccccc);
        }

        .fallback-container p {
            margin-bottom: 20px;
            color: var(--vscode-descriptionForeground, #999);
        }

        .spinner {
            width: 24px;
            height: 24px;
            border: 2px solid var(--vscode-widget-border, #454545);
            border-top: 2px solid var(--vscode-focusBorder, #007acc);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    }
    /**
     * Generate error page styles
     */
    _generateErrorStyles() {
        return `
        body {
            font-family: var(--vscode-font-family, monospace);
            background-color: var(--vscode-editor-background, #1e1e1e);
            color: var(--vscode-foreground, #cccccc);
            margin: 0;
            padding: 20px;
            line-height: 1.5;
        }

        .error-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }

        .error-container h3 {
            color: var(--vscode-errorForeground, #f48771);
            margin-bottom: 15px;
        }

        .error-message {
            color: var(--vscode-foreground, #cccccc);
            margin-bottom: 20px;
            padding: 10px;
            background: var(--vscode-input-background, #3c3c3c);
            border-radius: 4px;
        }

        .retry-btn {
            background: var(--vscode-button-background, #0e639c);
            color: var(--vscode-button-foreground, #fff);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-bottom: 20px;
        }

        .retry-btn:hover {
            background: var(--vscode-button-hoverBackground, #1177bb);
        }

        .error-details {
            margin-top: 20px;
        }

        .error-details summary {
            cursor: pointer;
            color: var(--vscode-textLink-foreground, #4daafc);
            margin-bottom: 10px;
        }

        .error-details pre {
            background: var(--vscode-editor-background, #1e1e1e);
            border: 1px solid var(--vscode-widget-border, #454545);
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 12px;
            white-space: pre-wrap;
        }
    `;
    }
    /**
     * Generate body content
     */
    _generateBodyContent() {
        return `
        <div id="terminal-body" role="main" aria-label="Terminal workspace">
            <!-- Screen reader announcements -->
            <div role="status" aria-live="polite" aria-atomic="true" class="sr-only" id="sr-status"></div>
            <div role="alert" aria-live="assertive" aria-atomic="true" class="sr-only" id="sr-alert"></div>
            <!-- Terminal containers will be added here by JavaScript -->
        </div>
    `;
    }
    /**
     * Generate inline scripts for VS Code API initialization
     *
     * 🎯 NOTE: acquireVsCodeApi() is called in main.ts (webview.js) at top level
     * This inline script only monitors script loading - no API acquisition needed here
     */
    _generateInlineScripts(nonce) {
        return `
        <script nonce="${nonce}">
            // Script loading monitoring
            document.addEventListener('DOMContentLoaded', function() {
                const script = document.getElementById('webview-main-script');
                if (script) {
                    script.addEventListener('error', function(event) {
                        console.error('❌ webview.js failed to load', event);
                    });
                }
            });
        </script>
    `;
    }
    /**
     * Generate script tags for main webview script
     */
    _generateScriptTags(nonce, scriptUris) {
        return scriptUris
            .map((scriptUri, index) => {
            const id = index === scriptUris.length - 1 ? ' id="webview-main-script"' : '';
            return `        <script nonce="${nonce}" src="${scriptUri.toString()}"${id}></script>`;
        })
            .join('\n');
    }
    /**
     * Dispose of resources (for consistency with other services)
     */
    dispose() {
        // This service doesn't hold resources, but included for interface consistency
        (0, logger_1.provider)('🧹 [HtmlGeneration] HTML generation service disposed');
    }
}
exports.WebViewHtmlGenerationService = WebViewHtmlGenerationService;
//# sourceMappingURL=WebViewHtmlGenerationService.js.map