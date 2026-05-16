"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CliAgentMessageController = void 0;
class CliAgentMessageController {
    constructor({ logger }) {
        this.logger = logger;
    }
    handleStatusUpdateMessage(msg, coordinator) {
        this.logger.info('CLI Agent Status Update received');
        const cliAgentStatus = msg.cliAgentStatus;
        if (!cliAgentStatus) {
            this.logger.warn('No CLI Agent status data in message');
            return;
        }
        this.logger.info(`Processing status update: ${cliAgentStatus.status} for ${cliAgentStatus.activeTerminalName} (ID: ${cliAgentStatus.terminalId})`);
        try {
            const terminalId = this.resolveTerminalId(cliAgentStatus, coordinator);
            const mappedStatus = this.mapLegacyStatus(cliAgentStatus.status);
            coordinator.updateCliAgentStatus(terminalId, mappedStatus, cliAgentStatus.agentType || null);
            this.logger.info(`CLI Agent status updated successfully: ${mappedStatus} for terminal ${terminalId}`);
        }
        catch (error) {
            this.logger.error('Error updating CLI Agent status', error);
        }
    }
    handleFullStateSyncMessage(msg, coordinator) {
        this.logger.info('CLI Agent Full State Sync received');
        const terminalStates = msg.terminalStates;
        this.logger.debug('Full state sync data', {
            terminalStates,
            connectedAgentId: msg.connectedAgentId,
            connectedAgentType: msg.connectedAgentType,
            disconnectedCount: msg.disconnectedCount,
        });
        if (!terminalStates) {
            this.logger.warn('No terminal states data in full state sync message');
            return;
        }
        try {
            for (const [terminalId, stateInfo] of Object.entries(terminalStates)) {
                this.logger.debug(`Updating terminal ${terminalId}`, stateInfo);
                try {
                    coordinator.updateCliAgentStatus(terminalId, stateInfo.status, stateInfo.agentType);
                    this.logger.debug(`Applied state: Terminal ${terminalId} -> ${stateInfo.status} (${stateInfo.agentType})`);
                }
                catch (error) {
                    this.logger.error(`Error updating terminal ${terminalId}`, error);
                }
            }
            this.logger.info('Full CLI Agent state sync completed successfully');
        }
        catch (error) {
            this.logger.error('Error during full state sync', error);
        }
    }
    handleSwitchResponseMessage(msg, coordinator) {
        const { terminalId, success, newStatus, agentType, reason, isForceReconnect } = msg;
        this.logger.info(`AI Agent operation result for terminal ${terminalId}:`, {
            success,
            newStatus,
            agentType,
            isForceReconnect,
            reason,
        });
        const managers = coordinator.getManagers();
        if (!managers?.notification) {
            this.logger.warn('NotificationManager not available for AI Agent feedback');
            return;
        }
        if (success) {
            if (isForceReconnect) {
                const statusText = newStatus === 'connected' ? 'Connected' : 'Disconnected';
                managers.notification.showNotificationInTerminal(`📎 AI Agent ${statusText}`, 'success');
            }
            this.logger.info('AI Agent operation succeeded', {
                terminalId,
                newStatus,
                agentType,
                isForceReconnect,
            });
        }
        else {
            managers.notification.showNotificationInTerminal(`❌ AI Agent operation failed`, 'error');
            this.logger.error('AI Agent operation failed', {
                terminalId,
                reason,
                isForceReconnect,
            });
        }
    }
    resolveTerminalId(cliAgentStatus, coordinator) {
        if (cliAgentStatus.terminalId) {
            this.logger.debug(`Using provided terminalId: ${cliAgentStatus.terminalId}`);
            return cliAgentStatus.terminalId;
        }
        if (cliAgentStatus.activeTerminalName) {
            const terminalId = cliAgentStatus.activeTerminalName.replace('Terminal ', '') || '1';
            this.logger.debug(`Extracted terminalId from name: ${terminalId}`);
            return terminalId;
        }
        const allTerminals = coordinator.getAllTerminalInstances();
        const connectedTerminal = Array.from(allTerminals.keys())[0];
        const fallbackId = connectedTerminal || '1';
        this.logger.warn(`Using fallback terminalId: ${fallbackId}`);
        return fallbackId;
    }
    mapLegacyStatus(legacyStatus) {
        switch (legacyStatus.toLowerCase()) {
            case 'connected':
                return 'connected';
            case 'disconnected':
                return 'disconnected';
            case 'none':
            case 'inactive':
            case 'terminated':
                return 'none';
            default:
                this.logger.warn(`Unknown legacy status: ${legacyStatus}, defaulting to 'none'`);
                return 'none';
        }
    }
}
exports.CliAgentMessageController = CliAgentMessageController;
//# sourceMappingURL=CliAgentMessageController.js.map