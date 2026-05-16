"use strict";
/**
 * CLI Agent State Manager
 *
 * CLI Agent（Claude Code、Gemini Code等）の状態管理を担当
 * 責務：エージェント状態追跡、接続管理、出力検出、状態同期
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CliAgentStateManager = void 0;
const logger_1 = require("../../utils/logger");
/**
 * CLI Agent状態管理クラス
 * 各ターミナルのCLI Agent状態を追跡・管理
 */
class CliAgentStateManager {
    constructor() {
        // ターミナル毎のCLI Agent状態
        this.cliAgentStates = new Map();
        this.currentConnectedAgentId = null;
        // エージェント出力検出パターン
        this.AGENT_OUTPUT_PATTERNS = [
            /Claude\s+Code/, // "Claude Code" (大文字のみ)
            /gemini.*code/i,
            /Thinking|Processing|Analyzing/i,
            /Select|Choose|Option/i,
        ];
        // エージェント種別検出パターン
        this.AGENT_TYPE_PATTERNS = {
            claude: /Claude\s+Code/, // "Claude Code" (大文字のみ)
            gemini: /gemini.*code/i,
            generic: /AI|Assistant|Agent/i,
        };
        (0, logger_1.webview)('🤖 CliAgentStateManager initialized');
    }
    /**
     * ターミナルのCLI Agent状態を取得
     */
    getAgentState(terminalId) {
        return this.cliAgentStates.get(terminalId) || null;
    }
    /**
     * ターミナルのCLI Agent状態を設定
     */
    setAgentState(terminalId, state) {
        const currentState = this.cliAgentStates.get(terminalId);
        const newState = {
            status: 'none',
            terminalName: `Terminal ${terminalId}`,
            agentType: null,
            preserveScrollPosition: false,
            isDisplayingChoices: false,
            lastChoiceDetected: undefined,
            ...currentState,
            ...state,
        };
        this.cliAgentStates.set(terminalId, newState);
        // 接続状態の更新
        if (newState.status === 'connected') {
            this.currentConnectedAgentId = terminalId;
        }
        else if (this.currentConnectedAgentId === terminalId) {
            this.currentConnectedAgentId = null;
        }
        (0, logger_1.webview)(`🔄 Agent state updated for terminal ${terminalId}:`, newState);
    }
    /**
     * 現在接続中のエージェントIDを取得
     */
    getCurrentConnectedAgentId() {
        return this.currentConnectedAgentId;
    }
    /**
     * 全てのCLI Agent状態を取得
     */
    getAllAgentStates() {
        return new Map(this.cliAgentStates);
    }
    /**
     * 出力からCLI Agentアクティビティを検出
     */
    detectAgentActivity(output, terminalId) {
        try {
            // エージェント出力かチェック
            const isAgentOutput = this.AGENT_OUTPUT_PATTERNS.some((pattern) => pattern.test(output));
            // エージェント種別を検出
            let agentType = null;
            for (const [type, pattern] of Object.entries(this.AGENT_TYPE_PATTERNS)) {
                if (pattern.test(output)) {
                    agentType = type;
                    break;
                }
            }
            // 選択肢表示の検出
            const isDisplayingChoices = /Select|Choose|Option|\[1\]|\[2\]|\[3\]/i.test(output);
            // 状態を更新
            if (isAgentOutput) {
                const currentState = this.getAgentState(terminalId);
                this.setAgentState(terminalId, {
                    status: 'connected',
                    agentType: agentType || currentState?.agentType || 'generic',
                    isDisplayingChoices,
                    lastChoiceDetected: isDisplayingChoices ? Date.now() : currentState?.lastChoiceDetected,
                });
            }
            return {
                isAgentOutput,
                agentType,
                isDisplayingChoices,
            };
        }
        catch (error) {
            (0, logger_1.webview)(`❌ Failed to detect agent activity for terminal ${terminalId}:`, error);
            return {
                isAgentOutput: false,
                agentType: null,
                isDisplayingChoices: false,
            };
        }
    }
    /**
     * エージェントの接続状態を設定
     */
    setAgentConnected(terminalId, agentType, terminalName) {
        this.setAgentState(terminalId, {
            status: 'connected',
            agentType,
            terminalName: terminalName || `Terminal ${terminalId}`,
            preserveScrollPosition: true,
        });
        (0, logger_1.webview)(`🔗 Agent connected: ${agentType} in terminal ${terminalId}`);
    }
    /**
     * エージェントの切断状態を設定
     */
    setAgentDisconnected(terminalId) {
        const currentState = this.getAgentState(terminalId);
        if (currentState) {
            this.setAgentState(terminalId, {
                status: 'disconnected',
                preserveScrollPosition: false,
                isDisplayingChoices: false,
            });
            (0, logger_1.webview)(`✨ Agent disconnected in terminal ${terminalId}`);
        }
    }
    /**
     * エージェント状態をクリア
     */
    clearAgentState(terminalId) {
        this.setAgentState(terminalId, {
            status: 'none',
            agentType: null,
            preserveScrollPosition: false,
            isDisplayingChoices: false,
            lastChoiceDetected: undefined,
        });
        (0, logger_1.webview)(`🧹 Agent state cleared for terminal ${terminalId}`);
    }
    /**
     * ターミナル削除時のクリーンアップ
     */
    removeTerminalState(terminalId) {
        if (this.currentConnectedAgentId === terminalId) {
            this.currentConnectedAgentId = null;
        }
        this.cliAgentStates.delete(terminalId);
        (0, logger_1.webview)(`🗑️ Agent state removed for terminal ${terminalId}`);
    }
    /**
     * エージェントが選択肢を表示中かチェック
     */
    isAgentDisplayingChoices(terminalId) {
        const state = this.getAgentState(terminalId);
        return state?.isDisplayingChoices === true;
    }
    /**
     * エージェントのスクロール位置保持が必要かチェック
     */
    shouldPreserveScrollPosition(terminalId) {
        const state = this.getAgentState(terminalId);
        return state?.preserveScrollPosition === true;
    }
    /**
     * エージェント状態の統計情報
     */
    getAgentStats() {
        const states = Array.from(this.cliAgentStates.values());
        const agentTypes = Array.from(new Set(states.map((state) => state.agentType).filter((type) => type !== null)));
        return {
            totalAgents: this.cliAgentStates.size,
            connectedAgents: states.filter((state) => state.status === 'connected').length,
            disconnectedAgents: states.filter((state) => state.status === 'disconnected').length,
            currentConnectedId: this.currentConnectedAgentId,
            agentTypes,
        };
    }
    /**
     * エージェント状態をExtension向けに同期
     */
    getStateForExtension(terminalId) {
        const state = this.getAgentState(terminalId);
        if (!state) {
            return null;
        }
        return {
            activeTerminalName: state.terminalName,
            status: state.status,
            agentType: state.agentType,
            terminalId,
        };
    }
    /**
     * 全エージェントの完全状態同期データを取得
     */
    getFullStateSync() {
        return {
            allAgents: new Map(this.cliAgentStates),
            currentConnectedId: this.currentConnectedAgentId,
            timestamp: Date.now(),
        };
    }
    /**
     * 設定された状態から完全同期を実行
     */
    applyFullStateSync(syncData) {
        try {
            // 既存状態をクリア
            this.cliAgentStates.clear();
            // 新しい状態を適用
            for (const [terminalId, state] of syncData.allAgents) {
                this.cliAgentStates.set(terminalId, state);
            }
            this.currentConnectedAgentId = syncData.currentConnectedId;
            (0, logger_1.webview)('🔄 Full agent state sync applied');
        }
        catch (error) {
            (0, logger_1.webview)('❌ Failed to apply full agent state sync:', error);
        }
    }
    /**
     * リソースのクリーンアップ
     */
    dispose() {
        (0, logger_1.webview)('🧹 Disposing CliAgentStateManager...');
        this.cliAgentStates.clear();
        this.currentConnectedAgentId = null;
        (0, logger_1.webview)('✅ CliAgentStateManager disposed');
    }
}
exports.CliAgentStateManager = CliAgentStateManager;
//# sourceMappingURL=CliAgentStateManager.js.map