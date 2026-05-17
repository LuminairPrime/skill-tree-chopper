'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.PersistenceOrchestrator = void 0;
const logger_1 = require('../../utils/logger');
const ExtensionPersistenceService_1 = require('../../services/persistence/ExtensionPersistenceService');
const PersistenceMessageHandler_1 = require('../../handlers/PersistenceMessageHandler');
const defaultServiceFactory = (context, terminalManager) =>
  new ExtensionPersistenceService_1.ExtensionPersistenceService(context, terminalManager);
const defaultHandlerFactory = (service) =>
  new PersistenceMessageHandler_1.PersistenceMessageHandler(service);
class PersistenceOrchestrator {
  constructor(options) {
    this.options = options;
    this.logger = options.logger ?? logger_1.provider;
    this.persistenceService = (options.serviceFactory || defaultServiceFactory)(
      options.extensionContext,
      options.terminalManager
    );
    this.handler = (options.handlerFactory || defaultHandlerFactory)(this.persistenceService);
    this.sendMessageImpl = options.sendMessage;
    // 🔧 FIX: Set sidebar provider on ExtensionPersistenceService
    if ('setSidebarProvider' in this.persistenceService) {
      this.persistenceService.setSidebarProvider?.({
        sendMessageToWebview: async (message) => {
          await options.sendMessage(message);
        },
      });
      this.logger('✅ [PERSISTENCE-ORCH] Sidebar provider configured for persistence service');
    }
  }
  hasHandler() {
    return Boolean(this.handler);
  }
  getHandler() {
    return this.handler;
  }
  async handlePersistenceMessage(message, sendMessage) {
    await this.routePersistenceMessage(
      message,
      sendMessage ?? this.sendMessageImpl,
      (webviewMessage) => webviewMessage
    );
  }
  async handleLegacyPersistenceMessage(message, sendMessage) {
    await this.routePersistenceMessage(message, sendMessage, (legacyMessage) => {
      let command = legacyMessage.command;
      switch (legacyMessage.command) {
        case 'terminalSerializationRequest':
          command = 'persistenceSaveSession';
          break;
        case 'terminalSerializationRestoreRequest':
          command = 'persistenceRestoreSession';
          break;
      }
      return {
        ...legacyMessage,
        command,
      };
    });
  }
  async routePersistenceMessage(message, sendMessage, normalize) {
    const normalizedMessage = normalize(message);
    const responseCommand = normalizedMessage.command.endsWith('Response')
      ? normalizedMessage.command
      : `${normalizedMessage.command}Response`;
    try {
      const persistenceCommand = normalizedMessage.command.replace('persistence', '').toLowerCase();
      const persistenceMessage = {
        command: persistenceCommand,
        data: normalizedMessage.data,
        terminalId: normalizedMessage.terminalId,
      };
      const response = await this.handler.handleMessage(persistenceMessage);
      await (sendMessage ?? this.sendMessageImpl)({
        command: responseCommand,
        success: response.success,
        data: response.data,
        error: response.error,
        terminalCount: response.terminalCount,
        messageId: normalizedMessage.messageId,
      });
    } catch (error) {
      this.logger('❌ [PERSISTENCE] Message handling failed:', error);
      await (sendMessage ?? this.sendMessageImpl)({
        command: responseCommand,
        success: false,
        error: `Persistence operation failed: ${error.message}`,
        messageId: normalizedMessage.messageId,
      });
    }
  }
  async saveCurrentSession() {
    this.logger('🔥 [PERSISTENCE-DEBUG] === saveCurrentSession called ===');
    try {
      const result = await this.persistenceService.saveCurrentSession();
      if (result.success) {
        this.logger(
          `✅ [PERSISTENCE] Session saved successfully: ${result.terminalCount} terminals`
        );
      } else {
        this.logger('❌ [PERSISTENCE] Session save failed via persistence service');
      }
      return result.success;
    } catch (error) {
      this.logger(`❌ [PERSISTENCE] Auto-save failed: ${error}`);
      return false;
    }
  }
  async restoreLastSession() {
    this.logger('🔥 [RESTORE-DEBUG] === restoreLastSession called ===');
    try {
      const result = await this.persistenceService.restoreSession(true);
      if (result.success) {
        const restoredCount = result.restoredCount ?? 0;
        const skippedCount = result.skippedCount ?? 0;
        this.logger(
          `✅ [PERSISTENCE] Session restored successfully: ${restoredCount}/${restoredCount + skippedCount} terminals`
        );
      } else {
        const errorMessage =
          result.error instanceof Error
            ? result.error.message
            : String(result.error ?? 'unknown error');
        this.logger(`📦 [PERSISTENCE] Restore failed: ${errorMessage}`);
      }
      return result.success && (result.restoredCount ?? 0) > 0;
    } catch (error) {
      this.logger(`❌ [PERSISTENCE] Auto-restore failed: ${error}`);
      return false;
    }
  }
  handleSerializationResponse(serializationData) {
    this.logger(`📋 [PERSISTENCE-ORCH] Routing serialization response to persistence service`);
    if ('handleSerializationResponseMessage' in this.persistenceService) {
      this.persistenceService.handleSerializationResponseMessage?.(serializationData);
      this.logger(`✅ [PERSISTENCE-ORCH] Serialization response forwarded successfully`);
    } else {
      this.logger(
        `⚠️ [PERSISTENCE-ORCH] Persistence service does not support handleSerializationResponseMessage`
      );
    }
  }
  dispose() {
    try {
      void this.persistenceService.cleanupExpiredSessions();
    } catch (error) {
      this.logger('⚠️ [PERSISTENCE] Failed to cleanup persistence service during dispose:', error);
    }
    this.persistenceService.dispose();
  }
}
exports.PersistenceOrchestrator = PersistenceOrchestrator;
//# sourceMappingURL=PersistenceOrchestrator.js.map
