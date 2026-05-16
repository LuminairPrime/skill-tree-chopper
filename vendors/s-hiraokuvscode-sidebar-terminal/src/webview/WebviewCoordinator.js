"use strict";
/**
 * Webview Coordinator
 * Demonstrates the simplified architecture using extracted services
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebviewCoordinator = void 0;
const TerminalCoordinator_1 = require("./services/TerminalCoordinator");
const UIController_1 = require("./services/UIController");
const MessageRouter_1 = require("../services/MessageRouter");
const logger_1 = require("../utils/logger");
const TerminalMessageHandlers_1 = require("../services/handlers/TerminalMessageHandlers");
const common_1 = require("../utils/common");
/**
 * Simplified webview coordinator using service architecture
 * Replaces the complex terminal webview manager
 */
class WebviewCoordinator {
    constructor() {
        this.isInitialized = false;
        // Create service instances with default configurations
        this.terminalCoordinator = TerminalCoordinator_1.TerminalCoordinatorFactory.createDefault();
        this.uiController = UIController_1.UIControllerFactory.createDefault();
        this.messageRouter = MessageRouter_1.MessageRouterFactory.createDefault();
    }
    /**
     * Initialize the coordinator and all services
     */
    async initialize() {
        if (this.isInitialized) {
            throw new Error('WebviewCoordinator is already initialized');
        }
        try {
            // Initialize services
            await this.terminalCoordinator.initialize();
            await this.uiController.initialize();
            // Setup event handlers
            this.setupTerminalCoordinatorEvents();
            this.setupUIControllerEvents();
            this.setupMessageHandlers();
            // Update initial UI state
            this.updateUIState();
            this.isInitialized = true;
            (0, logger_1.webview)('WebviewCoordinator initialized successfully');
        }
        catch (error) {
            (0, logger_1.webview)('Failed to initialize WebviewCoordinator:', error);
            throw error;
        }
    }
    /**
     * Setup terminal coordinator event handlers
     */
    setupTerminalCoordinatorEvents() {
        this.terminalCoordinator.addEventListener('onTerminalCreated', (terminalInfo) => {
            // Update UI when terminal is created
            this.uiController.showTerminalContainer(terminalInfo.id, terminalInfo.container);
            this.updateUIState();
            // Post message to extension
            this.postMessageToExtension('terminalCreated', {
                terminalId: terminalInfo.id,
                number: terminalInfo.number,
            });
        });
        this.terminalCoordinator.addEventListener('onTerminalRemoved', (terminalId) => {
            // Update UI when terminal is removed
            this.uiController.hideTerminalContainer(terminalId);
            this.updateUIState();
            // Post message to extension
            this.postMessageToExtension('terminalRemoved', { terminalId });
        });
        this.terminalCoordinator.addEventListener('onTerminalActivated', (terminalId) => {
            // Update UI when terminal is activated
            this.uiController.updateActiveTerminalIndicator(terminalId);
            this.uiController.highlightActiveTerminal(terminalId);
            // Post message to extension
            this.postMessageToExtension('terminalActivated', { terminalId });
        });
        this.terminalCoordinator.addEventListener('onTerminalOutput', (terminalId, data) => {
            // Post output to extension for processing
            this.postMessageToExtension('terminalOutput', { terminalId, data });
        });
    }
    /**
     * Setup UI controller event handlers
     */
    setupUIControllerEvents() {
        // Listen for terminal switch requests from UI
        document.addEventListener('terminal-switch-requested', (event) => {
            const { terminalId } = event.detail;
            this.terminalCoordinator.activateTerminal(terminalId);
        });
        // Listen for terminal close requests from UI
        document.addEventListener('terminal-close-requested', (event) => {
            const { terminalId } = event.detail;
            this.terminalCoordinator.removeTerminal(terminalId);
        });
        // Listen for settings open requests
        document.addEventListener('settings-open-requested', () => {
            this.postMessageToExtension('openSettings', {});
        });
    }
    /**
     * Setup message handlers for Extension ↔ WebView communication
     */
    setupMessageHandlers() {
        // Create dependencies for message handlers
        const dependencies = {
            terminalManager: this.createTerminalManagerAdapter(),
            persistenceService: this.createPersistenceAdapter(),
            configService: this.createConfigAdapter(),
            notificationService: this.createNotificationAdapter(),
        };
        // Register all terminal message handlers
        TerminalMessageHandlers_1.TerminalMessageHandlerFactory.registerAllHandlers(this.messageRouter, dependencies);
        // Setup message listener for extension messages
        window.addEventListener('message', async (event) => {
            const { command, data } = event.data;
            if (command && this.messageRouter.hasHandler(command)) {
                try {
                    const result = await this.messageRouter.routeMessage(command, data);
                    // Send response back to extension
                    this.postMessageToExtension('messageResponse', {
                        originalCommand: command,
                        success: result.success,
                        data: result.data,
                        error: result.error,
                    });
                }
                catch (error) {
                    (0, logger_1.webview)(`Message handling error for command ${command}:`, error);
                    this.postMessageToExtension('messageResponse', {
                        originalCommand: command,
                        success: false,
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
            }
        });
    }
    /**
     * Create adapter for terminal manager interface
     */
    createTerminalManagerAdapter() {
        return {
            createTerminal: async (options) => {
                return await this.terminalCoordinator.createTerminal(options);
            },
            deleteTerminal: async (terminalId, _force) => {
                return await this.terminalCoordinator.removeTerminal(terminalId);
            },
            sendInput: (terminalId, input) => {
                this.postMessageToExtension('terminalInput', { terminalId, input });
            },
            resize: (cols, rows, terminalId) => {
                if (terminalId) {
                    this.terminalCoordinator.resizeTerminal(terminalId, cols, rows);
                }
            },
            focusTerminal: (terminalId) => {
                this.terminalCoordinator.activateTerminal(terminalId);
            },
            getActiveTerminalId: () => {
                return this.terminalCoordinator.getActiveTerminalId() ?? null;
            },
            getWorkingDirectory: async (_terminalId) => {
                // This would need to be implemented based on actual requirements
                return (0, common_1.safeProcessCwd)();
            },
        };
    }
    /**
     * Create adapter for persistence service interface
     */
    createPersistenceAdapter() {
        return {
            getLastSession: async () => {
                return new Promise((resolve) => {
                    // Request session data from extension
                    this.postMessageToExtension('getSessionData', {});
                    // Listen for response (simplified - would need proper request/response handling)
                    const handler = (event) => {
                        if (event.data.command === 'sessionDataResponse') {
                            window.removeEventListener('message', handler);
                            resolve(event.data.data);
                        }
                    };
                    window.addEventListener('message', handler);
                });
            },
        };
    }
    /**
     * Create adapter for config service interface
     */
    createConfigAdapter() {
        return {
            getCurrentSettings: () => {
                // Return cached settings or request from extension
                return {};
            },
            updateSettings: async (settings) => {
                this.postMessageToExtension('updateSettings', { settings });
            },
        };
    }
    /**
     * Create adapter for notification service interface
     */
    createNotificationAdapter() {
        return {
            showError: (message) => {
                this.uiController.showNotification({
                    type: 'error',
                    message,
                    duration: 5000,
                });
            },
            showInfo: (message) => {
                this.uiController.showNotification({
                    type: 'info',
                    message,
                    duration: 5000,
                });
            },
            showWarning: (message) => {
                this.uiController.showNotification({
                    type: 'warning',
                    message,
                    duration: 5000,
                });
            },
        };
    }
    /**
     * Update UI state based on current terminal state
     */
    updateUIState() {
        const terminalInfos = this.terminalCoordinator.getAllTerminalInfos();
        const terminalCount = this.terminalCoordinator.getTerminalCount();
        const availableSlots = this.terminalCoordinator.getAvailableSlots();
        // Update terminal tabs
        this.uiController.updateTerminalTabs(terminalInfos.map((info) => ({
            id: info.id,
            number: info.number,
            isActive: info.isActive,
        })));
        // Update terminal count display
        this.uiController.updateTerminalCountDisplay(terminalCount, terminalCount + availableSlots);
        // Update create button state
        this.uiController.setCreateButtonEnabled(this.terminalCoordinator.canCreateTerminal());
        // Update system status
        this.uiController.updateSystemStatus('READY');
    }
    /**
     * Post message to extension
     */
    postMessageToExtension(command, data) {
        const vscode = window.acquireVsCodeApi();
        if (vscode) {
            vscode.postMessage({ command, data });
        }
    }
    /**
     * Handle incoming messages from extension
     */
    async handleExtensionMessage(command, data) {
        try {
            if (this.messageRouter.hasHandler(command)) {
                const result = await this.messageRouter.routeMessage(command, data);
                if (!result.success) {
                    (0, logger_1.webview)(`Message handling failed for ${command}:`, result.error);
                    this.uiController.showNotification({
                        type: 'error',
                        message: `Operation failed: ${result.error}`,
                        duration: 5000,
                    });
                }
                return result;
            }
            else {
                (0, logger_1.webview)(`No handler for command: ${command}`);
                return {
                    success: false,
                    error: `No handler for command: ${command}`,
                };
            }
        }
        catch (error) {
            (0, logger_1.webview)(`Unexpected error handling message ${command}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    /**
     * Create a new terminal
     */
    async createTerminal(options) {
        if (!this.terminalCoordinator.canCreateTerminal()) {
            this.uiController.showTerminalLimitMessage(this.terminalCoordinator.getTerminalCount(), 5 // Max terminals - should come from config
            );
            throw new Error('Cannot create terminal: limit reached');
        }
        const terminalId = await this.terminalCoordinator.createTerminal(options);
        this.updateUIState();
        return terminalId;
    }
    /**
     * Switch to a specific terminal
     */
    async switchToTerminal(terminalId) {
        await this.terminalCoordinator.switchToTerminal(terminalId);
        this.updateUIState();
    }
    /**
     * Remove a terminal
     */
    async removeTerminal(terminalId) {
        const success = await this.terminalCoordinator.removeTerminal(terminalId);
        if (success) {
            this.updateUIState();
        }
        return success;
    }
    /**
     * Get current state for debugging
     */
    getDebugInfo() {
        return {
            terminalCount: this.terminalCoordinator.getTerminalCount(),
            availableSlots: this.terminalCoordinator.getAvailableSlots(),
            activeTerminalId: this.terminalCoordinator.getActiveTerminalId(),
            registeredCommands: this.messageRouter.getRegisteredCommands(),
            activeHandlers: this.messageRouter.getActiveHandlerCount(),
            systemStatus: this.isInitialized ? 'READY' : 'INITIALIZING',
            isInitialized: this.isInitialized,
        };
    }
    /**
     * Dispose all resources
     */
    dispose() {
        if (this.isInitialized) {
            this.terminalCoordinator.dispose();
            this.uiController.dispose();
            this.messageRouter.dispose();
            this.isInitialized = false;
            (0, logger_1.webview)('WebviewCoordinator disposed');
        }
    }
}
exports.WebviewCoordinator = WebviewCoordinator;
//# sourceMappingURL=WebviewCoordinator.js.map