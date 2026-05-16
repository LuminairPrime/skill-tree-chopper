"use strict";
/**
 * 統一された設定アクセスサービス
 *
 * VS Code設定へのアクセスを集約し、キャッシュ機能付きで
 * 一貫性のある設定管理を提供します。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationService = void 0;
const vscode = require("vscode");
const logger_1 = require("../utils/logger");
const FeatureFlagService_1 = require("../services/FeatureFlagService");
const SystemConstants_1 = require("../constants/SystemConstants");
const DisposableBase_1 = require("../patterns/DisposableBase");
/**
 * 統一された設定サービス
 *
 * DisposableBaseを継承してリソース管理を標準化
 */
class ConfigurationService extends DisposableBase_1.DisposableBase {
    constructor() {
        super();
        this.configCache = new Map();
        this.changeHandlers = new Set();
        this.featureFlagService = new FeatureFlagService_1.FeatureFlagService();
        this.setupConfigurationWatcher();
        // Register cleanup actions for collections
        this.registerCleanup(() => this.configCache.clear());
        this.registerCleanup(() => this.changeHandlers.clear());
    }
    /**
     * シングルトンインスタンスを取得
     */
    static getInstance() {
        if (!this.instance) {
            this.instance = new ConfigurationService();
        }
        return this.instance;
    }
    /**
     * Additional cleanup specific to this service
     */
    doDispose() {
        this.featureFlagService.dispose();
        (0, logger_1.extension)('🧹 [ConfigurationService] Disposed');
    }
    // === VS Code設定セクション取得 ===
    /**
     * Secondary Terminal設定を取得
     */
    getSecondaryTerminalConfig() {
        return vscode.workspace.getConfiguration('secondaryTerminal');
    }
    /**
     * Terminal統合設定を取得
     */
    getTerminalIntegratedConfig() {
        return vscode.workspace.getConfiguration('terminal.integrated');
    }
    /**
     * エディター設定を取得
     */
    getEditorConfig() {
        return vscode.workspace.getConfiguration('editor');
    }
    /**
     * ワークベンチ設定を取得
     */
    getWorkbenchConfig() {
        return vscode.workspace.getConfiguration('workbench');
    }
    // === Feature Flag アクセス ===
    /**
     * Feature Flag Service を取得
     */
    getFeatureFlagService() {
        return this.featureFlagService;
    }
    /**
     * Enhanced scrollback persistence が有効かどうか
     */
    isEnhancedScrollbackEnabled() {
        return this.featureFlagService.isEnhancedScrollbackEnabled();
    }
    /**
     * Scrollback line limit を取得
     */
    getScrollbackLineLimit() {
        return this.featureFlagService.getScrollbackLineLimit();
    }
    /**
     * VS Code standard IME が有効かどうか
     */
    isVSCodeStandardIMEEnabled() {
        return this.featureFlagService.isVSCodeStandardIMEEnabled();
    }
    /**
     * VS Code keyboard shortcuts が有効かどうか
     */
    isVSCodeKeyboardShortcutsEnabled() {
        return this.featureFlagService.isVSCodeKeyboardShortcutsEnabled();
    }
    /**
     * VS Code standard cursor が有効かどうか
     */
    isVSCodeStandardCursorEnabled() {
        return this.featureFlagService.isVSCodeStandardCursorEnabled();
    }
    /**
     * Full ANSI support が有効かどうか
     */
    isFullANSISupportEnabled() {
        return this.featureFlagService.isFullANSISupportEnabled();
    }
    // === キャッシュ付き設定値取得 ===
    /**
     * キャッシュ付きで設定値を取得
     */
    getCachedValue(section, key, defaultValue) {
        const cacheKey = `${section}.${key}`;
        if (this.configCache.has(cacheKey)) {
            return this.configCache.get(cacheKey);
        }
        const value = vscode.workspace.getConfiguration(section).get(key, defaultValue);
        this.configCache.set(cacheKey, value);
        return value;
    }
    /**
     * 設定値を強制的に再読み込み
     */
    refreshValue(section, key, defaultValue) {
        const cacheKey = `${section}.${key}`;
        this.configCache.delete(cacheKey);
        return this.getCachedValue(section, key, defaultValue);
    }
    /**
     * 複数の設定値をバッチで取得
     */
    getBatchValues(configs) {
        const result = {};
        for (const config of configs) {
            const fullKey = `${config.section}.${config.key}`;
            result[fullKey] = this.getCachedValue(config.section, config.key, config.defaultValue);
        }
        return result;
    }
    // === 具体的な設定値取得メソッド ===
    /**
     * Terminal関連設定を取得
     */
    getTerminalSettings() {
        return {
            // Secondary Terminal設定
            maxTerminals: this.getCachedValue('secondaryTerminal', 'maxTerminals', SystemConstants_1.TERMINAL_CONSTANTS.MAX_TERMINAL_COUNT),
            shell: this.getCachedValue('secondaryTerminal', 'shell', ''),
            shellArgs: this.getCachedValue('secondaryTerminal', 'shellArgs', []),
            cwd: this.getCachedValue('secondaryTerminal', 'cwd', ''),
            env: this.getCachedValue('secondaryTerminal', 'env', {}),
            // フォント設定
            fontFamily: this.getCachedValue('secondaryTerminal', 'fontFamily', "Menlo, Monaco, 'Courier New', monospace"),
            fontSize: this.getCachedValue('secondaryTerminal', 'fontSize', 12),
            lineHeight: this.getCachedValue('secondaryTerminal', 'lineHeight', 1.2),
            // 表示設定
            cursorBlink: this.getCachedValue('secondaryTerminal', 'cursorBlink', true),
            cursorStyle: this.getCachedValue('secondaryTerminal', 'cursorStyle', 'block'),
            cursorWidth: this.getCachedValue('secondaryTerminal', 'cursorWidth', 1),
            theme: this.getCachedValue('secondaryTerminal', 'theme', 'dark'),
            drawBoldTextInBrightColors: this.getCachedValue('secondaryTerminal', 'drawBoldTextInBrightColors', true),
            minimumContrastRatio: this.getCachedValue('secondaryTerminal', 'minimumContrastRatio', 1),
            // ヘッダー設定
            showHeader: this.getCachedValue('secondaryTerminal', 'showHeader', true),
            headerTitle: this.getCachedValue('secondaryTerminal', 'headerTitle', 'Terminal'),
            // パフォーマンス設定
            scrollback: this.getCachedValue('secondaryTerminal', 'scrollback', 1000),
            fastScrollModifier: this.getCachedValue('secondaryTerminal', 'fastScrollModifier', 'alt'),
            // CLI Agent設定
            enableCliAgentIntegration: this.getCachedValue('secondaryTerminal', 'enableCliAgentIntegration', true),
            enableGitHubCopilotIntegration: this.getCachedValue('secondaryTerminal', 'enableGitHubCopilotIntegration', true),
            activeBorderMode: this.getCachedValue('secondaryTerminal', 'activeBorderMode', 'multipleOnly'),
        };
    }
    /**
     * Alt+Click関連設定を取得
     */
    getAltClickSettings() {
        return {
            altClickMovesCursor: this.getCachedValue('terminal.integrated', 'altClickMovesCursor', true),
            multiCursorModifier: this.getCachedValue('editor', 'multiCursorModifier', 'alt'),
        };
    }
    /**
     * 永続化セッション設定を取得
     */
    getPersistentSessionSettings() {
        return {
            enablePersistentSessions: this.getCachedValue('terminal.integrated', 'enablePersistentSessions', true),
            persistentSessionScrollback: this.getCachedValue('terminal.integrated', 'persistentSessionScrollback', 100),
            persistentSessionReviveProcess: this.getCachedValue('terminal.integrated', 'persistentSessionReviveProcess', 'onExitAndWindowClose'),
        };
    }
    /**
     * テーマ関連設定を取得
     */
    getThemeSettings() {
        return {
            colorTheme: this.getCachedValue('workbench', 'colorTheme', 'Default Dark Modern'),
            iconTheme: this.getCachedValue('workbench', 'iconTheme', 'vs-seti'),
            preferredDarkColorTheme: this.getCachedValue('workbench', 'preferredDarkColorTheme', 'Default Dark Modern'),
            preferredLightColorTheme: this.getCachedValue('workbench', 'preferredLightColorTheme', 'Default Light Modern'),
        };
    }
    // === 設定値更新 ===
    /**
     * 設定値を更新
     */
    async updateValue(section, key, value, target = vscode.ConfigurationTarget.Workspace) {
        try {
            await vscode.workspace.getConfiguration(section).update(key, value, target);
            // キャッシュを更新
            const cacheKey = `${section}.${key}`;
            this.configCache.set(cacheKey, value);
            (0, logger_1.extension)(`✅ [CONFIG] Updated ${section}.${key} = ${JSON.stringify(value)}`);
        }
        catch (error) {
            (0, logger_1.extension)(`❌ [CONFIG] Failed to update ${section}.${key}: ${String(error)}`);
            throw error;
        }
    }
    /**
     * 複数の設定値をバッチで更新
     */
    async updateBatchValues(updates) {
        const errors = [];
        for (const update of updates) {
            try {
                await this.updateValue(update.section, update.key, update.value, update.target || vscode.ConfigurationTarget.Workspace);
            }
            catch (error) {
                errors.push(`${update.section}.${update.key}: ${String(error)}`);
            }
        }
        if (errors.length > 0) {
            throw new Error(`Batch update failed for: ${errors.join(', ')}`);
        }
    }
    // === 設定変更監視 ===
    /**
     * 設定変更ハンドラーを追加
     */
    onConfigurationChanged(handler) {
        this.changeHandlers.add(handler);
        return {
            dispose: () => {
                this.changeHandlers.delete(handler);
            },
        };
    }
    /**
     * 特定セクションの設定変更を監視
     */
    onSectionChanged(section, handler) {
        return this.onConfigurationChanged((changedSection, key, newValue, oldValue) => {
            if (changedSection === section) {
                handler(key, newValue, oldValue);
            }
        });
    }
    // === プライベートメソッド ===
    /**
     * 設定変更ウォッチャーを設定
     */
    setupConfigurationWatcher() {
        const disposable = vscode.workspace.onDidChangeConfiguration((event) => {
            // 関連セクションのキャッシュをクリア
            const sectionsToWatch = ['secondaryTerminal', 'terminal.integrated', 'editor', 'workbench'];
            for (const section of sectionsToWatch) {
                if (event.affectsConfiguration(section)) {
                    this.clearSectionCache(section);
                    // 変更ハンドラーに通知
                    this.notifyConfigurationChange(section, event);
                }
            }
        });
        // Use DisposableBase's registerDisposable instead of manual array
        this.registerDisposable(disposable);
    }
    /**
     * セクションのキャッシュをクリア
     */
    clearSectionCache(section) {
        const keysToDelete = [];
        this.configCache.forEach((_value, key) => {
            if (key.startsWith(`${section}.`)) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach((key) => this.configCache.delete(key));
        (0, logger_1.extension)(`🧹 [CONFIG] Cleared cache for section: ${section}`);
    }
    /**
     * 設定変更をハンドラーに通知
     */
    notifyConfigurationChange(section, _event) {
        // 簡単な実装: セクション全体が変更されたと通知
        // より詳細な実装では、個別のキー変更を検出
        this.changeHandlers.forEach((handler) => {
            handler(section, '*', null, null);
        });
    }
}
exports.ConfigurationService = ConfigurationService;
//# sourceMappingURL=ConfigurationService.js.map