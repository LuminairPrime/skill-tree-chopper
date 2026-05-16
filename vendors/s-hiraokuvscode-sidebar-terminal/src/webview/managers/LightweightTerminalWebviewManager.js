"use strict";
/**
 * Lightweight Terminal WebView Manager
 *
 * 責務分離による軽量化されたWebViewマネージャー
 * 協調パターンを使用して各専門マネージャーを統合
 *
 * リファクタリング: コーディネーターパターンによる更なる責務分離
 * - TerminalOperationsCoordinator: ターミナルCRUD操作
 * - ResizeCoordinator: リサイズ処理
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LightweightTerminalWebviewManager = void 0;
const logger_1 = require("../../utils/logger");
// Coordinators (リファクタリングで抽出)
const TerminalOperationsCoordinator_1 = require("../coordinators/TerminalOperationsCoordinator");
const ResizeCoordinator_1 = require("../coordinators/ResizeCoordinator");
const CliAgentCoordinator_1 = require("../coordinators/CliAgentCoordinator");
const DebugCoordinator_1 = require("../coordinators/DebugCoordinator");
const SettingsCoordinator_1 = require("../coordinators/SettingsCoordinator");
const TerminalStateCoordinator_1 = require("../coordinators/TerminalStateCoordinator");
const PanelLocationController_1 = require("../coordinators/PanelLocationController");
const LightweightTerminalLifecycleCoordinator_1 = require("../coordinators/LightweightTerminalLifecycleCoordinator");
const LightweightTerminalInitializationCoordinator_1 = require("../coordinators/LightweightTerminalInitializationCoordinator");
const TerminalAccessorCoordinator_1 = require("../coordinators/TerminalAccessorCoordinator");
// Services
const FontSettingsService_1 = require("../services/FontSettingsService");
const TerminalAutoSaveService_1 = require("../services/terminal/TerminalAutoSaveService");
const NOOP_SHELL_INTEGRATION_MANAGER = {
    setCoordinator: () => { },
    handleMessage: () => { },
    dispose: () => { },
    initializeTerminalShellIntegration: () => { },
    decorateTerminalOutput: () => { },
    updateShellStatus: () => { },
    updateCwd: () => { },
    updateWorkingDirectory: () => { },
    showCommandHistory: () => { },
};
const SplitManager_1 = require("./SplitManager");
const SplitResizeManager_1 = require("./SplitResizeManager");
const WebViewApiManager_1 = require("./WebViewApiManager");
const TerminalLifecycleCoordinator_1 = require("./TerminalLifecycleCoordinator");
const CliAgentStateManager_1 = require("./CliAgentStateManager");
const EventHandlerManager_1 = require("./EventHandlerManager");
const ShellIntegrationManager_1 = require("./ShellIntegrationManager");
const FindInTerminalManager_1 = require("./FindInTerminalManager");
const ProfileManager_1 = require("./ProfileManager");
const TerminalContainerManager_1 = require("./TerminalContainerManager");
const DisplayModeManager_1 = require("./DisplayModeManager");
const HeaderManager_1 = require("./HeaderManager");
const DebugPanelManager_1 = require("./DebugPanelManager");
/**
 * 軽量化されたTerminalWebviewManager
 *
 * 主な改善点：
 * - 責務分離による専門マネージャー協調
 * - コーディネーターパターンによる更なる責務分離
 * - 拡張性とメンテナンス性の向上
 */
class LightweightTerminalWebviewManager {
    constructor() {
        this._onWindowFocus = null;
        this._onWindowBlur = null;
        this.splitResizeManager = null;
        this.persistenceManager = null;
        // ========================================
        // 状態
        // ========================================
        this.versionInfo = 'v0.1.0';
        this.forceNormalModeForNextCreate = false;
        this.forceFullscreenModeForNextCreate = false;
        this.isInitialized = false;
        this.currentTerminalState = null;
        this.currentSettings = {};
        this.hasProcessedInitialState = false;
        this.profileManagerInitTimer = null;
        // 🔧 FIX: Store ResizeObserver for cleanup
        this.parentResizeObserver = null;
        this.parentResizeTimer = null;
        (0, logger_1.webview)('🚀 RefactoredTerminalWebviewManager initializing...');
        // 専門マネージャーの初期化
        this.webViewApiManager = new WebViewApiManager_1.WebViewApiManager();
        this.splitManager = new SplitManager_1.SplitManager(this);
        this.terminalLifecycleManager = new TerminalLifecycleCoordinator_1.TerminalLifecycleCoordinator(this.splitManager, this);
        this.cliAgentStateManager = new CliAgentStateManager_1.CliAgentStateManager();
        this.eventHandlerManager = new EventHandlerManager_1.EventHandlerManager();
        this.panelLocationController = new PanelLocationController_1.PanelLocationController({
            messageManagerUpdatePanelLocationIfNeeded: () => this.messageManager?.updatePanelLocationIfNeeded() ?? false,
            messageManagerGetCurrentPanelLocation: () => this.messageManager?.getCurrentPanelLocation() ?? null,
            messageManagerGetCurrentFlexDirection: () => this.messageManager?.getCurrentFlexDirection() ?? null,
            splitManagerSetPanelLocation: (location) => this.splitManager.setPanelLocation(location),
            splitManagerUpdateSplitDirection: (direction, location) => this.splitManager.updateSplitDirection(direction, location),
            splitManagerGetTerminalCount: () => this.splitManager.getTerminals().size,
            displayModeManagerGetCurrentMode: () => this.displayModeManager?.getCurrentMode() ?? 'normal',
            displayModeManagerShowAllTerminalsSplit: () => this.displayModeManager?.showAllTerminalsSplit(),
        });
        this.findInTerminalManager = new FindInTerminalManager_1.FindInTerminalManager();
        this.profileManager = new ProfileManager_1.ProfileManager();
        try {
            this.shellIntegrationManager = new ShellIntegrationManager_1.ShellIntegrationManager();
        }
        catch (error) {
            console.error('Failed to initialize ShellIntegrationManager:', error);
            this.shellIntegrationManager = NOOP_SHELL_INTEGRATION_MANAGER;
        }
        // HeaderManager
        this.headerManager = new HeaderManager_1.HeaderManager();
        this.headerManager.setCoordinator(this);
        // DisplayModeManager と TerminalContainerManager
        this.terminalContainerManager = new TerminalContainerManager_1.TerminalContainerManager(this);
        this.displayModeManager = new DisplayModeManager_1.DisplayModeManager(this);
        // DebugPanelManager
        this.debugPanelManager = new DebugPanelManager_1.DebugPanelManager();
        // FontSettingsService (単一責任: フォント設定の一元管理)
        this.fontSettingsService = new FontSettingsService_1.FontSettingsService();
        (0, logger_1.webview)('✅ All managers initialized');
        // 既存マネージャーの初期化
        this.lightweightTerminalInitializationCoordinator =
            new LightweightTerminalInitializationCoordinator_1.LightweightTerminalInitializationCoordinator({
                managerCoordinator: this,
                getCurrentSettings: () => this.currentSettings,
                setCurrentSettings: (settings) => {
                    this.currentSettings = settings;
                },
                applySettings: (settings) => this.applySettings(settings),
                saveSettings: () => this.saveSettings(),
                ensureTerminalFocus: () => this.ensureTerminalFocus(),
                getAllTerminalInstances: () => this.getAllTerminalInstances(),
                getAllTerminalContainers: () => this.getAllTerminalContainers(),
                getActiveTerminalId: () => this.getActiveTerminalId(),
                getTerminalInstance: (id) => this.getTerminalInstance(id),
                createTerminal: (id, name) => this.createTerminal(id, name),
                getSystemStatus: () => this.getSystemStatus(),
                forceSynchronization: () => this.forceSynchronization(),
                requestLatestState: () => this.requestLatestState(),
                postMessageToExtension: (message) => this.postMessageToExtension(message),
                terminalLifecycleManager: this.terminalLifecycleManager,
                splitManager: this.splitManager,
                findInTerminalManager: this.findInTerminalManager,
                profileManager: this.profileManager,
                shellIntegrationManager: this.shellIntegrationManager,
                displayModeManager: this.displayModeManager,
                terminalContainerManager: this.terminalContainerManager,
                debugPanelManager: this.debugPanelManager,
                fontSettingsService: this.fontSettingsService,
                eventHandlerManager: this.eventHandlerManager,
                scheduleTimeout: (handler, timeout) => window.setTimeout(handler, timeout),
                settingsVersionInfo: () => this.versionInfo,
                disposeManager: () => this.dispose(),
            });
        this.initializeExistingManagers();
        this.initializeAccessorCoordinator();
        // コーディネーターの初期化
        this.initializeCoordinators();
        // SplitResizeManager の初期化
        this.initializeSplitResizeManager();
        // 設定読み込み
        this.loadSettings();
        // イベントハンドラーの設定
        this.setupEventHandlers();
        // InputManager設定
        this.setupInputManager();
        this.isInitialized = true;
        (0, logger_1.webview)('✅ RefactoredTerminalWebviewManager initialized');
    }
    // Panel location sync is now handled by PanelLocationController (initialized in constructor)
    /**
     * コーディネーターの初期化
     */
    initializeCoordinators() {
        // ResizeCoordinator
        this.resizeCoordinator = new ResizeCoordinator_1.ResizeCoordinator({
            getTerminals: () => this.splitManager.getTerminals(),
            // 🎯 VS Code Pattern: Notify PTY about terminal resize
            notifyResize: (terminalId, cols, rows) => {
                this.postMessageToExtension({
                    command: 'resize',
                    terminalId,
                    cols,
                    rows,
                });
            },
        });
        this.resizeCoordinator.initialize();
        this.resizeCoordinator.setupPanelLocationListener();
        // CliAgentCoordinator
        this.cliAgentCoordinator = new CliAgentCoordinator_1.CliAgentCoordinator({
            getAgentState: (id) => this.cliAgentStateManager.getAgentState(id),
            setAgentConnected: (id, agentType, terminalName) => this.cliAgentStateManager.setAgentConnected(id, agentType, terminalName),
            setAgentDisconnected: (id) => this.cliAgentStateManager.setAgentDisconnected(id),
            setAgentState: (id, state) => this.cliAgentStateManager.setAgentState(id, state),
            removeTerminalState: (id) => this.cliAgentStateManager.removeTerminalState(id),
            detectAgentActivity: (output, id) => this.cliAgentStateManager.detectAgentActivity(output, id),
            getActiveTerminalId: () => this.getActiveTerminalId(),
            getAllTerminalInstances: () => this.getAllTerminalInstances(),
            postMessageToExtension: (msg) => this.postMessageToExtension(msg),
            updateCliAgentStatusUI: (id, status, agentType) => this.uiManager.updateCliAgentStatusByTerminalId(id, status, agentType),
            getAgentStats: () => this.cliAgentStateManager.getAgentStats(),
            disposeStateManager: () => this.cliAgentStateManager.dispose(),
        });
        // TerminalOperationsCoordinator
        this.terminalOperations = new TerminalOperationsCoordinator_1.TerminalOperationsCoordinator({
            getActiveTerminalId: () => this.getActiveTerminalId(),
            setActiveTerminalId: (id) => this.terminalLifecycleManager.setActiveTerminalId(id),
            getTerminalInstance: (id) => this.getTerminalInstance(id),
            getAllTerminalInstances: () => this.getAllTerminalInstances(),
            getTerminalStats: () => this.terminalLifecycleManager.getTerminalStats(),
            postMessageToExtension: (msg) => this.postMessageToExtension(msg),
            showWarning: (msg) => this.notificationManager?.showWarning(msg),
            createTerminalInstance: async (id, name, config, num) => this.terminalLifecycleManager.createTerminal(id, name, config, num),
            removeTerminalInstance: (id) => this.terminalLifecycleManager.removeTerminal(id),
            getTerminalCount: () => this.splitManager?.getTerminals()?.size ?? 0,
            ensureSplitModeBeforeCreation: () => this.lightweightTerminalLifecycleCoordinator.ensureSplitModeBeforeCreation(),
            refreshSplitLayout: () => this.displayModeManager?.showAllTerminalsSplit(),
            prepareDisplayForDeletion: (id, stats) => this.lightweightTerminalLifecycleCoordinator.prepareDisplayForTerminalDeletion(id, stats),
            updateTerminalBorders: (id) => this.uiManager?.updateTerminalBorders(id, this.terminalLifecycleManager.getAllTerminalContainers()),
            focusTerminal: (id) => {
                const instance = this.getTerminalInstance(id);
                instance?.terminal?.focus();
            },
            addTab: (id, name, terminal) => this.terminalTabManager?.addTab(id, name, terminal),
            setActiveTab: (id) => this.terminalTabManager?.setActiveTab(id),
            removeTab: (id) => this.terminalTabManager?.removeTab(id),
            saveSession: () => this.webViewPersistenceService?.saveSession() ?? Promise.resolve(false),
            removeCliAgentState: (id) => this.cliAgentCoordinator.removeTerminalState(id),
        });
        // DebugCoordinator
        this.debugCoordinator = new DebugCoordinator_1.DebugCoordinator({
            debugPanelManager: this.debugPanelManager,
            getSystemStatus: () => this.getSystemStatus(),
            requestLatestState: () => this.requestLatestState(),
            getTerminalStats: () => this.terminalLifecycleManager.getTerminalStats(),
            getAgentStats: () => this.cliAgentCoordinator.getAgentStats(),
            getEventStats: () => this.eventHandlerManager.getEventStats(),
            getApiDiagnostics: () => this.webViewApiManager.getDiagnostics(),
            showWarning: (msg) => this.notificationManager?.showWarning(msg),
            notificationManager: this.notificationManager,
        });
        // SettingsCoordinator
        this.settingsCoordinator = new SettingsCoordinator_1.SettingsCoordinator({
            getCurrentSettings: () => this.currentSettings,
            setCurrentSettings: (settings) => {
                this.currentSettings = settings;
            },
            configManagerApplySettings: (settings, instances) => this.configManager.applySettings(settings, instances),
            configManagerGetCurrentSettings: () => this.configManager?.getCurrentSettings?.() ?? this.currentSettings,
            hasConfigManager: () => !!this.configManager,
            getAllTerminalInstances: () => this.terminalLifecycleManager.getAllTerminalInstances(),
            getAllTerminalContainers: () => this.terminalLifecycleManager.getAllTerminalContainers(),
            getSplitTerminals: () => this.splitManager.getTerminals(),
            setActiveBorderMode: (mode) => this.uiManager.setActiveBorderMode(mode),
            setTerminalHeaderEnhancementsEnabled: (enabled) => this.uiManager.setTerminalHeaderEnhancementsEnabled(enabled),
            updateTerminalBorders: (activeId, containers) => this.uiManager.updateTerminalBorders(activeId, containers),
            updateSplitTerminalBorders: (activeId) => this.uiManager.updateSplitTerminalBorders(activeId),
            applyAllVisualSettings: (terminal, settings) => this.uiManager.applyAllVisualSettings(terminal, settings),
            fontSettingsUpdateSettings: (fontSettings, terminals) => this.fontSettingsService.updateSettings(fontSettings, terminals),
            fontSettingsGetCurrentSettings: () => this.fontSettingsService.getCurrentSettings(),
            loadState: () => this.webViewApiManager.loadState(),
            saveState: (state) => this.webViewApiManager.saveState(state),
            getActiveTerminalId: () => this.getActiveTerminalId(),
            hasSettingsPanel: () => !!this.settingsPanel,
            settingsPanelSetVersionInfo: (version) => this.settingsPanel.setVersionInfo(version),
            settingsPanelShow: (settings) => this.settingsPanel.show(settings),
            getVersionInfo: () => this.versionInfo,
        });
        // TerminalStateCoordinator
        this.terminalStateCoordinator = new TerminalStateCoordinator_1.TerminalStateCoordinator({
            getCurrentTerminalState: () => this.currentTerminalState,
            setCurrentTerminalState: (state) => {
                this.currentTerminalState = state;
            },
            getHasProcessedInitialState: () => this.hasProcessedInitialState,
            setHasProcessedInitialState: (value) => {
                this.hasProcessedInitialState = value;
            },
            terminalOperationsUpdateState: (state) => this.terminalOperations.updateState(state),
            hasPendingCreations: () => this.terminalOperations.hasPendingCreations(),
            getPendingCreationsCount: () => this.terminalOperations.getPendingCreationsCount(),
            processPendingCreationRequests: () => this.terminalOperations.processPendingCreationRequests(),
            hasPendingDeletions: () => this.terminalOperations.hasPendingDeletions(),
            getPendingDeletions: () => this.terminalOperations.getPendingDeletions(),
            updateFromState: (state) => this.terminalStateDisplayManager.updateFromState(state),
            updateCreationState: (state) => this.terminalStateDisplayManager.updateCreationState(state),
            debugUpdateDisplay: (state, source) => this.debugCoordinator.updateDebugDisplay(state, source),
            debugShowTerminalLimitMessage: (current, max) => this.debugCoordinator.showTerminalLimitMessage(current, max),
            ensureSplitResizersOnInitialDisplay: (state, isInitial) => this.ensureSplitResizersOnInitialDisplay(state, isInitial),
            postMessageToExtension: (msg) => this.postMessageToExtension(msg),
        });
        this.lightweightTerminalLifecycleCoordinator = new LightweightTerminalLifecycleCoordinator_1.LightweightTerminalLifecycleCoordinator({
            terminalOperations: this.terminalOperations,
            terminalLifecycleManager: this.terminalLifecycleManager,
            terminalTabManager: this.terminalTabManager,
            webViewPersistenceService: this.webViewPersistenceService,
            splitManager: this.splitManager,
            displayModeManager: this.displayModeManager,
            uiManager: this.uiManager,
            cliAgentStateManager: this.cliAgentStateManager,
            performanceManager: this.performanceManager,
            getTerminalInstance: (id) => this.getTerminalInstance(id),
            getActiveTerminalId: () => this.getActiveTerminalId(),
            setActiveTerminalId: (id) => this.setActiveTerminalId(id),
            canCreateTerminal: () => this.canCreateTerminal(),
            getCurrentTerminalState: () => this.currentTerminalState,
            getForceNormalModeForNextCreate: () => this.forceNormalModeForNextCreate,
            setForceNormalModeForNextCreate: (enabled) => {
                this.forceNormalModeForNextCreate = enabled;
            },
            getForceFullscreenModeForNextCreate: () => this.forceFullscreenModeForNextCreate,
            setForceFullscreenModeForNextCreate: (enabled) => {
                this.forceFullscreenModeForNextCreate = enabled;
            },
            requestLatestState: () => this.requestLatestState(),
            showTerminalLimitMessage: (current, max) => this.showTerminalLimitMessage(current, max),
            postMessageToExtension: (message) => this.postMessageToExtension(message),
        });
        (0, logger_1.webview)('✅ Coordinators initialized');
    }
    /**
     * SplitResizeManager の初期化
     */
    initializeSplitResizeManager() {
        this.splitResizeManager = new SplitResizeManager_1.SplitResizeManager({
            onResizeComplete: () => this.refitAllTerminals(),
            getSplitDirection: () => this.splitManager.getSplitDirection(),
        });
        (0, logger_1.webview)('✅ SplitResizeManager initialized');
    }
    /**
     * SplitResizeManager にリサイザーを登録
     * 分割レイアウト変更時に呼び出される
     */
    updateSplitResizers() {
        if (!this.splitResizeManager) {
            return;
        }
        const terminalsWrapper = document.getElementById('terminals-wrapper');
        if (!terminalsWrapper) {
            this.splitResizeManager.reinitialize([]);
            return;
        }
        const resizers = Array.from(terminalsWrapper.querySelectorAll('.split-resizer, .grid-row-resizer'));
        this.splitResizeManager.reinitialize(resizers);
    }
    /**
     * 既存マネージャーの初期化（段階的移行のため）
     */
    initializeExistingManagers() {
        const initializedManagers = this.lightweightTerminalInitializationCoordinator.initializeExistingManagers();
        this.settingsPanel = initializedManagers.settingsPanel;
        this.notificationManager = initializedManagers.notificationManager;
        this.performanceManager = initializedManagers.performanceManager;
        this.uiManager = initializedManagers.uiManager;
        this.terminalTabManager = initializedManagers.terminalTabManager;
        this.inputManager = initializedManagers.inputManager;
        this.configManager = initializedManagers.configManager;
        this.webViewPersistenceService = initializedManagers.webViewPersistenceService;
        this.persistenceManager = initializedManagers.persistenceManager;
        this.messageManager = initializedManagers.messageManager;
        this.terminalStateDisplayManager = initializedManagers.terminalStateDisplayManager;
        this.sessionRestoreManager = initializedManagers.sessionRestoreManager;
        this.settingsManager = initializedManagers.settingsManager;
        this.profileManagerInitTimer = initializedManagers.profileManagerInitTimer;
        (0, logger_1.webview)('✅ All managers initialized');
    }
    initializeAccessorCoordinator() {
        this.terminalAccessorCoordinator = new TerminalAccessorCoordinator_1.TerminalAccessorCoordinator({
            getActiveTerminalId: () => this.terminalLifecycleManager.getActiveTerminalId(),
            getTerminalInstance: (id) => this.terminalLifecycleManager.getTerminalInstance(id),
            getAllTerminalInstances: () => this.terminalLifecycleManager.getAllTerminalInstances(),
            getAllTerminalContainers: () => this.terminalLifecycleManager.getAllTerminalContainers(),
            getTerminalElement: (id) => this.terminalLifecycleManager.getTerminalElement(id),
            managers: {
                performance: this.performanceManager,
                input: this.inputManager,
                ui: this.uiManager,
                config: this.configManager,
                message: this.messageManager,
                notification: this.notificationManager,
                findInTerminal: this.findInTerminalManager,
                profile: this.profileManager,
                tabs: this.terminalTabManager,
                persistence: this.persistenceManager ?? undefined,
                terminalContainer: this.terminalContainerManager,
                displayMode: this.displayModeManager,
                header: this.headerManager,
            },
            splitManager: this.splitManager,
        });
    }
    /**
     * 入力マネージャーの完全な設定
     */
    setupInputManager() {
        this.lightweightTerminalInitializationCoordinator.setupInputManager(this.inputManager);
    }
    /**
     * イベントハンドラーの設定
     * リサイズ処理はResizeCoordinatorに委譲
     */
    setupEventHandlers() {
        const handlers = this.lightweightTerminalInitializationCoordinator.setupEventHandlers(this.messageManager);
        this._onWindowFocus = handlers.onWindowFocus;
        this._onWindowBlur = handlers.onWindowBlur;
    }
    /**
     * Refit all terminals to their container dimensions
     * 委譲: ResizeCoordinator
     */
    refitAllTerminals() {
        this.resizeCoordinator.refitAllTerminals();
    }
    // IManagerCoordinator interface implementation
    getActiveTerminalId() {
        return this.terminalLifecycleManager.getActiveTerminalId();
    }
    setActiveTerminalId(terminalId) {
        // 🔍 Enhanced debugging for active terminal setting
        (0, logger_1.webview)(`🔍 [WEBVIEW] ========== SET ACTIVE TERMINAL DEBUG ==========`);
        (0, logger_1.webview)(`🔍 [WEBVIEW] Previous active: ${this.terminalLifecycleManager.getActiveTerminalId()}`);
        (0, logger_1.webview)(`🔍 [WEBVIEW] New active: ${terminalId}`);
        this.terminalLifecycleManager.setActiveTerminalId(terminalId);
        if (this.terminalTabManager && terminalId) {
            this.terminalTabManager.setActiveTab(terminalId);
        }
        // アクティブターミナルが変更されたらUI境界を更新
        if (terminalId) {
            this.uiManager.updateTerminalBorders(terminalId, this.terminalLifecycleManager.getAllTerminalContainers());
            // 🎯 FIX: Only focus if needed to avoid interrupting terminal output
            // This is critical for CLI agent scenarios while preserving shell prompt
            const terminals = this.splitManager.getTerminals();
            const terminalInstance = terminals.get(terminalId);
            if (terminalInstance && terminalInstance.terminal) {
                const terminal = terminalInstance.terminal;
                // Check if terminal actually needs focus
                if (!terminal.textarea?.hasAttribute('focused')) {
                    // Use setTimeout to avoid interrupting terminal initialization
                    setTimeout(() => {
                        terminal.focus();
                        (0, logger_1.webview)(`🎯 [WEBVIEW] Focused terminal when needed: ${terminalId}`);
                    }, 20);
                }
                else {
                    (0, logger_1.webview)(`🎯 [WEBVIEW] Terminal already focused, skipping: ${terminalId}`);
                }
            }
            // 🎯 Extension側にアクティブターミナルの変更を通知
            this.messageManager.postMessage({
                command: 'focusTerminal',
                terminalId: terminalId,
            });
            (0, logger_1.webview)(`🎯 [WEBVIEW] Notified Extension of active terminal change: ${terminalId}`);
            // 🆕 SIMPLE: Save session when active terminal changes
            if (this.webViewPersistenceService) {
                setTimeout(() => {
                    this.webViewPersistenceService
                        .saveSession()
                        .then((success) => {
                        if (success) {
                            (0, logger_1.webview)(`💾 [SIMPLE-PERSISTENCE] Session saved after active terminal change`);
                        }
                    })
                        .catch((error) => {
                        console.error('Failed to save session after active terminal change', { terminalId }, error);
                    });
                }, 200); // Small delay to avoid frequent saves
            }
            // Verify the setting worked
            const verifyActive = this.terminalLifecycleManager.getActiveTerminalId();
            (0, logger_1.webview)(`🔍 [WEBVIEW] Verified active terminal: ${verifyActive}`);
        }
        (0, logger_1.webview)(`🔍 [WEBVIEW] ========== SET ACTIVE TERMINAL DEBUG END ==========`);
    }
    getTerminalInstance(terminalId) {
        return this.terminalAccessorCoordinator.getTerminalInstance(terminalId);
    }
    getSerializeAddon(terminalId) {
        return this.terminalAccessorCoordinator.getSerializeAddon(terminalId);
    }
    getAllTerminalInstances() {
        return this.terminalAccessorCoordinator.getAllTerminalInstances();
    }
    getAllTerminalContainers() {
        return this.terminalAccessorCoordinator.getAllTerminalContainers();
    }
    getTerminalElement(terminalId) {
        return this.terminalAccessorCoordinator.getTerminalElement(terminalId);
    }
    postMessageToExtension(message) {
        this.webViewApiManager.postMessageToExtension(message);
    }
    log(message, ...args) {
        (0, logger_1.webview)(message, ...args);
    }
    getManagers() {
        return this.terminalAccessorCoordinator.getManagers();
    }
    getMessageManager() {
        return this.terminalAccessorCoordinator.getMessageManager();
    }
    // 🆕 Getters for new managers
    getTerminalContainerManager() {
        return this.terminalAccessorCoordinator.getTerminalContainerManager();
    }
    getDisplayModeManager() {
        return this.terminalAccessorCoordinator.getDisplayModeManager();
    }
    getSplitManager() {
        return this.terminalAccessorCoordinator.getSplitManager();
    }
    /**
     * 🎯 PUBLIC API: Update panel location and flex-direction if changed
     * Delegates to ConsolidatedMessageManager → PanelLocationHandler
     * Single entry point for layout updates (VS Code pattern)
     *
     * @returns true if layout was updated, false if no change
     */
    updatePanelLocationIfNeeded() {
        return this.panelLocationController.updatePanelLocationIfNeeded();
    }
    /**
     * Get current panel location
     */
    getCurrentPanelLocation() {
        return this.panelLocationController.getCurrentPanelLocation();
    }
    /**
     * Get current flex-direction
     */
    getCurrentFlexDirection() {
        return this.panelLocationController.getCurrentFlexDirection();
    }
    setForceNormalModeForNextCreate(enabled) {
        this.forceNormalModeForNextCreate = enabled;
        (0, logger_1.webview)(`🧭 [MODE] Force normal mode for next create: ${enabled}`);
    }
    setForceFullscreenModeForNextCreate(enabled) {
        this.forceFullscreenModeForNextCreate = enabled;
        (0, logger_1.webview)(`🧭 [MODE] Force fullscreen mode for next create: ${enabled}`);
    }
    // Terminal management delegation
    async createTerminal(terminalId, terminalName, config, terminalNumber, requestSource = 'webview') {
        return this.lightweightTerminalLifecycleCoordinator.createTerminal({
            terminalId,
            terminalName,
            config,
            terminalNumber,
            requestSource,
        });
    }
    async removeTerminal(terminalId) {
        return this.lightweightTerminalLifecycleCoordinator.removeTerminal(terminalId);
    }
    async switchToTerminal(terminalId) {
        return this.lightweightTerminalLifecycleCoordinator.switchToTerminal(terminalId);
    }
    writeToTerminal(data, terminalId) {
        // CLI Agent activity detection
        const targetId = terminalId || this.getActiveTerminalId();
        if (targetId) {
            const detection = this.cliAgentCoordinator.detectAgentActivity(data, targetId);
            if (detection.isAgentOutput) {
                (0, logger_1.webview)(`🤖 Agent activity detected: ${detection.agentType} in terminal ${targetId}`);
            }
        }
        return this.terminalLifecycleManager.writeToTerminal(data, terminalId);
    }
    /**
     * 🆕 NEW: Extract scrollback data from a specific terminal
     * Uses SerializeAddon for ANSI color preservation when available
     */
    extractScrollbackData(terminalId, maxLines = 1000) {
        (0, logger_1.webview)(`🔥 [EXTRACT-DEBUG] === extractScrollbackData called for ${terminalId} ===`);
        try {
            const terminalInstance = this.getTerminalInstance(terminalId);
            (0, logger_1.webview)(`🔍 [EXTRACT-DEBUG] Terminal instance found:`, !!terminalInstance);
            if (!terminalInstance || !terminalInstance.terminal) {
                console.warn(`⚠️ [EXTRACT-DEBUG] Terminal ${terminalId} not found or no terminal`);
                return [];
            }
            const terminal = terminalInstance.terminal;
            (0, logger_1.webview)(`🔍 [EXTRACT-DEBUG] Terminal details:`, {
                hasBuffer: !!terminal.buffer,
                hasNormalBuffer: !!(terminal.buffer && terminal.buffer.normal),
                hasSerializeAddon: !!terminalInstance.serializeAddon,
            });
            // 🎨 Use SerializeAddon first (preserves ANSI color codes)
            if (terminalInstance.serializeAddon) {
                (0, logger_1.webview)('✅ [EXTRACT-DEBUG] Using SerializeAddon for color-preserving scrollback extraction');
                try {
                    const serialized = terminalInstance.serializeAddon.serialize({ scrollback: maxLines });
                    const lines = serialized.split('\n');
                    // Trim trailing empty lines
                    while (lines.length > 0 && !lines[lines.length - 1]?.trim()) {
                        lines.pop();
                    }
                    (0, logger_1.webview)(`📦 [EXTRACT-DEBUG] SerializeAddon extracted ${lines.length} lines with ANSI colors`);
                    (0, logger_1.webview)('📄 [EXTRACT-DEBUG] First few lines:', lines.slice(0, 3));
                    return lines;
                }
                catch (serializeError) {
                    console.warn('⚠️ [EXTRACT-DEBUG] SerializeAddon extraction failed, falling back to buffer:', serializeError);
                }
            }
            else {
                (0, logger_1.webview)('⚠️ [EXTRACT-DEBUG] SerializeAddon not available - colors will be lost');
            }
            // Fallback: Use buffer method (colors will be lost)
            if (terminal.buffer && terminal.buffer.normal) {
                (0, logger_1.webview)('📄 [EXTRACT-DEBUG] Using buffer method for scrollback extraction (plain text)');
                try {
                    const buffer = terminal.buffer.normal;
                    const lines = [];
                    (0, logger_1.webview)(`🔍 [EXTRACT-DEBUG] Buffer length: ${buffer.length}, requesting max: ${maxLines}`);
                    const startIndex = Math.max(0, buffer.length - maxLines);
                    for (let i = startIndex; i < buffer.length; i++) {
                        const line = buffer.getLine(i);
                        if (line) {
                            lines.push(line.translateToString());
                        }
                    }
                    (0, logger_1.webview)(`📦 [EXTRACT-DEBUG] Buffer method extracted ${lines.length} lines (plain text)`);
                    (0, logger_1.webview)('📄 [EXTRACT-DEBUG] First few lines:', lines.slice(0, 3));
                    return lines;
                }
                catch (bufferError) {
                    console.warn('⚠️ [EXTRACT-DEBUG] Buffer extraction failed:', bufferError);
                }
            }
            console.warn(`⚠️ [EXTRACT-DEBUG] No scrollback extraction method available for terminal ${terminalId}`);
            return [];
        }
        catch (error) {
            console.error(`❌ [EXTRACT-DEBUG] Failed to extract scrollback from terminal ${terminalId}:`, error);
            return [];
        }
    }
    // CLI Agent state management delegation (via CliAgentCoordinator)
    getCliAgentState(terminalId) {
        return this.cliAgentCoordinator.getCliAgentState(terminalId);
    }
    setCliAgentConnected(terminalId, agentType, terminalName) {
        this.cliAgentCoordinator.setCliAgentConnected(terminalId, agentType, terminalName);
    }
    setCliAgentDisconnected(terminalId) {
        this.cliAgentCoordinator.setCliAgentDisconnected(terminalId);
    }
    /**
     * Handle AI Agent toggle button click
     * Delegates to CliAgentCoordinator
     */
    handleAiAgentToggle(terminalId) {
        this.cliAgentCoordinator.handleAiAgentToggle(terminalId);
    }
    // Settings management
    // Delegates to SettingsCoordinator
    applySettings(settings) {
        this.settingsCoordinator.applySettings(settings);
    }
    /**
     * Update theme for all terminal instances
     * Called when VS Code theme changes and settings.theme is 'auto'
     * Delegates to SettingsCoordinator
     */
    updateAllTerminalThemes(theme) {
        this.settingsCoordinator.updateAllTerminalThemes(theme);
    }
    /**
     * Apply font settings to all terminals
     * Delegates to SettingsCoordinator
     */
    applyFontSettings(fontSettings) {
        this.settingsCoordinator.applyFontSettings(fontSettings);
    }
    /**
     * Get current font settings from SettingsCoordinator
     */
    getCurrentFontSettings() {
        return this.settingsCoordinator.getCurrentFontSettings();
    }
    loadSettings() {
        this.settingsCoordinator.loadSettings();
    }
    saveSettings() {
        this.settingsCoordinator.saveSettings();
    }
    // Initialization
    initializeSimpleTerminal() {
        // まずターミナルを初期化
        this.terminalLifecycleManager.initializeSimpleTerminal();
        // 🆕 その後にWebView headerを作成（DOMが準備完了後）
        this.headerManager.createWebViewHeader();
        // 🔧 FIX: Setup parent container ResizeObserver to handle WebView resizing
        // This ensures terminals expand to full width when the panel is resized
        this.setupParentContainerResizeObserver();
    }
    /**
     * 🔧 FIX: Setup ResizeObserver on parent container to detect WebView resizing
     * This is critical for terminals to expand beyond their initial size
     */
    setupParentContainerResizeObserver() {
        const terminalBody = document.getElementById('terminal-body');
        if (!terminalBody) {
            (0, logger_1.webview)('⚠️ terminal-body not found for parent ResizeObserver');
            return;
        }
        (0, logger_1.webview)('🔧 Setting up ResizeObserver on document.body, terminal-body, and terminals-wrapper');
        // 🔧 FIX: Single ResizeObserver that watches multiple containers
        // document.body catches WebView panel resize
        // terminal-body catches internal layout changes
        // terminals-wrapper catches split layout changes
        this.parentResizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                const targetId = entry.target.id || 'body';
                (0, logger_1.webview)(`📐 [RESIZE] ${targetId} resized: ${width}x${height}`);
                // Debounce the refit
                if (this.parentResizeTimer !== null) {
                    window.clearTimeout(this.parentResizeTimer);
                }
                this.parentResizeTimer = window.setTimeout(() => {
                    (0, logger_1.webview)(`📐 [RESIZE] Triggering refitAllTerminals after debounce`);
                    this.refitAllTerminals();
                }, 50); // Reduced debounce for faster response
            }
        });
        // Observe document.body (for WebView resize) and terminal-body (for layout changes)
        this.parentResizeObserver.observe(document.body);
        this.parentResizeObserver.observe(terminalBody);
        // 🔧 FIX: Also observe terminals-wrapper if it exists (may be created later)
        const terminalsWrapper = document.getElementById('terminals-wrapper');
        if (terminalsWrapper) {
            this.parentResizeObserver.observe(terminalsWrapper);
            (0, logger_1.webview)('✅ ResizeObserver also observing terminals-wrapper');
        }
        (0, logger_1.webview)('✅ ResizeObserver setup complete');
    }
    // Compatibility methods for existing code
    async handleTerminalRemovedFromExtension(terminalId) {
        await this.lightweightTerminalLifecycleCoordinator.handleTerminalRemovedFromExtension(terminalId);
    }
    closeTerminal(terminalId) {
        // 📋 [SPEC] Panel trash button should call killTerminal to delete active terminal
        (0, logger_1.webview)(`🗑️ [PANEL] Panel trash button clicked - delegating to killTerminal`);
        void this.deleteTerminalSafely(terminalId);
    }
    updateState(state) {
        this.terminalStateCoordinator.updateState(state);
    }
    /**
     * Update UI elements based on current terminal state
     * Delegates to TerminalStateCoordinator
     */
    updateUIFromState(state) {
        this.terminalStateCoordinator.updateUIFromState(state);
    }
    /**
     * Ensure split resizers are shown on initial display when split mode is active.
     */
    ensureSplitResizersOnInitialDisplay(state, isInitialStateSync = false) {
        const displayModeManager = this.displayModeManager;
        if (!displayModeManager || state.terminals.length <= 1) {
            return;
        }
        const currentMode = displayModeManager.getCurrentMode?.() ?? 'normal';
        // 🔧 FIX: If we are in fullscreen mode, we intentionally have no split resizers.
        // Do not trigger a split layout refresh in this case, as it would kick the user out of fullscreen.
        if (currentMode === 'fullscreen') {
            return;
        }
        const terminalsWrapper = document.getElementById('terminals-wrapper');
        const stateTerminalCount = state.terminals.length;
        const domWrapperCount = terminalsWrapper
            ? terminalsWrapper.querySelectorAll('[data-terminal-wrapper-id]').length
            : 0;
        const isGridLayout = terminalsWrapper?.classList.contains('terminal-grid-layout') ?? false;
        const resizerCount = terminalsWrapper
            ? terminalsWrapper.querySelectorAll('.split-resizer').length
            : document.querySelectorAll('.split-resizer').length;
        const gridResizerCount = terminalsWrapper
            ? terminalsWrapper.querySelectorAll('.grid-row-resizer').length
            : 0;
        const wrapperCount = domWrapperCount > 0 ? domWrapperCount : stateTerminalCount;
        const expectedResizerCount = isGridLayout ? 0 : wrapperCount - 1;
        let layoutIsValid;
        if (isGridLayout) {
            // In grid mode: wrappers should match terminal count, one grid-row-resizer
            const wrapperLayoutValid = domWrapperCount === 0 || domWrapperCount === stateTerminalCount;
            layoutIsValid = wrapperLayoutValid && gridResizerCount === 1;
        }
        else {
            const resizerLayoutValid = resizerCount === expectedResizerCount;
            const wrapperLayoutValid = domWrapperCount === 0 || domWrapperCount === stateTerminalCount;
            layoutIsValid = resizerLayoutValid && wrapperLayoutValid;
        }
        if (layoutIsValid) {
            return;
        }
        (0, logger_1.webview)(`🔧 [SPLIT] Layout mismatch on display - refreshing split layout (state=${stateTerminalCount}, wrappers=${wrapperCount}, resizers=${resizerCount}, expectedResizers=${expectedResizerCount}, mode=${currentMode}, initial=${isInitialStateSync})`);
        displayModeManager.showAllTerminalsSplit?.();
        this.updateSplitResizers();
    }
    /**
     * Update terminal creation button state and messaging
     * Delegates to TerminalStateCoordinator
     */
    updateTerminalCreationState() {
        this.terminalStateCoordinator.updateTerminalCreationState();
    }
    /**
     * Update debug display with current state information
     * Delegates to TerminalStateCoordinator
     */
    updateDebugDisplay(state) {
        this.terminalStateCoordinator.updateDebugDisplay(state);
    }
    /**
     * Show terminal limit reached message
     * Delegates to TerminalStateCoordinator
     */
    showTerminalLimitMessage(current, max) {
        this.terminalStateCoordinator.showTerminalLimitMessage(current, max);
    }
    // Note: displayDebugInfo has been moved to DebugPanelManager
    /**
     * 🔄 PUBLIC API: Restore terminal session from Extension data
     * Delegates to SessionRestoreManager for deduplication and actual restoration.
     */
    async restoreSession(sessionData) {
        const result = await this.sessionRestoreManager.restoreSession(sessionData);
        return result.success;
    }
    /**
     * Check if session restore is in progress
     */
    isRestoringSession() {
        return this.sessionRestoreManager.isRestoringSession();
    }
    /**
     * Set session restore flag
     */
    setRestoringSession(isRestoring) {
        this.sessionRestoreManager.setRestoringSession(isRestoring);
    }
    // Note: updatePerformanceCounters and getSystemUptime moved to DebugPanelManager
    /**
     * Real-time debug panel toggle
     * Delegates to DebugCoordinator
     */
    toggleDebugPanel() {
        this.debugCoordinator.toggleDebugPanel(this.currentTerminalState || undefined);
    }
    /**
     * Export system diagnostics for troubleshooting
     * Delegates to DebugCoordinator
     */
    exportSystemDiagnostics() {
        return this.debugCoordinator.exportSystemDiagnostics(this.currentTerminalState?.maxTerminals || 'unknown');
    }
    /**
     * Request latest state from Extension
     * Delegates to TerminalStateCoordinator
     */
    requestLatestState() {
        this.terminalStateCoordinator.requestLatestState();
    }
    /**
     * Get current cached state
     * Delegates to TerminalStateCoordinator
     */
    getCurrentCachedState() {
        return this.terminalStateCoordinator.getCurrentCachedState();
    }
    /**
     * Check if terminal creation is currently allowed
     */
    canCreateTerminal() {
        // Delegate to coordinator for consistent state management
        return this.terminalOperations.canCreateTerminal();
    }
    /**
     * Get next available terminal number
     * 委譲: TerminalOperationsCoordinator
     */
    getNextAvailableNumber() {
        return this.terminalOperations.getNextAvailableNumber();
    }
    // ========================================
    // 委譲: TerminalOperationsCoordinator
    // ========================================
    /**
     * Queue terminal creation request
     * 委譲: TerminalOperationsCoordinator
     * 🔧 FIX: IDはExtension側で生成されるため、名前のみを受け付ける
     */
    queueTerminalCreation(terminalName) {
        return this.terminalOperations.queueTerminalCreation(terminalName);
    }
    /**
     * Smart terminal creation with race condition protection
     * 委譲: TerminalOperationsCoordinator
     */
    async createTerminalSafely(terminalName) {
        return this.terminalOperations.createTerminalSafely(terminalName);
    }
    /**
     * Enhanced terminal deletion with proper cleanup
     * 委譲: TerminalOperationsCoordinator
     */
    async deleteTerminalSafely(terminalId) {
        return this.terminalOperations.deleteTerminalSafely(terminalId);
    }
    /**
     * Check if the system is in a safe state for operations
     * Delegates to TerminalStateCoordinator
     */
    isSystemReady() {
        return this.terminalStateCoordinator.isSystemReady();
    }
    /**
     * Force system synchronization
     * 委譲: TerminalOperationsCoordinator
     */
    forceSynchronization() {
        this.terminalOperations.forceSynchronization();
        this.requestLatestState();
    }
    /**
     * Public API: Request new terminal creation (safe)
     */
    async requestNewTerminal(terminalName) {
        return await this.createTerminalSafely(terminalName);
    }
    /**
     * Public API: Request terminal deletion (safe)
     */
    async requestTerminalDeletion(terminalId) {
        return await this.deleteTerminalSafely(terminalId);
    }
    /**
     * Public API: Get system status for external monitoring
     * Delegates to TerminalStateCoordinator
     */
    getSystemStatus() {
        return this.terminalStateCoordinator.getSystemStatus();
    }
    ensureTerminalFocus(terminalId) {
        this.lightweightTerminalLifecycleCoordinator.ensureTerminalFocus(terminalId);
    }
    // CLI Agent状態管理（レガシー互換 - CliAgentCoordinator経由）
    updateClaudeStatus(activeTerminalName, status, agentType) {
        this.cliAgentCoordinator.updateClaudeStatus(activeTerminalName, status, agentType);
    }
    updateCliAgentStatus(terminalId, status, agentType) {
        this.cliAgentCoordinator.updateCliAgentStatus(terminalId, status, agentType);
    }
    /**
     * バージョン情報を設定
     */
    setVersionInfo(version) {
        this.versionInfo = version;
        if (this.settingsPanel) {
            this.settingsPanel.setVersionInfo(version);
        }
    }
    /**
     * Open settings panel
     * Delegates to SettingsCoordinator
     */
    openSettings() {
        this.settingsCoordinator.openSettings();
    }
    // Statistics and diagnostics
    getManagerStats() {
        return this.debugCoordinator.getManagerStats();
    }
    // Lifecycle management
    dispose() {
        if (!this.isInitialized) {
            return;
        }
        (0, logger_1.webview)('🧹 Disposing RefactoredTerminalWebviewManager...');
        try {
            if (this.profileManagerInitTimer !== null) {
                window.clearTimeout(this.profileManagerInitTimer);
                this.profileManagerInitTimer = null;
            }
            // 設定を保存
            this.saveSettings();
            // Window focus/blur listeners cleanup
            if (this._onWindowFocus) {
                window.removeEventListener('focus', this._onWindowFocus);
                this._onWindowFocus = null;
            }
            if (this._onWindowBlur) {
                window.removeEventListener('blur', this._onWindowBlur);
                this._onWindowBlur = null;
            }
            // 専門マネージャーのクリーンアップ
            this.eventHandlerManager.dispose();
            this.cliAgentCoordinator.dispose();
            this.terminalLifecycleManager.dispose();
            this.webViewApiManager.dispose();
            this.findInTerminalManager.dispose();
            this.profileManager.dispose();
            this.terminalTabManager.dispose();
            // 🆕 新規マネージャーのクリーンアップ（Issue #198）
            this.displayModeManager?.dispose();
            this.terminalContainerManager?.dispose();
            this.debugPanelManager?.dispose();
            this.splitResizeManager?.dispose();
            // 既存マネージャーのクリーンアップ
            this.messageManager.dispose();
            this.webViewPersistenceService.dispose();
            // Extracted managers のクリーンアップ
            this.sessionRestoreManager?.dispose();
            this.settingsManager?.dispose();
            // Coordinators のクリーンアップ
            this.terminalOperations.dispose();
            this.resizeCoordinator.dispose();
            // Note: cliAgentCoordinator and debugCoordinator are lightweight wrappers
            // and don't own resources to dispose
            this.isInitialized = false;
            (0, logger_1.webview)('✅ RefactoredTerminalWebviewManager disposed');
        }
        catch (error) {
            (0, logger_1.webview)('❌ Error disposing RefactoredTerminalWebviewManager:', error);
        }
        finally {
            // Always clean up static state even if dispose partially fails
            TerminalAutoSaveService_1.TerminalAutoSaveService.disposeAll();
        }
    }
    // Legacy compatibility getters
    get terminal() {
        return this.terminalAccessorCoordinator.getTerminal();
    }
    get fitAddon() {
        return this.terminalAccessorCoordinator.getFitAddon();
    }
    get terminalContainer() {
        return this.terminalAccessorCoordinator.getTerminalContainer();
    }
    get activeTerminalId() {
        return this.terminalAccessorCoordinator.getActiveTerminalIdValue();
    }
}
exports.LightweightTerminalWebviewManager = LightweightTerminalWebviewManager;
//# sourceMappingURL=LightweightTerminalWebviewManager.js.map