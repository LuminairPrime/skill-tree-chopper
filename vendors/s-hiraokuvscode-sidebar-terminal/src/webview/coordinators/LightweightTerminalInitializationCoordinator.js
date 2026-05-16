"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LightweightTerminalInitializationCoordinator = void 0;
const logger_1 = require("../../utils/logger");
const SettingsPanel_1 = require("../components/SettingsPanel");
const NotificationManager_1 = require("../managers/NotificationManager");
const PerformanceManager_1 = require("../managers/PerformanceManager");
const UIManager_1 = require("../managers/UIManager");
const TerminalTabManager_1 = require("../managers/TerminalTabManager");
const InputManager_1 = require("../managers/InputManager");
const ConfigManager_1 = require("../managers/ConfigManager");
const WebViewPersistenceService_1 = require("../services/WebViewPersistenceService");
const ConsolidatedMessageManager_1 = require("../managers/ConsolidatedMessageManager");
const TerminalStateDisplayManager_1 = require("../managers/TerminalStateDisplayManager");
const SessionRestoreManager_1 = require("../managers/SessionRestoreManager");
const TerminalSettingsManager_1 = require("../managers/TerminalSettingsManager");
class LightweightTerminalInitializationCoordinator {
    constructor(dependencies) {
        this.dependencies = dependencies;
    }
    initializeExistingManagers() {
        (0, logger_1.webview)('🔧 Initializing existing managers...');
        const settingsPanel = new SettingsPanel_1.SettingsPanel({
            onSettingsChange: (settings) => {
                try {
                    const currentSettings = this.dependencies.getCurrentSettings();
                    const mergedSettings = { ...currentSettings, ...settings };
                    this.dependencies.applySettings(settings);
                    configManager.applySettings(mergedSettings, this.dependencies.terminalLifecycleManager.getAllTerminalInstances());
                    this.dependencies.setCurrentSettings(configManager.getCurrentSettings());
                    this.dependencies.saveSettings();
                }
                catch (error) {
                    (0, logger_1.webview)('❌ [SETTINGS] Error applying settings from panel:', error);
                }
            },
            onClose: () => {
                try {
                    this.dependencies.ensureTerminalFocus();
                }
                catch (error) {
                    (0, logger_1.webview)('❌ [SETTINGS] Error restoring focus after closing settings:', error);
                }
            },
        });
        const notificationManager = new NotificationManager_1.NotificationManager();
        const performanceManager = new PerformanceManager_1.PerformanceManager();
        performanceManager.initializePerformance(this.dependencies.managerCoordinator);
        const uiManager = new UIManager_1.UIManager();
        uiManager.setActiveBorderMode(this.dependencies.getCurrentSettings().activeBorderMode ?? 'multipleOnly');
        this.dependencies.fontSettingsService.setApplicator(uiManager);
        const terminalTabManager = new TerminalTabManager_1.TerminalTabManager();
        terminalTabManager.setCoordinator(this.dependencies.managerCoordinator);
        uiManager.setTabThemeUpdater((theme) => {
            terminalTabManager.updateTheme(theme);
        });
        const inputManager = new InputManager_1.InputManager(this.dependencies.managerCoordinator);
        inputManager.initialize();
        const configManager = new ConfigManager_1.ConfigManager();
        configManager.setFontSettingsService(this.dependencies.fontSettingsService);
        const webViewPersistenceService = new WebViewPersistenceService_1.WebViewPersistenceService();
        const messageManager = new ConsolidatedMessageManager_1.ConsolidatedMessageManager();
        messageManager.setCoordinator(this.dependencies.managerCoordinator);
        this.dependencies.findInTerminalManager.setCoordinator(this.dependencies.managerCoordinator);
        this.dependencies.profileManager.setCoordinator(this.dependencies.managerCoordinator);
        this.dependencies.shellIntegrationManager.setCoordinator(this.dependencies.managerCoordinator);
        const profileManagerInitTimer = this.dependencies.scheduleTimeout(async () => {
            try {
                await this.dependencies.profileManager.initialize();
                (0, logger_1.webview)('🎯 ProfileManager async initialization completed');
            }
            catch (error) {
                console.error('❌ ProfileManager initialization failed:', error);
            }
        }, 100);
        terminalTabManager.initialize();
        this.dependencies.displayModeManager.initialize();
        this.dependencies.terminalContainerManager.initialize();
        this.dependencies.debugPanelManager.setCallbacks({
            getSystemStatus: () => this.dependencies.getSystemStatus(),
            forceSynchronization: () => this.dependencies.forceSynchronization(),
            requestLatestState: () => this.dependencies.requestLatestState(),
        });
        const terminalStateDisplayManager = new TerminalStateDisplayManager_1.TerminalStateDisplayManager(uiManager, notificationManager, terminalTabManager, this.dependencies.terminalContainerManager);
        const sessionRestoreManager = new SessionRestoreManager_1.SessionRestoreManager({
            getTerminalInstance: (id) => this.dependencies.getTerminalInstance(id),
            createTerminal: (id, name) => this.dependencies.createTerminal(id, name),
            getActiveTerminalId: () => this.dependencies.getActiveTerminalId(),
        });
        const settingsManager = new TerminalSettingsManager_1.TerminalSettingsManager(uiManager, configManager, {
            getAllTerminalInstances: () => this.dependencies.getAllTerminalInstances(),
            getAllTerminalContainers: () => this.dependencies.getAllTerminalContainers(),
            getActiveTerminalId: () => this.dependencies.getActiveTerminalId(),
        });
        return {
            settingsPanel,
            notificationManager,
            performanceManager,
            uiManager,
            terminalTabManager,
            inputManager,
            configManager,
            webViewPersistenceService,
            persistenceManager: webViewPersistenceService,
            messageManager,
            terminalStateDisplayManager,
            sessionRestoreManager,
            settingsManager,
            profileManagerInitTimer,
        };
    }
    setupInputManager(inputManager) {
        try {
            inputManager.setupAltKeyVisualFeedback();
            inputManager.setupIMEHandling();
            inputManager.setupKeyboardShortcuts(this.dependencies.managerCoordinator);
            inputManager.setAgentInteractionMode?.(false);
            (0, logger_1.webview)('✅ Input manager fully configured');
        }
        catch (error) {
            (0, logger_1.webview)('❌ Error setting up input manager:', error);
        }
    }
    setupEventHandlers(messageManager) {
        this.dependencies.eventHandlerManager.setMessageEventHandler(async (event) => {
            (0, logger_1.webview)(`🔍 [DEBUG] WebView received message event:`, {
                type: event.type,
                dataCommand: event.data?.command,
                timestamp: Date.now(),
            });
            await messageManager.receiveMessage(event.data, this.dependencies.managerCoordinator);
        });
        document.addEventListener('settings-open-requested', () => {
            this.dependencies.managerCoordinator.openSettings();
        });
        const onWindowFocus = () => {
            this.dependencies.postMessageToExtension({
                command: 'terminalFocused',
                terminalId: this.dependencies.getActiveTerminalId() || '',
                timestamp: Date.now(),
            });
        };
        const onWindowBlur = () => {
            this.dependencies.postMessageToExtension({
                command: 'terminalBlurred',
                terminalId: this.dependencies.getActiveTerminalId() || '',
                timestamp: Date.now(),
            });
        };
        window.addEventListener('focus', onWindowFocus);
        window.addEventListener('blur', onWindowBlur);
        this.dependencies.eventHandlerManager.onPageUnload(() => {
            this.dependencies.disposeManager();
        });
        (0, logger_1.webview)('🎭 Event handlers configured');
        return { onWindowFocus, onWindowBlur };
    }
}
exports.LightweightTerminalInitializationCoordinator = LightweightTerminalInitializationCoordinator;
//# sourceMappingURL=LightweightTerminalInitializationCoordinator.js.map