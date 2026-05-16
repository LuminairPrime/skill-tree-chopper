"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const CliAgentStateStore_1 = require("../../../../services/CliAgentStateStore");
(0, vitest_1.describe)('CliAgentStateStore', () => {
    (0, vitest_1.describe)('agent state shape', () => {
        (0, vitest_1.it)('does not expose waiting fields in stored agent state', () => {
            const store = new CliAgentStateStore_1.CliAgentStateStore();
            store.setConnectedAgent('t1', 'claude', 'Terminal 1');
            (0, vitest_1.expect)(store.getAgentState('t1')).toEqual({
                terminalId: 't1',
                status: 'connected',
                agentType: 'claude',
                terminalName: 'Terminal 1',
                preserveScrollPosition: true,
                isDisplayingChoices: false,
            });
        });
    });
    (0, vitest_1.describe)('forceReconnectAgent', () => {
        (0, vitest_1.it)('should move the previous CONNECTED agent to DISCONNECTED when forcing reconnect in another terminal', () => {
            const store = new CliAgentStateStore_1.CliAgentStateStore();
            const events = [];
            store.subscribe((e) => events.push({ terminalId: e.terminalId, status: e.status, type: e.type }));
            store.setConnectedAgent('t1', 'claude', 'Terminal 1');
            (0, vitest_1.expect)(store.getConnectedAgentTerminalId()).toBe('t1');
            store.forceReconnectAgent('t2', 'gemini', 'Terminal 2');
            (0, vitest_1.expect)(store.getConnectedAgentTerminalId()).toBe('t2');
            (0, vitest_1.expect)(store.getConnectedAgentType()).toBe('gemini');
            // Regression: previously t1 became 'none' even though the agent is still running.
            (0, vitest_1.expect)(store.getAgentState('t1')?.status).toBe('disconnected');
            (0, vitest_1.expect)(store.getAgentState('t1')?.agentType).toBe('claude');
            (0, vitest_1.expect)(store.getDisconnectedAgents().get('t1')?.type).toBe('claude');
            (0, vitest_1.expect)(store.getAgentState('t2')?.status).toBe('connected');
            (0, vitest_1.expect)(store.getAgentState('t2')?.agentType).toBe('gemini');
            // Ensure observers learn about both state changes.
            const disconnected = events.find((e) => e.terminalId === 't1' && e.status === 'disconnected');
            const connected = events.find((e) => e.terminalId === 't2' && e.status === 'connected');
            (0, vitest_1.expect)(disconnected).toBeTruthy();
            (0, vitest_1.expect)(connected).toBeTruthy();
        });
    });
});
//# sourceMappingURL=CliAgentStateStore.test.js.map