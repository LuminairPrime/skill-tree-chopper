"use strict";
/**
 * ResizeCoordinator
 *
 * ターミナルのリサイズ処理を一元管理するコーディネーター
 * LightweightTerminalWebviewManagerから抽出された責務:
 * - ResizeObserverの管理
 * - ウィンドウリサイズイベントの処理
 * - ターミナルのrefit処理
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResizeCoordinator = void 0;
const logger_1 = require("../../utils/logger");
const DOMUtils_1 = require("../utils/DOMUtils");
const DebouncedEventBuffer_1 = require("../utils/DebouncedEventBuffer");
const webview_1 = require("../constants/webview");
class ResizeCoordinator {
    constructor(deps) {
        this.deps = deps;
        this.parentResizeObserver = null;
        this.bodyResizeObserver = null;
        this.isInitialized = false;
        this.boundWindowResizeHandler = () => this.windowResizeDebouncer.trigger();
        // Initialize debouncers with appropriate delays
        this.parentResizeDebouncer = new DebouncedEventBuffer_1.Debouncer(() => {
            (0, logger_1.webview)(`📐 [RESIZE] Triggering refitAllTerminals after debounce`);
            this.refitAllTerminals();
        }, { delay: webview_1.RESIZE_COORDINATOR_CONSTANTS.PARENT_RESIZE_DEBOUNCE_MS, name: 'parentResize' });
        this.windowResizeDebouncer = new DebouncedEventBuffer_1.Debouncer(() => {
            (0, logger_1.webview)('📐 Window resize detected - refitting all terminals');
            this.refitAllTerminals();
        }, { delay: webview_1.RESIZE_COORDINATOR_CONSTANTS.WINDOW_RESIZE_DEBOUNCE_MS, name: 'windowResize' });
        this.bodyResizeDebouncer = new DebouncedEventBuffer_1.Debouncer(() => {
            (0, logger_1.webview)('📐 Body resize detected - refitting all terminals');
            this.refitAllTerminals();
        }, { delay: webview_1.RESIZE_COORDINATOR_CONSTANTS.BODY_RESIZE_DEBOUNCE_MS, name: 'bodyResize' });
        (0, logger_1.webview)('✅ ResizeCoordinator initialized');
    }
    /**
     * リサイズ監視を開始
     */
    initialize() {
        if (this.isInitialized) {
            return;
        }
        this.setupWindowResizeListener();
        this.setupBodyResizeObserver();
        this.isInitialized = true;
        (0, logger_1.webview)('✅ ResizeCoordinator fully initialized');
    }
    /**
     * ターミナル親コンテナのResizeObserverを設定
     */
    setupParentContainerResizeObserver() {
        const terminalBody = document.getElementById('terminal-body');
        if (!terminalBody) {
            (0, logger_1.webview)('⚠️ terminal-body not found for parent ResizeObserver');
            return;
        }
        (0, logger_1.webview)('🔧 Setting up ResizeObserver on document.body, terminal-body, and terminals-wrapper');
        this.parentResizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                const targetId = entry.target.id || 'body';
                (0, logger_1.webview)(`📐 [RESIZE] ${targetId} resized: ${width}x${height}`);
                this.parentResizeDebouncer.trigger();
            }
        });
        this.parentResizeObserver.observe(document.body);
        this.parentResizeObserver.observe(terminalBody);
        const terminalsWrapper = document.getElementById('terminals-wrapper');
        if (terminalsWrapper) {
            this.parentResizeObserver.observe(terminalsWrapper);
            (0, logger_1.webview)('✅ ResizeObserver also observing terminals-wrapper');
        }
        (0, logger_1.webview)('✅ Parent container ResizeObserver setup complete');
    }
    /**
     * ウィンドウリサイズリスナーを設定
     */
    setupWindowResizeListener() {
        window.addEventListener('resize', this.boundWindowResizeHandler);
        (0, logger_1.webview)('🔍 Window resize listener added');
    }
    /**
     * ボディリサイズオブザーバーを設定
     */
    setupBodyResizeObserver() {
        this.bodyResizeObserver = new ResizeObserver(() => this.bodyResizeDebouncer.trigger());
        this.bodyResizeObserver.observe(document.body);
        (0, logger_1.webview)('🔍 Body ResizeObserver added');
    }
    /**
     * Refit all terminals using double-fit pattern with PTY notification.
     * Uses VS Code pattern: reset styles -> fit() -> wait frame -> fit() -> notify PTY
     */
    refitAllTerminals() {
        try {
            const terminals = this.deps.getTerminals();
            // Reset all container styles before any fit() calls
            terminals.forEach((terminalData) => {
                if (terminalData.container) {
                    DOMUtils_1.DOMUtils.resetXtermInlineStyles(terminalData.container, false);
                }
            });
            DOMUtils_1.DOMUtils.forceReflow();
            requestAnimationFrame(() => {
                terminals.forEach((terminalData, terminalId) => {
                    if (!terminalData.fitAddon || !terminalData.terminal || !terminalData.container) {
                        return;
                    }
                    try {
                        const container = terminalData.container;
                        // First fit: reset styles and fit
                        DOMUtils_1.DOMUtils.resetXtermInlineStyles(container, true);
                        terminalData.fitAddon.fit();
                        // Second fit: ensures canvas updates correctly (Issue #368)
                        // PTY notification must occur AFTER second fit for accurate dimensions
                        requestAnimationFrame(() => {
                            // Guard: Exit early if terminal was disposed during async operation
                            if (!terminalData || !terminalData.terminal || !terminalData.fitAddon) {
                                return;
                            }
                            DOMUtils_1.DOMUtils.resetXtermInlineStyles(container, true);
                            terminalData.fitAddon.fit();
                            const newCols = terminalData.terminal.cols;
                            const newRows = terminalData.terminal.rows;
                            if (typeof terminalData.terminal.refresh === 'function') {
                                const lastRow = Math.max(newRows - 1, 0);
                                terminalData.terminal.refresh(0, lastRow);
                            }
                            if (this.deps.notifyResize) {
                                this.deps.notifyResize(terminalId, newCols, newRows);
                                (0, logger_1.webview)(`📨 PTY resize: ${terminalId} (${newCols}x${newRows})`);
                            }
                            (0, logger_1.webview)(`✅ Terminal ${terminalId} refitted: ${newCols}x${newRows}`);
                        });
                    }
                    catch (error) {
                        (0, logger_1.webview)(`⚠️ Failed to refit terminal ${terminalId}:`, error);
                    }
                });
            });
        }
        catch (error) {
            (0, logger_1.webview)('❌ Error refitting all terminals:', error);
        }
    }
    /**
     * パネル位置変更イベントリスナーを設定
     */
    setupPanelLocationListener() {
        window.addEventListener('terminal-panel-location-changed', () => {
            (0, logger_1.webview)('📍 Panel location changed event received - refitting all terminals');
            this.refitAllTerminals();
        });
        (0, logger_1.webview)('🔍 Panel location change listener added');
    }
    /**
     * リソース解放
     */
    dispose() {
        if (this.parentResizeObserver) {
            this.parentResizeObserver.disconnect();
            this.parentResizeObserver = null;
        }
        if (this.bodyResizeObserver) {
            this.bodyResizeObserver.disconnect();
            this.bodyResizeObserver = null;
        }
        // Remove window resize listener
        window.removeEventListener('resize', this.boundWindowResizeHandler);
        // Dispose debouncers (cancels pending operations and cleans up timers)
        this.parentResizeDebouncer.dispose();
        this.windowResizeDebouncer.dispose();
        this.bodyResizeDebouncer.dispose();
        this.isInitialized = false;
        (0, logger_1.webview)('✅ ResizeCoordinator disposed');
    }
}
exports.ResizeCoordinator = ResizeCoordinator;
//# sourceMappingURL=ResizeCoordinator.js.map