'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.PersistenceMessageHandler = void 0;
exports.createPersistenceMessageHandler = createPersistenceMessageHandler;
const logger_1 = require('../utils/logger');
/**
 * Factory function to create PersistenceMessageHandler instance
 */
function createPersistenceMessageHandler(persistenceService) {
  return new PersistenceMessageHandler(persistenceService);
}
class PersistenceMessageHandler {
  constructor(persistenceService) {
    this.persistenceService = persistenceService;
    (0, logger_1.extension)('🔧 [MSG-HANDLER] PersistenceMessageHandler initialized');
  }
  /**
   * 永続化メッセージ処理のメインエントリーポイント
   */
  async handleMessage(message) {
    try {
      (0, logger_1.extension)(`📨 [MSG-HANDLER] Processing message: ${message.command}`);
      switch (message.command) {
        case 'saveSession':
        case 'persistenceSaveSession':
          return await this.handleSaveSession(message.data);
        case 'restoreSession':
        case 'persistenceRestoreSession':
          return await this.handleRestoreSession();
        case 'clearSession':
        case 'persistenceClearSession':
          return await this.handleClearSession();
        default:
          return {
            success: false,
            error: `Unknown persistence command: ${message.command}`,
          };
      }
    } catch (error) {
      (0, logger_1.extension)(`❌ [MSG-HANDLER] Message handling failed: ${error}`);
      return {
        success: false,
        error: `Message handling failed: ${error.message}`,
      };
    }
  }
  /**
   * セッション保存処理
   */
  async handleSaveSession(data) {
    try {
      // ExtensionPersistenceService.saveCurrentSession() doesn't take parameters
      // It gets terminal data directly from TerminalManager
      const preferCache = Boolean(data?.preferCache);
      const result = await this.persistenceService.saveCurrentSession({ preferCache });
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Save operation failed',
        };
      }
      (0, logger_1.extension)(
        `✅ [MSG-HANDLER] Session saved successfully: ${result.terminalCount} terminals`
      );
      return {
        success: true,
        terminalCount: result.terminalCount,
        data: 'Session saved successfully',
      };
    } catch (error) {
      const errorMsg = `Save operation failed: ${error.message}`;
      (0, logger_1.extension)(`❌ [MSG-HANDLER] Save failed: ${errorMsg}`);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }
  /**
   * セッション復元処理
   */
  async handleRestoreSession() {
    try {
      const result = await this.persistenceService.restoreSession();
      if (!result.success || result.terminalsRestored === 0) {
        (0, logger_1.extension)('📦 [MSG-HANDLER] No session to restore');
        return {
          success: true,
          terminalCount: 0,
          data: [],
          error: result.message || 'No session found to restore',
        };
      }
      (0, logger_1.extension)(
        `✅ [MSG-HANDLER] Session restored successfully: ${result.terminalsRestored} terminals`
      );
      return {
        success: true,
        terminalCount: result.terminalsRestored,
        data: result.terminals || [],
      };
    } catch (error) {
      const errorMsg = `Restore operation failed: ${error.message}`;
      (0, logger_1.extension)(`❌ [MSG-HANDLER] Restore failed: ${errorMsg}`);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }
  /**
   * セッションクリア処理
   */
  async handleClearSession() {
    try {
      await this.persistenceService.cleanupExpiredSessions();
      (0, logger_1.extension)('✅ [MSG-HANDLER] Session cleared successfully');
      return {
        success: true,
        data: 'Session cleared successfully',
      };
    } catch (error) {
      const errorMsg = `Clear operation failed: ${error.message}`;
      (0, logger_1.extension)(`❌ [MSG-HANDLER] Clear failed: ${errorMsg}`);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }
  /**
   * WebView向けメッセージ作成ヘルパー
   */
  createWebViewMessage(command, data, success = true) {
    return {
      command: `persistence${command.charAt(0).toUpperCase() + command.slice(1)}Response`,
      data,
      success,
      timestamp: Date.now(),
    };
  }
  /**
   * エラーレスポンス作成ヘルパー
   */
  createErrorResponse(command, error) {
    return this.createWebViewMessage(command, { error }, false);
  }
  /**
   * 成功レスポンス作成ヘルパー
   */
  createSuccessResponse(command, data) {
    return this.createWebViewMessage(command, data, true);
  }
  /**
   * メッセージハンドラー登録（compatibility method）
   */
  registerMessageHandlers() {
    // Implementation for compatibility with interface
    (0, logger_1.extension)('🔧 [MSG-HANDLER] Message handlers registered');
  }
  /**
   * 永続化メッセージ処理（compatibility method）
   */
  async handlePersistenceMessage(message) {
    // Delegate to handleMessage for compatibility
    return await this.handleMessage(message);
  }
}
exports.PersistenceMessageHandler = PersistenceMessageHandler;
//# sourceMappingURL=PersistenceMessageHandler.js.map
