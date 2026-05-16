"use strict";
/**
 * WebView API Manager
 *
 * WebViewとVS Code間のAPI通信を管理
 * 責務：VS Code API初期化、メッセージ送信、状態管理
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.webViewApiManager = exports.WebViewApiManager = void 0;
const logger_1 = require("../../utils/logger");
/**
 * WebView API管理クラス
 * VS Code APIとの通信を一元管理
 */
class WebViewApiManager {
    constructor() {
        this.vscodeApi = null;
        this.isInitialized = false;
        this.initializeApi();
    }
    /**
     * VS Code APIの初期化
     */
    initializeApi() {
        try {
            // すでに初期化済みの場合はスキップ
            if (this.vscodeApi) {
                (0, logger_1.webview)('✅ VS Code API already initialized');
                return;
            }
            // windowオブジェクトからAPIを取得
            const windowWithApi = window;
            if (windowWithApi.vscodeApi) {
                this.vscodeApi = windowWithApi.vscodeApi;
                this.isInitialized = true;
                (0, logger_1.webview)('✅ VS Code API initialized successfully');
            }
            else {
                // グローバルオブジェクトからの取得を試行
                const globalApi = window.acquireVsCodeApi?.();
                if (globalApi) {
                    this.vscodeApi = globalApi;
                    this.isInitialized = true;
                    (0, logger_1.webview)('✅ VS Code API acquired from global object');
                }
                else {
                    (0, logger_1.webview)('❌ ERROR: No VS Code API available');
                }
            }
        }
        catch (error) {
            (0, logger_1.webview)('❌ ERROR: Failed to initialize VS Code API:', error);
        }
    }
    /**
     * VS Code APIが利用可能かチェック
     */
    isApiAvailable() {
        return this.vscodeApi !== null && this.isInitialized;
    }
    /**
     * VS Code APIを取得（安全なアクセス）
     */
    getApi() {
        if (!this.isApiAvailable()) {
            this.initializeApi(); // 再初期化を試行
        }
        return this.vscodeApi;
    }
    /**
     * Extensionにメッセージを送信
     */
    postMessageToExtension(message) {
        try {
            // 🔍 DEBUG: Enhanced message sending tracking
            (0, logger_1.webview)('🔍 [DEBUG] WebViewApiManager.postMessageToExtension called with:', {
                message,
                messageType: typeof message,
                command: message?.command,
                hasApi: !!this.vscodeApi,
                isInitialized: this.isInitialized,
                timestamp: Date.now(),
            });
            const api = this.getApi();
            if (!api) {
                console.error('❌ [DEBUG] Cannot send message - No VS Code API available');
                (0, logger_1.webview)('❌ ERROR: Cannot send message - No VS Code API available');
                return false;
            }
            (0, logger_1.webview)('🔍 [DEBUG] About to call api.postMessage');
            api.postMessage(message);
            (0, logger_1.webview)('🔍 [DEBUG] api.postMessage called successfully');
            (0, logger_1.webview)(`📤 Message sent to extension: ${message?.command || 'unknown'}`);
            return true;
        }
        catch (error) {
            (0, logger_1.webview)('❌ ERROR: Failed to send message to extension:', error);
            return false;
        }
    }
    /**
     * WebView状態を保存
     */
    saveState(state) {
        try {
            const api = this.getApi();
            if (!api) {
                (0, logger_1.webview)('❌ ERROR: Cannot save state - No VS Code API available');
                return false;
            }
            api.setState(state);
            (0, logger_1.webview)('💾 WebView state saved');
            return true;
        }
        catch (error) {
            (0, logger_1.webview)('❌ ERROR: Failed to save WebView state:', error);
            return false;
        }
    }
    /**
     * WebView状態を読み込み
     */
    loadState() {
        try {
            const api = this.getApi();
            if (!api) {
                (0, logger_1.webview)('❌ ERROR: Cannot load state - No VS Code API available');
                return null;
            }
            const state = api.getState();
            (0, logger_1.webview)('📂 WebView state loaded');
            return state;
        }
        catch (error) {
            (0, logger_1.webview)('❌ ERROR: Failed to load WebView state:', error);
            return null;
        }
    }
    /**
     * API接続状態の診断情報
     */
    getDiagnostics() {
        return {
            isInitialized: this.isInitialized,
            isApiAvailable: this.isApiAvailable(),
            apiMethods: this.vscodeApi ? Object.keys(this.vscodeApi) : [],
        };
    }
    /**
     * リソースのクリーンアップ
     */
    dispose() {
        (0, logger_1.webview)('🧹 Disposing WebViewApiManager...');
        this.vscodeApi = null;
        this.isInitialized = false;
        (0, logger_1.webview)('✅ WebViewApiManager disposed');
    }
}
exports.WebViewApiManager = WebViewApiManager;
/**
 * シングルトンインスタンス
 * WebView全体で共有するAPI管理インスタンス
 */
exports.webViewApiManager = new WebViewApiManager();
//# sourceMappingURL=WebViewApiManager.js.map