"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecondaryTerminalProvider = void 0;
const vscode = require("vscode");
const common_1 = require("../utils/common");
const feedback_1 = require("../utils/feedback");
const logger_1 = require("../utils/logger");
const PersistenceMessageHandler_1 = require("../handlers/PersistenceMessageHandler");
const TerminalInitializationCoordinator_1 = require("./TerminalInitializationCoordinator");
// hasSettings moved to SettingsMessageHandler
const WebViewHtmlGenerationService_1 = require("../services/webview/WebViewHtmlGenerationService");
// New refactored services (existing)
const PanelLocationService_1 = require("./services/PanelLocationService");
const TerminalLinkResolver_1 = require("./services/TerminalLinkResolver");
const WebViewCommunicationService_1 = require("./services/WebViewCommunicationService");
const TerminalEventCoordinator_1 = require("./services/TerminalEventCoordinator");
const ScrollbackCoordinator_1 = require("./services/ScrollbackCoordinator");
// New Facade pattern services (Issue #214)
const SettingsSyncService_1 = require("./services/SettingsSyncService");
const ResourceCleanupService_1 = require("./services/ResourceCleanupService");
const WebViewLifecycleManager_1 = require("./services/WebViewLifecycleManager");
const MessageRoutingFacade_1 = require("./services/MessageRoutingFacade");
const InitializationOrchestrator_1 = require("./services/InitializationOrchestrator");
const TerminalInitializationStateMachine_1 = require("./services/TerminalInitializationStateMachine");
const TerminalCommandHandlers_1 = require("./services/TerminalCommandHandlers");
const TerminalKillService_1 = require("./services/TerminalKillService");
const ProviderSessionService_1 = require("./services/ProviderSessionService");
const WatchdogCoordinator_1 = require("./services/WatchdogCoordinator");
const ScrollbackMessageHandler_1 = require("./handlers/ScrollbackMessageHandler");
const DebugMessageHandler_1 = require("./handlers/DebugMessageHandler");
const SettingsMessageHandler_1 = require("./handlers/SettingsMessageHandler");
const PanelLocationHandler_1 = require("./handlers/PanelLocationHandler");
const WebViewInitHandler_1 = require("./handlers/WebViewInitHandler");
const MessageHandlerRegistrar_1 = require("./handlers/MessageHandlerRegistrar");
const TerminalInitLifecycleHandler_1 = require("./handlers/TerminalInitLifecycleHandler");
class SecondaryTerminalProvider {
    constructor(_extensionContext, _terminalManager, _extensionPersistenceService, telemetryService) {
        this._extensionContext = _extensionContext;
        this._terminalManager = _terminalManager;
        this._extensionPersistenceService = _extensionPersistenceService;
        this._webviewMessageListenerDisposable = null;
        this._webviewMessageListenerView = null;
        this._terminalInitStateMachine = new TerminalInitializationStateMachine_1.TerminalInitializationStateMachine();
        this._htmlGenerationService = new WebViewHtmlGenerationService_1.WebViewHtmlGenerationService();
        this._telemetryService = telemetryService;
        // Initialize existing refactored services
        this._communicationService = new WebViewCommunicationService_1.WebViewCommunicationService();
        this._panelLocationService = new PanelLocationService_1.PanelLocationService((message) => this._communicationService.sendMessage(message));
        this._linkResolver = new TerminalLinkResolver_1.TerminalLinkResolver((terminalId) => this._terminalManager.getTerminal(terminalId));
        this._scrollbackCoordinator = new ScrollbackCoordinator_1.ScrollbackCoordinator(this._communicationService.sendMessage.bind(this._communicationService));
        (0, logger_1.provider)('🎨 [PROVIDER] Existing refactored services initialized');
        // Initialize persistence services
        if (this._extensionPersistenceService) {
            this._persistenceHandler = new PersistenceMessageHandler_1.PersistenceMessageHandler(this._extensionPersistenceService);
            (0, logger_1.provider)('💾 [PROVIDER] Terminal persistence services initialized');
        }
        else {
            (0, logger_1.provider)('⚠️ [PROVIDER] ExtensionPersistenceService not provided, persistence disabled');
        }
        // Initialize terminal initialization coordinator
        this._initializationCoordinator = new TerminalInitializationCoordinator_1.TerminalInitializationCoordinator(this._terminalManager, {
            initializeTerminal: this._initializeTerminal.bind(this),
            ensureMinimumTerminals: this._ensureMultipleTerminals.bind(this),
            sendInitializationComplete: this._sendInitializationComplete.bind(this),
            restoreLastSession: () => this.restoreLastSession(),
        }, this._extensionPersistenceService);
        // Initialize NEW Facade pattern services (Issue #214)
        this._settingsService = new SettingsSyncService_1.SettingsSyncService(async () => await this._initializeTerminal());
        this._cleanupService = new ResourceCleanupService_1.ResourceCleanupService();
        this._lifecycleManager = new WebViewLifecycleManager_1.WebViewLifecycleManager(this._extensionContext, this._htmlGenerationService);
        this._messageRouter = new MessageRoutingFacade_1.MessageRoutingFacade();
        this._orchestrator = new InitializationOrchestrator_1.InitializationOrchestrator(this._initializationCoordinator, this._lifecycleManager, this._messageRouter);
        // Initialize terminal command handlers
        this._terminalCommandHandlers = new TerminalCommandHandlers_1.TerminalCommandHandlers({
            terminalManager: this._terminalManager,
            communicationService: this._communicationService,
            linkResolver: this._linkResolver,
            getSplitDirection: () => this._determineSplitDirection(),
        });
        // Initialize extracted services (Phase 3 refactoring)
        this._killService = new TerminalKillService_1.TerminalKillService({
            getActiveTerminalId: () => this._terminalManager.getActiveTerminalId() ?? null,
            getTerminal: (id) => this._terminalManager.getTerminal(id),
            killTerminal: (id) => this._terminalManager.killTerminal(id),
            getCurrentState: () => this._terminalManager.getCurrentState(),
            sendMessage: (msg) => this._sendMessage(msg),
        });
        this._sessionService = new ProviderSessionService_1.ProviderSessionService({
            extensionPersistenceService: (this._extensionPersistenceService ??
                null),
            getTerminals: () => this._terminalManager.getTerminals(),
            getActiveTerminalId: () => this._terminalManager.getActiveTerminalId() ?? null,
            createTerminal: () => this._terminalManager.createTerminal(),
            sendMessage: (msg) => this._sendMessage(msg),
            getCurrentFontSettings: () => this._settingsService.getCurrentFontSettings(),
        });
        this._watchdogCoordinator = new WatchdogCoordinator_1.WatchdogCoordinator({
            getTerminal: (id) => this._terminalManager.getTerminal(id),
            initializeShellForTerminal: (id, pty, safe) => this._terminalManager.initializeShellForTerminal(id, pty, safe),
            telemetryService: this
                ._telemetryService,
        }, SecondaryTerminalProvider.ACK_WATCHDOG_OPTIONS, SecondaryTerminalProvider.PROMPT_WATCHDOG_OPTIONS);
        // Initialize extracted message handlers (Phase 3A refactoring)
        this._scrollbackMessageHandler = new ScrollbackMessageHandler_1.ScrollbackMessageHandler({
            getExtensionPersistenceService: () => (this._extensionPersistenceService ?? null),
        });
        this._debugMessageHandler = new DebugMessageHandler_1.DebugMessageHandler({
            isDebugEnabled: () => {
                try {
                    const { isDebugEnabled } = require('../utils/logger');
                    return isDebugEnabled ? isDebugEnabled() : false;
                }
                catch {
                    return false;
                }
            },
        });
        this._settingsMessageHandler = new SettingsMessageHandler_1.SettingsMessageHandler({
            getSettingsService: () => this._settingsService,
            sendMessage: (msg) => this._sendMessage(msg),
        });
        this._panelLocationHandler = new PanelLocationHandler_1.PanelLocationHandler({
            panelLocationService: this._panelLocationService,
            sendMessage: (msg) => this._sendMessage(msg),
        });
        this._webViewInitHandler = new WebViewInitHandler_1.WebViewInitHandler({
            sendMessage: (msg) => this._communicationService.sendMessage(msg),
            sendVersionInfo: () => void this._communicationService.sendVersionInfo(),
            getCurrentSettings: () => this._settingsService.getCurrentSettings(),
            getCurrentFontSettings: () => this._settingsService.getCurrentFontSettings(),
            orchestratorInitialize: () => this._orchestrator.initialize(),
            sendFullCliAgentStateSync: () => this.sendFullCliAgentStateSync(),
            initializeTerminal: () => this._initializeTerminal(),
            startPendingWatchdogs: (isInit) => this._watchdogCoordinator.startPendingWatchdogs(isInit),
            panelLocationHandlerHandleWebviewVisible: () => this._panelLocationHandler.handleWebviewVisible(),
        });
        this._messageHandlerRegistrar = new MessageHandlerRegistrar_1.MessageHandlerRegistrar({
            handleWebviewReady: (msg) => this._handleWebviewReady(msg),
            handleWebviewInitialized: (msg) => this._handleWebviewInitialized(msg),
            handleReportPanelLocation: (msg) => this._handleReportPanelLocation(msg),
            handleTerminalInitializationComplete: (msg) => this._handleTerminalInitializationComplete(msg),
            handleTerminalReady: (msg) => this._handleTerminalReady(msg),
            handlePersistenceMessage: (msg) => this._handlePersistenceMessage(msg),
            handleLegacyPersistenceMessage: (msg) => this._handleLegacyPersistenceMessage(msg),
            terminalCommandHandlers: this._terminalCommandHandlers,
            settingsMessageHandler: this._settingsMessageHandler,
            scrollbackMessageHandler: this._scrollbackMessageHandler,
            debugMessageHandler: this._debugMessageHandler,
            onTerminalFocusChanged: (focused) => this._terminalManager.setTerminalFocused(focused),
        });
        // Initialize terminal init lifecycle handler
        this._terminalInitLifecycleHandler = new TerminalInitLifecycleHandler_1.TerminalInitLifecycleHandler({
            getTerminal: (id) => this._terminalManager.getTerminal(id),
            getTerminals: () => this._terminalManager.getTerminals(),
            getActiveTerminalId: () => this._terminalManager.getActiveTerminalId(),
            createTerminal: () => this._terminalManager.createTerminal(),
            setActiveTerminal: (id) => this._terminalManager.setActiveTerminal(id),
            initializeShellForTerminal: (id, pty, safe) => this._terminalManager.initializeShellForTerminal(id, pty, safe),
            startPtyOutput: (id) => this._terminalManager.startPtyOutput(id),
            consumeCreationDisplayModeOverride: (id) => this._terminalManager.consumeCreationDisplayModeOverride(id),
            getCurrentState: () => this._terminalManager.getCurrentState(),
            onTerminalCreated: (cb) => this._terminalManager.onTerminalCreated(cb),
            onTerminalRemoved: (cb) => this._terminalManager.onTerminalRemoved(cb),
            sendMessage: (msg) => this._sendMessage(msg),
            getCurrentFontSettings: () => this._settingsService.getCurrentFontSettings(),
            sendFullCliAgentStateSync: () => this.sendFullCliAgentStateSync(),
            addDisposable: (d) => this._cleanupService.addDisposable(d),
            isWebViewInitialized: () => this._webViewInitHandler.isInitialized,
            watchdogCoordinator: this._watchdogCoordinator,
            terminalInitStateMachine: this._terminalInitStateMachine,
            eventCoordinator: null, // Set later when event coordinator is initialized
            safeProcessCwd: // Set later when event coordinator is initialized
            common_1.safeProcessCwd,
        });
        (0, logger_1.provider)('🎨 [PROVIDER] NEW Facade pattern services initialized (Issue #214)');
        (0, logger_1.provider)('✅ [PROVIDER] SecondaryTerminalProvider constructed with all services');
        this._terminalInitLifecycleHandler.registerInitializationWatchdogs();
        // 🎨 Auto theme synchronization: Listen for VS Code theme changes
        this._registerThemeChangeListener();
    }
    /**
     * Register listener for VS Code theme changes
     * When theme setting is 'auto', automatically sync terminal theme with VS Code
     */
    _registerThemeChangeListener() {
        const disposable = vscode.window.onDidChangeActiveColorTheme((colorTheme) => {
            const currentSettings = this._settingsService.getCurrentSettings();
            const themeMode = currentSettings.theme;
            // Only react when theme is set to 'auto'
            if (themeMode !== 'auto') {
                (0, logger_1.provider)(`🎨 [THEME] Theme change detected but mode is '${themeMode}', ignoring`);
                return;
            }
            const isDark = colorTheme.kind === vscode.ColorThemeKind.Dark ||
                colorTheme.kind === vscode.ColorThemeKind.HighContrast;
            const newTheme = isDark ? 'dark' : 'light';
            (0, logger_1.provider)(`🎨 [THEME] VS Code theme changed to ${newTheme}, syncing to WebView`);
            // Send theme change message to WebView
            const view = this._lifecycleManager.getView();
            if (view) {
                void view.webview.postMessage({
                    command: 'themeChanged',
                    theme: newTheme,
                });
                (0, logger_1.provider)(`🎨 [THEME] Sent themeChanged message to WebView: ${newTheme}`);
            }
            else {
                (0, logger_1.provider)('⚠️ [THEME] WebView not available, theme change will be applied on next initialization');
            }
        });
        this._cleanupService.addDisposable(disposable);
        (0, logger_1.provider)('🎨 [PROVIDER] Theme change listener registered');
    }
    isWebViewVisible() {
        return this._lifecycleManager.getView()?.visible ?? false;
    }
    resolveWebviewView(webviewView, _context, _token) {
        const startTime = this._lifecycleManager.trackResolveStart();
        (0, logger_1.provider)('🚀 [PROVIDER] === RESOLVING WEBVIEW VIEW ===');
        (0, logger_1.provider)(`📊 [METRICS] resolveWebviewView call #${this._lifecycleManager.getPerformanceMetrics().resolveWebviewViewCallCount}`);
        // Check if body already rendered (VS Code ViewPane pattern)
        if (this._lifecycleManager.isBodyRendered()) {
            (0, logger_1.provider)('⏭️ [PROVIDER] Body already rendered - checking if WebView needs reinitialization');
            this._lifecycleManager.trackPanelMovement(startTime);
            // Update view references for panel movements
            this._lifecycleManager.setView(webviewView);
            this._communicationService.setView(webviewView);
            // 🔧 FIX: Panel movement recreates the WebView content; restart handshake for the new instance
            this._webViewInitHandler.reset();
            this._webViewInitHandler.setPendingPanelMoveReinit(true);
            // 🔧 FIX: Panel movement creates new WebView instance - must reinitialize HTML
            // VS Code destroys WebView content when moving between panel locations
            (0, logger_1.provider)('🔄 [PROVIDER] Panel moved - reinitializing WebView content');
            this._lifecycleManager.configureWebview(webviewView);
            this._registerWebviewMessageListener(webviewView);
            this._initializeWebviewContent(webviewView);
            // Note: secondaryTerminalFocus context is driven solely by terminalFocused/terminalBlurred
            // WebView messages. We do not set it here because the panel may be visible but not focused.
            return;
        }
        try {
            this._resetForNewView(webviewView);
            (0, logger_1.provider)('🔧 [PROVIDER] Step 1: Configuring webview options...');
            this._lifecycleManager.configureWebview(webviewView);
            // Register all handlers BEFORE wiring the message listener to avoid early unrouted messages
            this._initializeMessageHandlers();
            // Message listener after handlers are ready
            this._registerWebviewMessageListener(webviewView);
            this._registerVisibilityListener(webviewView);
            this._initializeWebviewContent(webviewView);
            this._setupPanelLocationChangeListener(webviewView);
            // Mark body as rendered (VS Code ViewPane pattern)
            this._lifecycleManager.setBodyRendered(true);
            (0, logger_1.provider)('✅ [PROVIDER] Body rendering complete, _bodyRendered flag set to true');
            // Track initialization completion
            this._lifecycleManager.trackInitializationComplete(startTime);
            this._lifecycleManager.logPerformanceMetrics();
            // Note: secondaryTerminalFocus context is driven solely by terminalFocused/terminalBlurred
            // WebView messages from the actual DOM focus state. We do not set it unconditionally here.
            (0, logger_1.provider)('✅ [PROVIDER] WebView setup completed successfully');
            (0, logger_1.provider)('🚀 [PROVIDER] === WEBVIEW VIEW RESOLUTION COMPLETE ===');
        }
        catch (error) {
            (0, logger_1.provider)('❌ [CRITICAL] Failed to resolve WebView:', error);
            this._lifecycleManager.handleSetupError(webviewView, error);
        }
    }
    _resetForNewView(webviewView) {
        // Set view references
        this._lifecycleManager.setView(webviewView);
        this._communicationService.setView(webviewView);
        (0, logger_1.provider)('✅ [PROVIDER] WebView references set');
        // Initialize event coordinator with new view
        this._eventCoordinator = new TerminalEventCoordinator_1.TerminalEventCoordinator(this._terminalManager, this._communicationService.sendMessage.bind(this._communicationService), () => this.sendFullCliAgentStateSync(), this._terminalIdMapping, this._terminalInitStateMachine);
        this._eventCoordinator.initialize();
        // Update the terminal init lifecycle handler's event coordinator reference
        this._terminalInitLifecycleHandler.setEventCoordinator(this._eventCoordinator);
        (0, logger_1.provider)('✅ [PROVIDER] Event coordinator initialized');
    }
    _registerWebviewMessageListener(webviewView) {
        // If this is a new WebView instance (panel movement), dispose old listener and re-register
        if (this._webviewMessageListenerView !== webviewView) {
            this._webviewMessageListenerDisposable?.dispose();
            this._webviewMessageListenerDisposable = null;
            this._webviewMessageListenerView = webviewView;
            this._lifecycleManager.setMessageListenerRegistered(false);
        }
        // Prevent duplicate message listener registration
        if (this._lifecycleManager.isMessageListenerRegistered()) {
            (0, logger_1.provider)('⏭️ [PROVIDER] Message listener already registered for current WebView');
            return;
        }
        (0, logger_1.provider)('🔧 [PROVIDER] Step 2: Setting up message listeners (BEFORE HTML)...');
        // Track listener registration
        this._lifecycleManager.trackListenerRegistration();
        const disposable = webviewView.webview.onDidReceiveMessage((message) => {
            (0, logger_1.provider)('📨 [PROVIDER] ✅ MESSAGE RECEIVED FROM WEBVIEW!');
            (0, logger_1.provider)('📨 [PROVIDER] Message command:', message.command);
            // 🎯 HANDSHAKE: Special logging for critical handshake messages
            if (message.command === 'webviewReady') {
                (0, logger_1.provider)('🤝 [HANDSHAKE] <<<< webviewReady received from WebView');
            }
            if (message.command === 'webviewInitialized') {
                (0, logger_1.provider)('🤝 [HANDSHAKE] <<<< webviewInitialized received from WebView');
            }
            try {
                const { isDebugEnabled } = require('../utils/logger');
                if (isDebugEnabled && isDebugEnabled()) {
                    (0, logger_1.provider)('📨 [PROVIDER] Message data:', message);
                }
            }
            catch {
                // Silently ignore logger loading errors - debug logging is non-critical
            }
            // Handle message using MessageRoutingFacade, with fallback for critical commands
            this._messageRouter
                .handleMessage(message)
                .then((handled) => {
                if (!handled) {
                    this._handleUnroutedMessage(message);
                }
            })
                .catch((error) => {
                (0, logger_1.provider)('❌ [PROVIDER] Error handling message:', error);
            });
        }, undefined, this._extensionContext.subscriptions);
        this._cleanupService.addDisposable(disposable);
        this._webviewMessageListenerDisposable = disposable;
        this._lifecycleManager.setMessageListenerRegistered(true);
        (0, logger_1.provider)('✅ [PROVIDER] Message listener registered');
    }
    /**
     * VS Code ViewPane Pattern: Single consolidated visibility handler
     */
    _registerVisibilityListener(webviewView) {
        (0, logger_1.provider)('🔧 [PROVIDER] Step 3: Setting up consolidated visibility listener (VS Code pattern)...');
        const disposable = this._lifecycleManager.registerVisibilityListener(webviewView, () => this._handleWebviewVisible(), () => this._handleWebviewHidden());
        this._cleanupService.addDisposable(disposable);
        (0, logger_1.provider)('✅ [PROVIDER] Consolidated visibility listener registered');
    }
    _handleWebviewVisible() {
        this._webViewInitHandler.handleWebviewVisible();
    }
    _handleWebviewHidden() {
        this._webViewInitHandler.handleWebviewHidden();
    }
    _initializeWebviewContent(webviewView) {
        (0, logger_1.provider)('🔧 [PROVIDER] Step 4: Setting webview HTML...');
        // Get initial theme from settings to prevent flash of wrong theme
        const settings = this._settingsService.getCurrentSettings();
        const settingsTheme = settings.theme;
        const initialTheme = this._webViewInitHandler.resolveInitialTheme(settingsTheme);
        (0, logger_1.provider)(`🎨 [PROVIDER] Initial theme for HTML: ${initialTheme} (settings: ${settingsTheme})`);
        // Generate HTML content with initial theme
        const htmlContent = this._htmlGenerationService.generateMainHtml({
            webview: webviewView.webview,
            extensionUri: this._extensionContext.extensionUri,
            includeSplitStyles: true,
            includeCliAgentStyles: true,
            initialTheme,
        });
        // Set HTML using lifecycle manager
        this._lifecycleManager.setWebviewHtml(webviewView, htmlContent, false);
        (0, logger_1.provider)('🤝 [HANDSHAKE] HTML set, waiting for webviewReady from WebView');
    }
    _initializeMessageHandlers() {
        this._messageHandlerRegistrar.registerAll(this._messageRouter);
    }
    // Scrollback message handlers delegated to ScrollbackMessageHandler
    async _handleTerminalReady(message) {
        await this._terminalInitLifecycleHandler.handleTerminalReady(message);
        // Forward to persistence service for terminal ready event handling
        const terminalId = message.terminalId;
        if (terminalId && this._extensionPersistenceService) {
            const handler = this._extensionPersistenceService.handleTerminalReady;
            if (typeof handler === 'function') {
                handler.call(this._extensionPersistenceService, terminalId);
            }
        }
    }
    _handleWebviewReady(message) {
        this._webViewInitHandler.handleWebviewReady(message);
    }
    /**
     * Handle webviewInitialized message from WebView
     * This is sent AFTER WebView's message handlers are fully set up
     */
    async _handleWebviewInitialized(message) {
        await this._webViewInitHandler.handleWebviewInitialized(message);
    }
    async _handleGetSettings() {
        // Delegate settings + font settings to SettingsMessageHandler
        await this._settingsMessageHandler.handleGetSettings();
        // Send initial panel location (provider-specific, not part of settings handler)
        const view = this._lifecycleManager.getView();
        if (view) {
            const panelLocation = this._getCurrentPanelLocation();
            (0, logger_1.provider)(`📍 [SETTINGS] Sending initial panel location: ${panelLocation}`);
            await this._sendMessage({
                command: 'panelLocationUpdate',
                location: panelLocation,
            });
            this._requestPanelLocationDetection();
        }
    }
    // Debug message handlers delegated to DebugMessageHandler
    /**
     * Fallback handler for critical messages that failed normal routing.
     * Prevents terminal initialization from getting stuck if a handler was not registered in time.
     */
    _handleUnroutedMessage(message) {
        (0, logger_1.provider)(`⚠️ [PROVIDER] No handler registered for command '${message.command}', invoking fallback`);
        switch (message.command) {
            case 'terminalInitializationComplete':
                void this._handleTerminalInitializationComplete(message);
                break;
            case 'terminalReady':
                void this._handleTerminalReady(message);
                break;
            default:
                (0, logger_1.provider)(`⚠️ [PROVIDER] No fallback available for command: ${message.command}`);
                break;
        }
    }
    async _sendInitializationComplete(terminalCount) {
        await this._terminalInitLifecycleHandler.sendInitializationComplete(terminalCount);
    }
    async _handleTerminalInitializationComplete(message) {
        await this._terminalInitLifecycleHandler.handleTerminalInitializationComplete(message);
    }
    async _handleUpdateSettings(message) {
        await this._settingsMessageHandler.handleUpdateSettings(message);
    }
    async _handleReportPanelLocation(message) {
        await this._panelLocationHandler.handleReportPanelLocation(message);
    }
    _requestPanelLocationDetection() {
        this._panelLocationHandler.requestPanelLocationDetection();
    }
    _clearPanelLocationDetectionPending(reason) {
        this._panelLocationHandler.clearPanelLocationDetectionPending(reason);
    }
    _determineSplitDirection() {
        return this._panelLocationService.determineSplitDirection();
    }
    _getCurrentPanelLocation() {
        return this._panelLocationService.getCurrentPanelLocation();
    }
    _setupPanelLocationChangeListener(_webviewView) {
        (0, logger_1.provider)('🔧 [PROVIDER] Setting up panel location change listener...');
        // Panel location config changes delegated to PanelLocationHandler
        const panelDisposable = this._panelLocationHandler.setupPanelLocationChangeListener();
        this._cleanupService.addDisposable(panelDisposable);
        // Settings and font changes remain as a separate listener
        const settingsDisposable = vscode.workspace.onDidChangeConfiguration((event) => {
            // Handle settings changes that affect WebView (delegated to SettingsMessageHandler)
            if (this._settingsMessageHandler.isSettingsChangeAffectingWebView(event)) {
                (0, logger_1.provider)('⚙️ [PROVIDER] Settings changed, sending updated settings to WebView...');
                void this._settingsMessageHandler.sendSettingsUpdateToWebView();
            }
            // Handle font settings changes (delegated to SettingsMessageHandler)
            if (this._settingsMessageHandler.isFontSettingsChange(event)) {
                (0, logger_1.provider)('🎨 [PROVIDER] Font settings changed, sending update to WebView...');
                void this._settingsMessageHandler.sendFontSettingsUpdateToWebView();
            }
        });
        this._cleanupService.addDisposable(settingsDisposable);
        (0, logger_1.provider)('✅ [PROVIDER] Panel location change listener registered');
    }
    // Settings change detection, WebView sync, and font settings sync
    // are delegated to SettingsMessageHandler
    splitTerminal(direction) {
        try {
            (0, logger_1.provider)('🔀 [PROVIDER] Split terminal requested');
            this._performSplit(direction);
        }
        catch (error) {
            (0, logger_1.provider)('❌ [ERROR] Failed to split terminal:', error);
            feedback_1.TerminalErrorHandler.handleWebviewError(error);
        }
    }
    _performSplit(direction) {
        const effectiveDirection = direction || this._determineSplitDirection();
        (0, logger_1.provider)(`🔀 [PROVIDER] Splitting terminal in direction: ${effectiveDirection}`);
        const newTerminalId = this._terminalManager.createTerminal();
        this._terminalManager.setActiveTerminal(newTerminalId);
        void this._sendMessage({
            command: 'split',
            terminalId: newTerminalId,
            direction: effectiveDirection,
        });
        void this._sendMessage({
            command: 'stateUpdate',
            state: this._terminalManager.getCurrentState(),
        });
        (0, logger_1.provider)(`✅ [PROVIDER] Terminal split complete: ${newTerminalId}`);
    }
    openSettings() {
        (0, logger_1.provider)('⚙️ [PROVIDER] Opening settings...');
        void vscode.commands.executeCommand('workbench.action.openSettings', '@ext:s-hiraoku.vscode-sidebar-terminal');
    }
    selectProfile() {
        (0, logger_1.provider)('👤 [PROVIDER] Opening profile selection...');
        void vscode.commands.executeCommand('workbench.action.terminal.selectDefaultProfile');
    }
    async killTerminal() {
        return this._killService.killTerminal();
    }
    async killSpecificTerminal(terminalId) {
        return this._killService.killSpecificTerminal(terminalId);
    }
    async _initializeTerminal() {
        await this._terminalInitLifecycleHandler.initializeTerminal();
    }
    /**
     * Sync terminal state to WebView after panel movement
     * This is needed because VS Code destroys WebView content when moving panels
     */
    _syncTerminalStateToWebView() {
        this._terminalInitLifecycleHandler.syncTerminalStateToWebView();
    }
    async sendMessageToWebview(message) {
        await this._sendMessage(message);
    }
    async _sendMessage(message) {
        await this._webViewInitHandler.sendMessage(message);
    }
    sendCliAgentStatusUpdate(activeTerminalName, status, agentType = null) {
        try {
            const message = {
                command: 'cliAgentStatusUpdate',
                cliAgentStatus: {
                    activeTerminalName,
                    status,
                    agentType,
                },
            };
            (0, logger_1.provider)('[DEBUG] Sending message to WebView:', message);
            void this._sendMessage(message);
        }
        catch {
            // Continue on error
        }
    }
    sendFullCliAgentStateSync() {
        (0, logger_1.provider)('🚀 [PROVIDER] sendFullCliAgentStateSync() called');
        try {
            const connectedAgentId = this._terminalManager.getConnectedAgentTerminalId();
            const connectedAgentType = this._terminalManager.getConnectedAgentType();
            const disconnectedAgents = this._terminalManager.getDisconnectedAgents();
            (0, logger_1.provider)('🔍 [PROVIDER] Current CLI Agent state:', {
                connected: { id: connectedAgentId, type: connectedAgentType },
                disconnected: Array.from(disconnectedAgents.entries()),
            });
            const terminalStates = {};
            const allTerminals = this._terminalManager.getTerminals();
            for (const terminal of allTerminals) {
                const terminalId = terminal.id;
                if (connectedAgentId === terminalId && connectedAgentType) {
                    terminalStates[terminalId] = {
                        status: 'connected',
                        agentType: connectedAgentType,
                    };
                }
                else if (disconnectedAgents.has(terminalId)) {
                    const agentInfo = disconnectedAgents.get(terminalId);
                    if (!agentInfo) {
                        continue;
                    }
                    terminalStates[terminalId] = {
                        status: 'disconnected',
                        agentType: agentInfo.type,
                    };
                }
                else {
                    terminalStates[terminalId] = {
                        status: 'none',
                        agentType: null,
                    };
                }
            }
            const message = {
                command: 'cliAgentFullStateSync',
                terminalStates: terminalStates,
            };
            (0, logger_1.provider)('📤 [PROVIDER] Sending full CLI Agent state sync:', message);
            const view = this._lifecycleManager.getView();
            if (view) {
                void view.webview.postMessage(message);
                (0, logger_1.provider)('✅ [PROVIDER] Full CLI Agent state sync sent successfully');
            }
            else {
                (0, logger_1.provider)('⚠️ [PROVIDER] WebView not available for full state sync');
            }
        }
        catch (error) {
            (0, logger_1.provider)('❌ [ERROR] Failed to send full CLI Agent state sync:', error);
        }
    }
    _ensureMultipleTerminals() {
        this._terminalInitLifecycleHandler.ensureMultipleTerminals();
    }
    async _handlePersistenceMessage(message) {
        if (!this._persistenceHandler) {
            (0, logger_1.provider)('⚠️ [PERSISTENCE] Persistence handler not available');
            return;
        }
        try {
            await this._persistenceHandler.handleMessage(message);
        }
        catch (error) {
            (0, logger_1.provider)('❌ [PERSISTENCE] Error handling persistence message:', error);
        }
    }
    async _handleLegacyPersistenceMessage(message) {
        (0, logger_1.provider)('⚠️ [PERSISTENCE] Legacy persistence message received - converting to new format');
        const convertedCommand = message.command === 'terminalSerializationRequest'
            ? 'persistenceSaveSession'
            : 'persistenceRestoreSession';
        await this._handlePersistenceMessage({
            ...message,
            command: convertedCommand,
        });
    }
    async saveCurrentSession() {
        return this._sessionService.saveCurrentSession();
    }
    async restoreLastSession() {
        return this._sessionService.restoreLastSession();
    }
    getPerformanceMetrics() {
        return this._lifecycleManager.getPerformanceMetrics();
    }
    dispose() {
        (0, logger_1.provider)('🔧 [DEBUG] SecondaryTerminalProvider disposing resources...');
        // Clear context keys
        void vscode.commands.executeCommand('setContext', 'secondaryTerminalFocus', false);
        // Send cleanup message to WebView
        const view = this._lifecycleManager.getView();
        if (view) {
            const cleanupMessage = this._cleanupService.createWebViewCleanupMessage();
            void this._sendMessage(cleanupMessage);
        }
        // Dispose services (order matters - dispose in reverse initialization order)
        this._scrollbackCoordinator.dispose();
        this._panelLocationService.dispose();
        if (this._eventCoordinator) {
            this._eventCoordinator.dispose();
        }
        this._watchdogCoordinator.dispose();
        // Dispose new Facade services
        this._lifecycleManager.dispose();
        // Clear message handlers
        this._messageRouter.clear();
        if (this._terminalIdMapping) {
            this._terminalIdMapping.clear();
        }
        // Dispose HTML generation service
        this._htmlGenerationService.dispose();
        // Dispose persistence services
        if (this._extensionPersistenceService) {
            this._extensionPersistenceService
                .cleanupExpiredSessions()
                .catch((error) => (0, logger_1.provider)(`⚠️ [PERSISTENCE] Cleanup during dispose failed: ${error}`));
        }
        this._persistenceHandler = undefined;
        // Dispose all tracked resources using ResourceCleanupService
        this._cleanupService.dispose();
        // Reset state
        this._webViewInitHandler.reset();
        this._panelLocationHandler.resetDetectionState();
        this._panelLocationHandler.dispose();
        (0, logger_1.provider)('✅ [DEBUG] SecondaryTerminalProvider disposed');
    }
    setPhase8Services(decorationsService, linksService) {
        this._decorationsService = decorationsService;
        this._linksService = linksService;
        (0, logger_1.provider)('🎨 [PROVIDER] Phase 8 services (Decorations & Links) connected to provider');
        const view = this._lifecycleManager.getView();
        if (view) {
            this._sendMessage({
                command: 'phase8ServicesReady',
                capabilities: {
                    decorations: true,
                    links: true,
                    navigation: true,
                    accessibility: true,
                },
            }).catch((error) => (0, logger_1.provider)('❌ [PROVIDER] Failed to send Phase 8 capabilities:', error));
        }
    }
}
exports.SecondaryTerminalProvider = SecondaryTerminalProvider;
SecondaryTerminalProvider.viewType = 'secondaryTerminal';
/**
 * Configuration keys for secondary terminal settings
 */
SecondaryTerminalProvider.CONFIG_KEYS = {
    DYNAMIC_SPLIT_DIRECTION: 'dynamicSplitDirection',
    PANEL_LOCATION: 'panelLocation',
    ENABLE_SHELL_INTEGRATION: 'enableShellIntegration',
};
/**
 * VS Code context keys for when clauses
 */
SecondaryTerminalProvider.CONTEXT_KEYS = {
    PANEL_LOCATION: 'secondaryTerminal.panelLocation',
    FOCUS: 'secondaryTerminalFocus',
};
SecondaryTerminalProvider.ACK_WATCHDOG_OPTIONS = {
    initialDelayMs: 700,
    maxAttempts: 4,
    backoffFactor: 2,
};
SecondaryTerminalProvider.PROMPT_WATCHDOG_OPTIONS = {
    initialDelayMs: 1000,
    maxAttempts: 1,
    backoffFactor: 1,
};
//# sourceMappingURL=SecondaryTerminalProvider.js.map