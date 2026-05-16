"use strict";
/**
 * メッセージハンドリングユーティリティ
 * Extension ↔ WebView間の85%重複を削減
 * TypedMessageHandling.tsとの移行ブリッジ（廃止予定）
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageValidator = exports.COMMON_COMMANDS = exports.MessageSender = exports.MessageRouter = void 0;
exports.createWebViewMessageListener = createWebViewMessageListener;
const logger_1 = require("../../utils/logger");
const TypedMessageHandling_1 = require("./TypedMessageHandling");
/**
 * メッセージハンドラー登録パターンの統一クラス（廃止予定）
 * 新規実装ではTypedMessageRouterを使用してください
 */
class MessageRouter {
    constructor(componentName) {
        this.componentName = componentName;
        this.handlers = new Map();
        this.logger = (message, ...args) => {
            (0, logger_1.webview)(`[${this.componentName.toUpperCase()}-ROUTER]`, message, ...args);
        };
    }
    /**
     * ハンドラーを登録
     */
    register(registration) {
        this.handlers.set(registration.command, registration.handler);
        this.logger(`📝 Registered handler for "${registration.command}"`);
    }
    /**
     * 複数ハンドラーを一括登録
     */
    registerAll(registrations) {
        registrations.forEach((reg) => this.register(reg));
        this.logger(`📝 Registered ${registrations.length} handlers`);
    }
    /**
     * メッセージをルーティング
     */
    async route(command, data) {
        const handler = this.handlers.get(command);
        if (!handler) {
            this.logger(`❌ No handler found for command: ${command}`);
            return false;
        }
        try {
            this.logger(`📨 Routing command: ${command}`);
            await handler(data);
            return true;
        }
        catch (error) {
            this.logger(`❌ Handler failed for command ${command}:`, error);
            return false;
        }
    }
    /**
     * 登録済みコマンド一覧を取得
     */
    getRegisteredCommands() {
        return Array.from(this.handlers.keys());
    }
    /**
     * 全ハンドラーをクリア
     */
    clear() {
        const count = this.handlers.size;
        this.handlers.clear();
        this.logger(`🧹 Cleared ${count} handlers`);
    }
}
exports.MessageRouter = MessageRouter;
/**
 * Extension → WebView メッセージ受信パターン
 */
function createWebViewMessageListener(router, onUnhandled) {
    return async (event) => {
        const { command, ...data } = event.data;
        if (!command) {
            console.warn('Received message without command:', event.data);
            return;
        }
        const handled = await router.route(command, data);
        if (!handled && onUnhandled) {
            onUnhandled(event);
        }
    };
}
/**
 * WebView → Extension メッセージ送信ヘルパー（廃止予定）
 * 新規実装ではTypedMessageSenderを使用してください
 */
class MessageSender {
    constructor(vscode, componentName) {
        this.vscode = vscode;
        this.componentName = componentName;
        this.logger = (message, ...args) => {
            (0, logger_1.webview)(`[${this.componentName.toUpperCase()}-SENDER]`, message, ...args);
        };
    }
    /**
     * コマンドメッセージを送信
     */
    send(command, data = {}) {
        try {
            const message = { command, ...data };
            this.vscode.postMessage(message);
            this.logger(`📤 Sent command: ${command}`);
        }
        catch (error) {
            this.logger(`❌ Failed to send command ${command}:`, error);
        }
    }
    /**
     * 複数メッセージを順次送信
     */
    sendSequential(messages) {
        messages.forEach(({ command, data }) => {
            this.send(command, data);
        });
    }
    /**
     * 条件付きメッセージ送信
     */
    sendIf(condition, command, data = {}) {
        const shouldSend = typeof condition === 'function' ? condition() : condition;
        if (shouldSend) {
            this.send(command, data);
        }
    }
}
exports.MessageSender = MessageSender;
/**
 * 共通メッセージパターンの定数（廃止予定）
 * 新規実装ではMESSAGE_COMMANDSを使用してください
 */
exports.COMMON_COMMANDS = {
    // ターミナル操作
    CREATE_TERMINAL: TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE,
    DELETE_TERMINAL: TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_DELETE,
    SET_ACTIVE_TERMINAL: TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_SET_ACTIVE,
    // 出力・入力
    OUTPUT: TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_OUTPUT,
    INPUT: TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_INPUT,
    CLEAR: TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CLEAR,
    // 状態管理
    INIT: TypedMessageHandling_1.MESSAGE_COMMANDS.STATE_INIT,
    RESIZE: TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_RESIZE,
    STATE_UPDATE: TypedMessageHandling_1.MESSAGE_COMMANDS.STATE_UPDATE,
    // セッション管理
    SESSION_RESTORE: TypedMessageHandling_1.MESSAGE_COMMANDS.SESSION_RESTORE,
    EXTRACT_SCROLLBACK: TypedMessageHandling_1.MESSAGE_COMMANDS.SESSION_EXTRACT_SCROLLBACK,
    // 設定・テーマ
    THEME_UPDATE: TypedMessageHandling_1.MESSAGE_COMMANDS.THEME_UPDATE,
    CONFIG_UPDATE: TypedMessageHandling_1.MESSAGE_COMMANDS.CONFIG_UPDATE,
};
/**
 * メッセージデータの型安全なバリデーター（廃止予定）
 * 新規実装ではMessageDataValidatorを使用してください
 */
class MessageValidator {
    /**
     * 必須フィールドをチェック
     */
    static validateRequired(data, requiredFields) {
        const missingFields = requiredFields.filter((field) => !(field in data));
        const isValid = missingFields.length === 0;
        if (!isValid) {
            this.logger(`❌ Validation failed. Missing fields:`, missingFields);
        }
        return { isValid, missingFields };
    }
    /**
     * ターミナルIDの形式チェック
     */
    static validateTerminalId(terminalId) {
        const isValid = typeof terminalId === 'string' && terminalId.length > 0;
        if (!isValid) {
            this.logger(`❌ Invalid terminal ID:`, terminalId);
        }
        return isValid;
    }
    /**
     * 数値範囲チェック
     */
    static validateRange(value, min, max) {
        const isValid = typeof value === 'number' && value >= min && value <= max;
        if (!isValid) {
            this.logger(`❌ Value ${value} is not in range [${min}, ${max}]`);
        }
        return isValid;
    }
}
exports.MessageValidator = MessageValidator;
MessageValidator.logger = (message, ...args) => {
    (0, logger_1.webview)('[MESSAGE-VALIDATOR]', message, ...args);
};
//# sourceMappingURL=MessageHandlingUtils.js.map