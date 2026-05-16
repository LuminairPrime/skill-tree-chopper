"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionLifecycle = void 0;
const vscode = require("vscode");
const SecondaryTerminalProvider_1 = require("../providers/SecondaryTerminalProvider");
const TerminalManager_1 = require("../terminals/TerminalManager");
const ExtensionPersistenceService_1 = require("../services/persistence/ExtensionPersistenceService");
const logger_1 = require("../utils/logger");
const commands_1 = require("../commands");
const CopilotIntegrationCommand_1 = require("../commands/CopilotIntegrationCommand");
const EnhancedShellIntegrationService_1 = require("../services/EnhancedShellIntegrationService");
const KeyboardShortcutService_1 = require("../services/KeyboardShortcutService");
const TerminalDecorationsService_1 = require("../services/TerminalDecorationsService");
const TerminalLinksService_1 = require("../services/TerminalLinksService");
const TelemetryService_1 = require("../services/TelemetryService");
const CommandRegistrar_1 = require("./CommandRegistrar");
const SessionLifecycleManager_1 = require("./SessionLifecycleManager");
const FocusProtectionService_1 = require("../services/FocusProtectionService");
/** Manages extension activation, service initialization, and cleanup. */
class ExtensionLifecycle {
    /** Activates the extension and initializes all components. */
    activate(context) {
        const activationStartTime = Date.now();
        this._extensionContext = context;
        const logLevel = this.configureLogger(context);
        const extension = vscode.extensions.getExtension('s-hiraoku.vscode-sidebar-terminal');
        const version = extension?.packageJSON?.version || 'unknown';
        logger_1.logger.lifecycle('Sidebar Terminal activation started', {
            mode: this.getExtensionModeLabel(context.extensionMode),
            version,
            logLevel: logger_1.LogLevel[logLevel],
        });
        try {
            this.telemetryService = new TelemetryService_1.TelemetryService(context, 's-hiraoku.vscode-sidebar-terminal', version);
        }
        catch (error) {
            logger_1.logger.warn('Telemetry service unavailable; continuing without analytics', error);
        }
        try {
            // Ensure node-pty looks for release binaries
            process.env.NODE_PTY_DEBUG = '0';
            // Initialize terminal manager
            this.terminalManager = new TerminalManager_1.TerminalManager();
            // Initialize extension persistence service
            this.extensionPersistenceService = new ExtensionPersistenceService_1.ExtensionPersistenceService(context, this.terminalManager);
            // Initialize command handlers
            this.fileReferenceCommand = new commands_1.FileReferenceCommand(this.terminalManager);
            this.terminalCommand = new commands_1.TerminalCommand(this.terminalManager);
            this.copilotIntegrationCommand = new CopilotIntegrationCommand_1.CopilotIntegrationCommand();
            // Initialize enhanced shell integration service
            try {
                this.shellIntegrationService = new EnhancedShellIntegrationService_1.EnhancedShellIntegrationService(this.terminalManager, context);
                // Set shell integration service on TerminalManager
                this.terminalManager.setShellIntegrationService(this.shellIntegrationService);
            }
            catch (error) {
                logger_1.logger.warn('Enhanced shell integration service unavailable', error);
                // Continue without shell integration
            }
            // Register the sidebar terminal provider
            this.sidebarProvider = new SecondaryTerminalProvider_1.SecondaryTerminalProvider(context, this.terminalManager, this.extensionPersistenceService, this.telemetryService);
            // Set sidebar provider for ExtensionPersistenceService
            if (this.extensionPersistenceService) {
                this.extensionPersistenceService.setSidebarProvider?.(this.sidebarProvider);
            }
            // Initialize keyboard shortcut service
            this.keyboardShortcutService = new KeyboardShortcutService_1.KeyboardShortcutService(this.terminalManager);
            // Connect keyboard service to webview provider
            this.keyboardShortcutService.setWebviewProvider(this.sidebarProvider);
            // Connect enhanced shell integration service to webview provider
            if (this.shellIntegrationService) {
                this.shellIntegrationService.setWebviewProvider(this.sidebarProvider);
            }
            // Initialize focus protection service
            this.focusProtectionService = new FocusProtectionService_1.FocusProtectionService({
                isTerminalFocused: () => this.terminalManager?.isTerminalFocused() ?? false,
                isWebViewVisible: () => this.sidebarProvider?.isWebViewVisible() ?? false,
                sendWebviewFocus: (terminalId) => {
                    const targetId = terminalId ?? this.terminalManager?.getActiveTerminalId();
                    if (this.sidebarProvider && targetId) {
                        void this.sidebarProvider.sendMessageToWebview({
                            command: 'focusTerminal',
                            terminalId: targetId,
                        });
                    }
                },
            });
            // Wire terminal focus changes to focus protection service
            if (this.terminalManager && this.focusProtectionService) {
                const focusProtection = this.focusProtectionService;
                const originalSetFocused = this.terminalManager.setTerminalFocused.bind(this.terminalManager);
                this.terminalManager.setTerminalFocused = (focused) => {
                    originalSetFocused(focused);
                    focusProtection.notifyFocusChanged(focused);
                };
                // Wire terminal input (keystrokes) to refresh the focus window so that
                // long typing sessions (e.g. typing into Claude Code) don't let the
                // recent-focus guard expire and defeat focus protection.
                const originalSendInput = this.terminalManager.sendInput.bind(this.terminalManager);
                this.terminalManager.sendInput = (data, terminalId) => {
                    // Pass the terminal ID so focus protection knows which terminal to
                    // restore when focus is stolen — important when multiple sidebar
                    // terminals exist.
                    const targetId = terminalId ?? this.terminalManager?.getActiveTerminalId();
                    focusProtection.notifyInteraction(targetId);
                    originalSendInput(data, terminalId);
                };
            }
            // Initialize Phase 8: Terminal Decorations & Links Services
            try {
                // Initialize terminal decorations service
                this.decorationsService = new TerminalDecorationsService_1.TerminalDecorationsService();
                // Initialize terminal links service
                this.linksService = new TerminalLinksService_1.TerminalLinksService();
                // Connect Phase 8 services to webview provider
                if (this.decorationsService && this.linksService) {
                    this.sidebarProvider.setPhase8Services(this.decorationsService, this.linksService);
                }
                // Connect Phase 8 services to terminal manager for data processing
                if (this.terminalManager) {
                    // Set up data processing for decorations through terminal manager
                    // Note: This will be connected via message passing in the webview
                }
            }
            catch (error) {
                logger_1.logger.warn('Phase 8 services unavailable; continuing without decorations/links', error);
                // Continue without Phase 8 features
            }
            // Initialize SessionLifecycleManager first (needed by CommandRegistrar)
            this.sessionLifecycleManager = new SessionLifecycleManager_1.SessionLifecycleManager({
                getTerminalManager: () => this.terminalManager,
                getSidebarProvider: () => this.sidebarProvider,
                getExtensionPersistenceService: () => this.extensionPersistenceService,
                getExtensionContext: () => this._extensionContext,
            });
            // Initialize CommandRegistrar and register all commands
            this.commandRegistrar = new CommandRegistrar_1.CommandRegistrar({
                terminalManager: this.terminalManager,
                sidebarProvider: this.sidebarProvider,
                extensionPersistenceService: this.extensionPersistenceService,
                fileReferenceCommand: this.fileReferenceCommand,
                terminalCommand: this.terminalCommand,
                copilotIntegrationCommand: this.copilotIntegrationCommand,
                shellIntegrationService: this.shellIntegrationService,
                keyboardShortcutService: this.keyboardShortcutService,
                telemetryService: this.telemetryService,
            }, {
                handleSaveSession: () => this.sessionLifecycleManager.handleSaveSession(),
                handleRestoreSession: () => this.sessionLifecycleManager.handleRestoreSession(),
                handleClearSession: () => this.sessionLifecycleManager.handleClearSession(),
                handleTestScrollback: () => this.sessionLifecycleManager.handleTestScrollback(),
                diagnoseSessionData: () => this.sessionLifecycleManager.diagnoseSessionData(),
            });
            this.commandRegistrar.registerCommands(context);
            // CRITICAL: Session restore is now handled by SecondaryTerminalProvider asynchronously
            // This prevents VS Code activation spinner from hanging
            // Register webview providers AFTER session restore completes
            const sidebarWebviewProvider = vscode.window.registerWebviewViewProvider(SecondaryTerminalProvider_1.SecondaryTerminalProvider.viewType, this.sidebarProvider, {
                webviewOptions: {
                    retainContextWhenHidden: true,
                },
            });
            context.subscriptions.push(sidebarWebviewProvider);
            // 自動保存設定 - delegate to SessionLifecycleManager
            this.sessionLifecycleManager.setupSessionAutoSave(context);
            // Track successful activation
            const activationDuration = Date.now() - activationStartTime;
            this.telemetryService?.trackActivation(activationDuration);
            logger_1.logger.lifecycle('Sidebar Terminal extension activated', {
                durationMs: activationDuration,
                version,
            });
            // Setup telemetry event listeners
            this.setupTelemetryEventListeners();
            // CRITICAL: Ensure activation Promise resolves immediately
            // This prevents VS Code progress spinner from hanging
            return Promise.resolve();
        }
        catch (error) {
            logger_1.logger.error('Failed to activate Sidebar Terminal extension', error);
            // Track activation error
            if (error instanceof Error) {
                this.telemetryService?.trackError(error, 'activation');
            }
            void vscode.window.showErrorMessage(`Failed to activate Sidebar Terminal: ${error instanceof Error ? error.message : String(error)}`);
            // CRITICAL: Even on error, resolve activation Promise to prevent spinner hanging
            return Promise.resolve();
        }
    }
    configureLogger(context) {
        const override = this.resolveLogLevelOverride();
        if (override !== undefined) {
            logger_1.logger.setLevel(override);
            return override;
        }
        if (context.extensionMode === vscode.ExtensionMode.Production) {
            logger_1.logger.setLevel(logger_1.LogLevel.WARN);
            return logger_1.LogLevel.WARN;
        }
        logger_1.logger.setLevel(logger_1.LogLevel.INFO);
        return logger_1.LogLevel.INFO;
    }
    resolveLogLevelOverride() {
        const rawLevel = process.env.SECONDARY_TERMINAL_LOG_LEVEL?.toLowerCase();
        switch (rawLevel) {
            case 'debug':
                return logger_1.LogLevel.DEBUG;
            case 'info':
                return logger_1.LogLevel.INFO;
            case 'warn':
            case 'warning':
                return logger_1.LogLevel.WARN;
            case 'error':
                return logger_1.LogLevel.ERROR;
            case 'none':
                return logger_1.LogLevel.NONE;
            default:
                return undefined;
        }
    }
    getExtensionModeLabel(mode) {
        switch (mode) {
            case vscode.ExtensionMode.Development:
                return 'Development';
            case vscode.ExtensionMode.Test:
                return 'Test';
            default:
                return 'Production';
        }
    }
    /** Deactivates the extension and performs cleanup. */
    async deactivate() {
        logger_1.logger.lifecycle('Sidebar Terminal deactivation started');
        // Track deactivation
        this.telemetryService?.trackDeactivation();
        logger_1.logger.lifecycle('Sidebar Terminal deactivation tracked');
        // シンプルセッション保存処理 - delegate to SessionLifecycleManager
        if (this.sessionLifecycleManager) {
            await this.sessionLifecycleManager.saveSimpleSessionOnExit();
        }
        // Dispose standard session manager (cleanup auto-save timers)
        if (this.extensionPersistenceService) {
            (0, logger_1.extension)('🔧 [EXTENSION] Disposing standard session manager...');
            this.extensionPersistenceService.dispose(); // Cleanup auto-save timers
            this.extensionPersistenceService = undefined;
        }
        // Dispose focus protection service
        if (this.focusProtectionService) {
            this.focusProtectionService.dispose();
            this.focusProtectionService = undefined;
        }
        // Dispose keyboard shortcut service
        if (this.keyboardShortcutService) {
            (0, logger_1.extension)('🔧 [EXTENSION] Disposing keyboard shortcut service...');
            this.keyboardShortcutService.dispose();
            this.keyboardShortcutService = undefined;
        }
        // Dispose Phase 8 services
        if (this.decorationsService) {
            (0, logger_1.extension)('🔧 [EXTENSION] Disposing terminal decorations service...');
            this.decorationsService.dispose();
            this.decorationsService = undefined;
        }
        if (this.linksService) {
            (0, logger_1.extension)('🔧 [EXTENSION] Disposing terminal links service...');
            this.linksService.dispose();
            this.linksService = undefined;
        }
        // Dispose terminal manager
        if (this.terminalManager) {
            (0, logger_1.extension)('🔧 [EXTENSION] Disposing terminal manager...');
            this.terminalManager.dispose();
            this.terminalManager = undefined;
        }
        // Dispose sidebar provider
        if (this.sidebarProvider) {
            (0, logger_1.extension)('🔧 [EXTENSION] Disposing sidebar provider...');
            this.sidebarProvider.dispose();
            this.sidebarProvider = undefined;
        }
        // Clear command handlers
        this.fileReferenceCommand = undefined;
        this.terminalCommand = undefined;
        this.copilotIntegrationCommand = undefined;
        // Dispose shell integration service
        if (this.shellIntegrationService) {
            this.shellIntegrationService.dispose();
            this.shellIntegrationService = undefined;
        }
        // Dispose telemetry service (this should be last to track all events)
        if (this.telemetryService) {
            (0, logger_1.extension)('📊 [TELEMETRY] Disposing telemetry service...');
            this.telemetryService.dispose();
            this.telemetryService = undefined;
        }
        logger_1.logger.lifecycle('Sidebar Terminal deactivation complete');
    }
    getTerminalManager() {
        return this.terminalManager;
    }
    getSidebarProvider() {
        return this.sidebarProvider;
    }
    getExtensionPersistenceService() {
        return this.extensionPersistenceService;
    }
    setupTelemetryEventListeners() {
        if (!this.telemetryService) {
            logger_1.logger.warn('Telemetry service not available, skipping telemetry event listener setup');
            return;
        }
        (0, logger_1.extension)('📊 [TELEMETRY] Setting up telemetry event listeners...');
        // Track terminal creation
        if (this.terminalManager) {
            const terminalCreatedDisposable = this.terminalManager.onTerminalCreated((terminal) => {
                this.telemetryService?.trackTerminalCreated(terminal.id);
                (0, logger_1.extension)(`📊 [TELEMETRY] Terminal created: ${terminal.id}`);
            });
            // Track terminal deletion
            const terminalRemovedDisposable = this.terminalManager.onTerminalRemoved((terminalId) => {
                this.telemetryService?.trackTerminalDeleted(terminalId);
                (0, logger_1.extension)(`📊 [TELEMETRY] Terminal deleted: ${terminalId}`);
            });
            // Track terminal focus
            const terminalFocusedDisposable = this.terminalManager.onTerminalFocus((terminalId) => {
                this.telemetryService?.trackTerminalFocused(terminalId);
            });
            if (this._extensionContext) {
                this._extensionContext.subscriptions.push(terminalCreatedDisposable, terminalRemovedDisposable, terminalFocusedDisposable);
            }
        }
        // Track CLI Agent detection events
        if (this.shellIntegrationService) {
            const cliAgentService = this.shellIntegrationService.cliAgentDetectionService;
            if (cliAgentService?.onCliAgentStatusChange) {
                const cliAgentStatusDisposable = cliAgentService.onCliAgentStatusChange((event) => {
                    if (event.status === 'connected') {
                        this.telemetryService?.trackCliAgentDetected(event.type || 'unknown');
                        (0, logger_1.extension)(`📊 [TELEMETRY] CLI Agent detected: ${event.type}`);
                        // Enable aggressive focus protection while a CLI agent is connected,
                        // because the agent's VS Code extension may call terminal.show()
                        // repeatedly during MCP tool operations.
                        this.focusProtectionService?.notifyCliAgentConnected(true);
                    }
                    else if (event.status === 'disconnected') {
                        // Track disconnection with session duration (if available)
                        this.telemetryService?.trackCliAgentDisconnected(event.type || 'unknown', 0);
                        (0, logger_1.extension)(`📊 [TELEMETRY] CLI Agent disconnected: ${event.type}`);
                        this.focusProtectionService?.notifyCliAgentConnected(false);
                    }
                });
                if (this._extensionContext) {
                    this._extensionContext.subscriptions.push(cliAgentStatusDisposable);
                }
            }
        }
        // Track session save/restore
        if (this.extensionPersistenceService) {
            // Note: ExtensionPersistenceService may not expose events
            // If it does, we can add tracking here
            (0, logger_1.extension)('📊 [TELEMETRY] Session manager event tracking (to be implemented if events available)');
        }
        (0, logger_1.extension)('✅ [TELEMETRY] Telemetry event listeners setup complete');
    }
}
exports.ExtensionLifecycle = ExtensionLifecycle;
//# sourceMappingURL=ExtensionLifecycle.js.map