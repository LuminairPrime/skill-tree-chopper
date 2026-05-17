'use strict';
/**
 * ProviderSessionService
 *
 * Session persistence operations extracted from SecondaryTerminalProvider.
 * Handles saving and restoring terminal sessions.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.ProviderSessionService = void 0;
const logger_1 = require('../../utils/logger');
const common_1 = require('../../utils/common');
const TimingConstants_1 = require('../../constants/TimingConstants');
class ProviderSessionService {
  constructor(deps) {
    this.deps = deps;
  }
  /**
   * Save the current session state
   */
  async saveCurrentSession() {
    if (!this.deps.extensionPersistenceService) {
      (0, logger_1.provider)('⚠️ [PERSISTENCE] Persistence service not available');
      return false;
    }
    try {
      (0, logger_1.provider)('💾 [PERSISTENCE] Saving current session...');
      const terminals = this.deps.getTerminals();
      const response = await this.deps.extensionPersistenceService.saveCurrentSession();
      if (response.success) {
        (0, logger_1.provider)(
          `✅ [PERSISTENCE] Session saved successfully: ${terminals.length} terminals`
        );
        return true;
      } else {
        (0, logger_1.provider)(`❌ [PERSISTENCE] Session save failed: ${response.error}`);
        return false;
      }
    } catch (error) {
      (0, logger_1.provider)(`❌ [PERSISTENCE] Save session error: ${error}`);
      return false;
    }
  }
  /**
   * Restore the last saved session
   */
  async restoreLastSession() {
    if (!this.deps.extensionPersistenceService) {
      (0, logger_1.provider)('⚠️ [PERSISTENCE] Persistence service not available');
      return false;
    }
    try {
      (0, logger_1.provider)('💾 [PERSISTENCE] Restoring last session...');
      const sessionResult = await this.deps.extensionPersistenceService.restoreSession();
      if (!sessionResult?.terminals?.length) {
        (0, logger_1.provider)('📦 [PERSISTENCE] No terminals to restore');
        return false;
      }
      (0, logger_1.provider)(
        `📦 [PERSISTENCE] Found ${sessionResult.terminals.length} terminals to restore`
      );
      const terminalMappings = [];
      const restoredTerminals = [];
      for (const terminalData of sessionResult.terminals) {
        try {
          const newTerminalId = this.deps.createTerminal();
          restoredTerminals.push(newTerminalId);
          terminalMappings.push({
            oldId: terminalData.id,
            newId: newTerminalId,
            terminalData,
          });
          (0, logger_1.provider)(
            `✅ [PERSISTENCE] Restored terminal: ${terminalData.name} (${newTerminalId})`
          );
        } catch (error) {
          (0, logger_1.provider)(
            `❌ [PERSISTENCE] Failed to restore terminal ${terminalData.name}:`,
            error
          );
        }
      }
      if (restoredTerminals.length > 0) {
        const fontSettings = this.deps.getCurrentFontSettings();
        // Send terminal creation notifications
        for (const mapping of terminalMappings) {
          await this.deps.sendMessage({
            command: 'terminalCreated',
            terminal: {
              id: mapping.newId,
              name: mapping.terminalData.name || `Terminal ${mapping.newId}`,
              cwd: mapping.terminalData.cwd || (0, common_1.safeProcessCwd)(),
              isActive: mapping.terminalData.isActive || false,
            },
            fontSettings,
          });
        }
        await new Promise((resolve) =>
          setTimeout(resolve, TimingConstants_1.TIMING_CONSTANTS.WEBVIEW_INIT_DELAY_MS)
        );
        // Restore scrollback
        for (const mapping of terminalMappings) {
          if (
            mapping.terminalData.scrollback &&
            Array.isArray(mapping.terminalData.scrollback) &&
            mapping.terminalData.scrollback.length > 0
          ) {
            await this.deps.sendMessage({
              command: 'restoreScrollback',
              terminalId: mapping.newId,
              scrollback: mapping.terminalData.scrollback,
            });
          }
        }
        (0, logger_1.provider)(`✅ [PERSISTENCE] Restored ${restoredTerminals.length} terminals`);
        return true;
      }
      return false;
    } catch (error) {
      (0, logger_1.provider)(`❌ [PERSISTENCE] Restore session error: ${error}`);
      return false;
    }
  }
}
exports.ProviderSessionService = ProviderSessionService;
//# sourceMappingURL=ProviderSessionService.js.map
