"use strict";
/**
 * CLI Agent Status Service
 *
 * Extracted from UIManager for better maintainability.
 * Handles CLI Agent status display in terminal headers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CliAgentStatusService = void 0;
const HeaderFactory_1 = require("../../factories/HeaderFactory");
const ManagerLogger_1 = require("../../utils/ManagerLogger");
/**
 * Service for managing CLI Agent status display
 */
class CliAgentStatusService {
    constructor() {
        // Prevent rapid successive updates that could cause duplication
        this.lastUpdateTimestamp = 0;
        this.UPDATE_DEBOUNCE_MS = 100;
    }
    /**
     * Update CLI Agent status display in sidebar terminal headers (optimized)
     */
    updateCliAgentStatusDisplay(activeTerminalName, status, headerElementsCache, agentType = null) {
        // CLI Agentステータス更新は即座に処理する（デバウンスをスキップ）
        // 相互排他制御により短時間で複数のステータス変更が発生するため
        let updatedCount = 0;
        // キャッシュされたヘッダー要素を使用（高速）
        for (const [, headerElements] of headerElementsCache) {
            const terminalName = headerElements.nameSpan.textContent?.trim();
            const isTargetTerminal = terminalName === activeTerminalName;
            if (status === 'none') {
                // CLI Agent statusを削除 (全ターミナルから削除)
                HeaderFactory_1.HeaderFactory.removeCliAgentStatus(headerElements);
                // AI Agent切り替えボタンを常時表示 (none状態でも表示)
                HeaderFactory_1.HeaderFactory.setAiAgentToggleButtonVisibility(headerElements, true);
            }
            else if (isTargetTerminal) {
                // CLI Agent statusを挿入/更新 (該当ターミナルのみ)
                HeaderFactory_1.HeaderFactory.insertCliAgentStatus(headerElements, status, agentType);
                // AI Agent切り替えボタンを常時表示 (全ての状態で表示)
                HeaderFactory_1.HeaderFactory.setAiAgentToggleButtonVisibility(headerElements, true, status);
            }
            else {
                // AI Agentステータスがないターミナルでもボタンを表示
                HeaderFactory_1.HeaderFactory.setAiAgentToggleButtonVisibility(headerElements, true);
            }
            updatedCount++;
        }
        if (updatedCount > 0) {
            ManagerLogger_1.uiLogger.info(`CLI Agent status updated: ${activeTerminalName} -> ${status} (${updatedCount} terminals)`);
        }
    }
    /**
     * Update CLI Agent status by terminal ID (for Full State Sync)
     */
    updateCliAgentStatusByTerminalId(terminalId, status, headerElementsCache, agentType = null) {
        ManagerLogger_1.uiLogger.info(`Updating CLI Agent status: ${terminalId} -> ${status} (${agentType})`);
        // シンプルにステータス更新のみ実行 - 複雑な判定は省略
        const headerElements = headerElementsCache.get(terminalId);
        if (!headerElements) {
            ManagerLogger_1.uiLogger.warn(`No header elements found for terminal: ${terminalId}`);
            return;
        }
        // ステータスに応じてシンプルに更新
        if (status === 'connected') {
            HeaderFactory_1.HeaderFactory.insertCliAgentStatus(headerElements, 'connected', agentType);
            HeaderFactory_1.HeaderFactory.setAiAgentToggleButtonVisibility(headerElements, true, 'connected');
        }
        else if (status === 'disconnected') {
            HeaderFactory_1.HeaderFactory.insertCliAgentStatus(headerElements, 'disconnected', agentType);
            HeaderFactory_1.HeaderFactory.setAiAgentToggleButtonVisibility(headerElements, true, 'disconnected');
        }
        else {
            // none状態
            HeaderFactory_1.HeaderFactory.removeCliAgentStatus(headerElements);
            HeaderFactory_1.HeaderFactory.setAiAgentToggleButtonVisibility(headerElements, true);
        }
        ManagerLogger_1.uiLogger.info(`CLI Agent status updated for terminal ${terminalId}: ${status}`);
    }
    /**
     * Check if CLI Agent update should be processed (debouncing)
     */
    shouldProcessCliAgentUpdate() {
        const now = Date.now();
        if (now - this.lastUpdateTimestamp < this.UPDATE_DEBOUNCE_MS) {
            return false;
        }
        this.lastUpdateTimestamp = now;
        return true;
    }
}
exports.CliAgentStatusService = CliAgentStatusService;
//# sourceMappingURL=CliAgentStatusService.js.map