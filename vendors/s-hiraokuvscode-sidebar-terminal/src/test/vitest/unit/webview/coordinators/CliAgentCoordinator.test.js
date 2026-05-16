"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * CliAgentCoordinator Tests
 *
 * Tests for CLI Agent management methods extracted from LightweightTerminalWebviewManager.
 * Covers: getCliAgentState, setCliAgentConnected, setCliAgentDisconnected,
 *         handleAiAgentToggle, updateClaudeStatus, updateCliAgentStatus
 */
const vitest_1 = require("vitest");
const CliAgentCoordinator_1 = require("../../../../../webview/coordinators/CliAgentCoordinator");
function createMockDeps() {
    return {
        getAgentState: vitest_1.vi.fn().mockReturnValue(null),
        setAgentConnected: vitest_1.vi.fn(),
        setAgentDisconnected: vitest_1.vi.fn(),
        setAgentState: vitest_1.vi.fn(),
        removeTerminalState: vitest_1.vi.fn(),
        detectAgentActivity: vitest_1.vi.fn().mockReturnValue({
            isAgentOutput: false,
            agentType: null,
            isDisplayingChoices: false,
        }),
        getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('terminal-1'),
        getAllTerminalInstances: vitest_1.vi.fn().mockReturnValue(new Map()),
        postMessageToExtension: vitest_1.vi.fn(),
        updateCliAgentStatusUI: vitest_1.vi.fn(),
        getAgentStats: vitest_1.vi.fn().mockReturnValue({
            totalAgents: 0,
            connectedAgents: 0,
            disconnectedAgents: 0,
            currentConnectedId: null,
            agentTypes: [],
        }),
        disposeStateManager: vitest_1.vi.fn(),
    };
}
(0, vitest_1.describe)('CliAgentCoordinator', () => {
    let coordinator;
    let deps;
    (0, vitest_1.beforeEach)(() => {
        deps = createMockDeps();
        coordinator = new CliAgentCoordinator_1.CliAgentCoordinator(deps);
    });
    (0, vitest_1.describe)('getCliAgentState', () => {
        (0, vitest_1.it)('should delegate to deps.getAgentState', () => {
            const mockState = { status: 'connected', agentType: 'claude' };
            vitest_1.vi.mocked(deps.getAgentState).mockReturnValue(mockState);
            const result = coordinator.getCliAgentState('terminal-1');
            (0, vitest_1.expect)(deps.getAgentState).toHaveBeenCalledWith('terminal-1');
            (0, vitest_1.expect)(result).toBe(mockState);
        });
    });
    (0, vitest_1.describe)('setCliAgentConnected', () => {
        (0, vitest_1.it)('should delegate to deps.setAgentConnected', () => {
            coordinator.setCliAgentConnected('terminal-1', 'claude', 'My Terminal');
            (0, vitest_1.expect)(deps.setAgentConnected).toHaveBeenCalledWith('terminal-1', 'claude', 'My Terminal');
        });
    });
    (0, vitest_1.describe)('setCliAgentDisconnected', () => {
        (0, vitest_1.it)('should delegate to deps.setAgentDisconnected', () => {
            coordinator.setCliAgentDisconnected('terminal-1');
            (0, vitest_1.expect)(deps.setAgentDisconnected).toHaveBeenCalledWith('terminal-1');
        });
    });
    (0, vitest_1.describe)('handleAiAgentToggle', () => {
        (0, vitest_1.it)('should send force-reconnect when agent is already connected', () => {
            vitest_1.vi.mocked(deps.getAgentState).mockReturnValue({
                status: 'connected',
                agentType: 'claude',
            });
            coordinator.handleAiAgentToggle('terminal-1');
            (0, vitest_1.expect)(deps.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'switchAiAgent',
                terminalId: 'terminal-1',
                action: 'force-reconnect',
                forceReconnect: true,
                agentType: 'claude',
            }));
        });
        (0, vitest_1.it)('should send activate when agent is disconnected', () => {
            vitest_1.vi.mocked(deps.getAgentState).mockReturnValue({
                status: 'disconnected',
                agentType: null,
            });
            coordinator.handleAiAgentToggle('terminal-1');
            (0, vitest_1.expect)(deps.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'switchAiAgent',
                terminalId: 'terminal-1',
                action: 'activate',
            }));
        });
        (0, vitest_1.it)('should send force-reconnect when agent state is none', () => {
            vitest_1.vi.mocked(deps.getAgentState).mockReturnValue(null);
            coordinator.handleAiAgentToggle('terminal-1');
            (0, vitest_1.expect)(deps.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'switchAiAgent',
                terminalId: 'terminal-1',
                action: 'force-reconnect',
                forceReconnect: true,
            }));
        });
        (0, vitest_1.it)('should fallback to activate on error', () => {
            vitest_1.vi.mocked(deps.getAgentState).mockImplementation(() => {
                throw new Error('State error');
            });
            coordinator.handleAiAgentToggle('terminal-1');
            (0, vitest_1.expect)(deps.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'switchAiAgent',
                terminalId: 'terminal-1',
                action: 'activate',
            }));
        });
    });
    (0, vitest_1.describe)('detectAgentActivity', () => {
        (0, vitest_1.it)('should delegate to deps.detectAgentActivity', () => {
            const detection = {
                isAgentOutput: true,
                agentType: 'claude',
                isDisplayingChoices: false,
            };
            vitest_1.vi.mocked(deps.detectAgentActivity).mockReturnValue(detection);
            const result = coordinator.detectAgentActivity('Claude Code', 'terminal-1');
            (0, vitest_1.expect)(deps.detectAgentActivity).toHaveBeenCalledWith('Claude Code', 'terminal-1');
            (0, vitest_1.expect)(result).toBe(detection);
        });
    });
    (0, vitest_1.describe)('updateClaudeStatus', () => {
        (0, vitest_1.it)('should update state and UI for active terminal when name is null', () => {
            coordinator.updateClaudeStatus(null, 'connected', 'claude');
            (0, vitest_1.expect)(deps.setAgentState).toHaveBeenCalledWith('terminal-1', {
                status: 'connected',
                terminalName: 'Terminal terminal-1',
                agentType: 'claude',
            });
            (0, vitest_1.expect)(deps.updateCliAgentStatusUI).toHaveBeenCalledWith('terminal-1', 'connected', 'claude');
        });
        (0, vitest_1.it)('should find terminal by name and update', () => {
            const instances = new Map([
                ['terminal-1', { name: 'My Terminal' }],
                ['terminal-2', { name: 'Another Terminal' }],
            ]);
            vitest_1.vi.mocked(deps.getAllTerminalInstances).mockReturnValue(instances);
            coordinator.updateClaudeStatus('Another Terminal', 'connected', 'copilot');
            (0, vitest_1.expect)(deps.setAgentState).toHaveBeenCalledWith('terminal-2', {
                status: 'connected',
                terminalName: 'Another Terminal',
                agentType: 'copilot',
            });
            (0, vitest_1.expect)(deps.updateCliAgentStatusUI).toHaveBeenCalledWith('terminal-2', 'connected', 'copilot');
        });
        (0, vitest_1.it)('should not update if no active terminal and name not found', () => {
            vitest_1.vi.mocked(deps.getActiveTerminalId).mockReturnValue(null);
            vitest_1.vi.mocked(deps.getAllTerminalInstances).mockReturnValue(new Map());
            coordinator.updateClaudeStatus('Unknown Terminal', 'disconnected', null);
            (0, vitest_1.expect)(deps.setAgentState).not.toHaveBeenCalled();
            (0, vitest_1.expect)(deps.updateCliAgentStatusUI).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('updateCliAgentStatus', () => {
        (0, vitest_1.it)('should update state and UI for specified terminal', () => {
            coordinator.updateCliAgentStatus('terminal-2', 'connected', 'gemini');
            (0, vitest_1.expect)(deps.setAgentState).toHaveBeenCalledWith('terminal-2', {
                status: 'connected',
                agentType: 'gemini',
            });
            (0, vitest_1.expect)(deps.updateCliAgentStatusUI).toHaveBeenCalledWith('terminal-2', 'connected', 'gemini');
        });
    });
    (0, vitest_1.describe)('agent state helpers', () => {
        (0, vitest_1.it)('should delegate removeTerminalState', () => {
            coordinator.removeTerminalState('terminal-9');
            (0, vitest_1.expect)(deps.removeTerminalState).toHaveBeenCalledWith('terminal-9');
        });
        (0, vitest_1.it)('should delegate getAgentStats', () => {
            const stats = {
                totalAgents: 1,
                connectedAgents: 1,
                disconnectedAgents: 0,
                currentConnectedId: 'terminal-1',
                agentTypes: ['claude'],
            };
            vitest_1.vi.mocked(deps.getAgentStats).mockReturnValue(stats);
            const result = coordinator.getAgentStats();
            (0, vitest_1.expect)(deps.getAgentStats).toHaveBeenCalled();
            (0, vitest_1.expect)(result).toBe(stats);
        });
        (0, vitest_1.it)('should dispose the underlying state manager', () => {
            coordinator.dispose();
            (0, vitest_1.expect)(deps.disposeStateManager).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('agent state helpers', () => {
        (0, vitest_1.it)('should delegate removeTerminalState', () => {
            coordinator.removeTerminalState('terminal-9');
            (0, vitest_1.expect)(deps.removeTerminalState).toHaveBeenCalledWith('terminal-9');
        });
        (0, vitest_1.it)('should delegate getAgentStats', () => {
            const stats = {
                totalAgents: 1,
                connectedAgents: 1,
                disconnectedAgents: 0,
                currentConnectedId: 'terminal-1',
                agentTypes: ['claude'],
            };
            vitest_1.vi.mocked(deps.getAgentStats).mockReturnValue(stats);
            const result = coordinator.getAgentStats();
            (0, vitest_1.expect)(deps.getAgentStats).toHaveBeenCalled();
            (0, vitest_1.expect)(result).toBe(stats);
        });
        (0, vitest_1.it)('should dispose the underlying state manager', () => {
            coordinator.dispose();
            (0, vitest_1.expect)(deps.disposeStateManager).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=CliAgentCoordinator.test.js.map