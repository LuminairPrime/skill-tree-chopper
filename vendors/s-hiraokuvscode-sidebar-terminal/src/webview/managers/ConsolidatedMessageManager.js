"use strict";
/**
 * Consolidated Message Manager
 *
 * 統合されたメッセージマネージャー - 最高のアーキテクチャと完全な機能性を組み合わせ
 *
 * 主な特徴:
 * - ハンドラーベースのクリーンアーキテクチャ
 * - 完全なメッセージ処理機能（元のMessageManagerから）
 * - 責務分離と拡張性を兼ね備えた設計
 * - プライオリティキューとエラーハンドリング
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageManagerFactory = exports.ConsolidatedMessageManager = void 0;
const ManagerLogger_1 = require("../utils/ManagerLogger");
const MessageQueue_1 = require("../utils/MessageQueue");
const type_guards_1 = require("../../types/type-guards");
const SessionMessageController_1 = require("./controllers/SessionMessageController");
const CliAgentMessageController_1 = require("./controllers/CliAgentMessageController");
// Message Handlers
const PanelLocationHandler_1 = require("./handlers/PanelLocationHandler");
const SplitHandler_1 = require("./handlers/SplitHandler");
const ScrollbackMessageHandler_1 = require("./handlers/ScrollbackMessageHandler");
const SerializationMessageHandler_1 = require("./handlers/SerializationMessageHandler");
const TerminalLifecycleMessageHandler_1 = require("./handlers/TerminalLifecycleMessageHandler");
const SettingsAndConfigMessageHandler_1 = require("./handlers/SettingsAndConfigMessageHandler");
const ShellIntegrationMessageHandler_1 = require("./handlers/ShellIntegrationMessageHandler");
const ProfileMessageHandler_1 = require("./handlers/ProfileMessageHandler");
const ClipboardMessageHandler_1 = require("./handlers/ClipboardMessageHandler");
/**
 * Consolidated Message Manager
 *
 * 統合されたメッセージマネージャー：
 * - ハンドラーベースのクリーンアーキテクチャ
 * - 元のMessageManagerの全機能を保持
 * - 拡張性とメンテナンス性を両立
 * - プライオリティキューとロバストなエラーハンドリング
 */
class ConsolidatedMessageManager {
    constructor(coordinator) {
        // Specialized logger for Message Manager
        this.logger = ManagerLogger_1.messageLogger;
        this.cachedTerminalRestoreInfo = null;
        this.splitRecoveryTimeouts = new Set();
        /**
         * Test compatibility methods
         */
        this.testMessageHandlers = [];
        this.errorHandlers = [];
        this.connectionLostHandlers = [];
        this.logger.lifecycle('initialization', 'starting');
        if (coordinator) {
            this.coordinator = coordinator;
        }
        // Initialize MessageQueue with proper sender function
        const messageSender = (message) => {
            if (this.coordinator) {
                this.coordinator.postMessageToExtension(message);
            }
            else {
                throw new Error('Coordinator not available for sending messages');
            }
        };
        this.messageQueue = new MessageQueue_1.MessageQueue(messageSender, {
            maxRetries: 3,
            processingDelay: 1,
            maxQueueSize: 1000,
            enablePriority: true,
        });
        this.sessionController = new SessionMessageController_1.SessionMessageController({
            logger: this.logger,
        });
        this.cliAgentController = new CliAgentMessageController_1.CliAgentMessageController({
            logger: this.logger,
        });
        // Initialize message handlers
        this.panelLocationHandler = new PanelLocationHandler_1.PanelLocationHandler(this.messageQueue, this.logger);
        this.splitHandler = new SplitHandler_1.SplitHandler(this.logger);
        this.scrollbackHandler = new ScrollbackMessageHandler_1.ScrollbackMessageHandler(this.messageQueue, this.logger);
        this.serializationHandler = new SerializationMessageHandler_1.SerializationMessageHandler(this.logger);
        this.lifecycleHandler = new TerminalLifecycleMessageHandler_1.TerminalLifecycleMessageHandler(this.messageQueue, this.logger);
        this.settingsHandler = new SettingsAndConfigMessageHandler_1.SettingsAndConfigMessageHandler(this.logger);
        this.shellIntegrationHandler = new ShellIntegrationMessageHandler_1.ShellIntegrationMessageHandler(this.logger);
        this.profileHandler = new ProfileMessageHandler_1.ProfileMessageHandler(this.logger);
        this.clipboardHandler = new ClipboardMessageHandler_1.ClipboardMessageHandler(this.logger);
        // Build message handler registry for O(1) lookup instead of O(n) switch statement
        this.messageHandlers = this.buildMessageHandlerRegistry();
        this.logger.lifecycle('initialization', 'completed');
    }
    /**
     * Build message handler registry
     * Maps message commands to their respective handlers
     * This replaces the large switch statement with a more maintainable approach
     */
    buildMessageHandlerRegistry() {
        const registry = new Map();
        // Terminal Lifecycle Messages
        const lifecycleCommands = [
            'init',
            'output',
            'terminalCreated',
            'newTerminal',
            'focusTerminal',
            'panelNavigationMode',
            'panelNavigationEnabledChanged',
            'setActiveTerminal',
            'deleteTerminalResponse',
            'terminalRemoved',
            'clear',
            'startOutput',
        ];
        lifecycleCommands.forEach((cmd) => registry.set(cmd, (msg, coord) => this.lifecycleHandler.handleMessage(msg, coord)));
        // Settings and Configuration Messages
        const settingsCommands = [
            'fontSettingsUpdate',
            'settingsResponse',
            'openSettings',
            'versionInfo',
            'stateUpdate',
            'themeChanged',
        ];
        settingsCommands.forEach((cmd) => registry.set(cmd, (msg, coord) => this.settingsHandler.handleMessage(msg, coord)));
        // CLI Agent Messages
        registry.set('cliAgentStatusUpdate', (msg, coord) => this.cliAgentController.handleStatusUpdateMessage(msg, coord));
        registry.set('cliAgentFullStateSync', (msg, coord) => this.cliAgentController.handleFullStateSyncMessage(msg, coord));
        registry.set('switchAiAgentResponse', (msg, coord) => this.cliAgentController.handleSwitchResponseMessage(msg, coord));
        // Session Messages
        registry.set('sessionRestore', async (msg, coord) => this.sessionController.handleSessionRestoreMessage(msg, coord));
        registry.set('sessionRestoreStarted', (msg) => this.sessionController.handleSessionRestoreStartedMessage(msg));
        registry.set('sessionRestoreProgress', (msg) => this.sessionController.handleSessionRestoreProgressMessage(msg));
        registry.set('sessionRestoreCompleted', (msg, coord) => {
            this.sessionController.handleSessionRestoreCompletedMessage(msg);
            this.scheduleSplitResizerRecovery(coord, 'sessionRestoreCompleted');
        });
        registry.set('sessionRestoreError', (msg) => this.sessionController.handleSessionRestoreErrorMessage(msg));
        registry.set('sessionSaved', (msg) => this.sessionController.handleSessionSavedMessage(msg));
        registry.set('sessionSaveError', (msg) => this.sessionController.handleSessionSaveErrorMessage(msg));
        registry.set('sessionCleared', () => this.sessionController.handleSessionClearedMessage());
        registry.set('sessionRestored', (msg, coord) => {
            this.sessionController.handleSessionRestoredMessage(msg);
            this.scheduleSplitResizerRecovery(coord, 'sessionRestored');
        });
        registry.set('sessionRestoreSkipped', (msg) => this.sessionController.handleSessionRestoreSkippedMessage(msg));
        registry.set('terminalRestoreError', (msg) => this.sessionController.handleTerminalRestoreErrorMessage(msg));
        // Scrollback Messages
        const scrollbackCommands = [
            'getScrollback',
            'restoreScrollback',
            'scrollbackProgress',
            'extractScrollbackData',
            'restoreTerminalSessions',
        ];
        scrollbackCommands.forEach((cmd) => registry.set(cmd, (msg, coord) => this.scrollbackHandler.handleMessage(msg, coord)));
        // Shell Integration Messages
        const shellIntegrationCommands = ['shellStatus', 'cwdUpdate', 'commandHistory', 'find'];
        shellIntegrationCommands.forEach((cmd) => registry.set(cmd, (msg, coord) => this.shellIntegrationHandler.handleMessage(msg, coord)));
        // Terminal Serialization Messages
        const serializationCommands = [
            'serializeTerminal',
            'restoreSerializedContent',
            'terminalRestoreInfo',
            'saveAllTerminalSessions',
            'requestTerminalSerialization',
            'restoreTerminalSerialization',
            'sessionRestorationData',
            'persistenceSaveSessionResponse',
            'persistenceRestoreSessionResponse',
            'persistenceClearSessionResponse',
        ];
        serializationCommands.forEach((cmd) => registry.set(cmd, (msg, coord) => this.serializationHandler.handleMessage(msg, coord)));
        // Panel Location Messages
        const panelLocationCommands = ['panelLocationUpdate', 'requestPanelLocationDetection'];
        panelLocationCommands.forEach((cmd) => registry.set(cmd, (msg, coord) => this.panelLocationHandler.handleMessage(msg, coord)));
        // Split and Layout Messages
        const splitCommands = ['split', 'setDisplayMode', 'relayoutTerminals'];
        splitCommands.forEach((cmd) => registry.set(cmd, (msg, coord) => {
            this.logger.info(`🔄 [MESSAGE-MANAGER] Routing ${msg.command} to SplitHandler`);
            this.splitHandler.handleMessage(msg, coord);
        }));
        // Profile Management Messages
        const profileCommands = ['showProfileSelector', 'profilesUpdated', 'defaultProfileChanged'];
        profileCommands.forEach((cmd) => registry.set(cmd, (msg, coord) => this.profileHandler.handleMessage(msg, coord)));
        // Clipboard Messages
        registry.set('clipboardContent', (msg, coord) => this.clipboardHandler.handleMessage(msg, coord));
        return registry;
    }
    scheduleSplitResizerRecovery(coordinator, trigger) {
        const initialDelayMs = 100;
        const retryDelayMs = 120;
        const maxAttempts = 4;
        const tryRecover = (attempt) => {
            const result = this.recoverSplitResizersIfNeeded(coordinator, trigger, attempt);
            if (result !== 'retry' || attempt >= maxAttempts) {
                return;
            }
            this.scheduleSplitRecoveryTimeout(() => tryRecover(attempt + 1), retryDelayMs);
        };
        this.scheduleSplitRecoveryTimeout(() => tryRecover(1), initialDelayMs);
    }
    scheduleSplitRecoveryTimeout(callback, delayMs) {
        const timeoutId = setTimeout(() => {
            this.splitRecoveryTimeouts.delete(timeoutId);
            callback();
        }, delayMs);
        this.splitRecoveryTimeouts.add(timeoutId);
    }
    recoverSplitResizersIfNeeded(coordinator, trigger, attempt) {
        try {
            const displayModeManager = coordinator.getDisplayModeManager?.();
            if (displayModeManager?.getCurrentMode?.() !== 'split') {
                return 'not-applicable';
            }
            const visibleCount = this.getVisibleTerminalCount(coordinator);
            if (visibleCount <= 1) {
                this.logger.debug(`Split resizer recovery deferred after ${trigger} (attempt=${attempt}, visible=${visibleCount})`);
                return 'retry';
            }
            displayModeManager.showAllTerminalsSplit?.();
            this.invokeUpdateSplitResizers(coordinator);
            this.logger.info(`Split resizers recovered after ${trigger} (attempt=${attempt})`);
            return 'recovered';
        }
        catch (error) {
            this.logger.error(`Failed to recover split resizers after ${trigger}`, error);
            return 'not-applicable';
        }
    }
    getVisibleTerminalCount(coordinator) {
        const containerManager = coordinator.getTerminalContainerManager?.();
        const snapshot = containerManager?.getDisplaySnapshot?.();
        const snapshotVisibleCount = Array.isArray(snapshot?.visibleTerminals)
            ? snapshot.visibleTerminals.length
            : 0;
        const terminalsWrapper = document.getElementById('terminals-wrapper');
        const domWrapperCount = terminalsWrapper
            ? terminalsWrapper.querySelectorAll('[data-terminal-wrapper-id]').length
            : 0;
        return Math.max(snapshotVisibleCount, domWrapperCount);
    }
    invokeUpdateSplitResizers(coordinator) {
        if ('updateSplitResizers' in coordinator) {
            coordinator.updateSplitResizers?.();
        }
    }
    /**
     * Set coordinator after construction (for dependency injection)
     */
    setCoordinator(coordinator) {
        this.coordinator = coordinator;
        this.logger.lifecycle('coordinator', 'completed');
    }
    /**
     * Initialize with coordinator
     */
    initialize(coordinator) {
        this.coordinator = coordinator;
        this.logger.info('Initialized with coordinator');
    }
    /**
     * 🎯 PUBLIC API: Update panel location and flex-direction if changed
     * Single entry point for layout updates (VS Code pattern)
     *
     * @returns true if layout was updated, false if no change
     */
    updatePanelLocationIfNeeded() {
        if (!this.coordinator) {
            this.logger.warn('Cannot update panel location: coordinator not initialized');
            return false;
        }
        return this.panelLocationHandler.updateFlexDirectionIfNeeded(this.coordinator);
    }
    /**
     * Get current panel location from handler
     */
    getCurrentPanelLocation() {
        return this.panelLocationHandler.getCurrentPanelLocation();
    }
    /**
     * Get current flex-direction from handler
     */
    getCurrentFlexDirection() {
        return this.panelLocationHandler.getCurrentFlexDirection();
    }
    /**
     * Legacy interface compatibility method
     */
    receiveMessage(message, coordinator) {
        // 🔍 DEBUG: Fix message handling - message is the data, not MessageEvent
        this.logger.debug('receiveMessage called', {
            messageType: typeof message,
            command: (0, type_guards_1.isNonNullObject)(message) && 'command' in message
                ? message.command
                : 'unknown',
            timestamp: Date.now(),
        });
        // Create fake MessageEvent structure to maintain compatibility
        const fakeEvent = {
            data: message,
            type: 'message',
            origin: 'vscode-webview',
        };
        return this.handleMessage(fakeEvent, coordinator);
    }
    /**
     * Handle incoming messages from the extension with comprehensive command support
     * Uses Map-based dispatch for O(1) lookup instead of O(n) switch statement
     */
    async handleMessage(message, coordinator) {
        try {
            const messageCommand = message.data;
            this.logger.debug(`Message received: ${messageCommand.command}`);
            // Lookup handler in registry
            const handler = this.messageHandlers.get(messageCommand.command);
            if (handler) {
                // Execute handler (may be sync or async)
                await handler(messageCommand, coordinator);
            }
            else {
                this.logger.warn(`Unknown command: ${messageCommand.command}`);
            }
        }
        catch (error) {
            this.logger.error('Error handling message', error);
        }
    }
    /**
     * Add message handler (for test compatibility)
     */
    onMessage(handler) {
        this.testMessageHandlers.push(handler);
    }
    /**
     * Add error handler (for test compatibility)
     */
    onError(handler) {
        this.errorHandlers.push(handler);
    }
    /**
     * Handle extension message (for test compatibility)
     */
    async handleExtensionMessage(message) {
        if (!this.coordinator) {
            const error = new Error('Coordinator not available');
            this.errorHandlers.forEach((handler) => {
                try {
                    handler(error);
                }
                catch (err) {
                    this.logger.error('Error in error handler:', err);
                }
            });
            throw error;
        }
        try {
            // Trigger message handlers
            this.testMessageHandlers.forEach((handler) => {
                try {
                    handler(message);
                }
                catch (error) {
                    this.logger.error('Error in message handler:', error);
                    this.errorHandlers.forEach((errorHandler) => {
                        try {
                            errorHandler(error);
                        }
                        catch (err) {
                            this.logger.error('Error in error handler:', err);
                        }
                    });
                }
            });
            // Process the message using the existing logic
            await this.receiveMessage(message, this.coordinator);
        }
        catch (error) {
            this.errorHandlers.forEach((handler) => {
                try {
                    handler(error);
                }
                catch (err) {
                    this.logger.error('Error in error handler:', err);
                }
            });
            throw error;
        }
    }
    /**
     * Send message to extension (for test compatibility)
     */
    async sendToExtension(message) {
        if (!this.coordinator) {
            throw new Error('Coordinator not available');
        }
        this.coordinator.postMessageToExtension(message);
    }
    /**
     * Send message to extension with retry (for test compatibility)
     */
    async sendToExtensionWithRetry(message, options) {
        const maxRetries = options?.maxRetries ?? 3;
        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                await this.sendToExtension(message);
                return;
            }
            catch (error) {
                attempt++;
                if (attempt >= maxRetries) {
                    throw error;
                }
                // Wait before retry
                await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
            }
        }
    }
    /**
     * Resource cleanup and disposal
     */
    dispose() {
        this.logger.info('Disposing ConsolidatedMessageManager');
        this.splitRecoveryTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
        this.splitRecoveryTimeouts.clear();
        // Dispose all message handlers
        this.panelLocationHandler.dispose();
        this.splitHandler.dispose();
        this.scrollbackHandler.dispose();
        this.serializationHandler.dispose();
        this.lifecycleHandler.dispose();
        this.settingsHandler.dispose();
        this.shellIntegrationHandler.dispose();
        this.profileHandler.dispose();
        // Clear message handlers
        this.testMessageHandlers = [];
        this.errorHandlers = [];
        this.connectionLostHandlers = [];
        // Dispose MessageQueue - this will clean up all queued messages and processing
        this.messageQueue.dispose();
        // Clear coordinator reference
        this.coordinator = undefined;
        this.logger.lifecycle('ConsolidatedMessageManager', 'completed');
    }
    /**
     * Add connection lost handler (for test compatibility)
     */
    onConnectionLost(handler) {
        this.connectionLostHandlers.push(handler);
    }
    /**
     * Handle connection restored (for test compatibility)
     */
    onConnectionRestored() {
        this.logger.info('Connection restored, flushing queued messages');
        // Flush the message queue when connection is restored
        void this.messageQueue.flush();
    }
    /**
     * Handle raw message (for test compatibility)
     */
    async handleRawMessage(rawMessage) {
        try {
            const message = JSON.parse(rawMessage);
            await this.handleExtensionMessage(message);
        }
        catch (error) {
            const parseError = new Error(`Invalid JSON message: ${error instanceof Error ? error.message : String(error)}`);
            this.errorHandlers.forEach((handler) => {
                try {
                    handler(parseError);
                }
                catch (err) {
                    this.logger.error('Error in error handler:', err);
                }
            });
            throw parseError;
        }
    }
    /**
     * Post message to extension (IMessageManager interface requirement)
     */
    postMessage(message) {
        this.messageQueue.enqueue(message);
    }
    /**
     * Send ready message to extension (IMessageManager interface requirement)
     */
    sendReadyMessage(_coordinator) {
        this.messageQueue.enqueue({ command: 'ready' });
    }
    /**
     * Emit terminal interaction event (IMessageManager interface requirement)
     */
    emitTerminalInteractionEvent(type, terminalId, data, _coordinator) {
        this.messageQueue.enqueue({
            command: 'terminalInteraction',
            type,
            terminalId,
            data,
            timestamp: Date.now(),
        });
    }
    /**
     * Get queue statistics (IMessageManager interface requirement)
     */
    getQueueStats() {
        const stats = this.messageQueue.getQueueStats();
        return {
            queueSize: stats.total,
            isProcessing: stats.isProcessing,
            highPriorityQueueSize: stats.highPriority,
            isLocked: false,
        };
    }
    /**
     * Send input to terminal (IMessageManager interface requirement)
     */
    sendInput(input, terminalId, _coordinator) {
        this.messageQueue.enqueue({
            command: 'input',
            data: input,
            terminalId: terminalId || this.coordinator?.getActiveTerminalId(),
        });
    }
    /**
     * Send resize command (IMessageManager interface requirement)
     */
    sendResize(cols, rows, terminalId, _coordinator) {
        this.messageQueue.enqueue({
            command: 'resize',
            cols,
            rows,
            terminalId: terminalId || this.coordinator?.getActiveTerminalId(),
        });
    }
    /**
     * Send delete terminal message (IMessageManager interface requirement)
     */
    sendDeleteTerminalMessage(terminalId, requestSource, _coordinator) {
        this.messageQueue.enqueue({
            command: 'deleteTerminal',
            terminalId,
            requestSource,
        });
    }
}
exports.ConsolidatedMessageManager = ConsolidatedMessageManager;
/**
 * Legacy compatibility methods for factory patterns (if needed)
 */
class MessageManagerFactory {
    /**
     * Create ConsolidatedMessageManager instance
     */
    static create() {
        return new ConsolidatedMessageManager();
    }
    /**
     * Create test MessageManager instance
     */
    static createForTesting() {
        const manager = new ConsolidatedMessageManager();
        ManagerLogger_1.messageLogger.info('🧪 Test MessageManager created');
        return manager;
    }
}
exports.MessageManagerFactory = MessageManagerFactory;
//# sourceMappingURL=ConsolidatedMessageManager.js.map