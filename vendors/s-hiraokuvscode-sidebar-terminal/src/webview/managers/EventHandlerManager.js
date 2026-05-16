"use strict";
/**
 * Event Handler Manager
 *
 * WebViewのイベント処理を管理
 * 責務：イベントリスナー登録・削除、イベント委譲、ライフサイクル管理
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventHandlerManager = void 0;
const logger_1 = require("../../utils/logger");
/**
 * イベント処理管理クラス
 * WebViewの全イベント処理を一元管理
 */
class EventHandlerManager {
    constructor() {
        this.registeredListeners = [];
        this.messageHandler = null;
        this.isDisposed = false;
        (0, logger_1.webview)('🎭 EventHandlerManager initialized');
    }
    addEventListener(element, type, handler, options) {
        if (this.isDisposed) {
            (0, logger_1.webview)('⚠️ Cannot add event listener - EventHandlerManager is disposed');
            return;
        }
        try {
            // ラップされたハンドラーでエラー処理
            const wrappedHandler = async (event) => {
                try {
                    await handler(event);
                }
                catch (error) {
                    (0, logger_1.webview)(`❌ Error in event handler for ${type}:`, error);
                }
            };
            element.addEventListener(type, wrappedHandler, options);
            // 登録されたリスナーを記録
            this.registeredListeners.push({
                element,
                eventType: type,
                handler: wrappedHandler,
                options,
            });
            (0, logger_1.webview)(`📡 Event listener registered: ${type}`);
        }
        catch (error) {
            (0, logger_1.webview)(`❌ Failed to register event listener for ${type}:`, error);
        }
    }
    /**
     * 特定のイベントリスナーを削除
     */
    removeEventListener(element, type, handler) {
        try {
            element.removeEventListener(type, handler);
            // 登録済みリストから削除
            this.registeredListeners = this.registeredListeners.filter((listener) => !(listener.element === element &&
                listener.eventType === type &&
                listener.handler === handler));
            (0, logger_1.webview)(`📡 Event listener removed: ${type}`);
        }
        catch (error) {
            (0, logger_1.webview)(`❌ Failed to remove event listener for ${type}:`, error);
        }
    }
    /**
     * メッセージイベントハンドラーを設定
     */
    setMessageEventHandler(handler) {
        if (this.messageHandler) {
            this.removeMessageEventHandler();
        }
        this.messageHandler = handler;
        // windowオブジェクトにメッセージリスナーを登録
        const wrappedMessageHandler = async (event) => {
            try {
                await handler(event);
            }
            catch (error) {
                (0, logger_1.webview)('❌ Error in message event handler:', error);
            }
        };
        this.addEventListener(window, 'message', wrappedMessageHandler);
        (0, logger_1.webview)('📨 Message event handler registered');
    }
    /**
     * メッセージイベントハンドラーを削除
     */
    removeMessageEventHandler() {
        if (this.messageHandler) {
            // 登録されたメッセージリスナーを検索・削除
            const messageListeners = this.registeredListeners.filter((listener) => listener.element === window && listener.eventType === 'message');
            for (const listener of messageListeners) {
                this.removeEventListener(listener.element, listener.eventType, listener.handler);
            }
            this.messageHandler = null;
            (0, logger_1.webview)('📨 Message event handler removed');
        }
    }
    /**
     * リサイズイベントハンドラーを設定 (レガシー - ResizeObserver推奨)
     */
    setResizeEventHandler(handler) {
        this.addEventListener(window, 'resize', handler);
        (0, logger_1.webview)('📏 Resize event handler registered (deprecated - use ResizeObserver)');
    }
    /**
     * フォーカスイベントハンドラーを設定
     */
    setFocusEventHandlers(focusHandler, blurHandler) {
        if (focusHandler) {
            this.addEventListener(window, 'focus', focusHandler);
            (0, logger_1.webview)('🎯 Focus event handler registered');
        }
        if (blurHandler) {
            this.addEventListener(window, 'blur', blurHandler);
            (0, logger_1.webview)('🎯 Blur event handler registered');
        }
    }
    /**
     * キーボードイベントハンドラーを設定
     */
    setKeyboardEventHandlers(keydownHandler, keyupHandler) {
        if (keydownHandler) {
            this.addEventListener(document, 'keydown', keydownHandler);
            (0, logger_1.webview)('⌨️ Keydown event handler registered');
        }
        if (keyupHandler) {
            this.addEventListener(document, 'keyup', keyupHandler);
            (0, logger_1.webview)('⌨️ Keyup event handler registered');
        }
    }
    /**
     * マウスイベントハンドラーを設定
     */
    setMouseEventHandlers(clickHandler, contextMenuHandler) {
        if (clickHandler) {
            this.addEventListener(document, 'click', clickHandler);
            (0, logger_1.webview)('🖱️ Click event handler registered');
        }
        if (contextMenuHandler) {
            this.addEventListener(document, 'contextmenu', contextMenuHandler);
            (0, logger_1.webview)('🖱️ Context menu event handler registered');
        }
    }
    /**
     * DOM準備完了イベントの処理
     */
    onDOMContentLoaded(handler) {
        if (document.readyState === 'loading') {
            this.addEventListener(document, 'DOMContentLoaded', handler);
        }
        else {
            // 既にDOMが準備完了している場合は即座に実行
            setTimeout(() => handler(new Event('DOMContentLoaded')), 0);
        }
    }
    /**
     * ページ読み込み完了イベントの処理
     */
    onPageLoaded(handler) {
        if (document.readyState !== 'complete') {
            this.addEventListener(window, 'load', handler);
        }
        else {
            // 既にページが読み込み完了している場合は即座に実行
            setTimeout(() => handler(new Event('load')), 0);
        }
    }
    /**
     * ページ離脱イベントの処理
     */
    onPageUnload(handler) {
        this.addEventListener(window, 'beforeunload', handler);
        this.addEventListener(window, 'unload', handler);
        (0, logger_1.webview)('🚪 Page unload handlers registered');
    }
    /**
     * カスタムイベントの発行
     */
    dispatchCustomEvent(eventType, detail, target = window) {
        try {
            const customEvent = new CustomEvent(eventType, {
                detail,
                bubbles: true,
                cancelable: true,
            });
            target.dispatchEvent(customEvent);
            (0, logger_1.webview)(`🚀 Custom event dispatched: ${eventType}`);
        }
        catch (error) {
            (0, logger_1.webview)(`❌ Failed to dispatch custom event ${eventType}:`, error);
        }
    }
    /**
     * 全イベントリスナーの統計情報
     */
    getEventStats() {
        const eventTypes = Array.from(new Set(this.registeredListeners.map((listener) => listener.eventType)));
        const targets = Array.from(new Set(this.registeredListeners.map((listener) => {
            if (listener.element === window)
                return 'window';
            if (listener.element === document)
                return 'document';
            if (listener.element instanceof HTMLElement)
                return listener.element.tagName.toLowerCase();
            return 'unknown';
        })));
        return {
            totalListeners: this.registeredListeners.length,
            eventTypes,
            targets,
        };
    }
    /**
     * 登録されたイベントリスナーの詳細情報
     */
    getRegisteredListeners() {
        return this.registeredListeners.map((listener) => ({
            eventType: listener.eventType,
            target: listener.element === window
                ? 'window'
                : listener.element === document
                    ? 'document'
                    : listener.element instanceof HTMLElement
                        ? listener.element.tagName.toLowerCase()
                        : 'unknown',
            hasOptions: !!listener.options,
        }));
    }
    /**
     * リソースのクリーンアップ
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        (0, logger_1.webview)('🧹 Disposing EventHandlerManager...');
        try {
            // 全ての登録されたイベントリスナーを削除
            for (const listener of this.registeredListeners) {
                listener.element.removeEventListener(listener.eventType, listener.handler, listener.options);
            }
            this.registeredListeners = [];
            this.messageHandler = null;
            this.isDisposed = true;
            (0, logger_1.webview)('✅ EventHandlerManager disposed');
        }
        catch (error) {
            (0, logger_1.webview)('❌ Error disposing EventHandlerManager:', error);
        }
    }
}
exports.EventHandlerManager = EventHandlerManager;
//# sourceMappingURL=EventHandlerManager.js.map