"use strict";
/**
 * TerminalOperationsCoordinator
 *
 * ターミナルのCRUD操作を一元管理するコーディネーター
 * LightweightTerminalWebviewManagerから抽出された責務:
 * - ターミナル作成（安全な作成、キュー管理）
 * - ターミナル削除（トラッキング、同期）
 * - 削除待機中の作成リクエストのキュー管理
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalOperationsCoordinator = void 0;
const logger_1 = require("../../utils/logger");
const webview_1 = require("../constants/webview");
// ============================================================================
// Constants
// ============================================================================
/**
 * Timing constants for terminal operations
 */
const OperationTimings = {
    /** Delay before saving session after creation/deletion (ms) */
    SESSION_SAVE_DELAY_MS: 100,
    /** Delay before focusing terminal after creation (ms) */
    FOCUS_DELAY_MS: 25,
    /** Retry delay when creation is blocked (ms) */
    CREATION_RETRY_DELAY_MS: 500,
    /** Timeout for queued creation requests (ms) */
    QUEUE_TIMEOUT_MS: 10000,
    /** Timeout for deletion tracking (ms) */
    DELETION_TRACKING_TIMEOUT_MS: 5000,
};
class TerminalOperationsCoordinator {
    constructor(deps) {
        this.deps = deps;
        // 作成中のターミナルID追跡
        this.pendingTerminalCreations = new Set();
        // 削除トラッキング
        this.deletionTracker = new Set();
        this.deletionTimeouts = new Map();
        // 作成リクエストキュー
        this.pendingCreationRequests = [];
        // 現在の状態キャッシュ
        this.currentTerminalState = null;
        (0, logger_1.webview)('✅ TerminalOperationsCoordinator initialized');
    }
    /**
     * 状態を更新
     */
    updateState(state) {
        this.currentTerminalState = state;
        this.handleStateUpdateWithDeletionSync(state);
    }
    /**
     * ターミナル作成が可能か確認
     */
    canCreateTerminal() {
        const maxTerminals = this.currentTerminalState?.maxTerminals ?? webview_1.SPLIT_CONSTANTS.MAX_TERMINALS;
        const localCount = this.deps.getTerminalCount();
        const pending = this.pendingTerminalCreations.size;
        if (!this.currentTerminalState) {
            (0, logger_1.webview)('⚠️ [STATE] No cached state available for creation check, using local count');
            return localCount + pending < maxTerminals;
        }
        if (this.currentTerminalState.availableSlots.length > 0) {
            return true;
        }
        return localCount + pending < maxTerminals;
    }
    /**
     * 次に利用可能なターミナル番号を取得
     */
    getNextAvailableNumber() {
        if (!this.currentTerminalState || this.currentTerminalState.availableSlots.length === 0) {
            return null;
        }
        return Math.min(...this.currentTerminalState.availableSlots);
    }
    /**
     * ターミナル作成（メインエントリーポイント）
     */
    async createTerminal(terminalId, terminalName, config, terminalNumber, requestSource = 'webview') {
        try {
            (0, logger_1.webview)(`🔍 [OPS] createTerminal called:`, { terminalId, terminalName, terminalNumber });
            // 重複作成防止
            if (this.pendingTerminalCreations.has(terminalId)) {
                (0, logger_1.webview)(`⏳ Terminal ${terminalId} creation already pending, skipping`);
                return this.deps.getTerminalInstance(terminalId)?.terminal ?? null;
            }
            // 既存チェック
            const existingInstance = this.deps.getTerminalInstance(terminalId);
            if (existingInstance) {
                (0, logger_1.webview)(`🔁 Terminal ${terminalId} already exists, reusing`);
                this.deps.setActiveTab(terminalId);
                return existingInstance.terminal ?? null;
            }
            // Split mode の確認
            await this.deps.ensureSplitModeBeforeCreation();
            // 作成可能チェック
            if (!this.canCreateTerminal() && requestSource !== 'extension') {
                const localCount = this.deps.getTerminalCount();
                const maxCount = this.currentTerminalState?.maxTerminals ?? webview_1.SPLIT_CONSTANTS.MAX_TERMINALS;
                (0, logger_1.webview)(`❌ Terminal creation blocked (local=${localCount}, max=${maxCount})`);
                this.deps.showWarning(`Terminal limit reached (${localCount}/${maxCount})`);
                return null;
            }
            // 作成開始をマーク
            this.pendingTerminalCreations.add(terminalId);
            try {
                // 実際のターミナル作成
                const terminal = await this.deps.createTerminalInstance(terminalId, terminalName, config, terminalNumber);
                if (!terminal) {
                    (0, logger_1.webview)(`❌ Failed to create terminal instance: ${terminalId}`);
                    return null;
                }
                // タブ追加
                this.deps.addTab(terminalId, terminalName, terminal);
                this.deps.setActiveTab(terminalId);
                // セッション保存
                setTimeout(() => {
                    this.deps.saveSession().then((success) => {
                        if (success) {
                            (0, logger_1.webview)(`💾 Session saved after terminal ${terminalId} creation`);
                        }
                    });
                }, OperationTimings.SESSION_SAVE_DELAY_MS);
                // アクティブ設定とボーダー更新
                this.deps.setActiveTerminalId(terminalId);
                this.deps.updateTerminalBorders(terminalId);
                // フォーカス
                setTimeout(() => {
                    this.deps.focusTerminal(terminalId);
                }, OperationTimings.FOCUS_DELAY_MS);
                // Extension にリクエスト送信
                if (requestSource === 'webview') {
                    this.deps.postMessageToExtension({
                        command: 'createTerminal',
                        terminalId,
                        terminalName,
                        timestamp: Date.now(),
                    });
                }
                (0, logger_1.webview)(`✅ Terminal creation completed: ${terminalId}`);
                // Split レイアウト更新
                this.deps.refreshSplitLayout();
                return terminal;
            }
            finally {
                this.pendingTerminalCreations.delete(terminalId);
            }
        }
        catch (error) {
            (0, logger_1.webview)(`❌ Error creating terminal ${terminalId}:`, error);
            this.pendingTerminalCreations.delete(terminalId);
            return null;
        }
    }
    /**
     * 安全なターミナル作成
     * 🔧 FIX: WebView側でIDを生成せず、Extension側に作成をリクエストするだけ
     * Extension側が作成したターミナルはstateUpdateメッセージで同期される
     */
    async createTerminalSafely(terminalName) {
        try {
            (0, logger_1.webview)('🛡️ [SAFE-CREATE] Starting safe terminal creation...');
            // 作成可能チェック
            if (!this.canCreateTerminal()) {
                const currentState = this.currentTerminalState;
                if (currentState) {
                    this.deps.showWarning(`Terminal limit reached (${currentState.terminals.length}/${currentState.maxTerminals})`);
                }
                return false;
            }
            // 削除待機中の場合はリクエストを遅延
            if (this.deletionTracker.size > 0) {
                (0, logger_1.webview)('⏳ [SAFE-CREATE] Deletion in progress, waiting before creation request...');
                // 作成再試行
                return new Promise((resolve) => {
                    setTimeout(() => {
                        this.createTerminalSafely(terminalName).then(resolve);
                    }, OperationTimings.CREATION_RETRY_DELAY_MS);
                });
            }
            // 🔧 FIX: IDを生成せず、Extension側に作成をリクエスト
            // Extension側がIDを生成し、terminalCreatedメッセージでWebViewに通知する
            this.deps.postMessageToExtension({
                command: 'createTerminal',
                // terminalId は Extension 側で生成するため送らない
                terminalName: terminalName,
                timestamp: Date.now(),
            });
            (0, logger_1.webview)(`✅ [SAFE-CREATE] Creation request sent to Extension`);
            return true;
        }
        catch (error) {
            (0, logger_1.webview)('❌ Error in safe terminal creation:', error);
            return false;
        }
    }
    /**
     * ターミナル作成をキューに追加
     * 🔧 FIX: IDはExtension側で生成されるため、WebView側ではIDを指定せず名前のみを保持
     */
    queueTerminalCreation(terminalName) {
        return new Promise((resolve, reject) => {
            const request = {
                id: `pending-${Date.now()}`, // 仮ID（Extension側で本当のIDが割り当てられる）
                name: terminalName,
                timestamp: Date.now(),
                resolve,
                reject,
            };
            this.pendingCreationRequests.push(request);
            (0, logger_1.webview)(`📥 [QUEUE] Queued terminal creation request`);
            // タイムアウト設定
            setTimeout(() => {
                const index = this.pendingCreationRequests.findIndex((r) => r.id === request.id);
                if (index !== -1) {
                    this.pendingCreationRequests.splice(index, 1);
                    reject(new Error('Terminal creation request timed out'));
                }
            }, OperationTimings.QUEUE_TIMEOUT_MS);
        });
    }
    /**
     * キューの処理
     * 🔧 FIX: IDはExtension側で生成されるため、WebView側ではIDを送らない
     */
    processPendingCreationRequests() {
        if (this.pendingCreationRequests.length === 0) {
            return;
        }
        (0, logger_1.webview)(`🔄 Processing ${this.pendingCreationRequests.length} pending creation requests`);
        const request = this.pendingCreationRequests.shift();
        if (!request)
            return;
        if (this.canCreateTerminal()) {
            (0, logger_1.webview)(`✅ Processing queued terminal creation request`);
            // 🔧 FIX: IDはExtension側で生成される
            this.deps.postMessageToExtension({
                command: 'createTerminal',
                terminalName: request.name,
                timestamp: Date.now(),
            });
            request.resolve(true);
        }
        else {
            (0, logger_1.webview)(`❌ Cannot create terminal yet, re-queueing request`);
            this.pendingCreationRequests.unshift(request);
            setTimeout(() => this.processPendingCreationRequests(), OperationTimings.CREATION_RETRY_DELAY_MS);
        }
    }
    /**
     * ターミナル削除
     */
    async removeTerminal(terminalId) {
        (0, logger_1.webview)(`🗑️ [REMOVAL] Starting removal for: ${terminalId}`);
        // CLI Agent 状態クリア
        this.deps.removeCliAgentState(terminalId);
        // タブ削除
        this.deps.removeTab(terminalId);
        // 実際の削除
        const removed = await this.deps.removeTerminalInstance(terminalId);
        (0, logger_1.webview)(`🗑️ Lifecycle removal result for ${terminalId}: ${removed}`);
        // セッション更新
        setTimeout(() => {
            this.deps.saveSession().then((success) => {
                if (success) {
                    (0, logger_1.webview)(`✅ Session updated after removal`);
                }
            });
        }, OperationTimings.SESSION_SAVE_DELAY_MS);
        return removed;
    }
    /**
     * 安全なターミナル削除
     */
    async deleteTerminalSafely(terminalId) {
        try {
            const targetId = terminalId || this.deps.getActiveTerminalId();
            if (!targetId) {
                (0, logger_1.webview)('❌ No terminal to delete');
                return false;
            }
            (0, logger_1.webview)(`🛡️ [SAFE-DELETE] Starting safe deletion: ${targetId}`);
            // 存在チェック
            const instance = this.deps.getTerminalInstance(targetId);
            if (!instance) {
                (0, logger_1.webview)(`❌ Terminal not found: ${targetId}`);
                return false;
            }
            // 最後のターミナル保護
            const stats = this.deps.getTerminalStats();
            if (stats.totalTerminals <= 1) {
                (0, logger_1.webview)(`🛡️ Cannot delete last terminal: ${targetId}`);
                this.deps.showWarning('Must keep at least 1 terminal open');
                return false;
            }
            // 表示モード準備
            this.deps.prepareDisplayForDeletion(targetId, stats);
            // 既に削除中かチェック
            if (this.isTerminalDeletionTracked(targetId)) {
                (0, logger_1.webview)(`⏳ Deletion already in progress: ${targetId}`);
                return false;
            }
            // 削除トラッキング開始
            this.trackTerminalDeletion(targetId);
            // Extension に削除リクエスト送信
            this.deps.postMessageToExtension({
                command: 'deleteTerminal',
                terminalId: targetId,
                requestSource: 'header',
                timestamp: Date.now(),
            });
            (0, logger_1.webview)(`✅ Deletion request sent: ${targetId}`);
            return true;
        }
        catch (error) {
            (0, logger_1.webview)('❌ Error in safe terminal deletion:', error);
            return false;
        }
    }
    // 削除トラッキング関連
    trackTerminalDeletion(terminalId) {
        this.deletionTracker.add(terminalId);
        const timeout = setTimeout(() => {
            this.clearTerminalDeletionTracking(terminalId);
        }, OperationTimings.DELETION_TRACKING_TIMEOUT_MS);
        this.deletionTimeouts.set(terminalId, timeout);
        (0, logger_1.webview)(`🎯 Started tracking deletion for: ${terminalId}`);
    }
    isTerminalDeletionTracked(terminalId) {
        return this.deletionTracker.has(terminalId);
    }
    clearTerminalDeletionTracking(terminalId) {
        this.deletionTracker.delete(terminalId);
        const timeout = this.deletionTimeouts.get(terminalId);
        if (timeout) {
            clearTimeout(timeout);
            this.deletionTimeouts.delete(terminalId);
        }
        (0, logger_1.webview)(`🎯 Cleared deletion tracking for: ${terminalId}`);
    }
    handleStateUpdateWithDeletionSync(state) {
        const trackedDeletions = Array.from(this.deletionTracker);
        for (const deletedTerminalId of trackedDeletions) {
            const stillExists = state.terminals.some((t) => t.id === deletedTerminalId);
            if (!stillExists) {
                (0, logger_1.webview)(`✅ Deletion confirmed for: ${deletedTerminalId}`);
                this.clearTerminalDeletionTracking(deletedTerminalId);
                this.processPendingCreationRequests();
            }
            else {
                (0, logger_1.webview)(`⏳ Terminal still exists, waiting: ${deletedTerminalId}`);
            }
        }
    }
    // システム状態
    hasPendingDeletions() {
        return this.deletionTracker.size > 0;
    }
    hasPendingCreations() {
        return this.pendingCreationRequests.length > 0;
    }
    getPendingDeletions() {
        return Array.from(this.deletionTracker);
    }
    getPendingCreationsCount() {
        return this.pendingCreationRequests.length;
    }
    // ターミナル作成追跡のパブリックAPI
    /**
     * ターミナル作成が進行中かチェック
     */
    isTerminalCreationPending(terminalId) {
        return this.pendingTerminalCreations.has(terminalId);
    }
    /**
     * ターミナル作成を進行中としてマーク
     */
    markTerminalCreationPending(terminalId) {
        this.pendingTerminalCreations.add(terminalId);
        (0, logger_1.webview)(`📝 Marked terminal creation as pending: ${terminalId}`);
    }
    /**
     * ターミナル作成の進行中マークをクリア
     */
    clearTerminalCreationPending(terminalId) {
        this.pendingTerminalCreations.delete(terminalId);
        (0, logger_1.webview)(`📝 Cleared terminal creation pending: ${terminalId}`);
    }
    /**
     * 強制同期
     */
    forceSynchronization() {
        (0, logger_1.webview)('🔄 Forcing synchronization...');
        this.deletionTracker.clear();
        this.deletionTimeouts.forEach((timeout) => clearTimeout(timeout));
        this.deletionTimeouts.clear();
        this.pendingCreationRequests.forEach((request) => {
            request.reject(new Error('System synchronization forced'));
        });
        this.pendingCreationRequests.length = 0;
        (0, logger_1.webview)('✅ Synchronization completed');
    }
    /**
     * リソース解放
     */
    dispose() {
        this.deletionTimeouts.forEach((timeout) => clearTimeout(timeout));
        this.deletionTimeouts.clear();
        this.deletionTracker.clear();
        this.pendingTerminalCreations.clear();
        this.pendingCreationRequests.length = 0;
        (0, logger_1.webview)('✅ TerminalOperationsCoordinator disposed');
    }
}
exports.TerminalOperationsCoordinator = TerminalOperationsCoordinator;
//# sourceMappingURL=TerminalOperationsCoordinator.js.map