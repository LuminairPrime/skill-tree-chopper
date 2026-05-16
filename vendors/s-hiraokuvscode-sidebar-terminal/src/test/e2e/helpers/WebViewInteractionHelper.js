"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebViewInteractionHelper = void 0;
const test_constants_1 = require("../config/test-constants");
/**
 * Helper class for WebView interaction operations
 * Provides utilities for interacting with the terminal WebView UI
 */
class WebViewInteractionHelper {
    constructor(page) {
        this.page = page;
    }
    /**
     * Wait for WebView to be fully loaded
     * @param timeout - Maximum wait time
     */
    async waitForWebViewLoad(timeout = test_constants_1.TEST_TIMEOUTS.WEBVIEW_LOAD) {
        // Future: Wait for WebView iframe to load
        await this.page.waitForLoadState('networkidle', { timeout });
        console.log('[E2E] WebView loaded');
    }
    /**
     * Get WebView iframe element
     * @returns Locator for WebView iframe
     */
    getWebViewFrame() {
        // Future: Locate actual WebView iframe
        return this.page.locator('iframe.webview');
    }
    /**
     * Click an element in the WebView
     * @param selector - CSS selector for the element
     */
    async clickInWebView(selector) {
        const frame = this.getWebViewFrame();
        await frame.locator(selector).click();
    }
    /**
     * Type text into WebView terminal
     * @param text - Text to type
     */
    async typeInTerminal(text) {
        // Future: Type into terminal input
        console.log(`[E2E] Type in terminal: ${text}`);
    }
    /**
     * Perform Alt+Click at coordinates
     * @param x - X coordinate
     * @param y - Y coordinate
     */
    async altClick(x, y) {
        await this.page.keyboard.down('Alt');
        await this.page.mouse.click(x, y);
        await this.page.keyboard.up('Alt');
    }
    /**
     * Get terminal output text
     * @returns Terminal output content
     */
    async getTerminalOutput() {
        // Future: Extract terminal text content
        return '';
    }
    /**
     * Check if WebView is visible
     * @returns True if visible, false otherwise
     */
    async isWebViewVisible() {
        const frame = this.getWebViewFrame();
        return await frame.isVisible();
    }
    /**
     * Scroll WebView to position
     * @param scrollTop - Scroll position
     */
    async scrollTo(scrollTop) {
        // Future: Scroll WebView iframe
        await this.page.evaluate((top) => {
            window.scrollTo(0, top);
        }, scrollTop);
    }
    /**
     * Get WebView scroll position
     * @returns Current scroll position
     */
    async getScrollPosition() {
        return await this.page.evaluate(() => window.scrollY);
    }
    /**
     * Take screenshot of WebView
     * @param path - File path to save screenshot
     */
    async screenshot(path) {
        const frame = this.getWebViewFrame();
        await frame.screenshot({ path });
    }
}
exports.WebViewInteractionHelper = WebViewInteractionHelper;
//# sourceMappingURL=WebViewInteractionHelper.js.map