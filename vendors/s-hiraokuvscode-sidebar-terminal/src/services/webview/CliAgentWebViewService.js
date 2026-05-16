"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CliAgentWebViewService = void 0;
const logger_1 = require("../../utils/logger");
/**
 * Manages CLI Agent functionality in WebView context
 *
 * This service extracts all CLI Agent related logic from SecondaryTerminalProvider
 * including status synchronization and event handling.
 */
class CliAgentWebViewService {
    constructor() {
        this._statusListeners = [];
        (0, logger_1.provider)('🤖 [CliAgent] CLI Agent WebView service initialized');
    }
    /**
     * Send CLI Agent status update to WebView
     */
    sendStatusUpdate(activeTerminalName, status, agentType, context) {
        try {
            const message = {
                command: 'cliAgentStatusUpdate',
                cliAgentStatus: {
                    activeTerminalName,
                    status,
                    agentType,
                },
            };
            (0, logger_1.provider)(`🤖 [CliAgent] Sending status update: ${status} (${agentType}) for terminal: ${activeTerminalName}`);
            context.sendMessage(message).catch((error) => {
                (0, logger_1.provider)('❌ [CliAgent] Failed to send status update:', error);
            });
        }
        catch (error) {
            (0, logger_1.provider)('❌ [CliAgent] Error creating status update message:', error);
        }
    }
    /**
     * Send full CLI Agent state synchronization to WebView
     *
     * This resolves the DISCONNECTED terminals state retention problem
     * by sending complete state information for all terminals.
     */
    sendFullStateSync(context) {
        (0, logger_1.provider)('🚀 [CliAgent] Starting full state synchronization');
        try {
            const connectedAgentId = context.terminalManager.getConnectedAgentTerminalId();
            const connectedAgentType = context.terminalManager.getConnectedAgentType();
            const disconnectedAgents = context.terminalManager.getDisconnectedAgents();
            (0, logger_1.provider)('🔍 [CliAgent] Current state:', {
                connected: { id: connectedAgentId, type: connectedAgentType },
                disconnected: Array.from(disconnectedAgents.entries()),
            });
            // Build complete terminal states map
            const terminalStates = {};
            // Get all terminals
            const allTerminals = context.terminalManager.getTerminals();
            // Set status for all terminals
            for (const terminal of allTerminals) {
                const terminalId = terminal.id;
                if (connectedAgentId === terminalId && connectedAgentType) {
                    // Connected agent
                    terminalStates[terminalId] = {
                        status: 'connected',
                        agentType: connectedAgentType,
                        terminalName: terminal.name || `Terminal ${terminal.number || terminalId}`,
                    };
                }
                else if (disconnectedAgents.has(terminalId)) {
                    // Disconnected agent
                    const agentInfo = disconnectedAgents.get(terminalId);
                    if (agentInfo) {
                        terminalStates[terminalId] = {
                            status: 'disconnected',
                            agentType: agentInfo.type,
                            terminalName: terminal.name || `Terminal ${terminal.number || terminalId}`,
                        };
                    }
                }
                else {
                    // No agent or terminated agent
                    terminalStates[terminalId] = {
                        status: 'none',
                        agentType: null,
                        terminalName: terminal.name || `Terminal ${terminal.number || terminalId}`,
                    };
                }
            }
            // Send complete state to WebView
            const message = {
                command: 'cliAgentFullStateSync',
                terminalStates: terminalStates,
            };
            (0, logger_1.provider)('📤 [CliAgent] Sending full state sync:', message);
            context
                .sendMessage(message)
                .then(() => {
                (0, logger_1.provider)('✅ [CliAgent] Full state sync sent successfully');
            })
                .catch((error) => {
                (0, logger_1.provider)('❌ [CliAgent] Failed to send full state sync:', error);
            });
        }
        catch (error) {
            (0, logger_1.provider)('❌ [CliAgent] Error during full state sync:', error);
        }
    }
    /**
     * Set up CLI Agent status change listeners
     */
    setupListeners(context) {
        (0, logger_1.provider)('🎯 [CliAgent] Setting up status change listeners');
        try {
            // Clear existing listeners to prevent duplicates
            this.clearListeners();
            // CLI Agent status change listener - Full State Sync approach
            const statusDisposable = context.terminalManager.onCliAgentStatusChange((event) => {
                try {
                    (0, logger_1.provider)('📡 [CliAgent] Status change received:', event);
                    // Full State Sync: synchronize all terminal states completely
                    (0, logger_1.provider)('🔄 [CliAgent] Triggering full state synchronization');
                    this.sendFullStateSync(context);
                }
                catch (error) {
                    (0, logger_1.provider)('❌ [CliAgent] Status change processing failed:', error);
                    // Continue execution despite error
                }
            });
            this._statusListeners.push(statusDisposable);
            // Add to extension context subscriptions for cleanup
            context.extensionContext.subscriptions.push(statusDisposable);
            (0, logger_1.provider)('✅ [CliAgent] Status listeners setup complete');
            return this._statusListeners;
        }
        catch (error) {
            (0, logger_1.provider)('❌ [CliAgent] Error setting up listeners:', error);
            return [];
        }
    }
    /**
     * Clear all CLI Agent listeners
     */
    clearListeners() {
        try {
            for (const disposable of this._statusListeners) {
                disposable.dispose();
            }
            this._statusListeners = [];
            (0, logger_1.provider)('🧹 [CliAgent] All listeners cleared');
        }
        catch (error) {
            (0, logger_1.provider)('❌ [CliAgent] Error clearing listeners:', error);
        }
    }
    /**
     * Handle CLI Agent switch command from WebView
     */
    async handleSwitchAiAgent(terminalId, action, context) {
        (0, logger_1.provider)(`🔌 [CliAgent] Processing AI Agent switch: ${terminalId} (action: ${action})`);
        try {
            // Call TerminalManager's switchAiAgentConnection method
            const result = context.terminalManager.switchAiAgentConnection(terminalId);
            if (result.success) {
                (0, logger_1.provider)(`✅ [CliAgent] Switch succeeded: ${terminalId}, new status: ${result.newStatus}`);
                // Send success response to WebView
                await context.sendMessage({
                    command: 'switchAiAgentResponse',
                    terminalId,
                    success: true,
                    newStatus: result.newStatus,
                    agentType: result.agentType,
                });
            }
            else {
                (0, logger_1.provider)(`⚠️ [CliAgent] Switch failed: ${terminalId}, reason: ${result.reason}`);
                // Send failure response to WebView
                await context.sendMessage({
                    command: 'switchAiAgentResponse',
                    terminalId,
                    success: false,
                    reason: result.reason,
                    newStatus: result.newStatus,
                });
            }
        }
        catch (error) {
            (0, logger_1.provider)('❌ [CliAgent] Error switching AI Agent:', error);
            // Send error response to WebView
            await context.sendMessage({
                command: 'switchAiAgentResponse',
                terminalId,
                success: false,
                reason: 'Internal error occurred',
            });
        }
    }
    /**
     * Get debug information about current CLI Agent state
     */
    getDebugInfo(context) {
        try {
            return {
                connectedAgent: {
                    id: context.terminalManager.getConnectedAgentTerminalId(),
                    type: context.terminalManager.getConnectedAgentType(),
                },
                disconnectedAgents: Array.from(context.terminalManager.getDisconnectedAgents().entries()),
                activeListeners: this._statusListeners.length,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            (0, logger_1.provider)('❌ [CliAgent] Error getting debug info:', error);
            return {
                error: String(error),
                timestamp: new Date().toISOString(),
            };
        }
    }
    /**
     * Dispose of all resources
     */
    dispose() {
        (0, logger_1.provider)('🧹 [CliAgent] Disposing CLI Agent service');
        this.clearListeners();
    }
}
exports.CliAgentWebViewService = CliAgentWebViewService;
//# sourceMappingURL=CliAgentWebViewService.js.map