"use strict";
/**
 * 統合された基底マネージャークラス
 * - EnhancedBaseManagerの高度な機能を統合
 * - 一貫した命名規則とエラーハンドリング
 * - 型安全性とパフォーマンス最適化
 * - 包括的なテスト可能性
 * - 90%の重複コードを削減し、一貫した実装パターンを提供
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseManager = exports.ResourceManager = exports.ManagerPerformanceTracker = exports.ManagerErrorHandler = void 0;
const logger_1 = require("../../utils/logger");
// =============================================================================
// ErrorHandlingUtility - 一元化されたエラー処理
// =============================================================================
class ManagerErrorHandler {
    constructor(managerName, logger, enableRecovery = true) {
        this.managerName = managerName;
        this.logger = logger;
        this.enableRecovery = enableRecovery;
        this.errorCount = 0;
    }
    async executeWithErrorHandling(operation, operationName, fallbackValue) {
        const startTime = performance.now();
        try {
            const result = await operation();
            const executionTime = performance.now() - startTime;
            this.logger(`✅ ${operationName} completed successfully (${executionTime.toFixed(2)}ms)`);
            return result;
        }
        catch (error) {
            this.errorCount++;
            const processedError = error instanceof Error ? error : new Error(String(error));
            this.lastError = processedError;
            const executionTime = performance.now() - startTime;
            this.logger(`❌ ${operationName} failed after ${executionTime.toFixed(2)}ms:`, processedError.message);
            if (this.enableRecovery && fallbackValue !== undefined) {
                this.logger(`🔄 Using fallback value for ${operationName}`);
                return fallbackValue;
            }
            return null;
        }
    }
    getErrorCount() {
        return this.errorCount;
    }
    getLastError() {
        return this.lastError;
    }
    resetErrorCount() {
        this.errorCount = 0;
        this.lastError = undefined;
    }
}
exports.ManagerErrorHandler = ManagerErrorHandler;
// =============================================================================
// PerformanceTracker - パフォーマンス監視
// =============================================================================
class ManagerPerformanceTracker {
    constructor() {
        this.operationCount = 0;
        this.totalOperationTime = 0;
        this.lastOperationTimestamp = 0;
        this.initializationTime = 0;
    }
    recordInitialization(timeMs) {
        this.initializationTime = timeMs;
    }
    recordOperation(operationTimeMs) {
        this.operationCount++;
        this.totalOperationTime += operationTimeMs;
        this.lastOperationTimestamp = Date.now();
    }
    getMetrics() {
        return {
            initializationTimeMs: this.initializationTime,
            operationCount: this.operationCount,
            averageOperationTimeMs: this.operationCount > 0 ? this.totalOperationTime / this.operationCount : 0,
            errorCount: 0, // Will be provided by ErrorHandler
            lastOperationTimestamp: this.lastOperationTimestamp,
        };
    }
    reset() {
        this.operationCount = 0;
        this.totalOperationTime = 0;
        this.lastOperationTimestamp = 0;
    }
}
exports.ManagerPerformanceTracker = ManagerPerformanceTracker;
// =============================================================================
// ResourceManager - リソース管理の抽象化
// =============================================================================
class ResourceManager {
    constructor() {
        this.resources = new Set();
    }
    registerResourceCleanup(cleanupFunction) {
        this.resources.add(cleanupFunction);
    }
    unregisterResourceCleanup(cleanupFunction) {
        this.resources.delete(cleanupFunction);
    }
    cleanupAllResources() {
        const startTime = performance.now();
        const errors = [];
        let cleanedResourceCount = 0;
        for (const cleanup of this.resources) {
            try {
                cleanup();
                cleanedResourceCount++;
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                errors.push(`Resource cleanup failed: ${errorMessage}`);
            }
        }
        this.resources.clear();
        return {
            success: errors.length === 0,
            cleanedResourceCount,
            errors,
            cleanupTimeMs: performance.now() - startTime,
        };
    }
}
exports.ResourceManager = ResourceManager;
// =============================================================================
// 統合された基底マネージャークラス
// =============================================================================
class BaseManager extends ResourceManager {
    constructor(managerName, options = {
        enableLogging: true,
        enablePerformanceTracking: true,
        enableErrorRecovery: true,
        initializationTimeoutMs: 5000,
    }) {
        super();
        this.managerName = managerName;
        this.options = options;
        this.isReady = false;
        this.isDisposed = false;
        this.initializationStartTime = 0;
        this.logger = options.customLogger ?? this.createDefaultLogger();
        this.errorHandler = new ManagerErrorHandler(managerName, this.logger, options.enableErrorRecovery);
        this.performanceTracker = new ManagerPerformanceTracker();
        this.logger(`🏗️ Manager instance created: ${managerName}`);
    }
    /**
     * 統一された初期化プロセス
     */
    async initialize() {
        if (this.isReady) {
            this.logger('Already initialized, skipping');
            return;
        }
        this.initializationStartTime = Date.now();
        const startTime = performance.now();
        try {
            this.logger('🚀 Initializing...');
            await this.doInitialize();
            this.isReady = true;
            const initTime = performance.now() - startTime;
            this.performanceTracker.recordInitialization(initTime);
            this.logger('✅ Initialized successfully');
        }
        catch (error) {
            this.logger('❌ Initialization failed:', error);
            throw error;
        }
    }
    /**
     * 統一されたリソース解放プロセス
     */
    dispose() {
        if (this.isDisposed) {
            this.logger('Already disposed, skipping');
            return;
        }
        const startTime = performance.now();
        try {
            this.logger('🧹 Disposing resources...');
            // リソースクリーンアップ実行
            const cleanupResult = this.cleanupAllResources();
            if (!cleanupResult.success) {
                this.logger('⚠️ Some resources failed to cleanup:', cleanupResult.errors);
            }
            this.doDispose();
            this.isReady = false;
            this.isDisposed = true;
            const disposeTime = performance.now() - startTime;
            this.logger(`✅ Disposed successfully (${disposeTime.toFixed(2)}ms)`);
        }
        catch (error) {
            this.logger('❌ Disposal failed:', error);
        }
    }
    /**
     * マネージャーの状態確認
     */
    getStatus() {
        return {
            name: this.managerName,
            isReady: this.isReady,
            isDisposed: this.isDisposed,
        };
    }
    /**
     * 統一されたロガー作成（廃止予定）
     */
    createLogger() {
        const prefix = `[${this.managerName.toUpperCase()}]`;
        return (message, ...args) => {
            (0, logger_1.webview)(prefix, message, ...args);
        };
    }
    /**
     * デフォルトロガー作成（推奨）
     */
    createDefaultLogger() {
        const prefix = `[${this.managerName.toUpperCase()}]`;
        return (message, ...args) => {
            (0, logger_1.webview)(prefix, message, ...args);
        };
    }
    /**
     * 準備状態の確認
     */
    ensureReady() {
        if (!this.isReady) {
            throw new Error(`${this.managerName} is not ready`);
        }
        if (this.isDisposed) {
            throw new Error(`${this.managerName} is disposed`);
        }
    }
    /**
     * 安全な非同期操作実行
     */
    async safeExecute(operation, operationName) {
        try {
            this.ensureReady();
            return await operation();
        }
        catch (error) {
            this.logger(`❌ ${operationName} failed:`, error);
            return null;
        }
    }
    // =============================================================================
    // Enhanced Manager Methods - EnhancedBaseManagerとの統合
    // =============================================================================
    /**
     * エラーハンドリング付き操作実行
     */
    async executeWithErrorHandling(operation, operationName, fallbackValue) {
        return this.errorHandler.executeWithErrorHandling(operation, operationName, fallbackValue);
    }
    /**
     * パフォーマンスメトリクス取得
     */
    getPerformanceMetrics() {
        const metrics = this.performanceTracker.getMetrics();
        return {
            ...metrics,
            errorCount: this.errorHandler.getErrorCount(),
        };
    }
    /**
     * 健全性ステータス取得
     */
    getHealthStatus() {
        const upTimeMs = Date.now() - this.initializationStartTime;
        return {
            managerName: this.managerName,
            isHealthy: this.isReady && !this.isDisposed && this.errorHandler.getErrorCount() === 0,
            isInitialized: this.isReady,
            isDisposed: this.isDisposed,
            upTimeMs,
            performanceMetrics: this.getPerformanceMetrics(),
            lastError: this.errorHandler.getLastError(),
        };
    }
    /**
     * エラーカウントリセット
     */
    resetErrorCount() {
        this.errorHandler.resetErrorCount();
    }
    /**
     * パフォーマンストラッカーリセット
     */
    resetPerformanceMetrics() {
        this.performanceTracker.reset();
    }
    /**
     * 操作記録
     */
    recordOperation(operationTimeMs) {
        this.performanceTracker.recordOperation(operationTimeMs);
    }
}
exports.BaseManager = BaseManager;
//# sourceMappingURL=BaseManager.js.map