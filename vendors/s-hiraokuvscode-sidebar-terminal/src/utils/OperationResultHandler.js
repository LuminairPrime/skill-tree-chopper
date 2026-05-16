"use strict";
/**
 * 統一されたオペレーション結果処理ユーティリティ
 *
 * 重複していたエラーハンドリングパターンを統一し、
 * 一貫性のある成功/失敗処理を提供します。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationResultHandler = void 0;
const logger_1 = require("./logger");
/**
 * 統一されたオペレーション結果処理
 */
class OperationResultHandler {
    /**
     * Common result processing logic (private helper)
     */
    static processResult(result, context, successMessage, notificationService) {
        if (result.success) {
            (0, logger_1.extension)(`✅ [${context}] Operation successful`);
            if (successMessage && notificationService) {
                notificationService.showSuccess(successMessage);
            }
            return result.data || null;
        }
        else {
            const reason = result.reason || 'Operation failed';
            (0, logger_1.extension)(`⚠️ [${context}] Operation failed: ${reason}`);
            if (notificationService) {
                notificationService.showError(reason);
            }
            return null;
        }
    }
    /**
     * Common error handling logic (private helper)
     */
    static handleErrorInternal(error, context, notificationService) {
        const errorMessage = `Operation error: ${String(error)}`;
        (0, logger_1.extension)(`❌ [${context}] ${errorMessage}`);
        if (notificationService) {
            notificationService.showError(errorMessage);
        }
        return null;
    }
    /**
     * Handle terminal operation result (async)
     */
    static async handleTerminalOperation(operation, context, successMessage, notificationService) {
        try {
            const result = await operation();
            return this.processResult(result, context, successMessage, notificationService);
        }
        catch (error) {
            return this.handleErrorInternal(error, context, notificationService);
        }
    }
    /**
     * Handle sync operation result
     */
    static handleSyncOperation(operation, context, successMessage, notificationService) {
        try {
            const result = operation();
            return this.processResult(result, context, successMessage, notificationService);
        }
        catch (error) {
            return this.handleErrorInternal(error, context, notificationService);
        }
    }
    /**
     * 複数オペレーションのバッチ処理
     */
    static async handleBatchOperations(operations, context, notificationService) {
        const successful = [];
        const failed = [];
        for (let i = 0; i < operations.length; i++) {
            const operation = operations[i];
            if (operation) {
                const result = await this.handleTerminalOperation(operation, `${context}-BATCH-${i}`, undefined, undefined // バッチ処理では個別通知は行わない
                );
                if (result !== null) {
                    successful.push(result);
                }
                else {
                    failed.push({ index: i, reason: 'Operation failed' });
                }
            }
            else {
                failed.push({ index: i, reason: 'Invalid operation' });
            }
        }
        const summary = `Batch operation completed: ${successful.length} successful, ${failed.length} failed`;
        (0, logger_1.extension)(`📊 [${context}] ${summary}`);
        if (notificationService) {
            if (failed.length === 0) {
                notificationService.showSuccess(`All ${successful.length} operations completed successfully`);
            }
            else if (successful.length === 0) {
                notificationService.showError(`All ${failed.length} operations failed`);
            }
            else {
                notificationService.showWarning(summary);
            }
        }
        return { successful, failed };
    }
    /**
     * オペレーション結果を作成するヘルパー
     */
    static createResult(success, data, reason, error) {
        return { success, data, reason, error };
    }
    /**
     * 成功結果を作成
     */
    static success(data) {
        return this.createResult(true, data);
    }
    /**
     * 失敗結果を作成
     */
    static failure(reason, error) {
        return this.createResult(false, undefined, reason, error);
    }
}
exports.OperationResultHandler = OperationResultHandler;
//# sourceMappingURL=OperationResultHandler.js.map