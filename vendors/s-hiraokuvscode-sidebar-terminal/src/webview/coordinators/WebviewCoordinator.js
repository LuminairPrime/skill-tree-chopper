"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebviewCoordinator = void 0;
class WebviewCoordinator {
    constructor(deps, logger) {
        this.deps = deps;
        this.logger = logger;
        this.handlers = new Map();
        this.registerHandlers();
    }
    getRegisteredCommands() {
        return Array.from(this.handlers.keys());
    }
    async dispatch(message, coordinator) {
        const handler = this.handlers.get(message.command);
        if (!handler) {
            this.logger.warn(`Unknown command: ${message.command}`);
            return;
        }
        await handler(message, coordinator);
    }
    registerHandlers() {
        this.register([
            'init',
            'output',
            'terminalCreated',
            'newTerminal',
            'focusTerminal',
            'setActiveTerminal',
            'deleteTerminalResponse',
            'terminalRemoved',
            'clear',
        ], (message, coordinator) => this.deps.lifecycleHandler.handleMessage(message, coordinator));
        this.register(['fontSettingsUpdate', 'settingsResponse', 'openSettings', 'versionInfo', 'stateUpdate'], (message, coordinator) => this.deps.settingsHandler.handleMessage(message, coordinator));
        this.register(['cliAgentStatusUpdate'], (message, coordinator) => this.deps.cliAgentController.handleStatusUpdateMessage(message, coordinator));
        this.register(['cliAgentFullStateSync'], (message, coordinator) => this.deps.cliAgentController.handleFullStateSyncMessage(message, coordinator));
        this.register(['switchAiAgentResponse'], (message, coordinator) => this.deps.cliAgentController.handleSwitchResponseMessage(message, coordinator));
        this.register(['sessionRestore'], (message, coordinator) => this.deps.sessionController.handleSessionRestoreMessage(message, coordinator));
        this.register(['sessionRestoreStarted'], (message) => this.deps.sessionController.handleSessionRestoreStartedMessage(message));
        this.register(['sessionRestoreProgress'], (message) => this.deps.sessionController.handleSessionRestoreProgressMessage(message));
        this.register(['sessionRestoreCompleted'], (message) => this.deps.sessionController.handleSessionRestoreCompletedMessage(message));
        this.register(['sessionRestoreError'], (message) => this.deps.sessionController.handleSessionRestoreErrorMessage(message));
        this.register([
            'getScrollback',
            'restoreScrollback',
            'scrollbackProgress',
            'extractScrollbackData',
            'restoreTerminalSessions',
        ], (message, coordinator) => this.deps.scrollbackHandler.handleMessage(message, coordinator));
        this.register(['sessionSaved'], (message) => this.deps.sessionController.handleSessionSavedMessage(message));
        this.register(['sessionSaveError'], (message) => this.deps.sessionController.handleSessionSaveErrorMessage(message));
        this.register(['sessionCleared'], () => this.deps.sessionController.handleSessionClearedMessage());
        this.register(['sessionRestored'], (message) => this.deps.sessionController.handleSessionRestoredMessage(message));
        this.register(['shellStatus', 'cwdUpdate', 'commandHistory', 'find'], (message, coordinator) => this.deps.shellIntegrationHandler.handleMessage(message, coordinator));
        this.register([
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
        ], (message, coordinator) => this.deps.serializationHandler.handleMessage(message, coordinator));
        this.register(['sessionRestoreSkipped'], (message) => this.deps.sessionController.handleSessionRestoreSkippedMessage(message));
        this.register(['terminalRestoreError'], (message) => this.deps.sessionController.handleTerminalRestoreErrorMessage(message));
        this.register(['panelLocationUpdate', 'requestPanelLocationDetection'], (message, coordinator) => this.deps.panelLocationHandler.handleMessage(message, coordinator));
        this.register(['split', 'setDisplayMode', 'relayoutTerminals'], (message, coordinator) => this.deps.splitHandler.handleMessage(message, coordinator));
        this.register(['showProfileSelector', 'profilesUpdated', 'defaultProfileChanged'], (message, coordinator) => this.deps.profileHandler.handleMessage(message, coordinator));
    }
    register(commands, handler) {
        commands.forEach((command) => this.handlers.set(command, handler));
    }
}
exports.WebviewCoordinator = WebviewCoordinator;
//# sourceMappingURL=WebviewCoordinator.js.map