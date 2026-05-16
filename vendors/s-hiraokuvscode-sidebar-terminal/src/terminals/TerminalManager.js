"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalManager = void 0;
const vscode = require("vscode");
const constants_1 = require("../constants");
const TerminalProfileService_1 = require("../services/TerminalProfileService");
const logger_1 = require("../utils/logger");
const common_1 = require("../utils/common");
const TerminalNumberManager_1 = require("../utils/TerminalNumberManager");
const CliAgentDetectionService_1 = require("../services/CliAgentDetectionService");
const TerminalSpawner_1 = require("./TerminalSpawner");
const TerminalProcessManager_1 = require("../services/TerminalProcessManager");
const TerminalValidationService_1 = require("../services/TerminalValidationService");
const CircularBufferManager_1 = require("../utils/CircularBufferManager");
// Import new modules (Issue #237 Phase 1)
const TerminalDataBufferManager_1 = require("./TerminalDataBufferManager");
const TerminalStateCoordinator_1 = require("./TerminalStateCoordinator");
const TerminalIOCoordinator_1 = require("./TerminalIOCoordinator");
const TerminalProcessCoordinator_1 = require("./TerminalProcessCoordinator");
const TerminalLifecycleManager_1 = require("./TerminalLifecycleManager");
const ENABLE_TERMINAL_DEBUG_LOGS = process.env.SECONDARY_TERMINAL_DEBUG_LOGS === 'true';
/** Coordinates between specialized terminal management modules (Facade + Coordinator pattern) */
class TerminalManager {
    debugLog(...args) {
        if (this._debugLoggingEnabled) {
            (0, logger_1.terminal)(...args);
        }
    }
    consumeCreationDisplayModeOverride(terminalId) {
        const terminal = this._terminals.get(terminalId);
        if (!terminal) {
            return null;
        }
        const override = terminal.creationDisplayModeOverride ?? null;
        if (override) {
            terminal.creationDisplayModeOverride = undefined;
        }
        return override;
    }
    constructor(cliAgentService) {
        this._terminals = new Map();
        this._activeTerminalManager = new common_1.ActiveTerminalManager();
        this._dataEmitter = new vscode.EventEmitter();
        this._exitEmitter = new vscode.EventEmitter();
        this._terminalCreatedEmitter = new vscode.EventEmitter();
        this._terminalRemovedEmitter = new vscode.EventEmitter();
        this._stateUpdateEmitter = new vscode.EventEmitter();
        this._terminalFocusEmitter = new vscode.EventEmitter();
        this._shellIntegrationService = null;
        this._debugLoggingEnabled = ENABLE_TERMINAL_DEBUG_LOGS;
        this._cleaningTerminals = new Set();
        // Public event accessors
        this.onData = this._dataEmitter.event;
        this.onExit = this._exitEmitter.event;
        this.onTerminalCreated = this._terminalCreatedEmitter.event;
        this.onTerminalRemoved = this._terminalRemovedEmitter.event;
        this.onStateUpdate = this._stateUpdateEmitter.event;
        this.onTerminalFocus = this._terminalFocusEmitter.event;
        /**
         * Whether the Secondary Terminal WebView currently has focus.
         * Tracked via the terminalFocused/terminalBlurred messages from WebView.
         */
        this._isTerminalFocused = false;
        const config = (0, common_1.getTerminalConfig)();
        this._terminalNumberManager = new TerminalNumberManager_1.TerminalNumberManager(config.maxTerminals);
        this._profileService = new TerminalProfileService_1.TerminalProfileService();
        this._cliAgentService = cliAgentService || new CliAgentDetectionService_1.CliAgentDetectionService();
        this._cliAgentService.startHeartbeat();
        this._terminalSpawner = new TerminalSpawner_1.TerminalSpawner();
        this._processManager = new TerminalProcessManager_1.TerminalProcessManager();
        this._validationService = new TerminalValidationService_1.TerminalValidationService({ maxTerminals: config.maxTerminals });
        this._bufferManager = new CircularBufferManager_1.CircularBufferManager((terminalId, data) => this._dataEmitter.fire({ terminalId, data }), {
            flushInterval: constants_1.PERFORMANCE_CONSTANTS.OUTPUT_BUFFER_FLUSH_INTERVAL_MS,
            maxDataSize: constants_1.PERFORMANCE_CONSTANTS.MAX_BUFFER_SIZE_BYTES,
        });
        this._dataBufferManager = new TerminalDataBufferManager_1.TerminalDataBufferManager(this._terminals, this._dataEmitter, this._cliAgentService);
        this._stateCoordinator = new TerminalStateCoordinator_1.TerminalStateCoordinator(this._terminals, this._activeTerminalManager, this._stateUpdateEmitter, this._terminalFocusEmitter, this._terminalNumberManager);
        this._ioCoordinator = new TerminalIOCoordinator_1.TerminalIOCoordinator(this._terminals, this._activeTerminalManager, this._cliAgentService);
        this._processCoordinator = new TerminalProcessCoordinator_1.TerminalProcessCoordinator(this._terminals, this._shellIntegrationService, this._stateUpdateEmitter, (terminalId, data) => this._dataBufferManager.bufferData(terminalId, data));
        this._lifecycleManager = new TerminalLifecycleManager_1.TerminalLifecycleManager(this._terminals, this._terminalNumberManager, this._profileService, this._terminalSpawner, this._cliAgentService, this._terminalCreatedEmitter, this._terminalRemovedEmitter, this._exitEmitter, (terminal) => this._setupTerminalEvents(terminal), () => this._stateCoordinator.notifyStateUpdate(), (terminalId) => this._performCleanup(terminalId));
    }
    get onCliAgentStatusChange() {
        return this._cliAgentService.onCliAgentStatusChange;
    }
    // === Lifecycle Management ===
    async createTerminalWithProfile(profileName, overrides) {
        return await this._lifecycleManager.createTerminalWithProfile(profileName, overrides);
    }
    createTerminal(overrides) {
        return this._lifecycleManager.createTerminal(overrides);
    }
    async deleteTerminal(terminalId, options = {}) {
        return await this._lifecycleManager.deleteTerminal(terminalId, options);
    }
    canRemoveTerminal(terminalId) {
        return this._lifecycleManager.canRemoveTerminal(terminalId);
    }
    removeTerminal(terminalId) {
        if (this._cleaningTerminals.has(terminalId)) {
            return;
        }
        this._cleaningTerminals.add(terminalId);
        try {
            this._lifecycleManager.removeTerminal(terminalId);
        }
        finally {
            this._cleaningTerminals.delete(terminalId);
        }
    }
    getTerminal(terminalId) {
        return this._lifecycleManager.getTerminal(terminalId);
    }
    getTerminals() {
        return this._lifecycleManager.getTerminals();
    }
    // === Process Coordination ===
    initializeShellForTerminal(terminalId, ptyProcess, safeMode) {
        this._processCoordinator.initializeShellForTerminal(terminalId, ptyProcess, safeMode);
    }
    startPtyOutput(terminalId) {
        this._processCoordinator.startPtyOutput(terminalId);
    }
    // === State Management ===
    getCurrentState() {
        return this._stateCoordinator.getCurrentState();
    }
    hasActiveTerminal() {
        return this._stateCoordinator.hasActiveTerminal();
    }
    getActiveTerminalId() {
        return this._stateCoordinator.getActiveTerminalId();
    }
    setTerminalFocused(focused) {
        this._isTerminalFocused = focused;
    }
    isTerminalFocused() {
        return this._isTerminalFocused;
    }
    setActiveTerminal(terminalId) {
        this._stateCoordinator.setActiveTerminal(terminalId);
    }
    focusTerminal(terminalId) {
        this._stateCoordinator.focusTerminal(terminalId);
    }
    reorderTerminals(order) {
        this._stateCoordinator.reorderTerminals(order);
    }
    updateTerminalCwd(terminalId, cwd) {
        this._stateCoordinator.updateTerminalCwd(terminalId, cwd);
    }
    renameTerminal(terminalId, newName) {
        const trimmedName = newName.trim();
        if (!trimmedName) {
            return false;
        }
        const terminal = this._terminals.get(terminalId);
        if (!terminal) {
            return false;
        }
        if (terminal.name === trimmedName) {
            return true;
        }
        return this._stateCoordinator.updateTerminalHeader(terminalId, { newName: trimmedName });
    }
    updateTerminalHeader(terminalId, updates) {
        const terminal = this._terminals.get(terminalId);
        if (!terminal) {
            return false;
        }
        const nextName = updates.newName?.trim();
        const hasName = typeof nextName === 'string' && nextName.length > 0;
        const normalizedIndicatorColor = typeof updates.indicatorColor === 'string'
            ? (() => {
                const value = updates.indicatorColor.trim();
                if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                    return value.toUpperCase();
                }
                if (value.toLowerCase() === 'transparent') {
                    return 'transparent';
                }
                return undefined;
            })()
            : undefined;
        const hasColor = typeof normalizedIndicatorColor === 'string';
        if (!hasName && !hasColor) {
            return false;
        }
        if (hasName && terminal.name === nextName && !hasColor) {
            return true;
        }
        return this._stateCoordinator.updateTerminalHeader(terminalId, {
            ...(hasName ? { newName: nextName } : {}),
            ...(hasColor ? { indicatorColor: normalizedIndicatorColor } : {}),
        });
    }
    // === I/O Operations ===
    sendInput(data, terminalId) {
        this._ioCoordinator.sendInput(data, terminalId);
    }
    resize(cols, rows, terminalId) {
        this._ioCoordinator.resize(cols, rows, terminalId);
    }
    writeToTerminal(terminalId, data) {
        return this._ioCoordinator.writeToTerminal(terminalId, data);
    }
    resizeTerminal(terminalId, cols, rows) {
        return this._ioCoordinator.resizeTerminal(terminalId, cols, rows);
    }
    // === Legacy Methods ===
    /** @deprecated Use deleteTerminal() with active terminal ID */
    async safeKillTerminal(_terminalId) {
        const targetId = _terminalId || this._activeTerminalManager.getActive();
        if (!targetId) {
            (0, logger_1.terminal)('No terminal to kill');
            return false;
        }
        try {
            const result = await this.deleteTerminal(targetId, { source: 'command' });
            return result.success;
        }
        catch (err) {
            (0, logger_1.terminal)(`Failed to kill terminal ${targetId}: ${err}`);
            return false;
        }
    }
    async killTerminal(terminalId) {
        const targetId = terminalId || this._activeTerminalManager.getActive();
        if (!targetId) {
            return;
        }
        const result = await this.deleteTerminal(targetId, { force: true, source: 'command' });
        if (!result.success) {
            throw new Error(result.reason || 'Failed to kill terminal');
        }
    }
    // === CLI Agent Integration ===
    isCliAgentConnected(terminalId) {
        return this._cliAgentService.getAgentState(terminalId).status === 'connected';
    }
    isCliAgentRunning(terminalId) {
        return this._cliAgentService.getAgentState(terminalId).status !== 'none';
    }
    getCurrentGloballyActiveAgent() {
        return this._cliAgentService.getConnectedAgent();
    }
    refreshCliAgentState() {
        return this._cliAgentService.refreshAgentState();
    }
    getLastCommand(_terminalId) {
        return undefined;
    }
    handleTerminalOutputForCliAgent(terminalId, data) {
        this._cliAgentService.detectFromOutput(terminalId, data);
    }
    getAgentType(terminalId) {
        return this._cliAgentService.getAgentState(terminalId).agentType;
    }
    getConnectedAgents() {
        const agent = this._cliAgentService.getConnectedAgent();
        return agent ? [{ terminalId: agent.terminalId, agentInfo: { type: agent.type } }] : [];
    }
    getDisconnectedAgents() {
        return this._cliAgentService.getDisconnectedAgents();
    }
    getConnectedAgentTerminalId() {
        return this._cliAgentService.getConnectedAgent()?.terminalId ?? null;
    }
    getConnectedAgentType() {
        const agent = this._cliAgentService.getConnectedAgent();
        if (!agent) {
            return null;
        }
        const type = agent.type;
        const supportedAgentTypes = [
            'claude',
            'gemini',
            'codex',
            'copilot',
            'opencode',
        ];
        if (supportedAgentTypes.includes(type)) {
            return type;
        }
        return null;
    }
    switchAiAgentConnection(terminalId) {
        if (!this._terminals.has(terminalId)) {
            return { success: false, reason: 'Terminal not found', newStatus: 'none', agentType: null };
        }
        return this._cliAgentService.switchAgentConnection(terminalId);
    }
    forceReconnectAiAgent(terminalId, agentType = 'claude') {
        const terminalName = this._terminals.get(terminalId)?.name;
        return this._cliAgentService.forceReconnectAgent(terminalId, agentType, terminalName);
    }
    clearAiAgentDetectionError(terminalId) {
        return this._cliAgentService.clearDetectionError(terminalId);
    }
    // === Profile Management ===
    async getAvailableProfiles() {
        return await this._lifecycleManager.getAvailableProfiles();
    }
    getDefaultProfile() {
        return this._lifecycleManager.getDefaultProfile();
    }
    // === Service Management ===
    setShellIntegrationService(service) {
        this._shellIntegrationService = service;
    }
    get onTerminalOutput() {
        if (!this._outputEmitter) {
            this._outputEmitter = new vscode.EventEmitter();
            this.onData((event) => {
                this._outputEmitter.fire({
                    terminalId: event.terminalId,
                    data: event.data || '',
                });
            });
        }
        return this._outputEmitter.event;
    }
    // === Internal Methods ===
    _setupTerminalEvents(terminal) {
        this._processCoordinator.setupTerminalEvents(terminal, (terminalId, exitCode) => {
            if (this._cleaningTerminals.has(terminalId) || !this._terminals.has(terminalId)) {
                return;
            }
            this._cleaningTerminals.add(terminalId);
            try {
                this._exitEmitter.fire({ terminalId, exitCode });
                this._performCleanup(terminalId);
            }
            finally {
                this._cleaningTerminals.delete(terminalId);
            }
        });
    }
    _performCleanup(terminalId) {
        if (!this._terminals.has(terminalId)) {
            return;
        }
        try {
            this._processCoordinator.cleanupInitialPromptGuard(terminalId);
            this._processCoordinator.cleanupPtyOutput(terminalId);
            this._dataBufferManager.cleanupBuffer(terminalId);
            this._cliAgentService.handleTerminalRemoved(terminalId);
            this._terminals.delete(terminalId);
            this._terminalRemovedEmitter.fire(terminalId);
            this._stateCoordinator.updateActiveTerminalAfterRemoval(terminalId);
            this._stateCoordinator.notifyStateUpdate();
        }
        catch (_error) {
            (0, logger_1.terminal)(`Error cleaning up terminal ${terminalId}: ${_error}`);
        }
    }
    dispose() {
        this._dataBufferManager.dispose();
        this._bufferManager.dispose();
        this._processCoordinator.dispose();
        this._lifecycleManager.dispose();
        this._cliAgentService.dispose();
        this._terminals.clear();
        this._dataEmitter.dispose();
        this._exitEmitter.dispose();
        this._terminalCreatedEmitter.dispose();
        this._terminalRemovedEmitter.dispose();
        this._stateUpdateEmitter.dispose();
        this._terminalFocusEmitter.dispose();
        this._outputEmitter?.dispose();
    }
}
exports.TerminalManager = TerminalManager;
//# sourceMappingURL=TerminalManager.js.map