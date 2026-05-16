"use strict";
/**
 * CliAgentCoordinator
 *
 * CLI Agent management methods extracted from LightweightTerminalWebviewManager.
 * Handles AI agent toggle, status updates, and state delegation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CliAgentCoordinator = void 0;
const logger_1 = require("../../utils/logger");
class CliAgentCoordinator {
    constructor(deps) {
        this.deps = deps;
    }
    getCliAgentState(terminalId) {
        return this.deps.getAgentState(terminalId);
    }
    setCliAgentConnected(terminalId, agentType, terminalName) {
        this.deps.setAgentConnected(terminalId, agentType, terminalName);
    }
    setCliAgentDisconnected(terminalId) {
        this.deps.setAgentDisconnected(terminalId);
    }
    detectAgentActivity(output, terminalId) {
        return this.deps.detectAgentActivity(output, terminalId);
    }
    removeTerminalState(terminalId) {
        this.deps.removeTerminalState(terminalId);
    }
    /**
     * Handle AI Agent toggle button click
     * Properly switches connected agents and moves previous connected to disconnected
     */
    handleAiAgentToggle(terminalId) {
        (0, logger_1.webview)(`⏻ AI Agent toggle clicked for terminal: ${terminalId}`);
        try {
            const agentState = this.deps.getAgentState(terminalId);
            const currentStatus = agentState?.status || 'none';
            (0, logger_1.webview)(`⏻ Current AI Agent state: ${currentStatus} for terminal: ${terminalId}`);
            if (currentStatus === 'connected') {
                (0, logger_1.webview)(`🔄 [MANUAL-RESET] Agent already connected, treating as manual reset for terminal: ${terminalId}`);
                this.deps.postMessageToExtension({
                    command: 'switchAiAgent',
                    terminalId,
                    action: 'force-reconnect',
                    forceReconnect: true,
                    agentType: agentState?.agentType || 'claude',
                    timestamp: Date.now(),
                });
            }
            else if (currentStatus === 'disconnected') {
                this.deps.postMessageToExtension({
                    command: 'switchAiAgent',
                    terminalId,
                    action: 'activate',
                    timestamp: Date.now(),
                });
                (0, logger_1.webview)(`✅ Sent AI Agent activation request for terminal: ${terminalId} (status: ${currentStatus})`);
            }
            else {
                // None state: force-reconnect to create a new agent connection
                (0, logger_1.webview)(`⏻ No agent detected, sending force-reconnect for terminal: ${terminalId}`);
                this.deps.postMessageToExtension({
                    command: 'switchAiAgent',
                    terminalId,
                    action: 'force-reconnect',
                    forceReconnect: true,
                    agentType: 'claude',
                    timestamp: Date.now(),
                });
            }
        }
        catch (error) {
            (0, logger_1.webview)(`❌ Error handling AI Agent toggle for terminal ${terminalId}:`, error);
            this.deps.postMessageToExtension({
                command: 'switchAiAgent',
                terminalId,
                action: 'activate',
                timestamp: Date.now(),
            });
        }
    }
    /**
     * Update Claude status (legacy compatibility)
     */
    updateClaudeStatus(activeTerminalName, status, agentType) {
        (0, logger_1.webview)(`🔄 [REFACTORED] UpdateClaudeStatus called: ${activeTerminalName}, ${status}, ${agentType}`);
        let targetTerminalId = this.deps.getActiveTerminalId();
        if (activeTerminalName) {
            const allInstances = this.deps.getAllTerminalInstances();
            for (const [terminalId, instance] of allInstances) {
                if (instance.name === activeTerminalName) {
                    targetTerminalId = terminalId;
                    break;
                }
            }
        }
        if (targetTerminalId) {
            this.deps.setAgentState(targetTerminalId, {
                status,
                terminalName: activeTerminalName || `Terminal ${targetTerminalId}`,
                agentType,
            });
            this.deps.updateCliAgentStatusUI(targetTerminalId, status, agentType);
            (0, logger_1.webview)(`✅ [REFACTORED] Claude status updated for terminal: ${targetTerminalId}`);
        }
        else {
            (0, logger_1.webview)(`❌ [REFACTORED] Could not find terminal for: ${activeTerminalName}`);
        }
    }
    /**
     * Update CLI Agent status by terminal ID
     */
    updateCliAgentStatus(terminalId, status, agentType) {
        (0, logger_1.webview)(`🔄 [REFACTORED] UpdateCliAgentStatus called: ${terminalId}, ${status}, ${agentType}`);
        this.deps.setAgentState(terminalId, {
            status,
            agentType,
        });
        this.deps.updateCliAgentStatusUI(terminalId, status, agentType);
        (0, logger_1.webview)(`✅ [REFACTORED] CLI Agent status updated for terminal: ${terminalId}`);
    }
    getAgentStats() {
        return this.deps.getAgentStats();
    }
    dispose() {
        this.deps.disposeStateManager();
    }
}
exports.CliAgentCoordinator = CliAgentCoordinator;
//# sourceMappingURL=CliAgentCoordinator.js.map