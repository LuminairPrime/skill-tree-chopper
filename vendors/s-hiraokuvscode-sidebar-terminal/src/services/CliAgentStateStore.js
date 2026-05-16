"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CliAgentStateStore = void 0;
const vscode = require("vscode");
const logger_1 = require("../utils/logger");
class CliAgentStateStore {
    constructor() {
        this.agentStates = new Map();
        this.connectedAgentTerminalId = null;
        this.connectedAgentType = null;
        this.disconnectedAgents = new Map();
        this.statusChangeEmitter = new vscode.EventEmitter();
        this.onStatusChange = this.statusChangeEmitter.event;
        this.observers = new Set();
        this.DISCONNECT_GRACE_PERIOD_MS = 2000;
    }
    subscribe(observer) {
        this.observers.add(observer);
        return {
            dispose: () => {
                this.observers.delete(observer);
            },
        };
    }
    notifyObservers(event) {
        this.statusChangeEmitter.fire(event);
        this.observers.forEach((observer) => {
            try {
                observer(event);
            }
            catch (error) {
                (0, logger_1.terminal)('ERROR: Observer notification failed:', error);
            }
        });
    }
    setConnectedAgent(terminalId, agentType, terminalName) {
        // Prevent unnecessary state changes
        if (this.connectedAgentTerminalId === terminalId && this.connectedAgentType === agentType) {
            return;
        }
        // Check for recent disconnect (prevent old output re-processing)
        if (this.disconnectedAgents.has(terminalId)) {
            const disconnectedInfo = this.disconnectedAgents.get(terminalId);
            const timeSinceDisconnect = Date.now() - disconnectedInfo.startTime.getTime();
            if (timeSinceDisconnect < this.DISCONNECT_GRACE_PERIOD_MS) {
                return;
            }
        }
        // Handle previous connected agent
        const previousConnectedId = this.connectedAgentTerminalId;
        const previousType = this.connectedAgentType;
        // Set new connected agent
        this.connectedAgentTerminalId = terminalId;
        this.connectedAgentType = agentType;
        // Update agent state
        this.updateAgentState(terminalId, {
            terminalId,
            status: 'connected',
            agentType,
            terminalName,
            preserveScrollPosition: true,
            isDisplayingChoices: false,
        });
        // Remove from disconnected list
        this.disconnectedAgents.delete(terminalId);
        // Emit connected event
        const event = {
            terminalId,
            status: 'connected',
            type: agentType,
            terminalName,
        };
        this.notifyObservers(event);
        // Handle previous connected agent (move to disconnected)
        if (previousConnectedId && previousConnectedId !== terminalId && previousType) {
            this.disconnectedAgents.set(previousConnectedId, {
                type: previousType,
                startTime: new Date(),
                terminalName,
            });
            this.updateAgentState(previousConnectedId, {
                terminalId: previousConnectedId,
                status: 'disconnected',
                agentType: previousType,
                preserveScrollPosition: false,
                isDisplayingChoices: false,
            });
            this.notifyObservers({
                terminalId: previousConnectedId,
                status: 'disconnected',
                type: previousType,
                terminalName,
            });
        }
    }
    setAgentTerminated(terminalId) {
        let wasConnected = false;
        let wasDisconnected = false;
        // Handle connected agent termination
        if (this.connectedAgentTerminalId === terminalId) {
            this.connectedAgentTerminalId = null;
            this.connectedAgentType = null;
            wasConnected = true;
        }
        // Handle disconnected agent termination
        if (this.disconnectedAgents.has(terminalId)) {
            this.disconnectedAgents.delete(terminalId);
            wasDisconnected = true;
        }
        // Update agent state to 'none'
        if (wasConnected || wasDisconnected) {
            this.updateAgentState(terminalId, {
                terminalId,
                status: 'none',
                agentType: null,
                preserveScrollPosition: false,
                isDisplayingChoices: false,
            });
            this.notifyObservers({
                terminalId,
                status: 'none',
                type: null,
            });
            // Promote latest disconnected agent if connected agent was terminated
            if (wasConnected) {
                this.promoteLatestDisconnectedAgent();
            }
        }
    }
    removeTerminalCompletely(terminalId) {
        let wasConnected = false;
        let wasDisconnected = false;
        if (this.connectedAgentTerminalId === terminalId) {
            this.connectedAgentTerminalId = null;
            this.connectedAgentType = null;
            wasConnected = true;
        }
        if (this.disconnectedAgents.has(terminalId)) {
            this.disconnectedAgents.delete(terminalId);
            wasDisconnected = true;
        }
        // Remove agent state
        this.agentStates.delete(terminalId);
        if (wasConnected || wasDisconnected) {
            this.notifyObservers({
                terminalId,
                status: 'none',
                type: null,
            });
            // Promote latest disconnected agent if needed
            if (wasConnected) {
                this.promoteLatestDisconnectedAgent();
            }
        }
    }
    promoteLatestDisconnectedAgent() {
        if (this.disconnectedAgents.size === 0) {
            return;
        }
        // Find most recently disconnected agent
        let latestAgent = null;
        for (const [terminalId, info] of this.disconnectedAgents.entries()) {
            if (!latestAgent || info.startTime > latestAgent.info.startTime) {
                latestAgent = { terminalId, info };
            }
        }
        if (latestAgent) {
            const { terminalId, info } = latestAgent;
            // Remove from disconnected
            this.disconnectedAgents.delete(terminalId);
            // Set as connected
            this.connectedAgentTerminalId = terminalId;
            this.connectedAgentType = info.type;
            // Update state
            this.updateAgentState(terminalId, {
                terminalId,
                status: 'connected',
                agentType: info.type,
                terminalName: info.terminalName,
                preserveScrollPosition: true,
                isDisplayingChoices: false,
            });
            this.notifyObservers({
                terminalId,
                status: 'connected',
                type: info.type,
                terminalName: info.terminalName,
            });
        }
    }
    updateAgentState(terminalId, updates) {
        const currentState = this.agentStates.get(terminalId);
        const newState = {
            terminalId,
            status: 'none',
            agentType: null,
            preserveScrollPosition: false,
            isDisplayingChoices: false,
            ...currentState,
            ...updates,
        };
        this.agentStates.set(terminalId, newState);
    }
    getAgentState(terminalId) {
        return this.agentStates.get(terminalId) || null;
    }
    getAllAgentStates() {
        return new Map(this.agentStates);
    }
    isAgentConnected(terminalId) {
        return this.connectedAgentTerminalId === terminalId;
    }
    getConnectedAgentTerminalId() {
        return this.connectedAgentTerminalId;
    }
    getConnectedAgentType() {
        return this.connectedAgentType;
    }
    getDisconnectedAgents() {
        return new Map(this.disconnectedAgents);
    }
    forceReconnectAgent(terminalId, agentType, terminalName) {
        const previousConnectedId = this.connectedAgentTerminalId;
        const previousType = this.connectedAgentType;
        const previousState = previousConnectedId ? this.agentStates.get(previousConnectedId) : null;
        // Clear existing state
        this.disconnectedAgents.delete(terminalId);
        // Set as connected (bypassing grace period check)
        this.connectedAgentTerminalId = terminalId;
        this.connectedAgentType = agentType;
        this.updateAgentState(terminalId, {
            terminalId,
            status: 'connected',
            agentType,
            terminalName,
            preserveScrollPosition: true,
            isDisplayingChoices: false,
        });
        this.notifyObservers({
            terminalId,
            status: 'connected',
            type: agentType,
            terminalName,
        });
        // If another terminal was previously CONNECTED, it is still running but no longer globally active.
        // Move it to DISCONNECTED instead of clearing to NONE.
        if (previousConnectedId && previousConnectedId !== terminalId && previousType) {
            const previousTerminalName = previousState?.terminalName;
            this.disconnectedAgents.set(previousConnectedId, {
                type: previousType,
                startTime: new Date(),
                terminalName: previousTerminalName,
            });
            this.updateAgentState(previousConnectedId, {
                terminalId: previousConnectedId,
                status: 'disconnected',
                agentType: previousType,
                terminalName: previousTerminalName,
                preserveScrollPosition: false,
                isDisplayingChoices: false,
            });
            this.notifyObservers({
                terminalId: previousConnectedId,
                status: 'disconnected',
                type: previousType,
                terminalName: previousTerminalName,
            });
        }
        return true;
    }
    clearDetectionError(terminalId) {
        let hadState = false;
        // Clear connected state
        if (this.connectedAgentTerminalId === terminalId) {
            this.connectedAgentTerminalId = null;
            this.connectedAgentType = null;
            hadState = true;
        }
        // Clear disconnected state
        if (this.disconnectedAgents.has(terminalId)) {
            this.disconnectedAgents.delete(terminalId);
            hadState = true;
        }
        // Update state to 'none'
        if (hadState) {
            this.updateAgentState(terminalId, {
                terminalId,
                status: 'none',
                agentType: null,
                preserveScrollPosition: false,
                isDisplayingChoices: false,
            });
            this.notifyObservers({
                terminalId,
                status: 'none',
                type: null,
            });
            return true;
        }
        return false;
    }
    clearAllState() {
        this.connectedAgentTerminalId = null;
        this.connectedAgentType = null;
        this.disconnectedAgents.clear();
        this.agentStates.clear();
    }
    getStateStats() {
        const states = Array.from(this.agentStates.values());
        const agentTypes = Array.from(new Set(states.map((state) => state.agentType).filter((type) => type !== null)));
        return {
            totalAgents: this.agentStates.size,
            connectedAgents: states.filter((state) => state.status === 'connected').length,
            disconnectedAgents: states.filter((state) => state.status === 'disconnected').length,
            currentConnectedId: this.connectedAgentTerminalId,
            agentTypes,
        };
    }
    dispose() {
        this.clearAllState();
        this.observers.clear();
        this.statusChangeEmitter.dispose();
    }
}
exports.CliAgentStateStore = CliAgentStateStore;
//# sourceMappingURL=CliAgentStateStore.js.map