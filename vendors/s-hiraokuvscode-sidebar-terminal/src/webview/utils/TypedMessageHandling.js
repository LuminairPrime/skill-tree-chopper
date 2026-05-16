"use strict";
/**
 * 型安全なメッセージハンドリングシステム
 * - 'any'型を排除し、完全な型安全性を実現
 * - 一貫した命名規則とエラーハンドリング
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MESSAGE_COMMANDS = exports.TypedMessageSender = exports.TypedMessageRouter = exports.MessageDataValidator = void 0;
exports.createTypedMessageEventListener = createTypedMessageEventListener;
const logger_1 = require("../../utils/logger");
// =============================================================================
// ValidationHelper - 型安全な検証クラス
// =============================================================================
class MessageDataValidator {
    constructor(requiredFields, logger) {
        this.requiredFields = requiredFields;
        this.logger = logger;
    }
    validate(data) {
        const errors = [];
        if (!data || typeof data !== 'object') {
            errors.push('Data must be a valid object');
            return { data: {}, isValid: false, errors };
        }
        const typedData = data;
        // 必須フィールドの検証
        for (const field of this.requiredFields) {
            const fieldName = String(field);
            if (!(fieldName in typedData)) {
                errors.push(`Missing required field: ${fieldName}`);
            }
        }
        const isValid = errors.length === 0;
        if (!isValid) {
            this.logger('Validation failed:', errors);
        }
        return {
            data: typedData,
            isValid,
            errors,
        };
    }
    static createTerminalValidator(logger) {
        return new MessageDataValidator(['terminalId'], logger);
    }
    static createSessionValidator(logger) {
        return new MessageDataValidator(['sessionId', 'terminalStates'], logger);
    }
}
exports.MessageDataValidator = MessageDataValidator;
// =============================================================================
// TypedMessageRouter - 改善されたメッセージルーター
// =============================================================================
class TypedMessageRouter {
    constructor(componentName, customLogger) {
        this.handlers = new Map();
        this.validators = new Map();
        this.componentName = componentName;
        this.logger = customLogger ?? this.createDefaultLogger();
    }
    registerHandler(registration) {
        this.handlers.set(registration.command, registration.handler);
        if (registration.validator) {
            this.validators.set(registration.command, registration.validator);
        }
        this.logger(`✅ Registered handler for command: "${registration.command}"`);
    }
    registerMultipleHandlers(registrations) {
        registrations.forEach((registration) => this.registerHandler(registration));
        this.logger(`✅ Registered ${registrations.length} handlers`);
    }
    async processMessage(command, rawData) {
        const startTime = performance.now();
        try {
            const handler = this.handlers.get(command);
            if (!handler) {
                const error = new Error(`No handler registered for command: ${command}`);
                this.logger(`❌ ${error.message}`);
                return this.createFailureResult(command, startTime, error);
            }
            // データ検証
            const validator = this.validators.get(command);
            if (validator) {
                const validationResult = validator.validate(rawData);
                if (!validationResult.isValid) {
                    const error = new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
                    return this.createFailureResult(command, startTime, error);
                }
                rawData = validationResult.data;
            }
            this.logger(`📨 Processing command: ${command}`);
            await handler(rawData);
            return this.createSuccessResult(command, startTime);
        }
        catch (error) {
            const processedError = error instanceof Error ? error : new Error(String(error));
            this.logger(`❌ Handler failed for command ${command}:`, processedError);
            return this.createFailureResult(command, startTime, processedError);
        }
    }
    getRegisteredCommands() {
        return Array.from(this.handlers.keys());
    }
    clearAllHandlers() {
        const count = this.handlers.size;
        this.handlers.clear();
        this.validators.clear();
        this.logger(`🧹 Cleared ${count} handlers and validators`);
    }
    createDefaultLogger() {
        const prefix = `[${this.componentName.toUpperCase()}-ROUTER]`;
        return (message, ...args) => {
            (0, logger_1.webview)(prefix, message, ...args);
        };
    }
    createSuccessResult(command, startTime) {
        return {
            success: true,
            command,
            processingTimeMs: performance.now() - startTime,
        };
    }
    createFailureResult(command, startTime, error) {
        return {
            success: false,
            command,
            processingTimeMs: performance.now() - startTime,
            error,
        };
    }
}
exports.TypedMessageRouter = TypedMessageRouter;
class TypedMessageSender {
    constructor(vscodeApi, componentName, customLogger) {
        this.vscodeApi = vscodeApi;
        this.componentName = componentName;
        this.messageQueue = [];
        this.maxRetries = 3;
        this.retryDelayMs = 1000;
        this.logger = customLogger ?? this.createDefaultLogger();
    }
    sendMessage(command, data = {}) {
        try {
            const message = { command, ...data };
            this.vscodeApi.postMessage(message);
            this.logger(`📤 Sent command: ${command}`);
        }
        catch (error) {
            this.logger(`❌ Failed to send command ${command}:`, error);
            this.queueForRetry(command, data);
        }
    }
    sendMultipleMessages(messages) {
        messages.forEach(({ command, data = {} }) => {
            this.sendMessage(command, data);
        });
    }
    sendConditionalMessage(condition, command, data = {}) {
        const shouldSend = typeof condition === 'function' ? condition() : condition;
        if (shouldSend) {
            this.sendMessage(command, data);
        }
    }
    retryQueuedMessages() {
        const messagesToRetry = [...this.messageQueue];
        this.messageQueue.length = 0;
        messagesToRetry.forEach((queuedMessage) => {
            if (queuedMessage.retryCount < this.maxRetries) {
                const delayMs = this.retryDelayMs * queuedMessage.retryCount;
                if (delayMs <= 0) {
                    // Immediate retry when explicitly requested (matches test expectations)
                    this.sendMessage(queuedMessage.command, queuedMessage.data);
                }
                else {
                    setTimeout(() => {
                        this.sendMessage(queuedMessage.command, queuedMessage.data);
                    }, delayMs);
                }
            }
            else {
                this.logger(`❌ Max retries exceeded for command: ${queuedMessage.command}`);
            }
        });
    }
    queueForRetry(command, data) {
        const queuedMessage = {
            command,
            data,
            timestamp: Date.now(),
            retryCount: 0,
        };
        this.messageQueue.push(queuedMessage);
        this.logger(`📋 Queued message for retry: ${command}`);
    }
    createDefaultLogger() {
        const prefix = `[${this.componentName.toUpperCase()}-SENDER]`;
        return (message, ...args) => {
            (0, logger_1.webview)(prefix, message, ...args);
        };
    }
}
exports.TypedMessageSender = TypedMessageSender;
// =============================================================================
// MessageEventListener - 型安全なイベントリスナー作成
// =============================================================================
function createTypedMessageEventListener(router, onUnhandledMessage) {
    return async (event) => {
        try {
            const { command, ...data } = event.data;
            if (!command || typeof command !== 'string') {
                console.warn('Received message without valid command:', event.data);
                onUnhandledMessage?.(event);
                return;
            }
            const result = await router.processMessage(command, data);
            if (!result.success && onUnhandledMessage) {
                onUnhandledMessage(event);
            }
        }
        catch (error) {
            console.error('Error processing message event:', error);
            onUnhandledMessage?.(event);
        }
    };
}
// =============================================================================
// 定数定義 - 型安全なコマンド定数
// =============================================================================
exports.MESSAGE_COMMANDS = {
    // ターミナル操作
    TERMINAL_CREATE: 'terminal:create',
    TERMINAL_DELETE: 'terminal:delete',
    TERMINAL_SET_ACTIVE: 'terminal:setActive',
    TERMINAL_RESIZE: 'terminal:resize',
    // 入出力
    TERMINAL_OUTPUT: 'terminal:output',
    TERMINAL_INPUT: 'terminal:input',
    TERMINAL_CLEAR: 'terminal:clear',
    // セッション管理
    SESSION_RESTORE: 'session:restore',
    SESSION_SAVE: 'session:save',
    SESSION_EXTRACT_SCROLLBACK: 'session:extractScrollback',
    // 設定・テーマ
    CONFIG_UPDATE: 'config:update',
    THEME_UPDATE: 'theme:update',
    // 状態管理
    STATE_INIT: 'state:init',
    STATE_UPDATE: 'state:update',
    STATE_RESET: 'state:reset',
    // 通知
    NOTIFICATION_SHOW: 'notification:show',
    NOTIFICATION_HIDE: 'notification:hide',
};
//# sourceMappingURL=TypedMessageHandling.js.map