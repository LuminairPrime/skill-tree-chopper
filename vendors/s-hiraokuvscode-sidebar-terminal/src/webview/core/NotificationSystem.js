"use strict";
/**
 * 統一通知システム - Observer/Publisher-Subscriber パターン実装
 * 既存NotificationUtilsとの互換性を保持しつつ段階的移行を可能にする
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationSystem = void 0;
exports.createNotificationSystem = createNotificationSystem;
exports.enableUnifiedNotifications = enableUnifiedNotifications;
exports.disableUnifiedNotifications = disableUnifiedNotifications;
exports.enableFallbackMode = enableFallbackMode;
exports.disableFallbackMode = disableFallbackMode;
const webview_1 = require("../constants/webview");
/**
 * 統一通知システム - 既存システムとの共存を前提とした設計
 */
class NotificationSystem {
    constructor() {
        this._observers = new Set();
        this._notifications = new Map();
        this._filters = new Map();
        // Feature flag for gradual migration
        this._enabled = false;
        this._fallbackMode = true; // 既存システムへのフォールバック
        // Singleton pattern
    }
    static getInstance() {
        if (!NotificationSystem._instance) {
            NotificationSystem._instance = new NotificationSystem();
        }
        return NotificationSystem._instance;
    }
    /**
     * 段階的移行のためのFeature Flag
     */
    setEnabled(enabled) {
        this._enabled = enabled;
    }
    isEnabled() {
        return this._enabled;
    }
    setFallbackMode(enabled) {
        this._fallbackMode = enabled;
    }
    /**
     * 通知オブザーバーの登録
     */
    subscribe(observer, filter) {
        this._observers.add(observer);
        if (filter) {
            const filterId = this._generateFilterId();
            this._filters.set(filterId, filter);
            return filterId;
        }
        return 'default';
    }
    /**
     * 通知オブザーバーの解除
     */
    unsubscribe(observer) {
        this._observers.delete(observer);
    }
    /**
     * 通知の発信 - 既存システムとの互換性を保持
     */
    notify(config) {
        const notification = {
            id: this._generateNotificationId(),
            type: config.type,
            title: config.title,
            message: config.message,
            duration: config.duration || webview_1.NOTIFICATION_DURATION_CONSTANTS.DEFAULT_DURATION_MS,
            icon: config.icon,
            timestamp: Date.now(),
            source: config.source || 'unknown',
        };
        // 新システムが有効な場合のみ処理
        if (this._enabled) {
            this._notifications.set(notification.id, notification);
            this._notifyObservers(notification);
            // 自動削除の設定
            if (notification.duration && notification.duration > 0) {
                setTimeout(() => {
                    this.removeNotification(notification.id);
                }, notification.duration);
            }
        }
        // フォールバックモードの場合は既存システムも呼び出し
        if (this._fallbackMode && this._isLegacyNotificationUtilsAvailable()) {
            this._callLegacyNotificationSystem(config);
        }
        return notification.id;
    }
    /**
     * 通知の削除
     */
    removeNotification(id) {
        const notification = this._notifications.get(id);
        if (!notification) {
            return false;
        }
        this._notifications.delete(id);
        this._notifyObserversOfRemoval(id);
        return true;
    }
    /**
     * アクティブな通知の取得
     */
    getActiveNotifications(filter) {
        const notifications = Array.from(this._notifications.values());
        if (!filter) {
            return notifications;
        }
        return notifications.filter((notification) => this._matchesFilter(notification, filter));
    }
    /**
     * 通知履歴のクリア
     */
    clearAll() {
        const notificationIds = Array.from(this._notifications.keys());
        this._notifications.clear();
        notificationIds.forEach((id) => {
            this._notifyObserversOfRemoval(id);
        });
    }
    /**
     * システム統計の取得（デバッグ用）
     */
    getStats() {
        const notifications = Array.from(this._notifications.values());
        const byType = notifications.reduce((acc, n) => {
            acc[n.type] = (acc[n.type] || 0) + 1;
            return acc;
        }, {});
        const bySource = notifications.reduce((acc, n) => {
            const source = n.source || 'unknown';
            acc[source] = (acc[source] || 0) + 1;
            return acc;
        }, {});
        return {
            totalNotifications: this._notifications.size,
            activeObservers: this._observers.size,
            byType,
            bySource,
        };
    }
    // Private methods
    _notifyObservers(notification) {
        this._observers.forEach((observer) => {
            try {
                observer.onNotification(notification);
            }
            catch (error) {
                console.error('NotificationSystem: Observer error:', error);
            }
        });
    }
    _notifyObserversOfRemoval(id) {
        this._observers.forEach((observer) => {
            try {
                observer.onNotificationRemoved?.(id);
            }
            catch (error) {
                console.error('NotificationSystem: Observer removal error:', error);
            }
        });
    }
    _matchesFilter(notification, filter) {
        if (filter.type && !filter.type.includes(notification.type)) {
            return false;
        }
        if (filter.source && notification.source && !filter.source.includes(notification.source)) {
            return false;
        }
        if (filter.maxAge) {
            const age = Date.now() - notification.timestamp;
            if (age > filter.maxAge) {
                return false;
            }
        }
        return true;
    }
    _generateNotificationId() {
        return `notification_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }
    _generateFilterId() {
        return `filter_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }
    _isLegacyNotificationUtilsAvailable() {
        // 既存NotificationUtilsの存在確認
        try {
            return (typeof window !== 'undefined' &&
                'showNotification' in globalThis);
        }
        catch {
            return false;
        }
    }
    _callLegacyNotificationSystem(config) {
        try {
            // 既存のNotificationUtilsのshowNotification関数を呼び出し
            const globalAny = globalThis;
            const showNotification = globalAny['showNotification'];
            if (typeof showNotification === 'function') {
                showNotification(config);
            }
        }
        catch (error) {
            console.warn('NotificationSystem: Legacy fallback failed:', error);
        }
    }
}
exports.NotificationSystem = NotificationSystem;
NotificationSystem._instance = null;
/**
 * 既存システムとの互換性を保つためのファクトリー関数
 */
function createNotificationSystem() {
    return NotificationSystem.getInstance();
}
/**
 * 段階的移行のためのヘルパー関数
 */
function enableUnifiedNotifications() {
    NotificationSystem.getInstance().setEnabled(true);
}
function disableUnifiedNotifications() {
    NotificationSystem.getInstance().setEnabled(false);
}
function enableFallbackMode() {
    NotificationSystem.getInstance().setFallbackMode(true);
}
function disableFallbackMode() {
    NotificationSystem.getInstance().setFallbackMode(false);
}
//# sourceMappingURL=NotificationSystem.js.map